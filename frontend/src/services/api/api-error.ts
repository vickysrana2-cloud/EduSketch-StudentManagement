import { AxiosError } from "axios";

/**
 * Standardized API Error Interface
 */
export interface ApiErrorData {
  statusCode: number;
  message: string;
  errors?: Record<string, string[]> | string[];
  errorType?: string;
  timestamp: string;
  path?: string;
  isNetworkError: boolean;
  isTimeout: boolean;
}

/**
 * Custom Error class representing an API exception
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errors?: Record<string, string[]> | string[];
  public readonly errorType?: string;
  public readonly timestamp: string;
  public readonly path?: string;
  public readonly isNetworkError: boolean;
  public readonly isTimeout: boolean;
  public readonly rawError?: unknown;

  constructor(data: ApiErrorData, rawError?: unknown) {
    super(data.message);
    this.name = "ApiError";
    this.statusCode = data.statusCode;
    this.errors = data.errors;
    this.errorType = data.errorType;
    this.timestamp = data.timestamp;
    this.path = data.path;
    this.isNetworkError = data.isNetworkError;
    this.isTimeout = data.isTimeout;
    this.rawError = rawError;

    // Maintain proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  // Helper getters for status code classification
  get isBadRequest(): boolean {
    return this.statusCode === 400;
  }

  get isUnauthorized(): boolean {
    return this.statusCode === 401;
  }

  get isForbidden(): boolean {
    return this.statusCode === 403;
  }

  get isNotFound(): boolean {
    return this.statusCode === 404;
  }

  get isConflict(): boolean {
    return this.statusCode === 409;
  }

  get isUnprocessableEntity(): boolean {
    return this.statusCode === 422;
  }

  get isServerError(): boolean {
    return this.statusCode >= 500;
  }

  /**
   * Returns a friendly formatted string containing all validation error messages.
   */
  get formattedValidationErrors(): string {
    if (!this.errors) return "";
    if (Array.isArray(this.errors)) {
      return this.errors.join(", ");
    }
    return Object.entries(this.errors)
      .map(([field, msgs]) => `${field}: ${msgs.join(", ")}`)
      .join("; ");
  }
}

/**
 * Normalizes Axios and runtime errors into a standardized ApiError instance
 */
export function handleApiError(error: unknown): ApiError {
  const timestamp = new Date().toISOString();

  // If already an ApiError instance, return as-is
  if (error instanceof ApiError) {
    return error;
  }

  // Axios Error handling
  if (isAxiosError(error)) {
    const axiosErr = error as AxiosError<any>;

    // 1. Timeout Error
    if (axiosErr.code === "ECONNABORTED" || axiosErr.message.includes("timeout")) {
      return new ApiError(
        {
          statusCode: 408,
          message: "Request timed out. The server took too long to respond. Please try again.",
          errorType: "TIMEOUT_ERROR",
          timestamp,
          path: axiosErr.config?.url,
          isNetworkError: false,
          isTimeout: true,
        },
        error
      );
    }

    // 2. Network Error (No response received: offline, DNS error, CORS blocked)
    if (!axiosErr.response) {
      return new ApiError(
        {
          statusCode: 0,
          message:
            "Unable to connect to the backend server. Please verify your internet connection or try again later.",
          errorType: "NETWORK_ERROR",
          timestamp,
          path: axiosErr.config?.url,
          isNetworkError: true,
          isTimeout: false,
        },
        error
      );
    }

    // 3. HTTP Response Received
    const status = axiosErr.response.status;
    const responseData = axiosErr.response.data;

    let message = "An unexpected error occurred. Please try again.";
    let errors: Record<string, string[]> | string[] | undefined = undefined;
    const errorType = responseData?.error || `HTTP_${status}`;
    const path = responseData?.path || axiosErr.config?.url;

    // NestJS standard error formats: { statusCode, message: string | string[], error?: string }
    if (responseData) {
      if (Array.isArray(responseData.message)) {
        // NestJS validation pipe array: e.g. ["email must be valid", "password too short"]
        errors = responseData.message;
        message = responseData.message[0] || "Validation failed";
      } else if (typeof responseData.message === "string") {
        message = responseData.message;
      } else if (typeof responseData === "string") {
        message = responseData;
      }
    }

    // HTTP Status Specific Fallbacks & Messages
    switch (status) {
      case 400:
        if (!message || message === "An unexpected error occurred. Please try again.") {
          message = "Bad Request: The submitted data is invalid.";
        }
        break;
      case 401:
        if (!message || message === "An unexpected error occurred. Please try again.") {
          message = "Unauthorized: Session is invalid or credentials are required.";
        }
        break;
      case 403:
        if (!message || message === "An unexpected error occurred. Please try again.") {
          message = "Forbidden: You do not have permission to perform this action.";
        }
        break;
      case 404:
        if (!message || message === "An unexpected error occurred. Please try again.") {
          message = "Resource Not Found: The requested item does not exist.";
        }
        break;
      case 409:
        if (!message || message === "An unexpected error occurred. Please try again.") {
          message = "Conflict: A resource with these unique details already exists.";
        }
        break;
      case 422:
        if (!message || message === "An unexpected error occurred. Please try again.") {
          message = "Unprocessable Entity: Validation failed on submitted fields.";
        }
        break;
      case 500:
      default:
        if (status >= 500) {
          message = "Internal Server Error: A server error occurred. Please try again later.";
        }
        break;
    }

    return new ApiError(
      {
        statusCode: status,
        message,
        errors,
        errorType,
        timestamp: responseData?.timestamp || timestamp,
        path,
        isNetworkError: false,
        isTimeout: false,
      },
      error
    );
  }

  // Generic or unknown exception fallback
  const genericMessage =
    error instanceof Error ? error.message : "An unexpected application error occurred.";

  return new ApiError(
    {
      statusCode: 500,
      message: genericMessage,
      errorType: "UNKNOWN_ERROR",
      timestamp,
      isNetworkError: false,
      isTimeout: false,
    },
    error
  );
}

function isAxiosError(error: any): boolean {
  return error && (error.isAxiosError === true || error.name === "AxiosError");
}

