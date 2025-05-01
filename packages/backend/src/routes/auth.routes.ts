import express from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * Traditional Authentication Routes
 */
// Register a new user
router.post('/register', authMiddleware.rateLimiter.login, AuthController.register);

// Login
router.post('/login', authMiddleware.rateLimiter.login, AuthController.login);

// Logout
router.post('/logout', AuthController.logout);

// Refresh token
router.post('/refresh-token', AuthController.refreshToken);

// Get current user
router.get('/me', authMiddleware.authenticate, AuthController.getCurrentUser);

/**
 * Password Management Routes
 */
// Request password reset
router.post('/password-reset/request', AuthController.requestPasswordReset);

// Reset password with token
router.post('/password-reset/reset', AuthController.resetPassword);

/**
 * Wallet Authentication Routes
 */
// Generate nonce for wallet authentication
router.post('/wallet/nonce', AuthController.generateWalletNonce);

// Authenticate with wallet
router.post('/wallet/auth', AuthController.walletAuth);

// Link wallet to existing account
router.post('/wallet/link', 
  authMiddleware.authenticate, 
  AuthController.linkWallet
);

export default router;