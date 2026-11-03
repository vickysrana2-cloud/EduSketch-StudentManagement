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
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UserManagementGuard } from '../common/guards/user-management.guard';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { UserRole, UserStatus } from './enums/user.enums';

@ApiTags('Users')
@ApiHeader({
  name: 'x-user-role',
  description:
    'Temporary User Authorization header. Must be SUPER_ADMIN or ADMIN.',
  required: true,
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
  @ApiBadRequestResponse({
    description:
      'Validation failure: missing fields, invalid ObjectId, or role/institution constraint violation (e.g. SUPER_ADMIN having an institutionId, or non-SUPER_ADMIN missing institutionId).',
  })
  @ApiConflictResponse({
    description: 'A user with this email address already exists.',
  })
  @ApiNotFoundResponse({
    description: 'The specified institution does not exist.',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing `x-user-role` header.',
  })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions or attempt at role escalation.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Database or server error.',
  })
  async createUser(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.createUser(createUserDto);
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
  @ApiBadRequestResponse({
    description: 'Invalid MongoDB ObjectId format.',
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
  @ApiNotFoundResponse({
    description: 'Institution does not exist.',
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
    summary: 'Update user profile or role',
    description:
      'Updates user details. If password is provided, it is securely hashed and passwordChangedAt is updated.',
  })
  @ApiParam({
    name: 'id',
    description: '24-character hexadecimal MongoDB ObjectId of the user',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiOkResponse({
    description: 'User updated successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input or role/institution constraint violation.',
  })
  @ApiConflictResponse({
    description: 'New email address is already in use by another user.',
  })
  @ApiNotFoundResponse({
    description: 'User or target institution not found.',
  })
  async updateUser(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.usersService.updateUser(id, updateUserDto);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update user account status',
    description: 'Updates only the operational status (ACTIVE, INACTIVE, SUSPENDED).',
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
    description: 'Invalid status value or invalid ObjectId format.',
  })
  @ApiNotFoundResponse({
    description: 'User not found.',
  })
  async updateUserStatus(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
  ) {
    return await this.usersService.updateUserStatus(
      id,
      updateUserStatusDto.status,
    );
  }
}

