import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT Guard:
 * If an Authorization Bearer token is provided and valid, it attaches `req.user`.
 * If no token is provided, it allows the request to proceed with `req.user = null`
 * so the endpoint can enforce context-sensitive rules (e.g. public vs admin onboarding).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(_err: any, user: any) {
    return user || null;
  }
}

