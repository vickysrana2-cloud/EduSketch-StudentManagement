import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, UserSchema } from './schemas/user.schema';
import { Institution, InstitutionSchema } from '../institutions/schemas/institution.schema';
import { TeacherProfile, TeacherProfileSchema } from '../teacher-profiles/schemas/teacher-profile.schema';
import { StudentProfile, StudentProfileSchema } from '../student-profiles/schemas/student-profile.schema';
import { Class, ClassSchema } from '../classes/schemas/class.schema';
import { Enrollment, EnrollmentSchema } from '../enrollments/schemas/enrollment.schema';
import { Session, SessionSchema } from '../auth/schemas/session.schema';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Institution.name, schema: InstitutionSchema },
      { name: TeacherProfile.name, schema: TeacherProfileSchema },
      { name: StudentProfile.name, schema: StudentProfileSchema },
      { name: Class.name, schema: ClassSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: Session.name, schema: SessionSchema },
    ]),
    AuditLogsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, MongooseModule],
})
export class UsersModule {}
