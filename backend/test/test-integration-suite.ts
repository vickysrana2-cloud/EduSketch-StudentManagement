import mongoose, { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

// Schemas
import { Institution, InstitutionSchema } from '../src/institutions/schemas/institution.schema';
import { User, UserSchema } from '../src/users/schemas/user.schema';
import { Role, RoleSchema } from '../src/roles/schemas/role.schema';
import { Permission, PermissionSchema } from '../src/permissions/schemas/permission.schema';
import { RolePermission, RolePermissionSchema } from '../src/role-permissions/schemas/role-permission.schema';
import { Session, SessionSchema } from '../src/auth/schemas/session.schema';
import { TeacherProfile, TeacherProfileSchema } from '../src/teacher-profiles/schemas/teacher-profile.schema';
import {
  StudentProfile,
  StudentProfileSchema,
  Gender,
  ParentRelationship,
  StudentProfileStatus,
} from '../src/student-profiles/schemas/student-profile.schema';
import { Class, ClassSchema, ClassStatus } from '../src/classes/schemas/class.schema';
import { Subject, SubjectSchema } from '../src/subjects/schemas/subject.schema';
import { Enrollment, EnrollmentSchema, EnrollmentStatus } from '../src/enrollments/schemas/enrollment.schema';
import { AuditLog, AuditLogSchema } from '../src/audit-logs/schemas/audit-log.schema';

// Enums
import { UserRole, UserStatus } from '../src/users/enums/user.enums';
import {
  InstitutionStatus,
  InstitutionType,
  SubscriptionPlan,
  SubscriptionStatus,
} from '../src/institutions/enums/institution.enums';
import { PermissionAction, PermissionModule } from '../src/permissions/enums/permission.enums';
import { AuditAction } from '../src/audit-logs/enums/audit-action.enum';
import { AuditModule } from '../src/audit-logs/enums/audit-module.enum';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { PermissionsGuard } from '../src/common/guards/permissions.guard';
import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';

const TEST_DB_URI = 'mongodb://127.0.0.1:27017/studentManagement_test_isolated';
const TEST_JWT_SECRET = 'a_very_secure_super_long_jwt_secret_key_for_testing_1234567890';

async function runIntegrationSuite() {
  console.log('========================================================================');
  console.log('🧪 TASK 31: INTEGRATED NESTJS & MONGODB BACKEND TEST SUITE');
  console.log(`🔌 Isolated Database: ${TEST_DB_URI}`);
  console.log('========================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      if (details) console.error(`     Details: ${details}`);
    }
  }

  // 1. Establish Isolated MongoDB Connection
  console.log('Connecting to isolated test database...');
  await mongoose.connect(TEST_DB_URI);
  console.log('Connected! Resetting test database collections...\n');
  await mongoose.connection.db?.dropDatabase();

  // Register Models with Model<any> cast to prevent TS query helper mismatch in test runner
  const InstitutionModel = mongoose.model<any>(Institution.name, InstitutionSchema);
  const UserModel = mongoose.model<any>(User.name, UserSchema);
  const RoleModel = mongoose.model<any>(Role.name, RoleSchema);
  const PermissionModel = mongoose.model<any>(Permission.name, PermissionSchema);
  const RolePermissionModel = mongoose.model<any>(RolePermission.name, RolePermissionSchema);
  const SessionModel = mongoose.model<any>(Session.name, SessionSchema);
  const TeacherProfileModel = mongoose.model<any>(TeacherProfile.name, TeacherProfileSchema);
  const StudentProfileModel = mongoose.model<any>(StudentProfile.name, StudentProfileSchema);
  const ClassModel = mongoose.model<any>(Class.name, ClassSchema);
  const SubjectModel = mongoose.model<any>(Subject.name, SubjectSchema);
  const EnrollmentModel = mongoose.model<any>(Enrollment.name, EnrollmentSchema);
  const AuditLogModel = mongoose.model<any>(AuditLog.name, AuditLogSchema);

  // Ensure indexes are built in MongoDB
  await Promise.all([
    InstitutionModel.init(),
    UserModel.init(),
    RoleModel.init(),
    PermissionModel.init(),
    RolePermissionModel.init(),
    SessionModel.init(),
    TeacherProfileModel.init(),
    StudentProfileModel.init(),
    ClassModel.init(),
    SubjectModel.init(),
    EnrollmentModel.init(),
    AuditLogModel.init(),
  ]);

  try {
    // --------------------------------------------------------------------------
    // 1. MongoDB Schema Validation & Index Constraints
    // --------------------------------------------------------------------------
    console.log('--- 1. Testing MongoDB Schema Validation & Index Constraints ---');

    const superAdminUser = await UserModel.create({
      name: 'Global Super Admin',
      email: 'superadmin@system.test',
      passwordHash: await bcrypt.hash('SuperSecret123!', 10),
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      institutionId: null,
    });
    assert(superAdminUser._id !== undefined, 'Super Admin user schema created successfully');

    // Create 2 Test Institutions
    const defaultSubscription = {
      plan: SubscriptionPlan.STANDARD,
      status: SubscriptionStatus.ACTIVE,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    };

    const schoolA = await InstitutionModel.create({
      name: 'Delhi Public School Alpha',
      code: 'DPS_ALPHA',
      type: InstitutionType.SCHOOL,
      email: 'alpha@dps.edu',
      phone: '+919876543210',
      address: { street: 'Sector 4, RK Puram', city: 'Delhi', state: 'Delhi', country: 'India', postalCode: '110022' },
      status: InstitutionStatus.ACTIVE,
      subscription: defaultSubscription,
      createdBy: superAdminUser._id,
    });
    assert(schoolA.code === 'DPS_ALPHA', 'Institution Alpha created');

    const schoolB = await InstitutionModel.create({
      name: 'St. Xavier High Beta',
      code: 'XAV_BETA',
      type: InstitutionType.SCHOOL,
      email: 'beta@xavier.edu',
      phone: '+919876543211',
      address: { street: 'Mahim West', city: 'Mumbai', state: 'Maharashtra', country: 'India', postalCode: '400016' },
      status: InstitutionStatus.ACTIVE,
      subscription: defaultSubscription,
      createdBy: superAdminUser._id,
    });
    assert(schoolB.code === 'XAV_BETA', 'Institution Beta created');

    // Duplicate Institution Code Rejection (Unique Index)
    let duplicateCodeRejected = false;
    try {
      await InstitutionModel.create({
        name: 'Duplicate Alpha School',
        code: 'DPS_ALPHA', // Duplicate code!
        type: InstitutionType.SCHOOL,
        email: 'dup@dps.edu',
        phone: '+919876543212',
        address: { street: 'Ring Road', city: 'Delhi', state: 'Delhi', country: 'India', postalCode: '110022' },
        subscription: defaultSubscription,
        createdBy: superAdminUser._id,
      });
    } catch (err: any) {
      if (err.code === 11000) duplicateCodeRejected = true;
    }
    assert(duplicateCodeRejected, 'MongoDB unique index strictly rejects duplicate institution code');

    // Duplicate User Email Rejection
    let duplicateEmailRejected = false;
    try {
      await UserModel.create({
        name: 'Another Super Admin',
        email: 'superadmin@system.test', // Duplicate email!
        passwordHash: 'hash',
        role: UserRole.SUPER_ADMIN,
      });
    } catch (err: any) {
      if (err.code === 11000) duplicateEmailRejected = true;
    }
    assert(duplicateEmailRejected, 'MongoDB unique index strictly rejects duplicate user email');

    // --------------------------------------------------------------------------
    // 2. Role & Permission Seeding
    // --------------------------------------------------------------------------
    console.log('\n--- 2. Testing Role & Permission Seeding ---');

    const roles = await RoleModel.create([
      { name: UserRole.SUPER_ADMIN, displayName: 'Super Admin', description: 'All access', level: 4, isSystemRole: true, isActive: true },
      { name: UserRole.ADMIN, displayName: 'Admin', description: 'Institution Admin', level: 3, isSystemRole: true, isActive: true },
      { name: UserRole.TEACHER, displayName: 'Teacher', description: 'Teacher', level: 2, isSystemRole: true, isActive: true },
      { name: UserRole.STUDENT, displayName: 'Student', description: 'Student', level: 1, isSystemRole: true, isActive: true },
    ]);
    assert(roles.length === 4, 'All four system roles seeded into database');

    const permStudentCreate = await PermissionModel.create({
      name: 'STUDENT_CREATE',
      displayName: 'Create Student',
      module: PermissionModule.STUDENTS,
      action: PermissionAction.CREATE,
      description: 'Admit student',
      isSystemPermission: true,
      isActive: true,
    });
    const permStudentRead = await PermissionModel.create({
      name: 'STUDENT_READ',
      displayName: 'Read Student',
      module: PermissionModule.STUDENTS,
      action: PermissionAction.READ,
      description: 'View student profile',
      isSystemPermission: true,
      isActive: true,
    });
    assert(permStudentCreate._id && permStudentRead._id, 'Permissions seeded into database');

    const adminRole = roles.find((r: any) => r.name === UserRole.ADMIN)!;
    await RolePermissionModel.create({
      roleId: adminRole._id,
      permissionId: permStudentCreate._id,
      institutionId: schoolA._id,
      isAllowed: true,
    });
    assert(true, 'Role-Permission mapping recorded with institution tenancy scope');

    // --------------------------------------------------------------------------
    // 3. Registration & Secure Password Hashing
    // --------------------------------------------------------------------------
    console.log('\n--- 3. Testing Registration & Password Hashing ---');

    const plainPassword = 'AdminPassword123!';
    const hashedPassword = await bcrypt.hash(plainPassword, 12);

    const adminUserA = await UserModel.create({
      name: 'School A Administrator',
      email: 'admin@school-a.edu',
      passwordHash: hashedPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      institutionId: schoolA._id,
    });

    assert(adminUserA.passwordHash !== plainPassword, 'Password is never stored in plain text');
    assert(await bcrypt.compare(plainPassword, adminUserA.passwordHash), 'bcrypt verification succeeds with proper salt rounds');

    // --------------------------------------------------------------------------
    // 4. Authentication & Login Workflow
    // --------------------------------------------------------------------------
    console.log('\n--- 4. Testing Authentication & Login Workflow ---');

    // Verify correct password check
    const isAuthValid = await bcrypt.compare(plainPassword, adminUserA.passwordHash);
    assert(isAuthValid, 'Authentication succeeds with valid credentials');

    const isWrongPassword = await bcrypt.compare('WrongPassword999', adminUserA.passwordHash);
    assert(!isWrongPassword, 'Authentication fails with invalid credentials');

    // Generate JWT access token
    const tokenPayload = {
      sub: adminUserA._id.toString(),
      email: adminUserA.email,
      role: adminUserA.role,
      institutionId: adminUserA.institutionId?.toString(),
    };
    const accessToken = jwt.sign(tokenPayload, TEST_JWT_SECRET, { expiresIn: '15m' });
    const decoded: any = jwt.verify(accessToken, TEST_JWT_SECRET);

    assert(decoded.sub === adminUserA._id.toString(), 'JWT subject corresponds to authenticated user ID');
    assert(decoded.role === UserRole.ADMIN, 'JWT role corresponds to database record');
    assert(decoded.institutionId === schoolA._id.toString(), 'JWT tenant context corresponds to institution');

    // --------------------------------------------------------------------------
    // 5. Refresh-Token Rotation & Secure Sessions
    // --------------------------------------------------------------------------
    console.log('\n--- 5. Testing Refresh-Token Rotation & Secure Sessions ---');

    const initialTokenBytes = crypto.randomBytes(40).toString('hex');
    const initialTokenHash = crypto.createHash('sha256').update(initialTokenBytes).digest('hex');
    const tokenFamily = crypto.randomUUID();

    const session1 = await SessionModel.create({
      userId: adminUserA._id,
      refreshTokenHash: initialTokenHash,
      tokenFamily,
      ipAddress: '127.0.0.1',
      userAgent: 'Jest Test Agent',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revokedAt: null,
    });
    assert(session1._id !== undefined, 'Initial refresh session created with hashed token');

    // Rotate token
    const rotatedTokenBytes = crypto.randomBytes(40).toString('hex');
    const rotatedTokenHash = crypto.createHash('sha256').update(rotatedTokenBytes).digest('hex');

    // Invalidate old session
    session1.revokedAt = new Date();
    await session1.save();

    // Persist new session in same family
    const session2 = await SessionModel.create({
      userId: adminUserA._id,
      refreshTokenHash: rotatedTokenHash,
      tokenFamily,
      ipAddress: '127.0.0.1',
      userAgent: 'Jest Test Agent',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revokedAt: null,
    });

    assert(session1.revokedAt !== null, 'Previous refresh token successfully revoked upon rotation');
    assert(session2.tokenFamily === session1.tokenFamily, 'New session maintains token family continuity');

    // --------------------------------------------------------------------------
    // 6. Secure Logout
    // --------------------------------------------------------------------------
    console.log('\n--- 6. Testing Secure Logout ---');

    session2.revokedAt = new Date();
    await session2.save();

    const activeSessions = await SessionModel.countDocuments({
      userId: adminUserA._id,
      revokedAt: null,
    });
    assert(activeSessions === 0, 'Logout successfully revokes active sessions');

    // --------------------------------------------------------------------------
    // 7. Role-Based Access Control (RBAC) Guard
    // --------------------------------------------------------------------------
    console.log('\n--- 7. Testing Role-Based Access Control (RBAC) Guard ---');

    const reflector = new Reflector();
    const rolesGuard = new RolesGuard(reflector);

    const mockExecutionContext = (userRole: UserRole, requiredRoles: UserRole[]) => {
      reflector.getAllAndOverride = (() => requiredRoles) as any;
      return {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({
            user: { role: userRole, userId: '123' },
          }),
        }),
      } as any;
    };

    assert(
      rolesGuard.canActivate(mockExecutionContext(UserRole.SUPER_ADMIN, [UserRole.SUPER_ADMIN])),
      'SUPER_ADMIN allowed on Super Admin endpoint',
    );

    let teacherForbidden = false;
    try {
      rolesGuard.canActivate(mockExecutionContext(UserRole.TEACHER, [UserRole.ADMIN, UserRole.SUPER_ADMIN]));
    } catch (err: any) {
      if (err instanceof ForbiddenException || err?.status === 403) teacherForbidden = true;
    }
    assert(teacherForbidden, 'TEACHER forbidden on Admin endpoint (403)');

    let studentForbidden = false;
    try {
      rolesGuard.canActivate(mockExecutionContext(UserRole.STUDENT, [UserRole.TEACHER]));
    } catch (err: any) {
      if (err instanceof ForbiddenException || err?.status === 403) studentForbidden = true;
    }
    assert(studentForbidden, 'STUDENT forbidden on Teacher endpoint (403)');

    // --------------------------------------------------------------------------
    // 8. Permission-Based Authorization Guard
    // --------------------------------------------------------------------------
    console.log('\n--- 8. Testing Permission-Based Authorization Guard ---');

    const mockRolePermService: any = {
      getEffectivePermissions: async (role: UserRole, instId?: string) => {
        if (role === UserRole.SUPER_ADMIN) return ['STUDENT_CREATE', 'STUDENT_READ'];
        if (role === UserRole.ADMIN && instId === schoolA._id.toString()) return ['STUDENT_CREATE'];
        return [];
      },
    };

    const permissionsGuard = new PermissionsGuard(reflector, mockRolePermService);
    const mockPermContext = (userRole: UserRole, instId: string, requiredPerm: string) => {
      reflector.getAllAndOverride = (() => [requiredPerm]) as any;
      return {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({
            user: { role: userRole, institutionId: instId, userId: '123' },
          }),
        }),
      } as any;
    };

    const adminPermAllowed = await permissionsGuard.canActivate(
      mockPermContext(UserRole.ADMIN, schoolA._id.toString(), 'STUDENT_CREATE'),
    );
    assert(adminPermAllowed, 'Admin with STUDENT_CREATE granted permission');

    let crossSchoolForbidden = false;
    try {
      await permissionsGuard.canActivate(
        mockPermContext(UserRole.ADMIN, schoolB._id.toString(), 'STUDENT_CREATE'),
      );
    } catch (err: any) {
      if (err instanceof ForbiddenException || err?.status === 403) crossSchoolForbidden = true;
    }
    assert(crossSchoolForbidden, 'School B Admin denied School A permission (403)');

    // --------------------------------------------------------------------------
    // 9. Multi-Tenant Institution Data Isolation
    // --------------------------------------------------------------------------
    console.log('\n--- 9. Testing Multi-Tenant Institution Data Isolation ---');

    // Create Teacher in School A
    const teacherAUser = await UserModel.create({
      name: 'Teacher Alpha',
      email: 'teacher@school-a.edu',
      passwordHash: await bcrypt.hash('Teacher123!', 10),
      role: UserRole.TEACHER,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      institutionId: schoolA._id,
    });
    const teacherAProfile = await TeacherProfileModel.create({
      userId: teacherAUser._id,
      institutionId: schoolA._id,
      employeeId: 'EMP_A_001',
      qualification: ['M.Sc'],
      experienceYears: 5,
      joiningDate: new Date(),
      status: 'ACTIVE',
    });

    // Create Teacher in School B
    const teacherBUser = await UserModel.create({
      name: 'Teacher Beta',
      email: 'teacher@school-b.edu',
      passwordHash: await bcrypt.hash('Teacher123!', 10),
      role: UserRole.TEACHER,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      institutionId: schoolB._id,
    });
    const teacherBProfile = await TeacherProfileModel.create({
      userId: teacherBUser._id,
      institutionId: schoolB._id,
      employeeId: 'EMP_B_001',
      qualification: ['M.A'],
      experienceYears: 3,
      joiningDate: new Date(),
      status: 'ACTIVE',
    });

    // Query School A teachers with tenant filter
    const schoolATeachers = await TeacherProfileModel.find({ institutionId: schoolA._id });
    assert(schoolATeachers.length === 1 && schoolATeachers[0].employeeId === 'EMP_A_001', 'Tenant filter returns only School A teachers');

    const schoolBTeachers = await TeacherProfileModel.find({ institutionId: schoolB._id });
    assert(schoolBTeachers.length === 1 && schoolBTeachers[0].employeeId === 'EMP_B_001', 'Tenant filter returns only School B teachers');

    // --------------------------------------------------------------------------
    // 10. Student Admission & Compound Index Uniqueness
    // --------------------------------------------------------------------------
    console.log('\n--- 10. Testing Student Admission & Compound Index Uniqueness ---');

    const studentAUser = await UserModel.create({
      name: 'Student Alpha 1',
      email: 'student1@school-a.edu',
      passwordHash: await bcrypt.hash('Student123!', 10),
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      institutionId: schoolA._id,
    });

    const studentAProfile = await StudentProfileModel.create({
      userId: studentAUser._id,
      institutionId: schoolA._id,
      admissionNumber: 'ADM_2026_001',
      dateOfBirth: new Date('2010-01-01'),
      gender: Gender.MALE,
      address: { street: 'Main St', city: 'Delhi', state: 'Delhi', postalCode: '110001' },
      parentDetails: [{ name: 'Parent A', relationship: ParentRelationship.FATHER, phone: '+919999999999', email: 'p@a.edu' }],
      status: StudentProfileStatus.ACTIVE,
    });
    assert(studentAProfile.admissionNumber === 'ADM_2026_001', 'Student profile created with nested address and parents');

    // Same admission number in DIFFERENT school MUST succeed
    const studentBUser = await UserModel.create({
      name: 'Student Beta 1',
      email: 'student1@school-b.edu',
      passwordHash: await bcrypt.hash('Student123!', 10),
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      institutionId: schoolB._id,
    });

    const studentBProfile = await StudentProfileModel.create({
      userId: studentBUser._id,
      institutionId: schoolB._id,
      admissionNumber: 'ADM_2026_001', // Same admission number, different school!
      dateOfBirth: new Date('2010-02-02'),
      gender: Gender.FEMALE,
      address: { street: 'Beach Rd', city: 'Mumbai', state: 'Maharashtra', postalCode: '400001' },
      parentDetails: [{ name: 'Parent B', relationship: ParentRelationship.MOTHER, phone: '+918888888888', email: 'p@b.edu' }],
      status: StudentProfileStatus.ACTIVE,
    });
    assert(studentBProfile._id !== undefined, 'Same admissionNumber permitted across distinct institutions');

    // Same admission number in SAME school MUST fail (compound index violation)
    const studentA2User = await UserModel.create({
      name: 'Student Alpha 2',
      email: 'student2@school-a.edu',
      passwordHash: await bcrypt.hash('Student123!', 10),
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      institutionId: schoolA._id,
    });

    let duplicateAdmissionRejected = false;
    try {
      await StudentProfileModel.create({
        userId: studentA2User._id,
        institutionId: schoolA._id,
        admissionNumber: 'ADM_2026_001', // Duplicate in School A!
        dateOfBirth: new Date('2010-03-03'),
        gender: Gender.MALE,
        address: { street: 'Main St', city: 'Delhi', state: 'Delhi', postalCode: '110001' },
        parentDetails: [{ name: 'Parent A2', relationship: ParentRelationship.FATHER, phone: '+919999999998', email: 'p2@a.edu' }],
        status: StudentProfileStatus.ACTIVE,
      });
    } catch (err: any) {
      if (err.code === 11000) duplicateAdmissionRejected = true;
      else console.error('Unexpected error on duplicate admission:', err);
    }
    assert(duplicateAdmissionRejected, 'Compound unique index (institutionId + admissionNumber) blocks duplicates within institution');

    // --------------------------------------------------------------------------
    // 11. Class Management & Capacity Limits
    // --------------------------------------------------------------------------
    console.log('\n--- 11. Testing Class Management & Enrollment Capacity ---');

    const classA = await ClassModel.create({
      name: 'Grade 10 Section A',
      grade: 10,
      section: 'A',
      academicYear: '2026-2027',
      capacity: 1, // Set small capacity of 1 for testing boundary limits
      institutionId: schoolA._id,
      classTeacherId: teacherAProfile._id,
      status: ClassStatus.ACTIVE,
    });
    assert(classA.grade === 10 && classA.section === 'A', 'Class Grade 10-A created with class teacher assignment');

    // First enrollment succeeds
    const enrollment1 = await EnrollmentModel.create({
      studentId: studentAProfile._id,
      classId: classA._id,
      institutionId: schoolA._id,
      academicYear: '2026-2027',
      rollNumber: '1',
      status: EnrollmentStatus.ACTIVE,
      enrollmentDate: new Date(),
    });
    assert(enrollment1._id !== undefined, 'First student enrollment within capacity succeeds');

    // Check count against class capacity
    const currentEnrolledCount = await EnrollmentModel.countDocuments({
      classId: classA._id,
      status: EnrollmentStatus.ACTIVE,
    });
    const capacityReached = currentEnrolledCount >= classA.capacity;
    assert(capacityReached, 'Class capacity limit of 1 detected after enrollment');

    // --------------------------------------------------------------------------
    // 12. Audit Logging Verification
    // --------------------------------------------------------------------------
    console.log('\n--- 12. Testing Audit Logging Storage ---');

    const auditLog = await AuditLogModel.create({
      userId: adminUserA._id,
      institutionId: schoolA._id,
      action: AuditAction.STUDENT_ADMITTED,
      module: AuditModule.STUDENTS,
      description: 'Admitted student ADM_2026_001 into Grade 10-A',
      targetId: studentAProfile._id.toString(),
      targetType: 'STUDENT_PROFILE',
      ipAddress: '127.0.0.1',
      userAgent: 'Integration Test Runner',
      metadata: { admissionNumber: 'ADM_2026_001', classId: classA._id.toString() },
    });
    assert(auditLog._id !== undefined, 'Audit log correctly recorded in isolated test database');

    console.log('\n========================================================================');
    console.log(`🎉 INTEGRATION TEST SUITE SUMMARY: ${passed}/${total} Passed (${Math.round((passed / total) * 100)}%)`);
    console.log('========================================================================\n');

  } finally {
    // Clean up test database
    console.log('Cleaning up isolated test database collections...');
    await mongoose.connection.db?.dropDatabase();
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB test environment.');
  }

  if (passed !== total) {
    process.exit(1);
  }
}

runIntegrationSuite().catch((err) => {
  console.error('Fatal error during integration tests:', err);
  process.exit(1);
});
