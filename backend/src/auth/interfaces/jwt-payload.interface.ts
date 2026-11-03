import { UserRole } from '../../users/enums/user.enums';

/**
 * Minimal JWT Access Token Payload (Task 08 Specification):
 * - sub: MongoDB ObjectId string of the User
 * - role: TEACHER, ADMIN, STUDENT, or SUPER_ADMIN
 * - institutionId: MongoDB ObjectId string of the institution (null for SUPER_ADMIN)
 *
 * Excludes sensitive fields (passwords, emails, permissions).
 */
export interface JwtAccessTokenPayload {
  sub: string;
  role: UserRole;
  institutionId: string | null;
  iss?: string;
  aud?: string;
  iat?: number;
  exp?: number;
}

/**
 * Standard alias for backward compatibility across strategies and guards
 */
export type JwtPayload = JwtAccessTokenPayload;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: string;
}
