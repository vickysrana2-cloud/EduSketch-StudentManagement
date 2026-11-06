import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PermissionAction, PermissionModule } from '../enums/permission.enums';

export class QueryPermissionsDto {
  @ApiPropertyOptional({
    description: 'Filter permissions by specific module',
    enum: PermissionModule,
    example: PermissionModule.STUDENTS,
  })
  @IsOptional()
  @IsEnum(PermissionModule, {
    message: 'module must be a valid PermissionModule enum value',
  })
  module?: PermissionModule;

  @ApiPropertyOptional({
    description: 'Filter permissions by specific action',
    enum: PermissionAction,
    example: PermissionAction.CREATE,
  })
  @IsOptional()
  @IsEnum(PermissionAction, {
    message: 'action must be a valid PermissionAction enum value',
  })
  action?: PermissionAction;
}

