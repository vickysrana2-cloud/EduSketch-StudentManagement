import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { UserRole } from '../enums/user-role.enum';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;
  let mockRolePermissionsService: any;

  beforeEach(() => {
    reflector = new Reflector();
    mockRolePermissionsService = {
      getEffectivePermissions: jest.fn(),
    };
    guard = new PermissionsGuard(reflector, mockRolePermissionsService);
  });

  const createMockContext = (user: any, params: Record<string, string> = {}): ExecutionContext =>
    ({
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => ({ user, params }),
      }),
    } as any);

  it('should allow access if no permissions are required', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext(null);

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('should throw UnauthorizedException (401) if route requires permissions but user is null', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['STUDENT_CREATE']);
    const context = createMockContext(null);

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should allow access if user has all required permissions', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['STUDENT_CREATE']);
    mockRolePermissionsService.getEffectivePermissions.mockResolvedValue(['STUDENT_CREATE', 'STUDENT_READ']);

    const user = { userId: '1', role: UserRole.ADMIN, institutionId: 'inst1' };
    const context = createMockContext(user);

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('should throw ForbiddenException (403) if user lacks required permissions', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['STUDENT_DELETE']);
    mockRolePermissionsService.getEffectivePermissions.mockResolvedValue(['STUDENT_CREATE', 'STUDENT_READ']);

    const user = { userId: '1', role: UserRole.ADMIN, institutionId: 'inst1' };
    const context = createMockContext(user);

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException (403) if non-superadmin attempts to access another institution param', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['STUDENT_READ']);
    const user = { userId: '1', role: UserRole.ADMIN, institutionId: 'school-A' };
    const context = createMockContext(user, { institutionId: 'school-B' });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});

