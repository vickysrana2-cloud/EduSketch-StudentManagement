import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';

export class AssignRolePermissionDto {
  @ApiProperty({
    description: 'MongoDB ObjectId of the Target Role',
    example: '67272714207198bb6c30f401',
  })
  @IsNotEmpty({ message: 'roleId is required' })
  @IsMongoId({ message: 'roleId must be a valid MongoDB ObjectId' })
  roleId: string;

  @ApiProperty({
    description: 'MongoDB ObjectId of the Target Permission',
    example: '67272714207198bb6c30f402',
  })
  @IsNotEmpty({ message: 'permissionId is required' })
  @IsMongoId({ message: 'permissionId must be a valid MongoDB ObjectId' })
  permissionId: string;

  @ApiPropertyOptional({
    description:
      'MongoDB ObjectId of the Institution for tenant-specific overrides (null for platform/system level)',
    example: '67272714207198bb6c30f400',
    nullable: true,
  })
  @IsOptional()
  @IsMongoId({ message: 'institutionId must be a valid MongoDB ObjectId or null' })
  institutionId?: string | null;

  @ApiPropertyOptional({
    description: 'Whether the permission is granted (true) or explicitly denied/overridden (false)',
    default: true,
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'isAllowed must be a boolean value' })
  isAllowed?: boolean;
}

