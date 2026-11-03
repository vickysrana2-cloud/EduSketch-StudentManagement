import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
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
          `Invalid JWT access token format or signature${detail}. Ensure you are providing the accessToken (not refreshToken) without surrounding quotes or redundant 'Bearer' prefixes.`,
        );
      }
      throw new UnauthorizedException(
        err?.message ||
          'Unauthorized access: Authorization header with Bearer token is missing or invalid',
      );
    }
    return user;
  }
}
