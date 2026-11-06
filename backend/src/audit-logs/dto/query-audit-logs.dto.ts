import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { AuditAction } from '../enums/audit-action.enum';
import { AuditModule } from '../enums/audit-module.enum';

export class QueryAuditLogsDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination (starts at 1)',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of audit log records per page',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Filter by functional module',
    enum: AuditModule,
  })
  @IsOptional()
  @IsEnum(AuditModule)
  module?: AuditModule;

  @ApiPropertyOptional({
    description: 'Filter by specific audit action',
    enum: AuditAction,
  })
  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @ApiPropertyOptional({
    description: 'Filter by actor User ObjectId',
    example: '67272714207198bb6c30f401',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Filter by tenant Institution ObjectId (SUPER_ADMIN only)',
    example: '67272714207198bb6c30f400',
  })
  @IsOptional()
  @IsString()
  institutionId?: string;

  @ApiPropertyOptional({
    description: 'Filter by target entity ObjectId or identifier',
    example: '67272714207198bb6c30f402',
  })
  @IsOptional()
  @IsString()
  targetId?: string;

  @ApiPropertyOptional({
    description: 'Filter records created on or after this ISO date string',
    example: '2026-11-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter records created on or before this ISO date string',
    example: '2026-11-07T23:59:59.999Z',
  })
  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Text search within audit log descriptions',
    example: 'teacher account',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
