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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("../env");
const database_1 = require("../database");
const logger = __importStar(require("../../utils/logger"));
// Since maskUri is a private function, we'll test it indirectly
// Mock mongoose and logger
jest.mock('mongoose', () => {
    const mConnectionOn = jest.fn();
    const mConnect = jest.fn();
    const mClose = jest.fn();
    return {
        connect: mConnect,
        connection: {
            on: mConnectionOn,
            close: mClose,
        },
        set: jest.fn(),
    };
});
jest.mock('../../utils/logger', () => ({
    logInfo: jest.fn(),
    logError: jest.fn(),
}));
jest.mock('../env', () => ({
    env: {
        MONGODB_URI: 'mongodb://localhost:27017/test-db',
    },
}));
describe('Database Configuration', () => {
    // Reset mocks before each test
    beforeEach(() => {
        jest.clearAllMocks();
        // Mock process.on to avoid side effects
        jest.spyOn(process, 'on').mockImplementation(jest.fn());
    });
    describe('connectDatabase', () => {
        it('should connect to MongoDB successfully', async () => {
            // Mock successful connection
            mongoose_1.default.connect.mockResolvedValue(mongoose_1.default);
            const result = await (0, database_1.connectDatabase)();
            // Check if mongoose.connect was called with the correct URI
            expect(mongoose_1.default.connect).toHaveBeenCalledWith(env_1.env.MONGODB_URI);
            // Check if strict query option was set
            expect(mongoose_1.default.set).toHaveBeenCalledWith('strictQuery', true);
            // Check if connection event handlers were registered
            expect(mongoose_1.default.connection.on).toHaveBeenCalledWith('error', expect.any(Function));
            expect(mongoose_1.default.connection.on).toHaveBeenCalledWith('disconnected', expect.any(Function));
            // Check if process termination handler was registered
            expect(process.on).toHaveBeenCalledWith('SIGINT', expect.any(Function));
            // Check if successful connection was logged
            expect(logger.logInfo).toHaveBeenCalledWith('MongoDB connection established successfully');
            // Check return value
            expect(result).toBe(mongoose_1.default);
        });
        it('should handle connection errors', async () => {
            // Mock connection error
            const connectionError = new Error('Connection error');
            mongoose_1.default.connect.mockRejectedValue(connectionError);
            // Expect the function to throw
            await expect((0, database_1.connectDatabase)()).rejects.toThrow(connectionError);
            // Check if error was logged
            expect(logger.logError).toHaveBeenCalledWith('Failed to connect to MongoDB', connectionError);
        });
        it('should handle connection events', async () => {
            // Mock successful connection
            mongoose_1.default.connect.mockResolvedValue(mongoose_1.default);
            await (0, database_1.connectDatabase)();
            // Get the error event handler
            const [[, errorHandler]] = mongoose_1.default.connection.on.mock.calls.filter(call => call[0] === 'error');
            // Get the disconnected event handler
            const [[, disconnectHandler]] = mongoose_1.default.connection.on.mock.calls.filter(call => call[0] === 'disconnected');
            // Simulate error event
            const connectionError = new Error('Connection dropped');
            errorHandler(connectionError);
            // Check if error was logged
            expect(logger.logError).toHaveBeenCalledWith('MongoDB connection error', connectionError);
            // Simulate disconnected event
            disconnectHandler();
            // Check if disconnection was logged
            expect(logger.logInfo).toHaveBeenCalledWith('MongoDB disconnected');
        });
        it('should handle process termination', async () => {
            // Mock successful connection
            mongoose_1.default.connect.mockResolvedValue(mongoose_1.default);
            mongoose_1.default.connection.close.mockResolvedValue(undefined);
            const originalExit = process.exit;
            process.exit = jest.fn();
            await (0, database_1.connectDatabase)();
            // Get the SIGINT event handler
            const [[, sigintHandler]] = process.on.mock.calls.filter(call => call[0] === 'SIGINT');
            // Simulate SIGINT event
            await sigintHandler();
            // Check if connection was closed
            expect(mongoose_1.default.connection.close).toHaveBeenCalled();
            // Check if termination was logged
            expect(logger.logInfo).toHaveBeenCalledWith('MongoDB connection closed due to app termination');
            // Check if process.exit was called
            expect(process.exit).toHaveBeenCalledWith(0);
            // Restore original process.exit
            process.exit = originalExit;
        });
    });
    describe('URI masking functionality', () => {
        // We'll test the maskUri function indirectly through the logging done during connection
        it('should mask username and password in MongoDB URI during connection', async () => {
            // Set a URI with credentials
            env_1.env.MONGODB_URI = 'mongodb://username:password@localhost:27017/db';
            // Mock successful connection
            mongoose_1.default.connect.mockResolvedValue(mongoose_1.default);
            await (0, database_1.connectDatabase)();
            // Check if the logged URI has credentials masked
            expect(logger.logInfo).toHaveBeenCalledWith(expect.stringContaining('mongodb://***:***@localhost:27017/db'));
            // Ensure original credentials are not logged
            expect(logger.logInfo).not.toHaveBeenCalledWith(expect.stringContaining('username:password'));
        });
        it('should not mask MongoDB URI without credentials', async () => {
            // Set a URI without credentials
            env_1.env.MONGODB_URI = 'mongodb://localhost:27017/db';
            // Mock successful connection
            mongoose_1.default.connect.mockResolvedValue(mongoose_1.default);
            await (0, database_1.connectDatabase)();
            // Check if the logged URI remains unchanged
            expect(logger.logInfo).toHaveBeenCalledWith(expect.stringContaining('mongodb://localhost:27017/db'));
        });
        it('should handle invalid MongoDB URIs', async () => {
            // Set an invalid URI
            env_1.env.MONGODB_URI = 'mongodb:invalid-uri';
            // Mock successful connection (even though in reality it would fail)
            mongoose_1.default.connect.mockResolvedValue(mongoose_1.default);
            await (0, database_1.connectDatabase)();
            // Check if the logged URI is masked appropriately
            expect(logger.logInfo).toHaveBeenCalledWith(expect.stringContaining('mongodb:***'));
        });
    });
});
//# sourceMappingURL=database.test.js.map