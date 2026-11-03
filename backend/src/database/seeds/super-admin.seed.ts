import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { AppModule } from '../../app.module';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { UserRole, UserStatus } from '../../users/enums/user.enums';

// Load environment variables immediately for standalone execution
dotenv.config();

/**
 * ============================================================================
 * SECURE SUPER ADMIN BOOTSTRAP SEED SCRIPT
 * ============================================================================
 * Creates the initial platform SUPER_ADMIN account using environment variables.
 *
 * Security Guarantees:
 * 1. Reads credentials strictly from environment variables (never hardcoded).
 * 2. Validates inputs rigorously before execution.
 * 3. Normalizes email (lowercase, trimmed).
 * 4. Hashes passwords using bcrypt with a configurable secure work factor (default: 12).
 * 5. Strictly enforces `institutionId: null` and `role: SUPER_ADMIN`.
 * 6. Idempotent: Skips execution if Super Admin already exists with the given email.
 * 7. Never logs plaintext passwords or password hashes.
 * 8. Always closes the MongoDB database connection after execution.
 * ============================================================================
 */
async function bootstrapSuperAdmin() {
  const logger = new Logger('SuperAdminBootstrap');
  logger.log('Starting Super Admin bootstrap process...');

  const name = process.env.SUPER_ADMIN_NAME?.trim();
  const rawEmail = process.env.SUPER_ADMIN_EMAIL?.trim();
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const saltRoundsRaw = process.env.BCRYPT_SALT_ROUNDS ?? '12';
  const emailVerifiedApproved =
    process.env.SUPER_ADMIN_EMAIL_VERIFIED?.toLowerCase() !== 'false';

  // --------------------------------------------------------------------------
  // 1. Rigorous Validation of Environment Variables
  // --------------------------------------------------------------------------
  if (!name || name.length < 2) {
    logger.error(
      'Validation Error: SUPER_ADMIN_NAME environment variable is missing or less than 2 characters long.',
    );
    process.exit(1);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!rawEmail || !emailRegex.test(rawEmail)) {
    logger.error(
      'Validation Error: SUPER_ADMIN_EMAIL environment variable is missing or is not a valid email address.',
    );
    process.exit(1);
  }
  const email = rawEmail.toLowerCase();

  if (!password || password.length < 10) {
    logger.error(
      'Validation Error: SUPER_ADMIN_PASSWORD environment variable is missing or must be at least 10 characters long.',
    );
    process.exit(1);
  }

  const saltRounds = parseInt(saltRoundsRaw, 10);
  if (isNaN(saltRounds) || saltRounds < 10 || saltRounds > 16) {
    logger.error(
      'Validation Error: BCRYPT_SALT_ROUNDS must be an integer between 10 and 16.',
    );
    process.exit(1);
  }

  // --------------------------------------------------------------------------
  // 2. Initialize NestJS App Context to connect to MongoDB
  // --------------------------------------------------------------------------
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));

    // Ensure database indexes are in sync
    await userModel.syncIndexes();

    // ------------------------------------------------------------------------
    // 3. Idempotency Check: Prevent duplicate Super Admin creation
    // ------------------------------------------------------------------------
    const existingUserByEmail = await userModel
      .findOne({ email })
      .lean()
      .exec();

    if (existingUserByEmail) {
      if (existingUserByEmail.role === UserRole.SUPER_ADMIN) {
        logger.log(
          `Super Admin account with email '${email}' already exists. Skipping creation (Idempotent).`,
        );
        return;
      } else {
        logger.error(
          `Conflict: User with email '${email}' already exists with role '${existingUserByEmail.role}'. Cannot promote or overwrite.`,
        );
        process.exitCode = 1;
        return;
      }
    }

    // Check if any Super Admin already exists in the system
    const existingSuperAdminCount = await userModel
      .countDocuments({ role: UserRole.SUPER_ADMIN })
      .exec();

    if (existingSuperAdminCount > 0) {
      logger.warn(
        `Notice: ${existingSuperAdminCount} Super Admin(s) already exist in the database. Bootstrapping additional Super Admin for '${email}'.`,
      );
    }

    // ------------------------------------------------------------------------
    // 4. Secure Password Hashing
    // ------------------------------------------------------------------------
    logger.log(
      `Hashing password with bcrypt work factor (salt rounds): ${saltRounds}...`,
    );
    const salt = await bcrypt.genSalt(saltRounds);
    const passwordHash = await bcrypt.hash(password, salt);

    // ------------------------------------------------------------------------
    // 5. Create Super Admin User Document
    // ------------------------------------------------------------------------
    const superAdmin = new userModel({
      name,
      email,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      institutionId: null, // Super Admin is never tied to an institution
      status: UserStatus.ACTIVE,
      isEmailVerified: emailVerifiedApproved,
      lastLoginAt: null,
      passwordChangedAt: null,
    });

    const savedUser = await superAdmin.save();

    logger.log('======================================================');
    logger.log(' Super Admin successfully bootstrapped!');
    logger.log(` ID: ${savedUser._id}`);
    logger.log(` Name: ${savedUser.name}`);
    logger.log(` Email: ${savedUser.email}`);
    logger.log(` Role: ${savedUser.role}`);
    logger.log(` Status: ${savedUser.status}`);
    logger.log(` Email Verified: ${savedUser.isEmailVerified}`);
    logger.log(` Created At: ${savedUser.createdAt}`);
    logger.log('======================================================');
    logger.log('Notice: Never commit credentials to version control.');
  } catch (error: any) {
    logger.error(`Super Admin bootstrap failed: ${error.message}`, error.stack);
    process.exitCode = 1;
  } finally {
    // ------------------------------------------------------------------------
    // 6. Ensure MongoDB connection is gracefully closed
    // ------------------------------------------------------------------------
    await app.close();
    logger.log('MongoDB connection closed.');
  }
}

// Execute bootstrap if run directly
if (require.main === module) {
  bootstrapSuperAdmin();
}

export { bootstrapSuperAdmin };

