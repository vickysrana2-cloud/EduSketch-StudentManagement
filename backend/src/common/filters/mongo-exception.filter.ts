import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { Error as MongooseError } from 'mongoose';

/**
 * ============================================================================
 * GLOBAL MONGO EXCEPTION FILTER
 * ============================================================================
 * Intercepts low-level MongoDB and Mongoose errors:
 * 1. Code 11000 Duplicate Key errors -> transforms into HTTP 409 ConflictException.
 * 2. Mongoose Schema ValidationError -> transforms into HTTP 400 Bad Request.
 * 3. Mongoose CastError -> transforms into HTTP 400 Bad Request.
 * 4. Passes standard NestJS HttpExceptions through cleanly.
 * ============================================================================
 */
@Catch()
export class MongoExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(MongoExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 1. Handle MongoDB Duplicate Key Error (Code 11000)
    if (exception?.code === 11000) {
      const keyPattern = exception.keyPattern || {};
      const keyValue = exception.keyValue || {};
      const field =
        Object.keys(keyPattern)[0] || Object.keys(keyValue)[0] || 'field';
      const duplicateValue = keyValue[field] !== undefined ? keyValue[field] : '';

      const message = `Duplicate value '${duplicateValue}' for unique field '${field}'. An entity with this ${field} already exists.`;

      this.logger.warn(
        `[Duplicate Key Conflict] Route: ${request.method} ${request.url} | Field: ${field} | Value: ${duplicateValue}`,
      );

      return response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        error: 'Conflict',
        message,
        conflictingField: field,
        conflictingValue: duplicateValue,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }

    // 2. Handle Mongoose Schema Validation Error
    if (exception instanceof MongooseError.ValidationError) {
      const errorMessages = Object.values(exception.errors).map(
        (err: any) => err.message,
      );

      this.logger.warn(
        `[Schema Validation Error] Route: ${request.method} ${request.url} | Errors: ${JSON.stringify(errorMessages)}`,
      );

      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message: errorMessages,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }

    // 3. Handle Mongoose Cast Error (Invalid ObjectId, invalid date, etc.)
    if (exception instanceof MongooseError.CastError) {
      const message = `Invalid ${exception.path}: '${exception.value}'`;

      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }

    // 4. Pass standard NestJS HttpExceptions through
    if (typeof exception?.getStatus === 'function') {
      const status = exception.getStatus();
      const res = exception.getResponse();

      return response.status(status).json(
        typeof res === 'object'
          ? {
              ...res,
              timestamp: new Date().toISOString(),
              path: request.url,
            }
          : {
              statusCode: status,
              message: res,
              timestamp: new Date().toISOString(),
              path: request.url,
            },
      );
    }

    // 5. Unhandled Internal Server Errors
    this.logger.error(
      `Unhandled Server Exception: ${exception?.message || exception}`,
      exception?.stack,
    );

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'An unexpected internal database error occurred',
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}

