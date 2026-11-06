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
import { Enrollment, EnrollmentDocument, EnrollmentStatus } from './schemas/enrollment.schema';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { PromoteStudentDto } from './dto/promote-student.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { QueryEnrollmentsDto } from './dto/query-enrollments.dto';
import {
  StudentProfile,
  StudentProfileDocument,
} from '../student-profiles/schemas/student-profile.schema';
import { Class, ClassDocument, ClassStatus } from '../classes/schemas/class.schema';
import { UserRole } from '../users/enums/user.enums';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditAction } from '../audit-logs/enums/audit-action.enum';
import { AuditModule } from '../audit-logs/enums/audit-module.enum';

@Injectable()
export class EnrollmentsService {
  private readonly logger = new Logger(EnrollmentsService.name);

  constructor(
    @InjectModel(Enrollment.name)
    private readonly enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(StudentProfile.name)
    private readonly studentProfileModel: Model<StudentProfileDocument>,
    @InjectModel(Class.name)
    private readonly classModel: Model<ClassDocument>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  private validateObjectId(id: string, name = 'ID'): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid MongoDB ObjectId format for ${name}: '${id}'`);
    }
    return new Types.ObjectId(id);
  }

  async create(dto: CreateEnrollmentDto, currentUser: AuthenticatedUser): Promise<EnrollmentDocument> {
    let targetInstId: Types.ObjectId;

    if (currentUser.role === UserRole.ADMIN) {
      if (!currentUser.institutionId) {
        throw new ForbiddenException('Admin is not assigned to an institution');
      }
      targetInstId = this.validateObjectId(currentUser.institutionId, 'institutionId');
    } else if (currentUser.role === UserRole.SUPER_ADMIN) {
      if (!dto.institutionId) {
        throw new BadRequestException('institutionId is required for Super Admin enrollment creation');
      }
      targetInstId = this.validateObjectId(dto.institutionId, 'institutionId');
    } else {
      throw new ForbiddenException('Only administrators can enroll students');
    }

    // 1. Validate student profile (Requirement 4)
    const studentObjectId = this.validateObjectId(dto.studentId, 'studentId');
    const student = await this.studentProfileModel.findById(studentObjectId).exec();
    if (!student) {
      throw new NotFoundException(`Student profile with ID '${dto.studentId}' not found`);
    }
    if (student.institutionId.toString() !== targetInstId.toString()) {
      throw new BadRequestException('Student belongs to a different institution');
    }

    // 2. Validate class (Requirement 4 & 5)
    const classObjectId = this.validateObjectId(dto.classId, 'classId');
    const classDoc = await this.classModel.findById(classObjectId).exec();
    if (!classDoc) {
      throw new NotFoundException(`Class with ID '${dto.classId}' not found`);
    }
    if (classDoc.institutionId.toString() !== targetInstId.toString()) {
      throw new BadRequestException('Class belongs to a different institution');
    }
    if (classDoc.status !== ClassStatus.ACTIVE) {
      throw new BadRequestException(`Cannot enroll into an inactive class (Status: ${classDoc.status})`);
    }

    // Capacity validation (Requirement 5)
    const currentActiveCount = await this.enrollmentModel
      .countDocuments({
        classId: classObjectId,
        status: EnrollmentStatus.ACTIVE,
      })
      .exec();

    if (currentActiveCount >= classDoc.capacity) {
      throw new BadRequestException(
        `Class '${classDoc.name}' is already at maximum capacity (${classDoc.capacity} students).`,
      );
    }

    // 3. Unique check: one enrollment per student per academic year (Requirement 3)
    const duplicateStudentYear = await this.enrollmentModel
      .findOne({
        studentId: studentObjectId,
        academicYear: dto.academicYear.trim(),
      })
      .exec();

    if (duplicateStudentYear) {
      throw new ConflictException(
        `Student '${student.admissionNumber}' is already enrolled for academic year '${dto.academicYear}'.`,
      );
    }

    // 4. Unique check: rollNumber within class + academic year (Requirement 3)
    const normalizedRollNumber = dto.rollNumber.trim();
    const duplicateRoll = await this.enrollmentModel
      .findOne({
        institutionId: targetInstId,
        classId: classObjectId,
        academicYear: dto.academicYear.trim(),
        rollNumber: normalizedRollNumber,
      })
      .exec();

    if (duplicateRoll) {
      throw new ConflictException(
        `Roll number '${normalizedRollNumber}' is already assigned in class '${classDoc.name}' for ${dto.academicYear}.`,
      );
    }

    const enrollment = new this.enrollmentModel({
      studentId: studentObjectId,
      institutionId: targetInstId,
      classId: classObjectId,
      academicYear: dto.academicYear.trim(),
      rollNumber: normalizedRollNumber,
      enrollmentDate: dto.enrollmentDate ? new Date(dto.enrollmentDate) : new Date(),
      status: dto.status || EnrollmentStatus.ACTIVE,
    });

    const saved = await enrollment.save();

    await this.auditLogsService.logAction({
      userId: currentUser.userId,
      institutionId: targetInstId.toString(),
      action: AuditAction.ENROLLMENT_CHANGED,
      module: AuditModule.CLASSES,
      description: `Enrolled student '${student.admissionNumber}' into class '${classDoc.name}' (Roll #${saved.rollNumber})`,
      targetId: saved._id.toString(),
      targetType: 'ENROLLMENT',
      metadata: {
        studentId: studentObjectId.toString(),
        classId: classObjectId.toString(),
        academicYear: saved.academicYear,
        rollNumber: saved.rollNumber,
      },
    });

    this.logger.log(
      `Student ${student.admissionNumber} enrolled in ${classDoc.name} (${saved.academicYear})`,
    );
    return saved;
  }

  async promote(
    dto: PromoteStudentDto,
    currentUser: AuthenticatedUser,
  ): Promise<{ previousEnrollment: EnrollmentDocument; newEnrollment: EnrollmentDocument }> {
    const currentEnrollmentObjectId = this.validateObjectId(
      dto.currentEnrollmentId,
      'currentEnrollmentId',
    );
    const currentEnrollment = await this.enrollmentModel
      .findById(currentEnrollmentObjectId)
      .exec();

    if (!currentEnrollment) {
      throw new NotFoundException(
        `Enrollment record with ID '${dto.currentEnrollmentId}' not found`,
      );
    }

    this.checkTenantAccess(currentEnrollment, currentUser);

    // Validate target class
    const targetClassObjectId = this.validateObjectId(dto.targetClassId, 'targetClassId');
    const targetClass = await this.classModel.findById(targetClassObjectId).exec();
    if (!targetClass) {
      throw new NotFoundException(`Target class with ID '${dto.targetClassId}' not found`);
    }
    if (targetClass.institutionId.toString() !== currentEnrollment.institutionId.toString()) {
      throw new BadRequestException('Target class belongs to a different institution');
    }
    if (targetClass.status !== ClassStatus.ACTIVE) {
      throw new BadRequestException(`Target class is inactive (Status: ${targetClass.status})`);
    }

    // Capacity validation
    const currentActiveCount = await this.enrollmentModel
      .countDocuments({
        classId: targetClassObjectId,
        status: EnrollmentStatus.ACTIVE,
      })
      .exec();

    if (currentActiveCount >= targetClass.capacity) {
      throw new BadRequestException(
        `Target class '${targetClass.name}' is already at maximum capacity (${targetClass.capacity}).`,
      );
    }

    // Check if student already enrolled in target academic year
    const existingYearEnrollment = await this.enrollmentModel
      .findOne({
        studentId: currentEnrollment.studentId,
        academicYear: dto.newAcademicYear.trim(),
      })
      .exec();

    if (existingYearEnrollment) {
      throw new ConflictException(
        `Student is already enrolled in academic year '${dto.newAcademicYear}'.`,
      );
    }

    // Check roll number uniqueness in target class + year
    const normalizedRollNumber = dto.newRollNumber.trim();
    const duplicateRoll = await this.enrollmentModel
      .findOne({
        institutionId: currentEnrollment.institutionId,
        classId: targetClassObjectId,
        academicYear: dto.newAcademicYear.trim(),
        rollNumber: normalizedRollNumber,
      })
      .exec();

    if (duplicateRoll) {
      throw new ConflictException(
        `Roll number '${normalizedRollNumber}' is already assigned in target class for ${dto.newAcademicYear}.`,
      );
    }

    // 1. Mark previous enrollment as PROMOTED (Requirement 7 & 8: Historical preservation)
    currentEnrollment.status = EnrollmentStatus.PROMOTED;
    const previousSaved = await currentEnrollment.save();

    // 2. Create new enrollment
    const newEnrollment = new this.enrollmentModel({
      studentId: currentEnrollment.studentId,
      institutionId: currentEnrollment.institutionId,
      classId: targetClassObjectId,
      academicYear: dto.newAcademicYear.trim(),
      rollNumber: normalizedRollNumber,
      enrollmentDate: dto.enrollmentDate ? new Date(dto.enrollmentDate) : new Date(),
      status: EnrollmentStatus.ACTIVE,
    });

    const newSaved = await newEnrollment.save();

    await this.auditLogsService.logAction({
      userId: currentUser.userId,
      institutionId: currentEnrollment.institutionId.toString(),
      action: AuditAction.ENROLLMENT_CHANGED,
      module: AuditModule.CLASSES,
      description: `Promoted student from previous class to '${targetClass.name}' for ${newSaved.academicYear}`,
      targetId: newSaved._id.toString(),
      targetType: 'ENROLLMENT',
      metadata: {
        studentId: currentEnrollment.studentId.toString(),
        previousEnrollmentId: previousSaved._id.toString(),
        newEnrollmentId: newSaved._id.toString(),
        newClassId: targetClassObjectId.toString(),
      },
    });

    return { previousEnrollment: previousSaved, newEnrollment: newSaved };
  }

  async findAll(
    query: QueryEnrollmentsDto,
    currentUser: AuthenticatedUser,
  ): Promise<{ items: EnrollmentDocument[]; total: number; page: number; limit: number; totalPages: number }> {
    const filterQuery: Record<string, any> = {};

    // Multi-tenant isolation (Requirement 9)
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

    if (query.studentId) {
      filterQuery.studentId = this.validateObjectId(query.studentId, 'studentId');
    }
    if (query.classId) {
      filterQuery.classId = this.validateObjectId(query.classId, 'classId');
    }
    if (query.academicYear) {
      filterQuery.academicYear = query.academicYear.trim();
    }
    if (query.status) {
      filterQuery.status = query.status;
    }

    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.enrollmentModel
        .find(filterQuery)
        .populate('studentId')
        .populate('classId')
        .sort({ academicYear: -1, rollNumber: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.enrollmentModel.countDocuments(filterQuery).exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findById(id: string, currentUser: AuthenticatedUser): Promise<EnrollmentDocument> {
    const objectId = this.validateObjectId(id, 'enrollmentId');
    const enrollment = await this.enrollmentModel
      .findById(objectId)
      .populate('studentId')
      .populate('classId')
      .exec();

    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID '${id}' not found`);
    }

    this.checkTenantAccess(enrollment, currentUser);
    return enrollment;
  }

  async update(
    id: string,
    dto: UpdateEnrollmentDto,
    currentUser: AuthenticatedUser,
  ): Promise<EnrollmentDocument> {
    const objectId = this.validateObjectId(id, 'enrollmentId');
    const enrollment = await this.enrollmentModel.findById(objectId).exec();

    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID '${id}' not found`);
    }

    this.checkTenantAccess(enrollment, currentUser);

    if (dto.classId) {
      const targetClassObjectId = this.validateObjectId(dto.classId, 'classId');
      const targetClass = await this.classModel.findById(targetClassObjectId).exec();
      if (!targetClass) {
        throw new NotFoundException(`Class with ID '${dto.classId}' not found`);
      }
      if (targetClass.institutionId.toString() !== enrollment.institutionId.toString()) {
        throw new BadRequestException('Class belongs to another institution');
      }
      enrollment.classId = targetClassObjectId;
    }

    const nextAcademicYear = dto.academicYear !== undefined ? dto.academicYear.trim() : enrollment.academicYear;
    const nextRollNumber = dto.rollNumber !== undefined ? dto.rollNumber.trim() : enrollment.rollNumber;

    if (dto.academicYear && dto.academicYear !== enrollment.academicYear) {
      const duplicateStudentYear = await this.enrollmentModel
        .findOne({
          studentId: enrollment.studentId,
          academicYear: nextAcademicYear,
        })
        .exec();

      if (duplicateStudentYear && duplicateStudentYear._id.toString() !== id) {
        throw new ConflictException(
          `Student is already enrolled in academic year '${nextAcademicYear}'.`,
        );
      }
    }

    if (dto.rollNumber || dto.classId || dto.academicYear) {
      const duplicateRoll = await this.enrollmentModel
        .findOne({
          institutionId: enrollment.institutionId,
          classId: enrollment.classId,
          academicYear: nextAcademicYear,
          rollNumber: nextRollNumber,
        })
        .exec();

      if (duplicateRoll && duplicateRoll._id.toString() !== id) {
        throw new ConflictException(
          `Roll number '${nextRollNumber}' is already assigned in this class and academic year.`,
        );
      }
    }

    if (dto.academicYear) enrollment.academicYear = nextAcademicYear;
    if (dto.rollNumber) enrollment.rollNumber = nextRollNumber;
    if (dto.enrollmentDate) enrollment.enrollmentDate = new Date(dto.enrollmentDate);
    if (dto.status) enrollment.status = dto.status;

    return await enrollment.save();
  }

  async updateStatus(
    id: string,
    status: EnrollmentStatus,
    currentUser: AuthenticatedUser,
  ): Promise<EnrollmentDocument> {
    const objectId = this.validateObjectId(id, 'enrollmentId');
    const enrollment = await this.enrollmentModel.findById(objectId).exec();

    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID '${id}' not found`);
    }

    this.checkTenantAccess(enrollment, currentUser);
    enrollment.status = status;
    const saved = await enrollment.save();

    await this.auditLogsService.logAction({
      userId: currentUser.userId,
      institutionId: enrollment.institutionId.toString(),
      action: AuditAction.ENROLLMENT_CHANGED,
      module: AuditModule.CLASSES,
      description: `Updated enrollment status to '${status}'`,
      targetId: id,
      targetType: 'ENROLLMENT',
      metadata: { newStatus: status },
    });

    return saved;
  }

  private checkTenantAccess(enrollment: EnrollmentDocument, currentUser: AuthenticatedUser): void {
    if (currentUser.role === UserRole.SUPER_ADMIN) return;

    if (enrollment.institutionId.toString() !== currentUser.institutionId) {
      throw new ForbiddenException('Access denied: Enrollment belongs to another institution');
    }
  }
}

