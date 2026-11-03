import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { InstitutionStatus } from '../enums/institution.enums';

export class UpdateInstitutionStatusDto {
  @ApiProperty({
    enum: InstitutionStatus,
    example: InstitutionStatus.INACTIVE,
    description: 'Updated operational status of the institution',
  })
  @IsEnum(InstitutionStatus)
  @IsNotEmpty()
  status: InstitutionStatus;
}

