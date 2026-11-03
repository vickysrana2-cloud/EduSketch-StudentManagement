import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InstitutionsController } from './institutions.controller';
import { InstitutionsService } from './institutions.service';
import {
  Institution,
  InstitutionSchema,
} from './schemas/institution.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Institution.name, schema: InstitutionSchema },
    ]),
  ],
  controllers: [InstitutionsController],
  providers: [InstitutionsService],
  exports: [InstitutionsService, MongooseModule],
})
export class InstitutionsModule {}

