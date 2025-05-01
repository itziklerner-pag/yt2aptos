import { Request, Response, NextFunction } from 'express';
import { 
  errorHandler, 
  notFoundHandler, 
  AppError, 
  NotFoundError, 
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  InternalServerError
} from '../error-handler.middleware';
import * as logger from '../../utils/logger';

// Mock the logger module
jest.mock('../../utils/logger', () => ({
  logError: jest.fn(),
}));

describe('Error Handler Middleware', () => {
  // Setup mocks
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup request and response mocks
    mockRequest = {
      method: 'GET',
      originalUrl: '/test',
    };
    
    jsonMock = jest.fn().mockReturnValue({});
    statusMock = jest.fn().mockReturnThis();
    
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    
    mockNext = jest.fn();
  });

  describe('AppError classes', () => {
    it('should create an AppError with correct properties', () => {
      const error = new AppError('Test error', 400);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
    });

    it('should create a NotFoundError with status 404', () => {
      const error = new NotFoundError('Resource not found');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
    });

    it('should create a BadRequestError with status 400', () => {
      const error = new BadRequestError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Bad request');
      expect(error.statusCode).toBe(400);
    });

    it('should create an UnauthorizedError with status 401', () => {
      const error = new UnauthorizedError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Unauthorized access');
      expect(error.statusCode).toBe(401);
    });

    it('should create a ForbiddenError with status 403', () => {
      const error = new ForbiddenError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Forbidden action');
      expect(error.statusCode).toBe(403);
    });

    it('should create an InternalServerError with status 500 and isOperational=false', () => {
      const error = new InternalServerError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Internal server error');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(false);
    });
  });

  describe('errorHandler middleware', () => {
    it('should handle AppError instances correctly', () => {
      const error = new BadRequestError('Invalid input');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid input',
          details: {},
          stack: expect.any(String),
        },
      });
      expect(logger.logError).toHaveBeenCalledWith('400 - Invalid input', error);
    });

    it('should handle standard Error instances as 500 errors', () => {
      const error = new Error('Unexpected error');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'An unexpected error occurred',
          details: {},
          stack: expect.any(String),
        },
      });
      expect(logger.logError).toHaveBeenCalledWith('Unhandled error', error);
    });

    it('should handle Mongoose validation errors', () => {
      const error: any = new Error('Validation failed');
      error.name = 'ValidationError';
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Validation error',
          details: error,
          stack: expect.any(String),
        },
      });
    });

    it('should handle Mongoose cast errors', () => {
      const error: any = new Error('Cast error');
      error.name = 'CastError';
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid ID format',
          details: error,
          stack: expect.any(String),
        },
      });
    });

    it('should handle MongoDB duplicate key errors', () => {
      const error: any = new Error('Duplicate key');
      error.name = 'MongoError';
      error.code = 11000;
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Duplicate entry',
          details: error,
          stack: expect.any(String),
        },
      });
    });

    it('should handle JWT validation errors', () => {
      const error: any = new Error('Invalid JWT');
      error.name = 'JsonWebTokenError';
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid token',
          details: {},
          stack: expect.any(String),
        },
      });
    });

    it('should handle JWT expiration errors', () => {
      const error: any = new Error('JWT expired');
      error.name = 'TokenExpiredError';
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Token expired',
          details: {},
          stack: expect.any(String),
        },
      });
    });

    it('should exclude stack and details in production environment', () => {
      // Save original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV;
      
      try {
        // Set to production
        process.env.NODE_ENV = 'production';
        
        const error = new BadRequestError('Invalid input');
        
        errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
        
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          success: false,
          error: {
            message: 'Invalid input',
          },
        });
      } finally {
        // Restore original NODE_ENV
        process.env.NODE_ENV = originalNodeEnv;
      }
    });
  });

  describe('notFoundHandler middleware', () => {
    it('should create a NotFoundError with the request path and pass to next', () => {
      notFoundHandler(mockRequest as Request, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: 'Route not found: GET /test',
        })
      );
    });
  });
});