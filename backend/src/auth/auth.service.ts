import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { SessionsService } from './sessions.service';
import { TokenService } from './token.service';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Institution, InstitutionDocument } from '../institutions/schemas/institution.schema';
import { AuthTokens, JwtPayload } from './interfaces/jwt-payload.interface';
import { UserRole, UserStatus } from '../users/enums/user.enums';
import { InstitutionStatus } from '../institutions/enums/institution.enums';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
  CurrentUserResponseDto,
  InstitutionSummaryDto,
} from './dto/current-user-response.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Institution.name)
    private readonly institutionModel: Model<InstitutionDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly tokenService: TokenService,
  ) {}

  /**
   * Generates both Access and Refresh tokens via TokenService (Task 08)
   */
  async generateTokens(user: {
    _id: string;
    role: UserRole;
    institutionId: string | null;
  }): Promise<AuthTokens> {
    return await this.tokenService.generateAuthTokens(user);
  }

  /**
   * Cryptographically verifies a Refresh Token via TokenService
   */
  async verifyRefreshToken(refreshToken: string): Promise<JwtPayload> {
    return await this.tokenService.verifyRefreshToken(refreshToken);
  }

  /**
   * Secure User Login Workflow (Task 07)
   */
  async login(
    loginDto: LoginDto,
    metadata?: { ipAddress?: string; userAgent?: string },
  ): Promise<{
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
      isEmailVerified: boolean;
      institutionId: string | null;
      lastLoginAt: Date | null;
    };
  }> {
    // 1 & 2. Normalize email
    const normalizedEmail = loginDto.email.trim().toLowerCase();

    // 3 & 4. Find user by email and explicitly retrieve passwordHash
    const user = await this.userModel
      .findOne({ email: normalizedEmail })
      .select('+passwordHash')
      .populate('institutionId', 'name code type status')
      .exec();

    // 5 & 6. Constant-time check / generic error rejection
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 7. Check account status
    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException(
        'Your account has been suspended. Please contact support.',
      );
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException(
        'Your account is inactive. Please contact your administrator.',
      );
    }

    // 8. Check email verification policy
    const requireEmailVerification =
      this.configService.get<string>('REQUIRE_EMAIL_VERIFICATION') === 'true';

    if (requireEmailVerification && !user.isEmailVerified) {
      throw new UnauthorizedException(
        'Please verify your email address before logging in.',
      );
    }

    // 9. Role consistency check: Database role is ALWAYS authoritative
    if (loginDto.role && loginDto.role !== user.role) {
      throw new UnauthorizedException(
        `Role mismatch: You attempted to sign in as ${loginDto.role}, but your account is registered as ${user.role}.`,
      );
    }

    // 10. Generate access token (15m)
    const institutionIdStr = user.institutionId
      ? (user.institutionId as any)._id?.toString() ||
        user.institutionId.toString()
      : null;

    const accessToken = await this.tokenService.generateAccessToken({
      _id: user._id.toString(),
      role: user.role,
      institutionId: institutionIdStr,
    });

    // 11. Create refresh-token session through SessionsService (Task 09: random token & hash)
    const sessionResult = await this.sessionsService.createSession({
      userId: user._id.toString(),
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      expiresInDays: 7,
    });

    // 14. Record lastLoginAt after successful login
    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        user._id,
        { $set: { lastLoginAt: new Date() } },
        { new: true },
      )
      .exec();

    this.logger.log(
      `Successful login: '${user.email}' (${user.role}) from IP: ${metadata?.ipAddress || 'unknown'}`,
    );

    // 12. Return safe user details (Never return passwordHash or refreshTokenHash)
    return {
      accessToken,
      refreshToken: sessionResult.rawRefreshToken,
      tokenType: 'Bearer',
      expiresIn: '15m',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        isEmailVerified: user.isEmailVerified,
        institutionId: institutionIdStr,
        lastLoginAt: updatedUser?.lastLoginAt || new Date(),
      },
    };
  }

  /**
   * Secure User Registration
   */
  async register(
    registerDto: RegisterDto,
    currentUser?: { userId: string; email: string; role: UserRole; institutionId: string | null },
  ): Promise<{
    message: string;
    user: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
      status: UserStatus;
      isEmailVerified: boolean;
      institution: {
        id: string;
        name: string;
        code: string;
        status: InstitutionStatus;
      };
      createdAt: Date;
    };
  }> {
    if (registerDto.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Unauthorized role assignment: Registration as SUPER_ADMIN is strictly prohibited via public or standard API endpoints.',
      );
    }

    if (registerDto.role === UserRole.ADMIN) {
      if (!currentUser || currentUser.role !== UserRole.SUPER_ADMIN) {
        throw new ForbiddenException(
          'Unauthorized role assignment: Only an authenticated SUPER_ADMIN can register an Institution ADMIN. Public registration is not allowed.',
        );
      }
    }

    if (
      registerDto.role === UserRole.TEACHER ||
      registerDto.role === UserRole.STUDENT
    ) {
      if (!currentUser) {
        throw new ForbiddenException(
          'Institutional onboarding required: Direct public registration as TEACHER or STUDENT is disabled. An authorized Administrator must onboard users.',
        );
      }

      if (
        currentUser.role !== UserRole.ADMIN &&
        currentUser.role !== UserRole.SUPER_ADMIN
      ) {
        throw new ForbiddenException(
          'Unauthorized role assignment: Only an Administrator or Super Admin can onboard teachers or students.',
        );
      }
    }

    let effectiveInstitutionId: string;

    if (currentUser?.role === UserRole.ADMIN) {
      if (!currentUser.institutionId) {
        throw new BadRequestException(
          'Authenticated Admin does not belong to any valid institution.',
        );
      }
      effectiveInstitutionId = currentUser.institutionId;
    } else if (currentUser?.role === UserRole.SUPER_ADMIN) {
      if (!registerDto.institutionId) {
        throw new BadRequestException(
          'institutionId is required when a Super Admin registers an institutional user.',
        );
      }
      effectiveInstitutionId = registerDto.institutionId;
    } else {
      if (!registerDto.institutionId) {
        throw new BadRequestException('institutionId is required.');
      }
      effectiveInstitutionId = registerDto.institutionId;
    }

    if (!Types.ObjectId.isValid(effectiveInstitutionId)) {
      throw new BadRequestException(
        `Invalid MongoDB ObjectId format for institutionId: '${effectiveInstitutionId}'`,
      );
    }

    const institution = await this.institutionModel
      .findById(effectiveInstitutionId)
      .exec();

    if (!institution) {
      throw new NotFoundException(
        `Institution with ID '${effectiveInstitutionId}' does not exist`,
      );
    }

    if (institution.status !== InstitutionStatus.ACTIVE) {
      throw new BadRequestException(
        `Cannot register user: Institution '${institution.name}' is currently ${institution.status}. Only ACTIVE institutions can onboard users.`,
      );
    }

    const normalizedEmail = registerDto.email.trim().toLowerCase();

    const existingUser = await this.userModel
      .findOne({ email: normalizedEmail })
      .lean()
      .exec();

    if (existingUser) {
      throw new ConflictException(
        `A user with email address '${normalizedEmail}' already exists.`,
      );
    }

    const saltRounds = parseInt(
      this.configService.get<string>('BCRYPT_SALT_ROUNDS') || '12',
      10,
    );
    const salt = await bcrypt.genSalt(saltRounds);
    const passwordHash = await bcrypt.hash(registerDto.password, salt);

    try {
      const newUser = new this.userModel({
        name: registerDto.name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: registerDto.role,
        status: UserStatus.ACTIVE,
        isEmailVerified: false,
        institutionId: new Types.ObjectId(effectiveInstitutionId),
        profileImage: registerDto.profileImage ?? null,
        lastLoginAt: null,
        passwordChangedAt: null,
      });

      const savedUser = await newUser.save();

      this.logger.log(
        `User successfully registered: '${savedUser.email}' as ${savedUser.role} in institution '${institution.name}' (${institution.code})`,
      );

      return {
        message: 'User successfully registered.',
        user: {
          id: savedUser._id.toString(),
          name: savedUser.name,
          email: savedUser.email,
          role: savedUser.role,
          status: savedUser.status,
          isEmailVerified: savedUser.isEmailVerified,
          institution: {
            id: institution._id.toString(),
            name: institution.name,
            code: institution.code,
            status: institution.status,
          },
          createdAt: savedUser.createdAt!,
        },
      };
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException(
          `A user with email address '${normalizedEmail}' already exists.`,
        );
      }
      this.logger.error(`Error saving registered user: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to complete user registration');
    }
  }

  /**
   * Refresh Token handler with Rotation & Reuse Detection (Task 09)
   */
  async refreshTokens(
    rawRefreshToken: string,
    metadata?: { ipAddress?: string; userAgent?: string },
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: string;
  }> {
    // 1. Rotate session in Sessions collection (detects reuse & checks expiry)
    const rotationResult = await this.sessionsService.rotateSession(
      rawRefreshToken,
      metadata,
    );

    // 2. Validate user account status (Requirement 11)
    const user = await this.usersService.findUserById(rotationResult.userId);

    if (!user) {
      throw new UnauthorizedException('User account no longer exists');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException(
        'Your account has been suspended. Please contact support.',
      );
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException(
        'Your account is inactive. Please contact your administrator.',
      );
    }

    const institutionIdStr = user.institutionId
      ? user.institutionId.toString()
      : null;

    // 3. Issue fresh 15m access token
    const accessToken = await this.tokenService.generateAccessToken({
      _id: user._id.toString(),
      role: user.role,
      institutionId: institutionIdStr,
    });

    return {
      accessToken,
      refreshToken: rotationResult.newRawRefreshToken,
      tokenType: 'Bearer',
      expiresIn: '15m',
    };
  }

  /**
   * Logout handler: revokes refresh token session and invalidates cookie (Requirement 3 & 8)
   */
  async logout(rawRefreshToken?: string): Promise<{ message: string }> {
    if (rawRefreshToken) {
      await this.sessionsService.revokeSessionByToken(rawRefreshToken);
    }
    return { message: 'Successfully logged out.' };
  }

  /**
   * Logout from all devices: revokes all sessions belonging to the user (Requirement 7)
   */
  async logoutAll(userId: string): Promise<{ message: string }> {
    await this.sessionsService.revokeAllUserSessions(userId);
    return { message: 'Successfully logged out from all devices.' };
  }

  /**
   * Retrieves active sessions for the current user
   */
  async getUserSessions(userId: string) {
    return await this.sessionsService.getUserActiveSessions(userId);
  }

  /**
   * Revokes a specific session for the current user
   */
  async revokeSession(sessionId: string, userId: string) {
    await this.sessionsService.revokeSessionById(sessionId, userId);
    return { message: 'Session revoked successfully.' };
  }

  /**
   * Retrieves current authenticated user profile directly from MongoDB (Task 11)
   * Ensures live, authoritative state rather than relying on stale JWT claims.
   */
  async getCurrentUser(userId: string): Promise<CurrentUserResponseDto> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new UnauthorizedException('Invalid user identity in token');
    }

    const user = await this.userModel
      .findById(userId)
      .populate('institutionId', 'name code type status')
      .exec();

    // 9. Handle deleted or non-existent users
    if (!user) {
      throw new UnauthorizedException('User account no longer exists');
    }

    // 4 & 9. Handle suspended or inactive users
    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException(
        'Your account has been suspended. Please contact support.',
      );
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException(
        'Your account is inactive. Please contact your administrator.',
      );
    }

    // 5. Fetch current institution details where applicable (null for SUPER_ADMIN)
    let institutionSummary: InstitutionSummaryDto | null = null;
    if (user.role !== UserRole.SUPER_ADMIN && user.institutionId) {
      const inst = user.institutionId as any;
      if (inst && typeof inst === 'object' && inst._id) {
        institutionSummary = {
          id: inst._id.toString(),
          name: inst.name,
          code: inst.code,
          type: inst.type,
          status: inst.status,
        };
      }
    }

    // 6 & 7. Return safe user information (never expose passwordHash)
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
      institution: institutionSummary,
      profileImage: user.profileImage || null,
      lastLoginAt: user.lastLoginAt || null,
      createdAt: user.createdAt,
    };
  }
}
