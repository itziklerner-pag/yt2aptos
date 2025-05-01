"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_memory_server_1 = require("mongodb-memory-server");
const mongoose_1 = __importDefault(require("mongoose"));
// Mock environment variables
jest.mock('../config/env', () => ({
    env: {
        NODE_ENV: 'test',
        PORT: 3000,
        API_PREFIX: '/api',
        CORS_ORIGIN: '*',
        MONGODB_URI: 'mongodb://localhost:27017/yt2aptos_test',
        STORAGE_TYPE: 'local',
        STORAGE_PATH: '/tmp/yt2aptos_test_storage',
        STORAGE_URL_PREFIX: 'http://localhost:3000/files',
        JWT_SECRET: 'test-jwt-secret',
        JWT_EXPIRES_IN: '1h',
        LOG_LEVEL: 'error',
        LOG_FILE: '/dev/null',
    },
}));
// Mock the logger to prevent logging during tests
jest.mock('../utils/logger', () => ({
    logger: {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
    },
}));
let mongoServer;
// Global setup before all tests
beforeAll(async () => {
    // Start in-memory MongoDB server
    mongoServer = await mongodb_memory_server_1.MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    // Connect to the in-memory database
    await mongoose_1.default.connect(uri);
});
// Clean up database between tests
beforeEach(async () => {
    const collections = mongoose_1.default.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
});
// Disconnect and stop MongoDB server after all tests
afterAll(async () => {
    await mongoose_1.default.disconnect();
    await mongoServer.stop();
});
//# sourceMappingURL=setup.js.map