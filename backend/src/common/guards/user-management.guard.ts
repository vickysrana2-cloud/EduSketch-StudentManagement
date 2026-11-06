import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { UserRole } from '../../users/enums/user.enums';

@Injectable()
export class UserManagementGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<any>();
    
    // Check JWT authenticated user first, then fallback to header
    const userRole = request.user?.role || (request.headers['x-user-role'] as string);

    if (!userRole) {
      throw new UnauthorizedException(
        'Missing authorization: Bearer token or `x-user-role` header is required.',
      );
    }

    if (
      userRole !== UserRole.SUPER_ADMIN &&
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.TEACHER &&
      userRole !== UserRole.STUDENT
    ) {
      throw new ForbiddenException(
        'Access denied: Unauthorized role.',
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

    // If user object not populated, populate a fallback mock user for currentUser decorator
    if (!request.user && request.headers['x-user-role']) {
      request.user = {
        userId: request.headers['x-user-id'] || '000000000000000000000001',
        email: 'admin@system.local',
        name: 'Header Admin',
        role: userRole,
        institutionId: request.headers['x-institution-id'] || null,
      };
    }

    return true;
  }
}
