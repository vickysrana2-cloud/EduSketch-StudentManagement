import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '../../users/enums/user.enums';

export type RoleDocument = Role & Document;

@Schema({
  timestamps: true,
  collection: 'roles',
})
export class Role {
  @Prop({
    required: [true, 'Role name is required'],
    unique: true, // Creates unique index on role name (Requirement 4)
    type: String,
    enum: {
      values: Object.values(UserRole),
      message: '{VALUE} is not a valid system role. Arbitrary roles are not permitted.',
    },
    trim: true,
  })
  name: UserRole;

  @Prop({
    required: [true, 'Display name is required'],
    trim: true,
    minlength: [2, 'Display name must be at least 2 characters long'],
  })
  displayName: string;

  @Prop({
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  })
  description: string;

  @Prop({
    required: true,
    type: Number,
    min: 1,
    max: 10,
  })
  level: number;

  @Prop({
    required: true,
    type: Boolean,
    default: true,
  })
  isSystemRole: boolean;

  @Prop({
    required: true,
    type: Boolean,
    default: true,
  })
  isActive: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const RoleSchema = SchemaFactory.createForClass(Role);

