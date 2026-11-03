import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole, UserStatus } from '../enums/user.enums';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Updated full name of the user',
    example: 'Vicky Rana Updated',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated email address',
    example: 'vicky.new@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'New password (minimum 8 characters). Will be hashed before saving.',
    example: 'NewSecureP@ssw0rd123',
    minLength: 8,
  })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password?: string;

  @ApiPropertyOptional({
    enum: UserRole,
    description: 'Updated role of the user',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    enum: UserStatus,
    description: 'Updated status of the user account',
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    description:
      'Updated MongoDB ObjectId of the associated Institution (must be null for SUPER_ADMIN)',
    example: '67272714207198bb6c30f401',
    nullable: true,
  })
  @IsOptional()
  @IsMongoId()
  institutionId?: string | null;

  @ApiPropertyOptional({
    description: 'Updated URL of the profile image',
    example: 'https://example.com/profiles/vicky_new.jpg',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  profileImage?: string | null;

  @ApiPropertyOptional({
    description: 'Updated email verification status',
  })
  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean;
}

