import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type ClassDocument = Class & Document;

export enum ClassStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

@Schema({
  timestamps: true,
  collection: 'classes',
})
export class Class {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Institution',
    required: true,
    index: true,
  })
  institutionId: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    type: Number,
    required: true,
    min: [1, 'Grade must be at least 1'],
  })
  grade: number;

  @Prop({
    required: true,
    uppercase: true,
    trim: true,
  })
  section: string;

  @Prop({
    required: true,
    trim: true,
    match: [/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY (e.g. 2026-2027)'],
  })
  academicYear: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'TeacherProfile',
    default: null,
  })
  classTeacherId: Types.ObjectId | null;

  @Prop({
    type: Number,
    required: true,
    min: [1, 'Capacity must be at least 1'],
    default: 40,
  })
  capacity: number;

  @Prop({
    type: String,
    default: null,
    trim: true,
  })
  roomNumber: string | null;

  @Prop({
    type: String,
    enum: Object.values(ClassStatus),
    default: ClassStatus.ACTIVE,
  })
  status: ClassStatus;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ClassSchema = SchemaFactory.createForClass(Class);

// Requirement 5: Unique compound index on institutionId + academicYear + grade + section
ClassSchema.index(
  { institutionId: 1, academicYear: 1, grade: 1, section: 1 },
  { unique: true },
);
ClassSchema.index({ institutionId: 1, status: 1 });

