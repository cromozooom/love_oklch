import { ValidationError } from '../middleware/error.middleware';

// Type definition that matches the Prisma Plan model
interface PrismaPlan {
  planId: string;
  name: string;
  slug: string;
  description: string | null;
  price: any; // Decimal type from Prisma
  currency: string;
  billingInterval: string | null;
  isActive: boolean;
  sortOrder: number;
  metadata: any; // Json type from Prisma
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Plan model for subscription plan management
 * Handles validation and business logic for subscription plans
 */
export interface PlanData {
  planId?: string;
  name: string;
  slug: string;
  description?: string | undefined;
  price: number;
  currency: string;
  billingInterval?: string | null | undefined;
  isActive: boolean;
  sortOrder: number;
  metadata: Record<string, any>;
}

export interface PlanCreateData extends Omit<PlanData, 'planId'> {}

export interface PlanUpdateData extends Partial<Omit<PlanData, 'planId'>> {}

export class Plan {
  public readonly planId: string;
  public readonly name: string;
  public readonly slug: string;
  public readonly description?: string | undefined;
  public readonly price: number;
  public readonly currency: string;
  public readonly billingInterval?: string | null | undefined;
  public readonly isActive: boolean;
  public readonly sortOrder: number;
  public readonly metadata: Record<string, any>;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(data: PrismaPlan) {
    this.planId = data.planId;
    this.name = data.name;
    this.slug = data.slug;
    this.description = data.description || undefined;
    this.price = Number(data.price);
    this.currency = data.currency;
    this.billingInterval = data.billingInterval || undefined;
    this.isActive = data.isActive;
    this.sortOrder = data.sortOrder;
    this.metadata = data.metadata as Record<string, any>;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  /**
   * Validate plan data before creation/update
   */
  public static validate(data: PlanCreateData | PlanUpdateData): void {
    const errors: string[] = [];

    // Validate name
    if ('name' in data && data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        errors.push('Plan name is required');
      } else if (data.name.length > 100) {
        errors.push('Plan name must be 100 characters or less');
      }
    }

    // Validate slug
    if ('slug' in data && data.slug !== undefined) {
      if (!data.slug || data.slug.trim().length === 0) {
        errors.push('Plan slug is required');
      } else if (data.slug.length > 100) {
        errors.push('Plan slug must be 100 characters or less');
      } else if (!/^[a-z0-9-]+$/.test(data.slug)) {
        errors.push(
          'Plan slug must contain only lowercase letters, numbers, and hyphens',
        );
      }
    }

    // Validate price
    if ('price' in data && data.price !== undefined) {
      if (data.price < 0) {
        errors.push('Plan price cannot be negative');
      } else if (data.price > 999999.99) {
        errors.push('Plan price cannot exceed 999,999.99');
      }
    }

    // Validate currency
    if ('currency' in data && data.currency !== undefined) {
      if (!data.currency || data.currency.length !== 3) {
        errors.push(
          'Currency must be a valid 3-letter ISO code (e.g., USD, EUR)',
        );
      } else if (!/^[A-Z]{3}$/.test(data.currency)) {
        errors.push('Currency must be uppercase letters only');
      }
    }

    // Validate billing interval
    if (
      'billingInterval' in data &&
      data.billingInterval !== undefined &&
      data.billingInterval !== null
    ) {
      const validIntervals = ['monthly', 'yearly', 'one_time'];
      if (!validIntervals.includes(data.billingInterval)) {
        errors.push(
          `Billing interval must be one of: ${validIntervals.join(', ')}`,
        );
      }
    }

    // Validate sort order
    if ('sortOrder' in data && data.sortOrder !== undefined) {
      if (data.sortOrder < 0 || data.sortOrder > 999) {
        errors.push('Sort order must be between 0 and 999');
      }
    }

    // Validate metadata
    if ('metadata' in data && data.metadata !== undefined) {
      try {
        JSON.stringify(data.metadata);
      } catch {
        errors.push('Metadata must be a valid JSON object');
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(
        `Plan validation failed: ${errors.join(', ')}`,
        'VALIDATION_ERROR',
      );
    }
  }

  /**
   * Check if plan is free
   */
  public get isFree(): boolean {
    return this.price === 0;
  }

  /**
   * Check if plan is recurring
   */
  public get isRecurring(): boolean {
    return this.billingInterval !== null && this.billingInterval !== 'one_time';
  }

  /**
   * Get formatted price with currency
   */
  public get formattedPrice(): string {
    if (this.isFree) {
      return 'Free';
    }

    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency,
    });

    return formatter.format(this.price);
  }

  /**
   * Get display name with price
   */
  public get displayName(): string {
    return `${this.name} (${this.formattedPrice})`;
  }

  /**
   * Convert to plain object for API responses
   */
  public toJSON(): PlanData & {
    planId: string;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      planId: this.planId,
      name: this.name,
      slug: this.slug,
      description: this.description,
      price: this.price,
      currency: this.currency,
      billingInterval: this.billingInterval,
      isActive: this.isActive,
      sortOrder: this.sortOrder,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Create Plan instance from database data
   */
  public static fromDatabase(data: PrismaPlan): Plan {
    return new Plan(data);
  }

  /**
   * Prepare data for database creation
   */
  public static prepareForCreation(data: PlanCreateData): any {
    Plan.validate(data);

    return {
      name: data.name.trim(),
      slug: data.slug.trim().toLowerCase(),
      description: data.description?.trim() || null,
      price: data.price,
      currency: data.currency.toUpperCase(),
      billingInterval: data.billingInterval || null,
      isActive: data.isActive,
      sortOrder: data.sortOrder,
      metadata: data.metadata || {},
    };
  }

  /**
   * Prepare data for database update
   */
  public static prepareForUpdate(data: PlanUpdateData): any {
    Plan.validate(data);

    const updateData: any = {};

    if (data.name !== undefined) {
      updateData.name = data.name.trim();
    }

    if (data.slug !== undefined) {
      updateData.slug = data.slug.trim().toLowerCase();
    }

    if (data.description !== undefined) {
      updateData.description = data.description?.trim() || null;
    }

    if (data.price !== undefined) {
      updateData.price = data.price;
    }

    if (data.currency !== undefined) {
      updateData.currency = data.currency.toUpperCase();
    }

    if (data.billingInterval !== undefined) {
      updateData.billingInterval = data.billingInterval;
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    if (data.sortOrder !== undefined) {
      updateData.sortOrder = data.sortOrder;
    }

    if (data.metadata !== undefined) {
      updateData.metadata = data.metadata;
    }

    return updateData;
  }
}

export default Plan;
