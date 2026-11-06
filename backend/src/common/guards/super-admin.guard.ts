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
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<any>();
    const isProduction = process.env.NODE_ENV === 'production';

    // 1. Check JWT authenticated user first
    const userRole = request.user?.role;
    if (userRole) {
      if (userRole !== UserRole.SUPER_ADMIN && userRole !== 'SUPER_ADMIN') {
        throw new ForbiddenException(
          'Access denied: Only SUPER_ADMIN is authorized to perform this operation.',
        );
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

    if (headerRole !== UserRole.SUPER_ADMIN && headerRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Access denied: Only SUPER_ADMIN is authorized to perform this operation.',
      );
    }

    request.user = {
      userId: request.headers['x-user-id'] || '000000000000000000000000',
      email: 'superadmin@system.local',
      name: 'Super Admin',
      role: UserRole.SUPER_ADMIN,
      institutionId: null,
    };

    return true;
  }
}
