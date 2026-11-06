/**
 * Sessions Module Types
 */

export interface SessionResponseDto {
  id: string;
  userId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  expiresAt: string;
  isRevoked: boolean;
  revokedAt?: string | null;
  createdAt: string;
}

export interface ActiveSessionsListResponseDto {
  message: string;
  count: number;
  sessions: SessionResponseDto[];
}

export interface RevokeSessionResponseDto {
  message: string;
  sessionId?: string;
}

