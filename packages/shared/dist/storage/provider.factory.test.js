"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const provider_factory_1 = require("./provider.factory");
const local_file_system_provider_1 = require("./providers/local-file-system.provider");
describe('StorageProviderFactory', () => {
    // Mock a custom storage provider for testing
    class MockStorageProvider {
        constructor(config) {
            this.config = config;
            this.writeFile = jest.fn();
            this.readFile = jest.fn();
            this.createReadStream = jest.fn();
            this.createWriteStream = jest.fn();
            this.deleteFile = jest.fn();
            this.fileExists = jest.fn();
            this.createDirectory = jest.fn();
            this.listDirectory = jest.fn();
            this.deleteDirectory = jest.fn();
            this.getMetadata = jest.fn();
            this.updateMetadata = jest.fn();
            this.getPublicUrl = jest.fn();
            this.getSignedUrl = jest.fn();
            this.getBasePath = jest.fn().mockReturnValue('/mock/base/path');
        }
    }
    // Mock a second custom provider for testing multiple registrations
    class SecondMockProvider {
        constructor(config) {
            this.config = config;
            this.writeFile = jest.fn();
            this.readFile = jest.fn();
            this.createReadStream = jest.fn();
            this.createWriteStream = jest.fn();
            this.deleteFile = jest.fn();
            this.fileExists = jest.fn();
            this.createDirectory = jest.fn();
            this.listDirectory = jest.fn();
            this.deleteDirectory = jest.fn();
            this.getMetadata = jest.fn();
            this.updateMetadata = jest.fn();
            this.getPublicUrl = jest.fn();
            this.getSignedUrl = jest.fn();
            this.getBasePath = jest.fn().mockReturnValue('/second/mock/path');
        }
    }
    beforeEach(() => {
        // Reset the providers map between tests
        // This requires accessing the private static property
        provider_factory_1.StorageProviderFactory.providers = {
            local: local_file_system_provider_1.LocalFileSystemProvider,
        };
    });
    describe('registerProvider', () => {
        it('should register a new provider type', () => {
            // Register a new provider
            provider_factory_1.StorageProviderFactory.registerProvider('mock', MockStorageProvider);
            // Create a provider of the newly registered type
            const config = { type: 'mock', key: 'value' };
            const provider = provider_factory_1.StorageProviderFactory.createProvider(config);
            // Assert
            expect(provider).toBeInstanceOf(MockStorageProvider);
        });
        it('should register multiple provider types', () => {
            // Register multiple providers
            provider_factory_1.StorageProviderFactory.registerProvider('mock1', MockStorageProvider);
            provider_factory_1.StorageProviderFactory.registerProvider('mock2', SecondMockProvider);
            // Create providers of each type
            const config1 = { type: 'mock1', key: 'value1' };
            const config2 = { type: 'mock2', key: 'value2' };
            const provider1 = provider_factory_1.StorageProviderFactory.createProvider(config1);
            const provider2 = provider_factory_1.StorageProviderFactory.createProvider(config2);
            // Assert
            expect(provider1).toBeInstanceOf(MockStorageProvider);
            expect(provider2).toBeInstanceOf(SecondMockProvider);
        });
        it('should allow overriding an existing provider registration', () => {
            // Register a provider with the same type as an existing one
            provider_factory_1.StorageProviderFactory.registerProvider('local', MockStorageProvider);
            // Create a provider of the overridden type
            const config = { type: 'local', basePath: '/path/to/storage' };
            const provider = provider_factory_1.StorageProviderFactory.createProvider(config);
            // Assert
            expect(provider).toBeInstanceOf(MockStorageProvider);
            expect(provider).not.toBeInstanceOf(local_file_system_provider_1.LocalFileSystemProvider);
        });
    });
    describe('createProvider', () => {
        it('should create a local file system provider', () => {
            const config = {
                type: 'local',
                basePath: '/path/to/storage',
                urlPrefix: 'http://example.com/files'
            };
            const provider = provider_factory_1.StorageProviderFactory.createProvider(config);
            expect(provider).toBeInstanceOf(local_file_system_provider_1.LocalFileSystemProvider);
        });
        it('should pass configuration to the provider constructor', () => {
            // Register a test provider
            provider_factory_1.StorageProviderFactory.registerProvider('mock', MockStorageProvider);
            // Create a complex configuration
            const complexConfig = {
                type: 'mock',
                testString: 'test value',
                testNumber: 42,
                testBool: true,
                nested: {
                    prop1: 'value1',
                    prop2: 'value2'
                },
                array: [1, 2, 3]
            };
            // Create the provider
            const provider = provider_factory_1.StorageProviderFactory.createProvider(complexConfig);
            // We can verify the instance was created and is of correct type
            expect(provider).toBeInstanceOf(MockStorageProvider);
        });
        it('should throw error for unknown provider type', () => {
            const config = { type: 'unknown' };
            expect(() => {
                provider_factory_1.StorageProviderFactory.createProvider(config);
            }).toThrow("Storage provider type 'unknown' is not registered");
        });
        it('should throw error for missing type in config', () => {
            const config = {};
            expect(() => {
                provider_factory_1.StorageProviderFactory.createProvider(config);
            }).toThrow();
        });
        it('should handle null or undefined config gracefully', () => {
            expect(() => {
                // @ts-ignore - intentionally passing invalid config
                provider_factory_1.StorageProviderFactory.createProvider(null);
            }).toThrow();
            expect(() => {
                // @ts-ignore - intentionally passing invalid config
                provider_factory_1.StorageProviderFactory.createProvider(undefined);
            }).toThrow();
        });
    });
    describe('createLocalProvider', () => {
        it('should create a local file system provider directly', () => {
            const config = {
                type: 'local',
                basePath: '/path/to/storage',
                urlPrefix: 'http://example.com/files'
            };
            const provider = provider_factory_1.StorageProviderFactory.createLocalProvider(config);
            expect(provider).toBeInstanceOf(local_file_system_provider_1.LocalFileSystemProvider);
        });
        it('should create a provider with minimal configuration', () => {
            const minimalConfig = {
                type: 'local',
                basePath: '/path'
            };
            const provider = provider_factory_1.StorageProviderFactory.createLocalProvider(minimalConfig);
            expect(provider).toBeInstanceOf(local_file_system_provider_1.LocalFileSystemProvider);
        });
    });
    describe('provider factory integration', () => {
        it('should correctly create and use different provider types', () => {
            // Register multiple provider types
            provider_factory_1.StorageProviderFactory.registerProvider('mock', MockStorageProvider);
            // Create configs for different providers
            const localConfig = {
                type: 'local',
                basePath: '/local/path'
            };
            const mockConfig = Object.assign({ type: 'mock' }, { testOption: 'value' });
            // Create providers
            const localProvider = provider_factory_1.StorageProviderFactory.createProvider(localConfig);
            const mockProvider = provider_factory_1.StorageProviderFactory.createProvider(mockConfig);
            // Verify correct instances
            expect(localProvider).toBeInstanceOf(local_file_system_provider_1.LocalFileSystemProvider);
            expect(mockProvider).toBeInstanceOf(MockStorageProvider);
            // Verify methods are callable (without executing real implementation)
            expect(() => {
                mockProvider.fileExists('test.txt');
            }).not.toThrow();
        });
    });
});
//# sourceMappingURL=provider.factory.test.js.map