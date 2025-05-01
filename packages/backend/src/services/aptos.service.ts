import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import crypto from 'crypto';
import { User, UserDocument, UserModel } from '../models/user.model';
import { 
  AuthResponse,
  AuthTokens,
  JwtPayload,
  UserDTO,
  UserRole,
  AuthMethod,
  WalletAuthRequest,
  AccountLinkRequest,
  ROLE_PERMISSIONS
} from '@yt2aptos/shared';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/**
 * Aptos integration service that handles wallet-based authentication
 * and blockchain interactions
 */
class AptosService {
  private readonly aptos: Aptos;
  private readonly WALLET_AUTH_MESSAGE_PREFIX = 'YT2APTOS_AUTH:';
  private readonly ACCOUNT_LINK_MESSAGE_PREFIX = 'YT2APTOS_LINK:';
  
  constructor() {
    // Initialize Aptos client based on environment
    const network = env.NODE_ENV === 'production' ? Network.MAINNET : Network.TESTNET;
    const config = new AptosConfig({ network });
    this.aptos = new Aptos(config);
    
    logger.info(`Initialized Aptos client for network: ${network}`);
  }
  
  /**
   * Generate a new random nonce for wallet authentication
   */
  public async generateNonce(walletAddress: string): Promise<string> {
    try {
      const nonce = crypto.randomBytes(32).toString('hex');
      
      // Update or create user with this wallet address
      await UserModel.findOneAndUpdate(
        { walletAddress: walletAddress.toLowerCase() },
        { nonce },
        { upsert: true, setDefaultsOnInsert: true }
      );
      
      return nonce;
    } catch (error) {
      logger.error('Error generating nonce:', error);
      throw error;
    }
  }
  
  /**
   * Authenticate a user using wallet signature
   */
  public async authenticateWithWallet(authRequest: WalletAuthRequest): Promise<AuthResponse> {
    try {
      const { address, signature, message } = authRequest;
      
      // Validate the signature and message
      const isValidSignature = await this.verifySignature(address, signature, message);
      
      if (!isValidSignature) {
        throw new Error('Invalid signature');
      }
      
      // Extract nonce from message
      const nonce = this.extractNonceFromMessage(message, this.WALLET_AUTH_MESSAGE_PREFIX);
      
      // Find user by wallet address
      let user = await UserModel.findOne({ 
        walletAddress: address.toLowerCase(),
        nonce
      });
      
      if (!user) {
        throw new Error('Invalid nonce or wallet address');
      }
      
      // Regenerate nonce for next authentication
      const newNonce = crypto.randomBytes(32).toString('hex');
      user.nonce = newNonce;
      user.lastLogin = new Date();
      
      // Update or create appropriate user fields
      if (!user.username) {
        user.username = `wallet_${address.substring(0, 8)}`;
      }
      
      await user.save();
      
      // Generate tokens
      const tokens = this.generateTokens(user);
      
      return {
        user: this.mapUserToDTO(user),
        tokens
      };
    } catch (error) {
      logger.error('Wallet authentication error:', error);
      throw error;
    }
  }
  
  /**
   * Link a wallet to an existing traditional account
   */
  public async linkWalletToAccount(userId: string, linkRequest: AccountLinkRequest): Promise<UserDTO> {
    try {
      const { address, signature, message } = linkRequest;
      
      // Validate the signature and message
      const isValidSignature = await this.verifySignature(address, signature, message);
      
      if (!isValidSignature) {
        throw new Error('Invalid signature');
      }
      
      // Extract nonce from message
      const nonce = this.extractNonceFromMessage(message, this.ACCOUNT_LINK_MESSAGE_PREFIX);
      
      // Find user by ID
      const user = await UserModel.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Check if wallet is already linked to another account
      const existingWalletUser = await UserModel.findOne({ 
        walletAddress: address.toLowerCase(),
        _id: { $ne: user.id }
      });
      
      if (existingWalletUser) {
        throw new Error('Wallet is already linked to another account');
      }
      
      // Link wallet to user
      user.walletAddress = address.toLowerCase();
      user.nonce = crypto.randomBytes(32).toString('hex');
      await user.save();
      
      return this.mapUserToDTO(user);
    } catch (error) {
      logger.error('Wallet linking error:', error);
      throw error;
    }
  }
  
  /**
   * Verify a signature against a wallet address and message
   */
  private async verifySignature(address: string, signatureHex: string, message: string): Promise<boolean> {
    try {
      // In a real production application, we would verify the signature here
      // Since this is a demo for now, and Aptos SDK has evolving API,
      // we'll simulate a successful verification
      
      logger.info(`Verifying signature for wallet ${address} with message: ${message}`);
      
      // TODO: Implement proper signature verification using the latest Aptos SDK
      // For now, we assume the signature is valid if the address and message are properly formatted
      return address.startsWith('0x') &&
             message.includes(this.WALLET_AUTH_MESSAGE_PREFIX) ||
             message.includes(this.ACCOUNT_LINK_MESSAGE_PREFIX);
    } catch (error) {
      logger.error('Signature verification error:', error);
      return false;
    }
  }
  
  /**
   * Extract nonce from authentication message
   */
  private extractNonceFromMessage(message: string, prefix: string): string {
    if (!message.startsWith(prefix)) {
      throw new Error('Invalid message format');
    }
    
    return message.substring(prefix.length);
  }
  
  /**
   * Generate authentication tokens for a wallet user
   */
  private generateTokens(user: UserDocument): AuthTokens {
    const payload: JwtPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role as UserRole,
      authMethod: AuthMethod.WALLET,
      walletAddress: user.walletAddress,
      permissions: ROLE_PERMISSIONS[user.role as UserRole]
    };
    
    const JWT_REFRESH_SECRET = env.JWT_SECRET + '_refresh';
    
    const accessToken = require('jsonwebtoken').sign(
      payload,
      env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    const refreshToken = require('jsonwebtoken').sign(
      { userId: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
    
    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60 // 15 minutes in seconds
    };
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

export default new AptosService();