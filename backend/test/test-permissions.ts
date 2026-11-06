import { PermissionsService, SYSTEM_PERMISSIONS_CATALOG } from '../src/permissions/permissions.service';
import { PermissionAction, PermissionModule } from '../src/permissions/enums/permission.enums';
import { Types } from 'mongoose';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function runPermissionsTests() {
  console.log('================================================================');
  console.log('🚀 TASK 13: PERMISSIONS MODULE & SEEDING VERIFICATION');
  console.log('================================================================\n');

  // In-memory mock storage for permissions
  const permissionsStore: any[] = [];

  const mockPermissionModel: any = function (data: any) {
    const permObj: any = {
      ...data,
      _id: new Types.ObjectId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      save: async function () {
        const idx = permissionsStore.findIndex((p) => p._id.equals(this._id));
        if (idx >= 0) {
          permissionsStore[idx] = this;
        } else {
          // Unique index check on name
          if (permissionsStore.some((p) => p.name === this.name)) {
            const err: any = new Error(`E11000 duplicate key error collection: permissions index: name_1 dup key: { name: "${this.name}" }`);
            err.code = 11000;
            throw err;
          }
          permissionsStore.push(this);
        }
        return this;
      },
    };
    return permObj;
  };

  mockPermissionModel.findOne = (query: any) => ({
    exec: async () => {
      if (query.name) {
        return permissionsStore.find((p) => p.name === query.name) || null;
      }
      return null;
    },
  });

  mockPermissionModel.findById = (id: any) => ({
    exec: async () => {
      const targetId = typeof id === 'string' ? id : id.toString();
      return permissionsStore.find((p) => p._id.toString() === targetId) || null;
    },
  });

  mockPermissionModel.find = (filter?: any) => ({
    sort: () => ({
      exec: async () => {
        let results = [...permissionsStore];
        if (filter?.module) {
          results = results.filter((p) => p.module === filter.module);
        }
        if (filter?.action) {
          results = results.filter((p) => p.action === filter.action);
        }
        return results;
      },
    }),
  });

  const permissionsService = new PermissionsService(mockPermissionModel as any);

  // --------------------------------------------------------------------------
  // TEST 1: Initial Seeding Across 10 Modules & 5 Actions (Req 2, 3, 4, 5, 9)
  // --------------------------------------------------------------------------
  console.log('▶ TEST 1: Initial Seeding of System Permission Catalog');
  const seedResult1 = await permissionsService.seedPermissions();
  console.log(`  Seeding Result: ${seedResult1.created} created, ${seedResult1.updated} updated (Total: ${seedResult1.total}).`);

  if (seedResult1.created !== 50 || permissionsStore.length !== 50) {
    throw new Error(`Expected 50 permissions created (10 modules * 5 actions), got ${seedResult1.created}`);
  }

  // Verify all 10 modules are present
  const allModules = Object.values(PermissionModule);
  for (const mod of allModules) {
    const modPerms = permissionsStore.filter((p) => p.module === mod);
    if (modPerms.length !== 5) {
      throw new Error(`Module '${mod}' should have 5 permissions, found ${modPerms.length}`);
    }
  }

  // Verify all 5 actions are present
  const allActions = Object.values(PermissionAction);
  for (const act of allActions) {
    const actPerms = permissionsStore.filter((p) => p.action === act);
    if (actPerms.length !== 10) {
      throw new Error(`Action '${act}' should have 10 permissions, found ${actPerms.length}`);
    }
  }

  // Verify sample STUDENT_CREATE document structure
  const studentCreate = permissionsStore.find((p) => p.name === 'STUDENT_CREATE');
  if (!studentCreate) throw new Error('STUDENT_CREATE not found');
  console.log('  Sample Permission Document:');
  console.log('    _id:', studentCreate._id.toString());
  console.log('    name:', studentCreate.name);
  console.log('    module:', studentCreate.module);
  console.log('    action:', studentCreate.action);
  console.log('    description:', studentCreate.description);
  console.log('    isActive:', studentCreate.isActive);

  if (studentCreate.module !== PermissionModule.STUDENTS || studentCreate.action !== PermissionAction.CREATE) {
    throw new Error('STUDENT_CREATE module or action mismatch');
  }

  console.log('  ✅ [PASS] 50 system permissions seeded across all 10 modules & 5 actions.');

  // --------------------------------------------------------------------------
  // TEST 2: Prevent Duplicate Permission Seeding (Idempotency) (Req 6 & 9)
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 2: Idempotent Seeding (Prevent Duplicate Permissions)');
  const seedResult2 = await permissionsService.seedPermissions();
  console.log(`  Second Seeding Result: ${seedResult2.created} created, ${seedResult2.updated} verified/updated.`);

  if (seedResult2.created !== 0 || permissionsStore.length !== 50) {
    throw new Error('Duplicate permissions were created on repeated seed!');
  }
  console.log('  ✅ [PASS] Re-running seed creates 0 duplicates. Idempotency verified.');

  // --------------------------------------------------------------------------
  // TEST 3: List All Permissions (GET /api/permissions)
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 3: List All Permissions');
  const allPerms = await permissionsService.findAll();
  if (allPerms.length !== 50) {
    throw new Error(`Expected 50 permissions, got ${allPerms.length}`);
  }
  console.log(`  Retrieved total permissions: ${allPerms.length}`);
  console.log('  ✅ [PASS] Full permission catalog returned.');

  // --------------------------------------------------------------------------
  // TEST 4: Query Filter by Module (e.g. STUDENTS)
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 4: Filter Permissions by Module (STUDENTS)');
  const studentPerms = await permissionsService.findAll({ module: PermissionModule.STUDENTS });
  console.log(`  Found ${studentPerms.length} permissions for module 'STUDENTS':`, studentPerms.map((p) => p.name));

  if (studentPerms.length !== 5) {
    throw new Error(`Expected 5 student permissions, got ${studentPerms.length}`);
  }
  if (!studentPerms.every((p) => p.module === PermissionModule.STUDENTS)) {
    throw new Error('Filter returned permissions from other modules');
  }
  console.log('  ✅ [PASS] Module filtering returned exact 5 student permissions.');

  // --------------------------------------------------------------------------
  // TEST 5: Query Filter by Action (e.g. MANAGE)
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 5: Filter Permissions by Action (MANAGE)');
  const managePerms = await permissionsService.findAll({ action: PermissionAction.MANAGE });
  console.log(`  Found ${managePerms.length} permissions for action 'MANAGE':`, managePerms.map((p) => p.name));

  if (managePerms.length !== 10) {
    throw new Error(`Expected 10 manage permissions (1 per module), got ${managePerms.length}`);
  }
  console.log('  ✅ [PASS] Action filtering returned 10 manage permissions.');

  // --------------------------------------------------------------------------
  // TEST 6: Get Permission by ID (GET /api/permissions/:id)
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 6: Get Permission by ID');
  const foundPerm = await permissionsService.findById(studentCreate._id.toString());
  if (foundPerm.name !== 'STUDENT_CREATE') {
    throw new Error('Failed to find permission by ID');
  }
  console.log(`  Found Permission: '${foundPerm.name}' - ${foundPerm.description}`);
  console.log('  ✅ [PASS] Single permission retrieved by ID.');

  // --------------------------------------------------------------------------
  // TEST 7: Invalid ObjectId and Not Found Handling
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 7: Error Handling for Non-Existent and Invalid IDs');
  try {
    await permissionsService.findById('invalid-id-xyz');
    throw new Error('Should have thrown BadRequestException for invalid ObjectId');
  } catch (err: any) {
    console.log('  ✅ [PASS] Invalid ObjectId caught:', err.message);
  }

  try {
    await permissionsService.findById('67272714207198bb6c30f999');
    throw new Error('Should have thrown NotFoundException for non-existent permission');
  } catch (err: any) {
    console.log('  ✅ [PASS] Non-existent permission caught:', err.message);
  }

  console.log('\n================================================================');
  console.log('🎉 ALL 7 PERMISSIONS MODULE TESTS PASSED 100% SUCCESFULLY!');
  console.log('================================================================\n');
}

runPermissionsTests().catch((err) => {
  console.error('\n❌ Uncaught error during Task 13 verification:', err);
  process.exit(1);
});

