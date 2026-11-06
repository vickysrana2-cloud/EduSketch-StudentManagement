import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { AppModule } from '../../app.module';
import { PermissionsService } from '../../permissions/permissions.service';

dotenv.config();

/**
 * ============================================================================
 * PERMISSIONS BOOTSTRAP SEED SCRIPT (Task 13)
 * ============================================================================
 * Seeds the standard catalog of system permission definitions across all 10 modules
 * and 5 granular actions.
 *
 * Guarantees:
 * 1. Idempotency: Prevents duplicate permission seeding.
 * 2. Immutable module and action mappings.
 * 3. Gracefully closes database connection upon completion.
 * ============================================================================
 */
async function bootstrapPermissions() {
  const logger = new Logger('PermissionsBootstrap');
  logger.log('Starting Permissions catalog seeding process...');

  try {
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    const permissionsService = app.get(PermissionsService);
    const result = await permissionsService.seedPermissions();

    logger.log(
      `Permissions seeding completed successfully: ${result.created} created, ${result.updated} verified/updated (Total: ${result.total})`,
    );

    await app.close();
    logger.log('Database connection closed.');
    process.exit(0);
  } catch (error: any) {
    logger.error(`Error during permissions seeding: ${error.message}`, error.stack);
    process.exit(1);
  }
}

bootstrapPermissions();

