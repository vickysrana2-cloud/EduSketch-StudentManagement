import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { CurrentUserResponseDto } from './dto/current-user-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Helper method for consistent cookie configuration (Requirements 4 & 5)
   */
  private getCookieOptions() {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    const sameSiteMode =
      (this.configService.get<string>('COOKIE_SAME_SITE') as
        | 'lax'
        | 'strict'
        | 'none') || 'lax';

    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: sameSiteMode,
      path: '/api/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    };
  }

  private getClearCookieOptions() {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    const sameSiteMode =
      (this.configService.get<string>('COOKIE_SAME_SITE') as
        | 'lax'
        | 'strict'
        | 'none') || 'lax';

    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: sameSiteMode,
      path: '/api/auth',
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 login attempts per minute per IP
  @ApiOperation({
    summary: 'Secure User Login',
    description:
      'Authenticates user credentials, compares password using bcrypt, verifies account status, generates access JWT (15m), records a refresh session, sets an HttpOnly cookie, and returns safe user details.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User successfully authenticated and tokens issued.',
  })
  @ApiUnauthorizedResponse({
    description:
      'Invalid credentials, suspended/inactive account, unverified email, or role mismatch.',
  })
  @ApiTooManyRequestsResponse({
    description: 'Too many failed login attempts. Rate limit exceeded.',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipAddress =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      req.ip;
    const userAgent = req.headers['user-agent'];

    const result = await this.authService.login(loginDto, {
      ipAddress,
      userAgent,
    });

    // Set refresh token in HttpOnly cookie (Requirement 4 & 5)
    res.cookie('refreshToken', result.refreshToken, this.getCookieOptions());

    return {
      accessToken: result.accessToken,
      tokenType: result.tokenType,
      expiresIn: result.expiresIn,
      user: result.user,
    };
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ThrottlerGuard, OptionalJwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Secure User Registration & Institutional Onboarding',
    description:
      'Registers an institutional user (ADMIN, TEACHER, STUDENT). For Admin-created accounts, institutionId is strictly derived from the authenticated Admin session. Public registration for SUPER_ADMIN or ADMIN is forbidden. Rate-limited to 10 requests per minute.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User successfully registered.',
  })
  @ApiBadRequestResponse({
    description:
      'Weak password (must be 8+ chars with uppercase, lowercase, and number), invalid ObjectId, or inactive institution.',
  })
  @ApiForbiddenResponse({
    description:
      'Unauthorized role assignment (e.g. attempting to register as SUPER_ADMIN or unauthenticated institutional onboarding).',
  })
  @ApiConflictResponse({
    description: 'A user with this email address already exists.',
  })
  @ApiNotFoundResponse({
    description: 'The specified institution does not exist.',
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded: too many registration attempts.',
  })
  async register(
    @Body() registerDto: RegisterDto,
    @CurrentUser() currentUser?: any,
  ) {
    return await this.authService.register(registerDto, currentUser);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Rotate Refresh Token & Issue New Access Token',
    description:
      'Rotates the refresh token (Task 09), revokes the previous token record, checks for reuse breaches, and issues a fresh 15-minute access token. Reads refresh token from HttpOnly cookie or request body.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token successfully rotated and fresh access token returned.',
  })
  @ApiUnauthorizedResponse({
    description:
      'Invalid, expired, or reused refresh token. Compromised families are automatically terminated.',
  })
  async refreshTokens(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawRefreshToken =
      req.cookies?.refreshToken || refreshTokenDto?.refreshToken;

    if (!rawRefreshToken) {
      throw new UnauthorizedException(
        'Refresh token is required via HttpOnly cookie or request body',
      );
    }

    const ipAddress =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      req.ip;
    const userAgent = req.headers['user-agent'];

    const result = await this.authService.refreshTokens(rawRefreshToken, {
      ipAddress,
      userAgent,
    });

    // Update HttpOnly cookie with the newly rotated refresh token
    res.cookie('refreshToken', result.refreshToken, this.getCookieOptions());

    return {
      accessToken: result.accessToken,
      tokenType: result.tokenType,
      expiresIn: result.expiresIn,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout & Revoke Refresh Token Session',
    description:
      'Revokes the refresh token session in MongoDB and clears the HttpOnly cookie.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully logged out and session revoked.',
  })
  async logout(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawRefreshToken =
      req.cookies?.refreshToken || refreshTokenDto?.refreshToken;

    await this.authService.logout(rawRefreshToken);

    // Clear the HttpOnly refresh token cookie
    res.clearCookie('refreshToken', this.getClearCookieOptions());

    return {
      message: 'Successfully logged out. Refresh token session has been revoked.',
    };
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Logout From All Devices',
    description:
      'Requires a valid authenticated user JWT token. Revokes all active refresh-token sessions across all devices for this user and clears the current HttpOnly cookie.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully logged out from all devices.',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid JWT Bearer access token.',
  })
  async logoutAll(
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logoutAll(user.userId);

    // Clear the current device refresh-token cookie
    res.clearCookie('refreshToken', this.getClearCookieOptions());

    return {
      message:
        'Successfully logged out from all devices. All active sessions have been terminated.',
    };
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'List Active Device Sessions',
    description:
      'Retrieves all active, non-revoked device sessions for the authenticated user, including IP address, user-agent, and expiration.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Active sessions retrieved successfully.',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid JWT Bearer token.',
  })
  async getActiveSessions(@CurrentUser() user: any) {
    const sessions = await this.authService.getUserSessions(user.userId);
    return {
      message: 'Active sessions retrieved successfully.',
      count: sessions.length,
      sessions,
    };
  }

  @Delete('sessions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Revoke Specific Device Session',
    description:
      'Revokes a specific session belonging to the authenticated user by session ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the session document to revoke',
    example: '67272714207198bb6c30f401',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Session revoked successfully.',
  })
  @ApiNotFoundResponse({
    description: 'Session not found or does not belong to the authenticated user.',
  })
  async revokeSession(
    @Param('id') sessionId: string,
    @CurrentUser() user: any,
  ) {
    return await this.authService.revokeSession(sessionId, user.userId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get Current Authenticated User Profile (Task 11)',
    description:
      'Extracts user identity from the verified JWT access token, queries the authoritative user document from MongoDB, validates account status, populates institution details (null for SUPER_ADMIN), and returns safe profile data excluding passwordHash.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current user profile retrieved successfully from MongoDB.',
    type: CurrentUserResponseDto,
  })
  @ApiUnauthorizedResponse({
    description:
      'Missing, invalid, expired JWT Bearer token, non-existent user, or suspended/inactive account.',
  })
  async getProfile(@CurrentUser() user: any): Promise<CurrentUserResponseDto> {
    return await this.authService.getCurrentUser(user.userId);
  }
}
