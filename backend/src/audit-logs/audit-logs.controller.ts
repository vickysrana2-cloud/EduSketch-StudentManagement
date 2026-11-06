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
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
import {
  AuditLogResponseDto,
  PaginatedAuditLogsResponseDto,
} from './dto/audit-log-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@ApiTags('Audit Logs')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get Paginated Audit Logs',
    description:
      'Retrieves paginated audit log records with multi-tenant isolation. Super Admin can view all records across institutions; Institution Admin can only view logs for their own institution. Normal users cannot access audit logs.',
  })
  @ApiOkResponse({
    description: 'Paginated audit log records retrieved successfully.',
    type: PaginatedAuditLogsResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, expired, or invalid JWT Bearer token.',
  })
  @ApiForbiddenResponse({
    description:
      'Access denied: User does not hold administrative privileges or attempted cross-tenant query.',
  })
  async findAll(
    @Query() query: QueryAuditLogsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginatedAuditLogsResponseDto> {
    return await this.auditLogsService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get Specific Audit Log by ID',
    description:
      'Retrieves a single audit log entry by its MongoDB ObjectId, enforcing institutional boundary verification.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the audit log document',
    example: '67272714207198bb6c30f501',
  })
  @ApiOkResponse({
    description: 'Audit log entry retrieved successfully.',
    type: AuditLogResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, expired, or invalid JWT Bearer token.',
  })
  @ApiForbiddenResponse({
    description:
      'Access denied: Non-administrator or cross-institution access attempt.',
  })
  @ApiNotFoundResponse({
    description: 'Audit log entry not found with the specified ID.',
  })
  async findById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AuditLogResponseDto> {
    return await this.auditLogsService.findById(id, user);
  }
}
