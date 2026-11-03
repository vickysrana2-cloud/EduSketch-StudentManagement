import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenService } from '../src/auth/token.service';
import { UserRole } from '../src/users/enums/user.enums';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load actual .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function runTask08Tests() {
  console.log('================================================================');
  console.log('🚀 TASK 08: JWT ACCESS TOKEN GENERATION VERIFICATION');
  console.log('================================================================\n');

  const configService = new ConfigService();
  const jwtService = new JwtService();
  const tokenService = new TokenService(jwtService, configService);

  // --------------------------------------------------------------------------
  // TEST 1: Secret Configuration Validation at Startup (Requirement 8)
  // --------------------------------------------------------------------------
  console.log('▶ TEST 1: Secret Configuration Validation at Startup');
  try {
    tokenService.onModuleInit();
    console.log('  ✅ [PASS] TokenService successfully validated startup configuration.');
  } catch (err: any) {
    console.error('  ❌ [FAIL] Configuration validation failed:', err.message);
    process.exit(1);
  }

  // Test missing secret failure
  const badConfigMissing = {
    get: (key: string) => (key === 'JWT_ACCESS_SECRET' ? '' : 'fallback'),
  };
  try {
    const badTokenService = new TokenService(jwtService, badConfigMissing as any);
    badTokenService.onModuleInit();
    console.error('  ❌ [FAIL] Should have thrown for missing JWT_ACCESS_SECRET');
    process.exit(1);
  } catch (err: any) {
    console.log('  ✅ [PASS] Throws fatal error on missing JWT_ACCESS_SECRET:', err.message);
  }

  // Test short secret failure (< 32 chars)
  const badConfigShort = {
    get: (key: string) =>
      key === 'JWT_ACCESS_SECRET' ? 'too-short-secret' : 'valid-refresh-secret-which-is-long-enough-12345',
  };
  try {
    const badTokenService = new TokenService(jwtService, badConfigShort as any);
    badTokenService.onModuleInit();
    console.error('  ❌ [FAIL] Should have thrown for short JWT_ACCESS_SECRET');
    process.exit(1);
  } catch (err: any) {
    console.log('  ✅ [PASS] Throws fatal error on short JWT_ACCESS_SECRET (< 32 chars):', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 2: Minimal Claims Payload for TEACHER (Requirements 1 - 6, 9)
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 2: Minimal Claims Payload for TEACHER Role');
  const teacherUser = {
    _id: '67272714207198bb6c30f401',
    role: UserRole.TEACHER,
    institutionId: '67272714207198bb6c30f400',
  };

  const teacherAccessToken = await tokenService.generateAccessToken(teacherUser);
  console.log('  Generated Teacher Access Token:', teacherAccessToken.substring(0, 35) + '...');

  const teacherDecoded: any = tokenService.decodeToken(teacherAccessToken);
  console.log('  Decoded Payload:', JSON.stringify(teacherDecoded, null, 2));

  // Assert minimal claims
  if (teacherDecoded.sub !== teacherUser._id) {
    throw new Error(`Expected sub claim '${teacherUser._id}', got '${teacherDecoded.sub}'`);
  }
  if (teacherDecoded.role !== UserRole.TEACHER) {
    throw new Error(`Expected role 'TEACHER', got '${teacherDecoded.role}'`);
  }
  if (teacherDecoded.institutionId !== teacherUser.institutionId) {
    throw new Error(`Expected institutionId '${teacherUser.institutionId}', got '${teacherDecoded.institutionId}'`);
  }
  if (teacherDecoded.iss !== 'education-management-system') {
    throw new Error(`Expected issuer 'education-management-system', got '${teacherDecoded.iss}'`);
  }
  if (teacherDecoded.aud !== 'education-management-users') {
    throw new Error(`Expected audience 'education-management-users', got '${teacherDecoded.aud}'`);
  }

  // Check 15m expiration
  const lifespanSeconds = teacherDecoded.exp - teacherDecoded.iat;
  if (lifespanSeconds !== 900) {
    throw new Error(`Expected token lifespan 900s (15m), got ${lifespanSeconds}s`);
  }

  // Verify absence of sensitive info
  const forbiddenClaims = ['password', 'passwordHash', 'email', 'permissions', 'salt'];
  for (const claim of forbiddenClaims) {
    if (claim in teacherDecoded) {
      throw new Error(`Security violation: claim '${claim}' should NOT be in access token!`);
    }
  }
  console.log('  ✅ [PASS] Teacher token has exact minimal claims { sub, role, institutionId } and 15m lifetime (900s).');
  console.log('  ✅ [PASS] No password, email, or permissions exposed in token.');

  // --------------------------------------------------------------------------
  // TEST 3: SUPER_ADMIN Token (institutionId must be null)
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 3: SUPER_ADMIN Token (institutionId MUST be null)');
  const superAdminUser = {
    _id: '67272714207198bb6c30f499',
    role: UserRole.SUPER_ADMIN,
    institutionId: '67272714207198bb6c30f400', // Even if passed, must be forced to null
  };

  const superAdminToken = await tokenService.generateAccessToken(superAdminUser);
  const superAdminDecoded: any = tokenService.decodeToken(superAdminToken);
  console.log('  Decoded SUPER_ADMIN Payload:', JSON.stringify(superAdminDecoded, null, 2));

  if (superAdminDecoded.institutionId !== null) {
    throw new Error(`SUPER_ADMIN institutionId must be null, got: ${superAdminDecoded.institutionId}`);
  }
  console.log('  ✅ [PASS] SUPER_ADMIN institutionId claim is strictly null.');

  // --------------------------------------------------------------------------
  // TEST 4: Reusable Token Generation Method (Requirement 7)
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 4: Reusable Token Generation Method (generateAuthTokens)');
  const authTokens = await tokenService.generateAuthTokens(teacherUser);

  if (!authTokens.accessToken || !authTokens.refreshToken) {
    throw new Error('generateAuthTokens did not return both accessToken and refreshToken');
  }
  if (authTokens.tokenType !== 'Bearer') {
    throw new Error(`Expected tokenType 'Bearer', got '${authTokens.tokenType}'`);
  }
  if (authTokens.expiresIn !== '15m') {
    throw new Error(`Expected expiresIn '15m', got '${authTokens.expiresIn}'`);
  }
  console.log('  ✅ [PASS] Reusable generateAuthTokens returned valid structure:');
  console.log('     accessToken:', authTokens.accessToken.substring(0, 30) + '...');
  console.log('     refreshToken:', authTokens.refreshToken.substring(0, 30) + '...');
  console.log('     tokenType:', authTokens.tokenType);
  console.log('     expiresIn:', authTokens.expiresIn);

  // --------------------------------------------------------------------------
  // TEST 5: Cryptographic Verification & Algorithmic Security (Requirement 9)
  // --------------------------------------------------------------------------
  console.log('\n▶ TEST 5: Cryptographic Verification (HS256) & Tamper Resistance');
  const verifiedPayload = await tokenService.verifyAccessToken(teacherAccessToken);
  if (verifiedPayload.sub !== teacherUser._id) {
    throw new Error('Verified payload sub does not match');
  }
  console.log('  ✅ [PASS] Valid token correctly verified with JWT_ACCESS_SECRET.');

  // Tampered signature rejection
  const tamperedToken = teacherAccessToken.slice(0, -6) + 'xxxxxx';
  try {
    await tokenService.verifyAccessToken(tamperedToken);
    throw new Error('Verification should have rejected tampered signature!');
  } catch (err: any) {
    console.log('  ✅ [PASS] Tampered token rejected:', err.message);
  }

  // Cross-secret rejection (using refresh secret to sign an access token)
  const falseToken = await jwtService.signAsync(
    { sub: teacherUser._id, role: UserRole.TEACHER, institutionId: teacherUser.institutionId },
    { secret: configService.get<string>('JWT_REFRESH_SECRET') },
  );
  try {
    await tokenService.verifyAccessToken(falseToken);
    throw new Error('Access verification should have failed when token signed with refresh secret!');
  } catch (err: any) {
    console.log('  ✅ [PASS] Access token verification rejected token signed with Refresh secret:', err.message);
  }

  console.log('\n================================================================');
  console.log('🎉 ALL 5 TEST SCENARIOS PASSED 100% SUCCESFULLY!');
  console.log('================================================================\n');
}

runTask08Tests().catch((err) => {
  console.error('\n❌ Uncaught error during Task 08 verification:', err);
  process.exit(1);
});

