import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import { Session, SessionDocument } from './schemas/session.schema';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    @InjectModel(Session.name)
    private readonly sessionModel: Model<SessionDocument>,
  ) {}

  /**
   * Hashes a refresh token using SHA-256 before database storage.
   * Ensures raw refresh tokens are NEVER stored in the database.
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Creates a new session record with hashed refresh token.
   */
  async createSession(params: {
    userId: string;
    refreshToken: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    expiresInDays?: number;
  }): Promise<SessionDocument> {
    const refreshTokenHash = this.hashToken(params.refreshToken);
    const expiresInDays = params.expiresInDays || 7;
    const expiresAt = new Date(
      Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
    );

    const session = new this.sessionModel({
      userId: new Types.ObjectId(params.userId),
      refreshTokenHash,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent || null,
      isRevoked: false,
      expiresAt,
    });

    const savedSession = await session.save();
    this.logger.log(
      `Session created for user '${params.userId}' (Expires: ${expiresAt.toISOString()})`,
    );
    return savedSession;
  }

  /**
   * Revokes all sessions for a specific user (e.g. after password change)
   */
  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.sessionModel.updateMany(
      { userId: new Types.ObjectId(userId) },
      { $set: { isRevoked: true } },
    );
    this.logger.log(`All sessions revoked for user '${userId}'`);
  }
}

