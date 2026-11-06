import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import {
  BloodGroup,
  Gender,
  ParentRelationship,
  StudentProfileStatus,
} from '../schemas/student-profile.schema';

export class StudentAddressDto {
  @ApiProperty({ example: 'Main Road' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ example: 'Nagpur' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'Maharashtra' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ example: '440001' })
  @IsString()
  @IsNotEmpty()
  postalCode: string;
}

export class ParentDetailDto {
  @ApiProperty({ example: 'Rajesh Sharma' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: ParentRelationship, example: ParentRelationship.FATHER })
  @IsEnum(ParentRelationship)
  relationship: ParentRelationship;

  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({ example: 'parent@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class CreateStudentProfileDto {
  @ApiProperty({ description: 'MongoDB ObjectId of User account', example: '67272714207198bb6c30f401' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({ description: 'Institution ID (Auto-populated for School Admins)', example: '67272714207198bb6c30f400' })
  @IsOptional()
  @IsString()
  institutionId?: string;

  @ApiProperty({ example: 'ABC2026001' })
  @IsString()
  @IsNotEmpty()
  admissionNumber: string;

  @ApiProperty({ example: '2010-05-15T00:00:00.000Z' })
  @IsISO8601()
  dateOfBirth: string;

  @ApiProperty({ enum: Gender, example: Gender.MALE })
  @IsEnum(Gender)
  gender: Gender;

  @ApiPropertyOptional({ enum: BloodGroup, example: BloodGroup.O_POSITIVE, nullable: true })
  @IsOptional()
  @IsEnum(BloodGroup)
  bloodGroup?: BloodGroup | null;

  @ApiProperty({ type: StudentAddressDto })
  @ValidateNested()
  @Type(() => StudentAddressDto)
  address: StudentAddressDto;

  @ApiPropertyOptional({ type: [ParentDetailDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParentDetailDto)
  parentDetails?: ParentDetailDto[];

  @ApiPropertyOptional({ enum: StudentProfileStatus, default: StudentProfileStatus.ACTIVE })
  @IsOptional()
  @IsEnum(StudentProfileStatus)
  status?: StudentProfileStatus;
}

