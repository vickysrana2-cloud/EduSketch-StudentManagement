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
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { UpdateClassStatusDto } from './dto/update-class-status.dto';
import { QueryClassesDto } from './dto/query-classes.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@ApiTags('Classes')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Permissions('CLASS_CREATE')
  @ApiOperation({ summary: 'Create Class (Task 24)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Class created successfully.' })
  async create(
    @Body() dto: CreateClassDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.classesService.create(dto, user);
  }

  @Get()
  @Permissions('CLASS_READ')
  @ApiOperation({ summary: 'List Classes with Filters & Pagination' })
  async findAll(
    @Query() query: QueryClassesDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.classesService.findAll(query, user);
  }

  @Get(':id')
  @Permissions('CLASS_READ')
  @ApiOperation({ summary: 'Get Class by ID' })
  async findById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.classesService.findById(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Permissions('CLASS_UPDATE')
  @ApiOperation({ summary: 'Update Class Details' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateClassDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.classesService.update(id, dto, user);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Permissions('CLASS_UPDATE')
  @ApiOperation({ summary: 'Update Class Status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateClassStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.classesService.updateStatus(id, dto.status, user);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Permissions('CLASS_DELETE')
  @ApiOperation({ summary: 'Delete Class (checks for active enrollments)' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.classesService.delete(id, user);
  }
}

