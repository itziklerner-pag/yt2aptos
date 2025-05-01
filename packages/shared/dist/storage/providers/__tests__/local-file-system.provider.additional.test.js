"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const local_file_system_provider_1 = require("../local-file-system.provider");
// Mock fs-extra module
jest.mock('fs-extra');
describe('LocalFileSystemProvider - Additional Tests', () => {
    const mockBasePath = '/test/storage';
    const mockUrlPrefix = 'http://localhost:3000/files';
    let provider;
    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();
        // Setup provider with test configuration
        provider = new local_file_system_provider_1.LocalFileSystemProvider({
            type: 'local',
            basePath: mockBasePath,
            urlPrefix: mockUrlPrefix
        });
        // Mock fs.ensureDirSync implementation
        fs_extra_1.default.ensureDirSync.mockImplementation(() => undefined);
    });
    describe('deleteDirectory', () => {
        it('should delete directory recursively', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock implementation
            fs_extra_1.default.remove.mockResolvedValue(undefined);
            // Test data
            const dirPath = 'test/directory';
            // Execute
            yield provider.deleteDirectory(dirPath, true);
            // Assert
            expect(fs_extra_1.default.remove).toHaveBeenCalledWith(path_1.default.join(mockBasePath, dirPath));
        }));
        it('should delete empty directory non-recursively', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock implementation
            fs_extra_1.default.rmdir.mockResolvedValue(undefined);
            // Test data
            const dirPath = 'test/empty-directory';
            // Execute
            yield provider.deleteDirectory(dirPath, false);
            // Assert
            expect(fs_extra_1.default.rmdir).toHaveBeenCalledWith(path_1.default.join(mockBasePath, dirPath));
        }));
        it('should throw error when trying to delete non-recursively and directory is not empty', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock implementation to simulate error
            const error = new Error('Directory not empty');
            error.code = 'ENOTEMPTY';
            fs_extra_1.default.rmdir.mockRejectedValue(error);
            // Test data
            const dirPath = 'test/non-empty-directory';
            // Execute and assert
            yield expect(provider.deleteDirectory(dirPath, false)).rejects.toThrow('Directory not empty');
        }));
    });
    describe('getMetadata', () => {
        it('should return file metadata', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock stat implementation
            const now = new Date();
            const mockStats = {
                size: 12345,
                mtime: now,
                birthtime: new Date(now.getTime() - 86400000), // 1 day before
                isFile: () => true,
            };
            fs_extra_1.default.stat.mockResolvedValue(mockStats);
            // Test data
            const filePath = 'test/file.txt';
            // Execute
            const metadata = yield provider.getMetadata(filePath);
            // Assert
            expect(fs_extra_1.default.stat).toHaveBeenCalledWith(path_1.default.join(mockBasePath, filePath));
            expect(metadata).toEqual({
                name: 'file.txt',
                path: filePath,
                size: mockStats.size,
                contentType: 'text/plain',
                lastModified: mockStats.mtime,
                createdAt: mockStats.birthtime,
            });
        }));
        it('should handle different file types with appropriate MIME types', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock stat implementation
            const mockStats = {
                size: 12345,
                mtime: new Date(),
                birthtime: new Date(),
                isFile: () => true,
            };
            fs_extra_1.default.stat.mockResolvedValue(mockStats);
            // Test data for different file extensions
            const fileTests = [
                { path: 'test/file.jpg', expectedMime: 'image/jpeg' },
                { path: 'test/file.png', expectedMime: 'image/png' },
                { path: 'test/file.mp4', expectedMime: 'video/mp4' },
                { path: 'test/file.json', expectedMime: 'application/json' },
                { path: 'test/file.unknown', expectedMime: 'application/octet-stream' },
            ];
            // Execute and assert for each file type
            for (const test of fileTests) {
                const metadata = yield provider.getMetadata(test.path);
                expect(metadata.contentType).toBe(test.expectedMime);
            }
        }));
        it('should throw error if file does not exist', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock stat implementation to throw error
            const error = new Error('File not found');
            error.code = 'ENOENT';
            fs_extra_1.default.stat.mockRejectedValue(error);
            // Test data
            const filePath = 'test/nonexistent.txt';
            // Execute and assert
            yield expect(provider.getMetadata(filePath)).rejects.toThrow();
        }));
    });
    describe('updateMetadata', () => {
        it('should update file modified time', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock implementation
            fs_extra_1.default.utimes.mockResolvedValue(undefined);
            // Test data
            const filePath = 'test/file.txt';
            const newDate = new Date();
            const metadata = {
                lastModified: newDate
            };
            // Execute
            yield provider.updateMetadata(filePath, metadata);
            // Assert
            expect(fs_extra_1.default.utimes).toHaveBeenCalledWith(path_1.default.join(mockBasePath, filePath), newDate.getTime() / 1000, newDate.getTime() / 1000);
        }));
        it('should do nothing if no modifiable metadata is provided', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock implementation
            fs_extra_1.default.utimes.mockResolvedValue(undefined);
            // Test data
            const filePath = 'test/file.txt';
            const metadata = {
                // Only properties that don't affect filesystem
                name: 'new-name.txt',
                contentType: 'application/json'
            };
            // Execute
            yield provider.updateMetadata(filePath, metadata);
            // Assert - utimes should not be called
            expect(fs_extra_1.default.utimes).not.toHaveBeenCalled();
        }));
    });
    describe('Path sanitization', () => {
        it('should sanitize paths to prevent directory traversal', () => __awaiter(void 0, void 0, void 0, function* () {
            // Setup mock implementation
            fs_extra_1.default.readFile.mockResolvedValue(Buffer.from('test content'));
            // Test data with traversal attempts and their expected sanitized versions
            const pathTests = [
                {
                    input: '../outside.txt',
                    expected: 'outside.txt' // Leading ../ should be removed
                },
                {
                    input: '../../outside.txt',
                    expected: 'outside.txt' // Multiple ../ should be removed
                },
                {
                    input: '/etc/passwd',
                    expected: 'etc/passwd' // Leading / should be normalized
                },
                {
                    input: 'test/../../outside.txt',
                    expected: 'outside.txt' // Middle ../ should be normalized out
                },
            ];
            // Execute and assert for each path
            for (const { input, expected } of pathTests) {
                // Reset mocks between tests
                jest.clearAllMocks();
                yield provider.readFile(input);
                // Should use the sanitized path
                expect(fs_extra_1.default.readFile).toHaveBeenCalledWith(path_1.default.join(mockBasePath, expected));
                // Number of calls should be exactly 1
                expect(fs_extra_1.default.readFile).toHaveBeenCalledTimes(1);
            }
        }));
    });
    describe('URL encoding', () => {
        it('should properly encode special characters in file paths for URLs', () => __awaiter(void 0, void 0, void 0, function* () {
            // Test data with special characters
            const filePaths = [
                'test/file with spaces.txt',
                'test/file+with+plus.txt',
                'test/file?with#special&chars.txt',
                'test/文件名.txt', // Unicode characters
            ];
            // Execute and assert for each path
            for (const filePath of filePaths) {
                const url = yield provider.getPublicUrl(filePath);
                // Should encode special characters but preserve slashes
                const encodedPath = encodeURIComponent(filePath).replace(/%2F/g, '/');
                const expectedUrl = `${mockUrlPrefix}/${encodedPath}`;
                expect(url).toBe(expectedUrl);
            }
        }));
    });
    describe('Temporary token generation', () => {
        it('should generate different tokens for different files', () => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            // Test data
            const filePath1 = 'test/file1.txt';
            const filePath2 = 'test/file2.txt';
            const expiry = 3600;
            // Execute
            const url1 = yield provider.getSignedUrl(filePath1, expiry);
            const url2 = yield provider.getSignedUrl(filePath2, expiry);
            // Extract tokens
            const token1 = (_a = url1.match(/token=([^&]+)/)) === null || _a === void 0 ? void 0 : _a[1];
            const token2 = (_b = url2.match(/token=([^&]+)/)) === null || _b === void 0 ? void 0 : _b[1];
            // Assert
            expect(token1).toBeDefined();
            expect(token2).toBeDefined();
            expect(token1).not.toBe(token2);
        }));
        it('should generate different tokens for different expiry times', () => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            // Test data
            const filePath = 'test/file.txt';
            // Execute
            const url1 = yield provider.getSignedUrl(filePath, 3600);
            const url2 = yield provider.getSignedUrl(filePath, 7200);
            // Extract tokens
            const token1 = (_a = url1.match(/token=([^&]+)/)) === null || _a === void 0 ? void 0 : _a[1];
            const token2 = (_b = url2.match(/token=([^&]+)/)) === null || _b === void 0 ? void 0 : _b[1];
            // Assert
            expect(token1).toBeDefined();
            expect(token2).toBeDefined();
            expect(token1).not.toBe(token2);
        }));
        it('should include expiry timestamp in URL', () => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            // Test data
            const filePath = 'test/file.txt';
            const expiry = 3600;
            const now = Date.now();
            // Mock Date.now to return consistent value
            const originalDateNow = Date.now;
            Date.now = jest.fn(() => now);
            try {
                // Execute
                const url = yield provider.getSignedUrl(filePath, expiry);
                // Extract expiry
                const expiryParam = (_a = url.match(/expires=(\d+)/)) === null || _a === void 0 ? void 0 : _a[1];
                // Assert
                expect(expiryParam).toBeDefined();
                expect(Number(expiryParam)).toBe(now + expiry * 1000);
            }
            finally {
                // Restore original Date.now
                Date.now = originalDateNow;
            }
        }));
    });
});
//# sourceMappingURL=local-file-system.provider.additional.test.js.map