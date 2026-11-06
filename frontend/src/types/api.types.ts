/**
 * Generic API Interfaces & Pagination Types
 */

export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  data?: T;
  statusCode?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QueryPaginationDto {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc" | 1 | -1;
}

export interface BackendErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
  timestamp?: string;
  path?: string;
}

