import { apiClient, API_ENDPOINTS } from "@/services/api";
import {
  LoginRequestDto,
  LoginResponseDto,
  RefreshTokenResponseDto,
  CurrentUserProfileDto,
  LogoutResponseDto,
} from "@/types";

/**
 * Authentication Service
 * Communicates with the NestJS backend auth endpoints using the centralized apiClient.
 */
export const authService = {
  /**
   * Authenticates user against POST /api/auth/login.
   * Transmits credentials and optional role verification.
   * Receives accessToken in JSON and sets HttpOnly refreshToken cookie via backend.
   */
  async login(credentials: LoginRequestDto): Promise<LoginResponseDto> {
    return await apiClient.post<LoginResponseDto>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials
    );
  },

  /**
   * Rotates and refreshes the access token via POST /api/auth/refresh.
   * Transmits the HttpOnly refreshToken cookie withCredentials.
   */
  async refresh(): Promise<RefreshTokenResponseDto> {
    return await apiClient.post<RefreshTokenResponseDto>(
      API_ENDPOINTS.AUTH.REFRESH,
      {}
    );
  },

  /**
   * Terminates the current active session via POST /api/auth/logout.
   * Invalidates the server-side refresh token and clears the HttpOnly cookie.
   */
  async logout(): Promise<LogoutResponseDto> {
    return await apiClient.post<LogoutResponseDto>(
      API_ENDPOINTS.AUTH.LOGOUT,
      {}
    );
  },

  /**
   * Retrieves profile details and permissions of the currently authenticated user via GET /api/auth/me.
   */
  async getMe(): Promise<CurrentUserProfileDto> {
    return await apiClient.get<CurrentUserProfileDto>(
      API_ENDPOINTS.AUTH.ME
    );
  },
};

export default authService;

