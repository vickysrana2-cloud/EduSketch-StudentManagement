import * as bcrypt from 'bcryptjs';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { AuthService } from '../src/auth/auth.service';
import { SessionsService } from '../src/auth/sessions.service';
import { TokenService } from '../src/auth/token.service';
import { LoginDto } from '../src/auth/dto/login.dto';
import { UserRole, UserStatus } from '../src/users/enums/user.enums';

async function runLoginWorkflowTests() {
  console.log('=== RUNNING TASK 07 SECURE LOGIN WORKFLOW TESTS ===\n');

  // --------------------------------------------------------------------------
  // TEST 1: Login DTO Validation
  // --------------------------------------------------------------------------
  console.log('[TEST 1] Testing LoginDto Validation...');
  const emptyEmailDto = plainToInstance(LoginDto, {
    email: '',
    password: 'Password123!',
  });
  const emptyErrors = await validate(emptyEmailDto);
  if (emptyErrors.length > 0 && emptyErrors.some((e) => e.property === 'email')) {
    console.log(' PASSED: Empty email correctly caught by DTO validation.');
  } else {
    throw new Error('FAILED: Empty email was not caught.');
  }

  // --------------------------------------------------------------------------
  // Setup Mock Database & Services
  // --------------------------------------------------------------------------
  const mockPassword = 'StrongPassword123';
  const hashedPassword = await bcrypt.hash(mockPassword, 10);

  const mockTeacher = {
    _id: '67272714207198bb6c30f401',
    name: 'Sarah Connor',
    email: 'sarah.teacher@school.com',
    passwordHash: hashedPassword,
    role: UserRole.TEACHER,
    status: UserStatus.ACTIVE,
    isEmailVerified: true,
    institutionId: '67272714207198bb6c30f100',
    lastLoginAt: null,
  };

  const mockSuspendedUser = {
    _id: '67272714207198bb6c30f402',
    name: 'Suspended Teacher',
    email: 'suspended@school.com',
    passwordHash: hashedPassword,
    role: UserRole.TEACHER,
    status: UserStatus.SUSPENDED,
    isEmailVerified: true,
    institutionId: '67272714207198bb6c30f100',
  };

  const mockUnverifiedUser = {
    _id: '67272714207198bb6c30f403',
    name: 'Unverified Student',
    email: 'unverified@school.com',
    passwordHash: hashedPassword,
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    isEmailVerified: false,
    institutionId: '67272714207198bb6c30f100',
  };

  const usersDb = new Map<string, any>([
    [mockTeacher.email, mockTeacher],
    [mockSuspendedUser.email, mockSuspendedUser],
    [mockUnverifiedUser.email, mockUnverifiedUser],
  ]);

  const mockUserModel: any = {
    findOne: (query: { email: string }) => ({
      select: () => ({
        populate: () => ({
          exec: async () => usersDb.get(query.email) || null,
        }),
      }),
    }),
    findByIdAndUpdate: (id: string, update: any) => ({
      exec: async () => {
        const found = Array.from(usersDb.values()).find((u) => u._id === id);
        if (found) {
          found.lastLoginAt = update.$set.lastLoginAt;
        }
        return found;
      },
    }),
  };

  const sessionsDb: any[] = [];
  const mockSessionModel: any = function (doc: any) {
    const instance = {
      ...doc,
      _id: 'session_' + Date.now(),
      save: async () => {
        sessionsDb.push(instance);
        return instance;
      },
    };
    return instance;
  };
  mockSessionModel.updateMany = async () => ({ modifiedCount: 1 });

  const sessionsService = new SessionsService(mockSessionModel);

  const mockJwtService: any = {
    signAsync: async (payload: any) =>
      `mock.jwt.${payload.sub}.${payload.role}.${Date.now()}`,
    verifyAsync: async () => ({}),
  };

  let mockConfig: Record<string, string> = {
    BCRYPT_SALT_ROUNDS: '10',
    JWT_ACCESS_SECRET: 'a7f9b8c2d1e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2f4a6',
    JWT_ACCESS_EXPIRES_IN: '15m',
    JWT_REFRESH_SECRET: 'e2f4a6c8d0b2a4f6e8c0d2b4a6f8e0c2d4b6a8f0e2c4d6b8a0f2e4c6d8b0a2f4',
    JWT_REFRESH_EXPIRES_IN: '7d',
    JWT_ISSUER: 'education-management-system',
    JWT_AUDIENCE: 'education-management-users',
    REQUIRE_EMAIL_VERIFICATION: 'false',
  };

  const mockConfigService: any = {
    get: (key: string) => mockConfig[key] || null,
  };

  const mockUsersService: any = {
    updateLastLogin: async (id: string) => mockUserModel.findByIdAndUpdate(id, { $set: { lastLoginAt: new Date() } }).exec(),
  };

  const tokenService = new TokenService(mockJwtService, mockConfigService);
  tokenService.onModuleInit();

  const authService = new AuthService(
    mockUserModel,
    {} as any,
    mockJwtService,
    mockConfigService,
    mockUsersService,
    sessionsService,
    tokenService,
  );

  // --------------------------------------------------------------------------
  // TEST 2: Successful Login & Email Normalization
  // --------------------------------------------------------------------------
  console.log('\n[TEST 2] Testing Successful Login & Email Normalization...');
  const successResult = await authService.login(
    {
      email: '  SARAH.TEACHER@school.com  ', // Mixed-case with spaces -> should normalize
      password: mockPassword,
      role: UserRole.TEACHER, // Matching role
    },
    { ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0 PostmanRuntime' },
  );

  if (
    successResult.accessToken &&
    successResult.refreshToken &&
    successResult.user.email === 'sarah.teacher@school.com' &&
    successResult.user.role === UserRole.TEACHER &&
    (successResult.user as any).passwordHash === undefined &&
    successResult.user.lastLoginAt !== null
  ) {
    console.log(' PASSED: Login succeeded with email normalization!');
    console.log('   AccessToken issued (15m):', successResult.accessToken);
    console.log('   User returned safely (no passwordHash):', successResult.user.name);
    console.log('   lastLoginAt recorded:', successResult.user.lastLoginAt);
  } else {
    throw new Error('FAILED: Successful login failed validation.');
  }

  // --------------------------------------------------------------------------
  // TEST 3: Sessions Service Verification (Rule 11)
  // --------------------------------------------------------------------------
  console.log('\n[TEST 3] Testing Session Creation & Refresh Token Hashing...');
  const recordedSession = sessionsDb[sessionsDb.length - 1];
  if (
    recordedSession &&
    recordedSession.userId.toString() === mockTeacher._id &&
    recordedSession.refreshTokenHash !== successResult.refreshToken && // MUST BE HASHED!
    recordedSession.ipAddress === '192.168.1.1'
  ) {
    console.log(' PASSED: Refresh token session created via SessionsService!');
    console.log('   Raw refresh token is NEVER stored in database.');
    console.log('   Stored SHA-256 hash:', recordedSession.refreshTokenHash);
  } else {
    throw new Error('FAILED: Session was not stored properly.');
  }

  // --------------------------------------------------------------------------
  // TEST 4: Reject Incorrect Password (Generic Error)
  // --------------------------------------------------------------------------
  console.log('\n[TEST 4] Testing Incorrect Password Rejection...');
  try {
    await authService.login({
      email: mockTeacher.email,
      password: 'WrongPassword999!',
    });
    throw new Error('Should have failed!');
  } catch (err: any) {
    if (err.status === 401 && err.message === 'Invalid email or password') {
      console.log(' PASSED: Rejected with generic "Invalid email or password" error.');
    } else {
      throw err;
    }
  }

  // --------------------------------------------------------------------------
  // TEST 5: Reject Non-Existent Email (Generic Error)
  // --------------------------------------------------------------------------
  console.log('\n[TEST 5] Testing Non-Existent User Rejection...');
  try {
    await authService.login({
      email: 'ghost.user@school.com',
      password: mockPassword,
    });
    throw new Error('Should have failed!');
  } catch (err: any) {
    if (err.status === 401 && err.message === 'Invalid email or password') {
      console.log(' PASSED: Rejected non-existent user with identical generic error.');
    } else {
      throw err;
    }
  }

  // --------------------------------------------------------------------------
  // TEST 6: Reject Suspended Account
  // --------------------------------------------------------------------------
  console.log('\n[TEST 6] Testing Suspended Account Rejection...');
  try {
    await authService.login({
      email: mockSuspendedUser.email,
      password: mockPassword,
    });
    throw new Error('Should have failed!');
  } catch (err: any) {
    if (err.status === 401 && err.message.includes('suspended')) {
      console.log(' PASSED: Suspended account blocked with 401 Unauthorized.');
    } else {
      throw err;
    }
  }

  // --------------------------------------------------------------------------
  // TEST 7: Role Mismatch Rejection (Rule 9)
  // --------------------------------------------------------------------------
  console.log('\n[TEST 7] Testing Role Mismatch Rejection...');
  try {
    await authService.login({
      email: mockTeacher.email,
      password: mockPassword,
      role: UserRole.ADMIN, // Attempting to login as ADMIN when registered as TEACHER
    });
    throw new Error('Should have failed!');
  } catch (err: any) {
    if (err.status === 401 && err.message.includes('Role mismatch')) {
      console.log(' PASSED: Frontend role override rejected. Database role is authoritative.');
    } else {
      throw err;
    }
  }

  // --------------------------------------------------------------------------
  // TEST 8: Email Verification Policy (Rule 8)
  // --------------------------------------------------------------------------
  console.log('\n[TEST 8] Testing Email Verification Policy Enforcement...');
  mockConfig.REQUIRE_EMAIL_VERIFICATION = 'true';
  try {
    await authService.login({
      email: mockUnverifiedUser.email,
      password: mockPassword,
    });
    throw new Error('Should have failed!');
  } catch (err: any) {
    if (err.status === 401 && err.message.includes('verify your email')) {
      console.log(' PASSED: Unverified email blocked when REQUIRE_EMAIL_VERIFICATION is enabled.');
    } else {
      throw err;
    }
  }

  console.log('\n ALL TASK 07 LOGIN WORKFLOW TESTS PASSED WITH 100% SUCCESS!');
}

runLoginWorkflowTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

