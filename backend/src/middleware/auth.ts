import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@/config/environment';
import { getDatabase } from '@/database/connection';
import { Logger } from '@/utils/logger';

/**
 * Extended Request interface to include authenticated user information
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    subscription: {
      type: 'default' | 'premium';
      status: 'active' | 'expired' | 'canceled' | 'pending' | 'grace_period';
      planId?: string;
    };
    projects?: {
      canCreate: boolean;
      maxProjects: number;
      currentCount: number;
    };
  };
}

/**
 * JWT payload interface
 */
interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

const logger = new Logger('AuthMiddleware');

/**
 * Authenticate user using JWT token and load subscription information
 */
export async function authenticateUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authorization token is required',
        },
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, config.security.jwtSecret) as JWTPayload;
    } catch (jwtError) {
      logger.warn('Invalid JWT token:', jwtError);
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired authentication token',
        },
      });
      return;
    }

    // Load user with subscription information
    const prisma = getDatabase();
    const user = await prisma.user.findUnique({
      where: { userId: decoded.userId },
      include: {
        subscriptions: {
          where: { status: { in: ['active', 'grace_period'] } },
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        projects: {
          where: { isActive: true },
          select: { projectId: true },
        },
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User account not found or inactive',
        },
      });
      return;
    }

    // Determine subscription type and limits
    const activeSubscription = user.subscriptions[0];
    const subscriptionType = activeSubscription?.plan?.name
      ?.toLowerCase()
      .includes('premium')
      ? 'premium'
      : 'default';

    const projectLimits = getProjectLimits(subscriptionType);
    const currentProjectCount = user.projects.length;

    // Attach user information to request
    req.user = {
      userId: user.userId,
      email: user.email,
      subscription: {
        type: subscriptionType,
        status: activeSubscription?.status || 'pending',
        ...(activeSubscription?.planId
          ? { planId: activeSubscription.planId }
          : {}),
      },
      projects: {
        canCreate:
          currentProjectCount < projectLimits.maxProjects ||
          projectLimits.maxProjects === -1,
        maxProjects: projectLimits.maxProjects,
        currentCount: currentProjectCount,
      },
    };

    logger.debug(
      `User authenticated: ${user.email} (${subscriptionType} subscription, ${currentProjectCount}/${projectLimits.maxProjects} projects)`,
    );
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Internal authentication error',
      },
    });
  }
}

/**
 * Middleware to check if user can create new projects based on subscription limits
 */
export function requireProjectCreationAccess(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required',
      },
    });
    return;
  }

  if (!req.user.projects?.canCreate) {
    res.status(403).json({
      success: false,
      error: {
        code: 'SUBSCRIPTION_LIMIT_EXCEEDED',
        message: `${req.user.subscription.type === 'default' ? 'Default subscription allows only 1 active project' : 'Project limit reached'}`,
        details: {
          currentCount: req.user.projects?.currentCount || 0,
          maxAllowed: req.user.projects?.maxProjects || 0,
          subscriptionType: req.user.subscription.type,
        },
      },
    });
    return;
  }

  next();
}

/**
 * Middleware to validate project ownership
 */
export async function requireProjectOwnership(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required',
        },
      });
      return;
    }

    const projectId = req.params.projectId || req.params.id;
    if (!projectId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PROJECT_ID',
          message: 'Project ID is required',
        },
      });
      return;
    }

    // Verify project ownership
    const prisma = getDatabase();
    const project = await prisma.project.findFirst({
      where: {
        projectId: projectId,
        userId: req.user.userId,
        isActive: true,
      },
      select: { projectId: true, name: true },
    });

    if (!project) {
      res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: 'Project not found or access denied',
        },
      });
      return;
    }

    logger.debug(
      `Project ownership verified: ${project.name} (${projectId}) for user ${req.user.email}`,
    );
    next();
  } catch (error) {
    logger.error('Project ownership validation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'OWNERSHIP_VALIDATION_ERROR',
        message: 'Error validating project ownership',
      },
    });
  }
}

/**
 * Get project limits based on subscription type
 */
function getProjectLimits(subscriptionType: 'default' | 'premium'): {
  maxProjects: number;
  maxUndoOperations: number;
} {
  switch (subscriptionType) {
    case 'premium':
      return {
        maxProjects: -1, // Unlimited
        maxUndoOperations: 50,
      };
    case 'default':
    default:
      return {
        maxProjects: 1,
        maxUndoOperations: 5,
      };
  }
}

/**
 * Get undo/redo limits for the authenticated user
 */
export function getUndoRedoLimits(req: AuthenticatedRequest): {
  maxOperations: number;
  subscriptionType: string;
} {
  const subscriptionType = req.user?.subscription.type || 'default';
  const limits = getProjectLimits(subscriptionType);

  return {
    maxOperations: limits.maxUndoOperations,
    subscriptionType,
  };
}

/**
 * Middleware to check subscription status for premium features
 */
export function requireActiveSubscription(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required',
      },
    });
    return;
  }

  const { status } = req.user.subscription;
  if (status !== 'active' && status !== 'grace_period') {
    res.status(403).json({
      success: false,
      error: {
        code: 'SUBSCRIPTION_REQUIRED',
        message: 'Active subscription required for this feature',
        details: {
          currentStatus: status,
          subscriptionType: req.user.subscription.type,
        },
      },
    });
    return;
  }

  next();
}

export default {
  authenticateUser,
  requireProjectCreationAccess,
  requireProjectOwnership,
  requireActiveSubscription,
  getUndoRedoLimits,
};
