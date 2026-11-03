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
import { Institution, InstitutionDocument } from './schemas/institution.schema';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';
import { UpdateInstitutionStatusDto } from './dto/update-institution-status.dto';
import { InstitutionStatus, InstitutionType } from './enums/institution.enums';

@Injectable()
export class InstitutionsService {
  private readonly logger = new Logger(InstitutionsService.name);

  constructor(
    @InjectModel(Institution.name)
    private readonly institutionModel: Model<InstitutionDocument>,
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
        const searchRegex = new RegExp(filter.search.trim(), 'i');
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
}

