import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { EnrollmentStatus } from '../schemas/enrollment.schema';

export class QueryEnrollmentsDto {
  @ApiPropertyOptional({
    description: 'Filter by institution ID (SUPER_ADMIN only)',
    example: '60d0fe4f5311236168a109ca',
  })
  @IsOptional()
  @IsMongoId()
  institutionId?: string;

  @ApiPropertyOptional({
    description: 'Filter by student profile ID',
    example: '60d0fe4f5311236168a109cb',
  })
  @IsOptional()
  @IsMongoId()
  studentId?: string;

  @ApiPropertyOptional({
    description: 'Filter by class ID',
    example: '60d0fe4f5311236168a109cc',
  })
  @IsOptional()
  @IsMongoId()
  classId?: string;

  @ApiPropertyOptional({
    description: 'Filter by academic year',
    example: '2026-2027',
  })
  @IsOptional()
  @IsString()
  academicYear?: string;

  @ApiPropertyOptional({
    description: 'Filter by enrollment status',
    enum: EnrollmentStatus,
  })
  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

