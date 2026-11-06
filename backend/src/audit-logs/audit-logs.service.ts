import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
import {
  AuditLogResponseDto,
  PaginatedAuditLogsResponseDto,
} from './dto/audit-log-response.dto';
import { UserRole } from '../users/enums/user.enums';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { TenantContextService } from '../common/tenancy/tenant-context.service';

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  // Blacklist of sensitive key substrings that must NEVER be stored in audit metadata (Requirement 7)
  private readonly sensitivePatterns =
    /password|secret|hash|token|refreshtoken|accesstoken|authorization|cookie/i;

  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
    private readonly tenantContextService: TenantContextService,
  ) {}

  /**
   * Helper to validate a MongoDB ObjectId string
   */
  private validateObjectId(id: string, fieldName = 'ID'): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(
        `Invalid MongoDB ObjectId format for ${fieldName}: '${id}'`,
      );
    }
    return new Types.ObjectId(id);
  }

  /**
   * Recursively sanitizes metadata by stripping/redacting credentials and sensitive tokens (Requirement 7)
   */
  public sanitizeMetadata(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeMetadata(item));
    }

    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (this.sensitivePatterns.test(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeMetadata(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  /**
   * Records a centralized audit log entry (Requirement 2 & 6)
   */
  async logAction(dto: CreateAuditLogDto): Promise<AuditLogDocument> {
    const userId = dto.userId ? this.validateObjectId(dto.userId, 'userId') : null;
    const institutionId = dto.institutionId
      ? this.validateObjectId(dto.institutionId, 'institutionId')
      : null;

    const sanitizedMeta = this.sanitizeMetadata(dto.metadata || {});

    const auditEntry = new this.auditLogModel({
      userId,
      institutionId,
      action: dto.action,
      module: dto.module,
      description: dto.description.trim(),
      targetId: dto.targetId || null,
      targetType: dto.targetType || null,
      ipAddress: dto.ipAddress || null,
      userAgent: dto.userAgent || null,
      metadata: sanitizedMeta,
    });

    const saved = await auditEntry.save();
    this.logger.log(
      `[AUDIT] Action: ${saved.action} | Module: ${saved.module} | User: ${userId || 'ANONYMOUS'} | Inst: ${institutionId || 'SYSTEM'}`,
    );
    return saved;
  }

  /**
   * Retrieves paginated audit logs with multi-tenant filtering (Requirements 8, 10, 11)
   */
  async findAll(
    query: QueryAuditLogsDto,
    currentUser: AuthenticatedUser,
  ): Promise<PaginatedAuditLogsResponseDto> {
    const filterQuery: Record<string, any> = {};

    // 1. Multi-tenant access control (TASK 28)
    if (currentUser.role !== UserRole.SUPER_ADMIN && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Access denied: You do not have permission to view audit logs.',
      );
    }
    const tenantFilter = this.tenantContextService.buildTenantFilter(
      currentUser,
      query.institutionId,
    );
    Object.assign(filterQuery, tenantFilter);

    // 2. Functional Module Filter
    if (query.module) {
      filterQuery.module = query.module;
    }

    // 3. Action Filter
    if (query.action) {
      filterQuery.action = query.action;
    }

    // 4. Actor User Filter
    if (query.userId) {
      filterQuery.userId = this.validateObjectId(query.userId, 'userId');
    }

    // 5. Target Entity Filter
    if (query.targetId) {
      filterQuery.targetId = query.targetId;
    }

    // 6. Date Range Filters
    if (query.startDate || query.endDate) {
      filterQuery.createdAt = {};
      if (query.startDate) {
        filterQuery.createdAt.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        filterQuery.createdAt.$lte = new Date(query.endDate);
      }
    }

    // 7. Text Search Filter
    if (query.search && query.search.trim().length > 0) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filterQuery.$or = [
        { description: searchRegex },
        { targetType: searchRegex },
        { ipAddress: searchRegex },
      ];
    }

    // 8. Pagination calculation
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.auditLogModel
        .find(filterQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email role')
        .populate('institutionId', 'name code')
        .exec(),
      this.auditLogModel.countDocuments(filterQuery).exec(),
    ]);

    const transformedItems: AuditLogResponseDto[] = items.map((doc) =>
      this.transformAuditLog(doc),
    );

    return {
      items: transformedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Retrieves a single audit log entry by ID with tenant checks (Requirement 8)
   */
  async findById(
    id: string,
    currentUser: AuthenticatedUser,
  ): Promise<AuditLogResponseDto> {
    const objectId = this.validateObjectId(id, 'auditLogId');

    const log = await this.auditLogModel
      .findById(objectId)
      .populate('userId', 'name email role')
      .populate('institutionId', 'name code')
      .exec();

    if (!log) {
      throw new NotFoundException(`Audit log with ID '${id}' not found`);
    }

    // Tenant check for School Admin
    if (currentUser.role === UserRole.ADMIN) {
      const logInstId = log.institutionId
        ? (log.institutionId as any)._id?.toString() || log.institutionId.toString()
        : null;

      if (!logInstId || logInstId !== currentUser.institutionId) {
        throw new ForbiddenException(
          'Access denied: You do not have permission to view audit logs from other institutions.',
        );
      }
    } else if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Access denied: You do not have permission to view audit logs.',
      );
    }

    return this.transformAuditLog(log);
  }

  /**
   * Formats raw MongoDB document into clean API response DTO
   */
  private transformAuditLog(doc: AuditLogDocument): AuditLogResponseDto {
    const user = doc.userId as any;
    const institution = doc.institutionId as any;

    return {
      id: doc._id.toString(),
      user:
        user && typeof user === 'object' && user._id
          ? {
              id: user._id.toString(),
              name: user.name,
              email: user.email,
              role: user.role,
            }
          : user
          ? {
              id: user.toString(),
              name: '',
              email: '',
              role: '',
            }
          : null,
      institution:
        institution && typeof institution === 'object' && institution._id
          ? {
              id: institution._id.toString(),
              name: institution.name,
              code: institution.code,
            }
          : institution
          ? {
              id: institution.toString(),
              name: '',
              code: '',
            }
          : null,
      action: doc.action,
      module: doc.module,
      description: doc.description,
      targetId: doc.targetId ? doc.targetId.toString() : null,
      targetType: doc.targetType,
      ipAddress: doc.ipAddress,
      userAgent: doc.userAgent,
      metadata: doc.metadata || {},
      createdAt: doc.createdAt || (doc as any)._id.getTimestamp(),
    };
  }
}

