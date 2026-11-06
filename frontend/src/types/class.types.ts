/**
 * Classes Module Enums & Interfaces
 */

export enum ClassStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  ARCHIVED = "ARCHIVED",
}

export interface ClassResponseDto {
  id: string;
  institutionId: string;
  name: string;
  grade: number;
  section: string;
  academicYear: string;
  classTeacherId?: string | null;
  capacity: number;
  roomNumber?: string | null;
  status: ClassStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClassDto {
  name: string;
  grade: number;
  section: string;
  academicYear: string;
  classTeacherId?: string | null;
  capacity?: number;
  roomNumber?: string | null;
}

export interface UpdateClassDto {
  name?: string;
  grade?: number;
  section?: string;
  academicYear?: string;
  classTeacherId?: string | null;
  capacity?: number;
  roomNumber?: string | null;
}

export interface UpdateClassStatusDto {
  status: ClassStatus;
}

export interface QueryClassesDto {
  page?: number;
  limit?: number;
  search?: string;
  academicYear?: string;
  grade?: number;
  status?: ClassStatus;
  institutionId?: string;
}

