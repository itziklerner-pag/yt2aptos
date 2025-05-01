import fs from 'fs-extra';
import path from 'path';
import { Readable, Writable } from 'stream';
import { LocalFileSystemProvider } from '../local-file-system.provider';
import { FileMetadata } from '../../types';

// Mock fs-extra module
jest.mock('fs-extra');

describe('LocalFileSystemProvider', () => {
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

  describe('constructor', () => {
    it('should ensure base directory exists', () => {
      expect(fs.ensureDirSync).toHaveBeenCalledWith(mockBasePath);
    });
  });

  describe('writeFile', () => {
    it('should write buffer data to file', async () => {
      // Mock implementations
      (fs.ensureDir as unknown as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as unknown as jest.Mock).mockResolvedValue(undefined);
      
      // Test data
      const filePath = 'test/file.txt';
      const data = Buffer.from('test content');
      
      // Execute
      await provider.writeFile(filePath, data);
      
      // Assert
      expect(fs.ensureDir).toHaveBeenCalledWith(path.dirname(path.join(mockBasePath, filePath)));
      expect(fs.writeFile).toHaveBeenCalledWith(path.join(mockBasePath, filePath), data);
    });

    it('should write stream data to file', async () => {
      // Mock implementations
      (fs.ensureDir as unknown as jest.Mock).mockResolvedValue(undefined);
      
      const mockWriteStream: Partial<Writable> & { on: jest.Mock; pipe: jest.Mock } = {
        on: jest.fn().mockImplementation((event: string, callback: any) => {
          if (event === 'finish') {
            callback();
          }
          return mockWriteStream;
        }),
        pipe: jest.fn()
      };
      
      (fs.createWriteStream as unknown as jest.Mock).mockReturnValue(mockWriteStream);
      
      // Test data
      const filePath = 'test/file.txt';
      const mockReadStream = new Readable({
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
      await provider.writeFile(filePath, mockReadStream);
      
      // Assert
      expect(fs.ensureDir).toHaveBeenCalledWith(path.dirname(path.join(mockBasePath, filePath)));
      expect(fs.createWriteStream).toHaveBeenCalledWith(path.join(mockBasePath, filePath));
      expect(mockReadStream.pipe).toHaveBeenCalledWith(mockWriteStream);
    });

    it('should handle stream errors', async () => {
      // Mock implementations
      (fs.ensureDir as unknown as jest.Mock).mockResolvedValue(undefined);
      
      const mockWriteStream: Partial<Writable> & { on: jest.Mock; pipe: jest.Mock } = {
        on: jest.fn().mockImplementation((event: string, callback: any) => {
          if (event === 'error') {
            callback(new Error('Write error'));
          }
          return mockWriteStream;
        }),
        pipe: jest.fn()
      };
      
      (fs.createWriteStream as unknown as jest.Mock).mockReturnValue(mockWriteStream);
      
      // Test data
      const filePath = 'test/file.txt';
      const mockReadStream = new Readable({
        read() {}
      });
      mockReadStream.pipe = jest.fn();
      mockReadStream.on = jest.fn().mockImplementation(() => {
        return mockReadStream;
      });
      
      // Execute and assert
      await expect(provider.writeFile(filePath, mockReadStream)).rejects.toThrow('Write error');
    });
  });

  describe('readFile', () => {
    it('should read file content', async () => {
      // Mock implementations
      const fileContent = Buffer.from('test content');
      (fs.readFile as unknown as jest.Mock).mockResolvedValue(fileContent);
      
      // Test data
      const filePath = 'test/file.txt';
      
      // Execute
      const result = await provider.readFile(filePath);
      
      // Assert
      expect(fs.readFile).toHaveBeenCalledWith(path.join(mockBasePath, filePath));
      expect(result).toBe(fileContent);
    });
  });

  describe('createReadStream', () => {
    it('should create a readable stream for a file', () => {
      // Mock implementations
      const mockStream = { mock: 'stream' };
      (fs.createReadStream as unknown as jest.Mock).mockReturnValue(mockStream);
      
      // Test data
      const filePath = 'test/file.txt';
      
      // Execute
      const result = provider.createReadStream(filePath);
      
      // Assert
      expect(fs.createReadStream).toHaveBeenCalledWith(path.join(mockBasePath, filePath));
      expect(result).toBe(mockStream);
    });
  });

  describe('createWriteStream', () => {
    it('should create a writable stream for a file', () => {
      // Mock implementations
      const mockStream = { mock: 'stream' };
      (fs.createWriteStream as unknown as jest.Mock).mockReturnValue(mockStream);
      (fs.ensureDir as unknown as jest.Mock).mockResolvedValue(undefined);
      
      // Test data
      const filePath = 'test/file.txt';
      
      // Execute
      const result = provider.createWriteStream(filePath);
      
      // Assert
      expect(fs.createWriteStream).toHaveBeenCalledWith(path.join(mockBasePath, filePath));
      expect(result).toBe(mockStream);
    });
  });

  describe('deleteFile', () => {
    it('should delete a file', async () => {
      // Mock implementations
      (fs.remove as unknown as jest.Mock).mockResolvedValue(undefined);
      
      // Test data
      const filePath = 'test/file.txt';
      
      // Execute
      await provider.deleteFile(filePath);
      
      // Assert
      expect(fs.remove).toHaveBeenCalledWith(path.join(mockBasePath, filePath));
    });
  });

  describe('fileExists', () => {
    it('should return true if file exists', async () => {
      // Mock implementations
      (fs.stat as unknown as jest.Mock).mockResolvedValue({ isFile: () => true });
      
      // Test data
      const filePath = 'test/file.txt';
      
      // Execute
      const result = await provider.fileExists(filePath);
      
      // Assert
      expect(fs.stat).toHaveBeenCalledWith(path.join(mockBasePath, filePath));
      expect(result).toBe(true);
    });

    it('should return false if file doesnt exist', async () => {
      // Mock implementations
      (fs.stat as unknown as jest.Mock).mockRejectedValue(new Error('File not found'));
      
      // Test data
      const filePath = 'test/file.txt';
      
      // Execute
      const result = await provider.fileExists(filePath);
      
      // Assert
      expect(fs.stat).toHaveBeenCalledWith(path.join(mockBasePath, filePath));
      expect(result).toBe(false);
    });
  });

  describe('createDirectory', () => {
    it('should create a directory', async () => {
      // Mock implementations
      (fs.ensureDir as unknown as jest.Mock).mockResolvedValue(undefined);
      
      // Test data
      const dirPath = 'test/directory';
      
      // Execute
      await provider.createDirectory(dirPath);
      
      // Assert
      expect(fs.ensureDir).toHaveBeenCalledWith(path.join(mockBasePath, dirPath));
    });
  });

  describe('listDirectory', () => {
    it('should list directory contents', async () => {
      // Mock implementations
      const fileList = ['file1.txt', 'file2.txt'];
      (fs.readdir as unknown as jest.Mock).mockResolvedValue(fileList);
      
      // Test data
      const dirPath = 'test/directory';
      
      // Execute
      const result = await provider.listDirectory(dirPath);
      
      // Assert
      expect(fs.readdir).toHaveBeenCalledWith(path.join(mockBasePath, dirPath));
      expect(result).toEqual(fileList);
    });

    it('should return empty array if directory doesnt exist', async () => {
      // Mock implementations
      const error: NodeJS.ErrnoException = new Error('Directory not found');
      error.code = 'ENOENT';
      (fs.readdir as unknown as jest.Mock).mockRejectedValue(error);
      
      // Test data
      const dirPath = 'test/directory';
      
      // Execute
      const result = await provider.listDirectory(dirPath);
      
      // Assert
      expect(fs.readdir).toHaveBeenCalledWith(path.join(mockBasePath, dirPath));
      expect(result).toEqual([]);
    });

    it('should throw other errors', async () => {
      // Mock implementations
      const error = new Error('Permission denied');
      (fs.readdir as unknown as jest.Mock).mockRejectedValue(error);
      
      // Test data
      const dirPath = 'test/directory';
      
      // Execute and assert
      await expect(provider.listDirectory(dirPath)).rejects.toThrow('Permission denied');
    });
  });

  describe('getPublicUrl', () => {
    it('should return a public URL for a file', async () => {
      // Test data
      const filePath = 'test/file.txt';
      
      // Execute
      const result = await provider.getPublicUrl(filePath);
      
      // Assert
      expect(result).toBe(`${mockUrlPrefix}/${filePath}`);
    });

    it('should throw error if URL prefix is not configured', async () => {
      // Setup provider with no URL prefix
      provider = new LocalFileSystemProvider({
        type: 'local',
        basePath: mockBasePath
      });
      
      // Test data
      const filePath = 'test/file.txt';
      
      // Execute and assert
      await expect(provider.getPublicUrl(filePath)).rejects.toThrow('URL prefix not configured');
    });
  });

  describe('getSignedUrl', () => {
    it('should generate a signed URL with expiration token', async () => {
      // Test data
      const filePath = 'test/file.txt';
      const expiry = 3600; // 1 hour
      
      // Execute
      const result = await provider.getSignedUrl(filePath, expiry);
      
      // Assert
      expect(result).toContain(`${mockUrlPrefix}/${filePath}?token=`);
      expect(result).toContain('&expires=');
    });
  });
});