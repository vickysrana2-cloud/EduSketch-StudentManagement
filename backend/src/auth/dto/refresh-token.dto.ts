import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiPropertyOptional({
    description:
      'Cryptographically random refresh token. Optional if sent via HttpOnly cookie.',
    example: '7f9b8c2d1e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2f4a61',
  })
  @IsOptional()
  @IsString({ message: 'refreshToken must be a valid string' })
  refreshToken?: string;
}
