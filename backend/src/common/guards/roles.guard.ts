import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../enums/user-role.enum';

/**
 * Guard that enforces Role-Based Access Control (RBAC) across endpoints.
 *
 * Behaviors:
 * 1. Checks route-level and class-level metadata for @Roles(...) definitions.
 * 2. If no @Roles() are defined, access is granted.
 * 3. If @Roles() are defined:
 *    - Rejects unauthenticated requests with 401 Unauthorized.
 *    - Rejects authenticated users without matching roles with 403 Forbidden.
 *    - Grants access if the user's role matches any permitted role.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles are required on handler or controller class, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Requirement 5: Return 401 when unauthenticated
    if (!user) {
      throw new UnauthorizedException(
        'Authentication required. No authenticated user found on request context.',
      );
    }

    // Check if the user's role matches any of the required roles
    const hasRole = requiredRoles.includes(user.role);

    // Requirement 6: Return 403 when authenticated but unauthorized
    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Role '${user.role}' is not authorized to access this resource. Required: [${requiredRoles.join(', ')}].`,
      );
    }

    return true;
  }
}

