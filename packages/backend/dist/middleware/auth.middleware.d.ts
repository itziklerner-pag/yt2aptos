import { Request, Response, NextFunction } from 'express';
import { JwtPayload, Permission } from '@yt2aptos/shared';
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
export declare const authMiddleware: {
    /**
     * Verify JWT token and attach user data to request
     */
    authenticate: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Check if authentication was performed using a wallet
     */
    requireWalletAuth: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Check if user has specific permission
     */
    hasPermission: (permission: Permission) => (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    /**
     * Check if user has admin role
     */
    isAdmin: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    /**
     * Check if user is accessing their own resources
     */
    isResourceOwner: (userIdExtractor: (req: Request) => string) => (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    /**
     * Rate limiting middleware to prevent brute force attacks
     * This is a simplified implementation. In production,
     * use a more robust solution like express-rate-limit or redis
     */
    rateLimiter: {
        attempts: Map<string, {
            count: number;
            resetTime: number;
        }>;
        login: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    };
};
