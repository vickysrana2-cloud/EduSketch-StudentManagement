import {
  Body,
  Controller,
  Delete,
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
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { AssignTeachersDto } from './dto/assign-teachers.dto';
import { QuerySubjectsDto } from './dto/query-subjects.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@ApiTags('Subjects')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Permissions('SUBJECT_CREATE')
  @ApiOperation({ summary: 'Create Subject (Task 25)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Subject created successfully.' })
  async create(
    @Body() dto: CreateSubjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.subjectsService.create(dto, user);
  }

  @Get()
  @Permissions('SUBJECT_READ')
  @ApiOperation({ summary: 'List Subjects with Filters & Pagination' })
  async findAll(
    @Query() query: QuerySubjectsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.subjectsService.findAll(query, user);
  }

  @Get(':id')
  @Permissions('SUBJECT_READ')
  @ApiOperation({ summary: 'Get Subject by ID' })
  async findById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.subjectsService.findById(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Permissions('SUBJECT_UPDATE')
  @ApiOperation({ summary: 'Update Subject Details' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSubjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.subjectsService.update(id, dto, user);
  }

  @Patch(':id/teachers')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Permissions('SUBJECT_UPDATE')
  @ApiOperation({ summary: 'Assign Teachers to Subject' })
  async assignTeachers(
    @Param('id') id: string,
    @Body() dto: AssignTeachersDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.subjectsService.assignTeachers(id, dto, user);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Permissions('SUBJECT_DELETE')
  @ApiOperation({ summary: 'Delete Subject' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.subjectsService.delete(id, user);
  }
}

