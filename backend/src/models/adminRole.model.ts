import { ValidationError } from '../middleware/error.middleware';

// Type definition that matches the Prisma AdminRole model
interface PrismaAdminRole {
  roleId: string;
  userId: string;
  roleName: string; // This will be one of the AdminRoleType values
  permissions: any; // Json type from Prisma
  grantedBy: string | null;
  grantedAt: Date;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * AdminRole model for admin role management
 * Handles validation and business logic for admin roles and permissions
 */

// Define the admin role types based on the schema enum
export type AdminRoleType =
  | 'super_admin'
  | 'plan_manager'
  | 'billing_admin'
  | 'support_admin';

export interface AdminRoleData {
  roleId?: string;
  userId: string;
  roleName: AdminRoleType;
  permissions: Record<string, any>;
  grantedBy?: string | null | undefined;
  grantedAt: Date;
  expiresAt?: Date | null | undefined;
  isActive: boolean;
}

export interface AdminRoleCreateData
  extends Omit<AdminRoleData, 'roleId' | 'grantedAt'> {}

export interface AdminRoleUpdateData
  extends Partial<Omit<AdminRoleData, 'roleId' | 'userId' | 'grantedAt'>> {}

export class AdminRole {
  public readonly roleId: string;
  public readonly userId: string;
  public readonly roleName: AdminRoleType;
  public readonly permissions: Record<string, any>;
  public readonly grantedBy?: string | null;
  public readonly grantedAt: Date;
  public readonly expiresAt?: Date | null;
  public readonly isActive: boolean;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(data: PrismaAdminRole) {
    this.roleId = data.roleId;
    this.userId = data.userId;
    this.roleName = data.roleName as AdminRoleType;
    this.permissions = data.permissions as Record<string, any>;
    this.grantedBy = data.grantedBy;
    this.grantedAt = data.grantedAt;
    this.expiresAt = data.expiresAt;
    this.isActive = data.isActive;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  /**
   * Validate admin role data before creation/update
   */
  public static validate(
    data: AdminRoleCreateData | AdminRoleUpdateData,
  ): void {
    const errors: string[] = [];

    // Validate userId (required for creation)
    if ('userId' in data && data.userId !== undefined) {
      if (!data.userId || data.userId.trim().length === 0) {
        errors.push('User ID is required');
      }
    }

    // Validate roleName (required for creation)
    if ('roleName' in data && data.roleName !== undefined) {
      const validRoles: AdminRoleType[] = [
        'super_admin',
        'plan_manager',
        'billing_admin',
        'support_admin',
      ];
      if (!validRoles.includes(data.roleName)) {
        errors.push(`Role name must be one of: ${validRoles.join(', ')}`);
      }
    }

    // Validate grantedBy
    if (
      'grantedBy' in data &&
      data.grantedBy !== undefined &&
      data.grantedBy !== null
    ) {
      if (data.grantedBy.trim().length === 0) {
        errors.push('Granted by must be a valid user ID if provided');
      }
    }

    // Validate expiresAt
    if (
      'expiresAt' in data &&
      data.expiresAt !== undefined &&
      data.expiresAt !== null
    ) {
      if (data.expiresAt <= new Date()) {
        errors.push('Expiration date must be in the future');
      }
    }

    // Validate permissions
    if ('permissions' in data && data.permissions !== undefined) {
      try {
        JSON.stringify(data.permissions);
      } catch {
        errors.push('Permissions must be a valid JSON object');
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(
        `AdminRole validation failed: ${errors.join(', ')}`,
        'VALIDATION_ERROR',
      );
    }
  }

  /**
   * Check if role has a specific permission
   */
  public hasPermission(permission: string): boolean {
    if (this.roleName === 'super_admin') return true;

    if (this.permissions && typeof this.permissions === 'object') {
      return (
        this.permissions[permission] === true ||
        this.permissions['*'] === true ||
        (Array.isArray(this.permissions.permissions) &&
          this.permissions.permissions.includes(permission))
      );
    }
    return false;
  }

  /**
   * Check if role has any of the specified permissions
   */
  public hasAnyPermission(permissions: string[]): boolean {
    return permissions.some((permission) => this.hasPermission(permission));
  }

  /**
   * Check if role has all of the specified permissions
   */
  public hasAllPermissions(permissions: string[]): boolean {
    return permissions.every((permission) => this.hasPermission(permission));
  }

  /**
   * Check if role is a super admin
   */
  public get isSuperAdmin(): boolean {
    return this.roleName === 'super_admin';
  }

  /**
   * Check if role is a plan manager
   */
  public get isPlanManager(): boolean {
    return this.roleName === 'plan_manager';
  }

  /**
   * Check if role is a billing admin
   */
  public get isBillingAdmin(): boolean {
    return this.roleName === 'billing_admin';
  }

  /**
   * Check if role is a support admin
   */
  public get isSupportAdmin(): boolean {
    return this.roleName === 'support_admin';
  }

  /**
   * Check if role is expired
   */
  public get isExpired(): boolean {
    return (
      this.expiresAt !== null &&
      this.expiresAt !== undefined &&
      this.expiresAt <= new Date()
    );
  }

  /**
   * Check if role is currently valid (active and not expired)
   */
  public get isValid(): boolean {
    return this.isActive && !this.isExpired;
  }

  /**
   * Get role display name
   */
  public get displayName(): string {
    const roleNames: Record<AdminRoleType, string> = {
      super_admin: 'Super Administrator',
      plan_manager: 'Plan Manager',
      billing_admin: 'Billing Administrator',
      support_admin: 'Support Administrator',
    };
    return roleNames[this.roleName] || this.roleName;
  }

  /**
   * Convert to plain object for API responses
   */
  public toJSON(): AdminRoleData & {
    roleId: string;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      roleId: this.roleId,
      userId: this.userId,
      roleName: this.roleName,
      permissions: this.permissions,
      grantedBy: this.grantedBy,
      grantedAt: this.grantedAt,
      expiresAt: this.expiresAt,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Create AdminRole instance from database data
   */
  public static fromDatabase(data: PrismaAdminRole): AdminRole {
    return new AdminRole(data);
  }

  /**
   * Prepare data for database creation
   */
  public static prepareForCreation(data: AdminRoleCreateData): any {
    AdminRole.validate(data);

    return {
      userId: data.userId.trim(),
      roleName: data.roleName,
      permissions: data.permissions || {},
      grantedBy: data.grantedBy?.trim() || null,
      expiresAt: data.expiresAt || null,
      isActive: data.isActive,
    };
  }

  /**
   * Prepare data for database update
   */
  public static prepareForUpdate(data: AdminRoleUpdateData): any {
    AdminRole.validate(data);

    const updateData: any = {};

    if (data.roleName !== undefined) {
      updateData.roleName = data.roleName;
    }

    if (data.permissions !== undefined) {
      updateData.permissions = data.permissions;
    }

    if (data.grantedBy !== undefined) {
      updateData.grantedBy = data.grantedBy?.trim() || null;
    }

    if (data.expiresAt !== undefined) {
      updateData.expiresAt = data.expiresAt;
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    return updateData;
  }

  /**
   * Create a super admin role
   */
  public static createSuperAdminRole(
    userId: string,
    grantedBy?: string,
  ): AdminRoleCreateData {
    return {
      userId,
      roleName: 'super_admin',
      permissions: { '*': true },
      grantedBy: grantedBy || null,
      isActive: true,
    };
  }

  /**
   * Create a plan manager role
   */
  public static createPlanManagerRole(
    userId: string,
    grantedBy?: string,
  ): AdminRoleCreateData {
    return {
      userId,
      roleName: 'plan_manager',
      permissions: {
        'plan.create': true,
        'plan.read': true,
        'plan.update': true,
        'plan.delete': true,
        'feature.create': true,
        'feature.read': true,
        'feature.update': true,
        'feature.delete': true,
        'plan_feature.create': true,
        'plan_feature.read': true,
        'plan_feature.update': true,
        'plan_feature.delete': true,
      },
      grantedBy: grantedBy || null,
      isActive: true,
    };
  }

  /**
   * Create a billing admin role
   */
  public static createBillingAdminRole(
    userId: string,
    grantedBy?: string,
  ): AdminRoleCreateData {
    return {
      userId,
      roleName: 'billing_admin',
      permissions: {
        'subscription.read': true,
        'subscription.update': true,
        'subscription.create': true,
        'subscription.delete': true,
        'user.read': true,
        'plan.read': true,
      },
      grantedBy: grantedBy || null,
      isActive: true,
    };
  }

  /**
   * Create a support admin role
   */
  public static createSupportAdminRole(
    userId: string,
    grantedBy?: string,
  ): AdminRoleCreateData {
    return {
      userId,
      roleName: 'support_admin',
      permissions: {
        'user.read': true,
        'subscription.read': true,
        'plan.read': true,
        'feature.read': true,
        'plan_feature.read': true,
      },
      grantedBy: grantedBy || null,
      isActive: true,
    };
  }
}

export default AdminRole;
