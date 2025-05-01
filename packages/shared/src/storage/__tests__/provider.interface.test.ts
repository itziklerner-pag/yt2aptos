import { StorageProvider } from '../provider.interface';
import { FileMetadata } from '../types';
import { Readable, Writable } from 'stream';

describe('StorageProvider Interface', () => {
  // Mock implementation of StorageProvider for testing interface
  class MockStorageProvider implements StorageProvider {
    private mockStorage: Map<string, Buffer> = new Map();
    private mockMetadata: Map<string, FileMetadata> = new Map();
    
    async writeFile(path: string, data: Buffer | Readable): Promise<void> {
      if (Buffer.isBuffer(data)) {
        this.mockStorage.set(path, data);
      } else {
        // Convert stream to buffer for testing
        const chunks: Buffer[] = [];
        for await (const chunk of data) {
          chunks.push(Buffer.from(chunk));
        }
        this.mockStorage.set(path, Buffer.concat(chunks));
      }
      
      // Add default metadata if none exists
      if (!this.mockMetadata.has(path)) {
        this.mockMetadata.set(path, {
          name: path.split('/').pop() || '',
          path,
          size: this.mockStorage.get(path)?.length || 0,
          contentType: 'application/octet-stream',
          lastModified: new Date(),
          createdAt: new Date()
        });
      }
    }
    
    async readFile(path: string): Promise<Buffer> {
      const data = this.mockStorage.get(path);
      if (!data) {
        throw new Error(`File not found: ${path}`);
      }
      return data;
    }
    
    createReadStream(path: string): Readable {
      const data = this.mockStorage.get(path);
      if (!data) {
        throw new Error(`File not found: ${path}`);
      }
      
      return Readable.from(data);
    }
    
    createWriteStream(path: string): Writable {
      const chunks: Buffer[] = [];
      const writable = new Writable({
        write(chunk, encoding, callback) {
          chunks.push(Buffer.from(chunk));
          callback();
        }
      });
      
      writable.on('finish', () => {
        this.mockStorage.set(path, Buffer.concat(chunks));
      });
      
      return writable;
    }
    
    async deleteFile(path: string): Promise<void> {
      this.mockStorage.delete(path);
      this.mockMetadata.delete(path);
    }
    
    async fileExists(path: string): Promise<boolean> {
      return this.mockStorage.has(path);
    }
    
    async createDirectory(path: string): Promise<void> {
      // For testing, just mark it as an empty file
      this.mockStorage.set(`${path}/.directory`, Buffer.from(''));
    }
    
    async listDirectory(path: string): Promise<string[]> {
      const result: string[] = [];
      for (const key of this.mockStorage.keys()) {
        if (key.startsWith(path) && key !== path) {
          const relativePath = key.slice(path.length + 1).split('/')[0];
          if (relativePath && !result.includes(relativePath)) {
            result.push(relativePath);
          }
        }
      }
      return result;
    }
    
    async deleteDirectory(path: string, recursive: boolean): Promise<void> {
      if (recursive) {
        for (const key of [...this.mockStorage.keys()]) {
          if (key === path || key.startsWith(`${path}/`)) {
            this.mockStorage.delete(key);
            this.mockMetadata.delete(key);
          }
        }
      } else {
        // Only delete if directory is empty
        const contents = await this.listDirectory(path);
        if (contents.length === 0) {
          this.mockStorage.delete(`${path}/.directory`);
        } else {
          throw new Error('Directory not empty');
        }
      }
    }
    
    async getMetadata(path: string): Promise<FileMetadata> {
      const metadata = this.mockMetadata.get(path);
      if (!metadata) {
        throw new Error(`File not found: ${path}`);
      }
      return metadata;
    }
    
    async updateMetadata(path: string, metadata: Partial<FileMetadata>): Promise<void> {
      const existing = this.mockMetadata.get(path);
      if (!existing) {
        throw new Error(`File not found: ${path}`);
      }
      
      this.mockMetadata.set(path, { ...existing, ...metadata });
    }
    
    async getPublicUrl(path: string): Promise<string> {
      return `https://example.com/public/${path}`;
    }
    
    async getSignedUrl(path: string, expiry: number): Promise<string> {
      return `https://example.com/signed/${path}?token=mock&expires=${Date.now() + expiry * 1000}`;
    }
  }
  
  let provider: StorageProvider;
  
  beforeEach(() => {
    provider = new MockStorageProvider();
  });
  
  describe('Basic file operations', () => {
    it('should write and read file content', async () => {
      const filePath = 'test/file.txt';
      const content = Buffer.from('Hello, world!');
      
      await provider.writeFile(filePath, content);
      const result = await provider.readFile(filePath);
      
      expect(result.toString()).toBe('Hello, world!');
    });
    
    it('should write from stream and read file content', async () => {
      const filePath = 'test/stream-file.txt';
      const content = 'Hello from stream!';
      const stream = Readable.from([content]);
      
      await provider.writeFile(filePath, stream);
      const result = await provider.readFile(filePath);
      
      expect(result.toString()).toBe(content);
    });
    
    it('should check if file exists', async () => {
      const filePath = 'test/exists.txt';
      const nonExistentPath = 'test/does-not-exist.txt';
      
      await provider.writeFile(filePath, Buffer.from('test'));
      
      expect(await provider.fileExists(filePath)).toBe(true);
      expect(await provider.fileExists(nonExistentPath)).toBe(false);
    });
    
    it('should delete a file', async () => {
      const filePath = 'test/to-delete.txt';
      
      await provider.writeFile(filePath, Buffer.from('delete me'));
      expect(await provider.fileExists(filePath)).toBe(true);
      
      await provider.deleteFile(filePath);
      expect(await provider.fileExists(filePath)).toBe(false);
    });
  });
  
  describe('Stream operations', () => {
    it('should create readable stream from file', async () => {
      const filePath = 'test/stream-read.txt';
      const content = 'Stream content';
      
      await provider.writeFile(filePath, Buffer.from(content));
      
      const stream = provider.createReadStream(filePath);
      const chunks: Buffer[] = [];
      
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
      
      const result = Buffer.concat(chunks).toString();
      expect(result).toBe(content);
    });
    
    it('should write to file using writable stream', async () => {
      const filePath = 'test/stream-write.txt';
      const content = 'Written via stream';
      
      const writeStream = provider.createWriteStream(filePath);
      writeStream.write(content);
      writeStream.end();
      
      // Wait for stream to finish
      await new Promise(resolve => writeStream.on('finish', resolve));
      
      const result = await provider.readFile(filePath);
      expect(result.toString()).toBe(content);
    });
  });
  
  describe('Directory operations', () => {
    it('should create directory', async () => {
      const dirPath = 'test/new-dir';
      
      await provider.createDirectory(dirPath);
      
      // Check if directory marker exists
      expect(await provider.fileExists(`${dirPath}/.directory`)).toBe(true);
    });
    
    it('should list directory contents', async () => {
      const dirPath = 'test/list-dir';
      
      await provider.createDirectory(dirPath);
      await provider.writeFile(`${dirPath}/file1.txt`, Buffer.from('file1'));
      await provider.writeFile(`${dirPath}/file2.txt`, Buffer.from('file2'));
      await provider.writeFile(`${dirPath}/subdir/file3.txt`, Buffer.from('file3'));
      
      const files = await provider.listDirectory(dirPath);
      
      expect(files).toContain('file1.txt');
      expect(files).toContain('file2.txt');
      expect(files).toContain('subdir');
      // Don't strictly check the length as implementation details might vary,
      // just ensure the expected items are in the list
      expect(files.length).toBeGreaterThanOrEqual(3);
    });
    
    it('should delete directory recursively', async () => {
      const dirPath = 'test/delete-dir';
      
      await provider.createDirectory(dirPath);
      await provider.writeFile(`${dirPath}/file1.txt`, Buffer.from('file1'));
      await provider.writeFile(`${dirPath}/subdir/file2.txt`, Buffer.from('file2'));
      
      await provider.deleteDirectory(dirPath, true);
      
      expect(await provider.fileExists(`${dirPath}/.directory`)).toBe(false);
      expect(await provider.fileExists(`${dirPath}/file1.txt`)).toBe(false);
      expect(await provider.fileExists(`${dirPath}/subdir/file2.txt`)).toBe(false);
    });
    
    it('should fail to delete non-empty directory without recursive flag', async () => {
      const dirPath = 'test/non-empty-dir';
      
      await provider.createDirectory(dirPath);
      await provider.writeFile(`${dirPath}/file1.txt`, Buffer.from('file1'));
      
      await expect(provider.deleteDirectory(dirPath, false)).rejects.toThrow('Directory not empty');
      expect(await provider.fileExists(`${dirPath}/file1.txt`)).toBe(true);
    });
  });
  
  describe('Metadata operations', () => {
    it('should get file metadata', async () => {
      const filePath = 'test/metadata.txt';
      const content = Buffer.from('metadata test');
      
      await provider.writeFile(filePath, content);
      const metadata = await provider.getMetadata(filePath);
      
      expect(metadata.name).toBe('metadata.txt');
      expect(metadata.path).toBe(filePath);
      expect(metadata.size).toBe(content.length);
      expect(metadata.lastModified).toBeInstanceOf(Date);
      expect(metadata.createdAt).toBeInstanceOf(Date);
    });
    
    it('should update file metadata', async () => {
      const filePath = 'test/update-metadata.txt';
      
      await provider.writeFile(filePath, Buffer.from('test'));
      
      const newLastModified = new Date('2023-01-01');
      await provider.updateMetadata(filePath, {
        lastModified: newLastModified,
        contentType: 'text/plain',
      });
      
      const metadata = await provider.getMetadata(filePath);
      expect(metadata.lastModified).toEqual(newLastModified);
      expect(metadata.contentType).toBe('text/plain');
    });
  });
  
  describe('URL operations', () => {
    it('should generate public URL for file', async () => {
      const filePath = 'test/public.txt';
      
      await provider.writeFile(filePath, Buffer.from('public'));
      const url = await provider.getPublicUrl(filePath);
      
      expect(url).toContain(filePath);
      expect(url).toMatch(/^https?:\/\//);
    });
    
    it('should generate signed URL with expiration', async () => {
      const filePath = 'test/signed.txt';
      const expiry = 3600; // 1 hour
      
      await provider.writeFile(filePath, Buffer.from('signed'));
      const url = await provider.getSignedUrl(filePath, expiry);
      
      expect(url).toContain(filePath);
      expect(url).toContain('token=');
      expect(url).toContain('expires=');
    });
  });
});