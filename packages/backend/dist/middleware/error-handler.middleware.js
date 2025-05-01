"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = exports.InternalServerError = exports.ForbiddenError = exports.UnauthorizedError = exports.BadRequestError = exports.NotFoundError = exports.AppError = void 0;
const logger_1 = require("../utils/logger");
// Base error class with HTTP status code
class AppError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
// Common error types
class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404);
    }
}
exports.NotFoundError = NotFoundError;
class BadRequestError extends AppError {
    constructor(message = 'Bad request') {
        super(message, 400);
    }
}
exports.BadRequestError = BadRequestError;
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized access') {
        super(message, 401);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = 'Forbidden action') {
        super(message, 403);
    }
}
exports.ForbiddenError = ForbiddenError;
class InternalServerError extends AppError {
    constructor(message = 'Internal server error') {
        super(message, 500, false);
    }
}
exports.InternalServerError = InternalServerError;
/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
next) => {
    // Default error status and message
    let statusCode = 500;
    let message = 'An unexpected error occurred';
    let errorDetails = {};
    let isOperational = false;
    // Handle known error types
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
        isOperational = err.isOperational;
    }
    else if (err.name === 'ValidationError') {
        // Mongoose validation error
        statusCode = 400;
        message = 'Validation error';
        errorDetails = err;
        isOperational = true;
    }
    else if (err.name === 'CastError') {
        // Mongoose cast error
        statusCode = 400;
        message = 'Invalid ID format';
        errorDetails = err;
        isOperational = true;
    }
    else if (err.name === 'MongoError' && err.code === 11000) {
        // Mongoose duplicate key error
        statusCode = 409;
        message = 'Duplicate entry';
        errorDetails = err;
        isOperational = true;
    }
    else if (err.name === 'JsonWebTokenError') {
        // JWT validation error
        statusCode = 401;
        message = 'Invalid token';
        isOperational = true;
    }
    else if (err.name === 'TokenExpiredError') {
        // JWT expiration error
        statusCode = 401;
        message = 'Token expired';
        isOperational = true;
    }
    // Log detailed error for non-operational errors
    if (!isOperational) {
        (0, logger_1.logError)('Unhandled error', err);
    }
    else {
        (0, logger_1.logError)(`${statusCode} - ${message}`, err);
    }
    // Return error response
    res.status(statusCode).json({
        success: false,
        error: {
            message,
            ...(process.env.NODE_ENV !== 'production' && { details: errorDetails }),
            ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
        },
    });
};
exports.errorHandler = errorHandler;
/**
 * Middleware to handle 404 routes
 */
const notFoundHandler = (req, res, next) => {
    // Add diagnostics to help identify the problem
    console.log(`[DEBUG] Route not found: ${req.method} ${req.originalUrl}`);
    console.log(`[DEBUG] API_PREFIX: ${process.env.API_PREFIX}`);
    console.log(`[DEBUG] Request headers:`, JSON.stringify(req.headers, null, 2));
    console.log(`[DEBUG] Request origin:`, req.headers.origin || req.headers.referer || 'unknown');
    next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`));
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=error-handler.middleware.js.map