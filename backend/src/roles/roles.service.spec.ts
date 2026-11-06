import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RolesService } from './roles.service';
import { Role } from './schemas/role.schema';
import { UserRole } from '../users/enums/user.enums';

describe('RolesService (Unit)', () => {
  let service: RolesService;
  let mockRoleModel: any;

  const sampleRoleId = new Types.ObjectId();
  const sampleRole = {
    _id: sampleRoleId,
    name: UserRole.ADMIN,
    displayName: 'Institution Administrator',
    description: 'Manages an individual institution and its users',
    level: 80,
    isSystemRole: true,
    isActive: true,
  };

  beforeEach(async () => {
    mockRoleModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: sampleRoleId,
      save: jest.fn().mockResolvedValue({ ...dto, _id: sampleRoleId }),
    }));
    mockRoleModel.findOne = jest.fn();
    mockRoleModel.findById = jest.fn();
    mockRoleModel.find = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: getModelToken(Role.name),
          useValue: mockRoleModel,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return role when valid ID is provided', async () => {
      mockRoleModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(sampleRole),
      });

      const result = await service.findById(sampleRoleId.toString());
      expect(result).toBeDefined();
      expect(result.name).toBe(UserRole.ADMIN);
    });

    it('should throw NotFoundException when role does not exist', async () => {
      mockRoleModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findById(new Types.ObjectId().toString())).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for invalid ObjectId format', async () => {
      await expect(service.findById('bad-id')).rejects.toThrow(BadRequestException);
    });
  });

  describe('findByName', () => {
    it('should return role by enum name', async () => {
      mockRoleModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(sampleRole),
      });

      const result = await service.findByName(UserRole.ADMIN);
      expect(result).toBeDefined();
      expect(result.name).toBe(UserRole.ADMIN);
    });

    it('should return null if role name not found', async () => {
      mockRoleModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.findByName(UserRole.SUPER_ADMIN);
      expect(result).toBeNull();
    });
  });

  describe('seedSystemRoles', () => {
    it('should seed 4 system roles idempotently', async () => {
      mockRoleModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.seedSystemRoles();
      expect(result.total).toBe(4);
      expect(result.created).toBe(4);
    });
  });
});
