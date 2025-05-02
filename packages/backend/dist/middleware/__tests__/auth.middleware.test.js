"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_middleware_1 = require("../auth.middleware");
const auth_service_1 = __importDefault(require("../../services/auth.service"));
const shared_1 = require("@yt2aptos/shared");
jest.mock('../../services/auth.service');
describe('AuthMiddleware', () => {
    let mockRequest;
    let mockResponse;
    let nextFunction;
    beforeEach(() => {
        mockRequest = {};
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        nextFunction = jest.fn();
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('authenticate', () => {
        it('should call next() for valid token', async () => {
            const mockPayload = {
                userId: '123',
                username: 'testuser',
                email: 'test@example.com',
                role: shared_1.UserRole.USER,
                authMethod: shared_1.AuthMethod.TRADITIONAL,
                permissions: []
            };
            mockRequest.headers = {
                authorization: 'Bearer valid-token'
            };
            auth_service_1.default.validateToken.mockResolvedValue(mockPayload);
            await auth_middleware_1.authMiddleware.authenticate(mockRequest, mockResponse, nextFunction);
            expect(auth_service_1.default.validateToken).toHaveBeenCalledWith('valid-token');
            expect(mockRequest.user).toEqual(mockPayload);
            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
        it('should return 401 when no token is provided', async () => {
            mockRequest.headers = {};
            await auth_middleware_1.authMiddleware.authenticate(mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Authentication required' });
            expect(nextFunction).not.toHaveBeenCalled();
        });
        it('should return 401 for invalid token', async () => {
            mockRequest.headers = {
                authorization: 'Bearer invalid-token'
            };
            auth_service_1.default.validateToken.mockRejectedValue(new Error('Invalid token'));
            await auth_middleware_1.authMiddleware.authenticate(mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
            expect(nextFunction).not.toHaveBeenCalled();
        });
    });
    describe('requireWalletAuth', () => {
        it('should call next() for valid wallet authentication', async () => {
            mockRequest.user = {
                userId: '123',
                username: 'wallet_user',
                email: 'wallet@example.com',
                role: shared_1.UserRole.USER,
                authMethod: shared_1.AuthMethod.WALLET,
                walletAddress: '0x123456789abcdef',
                permissions: []
            };
            await auth_middleware_1.authMiddleware.requireWalletAuth(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
        it('should return 401 when not authenticated', async () => {
            mockRequest.user = undefined;
            await auth_middleware_1.authMiddleware.requireWalletAuth(mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Authentication required' });
            expect(nextFunction).not.toHaveBeenCalled();
        });
        it('should return 403 when not using wallet authentication', async () => {
            mockRequest.user = {
                userId: '123',
                username: 'traditional_user',
                email: 'user@example.com',
                role: shared_1.UserRole.USER,
                authMethod: shared_1.AuthMethod.TRADITIONAL,
                permissions: []
            };
            await auth_middleware_1.authMiddleware.requireWalletAuth(mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Wallet authentication required for this endpoint'
            });
            expect(nextFunction).not.toHaveBeenCalled();
        });
        it('should return 403 when no wallet address is present', async () => {
            mockRequest.user = {
                userId: '123',
                username: 'incomplete_user',
                email: 'incomplete@example.com',
                role: shared_1.UserRole.USER,
                authMethod: shared_1.AuthMethod.WALLET, // Wallet auth but no address
                permissions: []
            };
            await auth_middleware_1.authMiddleware.requireWalletAuth(mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'No wallet address associated with this account'
            });
            expect(nextFunction).not.toHaveBeenCalled();
        });
    });
    describe('hasPermission', () => {
        it('should call next() when user has the required permission', async () => {
            mockRequest.user = {
                userId: '123',
                username: 'admin_user',
                email: 'admin@example.com',
                role: shared_1.UserRole.ADMIN,
                authMethod: shared_1.AuthMethod.WALLET,
                permissions: [shared_1.Permission.VIEW_CONTENT, shared_1.Permission.MANAGE_CONTENT, shared_1.Permission.SYSTEM_ADMIN]
            };
            const middleware = auth_middleware_1.authMiddleware.hasPermission(shared_1.Permission.MANAGE_CONTENT);
            await middleware(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
        it('should return 403 when user does not have the required permission', async () => {
            mockRequest.user = {
                userId: '123',
                username: 'regular_user',
                email: 'user@example.com',
                role: shared_1.UserRole.USER,
                authMethod: shared_1.AuthMethod.WALLET,
                permissions: [shared_1.Permission.VIEW_CONTENT]
            };
            const middleware = auth_middleware_1.authMiddleware.hasPermission(shared_1.Permission.MANAGE_CONTENT);
            await middleware(mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Insufficient permissions' });
            expect(nextFunction).not.toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=auth.middleware.test.js.map