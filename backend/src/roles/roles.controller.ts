import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleResponseDto } from './dto/role-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/enums/user.enums';

@ApiTags('Roles')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'List All Roles',
    description:
      'Retrieves all supported system roles in hierarchical order (SUPER_ADMIN, ADMIN, TEACHER, STUDENT).',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of roles retrieved successfully.',
    type: [RoleResponseDto],
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or expired JWT Bearer token.',
  })
  async findAll(): Promise<RoleResponseDto[]> {
    const roles = await this.rolesService.findAll();
    return roles.map((r) => ({
      id: r._id.toString(),
      name: r.name,
      displayName: r.displayName,
      description: r.description,
      level: r.level,
      isSystemRole: r.isSystemRole,
      isActive: r.isActive,
      createdAt: r.createdAt!,
      updatedAt: r.updatedAt!,
    }));
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get Role Details by ID',
    description: 'Retrieves metadata for a specific system role by its MongoDB ObjectId.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the role',
    example: '67272714207198bb6c30f401',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Role retrieved successfully.',
    type: RoleResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Role with specified ID does not exist.',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or expired JWT Bearer token.',
  })
  async findOne(@Param('id') id: string): Promise<RoleResponseDto> {
    const r = await this.rolesService.findById(id);
    return {
      id: r._id.toString(),
      name: r.name,
      displayName: r.displayName,
      description: r.description,
      level: r.level,
      isSystemRole: r.isSystemRole,
      isActive: r.isActive,
      createdAt: r.createdAt!,
      updatedAt: r.updatedAt!,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update Role Metadata (SUPER_ADMIN Only)',
    description:
      'Updates non-critical metadata (displayName, description, isActive) of a system role. Strictly restricted to SUPER_ADMIN. Core attributes (name, level, isSystemRole) are immutable.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the role to update',
    example: '67272714207198bb6c30f401',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Role metadata updated successfully.',
    type: RoleResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Unauthorized role assignment: Only SUPER_ADMIN can modify role metadata.',
  })
  @ApiNotFoundResponse({
    description: 'Role not found.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid ObjectId format or invalid parameters.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @CurrentUser() currentUser: any,
  ): Promise<RoleResponseDto> {
    // Requirement 8: Only SUPER_ADMIN can manage system role metadata
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Unauthorized role management: Only SUPER_ADMIN accounts are authorized to modify system role metadata.',
      );
    }

    const r = await this.rolesService.update(id, updateRoleDto);
    return {
      id: r._id.toString(),
      name: r.name,
      displayName: r.displayName,
      description: r.description,
      level: r.level,
      isSystemRole: r.isSystemRole,
      isActive: r.isActive,
      createdAt: r.createdAt!,
      updatedAt: r.updatedAt!,
    };
  }
}

