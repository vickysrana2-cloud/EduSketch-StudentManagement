import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class AssignResourcesDto {
  @ApiPropertyOptional({ type: [String], description: 'Array of Class ObjectIds' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assignedClassIds?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Array of Subject ObjectIds' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assignedSubjectIds?: string[];
}

