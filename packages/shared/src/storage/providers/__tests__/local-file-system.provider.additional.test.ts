import fs from 'fs-extra';
import path from 'path';
import { LocalFileSystemProvider } from '../local-file-system.provider';
import { FileMetadata } from '../../types';

// Mock fs-extra module
jest.mock('fs-extra');

describe('LocalFileSystemProvider - Additional Tests', () => {
  const mockBasePath = '/test/storage';
  const mockUrlPrefix = 'http://localhost:3000/files';
  let provider: LocalFileSystemProvider;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup provider with test configuration
    provider = new LocalFileSystemProvider({
      type: 'local',
      basePath: mockBasePath,
      urlPrefix: mockUrlPrefix
    });
    
    // Mock fs.ensureDirSync implementation
    (fs.ensureDirSync as jest.Mock).mockImplementation(() => undefined);
  });

  describe('deleteDirectory', () => {
    it('should delete directory recursively', async () => {
      // Mock implementation
      (fs.remove as unknown as jest.Mock).mockResolvedValue(undefined);
      
      // Test data
      const dirPath = 'test/directory';
      
      // Execute
      await provider.deleteDirectory(dirPath, true);
      
      // Assert
      expect(fs.remove).toHaveBeenCalledWith(path.join(mockBasePath, dirPath));
    });

    it('should delete empty directory non-recursively', async () => {
      // Mock implementation
      (fs.rmdir as unknown as jest.Mock).mockResolvedValue(undefined);
      
      // Test data
      const dirPath = 'test/empty-directory';
      
      // Execute
      await provider.deleteDirectory(dirPath, false);
      
      // Assert
      expect(fs.rmdir).toHaveBeenCalledWith(path.join(mockBasePath, dirPath));
    });
    
    it('should throw error when trying to delete non-recursively and directory is not empty', async () => {
      // Mock implementation to simulate error
      const error: NodeJS.ErrnoException = new Error('Directory not empty');
      error.code = 'ENOTEMPTY';
      (fs.rmdir as unknown as jest.Mock).mockRejectedValue(error);
      
      // Test data
      const dirPath = 'test/non-empty-directory';
      
      // Execute and assert
      await expect(provider.deleteDirectory(dirPath, false)).rejects.toThrow('Directory not empty');
    });
  });

  describe('getMetadata', () => {
    it('should return file metadata', async () => {
      // Mock stat implementation
      const now = new Date();
      const mockStats = {
        size: 12345,
        mtime: now,
        birthtime: new Date(now.getTime() - 86400000), // 1 day before
        isFile: () => true,
      };
      (fs.stat as unknown as jest.Mock).mockResolvedValue(mockStats);
      
      // Test data
      const filePath = 'test/file.txt';
      
      // Execute
      const metadata = await provider.getMetadata(filePath);
      
      // Assert
      expect(fs.stat).toHaveBeenCalledWith(path.join(mockBasePath, filePath));
      expect(metadata).toEqual({
        name: 'file.txt',
        path: filePath,
        size: mockStats.size,
        contentType: 'text/plain',
        lastModified: mockStats.mtime,
        createdAt: mockStats.birthtime,
      });
    });

    it('should handle different file types with appropriate MIME types', async () => {
      // Mock stat implementation
      const mockStats = {
        size: 12345,
        mtime: new Date(),
        birthtime: new Date(),
        isFile: () => true,
      };
      (fs.stat as unknown as jest.Mock).mockResolvedValue(mockStats);
      
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
        const metadata = await provider.getMetadata(test.path);
        expect(metadata.contentType).toBe(test.expectedMime);
      }
    });
    
    it('should throw error if file does not exist', async () => {
      // Mock stat implementation to throw error
      const error: NodeJS.ErrnoException = new Error('File not found');
      error.code = 'ENOENT';
      (fs.stat as unknown as jest.Mock).mockRejectedValue(error);
      
      // Test data
      const filePath = 'test/nonexistent.txt';
      
      // Execute and assert
      await expect(provider.getMetadata(filePath)).rejects.toThrow();
    });
  });

  describe('updateMetadata', () => {
    it('should update file modified time', async () => {
      // Mock implementation
      (fs.utimes as unknown as jest.Mock).mockResolvedValue(undefined);
      
      // Test data
      const filePath = 'test/file.txt';
      const newDate = new Date();
      const metadata: Partial<FileMetadata> = {
        lastModified: newDate
      };
      
      // Execute
      await provider.updateMetadata(filePath, metadata);
      
      // Assert
      expect(fs.utimes).toHaveBeenCalledWith(
        path.join(mockBasePath, filePath),
        newDate.getTime() / 1000,
        newDate.getTime() / 1000
      );
    });
    
    it('should do nothing if no modifiable metadata is provided', async () => {
      // Mock implementation
      (fs.utimes as unknown as jest.Mock).mockResolvedValue(undefined);
      
      // Test data
      const filePath = 'test/file.txt';
      const metadata: Partial<FileMetadata> = {
        // Only properties that don't affect filesystem
        name: 'new-name.txt',
        contentType: 'application/json'
      };
      
      // Execute
      await provider.updateMetadata(filePath, metadata);
      
      // Assert - utimes should not be called
      expect(fs.utimes).not.toHaveBeenCalled();
    });
  });

  describe('Path sanitization', () => {
    it('should sanitize paths to prevent directory traversal', async () => {
      // Setup mock implementation
      (fs.readFile as unknown as jest.Mock).mockResolvedValue(Buffer.from('test content'));
      
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
        
        await provider.readFile(input);
        
        // Should use the sanitized path
        expect(fs.readFile).toHaveBeenCalledWith(path.join(mockBasePath, expected));
        
        // Number of calls should be exactly 1
        expect(fs.readFile).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('URL encoding', () => {
    it('should properly encode special characters in file paths for URLs', async () => {
      // Test data with special characters
      const filePaths = [
        'test/file with spaces.txt',
        'test/file+with+plus.txt',
        'test/file?with#special&chars.txt',
        'test/文件名.txt', // Unicode characters
      ];
      
      // Execute and assert for each path
      for (const filePath of filePaths) {
        const url = await provider.getPublicUrl(filePath);
        
        // Should encode special characters but preserve slashes
        const encodedPath = encodeURIComponent(filePath).replace(/%2F/g, '/');
        const expectedUrl = `${mockUrlPrefix}/${encodedPath}`;
        
        expect(url).toBe(expectedUrl);
      }
    });
  });

  describe('Temporary token generation', () => {
    it('should generate different tokens for different files', async () => {
      // Test data
      const filePath1 = 'test/file1.txt';
      const filePath2 = 'test/file2.txt';
      const expiry = 3600;
      
      // Execute
      const url1 = await provider.getSignedUrl(filePath1, expiry);
      const url2 = await provider.getSignedUrl(filePath2, expiry);
      
      // Extract tokens
      const token1 = url1.match(/token=([^&]+)/)?.[1];
      const token2 = url2.match(/token=([^&]+)/)?.[1];
      
      // Assert
      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toBe(token2);
    });
    
    it('should generate different tokens for different expiry times', async () => {
      // Test data
      const filePath = 'test/file.txt';
      
      // Execute
      const url1 = await provider.getSignedUrl(filePath, 3600);
      const url2 = await provider.getSignedUrl(filePath, 7200);
      
      // Extract tokens
      const token1 = url1.match(/token=([^&]+)/)?.[1];
      const token2 = url2.match(/token=([^&]+)/)?.[1];
      
      // Assert
      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toBe(token2);
    });
    
    it('should include expiry timestamp in URL', async () => {
      // Test data
      const filePath = 'test/file.txt';
      const expiry = 3600;
      const now = Date.now();
      
      // Mock Date.now to return consistent value
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => now);
      
      try {
        // Execute
        const url = await provider.getSignedUrl(filePath, expiry);
        
        // Extract expiry
        const expiryParam = url.match(/expires=(\d+)/)?.[1];
        
        // Assert
        expect(expiryParam).toBeDefined();
        expect(Number(expiryParam)).toBe(now + expiry * 1000);
      } finally {
        // Restore original Date.now
        Date.now = originalDateNow;
      }
    });
  });
});
