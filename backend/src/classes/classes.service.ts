import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { Class, ClassDocument, ClassStatus } from './schemas/class.schema';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { QueryClassesDto } from './dto/query-classes.dto';
import {
  TeacherProfile,
  TeacherProfileDocument,
} from '../teacher-profiles/schemas/teacher-profile.schema';
import { UserRole } from '../users/enums/user.enums';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditAction } from '../audit-logs/enums/audit-action.enum';
import { AuditModule } from '../audit-logs/enums/audit-module.enum';

@Injectable()
export class ClassesService {
  private readonly logger = new Logger(ClassesService.name);

  constructor(
    @InjectModel(Class.name)
    private readonly classModel: Model<ClassDocument>,
    @InjectModel(TeacherProfile.name)
    private readonly teacherProfileModel: Model<TeacherProfileDocument>,
    @InjectConnection()
    private readonly connection: Connection,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  private validateObjectId(id: string, name = 'ID'): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid MongoDB ObjectId format for ${name}: '${id}'`);
    }
    return new Types.ObjectId(id);
  }

  async create(dto: CreateClassDto, currentUser: AuthenticatedUser): Promise<ClassDocument> {
    let targetInstId: Types.ObjectId;

    if (currentUser.role === UserRole.ADMIN) {
      if (!currentUser.institutionId) {
        throw new ForbiddenException('Admin is not assigned to an institution');
      }
      targetInstId = this.validateObjectId(currentUser.institutionId, 'institutionId');
    } else if (currentUser.role === UserRole.SUPER_ADMIN) {
      if (!dto.institutionId) {
        throw new BadRequestException('institutionId is required for Super Admin class creation');
      }
      targetInstId = this.validateObjectId(dto.institutionId, 'institutionId');
    } else {
      throw new ForbiddenException('Only administrators can create classes');
    }

    // 1. Verify class teacher if provided (Requirement 4)
    let teacherObjectId: Types.ObjectId | null = null;
    if (dto.classTeacherId) {
      teacherObjectId = this.validateObjectId(dto.classTeacherId, 'classTeacherId');
      const teacher = await this.teacherProfileModel.findById(teacherObjectId).exec();
      if (!teacher) {
        throw new NotFoundException(`Teacher profile with ID '${dto.classTeacherId}' not found`);
      }
      if (teacher.institutionId.toString() !== targetInstId.toString()) {
        throw new BadRequestException(
          'Assigned class teacher belongs to a different institution than the class',
        );
      }
    }

    // 2. Check compound uniqueness: institutionId + academicYear + grade + section (Requirement 5)
    const normalizedSection = dto.section.trim().toUpperCase();
    const duplicate = await this.classModel
      .findOne({
        institutionId: targetInstId,
        academicYear: dto.academicYear.trim(),
        grade: dto.grade,
        section: normalizedSection,
      })
      .exec();

    if (duplicate) {
      throw new ConflictException(
        `Class with grade ${dto.grade}, section '${normalizedSection}', and academic year '${dto.academicYear}' already exists in this institution.`,
      );
    }

    const newClass = new this.classModel({
      institutionId: targetInstId,
      name: dto.name.trim(),
      grade: dto.grade,
      section: normalizedSection,
      academicYear: dto.academicYear.trim(),
      classTeacherId: teacherObjectId,
      capacity: dto.capacity || 40,
      roomNumber: dto.roomNumber ? dto.roomNumber.trim() : null,
      status: dto.status || ClassStatus.ACTIVE,
    });

    const saved = await newClass.save();

    await this.auditLogsService.logAction({
      userId: currentUser.userId,
      institutionId: targetInstId.toString(),
      action: AuditAction.ENROLLMENT_CHANGED,
      module: AuditModule.CLASSES,
      description: `Created class '${saved.name}' (${saved.grade}-${saved.section}) for ${saved.academicYear}`,
      targetId: saved._id.toString(),
      targetType: 'CLASS',
    });

    this.logger.log(`Class created: ${saved.name} (Grade ${saved.grade}-${saved.section})`);
    return saved;
  }

  async findAll(
    query: QueryClassesDto,
    currentUser: AuthenticatedUser,
  ): Promise<{ items: ClassDocument[]; total: number; page: number; limit: number; totalPages: number }> {
    const filterQuery: Record<string, any> = {};

    // Multi-tenant isolation (Requirement 8)
    if (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.TEACHER || currentUser.role === UserRole.STUDENT) {
      if (!currentUser.institutionId) {
        throw new ForbiddenException('User is not assigned to an institution');
      }
      filterQuery.institutionId = this.validateObjectId(currentUser.institutionId, 'institutionId');
    } else if (currentUser.role === UserRole.SUPER_ADMIN) {
      if (query.institutionId) {
        filterQuery.institutionId = this.validateObjectId(query.institutionId, 'institutionId');
      }
    }

    if (query.grade !== undefined) filterQuery.grade = query.grade;
    if (query.section) filterQuery.section = query.section.trim().toUpperCase();
    if (query.academicYear) filterQuery.academicYear = query.academicYear.trim();
    if (query.status) filterQuery.status = query.status;

    if (query.search && query.search.trim().length > 0) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filterQuery.$or = [
        { name: searchRegex },
        { roomNumber: searchRegex },
      ];
    }

    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.classModel
        .find(filterQuery)
        .populate('classTeacherId')
        .sort({ grade: 1, section: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.classModel.countDocuments(filterQuery).exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findById(id: string, currentUser: AuthenticatedUser): Promise<ClassDocument> {
    const objectId = this.validateObjectId(id, 'classId');
    const classDoc = await this.classModel
      .findById(objectId)
      .populate('classTeacherId')
      .exec();

    if (!classDoc) {
      throw new NotFoundException(`Class with ID '${id}' not found`);
    }

    this.checkTenantAccess(classDoc, currentUser);
    return classDoc;
  }

  async update(
    id: string,
    dto: UpdateClassDto,
    currentUser: AuthenticatedUser,
  ): Promise<ClassDocument> {
    const objectId = this.validateObjectId(id, 'classId');
    const classDoc = await this.classModel.findById(objectId).exec();

    if (!classDoc) {
      throw new NotFoundException(`Class with ID '${id}' not found`);
    }

    this.checkTenantAccess(classDoc, currentUser);

    // If teacher updated, verify same institution
    if (dto.classTeacherId !== undefined) {
      if (dto.classTeacherId === null) {
        classDoc.classTeacherId = null;
      } else {
        const teacherObjectId = this.validateObjectId(dto.classTeacherId, 'classTeacherId');
        const teacher = await this.teacherProfileModel.findById(teacherObjectId).exec();
        if (!teacher) {
          throw new NotFoundException(`Teacher profile with ID '${dto.classTeacherId}' not found`);
        }
        if (teacher.institutionId.toString() !== classDoc.institutionId.toString()) {
          throw new BadRequestException('Class teacher must belong to the same institution');
        }
        classDoc.classTeacherId = teacherObjectId;
      }
    }

    // Check compound uniqueness if grade, section, or academicYear are changing
    const nextGrade = dto.grade !== undefined ? dto.grade : classDoc.grade;
    const nextSection = dto.section !== undefined ? dto.section.trim().toUpperCase() : classDoc.section;
    const nextAcademicYear = dto.academicYear !== undefined ? dto.academicYear.trim() : classDoc.academicYear;

    if (
      nextGrade !== classDoc.grade ||
      nextSection !== classDoc.section ||
      nextAcademicYear !== classDoc.academicYear
    ) {
      const duplicate = await this.classModel
        .findOne({
          institutionId: classDoc.institutionId,
          academicYear: nextAcademicYear,
          grade: nextGrade,
          section: nextSection,
        })
        .exec();

      if (duplicate && duplicate._id.toString() !== id) {
        throw new ConflictException(
          `Class with grade ${nextGrade}, section '${nextSection}', and academic year '${nextAcademicYear}' already exists in this institution.`,
        );
      }
    }

    if (dto.name) classDoc.name = dto.name.trim();
    if (dto.grade !== undefined) classDoc.grade = dto.grade;
    if (dto.section) classDoc.section = dto.section.trim().toUpperCase();
    if (dto.academicYear) classDoc.academicYear = dto.academicYear.trim();
    if (dto.capacity !== undefined) classDoc.capacity = dto.capacity;
    if (dto.roomNumber !== undefined) classDoc.roomNumber = dto.roomNumber;
    if (dto.status) classDoc.status = dto.status;

    return await classDoc.save();
  }

  async updateStatus(
    id: string,
    status: ClassStatus,
    currentUser: AuthenticatedUser,
  ): Promise<ClassDocument> {
    const objectId = this.validateObjectId(id, 'classId');
    const classDoc = await this.classModel.findById(objectId).exec();

    if (!classDoc) {
      throw new NotFoundException(`Class with ID '${id}' not found`);
    }

    this.checkTenantAccess(classDoc, currentUser);
    classDoc.status = status;
    return await classDoc.save();
  }

  async delete(id: string, currentUser: AuthenticatedUser): Promise<{ message: string }> {
    const objectId = this.validateObjectId(id, 'classId');
    const classDoc = await this.classModel.findById(objectId).exec();

    if (!classDoc) {
      throw new NotFoundException(`Class with ID '${id}' not found`);
    }

    this.checkTenantAccess(classDoc, currentUser);

    // Requirement 9: Prevent deletion when active enrollments exist
    const activeEnrollments = await this.connection
      .collection('enrollments')
      .countDocuments({
        classId: objectId,
        status: 'ACTIVE',
      });

    if (activeEnrollments > 0) {
      throw new BadRequestException(
        `Cannot delete class '${classDoc.name}': There are ${activeEnrollments} active enrollment(s) associated with this class.`,
      );
    }

    await this.classModel.findByIdAndDelete(objectId).exec();

    await this.auditLogsService.logAction({
      userId: currentUser.userId,
      institutionId: classDoc.institutionId.toString(),
      action: AuditAction.ENROLLMENT_CHANGED,
      module: AuditModule.CLASSES,
      description: `Deleted class '${classDoc.name}' (${classDoc.grade}-${classDoc.section})`,
      targetId: id,
      targetType: 'CLASS',
    });

    return { message: `Class '${classDoc.name}' successfully deleted` };
  }

  private checkTenantAccess(classDoc: ClassDocument, currentUser: AuthenticatedUser): void {
    if (currentUser.role === UserRole.SUPER_ADMIN) return;

    if (classDoc.institutionId.toString() !== currentUser.institutionId) {
      throw new ForbiddenException('Access denied: Class belongs to another institution');
    }
  }
}
