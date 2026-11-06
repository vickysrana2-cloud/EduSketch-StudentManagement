import { Types } from 'mongoose';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  RolePermissionsService,
  INITIAL_ROLE_PERMISSIONS_POLICY,
} from '../src/role-permissions/role-permissions.service';
import { UserRole } from '../src/users/enums/user.enums';
import { SYSTEM_PERMISSIONS_CATALOG } from '../src/permissions/permissions.service';

async function runRolePermissionsTests() {
  console.log('================================================================');
  console.log('🚀 TASK 14: ROLE-PERMISSIONS MAPPING VERIFICATION');
  console.log('================================================================\n');

  // In-memory collections
  const rolePermissionsStore: any[] = [];
  const rolesStore: any[] = [];
  const permissionsStore: any[] = [];
  const institutionsStore: any[] = [];

  // 1. Setup Mock Roles
  const superAdminRole = {
    _id: new Types.ObjectId(),
    name: UserRole.SUPER_ADMIN,
    displayName: 'Super Administrator',
    level: 1,
    isSystemRole: true,
    isActive: true,
  };
  const adminRole = {
    _id: new Types.ObjectId(),
    name: UserRole.ADMIN,
    displayName: 'Institution Administrator',
    level: 2,
    isSystemRole: true,
    isActive: true,
  };
  const teacherRole = {
    _id: new Types.ObjectId(),
    name: UserRole.TEACHER,
    displayName: 'Teacher',
    level: 3,
    isSystemRole: true,
    isActive: true,
  };
  const studentRole = {
    _id: new Types.ObjectId(),
    name: UserRole.STUDENT,
    displayName: 'Student',
    level: 4,
    isSystemRole: true,
    isActive: true,
  };
  rolesStore.push(superAdminRole, adminRole, teacherRole, studentRole);

  // 2. Setup Mock Permissions (all 50 catalog permissions)
  for (const p of SYSTEM_PERMISSIONS_CATALOG) {
    permissionsStore.push({
      _id: new Types.ObjectId(),
      name: p.name,
      module: p.module,
      action: p.action,
      description: p.description,
      isActive: true,
    });
  }

  // 3. Setup Mock Institutions
  const schoolA = {
    _id: new Types.ObjectId(),
    name: 'Greenwood High',
    code: 'GWH-001',
    status: 'ACTIVE',
  };
  const schoolB = {
    _id: new Types.ObjectId(),
    name: 'St. Xavier Academy',
    code: 'SXA-002',
    status: 'ACTIVE',
  };
  institutionsStore.push(schoolA, schoolB);

  // Helper to test uniqueness replicating compound index
  const checkUniqueConstraint = (doc: any) => {
    const duplicate = rolePermissionsStore.find((existing) => {
      const sameRole = existing.roleId.toString() === doc.roleId.toString();
      const samePerm = existing.permissionId.toString() === doc.permissionId.toString();
      const sameInst =
        (!existing.institutionId && !doc.institutionId) ||
        (existing.institutionId &&
          doc.institutionId &&
          existing.institutionId.toString() === doc.institutionId.toString());
      return sameRole && samePerm && sameInst;
    });

    if (duplicate && duplicate._id.toString() !== doc._id.toString()) {
      const err: any = new Error(
        'E11000 duplicate key error collection: role_permissions index dup key',
      );
      err.code = 11000;
      throw err;
    }
  };

  // Mock Models
  const mockRolePermissionModel: any = function (data: any) {
    const rpObj: any = {
      ...data,
      _id: data._id || new Types.ObjectId(),
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
      save: async function () {
        checkUniqueConstraint(this);
        const idx = rolePermissionsStore.findIndex((r) => r._id.equals(this._id));
        if (idx >= 0) {
          rolePermissionsStore[idx] = this;
        } else {
          rolePermissionsStore.push(this);
        }
        return this;
      },
    };
    return rpObj;
  };

  mockRolePermissionModel.findOne = (query: any) => ({
    populate: () => ({
      exec: async () => {
        return (
          rolePermissionsStore.find((rp) => {
            const roleMatch = !query.roleId || rp.roleId.toString() === query.roleId.toString();
            const permMatch =
              !query.permissionId || rp.permissionId.toString() === query.permissionId.toString();
            let instMatch = true;
            if ('institutionId' in query) {
              if (query.institutionId === null) {
                instMatch = rp.institutionId === null || rp.institutionId === undefined;
              } else {
                instMatch =
                  rp.institutionId &&
                  rp.institutionId.toString() === query.institutionId.toString();
              }
            }
            return roleMatch && permMatch && instMatch;
          }) || null
        );
      },
    }),
    exec: async () => {
      return (
        rolePermissionsStore.find((rp) => {
          const roleMatch = !query.roleId || rp.roleId.toString() === query.roleId.toString();
          const permMatch =
            !query.permissionId || rp.permissionId.toString() === query.permissionId.toString();
          let instMatch = true;
          if ('institutionId' in query) {
            if (query.institutionId === null) {
              instMatch = rp.institutionId === null || rp.institutionId === undefined;
            } else {
              instMatch =
                rp.institutionId &&
                rp.institutionId.toString() === query.institutionId.toString();
            }
          }
          return roleMatch && permMatch && instMatch;
        }) || null
      );
    },
  });

  mockRolePermissionModel.find = (query: any) => ({
    populate: (field1: string, select1?: string) => ({
      populate: (field2: string, select2?: string) => ({
        exec: async () => {
          return rolePermissionsStore
            .filter((rp) => {
              let roleMatch = true;
              if (query.roleId) {
                roleMatch = rp.roleId.toString() === query.roleId.toString();
              }
              let instMatch = true;
              if ('institutionId' in query) {
                if (query.institutionId === null) {
                  instMatch = rp.institutionId === null || rp.institutionId === undefined;
                } else if (query.institutionId) {
                  instMatch =
                    rp.institutionId &&
                    rp.institutionId.toString() === query.institutionId.toString();
                }
              }
              return roleMatch && instMatch;
            })
            .map((rp) => {
              const copy = { ...rp };
              copy.roleId = rolesStore.find((r) => r._id.equals(rp.roleId));
              copy.permissionId = permissionsStore.find((p) => p._id.equals(rp.permissionId));
              if (copy.institutionId) {
                copy.institutionId = institutionsStore.find((i) =>
                  i._id.equals(rp.institutionId),
                );
              }
              return copy;
            });
        },
      }),
    }),
  });

  mockRolePermissionModel.findOneAndDelete = (query: any) => ({
    exec: async () => {
      const idx = rolePermissionsStore.findIndex((rp) => {
        const roleMatch = !query.roleId || rp.roleId.toString() === query.roleId.toString();
        const permMatch =
          !query.permissionId || rp.permissionId.toString() === query.permissionId.toString();
        let instMatch = true;
        if ('institutionId' in query) {
          if (query.institutionId === null) {
            instMatch = rp.institutionId === null || rp.institutionId === undefined;
          } else {
            instMatch =
              rp.institutionId &&
              rp.institutionId.toString() === query.institutionId.toString();
          }
        }
        return roleMatch && permMatch && instMatch;
      });
      if (idx >= 0) {
        const [deleted] = rolePermissionsStore.splice(idx, 1);
        return deleted;
      }
      return null;
    },
  });

  const mockRoleModel: any = {
    findOne: (q: any) => ({
      exec: async () => rolesStore.find((r) => r.name === q.name) || null,
    }),
    findById: (id: any) => ({
      exec: async () => rolesStore.find((r) => r._id.toString() === id.toString()) || null,
    }),
    find: () => ({
      exec: async () => [...rolesStore],
    }),
  };

  const mockPermissionModel: any = {
    findOne: (q: any) => ({
      exec: async () => permissionsStore.find((p) => p.name === q.name) || null,
    }),
    findById: (id: any) => ({
      exec: async () => permissionsStore.find((p) => p._id.toString() === id.toString()) || null,
    }),
    find: (q?: any) => ({
      exec: async () => {
        if (q && q.name && q.name.$in) {
          return permissionsStore.filter((p) => q.name.$in.includes(p.name));
        }
        return [...permissionsStore];
      },
    }),
  };

  const mockInstitutionModel: any = {
    findById: (id: any) => ({
      exec: async () => institutionsStore.find((i) => i._id.toString() === id.toString()) || null,
    }),
  };

  const service = new RolePermissionsService(
    mockRolePermissionModel,
    mockRoleModel,
    mockPermissionModel,
    mockInstitutionModel,
  );

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

  // =========================================================================
  // TEST SUITE 1: Seed Initial Role Permissions Policy
  // =========================================================================
  console.log('📌 Test Suite 1: Seeding Initial Role-Permissions Mapping');
  const seedResult = await service.seedRolePermissions();
  const expectedTotal =
    INITIAL_ROLE_PERMISSIONS_POLICY[UserRole.SUPER_ADMIN].length +
    INITIAL_ROLE_PERMISSIONS_POLICY[UserRole.ADMIN].length +
    INITIAL_ROLE_PERMISSIONS_POLICY[UserRole.TEACHER].length +
    INITIAL_ROLE_PERMISSIONS_POLICY[UserRole.STUDENT].length;

  assert(
    seedResult.totalPolicies === expectedTotal,
    `Seeded expected total policy count (${expectedTotal})`,
    `Got ${seedResult.totalPolicies}`,
  );
  assert(seedResult.created === expectedTotal, `All ${expectedTotal} mappings newly created`);
  assert(
    rolePermissionsStore.length === expectedTotal,
    `In-memory store contains ${expectedTotal} mapping records`,
  );

  // Breakdown verification
  const superAdminCount = rolePermissionsStore.filter(
    (rp) => rp.roleId.toString() === superAdminRole._id.toString(),
  ).length;
  const adminCount = rolePermissionsStore.filter(
    (rp) => rp.roleId.toString() === adminRole._id.toString(),
  ).length;
  const teacherCount = rolePermissionsStore.filter(
    (rp) => rp.roleId.toString() === teacherRole._id.toString(),
  ).length;
  const studentCount = rolePermissionsStore.filter(
    (rp) => rp.roleId.toString() === studentRole._id.toString(),
  ).length;

  assert(superAdminCount === 50, `SUPER_ADMIN has 50 platform permissions (Got: ${superAdminCount})`);
  assert(adminCount === 43, `ADMIN has 43 institution-level permissions (Got: ${adminCount})`);
  assert(teacherCount === 11, `TEACHER has 11 academic/attendance permissions (Got: ${teacherCount})`);
  assert(studentCount === 7, `STUDENT has 7 self-service permissions (Got: ${studentCount})`);

  // =========================================================================
  // TEST SUITE 2: Seed Idempotency
  // =========================================================================
  console.log('\n📌 Test Suite 2: Seed Idempotency Check');
  const reseedResult = await service.seedRolePermissions();
  assert(reseedResult.created === 0, 'Re-seeding creates 0 duplicate records');
  assert(reseedResult.updated === expectedTotal, `Re-seeding verified ${expectedTotal} existing records`);
  assert(rolePermissionsStore.length === expectedTotal, 'Total mapping count remains unchanged');

  // =========================================================================
  // TEST SUITE 3: Partial Compound Unique Index & Duplicate Protection
  // =========================================================================
  console.log('\n📌 Test Suite 3: Unique Compound Index Validation');
  const firstPerm = permissionsStore[0];

  let duplicateCaught = false;
  try {
    // Attempt to manually instantiate and save duplicate (roleId, permissionId, institutionId: null)
    const duplicateDoc = new mockRolePermissionModel({
      roleId: superAdminRole._id,
      permissionId: firstPerm._id,
      institutionId: null,
      isAllowed: true,
    });
    await duplicateDoc.save();
  } catch (err: any) {
    if (err.code === 11000) {
      duplicateCaught = true;
    }
  }
  assert(duplicateCaught, 'Compound unique index rejects duplicate system mapping (E11000)');

  // =========================================================================
  // TEST SUITE 4: Role Permissions Query & System Policy Retrieval
  // =========================================================================
  console.log('\n📌 Test Suite 4: getPermissionsByRole() System Resolution');
  const studentPerms = await service.getPermissionsByRole(studentRole._id.toString());
  assert(studentPerms.length === 7, `Retrieved 7 permissions for STUDENT role (Got: ${studentPerms.length})`);
  const studentPermNames = studentPerms.map((p) => (p.permissionId as any).name);
  assert(studentPermNames.includes('STUDENT_READ'), 'STUDENT includes STUDENT_READ');
  assert(studentPermNames.includes('ATTENDANCE_READ'), 'STUDENT includes ATTENDANCE_READ');
  assert(!studentPermNames.includes('USER_DELETE'), 'STUDENT does NOT include USER_DELETE');
  assert(!studentPermNames.includes('INSTITUTION_DELETE'), 'STUDENT does NOT include INSTITUTION_DELETE');

  // =========================================================================
  // TEST SUITE 5: Institution Override Overlay Resolution
  // =========================================================================
  console.log('\n📌 Test Suite 5: Institution-Specific Permission Overrides');
  // Suppose School A disables FEE_READ for students (isAllowed: false override)
  const feeReadPerm = permissionsStore.find((p) => p.name === 'FEE_READ');
  const adminUserA = {
    userId: 'admin_school_a',
    role: UserRole.ADMIN,
    institutionId: schoolA._id.toString(),
  };

  await service.assignPermission(
    {
      roleId: studentRole._id.toString(),
      permissionId: feeReadPerm._id.toString(),
      institutionId: schoolA._id.toString(),
      isAllowed: false,
    },
    adminUserA,
  );

  // When querying permissions for Student at School A:
  const studentSchoolAPerms = await service.getPermissionsByRole(
    studentRole._id.toString(),
    schoolA._id.toString(),
  );
  assert(
    studentSchoolAPerms.length === 6,
    `School A student has 6 permissions after revoking FEE_READ override (Got: ${studentSchoolAPerms.length})`,
  );
  assert(
    !studentSchoolAPerms.some((p) => (p.permissionId as any).name === 'FEE_READ'),
    'FEE_READ is successfully excluded by institution override',
  );

  // But for School B (no override), FEE_READ is still present!
  const studentSchoolBPerms = await service.getPermissionsByRole(
    studentRole._id.toString(),
    schoolB._id.toString(),
  );
  assert(
    studentSchoolBPerms.some((p) => (p.permissionId as any).name === 'FEE_READ'),
    'School B student still retains default FEE_READ permission (tenant isolation preserved)',
  );

  // =========================================================================
  // TEST SUITE 6: Multi-Tenant Authorization Security
  // =========================================================================
  console.log('\n📌 Test Suite 6: Multi-Tenant Authorization Security Controls');

  // 1. School Admin attempting to modify Platform/System permission (institutionId: null) -> Forbidden
  let forbiddenPlatformMod = false;
  try {
    await service.assignPermission(
      {
        roleId: teacherRole._id.toString(),
        permissionId: firstPerm._id.toString(),
        institutionId: null,
      },
      adminUserA,
    );
  } catch (err: any) {
    if (err instanceof ForbiddenException) {
      forbiddenPlatformMod = true;
    }
  }
  assert(forbiddenPlatformMod, 'School Admin forbidden from modifying platform-level default mappings (null institutionId)');

  // 2. School Admin A attempting to configure School B overrides -> Forbidden
  let crossTenantDenied = false;
  try {
    await service.assignPermission(
      {
        roleId: teacherRole._id.toString(),
        permissionId: firstPerm._id.toString(),
        institutionId: schoolB._id.toString(),
      },
      adminUserA,
    );
  } catch (err: any) {
    if (err instanceof ForbiddenException) {
      crossTenantDenied = true;
    }
  }
  assert(crossTenantDenied, 'School Admin A forbidden from managing permissions for School B');

  // =========================================================================
  // TEST SUITE 7: Foreign Key Existence Validation
  // =========================================================================
  console.log('\n📌 Test Suite 7: Foreign Key Referential Validation');
  const fakeId = new Types.ObjectId().toString();
  const superAdminUser = {
    userId: 'sa_user',
    role: UserRole.SUPER_ADMIN,
    institutionId: null,
  };

  let invalidRoleCaught = false;
  try {
    await service.assignPermission(
      {
        roleId: fakeId,
        permissionId: firstPerm._id.toString(),
      },
      superAdminUser,
    );
  } catch (err: any) {
    if (err instanceof NotFoundException) {
      invalidRoleCaught = true;
    }
  }
  assert(invalidRoleCaught, 'Non-existent Role ID throws NotFoundException');

  let invalidPermCaught = false;
  try {
    await service.assignPermission(
      {
        roleId: adminRole._id.toString(),
        permissionId: fakeId,
      },
      superAdminUser,
    );
  } catch (err: any) {
    if (err instanceof NotFoundException) {
      invalidPermCaught = true;
    }
  }
  assert(invalidPermCaught, 'Non-existent Permission ID throws NotFoundException');

  let invalidInstCaught = false;
  try {
    await service.assignPermission(
      {
        roleId: adminRole._id.toString(),
        permissionId: firstPerm._id.toString(),
        institutionId: fakeId,
      },
      superAdminUser,
    );
  } catch (err: any) {
    if (err instanceof NotFoundException) {
      invalidInstCaught = true;
    }
  }
  assert(invalidInstCaught, 'Non-existent Institution ID throws NotFoundException');

  // Invalid ObjectId syntax validation
  let badObjectIdCaught = false;
  try {
    await service.assignPermission(
      {
        roleId: 'not-a-valid-object-id',
        permissionId: firstPerm._id.toString(),
      },
      superAdminUser,
    );
  } catch (err: any) {
    if (err instanceof BadRequestException) {
      badObjectIdCaught = true;
    }
  }
  assert(badObjectIdCaught, 'Malformed ObjectId format throws BadRequestException');

  // =========================================================================
  // TEST SUITE 8: Revocation of Role Permissions
  // =========================================================================
  console.log('\n📌 Test Suite 8: Permission Revocation');
  // School Admin A revokes the override previously created
  const revokeResult = await service.revokePermission(
    studentRole._id.toString(),
    feeReadPerm._id.toString(),
    schoolA._id.toString(),
    adminUserA,
  );
  assert(
    revokeResult.message === 'Role-permission mapping revoked successfully.',
    'Revoke institution override returns success message',
  );

  // Non-existent revocation throws NotFoundException
  let notFoundRevoke = false;
  try {
    await service.revokePermission(
      studentRole._id.toString(),
      feeReadPerm._id.toString(),
      schoolA._id.toString(),
      adminUserA,
    );
  } catch (err: any) {
    if (err instanceof NotFoundException) {
      notFoundRevoke = true;
    }
  }
  assert(notFoundRevoke, 'Revoking non-existent mapping throws NotFoundException');

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

runRolePermissionsTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
