import { baseApi } from "./baseApi";

export interface UserItem {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "TEACHER" | "STUDENT";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  isEmailVerified?: boolean;
  institutionId?:
    | string
    | {
        _id?: string;
        id?: string;
        name?: string;
        code?: string;
        type?: string;
        status?: string;
      }
    | null;
  profileImage?: string | null;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: "SUPER_ADMIN" | "ADMIN" | "TEACHER" | "STUDENT";
  institutionId?: string | null;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  profileImage?: string;
}

export interface UpdateUserProfileInput {
  id: string;
  name?: string;
  email?: string;
  profileImage?: string;
}

export interface UpdateUserStatusInput {
  userId: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}

export interface UpdateUserRoleInput {
  userId: string;
  role: "SUPER_ADMIN" | "ADMIN" | "TEACHER" | "STUDENT";
}

export interface GetUsersFilter {
  role?: string;
  status?: string;
  institutionId?: string;
  search?: string;
}

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<UserItem[], GetUsersFilter | void>({
      query: (filter) => {
        const params = new URLSearchParams();
        if (filter?.role && filter.role !== "ALL") params.append("role", filter.role);
        if (filter?.status && filter.status !== "ALL") params.append("status", filter.status);
        if (filter?.institutionId) params.append("institutionId", filter.institutionId);
        if (filter?.search) params.append("search", filter.search);
        const qs = params.toString();
        return `/users${qs ? `?${qs}` : ""}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id, _id }) => ({
                type: "User" as const,
                id: (id || _id) as string,
              })),
              { type: "User", id: "LIST" },
            ]
          : [{ type: "User", id: "LIST" }],
    }),

    getUserById: builder.query<UserItem, string>({
      query: (id) => `/users/${id}`,
      providesTags: (_result, _error, id) => [{ type: "User", id }],
    }),

    getUsersByInstitution: builder.query<
      UserItem[],
      { institutionId: string; role?: string; status?: string; search?: string }
    >({
      query: ({ institutionId, role, status, search }) => {
        const params = new URLSearchParams();
        if (role && role !== "ALL") params.append("role", role);
        if (status && status !== "ALL") params.append("status", status);
        if (search) params.append("search", search);
        const qs = params.toString();
        return `/users/institution/${institutionId}${qs ? `?${qs}` : ""}`;
      },
      providesTags: [{ type: "User", id: "INSTITUTION_LIST" }],
    }),

    createUser: builder.mutation<UserItem, CreateUserInput>({
      query: (data) => ({
        url: "/users",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),

    updateUser: builder.mutation<UserItem, UpdateUserProfileInput>({
      query: ({ id, ...body }) => ({
        url: `/users/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
      ],
    }),

    updateUserStatus: builder.mutation<UserItem, UpdateUserStatusInput>({
      query: ({ userId, status }) => ({
        url: `/users/${userId}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (_result, _error, { userId }) => [
        { type: "User", id: userId },
        { type: "User", id: "LIST" },
      ],
    }),

    updateUserRole: builder.mutation<UserItem, UpdateUserRoleInput>({
      query: ({ userId, role }) => ({
        url: `/users/${userId}/role`,
        method: "PATCH",
        body: { role },
      }),
      invalidatesTags: (_result, _error, { userId }) => [
        { type: "User", id: userId },
        { type: "User", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useGetUsersByInstitutionQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useUpdateUserStatusMutation,
  useUpdateUserRoleMutation,
} = userApi;
