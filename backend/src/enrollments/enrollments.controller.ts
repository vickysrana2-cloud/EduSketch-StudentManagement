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
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { PromoteStudentDto } from './dto/promote-student.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { UpdateEnrollmentStatusDto } from './dto/update-enrollment-status.dto';
import { QueryEnrollmentsDto } from './dto/query-enrollments.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@ApiTags('Student Enrollments')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Permissions('STUDENT_CREATE')
  @ApiOperation({ summary: 'Create Student Enrollment (Task 26)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Student enrolled successfully.' })
  async create(
    @Body() dto: CreateEnrollmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.enrollmentsService.create(dto, user);
  }

  @Post('promote')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Permissions('STUDENT_UPDATE')
  @ApiOperation({ summary: 'Promote Student to Next Grade / Academic Year' })
  async promote(
    @Body() dto: PromoteStudentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.enrollmentsService.promote(dto, user);
  }

  @Get()
  @Permissions('STUDENT_READ')
  @ApiOperation({ summary: 'List Enrollments with Filters & Pagination' })
  async findAll(
    @Query() query: QueryEnrollmentsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.enrollmentsService.findAll(query, user);
  }

  @Get(':id')
  @Permissions('STUDENT_READ')
  @ApiOperation({ summary: 'Get Enrollment by ID' })
  async findById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.enrollmentsService.findById(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Permissions('STUDENT_UPDATE')
  @ApiOperation({ summary: 'Update Enrollment Details' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEnrollmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.enrollmentsService.update(id, dto, user);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Permissions('STUDENT_UPDATE')
  @ApiOperation({ summary: 'Update Enrollment Status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateEnrollmentStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.enrollmentsService.updateStatus(id, dto.status, user);
  }
}

