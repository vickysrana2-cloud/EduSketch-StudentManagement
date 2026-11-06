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
  lastLoginAt?: string | null;
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
  }),
});

export const {
  useLoginMutation,
  useGetCurrentUserQuery,
  useRefreshTokenMutation,
  useLogoutMutation,
} = authApi;
