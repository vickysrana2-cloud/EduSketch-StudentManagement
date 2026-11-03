import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { TokenService } from './token.service';
import { UserRole } from '../users/enums/user.enums';

describe('TokenService (Task 08: Access Token Generation)', () => {
  let service: TokenService;
  let jwtService: JwtService;

  const validAccessSecret =
    'a7f9b8c2d1e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2f4a6';
  const validRefreshSecret =
    'e2f4a6c8d0b2a4f6e8c0d2b4a6f8e0c2d4b6a8f0e2c4d6b8a0f2e4c6d8b0a2f4';

  const mockConfigService = {
    get: jest.fn((key: string) => {
      switch (key) {
        case 'JWT_ACCESS_SECRET':
          return validAccessSecret;
        case 'JWT_REFRESH_SECRET':
          return validRefreshSecret;
        case 'JWT_ACCESS_EXPIRES_IN':
          return '15m';
        case 'JWT_REFRESH_EXPIRES_IN':
          return '7d';
        case 'JWT_ISSUER':
          return 'education-management-system';
        case 'JWT_AUDIENCE':
          return 'education-management-users';
        default:
          return null;
      }
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({})],
      providers: [
        TokenService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
    jwtService = module.get<JwtService>(JwtService);
    service.onModuleInit();
  });

  describe('Configuration Validation (Requirement 8)', () => {
    it('should throw an error if JWT_ACCESS_SECRET is missing or empty', () => {
      const invalidConfigService = {
        get: jest.fn((key: string) => (key === 'JWT_ACCESS_SECRET' ? '' : 'valid_value')),
      };
      const testService = new TokenService(jwtService, invalidConfigService as any);
      expect(() => testService.onModuleInit()).toThrow(
        /JWT_ACCESS_SECRET is missing or empty/,
      );
    });

    it('should throw an error if JWT_ACCESS_SECRET has less than 32 characters', () => {
      const invalidConfigService = {
        get: jest.fn((key: string) =>
          key === 'JWT_ACCESS_SECRET' ? 'short_secret_123' : validRefreshSecret,
        ),
      };
      const testService = new TokenService(jwtService, invalidConfigService as any);
      expect(() => testService.onModuleInit()).toThrow(/too short/);
    });
  });

  describe('Access Token Payload Claims (Requirements 1 - 6, 9)', () => {
    it('should generate an access token with minimal claims for a TEACHER', async () => {
      const mockTeacher = {
        _id: '67272714207198bb6c30f401',
        role: UserRole.TEACHER,
        institutionId: '67272714207198bb6c30f400',
      };

      const token = await service.generateAccessToken(mockTeacher);
      expect(typeof token).toBe('string');

      // Decode and verify payload
      const decoded: any = service.decodeToken(token);

      expect(decoded.sub).toBe(mockTeacher._id);
      expect(decoded.role).toBe(UserRole.TEACHER);
      expect(decoded.institutionId).toBe(mockTeacher.institutionId);
      expect(decoded.iss).toBe('education-management-system');
      expect(decoded.aud).toBe('education-management-users');

      // Check expiry: 15 minutes = 900 seconds
      expect(decoded.exp - decoded.iat).toBe(900);

      // Verify forbidden sensitive fields are NOT present
      expect(decoded.password).toBeUndefined();
      expect(decoded.passwordHash).toBeUndefined();
      expect(decoded.email).toBeUndefined();
      expect(decoded.permissions).toBeUndefined();
    });

    it('should set institutionId to null for SUPER_ADMIN claim', async () => {
      const mockSuperAdmin = {
        _id: '67272714207198bb6c30f499',
        role: UserRole.SUPER_ADMIN,
        institutionId: '67272714207198bb6c30f400', // Should be forced to null
      };

      const token = await service.generateAccessToken(mockSuperAdmin);
      const decoded: any = service.decodeToken(token);

      expect(decoded.sub).toBe(mockSuperAdmin._id);
      expect(decoded.role).toBe(UserRole.SUPER_ADMIN);
      expect(decoded.institutionId).toBeNull();
    });

    it('should cryptographically verify a valid access token signed with HS256', async () => {
      const mockUser = {
        _id: '67272714207198bb6c30f405',
        role: UserRole.ADMIN,
        institutionId: '67272714207198bb6c30f400',
      };

      const token = await service.generateAccessToken(mockUser);
      const verified = await service.verifyAccessToken(token);

      expect(verified.sub).toBe(mockUser._id);
      expect(verified.role).toBe(UserRole.ADMIN);
      expect(verified.institutionId).toBe(mockUser.institutionId);
    });

    it('should reject a tampered access token', async () => {
      const mockUser = {
        _id: '67272714207198bb6c30f405',
        role: UserRole.STUDENT,
        institutionId: '67272714207198bb6c30f400',
      };

      const token = await service.generateAccessToken(mockUser);
      const tamperedToken = token.slice(0, -6) + 'abcdef';

      await expect(service.verifyAccessToken(tamperedToken)).rejects.toThrow();
    });
  });

  describe('Reusable Token Generation Method (Requirement 7)', () => {
    it('should generate both Access and Refresh tokens with tokenType Bearer and expiresIn 15m', async () => {
      const mockUser = {
        _id: '67272714207198bb6c30f410',
        role: UserRole.TEACHER,
        institutionId: '67272714207198bb6c30f400',
      };

      const authTokens = await service.generateAuthTokens(mockUser);

      expect(authTokens.accessToken).toBeDefined();
      expect(authTokens.refreshToken).toBeDefined();
      expect(authTokens.tokenType).toBe('Bearer');
      expect(authTokens.expiresIn).toBe('15m');

      // Verify refresh token uses refresh secret
      const verifiedRefresh = await service.verifyRefreshToken(authTokens.refreshToken);
      expect(verifiedRefresh.sub).toBe(mockUser._id);
      expect(verifiedRefresh.role).toBe(UserRole.TEACHER);
    });
  });
});

