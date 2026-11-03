import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * ============================================================================
 * TEMPORARY AUTHORIZATION GUARD - SUPER ADMIN ONLY
 * ============================================================================
 * NOTICE: This is a temporary authorization guard used to protect institution
 * endpoints until the full AuthModule & JWT authentication flow are implemented.
 *
 * It ensures endpoints are NEVER left publicly accessible.
 *
 * Expected Request Header:
 * - `x-user-role`: Must be set to 'SUPER_ADMIN'
 * ============================================================================
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const userRole = request.headers['x-user-role'];

    if (!userRole) {
      throw new UnauthorizedException(
        'Missing authorization header: `x-user-role` is required. (Temporary Authorization)',
      );
    }

    if (userRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Access denied: Only SUPER_ADMIN is authorized to perform this operation.',
      );
    }

    return true;
  }
}

