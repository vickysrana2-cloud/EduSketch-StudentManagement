import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
  executeRefreshToken,
} from "@/lib/auth-session";
import { logout } from "@/store/slices/authSlice";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
  credentials: "include", // Essential for HttpOnly refresh-token cookies
  prepareHeaders: (headers, { getState }) => {
    const token = getAccessToken();
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }

    // Dev/Fallback role injection from Redux state for SuperAdmin & UserManagement guards
    const state = getState() as any;
    const userRole = state?.auth?.user?.role;
    if (userRole) {
      headers.set("x-user-role", userRole);
    }
    const userId = state?.auth?.user?._id || state?.auth?.user?.id;
    if (userId) {
      headers.set("x-user-id", userId);
    }

    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const url = typeof args === "string" ? args : args.url;
    // Do not attempt refresh if the 401 came from login or refresh itself
    if (!url.includes("/auth/login") && !url.includes("/auth/refresh")) {
      const apiBaseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

      const newAccessToken = await executeRefreshToken(apiBaseUrl);
      if (newAccessToken) {
        setAccessToken(newAccessToken);
        // Retry original query with fresh token
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        clearAccessToken();
        api.dispatch(logout());
      }
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Student",
    "Teacher",
    "Mark",
    "Class",
    "Section",
    "Subject",
    "Attendance",
    "Exam",
    "Result",
    "Report",
    "User",
    "Institution",
    "Enrollment",
    "Role",
    "Permission",
    "RolePermission",
    "Session",
    "AuditLog",
  ],
  endpoints: () => ({}),
});
