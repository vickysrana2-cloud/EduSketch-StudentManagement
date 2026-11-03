import { NestFactory } from '@nestjs/core';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppModule } from '../src/app.module';
import { Institution, InstitutionDocument } from '../src/institutions/schemas/institution.schema';
import { User, UserDocument } from '../src/users/schemas/user.schema';
import { InstitutionType, InstitutionStatus, SubscriptionPlan, SubscriptionStatus } from '../src/institutions/enums/institution.enums';
import { UserRole, UserStatus } from '../src/users/enums/user.enums';
import { MongoExceptionFilter } from '../src/common/filters/mongo-exception.filter';

async function runIntegrityTests() {
  console.log('=== RUNNING DATABASE INTEGRITY AND DUPLICATE TESTS ===');

  const app = await NestFactory.create(AppModule, { logger: false });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new MongoExceptionFilter());
  await app.init();

  const institutionModel = app.get<Model<InstitutionDocument>>(
    getModelToken(Institution.name),
  );
  const userModel = app.get<Model<UserDocument>>(
    getModelToken(User.name),
  );

  // Sync schema indexes with MongoDB Atlas
  await institutionModel.syncIndexes();
  await userModel.syncIndexes();

  const testCode = 'INTEGRITY_TEST_' + Date.now();
  const testEmail = `integrity_${Date.now()}@example.com`;
  const dummyUserId = new Types.ObjectId();

  try {
    // ------------------------------------------------------------------------
    // TEST 1: Duplicate Institution Code
    // ------------------------------------------------------------------------
    console.log('\n[TEST 1] Testing Duplicate Institution Code...');
    const inst1 = await institutionModel.create({
      name: 'Integrity School 1',
      code: testCode,
      type: InstitutionType.SCHOOL,
      email: `inst_${Date.now()}@test.com`,
      phone: '+919876543210',
      address: {
        street: '123 Test St',
        city: 'Nagpur',
        state: 'Maharashtra',
        country: 'India',
        postalCode: '440001',
      },
      status: InstitutionStatus.ACTIVE,
      subscription: {
        plan: SubscriptionPlan.BASIC,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      createdBy: dummyUserId,
    });
    console.log(` Created first institution with code '${testCode}'`);

    let caughtDuplicateCode = false;
    try {
      await institutionModel.create({
        name: 'Integrity School 2',
        code: testCode, // Identical code
        type: InstitutionType.COLLEGE,
        email: `inst2_${Date.now()}@test.com`,
        phone: '+919876543211',
        address: {
          street: '456 Test St',
          city: 'Nagpur',
          state: 'Maharashtra',
          country: 'India',
          postalCode: '440001',
        },
        status: InstitutionStatus.ACTIVE,
        subscription: {
          plan: SubscriptionPlan.STANDARD,
          status: SubscriptionStatus.ACTIVE,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
        createdBy: dummyUserId,
      });
    } catch (err: any) {
      if (err.code === 11000) {
        caughtDuplicateCode = true;
        console.log(` PASSED: Duplicate code successfully rejected by MongoDB Atlas (Code 11000)!`);
      } else {
        throw err;
      }
    }
    if (!caughtDuplicateCode) {
      throw new Error('FAILED: Duplicate code was not rejected!');
    }

    // ------------------------------------------------------------------------
    // TEST 2: Duplicate User Email
    // ------------------------------------------------------------------------
    console.log('\n[TEST 2] Testing Duplicate User Email...');
    const user1 = await userModel.create({
      name: 'Integrity User 1',
      email: testEmail,
      passwordHash: '$2a$12$e8YI1f4Ww18jW.4u7y0oIeYt60kF.m5v8i4F9XyA7ZgM.X123456',
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      institutionId: null,
    });
    console.log(` Created first user with email '${testEmail}'`);

    let caughtDuplicateEmail = false;
    try {
      await userModel.create({
        name: 'Integrity User 2',
        email: testEmail, // Identical email
        passwordHash: '$2a$12$e8YI1f4Ww18jW.4u7y0oIeYt60kF.m5v8i4F9XyA7ZgM.X123456',
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        institutionId: null,
      });
    } catch (err: any) {
      if (err.code === 11000) {
        caughtDuplicateEmail = true;
        console.log(` PASSED: Duplicate email successfully rejected by MongoDB Atlas (Code 11000)!`);
      } else {
        throw err;
      }
    }
    if (!caughtDuplicateEmail) {
      throw new Error('FAILED: Duplicate email was not rejected!');
    }

    // ------------------------------------------------------------------------
    // TEST 3: Schema-Level Validation for Role & Institution Consistency
    // ------------------------------------------------------------------------
    console.log('\n[TEST 3] Testing Schema-Level Consistency Validation...');
    let caughtSchemaIntegrityViolation = false;
    try {
      // Super Admin with non-null institutionId
      await userModel.create({
        name: 'Invalid Super Admin',
        email: `invalid_sa_${Date.now()}@test.com`,
        passwordHash: 'dummy_hash',
        role: UserRole.SUPER_ADMIN,
        institutionId: inst1._id, // VIOLATION!
      });
    } catch (err: any) {
      if (err.name === 'ValidationError') {
        caughtSchemaIntegrityViolation = true;
        console.log(` PASSED: Schema validation rejected Super Admin with non-null institutionId!`);
      } else {
        throw err;
      }
    }
    if (!caughtSchemaIntegrityViolation) {
      throw new Error('FAILED: Schema validation failed to block invalid Super Admin institution assignment!');
    }

    // Cleanup test data
    console.log('\n[CLEANUP] Cleaning up test records from database...');
    await institutionModel.deleteOne({ _id: inst1._id });
    await userModel.deleteOne({ _id: user1._id });
    console.log(' Cleanup completed.');

    console.log('\n ALL DATA INTEGRITY TESTS PASSED SUCCESSFULLY!');
  } catch (error: any) {
    console.error('Test execution failed:', error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

runIntegrityTests();

