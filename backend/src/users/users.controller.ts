import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateTeacherUserDto } from './dto/create-teacher-user.dto';
import { CreateStudentUserDto } from './dto/create-student-user.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UserManagementGuard } from '../common/guards/user-management.guard';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { UserRole, UserStatus } from './enums/user.enums';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@ApiHeader({
  name: 'x-user-role',
  description:
    'Authorization header. Must be SUPER_ADMIN or ADMIN (or pass Authorization Bearer JWT).',
  required: false,
  schema: { default: 'SUPER_ADMIN' },
})
@UseGuards(UserManagementGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new user',
    description:
      'Creates a new centralized user document. Requires SUPER_ADMIN or ADMIN. Role escalation is strictly prevented.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User created successfully.',
  })
  async createUser(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.createUser(createUserDto);
  }

  @Post('teachers')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Permissions('TEACHER_CREATE')
  @ApiOperation({
    summary: 'Create Teacher Account & Linked Profile (Task 19)',
    description:
      'Creates a User with role TEACHER and a linked TeacherProfile. Requires ADMIN with TEACHER_CREATE permission or SUPER_ADMIN.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Teacher account and profile created successfully.',
  })
  @ApiBadRequestResponse({ description: 'Invalid input or institution not active.' })
  @ApiConflictResponse({ description: 'Duplicate email or employeeId.' })
  async createTeacher(
    @Body() createTeacherDto: CreateTeacherUserDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return await this.usersService.createTeacher(createTeacherDto, currentUser);
  }

  @Post('students')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Permissions('STUDENT_CREATE')
  @ApiOperation({
    summary: 'Admit Student, Create Profile & Initial Enrollment (Task 20)',
    description:
      'Creates a User with role STUDENT, a linked StudentProfile, and initial Class Enrollment. Requires ADMIN with STUDENT_CREATE permission.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Student admitted, profile created, and initial enrollment completed.',
  })
  @ApiBadRequestResponse({ description: 'Class is full, invalid age/DOB, or institution not active.' })
  @ApiConflictResponse({ description: 'Duplicate email, admission number, or roll number.' })
  async createStudent(
    @Body() createStudentDto: CreateStudentUserDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return await this.usersService.createStudent(createStudentDto, currentUser);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all users',
    description:
      'Retrieves all users across the system with optional filters by role, status, institutionId, or search keyword.',
  })
  @ApiQuery({
    name: 'role',
    enum: UserRole,
    required: false,
    description: 'Filter by user role',
  })
  @ApiQuery({
    name: 'status',
    enum: UserStatus,
    required: false,
    description: 'Filter by user status',
  })
  @ApiQuery({
    name: 'institutionId',
    required: false,
    description: 'Filter by 24-character hexadecimal MongoDB ObjectId of an institution',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by user name or email (case-insensitive)',
  })
  @ApiOkResponse({
    description: 'List of users retrieved successfully.',
  })
  async findAllUsers(
    @Query('role') role?: UserRole,
    @Query('status') status?: UserStatus,
    @Query('institutionId') institutionId?: string,
    @Query('search') search?: string,
  ) {
    return await this.usersService.findAllUsers({
      role,
      status,
      institutionId,
      search,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description:
      'Retrieves a single user by MongoDB ObjectId. Password hash is never included.',
  })
  @ApiParam({
    name: 'id',
    description: '24-character hexadecimal MongoDB ObjectId of the user',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiOkResponse({
    description: 'User details found and returned.',
  })
  @ApiNotFoundResponse({
    description: 'User with the specified ID was not found.',
  })
  async findUserById(@Param('id', ParseObjectIdPipe) id: string) {
    return await this.usersService.findUserById(id);
  }

  @Get('institution/:institutionId')
  @ApiOperation({
    summary: 'Get all users belonging to an institution',
    description:
      'Retrieves all users (Admins, Teachers, Students) for a given institution ID.',
  })
  @ApiParam({
    name: 'institutionId',
    description: '24-character hexadecimal MongoDB ObjectId of the institution',
    example: '67272714207198bb6c30f401',
  })
  @ApiQuery({
    name: 'role',
    enum: UserRole,
    required: false,
    description: 'Filter by user role (e.g. TEACHER or STUDENT)',
  })
  @ApiQuery({
    name: 'status',
    enum: UserStatus,
    required: false,
    description: 'Filter by status (ACTIVE, INACTIVE, SUSPENDED)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search user name or email',
  })
  @ApiOkResponse({
    description: 'Institution user list retrieved successfully.',
  })
  async findUsersByInstitution(
    @Param('institutionId', ParseObjectIdPipe) institutionId: string,
    @Query('role') role?: UserRole,
    @Query('status') status?: UserStatus,
    @Query('search') search?: string,
  ) {
    return await this.usersService.findUsersByInstitution(institutionId, {
      role,
      status,
      search,
    });
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update user profile (Task 21)',
    description:
      'Updates basic user profile details (name, email, profileImage). Protected fields like role, password, and institutionId cannot be modified here.',
  })
  @ApiParam({
    name: 'id',
    description: '24-character hexadecimal MongoDB ObjectId of the user',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiOkResponse({
    description: 'User updated successfully.',
  })
  @ApiConflictResponse({
    description: 'New email address is already in use by another user.',
  })
  @ApiNotFoundResponse({
    description: 'User not found.',
  })
  async updateUser(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateUserProfileDto: UpdateUserProfileDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return await this.usersService.updateUserProfile(
      id,
      updateUserProfileDto,
      currentUser,
    );
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update user operational status & revoke sessions (Task 21)',
    description:
      'Updates operational status (ACTIVE, INACTIVE, SUSPENDED). Automatically revokes all active sessions upon deactivation or suspension. Users cannot deactivate their own account.',
  })
  @ApiParam({
    name: 'id',
    description: '24-character hexadecimal MongoDB ObjectId of the user',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiOkResponse({
    description: 'User status updated successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Self-deactivation attempt or invalid status.',
  })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions or cross-institution access attempt.',
  })
  @ApiNotFoundResponse({
    description: 'User not found.',
  })
  async updateUserStatus(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return await this.usersService.updateUserStatusWithRevocation(
      id,
      updateUserStatusDto.status,
      currentUser,
    );
  }

  @Patch(':id/role')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Separate authorized workflow for user role change (Task 21 Requirement 5)',
    description: 'Restricted strictly to SUPER_ADMIN.',
  })
  @ApiParam({
    name: 'id',
    description: '24-character hexadecimal MongoDB ObjectId of the user',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiOkResponse({
    description: 'User role updated successfully.',
  })
  async updateUserRole(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return await this.usersService.updateUserRole(
      id,
      updateUserRoleDto.role,
      currentUser,
    );
  }
}
