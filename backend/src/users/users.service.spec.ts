import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './schemas/user.schema';
import { Institution } from '../institutions/schemas/institution.schema';
import { TeacherProfile } from '../teacher-profiles/schemas/teacher-profile.schema';
import { StudentProfile } from '../student-profiles/schemas/student-profile.schema';
import { Class } from '../classes/schemas/class.schema';
import { Enrollment } from '../enrollments/schemas/enrollment.schema';
import { Session } from '../auth/schemas/session.schema';
import { TenantContextService } from '../common/tenancy/tenant-context.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { UserRole, UserStatus } from './enums/user.enums';
import { InstitutionStatus } from '../institutions/enums/institution.enums';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

describe('UsersService (Unit)', () => {
  let service: UsersService;
  let mockUserModel: any;
  let mockInstitutionModel: any;
  let mockTeacherProfileModel: any;
  let mockStudentProfileModel: any;
  let mockClassModel: any;
  let mockEnrollmentModel: any;
  let mockSessionModel: any;
  let mockTenantContextService: any;
  let mockAuditLogsService: any;

  const sampleInstId = new Types.ObjectId();
  const sampleUserId = new Types.ObjectId();

  const mockAdminUser: AuthenticatedUser = {
    userId: new Types.ObjectId().toString(),
    email: 'admin@school.com',
    name: 'School Admin',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    institutionId: sampleInstId.toString(),
    institution: null,
    isEmailVerified: true,
  };

  const mockSuperAdminUser: AuthenticatedUser = {
    userId: new Types.ObjectId().toString(),
    email: 'superadmin@system.gov',
    name: 'Super Admin',
    role: UserRole.SUPER_ADMIN,
    status: UserStatus.ACTIVE,
    institutionId: null,
    institution: null,
    isEmailVerified: true,
  };

  const sampleInstitution = {
    _id: sampleInstId,
    name: 'Apex Academy',
    code: 'APEX01',
    status: InstitutionStatus.ACTIVE,
  };

  beforeEach(async () => {
    mockUserModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: sampleUserId,
      save: jest.fn().mockResolvedValue({ ...dto, _id: sampleUserId }),
    }));
    mockUserModel.findOne = jest.fn();
    mockUserModel.findById = jest.fn();
    mockUserModel.find = jest.fn();
    mockUserModel.findByIdAndUpdate = jest.fn();
    mockUserModel.findByIdAndDelete = jest.fn();

    mockInstitutionModel = {
      findById: jest.fn(),
      exists: jest.fn(),
    };

    mockTeacherProfileModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: new Types.ObjectId(),
      save: jest.fn().mockResolvedValue({ ...dto, _id: new Types.ObjectId() }),
    }));
    mockTeacherProfileModel.findOne = jest.fn();

    mockStudentProfileModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: new Types.ObjectId(),
      save: jest.fn().mockResolvedValue({ ...dto, _id: new Types.ObjectId() }),
    }));
    mockStudentProfileModel.findOne = jest.fn();

    mockClassModel = {
      findById: jest.fn(),
    };

    mockEnrollmentModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: new Types.ObjectId(),
      save: jest.fn().mockResolvedValue({ ...dto, _id: new Types.ObjectId() }),
    }));
    mockEnrollmentModel.countDocuments = jest.fn();

    mockSessionModel = {
      updateMany: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(true) }),
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
        UsersService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(Institution.name), useValue: mockInstitutionModel },
        { provide: getModelToken(TeacherProfile.name), useValue: mockTeacherProfileModel },
        { provide: getModelToken(StudentProfile.name), useValue: mockStudentProfileModel },
        { provide: getModelToken(Class.name), useValue: mockClassModel },
        { provide: getModelToken(Enrollment.name), useValue: mockEnrollmentModel },
        { provide: getModelToken(Session.name), useValue: mockSessionModel },
        { provide: TenantContextService, useValue: mockTenantContextService },
        { provide: AuditLogsService, useValue: mockAuditLogsService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should reject creation if email already exists', async () => {
      mockUserModel.findOne.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ email: 'test@school.com' }),
        }),
      });

      await expect(
        service.createUser({
          name: 'Duplicate User',
          email: 'test@school.com',
          password: 'Password123!',
          role: UserRole.TEACHER,
          institutionId: sampleInstId.toString(),
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject if super admin specifies an institutionId', async () => {
      mockUserModel.findOne.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(
        service.createUser({
          name: 'Super Admin',
          email: 'super@gov.in',
          password: 'Password123!',
          role: UserRole.SUPER_ADMIN,
          institutionId: sampleInstId.toString(),
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createTeacher (Task 19)', () => {
    it('should reject teacher creation if institution is not active', async () => {
      mockInstitutionModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...sampleInstitution,
          status: InstitutionStatus.SUSPENDED,
        }),
      });

      await expect(
        service.createTeacher(
          {
            name: 'John Doe',
            email: 'john@school.com',
            employeeId: 'EMP001',
          },
          mockAdminUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject if teacher employeeId already exists in this institution', async () => {
      mockInstitutionModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(sampleInstitution),
      });
      mockUserModel.findOne.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });
      mockTeacherProfileModel.findOne.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ employeeId: 'EMP001' }),
        }),
      });

      await expect(
        service.createTeacher(
          {
            name: 'John Doe',
            email: 'john@school.com',
            employeeId: 'EMP001',
          },
          mockAdminUser,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateUserStatusWithRevocation', () => {
    it('should revoke active sessions when user is suspended', async () => {
      const mockDoc: any = {
        _id: sampleUserId,
        email: 'student@school.com',
        status: UserStatus.ACTIVE,
        role: UserRole.STUDENT,
        institutionId: sampleInstId,
      };
      mockDoc.save = jest.fn().mockResolvedValue(mockDoc);

      mockUserModel.findById.mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(mockDoc),
        populate: jest.fn().mockReturnThis(),
      }));

      const updated = await service.updateUserStatusWithRevocation(
        sampleUserId.toString(),
        UserStatus.SUSPENDED,
        mockSuperAdminUser,
      );

      expect(updated).toBeDefined();
      expect(mockSessionModel.updateMany).toHaveBeenCalledWith(
        { userId: sampleUserId, revokedAt: null },
        { $set: expect.objectContaining({ revokedAt: expect.any(Date) }) },
      );
      expect(mockAuditLogsService.logAction).toHaveBeenCalled();
    });

    it('should reject status modification by ADMIN with ForbiddenException', async () => {
      const mockDoc: any = {
        _id: sampleUserId,
        email: 'student@school.com',
        status: UserStatus.ACTIVE,
        role: UserRole.STUDENT,
        institutionId: sampleInstId,
      };

      mockUserModel.findById.mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(mockDoc),
      }));

      await expect(
        service.updateUserStatusWithRevocation(
          sampleUserId.toString(),
          UserStatus.SUSPENDED,
          mockAdminUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
