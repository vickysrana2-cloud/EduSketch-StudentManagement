import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { TeacherProfilesService } from './teacher-profiles.service';
import { TeacherProfile } from './schemas/teacher-profile.schema';
import { User } from '../users/schemas/user.schema';
import { TenantContextService } from '../common/tenancy/tenant-context.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { UserRole, UserStatus } from '../users/enums/user.enums';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

describe('TeacherProfilesService (Unit)', () => {
  let service: TeacherProfilesService;
  let mockTeacherProfileModel: any;
  let mockUserModel: any;
  let mockTenantContextService: any;
  let mockAuditLogsService: any;

  const sampleInstId = new Types.ObjectId();
  const sampleUserId = new Types.ObjectId();
  const sampleProfileId = new Types.ObjectId();

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

  const sampleUser = {
    _id: sampleUserId,
    name: 'Priya Verma',
    email: 'priya@school.com',
    role: UserRole.TEACHER,
    status: UserStatus.ACTIVE,
    institutionId: sampleInstId,
  };

  const sampleProfile = {
    _id: sampleProfileId,
    userId: sampleUserId,
    institutionId: sampleInstId,
    employeeId: 'TCH-2026-001',
    qualification: ['M.Sc. Mathematics', 'B.Ed.'],
    specialization: ['Calculus', 'Algebra'],
    experienceYears: 6,
    joiningDate: new Date('2020-07-01'),
    status: 'ACTIVE',
  };

  beforeEach(async () => {
    mockTeacherProfileModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: sampleProfileId,
      save: jest.fn().mockResolvedValue({ ...dto, _id: sampleProfileId }),
    }));
    mockTeacherProfileModel.findOne = jest.fn();
    mockTeacherProfileModel.findById = jest.fn();
    mockTeacherProfileModel.find = jest.fn();

    mockUserModel = {
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
        TeacherProfilesService,
        { provide: getModelToken(TeacherProfile.name), useValue: mockTeacherProfileModel },
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: TenantContextService, useValue: mockTenantContextService },
        { provide: AuditLogsService, useValue: mockAuditLogsService },
      ],
    }).compile();

    service = module.get<TeacherProfilesService>(TeacherProfilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should reject creation if user role is not TEACHER', async () => {
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...sampleUser, role: UserRole.STUDENT }),
      });

      await expect(
        service.create(
          {
            userId: sampleUserId.toString(),
            employeeId: 'TCH-2026-001',
          },
          mockAdminUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject creation if teacher profile already exists for user', async () => {
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(sampleUser),
      });
      mockTeacherProfileModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(sampleProfile),
      });

      await expect(
        service.create(
          {
            userId: sampleUserId.toString(),
            employeeId: 'TCH-2026-001',
          },
          mockAdminUser,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findById', () => {
    it('should throw NotFoundException if teacher profile does not exist', async () => {
      mockTeacherProfileModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.findById(new Types.ObjectId().toString(), mockAdminUser),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

