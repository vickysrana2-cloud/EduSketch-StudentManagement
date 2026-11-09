import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class UpdateUserProfileDto {
  @ApiPropertyOptional({
    description: 'Updated full name of the user',
    example: 'Amit Sharma Updated',
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated email address (must be unique)',
    example: 'amit.updated@school.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Optional profile avatar image URL',
    example: 'https://images.school.edu/profiles/amit.png',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((o) => o.profileImage !== null && o.profileImage !== undefined)
  @IsString()
  profileImage?: string | null;
}

