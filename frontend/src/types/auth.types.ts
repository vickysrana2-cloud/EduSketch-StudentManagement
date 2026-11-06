import { UserRole, UserStatus, UserResponseDto } from "./user.types";

export interface LoginRequestDto {
  email: string;
  password: string;
  role?: UserRole;
}

export interface LoginResponseDto {
  accessToken: string;
  tokenType: string;
  expiresIn: string;
  user: UserResponseDto;
}

export interface RegisterRequestDto {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface RefreshTokenDto {
  refreshToken?: string;
}

export interface RefreshTokenResponseDto {
  accessToken: string;
  tokenType: string;
  expiresIn: string;
}

export interface VerifyEmailDto {
  token: string;
}

export interface ResendVerificationDto {
  email: string;
}

export interface CurrentUserProfileDto extends UserResponseDto {
  profileImage?: string | null;
}

export interface LogoutResponseDto {
  message: string;
}

