import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import { Session, SessionDocument } from './schemas/session.schema';

export interface ActiveSessionResponse {
  id: string;
  tokenFamily: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  expiresAt: Date;
}

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    @InjectModel(Session.name)
    private readonly sessionModel: Model<SessionDocument>,
  ) {}

  /**
   * Generates a high-entropy, cryptographically random refresh token (Requirement 2)
   */
  generateRandomToken(): string {
    return crypto.randomBytes(40).toString('hex'); // 80 hex characters (320 bits of entropy)
  }

  /**
   * Hashes a refresh token using SHA-256 before database storage (Requirement 3)
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Creates a new session record for a user upon login (Requirement 10: independent device sessions)
   */
  async createSession(params: {
    userId: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    expiresInDays?: number;
  }): Promise<{ session: SessionDocument; rawRefreshToken: string; tokenFamily: string }> {
    const rawRefreshToken = this.generateRandomToken();
    const refreshTokenHash = this.hashToken(rawRefreshToken);
    const tokenFamily = crypto.randomUUID();
    const expiresInDays = params.expiresInDays || 7;
    const expiresAt = new Date(
      Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
    );

    const session = new this.sessionModel({
      userId: new Types.ObjectId(params.userId),
      refreshTokenHash,
      tokenFamily,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent || null,
      revokedAt: null,
      expiresAt,
    });

    const savedSession = await session.save();
    this.logger.log(
      `Session created: User '${params.userId}', Family '${tokenFamily}' (Expires: ${expiresAt.toISOString()})`,
    );

    return {
      session: savedSession,
      rawRefreshToken,
      tokenFamily,
    };
  }

  /**
   * Rotates a refresh token, revokes previous session, and detects token reuse (Requirements 6, 7, 8, 9, 12)
   */
  async rotateSession(
    rawRefreshToken: string,
    metadata?: { ipAddress?: string; userAgent?: string },
  ): Promise<{
    newRawRefreshToken: string;
    userId: string;
    tokenFamily: string;
    newSession: SessionDocument;
  }> {
    if (!rawRefreshToken || typeof rawRefreshToken !== 'string') {
      throw new UnauthorizedException('Refresh token is required');
    }

    const incomingHash = this.hashToken(rawRefreshToken);

    // Explicitly query including refreshTokenHash
    const existingSession = await this.sessionModel
      .findOne({ refreshTokenHash: incomingHash })
      .select('+refreshTokenHash')
      .exec();

    if (!existingSession) {
      this.logger.warn('Refresh attempt with unknown or invalid token hash');
      throw new UnauthorizedException('Invalid or unrecognized refresh token');
    }

    // 8 & 9. REUSE DETECTION: If this token was already revoked, a breach is detected!
    if (existingSession.revokedAt !== null) {
      this.logger.error(
        `🚨 CRITICAL SECURITY ALERT: Refresh token reuse detected for User '${existingSession.userId}' in Family '${existingSession.tokenFamily}'. Revoking entire token family.`,
      );

      // Invalidate ALL sessions belonging to this compromised token family
      await this.sessionModel.updateMany(
        { tokenFamily: existingSession.tokenFamily },
        { $set: { revokedAt: new Date() } },
      );

      throw new UnauthorizedException(
        'Security compromise detected: Attempt to reuse a revoked refresh token. All active sessions in this family have been terminated.',
      );
    }

    // 12. Application-level expiration check (independent of MongoDB TTL)
    if (existingSession.expiresAt.getTime() <= Date.now()) {
      existingSession.revokedAt = new Date();
      await existingSession.save();
      this.logger.warn(`Refresh attempt with expired session: '${existingSession._id}'`);
      throw new UnauthorizedException('Refresh token has expired. Please log in again.');
    }

    // 7. Revoke previous token record
    existingSession.revokedAt = new Date();
    await existingSession.save();

    // 6. Generate fresh rotated token within the same tokenFamily
    const newRawRefreshToken = this.generateRandomToken();
    const newHash = this.hashToken(newRawRefreshToken);
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const newSession = new this.sessionModel({
      userId: existingSession.userId,
      refreshTokenHash: newHash,
      tokenFamily: existingSession.tokenFamily, // Maintain family lineage
      ipAddress: metadata?.ipAddress || existingSession.ipAddress,
      userAgent: metadata?.userAgent || existingSession.userAgent,
      revokedAt: null,
      expiresAt: newExpiresAt,
    });

    const savedNewSession = await newSession.save();

    this.logger.log(
      `Session rotated: User '${existingSession.userId}', Family '${existingSession.tokenFamily}' (Old Session: '${existingSession._id}', New Session: '${savedNewSession._id}')`,
    );

    return {
      newRawRefreshToken,
      userId: existingSession.userId.toString(),
      tokenFamily: existingSession.tokenFamily,
      newSession: savedNewSession,
    };
  }

  /**
   * Revokes a session by its raw refresh token (e.g. on user logout)
   */
  async revokeSessionByToken(rawRefreshToken: string): Promise<boolean> {
    if (!rawRefreshToken) return false;
    const hash = this.hashToken(rawRefreshToken);

    const result = await this.sessionModel.findOneAndUpdate(
      { refreshTokenHash: hash, revokedAt: null },
      { $set: { revokedAt: new Date() } },
      { new: true },
    );

    if (result) {
      this.logger.log(`Session '${result._id}' successfully revoked on logout`);
      return true;
    }
    return false;
  }

  /**
   * Revokes a specific session by its document ID (Requirement for DELETE /api/auth/sessions/:id)
   */
  async revokeSessionById(sessionId: string, userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(sessionId)) {
      throw new NotFoundException(`Invalid session ID format: '${sessionId}'`);
    }

    const session = await this.sessionModel
      .findOne({
        _id: new Types.ObjectId(sessionId),
        userId: new Types.ObjectId(userId),
      })
      .exec();

    if (!session) {
      throw new NotFoundException('Session not found or does not belong to the current user');
    }

    if (session.revokedAt !== null) {
      return; // Already revoked
    }

    session.revokedAt = new Date();
    await session.save();

    this.logger.log(`Session '${sessionId}' manually revoked by User '${userId}'`);
  }

  /**
   * Lists all active, non-revoked sessions for a user (Requirement for GET /api/auth/sessions)
   */
  async getUserActiveSessions(userId: string): Promise<ActiveSessionResponse[]> {
    const now = new Date();
    const sessions = await this.sessionModel
      .find({
        userId: new Types.ObjectId(userId),
        revokedAt: null,
        expiresAt: { $gt: now },
      })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return sessions.map((s) => ({
      id: s._id.toString(),
      tokenFamily: s.tokenFamily,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      createdAt: s.createdAt!,
      expiresAt: s.expiresAt,
    }));
  }

  /**
   * Revokes all sessions for a specific user (e.g. after password change or admin action)
   */
  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.sessionModel.updateMany(
      { userId: new Types.ObjectId(userId), revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
    this.logger.log(`All sessions revoked for user '${userId}'`);
  }
}
