import { baseApi } from "./baseApi";
import { AcademicSession, ClassItem, Subject, APIResponse } from "@/types";

export const academicApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAcademicSessions: builder.query<APIResponse<AcademicSession[]>, void>({
      query: () => "/academics/sessions",
      providesTags: ["Class"],
    }),

    getClasses: builder.query<APIResponse<ClassItem[]>, void>({
      query: () => "/academics/classes",
      providesTags: ["Class"],
    }),

    getSubjects: builder.query<
      APIResponse<Subject[]>,
      { classId?: number | string }
    >({
      query: (params) =>
        `/academics/subjects${params?.classId ? `?classId=${params.classId}` : ""}`,
      providesTags: ["Subject"],
    }),

    createClass: builder.mutation<
      APIResponse<ClassItem>,
      { name: string; sections: string[] }
    >({
      query: (data) => ({
        url: "/academics/classes",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Class"],
    }),

    createSubject: builder.mutation<
      APIResponse<Subject>,
      { name: string; code: string; classId?: number }
    >({
      query: (data) => ({
        url: "/academics/subjects",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Subject"],
    }),
  }),
});

export const {
  useGetAcademicSessionsQuery,
  useGetClassesQuery,
  useGetSubjectsQuery,
  useCreateClassMutation,
  useCreateSubjectMutation,
} = academicApi;
