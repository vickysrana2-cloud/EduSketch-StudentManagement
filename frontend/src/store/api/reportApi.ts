import { baseApi } from "./baseApi";
import { APIResponse } from "@/types";

export interface ReportSummary {
  totalStudents: number;
  totalTeachers: number;
  attendancePercentage: number;
  passPercentage: number;
}

export const reportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOverviewReport: builder.query<APIResponse<ReportSummary>, void>({
      query: () => "/reports/overview",
      providesTags: ["Report"],
    }),
    getStudentReport: builder.query<APIResponse<any>, number | string>({
      query: (studentId) => `/reports/students/${studentId}`,
      providesTags: ["Report"],
    }),
  }),
});

export const { useGetOverviewReportQuery, useGetStudentReportQuery } = reportApi;
