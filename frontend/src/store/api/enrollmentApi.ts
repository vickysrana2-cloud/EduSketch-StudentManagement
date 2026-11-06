import { baseApi } from "./baseApi";

export interface EnrollmentItem {
  id: string;
  _id?: string;
  studentId: any;
  studentName: string;
  admissionNumber: string;
  classId: any;
  className: string;
  grade?: number;
  section?: string;
  academicYear: string;
  rollNumber: string;
  enrollmentDate: string;
  status: "ACTIVE" | "TRANSFERRED" | "WITHDRAWN" | "PROMOTED" | string;
  institutionId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedEnrollmentResult {
  items: EnrollmentItem[];
  data: EnrollmentItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QueryEnrollmentsParams {
  page?: number;
  limit?: number;
  studentId?: string;
  classId?: string;
  academicYear?: string;
  status?: string;
  institutionId?: string;
}

export interface CreateEnrollmentPayload {
  studentId: string;
  classId: string;
  academicYear: string;
  rollNumber: string;
  enrollmentDate?: string;
  status?: string;
  institutionId?: string;
}

export interface PromoteStudentPayload {
  currentEnrollmentId: string;
  targetClassId: string;
  newAcademicYear: string;
  newRollNumber: string;
  enrollmentDate?: string;
}

export interface UpdateEnrollmentPayload {
  id: string;
  classId?: string;
  academicYear?: string;
  rollNumber?: string;
  enrollmentDate?: string;
  status?: string;
}

export interface UpdateEnrollmentStatusPayload {
  id: string;
  status: "ACTIVE" | "TRANSFERRED" | "WITHDRAWN" | "PROMOTED" | string;
}

function mapBackendEnrollmentToItem(item: any): EnrollmentItem {
  if (!item) return {} as EnrollmentItem;

  const student =
    typeof item.studentId === "object" && item.studentId ? item.studentId : null;
  const studentUser =
    student && typeof student.userId === "object" && student.userId
      ? student.userId
      : null;
  const studentName =
    studentUser?.name ||
    student?.name ||
    (student?.admissionNumber
      ? `Student (${student.admissionNumber})`
      : "Student Record");
  const admissionNumber =
    student?.admissionNumber ||
    student?.admissionNo ||
    (typeof item.studentId === "string" ? item.studentId.slice(-6) : "");

  const classObj =
    typeof item.classId === "object" && item.classId ? item.classId : null;
  const className =
    classObj?.name ||
    (classObj?.grade ? `Grade ${classObj.grade}-${classObj.section}` : "Class");

  return {
    id: item._id || item.id,
    _id: item._id || item.id,
    studentId: item.studentId,
    studentName,
    admissionNumber,
    classId: item.classId,
    className,
    grade: classObj?.grade,
    section: classObj?.section,
    academicYear: item.academicYear || "2026-2027",
    rollNumber: item.rollNumber || "",
    enrollmentDate: item.enrollmentDate || item.createdAt || new Date().toISOString(),
    status: item.status || "ACTIVE",
    institutionId: item.institutionId,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export const enrollmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/enrollments
    getEnrollments: builder.query<
      PaginatedEnrollmentResult,
      QueryEnrollmentsParams | void
    >({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params?.page) qp.set("page", String(params.page));
        if (params?.limit) qp.set("limit", String(params.limit));
        if (params?.studentId) qp.set("studentId", params.studentId);
        if (params?.classId) qp.set("classId", params.classId);
        if (params?.academicYear) qp.set("academicYear", params.academicYear);
        if (params?.status) qp.set("status", params.status);
        if (params?.institutionId) qp.set("institutionId", params.institutionId);

        const qs = qp.toString();
        return `/enrollments${qs ? `?${qs}` : ""}`;
      },
      transformResponse: (response: any): PaginatedEnrollmentResult => {
        const rawItems = Array.isArray(response?.items)
          ? response.items
          : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
          ? response
          : [];

        const normalized = rawItems.map(mapBackendEnrollmentToItem);
        const total = response?.total ?? normalized.length;
        const page = response?.page ?? 1;
        const limit = response?.limit ?? normalized.length;
        const totalPages =
          response?.totalPages ?? (limit > 0 ? Math.ceil(total / limit) : 1);

        return {
          items: normalized,
          data: normalized,
          total,
          page,
          limit,
          totalPages: totalPages || 1,
        };
      },
      providesTags: ["Enrollment"],
    }),

    // GET /api/enrollments/:id
    getEnrollmentById: builder.query<EnrollmentItem, string>({
      query: (id) => `/enrollments/${id}`,
      transformResponse: (res: any) => mapBackendEnrollmentToItem(res),
      providesTags: (_res, _err, id) => [{ type: "Enrollment", id }],
    }),

    // POST /api/enrollments
    createEnrollment: builder.mutation<EnrollmentItem, CreateEnrollmentPayload>({
      query: (body) => ({
        url: "/enrollments",
        method: "POST",
        body,
      }),
      transformResponse: (res: any) => mapBackendEnrollmentToItem(res),
      invalidatesTags: ["Enrollment", "Student", "Class"],
    }),

    // POST /api/enrollments/promote
    promoteStudent: builder.mutation<any, PromoteStudentPayload>({
      query: (body) => ({
        url: "/enrollments/promote",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Enrollment", "Student", "Class"],
    }),

    // PATCH /api/enrollments/:id
    updateEnrollment: builder.mutation<
      EnrollmentItem,
      UpdateEnrollmentPayload
    >({
      query: ({ id, ...body }) => ({
        url: `/enrollments/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (res: any) => mapBackendEnrollmentToItem(res),
      invalidatesTags: ["Enrollment", "Student", "Class"],
    }),

    // PATCH /api/enrollments/:id/status
    updateEnrollmentStatus: builder.mutation<
      EnrollmentItem,
      UpdateEnrollmentStatusPayload
    >({
      query: ({ id, status }) => ({
        url: `/enrollments/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      transformResponse: (res: any) => mapBackendEnrollmentToItem(res),
      invalidatesTags: ["Enrollment", "Student"],
    }),
  }),
});

export const {
  useGetEnrollmentsQuery,
  useGetEnrollmentByIdQuery,
  useCreateEnrollmentMutation,
  usePromoteStudentMutation,
  useUpdateEnrollmentMutation,
  useUpdateEnrollmentStatusMutation,
} = enrollmentApi;

