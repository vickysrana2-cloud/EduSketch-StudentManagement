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
import { InstitutionsService } from './institutions.service';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';
import { UpdateInstitutionStatusDto } from './dto/update-institution-status.dto';
import { CreateInstitutionAdminDto } from './dto/create-institution-admin.dto';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { InstitutionStatus, InstitutionType } from './enums/institution.enums';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@ApiTags('Institutions')
@ApiBearerAuth('JWT-auth')
@ApiHeader({
  name: 'x-user-role',
  description:
    'Temporary Super Admin authorization header. Must be set to SUPER_ADMIN.',
  required: false,
  schema: { default: 'SUPER_ADMIN' },
})
@UseGuards(OptionalJwtAuthGuard, SuperAdminGuard)
@Controller('institutions')
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new educational institution',
    description:
      'Creates a new institution document. Restricted to SUPER_ADMIN users.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Institution successfully created.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data, invalid dates, or malformed ObjectId.',
  })
  @ApiConflictResponse({
    description: 'Institution with the provided code already exists.',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing `x-user-role` header.',
  })
  @ApiForbiddenResponse({
    description: 'User role is not SUPER_ADMIN.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Database or server error.',
  })
  async createInstitution(@Body() createInstitutionDto: CreateInstitutionDto) {
    return await this.institutionsService.createInstitution(createInstitutionDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all institutions',
    description:
      'Retrieves all institutions with optional filtering by status, type, or search keyword. Restricted to SUPER_ADMIN.',
  })
  @ApiQuery({
    name: 'status',
    enum: InstitutionStatus,
    required: false,
    description: 'Filter institutions by status',
  })
  @ApiQuery({
    name: 'type',
    enum: InstitutionType,
    required: false,
    description: 'Filter institutions by type',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search institutions by name or code (case-insensitive)',
  })
  @ApiOkResponse({
    description: 'List of institutions retrieved successfully.',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing `x-user-role` header.',
  })
  @ApiForbiddenResponse({
    description: 'User role is not SUPER_ADMIN.',
  })
  async getAllInstitutions(
    @Query('status') status?: InstitutionStatus,
    @Query('type') type?: InstitutionType,
    @Query('search') search?: string,
  ) {
    return await this.institutionsService.getAllInstitutions({
      status,
      type,
      search,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get institution by ID',
    description:
      'Retrieves a single institution by its MongoDB ObjectId. Restricted to SUPER_ADMIN.',
  })
  @ApiParam({
    name: 'id',
    description: '24-character hexadecimal MongoDB ObjectId of the institution',
    example: '67272714207198bb6c30f401',
  })
  @ApiOkResponse({
    description: 'Institution found and returned.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid MongoDB ObjectId format.',
  })
  @ApiNotFoundResponse({
    description: 'Institution not found with the provided ID.',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing `x-user-role` header.',
  })
  @ApiForbiddenResponse({
    description: 'User role is not SUPER_ADMIN.',
  })
  async getInstitutionById(@Param('id', ParseObjectIdPipe) id: string) {
    return await this.institutionsService.getInstitutionById(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update institution details',
    description:
      'Updates details of an existing institution. Restricted to SUPER_ADMIN.',
  })
  @ApiParam({
    name: 'id',
    description: '24-character hexadecimal MongoDB ObjectId of the institution',
    example: '67272714207198bb6c30f401',
  })
  @ApiOkResponse({
    description: 'Institution updated successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input or invalid ObjectId format.',
  })
  @ApiNotFoundResponse({
    description: 'Institution not found with the provided ID.',
  })
  @ApiConflictResponse({
    description: 'Institution code already taken by another institution.',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing `x-user-role` header.',
  })
  @ApiForbiddenResponse({
    description: 'User role is not SUPER_ADMIN.',
  })
  async updateInstitution(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateInstitutionDto: UpdateInstitutionDto,
  ) {
    return await this.institutionsService.updateInstitution(
      id,
      updateInstitutionDto,
    );
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update institution operational status',
    description:
      'Updates only the operational status (ACTIVE, INACTIVE, SUSPENDED) of an institution. Restricted to SUPER_ADMIN.',
  })
  @ApiParam({
    name: 'id',
    description: '24-character hexadecimal MongoDB ObjectId of the institution',
    example: '67272714207198bb6c30f401',
  })
  @ApiOkResponse({
    description: 'Institution status updated successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid status value or invalid ObjectId format.',
  })
  @ApiNotFoundResponse({
    description: 'Institution not found with the provided ID.',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing `x-user-role` header.',
  })
  @ApiForbiddenResponse({
    description: 'User role is not SUPER_ADMIN.',
  })
  async updateInstitutionStatus(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateInstitutionStatusDto: UpdateInstitutionStatusDto,
  ) {
    return await this.institutionsService.updateInstitutionStatus(
      id,
      updateInstitutionStatusDto,
    );
  }

  @Post(':institutionId/admins')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create an institution Administrator (Task 18)',
    description:
      'Creates an Admin account for a specified ACTIVE institution. Strictly restricted to SUPER_ADMIN. Role and institution context are derived and enforced by the system.',
  })
  @ApiParam({
    name: 'institutionId',
    description: '24-character hexadecimal MongoDB ObjectId of the institution',
    example: '67272714207198bb6c30f401',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Institution administrator created successfully.',
  })
  @ApiBadRequestResponse({
    description:
      'Invalid input data or institution is not active.',
  })
  @ApiConflictResponse({
    description: 'User with this email already exists.',
  })
  @ApiNotFoundResponse({
    description: 'Institution not found with the provided ID.',
  })
  async createInstitutionAdmin(
    @Param('institutionId', ParseObjectIdPipe) institutionId: string,
    @Body() createInstitutionAdminDto: CreateInstitutionAdminDto,
    @CurrentUser() currentUser?: AuthenticatedUser,
  ) {
    return await this.institutionsService.createInstitutionAdmin(
      institutionId,
      createInstitutionAdminDto,
      currentUser,
    );
  }
}

