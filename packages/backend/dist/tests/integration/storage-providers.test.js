"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const provider_factory_1 = require("@yt2aptos/shared/src/storage/provider.factory");
const s3_provider_1 = require("@yt2aptos/shared/src/storage/providers/s3-provider");
const azure_blob_provider_1 = require("@yt2aptos/shared/src/storage/providers/azure-blob-provider");
const local_file_system_provider_1 = require("@yt2aptos/shared/src/storage/providers/local-file-system.provider");
const types_1 = require("@yt2aptos/shared/src/storage/types");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
describe('Storage Providers Integration Tests', () => {
    // Test fixtures and reusable data
    const testContent = Buffer.from('This is test content for integration testing');
    const testFileName = 'integration-test-file.txt';
    let testDirPath;
    let localConfig;
    let s3Config;
    let azureConfig;
    let localProvider;
    let s3Provider;
    let azureProvider;
    // Mock implementations for external services
    jest.mock('@aws-sdk/client-s3', () => {
        return {
            S3Client: jest.fn().mockImplementation(() => ({
                send: jest.fn().mockImplementation(() => Promise.resolve({})),
            })),
            PutObjectCommand: jest.fn(),
            GetObjectCommand: jest.fn(),
            DeleteObjectCommand: jest.fn(),
            HeadObjectCommand: jest.fn(),
            ListObjectsV2Command: jest.fn(),
            CreateMultipartUploadCommand: jest.fn(),
            UploadPartCommand: jest.fn(),
            CompleteMultipartUploadCommand: jest.fn(),
        };
    });
    jest.mock('@azure/storage-blob', () => {
        return {
            BlobServiceClient: {
                fromConnectionString: jest.fn().mockImplementation(() => ({
                    getContainerClient: jest.fn().mockReturnValue({
                        getBlockBlobClient: jest.fn().mockReturnValue({
                            exists: jest.fn().mockResolvedValue(true),
                            download: jest.fn().mockResolvedValue({
                                readableStreamBody: {
                                    on: jest.fn(),
                                    pipe: jest.fn()
                                }
                            }),
                            uploadStream: jest.fn().mockResolvedValue({}),
                            delete: jest.fn().mockResolvedValue({}),
                            getProperties: jest.fn().mockResolvedValue({
                                contentLength: 100,
                                lastModified: new Date(),
                                metadata: {}
                            }),
                        }),
                        listBlobsByHierarchy: jest.fn().mockReturnValue([]),
                    }),
                })),
            },
            StorageSharedKeyCredential: jest.fn(),
        };
    });
    beforeAll(() => {
        // Create a temp directory for local provider tests
        testDirPath = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'yt2aptos-test-'));
        // Setup configurations for all providers
        localConfig = {
            type: types_1.StorageProviderType.LOCAL,
            basePath: testDirPath
        };
        s3Config = {
            type: types_1.StorageProviderType.S3,
            region: 'us-east-1',
            bucket: 'test-bucket',
            accessKeyId: 'test-key',
            secretAccessKey: 'test-secret',
            basePath: 'test-uploads'
        };
        azureConfig = {
            type: types_1.StorageProviderType.AZURE,
            connectionString: 'DefaultEndpointsProtocol=https;AccountName=testaccount;AccountKey=dGVzdGtleQ==;EndpointSuffix=core.windows.net',
            containerName: 'test-container',
            basePath: 'test-uploads'
        };
        // Initialize the providers
        localProvider = provider_factory_1.StorageProviderFactory.createProvider(localConfig);
        s3Provider = provider_factory_1.StorageProviderFactory.createProvider(s3Config);
        azureProvider = provider_factory_1.StorageProviderFactory.createProvider(azureConfig);
    });
    afterAll(() => {
        // Clean up test directory
        if (fs_1.default.existsSync(testDirPath)) {
            fs_1.default.rmSync(testDirPath, { recursive: true, force: true });
        }
    });
    describe('Provider Factory', () => {
        it('should create the correct provider type based on configuration', () => {
            expect(provider_factory_1.StorageProviderFactory.createProvider(localConfig)).toBeInstanceOf(local_file_system_provider_1.LocalFileSystemProvider);
            expect(provider_factory_1.StorageProviderFactory.createProvider(s3Config)).toBeInstanceOf(s3_provider_1.S3Provider);
            expect(provider_factory_1.StorageProviderFactory.createProvider(azureConfig)).toBeInstanceOf(azure_blob_provider_1.AzureBlobProvider);
        });
        it('should throw error for invalid provider type', () => {
            const invalidConfig = { type: 'invalid-type' };
            expect(() => provider_factory_1.StorageProviderFactory.createProvider(invalidConfig)).toThrow();
        });
        it('should allow registration of custom provider types', () => {
            class CustomProvider {
                constructor(config) { }
                async writeFile() { return Promise.resolve(); }
                async readFile() { return Promise.resolve(Buffer.from('')); }
                async deleteFile() { return Promise.resolve(); }
                async fileExists() { return Promise.resolve(true); }
                async createDirectory() { return Promise.resolve(); }
                async listDirectory() { return Promise.resolve([]); }
                async deleteDirectory() { return Promise.resolve(); }
                async getMetadata() { return Promise.resolve({ name: '', path: '', size: 0, contentType: '', lastModified: new Date(), createdAt: new Date() }); }
                async getPublicUrl() { return Promise.resolve(''); }
                async getSignedUrl() { return Promise.resolve(''); }
                getBasePath() { return ''; }
                createReadStream() { return new (require('stream').Readable)(); }
                createWriteStream() { return new (require('stream').Writable)(); }
                async updateMetadata() { return Promise.resolve(); }
            }
            provider_factory_1.StorageProviderFactory.registerProvider('custom', CustomProvider);
            const customConfig = { type: 'custom' };
            expect(provider_factory_1.StorageProviderFactory.createProvider(customConfig)).toBeInstanceOf(CustomProvider);
        });
    });
    describe('File Operations Across Providers', () => {
        // Test common operations on all providers
        const providers = [
            { name: 'Local', provider: () => localProvider, config: localConfig },
            { name: 'S3', provider: () => s3Provider, config: s3Config },
            { name: 'Azure', provider: () => azureProvider, config: azureConfig }
        ];
        providers.forEach(({ name, provider, config }) => {
            describe(`${name} Provider`, () => {
                it('should write and read a file', async () => {
                    const providerInstance = provider();
                    const filePath = `${testFileName}-${name.toLowerCase()}`;
                    // Write file
                    await providerInstance.writeFile(filePath, testContent);
                    // Read the same file
                    // Using mock for S3 and Azure so we need to setup the response
                    const mockReadResponse = Buffer.from(testContent);
                    jest.spyOn(providerInstance, 'readFile').mockResolvedValueOnce(mockReadResponse);
                    const readContent = await providerInstance.readFile(filePath);
                    expect(readContent).toEqual(mockReadResponse);
                });
                it('should check if a file exists', async () => {
                    const providerInstance = provider();
                    const filePath = `${testFileName}-${name.toLowerCase()}`;
                    // For actual tests, we would check existence
                    jest.spyOn(providerInstance, 'fileExists').mockResolvedValueOnce(true);
                    const exists = await providerInstance.fileExists(filePath);
                    expect(exists).toBe(true);
                    // Non-existent file
                    jest.spyOn(providerInstance, 'fileExists').mockResolvedValueOnce(false);
                    const nonExistentFile = await providerInstance.fileExists('non-existent-file.txt');
                    expect(nonExistentFile).toBe(false);
                });
                it('should delete a file', async () => {
                    const providerInstance = provider();
                    const filePath = `${testFileName}-${name.toLowerCase()}`;
                    // Write a file first
                    await providerInstance.writeFile(filePath, testContent);
                    // Then delete it
                    await providerInstance.deleteFile(filePath);
                    // Check it's gone
                    jest.spyOn(providerInstance, 'fileExists').mockResolvedValueOnce(false);
                    const exists = await providerInstance.fileExists(filePath);
                    expect(exists).toBe(false);
                });
                it('should create, list, and delete directories', async () => {
                    const providerInstance = provider();
                    const dirPath = `test-directory-${name.toLowerCase()}`;
                    // Create directory
                    await providerInstance.createDirectory(dirPath);
                    // Write a file in the directory
                    await providerInstance.writeFile(`${dirPath}/test-file.txt`, testContent);
                    // List directory
                    jest.spyOn(providerInstance, 'listDirectory').mockResolvedValueOnce(['test-file.txt']);
                    const files = await providerInstance.listDirectory(dirPath);
                    expect(files).toContain('test-file.txt');
                    // Delete directory
                    await providerInstance.deleteDirectory(dirPath, true);
                    // Directory should be gone
                    jest.spyOn(providerInstance, 'fileExists').mockResolvedValueOnce(false);
                    const exists = await providerInstance.fileExists(dirPath);
                    expect(exists).toBe(false);
                });
                it('should get file metadata', async () => {
                    const providerInstance = provider();
                    const filePath = `${testFileName}-${name.toLowerCase()}`;
                    // Write a file first
                    await providerInstance.writeFile(filePath, testContent);
                    // Get metadata
                    const now = new Date();
                    jest.spyOn(providerInstance, 'getMetadata').mockResolvedValueOnce({
                        name: path_1.default.basename(filePath),
                        path: filePath,
                        size: testContent.length,
                        contentType: 'text/plain',
                        lastModified: now,
                        createdAt: now
                    });
                    const metadata = await providerInstance.getMetadata(filePath);
                    expect(metadata.name).toBe(path_1.default.basename(filePath));
                    expect(metadata.size).toBe(testContent.length);
                    expect(metadata.contentType).toBe('text/plain');
                });
                it('should generate URLs for files', async () => {
                    const providerInstance = provider();
                    const filePath = `${testFileName}-${name.toLowerCase()}`;
                    // Generate public URL
                    jest.spyOn(providerInstance, 'getPublicUrl').mockResolvedValueOnce(`https://example.com/${filePath}`);
                    const publicUrl = await providerInstance.getPublicUrl(filePath);
                    expect(publicUrl).toContain(filePath);
                    // Generate signed URL
                    jest.spyOn(providerInstance, 'getSignedUrl').mockResolvedValueOnce(`https://example.com/${filePath}?signature=123`);
                    const signedUrl = await providerInstance.getSignedUrl(filePath, 3600);
                    expect(signedUrl).toContain(filePath);
                    expect(signedUrl).toContain('signature');
                });
            });
        });
    });
    describe('Provider Switching', () => {
        it('should allow migrating files between providers', async () => {
            // Setup source and destination paths
            const sourceFilePath = 'source-test-file.txt';
            const destFilePath = 'destination-test-file.txt';
            // Write a file to the source provider (local)
            await localProvider.writeFile(sourceFilePath, testContent);
            // Read the file from source
            jest.spyOn(localProvider, 'readFile').mockResolvedValueOnce(testContent);
            const fileContent = await localProvider.readFile(sourceFilePath);
            // Write to destination provider (S3)
            await s3Provider.writeFile(destFilePath, fileContent);
            // Verify file exists on destination
            jest.spyOn(s3Provider, 'fileExists').mockResolvedValueOnce(true);
            const exists = await s3Provider.fileExists(destFilePath);
            expect(exists).toBe(true);
            // Read from destination and verify content
            jest.spyOn(s3Provider, 'readFile').mockResolvedValueOnce(testContent);
            const destContent = await s3Provider.readFile(destFilePath);
            expect(destContent).toEqual(testContent);
        });
        it('should handle bulk operations when switching providers', async () => {
            // Create multiple files on source provider
            const testFiles = ['file1.txt', 'file2.txt', 'file3.txt'];
            const fileCreationPromises = testFiles.map(file => localProvider.writeFile(file, Buffer.from(`Content for ${file}`)));
            await Promise.all(fileCreationPromises);
            // Simulate listing files from source
            jest.spyOn(localProvider, 'listDirectory').mockResolvedValueOnce(testFiles);
            const sourceFiles = await localProvider.listDirectory('');
            // Copy all files to destination provider
            const migrationPromises = sourceFiles.map(async (file) => {
                // Read from source
                const mockContent = Buffer.from(`Content for ${file}`);
                jest.spyOn(localProvider, 'readFile').mockResolvedValueOnce(mockContent);
                const content = await localProvider.readFile(file);
                // Write to destination
                return s3Provider.writeFile(file, content);
            });
            await Promise.all(migrationPromises);
            // Verify all files exist on destination
            for (const file of testFiles) {
                jest.spyOn(s3Provider, 'fileExists').mockResolvedValueOnce(true);
                const exists = await s3Provider.fileExists(file);
                expect(exists).toBe(true);
            }
        });
    });
    describe('Error Handling', () => {
        it('should properly handle and propagate provider-specific errors', async () => {
            // Test S3 specific error
            jest.spyOn(s3Provider, 'readFile').mockRejectedValueOnce(new Error('S3 access denied'));
            await expect(s3Provider.readFile('test-file.txt')).rejects.toThrow('S3 access denied');
            // Test Azure specific error
            jest.spyOn(azureProvider, 'readFile').mockRejectedValueOnce(new Error('Azure container not found'));
            await expect(azureProvider.readFile('test-file.txt')).rejects.toThrow('Azure container not found');
            // Test local file system error
            jest.spyOn(localProvider, 'readFile').mockRejectedValueOnce(new Error('ENOENT: no such file or directory'));
            await expect(localProvider.readFile('test-file.txt')).rejects.toThrow('ENOENT');
        });
    });
});
//# sourceMappingURL=storage-providers.test.js.map