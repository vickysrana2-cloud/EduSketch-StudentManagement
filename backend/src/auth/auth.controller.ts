import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User Login',
    description:
      'Authenticates user credentials and issues access & refresh tokens (Foundational endpoint; completed in Task 06).',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login foundation endpoint reached.',
  })
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'User Registration',
    description:
      'Registers a new user (ADMIN, TEACHER, STUDENT) attached to an institution.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Registration foundation endpoint reached.',
  })
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh Access Token',
    description: 'Validates a refresh token and generates a new access token.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Refresh token verified successfully.',
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

