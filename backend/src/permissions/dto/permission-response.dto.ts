import { ApiProperty } from '@nestjs/swagger';
import { PermissionAction, PermissionModule } from '../enums/permission.enums';

export class PermissionResponseDto {
  @ApiProperty({
    description: 'MongoDB ObjectId of the permission document',
    example: '67272714207198bb6c30f401',
  })
  id: string;

  @ApiProperty({
    description: 'Unique uppercase permission key name',
    example: 'STUDENT_CREATE',
  })
  name: string;

  @ApiProperty({
    description: 'Functional domain module',
    enum: PermissionModule,
    example: PermissionModule.STUDENTS,
  })
  module: PermissionModule;

  @ApiProperty({
    description: 'Granular action type',
    enum: PermissionAction,
    example: PermissionAction.CREATE,
  })
  action: PermissionAction;

  @ApiProperty({
    description: 'Human-readable description of permission capability',
    example: 'Create a new student',
  })
  description: string;

  @ApiProperty({
    description: 'Indicates whether the permission is currently active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Timestamp of permission definition creation',
    example: '2026-11-03T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp of last permission update',
    example: '2026-11-03T00:00:00.000Z',
  })
  updatedAt: Date;
}

