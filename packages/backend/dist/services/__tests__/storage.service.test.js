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
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
const storage_service_1 = require("../storage.service");
const logger = __importStar(require("../../utils/logger"));
// Mock object for StorageProviderFactory
const StorageProviderFactory = {
    createProvider: jest.fn(),
};
// Create mock provider
const mockProvider = {
    writeFile: jest.fn(),
    readFile: jest.fn(),
    createReadStream: jest.fn(),
    deleteFile: jest.fn(),
    createDirectory: jest.fn(),
    listDirectory: jest.fn(),
    getMetadata: jest.fn(),
    getPublicUrl: jest.fn(),
    getSignedUrl: jest.fn(),
};
// Set up the factory mock to return our mock provider
StorageProviderFactory.createProvider.mockReturnValue(mockProvider);
// Mock the storage module with our local mock
jest.mock('../storage.service', () => {
    // Get the actual module
    const originalModule = jest.requireActual('../storage.service');
    // Replace the StorageProviderFactory with our mock
    return {
        ...originalModule,
        StorageProviderFactory,
    };
});
// Mock environment
jest.mock('../../config/env', () => ({
    env: {
        STORAGE_TYPE: 'local',
        STORAGE_PATH: '/test/storage',
        STORAGE_URL_PREFIX: 'http://test.com/files',
    },
}));
// Mock logger
jest.mock('../../utils/logger', () => ({
    logInfo: jest.fn(),
    logError: jest.fn(),
}));
// No need for this line since we've defined mockProvider directly
describe('StorageService', () => {
    // Reset mocks before each test
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('constructor', () => {
        it('should initialize with the correct configuration', () => {
            const service = new storage_service_1.StorageService();
            // Check if provider was created with correct config
            expect(StorageProviderFactory.createProvider).toHaveBeenCalledWith({
                type: 'local',
                basePath: '/test/storage',
                options: {
                    urlPrefix: 'http://test.com/files',
                },
            });
            // Check if initialization was logged
            expect(logger.logInfo).toHaveBeenCalledWith('Initialized local storage provider at /test/storage');
        });
    });
    describe('provider methods', () => {
        it('should get the current provider', () => {
            const provider = storage_service_1.storageService.getProvider();
            expect(provider).toBe(mockProvider);
        });
        it('should change the provider with new configuration', () => {
            const newConfig = {
                type: 's3',
                basePath: 'my-bucket',
                options: {
                    region: 'us-west-2',
                },
            };
            storage_service_1.storageService.changeProvider(newConfig);
            expect(StorageProviderFactory.createProvider).toHaveBeenCalledWith(newConfig);
            expect(logger.logInfo).toHaveBeenCalledWith('Changed storage provider to s3');
        });
        it('should write a file to storage', async () => {
            const filePath = 'test/file.txt';
            const content = Buffer.from('test content');
            await storage_service_1.storageService.writeFile(filePath, content);
            expect(mockProvider.writeFile).toHaveBeenCalledWith(filePath, content);
        });
        it('should read a file from storage', async () => {
            const filePath = 'test/file.txt';
            const expectedContent = Buffer.from('test content');
            mockProvider.readFile.mockResolvedValue(expectedContent);
            const result = await storage_service_1.storageService.readFile(filePath);
            expect(mockProvider.readFile).toHaveBeenCalledWith(filePath);
            expect(result).toBe(expectedContent);
        });
        it('should create a read stream for a file', () => {
            const filePath = 'test/file.txt';
            const mockStream = new stream_1.Readable();
            mockProvider.createReadStream.mockReturnValue(mockStream);
            const result = storage_service_1.storageService.createReadStream(filePath);
            expect(mockProvider.createReadStream).toHaveBeenCalledWith(filePath);
            expect(result).toBe(mockStream);
        });
        it('should delete a file from storage', async () => {
            const filePath = 'test/file.txt';
            await storage_service_1.storageService.deleteFile(filePath);
            expect(mockProvider.deleteFile).toHaveBeenCalledWith(filePath);
        });
        it('should create a directory', async () => {
            const dirPath = 'test/directory';
            await storage_service_1.storageService.createDirectory(dirPath);
            expect(mockProvider.createDirectory).toHaveBeenCalledWith(dirPath);
        });
        it('should list a directory', async () => {
            const dirPath = 'test/directory';
            const expectedListing = ['file1.txt', 'file2.txt', 'subdir'];
            mockProvider.listDirectory.mockResolvedValue(expectedListing);
            const result = await storage_service_1.storageService.listDirectory(dirPath);
            expect(mockProvider.listDirectory).toHaveBeenCalledWith(dirPath);
            expect(result).toEqual(expectedListing);
        });
        it('should get file metadata', async () => {
            const filePath = 'test/file.txt';
            const expectedMetadata = {
                name: 'file.txt',
                path: filePath,
                size: 123,
                contentType: 'text/plain',
                lastModified: new Date(),
                createdAt: new Date(),
            };
            mockProvider.getMetadata.mockResolvedValue(expectedMetadata);
            const result = await storage_service_1.storageService.getMetadata(filePath);
            expect(mockProvider.getMetadata).toHaveBeenCalledWith(filePath);
            expect(result).toEqual(expectedMetadata);
        });
        it('should get a public URL for a file', async () => {
            const filePath = 'test/file.txt';
            const expectedUrl = 'http://test.com/files/test/file.txt';
            mockProvider.getPublicUrl.mockResolvedValue(expectedUrl);
            const result = await storage_service_1.storageService.getPublicUrl(filePath);
            expect(mockProvider.getPublicUrl).toHaveBeenCalledWith(filePath);
            expect(result).toBe(expectedUrl);
        });
        it('should get a signed URL for a file', async () => {
            const filePath = 'test/file.txt';
            const expiry = 3600;
            const expectedUrl = 'http://test.com/files/test/file.txt?token=xyz&expires=123';
            mockProvider.getSignedUrl.mockResolvedValue(expectedUrl);
            const result = await storage_service_1.storageService.getSignedUrl(filePath, expiry);
            expect(mockProvider.getSignedUrl).toHaveBeenCalledWith(filePath, expiry);
            expect(result).toBe(expectedUrl);
        });
    });
    describe('error handling', () => {
        it('should log and rethrow errors when writing files', async () => {
            const filePath = 'test/error.txt';
            const error = new Error('Write error');
            mockProvider.writeFile.mockRejectedValue(error);
            await expect(storage_service_1.storageService.writeFile(filePath, Buffer.from('')))
                .rejects.toThrow(error);
            expect(logger.logError).toHaveBeenCalledWith(`Failed to write file: ${filePath}`, error);
        });
        it('should log and rethrow errors when reading files', async () => {
            const filePath = 'test/error.txt';
            const error = new Error('Read error');
            mockProvider.readFile.mockRejectedValue(error);
            await expect(storage_service_1.storageService.readFile(filePath))
                .rejects.toThrow(error);
            expect(logger.logError).toHaveBeenCalledWith(`Failed to read file: ${filePath}`, error);
        });
        it('should log and rethrow errors when creating read streams', () => {
            const filePath = 'test/error.txt';
            const error = new Error('Stream error');
            mockProvider.createReadStream.mockImplementation(() => {
                throw error;
            });
            expect(() => storage_service_1.storageService.createReadStream(filePath))
                .toThrow(error);
            expect(logger.logError).toHaveBeenCalledWith(`Failed to create read stream: ${filePath}`, error);
        });
        // Additional error handling tests for other methods would follow the same pattern
    });
    describe('path generation', () => {
        it('should generate a channel path correctly', () => {
            const channelId = 'UC12345';
            const channelName = 'Test Channel';
            const result = storage_service_1.storageService.generateChannelPath(channelId, channelName);
            expect(result).toBe('archive/UC12345-Test-Channel');
        });
        it('should generate a playlist path correctly', () => {
            const channelPath = 'archive/UC12345-Test-Channel';
            const playlistId = 'PL67890';
            const playlistName = 'Test Playlist';
            const result = storage_service_1.storageService.generatePlaylistPath(channelPath, playlistId, playlistName);
            expect(result).toBe('archive/UC12345-Test-Channel/PL67890-Test-Playlist');
        });
        it('should generate a video path correctly', () => {
            const playlistPath = 'archive/UC12345-Test-Channel/PL67890-Test-Playlist';
            const videoId = 'v12345';
            const uploadDate = '2023-01-15';
            const videoTitle = 'Test Video';
            const result = storage_service_1.storageService.generateVideoPath(playlistPath, videoId, uploadDate, videoTitle);
            expect(result).toBe('archive/UC12345-Test-Channel/PL67890-Test-Playlist/v12345-2023-01-15-Test-Video');
        });
    });
    describe('path sanitization', () => {
        // Access the private method for testing
        const sanitizePathComponent = (service, value) => {
            return service.sanitizePathComponent(value);
        };
        it('should replace invalid characters', () => {
            const input = 'File with: invalid < > characters? *';
            const expected = 'File-with_-invalid-_-_-characters_-_';
            const result = sanitizePathComponent(storage_service_1.storageService, input);
            expect(result).toBe(expected);
        });
        it('should collapse multiple hyphens', () => {
            const input = 'Multiple   spaces and---hyphens';
            const expected = 'Multiple-spaces-and-hyphens';
            const result = sanitizePathComponent(storage_service_1.storageService, input);
            expect(result).toBe(expected);
        });
        it('should trim leading and trailing hyphens', () => {
            const input = '- Trim -these-';
            const expected = 'Trim-these';
            const result = sanitizePathComponent(storage_service_1.storageService, input);
            expect(result).toBe(expected);
        });
        it('should truncate long names', () => {
            const input = 'a'.repeat(150);
            const expected = 'a'.repeat(100);
            const result = sanitizePathComponent(storage_service_1.storageService, input);
            expect(result.length).toBe(100);
            expect(result).toBe(expected);
        });
        it('should handle empty or whitespace-only strings', () => {
            const inputs = ['', ' ', '   '];
            for (const input of inputs) {
                const result = sanitizePathComponent(storage_service_1.storageService, input);
                expect(result).toBe('unnamed');
            }
        });
    });
});
//# sourceMappingURL=storage.service.test.js.map