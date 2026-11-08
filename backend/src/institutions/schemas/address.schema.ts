import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class Address {
  @Prop({ required: true, trim: true })
  street: string;

  @Prop({ required: true, trim: true })
  city: string;

  @Prop({ required: true, trim: true })
  state: string;

  @Prop({ required: false, default: 'India', trim: true })
  country: string;

  @Prop({ required: true, trim: true })
  postalCode: string;
}

export const AddressSchema = SchemaFactory.createForClass(Address);

