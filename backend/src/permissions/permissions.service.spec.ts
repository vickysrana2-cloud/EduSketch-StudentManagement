import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PermissionsService, SYSTEM_PERMISSIONS_CATALOG } from './permissions.service';
import { Permission } from './schemas/permission.schema';
import { PermissionAction, PermissionModule } from './enums/permission.enums';

describe('PermissionsService (Unit)', () => {
  let service: PermissionsService;
  let mockPermissionModel: any;

  const samplePermissionId = new Types.ObjectId();
  const samplePermission = {
    _id: samplePermissionId,
    name: 'STUDENT_CREATE',
    module: PermissionModule.STUDENTS,
    action: PermissionAction.CREATE,
    description: 'Admit a new student',
    isActive: true,
  };

  beforeEach(async () => {
    mockPermissionModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: samplePermissionId,
      save: jest.fn().mockResolvedValue({ ...dto, _id: samplePermissionId }),
    }));
    mockPermissionModel.findOne = jest.fn();
    mockPermissionModel.findById = jest.fn();
    mockPermissionModel.find = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        {
          provide: getModelToken(Permission.name),
          useValue: mockPermissionModel,
        },
      ],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return permission when valid ID is provided', async () => {
      mockPermissionModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(samplePermission),
      });

      const result = await service.findById(samplePermissionId.toString());
      expect(result).toBeDefined();
      expect(result.name).toBe('STUDENT_CREATE');
    });

    it('should throw NotFoundException if permission not found', async () => {
      mockPermissionModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findById(new Types.ObjectId().toString())).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if ID format is invalid', async () => {
      await expect(service.findById('invalid-id')).rejects.toThrow(BadRequestException);
    });
  });

  describe('findByName', () => {
    it('should return permission by uppercase name', async () => {
      mockPermissionModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(samplePermission),
      });

      const result = await service.findByName('student_create');
      expect(result).toBeDefined();
      expect(mockPermissionModel.findOne).toHaveBeenCalledWith({ name: 'STUDENT_CREATE' });
    });
  });

  describe('findAll', () => {
    it('should filter permissions by module and action', async () => {
      mockPermissionModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([samplePermission]),
        }),
      });

      const result = await service.findAll({
        module: PermissionModule.STUDENTS,
        action: PermissionAction.CREATE,
      });

      expect(result).toHaveLength(1);
      expect(mockPermissionModel.find).toHaveBeenCalledWith({
        module: PermissionModule.STUDENTS,
        action: PermissionAction.CREATE,
      });
    });
  });

  describe('seedPermissions', () => {
    it('should seed catalog permissions idempotently', async () => {
      mockPermissionModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.seedPermissions();
      expect(result.total).toBe(SYSTEM_PERMISSIONS_CATALOG.length);
      expect(result.created).toBe(SYSTEM_PERMISSIONS_CATALOG.length);
    });
  });
});

