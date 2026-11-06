import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class PromoteStudentDto {
  @ApiProperty({
    description: 'Current active enrollment ID to be promoted from',
    example: '60d0fe4f5311236168a109ca',
  })
  @IsNotEmpty()
  @IsMongoId()
  currentEnrollmentId: string;

  @ApiProperty({
    description: 'Target Class ID for the next grade/academic year',
    example: '60d0fe4f5311236168a109cb',
  })
  @IsNotEmpty()
  @IsMongoId()
  targetClassId: string;

  @ApiProperty({
    description: 'New Academic Year (e.g. 2027-2028)',
    example: '2027-2028',
  })
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{4}$/, {
    message: 'Academic year must be in format YYYY-YYYY (e.g. 2027-2028)',
  })
  newAcademicYear: string;

  @ApiProperty({
    description: 'New roll number in the target class',
    example: '15',
  })
  @IsNotEmpty()
  @IsString()
  newRollNumber: string;

  @ApiPropertyOptional({
    description: 'Promotion/Enrollment date in ISO 8601 format',
    example: '2027-06-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  enrollmentDate?: string;
}

