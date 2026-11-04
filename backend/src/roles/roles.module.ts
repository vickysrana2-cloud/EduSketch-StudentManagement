import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { Role, RoleSchema } from './schemas/role.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Role.name, schema: RoleSchema }]),
    AuthModule,
  ],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService, MongooseModule],
})
export class RolesModule {}

