import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  Gender,
  ParentRelationship,
} from '../../student-profiles/schemas/student-profile.schema';

export class ParentDetailItemDto {
  @ApiProperty({ example: 'Rajesh Sharma' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ enum: ParentRelationship, example: ParentRelationship.FATHER })
  @IsNotEmpty()
  @IsEnum(ParentRelationship)
  relationship: ParentRelationship;

  @ApiProperty({ example: '+919876543210' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: 'parent@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class StudentAddressItemDto {
  @ApiProperty({ example: 'Main Road' })
  @IsNotEmpty()
  @IsString()
  street: string;

  @ApiProperty({ example: 'Nagpur' })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({ example: 'Maharashtra' })
  @IsNotEmpty()
  @IsString()
  state: string;

  @ApiProperty({ example: '440001' })
  @IsNotEmpty()
  @IsString()
  postalCode: string;
}

export class CreateStudentUserDto {
  @ApiProperty({
    description: 'Student full legal name',
    example: 'Amit Sharma',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  name: string;

  @ApiProperty({
    description: 'Unique email address for student login',
    example: 'amit@school.com',
  })
  @IsNotEmpty()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiPropertyOptional({
    description: 'Account password (if omitted, an initial secure password will be generated)',
    example: 'StudentPass123',
    minLength: 8,
  })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password?: string;

  @ApiProperty({
    description: 'Unique school admission / registration number',
    example: 'ABC2026001',
  })
  @IsNotEmpty()
  @IsString()
  admissionNumber: string;

  @ApiProperty({
    description: 'Date of birth in ISO 8601 format (YYYY-MM-DD)',
    example: '2010-05-15',
  })
  @IsNotEmpty()
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({
    description: 'Biological gender',
    enum: Gender,
    example: Gender.MALE,
  })
  @IsNotEmpty()
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({
    description: 'Parent / guardian contact details',
    type: [ParentDetailItemDto],
  })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParentDetailItemDto)
  parentDetails: ParentDetailItemDto[];

  @ApiPropertyOptional({
    description: 'Residential address',
    type: StudentAddressItemDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => StudentAddressItemDto)
  address?: StudentAddressItemDto;

  @ApiProperty({
    description: 'Valid Class ObjectId in the institution',
    example: '67272714207198bb6c30f401',
  })
  @IsNotEmpty()
  @IsMongoId()
  classId: string;

  @ApiPropertyOptional({
    description: 'Academic year for enrollment (e.g. 2026-2027)',
    example: '2026-2027',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{4}$/, {
    message: 'Academic year must be in format YYYY-YYYY (e.g. 2026-2027)',
  })
  academicYear?: string;

  @ApiPropertyOptional({
    description: 'Class roll number (if omitted, will be automatically assigned)',
    example: '12',
  })
  @IsOptional()
  @IsString()
  rollNumber?: string;

  @ApiPropertyOptional({
    description: 'Institution ObjectId (required for SUPER_ADMIN, automatically derived for ADMIN)',
    example: '67272714207198bb6c30f401',
  })
  @IsOptional()
  @IsMongoId()
  institutionId?: string;
}

