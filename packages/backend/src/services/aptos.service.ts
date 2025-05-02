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
        // If user doesn't exist with this wallet, create a new one
        const walletProperties = await this.getWalletProperties(address);
        
        user = new UserModel({
          username: `wallet_${address.substring(0, 8)}`,
          email: `${address.substring(0, 10)}@wallet.user`,
          password: crypto.randomBytes(32).toString('hex'), // Random password since login is wallet-based
          walletAddress: address.toLowerCase(),
          nonce,
          role: walletProperties.recommendedRole,
          isEmailVerified: true, // Auto-verify for wallet users
          profile: {
            hasSpecialNft: walletProperties.hasSpecialNft,
            tokenBalance: walletProperties.tokenBalance
          }
        });
      } else {
        // For existing users, we might want to update their role based on current wallet properties
        const walletProperties = await this.getWalletProperties(address);
        
        // Only update role if wallet has special properties and user isn't already an admin
        if (walletProperties.recommendedRole === 'admin' && user.role !== 'admin') {
          user.role = 'admin';
          user.profile.hasSpecialNft = walletProperties.hasSpecialNft;
          user.profile.tokenBalance = walletProperties.tokenBalance;
        }
      }
      
      // Regenerate nonce for next authentication
      const newNonce = crypto.randomBytes(32).toString('hex');
      user.nonce = newNonce;
      user.lastLogin = new Date();
      
      await user.save();
      
      // Generate tokens with appropriate permissions
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
      
      // Get wallet properties for potential role upgrades
      const walletProperties = await this.getWalletProperties(address);
      
      // Link wallet to user
      user.walletAddress = address.toLowerCase();
      user.nonce = crypto.randomBytes(32).toString('hex');
      
      // If wallet has special properties that would grant higher permissions,
      // update the user's role unless they're already an admin
      if (walletProperties.recommendedRole === 'admin' && user.role !== 'admin') {
        user.role = 'admin';
        logger.info(`User ${user.id} role upgraded to admin based on wallet properties`);
      }
      
      // Store wallet properties in user profile
      if (!user.profile) {
        user.profile = {};
      }
      
      user.profile.hasSpecialNft = walletProperties.hasSpecialNft;
      user.profile.tokenBalance = walletProperties.tokenBalance;
      user.profile.walletLastChecked = new Date();
      
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
      logger.info(`Verifying signature for wallet ${address} with message: ${message}`);
      
      // Validate address format
      if (!address.startsWith('0x')) {
        logger.error('Invalid address format, must start with 0x');
        return false;
      }
      
      // Validate message format
      const isValidMessage = message.includes(this.WALLET_AUTH_MESSAGE_PREFIX) ||
                             message.includes(this.ACCOUNT_LINK_MESSAGE_PREFIX);
      if (!isValidMessage) {
        logger.error('Invalid message format');
        return false;
      }

      try {
        // Using Aptos Account module to verify signature
        // Note: This is a simplified approach - in production, use Aptos's Ed25519 verification
        
        // For compatibility with different SDK versions, we'll use a more robust approach
        // Convert the message to a Uint8Array that can be verified
        const messageBytes = new TextEncoder().encode(message);
        const messageHash = Array.from(messageBytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        
        // Convert hex signature to Uint8Array
        const signatureBytes = hexStringToUint8Array(signatureHex);
        
        // In production, we would use the Aptos SDK's cryptographic methods to verify
        // For now, we'll add this verification logic with basic checks
        // and comment out the actual verification for development purposes
        
        // TODO: In production, uncomment and use actual verification with appropriate Aptos SDK methods
        /*
        const publicKey = await this.aptos.getAccountPublicKey(address);
        const isValid = await ed25519.verify({
          signature: signatureBytes,
          message: messageBytes,
          publicKey: publicKey
        });
        */
        
        // For development, we'll consider the signature valid if formatted correctly
        const isValidSignature = signatureHex.startsWith('0x') && signatureHex.length >= 128;
        logger.info(`Development signature verification (bypass): ${isValidSignature}`);
        
        // In production, replace with actual verification
        return isValidSignature;
      } catch (verifyError) {
        logger.error('Signature verification error:', verifyError);
        return false;
      }
    } catch (error) {
      logger.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Get wallet NFT properties to determine roles
   * @param address Wallet address to check for NFTs or other properties
   * @returns Role assignment info based on wallet properties
   */
  public async getWalletProperties(address: string): Promise<{
    hasSpecialNft: boolean,
    tokenBalance: number,
    recommendedRole: string
  }> {
    try {
      // Query Aptos blockchain for wallet NFTs, tokens, or other properties
      // that might determine role assignments
      
      // This is a simplified implementation
      // In a real application, we would query the blockchain for:
      // 1. NFT ownership
      // 2. Token balances
      // 3. Other on-chain properties
      
      const resources = await this.aptos.getAccountResources({
        accountAddress: address,
      });
      
      // Check for specific resources that might indicate special permissions
      // This is just an example and should be customized based on your specific NFTs/tokens
      let hasSpecialNft = false;
      let tokenBalance = 0;
      
      for (const resource of resources) {
        // Example: Check for a specific NFT collection
        if (resource.type.includes('::collection::')) {
          hasSpecialNft = true;
        }
        
        // Example: Check for token balances
        if (resource.type.includes('::coin::')) {
          tokenBalance = parseInt((resource.data as any).coin?.value || '0', 10);
        }
      }
      
      // Determine recommended role based on wallet properties
      let recommendedRole = 'user';
      if (hasSpecialNft && tokenBalance > 1000) {
        recommendedRole = 'admin';
      }
      
      return {
        hasSpecialNft,
        tokenBalance,
        recommendedRole,
      };
    } catch (error) {
      logger.error('Error getting wallet properties:', error);
      return {
        hasSpecialNft: false,
        tokenBalance: 0,
        recommendedRole: 'user',
      };
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

/**
 * Helper function to convert hex string to Uint8Array
 */
function hexStringToUint8Array(hexString: string): Uint8Array {
  // Remove '0x' prefix if present
  if (hexString.startsWith('0x')) {
    hexString = hexString.slice(2);
  }
  
  // Ensure even length
  if (hexString.length % 2 !== 0) {
    hexString = '0' + hexString;
  }
  
  const arrayBuffer = new Uint8Array(hexString.length / 2);
  
  for (let i = 0; i < hexString.length; i += 2) {
    const byteValue = parseInt(hexString.substring(i, i + 2), 16);
    arrayBuffer[i / 2] = byteValue;
  }
  
  return arrayBuffer;
}

export default new AptosService();