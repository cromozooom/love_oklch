import { config as dotenvConfig } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env files
dotenvConfig({ path: join(__dirname, '../../.env') });

/**
 * Environment configuration for Love OKLCH Backend
 * Centralizes all environment variables with validation and defaults
 */
export interface AppConfig {
  app: {
    environment: string;
    port: number;
    apiPrefix: string;
  };
  database: {
    url: string;
    user: string;
    password: string;
    name: string;
  };
  security: {
    jwtSecret: string;
    jwtExpiresIn: string;
    bcryptRounds: number;
  };
  features: {
    gracePeriodDays: number;
    cacheTtlSeconds: number;
    maxFeatureUsageTrackingDays: number;
  };
  logging: {
    level: string;
    format: string;
  };
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  development: {
    enableSwagger: boolean;
    enableAdminRoutes: boolean;
  };
}

/**
 * Validate and parse environment variables
 */
function validateEnvironment(): AppConfig {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    app: {
      environment: process.env.NODE_ENV || 'development',
      port: parseInt(process.env.PORT || '3001', 10),
      apiPrefix: process.env.API_PREFIX || '/api/v1',
    },
    database: {
      url: process.env.DATABASE_URL!,
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'dev_password_123',
      name: process.env.POSTGRES_DB || 'love_oklch_dev',
    },
    security: {
      jwtSecret: process.env.JWT_SECRET!,
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    },
    features: {
      gracePeriodDays: parseInt(process.env.GRACE_PERIOD_DAYS || '7', 10),
      cacheTtlSeconds: parseInt(process.env.CACHE_TTL_SECONDS || '300', 10),
      maxFeatureUsageTrackingDays: parseInt(process.env.MAX_FEATURE_USAGE_TRACKING_DAYS || '30', 10),
    },
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      format: process.env.LOG_FORMAT || 'combined',
    },
    cors: {
      origin: process.env.CORS_ORIGIN ? 
        process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()) :
        ['http://localhost:4200'],
      credentials: process.env.CORS_CREDENTIALS === 'true',
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },
    development: {
      enableSwagger: process.env.ENABLE_SWAGGER === 'true',
      enableAdminRoutes: process.env.ENABLE_ADMIN_ROUTES === 'true',
    },
  };
}

/**
 * Validate configuration values
 */
function validateConfig(config: AppConfig): void {
  // Validate port range
  if (config.app.port < 1 || config.app.port > 65535) {
    throw new Error(`Invalid port number: ${config.app.port}`);
  }

  // Validate JWT secret length
  if (config.security.jwtSecret.length < 32) {
    throw new Error('JWT secret must be at least 32 characters long');
  }

  // Validate bcrypt rounds
  if (config.security.bcryptRounds < 4 || config.security.bcryptRounds > 15) {
    throw new Error('Bcrypt rounds must be between 4 and 15');
  }

  // Validate grace period
  if (config.features.gracePeriodDays < 1 || config.features.gracePeriodDays > 365) {
    throw new Error('Grace period must be between 1 and 365 days');
  }

  // Validate cache TTL
  if (config.features.cacheTtlSeconds < 1 || config.features.cacheTtlSeconds > 86400) {
    throw new Error('Cache TTL must be between 1 second and 24 hours');
  }

  // Validate log level
  const validLogLevels = ['error', 'warn', 'info', 'debug'];
  if (!validLogLevels.includes(config.logging.level)) {
    throw new Error(`Invalid log level: ${config.logging.level}. Must be one of: ${validLogLevels.join(', ')}`);
  }
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return config.app.environment === 'development';
}

/**
 * Check if running in test mode
 */
export function isTest(): boolean {
  return config.app.environment === 'test';
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return config.app.environment === 'production';
}

/**
 * Get database configuration for Prisma
 */
export function getDatabaseConfig() {
  return {
    url: config.database.url,
    options: {
      connectionLimit: isProduction() ? 20 : 5,
      acquireTimeoutMillis: 60000,
      timeout: 60000,
      pool: {
        min: 2,
        max: isProduction() ? 20 : 5,
        acquireTimeoutMillis: 60000,
        createTimeoutMillis: 30000,
        destroyTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 100,
      },
    },
  };
}

/**
 * Get feature configuration
 */
export function getFeatureConfig() {
  return {
    gracePeriodMs: config.features.gracePeriodDays * 24 * 60 * 60 * 1000,
    cacheTtlMs: config.features.cacheTtlSeconds * 1000,
    maxFeatureUsageTrackingMs: config.features.maxFeatureUsageTrackingDays * 24 * 60 * 60 * 1000,
  };
}

/**
 * Export validated configuration
 */
let config: AppConfig;

try {
  config = validateEnvironment();
  validateConfig(config);
} catch (error) {
  console.error('Configuration validation failed:', error);
  process.exit(1);
}

export { config };
export default config;