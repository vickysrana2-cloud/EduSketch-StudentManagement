import {
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { AuthTokens, JwtPayload } from './interfaces/jwt-payload.interface';
import { UserRole, UserStatus } from '../users/enums/user.enums';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Generates both Access and Refresh tokens with separate secrets and lifetimes.
   * Access Token: 15 minutes lifetime (using JWT_ACCESS_SECRET)
   * Refresh Token: 7 days lifetime (using JWT_REFRESH_SECRET)
   */
  async generateTokens(user: {
    _id: string;
    email: string;
    role: UserRole;
    institutionId: string | null;
  }): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user._id,
      email: user.email,
      role: user.role,
      institutionId: user.institutionId,
    };

    const issuer =
      this.configService.get<string>('JWT_ISSUER') ||
      'education-management-system';
    const audience =
      this.configService.get<string>('JWT_AUDIENCE') ||
      'education-management-users';

    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET')!;
    const accessExpiresIn =
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m';

    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET')!;
    const refreshExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: accessExpiresIn as any,
        issuer,
        audience,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn as any,
        issuer,
        audience,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: accessExpiresIn,
    };
  }

  /**
   * Cryptographically verifies a Refresh Token against JWT_REFRESH_SECRET
   */
  async verifyRefreshToken(refreshToken: string): Promise<JwtPayload> {
    try {
      const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET')!;
      const issuer =
        this.configService.get<string>('JWT_ISSUER') ||
        'education-management-system';
      const audience =
        this.configService.get<string>('JWT_AUDIENCE') ||
        'education-management-users';

      return await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: refreshSecret,
        issuer,
        audience,
      });
    } catch (error: any) {
      this.logger.warn(`Invalid or expired refresh token: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Authenticate user with email and password, returning JWT access & refresh tokens
   */
  async login(loginDto: LoginDto): Promise<{
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: string;
    user: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
      status: UserStatus;
      institutionId: string | null;
    };
  }> {
    const normalizedEmail = loginDto.email.trim().toLowerCase();

    // 1. Fetch user by email including the passwordHash
    const user = await this.usersService.findUserByEmailWithPassword(normalizedEmail);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 2. Securely verify password with bcrypt
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 3. Verify user account status
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(
        `User account is ${user.status.toLowerCase()}. Access denied.`,
      );
    }

    // 4. Update last login timestamp
    await this.usersService.updateLastLogin(user._id.toString());

    // 5. Generate Access & Refresh tokens
    const tokens = await this.generateTokens({
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
      institutionId: user.institutionId ? user.institutionId.toString() : null,
    });

    this.logger.log(`User '${user.email}' (${user.role}) logged in successfully.`);

    return {
      ...tokens,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        institutionId: user.institutionId ? user.institutionId.toString() : null,
      },
    };
  }

  /**
   * Foundation register handler
   */
  async register(registerDto: RegisterDto): Promise<Record<string, any>> {
    this.logger.log(`Registration attempt for ${registerDto.email}`);
    const user = await this.usersService.createUser({
      name: registerDto.name,
      email: registerDto.email,
      password: registerDto.password,
      role: registerDto.role,
      institutionId: registerDto.institutionId,
      profileImage: registerDto.profileImage,
    });

    const tokens = await this.generateTokens({
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
      institutionId: user.institutionId ? user.institutionId.toString() : null,
    });

    return {
      ...tokens,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        institutionId: user.institutionId ? user.institutionId.toString() : null,
      },
    };
  }

  /**
   * Refresh Token handler: Generates a new access token
   */
  async refreshTokens(refreshTokenDto: RefreshTokenDto): Promise<AuthTokens> {
    const payload = await this.verifyRefreshToken(refreshTokenDto.refreshToken);
    const user = await this.usersService.findUserById(payload.sub);

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User no longer exists or is inactive');
    }

    return await this.generateTokens({
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
      institutionId: user.institutionId ? user.institutionId.toString() : null,
    });
  }
}
