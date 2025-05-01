"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const error_handler_middleware_1 = require("../error-handler.middleware");
const logger = __importStar(require("../../utils/logger"));
// Mock the logger module
jest.mock('../../utils/logger', () => ({
    logError: jest.fn(),
}));
describe('Error Handler Middleware', () => {
    // Setup mocks
    let mockRequest;
    let mockResponse;
    let mockNext;
    let jsonMock;
    let statusMock;
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
            const error = new error_handler_middleware_1.AppError('Test error', 400);
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toBe('Test error');
            expect(error.statusCode).toBe(400);
            expect(error.isOperational).toBe(true);
        });
        it('should create a NotFoundError with status 404', () => {
            const error = new error_handler_middleware_1.NotFoundError('Resource not found');
            expect(error).toBeInstanceOf(error_handler_middleware_1.AppError);
            expect(error.message).toBe('Resource not found');
            expect(error.statusCode).toBe(404);
        });
        it('should create a BadRequestError with status 400', () => {
            const error = new error_handler_middleware_1.BadRequestError();
            expect(error).toBeInstanceOf(error_handler_middleware_1.AppError);
            expect(error.message).toBe('Bad request');
            expect(error.statusCode).toBe(400);
        });
        it('should create an UnauthorizedError with status 401', () => {
            const error = new error_handler_middleware_1.UnauthorizedError();
            expect(error).toBeInstanceOf(error_handler_middleware_1.AppError);
            expect(error.message).toBe('Unauthorized access');
            expect(error.statusCode).toBe(401);
        });
        it('should create a ForbiddenError with status 403', () => {
            const error = new error_handler_middleware_1.ForbiddenError();
            expect(error).toBeInstanceOf(error_handler_middleware_1.AppError);
            expect(error.message).toBe('Forbidden action');
            expect(error.statusCode).toBe(403);
        });
        it('should create an InternalServerError with status 500 and isOperational=false', () => {
            const error = new error_handler_middleware_1.InternalServerError();
            expect(error).toBeInstanceOf(error_handler_middleware_1.AppError);
            expect(error.message).toBe('Internal server error');
            expect(error.statusCode).toBe(500);
            expect(error.isOperational).toBe(false);
        });
    });
    describe('errorHandler middleware', () => {
        it('should handle AppError instances correctly', () => {
            const error = new error_handler_middleware_1.BadRequestError('Invalid input');
            (0, error_handler_middleware_1.errorHandler)(error, mockRequest, mockResponse, mockNext);
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
            (0, error_handler_middleware_1.errorHandler)(error, mockRequest, mockResponse, mockNext);
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
            const error = new Error('Validation failed');
            error.name = 'ValidationError';
            (0, error_handler_middleware_1.errorHandler)(error, mockRequest, mockResponse, mockNext);
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
            const error = new Error('Cast error');
            error.name = 'CastError';
            (0, error_handler_middleware_1.errorHandler)(error, mockRequest, mockResponse, mockNext);
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
            const error = new Error('Duplicate key');
            error.name = 'MongoError';
            error.code = 11000;
            (0, error_handler_middleware_1.errorHandler)(error, mockRequest, mockResponse, mockNext);
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
            const error = new Error('Invalid JWT');
            error.name = 'JsonWebTokenError';
            (0, error_handler_middleware_1.errorHandler)(error, mockRequest, mockResponse, mockNext);
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
            const error = new Error('JWT expired');
            error.name = 'TokenExpiredError';
            (0, error_handler_middleware_1.errorHandler)(error, mockRequest, mockResponse, mockNext);
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
                const error = new error_handler_middleware_1.BadRequestError('Invalid input');
                (0, error_handler_middleware_1.errorHandler)(error, mockRequest, mockResponse, mockNext);
                expect(statusMock).toHaveBeenCalledWith(400);
                expect(jsonMock).toHaveBeenCalledWith({
                    success: false,
                    error: {
                        message: 'Invalid input',
                    },
                });
            }
            finally {
                // Restore original NODE_ENV
                process.env.NODE_ENV = originalNodeEnv;
            }
        });
    });
    describe('notFoundHandler middleware', () => {
        it('should create a NotFoundError with the request path and pass to next', () => {
            (0, error_handler_middleware_1.notFoundHandler)(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                statusCode: 404,
                message: 'Route not found: GET /test',
            }));
        });
    });
});
//# sourceMappingURL=error-handler.middleware.test.js.map