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
    const isProduction = process.env.NODE_ENV === 'production';

    // 1. Check JWT authenticated user first
    if (request.user) {
      const userRole = request.user.role;
      if (
        userRole !== UserRole.SUPER_ADMIN &&
        userRole !== UserRole.ADMIN &&
        userRole !== UserRole.TEACHER &&
        userRole !== UserRole.STUDENT
      ) {
        throw new ForbiddenException('Access denied: Unauthorized role.');
      }

      // Role escalation check
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

    // 2. In production, unauthenticated header spoofing is strictly prohibited
    if (isProduction) {
      throw new UnauthorizedException(
        'Header-based authentication (x-user-role) is strictly disabled in production. A valid Bearer JWT token is required.',
      );
    }

    // 3. Dev/Test fallback header
    const headerRole = request.headers['x-user-role'] as string;
    if (!headerRole) {
      throw new UnauthorizedException(
        'Missing authorization: Bearer token or `x-user-role` header is required.',
      );
    }

    if (
      headerRole !== UserRole.SUPER_ADMIN &&
      headerRole !== UserRole.ADMIN &&
      headerRole !== UserRole.TEACHER &&
      headerRole !== UserRole.STUDENT
    ) {
      throw new ForbiddenException('Access denied: Unauthorized role.');
    }

    // Role escalation check: Only SUPER_ADMIN can create or manage another SUPER_ADMIN or ADMIN
    if (request.method === 'POST') {
      const requestedRole = request.body?.role;
      if (
        headerRole === UserRole.ADMIN &&
        (requestedRole === UserRole.SUPER_ADMIN || requestedRole === UserRole.ADMIN)
      ) {
        throw new ForbiddenException(
          'Role escalation prevented: ADMIN cannot create SUPER_ADMIN or ADMIN users.',
        );
      }
    }

    // If user object not populated, populate a fallback mock user for currentUser decorator
    request.user = {
      userId: request.headers['x-user-id'] || '000000000000000000000001',
      email: 'admin@system.local',
      name: 'Header Admin',
      role: headerRole,
      institutionId: request.headers['x-institution-id'] || null,
    };

    return true;
  }
}
