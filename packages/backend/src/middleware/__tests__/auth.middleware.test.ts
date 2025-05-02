import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../auth.middleware';
import authService from '../../services/auth.service';
import { JwtPayload, AuthMethod, UserRole, Permission } from '@yt2aptos/shared';

jest.mock('../../services/auth.service');

describe('AuthMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

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
      const mockPayload: JwtPayload = {
        userId: '123',
        username: 'testuser',
        email: 'test@example.com',
        role: UserRole.USER,
        authMethod: AuthMethod.TRADITIONAL,
        permissions: []
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };

      (authService.validateToken as jest.Mock).mockResolvedValue(mockPayload);

      await authMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(authService.validateToken).toHaveBeenCalledWith('valid-token');
      expect(mockRequest.user).toEqual(mockPayload);
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 401 when no token is provided', async () => {
      mockRequest.headers = {};

      await authMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Authentication required' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      };

      (authService.validateToken as jest.Mock).mockRejectedValue(new Error('Invalid token'));

      await authMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

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
        role: UserRole.USER,
        authMethod: AuthMethod.WALLET,
        walletAddress: '0x123456789abcdef',
        permissions: []
      };

      await authMiddleware.requireWalletAuth(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 401 when not authenticated', async () => {
      mockRequest.user = undefined;

      await authMiddleware.requireWalletAuth(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Authentication required' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 403 when not using wallet authentication', async () => {
      mockRequest.user = {
        userId: '123',
        username: 'traditional_user',
        email: 'user@example.com',
        role: UserRole.USER,
        authMethod: AuthMethod.TRADITIONAL,
        permissions: []
      };

      await authMiddleware.requireWalletAuth(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

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
        role: UserRole.USER,
        authMethod: AuthMethod.WALLET, // Wallet auth but no address
        permissions: []
      };

      await authMiddleware.requireWalletAuth(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

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
        role: UserRole.ADMIN,
        authMethod: AuthMethod.WALLET,
        permissions: [Permission.VIEW_CONTENT, Permission.MANAGE_CONTENT, Permission.SYSTEM_ADMIN]
      };

      const middleware = authMiddleware.hasPermission(Permission.MANAGE_CONTENT);
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 403 when user does not have the required permission', async () => {
      mockRequest.user = {
        userId: '123',
        username: 'regular_user',
        email: 'user@example.com',
        role: UserRole.USER,
        authMethod: AuthMethod.WALLET,
        permissions: [Permission.VIEW_CONTENT]
      };

      const middleware = authMiddleware.hasPermission(Permission.MANAGE_CONTENT);
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Insufficient permissions' });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});