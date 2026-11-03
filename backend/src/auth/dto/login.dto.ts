import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../../users/enums/user.enums';

export class LoginDto {
  @ApiProperty({
    description: 'Registered user email address',
    example: 'teacher@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email cannot be empty' })
  email: string;

  @ApiProperty({
    description: 'User account password',
    example: 'StrongPassword123',
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password cannot be empty' })
  password: string;

  @ApiPropertyOptional({
    enum: UserRole,
    description:
      'Optional role check selected on the login UI. The database role is always authoritative.',
    example: UserRole.TEACHER,
  })
  @IsOptional()
  @IsEnum(UserRole, {
    message: 'Role must be one of SUPER_ADMIN, ADMIN, TEACHER, or STUDENT',
  })
  role?: UserRole;
}
