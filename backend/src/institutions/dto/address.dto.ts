import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

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

  @ApiProperty({
    description: 'Country where the institution is located',
    example: 'India',
  })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({
    description: 'Postal/Zip code',
    example: '440001',
  })
  @IsString()
  @IsNotEmpty()
  postalCode: string;
}

