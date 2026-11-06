import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type RolePermissionDocument = RolePermission & Document;

@Schema({
  timestamps: true,
  collection: 'role_permissions',
})
export class RolePermission {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Role',
    required: [true, 'Role reference (roleId) is required'],
    index: true,
  })
  roleId: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Permission',
    required: [true, 'Permission reference (permissionId) is required'],
    index: true,
  })
  permissionId: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Institution',
    default: null,
  })
  institutionId: Types.ObjectId | null;

  @Prop({
    type: Boolean,
    default: true,
  })
  isAllowed: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const RolePermissionSchema =
  SchemaFactory.createForClass(RolePermission);

// Requirement 3 & 4: Partial compound indexes for institution-specific and system-level (null) mappings
// 1. Unique index for institution-specific role permissions
RolePermissionSchema.index(
  { roleId: 1, permissionId: 1, institutionId: 1 },
  {
    unique: true,
    partialFilterExpression: { institutionId: { $type: 'objectId' } },
  },
);

// 2. Unique index for platform/system-level role permissions (where institutionId is null)
RolePermissionSchema.index(
  { roleId: 1, permissionId: 1 },
  {
    unique: true,
    partialFilterExpression: { institutionId: null },
  },
);

