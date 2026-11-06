import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { StudentProfilesService } from './student-profiles.service';
import { StudentProfile } from './schemas/student-profile.schema';
import { User } from '../users/schemas/user.schema';
import { TenantContextService } from '../common/tenancy/tenant-context.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { UserRole, UserStatus } from '../users/enums/user.enums';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

describe('StudentProfilesService (Unit)', () => {
  let service: StudentProfilesService;
  let mockStudentProfileModel: any;
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
    name: 'Aarav Sharma',
    email: 'aarav@school.com',
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    institutionId: sampleInstId,
  };

  const sampleProfile = {
    _id: sampleProfileId,
    userId: sampleUserId,
    institutionId: sampleInstId,
    admissionNumber: 'ADM-2026-001',
    gender: 'MALE',
    dateOfBirth: new Date('2010-05-15'),
    address: {
      street: '123 MG Road',
      city: 'Pune',
      state: 'Maharashtra',
      postalCode: '411001',
    },
    parentDetails: [
      {
        name: 'Rajesh Sharma',
        relationship: 'FATHER',
        phone: '+919876543210',
        email: 'rajesh@example.com',
      },
    ],
    status: 'ACTIVE',
  };

  beforeEach(async () => {
    mockStudentProfileModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: sampleProfileId,
      save: jest.fn().mockResolvedValue({ ...dto, _id: sampleProfileId }),
    }));
    mockStudentProfileModel.findOne = jest.fn();
    mockStudentProfileModel.findById = jest.fn();
    mockStudentProfileModel.find = jest.fn();

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
        StudentProfilesService,
        { provide: getModelToken(StudentProfile.name), useValue: mockStudentProfileModel },
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: TenantContextService, useValue: mockTenantContextService },
        { provide: AuditLogsService, useValue: mockAuditLogsService },
      ],
    }).compile();

    service = module.get<StudentProfilesService>(StudentProfilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should reject profile creation if user does not exist', async () => {
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.create(
          {
            userId: sampleUserId.toString(),
            admissionNumber: 'ADM-2026-001',
            dateOfBirth: '2010-05-15',
            gender: 'MALE' as any,
          },
          mockAdminUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject if user role is not STUDENT', async () => {
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...sampleUser, role: UserRole.TEACHER }),
      });

      await expect(
        service.create(
          {
            userId: sampleUserId.toString(),
            admissionNumber: 'ADM-2026-001',
            dateOfBirth: '2010-05-15',
            gender: 'MALE' as any,
          },
          mockAdminUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject if student profile already exists for user', async () => {
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(sampleUser),
      });
      mockStudentProfileModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(sampleProfile),
      });

      await expect(
        service.create(
          {
            userId: sampleUserId.toString(),
            admissionNumber: 'ADM-2026-001',
            dateOfBirth: '2010-05-15',
            gender: 'MALE' as any,
          },
          mockAdminUser,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findById', () => {
    it('should throw NotFoundException if student profile does not exist', async () => {
      mockStudentProfileModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.findById(new Types.ObjectId().toString(), mockAdminUser),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

