import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  SubscriptionPlan,
  SubscriptionStatus,
} from '../enums/institution.enums';

@Schema({ _id: false })
export class Subscription {
  @Prop({
    type: String,
    enum: SubscriptionPlan,
    default: SubscriptionPlan.BASIC,
    required: true,
  })
  plan: SubscriptionPlan;

  @Prop({
    type: String,
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
    required: true,
  })
  status: SubscriptionStatus;

  @Prop({ required: true, type: Date })
  startDate: Date;

  @Prop({ required: true, type: Date })
  endDate: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

