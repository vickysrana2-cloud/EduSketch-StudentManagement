/**
 * Subjects Module Enums & Interfaces
 */

export enum SubjectStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  ARCHIVED = "ARCHIVED",
}

export enum SubjectType {
  THEORY = "THEORY",
  PRACTICAL = "PRACTICAL",
  BOTH = "BOTH",
}

export interface SubjectResponseDto {
  id: string;
  institutionId: string;
  name: string;
  code: string;
  description?: string | null;
  classId: string;
  teacherIds: string[];
  credits: number;
  type: SubjectType;
  status: SubjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubjectDto {
  name: string;
  code: string;
  description?: string | null;
  classId: string;
  teacherIds?: string[];
  credits?: number;
  type?: SubjectType;
}

export interface UpdateSubjectDto {
  name?: string;
  code?: string;
  description?: string | null;
  classId?: string;
  credits?: number;
  type?: SubjectType;
  status?: SubjectStatus;
}

export interface AssignTeachersDto {
  teacherIds: string[];
}

export interface QuerySubjectsDto {
  page?: number;
  limit?: number;
  search?: string;
  classId?: string;
  status?: SubjectStatus;
  institutionId?: string;
}

