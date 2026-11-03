import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
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
    description: 'Invalid credentials, suspended/inactive account, unverified email, or role mismatch.',
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
      (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || req.ip;
    const userAgent = req.headers['user-agent'];

    const result = await this.authService.login(loginDto, {
      ipAddress,
      userAgent,
    });

    // Set refresh token in HttpOnly cookie (Rule 13)
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/api/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

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
    summary: 'Refresh Access Token',
    description: 'Validates a refresh token and generates a new access token.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Refresh token verified and new access token returned.',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired refresh token.',
  })
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return await this.authService.refreshTokens(refreshTokenDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get Current Authenticated User Profile',
    description:
      'Returns the authenticated user details extracted from the validated JWT token via JwtAuthGuard.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved successfully from JWT token.',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or expired JWT Bearer token.',
  })
  getProfile(@CurrentUser() user: any) {
    return {
      message: 'Authenticated profile retrieved successfully.',
      user,
    };
  }
}
