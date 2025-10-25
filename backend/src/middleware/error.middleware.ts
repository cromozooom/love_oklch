import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';
import { config } from '../config/environment';

/**
 * Custom error classes for the application
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: string | undefined;

  constructor(
    message: string,
    statusCode: number,
    code?: string,
    isOperational = true,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, code = 'VALIDATION_ERROR') {
    super(message, 400, code);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required', code = 'AUTH_REQUIRED') {
    super(message, 401, code);
  }
}

export class AuthorizationError extends AppError {
  constructor(
    message = 'Insufficient permissions',
    code = 'INSUFFICIENT_PERMISSIONS',
  ) {
    super(message, 403, code);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code = 'NOT_FOUND') {
    super(message, 404, code);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', code = 'CONFLICT') {
    super(message, 409, code);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded', code = 'RATE_LIMIT_EXCEEDED') {
    super(message, 429, code);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal server error', code = 'INTERNAL_ERROR') {
    super(message, 500, code, false);
  }
}

/**
 * Error response interface
 */
interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    statusCode: number;
    timestamp: string;
    path: string;
    details?: any;
    stack?: string;
  };
}

/**
 * Global error handling middleware
 */
export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const logger = new Logger('ErrorHandler');

  // Default error properties
  let statusCode = 500;
  let message = 'Internal Server Error';
  let code = 'INTERNAL_ERROR';
  let isOperational = false;

  // Handle known application errors
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code || 'APP_ERROR';
    isOperational = error.isOperational;
  }
  // Handle Prisma errors
  else if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = handlePrismaError(error as any);
    statusCode = prismaError.statusCode;
    message = prismaError.message;
    code = prismaError.code;
    isOperational = true;
  }
  // Handle validation errors
  else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = error.message;
    code = 'VALIDATION_ERROR';
    isOperational = true;
  }
  // Handle JWT errors
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
    isOperational = true;
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
    isOperational = true;
  }

  // Log the error
  const logLevel = isOperational ? 'warn' : 'error';
  logger[logLevel](`${req.method} ${req.path} - ${statusCode} - ${message}`, {
    error: error.message,
    stack: error.stack,
    code,
    statusCode,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Build error response
  const errorResponse: ErrorResponse = {
    error: {
      message,
      code,
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.path,
    },
  };

  // Add stack trace in development
  if (config.app.environment === 'development' && error.stack) {
    errorResponse.error.stack = error.stack;
  }

  // Add detailed error information for validation errors
  if (error.name === 'ValidationError' && (error as any).details) {
    errorResponse.error.details = (error as any).details;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
}

/**
 * Handle Prisma-specific errors
 */
function handlePrismaError(error: any): {
  statusCode: number;
  message: string;
  code: string;
} {
  switch (error.code) {
    case 'P2002':
      return {
        statusCode: 409,
        message: 'Unique constraint violation',
        code: 'DUPLICATE_KEY',
      };
    case 'P2014':
      return {
        statusCode: 400,
        message: 'Invalid data provided',
        code: 'INVALID_DATA',
      };
    case 'P2003':
      return {
        statusCode: 400,
        message: 'Foreign key constraint violation',
        code: 'FOREIGN_KEY_ERROR',
      };
    case 'P2025':
      return {
        statusCode: 404,
        message: 'Record not found',
        code: 'NOT_FOUND',
      };
    case 'P1001':
      return {
        statusCode: 503,
        message: 'Database connection failed',
        code: 'DB_CONNECTION_ERROR',
      };
    default:
      return {
        statusCode: 500,
        message: 'Database error',
        code: 'DATABASE_ERROR',
      };
  }
}

/**
 * Async error handler wrapper for async route handlers
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 Not Found handler for undefined routes
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
}

/**
 * Request timeout middleware
 */
export function timeoutHandler(timeoutMs: number = 30000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        const error = new AppError('Request timeout', 408, 'REQUEST_TIMEOUT');
        next(error);
      }
    }, timeoutMs);

    res.on('finish', () => {
      clearTimeout(timeout);
    });

    res.on('close', () => {
      clearTimeout(timeout);
    });

    next();
  };
}

/**
 * Request validation middleware
 */
export function validateRequest(schema: any) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const details = error.details.map((detail: any) => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value,
        }));

        const validationError = new ValidationError(
          'Request validation failed',
        );
        (validationError as any).details = details;

        return next(validationError);
      }

      req.body = value;
      next();
    } catch (error) {
      next(new ValidationError('Invalid request format'));
    }
  };
}

/**
 * CORS error handler
 */
export function corsErrorHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.method === 'OPTIONS') {
    // Handle preflight requests
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    );
    res.header(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With',
    );
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(200).end();
    return;
  }

  next();
}

export default errorHandler;
