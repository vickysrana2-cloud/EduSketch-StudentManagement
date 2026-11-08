import { baseApi } from "./baseApi";

export interface AuditLogUserSummary {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuditLogInstitutionSummary {
  id: string;
  name: string;
  code: string;
}

export interface AuditLogItem {
  id: string;
  user: AuditLogUserSummary | null;
  institution: AuditLogInstitutionSummary | null;
  action: string;
  module: string;
  description: string;
  targetId: string | null;
  targetType: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface PaginatedAuditLogsResponse {
  items: AuditLogItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QueryAuditLogsParams {
  page?: number;
  limit?: number;
  module?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  userId?: string;
  institutionId?: string;
  targetId?: string;
}

export const auditLogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAuditLogs: builder.query<
      PaginatedAuditLogsResponse,
      QueryAuditLogsParams | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append("page", params.page.toString());
        if (params?.limit) queryParams.append("limit", params.limit.toString());
        if (params?.module && params.module !== "ALL")
          queryParams.append("module", params.module);
        if (params?.action && params.action !== "ALL")
          queryParams.append("action", params.action);
        if (params?.startDate) queryParams.append("startDate", params.startDate);
        if (params?.endDate) queryParams.append("endDate", params.endDate);
        if (params?.search && params.search.trim())
          queryParams.append("search", params.search.trim());
        if (params?.userId) queryParams.append("userId", params.userId);
        if (params?.institutionId)
          queryParams.append("institutionId", params.institutionId);
        if (params?.targetId) queryParams.append("targetId", params.targetId);

        const qs = queryParams.toString();
        return `/audit-logs${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["AuditLog"],
    }),

    getAuditLogById: builder.query<AuditLogItem, string>({
      query: (id) => `/audit-logs/${id}`,
      providesTags: (_result, _error, id) => [{ type: "AuditLog", id }],
    }),
  }),
});

export const { useGetAuditLogsQuery, useGetAuditLogByIdQuery } = auditLogApi;

