import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateRoleDto {
  @ApiPropertyOptional({
    description: 'Human-friendly display name for the role',
    example: 'Institution Administrator',
  })
  @IsOptional()
  @IsString({ message: 'displayName must be a string' })
  @MinLength(2, { message: 'displayName must be at least 2 characters' })
  displayName?: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the responsibilities and scope',
    example: 'Manages an individual institution and its users',
  })
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  @MaxLength(500, { message: 'description cannot exceed 500 characters' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether the role is active in the system',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean value' })
  isActive?: boolean;
}

