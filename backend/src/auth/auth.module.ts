import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { SessionsService } from './sessions.service';
import { Session, SessionSchema } from './schemas/session.schema';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard';
import { UsersModule } from '../users/users.module';
import { InstitutionsModule } from '../institutions/institutions.module';

@Module({
  imports: [
    UsersModule,
    InstitutionsModule,
    MongooseModule.forFeature([{ name: Session.name, schema: SessionSchema }]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn:
            (configService.get<string>('JWT_ACCESS_EXPIRES_IN') as any) ||
            '15m',
          issuer:
            configService.get<string>('JWT_ISSUER') ||
            'education-management-system',
          audience:
            configService.get<string>('JWT_AUDIENCE') ||
            'education-management-users',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    SessionsService,
    JwtStrategy,
    JwtAuthGuard,
    OptionalJwtAuthGuard,
  ],
  exports: [
    AuthService,
    TokenService,
    SessionsService,
    JwtStrategy,
    JwtAuthGuard,
    OptionalJwtAuthGuard,
    PassportModule,
    JwtModule,
  ],
})
export class AuthModule {}
