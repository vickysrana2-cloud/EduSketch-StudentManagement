export type Role = "SUPER_ADMIN" | "ADMIN" | "TEACHER" | "STUDENT";

export interface User {
  id: number | string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export interface Mark {
  id: number;
  studentId?: number;
  subject: string;
  marks: number;
  createdAt?: string;
}

export interface Student {
  id: number;
  name: string;
  email: string;
  age: number;
  class?: string;
  section?: string;
  status?: "active" | "inactive";
  marks?: Mark[];
  createdAt?: string;
}

export interface Teacher {
  id: number;
  name: string;
  email: string;
  phone?: string;
  subjects?: string[];
  assignedClasses?: string[];
  status?: "active" | "inactive";
}

export interface AcademicSession {
  id: number;
  year: string;
  isCurrent: boolean;
}

export interface ClassItem {
  id: number;
  name: string;
  sections: string[];
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  classId?: number;
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
  pagination?: Pagination;
}

export interface APIError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}
