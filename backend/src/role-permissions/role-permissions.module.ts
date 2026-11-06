import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RolePermissionsController } from './role-permissions.controller';
import { RolePermissionsService } from './role-permissions.service';
import {
  RolePermission,
  RolePermissionSchema,
} from './schemas/role-permission.schema';
import { RolesModule } from '../roles/roles.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { InstitutionsModule } from '../institutions/institutions.module';
import { AuthModule } from '../auth/auth.module';
import { PermissionsGuard } from '../common/guards/permissions.guard';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RolePermission.name, schema: RolePermissionSchema },
    ]),
    RolesModule,
    PermissionsModule,
    InstitutionsModule,
    AuthModule,
  ],
  controllers: [RolePermissionsController],
  providers: [RolePermissionsService, PermissionsGuard],
  exports: [RolePermissionsService, PermissionsGuard, MongooseModule],
})
export class RolePermissionsModule {}

