import {
  ExecutionContext,
  Injectable,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(@Optional() private readonly reflector?: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if the route or controller is decorated with @Public()
    if (this.reflector) {
      const isPublic = this.reflector.getAllAndOverride<boolean>(
        IS_PUBLIC_KEY,
        [context.getHandler(), context.getClass()],
      );
      if (isPublic) {
        return true;
      }
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('JWT access token has expired');
      }
      if (info?.name === 'JsonWebTokenError') {
        const detail = info.message ? ` (${info.message})` : '';
        throw new UnauthorizedException(
          `Invalid JWT access token format or signature${detail}. Ensure you provide a valid Bearer accessToken.`,
        );
      }
      if (info?.name === 'NotBeforeError') {
        throw new UnauthorizedException('JWT access token is not active yet');
      }
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException(
        err?.message ||
          'Unauthorized access: Authorization header with Bearer token is missing or invalid',
      );
    }
    return user;
  }
}
