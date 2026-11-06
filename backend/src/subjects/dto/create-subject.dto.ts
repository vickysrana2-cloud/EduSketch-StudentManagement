import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { SubjectStatus } from '../schemas/subject.schema';

export class CreateSubjectDto {
  @ApiPropertyOptional({
    description: 'Institution ID (required for SUPER_ADMIN, inferred for ADMIN)',
    example: '60d0fe4f5311236168a109ca',
  })
  @IsOptional()
  @IsMongoId()
  institutionId?: string;

  @ApiProperty({
    description: 'Subject Name',
    example: 'Mathematics',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Subject unique code (e.g. MATH101)',
    example: 'MATH101',
  })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiPropertyOptional({
    description: 'Description or curriculum overview',
    example: 'Standard Mathematics Curriculum covering Algebra and Geometry',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Associated Class ID',
    example: '60d0fe4f5311236168a109cb',
  })
  @IsNotEmpty()
  @IsMongoId()
  classId: string;

  @ApiPropertyOptional({
    description: 'List of assigned Teacher Profile ObjectIds',
    type: [String],
    example: ['60d0fe4f5311236168a109cc'],
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  teacherIds?: string[];

  @ApiProperty({
    description: 'Academic Year in format YYYY-YYYY',
    example: '2026-2027',
  })
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{4}$/, {
    message: 'Academic year must be in format YYYY-YYYY (e.g. 2026-2027)',
  })
  academicYear: string;

  @ApiPropertyOptional({
    description: 'Status of the subject',
    enum: SubjectStatus,
    default: SubjectStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(SubjectStatus)
  status?: SubjectStatus;
}

