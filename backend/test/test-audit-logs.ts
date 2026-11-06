import { Types } from 'mongoose';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AuditLogsService } from '../src/audit-logs/audit-logs.service';
import { AuditAction } from '../src/audit-logs/enums/audit-action.enum';
import { AuditModule } from '../src/audit-logs/enums/audit-module.enum';
import { UserRole, UserStatus } from '../src/users/enums/user.enums';
import { AuthenticatedUser } from '../src/auth/interfaces/authenticated-user.interface';

async function runAuditLogsTests() {
  console.log('================================================================');
  console.log('🚀 TASK 27: CENTRALIZED AUDIT LOGS MODULE VERIFICATION');
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

  // In-memory collection of audit logs
  const auditLogsDb: any[] = [];

  // Mock Institutions
  const schoolAId = new Types.ObjectId().toString();
  const schoolBId = new Types.ObjectId().toString();

  // Mock Users
  const superAdminId = new Types.ObjectId().toString();
  const superAdminUser: AuthenticatedUser = {
    userId: superAdminId,
    email: 'superadmin@platform.gov',
    name: 'Super Admin',
    role: UserRole.SUPER_ADMIN,
    status: UserStatus.ACTIVE,
    institutionId: null,
    institution: null,
    isEmailVerified: true,
  };

  const adminSchoolAId = new Types.ObjectId().toString();
  const adminSchoolAUser: AuthenticatedUser = {
    userId: adminSchoolAId,
    email: 'principal@schoolA.edu',
    name: 'Principal School A',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    institutionId: schoolAId,
    institution: { id: schoolAId, name: 'Greenwood High', code: 'GWH', status: anyStatus('ACTIVE') },
    isEmailVerified: true,
  };

  const adminSchoolBId = new Types.ObjectId().toString();
  const adminSchoolBUser: AuthenticatedUser = {
    userId: adminSchoolBId,
    email: 'principal@schoolB.edu',
    name: 'Principal School B',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    institutionId: schoolBId,
    institution: { id: schoolBId, name: 'St. Xavier Academy', code: 'SXA', status: anyStatus('ACTIVE') },
    isEmailVerified: true,
  };

  const teacherUser: AuthenticatedUser = {
    userId: new Types.ObjectId().toString(),
    email: 'teacher@schoolA.edu',
    name: 'Teacher John',
    role: UserRole.TEACHER,
    status: UserStatus.ACTIVE,
    institutionId: schoolAId,
    institution: null,
    isEmailVerified: true,
  };

  function anyStatus(s: string): any {
    return s;
  }

  // Mock Mongoose Model
  const mockAuditLogModel: any = function (data: any) {
    const doc: any = {
      ...data,
      _id: data._id || new Types.ObjectId(),
      createdAt: data.createdAt || new Date(),
      save: async function () {
        auditLogsDb.push(this);
        return this;
      },
    };
    return doc;
  };

  mockAuditLogModel.find = (filterQuery: any) => ({
    sort: () => ({
      skip: (skip: number) => ({
        limit: (limit: number) => ({
          populate: () => ({
            populate: () => ({
              exec: async () => {
                let results = auditLogsDb.filter((log) => matchesFilter(log, filterQuery));
                // Sort createdAt desc
                results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                return results.slice(skip, skip + limit);
              },
            }),
          }),
        }),
      }),
    }),
  });

  mockAuditLogModel.countDocuments = (filterQuery: any) => ({
    exec: async () => {
      return auditLogsDb.filter((log) => matchesFilter(log, filterQuery)).length;
    },
  });

  mockAuditLogModel.findById = (id: any) => ({
    populate: () => ({
      populate: () => ({
        exec: async () => {
          return auditLogsDb.find((log) => log._id.toString() === id.toString()) || null;
        },
      }),
    }),
  });

  function matchesFilter(log: any, query: any): boolean {
    if (query.institutionId) {
      if (!log.institutionId || log.institutionId.toString() !== query.institutionId.toString()) {
        return false;
      }
    }
    if (query.module && log.module !== query.module) {
      return false;
    }
    if (query.action && log.action !== query.action) {
      return false;
    }
    if (query.userId) {
      if (!log.userId || log.userId.toString() !== query.userId.toString()) {
        return false;
      }
    }
    if (query.targetId && log.targetId !== query.targetId) {
      return false;
    }
    if (query.createdAt) {
      if (query.createdAt.$gte && log.createdAt < query.createdAt.$gte) return false;
      if (query.createdAt.$lte && log.createdAt > query.createdAt.$lte) return false;
    }
    if (query.$or) {
      const regex = query.$or[0].description;
      const descMatch = regex.test(log.description);
      const targetMatch = log.targetType && regex.test(log.targetType);
      const ipMatch = log.ipAddress && regex.test(log.ipAddress);
      if (!descMatch && !targetMatch && !ipMatch) return false;
    }
    return true;
  }

  const service = new AuditLogsService(mockAuditLogModel);

  // =========================================================================
  // TEST SUITE 1: Metadata Sanitization (Requirement 7)
  // =========================================================================
  console.log('📌 Test Suite 1: Sensitive Metadata Scrubbing & Redaction');
  const dirtyMetadata = {
    username: 'john.doe',
    password: 'SuperSecretPassword123!',
    passwordHash: '$2a$12$e8F0sM9e8k1fJ99a.hashedpasswordsecret',
    refreshToken: 'd3f0a1b2c3d4e5f6a7b8c9d0',
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    jwtSecretKey: 'do-not-reveal-my-secret',
    nestedProfile: {
      email: 'john@example.com',
      currentPassword: 'oldpassword',
      authToken: 'bearer-token-here',
      safeRole: 'TEACHER',
    },
    arrayField: [
      { token: 'secret-token-1' },
      { publicNote: 'approved' },
    ],
  };

  const sanitized = service.sanitizeMetadata(dirtyMetadata);

  assert(sanitized.password === '[REDACTED]', 'Password field automatically redacted');
  assert(sanitized.passwordHash === '[REDACTED]', 'passwordHash automatically redacted');
  assert(sanitized.refreshToken === '[REDACTED]', 'refreshToken automatically redacted');
  assert(sanitized.accessToken === '[REDACTED]', 'accessToken automatically redacted');
  assert(sanitized.jwtSecretKey === '[REDACTED]', 'Secret key field automatically redacted');
  assert(sanitized.nestedProfile.currentPassword === '[REDACTED]', 'Nested password redacted');
  assert(sanitized.nestedProfile.authToken === '[REDACTED]', 'Nested authToken redacted');
  assert(sanitized.nestedProfile.safeRole === 'TEACHER', 'Non-sensitive nested fields preserved');
  assert(sanitized.arrayField[0].token === '[REDACTED]', 'Array-nested tokens redacted');
  assert(sanitized.arrayField[1].publicNote === 'approved', 'Non-sensitive array fields preserved');

  // =========================================================================
  // TEST SUITE 2: Recording Required Audit Actions (Requirement 2)
  // =========================================================================
  console.log('\n📌 Test Suite 2: Recording Required Audit Actions');

  // 1. User Created
  const targetTeacherId = new Types.ObjectId().toString();
  await service.logAction({
    userId: adminSchoolAId,
    institutionId: schoolAId,
    action: AuditAction.USER_CREATED,
    module: AuditModule.USERS,
    description: 'Admin created a new teacher account',
    targetId: targetTeacherId,
    targetType: 'USER',
    ipAddress: '192.168.1.50',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    metadata: { assignedRole: 'TEACHER', department: 'Mathematics' },
  });

  // 2. Login Success
  await service.logAction({
    userId: adminSchoolAId,
    institutionId: schoolAId,
    action: AuditAction.LOGIN_SUCCESS,
    module: AuditModule.AUTH,
    description: 'User login successful',
    ipAddress: '192.168.1.50',
    userAgent: 'Mozilla/5.0 Chrome',
    metadata: { authMethod: 'PASSWORD' },
  });

  // 3. Login Failed (Anonymous / Unauthenticated actor)
  await service.logAction({
    userId: null,
    institutionId: null,
    action: AuditAction.LOGIN_FAILED,
    module: AuditModule.AUTH,
    description: 'Failed login attempt with invalid password',
    ipAddress: '203.0.113.195',
    userAgent: 'curl/7.68.0',
    metadata: { attemptedEmail: 'hacker@malicious.com' },
  });

  // 4. Role Changed
  await service.logAction({
    userId: superAdminId,
    institutionId: null,
    action: AuditAction.ROLE_CHANGED,
    module: AuditModule.ROLES,
    description: 'Super Admin updated role metadata',
    targetId: 'TEACHER',
    targetType: 'ROLE',
    metadata: { previousDisplayName: 'Teacher', newDisplayName: 'Academic Instructor' },
  });

  // 5. Institution Created
  await service.logAction({
    userId: superAdminId,
    institutionId: schoolAId,
    action: AuditAction.INSTITUTION_CREATED,
    module: AuditModule.INSTITUTIONS,
    description: 'Super Admin created institution Greenwood High',
    targetId: schoolAId,
    targetType: 'INSTITUTION',
    metadata: { code: 'GWH' },
  });

  // 6. Student Admitted (School B)
  const studentBId = new Types.ObjectId().toString();
  await service.logAction({
    userId: adminSchoolBId,
    institutionId: schoolBId,
    action: AuditAction.STUDENT_ADMITTED,
    module: AuditModule.STUDENTS,
    description: 'Admitted new student to Grade 10',
    targetId: studentBId,
    targetType: 'STUDENT',
    ipAddress: '10.0.0.12',
    metadata: { grade: '10A', rollNo: '1001' },
  });

  assert(auditLogsDb.length === 6, `Recorded 6 distinct audit events (Got: ${auditLogsDb.length})`);

  // Verify structure of first log
  const firstLog = auditLogsDb[0];
  assert(firstLog.action === AuditAction.USER_CREATED, 'Action correctly recorded');
  assert(firstLog.module === AuditModule.USERS, 'Module correctly recorded');
  assert(firstLog.ipAddress === '192.168.1.50', 'IP address captured');
  assert(firstLog.userAgent.includes('Windows'), 'User agent captured');
  assert(firstLog.targetType === 'USER', 'Target type captured');

  // =========================================================================
  // TEST SUITE 3: Multi-Tenant Query Isolation (Requirement 8)
  // =========================================================================
  console.log('\n📌 Test Suite 3: Multi-Tenant Access Control & Isolation');

  // School A Admin query
  const schoolALogs = await service.findAll({ page: 1, limit: 10 }, adminSchoolAUser);
  assert(
    schoolALogs.items.every((item) => item.institution?.id === schoolAId),
    'School A Admin only sees logs belonging to School A',
  );
  assert(
    !schoolALogs.items.some((item) => item.institution?.id === schoolBId),
    'School A Admin CANNOT see School B student admission log',
  );

  // School A Admin trying to pass schoolB institutionId in query -> Rejected
  let crossTenantQueryBlocked = false;
  try {
    await service.findAll({ institutionId: schoolBId }, adminSchoolAUser);
  } catch (err: any) {
    if (err instanceof ForbiddenException && err.message.includes('Tenant violation')) {
      crossTenantQueryBlocked = true;
    }
  }
  assert(crossTenantQueryBlocked, 'School A Admin blocked from requesting School B logs with 403 Forbidden');

  // Super Admin query without filter (Sees across all institutions)
  const superAdminLogs = await service.findAll({ page: 1, limit: 10 }, superAdminUser);
  assert(superAdminLogs.total === 6, `Super Admin has universal visibility across all 6 logs (Got: ${superAdminLogs.total})`);

  // Super Admin filtering specifically by School B
  const superAdminSchoolBLogs = await service.findAll({ institutionId: schoolBId }, superAdminUser);
  assert(superAdminSchoolBLogs.total === 1, `Super Admin can filter by School B (Got: ${superAdminSchoolBLogs.total})`);

  // Non-administrator (Teacher) blocked from audit logs
  let teacherBlocked = false;
  try {
    await service.findAll({}, teacherUser);
  } catch (err: any) {
    if (err instanceof ForbiddenException) {
      teacherBlocked = true;
    }
  }
  assert(teacherBlocked, 'TEACHER role blocked from viewing audit logs with 403 Forbidden');

  // =========================================================================
  // TEST SUITE 4: Pagination & Filtering (Requirement 11)
  // =========================================================================
  console.log('\n📌 Test Suite 4: Pagination & Filtering');

  // Filter by Module = AUTH
  const authLogs = await service.findAll({ module: AuditModule.AUTH }, superAdminUser);
  assert(authLogs.total === 2, `Module filter (AUTH) returned 2 logs (Got: ${authLogs.total})`);

  // Filter by Action = USER_CREATED
  const userCreatedLogs = await service.findAll({ action: AuditAction.USER_CREATED }, superAdminUser);
  assert(userCreatedLogs.total === 1, `Action filter (USER_CREATED) returned 1 log (Got: ${userCreatedLogs.total})`);

  // Search filter
  const searchLogs = await service.findAll({ search: 'teacher account' }, superAdminUser);
  assert(searchLogs.total === 1, `Search query filter returned matching log (Got: ${searchLogs.total})`);

  // Pagination limit
  const pageResult = await service.findAll({ page: 1, limit: 2 }, superAdminUser);
  assert(pageResult.items.length === 2, 'Page size limit of 2 respected');
  assert(pageResult.totalPages === 3, 'Total pages calculated correctly (6 / 2 = 3)');

  // =========================================================================
  // TEST SUITE 5: findById with Tenant Boundary Check
  // =========================================================================
  console.log('\n📌 Test Suite 5: findById with Tenant Verification');

  const schoolALogId = firstLog._id.toString();
  const schoolALogItem = await service.findById(schoolALogId, adminSchoolAUser);
  assert(schoolALogItem.id === schoolALogId, 'School A Admin can fetch School A log by ID');

  // School B Admin attempting to fetch School A log by ID
  let crossSchoolFetchBlocked = false;
  try {
    await service.findById(schoolALogId, adminSchoolBUser);
  } catch (err: any) {
    if (err instanceof ForbiddenException && err.message.includes('Access denied')) {
      crossSchoolFetchBlocked = true;
    }
  }
  assert(crossSchoolFetchBlocked, 'School B Admin blocked from fetching School A log by ID (403 Forbidden)');

  // Non-existent ID throws 404
  let notFoundCaught = false;
  try {
    await service.findById(new Types.ObjectId().toString(), superAdminUser);
  } catch (err: any) {
    if (err instanceof NotFoundException) {
      notFoundCaught = true;
    }
  }
  assert(notFoundCaught, 'Non-existent audit log ID throws 404 NotFoundException');

  // Malformed ID throws 400
  let badIdCaught = false;
  try {
    await service.findById('invalid-id', superAdminUser);
  } catch (err: any) {
    if (err instanceof BadRequestException) {
      badIdCaught = true;
    }
  }
  assert(badIdCaught, 'Malformed ObjectId throws 400 BadRequestException');

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n================================================================');
  console.log(`📊 FINAL RESULT: ${passed}/${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runAuditLogsTests().catch((err) => {
  console.error('Fatal error during AuditLogs verification:', err);
  process.exit(1);
});

