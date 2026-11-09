import { baseApi } from "./baseApi";
import { User, Role } from "@/types";

export interface LoginRequest {
  email: string;
  password: string;
  role?: Role;
}

export interface BackendUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: string;
  isEmailVerified: boolean;
  institutionId?: string | null;
  institution?: {
    id: string;
    name: string;
    code: string;
    type: string;
    status: string;
  } | null;
  avatar?: string;
  profileImage?: string | null;
  lastLoginAt?: string | null;
  createdAt?: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: string;
  user: BackendUser;
}

export interface RefreshResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: string;
}

export interface SessionItem {
  id: string;
  tokenFamily: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  expiresAt: string;
}

export interface ActiveSessionsResponse {
  message: string;
  count: number;
  sessions: SessionItem[];
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["User"],
    }),

    getCurrentUser: builder.query<BackendUser, void>({
      query: () => "/auth/me",
      providesTags: ["User"],
    }),

    refreshToken: builder.mutation<RefreshResponse, void>({
      query: () => ({
        url: "/auth/refresh",
        method: "POST",
      }),
    }),

    logout: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["User"],
    }),

    getActiveSessions: builder.query<ActiveSessionsResponse, void>({
      query: () => "/auth/sessions",
      providesTags: ["Session"],
    }),

    revokeSession: builder.mutation<{ message: string }, string>({
      query: (sessionId) => ({
        url: `/auth/sessions/${sessionId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Session"],
    }),

    logoutAll: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: "/auth/logout-all",
        method: "POST",
      }),
      invalidatesTags: ["Session", "User"],
    }),
  }),
});

export const {
  useLoginMutation,
  useGetCurrentUserQuery,
  useRefreshTokenMutation,
  useLogoutMutation,
  useGetActiveSessionsQuery,
  useRevokeSessionMutation,
  useLogoutAllMutation,
} = authApi;
