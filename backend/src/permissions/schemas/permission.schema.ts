import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PermissionAction, PermissionModule } from '../enums/permission.enums';

export type PermissionDocument = Permission & Document;

@Schema({
  timestamps: true,
  collection: 'permissions',
})
export class Permission {
  @Prop({
    required: [true, 'Permission name is required'],
    unique: true, // Unique index on permission name (Requirement 2 & 9)
    type: String,
    trim: true,
    uppercase: true,
  })
  name: string;

  @Prop({
    required: [true, 'Permission module is required'],
    type: String,
    enum: {
      values: Object.values(PermissionModule),
      message: '{VALUE} is not a valid permission module',
    },
    index: true,
  })
  module: PermissionModule;

  @Prop({
    required: [true, 'Permission action is required'],
    type: String,
    enum: {
      values: Object.values(PermissionAction),
      message: '{VALUE} is not a valid permission action',
    },
    index: true,
  })
  action: PermissionAction;

  @Prop({
    required: [true, 'Permission description is required'],
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  })
  description: string;

  @Prop({
    required: true,
    type: Boolean,
    default: true,
  })
  isActive: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);

// Compound index on module and action
PermissionSchema.index({ module: 1, action: 1 }, { unique: true });

