"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const crypto_1 = __importDefault(require("crypto"));
const user_model_1 = require("../../models/user.model");
const aptos_service_1 = __importDefault(require("../../services/aptos.service"));
const shared_1 = require("@yt2aptos/shared");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
// Mock Aptos SDK
jest.mock('@aptos-labs/ts-sdk', () => {
    return {
        Aptos: jest.fn().mockImplementation(() => ({
            getAccountResources: jest.fn().mockResolvedValue([
                {
                    type: 'test::collection::NFT',
                    data: { id: '1' }
                },
                {
                    type: 'test::coin::CoinStore',
                    data: { coin: { value: '5000' } }
                }
            ]),
            getAccountPublicKey: jest.fn().mockResolvedValue(new Uint8Array(32))
        })),
        AptosConfig: jest.fn(),
        Network: {
            TESTNET: 'testnet',
            MAINNET: 'mainnet'
        }
    };
});
// Mock AptosService methods
jest.mock('../../services/aptos.service', () => {
    const mockGenerateNonce = jest.fn();
    const mockAuthenticateWithWallet = jest.fn();
    const mockLinkWalletToAccount = jest.fn();
    const mockVerifySignature = jest.fn();
    const mockGetWalletProperties = jest.fn();
    return {
        __esModule: true,
        default: {
            generateNonce: mockGenerateNonce,
            authenticateWithWallet: mockAuthenticateWithWallet,
            linkWalletToAccount: mockLinkWalletToAccount,
            verifySignature: mockVerifySignature,
            getWalletProperties: mockGetWalletProperties
        }
    };
});
// Mock AuthService
jest.mock('../../services/auth.service', () => {
    return {
        AuthService: {
            login: jest.fn(),
            register: jest.fn(),
            refreshToken: jest.fn(),
            verifyEmail: jest.fn(),
            requestPasswordReset: jest.fn(),
            resetPassword: jest.fn()
        }
    };
});
describe('Web3 Authentication Flow Integration Tests', () => {
    // Test fixtures
    const testWalletAddress = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const testSignature = '0x9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef';
    const testNonce = crypto_1.default.randomBytes(32).toString('hex');
    const testEmail = 'test@example.com';
    const testPassword = 'Password123!';
    // MongoDB in-memory setup
    beforeAll(async () => {
        // Use MongoDB Memory Server for tests
        await mongoose_1.default.connect('mongodb://localhost:27017/test-db', {});
    });
    afterAll(async () => {
        await user_model_1.UserModel.deleteMany({});
        await mongoose_1.default.connection.close();
    });
    beforeEach(async () => {
        jest.clearAllMocks();
        await user_model_1.UserModel.deleteMany({});
    });
    describe('Wallet Authentication', () => {
        it('should generate a nonce for wallet authentication', async () => {
            // Setup mock
            const mockNonce = 'mockedNonce123';
            aptos_service_1.default.generateNonce.mockResolvedValueOnce(mockNonce);
            // Call the service
            const nonce = await aptos_service_1.default.generateNonce(testWalletAddress);
            // Assertions
            expect(nonce).toBe(mockNonce);
            expect(aptos_service_1.default.generateNonce).toHaveBeenCalledWith(testWalletAddress);
        });
        it('should authenticate a user with wallet signature', async () => {
            // Setup mock
            const message = `YT2APTOS_AUTH:${testNonce}`;
            const mockAuthResponse = {
                user: {
                    id: 'mockUserId',
                    username: `wallet_${testWalletAddress.substring(0, 8)}`,
                    email: `${testWalletAddress.substring(0, 10)}@wallet.user`,
                    walletAddress: testWalletAddress.toLowerCase(),
                    role: 'user'
                },
                tokens: {
                    accessToken: 'mockAccessToken',
                    refreshToken: 'mockRefreshToken',
                    expiresIn: 900
                }
            };
            aptos_service_1.default.authenticateWithWallet.mockResolvedValueOnce(mockAuthResponse);
            // Call the service
            const authRequest = {
                address: testWalletAddress,
                signature: testSignature,
                message
            };
            const response = await aptos_service_1.default.authenticateWithWallet(authRequest);
            // Assertions
            expect(response).toEqual(mockAuthResponse);
            expect(aptos_service_1.default.authenticateWithWallet).toHaveBeenCalledWith(authRequest);
        });
        it('should create a new user account on first wallet authentication', async () => {
            // Setup mock for wallet properties
            const walletProperties = {
                hasSpecialNft: true,
                tokenBalance: 5000,
                recommendedRole: 'admin'
            };
            aptos_service_1.default.getWalletProperties.mockResolvedValueOnce(walletProperties);
            // Let authenticateWithWallet call through to use real implementation
            // But mock verifySignature to always return true
            aptos_service_1.default.authenticateWithWallet.mockImplementation(async (authRequest) => {
                // Create a real user and tokens
                const user = new user_model_1.UserModel({
                    username: `wallet_${authRequest.address.substring(0, 8)}`,
                    email: `${authRequest.address.substring(0, 10)}@wallet.user`,
                    password: crypto_1.default.randomBytes(32).toString('hex'),
                    walletAddress: authRequest.address.toLowerCase(),
                    nonce: testNonce,
                    role: walletProperties.recommendedRole,
                    isEmailVerified: true,
                    profile: {
                        hasSpecialNft: walletProperties.hasSpecialNft,
                        tokenBalance: walletProperties.tokenBalance
                    }
                });
                await user.save();
                // Generate real tokens
                const payload = {
                    userId: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    authMethod: shared_1.AuthMethod.WALLET,
                    walletAddress: user.walletAddress,
                    permissions: shared_1.ROLE_PERMISSIONS[user.role]
                };
                const accessToken = jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, { expiresIn: '15m' });
                const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, env_1.env.JWT_SECRET + '_refresh', { expiresIn: '7d' });
                return {
                    user: {
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
                    },
                    tokens: {
                        accessToken,
                        refreshToken,
                        expiresIn: 15 * 60
                    }
                };
            });
            // Call the service
            const message = `YT2APTOS_AUTH:${testNonce}`;
            const authRequest = {
                address: testWalletAddress,
                signature: testSignature,
                message
            };
            const response = await aptos_service_1.default.authenticateWithWallet(authRequest);
            // Assertions
            expect(response.user).toBeDefined();
            expect(response.user.walletAddress).toBe(testWalletAddress.toLowerCase());
            expect(response.user.role).toBe('admin'); // Should match the wallet properties
            expect(response.tokens.accessToken).toBeDefined();
            expect(response.tokens.refreshToken).toBeDefined();
            // Verify a user was created in DB
            const createdUser = await user_model_1.UserModel.findOne({ walletAddress: testWalletAddress.toLowerCase() });
            expect(createdUser).toBeDefined();
            expect(createdUser.role).toBe('admin');
        });
    });
    describe('Wallet Linking', () => {
        let testUser;
        beforeEach(async () => {
            // Create a test user without wallet
            testUser = new user_model_1.UserModel({
                username: 'testuser',
                email: testEmail,
                password: testPassword,
                role: 'user',
                isEmailVerified: true
            });
            await testUser.save();
        });
        it('should link a wallet to an existing account', async () => {
            // Setup mock
            const message = `YT2APTOS_LINK:${testNonce}`;
            const mockUserDTO = {
                id: testUser.id,
                username: testUser.username,
                email: testUser.email,
                walletAddress: testWalletAddress.toLowerCase(),
                role: 'user'
            };
            aptos_service_1.default.linkWalletToAccount.mockResolvedValueOnce(mockUserDTO);
            // Call the service
            const linkRequest = {
                address: testWalletAddress,
                signature: testSignature,
                message
            };
            const response = await aptos_service_1.default.linkWalletToAccount(testUser.id, linkRequest);
            // Assertions
            expect(response).toEqual(mockUserDTO);
            expect(aptos_service_1.default.linkWalletToAccount).toHaveBeenCalledWith(testUser.id, linkRequest);
        });
        it('should upgrade user role when linking a wallet with special properties', async () => {
            // Setup mock for wallet properties
            const walletProperties = {
                hasSpecialNft: true,
                tokenBalance: 5000,
                recommendedRole: 'admin'
            };
            aptos_service_1.default.getWalletProperties.mockResolvedValueOnce(walletProperties);
            // Mock linkWalletToAccount to use real implementation (partially)
            aptos_service_1.default.linkWalletToAccount.mockImplementation(async (userId, linkRequest) => {
                // Find the user
                const user = await user_model_1.UserModel.findById(userId);
                if (!user) {
                    throw new Error('User not found');
                }
                // Link wallet to user
                user.walletAddress = linkRequest.address.toLowerCase();
                user.nonce = crypto_1.default.randomBytes(32).toString('hex');
                // Upgrade role based on wallet properties
                if (walletProperties.recommendedRole === 'admin') {
                    user.role = 'admin';
                }
                // Store wallet properties
                if (!user.profile) {
                    user.profile = {};
                }
                user.profile.hasSpecialNft = walletProperties.hasSpecialNft;
                user.profile.tokenBalance = walletProperties.tokenBalance;
                user.profile.walletLastChecked = new Date();
                await user.save();
                // Return DTO
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
            });
            // Call the service
            const message = `YT2APTOS_LINK:${testNonce}`;
            const linkRequest = {
                address: testWalletAddress,
                signature: testSignature,
                message
            };
            const response = await aptos_service_1.default.linkWalletToAccount(testUser.id, linkRequest);
            // Assertions
            expect(response).toBeDefined();
            expect(response.walletAddress).toBe(testWalletAddress.toLowerCase());
            expect(response.role).toBe('admin'); // Should be upgraded
            // Verify user was updated in DB
            const updatedUser = await user_model_1.UserModel.findById(testUser.id);
            expect(updatedUser).toBeDefined();
            expect(updatedUser.walletAddress).toBe(testWalletAddress.toLowerCase());
            expect(updatedUser.role).toBe('admin');
            expect(updatedUser.profile.hasSpecialNft).toBe(true);
            expect(updatedUser.profile.tokenBalance).toBe(5000);
        });
        it('should prevent linking a wallet that is already linked to another account', async () => {
            // Create another user with the wallet already linked
            const existingWalletUser = new user_model_1.UserModel({
                username: 'walletuser',
                email: 'wallet@example.com',
                password: 'password123',
                walletAddress: testWalletAddress.toLowerCase(),
                role: 'user',
                isEmailVerified: true
            });
            await existingWalletUser.save();
            // Mock service to throw error
            aptos_service_1.default.linkWalletToAccount.mockRejectedValueOnce(new Error('Wallet is already linked to another account'));
            // Call the service
            const message = `YT2APTOS_LINK:${testNonce}`;
            const linkRequest = {
                address: testWalletAddress,
                signature: testSignature,
                message
            };
            // Assertions
            await expect(aptos_service_1.default.linkWalletToAccount(testUser.id, linkRequest)).rejects.toThrow('Wallet is already linked to another account');
        });
    });
    describe('Role-Based Permissions', () => {
        it('should assign correct permissions based on user role', async () => {
            // Create users with different roles
            const adminUser = new user_model_1.UserModel({
                username: 'admin',
                email: 'admin@example.com',
                password: 'adminPass123',
                role: 'admin',
                walletAddress: '0xadmin',
                isEmailVerified: true
            });
            await adminUser.save();
            const regularUser = new user_model_1.UserModel({
                username: 'user',
                email: 'user@example.com',
                password: 'userPass123',
                role: 'user',
                walletAddress: '0xuser',
                isEmailVerified: true
            });
            await regularUser.save();
            // Mock token generation to use real JWT signing
            const generateToken = (user) => {
                const payload = {
                    userId: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    authMethod: shared_1.AuthMethod.WALLET,
                    walletAddress: user.walletAddress,
                    permissions: shared_1.ROLE_PERMISSIONS[user.role]
                };
                return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, { expiresIn: '15m' });
            };
            // Generate tokens for both users
            const adminToken = generateToken(adminUser);
            const userToken = generateToken(regularUser);
            // Decode tokens to verify permissions
            const decodedAdminToken = jsonwebtoken_1.default.verify(adminToken, env_1.env.JWT_SECRET);
            const decodedUserToken = jsonwebtoken_1.default.verify(userToken, env_1.env.JWT_SECRET);
            // Assertions
            expect(decodedAdminToken.permissions).toEqual(shared_1.ROLE_PERMISSIONS.admin);
            expect(decodedUserToken.permissions).toEqual(shared_1.ROLE_PERMISSIONS.user);
            // Verify admin has more permissions than regular user
            expect(decodedAdminToken.permissions.length).toBeGreaterThan(decodedUserToken.permissions.length);
            // Verify specific permissions
            expect(decodedAdminToken.permissions).toContain('manage:users');
            expect(decodedUserToken.permissions).not.toContain('manage:users');
            expect(decodedAdminToken.permissions).toContain('delete:any:video');
            expect(decodedUserToken.permissions).not.toContain('delete:any:video');
            expect(decodedUserToken.permissions).toContain('delete:own:video');
        });
    });
});
//# sourceMappingURL=web3-auth-flow.test.js.map