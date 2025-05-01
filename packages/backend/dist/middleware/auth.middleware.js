"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const auth_service_1 = __importDefault(require("../services/auth.service"));
const logger_1 = require("../utils/logger");
/**
 * Middleware to authenticate and authorize requests
 */
exports.authMiddleware = {
    /**
     * Verify JWT token and attach user data to request
     */
    authenticate: async (req, res, next) => {
        try {
            const token = extractTokenFromHeader(req);
            if (!token) {
                return res.status(401).json({ message: 'Authentication required' });
            }
            try {
                const payload = await auth_service_1.default.validateToken(token);
                req.user = payload;
                next();
            }
            catch (error) {
                return res.status(401).json({ message: 'Invalid or expired token' });
            }
        }
        catch (error) {
            logger_1.logger.error('Authentication error:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    },
    /**
     * Check if user has specific permission
     */
    hasPermission: (permission) => {
        return async (req, res, next) => {
            try {
                if (!req.user) {
                    return res.status(401).json({ message: 'Authentication required' });
                }
                if (req.user.permissions.includes(permission)) {
                    return next();
                }
                return res.status(403).json({ message: 'Insufficient permissions' });
            }
            catch (error) {
                logger_1.logger.error('Permission check error:', error);
                return res.status(500).json({ message: 'Internal server error' });
            }
        };
    },
    /**
     * Check if user has admin role
     */
    isAdmin: async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Authentication required' });
            }
            if (req.user.role === 'admin') {
                return next();
            }
            return res.status(403).json({ message: 'Admin access required' });
        }
        catch (error) {
            logger_1.logger.error('Admin check error:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    },
    /**
     * Check if user is accessing their own resources
     */
    isResourceOwner: (userIdExtractor) => {
        return async (req, res, next) => {
            try {
                if (!req.user) {
                    return res.status(401).json({ message: 'Authentication required' });
                }
                const resourceUserId = userIdExtractor(req);
                if (req.user.userId === resourceUserId || req.user.role === 'admin') {
                    return next();
                }
                return res.status(403).json({ message: 'Access denied' });
            }
            catch (error) {
                logger_1.logger.error('Resource ownership check error:', error);
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
        attempts: new Map(),
        login: async (req, res, next) => {
            const MAX_ATTEMPTS = 5;
            const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
            // Use IP address as identifier (in production, use more sophisticated approach)
            const identifier = req.ip || 'unknown';
            // Get current attempts
            const record = exports.authMiddleware.rateLimiter.attempts.get(identifier) || {
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
            exports.authMiddleware.rateLimiter.attempts.set(identifier, record);
            next();
        }
    }
};
/**
 * Extract JWT token from Authorization header
 */
function extractTokenFromHeader(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7); // Remove 'Bearer ' prefix
}
//# sourceMappingURL=auth.middleware.js.map