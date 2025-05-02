import { S3Client } from '@aws-sdk/client-s3';
import { S3Provider } from '../s3-provider';
import { Readable, Writable } from 'stream';

// Mock the AWS SDK client and commands
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

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://signed-url.example.com'),
}));

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

describe('S3Provider', () => {
  let provider: S3Provider;
  let mockS3Client: any;
  
  const config = {
    type: 's3',
    region: 'us-east-1',
    bucket: 'test-bucket',
    accessKeyId: 'test-key',
    secretAccessKey: 'test-secret',
    basePath: 'test-base-path',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Initialize provider
    provider = new S3Provider(config);
    // @ts-ignore - Access the private client for testing
    mockS3Client = provider.client;
  });

  describe('writeFile', () => {
    it('should upload a buffer to S3', async () => {
      const mockData = Buffer.from('test data');
      const mockPath = 'test-file.txt';
      
      // Mock the S3 client response
      mockS3Client.send.mockResolvedValueOnce({});
      
      await provider.writeFile(mockPath, mockData);
      
      // Ensure the correct commands were called
      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
    });

    it('should upload a stream to S3', async () => {
      const mockData = new MockReadable(Buffer.from('test data'));
      const mockPath = 'test-file.txt';
      
      // Mock the S3 client response
      mockS3Client.send.mockResolvedValueOnce({});
      
      await provider.writeFile(mockPath, mockData);
      
      // Ensure the correct commands were called
      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('readFile', () => {
    it('should read a file from S3', async () => {
      const mockPath = 'test-file.txt';
      const mockFileContent = Buffer.from('test file content');
      
      // Create a mock readable stream for the S3 response
      const mockStream = new MockReadable(mockFileContent);
      
      // Mock the S3 client response
      mockS3Client.send.mockResolvedValueOnce({
        Body: mockStream,
      });
      
      const result = await provider.readFile(mockPath);
      
      // Ensure the correct commands were called
      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockFileContent);
    });

    it('should throw an error if file has no content', async () => {
      const mockPath = 'test-file.txt';
      
      // Mock the S3 client response with no Body
      mockS3Client.send.mockResolvedValueOnce({});
      
      await expect(provider.readFile(mockPath)).rejects.toThrow();
    });
  });

  describe('deleteFile', () => {
    it('should delete a file from S3', async () => {
      const mockPath = 'test-file.txt';
      
      // Mock the S3 client response
      mockS3Client.send.mockResolvedValueOnce({});
      
      await provider.deleteFile(mockPath);
      
      // Ensure the correct commands were called
      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('fileExists', () => {
    it('should return true if file exists', async () => {
      const mockPath = 'test-file.txt';
      
      // Mock the S3 client response
      mockS3Client.send.mockResolvedValueOnce({});
      
      const exists = await provider.fileExists(mockPath);
      
      // Ensure the correct commands were called
      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
      expect(exists).toBe(true);
    });

    it('should return false if file does not exist', async () => {
      const mockPath = 'nonexistent-file.txt';
      
      // Mock the S3 client throwing a NotFound error
      const error = new Error('File not found');
      (error as any).name = 'NotFound';
      mockS3Client.send.mockRejectedValueOnce(error);
      
      const exists = await provider.fileExists(mockPath);
      
      // Ensure the correct commands were called
      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
      expect(exists).toBe(false);
    });

    it('should propagate other errors', async () => {
      const mockPath = 'test-file.txt';
      
      // Mock the S3 client throwing another type of error
      mockS3Client.send.mockRejectedValueOnce(new Error('Other error'));
      
      await expect(provider.fileExists(mockPath)).rejects.toThrow('Other error');
    });
  });

  describe('createDirectory', () => {
    it('should create a directory marker in S3', async () => {
      const mockPath = 'test-directory';
      
      // Mock the S3 client response
      mockS3Client.send.mockResolvedValueOnce({});
      
      await provider.createDirectory(mockPath);
      
      // Ensure the correct commands were called
      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('listDirectory', () => {
    it('should list directory contents from S3', async () => {
      const mockPath = 'test-directory';
      
      // Mock the S3 client response
      mockS3Client.send.mockResolvedValueOnce({
        Contents: [
          { Key: 'test-base-path/test-directory/file1.txt' },
          { Key: 'test-base-path/test-directory/file2.txt' },
        ],
        CommonPrefixes: [
          { Prefix: 'test-base-path/test-directory/subdir1/' },
          { Prefix: 'test-base-path/test-directory/subdir2/' },
        ],
      });
      
      const results = await provider.listDirectory(mockPath);
      
      // Ensure the correct commands were called
      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
      expect(results).toContain('file1.txt');
      expect(results).toContain('file2.txt');
      expect(results).toContain('subdir1');
      expect(results).toContain('subdir2');
    });
  });

  describe('deleteDirectory', () => {
    it('should delete an empty directory non-recursively', async () => {
      const mockPath = 'test-directory';
      
      // Mock the S3 client response for listing (only directory marker)
      mockS3Client.send.mockResolvedValueOnce({
        Contents: [
          { Key: 'test-base-path/test-directory/' },
        ],
      });
      
      // Mock the S3 client response for deletion
      mockS3Client.send.mockResolvedValueOnce({});
      
      await provider.deleteDirectory(mockPath, false);
      
      // Ensure the correct commands were called
      expect(mockS3Client.send).toHaveBeenCalledTimes(2);
    });

    it('should throw an error for non-empty directory when not recursive', async () => {
      const mockPath = 'test-directory';
      
      // Mock the S3 client response for listing (directory has content)
      mockS3Client.send.mockResolvedValueOnce({
        Contents: [
          { Key: 'test-base-path/test-directory/' },
          { Key: 'test-base-path/test-directory/file.txt' },
        ],
      });
      
      await expect(provider.deleteDirectory(mockPath, false)).rejects.toThrow();
    });

    it('should delete a directory and contents recursively', async () => {
      const mockPath = 'test-directory';
      
      // Mock the S3 client responses
      mockS3Client.send.mockResolvedValueOnce({
        Contents: [
          { Key: 'test-base-path/test-directory/' },
          { Key: 'test-base-path/test-directory/file1.txt' },
          { Key: 'test-base-path/test-directory/file2.txt' },
        ],
        IsTruncated: false,
      });
      
      // Mock delete responses
      mockS3Client.send.mockResolvedValue({});
      
      await provider.deleteDirectory(mockPath, true);
      
      // Should call send at least 4 times (1 for list, 3 for deletes)
      expect(mockS3Client.send).toHaveBeenCalledTimes(4);
    });

    it('should handle paginated delete for large directories', async () => {
      const mockPath = 'test-directory';
      
      // Mock the S3 client responses for first page
      mockS3Client.send.mockResolvedValueOnce({
        Contents: [
          { Key: 'test-base-path/test-directory/file1.txt' },
        ],
        IsTruncated: true,
        NextContinuationToken: 'token',
      });
      
      // Mock the S3 client responses for second page
      mockS3Client.send.mockResolvedValueOnce({
        Contents: [
          { Key: 'test-base-path/test-directory/file2.txt' },
        ],
        IsTruncated: false,
      });
      
      // Mock delete responses
      mockS3Client.send.mockResolvedValue({});
      
      await provider.deleteDirectory(mockPath, true);
      
      // Should call send at least 4 times (2 for list, 2 for deletes)
      expect(mockS3Client.send).toHaveBeenCalledTimes(4);
    });
  });

  describe('getMetadata', () => {
    it('should get file metadata from S3', async () => {
      const mockPath = 'test-file.txt';
      const now = new Date();
      
      // Mock the S3 client response
      mockS3Client.send.mockResolvedValueOnce({
        ContentLength: 100,
        ContentType: 'text/plain',
        LastModified: now,
        Metadata: { customKey: 'customValue' },
      });
      
      const metadata = await provider.getMetadata(mockPath);
      
      // Ensure the correct commands were called
      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
      expect(metadata).toEqual({
        name: 'test-file.txt',
        path: mockPath,
        size: 100,
        contentType: 'text/plain',
        lastModified: now,
        createdAt: now, // S3 doesn't track creation time separately
        custom: { customKey: 'customValue' },
      });
    });
  });

  describe('getPublicUrl', () => {
    it('should generate a public URL for S3 object', async () => {
      const mockPath = 'test-file.txt';
      
      // Mock the S3 client response
      mockS3Client.send.mockResolvedValueOnce({});
      
      const url = await provider.getPublicUrl(mockPath);
      
      // Ensure the correct commands were called
      expect(mockS3Client.send).toHaveBeenCalledTimes(0); // No need to call S3 for basic URL
      expect(url).toContain('test-bucket');
      expect(url).toContain('test-base-path/test-file.txt');
    });

    it('should make object public when requested', async () => {
      const mockPath = 'test-file.txt';
      
      // Mock the S3 client response
      mockS3Client.send.mockResolvedValueOnce({});
      
      const url = await provider.getPublicUrl(mockPath, { access: 'public' });
      
      // Ensure the correct commands were called
      expect(mockS3Client.send).toHaveBeenCalledTimes(1); // Should call PutObjectACL
      expect(url).toContain('test-bucket');
      expect(url).toContain('test-base-path/test-file.txt');
    });
  });

  describe('getSignedUrl', () => {
    it('should generate a signed URL for S3 object', async () => {
      const mockPath = 'test-file.txt';
      const mockExpiry = 3600;
      
      const url = await provider.getSignedUrl(mockPath, mockExpiry);
      
      expect(url).toBe('https://signed-url.example.com');
    });
  });

  // Test helper methods
  describe('getBasePath', () => {
    it('should return the configured base path', () => {
      expect(provider.getBasePath()).toBe('test-base-path');
    });
  });
});