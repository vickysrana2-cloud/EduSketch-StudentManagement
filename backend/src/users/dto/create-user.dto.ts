import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { UserRole, UserStatus } from '../enums/user.enums';

export class CreateUserDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'Vicky Rana',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Globally unique email address',
    example: 'vicky@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description:
      'Plaintext password (minimum 8 characters). Will be hashed before saving into MongoDB.',
    example: 'SecureP@ssw0rd123',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.ADMIN,
    description: 'Role of the user in the education management system',
  })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;

  @ApiPropertyOptional({
    enum: UserStatus,
    default: UserStatus.ACTIVE,
    description: 'Account status of the user',
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    description:
      'MongoDB ObjectId of the associated Institution. Required for ADMIN, TEACHER, and STUDENT. Must be null for SUPER_ADMIN.',
    example: '67272714207198bb6c30f401',
    nullable: true,
  })
  @ValidateIf((o) => o.role !== UserRole.SUPER_ADMIN)
  @IsNotEmpty({
    message: 'institutionId is required for ADMIN, TEACHER, and STUDENT',
  })
  @IsMongoId({
    message: 'institutionId must be a valid 24-character hexadecimal MongoDB ObjectId',
  })
  institutionId?: string | null;

  @ApiPropertyOptional({
    description: 'URL of the user profile image',
    example: 'https://example.com/profiles/vicky.jpg',
    nullable: true,
    default: null,
  })
  @IsOptional()
  @IsString()
  profileImage?: string | null;

  @ApiPropertyOptional({
    description: 'Whether the user email address has been verified',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean;
}

