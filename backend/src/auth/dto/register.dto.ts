import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../users/enums/user.enums';

export class RegisterDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@abcschool.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Password (minimum 8 characters)',
    example: 'SecureP@ssw0rd123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    enum: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT],
    example: UserRole.TEACHER,
    description: 'Role of the registering user (SUPER_ADMIN cannot self-register)',
  })
  @IsEnum(UserRole, {
    message: 'Role must be ADMIN, TEACHER, or STUDENT',
  })
  @IsNotEmpty()
  role: UserRole;

  @ApiProperty({
    description: 'MongoDB ObjectId of the associated institution',
    example: '67272714207198bb6c30f401',
  })
  @IsMongoId({ message: 'institutionId must be a valid MongoDB ObjectId' })
  @IsNotEmpty()
  institutionId: string;

  @ApiPropertyOptional({
    description: 'Profile image URL',
    example: 'https://example.com/avatar.jpg',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  profileImage?: string | null;
}

