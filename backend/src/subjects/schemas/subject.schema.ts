import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type SubjectDocument = Subject & Document;

export enum SubjectStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

@Schema({
  timestamps: true,
  collection: 'subjects',
})
export class Subject {
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
    required: true,
    uppercase: true,
    trim: true,
  })
  code: string;

  @Prop({
    type: String,
    default: null,
    trim: true,
  })
  description: string | null;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Class',
    required: true,
    index: true,
  })
  classId: Types.ObjectId;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'TeacherProfile' }],
    default: [],
  })
  teacherIds: Types.ObjectId[];

  @Prop({
    required: true,
    trim: true,
    match: [/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY (e.g. 2026-2027)'],
  })
  academicYear: string;

  @Prop({
    type: String,
    enum: Object.values(SubjectStatus),
    default: SubjectStatus.ACTIVE,
  })
  status: SubjectStatus;

  createdAt?: Date;
  updatedAt?: Date;
}

export const SubjectSchema = SchemaFactory.createForClass(Subject);

// Requirement 3: Compound unique index on institutionId + code + academicYear + classId
SubjectSchema.index(
  { institutionId: 1, code: 1, academicYear: 1, classId: 1 },
  { unique: true },
);
SubjectSchema.index({ institutionId: 1, classId: 1 });
SubjectSchema.index({ institutionId: 1, status: 1 });

