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
    
    // Check JWT authenticated user first, then fallback to header
    const userRole = request.user?.role || (request.headers['x-user-role'] as string);

    if (!userRole) {
      throw new UnauthorizedException(
        'Missing authorization: Bearer token or `x-user-role` header is required.',
      );
    }

    if (userRole !== UserRole.SUPER_ADMIN && userRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Access denied: Only SUPER_ADMIN is authorized to perform this operation.',
      );
    }

    if (!request.user && request.headers['x-user-role']) {
      request.user = {
        userId: request.headers['x-user-id'] || '000000000000000000000000',
        email: 'superadmin@system.local',
        name: 'Super Admin',
        role: UserRole.SUPER_ADMIN,
        institutionId: null,
      };
    }

    return true;
  }
}
