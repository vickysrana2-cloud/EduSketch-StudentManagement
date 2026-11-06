import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { UserRole } from '../../users/enums/user.enums';
import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';

export interface TenantScopedEntity {
  institutionId?: Types.ObjectId | string | null;
  [key: string]: any;
}

export interface ReferencedEntityCheck {
  name: string;
  institutionId?: Types.ObjectId | string | null;
}

/**
 * ============================================================================
 * Centralized Multi-Tenant Context & Data Isolation Service (TASK 28)
 * ============================================================================
 * Enforces strict tenant isolation across all database operations.
 * - Guarantees school-level users can NEVER access or manipulate another school's data.
 * - Prevents ObjectId manipulation and cross-institution reference attacks.
 * - Enforces auditable tenant scoping on all queries, pagination, and aggregations.
 */
@Injectable()
export class TenantContextService {
  private readonly logger = new Logger(TenantContextService.name);

  /**
   * Validates and converts an ID string into a strict MongoDB ObjectId (Requirement 10)
   */
  validateObjectId(id: string, name = 'ID'): Types.ObjectId {
    if (!id || typeof id !== 'string' || !Types.ObjectId.isValid(id)) {
      throw new BadRequestException(
        `Invalid MongoDB ObjectId format for ${name}: '${id}'`,
      );
    }
    return new Types.ObjectId(id);
  }

  /**
   * Resolves the authoritative institutionId for the current operation (Requirements 2 & 3)
   * - Derives institutionId strictly from the authenticated user.
   * - Rejects any attempt by non-SUPER_ADMIN to supply an institutionId from frontend.
   * - For SUPER_ADMIN: allows explicit filtering or returns null for platform-wide queries.
   */
  resolveTenantId(
    currentUser: AuthenticatedUser,
    requestedTenantId?: string | null,
  ): Types.ObjectId | null {
    if (!currentUser) {
      throw new ForbiddenException('Authentication context required for tenant resolution');
    }

    // Super Admin: platform-wide access or explicitly targeted institution (Requirement 5)
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      if (requestedTenantId && requestedTenantId.trim().length > 0) {
        return this.validateObjectId(requestedTenantId.trim(), 'requestedTenantId');
      }
      return null; // Platform-wide
    }

    // School-level users (ADMIN, TEACHER, STUDENT) (Requirements 3 & 6)
    if (!currentUser.institutionId) {
      throw new ForbiddenException(
        `Security violation: User with role '${currentUser.role}' is not associated with any institution.`,
      );
    }

    // Prevent frontend manipulation: if a user attempts to supply a different institutionId, block it!
    if (
      requestedTenantId &&
      requestedTenantId.trim() !== currentUser.institutionId.toString()
    ) {
      this.logger.warn(
        `🚨 TENANT BREACH ATTEMPT: User '${currentUser.userId}' (${currentUser.role}) in Institution '${currentUser.institutionId}' attempted to access Institution '${requestedTenantId}'.`,
      );
      throw new ForbiddenException(
        'Tenant violation: You are strictly forbidden from accessing data belonging to another institution.',
      );
    }

    return this.validateObjectId(
      currentUser.institutionId.toString(),
      'currentUser.institutionId',
    );
  }

  /**
   * Builds an authoritative MongoDB filter query for multi-tenant isolation (Requirements 4 & 14)
   * To be used on all find(), countDocuments(), and aggregation pipelines.
   */
  buildTenantFilter(
    currentUser: AuthenticatedUser,
    requestedTenantId?: string | null,
    fieldName = 'institutionId',
  ): Record<string, any> {
    const tenantId = this.resolveTenantId(currentUser, requestedTenantId);
    if (!tenantId) {
      return {}; // Platform-wide for SUPER_ADMIN
    }
    return { [fieldName]: tenantId };
  }

  /**
   * Enforces that an existing document belongs to the authenticated user's institution (Requirements 10 & 11)
   * Prevents cross-institution reads, updates, and deletions.
   */
  enforceTenantAccess(
    doc: TenantScopedEntity | null | undefined,
    currentUser: AuthenticatedUser,
    resourceName = 'Resource',
  ): void {
    if (!doc) return;

    // Super Admin can access all tenants
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return;
    }

    if (!currentUser.institutionId) {
      throw new ForbiddenException(
        `Access denied: User is not associated with an institution.`,
      );
    }

    const docInstId = doc.institutionId?.toString();
    const userInstId = currentUser.institutionId.toString();

    if (!docInstId || docInstId !== userInstId) {
      this.logger.warn(
        `🚨 CROSS-TENANT ACCESS BLOCKED: User '${currentUser.userId}' in Inst '${userInstId}' attempted to access ${resourceName} in Inst '${docInstId || 'NONE'}'.`,
      );
      throw new ForbiddenException(
        `Cross-institution access denied: ${resourceName} belongs to another institution.`,
      );
    }
  }

  /**
   * Validates that all referenced documents belong to the exact same institution (Requirement 9)
   * Prevents cross-institution reference injection (e.g. assigning Teacher from School B to Class in School A).
   */
  validateSameInstitution(
    referencesOrEntityA: ReferencedEntityCheck[] | TenantScopedEntity,
    expectedTenantIdOrEntityB: Types.ObjectId | string | TenantScopedEntity,
    entityBName = 'Referenced entity',
  ): void {
    if (Array.isArray(referencesOrEntityA)) {
      const expectedStr = expectedTenantIdOrEntityB.toString();
      for (const ref of referencesOrEntityA) {
        if (!ref.institutionId || ref.institutionId.toString() !== expectedStr) {
          throw new BadRequestException(
            `Cross-institution reference violation: ${ref.name} belongs to a different institution.`,
          );
        }
      }
      return;
    }

    const entityA = referencesOrEntityA as TenantScopedEntity;
    const entityB = expectedTenantIdOrEntityB as TenantScopedEntity;
    const instA = entityA?.institutionId?.toString();
    const instB = entityB?.institutionId?.toString();

    if (!instA || !instB || instA !== instB) {
      throw new BadRequestException(
        `Cross-institution reference violation: ${entityBName} belongs to a different institution.`,
      );
    }
  }

  /**
   * Enforces Teacher access scope to only their assigned classes/subjects (Requirement 7)
   */
  enforceTeacherResourceAccess(
    currentUser: AuthenticatedUser,
    teacherProfile: { assignedClassIds?: any[]; assignedSubjectIds?: any[] } | null,
    target: { classId?: string; subjectId?: string },
  ): void {
    if (currentUser.role !== UserRole.TEACHER) return;

    if (!teacherProfile) {
      throw new ForbiddenException('Teacher profile not found for authenticated user');
    }

    if (target.classId) {
      const assigned = (teacherProfile.assignedClassIds || []).map((id) => id.toString());
      if (!assigned.includes(target.classId.toString())) {
        throw new ForbiddenException(
          'Access denied: You are not assigned to this class section.',
        );
      }
    }

    if (target.subjectId) {
      const assigned = (teacherProfile.assignedSubjectIds || []).map((id) => id.toString());
      if (!assigned.includes(target.subjectId.toString())) {
        throw new ForbiddenException(
          'Access denied: You are not assigned to this subject curriculum.',
        );
      }
    }
  }

  /**
   * Enforces Student access scope strictly to their own academic records (Requirement 8)
   */
  enforceStudentSelfAccess(
    currentUser: AuthenticatedUser,
    targetStudentUserId: string | Types.ObjectId,
  ): void {
    if (currentUser.role === UserRole.STUDENT) {
      if (currentUser.userId.toString() !== targetStudentUserId.toString()) {
        throw new ForbiddenException(
          'Access denied: Students are strictly permitted to access only their own records.',
        );
      }
    }
  }
}
