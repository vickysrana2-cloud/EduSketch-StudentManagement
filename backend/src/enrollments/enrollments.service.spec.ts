import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { Enrollment, EnrollmentStatus } from './schemas/enrollment.schema';
import { StudentProfile } from '../student-profiles/schemas/student-profile.schema';
import { Class, ClassStatus } from '../classes/schemas/class.schema';
import { TenantContextService } from '../common/tenancy/tenant-context.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { UserRole, UserStatus } from '../users/enums/user.enums';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

describe('EnrollmentsService (Unit)', () => {
  let service: EnrollmentsService;
  let mockEnrollmentModel: any;
  let mockStudentProfileModel: any;
  let mockClassModel: any;
  let mockTenantContextService: any;
  let mockAuditLogsService: any;

  const sampleInstId = new Types.ObjectId();
  const sampleStudentId = new Types.ObjectId();
  const sampleClassId = new Types.ObjectId();
  const sampleEnrollmentId = new Types.ObjectId();

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

  const sampleStudent = {
    _id: sampleStudentId,
    institutionId: sampleInstId,
    admissionNumber: 'ADM-2026-001',
    status: 'ACTIVE',
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
    mockEnrollmentModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: sampleEnrollmentId,
      save: jest.fn().mockResolvedValue({ ...dto, _id: sampleEnrollmentId }),
    }));
    mockEnrollmentModel.findOne = jest.fn();
    mockEnrollmentModel.findById = jest.fn();
    mockEnrollmentModel.countDocuments = jest.fn();

    mockStudentProfileModel = {
      findById: jest.fn(),
    };

    mockClassModel = {
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
        EnrollmentsService,
        { provide: getModelToken(Enrollment.name), useValue: mockEnrollmentModel },
        { provide: getModelToken(StudentProfile.name), useValue: mockStudentProfileModel },
        { provide: getModelToken(Class.name), useValue: mockClassModel },
        { provide: TenantContextService, useValue: mockTenantContextService },
        { provide: AuditLogsService, useValue: mockAuditLogsService },
      ],
    }).compile();

    service = module.get<EnrollmentsService>(EnrollmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should reject enrollment if student profile does not exist', async () => {
      mockStudentProfileModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.create(
          {
            studentId: sampleStudentId.toString(),
            classId: sampleClassId.toString(),
            academicYear: '2026-2027',
            rollNumber: '10',
          },
          mockAdminUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject enrollment if class does not exist', async () => {
      mockStudentProfileModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(sampleStudent),
      });
      mockClassModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.create(
          {
            studentId: sampleStudentId.toString(),
            classId: sampleClassId.toString(),
            academicYear: '2026-2027',
            rollNumber: '10',
          },
          mockAdminUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject enrollment if class capacity limit is reached', async () => {
      mockStudentProfileModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(sampleStudent),
      });
      mockClassModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...sampleClass, capacity: 40 }),
      });
      mockEnrollmentModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(40),
      });

      await expect(
        service.create(
          {
            studentId: sampleStudentId.toString(),
            classId: sampleClassId.toString(),
            academicYear: '2026-2027',
            rollNumber: '10',
          },
          mockAdminUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findById', () => {
    it('should throw NotFoundException if enrollment is not found', async () => {
      mockEnrollmentModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.findById(new Types.ObjectId().toString(), mockAdminUser),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

