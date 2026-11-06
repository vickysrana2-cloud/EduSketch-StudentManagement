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
import { Institution, InstitutionDocument } from './schemas/institution.schema';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';
import { UpdateInstitutionStatusDto } from './dto/update-institution-status.dto';
import { CreateInstitutionAdminDto } from './dto/create-institution-admin.dto';
import { InstitutionStatus, InstitutionType } from './enums/institution.enums';
import { User, UserDocument } from '../users/schemas/user.schema';
import { UserRole, UserStatus } from '../users/enums/user.enums';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditAction } from '../audit-logs/enums/audit-action.enum';
import { AuditModule } from '../audit-logs/enums/audit-module.enum';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { escapeRegex } from '../common/utils/regex.util';

@Injectable()
export class InstitutionsService {
  private readonly logger = new Logger(InstitutionsService.name);

  constructor(
    @InjectModel(Institution.name)
    private readonly institutionModel: Model<InstitutionDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  /**
   * Helper method to validate MongoDB ObjectId
   */
  private validateObjectId(id: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid MongoDB ObjectId format: '${id}'`);
    }
    return new Types.ObjectId(id);
  }

  /**
   * Create a new Institution
   */
  async createInstitution(
    createInstitutionDto: CreateInstitutionDto,
  ): Promise<InstitutionDocument> {
    const normalizedCode = createInstitutionDto.code.trim().toUpperCase();

    // Check for existing institution code beforehand
    const existingInstitution = await this.institutionModel
      .findOne({ code: normalizedCode })
      .lean()
      .exec();

    if (existingInstitution) {
      throw new ConflictException(
        `Institution with code '${normalizedCode}' already exists`,
      );
    }

    try {
      const institutionData = {
        ...createInstitutionDto,
        code: normalizedCode,
        createdBy: this.validateObjectId(createInstitutionDto.createdBy),
      };

      const createdInstitution = new this.institutionModel(institutionData);
      return await createdInstitution.save();
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException(
          `Institution with code '${normalizedCode}' already exists`,
        );
      }
      this.logger.error(`Error creating institution: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        'Failed to create institution due to database error',
      );
    }
  }

  /**
   * Retrieve all institutions with optional filters
   */
  async getAllInstitutions(filter?: {
    status?: InstitutionStatus;
    type?: InstitutionType;
    search?: string;
  }): Promise<InstitutionDocument[]> {
    try {
      const query: Record<string, any> = {};

      if (filter?.status) {
        query.status = filter.status;
      }

      if (filter?.type) {
        query.type = filter.type;
      }

      if (filter?.search) {
        const sanitized = escapeRegex(filter.search.trim());
        const searchRegex = new RegExp(sanitized, 'i');
        query.$or = [{ name: searchRegex }, { code: searchRegex }];
      }

      return await this.institutionModel
        .find(query)
        .sort({ createdAt: -1 })
        .exec();
    } catch (error: any) {
      this.logger.error(`Error fetching institutions: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to retrieve institutions');
    }
  }

  /**
   * Get an institution by its MongoDB ID
   */
  async getInstitutionById(id: string): Promise<InstitutionDocument> {
    this.validateObjectId(id);

    const institution = await this.institutionModel.findById(id).exec();

    if (!institution) {
      throw new NotFoundException(`Institution with ID '${id}' not found`);
    }

    return institution;
  }

  /**
   * Update an existing institution
   */
  async updateInstitution(
    id: string,
    updateInstitutionDto: UpdateInstitutionDto,
  ): Promise<InstitutionDocument> {
    this.validateObjectId(id);

    // Normalize code if provided
    if (updateInstitutionDto.code) {
      updateInstitutionDto.code = updateInstitutionDto.code.trim().toUpperCase();

      const existingInstitution = await this.institutionModel
        .findOne({
          code: updateInstitutionDto.code,
          _id: { $ne: id },
        })
        .lean()
        .exec();

      if (existingInstitution) {
        throw new ConflictException(
          `Institution with code '${updateInstitutionDto.code}' already exists`,
        );
      }
    }

    const updatePayload: Record<string, any> = { ...updateInstitutionDto };
    if (updateInstitutionDto.createdBy) {
      updatePayload.createdBy = this.validateObjectId(
        updateInstitutionDto.createdBy,
      );
    }

    try {
      const updatedInstitution = await this.institutionModel
        .findByIdAndUpdate(id, { $set: updatePayload }, { new: true, runValidators: true })
        .exec();

      if (!updatedInstitution) {
        throw new NotFoundException(`Institution with ID '${id}' not found`);
      }

      return updatedInstitution;
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      if (error?.code === 11000) {
        throw new ConflictException(
          `Institution with code '${updateInstitutionDto.code}' already exists`,
        );
      }
      this.logger.error(
        `Error updating institution ID '${id}': ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to update institution');
    }
  }

  /**
   * Update institution status
   */
  async updateInstitutionStatus(
    id: string,
    updateInstitutionStatusDto: UpdateInstitutionStatusDto,
  ): Promise<InstitutionDocument> {
    this.validateObjectId(id);

    const updatedInstitution = await this.institutionModel
      .findByIdAndUpdate(
        id,
        { $set: { status: updateInstitutionStatusDto.status } },
        { new: true, runValidators: true },
      )
      .exec();

    if (!updatedInstitution) {
      throw new NotFoundException(`Institution with ID '${id}' not found`);
    }

    return updatedInstitution;
  }

  /**
   * TASK 18: Super Admin Create Institution Admin
   */
  async createInstitutionAdmin(
    institutionId: string,
    dto: CreateInstitutionAdminDto,
    currentUser?: AuthenticatedUser,
  ): Promise<UserDocument> {
    const instObjectId = this.validateObjectId(institutionId);

    // 1. Validate institution exists & is ACTIVE (Requirement 2)
    const institution = await this.institutionModel.findById(instObjectId).exec();
    if (!institution) {
      throw new NotFoundException(`Institution with ID '${institutionId}' does not exist`);
    }

    if (institution.status !== InstitutionStatus.ACTIVE) {
      throw new BadRequestException(
        `Cannot create administrator: Institution '${institution.name}' is not ACTIVE (current status: ${institution.status}).`,
      );
    }

    // 2. Reject duplicate email (Requirement 6)
    const normalizedEmail = dto.email.trim().toLowerCase();
    const existingUser = await this.userModel
      .findOne({ email: normalizedEmail })
      .lean()
      .exec();

    if (existingUser) {
      throw new ConflictException(
        `User with email '${normalizedEmail}' already exists`,
      );
    }

    // 3. Hash password with bcrypt (salt rounds: 12) (Requirement 5)
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // 4. Create User document with role ADMIN & institutionId from route (Requirements 3, 4, 7, 8)
    const newAdmin = new this.userModel({
      name: dto.name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: UserRole.ADMIN, // Strictly set on backend, cannot be escalated
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      institutionId: instObjectId, // From route param
      profileImage: dto.profileImage || null,
    });

    const savedAdmin = await newAdmin.save();

    // 5. Record action in AuditLogs (Requirement 9)
    await this.auditLogsService.logAction({
      userId: currentUser?.userId || savedAdmin._id.toString(),
      institutionId: instObjectId.toString(),
      action: AuditAction.USER_CREATED,
      module: AuditModule.USERS,
      description: `Super Admin created institutional administrator '${savedAdmin.name}' (${savedAdmin.email}) for institution '${institution.name}'`,
      targetId: savedAdmin._id.toString(),
      targetType: 'USER',
      metadata: {
        assignedRole: UserRole.ADMIN,
        institutionId: instObjectId.toString(),
        institutionCode: institution.code,
      },
    });

    this.logger.log(
      `Created administrator '${savedAdmin.email}' for institution '${institution.name}' (${institution.code})`,
    );

    // Return safe user document without passwordHash (Requirement 10)
    return (await this.userModel
      .findById(savedAdmin._id)
      .populate('institutionId', 'name code type status')
      .exec()) as UserDocument;
  }
}

