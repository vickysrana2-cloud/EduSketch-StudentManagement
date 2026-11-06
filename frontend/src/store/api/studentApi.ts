import { baseApi } from "./baseApi";
import { Student, APIResponse } from "@/types";

export interface CreateStudentUserPayload {
  name: string;
  email: string;
  password?: string;
  admissionNumber: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  parentDetails: Array<{
    name: string;
    relationship: "FATHER" | "MOTHER" | "GUARDIAN" | "OTHER";
    phone: string;
    email?: string;
  }>;
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  classId: string;
  academicYear?: string;
  rollNumber?: string;
  institutionId?: string;
}

export interface UpdateStudentProfilePayload {
  id: string | number;
  admissionNumber?: string;
  dateOfBirth?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  bloodGroup?: string | null;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
  parentDetails?: Array<{
    name: string;
    relationship: string;
    phone: string;
    email?: string | null;
    occupation?: string | null;
  }>;
  status?: string;
}

/**
 * Normalizes backend StudentProfile document (with populated userId)
 * into the frontend Student model.
 */
function mapBackendStudentProfileToStudent(item: any): Student {
  if (!item) return {} as Student;

  const user = typeof item.userId === "object" && item.userId ? item.userId : null;
  const userName = user?.name || item.name || `Student ${item.admissionNumber || ""}`;
  const userEmail = user?.email || item.email || "";

  // Derive age from dateOfBirth if available
  let calculatedAge = item.age;
  if (!calculatedAge && item.dateOfBirth) {
    const dob = new Date(item.dateOfBirth);
    if (!isNaN(dob.getTime())) {
      const diff = Date.now() - dob.getTime();
      calculatedAge = Math.abs(new Date(diff).getUTCFullYear() - 1970);
    }
  }

  const rawStatus = (item.status || "ACTIVE").toString().toUpperCase();
  const normalizedStatus = rawStatus === "ACTIVE" ? "active" : "inactive";

  return {
    id: item._id || item.id,
    name: userName,
    email: userEmail,
    age: calculatedAge || 18,
    dateOfBirth: item.dateOfBirth,
    gender: item.gender,
    bloodGroup: item.bloodGroup,
    admissionNumber: item.admissionNumber,
    admissionNo: item.admissionNumber,
    class: item.class || "Grade 10",
    section: item.section || "A",
    status: normalizedStatus,
    marks: item.marks || [],
    createdAt: item.createdAt,
    address: item.address || {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    },
    parentDetails: item.parentDetails || [],
    userId: item.userId,
    institutionId: item.institutionId,
  };
}

export const studentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Lists students from /student-profiles with pagination, search, and status filters.
     */
    getStudents: builder.query<
      APIResponse<Student[]>,
      { page?: number; limit?: number; search?: string; status?: string; gender?: string }
    >({
      query: ({ page = 1, limit = 10, search = "", status, gender }) => {
        const params = new URLSearchParams();
        if (page) params.append("page", String(page));
        if (limit) params.append("limit", String(limit));
        if (search && search.trim()) params.append("search", search.trim());
        if (status && status !== "ALL") params.append("status", status.toUpperCase());
        if (gender && gender !== "ALL") params.append("gender", gender.toUpperCase());
        return `/student-profiles?${params.toString()}`;
      },
      transformResponse: (response: any): APIResponse<Student[]> => {
        const rawItems = Array.isArray(response?.items)
          ? response.items
          : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
          ? response
          : [];

        const totalRecords =
          typeof response?.total === "number"
            ? response.total
            : response?.pagination?.totalRecords || rawItems.length;

        const currentPage =
          typeof response?.page === "number"
            ? response.page
            : response?.pagination?.currentPage || 1;

        const limit =
          typeof response?.limit === "number"
            ? response.limit
            : response?.pagination?.limit || 10;

        const totalPages =
          typeof response?.totalPages === "number"
            ? response.totalPages
            : Math.ceil(totalRecords / limit) || 1;

        const students = rawItems.map(mapBackendStudentProfileToStudent);

        return {
          success: true,
          data: students,
          pagination: {
            totalRecords,
            currentPage,
            totalPages,
            limit,
          },
        };
      },
      providesTags: ["Student"],
    }),

    /**
     * Retrieves specific student profile by ID via GET /student-profiles/:id.
     */
    getStudentById: builder.query<APIResponse<Student>, number | string>({
      query: (id) => `/student-profiles/${id}`,
      transformResponse: (response: any): APIResponse<Student> => {
        const rawData = response?.data || response?.student || response;
        const mapped = mapBackendStudentProfileToStudent(rawData);
        return {
          success: true,
          data: mapped,
          student: mapped,
        };
      },
      providesTags: (result, error, id) => [{ type: "Student", id }],
    }),

    /**
     * Retrieves current logged-in student profile via GET /student-profiles/me.
     */
    getMyStudentProfile: builder.query<APIResponse<Student>, void>({
      query: () => "/student-profiles/me",
      transformResponse: (response: any): APIResponse<Student> => {
        const rawData = response?.data || response?.student || response;
        const mapped = mapBackendStudentProfileToStudent(rawData);
        return {
          success: true,
          data: mapped,
          student: mapped,
        };
      },
      providesTags: ["Student"],
    }),

    /**
     * Atomic creation: User + StudentProfile + Initial Enrollment via POST /users/students.
     */
    createStudentUser: builder.mutation<any, CreateStudentUserPayload>({
      query: (data) => ({
        url: "/users/students",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Student", "User", "Class"],
    }),

    /**
     * Updates student profile via PATCH /student-profiles/:id.
     */
    updateStudentProfile: builder.mutation<
      APIResponse<Student>,
      UpdateStudentProfilePayload
    >({
      query: ({ id, ...dto }) => ({
        url: `/student-profiles/${id}`,
        method: "PATCH",
        body: dto,
      }),
      invalidatesTags: (result, error, { id }) => [
        "Student",
        { type: "Student", id },
      ],
    }),

    /**
     * Backward-compatible alias for updating student
     */
    updateStudent: builder.mutation<
      APIResponse<Student>,
      { id: number | string; [key: string]: any }
    >({
      query: ({ id, ...data }) => ({
        url: `/student-profiles/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        "Student",
        { type: "Student", id },
      ],
    }),

    /**
     * Creates new student profile via POST /student-profiles.
     */
    createStudent: builder.mutation<
      APIResponse<Student>,
      Record<string, any>
    >({
      query: (data) => ({
        url: "/student-profiles",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Student"],
    }),

    createStudentProfile: builder.mutation<
      APIResponse<Student>,
      Record<string, any>
    >({
      query: (data) => ({
        url: "/student-profiles",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Student"],
    }),

    /**
     * Query student enrollments from /enrollments?studentId=:id
     */
    getStudentEnrollments: builder.query<
      any[],
      { studentId?: string; classId?: string; academicYear?: string }
    >({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params?.studentId) qp.set("studentId", params.studentId);
        if (params?.classId) qp.set("classId", params.classId);
        if (params?.academicYear) qp.set("academicYear", params.academicYear);
        const qs = qp.toString();
        return `/enrollments${qs ? `?${qs}` : ""}`;
      },
      transformResponse: (res: any) => {
        if (Array.isArray(res)) return res;
        if (Array.isArray(res?.items)) return res.items;
        if (Array.isArray(res?.data)) return res.data;
        return [];
      },
      providesTags: ["Student"],
    }),

    /**
     * Deletes / archives student profile.
     */
    deleteStudent: builder.mutation<APIResponse, number | string>({
      query: (id) => ({
        url: `/student-profiles/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Student"],
    }),
  }),
});

export const {
  useGetStudentsQuery,
  useGetStudentByIdQuery,
  useGetMyStudentProfileQuery,
  useCreateStudentUserMutation,
  useUpdateStudentProfileMutation,
  useUpdateStudentMutation,
  useCreateStudentMutation,
  useCreateStudentProfileMutation,
  useGetStudentEnrollmentsQuery,
  useDeleteStudentMutation,
} = studentApi;
