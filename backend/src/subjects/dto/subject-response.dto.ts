import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubjectStatus } from '../schemas/subject.schema';

export class SubjectResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  institutionId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  code: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  classId: string;

  @ApiProperty({ type: [String] })
  teacherIds: string[];

  @ApiProperty()
  academicYear: string;

  @ApiProperty({ enum: SubjectStatus })
  status: SubjectStatus;

  @ApiPropertyOptional()
  createdAt?: string;

  @ApiPropertyOptional()
  updatedAt?: string;
}

