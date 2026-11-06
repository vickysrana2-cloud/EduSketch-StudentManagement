import { baseApi } from "./baseApi";
import { User, APIResponse } from "@/types";

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: "SUPER_ADMIN" | "ADMIN" | "TEACHER" | "STUDENT";
  institutionId?: string | null;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}

export interface UpdateUserStatusInput {
  userId: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createUser: builder.mutation<any, CreateUserInput>({
      query: (data) => ({
        url: "/users",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),

    updateUserStatus: builder.mutation<any, UpdateUserStatusInput>({
      query: ({ userId, status }) => ({
        url: `/users/${userId}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["User"],
    }),

    getUserById: builder.query<any, string>({
      query: (id) => `/users/${id}`,
      providesTags: (result, error, id) => [{ type: "User", id }],
    }),
  }),
});

export const {
  useCreateUserMutation,
  useUpdateUserStatusMutation,
  useGetUserByIdQuery,
} = userApi;

