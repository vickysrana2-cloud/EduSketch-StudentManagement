import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  TeacherProfile,
  TeacherProfileDocument,
} from './schemas/teacher-profile.schema';
import { CreateTeacherProfileDto } from './dto/create-teacher-profile.dto';
import { UpdateTeacherProfileDto } from './dto/update-teacher-profile.dto';
import { AssignResourcesDto } from './dto/assign-resources.dto';
import { QueryTeacherProfilesDto } from './dto/query-teacher-profiles.dto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { UserRole } from '../users/enums/user.enums';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditAction } from '../audit-logs/enums/audit-action.enum';
import { AuditModule } from '../audit-logs/enums/audit-module.enum';

@Injectable()
export class TeacherProfilesService {
  private readonly logger = new Logger(TeacherProfilesService.name);

  constructor(
    @InjectModel(TeacherProfile.name)
    private readonly teacherProfileModel: Model<TeacherProfileDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  private validateObjectId(id: string, name = 'ID'): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid MongoDB ObjectId format for ${name}: '${id}'`);
    }
    return new Types.ObjectId(id);
  }

  async create(
    dto: CreateTeacherProfileDto,
    currentUser: AuthenticatedUser,
  ): Promise<TeacherProfileDocument> {
    const userObjectId = this.validateObjectId(dto.userId, 'userId');

    // 1. Verify user exists and holds TEACHER role
    const user = await this.userModel.findById(userObjectId).exec();
    if (!user) {
      throw new NotFoundException(`User with ID '${dto.userId}' not found`);
    }

    if (user.role !== UserRole.TEACHER) {
      throw new BadRequestException(
        `User '${user.email}' has role '${user.role}'. Teacher profiles can only be created for users with role 'TEACHER'.`,
      );
    }

    // 2. Check if teacher profile already exists for this user (Requirement 3)
    const existingProfile = await this.teacherProfileModel
      .findOne({ userId: userObjectId })
      .exec();
    if (existingProfile) {
      throw new ConflictException(
        `A teacher profile already exists for user ID '${dto.userId}'`,
      );
    }

    // 3. Institution resolution & authorization
    let targetInstId: Types.ObjectId;
    if (currentUser.role === UserRole.ADMIN) {
      if (!currentUser.institutionId) {
        throw new ForbiddenException('Admin is not assigned to an institution');
      }
      targetInstId = this.validateObjectId(currentUser.institutionId, 'institutionId');
    } else if (currentUser.role === UserRole.SUPER_ADMIN) {
      if (!dto.institutionId) {
        throw new BadRequestException('institutionId is required for Super Admin profile creation');
      }
      targetInstId = this.validateObjectId(dto.institutionId, 'institutionId');
    } else {
      throw new ForbiddenException('Only administrators can create teacher profiles');
    }

    // Verify user account belongs to the same institution
    if (!user.institutionId || user.institutionId.toString() !== targetInstId.toString()) {
      throw new BadRequestException(
        'User account belongs to a different institution than the specified profile target',
      );
    }

    // 4. Check employeeId uniqueness within institution (Requirement 4)
    const normalizedEmpId = dto.employeeId.trim().toUpperCase();
    const duplicateEmpId = await this.teacherProfileModel
      .findOne({ institutionId: targetInstId, employeeId: normalizedEmpId })
      .exec();
    if (duplicateEmpId) {
      throw new ConflictException(
        `Employee ID '${normalizedEmpId}' is already registered in this institution.`,
      );
    }

    const assignedClassIds = (dto.assignedClassIds || []).map((id) =>
      this.validateObjectId(id, 'assignedClassId'),
    );
    const assignedSubjectIds = (dto.assignedSubjectIds || []).map((id) =>
      this.validateObjectId(id, 'assignedSubjectId'),
    );

    const newProfile = new this.teacherProfileModel({
      userId: userObjectId,
      institutionId: targetInstId,
      employeeId: normalizedEmpId,
      qualification: dto.qualification || [],
      specialization: dto.specialization || [],
      experienceYears: dto.experienceYears,
      joiningDate: new Date(dto.joiningDate),
      assignedClassIds,
      assignedSubjectIds,
      status: dto.status || 'ACTIVE',
    });

    const saved = await newProfile.save();

    await this.auditLogsService.logAction({
      userId: currentUser.userId,
      institutionId: targetInstId.toString(),
      action: AuditAction.TEACHER_CREATED,
      module: AuditModule.TEACHERS,
      description: `Teacher '${user.name}' profile created with Employee ID '${normalizedEmpId}'`,
      targetId: saved._id.toString(),
      targetType: 'TEACHER_PROFILE',
      metadata: {
        employeeId: normalizedEmpId,
        userId: user._id.toString(),
      },
    });

    this.logger.log(`Teacher profile created: ${normalizedEmpId} (User: ${user.email})`);
    return saved;
  }

  async findAll(
    query: QueryTeacherProfilesDto,
    currentUser: AuthenticatedUser,
  ): Promise<{ items: TeacherProfileDocument[]; total: number; page: number; limit: number; totalPages: number }> {
    const filterQuery: Record<string, any> = {};

    // Multi-tenant isolation (Requirement 10)
    if (currentUser.role === UserRole.TEACHER) {
      filterQuery.institutionId = this.validateObjectId(currentUser.institutionId!, 'institutionId');
    } else if (currentUser.role === UserRole.ADMIN) {
      filterQuery.institutionId = this.validateObjectId(currentUser.institutionId!, 'institutionId');
    } else if (currentUser.role === UserRole.SUPER_ADMIN) {
      if (query.institutionId) {
        filterQuery.institutionId = this.validateObjectId(query.institutionId, 'institutionId');
      }
    } else {
      // Students cannot list teacher profiles in bulk without scope
      if (currentUser.institutionId) {
        filterQuery.institutionId = this.validateObjectId(currentUser.institutionId, 'institutionId');
      }
    }

    if (query.status) filterQuery.status = query.status;
    if (query.specialization) {
      filterQuery.specialization = { $in: [query.specialization.trim()] };
    }

    if (query.search && query.search.trim().length > 0) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filterQuery.$or = [
        { employeeId: searchRegex },
        { specialization: searchRegex },
      ];
    }

    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.teacherProfileModel
        .find(filterQuery)
        .populate('userId', 'name email profileImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.teacherProfileModel.countDocuments(filterQuery).exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findById(id: string, currentUser: AuthenticatedUser): Promise<TeacherProfileDocument> {
    const objectId = this.validateObjectId(id, 'teacherProfileId');
    const profile = await this.teacherProfileModel
      .findById(objectId)
      .populate('userId', 'name email profileImage')
      .exec();

    if (!profile) {
      throw new NotFoundException(`Teacher profile with ID '${id}' not found`);
    }

    this.checkTenantAccess(profile, currentUser);
    return profile;
  }

  async findByUserId(userId: string, currentUser: AuthenticatedUser): Promise<TeacherProfileDocument> {
    const objectId = this.validateObjectId(userId, 'userId');
    const profile = await this.teacherProfileModel
      .findOne({ userId: objectId })
      .populate('userId', 'name email profileImage')
      .exec();

    if (!profile) {
      throw new NotFoundException(`Teacher profile for user ID '${userId}' not found`);
    }

    this.checkTenantAccess(profile, currentUser);
    return profile;
  }

  async update(
    id: string,
    dto: UpdateTeacherProfileDto,
    currentUser: AuthenticatedUser,
  ): Promise<TeacherProfileDocument> {
    const objectId = this.validateObjectId(id, 'teacherProfileId');
    const profile = await this.teacherProfileModel.findById(objectId).exec();

    if (!profile) {
      throw new NotFoundException(`Teacher profile with ID '${id}' not found`);
    }

    this.checkTenantAccess(profile, currentUser);

    if (dto.employeeId && dto.employeeId.trim().toUpperCase() !== profile.employeeId) {
      const normalizedEmp = dto.employeeId.trim().toUpperCase();
      const duplicate = await this.teacherProfileModel
        .findOne({ institutionId: profile.institutionId, employeeId: normalizedEmp })
        .exec();
      if (duplicate && duplicate._id.toString() !== id) {
        throw new ConflictException(
          `Employee ID '${normalizedEmp}' already in use in this institution`,
        );
      }
      profile.employeeId = normalizedEmp;
    }

    if (dto.qualification) profile.qualification = dto.qualification;
    if (dto.specialization) profile.specialization = dto.specialization;
    if (dto.experienceYears !== undefined) profile.experienceYears = dto.experienceYears;
    if (dto.joiningDate) profile.joiningDate = new Date(dto.joiningDate);
    if (dto.status) profile.status = dto.status;

    const updated = await profile.save();

    await this.auditLogsService.logAction({
      userId: currentUser.userId,
      institutionId: profile.institutionId.toString(),
      action: AuditAction.USER_UPDATED,
      module: AuditModule.TEACHERS,
      description: `Updated teacher profile: ${profile.employeeId}`,
      targetId: profile._id.toString(),
      targetType: 'TEACHER_PROFILE',
    });

    return updated;
  }

  async assignResources(
    id: string,
    dto: AssignResourcesDto,
    currentUser: AuthenticatedUser,
  ): Promise<TeacherProfileDocument> {
    const objectId = this.validateObjectId(id, 'teacherProfileId');
    const profile = await this.teacherProfileModel.findById(objectId).exec();

    if (!profile) {
      throw new NotFoundException(`Teacher profile with ID '${id}' not found`);
    }

    this.checkTenantAccess(profile, currentUser);

    if (dto.assignedClassIds) {
      profile.assignedClassIds = dto.assignedClassIds.map((cId) =>
        this.validateObjectId(cId, 'classId'),
      );
    }

    if (dto.assignedSubjectIds) {
      profile.assignedSubjectIds = dto.assignedSubjectIds.map((sId) =>
        this.validateObjectId(sId, 'subjectId'),
      );
    }

    return await profile.save();
  }

  private checkTenantAccess(profile: TeacherProfileDocument, currentUser: AuthenticatedUser): void {
    if (currentUser.role === UserRole.SUPER_ADMIN) return;

    if (currentUser.role === UserRole.TEACHER && profile.userId.toString() === currentUser.userId) {
      return;
    }

    if (profile.institutionId.toString() !== currentUser.institutionId) {
      throw new ForbiddenException('Access denied: Teacher profile belongs to another institution');
    }
  }
}

