import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { AuditAction } from '../enums/audit-action.enum';
import { AuditModule } from '../enums/audit-module.enum';

export class CreateAuditLogDto {
  @IsOptional()
  @IsString()
  userId?: string | null;

  @IsOptional()
  @IsString()
  institutionId?: string | null;

  @IsEnum(AuditAction, {
    message: 'action must be a valid AuditAction enum',
  })
  @IsNotEmpty({ message: 'action is required' })
  action: AuditAction;

  @IsEnum(AuditModule, {
    message: 'module must be a valid AuditModule enum',
  })
  @IsNotEmpty({ message: 'module is required' })
  module: AuditModule;

  @IsString()
  @IsNotEmpty({ message: 'description is required' })
  description: string;

  @IsOptional()
  targetId?: string | null;

  @IsOptional()
  @IsString()
  targetType?: string | null;

  @IsOptional()
  @IsString()
  ipAddress?: string | null;

  @IsOptional()
  @IsString()
  userAgent?: string | null;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

