import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { RegisterDto } from '../src/auth/dto/register.dto';
import { Institution, InstitutionDocument } from '../src/institutions/schemas/institution.schema';
import { User, UserDocument } from '../src/users/schemas/user.schema';
import { InstitutionType, InstitutionStatus, SubscriptionPlan, SubscriptionStatus } from '../src/institutions/enums/institution.enums';
import { UserRole } from '../src/users/enums/user.enums';

async function runRegisterTests() {
  console.log('=== RUNNING TASK 06 SECURE REGISTRATION TESTS ===');

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const authService = app.get(AuthService);
  const institutionModel = app.get<Model<InstitutionDocument>>(getModelToken(Institution.name));
  const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));

  // 1. Create a dummy active institution for testing
  const dummyInst = await institutionModel.create({
    name: 'Test Oxford Academy',
    code: 'OXF_' + Date.now(),
    type: InstitutionType.SCHOOL,
    email: `oxford_${Date.now()}@school.edu`,
    phone: '+919876543210',
    address: { street: '1st St', city: 'Delhi', state: 'Delhi', country: 'India', postalCode: '110001' },
    status: InstitutionStatus.ACTIVE,
    subscription: {
      plan: SubscriptionPlan.STANDARD,
      status: SubscriptionStatus.ACTIVE,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
    createdBy: new Types.ObjectId(),
  });

  const mockAdminUser = {
    userId: new Types.ObjectId().toString(),
    email: 'principal@oxford.edu',
    role: UserRole.ADMIN,
    institutionId: dummyInst._id.toString(),
  };

  try {
    // ------------------------------------------------------------------------
    // TEST 1: Weak Password Validation
    // ------------------------------------------------------------------------
    console.log('\n[TEST 1] Testing Weak Password Validation...');
    const weakDto = plainToInstance(RegisterDto, {
      name: 'Weak User',
      email: 'weak@example.com',
      password: 'password123', // missing uppercase letter
      role: UserRole.TEACHER,
      institutionId: dummyInst._id.toString(),
    });
    const weakErrors = await validate(weakDto);
    if (weakErrors.length > 0 && weakErrors.some(e => e.property === 'password')) {
      console.log(' PASSED: Weak password correctly rejected by DTO validation!');
    } else {
      throw new Error('FAILED: Weak password was not caught by validation');
    }

    // ------------------------------------------------------------------------
    // TEST 2: Unauthorized Public Role Assignment (SUPER_ADMIN / ADMIN)
    // ------------------------------------------------------------------------
    console.log('\n[TEST 2] Testing Unauthorized Public Role Assignment...');
    let caughtUnauthorizedPublic = false;
    try {
      await authService.register(
        {
          name: 'Hacker Admin',
          email: 'hacker@example.com',
          password: 'StrongPassword123',
          role: UserRole.SUPER_ADMIN,
        },
        undefined, // Unauthenticated public request
      );
    } catch (err: any) {
      if (err.status === 403) {
        caughtUnauthorizedPublic = true;
        console.log(` PASSED: Public registration for SUPER_ADMIN rejected with 403 Forbidden!`);
      }
    }
    if (!caughtUnauthorizedPublic) throw new Error('FAILED: Public SUPER_ADMIN registration was allowed!');

    // ------------------------------------------------------------------------
    // TEST 3: Invalid Non-Existent Institution
    // ------------------------------------------------------------------------
    console.log('\n[TEST 3] Testing Invalid Institution ID...');
    let caughtInvalidInst = false;
    try {
      const nonExistentId = new Types.ObjectId().toString();
      await authService.register(
        {
          name: 'Teacher One',
          email: 'teacher.fake@example.com',
          password: 'StrongPassword123',
          role: UserRole.ADMIN,
          institutionId: nonExistentId,
        },
        { userId: '1', email: 'sa@test.com', role: UserRole.SUPER_ADMIN, institutionId: null },
      );
    } catch (err: any) {
      if (err.status === 404) {
        caughtInvalidInst = true;
        console.log(` PASSED: Non-existent institution rejected with 404 Not Found!`);
      }
    }
    if (!caughtInvalidInst) throw new Error('FAILED: Non-existent institution was not rejected!');

    // ------------------------------------------------------------------------
    // TEST 4: Valid Registration (Admin Onboarding a Teacher)
    // ------------------------------------------------------------------------
    console.log('\n[TEST 4] Testing Valid Teacher Registration by Admin...');
    const validEmail = `rahul_${Date.now()}@example.com`;
    const regResult = await authService.register(
      {
        name: 'Rahul Sharma',
        email: validEmail,
        password: 'StrongPassword123',
        role: UserRole.TEACHER,
        institutionId: 'arbitrary_untrusted_id_ignored', // Should be ignored and derived from mockAdminUser!
      },
      mockAdminUser,
    );
    console.log(` PASSED: Teacher successfully registered!`);
    console.log(`   User ID: ${regResult.user.id}`);
    console.log(`   Name: ${regResult.user.name}`);
    console.log(`   Email: ${regResult.user.email}`);
    console.log(`   Role: ${regResult.user.role}`);
    console.log(`   Derived Institution ID: ${regResult.user.institution.id} (Matches Admin: ${regResult.user.institution.id === mockAdminUser.institutionId})`);
    console.log(`   Verified passwordHash is excluded: ${(regResult.user as any).passwordHash === undefined}`);

    // ------------------------------------------------------------------------
    // TEST 5: Duplicate Email Rejection
    // ------------------------------------------------------------------------
    console.log('\n[TEST 5] Testing Duplicate Email Rejection...');
    let caughtDuplicate = false;
    try {
      await authService.register(
        {
          name: 'Duplicate Rahul',
          email: validEmail, // identical email
          password: 'StrongPassword123',
          role: UserRole.TEACHER,
        },
        mockAdminUser,
      );
    } catch (err: any) {
      if (err.status === 409) {
        caughtDuplicate = true;
        console.log(` PASSED: Duplicate email correctly rejected with 409 Conflict!`);
      }
    }
    if (!caughtDuplicate) throw new Error('FAILED: Duplicate email was not caught!');

    // Cleanup test records
    await userModel.deleteOne({ email: validEmail });
    await institutionModel.deleteOne({ _id: dummyInst._id });
    console.log('\n[CLEANUP] Test data cleaned up.');
    console.log('\n ALL TASK 06 REGISTRATION TESTS PASSED 100%!');
  } catch (error: any) {
    console.error('Test error:', error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

runRegisterTests();

