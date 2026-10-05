import { baseApi } from "./baseApi";
import { Teacher, APIResponse } from "@/types";

export const teacherApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTeachers: builder.query<
      APIResponse<Teacher[]>,
      { page?: number; limit?: number; search?: string }
    >({
      query: ({ page = 1, limit = 10, search = "" }) =>
        `/teachers?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
      providesTags: ["Teacher"],
    }),

    getTeacherById: builder.query<APIResponse<Teacher>, number | string>({
      query: (id) => `/teachers/${id}`,
      providesTags: (result, error, id) => [{ type: "Teacher", id }],
    }),

    createTeacher: builder.mutation<
      APIResponse<Teacher>,
      { name: string; email: string; phone?: string; subjects?: string[] }
    >({
      query: (data) => ({
        url: "/teachers",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Teacher"],
    }),

    updateTeacher: builder.mutation<
      APIResponse<Teacher>,
      { id: number | string; name: string; email: string; phone?: string; subjects?: string[] }
    >({
      query: ({ id, ...data }) => ({
        url: `/teachers/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        "Teacher",
        { type: "Teacher", id },
      ],
    }),

    deleteTeacher: builder.mutation<APIResponse, number | string>({
      query: (id) => ({
        url: `/teachers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Teacher"],
    }),

    assignTeacherSubjects: builder.mutation<
      APIResponse,
      { teacherId: number | string; subjectIds: (number | string)[] }
    >({
      query: ({ teacherId, subjectIds }) => ({
        url: `/teachers/${teacherId}/assignments`,
        method: "POST",
        body: { subjectIds },
      }),
      invalidatesTags: (result, error, { teacherId }) => [
        { type: "Teacher", id: teacherId },
      ],
    }),
  }),
});

export const {
  useGetTeachersQuery,
  useGetTeacherByIdQuery,
  useCreateTeacherMutation,
  useUpdateTeacherMutation,
  useDeleteTeacherMutation,
  useAssignTeacherSubjectsMutation,
} = teacherApi;
