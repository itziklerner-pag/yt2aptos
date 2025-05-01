"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = __importDefault(require("../services/auth.service"));
const aptos_service_1 = __importDefault(require("../services/aptos.service"));
const logger_1 = require("../utils/logger");
/**
 * Controller for authentication operations
 */
class AuthController {
    /**
     * Register a new user
     * @param req Express request
     * @param res Express response
     */
    static async register(req, res) {
        try {
            const userData = req.body;
            if (!userData.username || !userData.email || !userData.password) {
                return res.status(400).json({
                    message: 'Username, email, and password are required'
                });
            }
            const result = await auth_service_1.default.register(userData);
            return res.status(201).json(result);
        }
        catch (error) {
            logger_1.logger.error('Registration error:', error);
            // Handle duplicate key errors
            if (error.code === 11000) {
                return res.status(409).json({
                    message: 'Username or email already exists'
                });
            }
            return res.status(500).json({
                message: 'Registration failed',
                error: error.message
            });
        }
    }
    /**
     * Login a user
     * @param req Express request
     * @param res Express response
     */
    static async login(req, res) {
        try {
            const credentials = req.body;
            if (!credentials.username || !credentials.password) {
                return res.status(400).json({
                    message: 'Username and password are required'
                });
            }
            const result = await auth_service_1.default.login(credentials);
            return res.status(200).json(result);
        }
        catch (error) {
            logger_1.logger.error('Login error:', error);
            return res.status(401).json({
                message: 'Invalid username or password'
            });
        }
    }
    /**
     * Logout a user
     * @param req Express request
     * @param res Express response
     */
    static async logout(req, res) {
        try {
            const refreshToken = req.body.refreshToken;
            if (!refreshToken) {
                return res.status(400).json({
                    message: 'Refresh token is required'
                });
            }
            await auth_service_1.default.logout(refreshToken);
            return res.status(200).json({
                message: 'Logged out successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Logout error:', error);
            return res.status(500).json({
                message: 'Logout failed',
                error: error.message
            });
        }
    }
    /**
     * Refresh an access token
     * @param req Express request
     * @param res Express response
     */
    static async refreshToken(req, res) {
        try {
            const tokenRequest = req.body;
            if (!tokenRequest.refreshToken) {
                return res.status(400).json({
                    message: 'Refresh token is required'
                });
            }
            const tokens = await auth_service_1.default.refreshToken(tokenRequest);
            return res.status(200).json(tokens);
        }
        catch (error) {
            logger_1.logger.error('Token refresh error:', error);
            return res.status(401).json({
                message: 'Invalid refresh token'
            });
        }
    }
    /**
     * Request a password reset
     * @param req Express request
     * @param res Express response
     */
    static async requestPasswordReset(req, res) {
        try {
            const request = req.body;
            if (!request.email) {
                return res.status(400).json({
                    message: 'Email is required'
                });
            }
            const result = await auth_service_1.default.requestPasswordReset(request);
            return res.status(200).json(result);
        }
        catch (error) {
            logger_1.logger.error('Password reset request error:', error);
            // For security, we don't want to leak information about valid emails
            return res.status(200).json({
                message: 'If your email is registered, you will receive a password reset link'
            });
        }
    }
    /**
     * Reset a password using a token
     * @param req Express request
     * @param res Express response
     */
    static async resetPassword(req, res) {
        try {
            const request = req.body;
            if (!request.resetToken || !request.newPassword) {
                return res.status(400).json({
                    message: 'Reset token and new password are required'
                });
            }
            const result = await auth_service_1.default.resetPassword(request);
            return res.status(200).json(result);
        }
        catch (error) {
            logger_1.logger.error('Password reset error:', error);
            return res.status(400).json({
                message: 'Invalid or expired reset token'
            });
        }
    }
    /**
     * Generate a wallet authentication nonce
     * @param req Express request
     * @param res Express response
     */
    static async generateWalletNonce(req, res) {
        try {
            const { address } = req.body;
            if (!address) {
                return res.status(400).json({
                    message: 'Wallet address is required'
                });
            }
            const nonce = await aptos_service_1.default.generateNonce(address);
            return res.status(200).json({
                message: 'Nonce generated successfully',
                nonce,
                walletAuthPrefix: 'YT2APTOS_AUTH:'
            });
        }
        catch (error) {
            logger_1.logger.error('Nonce generation error:', error);
            return res.status(500).json({
                message: 'Failed to generate nonce',
                error: error.message
            });
        }
    }
    /**
     * Authenticate using a wallet
     * @param req Express request
     * @param res Express response
     */
    static async walletAuth(req, res) {
        try {
            const authRequest = req.body;
            if (!authRequest.address || !authRequest.signature || !authRequest.message) {
                return res.status(400).json({
                    message: 'Wallet address, signature, and message are required'
                });
            }
            const result = await aptos_service_1.default.authenticateWithWallet(authRequest);
            return res.status(200).json(result);
        }
        catch (error) {
            logger_1.logger.error('Wallet authentication error:', error);
            return res.status(401).json({
                message: 'Invalid wallet signature or nonce',
                error: error.message
            });
        }
    }
    /**
     * Link a wallet to an existing account
     * @param req Express request
     * @param res Express response
     */
    static async linkWallet(req, res) {
        try {
            const linkRequest = req.body;
            if (!req.user) {
                return res.status(401).json({
                    message: 'Authentication required'
                });
            }
            if (!linkRequest.address || !linkRequest.signature || !linkRequest.message) {
                return res.status(400).json({
                    message: 'Wallet address, signature, and message are required'
                });
            }
            const result = await aptos_service_1.default.linkWalletToAccount(req.user.userId, linkRequest);
            return res.status(200).json({
                message: 'Wallet linked successfully',
                user: result
            });
        }
        catch (error) {
            logger_1.logger.error('Wallet linking error:', error);
            return res.status(400).json({
                message: 'Failed to link wallet',
                error: error.message
            });
        }
    }
    /**
     * Get the currently authenticated user
     * @param req Express request
     * @param res Express response
     */
    static async getCurrentUser(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    message: 'Authentication required'
                });
            }
            return res.status(200).json({
                user: req.user
            });
        }
        catch (error) {
            logger_1.logger.error('Get current user error:', error);
            return res.status(500).json({
                message: 'Failed to get user information',
                error: error.message
            });
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map