import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InstitutionsModule } from './institutions/institutions.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RolePermissionsModule } from './role-permissions/role-permissions.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { StudentProfilesModule } from './student-profiles/student-profiles.module';
import { TeacherProfilesModule } from './teacher-profiles/teacher-profiles.module';
import { ClassesModule } from './classes/classes.module';
import { SubjectsModule } from './subjects/subjects.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds window
        limit: 30, // 30 requests per minute default
      },
    ]),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const isProduction = configService.get<string>('NODE_ENV') === 'production';
        return {
          uri: configService.get<string>('MONGODB_URI'),
          dbName:
            configService.get<string>('MONGODB_DB_NAME') || 'studentManagement',
          // Safe index synchronization:
          // In development/testing, autoIndex: true automatically creates schema indexes.
          // In production, autoIndex: false prevents blocking database overhead upon container start.
          autoIndex: !isProduction,
        };
      },
      inject: [ConfigService],
    }),
    InstitutionsModule,
    UsersModule,
    AuthModule,
    RolesModule,
    PermissionsModule,
    RolePermissionsModule,
    AuditLogsModule,
    StudentProfilesModule,
    TeacherProfilesModule,
    ClassesModule,
    SubjectsModule,
    EnrollmentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
