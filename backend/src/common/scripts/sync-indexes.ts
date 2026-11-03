import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from '../../app.module';
import { Institution, InstitutionDocument } from '../../institutions/schemas/institution.schema';
import { User, UserDocument } from '../../users/schemas/user.schema';

/**
 * ============================================================================
 * PRODUCTION INDEX SYNCHRONIZATION SCRIPT
 * ============================================================================
 * In production environments where `autoIndex: false` is configured, this
 * script can be executed during CI/CD migrations to build or update indexes
 * without blocking active traffic.
 *
 * Usage:
 *   npx ts-node src/common/scripts/sync-indexes.ts
 * ============================================================================
 */
async function syncIndexes() {
  const logger = new Logger('IndexSync');
  logger.log('Starting MongoDB Index Synchronization...');

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const institutionModel = app.get<Model<InstitutionDocument>>(
      getModelToken(Institution.name),
    );
    const userModel = app.get<Model<UserDocument>>(
      getModelToken(User.name),
    );

    logger.log('Syncing indexes for Institution collection...');
    const institutionDiff = await institutionModel.syncIndexes();
    logger.log(
      `Institution indexes synced. Changes: ${JSON.stringify(institutionDiff)}`,
    );

    logger.log('Syncing indexes for User collection...');
    const userDiff = await userModel.syncIndexes();
    logger.log(`User indexes synced. Changes: ${JSON.stringify(userDiff)}`);

    logger.log('Index synchronization completed successfully.');
  } catch (error: any) {
    logger.error(`Error syncing indexes: ${error.message}`, error.stack);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

if (require.main === module) {
  syncIndexes();
}

