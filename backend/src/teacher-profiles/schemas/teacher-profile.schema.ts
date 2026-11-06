import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type TeacherProfileDocument = TeacherProfile & Document;

export enum TeacherProfileStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  RESIGNED = 'RESIGNED',
  TERMINATED = 'TERMINATED',
}

@Schema({
  timestamps: true,
  collection: 'teacher_profiles',
})
export class TeacherProfile {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // Unique index on userId (Requirement 3)
  })
  userId: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Institution',
    required: true,
    index: true,
  })
  institutionId: Types.ObjectId;

  @Prop({
    required: true,
    uppercase: true,
    trim: true,
  })
  employeeId: string;

  @Prop({
    type: [String],
    default: [],
  })
  qualification: string[];

  @Prop({
    type: [String],
    default: [],
  })
  specialization: string[];

  @Prop({
    type: Number,
    required: true,
    min: [0, 'Experience years cannot be negative'],
    default: 0,
  })
  experienceYears: number;

  @Prop({
    type: Date,
    required: true,
  })
  joiningDate: Date;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Class' }],
    default: [],
  })
  assignedClassIds: Types.ObjectId[];

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Subject' }],
    default: [],
  })
  assignedSubjectIds: Types.ObjectId[];

  @Prop({
    type: String,
    enum: Object.values(TeacherProfileStatus),
    default: TeacherProfileStatus.ACTIVE,
  })
  status: TeacherProfileStatus;

  createdAt?: Date;
  updatedAt?: Date;
}

export const TeacherProfileSchema = SchemaFactory.createForClass(TeacherProfile);

// Requirement 4: Unique compound index on institutionId + employeeId
TeacherProfileSchema.index({ institutionId: 1, employeeId: 1 }, { unique: true });
TeacherProfileSchema.index({ institutionId: 1, status: 1 });

