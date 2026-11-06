import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Enrollment, EnrollmentSchema } from './schemas/enrollment.schema';
import { EnrollmentsService } from './enrollments.service';
import { EnrollmentsController } from './enrollments.controller';
import {
  StudentProfile,
  StudentProfileSchema,
} from '../student-profiles/schemas/student-profile.schema';
import { Class, ClassSchema } from '../classes/schemas/class.schema';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: StudentProfile.name, schema: StudentProfileSchema },
      { name: Class.name, schema: ClassSchema },
    ]),
    AuditLogsModule,
  ],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
  exports: [EnrollmentsService, MongooseModule],
})
export class EnrollmentsModule {}

