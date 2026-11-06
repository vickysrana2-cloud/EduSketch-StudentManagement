import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken, getConnectionToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ClassesService } from './classes.service';
import { Class, ClassStatus } from './schemas/class.schema';
import { TeacherProfile } from '../teacher-profiles/schemas/teacher-profile.schema';
import { TenantContextService } from '../common/tenancy/tenant-context.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { UserRole, UserStatus } from '../users/enums/user.enums';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

describe('ClassesService (Unit)', () => {
  let service: ClassesService;
  let mockClassModel: any;
  let mockTeacherProfileModel: any;
  let mockConnection: any;
  let mockTenantContextService: any;
  let mockAuditLogsService: any;

  const sampleInstId = new Types.ObjectId();
  const sampleClassId = new Types.ObjectId();
  const sampleTeacherId = new Types.ObjectId();

  const mockAdminUser: AuthenticatedUser = {
    userId: new Types.ObjectId().toString(),
    email: 'admin@school.com',
    name: 'Admin User',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    institutionId: sampleInstId.toString(),
    institution: null,
    isEmailVerified: true,
  };

  const sampleClass = {
    _id: sampleClassId,
    name: 'Grade 10 - Section A',
    grade: 10,
    section: 'A',
    academicYear: '2026-2027',
    capacity: 40,
    institutionId: sampleInstId,
    status: ClassStatus.ACTIVE,
  };

  beforeEach(async () => {
    mockClassModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: sampleClassId,
      save: jest.fn().mockResolvedValue({ ...dto, _id: sampleClassId }),
    }));
    mockClassModel.findOne = jest.fn();
    mockClassModel.findById = jest.fn();
    mockClassModel.find = jest.fn();

    mockTeacherProfileModel = {
      findById: jest.fn(),
    };

    mockConnection = {
      model: jest.fn().mockReturnValue({
        countDocuments: jest.fn().mockResolvedValue(0),
      }),
    };

    mockTenantContextService = {
      resolveTenantId: jest.fn().mockReturnValue(sampleInstId),
      validateSameInstitution: jest.fn(),
      isSuperAdmin: jest.fn().mockReturnValue(false),
    };

    mockAuditLogsService = {
      logAction: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassesService,
        { provide: getModelToken(Class.name), useValue: mockClassModel },
        { provide: getModelToken(TeacherProfile.name), useValue: mockTeacherProfileModel },
        { provide: getConnectionToken(), useValue: mockConnection },
        { provide: TenantContextService, useValue: mockTenantContextService },
        { provide: AuditLogsService, useValue: mockAuditLogsService },
      ],
    }).compile();

    service = module.get<ClassesService>(ClassesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should reject class creation if duplicate grade and section in same academic year', async () => {
      mockClassModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(sampleClass),
      });

      await expect(
        service.create(
          {
            name: 'Grade 10 - A',
            grade: 10,
            section: 'A',
            academicYear: '2026-2027',
            capacity: 40,
          },
          mockAdminUser,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject if class teacher profile does not exist', async () => {
      mockTeacherProfileModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.create(
          {
            name: 'Grade 10 - B',
            grade: 10,
            section: 'B',
            academicYear: '2026-2027',
            capacity: 40,
            classTeacherId: sampleTeacherId.toString(),
          },
          mockAdminUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById', () => {
    it('should throw NotFoundException if class is not found', async () => {
      mockClassModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.findById(new Types.ObjectId().toString(), mockAdminUser),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

