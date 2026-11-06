import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { Subject } from './schemas/subject.schema';
import { Class } from '../classes/schemas/class.schema';
import { TeacherProfile } from '../teacher-profiles/schemas/teacher-profile.schema';
import { TenantContextService } from '../common/tenancy/tenant-context.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { UserRole, UserStatus } from '../users/enums/user.enums';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

describe('SubjectsService (Unit)', () => {
  let service: SubjectsService;
  let mockSubjectModel: any;
  let mockClassModel: any;
  let mockTeacherProfileModel: any;
  let mockTenantContextService: any;
  let mockAuditLogsService: any;

  const sampleInstId = new Types.ObjectId();
  const sampleClassId = new Types.ObjectId();
  const sampleSubjectId = new Types.ObjectId();

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
    institutionId: sampleInstId,
  };

  const sampleSubject = {
    _id: sampleSubjectId,
    name: 'Mathematics',
    code: 'MATH101',
    classId: sampleClassId,
    institutionId: sampleInstId,
    academicYear: '2026-2027',
    credits: 4,
    status: 'ACTIVE',
  };

  beforeEach(async () => {
    mockSubjectModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: sampleSubjectId,
      save: jest.fn().mockResolvedValue({ ...dto, _id: sampleSubjectId }),
    }));
    mockSubjectModel.findOne = jest.fn();
    mockSubjectModel.findById = jest.fn();
    mockSubjectModel.find = jest.fn();

    mockClassModel = {
      findById: jest.fn(),
    };

    mockTeacherProfileModel = {
      findById: jest.fn(),
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
        SubjectsService,
        { provide: getModelToken(Subject.name), useValue: mockSubjectModel },
        { provide: getModelToken(Class.name), useValue: mockClassModel },
        { provide: getModelToken(TeacherProfile.name), useValue: mockTeacherProfileModel },
        { provide: TenantContextService, useValue: mockTenantContextService },
        { provide: AuditLogsService, useValue: mockAuditLogsService },
      ],
    }).compile();

    service = module.get<SubjectsService>(SubjectsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should reject subject creation if class does not exist', async () => {
      mockClassModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.create(
          {
            name: 'Physics',
            code: 'PHY101',
            classId: sampleClassId.toString(),
            academicYear: '2026-2027',
          },
          mockAdminUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject subject creation if duplicate subject code for class and academic year', async () => {
      mockClassModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(sampleClass),
      });
      mockSubjectModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(sampleSubject),
      });

      await expect(
        service.create(
          {
            name: 'Mathematics',
            code: 'MATH101',
            classId: sampleClassId.toString(),
            academicYear: '2026-2027',
          },
          mockAdminUser,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findById', () => {
    it('should throw NotFoundException if subject is not found', async () => {
      mockSubjectModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.findById(new Types.ObjectId().toString(), mockAdminUser),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

