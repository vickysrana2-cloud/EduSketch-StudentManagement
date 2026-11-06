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
import { Subject, SubjectDocument } from './schemas/subject.schema';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { AssignTeachersDto } from './dto/assign-teachers.dto';
import { QuerySubjectsDto } from './dto/query-subjects.dto';
import { Class, ClassDocument } from '../classes/schemas/class.schema';
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
export class SubjectsService {
  private readonly logger = new Logger(SubjectsService.name);

  constructor(
    @InjectModel(Subject.name)
    private readonly subjectModel: Model<SubjectDocument>,
    @InjectModel(Class.name)
    private readonly classModel: Model<ClassDocument>,
    @InjectModel(TeacherProfile.name)
    private readonly teacherProfileModel: Model<TeacherProfileDocument>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  private validateObjectId(id: string, name = 'ID'): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid MongoDB ObjectId format for ${name}: '${id}'`);
    }
    return new Types.ObjectId(id);
  }

  async create(dto: CreateSubjectDto, currentUser: AuthenticatedUser): Promise<SubjectDocument> {
    let targetInstId: Types.ObjectId;

    if (currentUser.role === UserRole.ADMIN) {
      if (!currentUser.institutionId) {
        throw new ForbiddenException('Admin is not assigned to an institution');
      }
      targetInstId = this.validateObjectId(currentUser.institutionId, 'institutionId');
    } else if (currentUser.role === UserRole.SUPER_ADMIN) {
      if (!dto.institutionId) {
        throw new BadRequestException('institutionId is required for Super Admin subject creation');
      }
      targetInstId = this.validateObjectId(dto.institutionId, 'institutionId');
    } else {
      throw new ForbiddenException('Only administrators can create subjects');
    }

    // 1. Validate that the class exists and belongs to the same institution (Requirement 4 & 5)
    const classObjectId = this.validateObjectId(dto.classId, 'classId');
    const classDoc = await this.classModel.findById(classObjectId).exec();
    if (!classDoc) {
      throw new NotFoundException(`Class with ID '${dto.classId}' not found`);
    }
    if (classDoc.institutionId.toString() !== targetInstId.toString()) {
      throw new BadRequestException('The referenced class belongs to a different institution');
    }

    // 2. Validate assigned teachers if provided (Requirement 4 & 5)
    const teacherObjectIds: Types.ObjectId[] = [];
    if (dto.teacherIds && dto.teacherIds.length > 0) {
      for (const tId of dto.teacherIds) {
        const tObjectId = this.validateObjectId(tId, 'teacherId');
        const teacher = await this.teacherProfileModel.findById(tObjectId).exec();
        if (!teacher) {
          throw new NotFoundException(`Teacher profile with ID '${tId}' not found`);
        }
        if (teacher.institutionId.toString() !== targetInstId.toString()) {
          throw new BadRequestException(
            `Teacher with ID '${tId}' belongs to a different institution`,
          );
        }
        teacherObjectIds.push(tObjectId);
      }
    }

    // 3. Check compound uniqueness: institutionId + code + academicYear + classId (Requirement 3)
    const normalizedCode = dto.code.trim().toUpperCase();
    const duplicate = await this.subjectModel
      .findOne({
        institutionId: targetInstId,
        code: normalizedCode,
        academicYear: dto.academicYear.trim(),
        classId: classObjectId,
      })
      .exec();

    if (duplicate) {
      throw new ConflictException(
        `Subject with code '${normalizedCode}' already exists for this class in academic year '${dto.academicYear}'.`,
      );
    }

    const newSubject = new this.subjectModel({
      institutionId: targetInstId,
      name: dto.name.trim(),
      code: normalizedCode,
      description: dto.description ? dto.description.trim() : null,
      classId: classObjectId,
      teacherIds: teacherObjectIds,
      academicYear: dto.academicYear.trim(),
      status: dto.status || 'ACTIVE',
    });

    const saved = await newSubject.save();

    await this.auditLogsService.logAction({
      userId: currentUser.userId,
      institutionId: targetInstId.toString(),
      action: AuditAction.ENROLLMENT_CHANGED,
      module: AuditModule.CLASSES,
      description: `Created subject '${saved.name}' (${saved.code}) for class ${classDoc.name}`,
      targetId: saved._id.toString(),
      targetType: 'SUBJECT',
    });

    this.logger.log(`Subject created: ${saved.name} (${saved.code})`);
    return saved;
  }

  async findAll(
    query: QuerySubjectsDto,
    currentUser: AuthenticatedUser,
  ): Promise<{ items: SubjectDocument[]; total: number; page: number; limit: number; totalPages: number }> {
    const filterQuery: Record<string, any> = {};

    // Multi-tenant isolation (Requirement 7)
    if (
      currentUser.role === UserRole.ADMIN ||
      currentUser.role === UserRole.TEACHER ||
      currentUser.role === UserRole.STUDENT
    ) {
      if (!currentUser.institutionId) {
        throw new ForbiddenException('User is not assigned to an institution');
      }
      filterQuery.institutionId = this.validateObjectId(currentUser.institutionId, 'institutionId');
    } else if (currentUser.role === UserRole.SUPER_ADMIN) {
      if (query.institutionId) {
        filterQuery.institutionId = this.validateObjectId(query.institutionId, 'institutionId');
      }
    }

    if (query.classId) {
      filterQuery.classId = this.validateObjectId(query.classId, 'classId');
    }
    if (query.teacherId) {
      filterQuery.teacherIds = this.validateObjectId(query.teacherId, 'teacherId');
    }
    if (query.academicYear) {
      filterQuery.academicYear = query.academicYear.trim();
    }
    if (query.status) {
      filterQuery.status = query.status;
    }

    if (query.search && query.search.trim().length > 0) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filterQuery.$or = [{ name: searchRegex }, { code: searchRegex }];
    }

    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.subjectModel
        .find(filterQuery)
        .populate('classId')
        .populate('teacherIds')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.subjectModel.countDocuments(filterQuery).exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findById(id: string, currentUser: AuthenticatedUser): Promise<SubjectDocument> {
    const objectId = this.validateObjectId(id, 'subjectId');
    const subject = await this.subjectModel
      .findById(objectId)
      .populate('classId')
      .populate('teacherIds')
      .exec();

    if (!subject) {
      throw new NotFoundException(`Subject with ID '${id}' not found`);
    }

    this.checkTenantAccess(subject, currentUser);
    return subject;
  }

  async update(
    id: string,
    dto: UpdateSubjectDto,
    currentUser: AuthenticatedUser,
  ): Promise<SubjectDocument> {
    const objectId = this.validateObjectId(id, 'subjectId');
    const subject = await this.subjectModel.findById(objectId).exec();

    if (!subject) {
      throw new NotFoundException(`Subject with ID '${id}' not found`);
    }

    this.checkTenantAccess(subject, currentUser);

    // Validate class if changing
    if (dto.classId) {
      const classObjectId = this.validateObjectId(dto.classId, 'classId');
      const classDoc = await this.classModel.findById(classObjectId).exec();
      if (!classDoc) {
        throw new NotFoundException(`Class with ID '${dto.classId}' not found`);
      }
      if (classDoc.institutionId.toString() !== subject.institutionId.toString()) {
        throw new BadRequestException('Class belongs to another institution');
      }
      subject.classId = classObjectId;
    }

    // Validate teachers if changing
    if (dto.teacherIds !== undefined) {
      const teacherObjectIds: Types.ObjectId[] = [];
      for (const tId of dto.teacherIds) {
        const tObjectId = this.validateObjectId(tId, 'teacherId');
        const teacher = await this.teacherProfileModel.findById(tObjectId).exec();
        if (!teacher) {
          throw new NotFoundException(`Teacher profile with ID '${tId}' not found`);
        }
        if (teacher.institutionId.toString() !== subject.institutionId.toString()) {
          throw new BadRequestException(`Teacher with ID '${tId}' belongs to another institution`);
        }
        teacherObjectIds.push(tObjectId);
      }
      subject.teacherIds = teacherObjectIds;
    }

    // Compound uniqueness check
    const nextCode = dto.code !== undefined ? dto.code.trim().toUpperCase() : subject.code;
    const nextAcademicYear = dto.academicYear !== undefined ? dto.academicYear.trim() : subject.academicYear;
    const nextClassId = dto.classId !== undefined ? this.validateObjectId(dto.classId, 'classId') : subject.classId;

    if (
      nextCode !== subject.code ||
      nextAcademicYear !== subject.academicYear ||
      nextClassId.toString() !== subject.classId.toString()
    ) {
      const duplicate = await this.subjectModel
        .findOne({
          institutionId: subject.institutionId,
          code: nextCode,
          academicYear: nextAcademicYear,
          classId: nextClassId,
        })
        .exec();

      if (duplicate && duplicate._id.toString() !== id) {
        throw new ConflictException(
          `Subject with code '${nextCode}' already exists for this class in academic year '${nextAcademicYear}'.`,
        );
      }
    }

    if (dto.name) subject.name = dto.name.trim();
    if (dto.code) subject.code = nextCode;
    if (dto.description !== undefined) subject.description = dto.description ? dto.description.trim() : null;
    if (dto.academicYear) subject.academicYear = nextAcademicYear;
    if (dto.status) subject.status = dto.status;

    return await subject.save();
  }

  async assignTeachers(
    id: string,
    dto: AssignTeachersDto,
    currentUser: AuthenticatedUser,
  ): Promise<SubjectDocument> {
    const objectId = this.validateObjectId(id, 'subjectId');
    const subject = await this.subjectModel.findById(objectId).exec();

    if (!subject) {
      throw new NotFoundException(`Subject with ID '${id}' not found`);
    }

    this.checkTenantAccess(subject, currentUser);

    const teacherObjectIds: Types.ObjectId[] = [];
    for (const tId of dto.teacherIds) {
      const tObjectId = this.validateObjectId(tId, 'teacherId');
      const teacher = await this.teacherProfileModel.findById(tObjectId).exec();
      if (!teacher) {
        throw new NotFoundException(`Teacher profile with ID '${tId}' not found`);
      }
      if (teacher.institutionId.toString() !== subject.institutionId.toString()) {
        throw new BadRequestException(`Teacher with ID '${tId}' belongs to a different institution`);
      }
      teacherObjectIds.push(tObjectId);
    }

    subject.teacherIds = teacherObjectIds;
    const saved = await subject.save();

    await this.auditLogsService.logAction({
      userId: currentUser.userId,
      institutionId: subject.institutionId.toString(),
      action: AuditAction.ENROLLMENT_CHANGED,
      module: AuditModule.CLASSES,
      description: `Updated teacher assignments for subject '${subject.name}' (${subject.code})`,
      targetId: id,
      targetType: 'SUBJECT',
      metadata: { teacherCount: teacherObjectIds.length },
    });

    return saved;
  }

  async delete(id: string, currentUser: AuthenticatedUser): Promise<{ message: string }> {
    const objectId = this.validateObjectId(id, 'subjectId');
    const subject = await this.subjectModel.findById(objectId).exec();

    if (!subject) {
      throw new NotFoundException(`Subject with ID '${id}' not found`);
    }

    this.checkTenantAccess(subject, currentUser);

    await this.subjectModel.findByIdAndDelete(objectId).exec();

    await this.auditLogsService.logAction({
      userId: currentUser.userId,
      institutionId: subject.institutionId.toString(),
      action: AuditAction.ENROLLMENT_CHANGED,
      module: AuditModule.CLASSES,
      description: `Deleted subject '${subject.name}' (${subject.code})`,
      targetId: id,
      targetType: 'SUBJECT',
    });

    return { message: `Subject '${subject.name}' successfully deleted` };
  }

  private checkTenantAccess(subject: SubjectDocument, currentUser: AuthenticatedUser): void {
    if (currentUser.role === UserRole.SUPER_ADMIN) return;

    if (subject.institutionId.toString() !== currentUser.institutionId) {
      throw new ForbiddenException('Access denied: Subject belongs to another institution');
    }
  }
}

