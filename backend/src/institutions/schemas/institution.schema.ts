import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import {
  InstitutionStatus,
  InstitutionType,
} from '../enums/institution.enums';
import { Address, AddressSchema } from './address.schema';
import { Subscription, SubscriptionSchema } from './subscription.schema';

export type InstitutionDocument = Institution & Document;

@Schema({
  timestamps: true,
  collection: 'institutions',
  toJSON: {
    virtuals: true,
    transform: (_, ret: any) => {
      ret.id = ret._id ? ret._id.toString() : ret.id;
      return ret;
    },
  },
  toObject: {
    virtuals: true,
  },
})
export class Institution {
  @Prop({
    required: [true, 'Institution name is required'],
    trim: true,
    minlength: [2, 'Institution name must be at least 2 characters long'],
  })
  name: string;

  @Prop({
    required: [true, 'Institution code is required'],
    unique: true, // Creates unique index { code: 1 }
    uppercase: true,
    trim: true,
    match: [
      /^[A-Z0-9_-]+$/,
      'Institution code must only contain alphanumeric characters, underscores, or hyphens',
    ],
  })
  code: string;

  @Prop({
    required: [true, 'Institution type is required'],
    type: String,
    enum: {
      values: Object.values(InstitutionType),
      message: '{VALUE} is not a valid institution type',
    },
  })
  type: InstitutionType;

  @Prop({
    required: [true, 'Contact email is required'],
    lowercase: true,
    trim: true,
    match: [
      /^\S+@\S+\.\S+$/,
      'Please enter a valid email address',
    ],
  })
  email: string;

  @Prop({
    required: [true, 'Phone number is required'],
    trim: true,
    match: [
      /^\+?[1-9]\d{7,14}$/,
      'Please enter a valid phone number with optional country code',
    ],
  })
  phone: string;

  @Prop({
    type: AddressSchema,
    required: [true, 'Institution address is required'],
  })
  address: Address;

  @Prop({ type: String, default: null })
  logo: string | null;

  @Prop({
    type: String,
    enum: {
      values: Object.values(InstitutionStatus),
      message: '{VALUE} is not a valid institution status',
    },
    default: InstitutionStatus.ACTIVE,
  })
  status: InstitutionStatus;

  @Prop({
    type: SubscriptionSchema,
    required: [true, 'Subscription details are required'],
  })
  subscription: Subscription;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: [true, 'createdBy reference is required'],
    validate: {
      validator: (v: any) => Types.ObjectId.isValid(v),
      message: 'createdBy must be a valid MongoDB ObjectId referencing User',
    },
  })
  createdBy: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const InstitutionSchema = SchemaFactory.createForClass(Institution);

// --------------------------------------------------------------------------
// Database Indexes
// --------------------------------------------------------------------------
// 1. Unique index on 'code' is automatically managed via @Prop({ unique: true })
// 2. Compound index for filtered queries by status and sorting/filtering by name:
InstitutionSchema.index({ status: 1, name: 1 });
// 3. Name index for standalone name searches without status filter:
InstitutionSchema.index({ name: 1 });
// Note: Standalone { status: 1 } index is omitted to prevent redundancy, as
// { status: 1, name: 1 } already fulfills prefix queries on status.
