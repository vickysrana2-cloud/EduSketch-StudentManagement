import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { Session } from './schemas/session.schema';

describe('SessionsService (Unit)', () => {
  let service: SessionsService;
  let mockSessionModel: any;

  const mockUserId = new Types.ObjectId();
  const sampleSessionId = new Types.ObjectId();

  beforeEach(async () => {
    mockSessionModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: sampleSessionId,
      save: jest.fn().mockResolvedValue({ ...dto, _id: sampleSessionId }),
    }));
    mockSessionModel.findOne = jest.fn();
    mockSessionModel.find = jest.fn();
    mockSessionModel.findOneAndUpdate = jest.fn();
    mockSessionModel.updateMany = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        {
          provide: getModelToken(Session.name),
          useValue: mockSessionModel,
        },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateRandomToken & hashToken', () => {
    it('should generate high-entropy random string (80 hex characters)', () => {
      const token = service.generateRandomToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(80);
    });

    it('should consistently hash token using SHA-256 (64 hex characters)', () => {
      const token = 'sample-test-token-string';
      const hash1 = service.hashToken(token);
      const hash2 = service.hashToken(token);
      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(64);
    });
  });

  describe('createSession', () => {
    it('should generate a token family, hash the token, and save session', async () => {
      const result = await service.createSession({
        userId: mockUserId.toString(),
        ipAddress: '127.0.0.1',
        userAgent: 'Jest Runner',
        expiresInDays: 7,
      });

      expect(result).toBeDefined();
      expect(result.rawRefreshToken).toBeDefined();
      expect(result.tokenFamily).toBeDefined();
      expect(result.session).toBeDefined();
    });
  });

  describe('rotateSession & Reuse Detection (Task 09)', () => {
    it('should rotate valid active session to a new session in same family', async () => {
      const rawToken = service.generateRandomToken();
      const tokenHash = service.hashToken(rawToken);
      const existingSession = {
        _id: sampleSessionId,
        userId: mockUserId,
        refreshTokenHash: tokenHash,
        tokenFamily: 'family-uuid-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 86400000), // 1 day future
        save: jest.fn().mockResolvedValue(true),
      };

      mockSessionModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(existingSession),
      });

      const result = await service.rotateSession(rawToken);
      expect(result).toBeDefined();
      expect(result.tokenFamily).toBe('family-uuid-1');
      expect(result.newRawRefreshToken).toBeDefined();
      expect(existingSession.revokedAt).toBeDefined();
    });

    it('should detect reuse of revoked token and revoke entire token family (Security Breach)', async () => {
      const rawToken = service.generateRandomToken();
      const tokenHash = service.hashToken(rawToken);
      const compromisedSession = {
        _id: sampleSessionId,
        userId: mockUserId,
        refreshTokenHash: tokenHash,
        tokenFamily: 'compromised-family-uuid',
        revokedAt: new Date(Date.now() - 3600000), // Already revoked 1 hour ago!
        expiresAt: new Date(Date.now() + 86400000),
      };

      mockSessionModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(compromisedSession),
      });

      await expect(service.rotateSession(rawToken)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockSessionModel.updateMany).toHaveBeenCalledWith(
        { tokenFamily: 'compromised-family-uuid' },
        expect.objectContaining({ $set: expect.any(Object) }),
      );
    });

    it('should reject refresh if token hash is not found in database', async () => {
      mockSessionModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.rotateSession('unknown-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('revokeSessionById', () => {
    it('should revoke a session belonging to the user', async () => {
      const mockSessionDoc = {
        _id: sampleSessionId,
        userId: mockUserId,
        revokedAt: new Date(),
      };
      mockSessionModel.findOneAndUpdate.mockResolvedValue(mockSessionDoc);

      await expect(
        service.revokeSessionById(
          sampleSessionId.toString(),
          mockUserId.toString(),
        ),
      ).resolves.not.toThrow();
      expect(mockSessionModel.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: expect.anything(),
          userId: expect.anything(),
        },
        expect.objectContaining({
          $set: expect.objectContaining({
            revokedAt: expect.any(Date),
          }),
        }),
        { new: true },
      );
    });

    it('should throw NotFoundException if session does not exist or user mismatch', async () => {
      mockSessionModel.findOneAndUpdate.mockResolvedValue(null);

      await expect(
        service.revokeSessionById(
          sampleSessionId.toString(),
          mockUserId.toString(),
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
