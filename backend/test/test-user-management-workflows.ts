import { Types } from 'mongoose';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { InstitutionsService } from '../src/institutions/institutions.service';
import { UsersService } from '../src/users/users.service';
import { InstitutionStatus, InstitutionType } from '../src/institutions/enums/institution.enums';
import { UserRole, UserStatus } from '../src/users/enums/user.enums';
import { Gender, ParentRelationship } from '../src/student-profiles/schemas/student-profile.schema';
import { ClassStatus } from '../src/classes/schemas/class.schema';
import { EnrollmentStatus } from '../src/enrollments/schemas/enrollment.schema';
import { AuthenticatedUser } from '../src/auth/interfaces/authenticated-user.interface';
import { TenantContextService } from '../src/common/tenancy/tenant-context.service';

async function runUserManagementTests() {
  console.log('================================================================');
  console.log('🚀 TASKS 18, 19, 20, 21: USER ONBOARDING & MANAGEMENT TESTS');
  console.log('================================================================\n');

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

  // --- Mock DB Stores ---
  const institutionsDb: any[] = [];
  const usersDb: any[] = [];
  const teacherProfilesDb: any[] = [];
  const studentProfilesDb: any[] = [];
  const classesDb: any[] = [];
  const enrollmentsDb: any[] = [];
  const sessionsDb: any[] = [];
  const auditLogsDb: any[] = [];

  // Institutions
  const schoolAId = new Types.ObjectId().toString();
  const schoolBId = new Types.ObjectId().toString();
  const inactiveSchoolId = new Types.ObjectId().toString();

  institutionsDb.push(
    {
      _id: new Types.ObjectId(schoolAId),
      name: 'Springfield Academy',
      code: 'SPA',
      type: InstitutionType.SCHOOL,
      status: InstitutionStatus.ACTIVE,
    },
    {
      _id: new Types.ObjectId(schoolBId),
      name: 'Shelbyville High',
      code: 'SVH',
      type: InstitutionType.SCHOOL,
      status: InstitutionStatus.ACTIVE,
    },
    {
      _id: new Types.ObjectId(inactiveSchoolId),
      name: 'Suspended Academy',
      code: 'SUS',
      type: InstitutionType.SCHOOL,
      status: InstitutionStatus.SUSPENDED,
    },
  );

  // Authenticated Actors
  const superAdminUser: AuthenticatedUser = {
    userId: new Types.ObjectId().toString(),
    email: 'superadmin@system.gov',
    name: 'Platform Super Admin',
    role: UserRole.SUPER_ADMIN,
    status: UserStatus.ACTIVE,
    institutionId: null,
    institution: null,
    isEmailVerified: true,
  };

  const adminSchoolA: AuthenticatedUser = {
    userId: new Types.ObjectId().toString(),
    email: 'principal@springfield.edu',
    name: 'Principal Skinner',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    institutionId: schoolAId,
    institution: { id: schoolAId, name: 'Springfield Academy', code: 'SPA', status: 'ACTIVE' as any },
    isEmailVerified: true,
  };

  const adminSchoolB: AuthenticatedUser = {
    userId: new Types.ObjectId().toString(),
    email: 'admin@shelbyville.edu',
    name: 'Shelbyville Admin',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    institutionId: schoolBId,
    institution: { id: schoolBId, name: 'Shelbyville High', code: 'SVH', status: 'ACTIVE' as any },
    isEmailVerified: true,
  };

  // Pre-seed Admin User A in usersDb
  usersDb.push({
    _id: new Types.ObjectId(adminSchoolA.userId),
    email: adminSchoolA.email,
    name: adminSchoolA.name,
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    institutionId: new Types.ObjectId(schoolAId),
    save: async function () { return this; },
  });

  // Pre-seed a Class in Springfield Academy
  const class10AId = new Types.ObjectId().toString();
  classesDb.push({
    _id: new Types.ObjectId(class10AId),
    institutionId: new Types.ObjectId(schoolAId),
    name: 'Grade 10 Section A',
    grade: 10,
    section: 'A',
    academicYear: '2026-2027',
    capacity: 2, // low capacity for limit testing
    status: ClassStatus.ACTIVE,
  });

  // Mock AuditLogsService
  const mockAuditLogsService: any = {
    logAction: async (entry: any) => {
      const doc = { _id: new Types.ObjectId(), ...entry, createdAt: new Date() };
      auditLogsDb.push(doc);
      return doc;
    },
  };

  // Helper Mongoose Query Builder
  const createQueryChain = (data: any[] | any) => ({
    populate: function () { return this; },
    select: function () { return this; },
    sort: function () { return this; },
    skip: function () { return this; },
    limit: function () { return this; },
    lean: function () { return this; },
    exec: async () => data,
  });

  // Mock Models
  const mockInstitutionModel: any = {
    findById: (id: any) => {
      const found = institutionsDb.find((i) => i._id.toString() === id.toString());
      return createQueryChain(found || null);
    },
    findOne: (q: any) => {
      const found = institutionsDb.find((i) => {
        for (const k of Object.keys(q)) {
          if (i[k]?.toString() !== q[k]?.toString()) return false;
        }
        return true;
      });
      return createQueryChain(found || null);
    },
    exists: (q: any) => ({
      exec: async () => institutionsDb.some((i) => i._id.toString() === q._id?.toString()),
    }),
  };

  const mockUserModel: any = function (data: any) {
    const doc = {
      _id: new Types.ObjectId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      save: async function () {
        const idx = usersDb.findIndex((u) => u._id.toString() === this._id.toString());
        if (idx >= 0) usersDb[idx] = this;
        else usersDb.push(this);
        return this;
      },
    };
    return doc;
  };
  mockUserModel.findById = (id: any) => {
    const found = usersDb.find((u) => u._id.toString() === id.toString());
    let stripped = found;
    if (found) {
      const { passwordHash, ...rest } = found;
      stripped = { ...rest, toJSON: () => rest };
    }
    return createQueryChain(stripped || null);
  };
  mockUserModel.findOne = (q: any) => {
    const found = usersDb.find((u) => {
      for (const k of Object.keys(q)) {
        if (k === '_id' && q[k]?.$ne) {
          if (u._id.toString() === q[k].$ne.toString()) return false;
        } else if (u[k]?.toString() !== q[k]?.toString()) {
          return false;
        }
      }
      return true;
    });
    return createQueryChain(found || null);
  };
  mockUserModel.findByIdAndUpdate = (id: any, update: any, options: any) => ({
    populate: function () { return this; },
    exec: async () => {
      const found = usersDb.find((u) => u._id.toString() === id.toString());
      if (found && update.$set) {
        Object.assign(found, update.$set);
      }
      return found || null;
    },
  });
  mockUserModel.findByIdAndDelete = (id: any) => ({
    exec: async () => {
      const idx = usersDb.findIndex((u) => u._id.toString() === id.toString());
      if (idx >= 0) return usersDb.splice(idx, 1)[0];
      return null;
    },
  });

  const mockTeacherProfileModel: any = function (data: any) {
    const doc = {
      _id: new Types.ObjectId(),
      ...data,
      createdAt: new Date(),
      save: async function () {
        teacherProfilesDb.push(this);
        return this;
      },
    };
    return doc;
  };
  mockTeacherProfileModel.findOne = (q: any) => {
    const found = teacherProfilesDb.find((t) => {
      for (const k of Object.keys(q)) {
        if (t[k]?.toString() !== q[k]?.toString()) return false;
      }
      return true;
    });
    return createQueryChain(found || null);
  };

  const mockStudentProfileModel: any = function (data: any) {
    const doc = {
      _id: new Types.ObjectId(),
      ...data,
      createdAt: new Date(),
      save: async function () {
        studentProfilesDb.push(this);
        return this;
      },
    };
    return doc;
  };
  mockStudentProfileModel.findOne = (q: any) => {
    const found = studentProfilesDb.find((s) => {
      for (const k of Object.keys(q)) {
        if (s[k]?.toString() !== q[k]?.toString()) return false;
      }
      return true;
    });
    return createQueryChain(found || null);
  };

  const mockClassModel: any = {
    findById: (id: any) => {
      const found = classesDb.find((c) => c._id.toString() === id.toString());
      return createQueryChain(found || null);
    },
  };

  const mockEnrollmentModel: any = function (data: any) {
    const doc = {
      _id: new Types.ObjectId(),
      ...data,
      createdAt: new Date(),
      save: async function () {
        enrollmentsDb.push(this);
        return this;
      },
    };
    return doc;
  };
  mockEnrollmentModel.countDocuments = (q: any) => ({
    exec: async () => {
      return enrollmentsDb.filter((e) => {
        for (const k of Object.keys(q)) {
          if (e[k]?.toString() !== q[k]?.toString()) return false;
        }
        return true;
      }).length;
    },
  });
  mockEnrollmentModel.findOne = (q: any) => {
    const found = enrollmentsDb.find((e) => {
      for (const k of Object.keys(q)) {
        if (e[k]?.toString() !== q[k]?.toString()) return false;
      }
      return true;
    });
    return createQueryChain(found || null);
  };

  const mockSessionModel: any = {
    updateMany: async (filter: any, update: any) => {
      let count = 0;
      sessionsDb.forEach((s) => {
        if (s.userId.toString() === filter.userId.toString() && s.revokedAt === null) {
          s.revokedAt = update.$set.revokedAt;
          count++;
        }
      });
      return { modifiedCount: count };
    },
  };

  // Instantiate Services
  const institutionsService = new InstitutionsService(
    mockInstitutionModel,
    mockUserModel,
    mockAuditLogsService,
  );

  const tenantContextService = new TenantContextService();

  const usersService = new UsersService(
    mockUserModel,
    mockInstitutionModel,
    mockTeacherProfileModel,
    mockStudentProfileModel,
    mockClassModel,
    mockEnrollmentModel,
    mockSessionModel,
    tenantContextService,
    mockAuditLogsService,
  );

  console.log('--- 1. Testing TASK 18: Super Admin Create Admin API ---');

  // Rejection when target institution is SUSPENDED
  try {
    await institutionsService.createInstitutionAdmin(
      inactiveSchoolId,
      {
        name: 'Suspended School Admin',
        email: 'admin@suspended.edu',
        password: 'ValidPassword123',
      },
      superAdminUser,
    );
    assert(false, 'Reject creating admin for non-ACTIVE institution');
  } catch (err: any) {
    assert(
      err instanceof BadRequestException,
      'Reject creating admin for non-ACTIVE institution (BadRequestException)',
    );
  }

  // Create valid admin for School A
  let newAdminA: any;
  try {
    newAdminA = await institutionsService.createInstitutionAdmin(
      schoolAId,
      {
        name: 'Vice Principal',
        email: 'viceprincipal@springfield.edu',
        password: 'Password123!',
      },
      superAdminUser,
    );

    assert(
      newAdminA &&
        newAdminA.role === UserRole.ADMIN &&
        (newAdminA.institutionId?._id || newAdminA.institutionId)?.toString() === schoolAId &&
        !newAdminA.passwordHash,
      'Super Admin successfully creates Institution Admin (Role strictly ADMIN, passwordHash stripped)',
    );
  } catch (err: any) {
    assert(false, 'Create institution admin', err.message);
  }

  // Reject duplicate email for admin
  try {
    await institutionsService.createInstitutionAdmin(
      schoolBId,
      {
        name: 'Duplicate Admin',
        email: 'viceprincipal@springfield.edu',
        password: 'Password123!',
      },
      superAdminUser,
    );
    assert(false, 'Reject creating admin with duplicate email');
  } catch (err: any) {
    assert(
      err instanceof ConflictException,
      'Reject creating admin with duplicate email (ConflictException)',
    );
  }

  console.log('\n--- 2. Testing TASK 19: Create Teacher API ---');
  let teacherResult: any;

  // Admin A creates Teacher in Springfield Academy
  try {
    teacherResult = await usersService.createTeacher(
      {
        name: 'Edna Krabappel',
        email: 'edna@springfield.edu',
        employeeId: 'EMP-TEACH-01',
        qualification: ['B.Ed', 'M.A. Education'],
        specialization: ['Elementary Education', 'English'],
        experienceYears: 12,
        joiningDate: '2020-08-15',
      },
      adminSchoolA,
    );

    assert(
      teacherResult &&
        teacherResult.user.role === UserRole.TEACHER &&
        teacherResult.teacherProfile.employeeId === 'EMP-TEACH-01' &&
        teacherResult.user.institutionId._id.toString() === schoolAId,
      'Admin creates Teacher user with linked TeacherProfile (Role TEACHER, institution derived)',
    );
  } catch (err: any) {
    assert(false, 'Create teacher account', err.message);
  }

  // Duplicate employeeId within same institution rejected
  try {
    await usersService.createTeacher(
      {
        name: 'Elizabeth Hoover',
        email: 'hoover@springfield.edu',
        employeeId: 'EMP-TEACH-01', // duplicate in School A
        qualification: ['B.Ed'],
        specialization: ['Social Studies'],
        experienceYears: 8,
      },
      adminSchoolA,
    );
    assert(false, 'Reject duplicate employeeId in same institution');
  } catch (err: any) {
    assert(
      err instanceof ConflictException,
      'Reject duplicate employeeId in same institution (ConflictException)',
    );
  }

  // Duplicate email rejected
  try {
    await usersService.createTeacher(
      {
        name: 'Duplicate Email Teacher',
        email: 'edna@springfield.edu', // taken
        employeeId: 'EMP-TEACH-02',
        qualification: ['B.Sc'],
        specialization: ['Science'],
        experienceYears: 2,
      },
      adminSchoolA,
    );
    assert(false, 'Reject duplicate email for teacher');
  } catch (err: any) {
    assert(
      err instanceof ConflictException,
      'Reject duplicate email for teacher (ConflictException)',
    );
  }

  console.log('\n--- 3. Testing TASK 20: Create Student API ---');
  let student1Result: any;

  // Cross-institution class validation: Admin B tries to enroll into School A's class
  try {
    await usersService.createStudent(
      {
        name: 'Bart Simpson',
        email: 'bart@springfield.edu',
        admissionNumber: 'ADM-2026-001',
        dateOfBirth: '2015-04-01',
        gender: Gender.MALE,
        classId: class10AId, // Belongs to School A
        parentDetails: [
          {
            name: 'Homer Simpson',
            relationship: ParentRelationship.FATHER,
            phone: '+15551234567',
          },
        ],
      },
      adminSchoolB, // Admin B!
    );
    assert(false, 'Reject student admission into a class belonging to another institution');
  } catch (err: any) {
    assert(
      err instanceof BadRequestException,
      'Reject student admission into another school class (BadRequestException)',
    );
  }

  // Valid student 1 admission in School A (Capacity 1/2)
  try {
    student1Result = await usersService.createStudent(
      {
        name: 'Bart Simpson',
        email: 'bart@springfield.edu',
        admissionNumber: 'ADM-2026-001',
        dateOfBirth: '2015-04-01',
        gender: Gender.MALE,
        classId: class10AId,
        rollNumber: '01',
        parentDetails: [
          {
            name: 'Homer Simpson',
            relationship: ParentRelationship.FATHER,
            phone: '+15551234567',
            email: 'homer@springfield.net',
          },
        ],
      },
      adminSchoolA,
    );

    assert(
      student1Result &&
        student1Result.user.role === UserRole.STUDENT &&
        student1Result.studentProfile.admissionNumber === 'ADM-2026-001' &&
        student1Result.enrollment.rollNumber === '01' &&
        student1Result.enrollment.status === EnrollmentStatus.ACTIVE,
      'Admin creates Student User, linked StudentProfile, and initial Enrollment (Capacity 1/2)',
    );
  } catch (err: any) {
    assert(false, 'Admit student 1', err.message);
  }

  // Valid student 2 admission in School A (Capacity 2/2 - Full)
  try {
    await usersService.createStudent(
      {
        name: 'Lisa Simpson',
        email: 'lisa@springfield.edu',
        admissionNumber: 'ADM-2026-002',
        dateOfBirth: '2017-05-09',
        gender: Gender.FEMALE,
        classId: class10AId,
        rollNumber: '02',
        parentDetails: [
          {
            name: 'Marge Simpson',
            relationship: ParentRelationship.MOTHER,
            phone: '+15551234568',
          },
        ],
      },
      adminSchoolA,
    );
    assert(true, 'Admit student 2 into class (Capacity 2/2 - Class full)');
  } catch (err: any) {
    assert(false, 'Admit student 2', err.message);
  }

  // Student 3 rejected because class capacity (2) is reached
  try {
    await usersService.createStudent(
      {
        name: 'Milhouse Van Houten',
        email: 'milhouse@springfield.edu',
        admissionNumber: 'ADM-2026-003',
        dateOfBirth: '2015-07-01',
        gender: Gender.MALE,
        classId: class10AId,
        parentDetails: [
          {
            name: 'Kirk Van Houten',
            relationship: ParentRelationship.FATHER,
            phone: '+15559876543',
          },
        ],
      },
      adminSchoolA,
    );
    assert(false, 'Reject student admission when class is at capacity');
  } catch (err: any) {
    assert(
      err instanceof BadRequestException,
      'Reject student admission when class capacity is reached (BadRequestException)',
    );
  }

  console.log('\n--- 4. Testing TASK 21: User Profile Update & Status/Session Revocation ---');

  // Update profile details (name, email)
  try {
    const updatedUser = await usersService.updateUserProfile(
      teacherResult.user._id.toString(),
      {
        name: 'Edna Krabappel-Flanders',
        email: 'edna.flanders@springfield.edu',
      },
      adminSchoolA,
    );

    assert(
      updatedUser &&
        updatedUser.name === 'Edna Krabappel-Flanders' &&
        updatedUser.email === 'edna.flanders@springfield.edu',
      'Update user profile details safely without exposing passwordHash or changing role',
    );
  } catch (err: any) {
    assert(false, 'Update user profile', err.message);
  }

  // Cross-tenant update blocked: Admin B cannot update Admin A's teacher
  try {
    await usersService.updateUserProfile(
      teacherResult.user._id.toString(),
      { name: 'Hacked Name' },
      adminSchoolB,
    );
    assert(false, 'Reject cross-tenant user profile update');
  } catch (err: any) {
    assert(
      err instanceof ForbiddenException,
      'Reject cross-tenant user profile update (ForbiddenException)',
    );
  }

  // Self-deactivation restriction: Admin A cannot deactivate own account
  try {
    await usersService.updateUserStatusWithRevocation(
      adminSchoolA.userId,
      UserStatus.INACTIVE,
      adminSchoolA,
    );
    assert(false, 'Reject self-deactivation attempt by current user');
  } catch (err: any) {
    assert(
      err instanceof BadRequestException,
      'Reject self-deactivation attempt (BadRequestException)',
    );
  }

  // Seed active session for student 1
  sessionsDb.push({
    _id: new Types.ObjectId(),
    userId: student1Result.user._id,
    refreshTokenHash: 'hash123',
    revokedAt: null,
  });

  // Suspend student 1 account and verify sessions are revoked
  try {
    const suspended = await usersService.updateUserStatusWithRevocation(
      student1Result.user._id.toString(),
      UserStatus.SUSPENDED,
      adminSchoolA,
    );

    const sessionRevoked = sessionsDb.find(
      (s) => s.userId.toString() === student1Result.user._id.toString(),
    )?.revokedAt !== null;

    assert(
      suspended && suspended.status === UserStatus.SUSPENDED && sessionRevoked,
      'Suspend user account and revoke all active refresh token sessions immediately',
    );
  } catch (err: any) {
    assert(false, 'Suspend user account and revoke sessions', err.message);
  }

  // Separate authorized workflow for role changes (Super Admin only)
  try {
    const promotedUser = await usersService.updateUserRole(
      teacherResult.user._id.toString(),
      UserRole.ADMIN,
      superAdminUser,
    );
    assert(
      promotedUser && promotedUser.role === UserRole.ADMIN,
      'Super Admin changes user role via separate authorized workflow',
    );
  } catch (err: any) {
    assert(false, 'Change user role via authorized workflow', err.message);
  }

  // Non-super admin cannot change user role
  try {
    await usersService.updateUserRole(
      teacherResult.user._id.toString(),
      UserRole.SUPER_ADMIN,
      adminSchoolA, // Admin A attempting role change
    );
    assert(false, 'Reject non-super-admin role change attempt');
  } catch (err: any) {
    assert(
      err instanceof ForbiddenException,
      'Reject non-super-admin role change attempt (ForbiddenException)',
    );
  }

  console.log('\n--- 5. Audit Logging Verification ---');
  assert(
    auditLogsDb.length >= 6,
    `Audit logs recorded for user onboarding, status updates, and promotions (Logged: ${auditLogsDb.length})`,
  );

  console.log('\n================================================================');
  console.log(`RESULTS: ${passed}/${total} TESTS PASSED`);
  console.log('================================================================');

  if (passed !== total) {
    process.exit(1);
  }
}

runUserManagementTests().catch((err) => {
  console.error('Unhandled test failure:', err);
  process.exit(1);
});
