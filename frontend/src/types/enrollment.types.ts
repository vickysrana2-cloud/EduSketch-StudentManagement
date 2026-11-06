/**
 * Enrollment Module Enums & Interfaces
 */

export enum EnrollmentStatus {
  ACTIVE = "ACTIVE",
  TRANSFERRED = "TRANSFERRED",
  WITHDRAWN = "WITHDRAWN",
  PROMOTED = "PROMOTED",
}

export interface EnrollmentResponseDto {
  id: string;
  studentId: string;
  institutionId: string;
  classId: string;
  academicYear: string;
  rollNumber: string;
  enrollmentDate: string;
  status: EnrollmentStatus;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEnrollmentDto {
  studentId: string;
  classId: string;
  academicYear: string;
  rollNumber: string;
  enrollmentDate?: string;
  status?: EnrollmentStatus;
  remarks?: string;
}

export interface PromoteStudentDto {
  studentId: string;
  currentClassId: string;
  targetClassId: string;
  academicYear: string;
  rollNumber: string;
  remarks?: string;
}

export interface UpdateEnrollmentDto {
  rollNumber?: string;
  remarks?: string;
  status?: EnrollmentStatus;
}

export interface UpdateEnrollmentStatusDto {
  status: EnrollmentStatus;
  remarks?: string;
}

export interface QueryEnrollmentsDto {
  page?: number;
  limit?: number;
  studentId?: string;
  classId?: string;
  academicYear?: string;
  status?: EnrollmentStatus;
  institutionId?: string;
}

