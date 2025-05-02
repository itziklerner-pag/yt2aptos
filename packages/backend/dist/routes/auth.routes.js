"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
/**
 * Traditional Authentication Routes
 */
// Register a new user
router.post('/register', auth_middleware_1.authMiddleware.rateLimiter.login, auth_controller_1.AuthController.register);
// Login
router.post('/login', auth_middleware_1.authMiddleware.rateLimiter.login, auth_controller_1.AuthController.login);
// Logout
router.post('/logout', auth_controller_1.AuthController.logout);
// Refresh token
router.post('/refresh-token', auth_controller_1.AuthController.refreshToken);
// Get current user
router.get('/me', auth_middleware_1.authMiddleware.authenticate, auth_controller_1.AuthController.getCurrentUser);
/**
 * Password Management Routes
 */
// Request password reset
router.post('/password-reset/request', auth_controller_1.AuthController.requestPasswordReset);
// Reset password with token
router.post('/password-reset/reset', auth_controller_1.AuthController.resetPassword);
/**
 * Web3/Aptos Authentication Routes
 */
// Generate challenge for wallet authentication
router.get('/web3/challenge', auth_controller_1.AuthController.generateWalletNonce);
// Verify wallet signature and authenticate
router.post('/web3/verify', auth_controller_1.AuthController.walletAuth);
// Get Web3 user profile
router.get('/web3/profile', auth_middleware_1.authMiddleware.authenticate, auth_middleware_1.authMiddleware.requireWalletAuth, auth_controller_1.AuthController.getCurrentUser);
// Link wallet to existing account
router.post('/web3/link', auth_middleware_1.authMiddleware.authenticate, auth_controller_1.AuthController.linkWallet);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map