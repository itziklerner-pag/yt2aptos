"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const user_model_1 = require("../models/user.model");
const shared_1 = require("@yt2aptos/shared");
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
/**
 * Authentication service that handles user authentication and authorization
 */
class AuthService {
    SALT_ROUNDS = 10;
    ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
    REFRESH_TOKEN_EXPIRY = '7d'; // 7 days
    PASSWORD_RESET_EXPIRY = 3600 * 1000; // 1 hour in milliseconds
    JWT_REFRESH_SECRET = env_1.env.JWT_SECRET + '_refresh'; // Using main JWT secret with suffix for refresh
    // In production, use a separate collection
    refreshTokens = new Map();
    resetTokens = new Map();
    /**
     * Register a new user with traditional authentication
     */
    async register(userData) {
        try {
            // Check if user already exists
            const existingUser = await user_model_1.UserModel.findOne({
                $or: [
                    { username: userData.username },
                    { email: userData.email }
                ]
            });
            if (existingUser) {
                throw new Error('Username or email already exists');
            }
            // Hash the password
            const hashedPassword = await this.hashPassword(userData.password);
            // Create a new user
            const newUser = new user_model_1.UserModel({
                username: userData.username,
                email: userData.email,
                password: hashedPassword,
                displayName: userData.displayName || userData.username,
                isAdmin: false,
                role: shared_1.UserRole.USER,
                isEmailVerified: false,
                lastLogin: new Date()
            });
            await newUser.save();
            // Generate tokens
            const tokens = this.generateTokens(newUser);
            // Store refresh token
            this.storeRefreshToken(newUser.id, tokens.refreshToken);
            return {
                user: this.mapUserToDTO(newUser),
                tokens
            };
        }
        catch (error) {
            logger_1.logger.error('User registration error:', error);
            throw error;
        }
    }
    /**
     * Login with username and password
     */
    async login(credentials) {
        try {
            // Find user by username
            const user = await user_model_1.UserModel.findOne({ username: credentials.username });
            if (!user) {
                throw new Error('Invalid username or password');
            }
            // Verify password
            const isPasswordValid = await this.verifyPassword(credentials.password, user.password);
            if (!isPasswordValid) {
                throw new Error('Invalid username or password');
            }
            // Update last login
            user.lastLogin = new Date();
            await user.save();
            // Generate tokens
            const tokens = this.generateTokens(user);
            // Store refresh token
            this.storeRefreshToken(user.id, tokens.refreshToken);
            return {
                user: this.mapUserToDTO(user),
                tokens
            };
        }
        catch (error) {
            logger_1.logger.error('User login error:', error);
            throw error;
        }
    }
    /**
     * Logout user by blacklisting their refresh token
     */
    async logout(refreshToken) {
        try {
            const tokenData = this.refreshTokens.get(refreshToken);
            if (tokenData) {
                tokenData.blacklisted = true;
                this.refreshTokens.set(refreshToken, tokenData);
            }
        }
        catch (error) {
            logger_1.logger.error('Logout error:', error);
            throw error;
        }
    }
    /**
     * Refresh access token using refresh token
     */
    async refreshToken(tokenRequest) {
        try {
            const refreshToken = tokenRequest.refreshToken;
            // Verify refresh token exists and is not blacklisted
            const tokenData = this.refreshTokens.get(refreshToken);
            if (!tokenData || tokenData.blacklisted) {
                throw new Error('Invalid refresh token');
            }
            // Check if token is expired
            if (new Date() > tokenData.expiresAt) {
                throw new Error('Refresh token expired');
            }
            // Get user
            const user = await user_model_1.UserModel.findById(tokenData.userId);
            if (!user) {
                throw new Error('User not found');
            }
            // Generate new tokens
            const tokens = this.generateTokens(user);
            // Invalidate old refresh token
            this.refreshTokens.set(refreshToken, {
                ...tokenData,
                blacklisted: true
            });
            // Store new refresh token
            this.storeRefreshToken(user.id, tokens.refreshToken);
            return tokens;
        }
        catch (error) {
            logger_1.logger.error('Token refresh error:', error);
            throw error;
        }
    }
    /**
     * Validate access token and get user data
     */
    async validateToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
            return decoded;
        }
        catch (error) {
            logger_1.logger.error('Token validation error:', error);
            throw new Error('Invalid token');
        }
    }
    /**
     * Request password reset
     */
    async requestPasswordReset(request) {
        try {
            // Find user by email
            const user = await user_model_1.UserModel.findOne({ email: request.email });
            if (!user) {
                // For security reasons, don't reveal that email doesn't exist
                return { message: 'If your email is registered, you will receive a password reset link' };
            }
            // Generate a random token
            const resetToken = crypto_1.default.randomBytes(32).toString('hex');
            // Store the token with expiry
            this.resetTokens.set(resetToken, {
                userId: user.id,
                expiresAt: Date.now() + this.PASSWORD_RESET_EXPIRY
            });
            // In a real application, send an email with the reset link
            logger_1.logger.info(`Password reset token for ${user.email}: ${resetToken}`);
            return { message: 'If your email is registered, you will receive a password reset link' };
        }
        catch (error) {
            logger_1.logger.error('Password reset request error:', error);
            throw error;
        }
    }
    /**
     * Reset password with token
     */
    async resetPassword(request) {
        try {
            const tokenData = this.resetTokens.get(request.resetToken);
            if (!tokenData) {
                throw new Error('Invalid reset token');
            }
            if (Date.now() > tokenData.expiresAt) {
                // Remove expired token
                this.resetTokens.delete(request.resetToken);
                throw new Error('Reset token expired');
            }
            // Find user
            const user = await user_model_1.UserModel.findById(tokenData.userId);
            if (!user) {
                throw new Error('User not found');
            }
            // Hash the new password
            const hashedPassword = await this.hashPassword(request.newPassword);
            // Update user's password
            user.password = hashedPassword;
            await user.save();
            // Invalidate all refresh tokens for the user
            for (const [key, value] of this.refreshTokens.entries()) {
                if (value.userId === user.id) {
                    this.refreshTokens.set(key, {
                        ...value,
                        blacklisted: true
                    });
                }
            }
            // Remove the reset token
            this.resetTokens.delete(request.resetToken);
            return { message: 'Password has been reset successfully' };
        }
        catch (error) {
            logger_1.logger.error('Password reset error:', error);
            throw error;
        }
    }
    /**
     * Check if user has a specific permission
     */
    hasPermission(user, permission) {
        if ('userId' in user) {
            // It's a JwtPayload
            return user.permissions.includes(permission);
        }
        else {
            // It's a UserDocument
            const permissions = shared_1.ROLE_PERMISSIONS[user.role];
            return permissions.includes(permission);
        }
    }
    /**
     * Get user permissions based on role
     */
    getUserPermissions(role) {
        return shared_1.ROLE_PERMISSIONS[role];
    }
    /**
     * Hash a password
     */
    async hashPassword(password) {
        return bcrypt_1.default.hash(password, this.SALT_ROUNDS);
    }
    /**
     * Verify a password against a hash
     */
    async verifyPassword(password, hash) {
        return bcrypt_1.default.compare(password, hash);
    }
    /**
     * Generate access and refresh tokens
     */
    generateTokens(user) {
        const payload = {
            userId: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            authMethod: shared_1.AuthMethod.TRADITIONAL,
            permissions: this.getUserPermissions(user.role),
            ...(user.walletAddress && { walletAddress: user.walletAddress })
        };
        const accessToken = jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, { expiresIn: this.ACCESS_TOKEN_EXPIRY });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, this.JWT_REFRESH_SECRET, { expiresIn: this.REFRESH_TOKEN_EXPIRY });
        return {
            accessToken,
            refreshToken,
            expiresIn: 15 * 60 // 15 minutes in seconds
        };
    }
    /**
     * Store refresh token
     */
    storeRefreshToken(userId, token) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7); // 7 days from now
        this.refreshTokens.set(token, {
            userId,
            token,
            expiresAt: expiryDate,
            blacklisted: false
        });
    }
    /**
     * Map User document to UserDTO
     */
    mapUserToDTO(user) {
        return {
            id: user.id,
            username: user.username,
            email: user.email,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            role: user.role,
            walletAddress: user.walletAddress,
            isEmailVerified: user.isEmailVerified,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
    }
}
exports.default = new AuthService();
//# sourceMappingURL=auth.service.js.map