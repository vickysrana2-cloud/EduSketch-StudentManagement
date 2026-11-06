import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateInstitutionAdminDto {
  @ApiProperty({
    description: 'Full name of the institution administrator',
    example: 'School Administrator',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  name: string;

  @ApiProperty({
    description: 'Unique email address for administrator login',
    example: 'admin@school.com',
  })
  @IsNotEmpty()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    description: 'Strong password for administrator account',
    example: 'StrongPassword123',
    minLength: 8,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @ApiPropertyOptional({
    description: 'Optional profile avatar image URL',
    example: 'https://images.school.edu/admins/admin1.png',
  })
  @IsOptional()
  @IsString()
  profileImage?: string;
}

