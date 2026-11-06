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
  prepareHeaders: (headers) => {
    const token = getAccessToken();
    if (token && !headers.has("authorization")) {
      headers.set("authorization", `Bearer ${token}`);
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
  ],
  endpoints: () => ({}),
});
