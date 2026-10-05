import { baseApi } from "./baseApi";
import { User, APIResponse } from "@/types";

export interface LoginRequest {
  email: string;
  password?: string;
  role?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<APIResponse<LoginResponse>, LoginRequest>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),
    getCurrentUser: builder.query<APIResponse<User>, void>({
      query: () => "/auth/me",
    }),
    logout: builder.mutation<APIResponse, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useGetCurrentUserQuery,
  useLogoutMutation,
} = authApi;
