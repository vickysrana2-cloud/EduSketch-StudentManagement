import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type EnrollmentDocument = Enrollment & Document;

export enum EnrollmentStatus {
  ACTIVE = 'ACTIVE',
  TRANSFERRED = 'TRANSFERRED',
  WITHDRAWN = 'WITHDRAWN',
  PROMOTED = 'PROMOTED',
}

@Schema({
  timestamps: true,
  collection: 'enrollments',
})
export class Enrollment {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'StudentProfile',
    required: true,
    index: true,
  })
  studentId: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Institution',
    required: true,
    index: true,
  })
  institutionId: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Class',
    required: true,
    index: true,
  })
  classId: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
    match: [/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY (e.g. 2026-2027)'],
  })
  academicYear: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  rollNumber: string;

  @Prop({
    type: Date,
    required: true,
    default: Date.now,
  })
  enrollmentDate: Date;

  @Prop({
    type: String,
    enum: Object.values(EnrollmentStatus),
    default: EnrollmentStatus.ACTIVE,
    index: true,
  })
  status: EnrollmentStatus;

  createdAt?: Date;
  updatedAt?: Date;
}

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);

// Requirement 3: Compound index - one enrollment per student per academic year
EnrollmentSchema.index(
  { studentId: 1, academicYear: 1 },
  { unique: true },
);

// Roll number uniqueness within a class for an academic year
EnrollmentSchema.index(
  { institutionId: 1, classId: 1, academicYear: 1, rollNumber: 1 },
  { unique: true },
);

EnrollmentSchema.index({ institutionId: 1, classId: 1, status: 1 });

