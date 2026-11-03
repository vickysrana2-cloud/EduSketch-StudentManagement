import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { SessionsService } from './sessions.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/schemas/user.schema';
import { Institution } from '../institutions/schemas/institution.schema';
import { UserRole, UserStatus } from '../users/enums/user.enums';
import { InstitutionStatus } from '../institutions/enums/institution.enums';

// Custom getModelToken helper to avoid Jest ESM import issue
const getModelToken = (model: string) => `${model}Model`;

describe('AuthService - Registration (Task 06)', () => {
  let service: AuthService;
  let userModel: any;
  let institutionModel: any;

  const mockActiveInstitution = {
    _id: '67272714207198bb6c30f401',
    name: 'ABC Public School',
    code: 'ABC001',
    status: InstitutionStatus.ACTIVE,
  };

  const mockInactiveInstitution = {
    _id: '67272714207198bb6c30f402',
    name: 'Suspended School',
    code: 'SUS001',
    status: InstitutionStatus.SUSPENDED,
  };

  beforeEach(async () => {
    userModel = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    // Mock user model constructor
    const mockUserModelConstructor = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: '67272714207198bb6c30f499',
      createdAt: new Date(),
      save: jest.fn().mockResolvedValue({
        _id: '67272714207198bb6c30f499',
        ...dto,
        createdAt: new Date(),
      }),
    }));
    Object.assign(mockUserModelConstructor, userModel);

    institutionModel = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModelConstructor,
        },
        {
          provide: getModelToken(Institution.name),
          useValue: institutionModel,
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('mock.jwt.token'),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'BCRYPT_SALT_ROUNDS') return '10';
              if (key === 'JWT_ACCESS_SECRET') return 'test_secret';
              if (key === 'JWT_REFRESH_SECRET') return 'test_refresh_secret';
              return null;
            }),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findUserByEmailWithPassword: jest.fn(),
            updateLastLogin: jest.fn(),
            createUser: jest.fn(),
          },
        },
        {
          provide: SessionsService,
          useValue: {
            createSession: jest.fn(),
            revokeSession: jest.fn(),
          },
        },
        {
          provide: TokenService,
          useValue: {
            generateAccessToken: jest.fn().mockResolvedValue('mock.access.token'),
            generateRefreshToken: jest.fn().mockResolvedValue('mock.refresh.token'),
            generateAuthTokens: jest.fn().mockResolvedValue({
              accessToken: 'mock.access.token',
              refreshToken: 'mock.refresh.token',
              tokenType: 'Bearer',
              expiresIn: '15m',
            }),
            verifyRefreshToken: jest.fn(),
            verifyAccessToken: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // --------------------------------------------------------------------------
  // TEST 1: Unauthorized Role Assignment (SUPER_ADMIN)
  // --------------------------------------------------------------------------
  it('should reject registration as SUPER_ADMIN with 403 Forbidden', async () => {
    await expect(
      service.register({
        name: 'Super User',
        email: 'super@test.com',
        password: 'StrongPassword123',
        role: UserRole.SUPER_ADMIN,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  // --------------------------------------------------------------------------
  // TEST 2: Public Registration as ADMIN
  // --------------------------------------------------------------------------
  it('should reject public registration as ADMIN with 403 Forbidden', async () => {
    await expect(
      service.register(
        {
          name: 'Principal',
          email: 'admin@test.com',
          password: 'StrongPassword123',
          role: UserRole.ADMIN,
          institutionId: '67272714207198bb6c30f401',
        },
        undefined, // unauthenticated
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --------------------------------------------------------------------------
  // TEST 3: Public Direct Registration as TEACHER or STUDENT
  // --------------------------------------------------------------------------
  it('should reject direct public registration as TEACHER without Admin workflow', async () => {
    await expect(
      service.register(
        {
          name: 'Teacher One',
          email: 'teacher@test.com',
          password: 'StrongPassword123',
          role: UserRole.TEACHER,
          institutionId: '67272714207198bb6c30f401',
        },
        undefined, // unauthenticated
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // --------------------------------------------------------------------------
  // TEST 4: Invalid Non-Existent Institution
  // --------------------------------------------------------------------------
  it('should throw NotFoundException if institution does not exist', async () => {
    institutionModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    const superAdminUser = {
      userId: '1',
      email: 'sa@test.com',
      role: UserRole.SUPER_ADMIN,
      institutionId: null,
    };

    await expect(
      service.register(
        {
          name: 'Teacher',
          email: 'teacher@test.com',
          password: 'StrongPassword123',
          role: UserRole.TEACHER,
          institutionId: '67272714207198bb6c30f499',
        },
        superAdminUser,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  // --------------------------------------------------------------------------
  // TEST 5: Inactive or Suspended Institution
  // --------------------------------------------------------------------------
  it('should reject registration if institution is SUSPENDED or INACTIVE', async () => {
    institutionModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockInactiveInstitution),
    });

    const superAdminUser = {
      userId: '1',
      email: 'sa@test.com',
      role: UserRole.SUPER_ADMIN,
      institutionId: null,
    };

    await expect(
      service.register(
        {
          name: 'Teacher',
          email: 'teacher@test.com',
          password: 'StrongPassword123',
          role: UserRole.TEACHER,
          institutionId: mockInactiveInstitution._id,
        },
        superAdminUser,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // --------------------------------------------------------------------------
  // TEST 6: Duplicate Email Check
  // --------------------------------------------------------------------------
  it('should reject registration with 409 Conflict if email already exists', async () => {
    institutionModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockActiveInstitution),
    });

    userModel.findOne.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: '1', email: 'existing@test.com' }),
      }),
    });

    const adminUser = {
      userId: '1',
      email: 'admin@test.com',
      role: UserRole.ADMIN,
      institutionId: mockActiveInstitution._id,
    };

    await expect(
      service.register(
        {
          name: 'New Teacher',
          email: 'existing@test.com',
          password: 'StrongPassword123',
          role: UserRole.TEACHER,
        },
        adminUser,
      ),
    ).rejects.toThrow(ConflictException);
  });

  // --------------------------------------------------------------------------
  // TEST 7: Valid Registration by Admin (Institution Derived from Admin)
  // --------------------------------------------------------------------------
  it('should successfully register teacher and derive institutionId from Admin', async () => {
    institutionModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockActiveInstitution),
    });

    userModel.findOne.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
    });

    const adminUser = {
      userId: '1',
      email: 'admin@test.com',
      role: UserRole.ADMIN,
      institutionId: mockActiveInstitution._id,
    };

    const result = await service.register(
      {
        name: 'Rahul Sharma',
        email: 'rahul@example.com',
        password: 'StrongPassword123',
        role: UserRole.TEACHER,
        institutionId: 'arbitrary_untrusted_id', // MUST BE OVERRIDDEN BY ADMIN'S INSTITUTION
      },
      adminUser,
    );

    expect(result).toBeDefined();
    expect(result.message).toBe('User successfully registered.');
    expect(result.user.email).toBe('rahul@example.com');
    expect(result.user.role).toBe(UserRole.TEACHER);
    expect(result.user.status).toBe(UserStatus.ACTIVE);
    expect(result.user.isEmailVerified).toBe(false);
    expect(result.user.institution.id).toBe(mockActiveInstitution._id);
    expect((result.user as any).passwordHash).toBeUndefined();
  });
});
