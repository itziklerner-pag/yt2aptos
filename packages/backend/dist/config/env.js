"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
exports.validateEnv = validateEnv;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables from .env file
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '.env') });
// Environment variables with defaults
exports.env = {
    // Server configuration
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '3000', 10),
    API_PREFIX: process.env.API_PREFIX || '/api',
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
    // MongoDB configuration
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/yt2aptos',
    // Storage configuration
    STORAGE_TYPE: process.env.STORAGE_TYPE || 'local',
    STORAGE_PATH: process.env.STORAGE_PATH || path_1.default.resolve(process.cwd(), 'storage'),
    STORAGE_URL_PREFIX: process.env.STORAGE_URL_PREFIX || 'http://localhost:3000/files',
    // JWT configuration
    JWT_SECRET: process.env.JWT_SECRET || 'your-default-jwt-secret-key-for-dev',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
    // YouTube API configuration
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || '',
    YOUTUBE_API_QUOTA_LIMIT: parseInt(process.env.YOUTUBE_API_QUOTA_LIMIT || '10000', 10),
    YOUTUBE_API_QUOTA_RESET_INTERVAL: process.env.YOUTUBE_API_QUOTA_RESET_INTERVAL || '24h',
    YOUTUBE_API_CACHE_TTL: parseInt(process.env.YOUTUBE_API_CACHE_TTL || '3600', 10), // Default: 1 hour in seconds
    YOUTUBE_API_MAX_RESULTS: parseInt(process.env.YOUTUBE_API_MAX_RESULTS || '50', 10), // Max results per API call
    YOUTUBE_API_RETRY_ATTEMPTS: parseInt(process.env.YOUTUBE_API_RETRY_ATTEMPTS || '3', 10), // Retry attempts on failure
    YOUTUBE_API_RETRY_DELAY: parseInt(process.env.YOUTUBE_API_RETRY_DELAY || '1000', 10), // Delay between retries in ms
    // Logging
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    LOG_FILE: process.env.LOG_FILE || path_1.default.resolve(process.cwd(), 'logs/app.log'),
};
// Validate required environment variables
function validateEnv() {
    // Implement validation logic if needed
    return exports.env;
}
//# sourceMappingURL=env.js.map