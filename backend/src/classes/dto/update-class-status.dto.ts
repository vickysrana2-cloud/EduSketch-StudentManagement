import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ClassStatus } from '../schemas/class.schema';

export class UpdateClassStatusDto {
  @ApiProperty({ enum: ClassStatus, example: ClassStatus.INACTIVE })
  @IsEnum(ClassStatus)
  status: ClassStatus;
}

