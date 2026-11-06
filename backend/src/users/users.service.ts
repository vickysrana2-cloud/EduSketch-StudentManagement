import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { User, UserDocument } from './schemas/user.schema';
import { Institution, InstitutionDocument } from '../institutions/schemas/institution.schema';
import { InstitutionStatus } from '../institutions/enums/institution.enums';
import {
  TeacherProfile,
  TeacherProfileDocument,
} from '../teacher-profiles/schemas/teacher-profile.schema';
import {
  StudentProfile,
  StudentProfileDocument,
} from '../student-profiles/schemas/student-profile.schema';
import { Class, ClassDocument, ClassStatus } from '../classes/schemas/class.schema';
import {
  Enrollment,
  EnrollmentDocument,
  EnrollmentStatus,
} from '../enrollments/schemas/enrollment.schema';
import { Session, SessionDocument } from '../auth/schemas/session.schema';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditAction } from '../audit-logs/enums/audit-action.enum';
import { AuditModule } from '../audit-logs/enums/audit-module.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateTeacherUserDto } from './dto/create-teacher-user.dto';
import { CreateStudentUserDto } from './dto/create-student-user.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UserRole, UserStatus } from './enums/user.enums';
import { TenantContextService } from '../common/tenancy/tenant-context.service';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Institution.name)
    private readonly institutionModel: Model<InstitutionDocument>,
    @InjectModel(TeacherProfile.name)
    private readonly teacherProfileModel: Model<TeacherProfileDocument>,
    @InjectModel(StudentProfile.name)
    private readonly studentProfileModel: Model<StudentProfileDocument>,
    @InjectModel(Class.name)
    private readonly classModel: Model<ClassDocument>,
    @InjectModel(Enrollment.name)
    private readonly enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(Session.name)
    private readonly sessionModel: Model<SessionDocument>,
    private readonly tenantContextService: TenantContextService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  /**
   * Helper to validate a 24-character hexadecimal MongoDB ObjectId
   */
  private validateObjectId(id: string, fieldName = 'ID'): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(
        `Invalid MongoDB ObjectId format for ${fieldName}: '${id}'`,
      );
    }
    return new Types.ObjectId(id);
  }

  /**
   * Helper to validate business rules for role and institutionId
   */
  private async validateRoleAndInstitution(
    role: UserRole,
    institutionId?: string | null,
  ): Promise<Types.ObjectId | null> {
    if (role === UserRole.SUPER_ADMIN) {
      if (institutionId) {
        throw new BadRequestException(
          'Super Admin must not be associated with any institution. institutionId must be null.',
        );
      }
      return null;
    }

    if (!institutionId) {
      throw new BadRequestException(
        `institutionId is required for user with role '${role}'`,
      );
    }

    const objId = this.validateObjectId(institutionId, 'institutionId');
    const institutionExists = await this.institutionModel
      .exists({ _id: objId })
      .exec();

    if (!institutionExists) {
      throw new NotFoundException(
        `Institution with ID '${institutionId}' does not exist`,
      );
    }

    return objId;
  }

  /**
   * Standard Create User (Internal/Admin)
   */
  async createUser(createUserDto: CreateUserDto): Promise<UserDocument> {
    const normalizedEmail = createUserDto.email.trim().toLowerCase();

    const existingUser = await this.userModel
      .findOne({ email: normalizedEmail })
      .lean()
      .exec();

    if (existingUser) {
      throw new ConflictException(
        `User with email '${normalizedEmail}' already exists`,
      );
    }

    const institutionObjectId = await this.validateRoleAndInstitution(
      createUserDto.role,
      createUserDto.institutionId,
    );

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(createUserDto.password, salt);

    try {
      const newUser = new this.userModel({
        name: createUserDto.name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: createUserDto.role,
        status: createUserDto.status ?? UserStatus.ACTIVE,
        isEmailVerified: createUserDto.isEmailVerified ?? false,
        institutionId: institutionObjectId,
        profileImage: createUserDto.profileImage ?? null,
      });

      const savedUser = await newUser.save();
      return (await this.findUserById(savedUser._id.toString())) as UserDocument;
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException(
          `User with email '${normalizedEmail}' already exists`,
        );
      }
      this.logger.error(`Error creating user: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  /**
   * TASK 19: Create Teacher Account & Linked Profile (Atomic with Rollback)
   */
  async createTeacher(
    dto: CreateTeacherUserDto,
    currentUser: AuthenticatedUser,
  ): Promise<{ user: UserDocument; teacherProfile: TeacherProfileDocument }> {
    let targetInstId: Types.ObjectId;

    if (currentUser.role === UserRole.ADMIN) {
      if (!currentUser.institutionId) {
        throw new ForbiddenException('Admin is not assigned to an institution');
      }
      targetInstId = this.validateObjectId(currentUser.institutionId, 'institutionId');
    } else if (currentUser.role === UserRole.SUPER_ADMIN) {
      if (!dto.institutionId) {
        throw new BadRequestException('institutionId is required for Super Admin teacher creation');
      }
      targetInstId = this.validateObjectId(dto.institutionId, 'institutionId');
    } else {
      throw new ForbiddenException('Only administrators can create teacher accounts');
    }

    // 1. Verify institution is ACTIVE
    const institution = await this.institutionModel.findById(targetInstId).exec();
    if (!institution) {
      throw new NotFoundException(`Institution not found`);
    }
    if (institution.status !== InstitutionStatus.ACTIVE) {
      throw new BadRequestException(
        `Cannot create teacher: Institution '${institution.name}' is ${institution.status}`,
      );
    }

    // 2. Reject duplicate email
    const normalizedEmail = dto.email.trim().toLowerCase();
    const existingEmail = await this.userModel
      .findOne({ email: normalizedEmail })
      .lean()
      .exec();

    if (existingEmail) {
      throw new ConflictException(`User with email '${normalizedEmail}' already exists`);
    }

    // 3. Reject duplicate employeeId within this institution
    const normalizedEmpId = dto.employeeId.trim().toUpperCase();
    const existingEmpId = await this.teacherProfileModel
      .findOne({
        institutionId: targetInstId,
        employeeId: normalizedEmpId,
      })
      .lean()
      .exec();

    if (existingEmpId) {
      throw new ConflictException(
        `Teacher with employee ID '${normalizedEmpId}' already exists in this institution`,
      );
    }

    // 4. Secure password generation or hashing
    const rawPassword = dto.password || crypto.randomBytes(12).toString('base64');
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(rawPassword, salt);

    // 5. Atomic write with rollback compensation
    let createdUser: UserDocument | null = null;
    try {
      const user = new this.userModel({
        name: dto.name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: UserRole.TEACHER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        institutionId: targetInstId,
      });
      createdUser = await user.save();

      const profile = new this.teacherProfileModel({
        userId: createdUser._id,
        institutionId: targetInstId,
        employeeId: normalizedEmpId,
        qualification: dto.qualification,
        specialization: dto.specialization,
        experienceYears: dto.experienceYears,
        joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : new Date(),
        status: 'ACTIVE',
      });
      const savedProfile = await profile.save();

      // 6. Audit Logging
      await this.auditLogsService.logAction({
        userId: currentUser.userId,
        institutionId: targetInstId.toString(),
        action: AuditAction.TEACHER_CREATED,
        module: AuditModule.TEACHERS,
        description: `Created teacher account '${createdUser.name}' (${createdUser.email}) with Employee ID '${savedProfile.employeeId}'`,
        targetId: createdUser._id.toString(),
        targetType: 'USER',
        metadata: {
          teacherProfileId: savedProfile._id.toString(),
          employeeId: savedProfile.employeeId,
          assignedRole: UserRole.TEACHER,
        },
      });

      this.logger.log(
        `Teacher account created: ${createdUser.email} (Employee: ${savedProfile.employeeId})`,
      );

      const safeUser = (await this.userModel
        .findById(createdUser._id)
        .populate('institutionId', 'name code type status')
        .exec()) as UserDocument;

      return { user: safeUser, teacherProfile: savedProfile };
    } catch (err: any) {
      // Rollback partial writes
      if (createdUser && createdUser._id) {
        await this.userModel.findByIdAndDelete(createdUser._id).exec().catch(() => {});
      }
      throw err;
    }
  }

  /**
   * TASK 20: Create Student Admission & Initial Enrollment (Atomic with Rollback)
   */
  async createStudent(
    dto: CreateStudentUserDto,
    currentUser: AuthenticatedUser,
  ): Promise<{
    user: UserDocument;
    studentProfile: StudentProfileDocument;
    enrollment: EnrollmentDocument;
  }> {
    let targetInstId: Types.ObjectId;

    if (currentUser.role === UserRole.ADMIN) {
      if (!currentUser.institutionId) {
        throw new ForbiddenException('Admin is not assigned to an institution');
      }
      targetInstId = this.validateObjectId(currentUser.institutionId, 'institutionId');
    } else if (currentUser.role === UserRole.SUPER_ADMIN) {
      if (!dto.institutionId) {
        throw new BadRequestException('institutionId is required for Super Admin student admission');
      }
      targetInstId = this.validateObjectId(dto.institutionId, 'institutionId');
    } else {
      throw new ForbiddenException('Only administrators can admit students');
    }

    // 1. Verify institution is ACTIVE
    const institution = await this.institutionModel.findById(targetInstId).exec();
    if (!institution) {
      throw new NotFoundException('Institution not found');
    }
    if (institution.status !== InstitutionStatus.ACTIVE) {
      throw new BadRequestException(
        `Cannot admit student: Institution '${institution.name}' is ${institution.status}`,
      );
    }

    // 2. Verify target class belongs to same institution and is ACTIVE
    const classObjectId = this.validateObjectId(dto.classId, 'classId');
    const classDoc = await this.classModel.findById(classObjectId).exec();
    if (!classDoc) {
      throw new NotFoundException(`Class with ID '${dto.classId}' not found`);
    }
    if (classDoc.institutionId.toString() !== targetInstId.toString()) {
      throw new BadRequestException('Class belongs to another institution');
    }
    if (classDoc.status !== ClassStatus.ACTIVE) {
      throw new BadRequestException(`Cannot admit student into an inactive class (status: ${classDoc.status})`);
    }

    // 3. Check class capacity
    const activeEnrollments = await this.enrollmentModel
      .countDocuments({
        classId: classObjectId,
        status: EnrollmentStatus.ACTIVE,
      })
      .exec();

    if (activeEnrollments >= classDoc.capacity) {
      throw new BadRequestException(
        `Class '${classDoc.name}' is full (capacity: ${classDoc.capacity} students).`,
      );
    }

    // 4. Validate Date of Birth
    const dob = new Date(dto.dateOfBirth);
    if (isNaN(dob.getTime())) {
      throw new BadRequestException('Invalid dateOfBirth format');
    }
    if (dob.getTime() > Date.now()) {
      throw new BadRequestException('dateOfBirth cannot be in the future');
    }
    const ageYears = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    if (ageYears < 2.5) {
      throw new BadRequestException('Student must be at least 3 years old for admission');
    }

    // 5. Validate Parent Details
    if (!dto.parentDetails || dto.parentDetails.length === 0) {
      throw new BadRequestException('At least one parent/guardian detail is required');
    }

    // 6. Validate email uniqueness
    const normalizedEmail = dto.email.trim().toLowerCase();
    const existingEmail = await this.userModel
      .findOne({ email: normalizedEmail })
      .lean()
      .exec();

    if (existingEmail) {
      throw new ConflictException(`User with email '${normalizedEmail}' already exists`);
    }

    // 7. Validate admission number uniqueness within this institution
    const normalizedAdmNo = dto.admissionNumber.trim().toUpperCase();
    const existingAdm = await this.studentProfileModel
      .findOne({
        institutionId: targetInstId,
        admissionNumber: normalizedAdmNo,
      })
      .lean()
      .exec();

    if (existingAdm) {
      throw new ConflictException(
        `Admission number '${normalizedAdmNo}' already exists in this institution`,
      );
    }

    // 8. Academic year and Roll number resolution
    const targetAcademicYear = dto.academicYear ? dto.academicYear.trim() : classDoc.academicYear;

    let assignedRollNumber = dto.rollNumber?.trim();
    if (!assignedRollNumber) {
      const count = await this.enrollmentModel
        .countDocuments({
          institutionId: targetInstId,
          classId: classObjectId,
          academicYear: targetAcademicYear,
        })
        .exec();
      assignedRollNumber = String(count + 1).padStart(2, '0');
    } else {
      const duplicateRoll = await this.enrollmentModel
        .findOne({
          institutionId: targetInstId,
          classId: classObjectId,
          academicYear: targetAcademicYear,
          rollNumber: assignedRollNumber,
        })
        .lean()
        .exec();

      if (duplicateRoll) {
        throw new ConflictException(
          `Roll number '${assignedRollNumber}' is already assigned in class '${classDoc.name}' for ${targetAcademicYear}`,
        );
      }
    }

    // 9. Password setup
    const rawPassword = dto.password || crypto.randomBytes(12).toString('base64');
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(rawPassword, salt);

    // 10. Atomic write with rollback compensation
    let createdUser: UserDocument | null = null;
    let createdProfile: StudentProfileDocument | null = null;

    try {
      // 1. Create User
      const user = new this.userModel({
        name: dto.name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        institutionId: targetInstId,
      });
      createdUser = await user.save();

      // 2. Create StudentProfile
      const defaultAddr = dto.address || {
        street: 'Main Campus',
        city: 'Nagpur',
        state: 'Maharashtra',
        postalCode: '440001',
      };

      const profile = new this.studentProfileModel({
        userId: createdUser._id,
        institutionId: targetInstId,
        admissionNumber: normalizedAdmNo,
        dateOfBirth: dob,
        gender: dto.gender,
        address: defaultAddr,
        parentDetails: dto.parentDetails,
        status: 'ACTIVE',
      });
      createdProfile = await profile.save();

      // 3. Create initial Enrollment
      const enrollment = new this.enrollmentModel({
        studentId: createdProfile._id,
        institutionId: targetInstId,
        classId: classObjectId,
        academicYear: targetAcademicYear,
        rollNumber: assignedRollNumber,
        enrollmentDate: new Date(),
        status: EnrollmentStatus.ACTIVE,
      });
      const savedEnrollment = await enrollment.save();

      // 4. Audit Logging
      await this.auditLogsService.logAction({
        userId: currentUser.userId,
        institutionId: targetInstId.toString(),
        action: AuditAction.STUDENT_ADMITTED,
        module: AuditModule.STUDENTS,
        description: `Admitted student '${createdUser.name}' (${createdProfile.admissionNumber}) into class '${classDoc.name}' (Roll #${savedEnrollment.rollNumber})`,
        targetId: createdUser._id.toString(),
        targetType: 'USER',
        metadata: {
          studentProfileId: createdProfile._id.toString(),
          enrollmentId: savedEnrollment._id.toString(),
          admissionNumber: createdProfile.admissionNumber,
          classId: classObjectId.toString(),
          academicYear: savedEnrollment.academicYear,
          rollNumber: savedEnrollment.rollNumber,
        },
      });

      this.logger.log(
        `Student admitted: ${createdUser.name} (${createdProfile.admissionNumber}) in Class ${classDoc.name}`,
      );

      const safeUser = (await this.userModel
        .findById(createdUser._id)
        .populate('institutionId', 'name code type status')
        .exec()) as UserDocument;

      return {
        user: safeUser,
        studentProfile: createdProfile,
        enrollment: savedEnrollment,
      };
    } catch (err: any) {
      // Rollback compensation
      if (createdProfile && createdProfile._id) {
        await this.studentProfileModel.findByIdAndDelete(createdProfile._id).exec().catch(() => {});
      }
      if (createdUser && createdUser._id) {
        await this.userModel.findByIdAndDelete(createdUser._id).exec().catch(() => {});
      }
      throw err;
    }
  }

  /**
   * TASK 21: Update User Profile (Protected fields guarded)
   */
  async updateUserProfile(
    id: string,
    dto: UpdateUserProfileDto,
    currentUser: AuthenticatedUser,
  ): Promise<UserDocument> {
    const objectId = this.validateObjectId(id);
    const existingUser = await this.userModel.findById(objectId).exec();

    if (!existingUser) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    // Tenant Isolation
    if (currentUser.role === UserRole.ADMIN) {
      if (existingUser.institutionId?.toString() !== currentUser.institutionId) {
        throw new ForbiddenException('Admin can only manage users in their institution');
      }
    } else if (currentUser.role === UserRole.TEACHER || currentUser.role === UserRole.STUDENT) {
      if (currentUser.userId !== id) {
        throw new ForbiddenException('You can only update your own profile');
      }
    }

    // Validate email uniqueness if changing
    if (dto.email) {
      const normalizedEmail = dto.email.trim().toLowerCase();
      if (normalizedEmail !== existingUser.email) {
        const emailTaken = await this.userModel
          .findOne({ email: normalizedEmail, _id: { $ne: objectId } })
          .lean()
          .exec();

        if (emailTaken) {
          throw new ConflictException(`Email '${normalizedEmail}' is already taken`);
        }
        existingUser.email = normalizedEmail;
      }
    }

    if (dto.name !== undefined) {
      existingUser.name = dto.name.trim();
    }
    if (dto.profileImage !== undefined) {
      existingUser.profileImage = dto.profileImage;
    }

    const saved = await existingUser.save();

    await this.auditLogsService.logAction({
      userId: currentUser.userId,
      institutionId: saved.institutionId?.toString() || null,
      action: AuditAction.USER_UPDATED,
      module: AuditModule.USERS,
      description: `Updated profile details for user '${saved.name}' (${saved.email})`,
      targetId: saved._id.toString(),
      targetType: 'USER',
    });

    return (await this.userModel
      .findById(saved._id)
      .populate('institutionId', 'name code type status')
      .exec()) as UserDocument;
  }

  /**
   * TASK 21: Update User Status & Revoke Active Sessions on Suspension/Deactivation
   */
  async updateUserStatusWithRevocation(
    id: string,
    status: UserStatus,
    currentUser: AuthenticatedUser,
  ): Promise<UserDocument> {
    const objectId = this.validateObjectId(id);
    const existingUser = await this.userModel.findById(objectId).exec();

    if (!existingUser) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    // Self-deactivation restriction (Requirement 8)
    if (
      currentUser.userId === id &&
      (status === UserStatus.INACTIVE || status === UserStatus.SUSPENDED)
    ) {
      throw new BadRequestException('Users cannot deactivate or suspend their own account');
    }

    // Tenant Isolation
    if (currentUser.role === UserRole.ADMIN) {
      if (existingUser.institutionId?.toString() !== currentUser.institutionId) {
        throw new ForbiddenException('Admin can only manage users in their institution');
      }
      if (existingUser.role === UserRole.SUPER_ADMIN) {
        throw new ForbiddenException('Admins cannot modify Super Admin accounts');
      }
    } else if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only administrators can update account status');
    }

    const previousStatus = existingUser.status;
    existingUser.status = status;
    const saved = await existingUser.save();

    // Revoke sessions when accounts are suspended or deactivated (Requirement 7)
    if (status === UserStatus.INACTIVE || status === UserStatus.SUSPENDED) {
      await this.sessionModel.updateMany(
        { userId: objectId, revokedAt: null },
        { $set: { revokedAt: new Date() } },
      );
      this.logger.log(`Revoked all active sessions for deactivated user '${id}'`);
    }

    await this.auditLogsService.logAction({
      userId: currentUser.userId,
      institutionId: saved.institutionId?.toString() || null,
      action: status === UserStatus.SUSPENDED ? AuditAction.USER_SUSPENDED : AuditAction.USER_UPDATED,
      module: AuditModule.USERS,
      description: `Changed user status for '${saved.email}' from '${previousStatus}' to '${status}'`,
      targetId: saved._id.toString(),
      targetType: 'USER',
      metadata: { previousStatus, newStatus: status },
    });

    return (await this.userModel
      .findById(saved._id)
      .populate('institutionId', 'name code type status')
      .exec()) as UserDocument;
  }

  /**
   * TASK 21: Authorized Workflow for Role Changes
   */
  async updateUserRole(
    id: string,
    newRole: UserRole,
    currentUser: AuthenticatedUser,
  ): Promise<UserDocument> {
    const objectId = this.validateObjectId(id);
    const existingUser = await this.userModel.findById(objectId).exec();

    if (!existingUser) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    // Only SUPER_ADMIN can change roles
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only Super Admin can change user roles');
    }

    const previousRole = existingUser.role;
    existingUser.role = newRole;

    if (newRole === UserRole.SUPER_ADMIN) {
      existingUser.institutionId = null;
    }

    const saved = await existingUser.save();

    await this.auditLogsService.logAction({
      userId: currentUser.userId,
      institutionId: saved.institutionId?.toString() || null,
      action: AuditAction.USER_UPDATED,
      module: AuditModule.USERS,
      description: `Super Admin changed role for '${saved.email}' from '${previousRole}' to '${newRole}'`,
      targetId: saved._id.toString(),
      targetType: 'USER',
      metadata: { previousRole, newRole },
    });

    return (await this.userModel
      .findById(saved._id)
      .populate('institutionId', 'name code type status')
      .exec()) as UserDocument;
  }

  /**
   * Existing User queries
   */
  async findUserByEmail(email: string): Promise<UserDocument | null> {
    const normalizedEmail = email.trim().toLowerCase();
    return await this.userModel
      .findOne({ email: normalizedEmail })
      .populate('institutionId', 'name code type status')
      .exec();
  }

  async findUserByEmailWithPassword(email: string): Promise<UserDocument | null> {
    const normalizedEmail = email.trim().toLowerCase();
    return await this.userModel
      .findOne({ email: normalizedEmail })
      .select('+passwordHash')
      .populate('institutionId', 'name code type status')
      .exec();
  }

  async findUserById(id: string, currentUser?: AuthenticatedUser): Promise<UserDocument> {
    this.validateObjectId(id);
    const user = await this.userModel
      .findById(id)
      .populate('institutionId', 'name code type status')
      .exec();

    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    if (currentUser) {
      this.tenantContextService.enforceTenantAccess(user, currentUser, 'User');
    }

    return user;
  }

  async findUserByIdWithPassword(id: string): Promise<UserDocument> {
    this.validateObjectId(id);
    const user = await this.userModel
      .findById(id)
      .select('+passwordHash')
      .populate('institutionId', 'name code type status')
      .exec();

    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }
    return user;
  }

  async findUsersByInstitution(
    institutionId: string,
    filter?: {
      role?: UserRole;
      status?: UserStatus;
      search?: string;
    },
    currentUser?: AuthenticatedUser,
  ): Promise<UserDocument[]> {
    if (currentUser) {
      this.tenantContextService.resolveTenantId(currentUser, institutionId);
    }
    const objId = this.validateObjectId(institutionId, 'institutionId');

    const institutionExists = await this.institutionModel
      .exists({ _id: objId })
      .exec();

    if (!institutionExists) {
      throw new NotFoundException(
        `Institution with ID '${institutionId}' does not exist`,
      );
    }

    const query: Record<string, any> = { institutionId: objId };

    if (filter?.role) query.role = filter.role;
    if (filter?.status) query.status = filter.status;
    if (filter?.search) {
      const searchRegex = new RegExp(filter.search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    return await this.userModel
      .find(query)
      .sort({ createdAt: -1 })
      .populate('institutionId', 'name code type status')
      .exec();
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument> {
    this.validateObjectId(id);
    const existingUser = await this.userModel.findById(id).exec();
    if (!existingUser) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    const updatePayload: Record<string, any> = {};

    if (updateUserDto.email) {
      const normalizedEmail = updateUserDto.email.trim().toLowerCase();
      if (normalizedEmail !== existingUser.email) {
        const emailTaken = await this.userModel
          .findOne({ email: normalizedEmail, _id: { $ne: id } })
          .lean()
          .exec();

        if (emailTaken) {
          throw new ConflictException(`Email '${normalizedEmail}' is already taken`);
        }
      }
      updatePayload.email = normalizedEmail;
    }

    if (updateUserDto.name !== undefined) updatePayload.name = updateUserDto.name.trim();
    if (updateUserDto.profileImage !== undefined) updatePayload.profileImage = updateUserDto.profileImage;
    if (updateUserDto.isEmailVerified !== undefined) updatePayload.isEmailVerified = updateUserDto.isEmailVerified;
    if (updateUserDto.status !== undefined) updatePayload.status = updateUserDto.status;

    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt(12);
      updatePayload.passwordHash = await bcrypt.hash(updateUserDto.password, salt);
      updatePayload.passwordChangedAt = new Date();
    }

    const targetRole = updateUserDto.role ?? existingUser.role;
    const targetInstitutionId =
      updateUserDto.institutionId !== undefined
        ? updateUserDto.institutionId
        : existingUser.institutionId?.toString();

    if (updateUserDto.role !== undefined || updateUserDto.institutionId !== undefined) {
      const validInstitutionId = await this.validateRoleAndInstitution(
        targetRole,
        targetInstitutionId,
      );
      updatePayload.role = targetRole;
      updatePayload.institutionId = validInstitutionId;
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, { $set: updatePayload }, { new: true, runValidators: true })
      .populate('institutionId', 'name code type status')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    return updatedUser;
  }

  async updateUserStatus(id: string, status: UserStatus): Promise<UserDocument> {
    this.validateObjectId(id);
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, { $set: { status } }, { new: true, runValidators: true })
      .populate('institutionId', 'name code type status')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }
    return updatedUser;
  }

  async updateLastLogin(id: string): Promise<UserDocument> {
    this.validateObjectId(id);
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, { $set: { lastLoginAt: new Date() } }, { new: true })
      .populate('institutionId', 'name code type status')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }
    return updatedUser;
  }

  async findAllUsers(
    filter?: {
      role?: UserRole;
      status?: UserStatus;
      institutionId?: string;
      search?: string;
    },
    currentUser?: AuthenticatedUser,
  ): Promise<UserDocument[]> {
    const query: Record<string, any> = {};

    if (currentUser) {
      const tenantFilter = this.tenantContextService.buildTenantFilter(
        currentUser,
        filter?.institutionId,
      );
      Object.assign(query, tenantFilter);
    } else if (filter?.institutionId) {
      query.institutionId = this.validateObjectId(filter.institutionId, 'institutionId');
    }

    if (filter?.role) query.role = filter.role;
    if (filter?.status) query.status = filter.status;
    if (filter?.search) {
      const searchRegex = new RegExp(filter.search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    return await this.userModel
      .find(query)
      .sort({ createdAt: -1 })
      .populate('institutionId', 'name code type status')
      .exec();
  }
}
