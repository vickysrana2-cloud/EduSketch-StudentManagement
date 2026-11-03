import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';
import { Institution, InstitutionDocument } from '../institutions/schemas/institution.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole, UserStatus } from './enums/user.enums';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Institution.name)
    private readonly institutionModel: Model<InstitutionDocument>,
  ) {}

  /**
   * Helper to validate a 24-character hexadecimal MongoDB ObjectId
   */
  private validateObjectId(id: string, fieldName = 'ID'): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(
        `Invalid MongoDB ObjectId format for ${fieldName}: '${id}'`,
      );
    }
    return new Types.ObjectId(id);
  }

  /**
   * Helper to validate business rules for role and institutionId
   */
  private async validateRoleAndInstitution(
    role: UserRole,
    institutionId?: string | null,
  ): Promise<Types.ObjectId | null> {
    if (role === UserRole.SUPER_ADMIN) {
      if (institutionId) {
        throw new BadRequestException(
          'Super Admin must not be associated with any institution. institutionId must be null.',
        );
      }
      return null;
    }

    // For ADMIN, TEACHER, STUDENT
    if (!institutionId) {
      throw new BadRequestException(
        `institutionId is required for user with role '${role}'`,
      );
    }

    const objId = this.validateObjectId(institutionId, 'institutionId');
    const institutionExists = await this.institutionModel
      .exists({ _id: objId })
      .exec();

    if (!institutionExists) {
      throw new NotFoundException(
        `Institution with ID '${institutionId}' does not exist`,
      );
    }

    return objId;
  }

  /**
   * Create a new user with hashed password and role-institution validation
   */
  async createUser(createUserDto: CreateUserDto): Promise<UserDocument> {
    const normalizedEmail = createUserDto.email.trim().toLowerCase();

    // Check email uniqueness
    const existingUser = await this.userModel
      .findOne({ email: normalizedEmail })
      .lean()
      .exec();

    if (existingUser) {
      throw new ConflictException(
        `User with email '${normalizedEmail}' already exists`,
      );
    }

    // Validate role and institution constraints
    const institutionObjectId = await this.validateRoleAndInstitution(
      createUserDto.role,
      createUserDto.institutionId,
    );

    // Hash the plaintext password (salt rounds: 12)
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(createUserDto.password, salt);

    try {
      const newUser = new this.userModel({
        name: createUserDto.name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: createUserDto.role,
        status: createUserDto.status ?? UserStatus.ACTIVE,
        isEmailVerified: createUserDto.isEmailVerified ?? false,
        institutionId: institutionObjectId,
        profileImage: createUserDto.profileImage ?? null,
      });

      const savedUser = await newUser.save();

      // Return user without passwordHash
      return (await this.findUserById(savedUser._id.toString())) as UserDocument;
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException(
          `User with email '${normalizedEmail}' already exists`,
        );
      }
      this.logger.error(`Error creating user: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  /**
   * Find a user by their email address (passwordHash excluded)
   */
  async findUserByEmail(email: string): Promise<UserDocument | null> {
    const normalizedEmail = email.trim().toLowerCase();
    return await this.userModel
      .findOne({ email: normalizedEmail })
      .populate('institutionId', 'name code type status')
      .exec();
  }

  /**
   * Find a user by their MongoDB ObjectId (passwordHash excluded)
   */
  async findUserById(id: string): Promise<UserDocument> {
    this.validateObjectId(id);

    const user = await this.userModel
      .findById(id)
      .populate('institutionId', 'name code type status')
      .exec();

    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    return user;
  }

  /**
   * Find a user by ID and explicitly include passwordHash for internal authentication
   */
  async findUserByIdWithPassword(id: string): Promise<UserDocument> {
    this.validateObjectId(id);

    const user = await this.userModel
      .findById(id)
      .select('+passwordHash')
      .populate('institutionId', 'name code type status')
      .exec();

    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    return user;
  }

  /**
   * Find all users belonging to a specific institution with optional filters
   */
  async findUsersByInstitution(
    institutionId: string,
    filter?: {
      role?: UserRole;
      status?: UserStatus;
      search?: string;
    },
  ): Promise<UserDocument[]> {
    const objId = this.validateObjectId(institutionId, 'institutionId');

    // Verify institution exists
    const institutionExists = await this.institutionModel
      .exists({ _id: objId })
      .exec();

    if (!institutionExists) {
      throw new NotFoundException(
        `Institution with ID '${institutionId}' does not exist`,
      );
    }

    const query: Record<string, any> = { institutionId: objId };

    if (filter?.role) {
      query.role = filter.role;
    }

    if (filter?.status) {
      query.status = filter.status;
    }

    if (filter?.search) {
      const searchRegex = new RegExp(filter.search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    return await this.userModel
      .find(query)
      .sort({ createdAt: -1 })
      .populate('institutionId', 'name code type status')
      .exec();
  }

  /**
   * Update an existing user
   */
  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    this.validateObjectId(id);

    const existingUser = await this.userModel.findById(id).exec();
    if (!existingUser) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    const updatePayload: Record<string, any> = {};

    // Check email uniqueness if changing email
    if (updateUserDto.email) {
      const normalizedEmail = updateUserDto.email.trim().toLowerCase();
      if (normalizedEmail !== existingUser.email) {
        const emailTaken = await this.userModel
          .findOne({ email: normalizedEmail, _id: { $ne: id } })
          .lean()
          .exec();

        if (emailTaken) {
          throw new ConflictException(
            `Email '${normalizedEmail}' is already taken by another user`,
          );
        }
      }
      updatePayload.email = normalizedEmail;
    }

    if (updateUserDto.name !== undefined) {
      updatePayload.name = updateUserDto.name.trim();
    }

    if (updateUserDto.profileImage !== undefined) {
      updatePayload.profileImage = updateUserDto.profileImage;
    }

    if (updateUserDto.isEmailVerified !== undefined) {
      updatePayload.isEmailVerified = updateUserDto.isEmailVerified;
    }

    if (updateUserDto.status !== undefined) {
      updatePayload.status = updateUserDto.status;
    }

    // If updating password
    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt(12);
      updatePayload.passwordHash = await bcrypt.hash(updateUserDto.password, salt);
      updatePayload.passwordChangedAt = new Date();
    }

    // If updating role or institutionId
    const targetRole = updateUserDto.role ?? existingUser.role;
    const targetInstitutionId =
      updateUserDto.institutionId !== undefined
        ? updateUserDto.institutionId
        : existingUser.institutionId?.toString();

    if (
      updateUserDto.role !== undefined ||
      updateUserDto.institutionId !== undefined
    ) {
      const validInstitutionId = await this.validateRoleAndInstitution(
        targetRole,
        targetInstitutionId,
      );
      updatePayload.role = targetRole;
      updatePayload.institutionId = validInstitutionId;
    }

    try {
      const updatedUser = await this.userModel
        .findByIdAndUpdate(
          id,
          { $set: updatePayload },
          { new: true, runValidators: true },
        )
        .populate('institutionId', 'name code type status')
        .exec();

      if (!updatedUser) {
        throw new NotFoundException(`User with ID '${id}' not found`);
      }

      return updatedUser;
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      if (error?.code === 11000) {
        throw new ConflictException('Email already in use by another account');
      }
      this.logger.error(`Error updating user: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to update user');
    }
  }

  /**
   * Update user operational status
   */
  async updateUserStatus(
    id: string,
    status: UserStatus,
  ): Promise<UserDocument> {
    this.validateObjectId(id);

    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        id,
        { $set: { status } },
        { new: true, runValidators: true },
      )
      .populate('institutionId', 'name code type status')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    return updatedUser;
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: string): Promise<UserDocument> {
    this.validateObjectId(id);

    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        id,
        { $set: { lastLoginAt: new Date() } },
        { new: true },
      )
      .populate('institutionId', 'name code type status')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    return updatedUser;
  }

  /**
   * Helper to retrieve all users with pagination/filtering (for admin queries)
   */
  async findAllUsers(filter?: {
    role?: UserRole;
    status?: UserStatus;
    institutionId?: string;
    search?: string;
  }): Promise<UserDocument[]> {
    const query: Record<string, any> = {};

    if (filter?.role) {
      query.role = filter.role;
    }

    if (filter?.status) {
      query.status = filter.status;
    }

    if (filter?.institutionId) {
      query.institutionId = this.validateObjectId(
        filter.institutionId,
        'institutionId',
      );
    }

    if (filter?.search) {
      const searchRegex = new RegExp(filter.search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    return await this.userModel
      .find(query)
      .sort({ createdAt: -1 })
      .populate('institutionId', 'name code type status')
      .exec();
  }
}

