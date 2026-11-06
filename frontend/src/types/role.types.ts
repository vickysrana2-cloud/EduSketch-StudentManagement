/**
 * Roles Module Types
 */

export interface RoleResponseDto {
  id: string;
  name: string;
  description?: string | null;
  level: number;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleDto {
  name: string;
  description?: string;
  level: number;
  isSystem?: boolean;
}

export interface UpdateRoleDto {
  description?: string;
  level?: number;
}

export interface QueryRolesDto {
  page?: number;
  limit?: number;
  search?: string;
}

