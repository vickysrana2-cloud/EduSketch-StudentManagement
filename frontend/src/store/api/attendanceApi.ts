import { baseApi } from "./baseApi";
import { APIResponse } from "@/types";

export interface AttendanceRecord {
  id: number;
  studentId: number;
  studentName: string;
  classId?: number;
  subjectId?: number;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
}

export interface MarkAttendancePayload {
  classId: number | string;
  sectionId?: number | string;
  subjectId?: number | string;
  date: string;
  records: { studentId: number | string; status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" }[];
}

export const attendanceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAttendance: builder.query<
      APIResponse<AttendanceRecord[]>,
      { classId?: number | string; sectionId?: number | string; date?: string }
    >({
      query: (params) =>
        `/attendance?classId=${params.classId || ""}&sectionId=${params.sectionId || ""}&date=${params.date || ""}`,
      providesTags: ["Attendance"],
    }),

    getStudentAttendanceHistory: builder.query<
      APIResponse<AttendanceRecord[]>,
      number | string
    >({
      query: (studentId) => `/attendance/students/${studentId}`,
      providesTags: (result, error, studentId) => [
        "Attendance",
        { type: "Student", id: studentId },
      ],
    }),

    markAttendance: builder.mutation<APIResponse, MarkAttendancePayload>({
      query: (body) => ({
        url: "/attendance",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Attendance"],
    }),
  }),
});

export const {
  useGetAttendanceQuery,
  useGetStudentAttendanceHistoryQuery,
  useMarkAttendanceMutation,
} = attendanceApi;
