import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TeacherProfileStatus } from '../schemas/teacher-profile.schema';

export class TeacherUserSummaryDto {
  @ApiProperty({ example: '67272714207198bb6c30f401' })
  id: string;

  @ApiProperty({ example: 'Ramesh Verma' })
  name: string;

  @ApiProperty({ example: 'ramesh.teacher@dps.edu' })
  email: string;

  @ApiPropertyOptional({ example: 'https://images.example.com/ramesh.jpg' })
  profileImage: string | null;
}

export class TeacherProfileResponseDto {
  @ApiProperty({ example: '67272714207198bb6c30f701' })
  id: string;

  @ApiProperty({ type: TeacherUserSummaryDto })
  user: TeacherUserSummaryDto;

  @ApiProperty({ example: '67272714207198bb6c30f400' })
  institutionId: string;

  @ApiProperty({ example: 'EMP001' })
  employeeId: string;

  @ApiProperty({ type: [String], example: ['B.Ed', 'M.Sc Mathematics'] })
  qualification: string[];

  @ApiProperty({ type: [String], example: ['Mathematics'] })
  specialization: string[];

  @ApiProperty({ example: 5 })
  experienceYears: number;

  @ApiProperty({ example: '2025-06-01T00:00:00.000Z' })
  joiningDate: Date;

  @ApiProperty({ type: [String] })
  assignedClassIds: string[];

  @ApiProperty({ type: [String] })
  assignedSubjectIds: string[];

  @ApiProperty({ enum: TeacherProfileStatus, example: TeacherProfileStatus.ACTIVE })
  status: TeacherProfileStatus;

  @ApiProperty({ example: '2026-11-06T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-11-06T12:00:00.000Z' })
  updatedAt: Date;
}

