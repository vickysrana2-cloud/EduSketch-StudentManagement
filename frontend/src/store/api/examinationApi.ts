import { baseApi } from "./baseApi";
import { APIResponse } from "@/types";

export interface Examination {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  academicSession: string;
  status: "UPCOMING" | "ONGOING" | "COMPLETED";
}

export const examinationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getExaminations: builder.query<APIResponse<Examination[]>, void>({
      query: () => "/examinations",
      providesTags: ["Exam"],
    }),

    getExamById: builder.query<APIResponse<Examination>, number | string>({
      query: (id) => `/examinations/${id}`,
      providesTags: (result, error, id) => [{ type: "Exam", id }],
    }),

    createExamination: builder.mutation<
      APIResponse<Examination>,
      { name: string; startDate: string; endDate: string; academicSession: string }
    >({
      query: (data) => ({
        url: "/examinations",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Exam"],
    }),

    deleteExamination: builder.mutation<APIResponse, number | string>({
      query: (id) => ({
        url: `/examinations/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Exam"],
    }),
  }),
});

export const {
  useGetExaminationsQuery,
  useGetExamByIdQuery,
  useCreateExaminationMutation,
  useDeleteExaminationMutation,
} = examinationApi;
