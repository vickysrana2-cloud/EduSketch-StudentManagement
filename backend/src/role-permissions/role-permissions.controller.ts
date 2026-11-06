import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RolePermissionsService } from './role-permissions.service';
import { AssignRolePermissionDto } from './dto/assign-role-permission.dto';
import { RolePermissionResponseDto } from './dto/role-permission-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Role Permissions')
@Controller('role-permissions')
export class RolePermissionsController {
  constructor(
    private readonly rolePermissionsService: RolePermissionsService,
  ) {}

  @Get('role/:roleId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get Effective Permissions for a Role (Requirement 8)',
    description:
      'Retrieves the effective, allowed permissions for a role, resolving system defaults with optional institution-level overrides.',
  })
  @ApiParam({
    name: 'roleId',
    description: 'MongoDB ObjectId of the Role',
    example: '67272714207198bb6c30f401',
  })
  @ApiQuery({
    name: 'institutionId',
    required: false,
    description: 'Optional Institution ObjectId to resolve tenant-specific overrides',
    example: '67272714207198bb6c30f400',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of effective role-permission mappings returned.',
    type: [RolePermissionResponseDto],
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or expired JWT Bearer token.',
  })
  async getPermissionsByRole(
    @Param('roleId') roleId: string,
    @Query('institutionId') institutionId?: string,
  ): Promise<RolePermissionResponseDto[]> {
    const mappings = await this.rolePermissionsService.getPermissionsByRole(
      roleId,
      institutionId,
    );

    return mappings.map((m) => ({
      id: m._id.toString(),
      roleId: m.roleId ? (m.roleId as any)._id?.toString() || m.roleId.toString() : '',
      permissionId: m.permissionId ? (m.permissionId as any)._id?.toString() || m.permissionId.toString() : '',
      institutionId: m.institutionId ? m.institutionId.toString() : null,
      isAllowed: m.isAllowed,
      role: m.roleId && typeof m.roleId === 'object' && (m.roleId as any).name ? {
        id: (m.roleId as any)._id.toString(),
        name: (m.roleId as any).name,
        displayName: (m.roleId as any).displayName,
      } : undefined,
      permission: m.permissionId && typeof m.permissionId === 'object' && (m.permissionId as any).name ? {
        id: (m.permissionId as any)._id.toString(),
        name: (m.permissionId as any).name,
        module: (m.permissionId as any).module,
        action: (m.permissionId as any).action,
      } : undefined,
      createdAt: m.createdAt!,
    }));
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Assign or Override Role Permission (Requirements 6, 9, 10, 11)',
    description:
      'Assigns a permission to a role. Platform-level assignments (institutionId: null) are strictly reserved for SUPER_ADMIN. Institution Admins may only configure overrides for their own institution.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Role-permission mapping assigned successfully.',
    type: RolePermissionResponseDto,
  })
  @ApiForbiddenResponse({
    description:
      'Unauthorized: Non-Super Admin attempting platform changes or Admin attempting cross-institution modifications.',
  })
  @ApiNotFoundResponse({
    description: 'Role, Permission, or Institution not found.',
  })
  async assignPermission(
    @Body() dto: AssignRolePermissionDto,
    @CurrentUser() currentUser: any,
  ): Promise<RolePermissionResponseDto> {
    const m = await this.rolePermissionsService.assignPermission(
      dto,
      currentUser,
    );

    return {
      id: m._id.toString(),
      roleId: m.roleId.toString(),
      permissionId: m.permissionId.toString(),
      institutionId: m.institutionId ? m.institutionId.toString() : null,
      isAllowed: m.isAllowed,
      createdAt: m.createdAt!,
    };
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Revoke Role Permission Mapping (Requirement 7 & 11)',
    description:
      'Revokes an existing role-permission assignment or institution override.',
  })
  @ApiQuery({ name: 'roleId', required: true, example: '67272714207198bb6c30f401' })
  @ApiQuery({ name: 'permissionId', required: true, example: '67272714207198bb6c30f402' })
  @ApiQuery({ name: 'institutionId', required: false, example: '67272714207198bb6c30f400' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Role permission mapping revoked successfully.',
  })
  @ApiForbiddenResponse({
    description: 'Unauthorized role permission modification.',
  })
  @ApiNotFoundResponse({
    description: 'Mapping not found.',
  })
  async revokePermission(
    @Query('roleId') roleId: string,
    @Query('permissionId') permissionId: string,
    @Query('institutionId') institutionId: string | undefined,
    @CurrentUser() currentUser: any,
  ) {
    return await this.rolePermissionsService.revokePermission(
      roleId,
      permissionId,
      institutionId || null,
      currentUser,
    );
  }
}

