import { baseApi } from "./baseApi";

export interface ClassItem {
  id: string;
  _id?: string;
  institutionId?: string;
  name: string;
  grade: number;
  section: string;
  academicYear: string;
  capacity: number;
  roomNumber?: string | null;
  status: string;
  classTeacherId?: any;
  classTeacherName?: string | null;
  studentCount?: number;
  createdAt?: string;
  updatedAt?: string;
  sections?: string[];
}

export interface SubjectItem {
  id: string;
  _id?: string;
  institutionId?: string;
  name: string;
  code: string;
  description?: string | null;
  classId?: any;
  className?: string;
  teacherIds?: any[];
  teachers?: Array<{ id: string; name: string; employeeId?: string }>;
  academicYear: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  data: T[]; // Backward-compatibility
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QueryClassesParams {
  page?: number;
  limit?: number;
  search?: string;
  academicYear?: string;
  grade?: number;
  section?: string;
  status?: string;
  institutionId?: string;
}

export interface QuerySubjectsParams {
  page?: number;
  limit?: number;
  search?: string;
  classId?: string;
  teacherId?: string;
  academicYear?: string;
  status?: string;
  institutionId?: string;
}

export interface CreateClassPayload {
  name: string;
  grade: number;
  section: string;
  academicYear: string;
  capacity: number;
  roomNumber?: string | null;
  classTeacherId?: string | null;
  status?: string;
}

export interface UpdateClassPayload {
  name?: string;
  grade?: number;
  section?: string;
  academicYear?: string;
  capacity?: number;
  roomNumber?: string | null;
  classTeacherId?: string | null;
  status?: string;
}

export interface CreateSubjectPayload {
  name: string;
  code: string;
  classId: string;
  academicYear: string;
  description?: string | null;
  teacherIds?: string[];
  status?: string;
}

export interface UpdateSubjectPayload {
  name?: string;
  code?: string;
  description?: string | null;
  academicYear?: string;
  status?: string;
}

export interface AssignTeachersPayload {
  teacherIds: string[];
}

function normalizeClass(item: any): ClassItem {
  if (!item) return {} as ClassItem;
  const teacher =
    typeof item.classTeacherId === "object" && item.classTeacherId
      ? item.classTeacherId
      : null;
  const teacherUser =
    teacher && typeof teacher.userId === "object" && teacher.userId
      ? teacher.userId
      : null;
  const teacherName =
    teacherUser?.name ||
    teacher?.name ||
    (teacher?.employeeId ? `Teacher (${teacher.employeeId})` : null);

  return {
    id: item._id || item.id,
    _id: item._id || item.id,
    institutionId: item.institutionId,
    name: item.name,
    grade: Number(item.grade) || 1,
    section: item.section || "A",
    academicYear: item.academicYear || "2026-2027",
    capacity: typeof item.capacity === "number" ? item.capacity : 40,
    roomNumber: item.roomNumber || null,
    status: item.status || "ACTIVE",
    classTeacherId: item.classTeacherId,
    classTeacherName: teacherName,
    studentCount: typeof item.studentCount === "number" ? item.studentCount : 0,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    sections: [item.section || "A"],
  };
}

function normalizeSubject(item: any): SubjectItem {
  if (!item) return {} as SubjectItem;
  const classObj =
    typeof item.classId === "object" && item.classId ? item.classId : null;
  const className = classObj
    ? classObj.name || `Grade ${classObj.grade}-${classObj.section}`
    : typeof item.className === "string"
    ? item.className
    : "Unassigned Class";

  const teachers = Array.isArray(item.teacherIds)
    ? item.teacherIds.map((t: any) => {
        if (typeof t === "object" && t) {
          const user =
            typeof t.userId === "object" && t.userId ? t.userId : null;
          return {
            id: t._id || t.id,
            name:
              user?.name ||
              t.name ||
              (t.employeeId ? `Faculty ${t.employeeId}` : "Faculty Member"),
            employeeId: t.employeeId,
          };
        }
        return {
          id: String(t),
          name: `Faculty (${String(t).slice(-4)})`,
        };
      })
    : [];

  return {
    id: item._id || item.id,
    _id: item._id || item.id,
    institutionId: item.institutionId,
    name: item.name,
    code: item.code,
    description: item.description || null,
    classId: item.classId,
    className,
    teacherIds: Array.isArray(item.teacherIds)
      ? item.teacherIds.map((t: any) =>
          typeof t === "object" && t ? t._id || t.id : String(t)
        )
      : [],
    teachers,
    academicYear: item.academicYear || "2026-2027",
    status: item.status || "ACTIVE",
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export const academicApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Academic Sessions fallback / query
    getAcademicSessions: builder.query<
      Array<{ id: number; year: string; isCurrent: boolean; status: string }>,
      void
    >({
      queryFn: () => ({
        data: [
          { id: 1, year: "2026-2027", isCurrent: true, status: "Active" },
          { id: 2, year: "2025-2026", isCurrent: false, status: "Completed" },
          { id: 3, year: "2024-2025", isCurrent: false, status: "Archived" },
        ],
      }),
      providesTags: ["Class"],
    }),

    // GET /api/classes
    getClasses: builder.query<PaginatedResult<ClassItem>, QueryClassesParams | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.set("page", String(params.page));
        if (params?.limit) queryParams.set("limit", String(params.limit));
        if (params?.search) queryParams.set("search", params.search);
        if (params?.academicYear)
          queryParams.set("academicYear", params.academicYear);
        if (params?.grade !== undefined && params?.grade !== null)
          queryParams.set("grade", String(params.grade));
        if (params?.section) queryParams.set("section", params.section);
        if (params?.status) queryParams.set("status", params.status);
        if (params?.institutionId)
          queryParams.set("institutionId", params.institutionId);

        const qs = queryParams.toString();
        return `/classes${qs ? `?${qs}` : ""}`;
      },
      transformResponse: (response: any) => {
        const rawItems = Array.isArray(response)
          ? response
          : response?.items || [];
        const normalized = rawItems.map(normalizeClass);
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
      providesTags: ["Class"],
    }),

    // GET /api/classes/:id
    getClassById: builder.query<ClassItem, string>({
      query: (id) => `/classes/${id}`,
      transformResponse: (response: any) => normalizeClass(response),
      providesTags: (_res, _err, id) => [{ type: "Class", id }],
    }),

    // POST /api/classes
    createClass: builder.mutation<ClassItem, CreateClassPayload>({
      query: (body) => ({
        url: "/classes",
        method: "POST",
        body,
      }),
      transformResponse: (res: any) => normalizeClass(res),
      invalidatesTags: ["Class"],
    }),

    // PATCH /api/classes/:id
    updateClass: builder.mutation<
      ClassItem,
      { id: string } & UpdateClassPayload
    >({
      query: ({ id, ...body }) => ({
        url: `/classes/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (res: any) => normalizeClass(res),
      invalidatesTags: ["Class"],
    }),

    // PATCH /api/classes/:id/status
    updateClassStatus: builder.mutation<
      ClassItem,
      { id: string; status: string }
    >({
      query: ({ id, status }) => ({
        url: `/classes/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      transformResponse: (res: any) => normalizeClass(res),
      invalidatesTags: ["Class"],
    }),

    // DELETE /api/classes/:id
    deleteClass: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/classes/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Class"],
    }),

    // GET /api/subjects
    getSubjects: builder.query<
      PaginatedResult<SubjectItem>,
      QuerySubjectsParams | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.set("page", String(params.page));
        if (params?.limit) queryParams.set("limit", String(params.limit));
        if (params?.search) queryParams.set("search", params.search);
        if (params?.classId) queryParams.set("classId", params.classId);
        if (params?.teacherId) queryParams.set("teacherId", params.teacherId);
        if (params?.academicYear)
          queryParams.set("academicYear", params.academicYear);
        if (params?.status) queryParams.set("status", params.status);
        if (params?.institutionId)
          queryParams.set("institutionId", params.institutionId);

        const qs = queryParams.toString();
        return `/subjects${qs ? `?${qs}` : ""}`;
      },
      transformResponse: (response: any) => {
        const rawItems = Array.isArray(response)
          ? response
          : response?.items || [];
        const normalized = rawItems.map(normalizeSubject);
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
      providesTags: ["Subject"],
    }),

    // GET /api/subjects/:id
    getSubjectById: builder.query<SubjectItem, string>({
      query: (id) => `/subjects/${id}`,
      transformResponse: (response: any) => normalizeSubject(response),
      providesTags: (_res, _err, id) => [{ type: "Subject", id }],
    }),

    // POST /api/subjects
    createSubject: builder.mutation<SubjectItem, CreateSubjectPayload>({
      query: (body) => ({
        url: "/subjects",
        method: "POST",
        body,
      }),
      transformResponse: (res: any) => normalizeSubject(res),
      invalidatesTags: ["Subject"],
    }),

    // PATCH /api/subjects/:id
    updateSubject: builder.mutation<
      SubjectItem,
      { id: string } & UpdateSubjectPayload
    >({
      query: ({ id, ...body }) => ({
        url: `/subjects/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (res: any) => normalizeSubject(res),
      invalidatesTags: ["Subject"],
    }),

    // PATCH /api/subjects/:id/teachers
    assignSubjectTeachers: builder.mutation<
      SubjectItem,
      { id: string; teacherIds: string[] }
    >({
      query: ({ id, teacherIds }) => ({
        url: `/subjects/${id}/teachers`,
        method: "PATCH",
        body: { teacherIds },
      }),
      transformResponse: (res: any) => normalizeSubject(res),
      invalidatesTags: ["Subject"],
    }),

    // DELETE /api/subjects/:id
    deleteSubject: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/subjects/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Subject"],
    }),
  }),
});

export const {
  useGetAcademicSessionsQuery,
  useGetClassesQuery,
  useGetClassByIdQuery,
  useCreateClassMutation,
  useUpdateClassMutation,
  useUpdateClassStatusMutation,
  useDeleteClassMutation,
  useGetSubjectsQuery,
  useGetSubjectByIdQuery,
  useCreateSubjectMutation,
  useUpdateSubjectMutation,
  useAssignSubjectTeachersMutation,
  useDeleteSubjectMutation,
} = academicApi;
