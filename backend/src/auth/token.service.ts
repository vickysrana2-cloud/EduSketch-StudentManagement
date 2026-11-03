import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Types } from 'mongoose';
import { UserRole } from '../users/enums/user.enums';
import {
  AuthTokens,
  JwtAccessTokenPayload,
} from './interfaces/jwt-payload.interface';

@Injectable()
export class TokenService implements OnModuleInit {
  private readonly logger = new Logger(TokenService.name);

  private accessSecret!: string;
  private accessExpiresIn!: string;
  private refreshSecret!: string;
  private refreshExpiresIn!: string;
  private issuer!: string;
  private audience!: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Validates JWT secret configuration at startup (Requirement 8)
   */
  onModuleInit(): void {
    this.validateAndLoadConfiguration();
  }

  /**
   * Ensures secrets are present, satisfy minimum entropy (>= 32 chars), and parameters are defined.
   */
  private validateAndLoadConfiguration(): void {
    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET');
    if (!accessSecret || accessSecret.trim().length === 0) {
      const errorMsg =
        '[FATAL CONFIG ERROR] JWT_ACCESS_SECRET is missing or empty. Server cannot sign access tokens securely.';
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    if (accessSecret.length < 32) {
      const errorMsg = `[FATAL CONFIG ERROR] JWT_ACCESS_SECRET is too short (${accessSecret.length} chars). HMAC-SHA256 requires at least 32 characters (256 bits) for cryptographic security.`;
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!refreshSecret || refreshSecret.trim().length === 0) {
      const errorMsg =
        '[FATAL CONFIG ERROR] JWT_REFRESH_SECRET is missing or empty. Server cannot sign refresh tokens securely.';
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    if (refreshSecret.length < 32) {
      const errorMsg = `[FATAL CONFIG ERROR] JWT_REFRESH_SECRET is too short (${refreshSecret.length} chars). HMAC-SHA256 requires at least 32 characters (256 bits) for cryptographic security.`;
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    this.accessSecret = accessSecret;
    this.refreshSecret = refreshSecret;
    this.accessExpiresIn =
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m';
    this.refreshExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
    this.issuer =
      this.configService.get<string>('JWT_ISSUER') ||
      'education-management-system';
    this.audience =
      this.configService.get<string>('JWT_AUDIENCE') ||
      'education-management-users';

    this.logger.log(
      `JWT Configuration loaded successfully: Algorithm=HS256, AccessExpiry=${this.accessExpiresIn}, RefreshExpiry=${this.refreshExpiresIn}, Issuer='${this.issuer}', Audience='${this.audience}'`,
    );
  }

  /**
   * Generates a signed Access Token with minimal claims (Task 08):
   * {
   *   "sub": "USER_OBJECT_ID",
   *   "role": "TEACHER",
   *   "institutionId": "INSTITUTION_OBJECT_ID" // null for SUPER_ADMIN
   * }
   *
   * @param user Object containing user _id, role, and optional institutionId
   * @returns Signed JWT string valid for 15 minutes
   */
  async generateAccessToken(user: {
    _id: string | Types.ObjectId;
    role: UserRole;
    institutionId?: string | Types.ObjectId | null;
  }): Promise<string> {
    // Lazy load config if called before onModuleInit in isolated unit tests
    if (!this.accessSecret) {
      this.validateAndLoadConfiguration();
    }

    const userId =
      typeof user._id === 'string' ? user._id : user._id.toString();

    // SUPER_ADMIN has platform-wide authority; institutionId must be null
    const institutionId =
      user.role === UserRole.SUPER_ADMIN || !user.institutionId
        ? null
        : typeof user.institutionId === 'string'
          ? user.institutionId
          : user.institutionId.toString();

    // Minimal claims (Requirements 4, 5, 6)
    const payload: JwtAccessTokenPayload = {
      sub: userId,
      role: user.role,
      institutionId,
    };

    try {
      return await this.jwtService.signAsync(payload, {
        secret: this.accessSecret,
        expiresIn: this.accessExpiresIn as any,
        issuer: this.issuer,
        audience: this.audience,
        algorithm: 'HS256',
      });
    } catch (error: any) {
      this.logger.error(
        `Failed to generate JWT access token: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Could not generate authentication credentials',
      );
    }
  }

  /**
   * Generates a signed Refresh Token valid for 7 days
   */
  async generateRefreshToken(user: {
    _id: string | Types.ObjectId;
    role: UserRole;
    institutionId?: string | Types.ObjectId | null;
  }): Promise<string> {
    if (!this.refreshSecret) {
      this.validateAndLoadConfiguration();
    }

    const userId =
      typeof user._id === 'string' ? user._id : user._id.toString();

    const institutionId =
      user.role === UserRole.SUPER_ADMIN || !user.institutionId
        ? null
        : typeof user.institutionId === 'string'
          ? user.institutionId
          : user.institutionId.toString();

    const payload: JwtAccessTokenPayload = {
      sub: userId,
      role: user.role,
      institutionId,
    };

    try {
      return await this.jwtService.signAsync(payload, {
        secret: this.refreshSecret,
        expiresIn: this.refreshExpiresIn as any,
        issuer: this.issuer,
        audience: this.audience,
        algorithm: 'HS256',
      });
    } catch (error: any) {
      this.logger.error(
        `Failed to generate JWT refresh token: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Could not generate authentication credentials',
      );
    }
  }

  /**
   * Reusable token-generation method producing both Access and Refresh tokens
   */
  async generateAuthTokens(user: {
    _id: string | Types.ObjectId;
    role: UserRole;
    institutionId?: string | Types.ObjectId | null;
  }): Promise<AuthTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(user),
      this.generateRefreshToken(user),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.accessExpiresIn,
    };
  }

  /**
   * Cryptographically verifies an Access Token against JWT_ACCESS_SECRET and HS256
   */
  async verifyAccessToken(token: string): Promise<JwtAccessTokenPayload> {
    if (!this.accessSecret) {
      this.validateAndLoadConfiguration();
    }

    try {
      return await this.jwtService.verifyAsync<JwtAccessTokenPayload>(token, {
        secret: this.accessSecret,
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['HS256'],
      });
    } catch (error: any) {
      this.logger.warn(`Access token verification failed: ${error.message}`);
      throw new UnauthorizedException(
        'Invalid, expired, or corrupted JWT access token',
      );
    }
  }

  /**
   * Cryptographically verifies a Refresh Token against JWT_REFRESH_SECRET and HS256
   */
  async verifyRefreshToken(token: string): Promise<JwtAccessTokenPayload> {
    if (!this.refreshSecret) {
      this.validateAndLoadConfiguration();
    }

    try {
      return await this.jwtService.verifyAsync<JwtAccessTokenPayload>(token, {
        secret: this.refreshSecret,
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['HS256'],
      });
    } catch (error: any) {
      this.logger.warn(`Refresh token verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Helper to decode token payload without verifying signature (useful for inspection/logging)
   */
  decodeToken(token: string): any {
    return this.jwtService.decode(token);
  }
}

