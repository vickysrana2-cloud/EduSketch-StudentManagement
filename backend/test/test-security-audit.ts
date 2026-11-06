import { Types } from 'mongoose';
import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { SuperAdminGuard } from '../src/common/guards/super-admin.guard';
import { UserManagementGuard } from '../src/common/guards/user-management.guard';
import { escapeRegex } from '../src/common/utils/regex.util';
import { AuthService } from '../src/auth/auth.service';
import { SessionsService } from '../src/auth/sessions.service';
import { TokenService } from '../src/auth/token.service';
import { TenantContextService } from '../src/common/tenancy/tenant-context.service';
import { AuditLogsService } from '../src/audit-logs/audit-logs.service';
import { AuditAction } from '../src/audit-logs/enums/audit-action.enum';
import { UserRole, UserStatus } from '../src/users/enums/user.enums';
import type { AuthenticatedUser } from '../src/auth/interfaces/authenticated-user.interface';

async function runSecurityAuditTests() {
  console.log('========================================================================');
  console.log('🔒 TASK 29: BACKEND AUTHENTICATION & AUTHORIZATION SECURITY AUDIT SUITE');
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

  // --- 1. Test Vulnerability Fix: Header Spoofing in Production (CRITICAL) ---
  console.log('--- 1. Testing Production Header Spoofing Elimination (CRITICAL) ---');

  const superAdminGuard = new SuperAdminGuard();
  const userManagementGuard = new UserManagementGuard();

  // 1.1 Simulate Production environment
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  const fakeExecutionContext = (req: any) => ({
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  } as any);

  try {
    const unauthenticatedReq = {
      headers: {
        'x-user-role': 'SUPER_ADMIN',
      },
    };
    superAdminGuard.canActivate(fakeExecutionContext(unauthenticatedReq));
    assert(false, 'Should block x-user-role header spoofing in production (SuperAdminGuard)');
  } catch (err: any) {
    assert(
      err instanceof UnauthorizedException,
      'SuperAdminGuard strictly blocks unauthenticated x-user-role spoofing in production (401 Unauthorized)',
    );
  }

  try {
    const unauthenticatedReq = {
      headers: {
        'x-user-role': 'ADMIN',
      },
    };
    userManagementGuard.canActivate(fakeExecutionContext(unauthenticatedReq));
    assert(false, 'Should block x-user-role header spoofing in production (UserManagementGuard)');
  } catch (err: any) {
    assert(
      err instanceof UnauthorizedException,
      'UserManagementGuard strictly blocks unauthenticated x-user-role spoofing in production (401 Unauthorized)',
    );
  }

  // 1.2 JWT Authenticated User passes cleanly in production
  const jwtSuperAdminReq = {
    user: {
      userId: new Types.ObjectId().toString(),
      role: UserRole.SUPER_ADMIN,
    },
    headers: {},
  };
  const passedJwtSuperAdmin = superAdminGuard.canActivate(fakeExecutionContext(jwtSuperAdminReq));
  assert(passedJwtSuperAdmin === true, 'JWT-authenticated SUPER_ADMIN successfully authorized in production');

  // Reset NODE_ENV to original for subsequent tests
  process.env.NODE_ENV = originalEnv;

  // 1.3 In non-production (development/testing), dev header fallback continues working
  const devReq = {
    headers: {
      'x-user-role': 'SUPER_ADMIN',
      'x-user-id': '111111111111111111111111',
    },
  };
  const passedDevHeader = superAdminGuard.canActivate(fakeExecutionContext(devReq));
  assert(passedDevHeader === true, 'Dev/testing environment permits simulated test headers safely');

  // --- 2. Test Vulnerability Fix: ReDoS & Regex Injection Protection (HIGH) ---
  console.log('\n--- 2. Testing ReDoS & Regex Injection Crash Protection (HIGH) ---');

  // 2.1 Malformed regex input (unterminated bracket) that crashes raw new RegExp
  const maliciousSearchInput = '[unclosed-bracket-attack(';
  let didThrowUncaughtSyntax = false;
  try {
    const sanitized = escapeRegex(maliciousSearchInput);
    const regex = new RegExp(sanitized, 'i');
    didThrowUncaughtSyntax = false;
    assert(
      regex.test('[unclosed-bracket-attack('),
      'Sanitized regex matches literal special character string without crashing',
    );
  } catch (e) {
    didThrowUncaughtSyntax = true;
  }
  assert(!didThrowUncaughtSyntax, 'escapeRegex neutralizes SyntaxError: Invalid regular expression');

  // 2.2 ReDoS polynomial backtracking pattern sanitized
  const redosPattern = '((((((a+)+)+)+)+)+)$';
  const sanitizedRedos = escapeRegex(redosPattern);
  const safeRegex = new RegExp(sanitizedRedos);
  assert(
    safeRegex.source.includes('\\(') && safeRegex.source.includes('\\+'),
    'ReDoS repetition quantifiers are escaped as harmless literal characters',
  );

  // --- 3. Test Vulnerability Fix: Timing Attack & User Enumeration (MEDIUM) ---
  console.log('\n--- 3. Testing User Enumeration Timing Attack Mitigation (MEDIUM) ---');

  // Mock DB for AuthService
  const usersDb: any[] = [];
  const auditLogsDb: any[] = [];
  const sessionsDb: any[] = [];

  const realPassword = 'CorrectPassword123!';
  const hashedPassword = await bcrypt.hash(realPassword, 10);
  const targetUserId = new Types.ObjectId().toString();

  const mockUserModel: any = {
    findOne: (query: any) => ({
      select: function () { return this; },
      populate: function () { return this; },
      exec: async () => {
        const found = usersDb.find((u) => u.email === query.email);
        return found || null;
      },
    }),
    findById: (id: any) => ({
      populate: function () { return this; },
      exec: async () => usersDb.find((u) => u._id.toString() === id.toString()) || null,
    }),
    findByIdAndUpdate: (id: any, update: any) => ({
      exec: async () => {
        const found = usersDb.find((u) => u._id.toString() === id.toString());
        if (found && update.$set) Object.assign(found, update.$set);
        return found || null;
      },
    }),
  };

  usersDb.push({
    _id: new Types.ObjectId(targetUserId),
    name: 'Audit Target',
    email: 'valid.user@school.edu',
    passwordHash: hashedPassword,
    role: UserRole.TEACHER,
    status: UserStatus.ACTIVE,
    isEmailVerified: true,
    institutionId: new Types.ObjectId(),
  });

  const mockAuditLogsService: any = {
    logAction: async (entry: any) => {
      auditLogsDb.push({ ...entry, _id: new Types.ObjectId(), createdAt: new Date() });
      return entry;
    },
  };

  const mockSessionModel: any = function (data: any) {
    const doc = {
      _id: new Types.ObjectId(),
      ...data,
      save: async function () {
        sessionsDb.push(this);
        return this;
      },
    };
    return doc;
  };
  mockSessionModel.findOne = (q: any) => ({
    select: function () { return this; },
    exec: async () => sessionsDb.find((s) => s.refreshTokenHash === q.refreshTokenHash) || null,
  });
  mockSessionModel.updateMany = async (filter: any, update: any) => {
    let count = 0;
    sessionsDb.forEach((s) => {
      if (s.tokenFamily === filter.tokenFamily) {
        Object.assign(s, update.$set);
        count++;
      }
    });
    return { modifiedCount: count };
  };

  const sessionsService = new SessionsService(mockSessionModel);

  const mockConfigService: any = {
    get: (key: string) => {
      if (key === 'JWT_ACCESS_SECRET') return 'super_secret_access_key_minimum_32_characters_long_12345';
      if (key === 'JWT_REFRESH_SECRET') return 'super_secret_refresh_key_minimum_32_characters_long_12345';
      if (key === 'JWT_ACCESS_EXPIRES_IN') return '15m';
      if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
      return null;
    },
  };

  const mockJwtService: any = {
    signAsync: async () => 'mock.jwt.token',
    verifyAsync: async () => ({ sub: targetUserId, role: UserRole.TEACHER }),
  };

  const tokenService = new TokenService(mockJwtService, mockConfigService);
  tokenService.onModuleInit();

  const authService = new AuthService(
    mockUserModel,
    {} as any,
    mockJwtService,
    mockConfigService,
    {} as any,
    sessionsService,
    tokenService,
    mockAuditLogsService,
  );

  // 3.1 Timing attack verification: compare against non-existent email
  const startUnknown = Date.now();
  try {
    await authService.login({ email: 'nonexistent@school.edu', password: 'SomePassword123!' });
    assert(false, 'Should reject non-existent user');
  } catch (err: any) {
    const duration = Date.now() - startUnknown;
    assert(
      err instanceof UnauthorizedException,
      'Reject non-existent user with generic Invalid email or password (401)',
    );
    assert(
      duration >= 30, // Bcrypt calculation takes time; confirms dummy hash was executed
      `Bcrypt execution confirmed for non-existent user (${duration}ms) - user enumeration prevented`,
    );
  }

  // --- 4. Test Vulnerability Fix: Audit Logging for Authentication Lifecycle (MEDIUM) ---
  console.log('\n--- 4. Testing Audit Logging for Authentication Lifecycle (MEDIUM) ---');

  // 4.1 Check LOGIN_FAILED recorded for non-existent email
  const failedUnknownLog = auditLogsDb.find(
    (l) => l.action === AuditAction.LOGIN_FAILED && l.metadata?.reason === 'USER_NOT_FOUND',
  );
  assert(!!failedUnknownLog, 'Audit log created for LOGIN_FAILED (reason: USER_NOT_FOUND)');

  // 4.2 Check LOGIN_FAILED recorded for wrong password
  try {
    await authService.login({ email: 'valid.user@school.edu', password: 'WrongPassword999!' });
    assert(false, 'Should reject invalid password');
  } catch (err: any) {
    assert(err instanceof UnauthorizedException, 'Reject wrong password with generic 401');
  }

  const failedPasswordLog = auditLogsDb.find(
    (l) => l.action === AuditAction.LOGIN_FAILED && l.metadata?.reason === 'INVALID_PASSWORD',
  );
  assert(!!failedPasswordLog, 'Audit log created for LOGIN_FAILED (reason: INVALID_PASSWORD)');

  // 4.3 Check LOGIN_SUCCESS recorded on valid credentials
  const loginRes = await authService.login({
    email: 'valid.user@school.edu',
    password: realPassword,
  });
  assert(!!loginRes.accessToken && !!loginRes.refreshToken, 'Successful login returns tokens');

  const successLog = auditLogsDb.find((l) => l.action === AuditAction.LOGIN_SUCCESS);
  assert(!!successLog, 'Audit log created for LOGIN_SUCCESS');

  // 4.4 Check LOGOUT_ALL recorded
  await authService.logoutAll(targetUserId);
  const logoutAllLog = auditLogsDb.find((l) => l.action === AuditAction.LOGOUT_ALL);
  assert(!!logoutAllLog, 'Audit log created for LOGOUT_ALL');

  // --- 5. Test Refresh Token Reuse Detection & Family Breach Invalidation (CRITICAL) ---
  console.log('\n--- 5. Testing Refresh Token Reuse Detection & Breach Containment (CRITICAL) ---');

  const sessionOne = await sessionsService.createSession({ userId: targetUserId });
  const rawTokenOne = sessionOne.rawRefreshToken;

  // Normal rotation: token 1 rotated to token 2
  const rotationOne = await sessionsService.rotateSession(rawTokenOne);
  assert(!!rotationOne.newRawRefreshToken, 'Initial token rotation succeeds');

  // Reuse breach: Attacker presents old rawTokenOne which is already revoked!
  try {
    await sessionsService.rotateSession(rawTokenOne);
    assert(false, 'Should detect reuse of revoked refresh token');
  } catch (err: any) {
    assert(
      err instanceof UnauthorizedException,
      'Refresh token reuse breach detected and blocked (401 Unauthorized)',
    );
  }

  // Verify that the entire token family was revoked as a result of reuse attempt
  const allFamilySessions = sessionsDb.filter((s) => s.tokenFamily === sessionOne.tokenFamily);
  const allRevoked = allFamilySessions.every((s) => s.revokedAt !== null);
  assert(allRevoked, 'Security Alert: All active sessions in compromised family revoked immediately');

  // --- 6. Test Inactive and Suspended Account Access Rejection (HIGH) ---
  console.log('\n--- 6. Testing Suspended and Inactive Account Rejection (HIGH) ---');

  usersDb.push({
    _id: new Types.ObjectId(),
    name: 'Suspended Account',
    email: 'suspended@school.edu',
    passwordHash: hashedPassword,
    role: UserRole.STUDENT,
    status: UserStatus.SUSPENDED,
    isEmailVerified: true,
    institutionId: new Types.ObjectId(),
  });

  try {
    await authService.login({ email: 'suspended@school.edu', password: realPassword });
    assert(false, 'Should reject suspended account');
  } catch (err: any) {
    assert(
      err instanceof UnauthorizedException && err.message.includes('suspended'),
      'Suspended user login rejected with descriptive account notice (401)',
    );
  }

  // --- 7. Test Sensitive Response Field Non-Exposure (HIGH) ---
  console.log('\n--- 7. Testing Sensitive Field Non-Exposure (HIGH) ---');

  assert(
    (loginRes.user as any).passwordHash === undefined,
    'passwordHash is strictly excluded from login response payload',
  );
  assert(
    (loginRes as any).refreshTokenHash === undefined,
    'refreshTokenHash is strictly excluded from login response payload',
  );

  // --- 8. Test Multi-Tenant Cross-School Data Isolation (CRITICAL) ---
  console.log('\n--- 8. Testing Multi-Tenant Data Isolation Enforcement (CRITICAL) ---');

  const tenantContextService = new TenantContextService();
  const schoolAlphaId = new Types.ObjectId().toString();
  const schoolBetaId = new Types.ObjectId().toString();

  const adminAlpha: AuthenticatedUser = {
    userId: new Types.ObjectId().toString(),
    email: 'admin@alpha.edu',
    name: 'Alpha Admin',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    institutionId: schoolAlphaId,
    institution: null,
    isEmailVerified: true,
  };

  try {
    tenantContextService.resolveTenantId(adminAlpha, schoolBetaId);
    assert(false, 'Should block cross-institution query parameter injection');
  } catch (err: any) {
    assert(
      err instanceof ForbiddenException,
      'Admin A attempting to impersonate School B rejected with 403 Forbidden',
    );
  }

  try {
    tenantContextService.validateSameInstitution(
      { institutionId: schoolAlphaId },
      { institutionId: schoolBetaId },
      'Class reference',
    );
    assert(false, 'Should block cross-institution document references');
  } catch (err: any) {
    assert(
      err instanceof BadRequestException,
      'Cross-institution reference injection blocked with BadRequestException',
    );
  }

  console.log('\n========================================================================');
  console.log(`AUDIT VERIFICATION RESULTS: ${passed}/${total} SECURITY TESTS PASSED`);
  console.log('========================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runSecurityAuditTests().catch((err) => {
  console.error('Fatal error in security audit test suite:', err);
  process.exit(1);
});

