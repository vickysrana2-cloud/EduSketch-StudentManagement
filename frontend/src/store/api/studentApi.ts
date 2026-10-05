import { baseApi } from "./baseApi";
import { Student, APIResponse } from "@/types";

export const studentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStudents: builder.query<
      APIResponse<Student[]>,
      { page?: number; limit?: number; search?: string }
    >({
      query: ({ page = 1, limit = 5, search = "" }) =>
        `/students?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
      providesTags: ["Student"],
    }),

    getStudentById: builder.query<APIResponse<Student>, number | string>({
      query: (id) => `/students/${id}`,
      providesTags: (result, error, id) => [{ type: "Student", id }],
    }),

    createStudent: builder.mutation<
      APIResponse<Student>,
      { name: string; email: string; age: number }
    >({
      query: (data) => ({
        url: "/students",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Student"],
    }),

    updateStudent: builder.mutation<
      APIResponse<Student>,
      { id: number | string; name: string; email: string; age: number }
    >({
      query: ({ id, ...data }) => ({
        url: `/students/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        "Student",
        { type: "Student", id },
      ],
    }),

    deleteStudent: builder.mutation<APIResponse, number | string>({
      query: (id) => ({
        url: `/students/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Student"],
    }),
  }),
});

export const {
  useGetStudentsQuery,
  useGetStudentByIdQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
} = studentApi;
