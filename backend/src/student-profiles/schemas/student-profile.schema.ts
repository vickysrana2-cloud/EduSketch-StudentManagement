import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type StudentProfileDocument = StudentProfile & Document;

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum BloodGroup {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
}

export enum ParentRelationship {
  FATHER = 'FATHER',
  MOTHER = 'MOTHER',
  GUARDIAN = 'GUARDIAN',
  OTHER = 'OTHER',
}

export enum StudentProfileStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ALUMNI = 'ALUMNI',
  TRANSFERRED = 'TRANSFERRED',
  SUSPENDED = 'SUSPENDED',
}

@Schema({ _id: false })
export class StudentAddress {
  @Prop({ required: true, trim: true })
  street: string;

  @Prop({ required: true, trim: true })
  city: string;

  @Prop({ required: true, trim: true })
  state: string;

  @Prop({ required: true, trim: true })
  postalCode: string;
}

export const StudentAddressSchema = SchemaFactory.createForClass(StudentAddress);

@Schema({ _id: false })
export class ParentDetail {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, enum: Object.values(ParentRelationship) })
  relationship: ParentRelationship;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ type: String, lowercase: true, trim: true, default: null })
  email: string | null;
}

export const ParentDetailSchema = SchemaFactory.createForClass(ParentDetail);

@Schema({
  timestamps: true,
  collection: 'student_profiles',
})
export class StudentProfile {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // Unique index on userId (Requirement 5)
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
  admissionNumber: string;

  @Prop({
    type: Date,
    required: true,
  })
  dateOfBirth: Date;

  @Prop({
    type: String,
    enum: Object.values(Gender),
    required: true,
  })
  gender: Gender;

  @Prop({
    type: String,
    enum: Object.values(BloodGroup),
    default: null,
  })
  bloodGroup: BloodGroup | null;

  @Prop({
    type: StudentAddressSchema,
    required: true,
  })
  address: StudentAddress;

  @Prop({
    type: [ParentDetailSchema],
    default: [],
  })
  parentDetails: ParentDetail[];

  @Prop({
    type: String,
    enum: Object.values(StudentProfileStatus),
    default: StudentProfileStatus.ACTIVE,
  })
  status: StudentProfileStatus;

  createdAt?: Date;
  updatedAt?: Date;
}

export const StudentProfileSchema = SchemaFactory.createForClass(StudentProfile);

// Requirement 4: Unique compound index on institutionId + admissionNumber
StudentProfileSchema.index({ institutionId: 1, admissionNumber: 1 }, { unique: true });
// Additional performance index for status & institution queries
StudentProfileSchema.index({ institutionId: 1, status: 1 });
