import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { AppModule } from '../../app.module';
import { RolePermissionsService } from '../../role-permissions/role-permissions.service';

dotenv.config();

/**
 * ============================================================================
 * ROLE-PERMISSIONS BOOTSTRAP SEED SCRIPT (Task 14)
 * ============================================================================
 * Seeds the standard platform role-permission mapping policy across:
 * - SUPER_ADMIN (Platform governance: 50 permissions)
 * - ADMIN (Institution management: 41 permissions)
 * - TEACHER (Assigned academic and attendance operations: 11 permissions)
 * - STUDENT (Own academic visibility and self-service: 7 permissions)
 *
 * Guarantees:
 * 1. Idempotency: Uses upsert logic to avoid duplicates.
 * 2. Referential integrity: Validates Role and Permission existence.
 * 3. System-level default assignments (institutionId = null).
 * 4. Gracefully closes connection upon completion.
 * ============================================================================
 */
async function bootstrapRolePermissions() {
  const logger = new Logger('RolePermissionsBootstrap');
  logger.log('Starting RolePermissions mapping seeding process...');

  try {
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    const rolePermissionsService = app.get(RolePermissionsService);
    const result = await rolePermissionsService.seedRolePermissions();

    logger.log(
      `Role-Permissions seeding completed successfully: ${result.created} created, ${result.updated} already configured/verified (Total Processed: ${result.totalPolicies})`,
    );

    await app.close();
    logger.log('Database connection closed.');
    process.exit(0);
  } catch (error: any) {
    logger.error(
      `Error during role-permissions seeding: ${error.message}`,
      error.stack,
    );
    process.exit(1);
  }
}

bootstrapRolePermissions();
