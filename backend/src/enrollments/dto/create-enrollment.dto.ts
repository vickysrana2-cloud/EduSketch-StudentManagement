import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { EnrollmentStatus } from '../schemas/enrollment.schema';

export class CreateEnrollmentDto {
  @ApiPropertyOptional({
    description: 'Institution ID (required for SUPER_ADMIN, inferred for ADMIN)',
    example: '60d0fe4f5311236168a109ca',
  })
  @IsOptional()
  @IsMongoId()
  institutionId?: string;

  @ApiProperty({
    description: 'Student Profile ID',
    example: '60d0fe4f5311236168a109cb',
  })
  @IsNotEmpty()
  @IsMongoId()
  studentId: string;

  @ApiProperty({
    description: 'Target Class ID',
    example: '60d0fe4f5311236168a109cc',
  })
  @IsNotEmpty()
  @IsMongoId()
  classId: string;

  @ApiProperty({
    description: 'Academic Year in format YYYY-YYYY',
    example: '2026-2027',
  })
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{4}$/, {
    message: 'Academic year must be in format YYYY-YYYY (e.g. 2026-2027)',
  })
  academicYear: string;

  @ApiProperty({
    description: 'Class roll number / seat number',
    example: '12',
  })
  @IsNotEmpty()
  @IsString()
  rollNumber: string;

  @ApiPropertyOptional({
    description: 'Date of enrollment in ISO 8601 format',
    example: '2026-06-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  enrollmentDate?: string;

  @ApiPropertyOptional({
    description: 'Enrollment status',
    enum: EnrollmentStatus,
    default: EnrollmentStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;
}

