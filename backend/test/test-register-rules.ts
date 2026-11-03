import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RegisterDto } from '../src/auth/dto/register.dto';
import { AuthService } from '../src/auth/auth.service';
import { UserRole, UserStatus } from '../src/users/enums/user.enums';
import { InstitutionStatus } from '../src/institutions/enums/institution.enums';

async function runUnitVerification() {
  console.log('=== VERIFYING TASK 06 REGISTRATION RULES & DTOS ===\n');

  // --------------------------------------------------------------------------
  // TEST 1: Weak Password Validation
  // --------------------------------------------------------------------------
  console.log('[TEST 1] Testing Weak Password (no uppercase letter)...');
  const weakDto = plainToInstance(RegisterDto, {
    name: 'Rahul Sharma',
    email: 'rahul@example.com',
    password: 'weakpassword123', // missing uppercase
    role: UserRole.TEACHER,
    institutionId: '67272714207198bb6c30f401',
  });

  const errors = await validate(weakDto);
  const passwordError = errors.find((e) => e.property === 'password');
  if (passwordError) {
    console.log(
      ' PASSED: Weak password correctly rejected with:',
      Object.values(passwordError.constraints || {}),
    );
  } else {
    throw new Error('FAILED: Weak password was not caught!');
  }

  // --------------------------------------------------------------------------
  // TEST 2: Password Shorter Than 8 Chars
  // --------------------------------------------------------------------------
  console.log('\n[TEST 2] Testing Short Password (< 8 characters)...');
  const shortDto = plainToInstance(RegisterDto, {
    name: 'Rahul Sharma',
    email: 'rahul@example.com',
    password: 'Pass1',
    role: UserRole.TEACHER,
    institutionId: '67272714207198bb6c30f401',
  });

  const shortErrors = await validate(shortDto);
  const shortPasswordError = shortErrors.find((e) => e.property === 'password');
  if (shortPasswordError) {
    console.log(
      ' PASSED: Short password rejected with:',
      Object.values(shortPasswordError.constraints || {}),
    );
  } else {
    throw new Error('FAILED: Short password was not caught!');
  }

  // --------------------------------------------------------------------------
  // TEST 3: Invalid Email Format
  // --------------------------------------------------------------------------
  console.log('\n[TEST 3] Testing Invalid Email Format...');
  const invalidEmailDto = plainToInstance(RegisterDto, {
    name: 'Rahul Sharma',
    email: 'not-an-email',
    password: 'StrongPassword123',
    role: UserRole.TEACHER,
    institutionId: '67272714207198bb6c30f401',
  });

  const emailErrors = await validate(invalidEmailDto);
  const emailError = emailErrors.find((e) => e.property === 'email');
  if (emailError) {
    console.log(
      ' PASSED: Invalid email rejected with:',
      Object.values(emailError.constraints || {}),
    );
  } else {
    throw new Error('FAILED: Invalid email was not caught!');
  }

  // --------------------------------------------------------------------------
  // TEST 4: Valid DTO Validation
  // --------------------------------------------------------------------------
  console.log('\n[TEST 4] Testing Valid RegisterDto...');
  const validDto = plainToInstance(RegisterDto, {
    name: 'Rahul Sharma',
    email: 'rahul@example.com',
    password: 'StrongPassword123',
    role: UserRole.TEACHER,
    institutionId: '67272714207198bb6c30f401',
  });

  const validErrors = await validate(validDto);
  if (validErrors.length === 0) {
    console.log(' PASSED: Valid DTO passed validation with 0 errors.');
  } else {
    throw new Error(`FAILED: Valid DTO threw errors: ${JSON.stringify(validErrors)}`);
  }

  // --------------------------------------------------------------------------
  // TEST 5: Business Rules & AuthService Tests (Mocked Models)
  // --------------------------------------------------------------------------
  console.log('\n[TEST 5] Testing Business Rules in AuthService...');
  const mockActiveInst = {
    _id: '67272714207198bb6c30f401',
    name: 'ABC Public School',
    code: 'ABC001',
    status: InstitutionStatus.ACTIVE,
  };

  const mockSuspendedInst = {
    _id: '67272714207198bb6c30f402',
    name: 'Suspended School',
    code: 'SUS001',
    status: InstitutionStatus.SUSPENDED,
  };

  // Mock UserModel Constructor
  const mockUserInstances: any[] = [];
  const mockUserModel: any = function (doc: any) {
    const instance = {
      ...doc,
      _id: '67272714207198bb6c30f499',
      createdAt: new Date(),
      save: async () => {
        mockUserInstances.push(instance);
        return instance;
      },
    };
    return instance;
  };
  mockUserModel.findOne = () => ({
    lean: () => ({
      exec: async () => null,
    }),
  });

  const mockInstitutionModel: any = {
    findById: (id: string) => ({
      exec: async () => {
        if (id === mockActiveInst._id) return mockActiveInst;
        if (id === mockSuspendedInst._id) return mockSuspendedInst;
        return null;
      },
    }),
  };

  const mockJwtService: any = {
    signAsync: async () => 'mock.jwt.token',
    verifyAsync: async () => ({}),
  };

  const mockConfigService: any = {
    get: (key: string) => {
      if (key === 'BCRYPT_SALT_ROUNDS') return '10';
      if (key === 'JWT_ACCESS_SECRET') return 'test_secret';
      if (key === 'JWT_REFRESH_SECRET') return 'test_refresh_secret';
      return null;
    },
  };

  const mockUsersService: any = {};

  const authService = new AuthService(
    mockUserModel,
    mockInstitutionModel,
    mockJwtService,
    mockConfigService,
    mockUsersService,
    {} as any,
    {} as any,
  );

  // A. Public registration as SUPER_ADMIN
  try {
    await authService.register({
      name: 'Super',
      email: 's@test.com',
      password: 'StrongPassword123',
      role: UserRole.SUPER_ADMIN,
    });
    throw new Error('Should have failed!');
  } catch (err: any) {
    if (err.status === 403) {
      console.log(' PASSED: Public registration as SUPER_ADMIN blocked (403 Forbidden).');
    } else {
      throw err;
    }
  }

  // B. Public registration as ADMIN
  try {
    await authService.register(
      {
        name: 'Admin',
        email: 'a@test.com',
        password: 'StrongPassword123',
        role: UserRole.ADMIN,
        institutionId: mockActiveInst._id,
      },
      undefined,
    );
    throw new Error('Should have failed!');
  } catch (err: any) {
    if (err.status === 403) {
      console.log(' PASSED: Public registration as ADMIN blocked (403 Forbidden).');
    } else {
      throw err;
    }
  }

  // C. Inactive Institution Registration
  try {
    await authService.register(
      {
        name: 'Teacher',
        email: 't@test.com',
        password: 'StrongPassword123',
        role: UserRole.TEACHER,
        institutionId: mockSuspendedInst._id,
      },
      { userId: '1', email: 'sa@test.com', role: UserRole.SUPER_ADMIN, institutionId: null },
    );
    throw new Error('Should have failed!');
  } catch (err: any) {
    if (err.status === 400) {
      console.log(' PASSED: Registration under suspended institution blocked (400 Bad Request).');
    } else {
      throw err;
    }
  }

  // D. Non-Existent Institution Registration
  try {
    await authService.register(
      {
        name: 'Teacher',
        email: 't@test.com',
        password: 'StrongPassword123',
        role: UserRole.TEACHER,
        institutionId: '67272714207198bb6c30f488', // non-existent
      },
      { userId: '1', email: 'sa@test.com', role: UserRole.SUPER_ADMIN, institutionId: null },
    );
    throw new Error('Should have failed!');
  } catch (err: any) {
    if (err.status === 404) {
      console.log(' PASSED: Registration with non-existent institution blocked (404 Not Found).');
    } else {
      throw err;
    }
  }

  // E. Valid Admin Onboarding Teacher & Institution Derivation
  const adminUser = {
    userId: 'admin123',
    email: 'admin@school.com',
    role: UserRole.ADMIN,
    institutionId: mockActiveInst._id, // Active school
  };

  const regResult = await authService.register(
    {
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      password: 'StrongPassword123',
      role: UserRole.TEACHER,
      institutionId: '67272714207198bb6c30f999', // Untrusted/arbitrary id in request!
    },
    adminUser,
  );

  if (
    regResult.user.institution.id === mockActiveInst._id &&
    regResult.user.role === UserRole.TEACHER &&
    (regResult.user as any).passwordHash === undefined &&
    regResult.user.isEmailVerified === false
  ) {
    console.log(
      ' PASSED: Teacher registered! Untrusted institutionId overridden by Admin session (Rule 12).',
    );
    console.log('   Derived institution:', regResult.user.institution.name);
    console.log('   passwordHash is securely excluded.');
  } else {
    throw new Error('FAILED: Institution was not derived correctly!');
  }

  console.log('\n ALL TASK 06 REGISTRATION RULES PASSED WITH 100% SUCCESS!');
}

runUnitVerification().catch((err) => {
  console.error(err);
  process.exit(1);
});

