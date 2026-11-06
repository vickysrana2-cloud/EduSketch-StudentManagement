import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { AuditAction } from '../enums/audit-action.enum';
import { AuditModule } from '../enums/audit-module.enum';

export type AuditLogDocument = AuditLog & Document;

@Schema({
  timestamps: { createdAt: true, updatedAt: false }, // Immutable: Audit logs are append-only
  collection: 'audit_logs',
})
export class AuditLog {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  })
  userId: Types.ObjectId | null;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Institution',
    default: null,
    index: true,
  })
  institutionId: Types.ObjectId | null;

  @Prop({
    type: String,
    enum: Object.values(AuditAction),
    required: [true, 'Audit action is required'],
    index: true,
  })
  action: AuditAction;

  @Prop({
    type: String,
    enum: Object.values(AuditModule),
    required: [true, 'Audit module is required'],
    index: true,
  })
  module: AuditModule;

  @Prop({
    type: String,
    required: [true, 'Audit description is required'],
    trim: true,
  })
  description: string;

  @Prop({
    type: MongooseSchema.Types.Mixed,
    default: null,
  })
  targetId: Types.ObjectId | string | null;

  @Prop({
    type: String,
    default: null,
    trim: true,
  })
  targetType: string | null;

  @Prop({
    type: String,
    default: null,
    trim: true,
  })
  ipAddress: string | null;

  @Prop({
    type: String,
    default: null,
    trim: true,
  })
  userAgent: string | null;

  @Prop({
    type: MongooseSchema.Types.Mixed,
    default: {},
  })
  metadata: Record<string, any>;

  createdAt?: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// --------------------------------------------------------------------------
// Database Indexes (Requirement 10)
// --------------------------------------------------------------------------
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ institutionId: 1, createdAt: -1 });
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ module: 1, createdAt: -1 });

