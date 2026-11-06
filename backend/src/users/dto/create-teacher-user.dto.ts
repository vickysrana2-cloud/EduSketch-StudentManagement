import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateTeacherUserDto {
  @ApiProperty({
    description: 'Full name of the teacher',
    example: 'Rahul Sharma',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  name: string;

  @ApiProperty({
    description: 'Unique email address for teacher account',
    example: 'rahul@school.com',
  })
  @IsNotEmpty()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiPropertyOptional({
    description: 'Account password (if omitted, an initial secure password will be generated)',
    example: 'TeacherPass123',
    minLength: 8,
  })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password?: string;

  @ApiProperty({
    description: 'Unique employee identification code within the institution',
    example: 'EMP001',
  })
  @IsNotEmpty()
  @IsString()
  employeeId: string;

  @ApiProperty({
    description: 'Educational qualifications and degrees',
    example: ['B.Ed', 'M.Sc Mathematics'],
    type: [String],
  })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  qualification: string[];

  @ApiProperty({
    description: 'Academic subject specializations',
    example: ['Mathematics'],
    type: [String],
  })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  specialization: string[];

  @ApiProperty({
    description: 'Total years of teaching experience',
    example: 5,
    minimum: 0,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(0, { message: 'experienceYears cannot be negative' })
  experienceYears: number;

  @ApiPropertyOptional({
    description: 'Date of joining in ISO 8601 format',
    example: '2026-06-01',
  })
  @IsOptional()
  @IsDateString()
  joiningDate?: string;

  @ApiPropertyOptional({
    description: 'Institution ObjectId (required for SUPER_ADMIN, automatically derived for ADMIN)',
    example: '67272714207198bb6c30f401',
  })
  @IsOptional()
  @IsMongoId()
  institutionId?: string;
}

