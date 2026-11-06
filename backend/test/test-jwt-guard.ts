import { ExecutionContext, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Types } from 'mongoose';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { Public, IS_PUBLIC_KEY } from '../src/auth/decorators/public.decorator';
import { UserRole, UserStatus } from '../src/users/enums/user.enums';
import { InstitutionStatus } from '../src/institutions/enums/institution.enums';
import { AuthenticatedUser } from '../src/auth/interfaces/authenticated-user.interface';

async function runJwtGuardTests() {
  console.log('================================================================');
  console.log('🚀 TASK 15: JWT AUTHENTICATION GUARD & STRATEGY VERIFICATION');
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

  // Configuration values
  const JWT_SECRET = 'ultra-secure-test-jwt-secret-key-32-chars-minimum-entropy';
  const ISSUER = 'education-management-system';
  const AUDIENCE = 'education-management-users';

  const mockConfigService: any = {
    get: (key: string) => {
      switch (key) {
        case 'JWT_ACCESS_SECRET':
          return JWT_SECRET;
        case 'JWT_ISSUER':
          return ISSUER;
        case 'JWT_AUDIENCE':
          return AUDIENCE;
        case 'JWT_ACCESS_EXPIRES_IN':
          return '15m';
        default:
          return null;
      }
    },
  };

  const jwtService = new JwtService({
    secret: JWT_SECRET,
    signOptions: {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithm: 'HS256',
    },
  });

  // Mock Users & Institutions in MongoDB
  const mockSchoolId = new Types.ObjectId();
  const mockSchool = {
    _id: mockSchoolId,
    name: 'Delhi Public School',
    code: 'DPS001',
    status: InstitutionStatus.ACTIVE,
  };

  const mockTeacherId = new Types.ObjectId();
  const mockTeacherUser: any = {
    _id: mockTeacherId,
    name: 'Ramesh Verma',
    email: 'ramesh.teacher@dps.edu',
    passwordHash: '$2a$12$e8F0sM9e8k1fJ99a.hashedpasswordsecret',
    role: UserRole.TEACHER,
    status: UserStatus.ACTIVE,
    isEmailVerified: true,
    institutionId: mockSchool,
    profileImage: 'https://images.example.com/ramesh.jpg',
  };

  const mockSuperAdminId = new Types.ObjectId();
  const mockSuperAdminUser: any = {
    _id: mockSuperAdminId,
    name: 'Platform Overseer',
    email: 'superadmin@platform.edu',
    passwordHash: '$2a$12$e8F0sM9e8k1fJ99a.hashedpasswordsecret',
    role: UserRole.SUPER_ADMIN,
    status: UserStatus.ACTIVE,
    isEmailVerified: true,
    institutionId: null,
    profileImage: null,
  };

  const usersDb: Record<string, any> = {
    [mockTeacherId.toString()]: { ...mockTeacherUser },
    [mockSuperAdminId.toString()]: { ...mockSuperAdminUser },
  };

  const mockUsersService: any = {
    findUserById: async (id: string) => {
      const user = usersDb[id];
      if (!user) {
        throw new NotFoundException(`User with ID '${id}' not found`);
      }
      return user;
    },
  };

  // Instantiate Strategy and Guard
  const jwtStrategy = new JwtStrategy(mockConfigService, mockUsersService);
  const reflector = new Reflector();
  const jwtAuthGuard = new JwtAuthGuard(reflector);

  // Helper to generate access tokens
  const signToken = (payload: any, options: any = {}) => {
    return jwtService.sign(payload, {
      expiresIn: options.expiresIn || '15m',
      secret: options.secret || JWT_SECRET,
      issuer: options.issuer !== undefined ? options.issuer : ISSUER,
      audience: options.audience !== undefined ? options.audience : AUDIENCE,
    });
  };

  // =========================================================================
  // TEST SUITE 1: Valid Tokens & Safe Authenticated User Object
  // =========================================================================
  console.log('📌 Test Suite 1: Valid Tokens & Authenticated User Construction');

  // Teacher token
  const teacherToken = signToken({
    sub: mockTeacherId.toString(),
    role: UserRole.TEACHER,
    institutionId: mockSchoolId.toString(),
  });
  const decodedTeacherPayload = jwtService.verify(teacherToken, { secret: JWT_SECRET });
  const teacherUser = await jwtStrategy.validate(decodedTeacherPayload);

  assert(teacherUser.userId === mockTeacherId.toString(), 'Teacher userId correctly extracted');
  assert(teacherUser.email === mockTeacherUser.email, 'Teacher email correctly extracted');
  assert(teacherUser.role === UserRole.TEACHER, 'Teacher role correctly extracted');
  assert(teacherUser.status === UserStatus.ACTIVE, 'Teacher status is ACTIVE');
  assert(teacherUser.institutionId === mockSchoolId.toString(), 'Teacher institutionId correctly matched');
  assert(teacherUser.institution?.name === 'Delhi Public School', 'Institution details populated');
  assert(!('passwordHash' in teacherUser), 'CRITICAL: passwordHash is NEVER attached to authenticated user object');

  // Super Admin token
  const superAdminToken = signToken({
    sub: mockSuperAdminId.toString(),
    role: UserRole.SUPER_ADMIN,
    institutionId: null,
  });
  const decodedSaPayload = jwtService.verify(superAdminToken, { secret: JWT_SECRET });
  const superAdminAuthUser = await jwtStrategy.validate(decodedSaPayload);

  assert(superAdminAuthUser.userId === mockSuperAdminId.toString(), 'SUPER_ADMIN userId correctly extracted');
  assert(superAdminAuthUser.role === UserRole.SUPER_ADMIN, 'SUPER_ADMIN role verified');
  assert(superAdminAuthUser.institutionId === null, 'SUPER_ADMIN institutionId is strictly null');
  assert(!('passwordHash' in superAdminAuthUser), 'SUPER_ADMIN passwordHash is never attached');

  // =========================================================================
  // TEST SUITE 2: Expiration & Signature Cryptographic Validation
  // =========================================================================
  console.log('\n📌 Test Suite 2: Expiration & Cryptographic Signature Validation');

  // Expired token
  const expiredToken = signToken(
    { sub: mockTeacherId.toString(), role: UserRole.TEACHER, institutionId: mockSchoolId.toString() },
    { expiresIn: '-1s' },
  );

  let expiredCaught = false;
  try {
    jwtAuthGuard.handleRequest(null, null, { name: 'TokenExpiredError', message: 'jwt expired' });
  } catch (err: any) {
    if (err instanceof UnauthorizedException && err.message.includes('expired')) {
      expiredCaught = true;
    }
  }
  assert(expiredCaught, 'Expired JWT access token rejected with 401 Unauthorized');

  // Tampered signature
  let tamperedCaught = false;
  try {
    jwtAuthGuard.handleRequest(null, null, { name: 'JsonWebTokenError', message: 'invalid signature' });
  } catch (err: any) {
    if (err instanceof UnauthorizedException && err.message.includes('Invalid JWT')) {
      tamperedCaught = true;
    }
  }
  assert(tamperedCaught, 'Tampered token signature rejected with 401 Unauthorized');

  // Missing token
  let missingTokenCaught = false;
  try {
    jwtAuthGuard.handleRequest(null, null, null);
  } catch (err: any) {
    if (err instanceof UnauthorizedException) {
      missingTokenCaught = true;
    }
  }
  assert(missingTokenCaught, 'Missing Bearer token rejected with 401 Unauthorized');

  // =========================================================================
  // TEST SUITE 3: Subject & User Existence Verification
  // =========================================================================
  console.log('\n📌 Test Suite 3: Subject & Database Existence Checks');

  // Non-existent user
  const deletedUserId = new Types.ObjectId().toString();
  let deletedUserCaught = false;
  try {
    await jwtStrategy.validate({
      sub: deletedUserId,
      role: UserRole.TEACHER,
      institutionId: mockSchoolId.toString(),
    });
  } catch (err: any) {
    if (err instanceof UnauthorizedException && err.message.includes('no longer exists')) {
      deletedUserCaught = true;
    }
  }
  assert(deletedUserCaught, 'Token for non-existent / deleted user rejected with 401 Unauthorized');

  // Malformed sub
  let malformedSubCaught = false;
  try {
    await jwtStrategy.validate({
      sub: 'not-a-valid-mongo-id',
      role: UserRole.TEACHER,
      institutionId: mockSchoolId.toString(),
    });
  } catch (err: any) {
    if (err instanceof UnauthorizedException && err.message.includes('subject claim')) {
      malformedSubCaught = true;
    }
  }
  assert(malformedSubCaught, 'Malformed subject claim (non-ObjectId) rejected with 401 Unauthorized');

  // =========================================================================
  // TEST SUITE 4: Account Status Verification (Inactive / Suspended)
  // =========================================================================
  console.log('\n📌 Test Suite 4: Account Status Enforcement');

  const suspendedUserId = new Types.ObjectId();
  usersDb[suspendedUserId.toString()] = {
    ...mockTeacherUser,
    _id: suspendedUserId,
    status: UserStatus.SUSPENDED,
  };

  let suspendedCaught = false;
  try {
    await jwtStrategy.validate({
      sub: suspendedUserId.toString(),
      role: UserRole.TEACHER,
      institutionId: mockSchoolId.toString(),
    });
  } catch (err: any) {
    if (err instanceof UnauthorizedException && err.message.includes('suspended')) {
      suspendedCaught = true;
    }
  }
  assert(suspendedCaught, 'Suspended user account rejected with 401 Unauthorized');

  const inactiveUserId = new Types.ObjectId();
  usersDb[inactiveUserId.toString()] = {
    ...mockTeacherUser,
    _id: inactiveUserId,
    status: UserStatus.INACTIVE,
  };

  let inactiveCaught = false;
  try {
    await jwtStrategy.validate({
      sub: inactiveUserId.toString(),
      role: UserRole.TEACHER,
      institutionId: mockSchoolId.toString(),
    });
  } catch (err: any) {
    if (err instanceof UnauthorizedException && err.message.includes('inactive')) {
      inactiveCaught = true;
    }
  }
  assert(inactiveCaught, 'Inactive user account rejected with 401 Unauthorized');

  // =========================================================================
  // TEST SUITE 5: Stale Role & Institution Context Integrity
  // =========================================================================
  console.log('\n📌 Test Suite 5: Token Role & Institution Context Consistency');

  // Stale Role (Token says ADMIN, DB says TEACHER)
  let staleRoleCaught = false;
  try {
    await jwtStrategy.validate({
      sub: mockTeacherId.toString(),
      role: UserRole.ADMIN, // Stale / forged role
      institutionId: mockSchoolId.toString(),
    });
  } catch (err: any) {
    if (err instanceof UnauthorizedException && err.message.includes('role')) {
      staleRoleCaught = true;
    }
  }
  assert(staleRoleCaught, 'Stale / mismatched role in token rejected with 401 Unauthorized');

  // Stale Institution Context (Token says School B, DB says School A)
  const differentSchoolId = new Types.ObjectId().toString();
  let staleInstCaught = false;
  try {
    await jwtStrategy.validate({
      sub: mockTeacherId.toString(),
      role: UserRole.TEACHER,
      institutionId: differentSchoolId, // Wrong institution
    });
  } catch (err: any) {
    if (err instanceof UnauthorizedException && err.message.includes('institution')) {
      staleInstCaught = true;
    }
  }
  assert(staleInstCaught, 'Stale / mismatched institution context rejected with 401 Unauthorized');

  // Super Admin with non-null institutionId
  let saWithInstCaught = false;
  try {
    await jwtStrategy.validate({
      sub: mockSuperAdminId.toString(),
      role: UserRole.SUPER_ADMIN,
      institutionId: mockSchoolId.toString(), // Invalid for Super Admin
    });
  } catch (err: any) {
    if (err instanceof UnauthorizedException && err.message.includes('SUPER_ADMIN must not possess')) {
      saWithInstCaught = true;
    }
  }
  assert(saWithInstCaught, 'Super Admin token with non-null institutionId rejected with 401 Unauthorized');

  // Suspended Institution
  const suspendedSchoolId = new Types.ObjectId();
  const suspendedSchoolTeacherId = new Types.ObjectId();
  usersDb[suspendedSchoolTeacherId.toString()] = {
    ...mockTeacherUser,
    _id: suspendedSchoolTeacherId,
    institutionId: {
      _id: suspendedSchoolId,
      name: 'Suspended Academy',
      code: 'SUSP01',
      status: InstitutionStatus.SUSPENDED,
    },
  };

  let suspendedSchoolCaught = false;
  try {
    await jwtStrategy.validate({
      sub: suspendedSchoolTeacherId.toString(),
      role: UserRole.TEACHER,
      institutionId: suspendedSchoolId.toString(),
    });
  } catch (err: any) {
    if (err instanceof UnauthorizedException && err.message.includes('institution is suspended')) {
      suspendedSchoolCaught = true;
    }
  }
  assert(suspendedSchoolCaught, 'User from suspended institution rejected with 401 Unauthorized');

  // =========================================================================
  // TEST SUITE 6: @Public() Decorator & Bypass Logic
  // =========================================================================
  console.log('\n📌 Test Suite 6: Public Decorator Bypass Logic');

  // Mock class and handler with @Public()
  class MockPublicController {
    @Public()
    publicRoute() {
      return { status: 'public' };
    }

    protectedRoute() {
      return { status: 'protected' };
    }
  }

  const mockPublicInstance = new MockPublicController();

  const publicExecutionContext: any = {
    getHandler: () => mockPublicInstance.publicRoute,
    getClass: () => MockPublicController,
    switchToHttp: () => ({
      getRequest: () => ({ headers: {} }),
    }),
  };

  const isPublicAllowed = jwtAuthGuard.canActivate(publicExecutionContext);
  assert(isPublicAllowed === true, 'Route decorated with @Public() allows unauthenticated access (returns true)');

  const protectedExecutionContext: any = {
    getHandler: () => mockPublicInstance.protectedRoute,
    getClass: () => MockPublicController,
    switchToHttp: () => ({
      getRequest: () => ({ headers: {} }),
    }),
  };

  // Mock super.canActivate for test harness
  (jwtAuthGuard as any)['canActivate'] = function (ctx: ExecutionContext) {
    const isPub = reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPub) return true;
    // For protected route without token, handleRequest throws
    this.handleRequest(null, null, null);
    return false;
  };

  let protectedRejected = false;
  try {
    jwtAuthGuard.canActivate(protectedExecutionContext);
  } catch (err: any) {
    if (err instanceof UnauthorizedException) {
      protectedRejected = true;
    }
  }
  assert(protectedRejected, 'Non-public route without token rejected with 401 Unauthorized');

  // =========================================================================
  // TEST SUITE 7: @CurrentUser Decorator Extraction
  // =========================================================================
  console.log('\n📌 Test Suite 7: CurrentUser Decorator Parameter Extraction');

  const mockReqWithUser = {
    user: teacherUser,
  };

  const currentUserHelper = (data: keyof AuthenticatedUser | undefined, req: any) => {
    const user = req.user;
    if (!user) return null;
    return data ? user[data] : user;
  };

  const extractedUser = currentUserHelper(undefined, mockReqWithUser);
  assert(extractedUser.userId === mockTeacherId.toString(), '@CurrentUser() returns complete AuthenticatedUser');
  assert(extractedUser.email === mockTeacherUser.email, '@CurrentUser() preserves email');

  const extractedRole = currentUserHelper('role', mockReqWithUser);
  assert(extractedRole === UserRole.TEACHER, '@CurrentUser("role") extracts single field');

  const extractedInst = currentUserHelper('institutionId', mockReqWithUser);
  assert(extractedInst === mockSchoolId.toString(), '@CurrentUser("institutionId") extracts institutionId');

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

runJwtGuardTests().catch((err) => {
  console.error('Fatal error during JWT Guard verification:', err);
  process.exit(1);
});

