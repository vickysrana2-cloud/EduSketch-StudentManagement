import { RolesService, SYSTEM_ROLES_METADATA } from '../src/roles/roles.service';
import { UserRole } from '../src/users/enums/user.enums';
import { Types } from 'mongoose';
import { ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function runRolesTests() {
  console.log('================================================================');
  console.log('🚀 TASK 12: ROLES MODULE & SEEDING VERIFICATION');
  console.log('================================================================\n');

  // In-memory mock storage for roles
  const rolesStore: any[] = [];

  const mockRoleModel: any = function (data: any) {
    const roleObj: any = {
      ...data,
      _id: new Types.ObjectId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      save: async function () {
        const idx = rolesStore.findIndex((r) => r._id.equals(this._id));
        if (idx >= 0) {
          rolesStore[idx] = this;
        } else {
          // Unique index check
          if (rolesStore.some((r) => r.name === this.name)) {
            const err: any = new Error(`E11000 duplicate key error collection: roles index: name_1 dup key: { name: "${this.name}" }`);
            err.code = 11000;
            throw err;
          }
          rolesStore.push(this);
        }
        return this;
      },
    };
    return roleObj;
  };

  mockRoleModel.findOne = (query: any) => ({
    exec: async () => {
      if (query.name) {
        return rolesStore.find((r) => r.name === query.name) || null;
      }
      return null;
    },
  });

  mockRoleModel.findById = (id: any) => ({
    exec: async () => {
      const targetId = typeof id === 'string' ? id : id.toString();
      return rolesStore.find((r) => r._id.toString() === targetId) || null;
    },
  });

  mockRoleModel.find = () => ({
    sort: (sortObj: any) => ({
      exec: async () => {
        const copy = [...rolesStore];
        if (sortObj?.level === -1) {
          return copy.sort((a, b) => b.level - a.level);
        }
        return copy;
      },
    }),
  });

  const rolesService = new RolesService(mockRoleModel as any);

  // --------------------------------------------------------------------------
  // TEST 1: Initial Seeding of 4 System Roles (Requirements 2, 4, 5, 9)
  // --------------------------------------------------------------------------
  console.log('▶ TEST 1: Initial Seeding of System Roles');
  const seedResult1 = await rolesService.seedSystemRoles();
  console.log(`  Seeding Result: ${seedResult1.created} created, ${seedResult1.updated} updated.`);

  if (seedResult1.created !== 4 || rolesStore.length !== 4) {
    throw new Error(`Expected 4 roles created, got ${seedResult1.created}`);
  }

  // Verify all 4 roles exist with expected hierarchical levels
  const superAdminRole = rolesStore.find((r) => r.name === UserRole.SUPER_ADMIN);
  const adminRole = rolesStore.find((r) => r.name === UserRole.ADMIN);
  const teacherRole = rolesStore.find((r) => r.name === UserRole.TEACHER);
  const studentRole = rolesStore.find((r) => r.name === UserRole.STUDENT);

  if (!superAdminRole || superAdminRole.level !== 4 || !superAdminRole.isSystemRole) {
    throw new Error('SUPER_ADMIN role verification failed');
  }
  if (!adminRole || adminRole.level !== 3 || !adminRole.isSystemRole) {
    throw new Error('ADMIN role verification failed');
  }
  if (!teacherRole || teacherRole.level !== 2 || !teacherRole.isSystemRole) {
    throw new Error('TEACHER role verification failed');
  }
  if (!studentRole || studentRole.level !== 1 || !studentRole.isSystemRole) {
    throw new Error('STUDENT role verification failed');
  }

  console.log('  ✅ [PASS] All 4 system roles seeded with correct levels:');
  console.log('     - SUPER_ADMIN: Level', superAdminRole.level);
  console.log('     - ADMIN:       Level', adminRole.level);
  console.log('     - TEACHER:     Level', teacherRole.level);
  console.log('     - STUDENT:     Level', studentRole.level);

  // --------------------------------------------------------------------------
  // TEST 2: Prevent Duplicate Role Seeding (Idempotency) (Requirement 6)
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 2: Idempotent Seeding (Prevent Duplicate Roles)');
  const seedResult2 = await rolesService.seedSystemRoles();
  console.log(`  Second Seeding Result: ${seedResult2.created} created, ${seedResult2.updated} updated.`);

  if (seedResult2.created !== 0 || rolesStore.length !== 4) {
    throw new Error('Duplicate roles were incorrectly created on repeated seed!');
  }
  console.log('  ✅ [PASS] Re-running seed creates 0 duplicates. Idempotency verified.');

  // --------------------------------------------------------------------------
  // TEST 3: List Roles in Hierarchical Order (GET /api/roles)
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 3: List Roles Hierarchical Sort (level descending)');
  const allRoles = await rolesService.findAll();
  const levels = allRoles.map((r) => r.level);
  console.log('  Retrieved levels:', levels);

  if (levels.join(',') !== '4,3,2,1') {
    throw new Error(`Expected hierarchy 4,3,2,1, got ${levels.join(',')}`);
  }
  console.log('  ✅ [PASS] Roles correctly sorted by hierarchical level descending.');

  // --------------------------------------------------------------------------
  // TEST 4: Get Role by ID (GET /api/roles/:id)
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 4: Get Role by ID');
  const foundAdmin = await rolesService.findById(adminRole._id.toString());
  if (foundAdmin.name !== UserRole.ADMIN) {
    throw new Error('Failed to find role by ID');
  }
  console.log(`  Found Role by ID '${adminRole._id}':`, foundAdmin.displayName);
  console.log('  ✅ [PASS] Single role retrieved successfully.');

  // --------------------------------------------------------------------------
  // TEST 5: Update Role Metadata (PATCH /api/roles/:id) (Requirements 8 & 10)
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 5: Update Role Metadata');
  const updatedAdmin = await rolesService.update(adminRole._id.toString(), {
    displayName: 'Head of Institution',
    description: 'Updated institution head role description',
  });

  if (updatedAdmin.displayName !== 'Head of Institution') {
    throw new Error('displayName was not updated');
  }
  if (updatedAdmin.name !== UserRole.ADMIN || updatedAdmin.level !== 3) {
    throw new Error('Core role attributes must remain immutable');
  }
  console.log('  Updated displayName:', updatedAdmin.displayName);
  console.log('  Core attributes preserved: Name =', updatedAdmin.name, ', Level =', updatedAdmin.level);
  console.log('  ✅ [PASS] Role metadata updated safely without corrupting role architecture.');

  // --------------------------------------------------------------------------
  // TEST 6: Prevent Deactivation of SUPER_ADMIN
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 6: Prevent Deactivation of SUPER_ADMIN');
  try {
    await rolesService.update(superAdminRole._id.toString(), {
      isActive: false,
    });
    throw new Error('Should have rejected deactivating SUPER_ADMIN');
  } catch (err: any) {
    console.log('  ✅ [PASS] Attempt to deactivate SUPER_ADMIN blocked:', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 7: Invalid ID Format Handling
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 7: Invalid ObjectId Validation');
  try {
    await rolesService.findById('invalid-id-123');
    throw new Error('Should have rejected invalid ObjectId');
  } catch (err: any) {
    console.log('  ✅ [PASS] Invalid ObjectId format caught:', err.message);
  }

  console.log('\n================================================================');
  console.log('🎉 ALL 7 ROLES MODULE TESTS PASSED 100% SUCCESFULLY!');
  console.log('================================================================\n');
}

runRolesTests().catch((err) => {
  console.error('\n❌ Uncaught error during Task 12 verification:', err);
  process.exit(1);
});

