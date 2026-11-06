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
import { StudentProfilesService } from './student-profiles.service';
import { CreateStudentProfileDto } from './dto/create-student-profile.dto';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { QueryStudentProfilesDto } from './dto/query-student-profiles.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@ApiTags('Student Profiles')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('student-profiles')
export class StudentProfilesController {
  constructor(private readonly studentProfilesService: StudentProfilesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Permissions('STUDENT_CREATE')
  @ApiOperation({ summary: 'Admit Student / Create Student Profile (Task 22)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Student profile created successfully.' })
  async create(
    @Body() dto: CreateStudentProfileDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.studentProfilesService.create(dto, user);
  }

  @Get()
  @Permissions('STUDENT_READ')
  @ApiOperation({ summary: 'List Student Profiles with Filters & Pagination' })
  async findAll(
    @Query() query: QueryStudentProfilesDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.studentProfilesService.findAll(query, user);
  }

  @Get('me')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get Current Logged-in Student Profile (Self-Service)' })
  async getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    return await this.studentProfilesService.findByUserId(user.userId, user);
  }

  @Get(':id')
  @Permissions('STUDENT_READ')
  @ApiOperation({ summary: 'Get Specific Student Profile by ID' })
  async findById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.studentProfilesService.findById(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Permissions('STUDENT_UPDATE')
  @ApiOperation({ summary: 'Update Student Profile' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateStudentProfileDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.studentProfilesService.update(id, dto, user);
  }
}

