import axios from "axios";
import {
  getAccessToken,
  clearAccessToken,
  executeRefreshToken,
} from "@/lib/auth-session";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Always transmit and accept HttpOnly cookies (refreshToken)
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request Interceptor: Inject in-memory access token
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized with token refresh mutex
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Do not attempt refresh on login or refresh endpoint itself
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await executeRefreshToken(API_BASE_URL);
        if (newAccessToken) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshErr) {
        clearAccessToken();
        if (typeof window !== "undefined") {
          window.location.href = "/login?sessionExpired=true";
        }
        return Promise.reject(refreshErr);
      }

      // If refresh failed to return a token
      clearAccessToken();
      if (typeof window !== "undefined") {
        window.location.href = "/login?sessionExpired=true";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
