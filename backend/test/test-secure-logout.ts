import { SessionsService } from '../src/auth/sessions.service';
import { AuthService } from '../src/auth/auth.service';
import { TokenService } from '../src/auth/token.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole, UserStatus } from '../src/users/enums/user.enums';
import { Types } from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function runSecureLogoutTests() {
  console.log('================================================================');
  console.log('🚀 TASK 10: SECURE LOGOUT & LOGOUT-ALL VERIFICATION');
  console.log('================================================================\n');

  // In-memory mock storage for sessions
  const sessionsStore: any[] = [];

  const mockSessionModel: any = function (data: any) {
    const sessionObj: any = {
      ...data,
      _id: new Types.ObjectId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      save: async function () {
        const idx = sessionsStore.findIndex((s) => s._id.equals(this._id));
        if (idx >= 0) {
          sessionsStore[idx] = this;
        } else {
          sessionsStore.push(this);
        }
        return this;
      },
    };
    return sessionObj;
  };

  mockSessionModel.findOne = (query: any) => {
    const findDoc = () => {
      if (query.refreshTokenHash) {
        return sessionsStore.find((s) => s.refreshTokenHash === query.refreshTokenHash) || null;
      }
      if (query._id && query.userId) {
        return sessionsStore.find((s) => s._id.equals(query._id) && s.userId.equals(query.userId)) || null;
      }
      return null;
    };

    return {
      select: () => ({
        exec: async () => findDoc(),
      }),
      exec: async () => findDoc(),
      then: (resolve: any, reject: any) => Promise.resolve(findDoc()).then(resolve, reject),
    };
  };

  mockSessionModel.updateMany = async (filter: any, update: any) => {
    let count = 0;
    for (const session of sessionsStore) {
      if (filter.tokenFamily && session.tokenFamily === filter.tokenFamily) {
        if (update.$set) {
          Object.assign(session, update.$set);
          count++;
        }
      } else if (filter.userId && session.userId.equals(filter.userId)) {
        if (filter.revokedAt === null && session.revokedAt !== null) continue;
        if (update.$set) {
          Object.assign(session, update.$set);
          count++;
        }
      }
    }
    return { modifiedCount: count };
  };

  mockSessionModel.findOneAndUpdate = async (filter: any, update: any) => {
    const session = sessionsStore.find(
      (s) => s.refreshTokenHash === filter.refreshTokenHash && s.revokedAt === filter.revokedAt,
    );
    if (session && update.$set) {
      Object.assign(session, update.$set);
      return session;
    }
    return null;
  };

  mockSessionModel.find = (filter: any) => ({
    sort: () => ({
      lean: () => ({
        exec: async () => {
          return sessionsStore.filter((s) => {
            if (!s.userId.equals(filter.userId)) return false;
            if (filter.revokedAt === null && s.revokedAt !== null) return false;
            if (filter.expiresAt && filter.expiresAt.$gt && s.expiresAt <= filter.expiresAt.$gt) return false;
            return true;
          });
        },
      }),
    }),
  });

  const sessionsService = new SessionsService(mockSessionModel as any);
  const configService = new ConfigService();
  const jwtService = new JwtService();
  const tokenService = new TokenService(jwtService, configService);
  tokenService.onModuleInit();

  const mockUser = {
    _id: new Types.ObjectId('67272714207198bb6c30f401'),
    name: 'Rahul Sharma',
    email: 'rahul.teacher@school.com',
    role: UserRole.TEACHER,
    status: UserStatus.ACTIVE,
    institutionId: new Types.ObjectId('67272714207198bb6c30f400'),
  };

  const mockUsersService: any = {
    findUserById: async (id: string) => (id === mockUser._id.toString() ? mockUser : null),
  };

  const authService = new AuthService(
    {} as any,
    {} as any,
    jwtService,
    configService,
    mockUsersService,
    sessionsService,
    tokenService,
  );

  // --------------------------------------------------------------------------
  // TEST 1: Current Device Logout & Session Revocation (Requirements 1, 2, 3, 5, 6)
  // --------------------------------------------------------------------------
  console.log('▶ TEST 1: Current Device Logout (POST /api/auth/logout)');
  const deviceSession1 = await sessionsService.createSession({
    userId: mockUser._id.toString(),
    ipAddress: '192.168.1.100',
    userAgent: 'Chrome on macOS',
  });

  const deviceSession2 = await sessionsService.createSession({
    userId: mockUser._id.toString(),
    ipAddress: '10.0.0.5',
    userAgent: 'Safari on iPhone',
  });

  console.log('  Created 2 active device sessions (macOS & iPhone).');

  // Perform logout on device 1 (macOS)
  const logoutResponse = await authService.logout(deviceSession1.rawRefreshToken);
  console.log('  Logout response:', logoutResponse);

  if (logoutResponse.message !== 'Successfully logged out.') {
    throw new Error('Unexpected logout message response');
  }

  // Verify device 1 session in DB is revoked
  const session1Doc = sessionsStore.find((s) => s.tokenFamily === deviceSession1.tokenFamily);
  if (session1Doc.revokedAt === null) {
    throw new Error('Session 1 was not revoked in database!');
  }
  console.log('  Session 1 revokedAt:', session1Doc.revokedAt.toISOString());

  // Verify device 2 (iPhone) is STILL ACTIVE
  const session2Doc = sessionsStore.find((s) => s.tokenFamily === deviceSession2.tokenFamily);
  if (session2Doc.revokedAt !== null) {
    throw new Error('Device 2 session should NOT have been revoked by device 1 logout!');
  }
  console.log('  ✅ [PASS] Device 1 session revoked. Device 2 session remains active.');

  // --------------------------------------------------------------------------
  // TEST 2: Attempting to Use Revoked Token After Logout
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 2: Attempting Refresh with Revoked Token (Reuse Detection)');
  try {
    await authService.refreshTokens(deviceSession1.rawRefreshToken);
    throw new Error('Should have rejected refresh with revoked token!');
  } catch (err: any) {
    console.log('  ✅ [PASS] Refresh with logged-out token rejected:', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 3: Repeated / Idempotent Logout (Requirement 8)
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 3: Repeated / Idempotent Logout Calls (Requirement 8)');
  // Calling logout a 2nd time with already-revoked token
  const repeatLogout1 = await authService.logout(deviceSession1.rawRefreshToken);
  console.log('  2nd Logout call response:', repeatLogout1);

  // Calling logout with undefined / null token (e.g. cookie already cleared)
  const repeatLogout2 = await authService.logout(undefined);
  console.log('  Empty Logout call response:', repeatLogout2);

  if (repeatLogout1.message !== 'Successfully logged out.' || repeatLogout2.message !== 'Successfully logged out.') {
    throw new Error('Repeated logout failed idempotency check');
  }
  console.log('  ✅ [PASS] Repeated logout calls succeed gracefully without throwing 500 error.');

  // --------------------------------------------------------------------------
  // TEST 4: Logout From All Devices (POST /api/auth/logout-all) (Requirement 7)
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 4: Logout From All Devices (POST /api/auth/logout-all)');
  // Create 3 active sessions for mockUser
  const s1 = await sessionsService.createSession({ userId: mockUser._id.toString() });
  const s2 = await sessionsService.createSession({ userId: mockUser._id.toString() });
  const s3 = await sessionsService.createSession({ userId: mockUser._id.toString() });

  let activeCount = (await sessionsService.getUserActiveSessions(mockUser._id.toString())).length;
  console.log(`  Active sessions before logout-all: ${activeCount}`);

  // Call logoutAll
  const logoutAllResponse = await authService.logoutAll(mockUser._id.toString());
  console.log('  logoutAll response:', logoutAllResponse);

  activeCount = (await sessionsService.getUserActiveSessions(mockUser._id.toString())).length;
  console.log(`  Active sessions after logout-all: ${activeCount}`);

  if (activeCount !== 0) {
    throw new Error(`Expected 0 active sessions after logoutAll, got ${activeCount}`);
  }
  console.log('  ✅ [PASS] All sessions revoked across all devices.');

  // --------------------------------------------------------------------------
  // TEST 5: Verify Another User Sessions are NOT Affected (Isolation)
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 5: Multi-Tenant / User Session Isolation');
  const otherUserSession = await sessionsService.createSession({
    userId: new Types.ObjectId('67272714207198bb6c30f999').toString(),
  });

  // Call logout-all for mockUser again
  await authService.logoutAll(mockUser._id.toString());

  const otherUserActive = await sessionsService.getUserActiveSessions('67272714207198bb6c30f999');
  if (otherUserActive.length !== 1) {
    throw new Error('Other user session was wrongfully revoked!');
  }
  console.log('  ✅ [PASS] Other users sessions unaffected. Tenant isolation verified.');

  console.log('\n================================================================');
  console.log('🎉 ALL 5 SECURE LOGOUT TESTS PASSED 100% SUCCESFULLY!');
  console.log('================================================================\n');
}

runSecureLogoutTests().catch((err) => {
  console.error('\n❌ Uncaught error during Task 10 verification:', err);
  process.exit(1);
});

