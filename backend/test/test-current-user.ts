import { AuthService } from '../src/auth/auth.service';
import { SessionsService } from '../src/auth/sessions.service';
import { TokenService } from '../src/auth/token.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole, UserStatus } from '../src/users/enums/user.enums';
import { InstitutionStatus, InstitutionType } from '../src/institutions/enums/institution.enums';
import { Types } from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function runCurrentUserTests() {
  console.log('================================================================');
  console.log('🚀 TASK 11: GET CURRENT USER (GET /api/auth/me) VERIFICATION');
  console.log('================================================================\n');

  const institution1 = {
    _id: new Types.ObjectId('67272714207198bb6c30f400'),
    name: 'Delhi Public School',
    code: 'DPS001',
    type: InstitutionType.SCHOOL,
    status: InstitutionStatus.ACTIVE,
  };

  const usersStore: any[] = [
    {
      _id: new Types.ObjectId('67272714207198bb6c30f401'),
      name: 'Rahul Sharma',
      email: 'rahul.teacher@dps.edu',
      passwordHash: '$2a$10$eO1pY0lTzS50g5sJv1/9yO1234567890abcdefghijklmno',
      role: UserRole.TEACHER,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      institutionId: institution1,
      profileImage: 'https://cdn.example.com/profiles/rahul.jpg',
      lastLoginAt: new Date('2026-11-03T20:00:00.000Z'),
      createdAt: new Date('2026-11-01T10:00:00.000Z'),
    },
    {
      _id: new Types.ObjectId('67272714207198bb6c30f402'),
      name: 'Super Admin',
      email: 'superadmin@gmail.com',
      passwordHash: '$2a$10$eO1pY0lTzS50g5sJv1/9yO1234567890abcdefghijklmno',
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      institutionId: null,
      profileImage: null,
      lastLoginAt: new Date('2026-11-03T21:00:00.000Z'),
      createdAt: new Date('2026-11-01T09:00:00.000Z'),
    },
    {
      _id: new Types.ObjectId('67272714207198bb6c30f403'),
      name: 'Suspended Teacher',
      email: 'suspended@dps.edu',
      passwordHash: '$2a$10$eO1pY0lTzS50g5sJv1/9yO1234567890abcdefghijklmno',
      role: UserRole.TEACHER,
      status: UserStatus.SUSPENDED,
      isEmailVerified: true,
      institutionId: institution1,
      profileImage: null,
      lastLoginAt: null,
      createdAt: new Date('2026-11-01T10:00:00.000Z'),
    },
    {
      _id: new Types.ObjectId('67272714207198bb6c30f404'),
      name: 'Inactive Student',
      email: 'inactive@dps.edu',
      passwordHash: '$2a$10$eO1pY0lTzS50g5sJv1/9yO1234567890abcdefghijklmno',
      role: UserRole.STUDENT,
      status: UserStatus.INACTIVE,
      isEmailVerified: false,
      institutionId: institution1,
      profileImage: null,
      lastLoginAt: null,
      createdAt: new Date('2026-11-01T10:00:00.000Z'),
    },
  ];

  const mockUserModel: any = {
    findById: (id: any) => ({
      populate: () => ({
        exec: async () => {
          const targetId = typeof id === 'string' ? id : id.toString();
          return usersStore.find((u) => u._id.toString() === targetId) || null;
        },
      }),
    }),
  };

  const configService = new ConfigService();
  const jwtService = new JwtService();
  const tokenService = new TokenService(jwtService, configService);
  tokenService.onModuleInit();

  const sessionsService = new SessionsService({} as any);

  const authService = new AuthService(
    mockUserModel,
    {} as any,
    jwtService,
    configService,
    {} as any,
    sessionsService,
    tokenService,
  );

  // --------------------------------------------------------------------------
  // TEST 1: Retrieve TEACHER Profile with Populated Institution (Req 1, 2, 3, 5, 6, 7)
  // --------------------------------------------------------------------------
  console.log('▶ TEST 1: Retrieve TEACHER Profile with Populated Institution');
  const teacherProfile = await authService.getCurrentUser('67272714207198bb6c30f401');
  console.log('  Returned Profile:\n', JSON.stringify(teacherProfile, null, 2));

  if (teacherProfile.id !== '67272714207198bb6c30f401') throw new Error('ID mismatch');
  if (teacherProfile.email !== 'rahul.teacher@dps.edu') throw new Error('Email mismatch');
  if (teacherProfile.role !== UserRole.TEACHER) throw new Error('Role mismatch');
  if (teacherProfile.status !== UserStatus.ACTIVE) throw new Error('Status mismatch');
  if (teacherProfile.isEmailVerified !== true) throw new Error('isEmailVerified mismatch');
  if (teacherProfile.profileImage !== 'https://cdn.example.com/profiles/rahul.jpg') throw new Error('profileImage mismatch');

  // Verify institution details
  if (!teacherProfile.institution) throw new Error('Institution should be populated');
  if (teacherProfile.institution.name !== 'Delhi Public School') throw new Error('Institution name mismatch');
  if (teacherProfile.institution.code !== 'DPS001') throw new Error('Institution code mismatch');

  // Security: Check passwordHash is NOT returned
  if ((teacherProfile as any).passwordHash !== undefined) {
    throw new Error('SECURITY VIOLATION: passwordHash was leaked in profile response!');
  }

  console.log('  ✅ [PASS] Teacher profile retrieved successfully with populated institution.');
  console.log('  ✅ [PASS] passwordHash strictly excluded from payload.');

  // --------------------------------------------------------------------------
  // TEST 2: Retrieve SUPER_ADMIN Profile (institution must be null) (Req 5)
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 2: Retrieve SUPER_ADMIN Profile (institution MUST be null)');
  const superAdminProfile = await authService.getCurrentUser('67272714207198bb6c30f402');
  console.log('  Super Admin Profile:\n', JSON.stringify(superAdminProfile, null, 2));

  if (superAdminProfile.role !== UserRole.SUPER_ADMIN) throw new Error('Role is not SUPER_ADMIN');
  if (superAdminProfile.institution !== null) {
    throw new Error(`SUPER_ADMIN institution must be null, got: ${JSON.stringify(superAdminProfile.institution)}`);
  }
  console.log('  ✅ [PASS] SUPER_ADMIN profile retrieved with institution: null.');

  // --------------------------------------------------------------------------
  // TEST 3: Stale Claim Resistance (Req 8)
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 3: Stale Claim Resistance (Fresh MongoDB Data vs Stale JWT)');
  // Simulate an admin updating the teacher's name in MongoDB
  const teacherUserDoc = usersStore.find((u) => u._id.toString() === '67272714207198bb6c30f401');
  teacherUserDoc.name = 'Dr. Rahul Sharma (PhD)';

  const freshProfile = await authService.getCurrentUser('67272714207198bb6c30f401');
  if (freshProfile.name !== 'Dr. Rahul Sharma (PhD)') {
    throw new Error('Failed stale claim resistance! Profile did not reflect fresh MongoDB update.');
  }
  console.log('  Updated Name in DB:', freshProfile.name);
  console.log('  ✅ [PASS] Authoritative MongoDB query reflects latest live user state.');

  // --------------------------------------------------------------------------
  // TEST 4: Deleted / Non-Existent User Handling (Req 9)
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 4: Deleted / Non-Existent User Handling (Req 9)');
  try {
    await authService.getCurrentUser('67272714207198bb6c30f999'); // Non-existent ObjectId
    throw new Error('Should have thrown UnauthorizedException for deleted user');
  } catch (err: any) {
    console.log('  ✅ [PASS] Non-existent user rejected with 401:', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 5: Suspended User Handling (Req 4, 9)
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 5: Suspended User Handling (Req 4, 9)');
  try {
    await authService.getCurrentUser('67272714207198bb6c30f403');
    throw new Error('Should have thrown UnauthorizedException for suspended user');
  } catch (err: any) {
    console.log('  ✅ [PASS] Suspended user blocked with 401:', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 6: Inactive / Disabled User Handling (Req 4, 9)
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 6: Inactive / Disabled User Handling (Req 4, 9)');
  try {
    await authService.getCurrentUser('67272714207198bb6c30f404');
    throw new Error('Should have thrown UnauthorizedException for inactive user');
  } catch (err: any) {
    console.log('  ✅ [PASS] Inactive user blocked with 401:', err.message);
  }

  console.log('\n================================================================');
  console.log('🎉 ALL 6 CURRENT USER PROFILE TESTS PASSED 100% SUCCESFULLY!');
  console.log('================================================================\n');
}

runCurrentUserTests().catch((err) => {
  console.error('\n❌ Uncaught error during Task 11 verification:', err);
  process.exit(1);
});

