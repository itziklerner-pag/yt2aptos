"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
const aptos_service_1 = __importDefault(require("../aptos.service"));
const user_model_1 = require("../../models/user.model");
const crypto_1 = __importDefault(require("crypto"));
describe('AptosService', () => {
    let mongoServer;
    // Test data
    const testWalletAddress = '0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234';
    const testSignature = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
    const testNonce = crypto_1.default.randomBytes(32).toString('hex');
    const testUserId = new mongoose_1.default.Types.ObjectId().toString();
    beforeAll(async () => {
        // Set up MongoDB Memory Server
        mongoServer = await mongodb_memory_server_1.MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose_1.default.connect(uri);
    });
    afterAll(async () => {
        await mongoose_1.default.disconnect();
        await mongoServer.stop();
    });
    beforeEach(async () => {
        // Clear users collection before each test
        await user_model_1.UserModel.deleteMany({});
    });
    describe('generateNonce', () => {
        it('should generate a valid nonce for a wallet address', async () => {
            const nonce = await aptos_service_1.default.generateNonce(testWalletAddress);
            expect(nonce).toBeDefined();
            expect(typeof nonce).toBe('string');
            expect(nonce.length).toBeGreaterThan(16);
            // Verify user was created with the wallet address and nonce
            const user = await user_model_1.UserModel.findOne({ walletAddress: testWalletAddress.toLowerCase() });
            expect(user).toBeDefined();
            expect(user?.nonce).toBe(nonce);
        });
        it('should update nonce for an existing wallet address', async () => {
            // Create a user with the wallet address
            await user_model_1.UserModel.create({
                walletAddress: testWalletAddress.toLowerCase(),
                nonce: 'old-nonce',
                username: 'test_user',
                email: 'test@example.com',
                password: 'password',
            });
            const nonce = await aptos_service_1.default.generateNonce(testWalletAddress);
            // Verify nonce was updated
            const user = await user_model_1.UserModel.findOne({ walletAddress: testWalletAddress.toLowerCase() });
            expect(user?.nonce).toBe(nonce);
            expect(user?.nonce).not.toBe('old-nonce');
        });
    });
    describe('authenticateWithWallet', () => {
        beforeEach(async () => {
            // Create a user with wallet address and nonce
            await user_model_1.UserModel.create({
                walletAddress: testWalletAddress.toLowerCase(),
                nonce: testNonce,
                username: 'wallet_user',
                email: 'wallet@example.com',
                password: 'password',
            });
            // Mock the verifySignature method to return true
            jest.spyOn(aptos_service_1.default, 'verifySignature').mockResolvedValue(true);
            // Mock the getWalletProperties method
            jest.spyOn(aptos_service_1.default, 'getWalletProperties').mockResolvedValue({
                hasSpecialNft: true,
                tokenBalance: 5000,
                recommendedRole: 'admin'
            });
        });
        it('should authenticate a user with valid wallet signature', async () => {
            const authRequest = {
                address: testWalletAddress,
                signature: testSignature,
                message: `YT2APTOS_AUTH:${testNonce}`
            };
            const result = await aptos_service_1.default.authenticateWithWallet(authRequest);
            expect(result).toBeDefined();
            expect(result.user).toBeDefined();
            expect(result.tokens).toBeDefined();
            expect(result.user.walletAddress).toBe(testWalletAddress.toLowerCase());
            // Verify nonce was updated
            const user = await user_model_1.UserModel.findOne({ walletAddress: testWalletAddress.toLowerCase() });
            expect(user?.nonce).not.toBe(testNonce);
        });
        it('should create a new user when wallet is not found', async () => {
            // Delete the test user
            await user_model_1.UserModel.deleteMany({});
            const newWalletAddress = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
            const authRequest = {
                address: newWalletAddress,
                signature: testSignature,
                message: `YT2APTOS_AUTH:${testNonce}`
            };
            const result = await aptos_service_1.default.authenticateWithWallet(authRequest);
            expect(result).toBeDefined();
            expect(result.user).toBeDefined();
            expect(result.user.walletAddress).toBe(newWalletAddress.toLowerCase());
            // Verify a new user was created
            const user = await user_model_1.UserModel.findOne({ walletAddress: newWalletAddress.toLowerCase() });
            expect(user).toBeDefined();
            expect(user?.role).toBe('admin'); // Based on the mocked getWalletProperties
        });
        it('should reject authentication with invalid signature', async () => {
            // Mock the verifySignature method to return false
            aptos_service_1.default.verifySignature.mockResolvedValue(false);
            const authRequest = {
                address: testWalletAddress,
                signature: testSignature,
                message: `YT2APTOS_AUTH:${testNonce}`
            };
            await expect(aptos_service_1.default.authenticateWithWallet(authRequest))
                .rejects.toThrow('Invalid signature');
        });
    });
    describe('linkWalletToAccount', () => {
        beforeEach(async () => {
            // Create a user without wallet address
            await user_model_1.UserModel.create({
                _id: testUserId,
                username: 'existing_user',
                email: 'user@example.com',
                password: 'password',
                role: 'user',
            });
            // Mock the verifySignature method to return true
            jest.spyOn(aptos_service_1.default, 'verifySignature').mockResolvedValue(true);
            // Mock the getWalletProperties method
            jest.spyOn(aptos_service_1.default, 'getWalletProperties').mockResolvedValue({
                hasSpecialNft: true,
                tokenBalance: 5000,
                recommendedRole: 'admin'
            });
        });
        it('should link a wallet to an existing account', async () => {
            const linkRequest = {
                address: testWalletAddress,
                signature: testSignature,
                message: `YT2APTOS_LINK:${testNonce}`
            };
            const result = await aptos_service_1.default.linkWalletToAccount(testUserId, linkRequest);
            expect(result).toBeDefined();
            expect(result.walletAddress).toBe(testWalletAddress.toLowerCase());
            // Verify user was updated
            const user = await user_model_1.UserModel.findById(testUserId);
            expect(user?.walletAddress).toBe(testWalletAddress.toLowerCase());
            expect(user?.role).toBe('admin'); // Role should be upgraded based on wallet properties
            expect(user?.profile.hasSpecialNft).toBe(true);
        });
        it('should reject linking if wallet is already linked to another account', async () => {
            // Create another user with the same wallet address
            await user_model_1.UserModel.create({
                username: 'another_user',
                email: 'another@example.com',
                password: 'password',
                walletAddress: testWalletAddress.toLowerCase(),
            });
            const linkRequest = {
                address: testWalletAddress,
                signature: testSignature,
                message: `YT2APTOS_LINK:${testNonce}`
            };
            await expect(aptos_service_1.default.linkWalletToAccount(testUserId, linkRequest))
                .rejects.toThrow('Wallet is already linked to another account');
        });
        it('should reject linking with invalid signature', async () => {
            // Mock the verifySignature method to return false
            aptos_service_1.default.verifySignature.mockResolvedValue(false);
            const linkRequest = {
                address: testWalletAddress,
                signature: testSignature,
                message: `YT2APTOS_LINK:${testNonce}`
            };
            await expect(aptos_service_1.default.linkWalletToAccount(testUserId, linkRequest))
                .rejects.toThrow('Invalid signature');
        });
    });
    describe('verifySignature', () => {
        it('should verify a valid signature format', async () => {
            // This test calls the actual implementation, not the mock
            jest.restoreAllMocks();
            const message = `YT2APTOS_AUTH:${testNonce}`;
            // For development purposes, our implementation accepts correctly formatted signatures
            const isValid = await aptos_service_1.default.verifySignature(testWalletAddress, testSignature, message);
            expect(isValid).toBe(true);
        });
        it('should reject invalid address format', async () => {
            jest.restoreAllMocks();
            const message = `YT2APTOS_AUTH:${testNonce}`;
            const isValid = await aptos_service_1.default.verifySignature('invalid-address', testSignature, message);
            expect(isValid).toBe(false);
        });
        it('should reject invalid message format', async () => {
            jest.restoreAllMocks();
            const message = `INVALID:${testNonce}`;
            const isValid = await aptos_service_1.default.verifySignature(testWalletAddress, testSignature, message);
            expect(isValid).toBe(false);
        });
    });
});
//# sourceMappingURL=aptos.service.test.js.map