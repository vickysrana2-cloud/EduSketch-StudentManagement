import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { UserRole, UserStatus } from '../enums/user.enums';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  collection: 'users',
  toJSON: {
    transform: (_doc, ret: Record<string, any>) => {
      delete ret.passwordHash;
      return ret;
    },
  },
})
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  @Prop({
    required: true,
    select: false, // Excluded from normal queries by default
  })
  passwordHash: string;

  @Prop({
    required: true,
    type: String,
    enum: UserRole,
  })
  role: UserRole;

  @Prop({
    type: String,
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Prop({
    type: Boolean,
    default: false,
  })
  isEmailVerified: boolean;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Institution',
    default: null,
  })
  institutionId: Types.ObjectId | null;

  @Prop({
    type: String,
    default: null,
  })
  profileImage: string | null;

  @Prop({
    type: Date,
    default: null,
  })
  lastLoginAt: Date | null;

  @Prop({
    type: Date,
    default: null,
  })
  passwordChangedAt: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes (Note: 'email' unique index is created by @Prop({ unique: true }))
UserSchema.index({ institutionId: 1, role: 1, status: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ role: 1 });

