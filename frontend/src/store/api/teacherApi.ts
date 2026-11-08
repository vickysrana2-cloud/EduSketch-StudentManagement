import { baseApi } from "./baseApi";
import { Teacher, APIResponse } from "@/types";

/**
 * Normalizes backend TeacherProfile document (with populated userId)
 * into the frontend Teacher model.
 */
function mapBackendTeacherProfileToTeacher(item: any): Teacher {
  if (!item) return {} as Teacher;

  const user = typeof item.userId === "object" && item.userId ? item.userId : null;
  const userName = user?.name || item.name || `Faculty ${item.employeeId || ""}`;
  const userEmail = user?.email || item.email || "";

  const assignedClasses = Array.isArray(item.assignedClasses)
    ? item.assignedClasses
    : Array.isArray(item.assignedClassIds)
    ? item.assignedClassIds.map((c: any) =>
        typeof c === "object" && c ? c.name || `Class ${String(c._id || c.id).slice(-4)}` : `Class ${String(c).slice(-4)}`
      )
    : [];

  const assignedClassIds = Array.isArray(item.assignedClassIds)
    ? item.assignedClassIds.map((c: any) => (typeof c === "object" && c ? String(c._id || c.id) : String(c)))
    : [];

  const assignedSubjectIds = Array.isArray(item.assignedSubjectIds)
    ? item.assignedSubjectIds.map((s: any) => (typeof s === "object" && s ? String(s._id || s.id) : String(s)))
    : [];

  const specialization = Array.isArray(item.specialization)
    ? item.specialization
    : typeof item.specialization === "string"
    ? [item.specialization]
    : [];

  const rawStatus = (item.status || "ACTIVE").toString().toUpperCase();
  const normalizedStatus = rawStatus === "ACTIVE" ? "active" : "inactive";

  return {
    id: item._id || item.id,
    name: userName,
    email: userEmail,
    employeeId: item.employeeId,
    phone: item.phone || user?.phone || "+1 (555) 234-5678",
    qualification: item.qualification || "M.Ed / B.Sc Faculty",
    specialization,
    experienceYears: typeof item.experienceYears === "number" ? item.experienceYears : 5,
    joiningDate: item.joiningDate,
    assignedClasses,
    assignedClassIds,
    assignedSubjectIds,
    subjects: specialization.length > 0 ? specialization : ["Mathematics", "Sciences"],
    status: normalizedStatus,
    profileImage: user?.profileImage || item.profileImage || null,
    createdAt: item.createdAt,
    userId: item.userId,
  };
}

export const teacherApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Lists teachers from /teacher-profiles with pagination, search, and specialization filters.
     */
    getTeachers: builder.query<
      APIResponse<Teacher[]>,
      { page?: number; limit?: number; search?: string; status?: string; specialization?: string }
    >({
      query: ({ page = 1, limit = 10, search = "", status, specialization }) => {
        const params = new URLSearchParams();
        if (page) params.append("page", String(page));
        if (limit) params.append("limit", String(limit));
        if (search && search.trim()) params.append("search", search.trim());
        if (status && status !== "ALL") params.append("status", status.toUpperCase());
        if (specialization && specialization !== "ALL") params.append("specialization", specialization);
        return `/teacher-profiles?${params.toString()}`;
      },
      transformResponse: (response: any): APIResponse<Teacher[]> => {
        const rawItems = Array.isArray(response?.items)
          ? response.items
          : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
          ? response
          : [];

        const totalRecords =
          typeof response?.total === "number"
            ? response.total
            : response?.pagination?.totalRecords || rawItems.length;

        const currentPage =
          typeof response?.page === "number"
            ? response.page
            : response?.pagination?.currentPage || 1;

        const limit =
          typeof response?.limit === "number"
            ? response.limit
            : response?.pagination?.limit || 10;

        const totalPages =
          typeof response?.totalPages === "number"
            ? response.totalPages
            : Math.ceil(totalRecords / limit) || 1;

        const teachers = rawItems.map(mapBackendTeacherProfileToTeacher);

        return {
          success: true,
          data: teachers,
          pagination: {
            totalRecords,
            currentPage,
            totalPages,
            limit,
          },
        };
      },
      providesTags: ["Teacher"],
    }),

    /**
     * Retrieves specific teacher profile by ID via GET /teacher-profiles/:id.
     */
    getTeacherById: builder.query<APIResponse<Teacher>, number | string>({
      query: (id) => `/teacher-profiles/${id}`,
      transformResponse: (response: any): APIResponse<Teacher> => {
        const rawData = response?.data || response?.teacher || response;
        const mapped = mapBackendTeacherProfileToTeacher(rawData);
        return {
          success: true,
          data: mapped,
          teacher: mapped,
        };
      },
      providesTags: (result, error, id) => [{ type: "Teacher", id }],
    }),

    /**
     * Retrieves current logged-in teacher profile via GET /teacher-profiles/me.
     */
    getMyTeacherProfile: builder.query<APIResponse<Teacher>, void>({
      query: () => "/teacher-profiles/me",
      transformResponse: (response: any): APIResponse<Teacher> => {
        const rawData = response?.data || response?.teacher || response;
        const mapped = mapBackendTeacherProfileToTeacher(rawData);
        return {
          success: true,
          data: mapped,
          teacher: mapped,
        };
      },
      providesTags: ["Teacher"],
    }),

    /**
     * Updates teacher profile via PATCH /teacher-profiles/:id.
     */
    updateTeacherProfile: builder.mutation<
      APIResponse<Teacher>,
      { id: number | string; [key: string]: any }
    >({
      query: ({ id, ...dto }) => ({
        url: `/teacher-profiles/${id}`,
        method: "PATCH",
        body: dto,
      }),
      invalidatesTags: (result, error, { id }) => [
        "Teacher",
        { type: "Teacher", id },
      ],
    }),

    /**
     * Backward-compatible alias for updating teacher
     */
    updateTeacher: builder.mutation<
      APIResponse<Teacher>,
      { id: number | string; name?: string; email?: string; phone?: string; subjects?: string[]; [key: string]: any }
    >({
      query: ({ id, ...data }) => ({
        url: `/teacher-profiles/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        "Teacher",
        { type: "Teacher", id },
      ],
    }),

    /**
     * Assigns classes and subjects via PATCH /teacher-profiles/:id/assign.
     */
    assignTeacherResources: builder.mutation<
      APIResponse<Teacher>,
      { id: number | string; assignedClassIds?: string[]; assignedSubjectIds?: string[] }
    >({
      query: ({ id, ...dto }) => ({
        url: `/teacher-profiles/${id}/assign`,
        method: "PATCH",
        body: dto,
      }),
      invalidatesTags: (result, error, { id }) => [
        "Teacher",
        { type: "Teacher", id },
      ],
    }),

    /**
     * Backward-compatible alias for assignTeacherSubjects
     */
    assignTeacherSubjects: builder.mutation<
      APIResponse,
      { teacherId: number | string; subjectIds: (number | string)[] }
    >({
      query: ({ teacherId, subjectIds }) => ({
        url: `/teacher-profiles/${teacherId}/assign`,
        method: "PATCH",
        body: { assignedSubjectIds: subjectIds.map(String) },
      }),
      invalidatesTags: (result, error, { teacherId }) => [
        { type: "Teacher", id: teacherId },
      ],
    }),

    /**
     * Atomic Teacher User & Profile Creation via POST /users/teachers.
     */
    createTeacherUser: builder.mutation<
      any,
      {
        name: string;
        email: string;
        password?: string;
        employeeId: string;
        qualification: string[];
        specialization: string[];
        experienceYears: number;
        joiningDate?: string;
        institutionId?: string;
      }
    >({
      query: (data) => ({
        url: "/users/teachers",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Teacher", "User"],
    }),

    /**
     * Creates new teacher profile via POST /teacher-profiles.
     */
    createTeacher: builder.mutation<
      APIResponse<Teacher>,
      Record<string, any>
    >({
      query: (data) => ({
        url: "/teacher-profiles",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Teacher"],
    }),

    createTeacherProfile: builder.mutation<
      APIResponse<Teacher>,
      Record<string, any>
    >({
      query: (data) => ({
        url: "/teacher-profiles",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Teacher"],
    }),

    /**
     * Deletes / archives teacher profile via DELETE /teacher-profiles/:id.
     */
    deleteTeacher: builder.mutation<APIResponse, number | string>({
      query: (id) => ({
        url: `/teacher-profiles/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Teacher"],
    }),
  }),
});

export const {
  useGetTeachersQuery,
  useGetTeacherByIdQuery,
  useGetMyTeacherProfileQuery,
  useUpdateTeacherProfileMutation,
  useUpdateTeacherMutation,
  useAssignTeacherResourcesMutation,
  useAssignTeacherSubjectsMutation,
  useCreateTeacherUserMutation,
  useCreateTeacherMutation,
  useCreateTeacherProfileMutation,
  useDeleteTeacherMutation,
} = teacherApi;
