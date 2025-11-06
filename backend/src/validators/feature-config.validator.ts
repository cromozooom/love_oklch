import Ajv, { ValidateFunction, ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import { ValidationError } from '../middleware/error.middleware';

/**
 * Feature Configuration Validator
 * Provides JSON schema validation for feature configurations and policies
 * Ensures data integrity and type safety for feature definitions
 */

// Initialize AJV with format support
const ajv = new Ajv({ allErrors: true, verbose: true });
addFormats(ajv);

// Standard feature categories
export const FEATURE_CATEGORIES = [
  'core',
  'storage',
  'api',
  'analytics',
  'collaboration',
  'security',
  'integration',
  'customization',
  'billing',
  'support',
] as const;

export type FeatureCategory = (typeof FEATURE_CATEGORIES)[number];

// Feature value types
export interface BooleanFeatureValue {
  type: 'boolean';
  value: boolean;
}

export interface NumericFeatureValue {
  type: 'numeric';
  value: number;
  min?: number;
  max?: number;
  unit?: string;
}

export interface TextFeatureValue {
  type: 'text';
  value: string;
  maxLength?: number;
  pattern?: string;
}

export interface JsonFeatureValue {
  type: 'json';
  value: Record<string, any>;
  schema?: Record<string, any>;
}

export type FeatureValue =
  | BooleanFeatureValue
  | NumericFeatureValue
  | TextFeatureValue
  | JsonFeatureValue;

// Base feature configuration
export interface FeatureConfiguration {
  keyName: string;
  displayName: string;
  description?: string;
  category?: FeatureCategory;
  isBoolean: boolean;
  defaultValue: FeatureValue;
  validationSchema?: Record<string, any>;
  isActive: boolean;
}

// Plan feature configuration
export interface PlanFeatureConfiguration {
  planId: string;
  featureId: string;
  isEnabled: boolean;
  configurationValue?: FeatureValue;
  limits?: FeatureLimits;
  metadata?: Record<string, any>;
}

export interface FeatureLimits {
  usage?: {
    max?: number;
    period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    reset?: boolean;
  };
  quota?: {
    storage?: number;
    requests?: number;
    users?: number;
  };
  restrictions?: {
    allowedValues?: any[];
    blockedValues?: any[];
    customRules?: Record<string, any>;
  };
}

// JSON Schema definitions
const featureValueSchema = {
  oneOf: [
    {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'boolean' },
        value: { type: 'boolean' },
      },
      required: ['type', 'value'],
      additionalProperties: false,
    },
    {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'numeric' },
        value: { type: 'number' },
        min: { type: 'number' },
        max: { type: 'number' },
        unit: { type: 'string' },
      },
      required: ['type', 'value'],
      additionalProperties: false,
    },
    {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'text' },
        value: { type: 'string' },
        maxLength: { type: 'number' },
        pattern: { type: 'string' },
      },
      required: ['type', 'value'],
      additionalProperties: false,
    },
    {
      type: 'object',
      properties: {
        type: { type: 'string', const: 'json' },
        value: { type: 'object' },
        schema: { type: 'object' },
      },
      required: ['type', 'value'],
      additionalProperties: false,
    },
  ],
};

const featureConfigurationSchema = {
  type: 'object',
  properties: {
    keyName: {
      type: 'string',
      pattern: '^[a-z][a-z0-9_]*[a-z0-9]$',
      minLength: 2,
      maxLength: 100,
    },
    displayName: {
      type: 'string',
      minLength: 1,
      maxLength: 200,
    },
    description: {
      type: 'string',
      maxLength: 1000,
    },
    category: {
      type: 'string',
      enum: [...FEATURE_CATEGORIES],
    },
    isBoolean: {
      type: 'boolean',
    },
    defaultValue: featureValueSchema,
    validationSchema: {
      type: 'object',
    },
    isActive: {
      type: 'boolean',
    },
  },
  required: ['keyName', 'displayName', 'isBoolean', 'defaultValue', 'isActive'],
  additionalProperties: false,
};

const featureLimitsSchema = {
  type: 'object',
  properties: {
    usage: {
      type: 'object',
      properties: {
        max: { type: 'number' },
        period: {
          type: 'string',
          enum: ['daily', 'weekly', 'monthly', 'yearly'],
        },
        reset: { type: 'boolean' },
      },
      additionalProperties: false,
    },
    quota: {
      type: 'object',
      properties: {
        storage: { type: 'number', minimum: 0 },
        requests: { type: 'number', minimum: 0 },
        users: { type: 'number', minimum: 0 },
      },
      additionalProperties: false,
    },
    restrictions: {
      type: 'object',
      properties: {
        allowedValues: {
          type: 'array',
          items: {},
        },
        blockedValues: {
          type: 'array',
          items: {},
        },
        customRules: { type: 'object' },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
};

const planFeatureConfigurationSchema = {
  type: 'object',
  properties: {
    planId: { type: 'string', minLength: 1 },
    featureId: { type: 'string', minLength: 1 },
    isEnabled: { type: 'boolean' },
    configurationValue: featureValueSchema,
    limits: featureLimitsSchema,
    metadata: { type: 'object' },
  },
  required: ['planId', 'featureId', 'isEnabled'],
  additionalProperties: false,
};

// Compiled validators
const validateFeatureConfiguration = ajv.compile(featureConfigurationSchema);
const validatePlanFeatureConfiguration = ajv.compile(
  planFeatureConfigurationSchema,
);
const validateFeatureLimits = ajv.compile(featureLimitsSchema);
const validateFeatureValue = ajv.compile(featureValueSchema);

/**
 * Feature Configuration Validator Class
 */
export class FeatureConfigValidator {
  /**
   * Validate feature configuration
   */
  static validateFeatureConfig(data: any): FeatureConfiguration {
    if (!validateFeatureConfiguration(data)) {
      const errors = validateFeatureConfiguration.errors || [];
      const errorMessages = errors.map(
        (err: ErrorObject) =>
          `${err.instancePath || err.schemaPath}: ${err.message}`,
      );
      throw new ValidationError(
        `Invalid feature configuration: ${errorMessages.join(', ')}`,
        'INVALID_FEATURE_CONFIG',
      );
    }

    // Additional business logic validation
    this.validateFeatureBusinessRules(data as unknown as FeatureConfiguration);

    return data as unknown as FeatureConfiguration;
  }

  /**
   * Validate plan feature configuration
   */
  static validatePlanFeatureConfig(data: any): PlanFeatureConfiguration {
    if (!validatePlanFeatureConfiguration(data)) {
      const errors = validatePlanFeatureConfiguration.errors || [];
      const errorMessages = errors.map(
        (err: ErrorObject) =>
          `${err.instancePath || err.schemaPath}: ${err.message}`,
      );
      throw new ValidationError(
        `Invalid plan feature configuration: ${errorMessages.join(', ')}`,
        'INVALID_PLAN_FEATURE_CONFIG',
      );
    }

    // Additional business logic validation
    this.validatePlanFeatureBusinessRules(
      data as unknown as PlanFeatureConfiguration,
    );

    return data as unknown as PlanFeatureConfiguration;
  }

  /**
   * Validate feature limits
   */
  static validateFeatureLimits(data: any): FeatureLimits {
    if (!validateFeatureLimits(data)) {
      const errors = validateFeatureLimits.errors || [];
      const errorMessages = errors.map(
        (err: ErrorObject) =>
          `${err.instancePath || err.schemaPath}: ${err.message}`,
      );
      throw new ValidationError(
        `Invalid feature limits: ${errorMessages.join(', ')}`,
        'INVALID_FEATURE_LIMITS',
      );
    }

    return data as FeatureLimits;
  }

  /**
   * Validate a feature value
   */
  static validateFeatureValueData(data: any): FeatureValue {
    if (!validateFeatureValue(data)) {
      const errors = validateFeatureValue.errors || [];
      const errorMessages = errors.map(
        (err: ErrorObject) =>
          `${err.instancePath || err.schemaPath}: ${err.message}`,
      );
      throw new ValidationError(
        `Invalid feature value: ${errorMessages.join(', ')}`,
        'INVALID_FEATURE_VALUE',
      );
    }

    return data as unknown as FeatureValue;
  }

  /**
   * Validate feature value against its type constraints
   */
  static validateFeatureValueConstraints(
    value: any,
    featureType: 'boolean' | 'numeric' | 'text' | 'json',
    constraints?: Record<string, any>,
  ): boolean {
    try {
      switch (featureType) {
        case 'boolean':
          return this.validateBooleanValue(value, constraints);
        case 'numeric':
          return this.validateNumericValue(value, constraints);
        case 'text':
          return this.validateTextValue(value, constraints);
        case 'json':
          return this.validateJsonValue(value, constraints);
        default:
          throw new ValidationError(
            `Unknown feature type: ${featureType}`,
            'UNKNOWN_FEATURE_TYPE',
          );
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new ValidationError(
        `Feature value validation failed: ${errorMessage}`,
        'FEATURE_VALUE_VALIDATION_ERROR',
      );
    }
  }

  /**
   * Create a validator for custom feature schemas
   */
  static createCustomValidator(schema: Record<string, any>): ValidateFunction {
    try {
      return ajv.compile(schema);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new ValidationError(
        `Failed to compile custom validation schema: ${errorMessage}`,
        'INVALID_VALIDATION_SCHEMA',
      );
    }
  }

  /**
   * Validate data against a custom schema
   */
  static validateWithCustomSchema(
    data: any,
    schema: Record<string, any>,
  ): boolean {
    const validator = this.createCustomValidator(schema);

    if (!validator(data)) {
      const errors = validator.errors || [];
      const errorMessages = errors.map(
        (err: ErrorObject) =>
          `${err.instancePath || err.schemaPath}: ${err.message}`,
      );
      throw new ValidationError(
        `Custom schema validation failed: ${errorMessages.join(', ')}`,
        'CUSTOM_SCHEMA_VALIDATION_FAILED',
      );
    }

    return true;
  }

  /**
   * Business rules validation for features
   */
  private static validateFeatureBusinessRules(
    config: FeatureConfiguration,
  ): void {
    // Validate default value matches feature type
    if (config.isBoolean && config.defaultValue.type !== 'boolean') {
      throw new ValidationError(
        'Boolean features must have boolean default values',
        'FEATURE_TYPE_MISMATCH',
      );
    }

    // Validate category is known
    if (
      config.category &&
      !FEATURE_CATEGORIES.includes(config.category as FeatureCategory)
    ) {
      throw new ValidationError(
        `Invalid feature category: ${config.category}`,
        'INVALID_FEATURE_CATEGORY',
      );
    }

    // Validate display name is not just whitespace
    if (config.displayName.trim().length === 0) {
      throw new ValidationError(
        'Display name cannot be empty or just whitespace',
        'INVALID_DISPLAY_NAME',
      );
    }

    // Validate key name pattern
    const keyNamePattern = /^[a-z][a-z0-9_]*[a-z0-9]$/;
    if (!keyNamePattern.test(config.keyName)) {
      throw new ValidationError(
        'Key name must start and end with lowercase letters and contain only lowercase letters, numbers, and underscores',
        'INVALID_KEY_NAME_PATTERN',
      );
    }
  }

  /**
   * Business rules validation for plan features
   */
  private static validatePlanFeatureBusinessRules(
    config: PlanFeatureConfiguration,
  ): void {
    // Validate that limits make sense
    if (
      config.limits?.usage?.max !== undefined &&
      config.limits.usage.max < 0
    ) {
      throw new ValidationError(
        'Usage limits cannot be negative',
        'INVALID_USAGE_LIMITS',
      );
    }

    // Validate quota values
    if (config.limits?.quota) {
      Object.entries(config.limits.quota).forEach(([key, value]) => {
        if (value !== undefined && value < 0) {
          throw new ValidationError(
            `Quota ${key} cannot be negative`,
            'INVALID_QUOTA_VALUE',
          );
        }
      });
    }

    // Ensure configuration value matches enabled state logic
    if (!config.isEnabled && config.configurationValue) {
      // Allow configuration values for disabled features (for future enablement)
      // This is just a warning case that could be logged
    }
  }

  /**
   * Validate boolean values
   */
  private static validateBooleanValue(
    value: any,
    constraints?: Record<string, any>,
  ): boolean {
    if (typeof value !== 'boolean') {
      throw new ValidationError(
        'Boolean feature value must be a boolean',
        'INVALID_BOOLEAN_VALUE',
      );
    }
    return true;
  }

  /**
   * Validate numeric values
   */
  private static validateNumericValue(
    value: any,
    constraints?: Record<string, any>,
  ): boolean {
    if (typeof value !== 'number' || !isFinite(value)) {
      throw new ValidationError(
        'Numeric feature value must be a finite number',
        'INVALID_NUMERIC_VALUE',
      );
    }

    if (constraints?.min !== undefined && value < constraints.min) {
      throw new ValidationError(
        `Numeric value ${value} is below minimum ${constraints.min}`,
        'NUMERIC_VALUE_TOO_LOW',
      );
    }

    if (constraints?.max !== undefined && value > constraints.max) {
      throw new ValidationError(
        `Numeric value ${value} is above maximum ${constraints.max}`,
        'NUMERIC_VALUE_TOO_HIGH',
      );
    }

    return true;
  }

  /**
   * Validate text values
   */
  private static validateTextValue(
    value: any,
    constraints?: Record<string, any>,
  ): boolean {
    if (typeof value !== 'string') {
      throw new ValidationError(
        'Text feature value must be a string',
        'INVALID_TEXT_VALUE',
      );
    }

    if (
      constraints?.maxLength !== undefined &&
      value.length > constraints.maxLength
    ) {
      throw new ValidationError(
        `Text value exceeds maximum length ${constraints.maxLength}`,
        'TEXT_VALUE_TOO_LONG',
      );
    }

    if (constraints?.pattern) {
      const regex = new RegExp(constraints.pattern);
      if (!regex.test(value)) {
        throw new ValidationError(
          `Text value does not match required pattern`,
          'TEXT_VALUE_PATTERN_MISMATCH',
        );
      }
    }

    return true;
  }

  /**
   * Validate JSON values
   */
  private static validateJsonValue(
    value: any,
    constraints?: Record<string, any>,
  ): boolean {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new ValidationError(
        'JSON feature value must be an object',
        'INVALID_JSON_VALUE',
      );
    }

    // If a schema is provided, validate against it
    if (constraints?.schema) {
      return this.validateWithCustomSchema(value, constraints.schema);
    }

    return true;
  }
}

export default FeatureConfigValidator;
