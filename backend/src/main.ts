import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { MongoExceptionFilter } from './common/filters/mongo-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Global prefix for all API routes
  app.setGlobalPrefix('api');

  // Global exception filter for MongoDB/Mongoose duplicate keys & data integrity errors
  app.useGlobalFilters(new MongoExceptionFilter());

  // Global validation pipe for request DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger Documentation Setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Multi-School Education Management System API')
    .setDescription(
      'Multi-School SaaS Management System Backend API. Includes Institution, User management, Subscriptions, and multi-tenant management.',
    )
    .setVersion('1.0.0')
    .addTag('Authentication', 'JWT Authentication, login, registration, and token refresh operations')
    .addTag('Institutions', 'Operations for managing educational institutions')
    .addTag(
      'Users',
      'Operations for managing users across all roles (SUPER_ADMIN, ADMIN, TEACHER, STUDENT)',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter your JWT Bearer token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-user-role',
        in: 'header',
        description: 'Temporary authorization header (must be SUPER_ADMIN or ADMIN)',
      },
      'x-user-role',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3001;

  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}/api`);
  logger.log(`Swagger documentation available at: http://localhost:${port}/api/docs`);
}
bootstrap();
