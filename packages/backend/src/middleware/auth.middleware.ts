import { Request, Response, NextFunction } from 'express';
import { UserModel } from '../models/user.model';
import { JwtPayload, Permission } from '@yt2aptos/shared';
import authService from '../services/auth.service';
import { logger } from '../utils/logger';

/**
 * Extend Express Request to include user data
 */
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware to authenticate and authorize requests
 */
export const authMiddleware = {
  /**
   * Verify JWT token and attach user data to request
   */
  authenticate: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = extractTokenFromHeader(req);
      
      if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      try {
        const payload = await authService.validateToken(token);
        req.user = payload;
        next();
      } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }
    } catch (error) {
      logger.error('Authentication error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
   * Check if authentication was performed using a wallet
   */
  requireWalletAuth: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      if (req.user.authMethod !== 'wallet') {
        return res.status(403).json({
          message: 'Wallet authentication required for this endpoint'
        });
      }
      
      // Ensure wallet address is present
      if (!req.user.walletAddress) {
        return res.status(403).json({
          message: 'No wallet address associated with this account'
        });
      }
      
      next();
    } catch (error) {
      logger.error('Wallet auth check error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },
  
  /**
   * Check if user has specific permission
   */
  hasPermission: (permission: Permission) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: 'Authentication required' });
        }
        
        if (req.user.permissions.includes(permission)) {
          return next();
        }
        
        return res.status(403).json({ message: 'Insufficient permissions' });
      } catch (error) {
        logger.error('Permission check error:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }
    };
  },
  
  /**
   * Check if user has admin role
   */
  isAdmin: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      if (req.user.role === 'admin') {
        return next();
      }
      
      return res.status(403).json({ message: 'Admin access required' });
    } catch (error) {
      logger.error('Admin check error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },
  
  /**
   * Check if user is accessing their own resources
   */
  isResourceOwner: (userIdExtractor: (req: Request) => string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: 'Authentication required' });
        }
        
        const resourceUserId = userIdExtractor(req);
        
        if (req.user.userId === resourceUserId || req.user.role === 'admin') {
          return next();
        }
        
        return res.status(403).json({ message: 'Access denied' });
      } catch (error) {
        logger.error('Resource ownership check error:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }
    };
  },
  
  /**
   * Rate limiting middleware to prevent brute force attacks
   * This is a simplified implementation. In production,
   * use a more robust solution like express-rate-limit or redis
   */
  rateLimiter: {
    attempts: new Map<string, { count: number, resetTime: number }>(),
    
    login: async (req: Request, res: Response, next: NextFunction) => {
      const MAX_ATTEMPTS = 5;
      const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
      
      // Use IP address as identifier (in production, use more sophisticated approach)
      const identifier = req.ip || 'unknown';
      
      // Get current attempts
      const record = authMiddleware.rateLimiter.attempts.get(identifier) || { 
        count: 0,
        resetTime: Date.now() + WINDOW_MS
      };
      
      // Check if window has expired
      if (Date.now() > record.resetTime) {
        record.count = 0;
        record.resetTime = Date.now() + WINDOW_MS;
      }
      
      // Check attempt count
      if (record.count >= MAX_ATTEMPTS) {
        return res.status(429).json({
          message: 'Too many attempts. Try again later.',
          retryAfter: Math.ceil((record.resetTime - Date.now()) / 1000)
        });
      }
      
      // Increment count and store
      record.count += 1;
      authMiddleware.rateLimiter.attempts.set(identifier, record);
      
      next();
    }
  }
};

/**
 * Extract JWT token from Authorization header
 */
function extractTokenFromHeader(req: Request): string | null {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}