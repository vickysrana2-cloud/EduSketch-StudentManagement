/**
 * Permissions & Role-Permissions Module Types
 */

export interface PermissionResponseDto {
  id: string;
  name: string;
  description?: string | null;
  module: string;
  action: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePermissionDto {
  name: string;
  description?: string;
  module: string;
  action: string;
}

export interface UpdatePermissionDto {
  description?: string;
  module?: string;
  action?: string;
}

export interface RolePermissionResponseDto {
  id: string;
  roleId: string;
  permissionId: string | PermissionResponseDto;
  institutionId?: string | null;
  createdAt: string;
}

export interface CreateRolePermissionDto {
  roleId: string;
  permissionId: string;
  institutionId?: string | null;
}

export interface EffectivePermissionsDto {
  roleId: string;
  roleName: string;
  permissions: string[];
}

