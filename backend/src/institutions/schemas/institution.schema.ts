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
})
export class Institution {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  })
  code: string;

  @Prop({
    required: true,
    type: String,
    enum: InstitutionType,
  })
  type: InstitutionType;

  @Prop({
    required: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ type: AddressSchema, required: true })
  address: Address;

  @Prop({ type: String, default: null })
  logo: string | null;

  @Prop({
    type: String,
    enum: InstitutionStatus,
    default: InstitutionStatus.ACTIVE,
  })
  status: InstitutionStatus;

  @Prop({ type: SubscriptionSchema, required: true })
  subscription: Subscription;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  createdBy: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const InstitutionSchema = SchemaFactory.createForClass(Institution);

// Indexes (Note: 'code' unique index is already defined via @Prop({ unique: true }))
InstitutionSchema.index({ status: 1 });
InstitutionSchema.index({ name: 1 });
