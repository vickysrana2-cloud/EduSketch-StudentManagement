import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from '../enums/user.enums';

export class UpdateUserRoleDto {
  @ApiProperty({
    description: 'New role to assign to the user (Requires SUPER_ADMIN authorization)',
    enum: UserRole,
    example: UserRole.TEACHER,
  })
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;
}

