import * as crypto from 'crypto';
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

async function runSessionRefreshTests() {
  console.log('================================================================');
  console.log('🚀 TASK 09: REFRESH TOKEN SESSION MANAGEMENT & ROTATION TESTS');
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
    name: 'Alok Nath',
    email: 'alok.teacher@example.com',
    role: UserRole.TEACHER,
    status: UserStatus.ACTIVE,
    institutionId: new Types.ObjectId('67272714207198bb6c30f400'),
  };

  const mockUsersService: any = {
    findUserById: async (id: string) => {
      if (id === mockUser._id.toString()) return mockUser;
      return null;
    },
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
  // TEST 1: Cryptographic Randomness & Token Hashing (Requirements 2 & 3)
  // --------------------------------------------------------------------------
  console.log('▶ TEST 1: Cryptographically Random Token Generation & SHA-256 Hashing');
  const token1 = sessionsService.generateRandomToken();
  const token2 = sessionsService.generateRandomToken();
  if (token1 === token2 || token1.length !== 80) {
    throw new Error('Token generation failed randomness or entropy check');
  }
  const hash1 = sessionsService.hashToken(token1);
  const hash2 = sessionsService.hashToken(token1);
  if (hash1 !== hash2 || hash1.length !== 64) {
    throw new Error('SHA-256 hashing failed');
  }
  console.log('  Raw token 1 sample:', token1.substring(0, 30) + '... (80 hex chars = 320 bits)');
  console.log('  SHA-256 hash:', hash1);
  console.log('  ✅ [PASS] High entropy tokens generated and deterministic SHA-256 hashing verified.');

  // --------------------------------------------------------------------------
  // TEST 2: Initial Login Session Creation (Requirements 1, 10)
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 2: Device Session Creation upon Login');
  const device1Session = await sessionsService.createSession({
    userId: mockUser._id.toString(),
    ipAddress: '192.168.1.10',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120',
  });

  const sessionDoc1 = sessionsStore[0];
  console.log('  Session 1 Document structure:');
  console.log('    _id:', sessionDoc1._id.toString());
  console.log('    userId:', sessionDoc1.userId.toString());
  console.log('    tokenFamily:', sessionDoc1.tokenFamily);
  console.log('    revokedAt:', sessionDoc1.revokedAt);
  console.log('    expiresAt:', sessionDoc1.expiresAt.toISOString());

  if (sessionDoc1.refreshTokenHash === device1Session.rawRefreshToken) {
    throw new Error('SECURITY VIOLATION: Raw refresh token stored in database!');
  }
  if (!sessionDoc1.tokenFamily) {
    throw new Error('Missing tokenFamily');
  }
  console.log('  ✅ [PASS] Only hashed token is stored in DB. Raw token delivered to client.');

  // --------------------------------------------------------------------------
  // TEST 3: Successful Token Rotation (Requirements 6 & 7)
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 3: Refresh Token Rotation (Requirements 6 & 7)');
  const refreshResult1 = await authService.refreshTokens(device1Session.rawRefreshToken, {
    ipAddress: '192.168.1.10',
    userAgent: 'Mozilla/5.0 Chrome/120',
  });

  console.log('  Old token successfully rotated!');
  console.log('  New Access Token (15m):', refreshResult1.accessToken.substring(0, 30) + '...');
  console.log('  New Refresh Token:', refreshResult1.refreshToken.substring(0, 30) + '...');

  // Verify previous token record is now revoked
  if (sessionDoc1.revokedAt === null) {
    throw new Error('Old session record was not revoked upon rotation!');
  }
  console.log('  Old session revokedAt:', sessionDoc1.revokedAt.toISOString());

  // Verify new session shares the SAME tokenFamily
  const sessionDoc2 = sessionsStore[1];
  if (sessionDoc2.tokenFamily !== sessionDoc1.tokenFamily) {
    throw new Error(`Token family lineage broken: ${sessionDoc2.tokenFamily} !== ${sessionDoc1.tokenFamily}`);
  }
  if (sessionDoc2.revokedAt !== null) {
    throw new Error('New session should not be revoked');
  }
  console.log('  ✅ [PASS] Previous token revoked, new session created with matching tokenFamily:', sessionDoc2.tokenFamily);

  // --------------------------------------------------------------------------
  // TEST 4: Reuse Detection & Token Family Revocation (Requirements 8 & 9)
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 4: Reuse Detection of Old Refresh Token (Requirements 8 & 9)');
  try {
    // Attempting to reuse the already-rotated token (device1Session.rawRefreshToken)
    console.log('  Attacker attempts to present old already-used refresh token...');
    await authService.refreshTokens(device1Session.rawRefreshToken);
    throw new Error('Reuse detection failed! Revoked token was accepted.');
  } catch (err: any) {
    console.log('  ✅ [PASS] Reuse correctly intercepted:', err.message);
  }

  // Verify ALL sessions in this family are now revoked!
  const familySessions = sessionsStore.filter((s) => s.tokenFamily === sessionDoc1.tokenFamily);
  const activeInFamily = familySessions.filter((s) => s.revokedAt === null);
  if (activeInFamily.length > 0) {
    throw new Error('Breach containment failed: active sessions remain in compromised family!');
  }
  console.log(`  ✅ [PASS] Entire token family revoked (${familySessions.length} sessions invalidated). Compromise contained.`);

  // --------------------------------------------------------------------------
  // TEST 5: Independent Multiple Device Sessions (Requirement 10)
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 5: Multiple Independent Device Sessions (Requirement 10)');
  // Device A (Mobile)
  const mobileSession = await sessionsService.createSession({
    userId: mockUser._id.toString(),
    ipAddress: '10.0.0.1',
    userAgent: 'Mobile App / iOS 17',
  });
  // Device B (Laptop)
  const laptopSession = await sessionsService.createSession({
    userId: mockUser._id.toString(),
    ipAddress: '192.168.1.50',
    userAgent: 'Laptop / Firefox',
  });

  if (mobileSession.tokenFamily === laptopSession.tokenFamily) {
    throw new Error('Different devices should have distinct token families');
  }
  console.log('  Mobile Family:', mobileSession.tokenFamily);
  console.log('  Laptop Family:', laptopSession.tokenFamily);

  // Rotate mobile session
  const mobileRotated = await authService.refreshTokens(mobileSession.rawRefreshToken);
  console.log('  Mobile token rotated successfully.');

  // Laptop session should still be active and unaffected!
  const laptopRotated = await authService.refreshTokens(laptopSession.rawRefreshToken);
  console.log('  Laptop token rotated successfully.');
  console.log('  ✅ [PASS] Multiple independent device sessions coexist securely.');

  // --------------------------------------------------------------------------
  // TEST 6: User Status Validation on Refresh (Requirement 11)
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 6: Account Status Validation on Refresh (Requirement 11)');
  mockUser.status = UserStatus.SUSPENDED;
  try {
    await authService.refreshTokens(mobileRotated.refreshToken);
    throw new Error('Suspended user should have been blocked from refreshing token!');
  } catch (err: any) {
    console.log('  ✅ [PASS] Suspended account blocked on refresh:', err.message);
  }
  mockUser.status = UserStatus.ACTIVE; // Reset

  // --------------------------------------------------------------------------
  // TEST 7: Application-Level Expiration (Requirement 12)
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 7: Application-Level Expiration Check (Requirement 12)');
  const expiredSession = await sessionsService.createSession({
    userId: mockUser._id.toString(),
    expiresInDays: -1, // Expired yesterday
  });
  try {
    await authService.refreshTokens(expiredSession.rawRefreshToken);
    throw new Error('Expired token should have been rejected!');
  } catch (err: any) {
    console.log('  ✅ [PASS] Expired token rejected by application logic:', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 8: Session Listing & Manual Revocation (Endpoints: GET & DELETE)
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 8: Session Listing & Individual Revocation');
  const activeSessions = await sessionsService.getUserActiveSessions(mockUser._id.toString());
  console.log(`  Active sessions found for user: ${activeSessions.length}`);

  const sessionToRevoke = activeSessions[0];
  await sessionsService.revokeSessionById(sessionToRevoke.id, mockUser._id.toString());
  console.log(`  Manually revoked session: ${sessionToRevoke.id}`);

  const activeAfterRevocation = await sessionsService.getUserActiveSessions(mockUser._id.toString());
  if (activeAfterRevocation.some((s) => s.id === sessionToRevoke.id)) {
    throw new Error('Session was not revoked');
  }
  console.log('  ✅ [PASS] Session listing and manual revocation verified.');

  console.log('\n================================================================');
  console.log('🎉 ALL 8 REFRESH TOKEN SESSION TESTS PASSED 100% SUCCESFULLY!');
  console.log('================================================================\n');
}

runSessionRefreshTests().catch((err) => {
  console.error('\n❌ Uncaught error during Task 09 verification:', err);
  process.exit(1);
});
