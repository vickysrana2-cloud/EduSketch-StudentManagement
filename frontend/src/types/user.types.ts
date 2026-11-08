/**
 * User Module Interfaces & Enums
 */

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  TEACHER = "TEACHER",
  STUDENT = "STUDENT",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}

export interface UserSummaryDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  isEmailVerified: boolean;
  institutionId: string | null;
  avatar?: string | null;
  profileImage?: string | null;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserResponseDto extends UserSummaryDto {
  institution?: {
    id: string;
    name: string;
    code: string;
    type: string;
    status: string;
  } | null;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  institutionId?: string | null;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  avatar?: string | null;
  profileImage?: string | null;
}

export interface UpdateUserStatusDto {
  status: UserStatus;
  reason?: string;
}

export interface UpdateUserRoleDto {
  role: UserRole;
}

export interface QueryUsersDto {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  institutionId?: string;
}

