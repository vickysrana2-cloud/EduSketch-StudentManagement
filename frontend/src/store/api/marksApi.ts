import { baseApi } from "./baseApi";
import { Mark, APIResponse } from "@/types";

export const marksApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    addMark: builder.mutation<
      APIResponse<Mark>,
      { studentId: number | string; subject: string; marks: number }
    >({
      query: ({ studentId, ...data }) => ({
        url: `/students/${studentId}/marks`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { studentId }) => [
        { type: "Student", id: studentId },
        "Mark",
      ],
    }),

    updateMark: builder.mutation<
      APIResponse<Mark>,
      { markId: number | string; studentId?: number | string; subject: string; marks: number }
    >({
      query: ({ markId, subject, marks }) => ({
        url: `/students/marks/${markId}`,
        method: "PUT",
        body: { subject, marks },
      }),
      invalidatesTags: (result, error, { studentId }) => [
        studentId ? { type: "Student", id: studentId } : "Student",
        "Mark",
      ],
    }),

    deleteMark: builder.mutation<
      APIResponse,
      { markId: number | string; studentId?: number | string }
    >({
      query: ({ markId }) => ({
        url: `/students/marks/${markId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { studentId }) => [
        studentId ? { type: "Student", id: studentId } : "Student",
        "Mark",
      ],
    }),
  }),
});

export const {
  useAddMarkMutation,
  useUpdateMarkMutation,
  useDeleteMarkMutation,
} = marksApi;
