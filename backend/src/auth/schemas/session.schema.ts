import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

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
    required: true,
    select: false, // Security: Never expose refresh-token hashes by default
  })
  refreshTokenHash: string;

  @Prop({ type: String, default: null })
  ipAddress: string | null;

  @Prop({ type: String, default: null })
  userAgent: string | null;

  @Prop({ type: Boolean, default: false })
  isRevoked: boolean;

  @Prop({
    type: Date,
    required: true,
    index: { expires: 0 }, // Automatic TTL cleanup upon expiration
  })
  expiresAt: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

// Additional compound index for user session queries
SessionSchema.index({ userId: 1, isRevoked: 1 });

