import winston, { Logger as WinstonLogger } from 'winston';
import { config } from '../config/environment';
import { join } from 'path';

/**
 * Custom logger implementation using Winston
 * Provides structured logging for the Love OKLCH backend
 */
export class Logger {
  private readonly logger: WinstonLogger;
  private readonly context: string;

  constructor(context = 'Application') {
    this.context = context;
    this.logger = this.createLogger();
  }

  /**
   * Create Winston logger instance with proper configuration
   */
  private createLogger(): WinstonLogger {
    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      winston.format.errors({ stack: true }),
      winston.format.metadata({
        fillExcept: ['timestamp', 'level', 'message'],
      }),
      this.getLogFormat(),
    );

    const transports = this.createTransports();

    return winston.createLogger({
      level: config.logging.level,
      format: logFormat,
      transports,
      exitOnError: false,
      silent:
        config.app.environment === 'test' &&
        process.env.SUPPRESS_CONSOLE === 'true',
    });
  }

  /**
   * Get appropriate log format based on environment
   */
  private getLogFormat() {
    if (config.app.environment === 'production') {
      return winston.format.json();
    }

    return winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.printf(
        ({ timestamp, level, message, context, metadata }) => {
          const contextStr = context || this.context;
          const metaStr =
            metadata && Object.keys(metadata).length > 0
              ? `\n${JSON.stringify(metadata, null, 2)}`
              : '';

          return `${timestamp} [${level}] [${contextStr}] ${message}${metaStr}`;
        },
      ),
    );
  }

  /**
   * Create transport configurations
   */
  private createTransports(): winston.transport[] {
    const transports: winston.transport[] = [];

    // Console transport (always enabled except in test with suppress)
    transports.push(
      new winston.transports.Console({
        handleExceptions: true,
        handleRejections: true,
      }),
    );

    // File transports for non-test environments
    if (config.app.environment !== 'test') {
      const logDir = join(process.cwd(), 'logs');

      // Combined logs
      transports.push(
        new winston.transports.File({
          filename: join(logDir, 'combined.log'),
          handleExceptions: true,
          handleRejections: true,
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
      );

      // Error logs
      transports.push(
        new winston.transports.File({
          filename: join(logDir, 'error.log'),
          level: 'error',
          handleExceptions: true,
          handleRejections: true,
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
      );

      // Performance logs for slow operations
      transports.push(
        new winston.transports.File({
          filename: join(logDir, 'performance.log'),
          level: 'warn',
          maxsize: 5242880, // 5MB
          maxFiles: 3,
        }),
      );
    }

    return transports;
  }

  /**
   * Log error message
   */
  public error(message: string, error?: any, metadata?: any): void {
    const logData = this.formatLogData(message, { error, ...metadata });
    this.logger.error(logData.message, logData.metadata);
  }

  /**
   * Log warning message
   */
  public warn(message: string, metadata?: any): void {
    const logData = this.formatLogData(message, metadata);
    this.logger.warn(logData.message, logData.metadata);
  }

  /**
   * Log info message
   */
  public info(message: string, metadata?: any): void {
    const logData = this.formatLogData(message, metadata);
    this.logger.info(logData.message, logData.metadata);
  }

  /**
   * Log debug message
   */
  public debug(message: string, metadata?: any): void {
    const logData = this.formatLogData(message, metadata);
    this.logger.debug(logData.message, logData.metadata);
  }

  /**
   * Log HTTP request
   */
  public http(message: string, metadata?: any): void {
    const logData = this.formatLogData(message, metadata);
    this.logger.http(logData.message, logData.metadata);
  }

  /**
   * Log performance metrics
   */
  public performance(
    operation: string,
    duration: number,
    metadata?: any,
  ): void {
    const message = `Performance: ${operation} completed in ${duration}ms`;
    const perfMetadata = {
      operation,
      duration,
      category: 'performance',
      ...metadata,
    };

    if (duration > 1000) {
      this.warn(message, perfMetadata);
    } else {
      this.debug(message, perfMetadata);
    }
  }

  /**
   * Log database operation
   */
  public database(operation: string, duration: number, metadata?: any): void {
    const message = `Database: ${operation} (${duration}ms)`;
    const dbMetadata = {
      operation,
      duration,
      category: 'database',
      ...metadata,
    };

    if (duration > 100) {
      this.warn(`Slow query: ${message}`, dbMetadata);
    } else {
      this.debug(message, dbMetadata);
    }
  }

  /**
   * Log authentication events
   */
  public auth(event: string, userId?: string, metadata?: any): void {
    const message = `Auth: ${event}`;
    const authMetadata = {
      event,
      userId,
      category: 'authentication',
      ...metadata,
    };

    this.info(message, authMetadata);
  }

  /**
   * Log entitlement checks
   */
  public entitlement(
    userId: string,
    featureKey: string,
    allowed: boolean,
    metadata?: any,
  ): void {
    const message = `Entitlement: ${featureKey} for user ${userId} - ${allowed ? 'ALLOWED' : 'DENIED'}`;
    const entitlementMetadata = {
      userId,
      featureKey,
      allowed,
      category: 'entitlement',
      ...metadata,
    };

    this.info(message, entitlementMetadata);
  }

  /**
   * Log admin actions
   */
  public admin(action: string, adminId: string, metadata?: any): void {
    const message = `Admin: ${action} by ${adminId}`;
    const adminMetadata = {
      action,
      adminId,
      category: 'admin',
      ...metadata,
    };

    this.info(message, adminMetadata);
  }

  /**
   * Format log data consistently
   */
  private formatLogData(
    message: string,
    metadata?: any,
  ): { message: string; metadata: any } {
    const formattedMetadata = {
      context: this.context,
      timestamp: new Date().toISOString(),
      ...metadata,
    };

    // Clean up error objects for better serialization
    if (formattedMetadata.error && formattedMetadata.error instanceof Error) {
      formattedMetadata.error = {
        name: formattedMetadata.error.name,
        message: formattedMetadata.error.message,
        stack: formattedMetadata.error.stack,
      };
    }

    return {
      message,
      metadata: formattedMetadata,
    };
  }

  /**
   * Create child logger with additional context
   */
  public child(childContext: string): Logger {
    const fullContext = `${this.context}:${childContext}`;
    return new Logger(fullContext);
  }

  /**
   * Get current log level
   */
  public getLevel(): string {
    return this.logger.level;
  }

  /**
   * Set log level dynamically
   */
  public setLevel(level: string): void {
    this.logger.level = level;
  }
}

/**
 * Performance timing utility
 */
export class PerformanceTimer {
  private readonly startTime: number;
  private readonly operation: string;
  private readonly logger: Logger;

  constructor(operation: string, logger: Logger) {
    this.operation = operation;
    this.logger = logger;
    this.startTime = Date.now();
  }

  /**
   * End timing and log performance
   */
  public end(metadata?: any): number {
    const duration = Date.now() - this.startTime;
    this.logger.performance(this.operation, duration, metadata);
    return duration;
  }
}

/**
 * Request logging middleware helper
 */
export interface RequestLogData {
  method: string;
  url: string;
  statusCode: number;
  duration: number;
  userAgent?: string;
  ip?: string;
  userId?: string;
}

/**
 * Log request details
 */
export function logRequest(data: RequestLogData, logger: Logger): void {
  const { method, url, statusCode, duration } = data;
  const message = `${method} ${url} - ${statusCode} (${duration}ms)`;

  const metadata = {
    method,
    url,
    statusCode,
    duration,
    userAgent: data.userAgent,
    ip: data.ip,
    userId: data.userId,
    category: 'request',
  };

  if (statusCode >= 400) {
    logger.warn(message, metadata);
  } else if (duration > 1000) {
    logger.warn(`Slow request: ${message}`, metadata);
  } else {
    logger.http(message, metadata);
  }
}

/**
 * Global logger instance
 */
export const globalLogger = new Logger('Global');

/**
 * Logger factory for creating context-specific loggers
 */
export class LoggerFactory {
  private static readonly loggers = new Map<string, Logger>();

  public static getLogger(context: string): Logger {
    if (!this.loggers.has(context)) {
      this.loggers.set(context, new Logger(context));
    }
    return this.loggers.get(context)!;
  }

  public static createPerformanceTimer(
    operation: string,
    context = 'Performance',
  ): PerformanceTimer {
    const logger = this.getLogger(context);
    return new PerformanceTimer(operation, logger);
  }
}

export default Logger;
