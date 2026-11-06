import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { MongoExceptionFilter } from './common/filters/mongo-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  // Security Headers: Helmet protection (OWASP Recommendation)
  app.use(
    helmet({
      contentSecurityPolicy: isProduction ? undefined : false, // Permissive in dev for Swagger UI
      crossOriginEmbedderPolicy: isProduction,
    }),
  );

  // Cross-Origin Resource Sharing (CORS) Security Configuration
  const allowedOriginsRaw =
    configService.get<string>('ALLOWED_ORIGINS') ||
    'http://localhost:3000,http://localhost:5173';
  const allowedOrigins = allowedOriginsRaw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server) or matching allowed origins
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error(`Blocked by CORS policy for origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-user-role',
      'x-user-id',
      'x-institution-id',
    ],
  });

  // Global prefix for all API routes
  app.setGlobalPrefix('api');

  // Cookie Parser middleware for HttpOnly cookies
  app.use(cookieParser());

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

  // Swagger Documentation Setup: Gated in production (Security Hardening)
  const enableSwagger =
    configService.get<string>('ENABLE_SWAGGER') === 'true' || !isProduction;

  if (enableSwagger) {
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
          description: 'Development authorization header (disabled in production)',
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
    logger.log('Swagger documentation enabled at /api/docs');
  } else {
    logger.log('Swagger documentation disabled in production environment');
  }

  const port = configService.get<number>('PORT') ?? 3001;

  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}/api`);
}
bootstrap();
