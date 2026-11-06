import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsISO8601,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { TeacherProfileStatus } from '../schemas/teacher-profile.schema';

export class CreateTeacherProfileDto {
  @ApiProperty({ description: 'MongoDB ObjectId of User account', example: '67272714207198bb6c30f401' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({ description: 'Institution ID (Auto-populated for School Admins)', example: '67272714207198bb6c30f400' })
  @IsOptional()
  @IsString()
  institutionId?: string;

  @ApiProperty({ example: 'EMP001' })
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({ type: [String], example: ['B.Ed', 'M.Sc Mathematics'] })
  @IsArray()
  @IsString({ each: true })
  qualification: string[];

  @ApiProperty({ type: [String], example: ['Mathematics'] })
  @IsArray()
  @IsString({ each: true })
  specialization: string[];

  @ApiProperty({ example: 5, minimum: 0 })
  @IsInt()
  @Min(0)
  experienceYears: number;

  @ApiProperty({ example: '2025-06-01T00:00:00.000Z' })
  @IsISO8601()
  joiningDate: string;

  @ApiPropertyOptional({ type: [String], example: [] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assignedClassIds?: string[];

  @ApiPropertyOptional({ type: [String], example: [] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assignedSubjectIds?: string[];

  @ApiPropertyOptional({ enum: TeacherProfileStatus, default: TeacherProfileStatus.ACTIVE })
  @IsOptional()
  @IsEnum(TeacherProfileStatus)
  status?: TeacherProfileStatus;
}

