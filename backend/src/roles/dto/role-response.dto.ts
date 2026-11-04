import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../users/enums/user.enums';

export class RoleResponseDto {
  @ApiProperty({
    description: 'MongoDB ObjectId of the role document',
    example: '67272714207198bb6c30f401',
  })
  id: string;

  @ApiProperty({
    description: 'Unique system role identifier',
    enum: UserRole,
    example: UserRole.ADMIN,
  })
  name: UserRole;

  @ApiProperty({
    description: 'Human-friendly display name',
    example: 'Institution Administrator',
  })
  displayName: string;

  @ApiProperty({
    description: 'Description of the role permissions and scope',
    example: 'Manages an individual institution',
  })
  description: string;

  @ApiProperty({
    description: 'Hierarchy level (4=SUPER_ADMIN, 3=ADMIN, 2=TEACHER, 1=STUDENT)',
    example: 3,
  })
  level: number;

  @ApiProperty({
    description: 'Indicates if this is an immutable system role',
    example: true,
  })
  isSystemRole: boolean;

  @ApiProperty({
    description: 'Indicates whether the role is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-11-03T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2026-11-03T00:00:00.000Z',
  })
  updatedAt: Date;
}

