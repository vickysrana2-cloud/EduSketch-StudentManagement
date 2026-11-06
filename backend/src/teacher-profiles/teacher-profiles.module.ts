import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TeacherProfilesController } from './teacher-profiles.controller';
import { TeacherProfilesService } from './teacher-profiles.service';
import {
  TeacherProfile,
  TeacherProfileSchema,
} from './schemas/teacher-profile.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TeacherProfile.name, schema: TeacherProfileSchema },
    ]),
    UsersModule,
  ],
  controllers: [TeacherProfilesController],
  providers: [TeacherProfilesService],
  exports: [TeacherProfilesService, MongooseModule],
})
export class TeacherProfilesModule {}

