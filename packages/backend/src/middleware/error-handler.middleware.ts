import { Request, Response, NextFunction } from 'express';
import { logError } from '../utils/logger';

// Base error class with HTTP status code
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error types
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request') {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden action') {
    super(message, 403);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, false);
  }
}

/**
 * Global error handling middleware
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  // Default error status and message
  let statusCode = 500;
  let message = 'An unexpected error occurred';
  let errorDetails: Record<string, any> = {};
  let isOperational = false;

  // Handle known error types
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  } else if (err.name === 'ValidationError') {
    // Mongoose validation error
    statusCode = 400;
    message = 'Validation error';
    errorDetails = err;
    isOperational = true;
  } else if (err.name === 'CastError') {
    // Mongoose cast error
    statusCode = 400;
    message = 'Invalid ID format';
    errorDetails = err;
    isOperational = true;
  } else if (err.name === 'MongoError' && (err as any).code === 11000) {
    // Mongoose duplicate key error
    statusCode = 409;
    message = 'Duplicate entry';
    errorDetails = err;
    isOperational = true;
  } else if (err.name === 'JsonWebTokenError') {
    // JWT validation error
    statusCode = 401;
    message = 'Invalid token';
    isOperational = true;
  } else if (err.name === 'TokenExpiredError') {
    // JWT expiration error
    statusCode = 401;
    message = 'Token expired';
    isOperational = true;
  }

  // Log detailed error for non-operational errors
  if (!isOperational) {
    logError('Unhandled error', err);
  } else {
    logError(`${statusCode} - ${message}`, err);
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

/**
 * Middleware to handle 404 routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  // Add diagnostics to help identify the problem
  console.log(`[DEBUG] Route not found: ${req.method} ${req.originalUrl}`);
  console.log(`[DEBUG] API_PREFIX: ${process.env.API_PREFIX}`);
  console.log(`[DEBUG] Request headers:`, JSON.stringify(req.headers, null, 2));
  console.log(`[DEBUG] Request origin:`, req.headers.origin || req.headers.referer || 'unknown');
  
  next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`));
};