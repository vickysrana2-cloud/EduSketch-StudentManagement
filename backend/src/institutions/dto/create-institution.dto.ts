import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import {
  InstitutionStatus,
  InstitutionType,
} from '../enums/institution.enums';
import { AddressDto } from './address.dto';
import { SubscriptionDto } from './subscription.dto';

export class CreateInstitutionDto {
  @ApiProperty({
    description: 'Official name of the educational institution',
    example: 'ABC Public School',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Unique institution identifier code (alphanumeric/hyphen/underscore)',
    example: 'ABC001',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message: 'code must only contain alphanumeric characters, underscores, or hyphens',
  })
  code: string;

  @ApiProperty({
    enum: InstitutionType,
    example: InstitutionType.SCHOOL,
    description: 'Type of the institution',
  })
  @IsEnum(InstitutionType)
  @IsNotEmpty()
  type: InstitutionType;

  @ApiProperty({
    description: 'Official contact email of the institution',
    example: 'contact@abcschool.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Primary contact phone number with country code',
    example: '+919876543210',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{7,14}$/, {
    message: 'phone must be a valid phone number with optional country code (+91...) and 8-15 digits',
  })
  phone: string;

  @ApiProperty({
    type: AddressDto,
    description: 'Physical address of the institution',
  })
  @ValidateNested()
  @Type(() => AddressDto)
  @IsNotEmpty()
  address: AddressDto;

  @ApiPropertyOptional({
    description: 'URL or storage path to the institution logo',
    example: 'https://example.com/logo.png',
    nullable: true,
    default: null,
  })
  @IsOptional()
  @IsString()
  logo?: string | null;

  @ApiPropertyOptional({
    enum: InstitutionStatus,
    default: InstitutionStatus.ACTIVE,
    description: 'Operational status of the institution',
  })
  @IsOptional()
  @IsEnum(InstitutionStatus)
  status?: InstitutionStatus;

  @ApiProperty({
    type: SubscriptionDto,
    description: 'SaaS subscription details',
  })
  @ValidateNested()
  @Type(() => SubscriptionDto)
  @IsNotEmpty()
  subscription: SubscriptionDto;

  @ApiProperty({
    description: 'MongoDB ObjectId of the user who registered this institution',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId({
    message: 'createdBy must be a valid 24-character hexadecimal MongoDB ObjectId referencing User',
  })
  @IsNotEmpty()
  createdBy: string;
}

