import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { Logger } from '@/utils/logger';

const prisma = new PrismaClient();
const logger = new Logger('AuthController');

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: {
      id: string;
      email: string;
      role: 'admin' | 'user';
      name?: string;
    };
  };
  error?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'user';
  name?: string;
}

/**
 * Authentication Controller
 * Handles user login, logout, and token verification
 */
export class AuthController {
  /**
   * POST /api/v1/auth/login
   * Authenticate user with email and password
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, rememberMe = false }: LoginRequest = req.body;

      // Validate input
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required',
          error: 'MISSING_CREDENTIALS',
        } as LoginResponse);
        return;
      }

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user || !user.isActive) {
        logger.warn(
          `Login attempt for non-existent or inactive user: ${email}`,
        );
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
          error: 'INVALID_CREDENTIALS',
        } as LoginResponse);
        return;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(
        password,
        user.passwordHash || '',
      );
      if (!isPasswordValid) {
        logger.warn(`Invalid password attempt for user: ${email}`);
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
          error: 'INVALID_CREDENTIALS',
        } as LoginResponse);
        return;
      }

      // Determine user role (simplified - in real app this would come from user roles table)
      const isAdmin = email.includes('admin') || email === 'carol@example.com';
      const role: 'admin' | 'user' = isAdmin ? 'admin' : 'user';

      // Generate JWT token
      const tokenExpiry = rememberMe ? '30d' : '7d';
      const token = jwt.sign(
        {
          userId: user.userId,
          email: user.email,
          role: role,
        },
        process.env.JWT_SECRET!,
        { expiresIn: tokenExpiry },
      );

      // Update last login timestamp
      await prisma.user.update({
        where: { userId: user.userId },
        data: { updatedAt: new Date() },
      });

      logger.info(`Successful login for user: ${email}`);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.userId,
            email: user.email,
            role: role,
            name: user.name || undefined,
          },
        },
      } as LoginResponse);
    } catch (error) {
      logger.error(`Login error: ${error}`);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'SERVER_ERROR',
      } as LoginResponse);
    }
  }

  /**
   * GET /api/v1/auth/verify
   * Verify JWT token and return user info
   */
  static async verify(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

      if (!token) {
        res.status(401).json({
          success: false,
          message: 'No token provided',
          error: 'NO_TOKEN',
        });
        return;
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      // Get user from database to ensure they still exist and are active
      const user = await prisma.user.findUnique({
        where: { userId: decoded.userId },
      });

      if (!user || !user.isActive) {
        res.status(401).json({
          success: false,
          message: 'Invalid token - user not found or inactive',
          error: 'INVALID_TOKEN',
        });
        return;
      }

      // Determine role (same logic as login)
      const isAdmin =
        user.email.includes('admin') || user.email === 'carol@example.com';
      const role: 'admin' | 'user' = isAdmin ? 'admin' : 'user';

      res.status(200).json({
        success: true,
        message: 'Token valid',
        data: {
          user: {
            id: user.userId,
            email: user.email,
            role: role,
            name: user.name || undefined,
          },
        },
      });
    } catch (error) {
      logger.error(`Token verification error: ${error}`);
      res.status(401).json({
        success: false,
        message: 'Invalid token',
        error: 'INVALID_TOKEN',
      });
    }
  }

  /**
   * POST /api/v1/auth/logout
   * Logout user (client-side token invalidation)
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      // In a more sophisticated setup, you might:
      // 1. Add token to blacklist
      // 2. Update user's last_logout timestamp
      // 3. Invalidate refresh tokens

      // For now, we'll just send a success response
      // Token invalidation happens on the client side

      logger.info('User logout requested');

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      logger.error(`Logout error: ${error}`);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'SERVER_ERROR',
      });
    }
  }
}
