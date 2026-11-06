/**
 * Dashboard & Audit Logs Interfaces & Enums
 */

export enum AuditAction {
  USER_CREATED = "USER_CREATED",
  USER_UPDATED = "USER_UPDATED",
  USER_SUSPENDED = "USER_SUSPENDED",
  USER_ROLE_CHANGED = "USER_ROLE_CHANGED",
  LOGIN_SUCCESS = "LOGIN_SUCCESS",
  LOGIN_FAILED = "LOGIN_FAILED",
  LOGOUT = "LOGOUT",
  INSTITUTION_CREATED = "INSTITUTION_CREATED",
  INSTITUTION_UPDATED = "INSTITUTION_UPDATED",
  INSTITUTION_STATUS_CHANGED = "INSTITUTION_STATUS_CHANGED",
  STUDENT_ADMITTED = "STUDENT_ADMITTED",
  TEACHER_PROFILE_CREATED = "TEACHER_PROFILE_CREATED",
  CLASS_CREATED = "CLASS_CREATED",
  SUBJECT_CREATED = "SUBJECT_CREATED",
  STUDENT_ENROLLED = "STUDENT_ENROLLED",
  STUDENT_PROMOTED = "STUDENT_PROMOTED",
}

export enum AuditModule {
  AUTH = "AUTH",
  USERS = "USERS",
  INSTITUTIONS = "INSTITUTIONS",
  STUDENTS = "STUDENTS",
  TEACHERS = "TEACHERS",
  CLASSES = "CLASSES",
  SUBJECTS = "SUBJECTS",
  ENROLLMENTS = "ENROLLMENTS",
  ROLES = "ROLES",
  PERMISSIONS = "PERMISSIONS",
}

export interface AuditLogResponseDto {
  id: string;
  userId: string | null;
  institutionId: string | null;
  action: AuditAction;
  module: AuditModule;
  description: string;
  targetId: string | null;
  targetType: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface QueryAuditLogsDto {
  page?: number;
  limit?: number;
  userId?: string;
  institutionId?: string;
  action?: AuditAction;
  module?: AuditModule;
  startDate?: string;
  endDate?: string;
}

export interface PlatformDashboardStatsDto {
  totalInstitutions: number;
  activeInstitutions: number;
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  activeSubscriptions: number;
}

export interface InstitutionDashboardStatsDto {
  institutionId: string;
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalSubjects: number;
  attendanceRateToday?: number;
}

