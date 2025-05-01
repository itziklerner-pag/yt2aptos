"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
describe('Environment Configuration', () => {
    // Store original process.env
    const originalEnv = { ...process.env };
    // Mock process.env for testing
    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv }; // Start with a fresh copy
    });
    // Restore original process.env after tests
    afterEach(() => {
        process.env = originalEnv;
    });
    it('should use default values when environment variables are not set', () => {
        // Clear all relevant environment variables
        const relevantEnvVars = [
            'NODE_ENV', 'PORT', 'API_PREFIX', 'CORS_ORIGIN',
            'MONGODB_URI', 'STORAGE_TYPE', 'STORAGE_PATH', 'STORAGE_URL_PREFIX',
            'JWT_SECRET', 'JWT_EXPIRES_IN', 'LOG_LEVEL', 'LOG_FILE'
        ];
        relevantEnvVars.forEach(key => {
            delete process.env[key];
        });
        // Import the module again to reset env with defaults
        jest.resetModules();
        const { env: freshEnv } = require('../env');
        // Test default values
        expect(freshEnv.NODE_ENV).toBe('development');
        expect(freshEnv.PORT).toBe(3000);
        expect(freshEnv.API_PREFIX).toBe('/api');
        expect(freshEnv.CORS_ORIGIN).toBe('*');
        expect(freshEnv.MONGODB_URI).toBe('mongodb://localhost:27017/yt2aptos');
        expect(freshEnv.STORAGE_TYPE).toBe('local');
        expect(freshEnv.STORAGE_PATH).toBe(path_1.default.resolve(process.cwd(), 'storage'));
        expect(freshEnv.STORAGE_URL_PREFIX).toBe('http://localhost:3000/files');
        expect(freshEnv.JWT_SECRET).toBe('your-default-jwt-secret-key-for-dev');
        expect(freshEnv.JWT_EXPIRES_IN).toBe('1d');
        expect(freshEnv.LOG_LEVEL).toBe('info');
        expect(freshEnv.LOG_FILE).toBe(path_1.default.resolve(process.cwd(), 'logs/app.log'));
    });
    it('should use environment variables when they are set', () => {
        // Set mock environment variables
        process.env.NODE_ENV = 'production';
        process.env.PORT = '4000';
        process.env.API_PREFIX = '/api/v1';
        process.env.CORS_ORIGIN = 'https://example.com';
        process.env.MONGODB_URI = 'mongodb://mongodb:27017/prod-db';
        process.env.STORAGE_TYPE = 's3';
        process.env.STORAGE_PATH = '/custom/path';
        process.env.STORAGE_URL_PREFIX = 'https://cdn.example.com';
        process.env.JWT_SECRET = 'secure-production-key';
        process.env.JWT_EXPIRES_IN = '7d';
        process.env.LOG_LEVEL = 'error';
        process.env.LOG_FILE = '/var/log/app.log';
        // Import the module again to use new env vars
        jest.resetModules();
        const { env: freshEnv } = require('../env');
        // Test environment variable values
        expect(freshEnv.NODE_ENV).toBe('production');
        expect(freshEnv.PORT).toBe(4000);
        expect(freshEnv.API_PREFIX).toBe('/api/v1');
        expect(freshEnv.CORS_ORIGIN).toBe('https://example.com');
        expect(freshEnv.MONGODB_URI).toBe('mongodb://mongodb:27017/prod-db');
        expect(freshEnv.STORAGE_TYPE).toBe('s3');
        expect(freshEnv.STORAGE_PATH).toBe('/custom/path');
        expect(freshEnv.STORAGE_URL_PREFIX).toBe('https://cdn.example.com');
        expect(freshEnv.JWT_SECRET).toBe('secure-production-key');
        expect(freshEnv.JWT_EXPIRES_IN).toBe('7d');
        expect(freshEnv.LOG_LEVEL).toBe('error');
        expect(freshEnv.LOG_FILE).toBe('/var/log/app.log');
    });
    it('should parse PORT environment variable as an integer', () => {
        // Test with valid port number
        process.env.PORT = '5000';
        jest.resetModules();
        const { env: freshEnv } = require('../env');
        expect(freshEnv.PORT).toBe(5000);
        expect(typeof freshEnv.PORT).toBe('number');
        // Test with invalid port (non-numeric)
        process.env.PORT = 'invalid';
        jest.resetModules();
        const { env: invalidPortEnv } = require('../env');
        expect(invalidPortEnv.PORT).toBe(3000); // Should fall back to default
    });
    it('should handle different NODE_ENV values', () => {
        const environments = ['development', 'production', 'test', 'staging'];
        environments.forEach(nodeEnv => {
            process.env.NODE_ENV = nodeEnv;
            jest.resetModules();
            const { env: freshEnv } = require('../env');
            expect(freshEnv.NODE_ENV).toBe(nodeEnv);
        });
    });
    it('should return proper EnvSchema from validateEnv function', () => {
        // Set some environment variables
        process.env.NODE_ENV = 'test';
        process.env.PORT = '8080';
        // Import the module again
        jest.resetModules();
        const { validateEnv: freshValidateEnv } = require('../env');
        // Get the validated environment
        const validatedEnv = freshValidateEnv();
        // Check if it's properly typed and has all properties
        expect(validatedEnv.NODE_ENV).toBe('test');
        expect(validatedEnv.PORT).toBe(8080);
        // Check if all required properties exist
        const requiredProps = [
            'NODE_ENV', 'PORT', 'API_PREFIX', 'CORS_ORIGIN',
            'MONGODB_URI', 'STORAGE_TYPE', 'STORAGE_PATH', 'STORAGE_URL_PREFIX',
            'JWT_SECRET', 'JWT_EXPIRES_IN', 'LOG_LEVEL', 'LOG_FILE'
        ];
        requiredProps.forEach(prop => {
            expect(validatedEnv).toHaveProperty(prop);
        });
    });
});
//# sourceMappingURL=env.test.js.map