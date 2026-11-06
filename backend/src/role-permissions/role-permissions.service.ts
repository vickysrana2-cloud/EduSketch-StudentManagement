import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  RolePermission,
  RolePermissionDocument,
} from './schemas/role-permission.schema';
import { Role, RoleDocument } from '../roles/schemas/role.schema';
import {
  Permission,
  PermissionDocument,
} from '../permissions/schemas/permission.schema';
import {
  Institution,
  InstitutionDocument,
} from '../institutions/schemas/institution.schema';
import { UserRole } from '../users/enums/user.enums';
import { AssignRolePermissionDto } from './dto/assign-role-permission.dto';

/**
 * Standard policy mapping definitions for seeding
 */
export const INITIAL_ROLE_PERMISSIONS_POLICY: Record<UserRole, string[]> = {
  [UserRole.SUPER_ADMIN]: [
    // Universal platform governance
    'INSTITUTION_CREATE',
    'INSTITUTION_READ',
    'INSTITUTION_UPDATE',
    'INSTITUTION_DELETE',
    'INSTITUTION_MANAGE',
    'USER_CREATE',
    'USER_READ',
    'USER_UPDATE',
    'USER_DELETE',
    'USER_MANAGE',
    'STUDENT_CREATE',
    'STUDENT_READ',
    'STUDENT_UPDATE',
    'STUDENT_DELETE',
    'STUDENT_MANAGE',
    'TEACHER_CREATE',
    'TEACHER_READ',
    'TEACHER_UPDATE',
    'TEACHER_DELETE',
    'TEACHER_MANAGE',
    'CLASS_CREATE',
    'CLASS_READ',
    'CLASS_UPDATE',
    'CLASS_DELETE',
    'CLASS_MANAGE',
    'SUBJECT_CREATE',
    'SUBJECT_READ',
    'SUBJECT_UPDATE',
    'SUBJECT_DELETE',
    'SUBJECT_MANAGE',
    'ATTENDANCE_CREATE',
    'ATTENDANCE_READ',
    'ATTENDANCE_UPDATE',
    'ATTENDANCE_DELETE',
    'ATTENDANCE_MANAGE',
    'EXAMINATION_CREATE',
    'EXAMINATION_READ',
    'EXAMINATION_UPDATE',
    'EXAMINATION_DELETE',
    'EXAMINATION_MANAGE',
    'RESULT_CREATE',
    'RESULT_READ',
    'RESULT_UPDATE',
    'RESULT_DELETE',
    'RESULT_MANAGE',
    'FEE_CREATE',
    'FEE_READ',
    'FEE_UPDATE',
    'FEE_DELETE',
    'FEE_MANAGE',
  ],
  [UserRole.ADMIN]: [
    // Institutional administration (excluding institution deletion)
    'INSTITUTION_READ',
    'INSTITUTION_UPDATE',
    'USER_CREATE',
    'USER_READ',
    'USER_UPDATE',
    'USER_DELETE',
    'USER_MANAGE',
    'STUDENT_CREATE',
    'STUDENT_READ',
    'STUDENT_UPDATE',
    'STUDENT_DELETE',
    'STUDENT_MANAGE',
    'TEACHER_CREATE',
    'TEACHER_READ',
    'TEACHER_UPDATE',
    'TEACHER_DELETE',
    'TEACHER_MANAGE',
    'CLASS_CREATE',
    'CLASS_READ',
    'CLASS_UPDATE',
    'CLASS_DELETE',
    'CLASS_MANAGE',
    'SUBJECT_CREATE',
    'SUBJECT_READ',
    'SUBJECT_UPDATE',
    'SUBJECT_DELETE',
    'SUBJECT_MANAGE',
    'ATTENDANCE_READ',
    'ATTENDANCE_UPDATE',
    'ATTENDANCE_MANAGE',
    'EXAMINATION_CREATE',
    'EXAMINATION_READ',
    'EXAMINATION_UPDATE',
    'EXAMINATION_DELETE',
    'EXAMINATION_MANAGE',
    'RESULT_READ',
    'RESULT_UPDATE',
    'RESULT_MANAGE',
    'FEE_CREATE',
    'FEE_READ',
    'FEE_UPDATE',
    'FEE_DELETE',
    'FEE_MANAGE',
  ],
  [UserRole.TEACHER]: [
    // Assigned academic and attendance operations
    'STUDENT_READ',
    'TEACHER_READ',
    'CLASS_READ',
    'SUBJECT_READ',
    'ATTENDANCE_CREATE',
    'ATTENDANCE_READ',
    'ATTENDANCE_UPDATE',
    'EXAMINATION_READ',
    'RESULT_CREATE',
    'RESULT_READ',
    'RESULT_UPDATE',
  ],
  [UserRole.STUDENT]: [
    // Self-service and student academic visibility
    'STUDENT_READ',
    'CLASS_READ',
    'SUBJECT_READ',
    'ATTENDANCE_READ',
    'EXAMINATION_READ',
    'RESULT_READ',
    'FEE_READ',
  ],
};

@Injectable()
export class RolePermissionsService {
  private readonly logger = new Logger(RolePermissionsService.name);

  // In-memory cache for ultra-fast permission checks (Task 17 Requirement 3 & 4)
  private readonly permissionCache = new Map<
    string,
    { permissions: string[]; expiry: number }
  >();

  constructor(
    @InjectModel(RolePermission.name)
    private readonly rolePermissionModel: Model<RolePermissionDocument>,
    @InjectModel(Role.name)
    private readonly roleModel: Model<RoleDocument>,
    @InjectModel(Permission.name)
    private readonly permissionModel: Model<PermissionDocument>,
    @InjectModel(Institution.name)
    private readonly institutionModel: Model<InstitutionDocument>,
  ) {}

  /**
   * Helper to validate MongoDB ObjectId
   */
  private validateObjectId(id: string, name = 'ID'): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid MongoDB ObjectId format for ${name}: '${id}'`);
    }
    return new Types.ObjectId(id);
  }

  /**
   * Assigns or updates a role-permission mapping (Requirements 5, 6, 9, 10, 11)
   */
  async assignPermission(
    dto: AssignRolePermissionDto,
    currentUser: { userId: string; role: UserRole; institutionId: string | null },
  ): Promise<RolePermissionDocument> {
    const roleId = this.validateObjectId(dto.roleId, 'roleId');
    const permissionId = this.validateObjectId(dto.permissionId, 'permissionId');

    // 5. Validate that role and permission exist
    const [role, permission] = await Promise.all([
      this.roleModel.findById(roleId).exec(),
      this.permissionModel.findById(permissionId).exec(),
    ]);

    if (!role) {
      throw new NotFoundException(`Role with ID '${dto.roleId}' does not exist`);
    }
    if (!permission) {
      throw new NotFoundException(`Permission with ID '${dto.permissionId}' does not exist`);
    }

    // 11. Multi-tenant security: Prevent non-SUPER_ADMIN from modifying platform-level permissions
    let targetInstitutionId: Types.ObjectId | null = null;

    if (dto.institutionId) {
      const instId = this.validateObjectId(dto.institutionId, 'institutionId');
      const institution = await this.institutionModel.findById(instId).exec();
      if (!institution) {
        throw new NotFoundException(`Institution with ID '${dto.institutionId}' does not exist`);
      }

      // If user is ADMIN, they can only modify overrides for their OWN institution
      if (currentUser.role === UserRole.ADMIN) {
        if (!currentUser.institutionId || currentUser.institutionId !== dto.institutionId) {
          throw new ForbiddenException(
            'Unauthorized: Institution Admins can only configure overrides for their own institution.',
          );
        }
      } else if (currentUser.role !== UserRole.SUPER_ADMIN) {
        throw new ForbiddenException(
          'Unauthorized: You do not have permission to manage role permissions.',
        );
      }

      targetInstitutionId = instId;
    } else {
      // System-level mapping (institutionId: null) requires SUPER_ADMIN
      if (currentUser.role !== UserRole.SUPER_ADMIN) {
        throw new ForbiddenException(
          'Unauthorized: Only a SUPER_ADMIN can manage system-level role permissions (institutionId: null).',
        );
      }
      targetInstitutionId = null;
    }

    const query: any = {
      roleId,
      permissionId,
      institutionId: targetInstitutionId,
    };

    const isAllowed = dto.isAllowed !== undefined ? dto.isAllowed : true;

    const existing = await this.rolePermissionModel.findOne(query).exec();

    if (existing) {
      existing.isAllowed = isAllowed;
      const updated = await existing.save();
      this.logger.log(
        `Updated RolePermission: Role '${role.name}', Permission '${permission.name}', Institution: ${targetInstitutionId || 'SYSTEM'}, Allowed: ${isAllowed}`,
      );
      this.clearPermissionCache();
      return updated;
    }

    const newMapping = new this.rolePermissionModel({
      roleId,
      permissionId,
      institutionId: targetInstitutionId,
      isAllowed,
    });

    const saved = await newMapping.save();
    this.logger.log(
      `Assigned RolePermission: Role '${role.name}', Permission '${permission.name}', Institution: ${targetInstitutionId || 'SYSTEM'}, Allowed: ${isAllowed}`,
    );
    this.clearPermissionCache();
    return saved;
  }

  /**
   * Removes a role-permission mapping (Requirement 7)
   */
  async revokePermission(
    roleIdStr: string,
    permissionIdStr: string,
    institutionIdStr?: string | null,
    currentUser?: { userId: string; role: UserRole; institutionId: string | null },
  ): Promise<{ message: string }> {
    const roleId = this.validateObjectId(roleIdStr, 'roleId');
    const permissionId = this.validateObjectId(permissionIdStr, 'permissionId');

    let targetInstitutionId: Types.ObjectId | null = null;
    if (institutionIdStr) {
      targetInstitutionId = this.validateObjectId(institutionIdStr, 'institutionId');
    }

    if (currentUser) {
      if (!targetInstitutionId && currentUser.role !== UserRole.SUPER_ADMIN) {
        throw new ForbiddenException(
          'Unauthorized: Only a SUPER_ADMIN can remove system-level role permissions.',
        );
      }
      if (
        targetInstitutionId &&
        currentUser.role === UserRole.ADMIN &&
        currentUser.institutionId !== institutionIdStr
      ) {
        throw new ForbiddenException(
          'Unauthorized: Institution Admins can only remove overrides for their own institution.',
        );
      }
    }

    const query: any = {
      roleId,
      permissionId,
      institutionId: targetInstitutionId,
    };

    const result = await this.rolePermissionModel.findOneAndDelete(query).exec();

    if (!result) {
      throw new NotFoundException('Role-permission mapping not found');
    }

    this.logger.log(
      `Revoked RolePermission: Role '${roleIdStr}', Permission '${permissionIdStr}', Institution: ${institutionIdStr || 'SYSTEM'}`,
    );

    this.clearPermissionCache();

    return { message: 'Role-permission mapping revoked successfully.' };
  }

  /**
   * Retrieves effective permissions for a role with institution overrides (Requirement 8, 9, 10)
   */
  async getPermissionsByRole(
    roleIdStr: string,
    institutionIdStr?: string | null,
  ): Promise<RolePermissionDocument[]> {
    const roleId = this.validateObjectId(roleIdStr, 'roleId');

    // 1. Fetch system-level permissions for this role
    const systemMappings = await this.rolePermissionModel
      .find({ roleId, institutionId: null })
      .populate('roleId', 'name displayName level')
      .populate('permissionId', 'name module action description')
      .exec();

    if (!institutionIdStr) {
      return systemMappings.filter((m) => m.isAllowed);
    }

    // 2. Fetch institution-specific overrides
    const instId = this.validateObjectId(institutionIdStr, 'institutionId');
    const overrides = await this.rolePermissionModel
      .find({ roleId, institutionId: instId })
      .populate('roleId', 'name displayName level')
      .populate('permissionId', 'name module action description')
      .exec();

    // Map system permissions with overrides overlaid
    const mappingMap = new Map<string, RolePermissionDocument>();

    for (const mapping of systemMappings) {
      const permId = mapping.permissionId ? (mapping.permissionId as any)._id?.toString() || mapping.permissionId.toString() : '';
      mappingMap.set(permId, mapping);
    }

    // Overlay institution overrides
    for (const override of overrides) {
      const permId = override.permissionId ? (override.permissionId as any)._id?.toString() || override.permissionId.toString() : '';
      mappingMap.set(permId, override);
    }

    // Return only active and allowed permissions
    return Array.from(mappingMap.values()).filter((m) => m.isAllowed);
  }

  /**
   * High-performance permission resolver for PermissionsGuard (Task 17 Requirement 2, 3, 4, 5)
   * Resolves permission string names for a role and optional institution with short-TTL caching
   * and immediate invalidation on policy mutation.
   */
  async getEffectivePermissions(
    roleName: UserRole,
    institutionIdStr?: string | null,
  ): Promise<string[]> {
    const cacheKey = `${roleName}:${institutionIdStr || 'GLOBAL'}`;
    const cached = this.permissionCache.get(cacheKey);
    const now = Date.now();

    if (cached && cached.expiry > now) {
      return cached.permissions;
    }

    const role = await this.roleModel.findOne({ name: roleName }).exec();
    if (!role) {
      return [];
    }

    const mappings = await this.getPermissionsByRole(
      role._id.toString(),
      institutionIdStr,
    );

    const permissionNames: string[] = [];
    for (const mapping of mappings) {
      const permObj = mapping.permissionId as any;
      if (permObj && permObj.name) {
        permissionNames.push(permObj.name);
      }
    }

    // Cache results for 60 seconds (high performance, self-healing)
    this.permissionCache.set(cacheKey, {
      permissions: permissionNames,
      expiry: now + 60 * 1000,
    });

    return permissionNames;
  }

  /**
   * Invalidate in-memory permission cache (Task 17 Requirement 4)
   */
  clearPermissionCache(): void {
    this.permissionCache.clear();
  }

  /**
   * Idempotent seed script for initial role-permission policy (Requirement 12)
   */
  async seedRolePermissions(): Promise<{
    created: number;
    updated: number;
    totalPolicies: number;
  }> {
    let created = 0;
    let updated = 0;
    let totalPolicies = 0;

    const roles = await this.roleModel.find().exec();
    const permissions = await this.permissionModel.find().exec();

    const permMapByName = new Map<string, PermissionDocument>();
    for (const p of permissions) {
      permMapByName.set(p.name, p);
    }

    for (const role of roles) {
      const allowedNames = INITIAL_ROLE_PERMISSIONS_POLICY[role.name] || [];
      totalPolicies += allowedNames.length;

      for (const permName of allowedNames) {
        const perm = permMapByName.get(permName);
        if (!perm) {
          this.logger.warn(`Permission '${permName}' not found in catalog; skipping.`);
          continue;
        }

        const existing = await this.rolePermissionModel
          .findOne({
            roleId: role._id,
            permissionId: perm._id,
            institutionId: null,
          })
          .exec();

        if (!existing) {
          const newMapping = new this.rolePermissionModel({
            roleId: role._id,
            permissionId: perm._id,
            institutionId: null,
            isAllowed: true,
          });
          await newMapping.save();
          created++;
        } else {
          existing.isAllowed = true;
          await existing.save();
          updated++;
        }
      }
    }

    this.logger.log(
      `Role-Permissions seeding complete: ${created} created, ${updated} verified/updated (Total Policies: ${totalPolicies})`,
    );

    this.clearPermissionCache();

    return { created, updated, totalPolicies };
  }
}

