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
const stream_1 = require("stream");
const local_file_system_provider_1 = require("../local-file-system.provider");
// Mock fs-extra module
jest.mock('fs-extra');
describe('LocalFileSystemProvider', () => {
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
    describe('constructor', () => {
        it('should ensure base directory exists', () => {
            expect(fs_extra_1.default.ensureDirSync).toHaveBeenCalledWith(mockBasePath);
        });
    });
    describe('writeFile', () => {
        it('should write buffer data to file', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock implementations
            fs_extra_1.default.ensureDir.mockResolvedValue(undefined);
            fs_extra_1.default.writeFile.mockResolvedValue(undefined);
            // Test data
            const filePath = 'test/file.txt';
            const data = Buffer.from('test content');
            // Execute
            yield provider.writeFile(filePath, data);
            // Assert
            expect(fs_extra_1.default.ensureDir).toHaveBeenCalledWith(path_1.default.dirname(path_1.default.join(mockBasePath, filePath)));
            expect(fs_extra_1.default.writeFile).toHaveBeenCalledWith(path_1.default.join(mockBasePath, filePath), data);
        }));
        it('should write stream data to file', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock implementations
            fs_extra_1.default.ensureDir.mockResolvedValue(undefined);
            const mockWriteStream = {
                on: jest.fn().mockImplementation((event, callback) => {
                    if (event === 'finish') {
                        callback();
                    }
                    return mockWriteStream;
                }),
                pipe: jest.fn()
            };
            fs_extra_1.default.createWriteStream.mockReturnValue(mockWriteStream);
            // Test data
            const filePath = 'test/file.txt';
            const mockReadStream = new stream_1.Readable({
                read() {
                    this.push('test content');
                    this.push(null);
                }
            });
            mockReadStream.pipe = jest.fn();
            mockReadStream.on = jest.fn().mockImplementation(() => {
                return mockReadStream;
            });
            // Execute
            yield provider.writeFile(filePath, mockReadStream);
            // Assert
            expect(fs_extra_1.default.ensureDir).toHaveBeenCalledWith(path_1.default.dirname(path_1.default.join(mockBasePath, filePath)));
            expect(fs_extra_1.default.createWriteStream).toHaveBeenCalledWith(path_1.default.join(mockBasePath, filePath));
            expect(mockReadStream.pipe).toHaveBeenCalledWith(mockWriteStream);
        }));
        it('should handle stream errors', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock implementations
            fs_extra_1.default.ensureDir.mockResolvedValue(undefined);
            const mockWriteStream = {
                on: jest.fn().mockImplementation((event, callback) => {
                    if (event === 'error') {
                        callback(new Error('Write error'));
                    }
                    return mockWriteStream;
                }),
                pipe: jest.fn()
            };
            fs_extra_1.default.createWriteStream.mockReturnValue(mockWriteStream);
            // Test data
            const filePath = 'test/file.txt';
            const mockReadStream = new stream_1.Readable({
                read() { }
            });
            mockReadStream.pipe = jest.fn();
            mockReadStream.on = jest.fn().mockImplementation(() => {
                return mockReadStream;
            });
            // Execute and assert
            yield expect(provider.writeFile(filePath, mockReadStream)).rejects.toThrow('Write error');
        }));
    });
    describe('readFile', () => {
        it('should read file content', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock implementations
            const fileContent = Buffer.from('test content');
            fs_extra_1.default.readFile.mockResolvedValue(fileContent);
            // Test data
            const filePath = 'test/file.txt';
            // Execute
            const result = yield provider.readFile(filePath);
            // Assert
            expect(fs_extra_1.default.readFile).toHaveBeenCalledWith(path_1.default.join(mockBasePath, filePath));
            expect(result).toBe(fileContent);
        }));
    });
    describe('createReadStream', () => {
        it('should create a readable stream for a file', () => {
            // Mock implementations
            const mockStream = { mock: 'stream' };
            fs_extra_1.default.createReadStream.mockReturnValue(mockStream);
            // Test data
            const filePath = 'test/file.txt';
            // Execute
            const result = provider.createReadStream(filePath);
            // Assert
            expect(fs_extra_1.default.createReadStream).toHaveBeenCalledWith(path_1.default.join(mockBasePath, filePath));
            expect(result).toBe(mockStream);
        });
    });
    describe('createWriteStream', () => {
        it('should create a writable stream for a file', () => {
            // Mock implementations
            const mockStream = { mock: 'stream' };
            fs_extra_1.default.createWriteStream.mockReturnValue(mockStream);
            fs_extra_1.default.ensureDir.mockResolvedValue(undefined);
            // Test data
            const filePath = 'test/file.txt';
            // Execute
            const result = provider.createWriteStream(filePath);
            // Assert
            expect(fs_extra_1.default.createWriteStream).toHaveBeenCalledWith(path_1.default.join(mockBasePath, filePath));
            expect(result).toBe(mockStream);
        });
    });
    describe('deleteFile', () => {
        it('should delete a file', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock implementations
            fs_extra_1.default.remove.mockResolvedValue(undefined);
            // Test data
            const filePath = 'test/file.txt';
            // Execute
            yield provider.deleteFile(filePath);
            // Assert
            expect(fs_extra_1.default.remove).toHaveBeenCalledWith(path_1.default.join(mockBasePath, filePath));
        }));
    });
    describe('fileExists', () => {
        it('should return true if file exists', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock implementations
            fs_extra_1.default.stat.mockResolvedValue({ isFile: () => true });
            // Test data
            const filePath = 'test/file.txt';
            // Execute
            const result = yield provider.fileExists(filePath);
            // Assert
            expect(fs_extra_1.default.stat).toHaveBeenCalledWith(path_1.default.join(mockBasePath, filePath));
            expect(result).toBe(true);
        }));
        it('should return false if file doesnt exist', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock implementations
            fs_extra_1.default.stat.mockRejectedValue(new Error('File not found'));
            // Test data
            const filePath = 'test/file.txt';
            // Execute
            const result = yield provider.fileExists(filePath);
            // Assert
            expect(fs_extra_1.default.stat).toHaveBeenCalledWith(path_1.default.join(mockBasePath, filePath));
            expect(result).toBe(false);
        }));
    });
    describe('createDirectory', () => {
        it('should create a directory', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock implementations
            fs_extra_1.default.ensureDir.mockResolvedValue(undefined);
            // Test data
            const dirPath = 'test/directory';
            // Execute
            yield provider.createDirectory(dirPath);
            // Assert
            expect(fs_extra_1.default.ensureDir).toHaveBeenCalledWith(path_1.default.join(mockBasePath, dirPath));
        }));
    });
    describe('listDirectory', () => {
        it('should list directory contents', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock implementations
            const fileList = ['file1.txt', 'file2.txt'];
            fs_extra_1.default.readdir.mockResolvedValue(fileList);
            // Test data
            const dirPath = 'test/directory';
            // Execute
            const result = yield provider.listDirectory(dirPath);
            // Assert
            expect(fs_extra_1.default.readdir).toHaveBeenCalledWith(path_1.default.join(mockBasePath, dirPath));
            expect(result).toEqual(fileList);
        }));
        it('should return empty array if directory doesnt exist', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock implementations
            const error = new Error('Directory not found');
            error.code = 'ENOENT';
            fs_extra_1.default.readdir.mockRejectedValue(error);
            // Test data
            const dirPath = 'test/directory';
            // Execute
            const result = yield provider.listDirectory(dirPath);
            // Assert
            expect(fs_extra_1.default.readdir).toHaveBeenCalledWith(path_1.default.join(mockBasePath, dirPath));
            expect(result).toEqual([]);
        }));
        it('should throw other errors', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock implementations
            const error = new Error('Permission denied');
            fs_extra_1.default.readdir.mockRejectedValue(error);
            // Test data
            const dirPath = 'test/directory';
            // Execute and assert
            yield expect(provider.listDirectory(dirPath)).rejects.toThrow('Permission denied');
        }));
    });
    describe('getPublicUrl', () => {
        it('should return a public URL for a file', () => __awaiter(void 0, void 0, void 0, function* () {
            // Test data
            const filePath = 'test/file.txt';
            // Execute
            const result = yield provider.getPublicUrl(filePath);
            // Assert
            expect(result).toBe(`${mockUrlPrefix}/${filePath}`);
        }));
        it('should throw error if URL prefix is not configured', () => __awaiter(void 0, void 0, void 0, function* () {
            // Setup provider with no URL prefix
            provider = new local_file_system_provider_1.LocalFileSystemProvider({
                type: 'local',
                basePath: mockBasePath
            });
            // Test data
            const filePath = 'test/file.txt';
            // Execute and assert
            yield expect(provider.getPublicUrl(filePath)).rejects.toThrow('URL prefix not configured');
        }));
    });
    describe('getSignedUrl', () => {
        it('should generate a signed URL with expiration token', () => __awaiter(void 0, void 0, void 0, function* () {
            // Test data
            const filePath = 'test/file.txt';
            const expiry = 3600; // 1 hour
            // Execute
            const result = yield provider.getSignedUrl(filePath, expiry);
            // Assert
            expect(result).toContain(`${mockUrlPrefix}/${filePath}?token=`);
            expect(result).toContain('&expires=');
        }));
    });
});
//# sourceMappingURL=local-file-system.provider.test.js.map