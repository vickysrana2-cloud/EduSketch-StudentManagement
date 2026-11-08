import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddressDto {
  @ApiProperty({
    description: 'Street address of the institution',
    example: 'Main Road',
  })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({
    description: 'City where the institution is located',
    example: 'Nagpur',
  })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    description: 'State/Province of the institution',
    example: 'Maharashtra',
  })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiPropertyOptional({
    description: 'Country where the institution is located',
    example: 'India',
    default: 'India',
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({
    description: 'Postal/Zip code',
    example: '440001',
  })
  @IsString()
  @IsNotEmpty()
  postalCode: string;
}

