/**
 * Centralized API Endpoint Constants for NestJS Backend
 * Covers all modules and route definitions with route parameter builder helpers.
 */

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    REFRESH: "/auth/refresh",
    LOGOUT: "/auth/logout",
    LOGOUT_ALL: "/auth/logout-all",
    ME: "/auth/me",
    SESSIONS: "/auth/sessions",
    REVOKE_SESSION: (sessionId: string) => `/auth/sessions/${sessionId}`,
    VERIFY_EMAIL: "/auth/verify-email",
    RESEND_VERIFICATION: "/auth/resend-verification",
  },

  INSTITUTIONS: {
    BASE: "/institutions",
    BY_ID: (id: string) => `/institutions/${id}`,
    STATUS: (id: string) => `/institutions/${id}/status`,
    ADMINS: (institutionId: string) => `/institutions/${institutionId}/admins`,
  },

  USERS: {
    BASE: "/users",
    BY_ID: (id: string) => `/users/${id}`,
    STATUS: (id: string) => `/users/${id}/status`,
    ROLE: (id: string) => `/users/${id}/role`,
  },

  ROLES: {
    BASE: "/roles",
    BY_ID: (id: string) => `/roles/${id}`,
  },

  PERMISSIONS: {
    BASE: "/permissions",
    BY_ID: (id: string) => `/permissions/${id}`,
  },

  ROLE_PERMISSIONS: {
    BASE: "/role-permissions",
    BY_ID: (id: string) => `/role-permissions/${id}`,
    BY_ROLE: (roleId: string) => `/role-permissions/role/${roleId}`,
    EFFECTIVE: (roleId: string) => `/role-permissions/effective/${roleId}`,
  },

  SESSIONS: {
    BASE: "/sessions",
    MY: "/sessions/my",
    BY_ID: (id: string) => `/sessions/${id}`,
    BY_USER: (userId: string) => `/sessions/user/${userId}`,
  },

  STUDENT_PROFILES: {
    BASE: "/student-profiles",
    ME: "/student-profiles/me",
    BY_ID: (id: string) => `/student-profiles/${id}`,
    BY_USER: (userId: string) => `/student-profiles/user/${userId}`,
    BY_INSTITUTION: (institutionId: string) =>
      `/student-profiles/institution/${institutionId}`,
  },

  TEACHER_PROFILES: {
    BASE: "/teacher-profiles",
    ME: "/teacher-profiles/me",
    BY_ID: (id: string) => `/teacher-profiles/${id}`,
    BY_USER: (userId: string) => `/teacher-profiles/user/${userId}`,
    BY_INSTITUTION: (institutionId: string) =>
      `/teacher-profiles/institution/${institutionId}`,
    ASSIGN: (id: string) => `/teacher-profiles/${id}/assign`,
  },

  CLASSES: {
    BASE: "/classes",
    BY_ID: (id: string) => `/classes/${id}`,
    STATUS: (id: string) => `/classes/${id}/status`,
    BY_INSTITUTION: (institutionId: string) =>
      `/classes/institution/${institutionId}`,
  },

  SUBJECTS: {
    BASE: "/subjects",
    BY_ID: (id: string) => `/subjects/${id}`,
    BY_CLASS: (classId: string) => `/subjects/class/${classId}`,
    TEACHERS: (id: string) => `/subjects/${id}/teachers`,
  },

  ENROLLMENTS: {
    BASE: "/enrollments",
    BY_ID: (id: string) => `/enrollments/${id}`,
    STATUS: (id: string) => `/enrollments/${id}/status`,
    PROMOTE: "/enrollments/promote",
    BY_STUDENT: (studentProfileId: string) =>
      `/enrollments/student/${studentProfileId}`,
    BY_CLASS: (classId: string) => `/enrollments/class/${classId}`,
  },

  AUDIT_LOGS: {
    BASE: "/audit-logs",
    BY_ID: (id: string) => `/audit-logs/${id}`,
    BY_USER: (userId: string) => `/audit-logs/user/${userId}`,
    BY_INSTITUTION: (institutionId: string) =>
      `/audit-logs/institution/${institutionId}`,
  },

  DASHBOARD: {
    STATS: "/dashboard/stats",
    INSTITUTION: (institutionId: string) =>
      `/dashboard/institution/${institutionId}`,
  },
} as const;

