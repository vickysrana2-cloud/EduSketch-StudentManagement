import { UserSummaryDto } from "./user.types";

/**
 * Teacher Profiles Module Enums & Interfaces
 */

export enum TeacherProfileStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  ON_LEAVE = "ON_LEAVE",
  RESIGNED = "RESIGNED",
  TERMINATED = "TERMINATED",
}

export interface TeacherProfileResponseDto {
  id: string;
  userId: string | UserSummaryDto;
  institutionId: string;
  employeeId: string;
  qualification: string[];
  specialization: string[];
  experienceYears: number;
  assignedClasses: string[];
  assignedSubjects: string[];
  joiningDate: string;
  status: TeacherProfileStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeacherProfileDto {
  userId: string;
  institutionId?: string;
  employeeId: string;
  qualification: string[];
  specialization?: string[];
  experienceYears?: number;
  joiningDate: string;
  status?: TeacherProfileStatus;
}

export interface UpdateTeacherProfileDto {
  qualification?: string[];
  specialization?: string[];
  experienceYears?: number;
  status?: TeacherProfileStatus;
}

export interface AssignResourcesDto {
  assignedClasses?: string[];
  assignedSubjects?: string[];
}

export interface QueryTeacherProfilesDto {
  page?: number;
  limit?: number;
  search?: string;
  status?: TeacherProfileStatus;
  institutionId?: string;
}

