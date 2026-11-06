import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EnrollmentStatus } from '../schemas/enrollment.schema';

export class EnrollmentResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  studentId: string;

  @ApiProperty()
  institutionId: string;

  @ApiProperty()
  classId: string;

  @ApiProperty()
  academicYear: string;

  @ApiProperty()
  rollNumber: string;

  @ApiProperty()
  enrollmentDate: string;

  @ApiProperty({ enum: EnrollmentStatus })
  status: EnrollmentStatus;

  @ApiPropertyOptional()
  createdAt?: string;

  @ApiPropertyOptional()
  updatedAt?: string;
}

