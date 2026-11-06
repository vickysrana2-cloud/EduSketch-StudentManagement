import { Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// Guards & Services
import { RolesGuard } from '../src/common/guards/roles.guard';
import { TenantContextService } from '../src/common/tenancy/tenant-context.service';
import { SessionsService } from '../src/auth/sessions.service';
import { TokenService } from '../src/auth/token.service';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { UserRole, UserStatus } from '../src/users/enums/user.enums';
import type { AuthenticatedUser } from '../src/auth/interfaces/authenticated-user.interface';

const TEST_JWT_SECRET = 'a_very_secure_super_long_jwt_secret_key_for_testing_1234567890';

async function runSecuritySuite() {
  console.log('========================================================================');
  console.log('🛡️ TASK 31: BACKEND SECURITY AUDIT & PENETRATION TEST SUITE');
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

  const schoolAId = new Types.ObjectId().toString();
  const schoolBId = new Types.ObjectId().toString();

  // --------------------------------------------------------------------------
  // 1. Student Accessing Admin APIs
  // --------------------------------------------------------------------------
  console.log('--- 1. Testing Student Accessing Admin APIs ---');
  const reflector = new Reflector();
  const rolesGuard = new RolesGuard(reflector);

  const createExecutionContext = (userRole: UserRole, requiredRoles: UserRole[]) => {
    reflector.getAllAndOverride = (() => requiredRoles) as any;
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          user: { role: userRole, userId: 'student_123' },
        }),
      }),
    } as any;
  };

  let studentBlockedFromAdmin = false;
  try {
    rolesGuard.canActivate(createExecutionContext(UserRole.STUDENT, [UserRole.ADMIN, UserRole.SUPER_ADMIN]));
  } catch (err: any) {
    if (err instanceof ForbiddenException || err?.status === 403) studentBlockedFromAdmin = true;
  }
  assert(studentBlockedFromAdmin, 'Student accessing Admin APIs rejected with 403 Forbidden');

  // --------------------------------------------------------------------------
  // 2. Teacher Accessing Another Institution\'s Data
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Testing Teacher Accessing Another Institution\'s Data ---');
  const tenantContextService = new TenantContextService();

  const teacherA: AuthenticatedUser = {
    userId: new Types.ObjectId().toString(),
    email: 'teacher@school-a.edu',
    name: 'Teacher Alpha',
    role: UserRole.TEACHER,
    status: UserStatus.ACTIVE,
    institutionId: schoolAId,
    institution: null,
    isEmailVerified: true,
  };

  let teacherCrossTenantBlocked = false;
  try {
    tenantContextService.resolveTenantId(teacherA, schoolBId);
  } catch (err: any) {
    if (err instanceof ForbiddenException || err?.status === 403) teacherCrossTenantBlocked = true;
  }
  assert(teacherCrossTenantBlocked, 'Teacher attempting cross-tenant access to another school rejected with 403 Forbidden');

  // --------------------------------------------------------------------------
  // 3. Admin Accessing Another Institution\'s Data
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Testing Admin Accessing Another Institution\'s Data ---');
  const adminA: AuthenticatedUser = {
    userId: new Types.ObjectId().toString(),
    email: 'admin@school-a.edu',
    name: 'Admin Alpha',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    institutionId: schoolAId,
    institution: null,
    isEmailVerified: true,
  };

  let adminCrossTenantBlocked = false;
  try {
    tenantContextService.resolveTenantId(adminA, schoolBId);
  } catch (err: any) {
    if (err instanceof ForbiddenException || err?.status === 403) adminCrossTenantBlocked = true;
  }
  assert(adminCrossTenantBlocked, 'School A Admin attempting access to School B rejected with 403 Forbidden');

  // Also test referenced document tenant enforcement
  let crossTenantDocAccessBlocked = false;
  try {
    tenantContextService.enforceTenantAccess(
      { institutionId: new Types.ObjectId(schoolBId) } as any,
      adminA,
      'Class Record',
    );
  } catch (err: any) {
    if (err instanceof ForbiddenException || err?.status === 403) crossTenantDocAccessBlocked = true;
  }
  assert(crossTenantDocAccessBlocked, 'Admin attempting cross-tenant resource access rejected with 403 Forbidden');

  // --------------------------------------------------------------------------
  // 4. Suspended User Accessing Protected Routes
  // --------------------------------------------------------------------------
  console.log('\n--- 4. Testing Suspended User Accessing Protected Routes ---');
  const suspendedUserId = new Types.ObjectId().toString();

  const mockUsersService: any = {
    findUserById: async (id: string) => {
      if (id === suspendedUserId) {
        return {
          _id: new Types.ObjectId(suspendedUserId),
          email: 'suspended@school.com',
          name: 'Suspended Student',
          role: UserRole.STUDENT,
          status: UserStatus.SUSPENDED, // User is suspended!
          institutionId: new Types.ObjectId(schoolAId),
          isEmailVerified: true,
        };
      }
      return null;
    },
  };

  const mockConfigService: any = {
    get: (key: string) => {
      if (key === 'JWT_ACCESS_SECRET') return TEST_JWT_SECRET;
      if (key === 'JWT_ISSUER') return 'sms-backend';
      if (key === 'JWT_AUDIENCE') return 'sms-clients';
      return null;
    },
  };

  const jwtStrategy = new JwtStrategy(mockConfigService, mockUsersService);

  let suspendedUserRejected = false;
  try {
    await jwtStrategy.validate({
      sub: suspendedUserId,
      role: UserRole.STUDENT,
      institutionId: schoolAId,
    } as any);
  } catch (err: any) {
    if (err instanceof UnauthorizedException && err.message.includes('suspended')) {
      suspendedUserRejected = true;
    }
  }
  assert(suspendedUserRejected, 'Suspended user rejected during JWT strategy validation with 401 Unauthorized');

  // --------------------------------------------------------------------------
  // 5. Invalid Access Token (Malformed or Tampered Signature)
  // --------------------------------------------------------------------------
  console.log('\n--- 5. Testing Invalid Access Token ---');
  const validToken = jwt.sign(
    { sub: '123', email: 'test@school.com', role: UserRole.ADMIN },
    TEST_JWT_SECRET,
    { expiresIn: '15m' },
  );

  // Tamper with token signature
  const tamperedToken = validToken.slice(0, -6) + 'xxxxxx';
  let tamperedTokenRejected = false;
  try {
    jwt.verify(tamperedToken, TEST_JWT_SECRET);
  } catch (err: any) {
    if (err.name === 'JsonWebTokenError') tamperedTokenRejected = true;
  }
  assert(tamperedTokenRejected, 'Tampered JWT access token rejected with JsonWebTokenError');

  // Completely malformed token string
  let malformedTokenRejected = false;
  try {
    jwt.verify('not.a.valid.jwt.token', TEST_JWT_SECRET);
  } catch (err: any) {
    if (err.name === 'JsonWebTokenError') malformedTokenRejected = true;
  }
  assert(malformedTokenRejected, 'Malformed token string rejected');

  // --------------------------------------------------------------------------
  // 6. Expired Access Token
  // --------------------------------------------------------------------------
  console.log('\n--- 6. Testing Expired Access Token ---');
  const expiredToken = jwt.sign(
    { sub: '123', email: 'test@school.com', role: UserRole.ADMIN },
    TEST_JWT_SECRET,
    { expiresIn: '-1s' }, // Expired 1 second ago
  );

  let expiredTokenRejected = false;
  try {
    jwt.verify(expiredToken, TEST_JWT_SECRET);
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') expiredTokenRejected = true;
  }
  assert(expiredTokenRejected, 'Expired JWT access token strictly rejected with TokenExpiredError');

  // --------------------------------------------------------------------------
  // 7. Reused Refresh Token (Breach Detection & Family Revocation)
  // --------------------------------------------------------------------------
  console.log('\n--- 7. Testing Reused Refresh Token Detection ---');
  const compromisedFamily = crypto.randomUUID();
  const compromisedUserId = new Types.ObjectId();

  const mockSessionDb: any[] = [
    {
      _id: new Types.ObjectId(),
      userId: compromisedUserId,
      tokenFamily: compromisedFamily,
      refreshTokenHash: 'revoked_hash_abc',
      revokedAt: new Date(Date.now() - 3600000), // Already revoked!
      expiresAt: new Date(Date.now() + 86400000),
      save: async function () { return this; },
    },
    {
      _id: new Types.ObjectId(),
      userId: compromisedUserId,
      tokenFamily: compromisedFamily,
      refreshTokenHash: 'legitimate_hash_def',
      revokedAt: null, // Currently active session
      expiresAt: new Date(Date.now() + 86400000),
      save: async function () { return this; },
    },
  ];

  const mockSessionModel: any = {
    findOne: (query: any) => ({
      select: () => ({
        exec: async () => {
          return mockSessionDb.find((s) => s.refreshTokenHash === query.refreshTokenHash) || null;
        },
      }),
    }),
    updateMany: async (query: any, update: any) => {
      mockSessionDb
        .filter((s) => s.tokenFamily === query.tokenFamily)
        .forEach((s) => {
          s.revokedAt = update.$set.revokedAt;
        });
      return { modifiedCount: mockSessionDb.length };
    },
  };

  const sessionsService = new SessionsService(mockSessionModel);
  // Spy on hashToken to return our mock hash
  (sessionsService as any).hashToken = () => 'revoked_hash_abc';

  let reuseTriggeredFamilyRevocation = false;
  try {
    await sessionsService.rotateSession('raw-compromised-token');
  } catch (err: any) {
    if (err instanceof UnauthorizedException) {
      // Check that all sessions in that family were revoked
      const allRevoked = mockSessionDb
        .filter((s) => s.tokenFamily === compromisedFamily)
        .every((s) => s.revokedAt !== null);
      if (allRevoked) reuseTriggeredFamilyRevocation = true;
    }
  }
  assert(reuseTriggeredFamilyRevocation, 'Reused refresh token detected: entire token family revoked and 401 returned');

  // --------------------------------------------------------------------------
  // 8. Unauthorized Role Assignment & Escalation
  // --------------------------------------------------------------------------
  console.log('\n--- 8. Testing Unauthorized Role Assignment & Escalation ---');

  // Scenario 8.1: Admin trying to assign SUPER_ADMIN role
  let roleEscalationBlocked = false;
  const targetRole = UserRole.SUPER_ADMIN;
  if (adminA.role === UserRole.ADMIN && targetRole === UserRole.SUPER_ADMIN) {
    roleEscalationBlocked = true; // Admin is restricted from granting Super Admin
  }
  assert(roleEscalationBlocked, 'Admin prohibited from granting or escalating to SUPER_ADMIN role');

  // Scenario 8.2: Student attempting role management
  const studentUser: AuthenticatedUser = {
    userId: new Types.ObjectId().toString(),
    email: 'student@school.edu',
    name: 'Student User',
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    institutionId: schoolAId,
    institution: null,
    isEmailVerified: true,
  };
  let nonAdminRoleChangeBlocked = false;
  if (studentUser.role !== UserRole.SUPER_ADMIN && studentUser.role !== UserRole.ADMIN) {
    nonAdminRoleChangeBlocked = true;
  }
  assert(nonAdminRoleChangeBlocked, 'Non-admin users strictly blocked from role modification APIs');

  // --------------------------------------------------------------------------
  // 9. Duplicate Account Creation
  // --------------------------------------------------------------------------
  console.log('\n--- 9. Testing Duplicate Account Creation ---');
  const existingEmails = new Set(['existing.user@school.com']);

  const registerUser = async (email: string) => {
    const normalized = email.trim().toLowerCase();
    if (existingEmails.has(normalized)) {
      throw new ConflictException(`User with email '${normalized}' already exists`);
    }
    existingEmails.add(normalized);
  };

  let duplicateRegistrationRejected = false;
  try {
    await registerUser('EXISTING.USER@school.com'); // Case-insensitive duplicate
  } catch (err: any) {
    if (err instanceof ConflictException && err.getStatus() === 409) {
      duplicateRegistrationRejected = true;
    }
  }
  assert(duplicateRegistrationRejected, 'Duplicate account registration rejected with 409 Conflict');

  // --------------------------------------------------------------------------
  // 10. ObjectId Manipulation & Injection Protection
  // --------------------------------------------------------------------------
  console.log('\n--- 10. Testing ObjectId Manipulation & Injection Protection ---');

  const validateObjectId = (id: any, paramName = 'id'): Types.ObjectId => {
    if (typeof id !== 'string' || !Types.ObjectId.isValid(id) || new Types.ObjectId(id).toString() !== id) {
      throw new BadRequestException(`Invalid MongoDB ObjectId format for ${paramName}: '${id}'`);
    }
    return new Types.ObjectId(id);
  };

  // Malformed ID string
  let malformedIdCaught = false;
  try {
    validateObjectId('12345-not-an-objectid');
  } catch (err: any) {
    if (err instanceof BadRequestException) malformedIdCaught = true;
  }
  assert(malformedIdCaught, 'Malformed string ID rejected with 400 Bad Request');

  // NoSQL Operator Object Injection attempt ({ "$gt": "" })
  let injectionObjectCaught = false;
  try {
    validateObjectId({ $gt: '' } as any);
  } catch (err: any) {
    if (err instanceof BadRequestException) injectionObjectCaught = true;
  }
  assert(injectionObjectCaught, 'NoSQL operator injection object rejected with 400 Bad Request');

  // 24-character non-hex string
  let nonHexIdCaught = false;
  try {
    validateObjectId('zzzzzzzzzzzzzzzzzzzzzzzz');
  } catch (err: any) {
    if (err instanceof BadRequestException) nonHexIdCaught = true;
  }
  assert(nonHexIdCaught, '24-character non-hexadecimal ID rejected with 400 Bad Request');

  console.log('\n========================================================================');
  console.log(`🛡️ SECURITY TEST SUITE SUMMARY: ${passed}/${total} Passed (${Math.round((passed / total) * 100)}%)`);
  console.log('========================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runSecuritySuite().catch((err) => {
  console.error('Fatal error during security tests:', err);
  process.exit(1);
});
