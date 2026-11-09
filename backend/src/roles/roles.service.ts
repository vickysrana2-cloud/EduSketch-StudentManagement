import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Role, RoleDocument } from './schemas/role.schema';
import { UserRole } from '../users/enums/user.enums';
import { RoleLevels } from './enums/role.enums';
import { UpdateRoleDto } from './dto/update-role.dto';

export const SYSTEM_ROLES_METADATA: Array<{
  name: UserRole;
  displayName: string;
  description: string;
  level: number;
  isSystemRole: boolean;
  isActive: boolean;
}> = [
  {
    name: UserRole.SUPER_ADMIN,
    displayName: 'Platform Super Administrator',
    description: 'Full platform-level access across all institutions',
    level: RoleLevels[UserRole.SUPER_ADMIN],
    isSystemRole: true,
    isActive: true,
  },
  {
    name: UserRole.ADMIN,
    displayName: 'Institution Administrator',
    description: 'Manages an individual institution and its users',
    level: RoleLevels[UserRole.ADMIN],
    isSystemRole: true,
    isActive: true,
  },
  {
    name: UserRole.TEACHER,
    displayName: 'Teacher',
    description: 'Manages classroom activities, courses, and student performance',
    level: RoleLevels[UserRole.TEACHER],
    isSystemRole: true,
    isActive: true,
  },
  {
    name: UserRole.STUDENT,
    displayName: 'Student',
    description: 'Enrolled learner with access to assigned courses and records',
    level: RoleLevels[UserRole.STUDENT],
    isSystemRole: true,
    isActive: true,
  },
];

@Injectable()
export class RolesService implements OnModuleInit {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    @InjectModel(Role.name)
    private readonly roleModel: Model<RoleDocument>,
  ) {}

  async onModuleInit() {
    try {
      await this.seedSystemRoles();
    } catch (err: any) {
      this.logger.error(`Failed to auto-seed system roles on startup: ${err.message}`);
    }
  }

  /**
   * Helper to validate a 24-character hexadecimal MongoDB ObjectId
   */
  private validateObjectId(id: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid MongoDB ObjectId format: '${id}'`);
    }
    return new Types.ObjectId(id);
  }

  /**
   * Seeds the four system roles idempotently (Requirements 5 & 6)
   */
  async seedSystemRoles(): Promise<{ created: number; updated: number; total: number }> {
    let created = 0;
    let updated = 0;

    for (const roleData of SYSTEM_ROLES_METADATA) {
      const existing = await this.roleModel.findOne({ name: roleData.name }).exec();
      if (!existing) {
        const newRole = new this.roleModel(roleData);
        await newRole.save();
        created++;
        this.logger.log(`Seeded system role: ${roleData.name} (Level ${roleData.level})`);
      } else {
        // Ensure system immutability flags remain consistent
        existing.level = roleData.level;
        existing.isSystemRole = true;
        await existing.save();
        updated++;
      }
    }

    return { created, updated, total: SYSTEM_ROLES_METADATA.length };
  }

  /**
   * Returns all roles sorted by hierarchical level descending
   */
  async findAll(): Promise<RoleDocument[]> {
    return await this.roleModel.find().sort({ level: -1 }).exec();
  }

  /**
   * Finds a single role by MongoDB ObjectId
   */
  async findById(id: string): Promise<RoleDocument> {
    this.validateObjectId(id);
    const role = await this.roleModel.findById(id).exec();
    if (!role) {
      throw new NotFoundException(`Role with ID '${id}' not found`);
    }
    return role;
  }

  /**
   * Finds a role by its unique system name
   */
  async findByName(name: UserRole): Promise<RoleDocument | null> {
    return await this.roleModel.findOne({ name }).exec();
  }

  /**
   * Updates role metadata (Requirements 8 & 10)
   * Only non-critical presentation fields (displayName, description, isActive) can be updated.
   * `name`, `level`, and `isSystemRole` cannot be changed to prevent bypassing the four-role architecture.
   */
  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<RoleDocument> {
    this.validateObjectId(id);

    const role = await this.roleModel.findById(id).exec();
    if (!role) {
      throw new NotFoundException(`Role with ID '${id}' not found`);
    }

    if (updateRoleDto.displayName !== undefined) {
      role.displayName = updateRoleDto.displayName.trim();
    }

    if (updateRoleDto.description !== undefined) {
      role.description = updateRoleDto.description.trim();
    }

    if (updateRoleDto.isActive !== undefined) {
      // Disallowing deactivation of SUPER_ADMIN
      if (role.name === UserRole.SUPER_ADMIN && updateRoleDto.isActive === false) {
        throw new BadRequestException('The SUPER_ADMIN role cannot be deactivated');
      }
      role.isActive = updateRoleDto.isActive;
    }

    const savedRole = await role.save();
    this.logger.log(`Role '${savedRole.name}' metadata updated successfully`);
    return savedRole;
  }
}

