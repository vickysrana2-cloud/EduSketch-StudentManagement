import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RoleSummaryDto {
  @ApiProperty({ example: '67272714207198bb6c30f401' })
  id: string;

  @ApiProperty({ example: 'TEACHER' })
  name: string;

  @ApiProperty({ example: 'Teacher' })
  displayName: string;
}

export class PermissionSummaryDto {
  @ApiProperty({ example: '67272714207198bb6c30f402' })
  id: string;

  @ApiProperty({ example: 'STUDENT_CREATE' })
  name: string;

  @ApiProperty({ example: 'STUDENTS' })
  module: string;

  @ApiProperty({ example: 'CREATE' })
  action: string;
}

export class RolePermissionResponseDto {
  @ApiProperty({
    description: 'MongoDB ObjectId of the mapping document',
    example: '67272714207198bb6c30f410',
  })
  id: string;

  @ApiProperty({
    description: 'Role ObjectId string',
    example: '67272714207198bb6c30f401',
  })
  roleId: string;

  @ApiProperty({
    description: 'Permission ObjectId string',
    example: '67272714207198bb6c30f402',
  })
  permissionId: string;

  @ApiPropertyOptional({
    description: 'Institution ObjectId string for overrides (null for system level)',
    example: null,
    nullable: true,
  })
  institutionId: string | null;

  @ApiProperty({
    description: 'Whether the permission is allowed',
    example: true,
  })
  isAllowed: boolean;

  @ApiPropertyOptional({ type: RoleSummaryDto })
  role?: RoleSummaryDto;

  @ApiPropertyOptional({ type: PermissionSummaryDto })
  permission?: PermissionSummaryDto;

  @ApiProperty({
    description: 'Timestamp of mapping creation',
    example: '2026-11-03T00:00:00.000Z',
  })
  createdAt: Date;
}

