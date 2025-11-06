import { Request, Response, NextFunction } from 'express';
import { ValidationError } from './error.middleware';

/**
 * Extended Request interface to include user information
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    roles: string[];
    isAdmin: boolean;
  };
}

/**
 * Admin role middleware for protecting admin-only endpoints
 * Validates that the authenticated user has admin privileges
 */
export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  try {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED',
        message: 'You must be logged in to access this resource',
      });
      return;
    }

    // Check if user has admin role
    if (!req.user.isAdmin && !req.user.roles.includes('admin')) {
      res.status(403).json({
        error: 'Admin access required',
        code: 'ADMIN_ACCESS_REQUIRED',
        message:
          'You must have administrator privileges to access this resource',
      });
      return;
    }

    // User is authenticated and has admin privileges
    next();
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: 'An error occurred while validating admin access',
    });
  }
}

/**
 * Super admin role middleware for protecting super admin-only endpoints
 * Validates that the authenticated user has super admin privileges
 */
export function requireSuperAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  try {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED',
        message: 'You must be logged in to access this resource',
      });
      return;
    }

    // Check if user has super admin role
    if (!req.user.roles.includes('super_admin')) {
      res.status(403).json({
        error: 'Super admin access required',
        code: 'SUPER_ADMIN_ACCESS_REQUIRED',
        message:
          'You must have super administrator privileges to access this resource',
      });
      return;
    }

    // User is authenticated and has super admin privileges
    next();
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: 'An error occurred while validating super admin access',
    });
  }
}

/**
 * Role-based access control middleware
 * Validates that the authenticated user has one of the required roles
 */
export function requireRole(requiredRoles: string | string[]) {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): void => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        res.status(401).json({
          error: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED',
          message: 'You must be logged in to access this resource',
        });
        return;
      }

      // Check if user has any of the required roles
      const hasRequiredRole = roles.some((role) =>
        req.user!.roles.includes(role),
      );

      if (!hasRequiredRole) {
        res.status(403).json({
          error: 'Insufficient privileges',
          code: 'INSUFFICIENT_PRIVILEGES',
          message: `You must have one of the following roles: ${roles.join(', ')}`,
        });
        return;
      }

      // User has required role
      next();
    } catch (error) {
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while validating role access',
      });
    }
  };
}

/**
 * Optional admin middleware - passes through for non-admin users but adds admin context
 * Useful for endpoints that provide different responses based on admin status
 */
export function optionalAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  // Simply pass through - the admin status is already available in req.user.isAdmin
  // This middleware exists for consistency and can be extended with admin-specific logic
  next();
}

/**
 * Admin role validation utility function
 * Can be used in services or other middleware for programmatic role checking
 */
export function validateAdminRole(user: AuthenticatedRequest['user']): boolean {
  if (!user) {
    return false;
  }

  return user.isAdmin || user.roles.includes('admin');
}

/**
 * Super admin role validation utility function
 */
export function validateSuperAdminRole(
  user: AuthenticatedRequest['user'],
): boolean {
  if (!user) {
    return false;
  }

  return user.roles.includes('super_admin');
}

/**
 * Role validation utility function
 */
export function validateUserRole(
  user: AuthenticatedRequest['user'],
  requiredRoles: string | string[],
): boolean {
  if (!user) {
    return false;
  }

  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return roles.some((role) => user.roles.includes(role));
}

/**
 * Admin context enhancement middleware
 * Adds admin-specific context to the request for admin endpoints
 */
export function enhanceAdminContext(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  if (req.user && validateAdminRole(req.user)) {
    // Add admin-specific context
    (req as any).adminContext = {
      canManagePlans: validateUserRole(req.user, ['admin', 'plan_manager']),
      canManageFeatures: validateUserRole(req.user, [
        'admin',
        'feature_manager',
      ]),
      canManageUsers: validateUserRole(req.user, ['admin', 'user_manager']),
      canViewAnalytics: validateUserRole(req.user, [
        'admin',
        'analytics_viewer',
      ]),
      isSuperAdmin: validateSuperAdminRole(req.user),
    };
  }

  next();
}

export default {
  requireAdmin,
  requireSuperAdmin,
  requireRole,
  optionalAdmin,
  validateAdminRole,
  validateSuperAdminRole,
  validateUserRole,
  enhanceAdminContext,
};
