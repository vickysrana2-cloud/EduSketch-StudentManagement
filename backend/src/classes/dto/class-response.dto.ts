import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClassStatus } from '../schemas/class.schema';

export class ClassTeacherSummaryDto {
  @ApiProperty({ example: '67272714207198bb6c30f701' })
  id: string;

  @ApiProperty({ example: 'EMP001' })
  employeeId: string;

  @ApiPropertyOptional({ example: 'Ramesh Verma' })
  name?: string;
}

export class ClassResponseDto {
  @ApiProperty({ example: '67272714207198bb6c30f801' })
  id: string;

  @ApiProperty({ example: '67272714207198bb6c30f400' })
  institutionId: string;

  @ApiProperty({ example: 'Class 10' })
  name: string;

  @ApiProperty({ example: 10 })
  grade: number;

  @ApiProperty({ example: 'A' })
  section: string;

  @ApiProperty({ example: '2026-2027' })
  academicYear: string;

  @ApiPropertyOptional({ type: ClassTeacherSummaryDto, nullable: true })
  classTeacher: ClassTeacherSummaryDto | null;

  @ApiProperty({ example: 40 })
  capacity: number;

  @ApiPropertyOptional({ example: 'R-101', nullable: true })
  roomNumber: string | null;

  @ApiProperty({ enum: ClassStatus, example: ClassStatus.ACTIVE })
  status: ClassStatus;

  @ApiProperty({ example: '2026-11-06T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-11-06T12:00:00.000Z' })
  updatedAt: Date;
}

