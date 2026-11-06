import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../enums/user-role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (user: any): ExecutionContext =>
    ({
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as any);

  it('should allow access if no roles are defined on handler or class', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext(null);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw UnauthorizedException (401) if roles are defined but request has no user', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    const context = createMockContext(null);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should allow access if user has the single required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.SUPER_ADMIN]);
    const context = createMockContext({ role: UserRole.SUPER_ADMIN });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user matches one of the multiple permitted roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
    const context = createMockContext({ role: UserRole.ADMIN });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException (403) if user role does not match permitted roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.SUPER_ADMIN]);
    const context = createMockContext({ role: UserRole.TEACHER });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should correctly handle all four roles individually', () => {
    const roles = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT];

    roles.forEach((role) => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([role]);
      const validContext = createMockContext({ role });
      expect(guard.canActivate(validContext)).toBe(true);

      const invalidRole = roles.find((r) => r !== role)!;
      const invalidContext = createMockContext({ role: invalidRole });
      expect(() => guard.canActivate(invalidContext)).toThrow(ForbiddenException);
    });
  });
});

