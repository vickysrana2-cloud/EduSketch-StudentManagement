import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InstitutionsService } from './institutions.service';
import { Institution } from './schemas/institution.schema';
import { User } from '../users/schemas/user.schema';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { InstitutionStatus, InstitutionType } from './enums/institution.enums';
import { UserRole, UserStatus } from '../users/enums/user.enums';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

describe('InstitutionsService (Unit)', () => {
  let service: InstitutionsService;
  let mockInstitutionModel: any;
  let mockUserModel: any;
  let mockAuditLogsService: any;

  const mockSuperAdmin: AuthenticatedUser = {
    userId: new Types.ObjectId().toString(),
    email: 'superadmin@gov.in',
    name: 'Super Admin',
    role: UserRole.SUPER_ADMIN,
    status: UserStatus.ACTIVE,
    institutionId: null,
    institution: null,
    isEmailVerified: true,
  };

  const sampleInstitutionId = new Types.ObjectId();
  const sampleInstitution = {
    _id: sampleInstitutionId,
    name: 'Delhi Public School',
    code: 'DPS001',
    type: InstitutionType.SCHOOL,
    email: 'info@dps001.edu',
    phone: '+919876543210',
    address: 'Sector 4, RK Puram',
    status: InstitutionStatus.ACTIVE,
    subscriptionPlan: 'ENTERPRISE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockInstitutionModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: sampleInstitutionId,
      save: jest.fn().mockResolvedValue({ ...dto, _id: sampleInstitutionId }),
    }));
    mockInstitutionModel.findOne = jest.fn();
    mockInstitutionModel.findById = jest.fn();
    mockInstitutionModel.find = jest.fn();
    mockInstitutionModel.findByIdAndUpdate = jest.fn();

    mockUserModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: new Types.ObjectId(),
      save: jest.fn().mockResolvedValue({ ...dto, _id: new Types.ObjectId() }),
    }));
    mockUserModel.findOne = jest.fn();
    mockUserModel.findById = jest.fn();

    mockAuditLogsService = {
      logAction: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstitutionsService,
        {
          provide: getModelToken(Institution.name),
          useValue: mockInstitutionModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: AuditLogsService,
          useValue: mockAuditLogsService,
        },
      ],
    }).compile();

    service = module.get<InstitutionsService>(InstitutionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createInstitution', () => {
    it('should successfully create an institution when code is unique', async () => {
      mockInstitutionModel.findOne.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      const dto = {
        name: 'Delhi Public School',
        code: 'dps001',
        type: InstitutionType.SCHOOL,
        email: 'info@dps001.edu',
        phone: '+919876543210',
        address: 'Sector 4, RK Puram',
        createdBy: mockSuperAdmin.userId,
      };

      const result = await service.createInstitution(dto as any);
      expect(result).toBeDefined();
      expect(mockInstitutionModel.findOne).toHaveBeenCalledWith({ code: 'DPS001' });
    });

    it('should reject creation if code is already taken (ConflictException)', async () => {
      mockInstitutionModel.findOne.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(sampleInstitution),
        }),
      });

      const dto = {
        name: 'Duplicate School',
        code: 'DPS001',
        type: InstitutionType.SCHOOL,
        email: 'dup@school.edu',
        phone: '+919876543210',
        address: 'Campus Road',
        createdBy: mockSuperAdmin.userId,
      };

      await expect(service.createInstitution(dto as any)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('getInstitutionById', () => {
    it('should return institution when found by valid ID', async () => {
      mockInstitutionModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(sampleInstitution),
      });

      const result = await service.getInstitutionById(sampleInstitutionId.toString());
      expect(result).toBeDefined();
      expect(result._id).toEqual(sampleInstitutionId);
    });

    it('should throw NotFoundException when institution does not exist', async () => {
      mockInstitutionModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.getInstitutionById(new Types.ObjectId().toString())).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when ID is invalid format', async () => {
      await expect(service.getInstitutionById('invalid-id')).rejects.toThrow(BadRequestException);
    });
  });

  describe('createInstitutionAdmin (Task 18)', () => {
    it('should reject admin creation if target institution is not ACTIVE', async () => {
      mockInstitutionModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...sampleInstitution,
          status: InstitutionStatus.SUSPENDED,
        }),
      });

      await expect(
        service.createInstitutionAdmin(
          sampleInstitutionId.toString(),
          {
            name: 'Suspended School Admin',
            email: 'admin@suspended.edu',
            password: 'StrongPassword123!',
          },
          mockSuperAdmin,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject duplicate email for institution admin', async () => {
      mockInstitutionModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(sampleInstitution),
      });
      mockUserModel.findOne.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ email: 'admin@school.com' }),
        }),
      });

      await expect(
        service.createInstitutionAdmin(
          sampleInstitutionId.toString(),
          {
            name: 'Existing Admin',
            email: 'admin@school.com',
            password: 'StrongPassword123!',
          },
          mockSuperAdmin,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });
});
