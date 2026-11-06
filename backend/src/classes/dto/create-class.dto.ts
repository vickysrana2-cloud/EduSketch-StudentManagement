import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { ClassStatus } from '../schemas/class.schema';

export class CreateClassDto {
  @ApiPropertyOptional({ description: 'Institution ID (Auto-populated for School Admins)', example: '67272714207198bb6c30f400' })
  @IsOptional()
  @IsString()
  institutionId?: string;

  @ApiProperty({ example: 'Class 10' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 10, minimum: 1 })
  @IsInt()
  @Min(1)
  grade: number;

  @ApiProperty({ example: 'A' })
  @IsString()
  @IsNotEmpty()
  section: string;

  @ApiProperty({ example: '2026-2027', description: 'Academic year format: YYYY-YYYY' })
  @IsString()
  @Matches(/^\d{4}-\d{4}$/, {
    message: 'academicYear must be in the format YYYY-YYYY (e.g. 2026-2027)',
  })
  academicYear: string;

  @ApiPropertyOptional({ description: 'TeacherProfile ObjectId', example: '67272714207198bb6c30f701' })
  @IsOptional()
  @IsString()
  classTeacherId?: string | null;

  @ApiProperty({ example: 40, minimum: 1 })
  @IsInt()
  @Min(1)
  capacity: number;

  @ApiPropertyOptional({ example: 'R-101' })
  @IsOptional()
  @IsString()
  roomNumber?: string | null;

  @ApiPropertyOptional({ enum: ClassStatus, default: ClassStatus.ACTIVE })
  @IsOptional()
  @IsEnum(ClassStatus)
  status?: ClassStatus;
}

