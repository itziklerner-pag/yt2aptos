"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logStream = exports.logDebug = exports.logWarning = exports.logError = exports.logInfo = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const env_1 = require("../config/env");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Ensure logs directory exists
const logDir = path_1.default.dirname(env_1.env.LOG_FILE);
if (!fs_1.default.existsSync(logDir)) {
    fs_1.default.mkdirSync(logDir, { recursive: true });
}
// Define log format
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} ${level.toUpperCase()}: ${message}${stack ? '\n' + stack : ''}`;
}));
// Create console transport
const consoleTransport = new winston_1.default.transports.Console({
    format: winston_1.default.format.combine(winston_1.default.format.colorize(), logFormat),
});
// Create file transport
const fileTransport = new winston_1.default.transports.File({
    filename: env_1.env.LOG_FILE,
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
});
// Create logger instance
exports.logger = winston_1.default.createLogger({
    level: env_1.env.LOG_LEVEL,
    levels: winston_1.default.config.npm.levels,
    defaultMeta: { service: 'yt2aptos-backend' },
    transports: [
        consoleTransport,
        fileTransport,
    ],
    exitOnError: false,
});
// Export helper methods for common log levels
const logInfo = (message, meta) => exports.logger.info(message, meta);
exports.logInfo = logInfo;
const logError = (message, error) => {
    if (error instanceof Error) {
        exports.logger.error(`${message}: ${error.message}`, { error });
    }
    else {
        exports.logger.error(`${message}: ${error}`);
    }
};
exports.logError = logError;
const logWarning = (message, meta) => exports.logger.warn(message, meta);
exports.logWarning = logWarning;
const logDebug = (message, meta) => exports.logger.debug(message, meta);
exports.logDebug = logDebug;
// Stream for Morgan HTTP logger
exports.logStream = {
    write: (message) => {
        exports.logger.http(message.trim());
    },
};
//# sourceMappingURL=logger.js.map