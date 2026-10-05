import { baseApi } from "./baseApi";
import { APIResponse } from "@/types";

export interface ResultRecord {
  id: number;
  studentId: number;
  studentName: string;
  examName: string;
  totalMarksObtained: number;
  totalMaximumMarks: number;
  percentage: number;
  grade: string;
  status: "PASS" | "FAIL";
}

export const resultApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getResults: builder.query<
      APIResponse<ResultRecord[]>,
      { examId?: number | string; classId?: number | string }
    >({
      query: (params) =>
        `/results?examId=${params.examId || ""}&classId=${params.classId || ""}`,
      providesTags: ["Result"],
    }),

    getStudentResult: builder.query<
      APIResponse<ResultRecord>,
      { studentId: number | string; examId: number | string }
    >({
      query: ({ studentId, examId }) => `/results/students/${studentId}?examId=${examId}`,
      providesTags: (result, error, { studentId }) => [
        "Result",
        { type: "Student", id: studentId },
      ],
    }),
  }),
});

export const { useGetResultsQuery, useGetStudentResultQuery } = resultApi;
