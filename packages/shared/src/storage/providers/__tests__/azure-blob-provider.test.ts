import { AzureBlobProvider } from '../azure-blob-provider';
import { Readable, Writable } from 'stream';

// Mock the Azure Storage SDK
jest.mock('@azure/storage-blob', () => {
  // Create mock implementations for all Azure Blob Storage classes
  const mockBlockBlobClient = {
    upload: jest.fn().mockResolvedValue({}),
    download: jest.fn().mockResolvedValue({
      readableStreamBody: {
        on: jest.fn().mockImplementation((event, cb) => {
          if (event === 'data') cb(Buffer.from('test data'));
          if (event === 'end') cb();
          return this;
        }),
        pipe: jest.fn().mockReturnThis(),
      },
    }),
    delete: jest.fn().mockResolvedValue({}),
    exists: jest.fn().mockResolvedValue(true),
    getProperties: jest.fn().mockResolvedValue({
      contentLength: 100,
      contentType: 'text/plain',
      lastModified: new Date(),
      createdOn: new Date(),
      metadata: { customKey: 'customValue' },
    }),
    setMetadata: jest.fn().mockResolvedValue({}),
    setHTTPHeaders: jest.fn().mockResolvedValue({}),
    url: 'https://test-account.blob.core.windows.net/container/blob',
  };

  const mockContainerClient = {
    getBlockBlobClient: jest.fn().mockReturnValue(mockBlockBlobClient),
    listBlobsFlat: jest.fn().mockImplementation(() => {
      const items = [
        { name: 'test-basepath/test-dir/file1.txt' },
        { name: 'test-basepath/test-dir/file2.txt' },
        { name: 'test-basepath/test-dir/subdir/file3.txt' },
      ];
      return {
        [Symbol.asyncIterator]: () => {
          let index = 0;
          return {
            next: async () => {
              if (index < items.length) {
                return { value: items[index++], done: false };
              }
              return { done: true };
            },
          };
        },
      };
    }),
    getProperties: jest.fn().mockResolvedValue({
      blobPublicAccess: 'container',
    }),
  };

  const mockBlobServiceClient = {
    getContainerClient: jest.fn().mockReturnValue(mockContainerClient),
  };

  return {
    BlobServiceClient: {
      fromConnectionString: jest.fn().mockReturnValue(mockBlobServiceClient),
    },
    StorageSharedKeyCredential: jest.fn(),
    BlobSASPermissions: {
      parse: jest.fn().mockReturnValue({}),
    },
    generateBlobSASQueryParameters: jest.fn().mockReturnValue({
      toString: () => 'sasToken',
    }),
    ContainerClient: jest.fn(),
    BlockBlobClient: jest.fn(),
    BlobSASSignatureValues: jest.fn(),
  };
});

// Mock Stream class
class MockReadable extends Readable {
  constructor(private data: Buffer) {
    super();
  }
  _read() {
    this.push(this.data);
    this.push(null);
  }
}

class MockWritable extends Writable {
  private chunks: any[] = [];
  _write(chunk: any, _encoding: string, callback: Function) {
    this.chunks.push(chunk);
    callback();
  }
  getContents() {
    return Buffer.concat(this.chunks);
  }
}

describe('AzureBlobProvider', () => {
  let provider: AzureBlobProvider;
  
  const config = {
    type: 'azure',
    accountName: 'test-account',
    accountKey: 'test-key',
    containerName: 'test-container',
    basePath: 'test-basepath',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Initialize provider
    provider = new AzureBlobProvider(config);
  });

  describe('writeFile', () => {
    it('should upload a buffer to Azure Blob Storage', async () => {
      const mockData = Buffer.from('test data');
      const mockPath = 'test-file.txt';
      
      await provider.writeFile(mockPath, mockData);
      
      // Verification happens through the mock assertions
      expect(await provider.fileExists(mockPath)).toBe(true);
    });

    it('should upload a stream to Azure Blob Storage', async () => {
      const mockData = new MockReadable(Buffer.from('test data'));
      const mockPath = 'test-file.txt';
      
      await provider.writeFile(mockPath, mockData);
      
      // Verification happens through the mock assertions
      expect(await provider.fileExists(mockPath)).toBe(true);
    });
  });

  describe('readFile', () => {
    it('should read a file from Azure Blob Storage', async () => {
      const mockPath = 'test-file.txt';
      
      const result = await provider.readFile(mockPath);
      
      // Azure SDK mock is set up to return 'test data'
      expect(result.toString()).toBe('test data');
    });

    it('should throw an error if file has no content', async () => {
      const mockPath = 'empty-file.txt';
      
      // Override the mock for this test to return no readable stream
      const mockClientModule = require('@azure/storage-blob');
      mockClientModule.BlobServiceClient
        .fromConnectionString()
        .getContainerClient()
        .getBlockBlobClient()
        .download
        .mockResolvedValueOnce({});
      
      await expect(provider.readFile(mockPath)).rejects.toThrow();
    });
  });

  describe('deleteFile', () => {
    it('should delete a file from Azure Blob Storage', async () => {
      const mockPath = 'test-file.txt';
      
      await provider.deleteFile(mockPath);
      
      // Verification happens through the mock assertions
      const mockClientModule = require('@azure/storage-blob');
      expect(mockClientModule.BlobServiceClient
        .fromConnectionString()
        .getContainerClient()
        .getBlockBlobClient()
        .delete).toHaveBeenCalled();
    });
  });

  describe('fileExists', () => {
    it('should return true if file exists', async () => {
      const mockPath = 'test-file.txt';
      
      const exists = await provider.fileExists(mockPath);
      
      expect(exists).toBe(true);
    });

    it('should return false if file does not exist', async () => {
      const mockPath = 'nonexistent-file.txt';
      
      // Override the mock for this test to return false
      const mockClientModule = require('@azure/storage-blob');
      mockClientModule.BlobServiceClient
        .fromConnectionString()
        .getContainerClient()
        .getBlockBlobClient()
        .exists
        .mockResolvedValueOnce(false);
      
      const exists = await provider.fileExists(mockPath);
      
      expect(exists).toBe(false);
    });
  });

  describe('createDirectory', () => {
    it('should create a directory marker in Azure Blob Storage', async () => {
      const mockPath = 'test-directory';
      
      await provider.createDirectory(mockPath);
      
      // Verification happens through the mock assertions
      const mockClientModule = require('@azure/storage-blob');
      expect(mockClientModule.BlobServiceClient
        .fromConnectionString()
        .getContainerClient()
        .getBlockBlobClient()
        .upload).toHaveBeenCalled();
    });
  });

  describe('listDirectory', () => {
    it('should list directory contents from Azure Blob Storage', async () => {
      const mockPath = 'test-dir';
      
      const results = await provider.listDirectory(mockPath);
      
      // Based on our mock implementation
      expect(results).toContain('file1.txt');
      expect(results).toContain('file2.txt');
      expect(results).toContain('subdir');
    });
  });

  describe('deleteDirectory', () => {
    it('should delete an empty directory non-recursively', async () => {
      const mockPath = 'empty-dir';
      
      // Override the listBlobsFlat mock for this test
      const mockClientModule = require('@azure/storage-blob');
      const mockIterator = {
        [Symbol.asyncIterator]: () => {
          let index = 0;
          const items = [
            { name: 'test-basepath/empty-dir/_$folder$' }
          ];
          return {
            next: async () => {
              if (index < items.length) {
                return { value: items[index++], done: false };
              }
              return { done: true };
            },
          };
        },
      };
      
      mockClientModule.BlobServiceClient
        .fromConnectionString()
        .getContainerClient()
        .listBlobsFlat
        .mockImplementationOnce(() => mockIterator);
      
      await provider.deleteDirectory(mockPath, false);
      
      // Verification happens through the mock assertions
      expect(mockClientModule.BlobServiceClient
        .fromConnectionString()
        .getContainerClient()
        .getBlockBlobClient()
        .delete).toHaveBeenCalled();
    });

    it('should throw an error for non-empty directory when not recursive', async () => {
      const mockPath = 'non-empty-dir';
      
      // Our default mock has multiple files
      await expect(provider.deleteDirectory(mockPath, false)).rejects.toThrow();
    });

    it('should delete a directory and contents recursively', async () => {
      const mockPath = 'test-dir';
      
      await provider.deleteDirectory(mockPath, true);
      
      // Verification happens through the mock assertions
      const mockClientModule = require('@azure/storage-blob');
      expect(mockClientModule.BlobServiceClient
        .fromConnectionString()
        .getContainerClient()
        .getBlockBlobClient()
        .delete).toHaveBeenCalled();
    });
  });

  describe('getMetadata', () => {
    it('should get file metadata from Azure Blob Storage', async () => {
      const mockPath = 'test-file.txt';
      
      const metadata = await provider.getMetadata(mockPath);
      
      expect(metadata.name).toBe('test-file.txt');
      expect(metadata.size).toBe(100);
      expect(metadata.contentType).toBe('text/plain');
      expect(metadata.custom).toEqual({ customKey: 'customValue' });
    });
  });

  describe('updateMetadata', () => {
    it('should update metadata in Azure Blob Storage', async () => {
      const mockPath = 'test-file.txt';
      const newMetadata = {
        custom: { newKey: 'newValue' },
        contentType: 'application/json',
      };
      
      await provider.updateMetadata(mockPath, newMetadata);
      
      // Verification happens through the mock assertions
      const mockClientModule = require('@azure/storage-blob');
      expect(mockClientModule.BlobServiceClient
        .fromConnectionString()
        .getContainerClient()
        .getBlockBlobClient()
        .setMetadata).toHaveBeenCalledWith(newMetadata.custom);
      
      expect(mockClientModule.BlobServiceClient
        .fromConnectionString()
        .getContainerClient()
        .getBlockBlobClient()
        .setHTTPHeaders).toHaveBeenCalledWith({
          blobContentType: 'application/json',
        });
    });
  });

  describe('getPublicUrl', () => {
    it('should generate a public URL for Azure Blob Storage object', async () => {
      const mockPath = 'test-file.txt';
      
      const url = await provider.getPublicUrl(mockPath);
      
      expect(url).toBe('https://test-account.blob.core.windows.net/container/blob');
    });

    it('should throw error for public URL if container is not public', async () => {
      const mockPath = 'test-file.txt';
      
      // Override the getProperties mock for this test
      const mockClientModule = require('@azure/storage-blob');
      mockClientModule.BlobServiceClient
        .fromConnectionString()
        .getContainerClient()
        .getProperties
        .mockResolvedValueOnce({
          blobPublicAccess: undefined,
        });
      
      await expect(provider.getPublicUrl(mockPath, { access: 'public' })).rejects.toThrow();
    });
  });

  describe('getSignedUrl', () => {
    it('should generate a signed URL for Azure Blob Storage object', async () => {
      const mockPath = 'test-file.txt';
      const mockExpiry = 3600;
      
      const url = await provider.getSignedUrl(mockPath, mockExpiry);
      
      expect(url).toBe('https://test-account.blob.core.windows.net/container/blob?sasToken');
    });

    it('should throw error if account key is not provided', async () => {
      // Create provider without account key
      const providerNoKey = new AzureBlobProvider({
        ...config,
        accountKey: undefined as any,
        sasToken: 'dummy-sas',
      });
      
      await expect(providerNoKey.getSignedUrl('test.txt', 3600)).rejects.toThrow();
    });
  });

  // Test helper methods
  describe('getBasePath', () => {
    it('should return the configured base path', () => {
      expect(provider.getBasePath()).toBe('test-basepath');
    });
  });
});