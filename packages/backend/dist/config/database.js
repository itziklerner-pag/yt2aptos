"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = connectDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
const logger_1 = require("../utils/logger");
/**
 * Connect to MongoDB
 */
async function connectDatabase() {
    try {
        // Set mongoose options
        mongoose_1.default.set('strictQuery', true);
        // Connect to MongoDB
        (0, logger_1.logInfo)(`Connecting to MongoDB: ${maskUri(env_1.env.MONGODB_URI)}`);
        await mongoose_1.default.connect(env_1.env.MONGODB_URI);
        (0, logger_1.logInfo)('MongoDB connection established successfully');
        // Handle connection events
        mongoose_1.default.connection.on('error', (err) => {
            (0, logger_1.logError)('MongoDB connection error', err);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            (0, logger_1.logInfo)('MongoDB disconnected');
        });
        // Handle process termination
        process.on('SIGINT', async () => {
            await mongoose_1.default.connection.close();
            (0, logger_1.logInfo)('MongoDB connection closed due to app termination');
            process.exit(0);
        });
        return mongoose_1.default;
    }
    catch (error) {
        (0, logger_1.logError)('Failed to connect to MongoDB', error);
        throw error;
    }
}
/**
 * Mask sensitive information in MongoDB URI for logging
 */
function maskUri(uri) {
    try {
        const parsedUri = new URL(uri);
        // Mask username and password if present
        if (parsedUri.username || parsedUri.password) {
            return uri.replace(/\/\/(.*):(.*)@/, '//***:***@');
        }
        return uri;
    }
    catch (error) {
        // If URI can't be parsed, just hide everything after mongodb://
        return uri.replace(/(mongodb:\/\/)(.*)/, '$1***');
    }
}
//# sourceMappingURL=database.js.map