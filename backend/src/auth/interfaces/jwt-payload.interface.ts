import { UserRole } from '../../users/enums/user.enums';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  institutionId: string | null;
  iss?: string;
  aud?: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: string;
}

