import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Permission, PermissionDocument } from './schemas/permission.schema';
import { PermissionAction, PermissionModule } from './enums/permission.enums';
import { QueryPermissionsDto } from './dto/query-permissions.dto';

interface SeedPermissionDefinition {
  name: string;
  module: PermissionModule;
  action: PermissionAction;
  description: string;
}

/**
 * Standard System Permission Definitions (Requirement 5)
 * Comprehensive catalog across all 10 educational modules and 5 granular actions.
 */
export const SYSTEM_PERMISSIONS_CATALOG: SeedPermissionDefinition[] = [
  // INSTITUTIONS
  {
    name: 'INSTITUTION_CREATE',
    module: PermissionModule.INSTITUTIONS,
    action: PermissionAction.CREATE,
    description: 'Register and onboard a new institution',
  },
  {
    name: 'INSTITUTION_READ',
    module: PermissionModule.INSTITUTIONS,
    action: PermissionAction.READ,
    description: 'View institution profiles, configuration, and details',
  },
  {
    name: 'INSTITUTION_UPDATE',
    module: PermissionModule.INSTITUTIONS,
    action: PermissionAction.UPDATE,
    description: 'Modify institution metadata, settings, and subscription',
  },
  {
    name: 'INSTITUTION_DELETE',
    module: PermissionModule.INSTITUTIONS,
    action: PermissionAction.DELETE,
    description: 'Delete or deactivate an institution',
  },
  {
    name: 'INSTITUTION_MANAGE',
    module: PermissionModule.INSTITUTIONS,
    action: PermissionAction.MANAGE,
    description: 'Full administrative governance over institutions',
  },

  // USERS
  {
    name: 'USER_CREATE',
    module: PermissionModule.USERS,
    action: PermissionAction.CREATE,
    description: 'Create new user accounts',
  },
  {
    name: 'USER_READ',
    module: PermissionModule.USERS,
    action: PermissionAction.READ,
    description: 'View user profiles and account details',
  },
  {
    name: 'USER_UPDATE',
    module: PermissionModule.USERS,
    action: PermissionAction.UPDATE,
    description: 'Modify user details, status, and profile info',
  },
  {
    name: 'USER_DELETE',
    module: PermissionModule.USERS,
    action: PermissionAction.DELETE,
    description: 'Delete or deactivate user accounts',
  },
  {
    name: 'USER_MANAGE',
    module: PermissionModule.USERS,
    action: PermissionAction.MANAGE,
    description: 'Full administrative access to manage all users',
  },

  // STUDENTS
  {
    name: 'STUDENT_CREATE',
    module: PermissionModule.STUDENTS,
    action: PermissionAction.CREATE,
    description: 'Create a new student',
  },
  {
    name: 'STUDENT_READ',
    module: PermissionModule.STUDENTS,
    action: PermissionAction.READ,
    description: 'View student records, enrollments, and academic status',
  },
  {
    name: 'STUDENT_UPDATE',
    module: PermissionModule.STUDENTS,
    action: PermissionAction.UPDATE,
    description: 'Update student profiles, personal info, and status',
  },
  {
    name: 'STUDENT_DELETE',
    module: PermissionModule.STUDENTS,
    action: PermissionAction.DELETE,
    description: 'Remove or archive student records',
  },
  {
    name: 'STUDENT_MANAGE',
    module: PermissionModule.STUDENTS,
    action: PermissionAction.MANAGE,
    description: 'Full management of student admissions and lifecycle',
  },

  // TEACHERS
  {
    name: 'TEACHER_CREATE',
    module: PermissionModule.TEACHERS,
    action: PermissionAction.CREATE,
    description: 'Onboard and register new teachers',
  },
  {
    name: 'TEACHER_READ',
    module: PermissionModule.TEACHERS,
    action: PermissionAction.READ,
    description: 'View teacher credentials, schedules, and assignments',
  },
  {
    name: 'TEACHER_UPDATE',
    module: PermissionModule.TEACHERS,
    action: PermissionAction.UPDATE,
    description: 'Modify teacher details and subject assignments',
  },
  {
    name: 'TEACHER_DELETE',
    module: PermissionModule.TEACHERS,
    action: PermissionAction.DELETE,
    description: 'Offboard or archive teacher records',
  },
  {
    name: 'TEACHER_MANAGE',
    module: PermissionModule.TEACHERS,
    action: PermissionAction.MANAGE,
    description: 'Full administrative management of faculty and teaching staff',
  },

  // CLASSES
  {
    name: 'CLASS_CREATE',
    module: PermissionModule.CLASSES,
    action: PermissionAction.CREATE,
    description: 'Create classes, grades, and sections',
  },
  {
    name: 'CLASS_READ',
    module: PermissionModule.CLASSES,
    action: PermissionAction.READ,
    description: 'View class rosters, schedules, and details',
  },
  {
    name: 'CLASS_UPDATE',
    module: PermissionModule.CLASSES,
    action: PermissionAction.UPDATE,
    description: 'Modify class configurations and section assignments',
  },
  {
    name: 'CLASS_DELETE',
    module: PermissionModule.CLASSES,
    action: PermissionAction.DELETE,
    description: 'Delete or archive classroom sections',
  },
  {
    name: 'CLASS_MANAGE',
    module: PermissionModule.CLASSES,
    action: PermissionAction.MANAGE,
    description: 'Comprehensive academic class structure management',
  },

  // SUBJECTS
  {
    name: 'SUBJECT_CREATE',
    module: PermissionModule.SUBJECTS,
    action: PermissionAction.CREATE,
    description: 'Create new academic subjects and curriculum units',
  },
  {
    name: 'SUBJECT_READ',
    module: PermissionModule.SUBJECTS,
    action: PermissionAction.READ,
    description: 'View course syllabi, curriculum, and subject catalogs',
  },
  {
    name: 'SUBJECT_UPDATE',
    module: PermissionModule.SUBJECTS,
    action: PermissionAction.UPDATE,
    description: 'Update subject codes, credits, and syllabus details',
  },
  {
    name: 'SUBJECT_DELETE',
    module: PermissionModule.SUBJECTS,
    action: PermissionAction.DELETE,
    description: 'Remove subjects from the institutional catalog',
  },
  {
    name: 'SUBJECT_MANAGE',
    module: PermissionModule.SUBJECTS,
    action: PermissionAction.MANAGE,
    description: 'Full subject catalog and curriculum management',
  },

  // ATTENDANCE
  {
    name: 'ATTENDANCE_CREATE',
    module: PermissionModule.ATTENDANCE,
    action: PermissionAction.CREATE,
    description: 'Mark and submit daily or session attendance records',
  },
  {
    name: 'ATTENDANCE_READ',
    module: PermissionModule.ATTENDANCE,
    action: PermissionAction.READ,
    description: 'View attendance registers and absence summaries',
  },
  {
    name: 'ATTENDANCE_UPDATE',
    module: PermissionModule.ATTENDANCE,
    action: PermissionAction.UPDATE,
    description: 'Correct or adjust recorded attendance entries',
  },
  {
    name: 'ATTENDANCE_DELETE',
    module: PermissionModule.ATTENDANCE,
    action: PermissionAction.DELETE,
    description: 'Delete invalid attendance submissions',
  },
  {
    name: 'ATTENDANCE_MANAGE',
    module: PermissionModule.ATTENDANCE,
    action: PermissionAction.MANAGE,
    description: 'Full authority over institutional attendance policies and registers',
  },

  // EXAMINATIONS
  {
    name: 'EXAMINATION_CREATE',
    module: PermissionModule.EXAMINATIONS,
    action: PermissionAction.CREATE,
    description: 'Schedule examinations, test series, and assessments',
  },
  {
    name: 'EXAMINATION_READ',
    module: PermissionModule.EXAMINATIONS,
    action: PermissionAction.READ,
    description: 'View examination timetables and hall assignments',
  },
  {
    name: 'EXAMINATION_UPDATE',
    module: PermissionModule.EXAMINATIONS,
    action: PermissionAction.UPDATE,
    description: 'Modify exam schedules, weightage, and guidelines',
  },
  {
    name: 'EXAMINATION_DELETE',
    module: PermissionModule.EXAMINATIONS,
    action: PermissionAction.DELETE,
    description: 'Cancel scheduled examinations',
  },
  {
    name: 'EXAMINATION_MANAGE',
    module: PermissionModule.EXAMINATIONS,
    action: PermissionAction.MANAGE,
    description: 'Full institutional examination and assessment management',
  },

  // RESULTS
  {
    name: 'RESULT_CREATE',
    module: PermissionModule.RESULTS,
    action: PermissionAction.CREATE,
    description: 'Enter and submit student grades and exam marks',
  },
  {
    name: 'RESULT_READ',
    module: PermissionModule.RESULTS,
    action: PermissionAction.READ,
    description: 'View student grade cards, reports, and GPA metrics',
  },
  {
    name: 'RESULT_UPDATE',
    module: PermissionModule.RESULTS,
    action: PermissionAction.UPDATE,
    description: 'Amend grade entries and performance evaluations',
  },
  {
    name: 'RESULT_DELETE',
    module: PermissionModule.RESULTS,
    action: PermissionAction.DELETE,
    description: 'Remove erroneous grade records',
  },
  {
    name: 'RESULT_MANAGE',
    module: PermissionModule.RESULTS,
    action: PermissionAction.MANAGE,
    description: 'Publish and administer academic report cards and transcripts',
  },

  // FEES
  {
    name: 'FEE_CREATE',
    module: PermissionModule.FEES,
    action: PermissionAction.CREATE,
    description: 'Create fee structures, invoice line items, and challans',
  },
  {
    name: 'FEE_READ',
    module: PermissionModule.FEES,
    action: PermissionAction.READ,
    description: 'View fee payment histories, dues, and receipts',
  },
  {
    name: 'FEE_UPDATE',
    module: PermissionModule.FEES,
    action: PermissionAction.UPDATE,
    description: 'Modify fee invoices, discounts, and payment statuses',
  },
  {
    name: 'FEE_DELETE',
    module: PermissionModule.FEES,
    action: PermissionAction.DELETE,
    description: 'Cancel fee invoices or reverse erroneous transactions',
  },
  {
    name: 'FEE_MANAGE',
    module: PermissionModule.FEES,
    action: PermissionAction.MANAGE,
    description: 'Full institutional finance, tuition, and fee structure control',
  },
];

@Injectable()
export class PermissionsService implements OnModuleInit {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(
    @InjectModel(Permission.name)
    private readonly permissionModel: Model<PermissionDocument>,
  ) {}

  async onModuleInit() {
    try {
      await this.seedPermissions();
    } catch (err: any) {
      this.logger.error(`Failed to auto-seed permissions catalog on startup: ${err.message}`);
    }
  }

  /**
   * Helper to validate a 24-character hexadecimal MongoDB ObjectId
   */
  private validateObjectId(id: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid MongoDB ObjectId format: '${id}'`);
    }
    return new Types.ObjectId(id);
  }

  /**
   * Idempotently seeds the standard system permission catalog (Requirements 5, 6, 9)
   */
  async seedPermissions(): Promise<{ created: number; updated: number; total: number }> {
    let created = 0;
    let updated = 0;

    for (const def of SYSTEM_PERMISSIONS_CATALOG) {
      const existing = await this.permissionModel.findOne({ name: def.name }).exec();
      if (!existing) {
        const newPerm = new this.permissionModel({
          ...def,
          isActive: true,
        });
        await newPerm.save();
        created++;
      } else {
        existing.module = def.module;
        existing.action = def.action;
        existing.description = def.description;
        existing.isActive = true;
        await existing.save();
        updated++;
      }
    }

    this.logger.log(
      `Permission seeding completed: ${created} created, ${updated} verified/updated (Total: ${SYSTEM_PERMISSIONS_CATALOG.length})`,
    );

    return { created, updated, total: SYSTEM_PERMISSIONS_CATALOG.length };
  }

  /**
   * Returns permissions with optional filtering by module or action
   */
  async findAll(query?: QueryPermissionsDto): Promise<PermissionDocument[]> {
    const filter: any = {};
    if (query?.module) {
      filter.module = query.module;
    }
    if (query?.action) {
      filter.action = query.action;
    }

    return await this.permissionModel.find(filter).sort({ module: 1, action: 1 }).exec();
  }

  /**
   * Finds a permission by its unique MongoDB ObjectId
   */
  async findById(id: string): Promise<PermissionDocument> {
    this.validateObjectId(id);
    const permission = await this.permissionModel.findById(id).exec();
    if (!permission) {
      throw new NotFoundException(`Permission with ID '${id}' not found`);
    }
    return permission;
  }

  /**
   * Finds a permission by its unique uppercase key name
   */
  async findByName(name: string): Promise<PermissionDocument | null> {
    return await this.permissionModel.findOne({ name: name.trim().toUpperCase() }).exec();
  }
}

