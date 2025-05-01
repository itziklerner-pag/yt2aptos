import { Request, Response } from 'express';
import { 
  LoginRequest, 
  RegisterRequest, 
  RefreshTokenRequest,
  WalletAuthRequest,
  AccountLinkRequest,
  PasswordResetRequest,
  PasswordUpdateRequest
} from '@yt2aptos/shared';
import authService from '../services/auth.service';
import aptosService from '../services/aptos.service';
import { logger } from '../utils/logger';

/**
 * Controller for authentication operations
 */
export class AuthController {
  /**
   * Register a new user
   * @param req Express request
   * @param res Express response
   */
  static async register(req: Request, res: Response) {
    try {
      const userData: RegisterRequest = req.body;
      
      if (!userData.username || !userData.email || !userData.password) {
        return res.status(400).json({
          message: 'Username, email, and password are required'
        });
      }
      
      const result = await authService.register(userData);
      
      return res.status(201).json(result);
    } catch (error) {
      logger.error('Registration error:', error);
      
      // Handle duplicate key errors
      if ((error as any).code === 11000) {
        return res.status(409).json({
          message: 'Username or email already exists'
        });
      }
      
      return res.status(500).json({
        message: 'Registration failed',
        error: (error as Error).message
      });
    }
  }
  
  /**
   * Login a user
   * @param req Express request
   * @param res Express response
   */
  static async login(req: Request, res: Response) {
    try {
      const credentials: LoginRequest = req.body;
      
      if (!credentials.username || !credentials.password) {
        return res.status(400).json({
          message: 'Username and password are required'
        });
      }
      
      const result = await authService.login(credentials);
      
      return res.status(200).json(result);
    } catch (error) {
      logger.error('Login error:', error);
      
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
  static async logout(req: Request, res: Response) {
    try {
      const refreshToken = req.body.refreshToken;
      
      if (!refreshToken) {
        return res.status(400).json({
          message: 'Refresh token is required'
        });
      }
      
      await authService.logout(refreshToken);
      
      return res.status(200).json({
        message: 'Logged out successfully'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      
      return res.status(500).json({
        message: 'Logout failed',
        error: (error as Error).message
      });
    }
  }
  
  /**
   * Refresh an access token
   * @param req Express request
   * @param res Express response
   */
  static async refreshToken(req: Request, res: Response) {
    try {
      const tokenRequest: RefreshTokenRequest = req.body;
      
      if (!tokenRequest.refreshToken) {
        return res.status(400).json({
          message: 'Refresh token is required'
        });
      }
      
      const tokens = await authService.refreshToken(tokenRequest);
      
      return res.status(200).json(tokens);
    } catch (error) {
      logger.error('Token refresh error:', error);
      
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
  static async requestPasswordReset(req: Request, res: Response) {
    try {
      const request: PasswordResetRequest = req.body;
      
      if (!request.email) {
        return res.status(400).json({
          message: 'Email is required'
        });
      }
      
      const result = await authService.requestPasswordReset(request);
      
      return res.status(200).json(result);
    } catch (error) {
      logger.error('Password reset request error:', error);
      
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
  static async resetPassword(req: Request, res: Response) {
    try {
      const request: PasswordUpdateRequest = req.body;
      
      if (!request.resetToken || !request.newPassword) {
        return res.status(400).json({
          message: 'Reset token and new password are required'
        });
      }
      
      const result = await authService.resetPassword(request);
      
      return res.status(200).json(result);
    } catch (error) {
      logger.error('Password reset error:', error);
      
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
  static async generateWalletNonce(req: Request, res: Response) {
    try {
      const { address } = req.body;
      
      if (!address) {
        return res.status(400).json({
          message: 'Wallet address is required'
        });
      }
      
      const nonce = await aptosService.generateNonce(address);
      
      return res.status(200).json({
        message: 'Nonce generated successfully',
        nonce,
        walletAuthPrefix: 'YT2APTOS_AUTH:'
      });
    } catch (error) {
      logger.error('Nonce generation error:', error);
      
      return res.status(500).json({
        message: 'Failed to generate nonce',
        error: (error as Error).message
      });
    }
  }
  
  /**
   * Authenticate using a wallet
   * @param req Express request
   * @param res Express response
   */
  static async walletAuth(req: Request, res: Response) {
    try {
      const authRequest: WalletAuthRequest = req.body;
      
      if (!authRequest.address || !authRequest.signature || !authRequest.message) {
        return res.status(400).json({
          message: 'Wallet address, signature, and message are required'
        });
      }
      
      const result = await aptosService.authenticateWithWallet(authRequest);
      
      return res.status(200).json(result);
    } catch (error) {
      logger.error('Wallet authentication error:', error);
      
      return res.status(401).json({
        message: 'Invalid wallet signature or nonce',
        error: (error as Error).message
      });
    }
  }
  
  /**
   * Link a wallet to an existing account
   * @param req Express request
   * @param res Express response
   */
  static async linkWallet(req: Request, res: Response) {
    try {
      const linkRequest: AccountLinkRequest = req.body;
      
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
      
      const result = await aptosService.linkWalletToAccount(req.user.userId, linkRequest);
      
      return res.status(200).json({
        message: 'Wallet linked successfully',
        user: result
      });
    } catch (error) {
      logger.error('Wallet linking error:', error);
      
      return res.status(400).json({
        message: 'Failed to link wallet',
        error: (error as Error).message
      });
    }
  }
  
  /**
   * Get the currently authenticated user
   * @param req Express request
   * @param res Express response
   */
  static async getCurrentUser(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: 'Authentication required'
        });
      }
      
      return res.status(200).json({
        user: req.user
      });
    } catch (error) {
      logger.error('Get current user error:', error);
      
      return res.status(500).json({
        message: 'Failed to get user information',
        error: (error as Error).message
      });
    }
  }
}