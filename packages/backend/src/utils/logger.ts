import winston from 'winston';
import { env } from '../config/env';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logDir = path.dirname(env.LOG_FILE);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} ${level.toUpperCase()}: ${message}${stack ? '\n' + stack : ''}`;
  })
);

// Create console transport
const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    logFormat
  ),
});

// Create file transport
const fileTransport = new winston.transports.File({
  filename: env.LOG_FILE,
  format: logFormat,
  maxsize: 5242880, // 5MB
  maxFiles: 5,
});

// Create logger instance
export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  levels: winston.config.npm.levels,
  defaultMeta: { service: 'yt2aptos-backend' },
  transports: [
    consoleTransport,
    fileTransport,
  ],
  exitOnError: false,
});

// Export helper methods for common log levels
export const logInfo = (message: string, meta?: any) => logger.info(message, meta);
export const logError = (message: string, error?: Error | unknown) => {
  if (error instanceof Error) {
    logger.error(`${message}: ${error.message}`, { error });
  } else {
    logger.error(`${message}: ${error}`);
  }
};
export const logWarning = (message: string, meta?: any) => logger.warn(message, meta);
export const logDebug = (message: string, meta?: any) => logger.debug(message, meta);

// Stream for Morgan HTTP logger
export const logStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};