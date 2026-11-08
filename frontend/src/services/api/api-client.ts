import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { handleApiError, ApiError } from "./api-error";
import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
  executeRefreshToken,
} from "@/lib/auth-session";

/**
 * Sensitive field names that must never appear in frontend console logs or telemetry.
 */
const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "currentpassword",
  "newpassword",
  "token",
  "accesstoken",
  "refreshtoken",
  "secret",
  "authorization",
  "cookie",
  "creditcard",
  "cvv",
]);

/**
 * Deeply scrubs sensitive information from objects for safe development logging.
 */
function sanitizeForLogging(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForLogging(item));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object") {
      sanitized[key] = sanitizeForLogging(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Creates and configures the centralized Axios instance
 */
function createApiClient(): AxiosInstance {
  const baseURL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  const instance = axios.create({
    baseURL,
    timeout: 15000, // 15-second timeout for server response
    withCredentials: true, // Enables HttpOnly cookie transmission for session refresh
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  // Request Interceptor: Logging, header injection, and request preparation
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Automatically attach in-memory access token if available
      const token = getAccessToken();
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // In development, log outgoing requests without leaking sensitive payload data
      if (process.env.NODE_ENV === "development") {
        const sanitizedBody = config.data
          ? sanitizeForLogging(config.data)
          : undefined;
        // Debug information without sensitive fields
        console.debug(
          `[API Request] ${config.method?.toUpperCase()} ${config.baseURL || ""}${config.url || ""}`,
          sanitizedBody ? { data: sanitizedBody } : ""
        );
      }
      return config;
    },
    (error) => {
      return Promise.reject(handleApiError(error));
    }
  );

  // Response Interceptor: Format errors into standardized ApiError objects & handle silent 401 reauth
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      // Handle 401 Unauthorized with token refresh mutex
      if (
        error.response?.status === 401 &&
        originalRequest &&
        !(originalRequest as any)._retry
      ) {
        const url = originalRequest.url || "";
        const isAuthEndpoint =
          url.includes("/auth/login") || url.includes("/auth/refresh");

        if (!isAuthEndpoint) {
          (originalRequest as any)._retry = true;

          try {
            const apiBaseUrl =
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
            const newAccessToken = await executeRefreshToken(apiBaseUrl);

            if (newAccessToken) {
              setAccessToken(newAccessToken);
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              return instance(originalRequest);
            } else {
              clearAccessToken();
            }
          } catch {
            clearAccessToken();
          }
        }
      }

      const apiError = handleApiError(error);

      if (process.env.NODE_ENV === "development") {
        console.warn(
          `[API Error] ${apiError.statusCode} (${apiError.errorType || "UNKNOWN"}): ${apiError.message}`,
          apiError.path ? `on ${apiError.path}` : ""
        );
      }

      return Promise.reject(apiError);
    }
  );

  return instance;
}

export const axiosInstance: AxiosInstance = createApiClient();

/**
 * Centralized API Client Wrapper
 * Exposes strongly-typed methods and guarantees standardized ApiError rejection.
 */
export const apiClient = {
  /**
   * HTTP GET Request
   */
  async get<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await axiosInstance.get<T>(url, config);
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw handleApiError(error);
    }
  },

  /**
   * HTTP POST Request
   */
  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await axiosInstance.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw handleApiError(error);
    }
  },

  /**
   * HTTP PUT Request
   */
  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await axiosInstance.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw handleApiError(error);
    }
  },

  /**
   * HTTP PATCH Request
   */
  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await axiosInstance.patch<T>(url, data, config);
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw handleApiError(error);
    }
  },

  /**
   * HTTP DELETE Request
   */
  async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await axiosInstance.delete<T>(url, config);
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw handleApiError(error);
    }
  },

  /**
   * Expose raw Axios instance for custom streaming or multipart forms if needed
   */
  raw: axiosInstance,
};

export default apiClient;

