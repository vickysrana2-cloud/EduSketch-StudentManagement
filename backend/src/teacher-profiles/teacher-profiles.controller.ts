import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TeacherProfilesService } from './teacher-profiles.service';
import { CreateTeacherProfileDto } from './dto/create-teacher-profile.dto';
import { UpdateTeacherProfileDto } from './dto/update-teacher-profile.dto';
import { AssignResourcesDto } from './dto/assign-resources.dto';
import { QueryTeacherProfilesDto } from './dto/query-teacher-profiles.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@ApiTags('Teacher Profiles')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('teacher-profiles')
export class TeacherProfilesController {
  constructor(private readonly teacherProfilesService: TeacherProfilesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Permissions('TEACHER_CREATE')
  @ApiOperation({ summary: 'Create Teacher Profile (Task 23)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Teacher profile created successfully.' })
  async create(
    @Body() dto: CreateTeacherProfileDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.teacherProfilesService.create(dto, user);
  }

  @Get()
  @Permissions('TEACHER_READ')
  @ApiOperation({ summary: 'List Teacher Profiles with Filters & Pagination' })
  async findAll(
    @Query() query: QueryTeacherProfilesDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.teacherProfilesService.findAll(query, user);
  }

  @Get('me')
  @Roles(UserRole.TEACHER)
  @ApiOperation({ summary: 'Get Current Logged-in Teacher Profile (Self-Service)' })
  async getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    return await this.teacherProfilesService.findByUserId(user.userId, user);
  }

  @Get(':id')
  @Permissions('TEACHER_READ')
  @ApiOperation({ summary: 'Get Specific Teacher Profile by ID' })
  async findById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.teacherProfilesService.findById(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Permissions('TEACHER_UPDATE')
  @ApiOperation({ summary: 'Update Teacher Profile' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTeacherProfileDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.teacherProfilesService.update(id, dto, user);
  }

  @Patch(':id/assign')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Permissions('TEACHER_MANAGE')
  @ApiOperation({ summary: 'Assign Classes & Subjects to Teacher' })
  async assignResources(
    @Param('id') id: string,
    @Body() dto: AssignResourcesDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.teacherProfilesService.assignResources(id, dto, user);
  }
}

