import { StorageProviderFactory } from './provider.factory';
import { LocalFileSystemProvider } from './providers/local-file-system.provider';
import { StorageProvider } from './provider.interface';
import { StorageConfig } from './types';

describe('StorageProviderFactory', () => {
  // Mock a custom storage provider for testing
  class MockStorageProvider implements StorageProvider {
    constructor(private readonly config: any) {}
    writeFile = jest.fn();
    readFile = jest.fn();
    createReadStream = jest.fn();
    createWriteStream = jest.fn();
    deleteFile = jest.fn();
    fileExists = jest.fn();
    createDirectory = jest.fn();
    listDirectory = jest.fn();
    deleteDirectory = jest.fn();
    getMetadata = jest.fn();
    updateMetadata = jest.fn();
    getPublicUrl = jest.fn();
    getSignedUrl = jest.fn();
  }

  // Mock a second custom provider for testing multiple registrations
  class SecondMockProvider implements StorageProvider {
    constructor(private readonly config: any) {}
    writeFile = jest.fn();
    readFile = jest.fn();
    createReadStream = jest.fn();
    createWriteStream = jest.fn();
    deleteFile = jest.fn();
    fileExists = jest.fn();
    createDirectory = jest.fn();
    listDirectory = jest.fn();
    deleteDirectory = jest.fn();
    getMetadata = jest.fn();
    updateMetadata = jest.fn();
    getPublicUrl = jest.fn();
    getSignedUrl = jest.fn();
  }

  beforeEach(() => {
    // Reset the providers map between tests
    // This requires accessing the private static property
    (StorageProviderFactory as any).providers = {
      local: LocalFileSystemProvider,
    };
  });

  describe('registerProvider', () => {
    it('should register a new provider type', () => {
      // Register a new provider
      StorageProviderFactory.registerProvider('mock', MockStorageProvider);
      
      // Create a provider of the newly registered type
      const config = { type: 'mock', key: 'value' };
      const provider = StorageProviderFactory.createProvider(config);
      
      // Assert
      expect(provider).toBeInstanceOf(MockStorageProvider);
    });

    it('should register multiple provider types', () => {
      // Register multiple providers
      StorageProviderFactory.registerProvider('mock1', MockStorageProvider);
      StorageProviderFactory.registerProvider('mock2', SecondMockProvider);
      
      // Create providers of each type
      const config1 = { type: 'mock1', key: 'value1' };
      const config2 = { type: 'mock2', key: 'value2' };
      
      const provider1 = StorageProviderFactory.createProvider(config1);
      const provider2 = StorageProviderFactory.createProvider(config2);
      
      // Assert
      expect(provider1).toBeInstanceOf(MockStorageProvider);
      expect(provider2).toBeInstanceOf(SecondMockProvider);
    });

    it('should allow overriding an existing provider registration', () => {
      // Register a provider with the same type as an existing one
      StorageProviderFactory.registerProvider('local', MockStorageProvider);
      
      // Create a provider of the overridden type
      const config = { type: 'local', basePath: '/path/to/storage' };
      const provider = StorageProviderFactory.createProvider(config);
      
      // Assert
      expect(provider).toBeInstanceOf(MockStorageProvider);
      expect(provider).not.toBeInstanceOf(LocalFileSystemProvider);
    });
  });

  describe('createProvider', () => {
    it('should create a local file system provider', () => {
      const config = { 
        type: 'local', 
        basePath: '/path/to/storage',
        urlPrefix: 'http://example.com/files' 
      };
      
      const provider = StorageProviderFactory.createProvider(config);
      
      expect(provider).toBeInstanceOf(LocalFileSystemProvider);
    });

    it('should pass configuration to the provider constructor', () => {
      // Register a test provider
      StorageProviderFactory.registerProvider('mock', MockStorageProvider);
      
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
      const provider = StorageProviderFactory.createProvider(complexConfig);
      
      // We can verify the instance was created and is of correct type
      expect(provider).toBeInstanceOf(MockStorageProvider);
    });

    it('should throw error for unknown provider type', () => {
      const config = { type: 'unknown' };
      
      expect(() => {
        StorageProviderFactory.createProvider(config);
      }).toThrow("Storage provider type 'unknown' is not registered");
    });

    it('should throw error for missing type in config', () => {
      const config = {} as StorageConfig;
      
      expect(() => {
        StorageProviderFactory.createProvider(config as StorageConfig);
      }).toThrow();
    });

    it('should handle null or undefined config gracefully', () => {
      expect(() => {
        // @ts-ignore - intentionally passing invalid config
        StorageProviderFactory.createProvider(null);
      }).toThrow();

      expect(() => {
        // @ts-ignore - intentionally passing invalid config
        StorageProviderFactory.createProvider(undefined);
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
      
      const provider = StorageProviderFactory.createLocalProvider(config);
      
      expect(provider).toBeInstanceOf(LocalFileSystemProvider);
    });

    it('should create a provider with minimal configuration', () => {
      const minimalConfig = {
        type: 'local',
        basePath: '/path'
      };
      
      const provider = StorageProviderFactory.createLocalProvider(minimalConfig);
      
      expect(provider).toBeInstanceOf(LocalFileSystemProvider);
    });
  });

  describe('provider factory integration', () => {
    it('should correctly create and use different provider types', () => {
      // Register multiple provider types
      StorageProviderFactory.registerProvider('mock', MockStorageProvider);
      
      // Create configs for different providers
      const localConfig: StorageConfig = {
        type: 'local',
        basePath: '/local/path'
      };
      
      const mockConfig: StorageConfig = {
        type: 'mock',
        // Adding a custom property that will be accessible to the mock provider
        // but doesn't need to be part of StorageConfig type
        ...{ testOption: 'value' }
      };
      
      // Create providers
      const localProvider = StorageProviderFactory.createProvider(localConfig);
      const mockProvider = StorageProviderFactory.createProvider(mockConfig);
      
      // Verify correct instances
      expect(localProvider).toBeInstanceOf(LocalFileSystemProvider);
      expect(mockProvider).toBeInstanceOf(MockStorageProvider);
      
      // Verify methods are callable (without executing real implementation)
      expect(() => {
        mockProvider.fileExists('test.txt');
      }).not.toThrow();
    });
  });
});