import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { env } from '../config/env';

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

let mongoServer: MongoMemoryServer;

// Global setup before all tests
beforeAll(async () => {
  // Start in-memory MongoDB server
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  // Connect to the in-memory database
  await mongoose.connect(uri);
});

// Clean up database between tests
beforeEach(async () => {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Disconnect and stop MongoDB server after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});