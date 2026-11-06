import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { TeacherProfileStatus } from '../schemas/teacher-profile.schema';

export class QueryTeacherProfilesDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: TeacherProfileStatus })
  @IsOptional()
  @IsEnum(TeacherProfileStatus)
  status?: TeacherProfileStatus;

  @ApiPropertyOptional({ description: 'Filter by specialization subject' })
  @IsOptional()
  @IsString()
  specialization?: string;

  @ApiPropertyOptional({ description: 'Filter by institution ID (SUPER_ADMIN only)' })
  @IsOptional()
  @IsString()
  institutionId?: string;

  @ApiPropertyOptional({ description: 'Search by employeeId or teacher name' })
  @IsOptional()
  @IsString()
  search?: string;
}

