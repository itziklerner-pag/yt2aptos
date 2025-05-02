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
 * Web3/Aptos Authentication Routes
 */
// Generate challenge for wallet authentication
router.get('/web3/challenge', AuthController.generateWalletNonce);

// Verify wallet signature and authenticate
router.post('/web3/verify', AuthController.walletAuth);

// Get Web3 user profile
router.get('/web3/profile',
  authMiddleware.authenticate,
  authMiddleware.requireWalletAuth,
  AuthController.getCurrentUser
);

// Link wallet to existing account
router.post('/web3/link',
  authMiddleware.authenticate,
  AuthController.linkWallet
);

export default router;