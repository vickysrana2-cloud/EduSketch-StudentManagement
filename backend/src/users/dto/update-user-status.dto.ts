import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserStatus } from '../enums/user.enums';

export class UpdateUserStatusDto {
  @ApiProperty({
    enum: UserStatus,
    example: UserStatus.SUSPENDED,
    description: 'Updated account operational status (ACTIVE, INACTIVE, SUSPENDED)',
  })
  @IsEnum(UserStatus)
  @IsNotEmpty()
  status: UserStatus;
}

