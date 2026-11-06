import { Types } from 'mongoose';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { StudentProfilesService } from '../src/student-profiles/student-profiles.service';
import { TeacherProfilesService } from '../src/teacher-profiles/teacher-profiles.service';
import { ClassesService } from '../src/classes/classes.service';
import { SubjectsService } from '../src/subjects/subjects.service';
import { EnrollmentsService } from '../src/enrollments/enrollments.service';
import {
  Gender,
  ParentRelationship,
  StudentProfileStatus,
} from '../src/student-profiles/schemas/student-profile.schema';
import { TeacherProfileStatus } from '../src/teacher-profiles/schemas/teacher-profile.schema';
import { ClassStatus } from '../src/classes/schemas/class.schema';
import { SubjectStatus } from '../src/subjects/schemas/subject.schema';
import { EnrollmentStatus } from '../src/enrollments/schemas/enrollment.schema';
import { UserRole, UserStatus } from '../src/users/enums/user.enums';
import { AuthenticatedUser } from '../src/auth/interfaces/authenticated-user.interface';

async function runAcademicModulesTests() {
  console.log('================================================================');
  console.log('🚀 ACADEMIC CORE MODULES VERIFICATION (TASKS 22, 23, 24, 25, 26)');
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
  const usersDb: any[] = [];
  const studentProfilesDb: any[] = [];
  const teacherProfilesDb: any[] = [];
  const classesDb: any[] = [];
  const subjectsDb: any[] = [];
  const enrollmentsDb: any[] = [];
  const auditLogsDb: any[] = [];

  // Mock Institutions
  const schoolAId = new Types.ObjectId().toString();
  const schoolBId = new Types.ObjectId().toString();

  // Mock Users
  const superAdminUser: AuthenticatedUser = {
    userId: new Types.ObjectId().toString(),
    email: 'superadmin@platform.gov',
    name: 'Super Admin',
    role: UserRole.SUPER_ADMIN,
    status: UserStatus.ACTIVE,
    institutionId: null,
    institution: null,
    isEmailVerified: true,
  };

  const adminSchoolA: AuthenticatedUser = {
    userId: new Types.ObjectId().toString(),
    email: 'admin@schoolA.edu',
    name: 'Admin School A',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    institutionId: schoolAId,
    institution: { id: schoolAId, name: 'School A', code: 'SCH-A', status: 'ACTIVE' as any },
    isEmailVerified: true,
  };

  const adminSchoolB: AuthenticatedUser = {
    userId: new Types.ObjectId().toString(),
    email: 'admin@schoolB.edu',
    name: 'Admin School B',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    institutionId: schoolBId,
    institution: { id: schoolBId, name: 'School B', code: 'SCH-B', status: 'ACTIVE' as any },
    isEmailVerified: true,
  };

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
    sort: function () { return this; },
    skip: function () { return this; },
    limit: function () { return this; },
    exec: async () => data,
  });

  // Mock UserModel
  const mockUserModel: any = {
    findById: (id: any) => {
      const found = usersDb.find((u) => u._id.toString() === id.toString());
      return createQueryChain(found || null);
    },
  };

  // --- 1. Setup StudentProfilesService Mock ---
  const mockStudentProfileModel: any = function (data: any) {
    const doc = {
      _id: new Types.ObjectId(),
      ...data,
      status: data.status || StudentProfileStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
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
        if (item[key]?.toString() !== query[key]?.toString()) return false;
      }
      return true;
    });
    return createQueryChain(found || null);
  };
  mockStudentProfileModel.findById = (id: any) => {
    const found = studentProfilesDb.find((item) => item._id.toString() === id.toString());
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
    exec: async () => studentProfilesDb.length,
  });

  const studentProfilesService = new StudentProfilesService(
    mockStudentProfileModel,
    mockUserModel,
    mockAuditLogsService,
  );

  // --- 2. Setup TeacherProfilesService Mock ---
  const mockTeacherProfileModel: any = function (data: any) {
    const doc = {
      _id: new Types.ObjectId(),
      ...data,
      status: data.status || TeacherProfileStatus.ACTIVE,
      assignedClassIds: data.assignedClassIds || [],
      assignedSubjectIds: data.assignedSubjectIds || [],
      createdAt: new Date(),
      updatedAt: new Date(),
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
        if (item[key]?.toString() !== query[key]?.toString()) return false;
      }
      return true;
    });
    return createQueryChain(found || null);
  };
  mockTeacherProfileModel.findById = (id: any) => {
    const found = teacherProfilesDb.find((item) => item._id.toString() === id.toString());
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
    exec: async () => teacherProfilesDb.length,
  });

  const teacherProfilesService = new TeacherProfilesService(
    mockTeacherProfileModel,
    mockUserModel,
    mockAuditLogsService,
  );

  // --- 3. Setup ClassesService Mock ---
  const mockClassModel: any = function (data: any) {
    const doc = {
      _id: new Types.ObjectId(),
      ...data,
      status: data.status || ClassStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
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
        if (item[key]?.toString() !== query[key]?.toString()) return false;
      }
      return true;
    });
    return createQueryChain(found || null);
  };
  mockClassModel.findById = (id: any) => {
    const found = classesDb.find((item) => item._id.toString() === id.toString());
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
    exec: async () => classesDb.length,
  });
  mockClassModel.findByIdAndDelete = (id: any) => ({
    exec: async () => {
      const idx = classesDb.findIndex((c) => c._id.toString() === id.toString());
      if (idx >= 0) return classesDb.splice(idx, 1)[0];
      return null;
    },
  });

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

  const classesService = new ClassesService(
    mockClassModel,
    mockTeacherProfileModel,
    mockConnection,
    mockAuditLogsService,
  );

  // --- 4. Setup SubjectsService Mock ---
  const mockSubjectModel: any = function (data: any) {
    const doc = {
      _id: new Types.ObjectId(),
      ...data,
      teacherIds: data.teacherIds || [],
      status: data.status || SubjectStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
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
        if (item[key]?.toString() !== query[key]?.toString()) return false;
      }
      return true;
    });
    return createQueryChain(found || null);
  };
  mockSubjectModel.findById = (id: any) => {
    const found = subjectsDb.find((item) => item._id.toString() === id.toString());
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
    exec: async () => subjectsDb.length,
  });
  mockSubjectModel.findByIdAndDelete = (id: any) => ({
    exec: async () => {
      const idx = subjectsDb.findIndex((s) => s._id.toString() === id.toString());
      if (idx >= 0) return subjectsDb.splice(idx, 1)[0];
      return null;
    },
  });

  const subjectsService = new SubjectsService(
    mockSubjectModel,
    mockClassModel,
    mockTeacherProfileModel,
    mockAuditLogsService,
  );

  // --- 5. Setup EnrollmentsService Mock ---
  const mockEnrollmentModel: any = function (data: any) {
    const doc = {
      _id: new Types.ObjectId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
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
        if (item[key]?.toString() !== query[key]?.toString()) return false;
      }
      return true;
    });
    return createQueryChain(found || null);
  };
  mockEnrollmentModel.findById = (id: any) => {
    const found = enrollmentsDb.find((item) => item._id.toString() === id.toString());
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

  const enrollmentsService = new EnrollmentsService(
    mockEnrollmentModel,
    mockStudentProfileModel,
    mockClassModel,
    mockAuditLogsService,
  );

  const defaultAddress = {
    street: '123 Academic Way',
    city: 'Nagpur',
    state: 'Maharashtra',
    postalCode: '440001',
  };

  // Register mock users in usersDb
  const studentUser1 = new Types.ObjectId().toString();
  const studentUser2 = new Types.ObjectId().toString();
  const studentUser3 = new Types.ObjectId().toString();
  const studentUser4 = new Types.ObjectId().toString();

  usersDb.push(
    { _id: new Types.ObjectId(studentUser1), role: UserRole.STUDENT, institutionId: new Types.ObjectId(schoolAId) },
    { _id: new Types.ObjectId(studentUser2), role: UserRole.STUDENT, institutionId: new Types.ObjectId(schoolBId) },
    { _id: new Types.ObjectId(studentUser3), role: UserRole.STUDENT, institutionId: new Types.ObjectId(schoolAId) },
    { _id: new Types.ObjectId(studentUser4), role: UserRole.STUDENT, institutionId: new Types.ObjectId(schoolAId) },
  );

  const teacherUser1 = new Types.ObjectId().toString();
  const teacherUser2 = new Types.ObjectId().toString();
  usersDb.push(
    { _id: new Types.ObjectId(teacherUser1), role: UserRole.TEACHER, institutionId: new Types.ObjectId(schoolAId) },
    { _id: new Types.ObjectId(teacherUser2), role: UserRole.TEACHER, institutionId: new Types.ObjectId(schoolBId) },
  );

  console.log('--- 1. Testing TASK 22: Student Profiles Module ---');
  let studentProfile1: any;

  try {
    studentProfile1 = await studentProfilesService.create(
      {
        userId: studentUser1,
        admissionNumber: 'SCHA-2026-001',
        dateOfBirth: '2010-04-12',
        gender: Gender.MALE,
        address: defaultAddress,
        parentDetails: [
          {
            name: 'Vikram Sharma',
            relationship: ParentRelationship.FATHER,
            phone: '+919876543210',
            email: 'vikram@example.com',
          },
        ],
      },
      adminSchoolA,
    );
    assert(
      studentProfile1 && studentProfile1.admissionNumber === 'SCHA-2026-001',
      'Create student profile with nested address and parent details',
    );
  } catch (err: any) {
    assert(false, 'Create student profile with nested address and parent details', err.message);
  }

  // Duplicate admission number in School A must fail
  try {
    // create another user in school A
    const anotherStudentUser = new Types.ObjectId().toString();
    usersDb.push({
      _id: new Types.ObjectId(anotherStudentUser),
      role: UserRole.STUDENT,
      institutionId: new Types.ObjectId(schoolAId),
    });

    await studentProfilesService.create(
      {
        userId: anotherStudentUser,
        admissionNumber: 'SCHA-2026-001', // duplicate
        dateOfBirth: '2010-06-20',
        gender: Gender.FEMALE,
        address: defaultAddress,
      },
      adminSchoolA,
    );
    assert(false, 'Reject duplicate admissionNumber within same institution');
  } catch (err: any) {
    assert(
      err instanceof ConflictException,
      'Reject duplicate admissionNumber within same institution (ConflictException)',
    );
  }

  // Same admission number in School B must succeed (compound index isolation)
  try {
    const studentSchoolB = await studentProfilesService.create(
      {
        userId: studentUser2,
        admissionNumber: 'SCHA-2026-001', // same number, different school
        dateOfBirth: '2010-06-20',
        gender: Gender.FEMALE,
        address: defaultAddress,
      },
      adminSchoolB,
    );
    assert(
      studentSchoolB && studentSchoolB.institutionId.toString() === schoolBId,
      'Allow identical admissionNumber in different institution (Multi-tenant compound index)',
    );
  } catch (err: any) {
    assert(false, 'Allow identical admissionNumber in different institution', err.message);
  }

  // Cross-tenant access isolation: School B Admin cannot view School A student profile
  try {
    await studentProfilesService.findById(studentProfile1._id.toString(), adminSchoolB);
    assert(false, 'Reject cross-institution student profile access by admin of another school');
  } catch (err: any) {
    assert(
      err instanceof ForbiddenException,
      'Reject cross-institution student profile access (ForbiddenException)',
    );
  }

  console.log('\n--- 2. Testing TASK 23: Teacher Profiles Module ---');
  let teacherProfileA: any;
  let teacherProfileB: any;

  try {
    teacherProfileA = await teacherProfilesService.create(
      {
        userId: teacherUser1,
        employeeId: 'EMP-001',
        qualification: ['M.Sc. Mathematics', 'B.Ed.'],
        specialization: ['Advanced Calculus', 'Algebra'],
        experienceYears: 8,
        joiningDate: '2020-07-01',
      },
      adminSchoolA,
    );
    assert(
      teacherProfileA && teacherProfileA.employeeId === 'EMP-001',
      'Create teacher profile with qualifications and experience',
    );
  } catch (err: any) {
    assert(false, 'Create teacher profile', err.message);
  }

  // Duplicate employeeId in same institution rejected
  try {
    const teacherUserA2 = new Types.ObjectId().toString();
    usersDb.push({
      _id: new Types.ObjectId(teacherUserA2),
      role: UserRole.TEACHER,
      institutionId: new Types.ObjectId(schoolAId),
    });

    await teacherProfilesService.create(
      {
        userId: teacherUserA2,
        employeeId: 'EMP-001',
        qualification: ['B.A. English'],
        specialization: ['Literature'],
        experienceYears: 4,
        joiningDate: '2022-08-01',
      },
      adminSchoolA,
    );
    assert(false, 'Reject duplicate employeeId within same institution');
  } catch (err: any) {
    assert(
      err instanceof ConflictException,
      'Reject duplicate employeeId within same institution (ConflictException)',
    );
  }

  // Teacher profile for School B
  try {
    teacherProfileB = await teacherProfilesService.create(
      {
        userId: teacherUser2,
        employeeId: 'EMP-001',
        qualification: ['Ph.D. Physics'],
        specialization: ['Quantum Mechanics'],
        experienceYears: 10,
        joiningDate: '2019-01-15',
      },
      adminSchoolB,
    );
    assert(
      teacherProfileB && teacherProfileB.institutionId.toString() === schoolBId,
      'Create teacher profile in School B with same employeeId (Multi-tenancy compound index)',
    );
  } catch (err: any) {
    assert(false, 'Create teacher in School B', err.message);
  }

  console.log('\n--- 3. Testing TASK 24: Classes Module ---');
  let class10A: any;

  // Cross-institution teacher assignment rejected (Requirement 4)
  try {
    await classesService.create(
      {
        name: 'Grade 10 Section A',
        grade: 10,
        section: 'A',
        academicYear: '2026-2027',
        classTeacherId: teacherProfileB._id.toString(), // Belongs to School B!
        capacity: 2, // low capacity for testing
      },
      adminSchoolA,
    );
    assert(false, 'Reject assigning a teacher from School B to a Class in School A');
  } catch (err: any) {
    assert(
      err instanceof BadRequestException,
      'Reject assigning a teacher from another institution (BadRequestException)',
    );
  }

  // Create valid class in School A with teacher from School A
  try {
    class10A = await classesService.create(
      {
        name: 'Grade 10 Section A',
        grade: 10,
        section: 'A',
        academicYear: '2026-2027',
        classTeacherId: teacherProfileA._id.toString(),
        capacity: 2, // capacity set to 2 to test overflow!
        roomNumber: 'Room 101',
      },
      adminSchoolA,
    );
    assert(
      class10A && class10A.name === 'Grade 10 Section A' && class10A.capacity === 2,
      'Create Class with teacher from same institution and capacity constraint',
    );
  } catch (err: any) {
    assert(false, 'Create valid class', err.message);
  }

  // Duplicate grade + section + academicYear in School A must fail
  try {
    await classesService.create(
      {
        name: 'Duplicate 10-A',
        grade: 10,
        section: 'A',
        academicYear: '2026-2027',
        capacity: 30,
      },
      adminSchoolA,
    );
    assert(false, 'Reject duplicate class grade+section+academicYear in same institution');
  } catch (err: any) {
    assert(
      err instanceof ConflictException,
      'Reject duplicate class grade+section+academicYear (ConflictException)',
    );
  }

  console.log('\n--- 4. Testing TASK 25: Subjects Module ---');
  let mathSubject: any;

  // Cross-institution reference check: Class from School A, Teacher from School B
  try {
    await subjectsService.create(
      {
        name: 'Mathematics',
        code: 'MATH-10',
        classId: class10A._id.toString(),
        academicYear: '2026-2027',
        teacherIds: [teacherProfileB._id.toString()], // School B teacher!
      },
      adminSchoolA,
    );
    assert(false, 'Reject cross-institution teacher assignment in Subject');
  } catch (err: any) {
    assert(
      err instanceof BadRequestException,
      'Reject cross-institution teacher assignment in Subject (BadRequestException)',
    );
  }

  // Create valid subject in School A
  try {
    mathSubject = await subjectsService.create(
      {
        name: 'Mathematics 10',
        code: 'MATH10',
        classId: class10A._id.toString(),
        academicYear: '2026-2027',
        teacherIds: [teacherProfileA._id.toString()],
        description: 'Grade 10 Mathematics',
      },
      adminSchoolA,
    );
    assert(
      mathSubject && mathSubject.code === 'MATH10',
      'Create Subject with valid class and teacher within same institution',
    );
  } catch (err: any) {
    assert(false, 'Create valid subject', err.message);
  }

  // Compound uniqueness on { institutionId, code, academicYear, classId }
  try {
    await subjectsService.create(
      {
        name: 'Mathematics 10 duplicate',
        code: 'MATH10',
        classId: class10A._id.toString(),
        academicYear: '2026-2027',
      },
      adminSchoolA,
    );
    assert(false, 'Reject duplicate subject code for same class and academic year');
  } catch (err: any) {
    assert(
      err instanceof ConflictException,
      'Reject duplicate subject code for same class and academic year (ConflictException)',
    );
  }

  console.log('\n--- 5. Testing TASK 26: Student Enrollments Module ---');
  let enrollment1: any;

  // Cross-institution enrollment rejected
  try {
    await enrollmentsService.create(
      {
        studentId: studentProfile1._id.toString(), // School A
        classId: class10A._id.toString(),
        academicYear: '2026-2027',
        rollNumber: '01',
      },
      adminSchoolB, // School B admin trying to enroll
    );
    assert(false, 'Reject enrollment across different institutions');
  } catch (err: any) {
    assert(
      err instanceof BadRequestException,
      'Reject enrollment across different institutions (BadRequestException)',
    );
  }

  // 1st valid enrollment (Capacity 1 / 2)
  try {
    enrollment1 = await enrollmentsService.create(
      {
        studentId: studentProfile1._id.toString(),
        classId: class10A._id.toString(),
        academicYear: '2026-2027',
        rollNumber: '01',
      },
      adminSchoolA,
    );
    assert(
      enrollment1 && enrollment1.rollNumber === '01' && enrollment1.status === EnrollmentStatus.ACTIVE,
      'Enroll student 1 into Class 10-A (Capacity 1/2)',
    );
  } catch (err: any) {
    assert(false, 'Enroll student 1', err.message);
  }

  // Duplicate enrollment for same student in same academic year rejected
  try {
    await enrollmentsService.create(
      {
        studentId: studentProfile1._id.toString(),
        classId: class10A._id.toString(),
        academicYear: '2026-2027',
        rollNumber: '02',
      },
      adminSchoolA,
    );
    assert(false, 'Reject duplicate enrollment for same student in same academic year');
  } catch (err: any) {
    assert(
      err instanceof ConflictException,
      'Reject duplicate enrollment for same student in same academic year (ConflictException)',
    );
  }

  // Create 2nd student in School A
  const studentProfile2 = await studentProfilesService.create(
    {
      userId: studentUser3,
      admissionNumber: 'SCHA-2026-002',
      dateOfBirth: '2010-08-14',
      gender: Gender.FEMALE,
      address: defaultAddress,
    },
    adminSchoolA,
  );

  // Duplicate roll number in same class rejected
  try {
    await enrollmentsService.create(
      {
        studentId: studentProfile2._id.toString(),
        classId: class10A._id.toString(),
        academicYear: '2026-2027',
        rollNumber: '01', // Already taken by student 1!
      },
      adminSchoolA,
    );
    assert(false, 'Reject duplicate rollNumber in same class');
  } catch (err: any) {
    assert(
      err instanceof ConflictException,
      'Reject duplicate rollNumber in same class (ConflictException)',
    );
  }

  // 2nd valid enrollment (Capacity 2 / 2)
  let enrollment2: any;
  try {
    enrollment2 = await enrollmentsService.create(
      {
        studentId: studentProfile2._id.toString(),
        classId: class10A._id.toString(),
        academicYear: '2026-2027',
        rollNumber: '02',
      },
      adminSchoolA,
    );
    assert(
      enrollment2 && enrollment2.rollNumber === '02',
      'Enroll student 2 into Class 10-A (Capacity 2/2 - Class full)',
    );
  } catch (err: any) {
    assert(false, 'Enroll student 2', err.message);
  }

  // Create 3rd student and test capacity limit enforcement
  const studentProfile3 = await studentProfilesService.create(
    {
      userId: studentUser4,
      admissionNumber: 'SCHA-2026-003',
      dateOfBirth: '2010-11-05',
      gender: Gender.MALE,
      address: defaultAddress,
    },
    adminSchoolA,
  );

  try {
    await enrollmentsService.create(
      {
        studentId: studentProfile3._id.toString(),
        classId: class10A._id.toString(),
        academicYear: '2026-2027',
        rollNumber: '03',
      },
      adminSchoolA,
    );
    assert(false, 'Reject enrollment when class exceeds capacity limit');
  } catch (err: any) {
    assert(
      err instanceof BadRequestException,
      'Enforce class capacity limit: reject enrollment when class is full (BadRequestException)',
    );
  }

  console.log('\n--- 6. Testing Class Deletion Protection (Requirement 9) ---');
  // Deleting class10A while it has active enrollments must be prevented!
  try {
    await classesService.delete(class10A._id.toString(), adminSchoolA);
    assert(false, 'Prevent deleting class when active enrollments exist');
  } catch (err: any) {
    assert(
      err instanceof BadRequestException,
      'Prevent deleting class when active enrollments exist (BadRequestException)',
    );
  }

  console.log('\n--- 7. Testing Student Promotion & Historical Preservation (Tasks 24 & 26) ---');
  // Create Class 11-A for academic year 2027-2028
  const class11A = await classesService.create(
    {
      name: 'Grade 11 Section A',
      grade: 11,
      section: 'A',
      academicYear: '2027-2028',
      classTeacherId: teacherProfileA._id.toString(),
      capacity: 30,
    },
    adminSchoolA,
  );

  // Promote student 1 from Class 10-A to Class 11-A for 2027-2028
  try {
    const promotionResult = await enrollmentsService.promote(
      {
        currentEnrollmentId: enrollment1._id.toString(),
        targetClassId: class11A._id.toString(),
        newAcademicYear: '2027-2028',
        newRollNumber: '05',
      },
      adminSchoolA,
    );

    assert(
      promotionResult.previousEnrollment.status === EnrollmentStatus.PROMOTED,
      'Previous enrollment status updated to PROMOTED',
    );
    assert(
      promotionResult.newEnrollment.status === EnrollmentStatus.ACTIVE &&
        promotionResult.newEnrollment.academicYear === '2027-2028' &&
        promotionResult.newEnrollment.rollNumber === '05',
      'New enrollment created in target class for next academic year with ACTIVE status',
    );
    assert(
      enrollmentsDb.length === 3,
      'Historical enrollment records preserved in database (Audit Trail)',
    );
  } catch (err: any) {
    assert(false, 'Student promotion', err.message);
  }

  console.log('\n--- 8. Testing Audit Logging for Academic Events ---');
  assert(
    auditLogsDb.length >= 7,
    `Audit logs captured for academic operations (Total logged: ${auditLogsDb.length})`,
  );

  console.log('\n================================================================');
  console.log(`RESULTS: ${passed}/${total} TESTS PASSED`);
  console.log('================================================================');

  if (passed !== total) {
    process.exit(1);
  }
}

runAcademicModulesTests().catch((err) => {
  console.error('Unhandled test failure:', err);
  process.exit(1);
});
