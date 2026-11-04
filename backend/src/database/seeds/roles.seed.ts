import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { AppModule } from '../../app.module';
import { RolesService } from '../../roles/roles.service';

dotenv.config();

/**
 * ============================================================================
 * ROLES BOOTSTRAP SEED SCRIPT (Task 12)
 * ============================================================================
 * Seeds the 4 immutable system roles (SUPER_ADMIN, ADMIN, TEACHER, STUDENT)
 * with hierarchical levels and metadata.
 *
 * Guarantees:
 * 1. Idempotency: Prevents duplicate role seeding.
 * 2. Immutable levels and system role flags.
 * 3. Gracefully closes database connection upon completion.
 * ============================================================================
 */
async function bootstrapRoles() {
  const logger = new Logger('RolesBootstrap');
  logger.log('Starting System Roles seeding process...');

  try {
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    const rolesService = app.get(RolesService);
    const result = await rolesService.seedSystemRoles();

    logger.log(
      `Roles seeding completed successfully: ${result.created} created, ${result.updated} verified/updated (Total: ${result.total})`,
    );

    await app.close();
    logger.log('Database connection closed.');
    process.exit(0);
  } catch (error: any) {
    logger.error(`Error during roles seeding: ${error.message}`, error.stack);
    process.exit(1);
  }
}

bootstrapRoles();

