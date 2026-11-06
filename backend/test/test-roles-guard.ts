import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { Roles, ROLES_KEY } from '../src/common/decorators/roles.decorator';
import { UserRole } from '../src/common/enums/user-role.enum';
import { UserRole as SchemaUserRole } from '../src/users/enums/user.enums';

async function runRolesGuardTests() {
  console.log('================================================================');
  console.log('🚀 TASK 16: ROLE-BASED ACCESS CONTROL (RBAC) VERIFICATION');
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

  const reflector = new Reflector();
  const rolesGuard = new RolesGuard(reflector);

  // Helper to create mock execution contexts
  function createMockContext(
    user: any,
    handler: Function,
    controllerClass: Function = class MockController {},
  ): ExecutionContext {
    return {
      getHandler: () => handler,
      getClass: () => controllerClass,
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as any;
  }

  // Define Mock Controllers & Methods with @Roles decorators
  class MockTestController {
    @Roles(UserRole.SUPER_ADMIN)
    superAdminOnly() {}

    @Roles(UserRole.ADMIN)
    adminOnly() {}

    @Roles(UserRole.TEACHER)
    teacherOnly() {}

    @Roles(UserRole.STUDENT)
    studentOnly() {}

    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    adminAndSuperAdmin() {}

    @Roles(UserRole.TEACHER, UserRole.STUDENT)
    academicCommunity() {}

    unprotectedRoute() {}
  }

  @Roles(UserRole.ADMIN)
  class MockClassLevelController {
    inheritedAdminRoute() {}

    @Roles(UserRole.SUPER_ADMIN)
    overriddenSuperAdminRoute() {}
  }

  const controllerInstance = new MockTestController();
  const classControllerInstance = new MockClassLevelController();

  // Mock User Profiles
  const superAdminUser = { userId: '1', role: UserRole.SUPER_ADMIN, email: 'sa@platform.com' };
  const adminUser = { userId: '2', role: UserRole.ADMIN, email: 'admin@school.com' };
  const teacherUser = { userId: '3', role: UserRole.TEACHER, email: 'teacher@school.com' };
  const studentUser = { userId: '4', role: UserRole.STUDENT, email: 'student@school.com' };

  // =========================================================================
  // TEST SUITE 1: Schema Consistency
  // =========================================================================
  console.log('📌 Test Suite 1: Role Definition & Schema Consistency');
  assert(
    JSON.stringify(Object.values(UserRole)) === JSON.stringify(Object.values(SchemaUserRole)),
    'Common UserRole enum strictly matches User schema enum',
  );
  assert(Object.values(UserRole).includes('SUPER_ADMIN' as any), 'UserRole defines SUPER_ADMIN');
  assert(Object.values(UserRole).includes('ADMIN' as any), 'UserRole defines ADMIN');
  assert(Object.values(UserRole).includes('TEACHER' as any), 'UserRole defines TEACHER');
  assert(Object.values(UserRole).includes('STUDENT' as any), 'UserRole defines STUDENT');

  // =========================================================================
  // TEST SUITE 2: Unit Tests for SUPER_ADMIN Role
  // =========================================================================
  console.log('\n📌 Test Suite 2: SUPER_ADMIN Role Authorization');
  const saContext = createMockContext(superAdminUser, controllerInstance.superAdminOnly, MockTestController);
  assert(rolesGuard.canActivate(saContext) === true, 'SUPER_ADMIN granted access to SUPER_ADMIN-only route');

  const adminAttemptSa = createMockContext(adminUser, controllerInstance.superAdminOnly, MockTestController);
  let adminBlocked = false;
  try {
    rolesGuard.canActivate(adminAttemptSa);
  } catch (err: any) {
    if (err instanceof ForbiddenException && err.message.includes('not authorized')) {
      adminBlocked = true;
    }
  }
  assert(adminBlocked, 'ADMIN rejected from SUPER_ADMIN-only route with 403 Forbidden');

  // =========================================================================
  // TEST SUITE 3: Unit Tests for ADMIN Role
  // =========================================================================
  console.log('\n📌 Test Suite 3: ADMIN Role Authorization');
  const adminContext = createMockContext(adminUser, controllerInstance.adminOnly, MockTestController);
  assert(rolesGuard.canActivate(adminContext) === true, 'ADMIN granted access to ADMIN-only route');

  const teacherAttemptAdmin = createMockContext(teacherUser, controllerInstance.adminOnly, MockTestController);
  let teacherBlocked = false;
  try {
    rolesGuard.canActivate(teacherAttemptAdmin);
  } catch (err: any) {
    if (err instanceof ForbiddenException) {
      teacherBlocked = true;
    }
  }
  assert(teacherBlocked, 'TEACHER rejected from ADMIN-only route with 403 Forbidden');

  // =========================================================================
  // TEST SUITE 4: Unit Tests for TEACHER Role
  // =========================================================================
  console.log('\n📌 Test Suite 4: TEACHER Role Authorization');
  const teacherContext = createMockContext(teacherUser, controllerInstance.teacherOnly, MockTestController);
  assert(rolesGuard.canActivate(teacherContext) === true, 'TEACHER granted access to TEACHER-only route');

  const studentAttemptTeacher = createMockContext(studentUser, controllerInstance.teacherOnly, MockTestController);
  let studentBlocked = false;
  try {
    rolesGuard.canActivate(studentAttemptTeacher);
  } catch (err: any) {
    if (err instanceof ForbiddenException) {
      studentBlocked = true;
    }
  }
  assert(studentBlocked, 'STUDENT rejected from TEACHER-only route with 403 Forbidden');

  // =========================================================================
  // TEST SUITE 5: Unit Tests for STUDENT Role
  // =========================================================================
  console.log('\n📌 Test Suite 5: STUDENT Role Authorization');
  const studentContext = createMockContext(studentUser, controllerInstance.studentOnly, MockTestController);
  assert(rolesGuard.canActivate(studentContext) === true, 'STUDENT granted access to STUDENT-only route');

  const teacherAttemptStudent = createMockContext(teacherUser, controllerInstance.studentOnly, MockTestController);
  let teacherBlockedFromStudent = false;
  try {
    rolesGuard.canActivate(teacherAttemptStudent);
  } catch (err: any) {
    if (err instanceof ForbiddenException) {
      teacherBlockedFromStudent = true;
    }
  }
  assert(teacherBlockedFromStudent, 'TEACHER rejected from STUDENT-only route with 403 Forbidden');

  // =========================================================================
  // TEST SUITE 6: Multiple Permitted Roles Configuration
  // =========================================================================
  console.log('\n📌 Test Suite 6: Multiple Permitted Roles Configuration');
  // Route requiring: [ADMIN, SUPER_ADMIN]
  const saMultiContext = createMockContext(superAdminUser, controllerInstance.adminAndSuperAdmin, MockTestController);
  const adminMultiContext = createMockContext(adminUser, controllerInstance.adminAndSuperAdmin, MockTestController);
  const teacherMultiContext = createMockContext(teacherUser, controllerInstance.adminAndSuperAdmin, MockTestController);
  const studentMultiContext = createMockContext(studentUser, controllerInstance.adminAndSuperAdmin, MockTestController);

  assert(rolesGuard.canActivate(saMultiContext) === true, 'SUPER_ADMIN permitted on [ADMIN, SUPER_ADMIN] route');
  assert(rolesGuard.canActivate(adminMultiContext) === true, 'ADMIN permitted on [ADMIN, SUPER_ADMIN] route');

  let teacherMultiBlocked = false;
  try {
    rolesGuard.canActivate(teacherMultiContext);
  } catch (err: any) {
    if (err instanceof ForbiddenException) teacherMultiBlocked = true;
  }
  assert(teacherMultiBlocked, 'TEACHER rejected from [ADMIN, SUPER_ADMIN] route with 403 Forbidden');

  let studentMultiBlocked = false;
  try {
    rolesGuard.canActivate(studentMultiContext);
  } catch (err: any) {
    if (err instanceof ForbiddenException) studentMultiBlocked = true;
  }
  assert(studentMultiBlocked, 'STUDENT rejected from [ADMIN, SUPER_ADMIN] route with 403 Forbidden');

  // Route requiring: [TEACHER, STUDENT]
  const teacherAcademic = createMockContext(teacherUser, controllerInstance.academicCommunity, MockTestController);
  const studentAcademic = createMockContext(studentUser, controllerInstance.academicCommunity, MockTestController);
  const adminAcademic = createMockContext(adminUser, controllerInstance.academicCommunity, MockTestController);

  assert(rolesGuard.canActivate(teacherAcademic) === true, 'TEACHER permitted on [TEACHER, STUDENT] route');
  assert(rolesGuard.canActivate(studentAcademic) === true, 'STUDENT permitted on [TEACHER, STUDENT] route');

  let adminAcademicBlocked = false;
  try {
    rolesGuard.canActivate(adminAcademic);
  } catch (err: any) {
    if (err instanceof ForbiddenException) adminAcademicBlocked = true;
  }
  assert(adminAcademicBlocked, 'ADMIN rejected from [TEACHER, STUDENT] route with 403 Forbidden');

  // =========================================================================
  // TEST SUITE 7: Unauthenticated Request Handling (Requirement 5)
  // =========================================================================
  console.log('\n📌 Test Suite 7: Unauthenticated Request Handling');
  const unauthContext = createMockContext(null, controllerInstance.adminOnly, MockTestController);
  let unauthCaught = false;
  try {
    rolesGuard.canActivate(unauthContext);
  } catch (err: any) {
    if (err instanceof UnauthorizedException && err.message.includes('Authentication required')) {
      unauthCaught = true;
    }
  }
  assert(unauthCaught, 'Unauthenticated request on protected role route throws 401 Unauthorized');

  // =========================================================================
  // TEST SUITE 8: Open / Unprotected Route Handling
  // =========================================================================
  console.log('\n📌 Test Suite 8: Unprotected Route Behavior');
  const unprotectAuthContext = createMockContext(studentUser, controllerInstance.unprotectedRoute, MockTestController);
  assert(rolesGuard.canActivate(unprotectAuthContext) === true, 'Route without @Roles() allowed for authenticated users');

  const unprotectUnauthContext = createMockContext(null, controllerInstance.unprotectedRoute, MockTestController);
  assert(rolesGuard.canActivate(unprotectUnauthContext) === true, 'Route without @Roles() allowed even if unauthenticated');

  // =========================================================================
  // TEST SUITE 9: Class-Level Inheritance & Method-Level Override
  // =========================================================================
  console.log('\n📌 Test Suite 9: Class-Level Inheritance & Method-Level Override');
  // Inherited class-level @Roles(UserRole.ADMIN)
  const inheritedAdminCtx = createMockContext(adminUser, classControllerInstance.inheritedAdminRoute, MockClassLevelController);
  assert(rolesGuard.canActivate(inheritedAdminCtx) === true, 'Class-level @Roles(ADMIN) permits ADMIN on inherited method');

  const inheritedStudentCtx = createMockContext(studentUser, classControllerInstance.inheritedAdminRoute, MockClassLevelController);
  let inheritedStudentBlocked = false;
  try {
    rolesGuard.canActivate(inheritedStudentCtx);
  } catch (err: any) {
    if (err instanceof ForbiddenException) inheritedStudentBlocked = true;
  }
  assert(inheritedStudentBlocked, 'Class-level @Roles(ADMIN) blocks STUDENT on inherited method');

  // Overridden method-level @Roles(UserRole.SUPER_ADMIN)
  const overrideAdminCtx = createMockContext(adminUser, classControllerInstance.overriddenSuperAdminRoute, MockClassLevelController);
  let overrideAdminBlocked = false;
  try {
    rolesGuard.canActivate(overrideAdminCtx);
  } catch (err: any) {
    if (err instanceof ForbiddenException) overrideAdminBlocked = true;
  }
  assert(overrideAdminBlocked, 'Method-level override @Roles(SUPER_ADMIN) blocks ADMIN');

  const overrideSaCtx = createMockContext(superAdminUser, classControllerInstance.overriddenSuperAdminRoute, MockClassLevelController);
  assert(rolesGuard.canActivate(overrideSaCtx) === true, 'Method-level override @Roles(SUPER_ADMIN) permits SUPER_ADMIN');

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

runRolesGuardTests().catch((err) => {
  console.error('Fatal error during RolesGuard verification:', err);
  process.exit(1);
});

