import { baseApi } from "./baseApi";

export interface RoleItem {
  id: string;
  name: "SUPER_ADMIN" | "ADMIN" | "TEACHER" | "STUDENT";
  displayName: string;
  description: string;
  level: number;
  isSystemRole: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateRoleInput {
  id: string;
  displayName?: string;
  description?: string;
  isActive?: boolean;
}

export interface PermissionItem {
  id: string;
  name: string;
  module: string;
  action: string;
  description: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RolePermissionItem {
  id: string;
  roleId: string;
  permissionId: string;
  institutionId: string | null;
  isAllowed: boolean;
  role?: {
    id: string;
    name: string;
    displayName: string;
  };
  permission?: {
    id: string;
    name: string;
    module: string;
    action: string;
  };
  createdAt?: string;
}

export interface AssignRolePermissionInput {
  roleId: string;
  permissionId: string;
  institutionId?: string | null;
  isAllowed?: boolean;
}

export interface RevokeRolePermissionInput {
  roleId: string;
  permissionId: string;
  institutionId?: string | null;
}

export const rolePermissionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRoles: builder.query<RoleItem[], void>({
      query: () => "/roles",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Role" as const, id })),
              { type: "Role", id: "LIST" },
            ]
          : [{ type: "Role", id: "LIST" }],
    }),

    getRoleById: builder.query<RoleItem, string>({
      query: (id) => `/roles/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Role", id }],
    }),

    updateRole: builder.mutation<RoleItem, UpdateRoleInput>({
      query: ({ id, ...body }) => ({
        url: `/roles/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Role", id },
        { type: "Role", id: "LIST" },
      ],
    }),

    getPermissions: builder.query<
      PermissionItem[],
      { module?: string; action?: string } | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.module) searchParams.append("module", params.module);
        if (params?.action) searchParams.append("action", params.action);
        const qs = searchParams.toString();
        return `/permissions${qs ? `?${qs}` : ""}`;
      },
      providesTags: [{ type: "Permission", id: "LIST" }],
    }),

    getPermissionById: builder.query<PermissionItem, string>({
      query: (id) => `/permissions/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Permission", id }],
    }),

    getPermissionsByRole: builder.query<
      RolePermissionItem[],
      { roleId: string; institutionId?: string | null }
    >({
      query: ({ roleId, institutionId }) => {
        const qs = institutionId ? `?institutionId=${institutionId}` : "";
        return `/role-permissions/role/${roleId}${qs}`;
      },
      providesTags: (_result, _error, { roleId }) => [
        { type: "RolePermission", id: roleId },
      ],
    }),

    assignRolePermission: builder.mutation<
      RolePermissionItem,
      AssignRolePermissionInput
    >({
      query: (body) => ({
        url: "/role-permissions",
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { roleId }) => [
        { type: "RolePermission", id: roleId },
        { type: "RolePermission", id: "LIST" },
      ],
    }),

    revokeRolePermission: builder.mutation<
      { message: string },
      RevokeRolePermissionInput
    >({
      query: ({ roleId, permissionId, institutionId }) => {
        const params = new URLSearchParams({
          roleId,
          permissionId,
        });
        if (institutionId) {
          params.append("institutionId", institutionId);
        }
        return {
          url: `/role-permissions?${params.toString()}`,
          method: "DELETE",
          body: { roleId, permissionId, institutionId: institutionId || null },
        };
      },
      invalidatesTags: (_result, _error, { roleId }) => [
        { type: "RolePermission", id: roleId },
        { type: "RolePermission", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetRolesQuery,
  useGetRoleByIdQuery,
  useUpdateRoleMutation,
  useGetPermissionsQuery,
  useGetPermissionByIdQuery,
  useGetPermissionsByRoleQuery,
  useAssignRolePermissionMutation,
  useRevokeRolePermissionMutation,
} = rolePermissionApi;

