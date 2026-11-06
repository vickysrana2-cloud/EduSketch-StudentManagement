import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsMongoId, IsNotEmpty } from 'class-validator';

export class AssignTeachersDto {
  @ApiProperty({
    description: 'Array of Teacher Profile IDs to assign to this subject',
    type: [String],
    example: ['60d0fe4f5311236168a109ca', '60d0fe4f5311236168a109cb'],
  })
  @IsNotEmpty()
  @IsArray()
  @IsMongoId({ each: true })
  teacherIds: string[];
}

