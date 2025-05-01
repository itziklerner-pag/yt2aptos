import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, UserDocument, UserModel } from '../models/user.model';
import {
  AuthResponse,
  AuthTokens,
  JwtPayload,
  LoginRequest,
  RegisterRequest,
  UserDTO,
  UserRole,
  Permission,
  ROLE_PERMISSIONS,
  AuthMethod,
  RefreshTokenRequest,
  PasswordResetRequest,
  PasswordUpdateRequest
} from '@yt2aptos/shared';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/**
 * Token model to manage refresh tokens
 */
interface TokenDocument {
  userId: string;
  token: string;
  expiresAt: Date;
  blacklisted: boolean;
}

/**
 * Authentication service that handles user authentication and authorization
 */
class AuthService {
  private readonly SALT_ROUNDS = 10;
  private readonly ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
  private readonly REFRESH_TOKEN_EXPIRY = '7d'; // 7 days
  private readonly PASSWORD_RESET_EXPIRY = 3600 * 1000; // 1 hour in milliseconds
  private readonly JWT_REFRESH_SECRET = env.JWT_SECRET + '_refresh'; // Using main JWT secret with suffix for refresh
  
  // In production, use a separate collection
  private readonly refreshTokens: Map<string, TokenDocument> = new Map();
  private readonly resetTokens: Map<string, { userId: string, expiresAt: number }> = new Map();
  
  /**
   * Register a new user with traditional authentication
   */
  public async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await UserModel.findOne({
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
      const newUser = new UserModel({
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        displayName: userData.displayName || userData.username,
        isAdmin: false,
        role: UserRole.USER,
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
    } catch (error) {
      logger.error('User registration error:', error);
      throw error;
    }
  }
  
  /**
   * Login with username and password
   */
  public async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      // Find user by username
      const user = await UserModel.findOne({ username: credentials.username });
      
      if (!user) {
        throw new Error('Invalid username or password');
      }
      
      // Verify password
      const isPasswordValid = await this.verifyPassword(credentials.password, user.password!);
      
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
    } catch (error) {
      logger.error('User login error:', error);
      throw error;
    }
  }
  
  /**
   * Logout user by blacklisting their refresh token
   */
  public async logout(refreshToken: string): Promise<void> {
    try {
      const tokenData = this.refreshTokens.get(refreshToken);
      
      if (tokenData) {
        tokenData.blacklisted = true;
        this.refreshTokens.set(refreshToken, tokenData);
      }
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }
  
  /**
   * Refresh access token using refresh token
   */
  public async refreshToken(tokenRequest: RefreshTokenRequest): Promise<AuthTokens> {
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
      const user = await UserModel.findById(tokenData.userId);
      
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
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw error;
    }
  }
  
  /**
   * Validate access token and get user data
   */
  public async validateToken(token: string): Promise<JwtPayload> {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      return decoded;
    } catch (error) {
      logger.error('Token validation error:', error);
      throw new Error('Invalid token');
    }
  }
  
  /**
   * Request password reset
   */
  public async requestPasswordReset(request: PasswordResetRequest): Promise<{ message: string }> {
    try {
      // Find user by email
      const user = await UserModel.findOne({ email: request.email });
      
      if (!user) {
        // For security reasons, don't reveal that email doesn't exist
        return { message: 'If your email is registered, you will receive a password reset link' };
      }
      
      // Generate a random token
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // Store the token with expiry
      this.resetTokens.set(resetToken, {
        userId: user.id,
        expiresAt: Date.now() + this.PASSWORD_RESET_EXPIRY
      });
      
      // In a real application, send an email with the reset link
      logger.info(`Password reset token for ${user.email}: ${resetToken}`);
      
      return { message: 'If your email is registered, you will receive a password reset link' };
    } catch (error) {
      logger.error('Password reset request error:', error);
      throw error;
    }
  }
  
  /**
   * Reset password with token
   */
  public async resetPassword(request: PasswordUpdateRequest): Promise<{ message: string }> {
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
      const user = await UserModel.findById(tokenData.userId);
      
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
    } catch (error) {
      logger.error('Password reset error:', error);
      throw error;
    }
  }
  
  /**
   * Check if user has a specific permission
   */
  public hasPermission(user: UserDocument | JwtPayload, permission: Permission): boolean {
    if ('userId' in user) {
      // It's a JwtPayload
      return user.permissions.includes(permission);
    } else {
      // It's a UserDocument
      const permissions = ROLE_PERMISSIONS[user.role as UserRole];
      return permissions.includes(permission);
    }
  }
  
  /**
   * Get user permissions based on role
   */
  public getUserPermissions(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role];
  }
  
  /**
   * Hash a password
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }
  
  /**
   * Verify a password against a hash
   */
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
  
  /**
   * Generate access and refresh tokens
   */
  private generateTokens(user: UserDocument): AuthTokens {
    const payload: JwtPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role as UserRole,
      authMethod: AuthMethod.TRADITIONAL,
      permissions: this.getUserPermissions(user.role as UserRole),
      ...(user.walletAddress && { walletAddress: user.walletAddress })
    };
    
    const accessToken = jwt.sign(
      payload,
      env.JWT_SECRET,
      { expiresIn: this.ACCESS_TOKEN_EXPIRY }
    );
    
    const refreshToken = jwt.sign(
      { userId: user.id },
      this.JWT_REFRESH_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRY }
    );
    
    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60 // 15 minutes in seconds
    };
  }
  
  /**
   * Store refresh token
   */
  private storeRefreshToken(userId: string, token: string): void {
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
  private mapUserToDTO(user: UserDocument): UserDTO {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role as UserRole,
      walletAddress: user.walletAddress,
      isEmailVerified: user.isEmailVerified,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}

export default new AuthService();