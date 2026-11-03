import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { UserRole } from '../../users/enums/user.enums';

/**
 * ============================================================================
 * TEMPORARY AUTHORIZATION GUARD - USER MANAGEMENT
 * ============================================================================
 * NOTICE: Protects User creation and management endpoints until full AuthModule
 * & JWT authentication are implemented.
 *
 * It prevents public access and prevents unauthorized role escalation.
 *
 * Expected Request Header:
 * - `x-user-role`: Must be either 'SUPER_ADMIN' or 'ADMIN'
 * ============================================================================
 */
@Injectable()
export class UserManagementGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const userRole = request.headers['x-user-role'] as string;

    if (!userRole) {
      throw new UnauthorizedException(
        'Missing authorization header: `x-user-role` is required. (Temporary Authorization)',
      );
    }

    if (
      userRole !== UserRole.SUPER_ADMIN &&
      userRole !== UserRole.ADMIN
    ) {
      throw new ForbiddenException(
        'Access denied: Only SUPER_ADMIN or ADMIN roles are permitted to manage users.',
      );
    }

    // Role escalation check: Only SUPER_ADMIN can create or manage another SUPER_ADMIN or ADMIN
    if (request.method === 'POST') {
      const requestedRole = request.body?.role;
      if (
        userRole === UserRole.ADMIN &&
        (requestedRole === UserRole.SUPER_ADMIN || requestedRole === UserRole.ADMIN)
      ) {
        throw new ForbiddenException(
          'Role escalation prevented: ADMIN cannot create SUPER_ADMIN or ADMIN users.',
        );
      }
    }

    return true;
  }
}

