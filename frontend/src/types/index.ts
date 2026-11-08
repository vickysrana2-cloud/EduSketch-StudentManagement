/**
 * Root Types Barrel Export
 * Preserves legacy types for backward compatibility with existing UI components
 * while re-exporting the comprehensive strongly-typed backend API contracts.
 */

export * from "./api.types";
export * from "./auth.types";
export * from "./user.types";
export * from "./institution.types";
export * from "./role.types";
export * from "./permission.types";
export * from "./session.types";
export * from "./student.types";
export * from "./teacher.types";
export * from "./class.types";
export * from "./subject.types";
export * from "./enrollment.types";
export * from "./dashboard.types";

// ==========================================
// Backward-Compatibility Aliases for UI
// ==========================================

import { UserRole } from "./user.types";
import { PaginationMeta } from "./api.types";

export type Role = "SUPER_ADMIN" | "ADMIN" | "TEACHER" | "STUDENT";

export interface User {
  id: number | string;
  name: string;
  email: string;
  role: Role;
  avatar?: string | null;
  profileImage?: string | null;
  institutionId?: string | null;
}

export interface Mark {
  id: number;
  studentId?: number;
  subject: string;
  marks: number;
  createdAt?: string;
}

export interface Student {
  id: number | string;
  name: string;
  email: string;
  age?: number;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string | null;
  admissionNumber?: string;
  admissionNo?: string;
  class?: string;
  section?: string;
  status?: "active" | "inactive" | string;
  marks?: Mark[];
  createdAt?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  parentDetails?: Array<{
    name: string;
    relationship?: string;
    phone: string;
    email?: string | null;
    occupation?: string | null;
  }>;
  profileImage?: string | null;
  userId?: any;
  institutionId?: string;
}

export interface Teacher {
  id: number | string;
  name: string;
  email: string;
  employeeId?: string;
  phone?: string;
  qualification?: string;
  specialization?: string[];
  experienceYears?: number;
  joiningDate?: string;
  assignedClasses?: string[];
  assignedClassIds?: string[];
  assignedSubjectIds?: string[];
  subjects?: string[];
  status?: "active" | "inactive" | string;
  profileImage?: string | null;
  createdAt?: string;
  userId?: any;
}

export interface AcademicSession {
  id: number | string;
  year: string;
  isCurrent: boolean;
}

export interface ClassItem {
  id: number | string;
  name: string;
  sections: string[];
}

export interface Subject {
  id: number | string;
  name: string;
  code: string;
  classId?: number | string;
}

export interface Pagination {
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  limit: number;
}

export interface APIResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  student?: T;
  teacher?: T;
  pagination?: Pagination;
}

export interface APIError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}
