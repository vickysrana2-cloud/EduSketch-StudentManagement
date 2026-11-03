import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserStatus } from '../../users/enums/user.enums';
import { InstitutionStatus, InstitutionType } from '../../institutions/enums/institution.enums';

export class InstitutionSummaryDto {
  @ApiProperty({
    description: 'MongoDB ObjectId of the institution',
    example: '67272714207198bb6c30f400',
  })
  id: string;

  @ApiProperty({
    description: 'Institution official registered name',
    example: 'Delhi Public School',
  })
  name: string;

  @ApiProperty({
    description: 'Unique institution code',
    example: 'DPS001',
  })
  code: string;

  @ApiProperty({
    description: 'Type of educational institution',
    enum: InstitutionType,
    example: InstitutionType.SCHOOL,
  })
  type: InstitutionType;

  @ApiProperty({
    description: 'Operational status of the institution',
    enum: InstitutionStatus,
    example: InstitutionStatus.ACTIVE,
  })
  status: InstitutionStatus;
}

export class CurrentUserResponseDto {
  @ApiProperty({
    description: 'MongoDB ObjectId string of the user',
    example: '67272714207198bb6c30f401',
  })
  id: string;

  @ApiProperty({
    description: 'User full display name',
    example: 'Rahul Sharma',
  })
  name: string;

  @ApiProperty({
    description: 'Normalized email address',
    example: 'rahul.teacher@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Assigned platform or school role',
    enum: UserRole,
    example: UserRole.TEACHER,
  })
  role: UserRole;

  @ApiProperty({
    description: 'Account activation status',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @ApiProperty({
    description: 'Indicates whether the email address has been verified',
    example: true,
  })
  isEmailVerified: boolean;

  @ApiPropertyOptional({
    description:
      'Institution details (populated object for ADMIN, TEACHER, STUDENT; null for SUPER_ADMIN)',
    type: () => InstitutionSummaryDto,
    nullable: true,
  })
  institution: InstitutionSummaryDto | null;

  @ApiPropertyOptional({
    description: 'URL of user avatar or profile image',
    example: 'https://example.com/avatars/user.jpg',
    nullable: true,
  })
  profileImage: string | null;

  @ApiPropertyOptional({
    description: 'Timestamp of the most recent successful login',
    example: '2026-11-03T18:00:00.000Z',
    nullable: true,
  })
  lastLoginAt?: Date | null;

  @ApiPropertyOptional({
    description: 'Timestamp of account creation',
    example: '2026-11-03T17:00:00.000Z',
  })
  createdAt?: Date;
}

