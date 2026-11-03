import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../users/enums/user.enums';

export class RegisterDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'Rahul Sharma',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({ message: 'Name must be a valid string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name: string;

  @ApiProperty({
    description: 'User email address',
    example: 'rahul@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description:
      'Strong password (minimum 8 characters, must contain at least one uppercase letter, one lowercase letter, and one number)',
    example: 'StrongPassword123',
    minLength: 8,
  })
  @IsString({ message: 'Password must be a valid string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password is too weak. It must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.TEACHER,
    description:
      'Role of the registering user (ADMIN, TEACHER, STUDENT). SUPER_ADMIN cannot be registered via this endpoint.',
  })
  @IsEnum(UserRole, {
    message: 'Role must be a valid role (ADMIN, TEACHER, STUDENT)',
  })
  @IsNotEmpty({ message: 'Role is required' })
  role: UserRole;

  @ApiPropertyOptional({
    description:
      'MongoDB ObjectId of the associated institution. For Admin-created accounts, this is automatically derived from the authenticated Admin session.',
    example: '67272714207198bb6c30f401',
    nullable: true,
  })
  @IsOptional()
  @IsMongoId({ message: 'institutionId must be a valid MongoDB ObjectId' })
  institutionId?: string | null;

  @ApiPropertyOptional({
    description: 'Optional profile image URL',
    example: 'https://example.com/avatar.jpg',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  profileImage?: string | null;
}
