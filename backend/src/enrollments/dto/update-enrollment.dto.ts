import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsMongoId, IsOptional, IsString, Matches } from 'class-validator';
import { EnrollmentStatus } from '../schemas/enrollment.schema';

export class UpdateEnrollmentDto {
  @ApiPropertyOptional({
    description: 'Target Class ID',
    example: '60d0fe4f5311236168a109cb',
  })
  @IsOptional()
  @IsMongoId()
  classId?: string;

  @ApiPropertyOptional({
    description: 'Academic Year in format YYYY-YYYY',
    example: '2026-2027',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{4}$/, {
    message: 'Academic year must be in format YYYY-YYYY (e.g. 2026-2027)',
  })
  academicYear?: string;

  @ApiPropertyOptional({
    description: 'Roll number',
    example: '14',
  })
  @IsOptional()
  @IsString()
  rollNumber?: string;

  @ApiPropertyOptional({
    description: 'Date of enrollment',
    example: '2026-06-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  enrollmentDate?: string;

  @ApiPropertyOptional({
    description: 'Enrollment status',
    enum: EnrollmentStatus,
  })
  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;
}

