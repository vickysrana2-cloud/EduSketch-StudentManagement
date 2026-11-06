import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from '../src/common/guards/permissions.guard';
import { Permissions, PERMISSIONS_KEY } from '../src/common/decorators/permissions.decorator';
import { UserRole } from '../src/common/enums/user-role.enum';

async function runPermissionsGuardTests() {
  console.log('================================================================');
  console.log('🚀 TASK 17: PERMISSION-BASED AUTHORIZATION (RBAC/ABAC) TESTS');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      if (details) console.error(`     Details: ${details}`);
    }
  }

  // Mock Database of RolePermissions
  const schoolA = '67272714207198bb6c30f401';
  const schoolB = '67272714207198bb6c30f402';

  // Base system permissions (institutionId: null)
  const systemPolicies: Record<UserRole, string[]> = {
    [UserRole.SUPER_ADMIN]: ['INSTITUTION_CREATE', 'INSTITUTION_READ', 'STUDENT_CREATE', 'STUDENT_READ', 'STUDENT_DELETE', 'FEE_READ'],
    [UserRole.ADMIN]: ['STUDENT_CREATE', 'STUDENT_READ', 'STUDENT_UPDATE', 'STUDENT_DELETE', 'FEE_READ'],
    [UserRole.TEACHER]: ['STUDENT_READ', 'ATTENDANCE_CREATE', 'ATTENDANCE_READ', 'RESULT_CREATE'],
    [UserRole.STUDENT]: ['STUDENT_READ', 'ATTENDANCE_READ', 'RESULT_READ', 'FEE_READ'],
  };

  // Institution overrides
  // e.g. School A disables FEE_READ for students
  const institutionOverrides: Array<{
    role: UserRole;
    institutionId: string;
    permission: string;
    isAllowed: boolean;
  }> = [
    {
      role: UserRole.STUDENT,
      institutionId: schoolA,
      permission: 'FEE_READ',
      isAllowed: false,
    },
  ];

  let dbQueryCount = 0;
  let cacheMap = new Map<string, { perms: string[]; expiry: number }>();

  // Mock RolePermissionsService with real caching and override logic
  const mockRolePermissionsService: any = {
    getEffectivePermissions: async (role: UserRole, institutionId?: string | null) => {
      const cacheKey = `${role}:${institutionId || 'GLOBAL'}`;
      const now = Date.now();
      const cached = cacheMap.get(cacheKey);

      if (cached && cached.expiry > now) {
        return cached.perms;
      }

      dbQueryCount++;
      const basePerms = new Set(systemPolicies[role] || []);

      if (institutionId) {
        for (const override of institutionOverrides) {
          if (override.role === role && override.institutionId === institutionId) {
            if (override.isAllowed) {
              basePerms.add(override.permission);
            } else {
              basePerms.delete(override.permission);
            }
          }
        }
      }

      const result = Array.from(basePerms);
      cacheMap.set(cacheKey, { perms: result, expiry: now + 60000 });
      return result;
    },
    clearPermissionCache: () => {
      cacheMap.clear();
    },
  };

  const reflector = new Reflector();
  const permissionsGuard = new PermissionsGuard(reflector, mockRolePermissionsService);

  // Helper to create mock execution contexts
  function createMockContext(
    user: any,
    handler: Function,
    params: Record<string, string> = {},
  ): ExecutionContext {
    return {
      getHandler: () => handler,
      getClass: () => class MockController {},
      switchToHttp: () => ({
        getRequest: () => ({ user, params }),
      }),
    } as any;
  }

  // Mock Handlers with @Permissions
  class MockHandlers {
    @Permissions('STUDENT_CREATE')
    createStudent() {}

    @Permissions('STUDENT_READ', 'STUDENT_DELETE')
    readAndDeleteStudent() {}

    @Permissions('FEE_READ')
    viewFees() {}

    unprotectedHandler() {}
  }

  const handlers = new MockHandlers();

  // Mock Users
  const superAdminUser = { userId: 'sa1', role: UserRole.SUPER_ADMIN, institutionId: null };
  const adminSchoolA = { userId: 'adminA', role: UserRole.ADMIN, institutionId: schoolA };
  const adminSchoolB = { userId: 'adminB', role: UserRole.ADMIN, institutionId: schoolB };
  const teacherSchoolA = { userId: 'teacherA', role: UserRole.TEACHER, institutionId: schoolA };
  const studentSchoolA = { userId: 'studentA', role: UserRole.STUDENT, institutionId: schoolA };
  const studentSchoolB = { userId: 'studentB', role: UserRole.STUDENT, institutionId: schoolB };

  // =========================================================================
  // TEST SUITE 1: Unauthenticated & Unprotected Routes
  // =========================================================================
  console.log('📌 Test Suite 1: Unauthenticated & Unprotected Routes');
  const unauthContext = createMockContext(null, handlers.createStudent);
  let unauthCaught = false;
  try {
    await permissionsGuard.canActivate(unauthContext);
  } catch (err: any) {
    if (err instanceof UnauthorizedException) {
      unauthCaught = true;
    }
  }
  assert(unauthCaught, 'Unauthenticated request on protected permission route throws 401 Unauthorized');

  const unprotectedContext = createMockContext(null, handlers.unprotectedHandler);
  const unprotectedAllowed = await permissionsGuard.canActivate(unprotectedContext);
  assert(unprotectedAllowed === true, 'Route without @Permissions() allows unauthenticated access');

  // =========================================================================
  // TEST SUITE 2: Single Permission Authorization
  // =========================================================================
  console.log('\n📌 Test Suite 2: Single Permission Authorization');
  const adminCreateCtx = createMockContext(adminSchoolA, handlers.createStudent);
  const adminCanCreate = await permissionsGuard.canActivate(adminCreateCtx);
  assert(adminCanCreate === true, 'ADMIN possessing STUDENT_CREATE is granted access');

  const teacherCreateCtx = createMockContext(teacherSchoolA, handlers.createStudent);
  let teacherBlocked = false;
  try {
    await permissionsGuard.canActivate(teacherCreateCtx);
  } catch (err: any) {
    if (err instanceof ForbiddenException && err.message.includes('STUDENT_CREATE')) {
      teacherBlocked = true;
    }
  }
  assert(teacherBlocked, 'TEACHER lacking STUDENT_CREATE is rejected with 403 Forbidden');

  // =========================================================================
  // TEST SUITE 3: Multiple Required Permissions Check
  // =========================================================================
  console.log('\n📌 Test Suite 3: Multiple Required Permissions Enforcement');
  // Requires both: STUDENT_READ and STUDENT_DELETE
  const adminMultiCtx = createMockContext(adminSchoolA, handlers.readAndDeleteStudent);
  assert(await permissionsGuard.canActivate(adminMultiCtx) === true, 'ADMIN possessing both permissions is granted access');

  const teacherMultiCtx = createMockContext(teacherSchoolA, handlers.readAndDeleteStudent);
  let teacherMissingDelete = false;
  try {
    await permissionsGuard.canActivate(teacherMultiCtx);
  } catch (err: any) {
    if (err instanceof ForbiddenException && err.message.includes('STUDENT_DELETE')) {
      teacherMissingDelete = true;
    }
  }
  assert(teacherMissingDelete, 'TEACHER possessing STUDENT_READ but lacking STUDENT_DELETE rejected with 403 Forbidden');

  // =========================================================================
  // TEST SUITE 4: Institution-Specific Overrides (Tenant Scope)
  // =========================================================================
  console.log('\n📌 Test Suite 4: Institution-Specific Permission Overrides');
  // School A has disabled FEE_READ for students
  const studentSchoolACtx = createMockContext(studentSchoolA, handlers.viewFees);
  let studentABlockedFromFees = false;
  try {
    await permissionsGuard.canActivate(studentSchoolACtx);
  } catch (err: any) {
    if (err instanceof ForbiddenException && err.message.includes('FEE_READ')) {
      studentABlockedFromFees = true;
    }
  }
  assert(studentABlockedFromFees, 'School A student rejected from FEE_READ due to school override (403 Forbidden)');

  // School B has NOT overridden FEE_READ (retains system default)
  const studentSchoolBCtx = createMockContext(studentSchoolB, handlers.viewFees);
  const studentBCanViewFees = await permissionsGuard.canActivate(studentSchoolBCtx);
  assert(studentBCanViewFees === true, 'School B student permitted to view fees (tenant isolation preserved)');

  // =========================================================================
  // TEST SUITE 5: Cross-Tenant Protection (School Admin isolation)
  // =========================================================================
  console.log('\n📌 Test Suite 5: Cross-Tenant Boundary Protection');
  // School A Admin attempts to pass schoolB in route params
  const crossTenantCtx = createMockContext(adminSchoolA, handlers.createStudent, { institutionId: schoolB });
  let crossTenantBlocked = false;
  try {
    await permissionsGuard.canActivate(crossTenantCtx);
  } catch (err: any) {
    if (err instanceof ForbiddenException && err.message.includes('Cross-tenant violation')) {
      crossTenantBlocked = true;
    }
  }
  assert(crossTenantBlocked, 'School A Admin blocked from accessing School B resources (403 Forbidden)');

  // Super Admin can access any institution
  const superAdminCrossCtx = createMockContext(superAdminUser, handlers.createStudent, { institutionId: schoolB });
  const superAdminAllowed = await permissionsGuard.canActivate(superAdminCrossCtx);
  assert(superAdminAllowed === true, 'SUPER_ADMIN permitted across all tenant institutions');

  // =========================================================================
  // TEST SUITE 6: Immediate Policy Effect & Cache Invalidation
  // =========================================================================
  console.log('\n📌 Test Suite 6: Immediate Policy Effect & In-Memory Caching');
  const initialDbQueries = dbQueryCount;

  // Second call for School B student hits cache (no new DB query)
  await permissionsGuard.canActivate(studentSchoolBCtx);
  assert(dbQueryCount === initialDbQueries, 'Repeated permission checks resolve from cache without database query');

  // Admin dynamically grants FEE_READ to School A students and clears cache
  institutionOverrides[0].isAllowed = true;
  mockRolePermissionsService.clearPermissionCache();

  // School A student now immediately has access without waiting for JWT expiry!
  const studentACanNowViewFees = await permissionsGuard.canActivate(studentSchoolACtx);
  assert(studentACanNowViewFees === true, 'Permission changes take effect immediately without waiting for JWT expiration');

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n================================================================');
  console.log(`📊 FINAL RESULT: ${passed}/${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runPermissionsGuardTests().catch((err) => {
  console.error('Fatal error during PermissionsGuard verification:', err);
  process.exit(1);
});

