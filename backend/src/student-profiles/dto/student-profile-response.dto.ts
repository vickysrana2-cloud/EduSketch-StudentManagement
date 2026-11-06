import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  BloodGroup,
  Gender,
  ParentDetail,
  StudentAddress,
  StudentProfileStatus,
} from '../schemas/student-profile.schema';

export class StudentUserSummaryDto {
  @ApiProperty({ example: '67272714207198bb6c30f401' })
  id: string;

  @ApiProperty({ example: 'Aarav Sharma' })
  name: string;

  @ApiProperty({ example: 'aarav@school.edu' })
  email: string;

  @ApiPropertyOptional({ example: 'https://images.example.com/avatar.jpg' })
  profileImage: string | null;
}

export class StudentProfileResponseDto {
  @ApiProperty({ example: '67272714207198bb6c30f601' })
  id: string;

  @ApiProperty({ type: StudentUserSummaryDto })
  user: StudentUserSummaryDto;

  @ApiProperty({ example: '67272714207198bb6c30f400' })
  institutionId: string;

  @ApiProperty({ example: 'ABC2026001' })
  admissionNumber: string;

  @ApiProperty({ example: '2010-05-15T00:00:00.000Z' })
  dateOfBirth: Date;

  @ApiProperty({ enum: Gender, example: Gender.MALE })
  gender: Gender;

  @ApiPropertyOptional({ enum: BloodGroup, example: BloodGroup.O_POSITIVE, nullable: true })
  bloodGroup: BloodGroup | null;

  @ApiProperty()
  address: StudentAddress;

  @ApiProperty({ type: [Object] })
  parentDetails: ParentDetail[];

  @ApiProperty({ enum: StudentProfileStatus, example: StudentProfileStatus.ACTIVE })
  status: StudentProfileStatus;

  @ApiProperty({ example: '2026-11-06T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-11-06T12:00:00.000Z' })
  updatedAt: Date;
}

