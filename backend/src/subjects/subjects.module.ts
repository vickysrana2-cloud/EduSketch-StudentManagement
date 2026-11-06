import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Subject, SubjectSchema } from './schemas/subject.schema';
import { SubjectsService } from './subjects.service';
import { SubjectsController } from './subjects.controller';
import { Class, ClassSchema } from '../classes/schemas/class.schema';
import {
  TeacherProfile,
  TeacherProfileSchema,
} from '../teacher-profiles/schemas/teacher-profile.schema';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subject.name, schema: SubjectSchema },
      { name: Class.name, schema: ClassSchema },
      { name: TeacherProfile.name, schema: TeacherProfileSchema },
    ]),
    AuditLogsModule,
  ],
  controllers: [SubjectsController],
  providers: [SubjectsService],
  exports: [SubjectsService, MongooseModule],
})
export class SubjectsModule {}

