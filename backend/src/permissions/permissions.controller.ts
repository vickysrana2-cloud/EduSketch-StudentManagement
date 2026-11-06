import {
  Controller,
  Get,
  HttpStatus,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { PermissionResponseDto } from './dto/permission-response.dto';
import { QueryPermissionsDto } from './dto/query-permissions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Permissions')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'List All System Permissions',
    description:
      'Retrieves all catalogued system permission definitions across all 10 educational modules. Supports optional filtering by module or action.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Permissions retrieved successfully.',
    type: [PermissionResponseDto],
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or expired JWT Bearer token.',
  })
  async findAll(
    @Query() query: QueryPermissionsDto,
  ): Promise<PermissionResponseDto[]> {
    const permissions = await this.permissionsService.findAll(query);
    return permissions.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      module: p.module,
      action: p.action,
      description: p.description,
      isActive: p.isActive,
      createdAt: p.createdAt!,
      updatedAt: p.updatedAt!,
    }));
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get Permission Details by ID',
    description:
      'Retrieves the full metadata for a specific system permission definition by its MongoDB ObjectId.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the permission document',
    example: '67272714207198bb6c30f401',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Permission details retrieved successfully.',
    type: PermissionResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Permission with specified ID does not exist.',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or expired JWT Bearer token.',
  })
  async findOne(@Param('id') id: string): Promise<PermissionResponseDto> {
    const p = await this.permissionsService.findById(id);
    return {
      id: p._id.toString(),
      name: p.name,
      module: p.module,
      action: p.action,
      description: p.description,
      isActive: p.isActive,
      createdAt: p.createdAt!,
      updatedAt: p.updatedAt!,
    };
  }
}

