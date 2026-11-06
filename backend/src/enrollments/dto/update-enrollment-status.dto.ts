import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { EnrollmentStatus } from '../schemas/enrollment.schema';

export class UpdateEnrollmentStatusDto {
  @ApiProperty({
    description: 'New status for the enrollment record',
    enum: EnrollmentStatus,
    example: EnrollmentStatus.ACTIVE,
  })
  @IsNotEmpty()
  @IsEnum(EnrollmentStatus)
  status: EnrollmentStatus;
}

