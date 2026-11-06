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
  StudentProfile,
  StudentProfileDocument,
} from './schemas/student-profile.schema';
import { CreateStudentProfileDto } from './dto/create-student-profile.dto';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { QueryStudentProfilesDto } from './dto/query-student-profiles.dto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { UserRole } from '../users/enums/user.enums';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditAction } from '../audit-logs/enums/audit-action.enum';
import { AuditModule } from '../audit-logs/enums/audit-module.enum';
import { TenantContextService } from '../common/tenancy/tenant-context.service';

@Injectable()
export class StudentProfilesService {
  private readonly logger = new Logger(StudentProfilesService.name);

  constructor(
    @InjectModel(StudentProfile.name)
    private readonly studentProfileModel: Model<StudentProfileDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly tenantContextService: TenantContextService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  private validateObjectId(id: string, name = 'ID'): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid MongoDB ObjectId for ${name}: '${id}'`);
    }
    return new Types.ObjectId(id);
  }

  async create(
    dto: CreateStudentProfileDto,
    currentUser: AuthenticatedUser,
  ): Promise<StudentProfileDocument> {
    const userObjectId = this.validateObjectId(dto.userId, 'userId');

    // 1. Verify user exists and holds STUDENT role
    const user = await this.userModel.findById(userObjectId).exec();
    if (!user) {
      throw new NotFoundException(`User with ID '${dto.userId}' not found`);
    }

    if (user.role !== UserRole.STUDENT) {
      throw new BadRequestException(
        `User '${user.email}' has role '${user.role}'. Student profiles can only be created for users with role 'STUDENT'.`,
      );
    }

    // 2. Check if student profile already exists for this user
    const existingProfile = await this.studentProfileModel
      .findOne({ userId: userObjectId })
      .exec();
    if (existingProfile) {
      throw new ConflictException(
        `A student profile already exists for user ID '${dto.userId}'`,
      );
    }

    // 3. Institution resolution & authorization (TASK 28)
    const targetInstId = this.tenantContextService.resolveTenantId(
      currentUser,
      dto.institutionId,
    );
    if (!targetInstId) {
      throw new BadRequestException('institutionId is required for profile creation');
    }

    // Verify referenced user account belongs to the same institution (Requirement 9)
    this.tenantContextService.validateSameInstitution(
      [{ name: 'User account', institutionId: user.institutionId }],
      targetInstId,
    );

    // 4. Check admissionNumber uniqueness within institution (Requirement 4)
    const normalizedAdmission = dto.admissionNumber.trim().toUpperCase();
    const duplicateAdmission = await this.studentProfileModel
      .findOne({ institutionId: targetInstId, admissionNumber: normalizedAdmission })
      .exec();
    if (duplicateAdmission) {
      throw new ConflictException(
        `Admission number '${normalizedAdmission}' is already registered in this institution.`,
      );
    }

    const newProfile = new this.studentProfileModel({
      userId: userObjectId,
      institutionId: targetInstId,
      admissionNumber: normalizedAdmission,
      dateOfBirth: new Date(dto.dateOfBirth),
      gender: dto.gender,
      bloodGroup: dto.bloodGroup || null,
      address: dto.address,
      parentDetails: dto.parentDetails || [],
      status: dto.status || 'ACTIVE',
    });

    const saved = await newProfile.save();

    // Audit log
    await this.auditLogsService.logAction({
      userId: currentUser.userId,
      institutionId: targetInstId.toString(),
      action: AuditAction.STUDENT_ADMITTED,
      module: AuditModule.STUDENTS,
      description: `Student '${user.name}' admitted with admission number '${normalizedAdmission}'`,
      targetId: saved._id.toString(),
      targetType: 'STUDENT_PROFILE',
      metadata: {
        admissionNumber: normalizedAdmission,
        userId: user._id.toString(),
      },
    });

    this.logger.log(`Student profile created: ${normalizedAdmission} (User: ${user.email})`);
    return saved;
  }

  async findAll(
    query: QueryStudentProfilesDto,
    currentUser: AuthenticatedUser,
  ): Promise<{ items: StudentProfileDocument[]; total: number; page: number; limit: number; totalPages: number }> {
    const filterQuery: Record<string, any> = {};

    // Multi-tenant isolation (TASK 28)
    if (currentUser.role === UserRole.STUDENT) {
      filterQuery.userId = this.validateObjectId(currentUser.userId, 'userId');
    } else {
      const tenantFilter = this.tenantContextService.buildTenantFilter(
        currentUser,
        query.institutionId,
      );
      Object.assign(filterQuery, tenantFilter);
    }

    if (query.status) filterQuery.status = query.status;
    if (query.gender) filterQuery.gender = query.gender;

    if (query.search && query.search.trim().length > 0) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filterQuery.$or = [
        { admissionNumber: searchRegex },
        { 'address.city': searchRegex },
      ];
    }

    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.studentProfileModel
        .find(filterQuery)
        .populate('userId', 'name email profileImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.studentProfileModel.countDocuments(filterQuery).exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findById(id: string, currentUser: AuthenticatedUser): Promise<StudentProfileDocument> {
    const objectId = this.validateObjectId(id, 'studentProfileId');
    const profile = await this.studentProfileModel
      .findById(objectId)
      .populate('userId', 'name email profileImage')
      .exec();

    if (!profile) {
      throw new NotFoundException(`Student profile with ID '${id}' not found`);
    }

    this.checkTenantAccess(profile, currentUser);
    return profile;
  }

  async findByUserId(userId: string, currentUser: AuthenticatedUser): Promise<StudentProfileDocument> {
    const objectId = this.validateObjectId(userId, 'userId');
    const profile = await this.studentProfileModel
      .findOne({ userId: objectId })
      .populate('userId', 'name email profileImage')
      .exec();

    if (!profile) {
      throw new NotFoundException(`Student profile for user ID '${userId}' not found`);
    }

    this.checkTenantAccess(profile, currentUser);
    return profile;
  }

  async update(
    id: string,
    dto: UpdateStudentProfileDto,
    currentUser: AuthenticatedUser,
  ): Promise<StudentProfileDocument> {
    const objectId = this.validateObjectId(id, 'studentProfileId');
    const profile = await this.studentProfileModel.findById(objectId).exec();

    if (!profile) {
      throw new NotFoundException(`Student profile with ID '${id}' not found`);
    }

    this.checkTenantAccess(profile, currentUser);

    if (dto.admissionNumber && dto.admissionNumber.trim().toUpperCase() !== profile.admissionNumber) {
      const normalizedAdmission = dto.admissionNumber.trim().toUpperCase();
      const duplicate = await this.studentProfileModel
        .findOne({ institutionId: profile.institutionId, admissionNumber: normalizedAdmission })
        .exec();
      if (duplicate && duplicate._id.toString() !== id) {
        throw new ConflictException(
          `Admission number '${normalizedAdmission}' already in use in this institution`,
        );
      }
      profile.admissionNumber = normalizedAdmission;
    }

    if (dto.dateOfBirth) profile.dateOfBirth = new Date(dto.dateOfBirth);
    if (dto.gender) profile.gender = dto.gender;
    if (dto.bloodGroup !== undefined) profile.bloodGroup = dto.bloodGroup;
    if (dto.address) profile.address = dto.address;
    if (dto.parentDetails) profile.parentDetails = dto.parentDetails as any;
    if (dto.status) profile.status = dto.status;

    const updated = await profile.save();

    await this.auditLogsService.logAction({
      userId: currentUser.userId,
      institutionId: profile.institutionId.toString(),
      action: AuditAction.USER_UPDATED,
      module: AuditModule.STUDENTS,
      description: `Updated student profile: ${profile.admissionNumber}`,
      targetId: profile._id.toString(),
      targetType: 'STUDENT_PROFILE',
    });

    return updated;
  }

  private checkTenantAccess(profile: StudentProfileDocument, currentUser: AuthenticatedUser): void {
    if (currentUser.role === UserRole.SUPER_ADMIN) return;

    if (currentUser.role === UserRole.STUDENT) {
      this.tenantContextService.enforceStudentSelfAccess(currentUser, profile.userId);
      return;
    }

    this.tenantContextService.enforceTenantAccess(profile, currentUser, 'Student profile');
  }
}

