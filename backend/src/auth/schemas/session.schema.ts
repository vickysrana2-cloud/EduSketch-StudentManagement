import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import * as crypto from 'crypto';

export type SessionDocument = Session & Document;

@Schema({
  timestamps: true,
  collection: 'sessions',
})
export class Session {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    select: false, // Security: Never expose refresh-token hashes by default
    index: true,
  })
  refreshTokenHash: string;

  @Prop({
    type: String,
    required: true,
    default: () => crypto.randomUUID(),
    index: true,
  })
  tokenFamily: string;

  @Prop({
    type: Date,
    required: true,
    index: { expires: 0 }, // TTL index for automatic MongoDB background cleanup
  })
  expiresAt: Date;

  @Prop({
    type: Date,
    default: null,
    index: true,
  })
  revokedAt: Date | null;

  @Prop({ type: String, default: null })
  ipAddress: string | null;

  @Prop({ type: String, default: null })
  userAgent: string | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

// Compound indexes for optimal querying and token family breach containment
SessionSchema.index({ userId: 1, revokedAt: 1 });
SessionSchema.index({ tokenFamily: 1, revokedAt: 1 });
SessionSchema.index({ refreshTokenHash: 1, revokedAt: 1 });
