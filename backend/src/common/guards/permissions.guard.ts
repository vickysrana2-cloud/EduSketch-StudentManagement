import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { RolePermissionsService } from '../../role-permissions/role-permissions.service';
import { UserRole } from '../enums/user-role.enum';

/**
 * ============================================================================
 * PERMISSIONS GUARD (Task 17)
 * ============================================================================
 * Enforces fine-grained permission-based authorization across endpoints.
 *
 * Key Architectural Guarantees:
 * 1. Reflection: Reads required permissions from @Permissions() metadata.
 * 2. Dynamic Resolution: Loads real-time active permissions from RolePermissions
 *    collection instead of trusting stale JWT claims.
 * 3. Multi-Tenant Isolation: Evaluates permissions strictly scoped to the
 *    authenticated user's tenant institution (institutionId).
 * 4. Cross-Tenant Protection: Prevents an Admin of School A from accessing or
 *    using permissions against School B resources.
 * 5. High Performance: Uses short-TTL in-memory caching with immediate
 *    cache-invalidation upon policy mutation.
 * 6. Separation of Concerns: Fine-grained permission checks verify operational
 *    capability, but do NOT replace resource-level ownership validation in domain services.
 * ============================================================================
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rolePermissionsService: RolePermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Read required permissions using Reflector
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If route does not declare any @Permissions(), permit access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Requirement 7: Safe handling for unauthenticated requests
    if (!user) {
      throw new UnauthorizedException(
        'Authentication required. No authenticated user found on request context.',
      );
    }

    // SUPER_ADMIN has platform-wide authority across all institutions and modules
    // and bypasses fine-grained permission checks.
    if (user.role === UserRole.SUPER_ADMIN || user.role === 'SUPER_ADMIN') {
      return true;
    }

    // Requirement 6: Tenant boundary enforcement
    // If request contains an institutionId param and user is not SUPER_ADMIN,
    // verify tenant match to prevent cross-institution access.
    const paramInstId =
      request.params?.institutionId || request.params?.schoolId;
    if (
      paramInstId &&
      user.role !== UserRole.SUPER_ADMIN &&
      user.institutionId !== paramInstId
    ) {
      throw new ForbiddenException(
        'Cross-tenant violation: You are not authorized to access resources belonging to another institution.',
      );
    }

    // 2. Load assigned permissions from RolePermissions with institution scope
    const userPermissions =
      await this.rolePermissionsService.getEffectivePermissions(
        user.role,
        user.institutionId,
      );

    // 3. Verify user has all required permissions
    const missingPermissions = requiredPermissions.filter(
      (perm) => !userPermissions.includes(perm),
    );

    // Requirement 8: Return 403 for insufficient permissions
    if (missingPermissions.length > 0) {
      throw new ForbiddenException(
        `Access denied. Missing required permission(s): [${missingPermissions.join(', ')}].`,
      );
    }

    return true;
  }
}

