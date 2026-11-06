import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Class, ClassSchema } from './schemas/class.schema';
import { ClassesService } from './classes.service';
import { ClassesController } from './classes.controller';
import { TeacherProfile, TeacherProfileSchema } from '../teacher-profiles/schemas/teacher-profile.schema';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Class.name, schema: ClassSchema },
      { name: TeacherProfile.name, schema: TeacherProfileSchema },
    ]),
    AuditLogsModule,
  ],
  controllers: [ClassesController],
  providers: [ClassesService],
  exports: [ClassesService, MongooseModule],
})
export class ClassesModule {}

