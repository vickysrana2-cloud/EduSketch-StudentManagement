import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { UserRole, UserStatus } from '../enums/user.enums';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  collection: 'users',
  toJSON: {
    transform: (_doc, ret: Record<string, any>) => {
      delete ret.passwordHash;
      return ret;
    },
  },
})
export class User {
  @Prop({
    required: [true, 'User name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
  })
  name: string;

  @Prop({
    required: [true, 'Email is required'],
    unique: true, // Creates unique index { email: 1 }
    lowercase: true,
    trim: true,
    match: [
      /^\S+@\S+\.\S+$/,
      'Please enter a valid email address',
    ],
  })
  email: string;

  @Prop({
    required: [true, 'Password hash is required'],
    select: false, // Excluded from normal queries by default
  })
  passwordHash: string;

  @Prop({
    required: [true, 'User role is required'],
    type: String,
    enum: {
      values: Object.values(UserRole),
      message: '{VALUE} is not a valid user role',
    },
  })
  role: UserRole;

  @Prop({
    type: String,
    enum: {
      values: Object.values(UserStatus),
      message: '{VALUE} is not a valid user status',
    },
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Prop({
    type: Boolean,
    default: false,
  })
  isEmailVerified: boolean;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Institution',
    default: null,
    validate: {
      validator: function (this: UserDocument | any, value: Types.ObjectId | null) {
        // Enforce institution consistency at the database schema level
        const currentRole = this.role || (this.get && this.get('role'));
        if (currentRole === UserRole.SUPER_ADMIN) {
          return value === null || value === undefined;
        }
        if (currentRole && currentRole !== UserRole.SUPER_ADMIN) {
          return value !== null && value !== undefined && Types.ObjectId.isValid(value);
        }
        return true;
      },
      message:
        'Data integrity violation: Super Admin must have null institutionId, whereas ADMIN, TEACHER, and STUDENT require a valid institution reference',
    },
  })
  institutionId: Types.ObjectId | null;

  @Prop({
    type: String,
    default: null,
  })
  profileImage: string | null;

  @Prop({
    type: Date,
    default: null,
  })
  lastLoginAt: Date | null;

  @Prop({
    type: Date,
    default: null,
  })
  passwordChangedAt: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// --------------------------------------------------------------------------
// Database Indexes
// --------------------------------------------------------------------------
// 1. Unique index on 'email' is automatically managed via @Prop({ unique: true })
// 2. High-performance compound index for multi-tenant queries:
UserSchema.index({ institutionId: 1, role: 1, status: 1 });
// 3. Status index for auditing and active account queries:
UserSchema.index({ status: 1 });
// 4. Role index for global administrative filtering:
UserSchema.index({ role: 1 });
// Note: Separate indexes on { institutionId: 1 } and { institutionId: 1, role: 1 }
// are deliberately avoided to prevent redundant B-tree storage, as MongoDB's compound
// index prefix rule uses { institutionId: 1, role: 1, status: 1 } for those lookups.
