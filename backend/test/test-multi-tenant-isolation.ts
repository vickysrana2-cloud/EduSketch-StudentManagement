import { Types } from 'mongoose';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { TenantContextService } from '../src/common/tenancy/tenant-context.service';
import { AuditLogsService } from '../src/audit-logs/audit-logs.service';
import { UsersService } from '../src/users/users.service';
import { StudentProfilesService } from '../src/student-profiles/student-profiles.service';
import { TeacherProfilesService } from '../src/teacher-profiles/teacher-profiles.service';
import { ClassesService } from '../src/classes/classes.service';
import { SubjectsService } from '../src/subjects/subjects.service';
import { EnrollmentsService } from '../src/enrollments/enrollments.service';
import { UserRole, UserStatus } from '../src/users/enums/user.enums';
import { ClassStatus } from '../src/classes/schemas/class.schema';
import { SubjectStatus } from '../src/subjects/schemas/subject.schema';
import { EnrollmentStatus } from '../src/enrollments/schemas/enrollment.schema';
import { Gender, ParentRelationship, StudentProfileStatus } from '../src/student-profiles/schemas/student-profile.schema';
import { TeacherProfileStatus } from '../src/teacher-profiles/schemas/teacher-profile.schema';
import type { AuthenticatedUser } from '../src/auth/interfaces/authenticated-user.interface';

async function runMultiTenantIsolationTests() {
  console.log('========================================================================');
  console.log('🛡️ TASK 28: MULTI-TENANT INSTITUTION DATA ISOLATION VERIFICATION SUITE');
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

  // --- In-Memory Multi-Tenant Databases ---
  const usersDb: any[] = [];
  const institutionsDb: any[] = [];
  const studentProfilesDb: any[] = [];
  const teacherProfilesDb: any[] = [];
  const classesDb: any[] = [];
  const subjectsDb: any[] = [];
  const enrollmentsDb: any[] = [];
  const auditLogsDb: any[] = [];
  const sessionsDb: any[] = [];

  // Two Separate Tenant Institutions
  const schoolAId = new Types.ObjectId().toString(); // Alpha Academy
  const schoolBId = new Types.ObjectId().toString(); // Beta High School

  institutionsDb.push(
    { _id: new Types.ObjectId(schoolAId), name: 'Alpha Academy', code: 'ALPHA', status: 'ACTIVE' },
    { _id: new Types.ObjectId(schoolBId), name: 'Beta High School', code: 'BETA', status: 'ACTIVE' },
  );

  // Authenticated Personas
  const superAdminUser: AuthenticatedUser = {
    userId: new Types.ObjectId().toString(),
    email: 'superadmin@platform.gov',
    name: 'Platform Super Admin',
    role: UserRole.SUPER_ADMIN,
    status: UserStatus.ACTIVE,
    institutionId: null,
    institution: null,
    isEmailVerified: true,
  };

  const adminA: AuthenticatedUser = {
    userId: new Types.ObjectId().toString(),
    email: 'admin@alpha.edu',
    name: 'Alpha Admin',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    institutionId: schoolAId,
    institution: { id: schoolAId, name: 'Alpha Academy', code: 'ALPHA', status: 'ACTIVE' as any },
    isEmailVerified: true,
  };

  const adminB: AuthenticatedUser = {
    userId: new Types.ObjectId().toString(),
    email: 'admin@beta.edu',
    name: 'Beta Admin',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    institutionId: schoolBId,
    institution: { id: schoolBId, name: 'Beta High School', code: 'BETA', status: 'ACTIVE' as any },
    isEmailVerified: true,
  };

  const teacherA: AuthenticatedUser = {
    userId: new Types.ObjectId().toString(),
    email: 'teacher@alpha.edu',
    name: 'Alpha Teacher',
    role: UserRole.TEACHER,
    status: UserStatus.ACTIVE,
    institutionId: schoolAId,
    institution: { id: schoolAId, name: 'Alpha Academy', code: 'ALPHA', status: 'ACTIVE' as any },
    isEmailVerified: true,
  };

  const studentA1: AuthenticatedUser = {
    userId: new Types.ObjectId().toString(),
    email: 'student1@alpha.edu',
    name: 'Alpha Student One',
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    institutionId: schoolAId,
    institution: { id: schoolAId, name: 'Alpha Academy', code: 'ALPHA', status: 'ACTIVE' as any },
    isEmailVerified: true,
  };

  const studentA2: AuthenticatedUser = {
    userId: new Types.ObjectId().toString(),
    email: 'student2@alpha.edu',
    name: 'Alpha Student Two',
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    institutionId: schoolAId,
    institution: { id: schoolAId, name: 'Alpha Academy', code: 'ALPHA', status: 'ACTIVE' as any },
    isEmailVerified: true,
  };

  // Helper query chain builder
  const createQueryChain = (result: any) => ({
    populate: function () { return this; },
    sort: function () { return this; },
    skip: function () { return this; },
    limit: function () { return this; },
    select: function () { return this; },
    lean: function () { return this; },
    exec: async () => result,
  });

  // --- Mongoose Models Mock Setup ---
  const mockAuditLogsModel: any = function (data: any) {
    const doc = {
      _id: new Types.ObjectId(),
      ...data,
      createdAt: new Date(),
      save: async function () {
        auditLogsDb.push(this);
        return this;
      },
    };
    return doc;
  };
  mockAuditLogsModel.find = (query: any) => {
    const filtered = auditLogsDb.filter((item) => {
      for (const key of Object.keys(query)) {
        if (query[key] && item[key]?.toString() !== query[key]?.toString()) return false;
      }
      return true;
    });
    return createQueryChain(filtered);
  };
  mockAuditLogsModel.countDocuments = (query: any) => ({
    exec: async () => {
      return auditLogsDb.filter((item) => {
        for (const key of Object.keys(query)) {
          if (query[key] && item[key]?.toString() !== query[key]?.toString()) return false;
        }
        return true;
      }).length;
    },
  });
  mockAuditLogsModel.findById = (id: any) => {
    const found = auditLogsDb.find((item) => item._id.toString() === id.toString());
    return createQueryChain(found || null);
  };

  const mockUserModel: any = function (data: any) {
    const doc = {
      _id: new Types.ObjectId(),
      ...data,
      status: data.status || UserStatus.ACTIVE,
      isEmailVerified: true,
      createdAt: new Date(),
      save: async function () {
        const idx = usersDb.findIndex((u) => u._id.toString() === this._id.toString());
        if (idx >= 0) usersDb[idx] = this;
        else usersDb.push(this);
        return this;
      },
    };
    return doc;
  };
  mockUserModel.findOne = (query: any) => {
    const found = usersDb.find((item) => {
      for (const key of Object.keys(query)) {
        if (item[key] && item[key]?.toString() !== query[key]?.toString()) return false;
      }
      return true;
    });
    return createQueryChain(found || null);
  };
  mockUserModel.find = (query: any) => {
    const filtered = usersDb.filter((item) => {
      for (const key of Object.keys(query)) {
        if (query[key] && item[key]?.toString() !== query[key]?.toString()) return false;
      }
      return true;
    });
    return createQueryChain(filtered);
  };
  mockUserModel.countDocuments = (query: any) => ({
    exec: async () => {
      return usersDb.filter((item) => {
        for (const key of Object.keys(query)) {
          if (query[key] && item[key]?.toString() !== query[key]?.toString()) return false;
        }
        return true;
      }).length;
    },
  });
  mockUserModel.findById = (id: any) => {
    const found = usersDb.find((item) => item._id.toString() === id.toString());
    return createQueryChain(found || null);
  };
  mockUserModel.findByIdAndUpdate = (id: any, update: any) => ({
    populate: function () { return this; },
    exec: async () => {
      const found = usersDb.find((u) => u._id.toString() === id.toString());
      if (found && update.$set) {
        Object.assign(found, update.$set);
      }
      return found || null;
    },
  });

  const mockInstitutionModel: any = {
    findById: (id: any) => {
      const found = institutionsDb.find((i) => i._id.toString() === id.toString());
      return createQueryChain(found || null);
    },
  };

  const mockStudentProfileModel: any = function (data: any) {
    const doc = {
      _id: new Types.ObjectId(),
      ...data,
      status: data.status || StudentProfileStatus.ACTIVE,
      createdAt: new Date(),
      save: async function () {
        const idx = studentProfilesDb.findIndex((p) => p._id.toString() === this._id.toString());
        if (idx >= 0) studentProfilesDb[idx] = this;
        else studentProfilesDb.push(this);
        return this;
      },
    };
    return doc;
  };
  mockStudentProfileModel.findOne = (query: any) => {
    const found = studentProfilesDb.find((item) => {
      for (const key of Object.keys(query)) {
        if (item[key] && item[key]?.toString() !== query[key]?.toString()) return false;
      }
      return true;
    });
    return createQueryChain(found || null);
  };
  mockStudentProfileModel.find = (query: any) => {
    const filtered = studentProfilesDb.filter((item) => {
      for (const key of Object.keys(query)) {
        if (query[key] && item[key]?.toString() !== query[key]?.toString()) return false;
      }
      return true;
    });
    return createQueryChain(filtered);
  };
  mockStudentProfileModel.countDocuments = (query: any) => ({
    exec: async () => {
      return studentProfilesDb.filter((item) => {
        for (const key of Object.keys(query)) {
          if (query[key] && item[key]?.toString() !== query[key]?.toString()) return false;
        }
        return true;
      }).length;
    },
  });
  mockStudentProfileModel.findById = (id: any) => {
    const found = studentProfilesDb.find((item) => item._id.toString() === id.toString());
    return createQueryChain(found || null);
  };

  const mockTeacherProfileModel: any = function (data: any) {
    const doc = {
      _id: new Types.ObjectId(),
      ...data,
      status: data.status || TeacherProfileStatus.ACTIVE,
      assignedClassIds: data.assignedClassIds || [],
      assignedSubjectIds: data.assignedSubjectIds || [],
      createdAt: new Date(),
      save: async function () {
        const idx = teacherProfilesDb.findIndex((p) => p._id.toString() === this._id.toString());
        if (idx >= 0) teacherProfilesDb[idx] = this;
        else teacherProfilesDb.push(this);
        return this;
      },
    };
    return doc;
  };
  mockTeacherProfileModel.findOne = (query: any) => {
    const found = teacherProfilesDb.find((item) => {
      for (const key of Object.keys(query)) {
        if (item[key] && item[key]?.toString() !== query[key]?.toString()) return false;
      }
      return true;
    });
    return createQueryChain(found || null);
  };
  mockTeacherProfileModel.find = (query: any) => {
    const filtered = teacherProfilesDb.filter((item) => {
      for (const key of Object.keys(query)) {
        if (query[key] && item[key]?.toString() !== query[key]?.toString()) return false;
      }
      return true;
    });
    return createQueryChain(filtered);
  };
  mockTeacherProfileModel.countDocuments = (query: any) => ({
    exec: async () => {
      return teacherProfilesDb.filter((item) => {
        for (const key of Object.keys(query)) {
          if (query[key] && item[key]?.toString() !== query[key]?.toString()) return false;
        }
        return true;
      }).length;
    },
  });
  mockTeacherProfileModel.findById = (id: any) => {
    const found = teacherProfilesDb.find((item) => item._id.toString() === id.toString());
    return createQueryChain(found || null);
  };

  const mockClassModel: any = function (data: any) {
    const doc = {
      _id: new Types.ObjectId(),
      ...data,
      status: data.status || ClassStatus.ACTIVE,
      createdAt: new Date(),
      save: async function () {
        const idx = classesDb.findIndex((c) => c._id.toString() === this._id.toString());
        if (idx >= 0) classesDb[idx] = this;
        else classesDb.push(this);
        return this;
      },
    };
    return doc;
  };
  mockClassModel.findOne = (query: any) => {
    const found = classesDb.find((item) => {
      for (const key of Object.keys(query)) {
        if (item[key] && item[key]?.toString() !== query[key]?.toString()) return false;
      }
      return true;
    });
    return createQueryChain(found || null);
  };
  mockClassModel.find = (query: any) => {
    const filtered = classesDb.filter((item) => {
      for (const key of Object.keys(query)) {
        if (query[key] && item[key]?.toString() !== query[key]?.toString()) return false;
      }
      return true;
    });
    return createQueryChain(filtered);
  };
  mockClassModel.countDocuments = (query: any) => ({
    exec: async () => {
      return classesDb.filter((item) => {
        for (const key of Object.keys(query)) {
          if (query[key] && item[key]?.toString() !== query[key]?.toString()) return false;
        }
        return true;
      }).length;
    },
  });
  mockClassModel.findById = (id: any) => {
    const found = classesDb.find((item) => item._id.toString() === id.toString());
    return createQueryChain(found || null);
  };
  mockClassModel.findByIdAndDelete = (id: any) => ({
    exec: async () => {
      const idx = classesDb.findIndex((c) => c._id.toString() === id.toString());
      if (idx >= 0) return classesDb.splice(idx, 1)[0];
      return null;
    },
  });

  const mockSubjectModel: any = function (data: any) {
    const doc = {
      _id: new Types.ObjectId(),
      ...data,
      teacherIds: data.teacherIds || [],
      status: data.status || SubjectStatus.ACTIVE,
      createdAt: new Date(),
      save: async function () {
        const idx = subjectsDb.findIndex((s) => s._id.toString() === this._id.toString());
        if (idx >= 0) subjectsDb[idx] = this;
        else subjectsDb.push(this);
        return this;
      },
    };
    return doc;
  };
  mockSubjectModel.findOne = (query: any) => {
    const found = subjectsDb.find((item) => {
      for (const key of Object.keys(query)) {
        if (item[key] && item[key]?.toString() !== query[key]?.toString()) return false;
      }
      return true;
    });
    return createQueryChain(found || null);
  };
  mockSubjectModel.find = (query: any) => {
    const filtered = subjectsDb.filter((item) => {
      for (const key of Object.keys(query)) {
        if (query[key] && item[key]?.toString() !== query[key]?.toString()) return false;
      }
      return true;
    });
    return createQueryChain(filtered);
  };
  mockSubjectModel.countDocuments = (query: any) => ({
    exec: async () => {
      return subjectsDb.filter((item) => {
        for (const key of Object.keys(query)) {
          if (query[key] && item[key]?.toString() !== query[key]?.toString()) return false;
        }
        return true;
      }).length;
    },
  });
  mockSubjectModel.findById = (id: any) => {
    const found = subjectsDb.find((item) => item._id.toString() === id.toString());
    return createQueryChain(found || null);
  };
  mockSubjectModel.findByIdAndDelete = (id: any) => ({
    exec: async () => {
      const idx = subjectsDb.findIndex((s) => s._id.toString() === id.toString());
      if (idx >= 0) return subjectsDb.splice(idx, 1)[0];
      return null;
    },
  });

  const mockEnrollmentModel: any = function (data: any) {
    const doc = {
      _id: new Types.ObjectId(),
      ...data,
      status: data.status || EnrollmentStatus.ACTIVE,
      createdAt: new Date(),
      save: async function () {
        const idx = enrollmentsDb.findIndex((e) => e._id.toString() === this._id.toString());
        if (idx >= 0) enrollmentsDb[idx] = this;
        else enrollmentsDb.push(this);
        return this;
      },
    };
    return doc;
  };
  mockEnrollmentModel.findOne = (query: any) => {
    const found = enrollmentsDb.find((item) => {
      for (const key of Object.keys(query)) {
        if (item[key] && item[key]?.toString() !== query[key]?.toString()) return false;
      }
      return true;
    });
    return createQueryChain(found || null);
  };
  mockEnrollmentModel.find = (query: any) => {
    const filtered = enrollmentsDb.filter((item) => {
      for (const key of Object.keys(query)) {
        if (query[key] && item[key]?.toString() !== query[key]?.toString()) return false;
      }
      return true;
    });
    return createQueryChain(filtered);
  };
  mockEnrollmentModel.countDocuments = (query: any) => ({
    exec: async () => {
      return enrollmentsDb.filter((item) => {
        for (const key of Object.keys(query)) {
          if (query[key] && item[key]?.toString() !== query[key]?.toString()) return false;
        }
        return true;
      }).length;
    },
  });
  mockEnrollmentModel.findById = (id: any) => {
    const found = enrollmentsDb.find((item) => item._id.toString() === id.toString());
    return createQueryChain(found || null);
  };

  const mockConnection: any = {
    collection: (name: string) => ({
      countDocuments: async (query: any) => {
        if (name === 'enrollments') {
          return enrollmentsDb.filter((e) => {
            if (query.classId && e.classId.toString() !== query.classId.toString()) return false;
            if (query.status && e.status !== query.status) return false;
            return true;
          }).length;
        }
        return 0;
      },
    }),
  };

  const mockSessionModel: any = {
    updateMany: async () => ({ modifiedCount: 0 }),
  };

  // Service Instantiations
  const tenantContextService = new TenantContextService();
  const auditLogsService = new AuditLogsService(mockAuditLogsModel, tenantContextService);
  const usersService = new UsersService(
    mockUserModel,
    mockInstitutionModel,
    mockTeacherProfileModel,
    mockStudentProfileModel,
    mockClassModel,
    mockEnrollmentModel,
    mockSessionModel,
    tenantContextService,
    auditLogsService,
  );
  const studentProfilesService = new StudentProfilesService(
    mockStudentProfileModel,
    mockUserModel,
    tenantContextService,
    auditLogsService,
  );
  const teacherProfilesService = new TeacherProfilesService(
    mockTeacherProfileModel,
    mockUserModel,
    tenantContextService,
    auditLogsService,
  );
  const classesService = new ClassesService(
    mockClassModel,
    mockTeacherProfileModel,
    mockConnection,
    tenantContextService,
    auditLogsService,
  );
  const subjectsService = new SubjectsService(
    mockSubjectModel,
    mockClassModel,
    mockTeacherProfileModel,
    tenantContextService,
    auditLogsService,
  );
  const enrollmentsService = new EnrollmentsService(
    mockEnrollmentModel,
    mockStudentProfileModel,
    mockClassModel,
    tenantContextService,
    auditLogsService,
  );

  console.log('--- 1. Testing TenantContextService: Backend Tenant Resolution ---');

  // 1.1 Never trust client requested tenant for normal school user
  try {
    tenantContextService.resolveTenantId(adminA, schoolBId);
    assert(false, 'Admin A cannot request School B tenant context');
  } catch (err: any) {
    assert(
      err instanceof ForbiddenException,
      'Admin A attempting to impersonate School B is blocked (ForbiddenException)',
    );
  }

  // 1.2 Super Admin can query all (null) or filter by specific tenant
  const superAdminAll = tenantContextService.resolveTenantId(superAdminUser);
  assert(superAdminAll === null, 'Super Admin resolves to null (Platform-wide context)');

  const superAdminSpecific = tenantContextService.resolveTenantId(superAdminUser, schoolAId);
  assert(
    superAdminSpecific?.toString() === schoolAId,
    'Super Admin can explicitly target School A context',
  );

  // 1.3 Validate ObjectId tamper prevention
  try {
    tenantContextService.validateObjectId('not-a-valid-id', 'testId');
    assert(false, 'Should reject malformed ObjectId');
  } catch (err: any) {
    assert(
      err instanceof BadRequestException,
      'Malformed ObjectId rejected with BadRequestException',
    );
  }

  console.log('\n--- 2. Setting Up Seed Data for Both Institutions (School A and School B) ---');

  // Seed Teacher for School A
  const teacherUserA = await mockUserModel({
    name: 'Alpha Teacher',
    email: 'alpha_teacher@alpha.edu',
    role: UserRole.TEACHER,
    institutionId: schoolAId,
  }).save();

  const teacherProfileA = await mockTeacherProfileModel({
    userId: teacherUserA._id,
    institutionId: schoolAId,
    employeeId: 'EMP-ALPHA-01',
    qualification: ['M.Sc'],
  }).save();

  // Seed Teacher for School B
  const teacherUserB = await mockUserModel({
    name: 'Beta Teacher',
    email: 'beta_teacher@beta.edu',
    role: UserRole.TEACHER,
    institutionId: schoolBId,
  }).save();

  const teacherProfileB = await mockTeacherProfileModel({
    userId: teacherUserB._id,
    institutionId: schoolBId,
    employeeId: 'EMP-BETA-01',
    qualification: ['M.Ed'],
  }).save();

  // Seed Class for School A
  const classA = await mockClassModel({
    name: 'Grade 10 Section A',
    grade: 10,
    section: 'A',
    academicYear: '2026-2027',
    capacity: 30,
    institutionId: schoolAId,
    classTeacherId: teacherProfileA._id,
  }).save();

  // Seed Class for School B
  const classB = await mockClassModel({
    name: 'Grade 10 Section B',
    grade: 10,
    section: 'B',
    academicYear: '2026-2027',
    capacity: 30,
    institutionId: schoolBId,
    classTeacherId: teacherProfileB._id,
  }).save();

  // Seed Subject for School A
  const subjectA = await mockSubjectModel({
    name: 'Physics',
    code: 'PHY101',
    academicYear: '2026-2027',
    institutionId: schoolAId,
    classId: classA._id,
    teacherIds: [teacherProfileA._id],
  }).save();

  // Seed Subject for School B
  const subjectB = await mockSubjectModel({
    name: 'Chemistry',
    code: 'CHEM101',
    academicYear: '2026-2027',
    institutionId: schoolBId,
    classId: classB._id,
    teacherIds: [teacherProfileB._id],
  }).save();

  // Seed Student User & Profile for School A
  const studentUserA1 = await mockUserModel({
    name: 'Student A1',
    email: 'studentA1@alpha.edu',
    role: UserRole.STUDENT,
    institutionId: schoolAId,
  }).save();

  const studentProfileA1 = await mockStudentProfileModel({
    userId: studentUserA1._id,
    institutionId: schoolAId,
    admissionNumber: 'ADM-ALPHA-001',
    dateOfBirth: new Date('2010-01-01'),
    gender: Gender.FEMALE,
  }).save();

  // Seed Student User & Profile for School B
  const studentUserB1 = await mockUserModel({
    name: 'Student B1',
    email: 'studentB1@beta.edu',
    role: UserRole.STUDENT,
    institutionId: schoolBId,
  }).save();

  const studentProfileB1 = await mockStudentProfileModel({
    userId: studentUserB1._id,
    institutionId: schoolBId,
    admissionNumber: 'ADM-BETA-001',
    dateOfBirth: new Date('2010-02-02'),
    gender: Gender.MALE,
  }).save();

  // Seed Enrollment for School A
  const enrollmentA1 = await mockEnrollmentModel({
    studentId: studentProfileA1._id,
    institutionId: schoolAId,
    classId: classA._id,
    academicYear: '2026-2027',
    rollNumber: 'ROLL-01',
    enrollmentDate: new Date(),
    status: EnrollmentStatus.ACTIVE,
  }).save();

  // Seed Enrollment for School B
  const enrollmentB1 = await mockEnrollmentModel({
    studentId: studentProfileB1._id,
    institutionId: schoolBId,
    classId: classB._id,
    academicYear: '2026-2027',
    rollNumber: 'ROLL-01',
    enrollmentDate: new Date(),
    status: EnrollmentStatus.ACTIVE,
  }).save();

  // Seed Audit Log for School A
  await mockAuditLogsModel({
    userId: adminA.userId,
    institutionId: schoolAId,
    action: 'USER_CREATED',
    module: 'USERS',
    description: 'Alpha Admin created a user',
  }).save();

  // Seed Audit Log for School B
  await mockAuditLogsModel({
    userId: adminB.userId,
    institutionId: schoolBId,
    action: 'USER_CREATED',
    module: 'USERS',
    description: 'Beta Admin created a user',
  }).save();

  console.log(`  Seed created: 2 Schools, 4 Users, 2 Student Profiles, 2 Classes, 2 Subjects, 2 Enrollments, 2 Audit Logs`);

  console.log('\n--- 3. Testing Cross-Tenant Read Protection (Domain Isolation) ---');

  // 3.1 Class Read Isolation
  try {
    await classesService.findById(classB._id.toString(), adminA);
    assert(false, 'Admin A must NOT access School B Class');
  } catch (err: any) {
    assert(err instanceof ForbiddenException, 'Class read: Cross-institution blocked (ForbiddenException)');
  }

  // 3.2 Subject Read Isolation
  try {
    await subjectsService.findById(subjectB._id.toString(), adminA);
    assert(false, 'Admin A must NOT access School B Subject');
  } catch (err: any) {
    assert(err instanceof ForbiddenException, 'Subject read: Cross-institution blocked (ForbiddenException)');
  }

  // 3.3 Student Profile Read Isolation
  try {
    await studentProfilesService.findById(studentProfileB1._id.toString(), adminA);
    assert(false, 'Admin A must NOT access School B Student Profile');
  } catch (err: any) {
    assert(err instanceof ForbiddenException, 'Student Profile read: Cross-institution blocked (ForbiddenException)');
  }

  // 3.4 Teacher Profile Read Isolation
  try {
    await teacherProfilesService.findById(teacherProfileB._id.toString(), adminA);
    assert(false, 'Admin A must NOT access School B Teacher Profile');
  } catch (err: any) {
    assert(err instanceof ForbiddenException, 'Teacher Profile read: Cross-institution blocked (ForbiddenException)');
  }

  // 3.5 Enrollment Read Isolation
  try {
    await enrollmentsService.findById(enrollmentB1._id.toString(), adminA);
    assert(false, 'Admin A must NOT access School B Enrollment');
  } catch (err: any) {
    assert(err instanceof ForbiddenException, 'Enrollment read: Cross-institution blocked (ForbiddenException)');
  }

  // 3.6 Audit Logs Read Isolation
  const logsSchoolB = auditLogsDb.find((l) => l.institutionId === schoolBId);
  try {
    await auditLogsService.findById(logsSchoolB._id.toString(), adminA);
    assert(false, 'Admin A must NOT access School B Audit Log');
  } catch (err: any) {
    assert(err instanceof ForbiddenException, 'Audit Log read: Cross-institution blocked (ForbiddenException)');
  }

  console.log('\n--- 4. Testing Cross-Tenant Query Filtering & Leakage Prevention ---');

  // 4.1 Admin A queries classes: should strictly return only School A classes
  const classesListA = await classesService.findAll({} as any, adminA);
  assert(
    classesListA.items.length === 1 && classesListA.items[0]._id.toString() === classA._id.toString(),
    'Admin A findAll classes only returns School A classes (Zero leakage)',
  );
  assert(classesListA.total === 1, 'Total class count strictly reflects School A only');

  // 4.2 Admin A attempts query tampering: ?institutionId=schoolBId
  try {
    await classesService.findAll({ institutionId: schoolBId } as any, adminA);
    assert(false, 'Admin A query param tampering must be rejected');
  } catch (err: any) {
    assert(
      err instanceof ForbiddenException,
      'Admin A query param tampering rejected with ForbiddenException',
    );
  }

  // 4.3 Admin A queries audit logs: should only see School A logs
  const logsListA = await auditLogsService.findAll({} as any, adminA);
  assert(
    logsListA.items.length === 1 && logsListA.items[0].institution?.id === schoolAId,
    'Admin A audit logs query strictly scoped to School A (Zero Beta High logs visible)',
  );

  // 4.4 Super Admin queries audit logs: can see all or filter by school
  const superAdminLogs = await auditLogsService.findAll({} as any, superAdminUser);
  assert(superAdminLogs.items.length === 2, 'Super Admin can view audit logs across all institutions');

  const superAdminFilteredLogs = await auditLogsService.findAll(
    { institutionId: schoolBId } as any,
    superAdminUser,
  );
  assert(
    superAdminFilteredLogs.items.length === 1 && superAdminFilteredLogs.items[0].institution?.id === schoolBId,
    'Super Admin can explicitly filter audit logs for School B',
  );

  console.log('\n--- 5. Testing Cross-Tenant Write & Reference Injection Prevention ---');

  // 5.1 Prevent assigning School B Teacher to School A Class (Reference Injection)
  try {
    await classesService.create(
      {
        name: 'Tampered Class',
        grade: 11,
        section: 'A',
        academicYear: '2026-2027',
        capacity: 25,
        classTeacherId: teacherProfileB._id.toString(), // Belongs to School B!
      },
      adminA,
    );
    assert(false, 'Should reject assigning School B teacher to School A class');
  } catch (err: any) {
    assert(
      err instanceof BadRequestException,
      'Reject cross-tenant teacher assignment to class (BadRequestException)',
    );
  }

  // 5.2 Prevent assigning School B Class to School A Subject (Reference Injection)
  try {
    await subjectsService.create(
      {
        name: 'Injected Subject',
        code: 'INJ101',
        academicYear: '2026-2027',
        classId: classB._id.toString(), // School B Class!
        teacherIds: [teacherProfileA._id.toString()],
      },
      adminA,
    );
    assert(false, 'Should reject assigning School B class to School A subject');
  } catch (err: any) {
    assert(
      err instanceof BadRequestException,
      'Reject cross-tenant class assignment in subject (BadRequestException)',
    );
  }

  // 5.3 Prevent enrolling School A student into School B class
  try {
    await enrollmentsService.create(
      {
        studentId: studentProfileA1._id.toString(), // School A
        classId: classB._id.toString(),             // School B
        academicYear: '2026-2027',
        rollNumber: 'ROLL-99',
      },
      adminA,
    );
    assert(false, 'Should reject enrolling student across institutions');
  } catch (err: any) {
    assert(
      err instanceof BadRequestException,
      'Reject cross-tenant enrollment creation (BadRequestException)',
    );
  }

  // 5.4 Prevent cross-tenant user creation tampering (DTO institutionId override)
  const teacherCreated = await usersService.createTeacher(
    {
      name: 'Alpha New Teacher',
      email: 'new_teacher@alpha.edu',
      employeeId: 'EMP-ALPHA-NEW',
      qualification: ['B.Sc'],
      institutionId: schoolBId, // Injected attempt to create in School B!
    } as any,
    adminA,
  );
  assert(
    teacherCreated.user.institutionId?.toString() === schoolAId,
    'Client-supplied institutionId ignored on user creation; forced to Admin A institution',
  );

  console.log('\n--- 6. Testing Cross-Tenant Update and Deletion Prevention ---');

  // 6.1 Prevent Admin A from updating School B class
  try {
    await classesService.update(
      classB._id.toString(),
      { name: 'Hijacked Class' },
      adminA,
    );
    assert(false, 'Admin A must NOT update School B Class');
  } catch (err: any) {
    assert(
      err instanceof ForbiddenException,
      'Cross-tenant class update blocked (ForbiddenException)',
    );
  }

  // 6.2 Prevent Admin A from deleting School B class
  try {
    await classesService.delete(classB._id.toString(), adminA);
    assert(false, 'Admin A must NOT delete School B Class');
  } catch (err: any) {
    assert(
      err instanceof ForbiddenException,
      'Cross-tenant class deletion blocked (ForbiddenException)',
    );
  }

  // 6.3 Prevent Admin A from updating School B subject
  try {
    await subjectsService.update(
      subjectB._id.toString(),
      { name: 'Tampered Subject' },
      adminA,
    );
    assert(false, 'Admin A must NOT update School B Subject');
  } catch (err: any) {
    assert(
      err instanceof ForbiddenException,
      'Cross-tenant subject update blocked (ForbiddenException)',
    );
  }

  // 6.4 Prevent Admin A from updating School B enrollment
  try {
    await enrollmentsService.update(
      enrollmentB1._id.toString(),
      { rollNumber: 'TAMPERED-01' },
      adminA,
    );
    assert(false, 'Admin A must NOT update School B Enrollment');
  } catch (err: any) {
    assert(
      err instanceof ForbiddenException,
      'Cross-tenant enrollment update blocked (ForbiddenException)',
    );
  }

  console.log('\n--- 7. Testing Teacher & Student Scoped Access Control ---');

  // 7.1 Teacher Scoped Access: Teacher A assigned only to Class A
  try {
    tenantContextService.enforceTeacherResourceAccess(
      teacherA,
      { assignedClassIds: [classA._id.toString()] },
      { classId: classB._id.toString() },
    );
    assert(false, 'Teacher A should NOT access unassigned Class B');
  } catch (err: any) {
    assert(
      err instanceof ForbiddenException,
      'Teacher blocked from unassigned class (ForbiddenException)',
    );
  }

  // 7.2 Student Scoped Access: Student A1 attempts to view Student A2's profile
  try {
    tenantContextService.enforceStudentSelfAccess(
      studentA1,
      studentA2.userId,
    );
    assert(false, 'Student A1 should NOT access Student A2 profile');
  } catch (err: any) {
    assert(
      err instanceof ForbiddenException,
      'Student blocked from viewing peer student profile (ForbiddenException)',
    );
  }

  // 7.3 Student A1 accesses own profile: permitted
  let studentSelfOk = false;
  try {
    tenantContextService.enforceStudentSelfAccess(
      studentA1,
      studentA1.userId,
    );
    studentSelfOk = true;
  } catch {
    studentSelfOk = false;
  }
  assert(studentSelfOk, 'Student A1 successfully accesses own profile');

  // 7.4 Non-admin (Teacher/Student) blocked from Audit Logs entirely
  try {
    await auditLogsService.findAll({} as any, teacherA);
    assert(false, 'Teacher should NOT access Audit Logs');
  } catch (err: any) {
    assert(
      err instanceof ForbiddenException,
      'Teacher querying audit logs blocked with ForbiddenException',
    );
  }

  console.log('\n========================================================================');
  console.log(`RESULTS: ${passed}/${total} TESTS PASSED`);
  console.log('========================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runMultiTenantIsolationTests().catch((err) => {
  console.error('Fatal error running multi-tenant isolation tests:', err);
  process.exit(1);
});
