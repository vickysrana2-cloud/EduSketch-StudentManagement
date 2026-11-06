import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditAction } from '../enums/audit-action.enum';
import { AuditModule } from '../enums/audit-module.enum';

export class AuditLogUserSummaryDto {
  @ApiProperty({ example: '67272714207198bb6c30f401' })
  id: string;

  @ApiProperty({ example: 'Admin User' })
  name: string;

  @ApiProperty({ example: 'admin@school.com' })
  email: string;

  @ApiProperty({ example: 'ADMIN' })
  role: string;
}

export class AuditLogInstitutionSummaryDto {
  @ApiProperty({ example: '67272714207198bb6c30f400' })
  id: string;

  @ApiProperty({ example: 'Delhi Public School' })
  name: string;

  @ApiProperty({ example: 'DPS001' })
  code: string;
}

export class AuditLogResponseDto {
  @ApiProperty({ example: '67272714207198bb6c30f501' })
  id: string;

  @ApiPropertyOptional({ type: AuditLogUserSummaryDto, nullable: true })
  user: AuditLogUserSummaryDto | null;

  @ApiPropertyOptional({ type: AuditLogInstitutionSummaryDto, nullable: true })
  institution: AuditLogInstitutionSummaryDto | null;

  @ApiProperty({ enum: AuditAction, example: AuditAction.USER_CREATED })
  action: AuditAction;

  @ApiProperty({ enum: AuditModule, example: AuditModule.USERS })
  module: AuditModule;

  @ApiProperty({ example: 'Admin created a new teacher account' })
  description: string;

  @ApiPropertyOptional({ example: '67272714207198bb6c30f402', nullable: true })
  targetId: string | null;

  @ApiPropertyOptional({ example: 'USER', nullable: true })
  targetType: string | null;

  @ApiPropertyOptional({ example: '127.0.0.1', nullable: true })
  ipAddress: string | null;

  @ApiPropertyOptional({ example: 'Mozilla/5.0 Chrome Windows', nullable: true })
  userAgent: string | null;

  @ApiProperty({ example: { assignedRole: 'TEACHER' } })
  metadata: Record<string, any>;

  @ApiProperty({ example: '2026-11-06T12:00:00.000Z' })
  createdAt: Date;
}

export class PaginatedAuditLogsResponseDto {
  @ApiProperty({ type: [AuditLogResponseDto] })
  items: AuditLogResponseDto[];

  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

