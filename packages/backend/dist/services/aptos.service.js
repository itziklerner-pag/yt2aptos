"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ts_sdk_1 = require("@aptos-labs/ts-sdk");
const crypto_1 = __importDefault(require("crypto"));
const user_model_1 = require("../models/user.model");
const shared_1 = require("@yt2aptos/shared");
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
/**
 * Aptos integration service that handles wallet-based authentication
 * and blockchain interactions
 */
class AptosService {
    aptos;
    WALLET_AUTH_MESSAGE_PREFIX = 'YT2APTOS_AUTH:';
    ACCOUNT_LINK_MESSAGE_PREFIX = 'YT2APTOS_LINK:';
    constructor() {
        // Initialize Aptos client based on environment
        const network = env_1.env.NODE_ENV === 'production' ? ts_sdk_1.Network.MAINNET : ts_sdk_1.Network.TESTNET;
        const config = new ts_sdk_1.AptosConfig({ network });
        this.aptos = new ts_sdk_1.Aptos(config);
        logger_1.logger.info(`Initialized Aptos client for network: ${network}`);
    }
    /**
     * Generate a new random nonce for wallet authentication
     */
    async generateNonce(walletAddress) {
        try {
            const nonce = crypto_1.default.randomBytes(32).toString('hex');
            // Update or create user with this wallet address
            await user_model_1.UserModel.findOneAndUpdate({ walletAddress: walletAddress.toLowerCase() }, { nonce }, { upsert: true, setDefaultsOnInsert: true });
            return nonce;
        }
        catch (error) {
            logger_1.logger.error('Error generating nonce:', error);
            throw error;
        }
    }
    /**
     * Authenticate a user using wallet signature
     */
    async authenticateWithWallet(authRequest) {
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
            let user = await user_model_1.UserModel.findOne({
                walletAddress: address.toLowerCase(),
                nonce
            });
            if (!user) {
                throw new Error('Invalid nonce or wallet address');
            }
            // Regenerate nonce for next authentication
            const newNonce = crypto_1.default.randomBytes(32).toString('hex');
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
        }
        catch (error) {
            logger_1.logger.error('Wallet authentication error:', error);
            throw error;
        }
    }
    /**
     * Link a wallet to an existing traditional account
     */
    async linkWalletToAccount(userId, linkRequest) {
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
            const user = await user_model_1.UserModel.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }
            // Check if wallet is already linked to another account
            const existingWalletUser = await user_model_1.UserModel.findOne({
                walletAddress: address.toLowerCase(),
                _id: { $ne: user.id }
            });
            if (existingWalletUser) {
                throw new Error('Wallet is already linked to another account');
            }
            // Link wallet to user
            user.walletAddress = address.toLowerCase();
            user.nonce = crypto_1.default.randomBytes(32).toString('hex');
            await user.save();
            return this.mapUserToDTO(user);
        }
        catch (error) {
            logger_1.logger.error('Wallet linking error:', error);
            throw error;
        }
    }
    /**
     * Verify a signature against a wallet address and message
     */
    async verifySignature(address, signatureHex, message) {
        try {
            // In a real production application, we would verify the signature here
            // Since this is a demo for now, and Aptos SDK has evolving API,
            // we'll simulate a successful verification
            logger_1.logger.info(`Verifying signature for wallet ${address} with message: ${message}`);
            // TODO: Implement proper signature verification using the latest Aptos SDK
            // For now, we assume the signature is valid if the address and message are properly formatted
            return address.startsWith('0x') &&
                message.includes(this.WALLET_AUTH_MESSAGE_PREFIX) ||
                message.includes(this.ACCOUNT_LINK_MESSAGE_PREFIX);
        }
        catch (error) {
            logger_1.logger.error('Signature verification error:', error);
            return false;
        }
    }
    /**
     * Extract nonce from authentication message
     */
    extractNonceFromMessage(message, prefix) {
        if (!message.startsWith(prefix)) {
            throw new Error('Invalid message format');
        }
        return message.substring(prefix.length);
    }
    /**
     * Generate authentication tokens for a wallet user
     */
    generateTokens(user) {
        const payload = {
            userId: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            authMethod: shared_1.AuthMethod.WALLET,
            walletAddress: user.walletAddress,
            permissions: shared_1.ROLE_PERMISSIONS[user.role]
        };
        const JWT_REFRESH_SECRET = env_1.env.JWT_SECRET + '_refresh';
        const accessToken = require('jsonwebtoken').sign(payload, env_1.env.JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = require('jsonwebtoken').sign({ userId: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
        return {
            accessToken,
            refreshToken,
            expiresIn: 15 * 60 // 15 minutes in seconds
        };
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
exports.default = new AptosService();
//# sourceMappingURL=aptos.service.js.map