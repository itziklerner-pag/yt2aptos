import fs from 'fs-extra';
import path from 'path';
import { Readable, Writable } from 'stream';
import { StorageProvider } from '../provider.interface';
import { FileMetadata, StorageConfig, UrlOptions } from '../types';

/**
 * Configuration options for LocalFileSystemProvider
 */
export interface LocalFileSystemConfig extends StorageConfig {
  /**
   * Base directory for all storage operations
   */
  basePath: string;
  /**
   * URL prefix for generating file URLs (e.g., http://localhost:3000/files/)
   */
  urlPrefix?: string;
}

/**
 * Storage provider implementation for local file system
 */
export class LocalFileSystemProvider implements StorageProvider {
  private readonly basePath: string;
  private readonly urlPrefix: string;

  /**
   * Creates a new instance of LocalFileSystemProvider
   * @param config Provider configuration
   */
  constructor(private readonly config: LocalFileSystemConfig) {
    this.basePath = path.resolve(config.basePath);
    this.urlPrefix = config.urlPrefix || '';
    
    // Ensure base directory exists
    fs.ensureDirSync(this.basePath);
  }

  /**
   * Gets the absolute path for a file
   * @param filePath Relative file path
   * @returns Absolute file path
   */
  private getAbsolutePath(filePath: string): string {
    // Sanitize path to prevent directory traversal attacks
    const normalizedPath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
    return path.join(this.basePath, normalizedPath);
  }

  /**
   * Creates parent directory for a file if it doesn't exist
   * @param filePath Path to the file
   */
  private async ensureParentDir(filePath: string): Promise<void> {
    const dirPath = path.dirname(this.getAbsolutePath(filePath));
    await fs.ensureDir(dirPath);
  }

  /**
   * Writes a file to storage
   * @param filePath Path to write the file to
   * @param data File content as buffer or stream
   */
  async writeFile(filePath: string, data: Buffer | Readable): Promise<void> {
    const absolutePath = this.getAbsolutePath(filePath);
    await this.ensureParentDir(filePath);

    if (Buffer.isBuffer(data)) {
      await fs.writeFile(absolutePath, data);
    } else {
      // Handle stream data
      const writeStream = fs.createWriteStream(absolutePath);
      return new Promise<void>((resolve, reject) => {
        data.pipe(writeStream);
        data.on('error', (error) => {
          reject(error);
        });
        writeStream.on('finish', () => {
          resolve();
        });
        writeStream.on('error', (error) => {
          reject(error);
        });
      });
    }
  }

  /**
   * Reads a file from storage
   * @param filePath Path to the file
   * @returns File content as buffer
   */
  async readFile(filePath: string): Promise<Buffer> {
    const absolutePath = this.getAbsolutePath(filePath);
    return fs.readFile(absolutePath);
  }

  /**
   * Creates a readable stream for a file
   * @param filePath Path to the file
   * @returns Readable stream
   */
  createReadStream(filePath: string): Readable {
    const absolutePath = this.getAbsolutePath(filePath);
    return fs.createReadStream(absolutePath);
  }

  /**
   * Creates a writable stream for a file
   * @param filePath Path to write the file to
   * @returns Writable stream
   */
  createWriteStream(filePath: string): Writable {
    const absolutePath = this.getAbsolutePath(filePath);
    this.ensureParentDir(filePath).catch((err) => {
      console.error('Failed to create parent directory', err);
    });
    return fs.createWriteStream(absolutePath);
  }

  /**
   * Deletes a file from storage
   * @param filePath Path to the file
   */
  async deleteFile(filePath: string): Promise<void> {
    const absolutePath = this.getAbsolutePath(filePath);
    await fs.remove(absolutePath);
  }

  /**
   * Checks if a file exists
   * @param filePath Path to the file
   * @returns True if file exists, false otherwise
   */
  async fileExists(filePath: string): Promise<boolean> {
    const absolutePath = this.getAbsolutePath(filePath);
    try {
      const stat = await fs.stat(absolutePath);
      return stat.isFile();
    } catch (error) {
      return false;
    }
  }

  /**
   * Creates a directory
   * @param dirPath Path to the directory
   */
  async createDirectory(dirPath: string): Promise<void> {
    const absolutePath = this.getAbsolutePath(dirPath);
    await fs.ensureDir(absolutePath);
  }

  /**
   * Lists contents of a directory
   * @param dirPath Path to the directory
   * @returns Array of file/directory names
   */
  async listDirectory(dirPath: string): Promise<string[]> {
    const absolutePath = this.getAbsolutePath(dirPath);
    try {
      return await fs.readdir(absolutePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Deletes a directory
   * @param dirPath Path to the directory
   * @param recursive Whether to delete contents recursively
   */
  async deleteDirectory(dirPath: string, recursive: boolean): Promise<void> {
    const absolutePath = this.getAbsolutePath(dirPath);
    if (recursive) {
      await fs.remove(absolutePath);
    } else {
      await fs.rmdir(absolutePath);
    }
  }

  /**
   * Gets metadata for a file
   * @param filePath Path to the file
   * @returns File metadata
   */
  async getMetadata(filePath: string): Promise<FileMetadata> {
    const absolutePath = this.getAbsolutePath(filePath);
    const stats = await fs.stat(absolutePath);
    
    return {
      name: path.basename(filePath),
      path: filePath,
      size: stats.size,
      contentType: this.getMimeType(filePath),
      lastModified: stats.mtime,
      createdAt: stats.birthtime,
    };
  }

  /**
   * Updates metadata for a file
   * @param filePath Path to the file
   * @param metadata Metadata to update
   */
  async updateMetadata(filePath: string, metadata: Partial<FileMetadata>): Promise<void> {
    // For local file system, we can only update times
    const absolutePath = this.getAbsolutePath(filePath);
    
    if (metadata.lastModified) {
      const time = metadata.lastModified.getTime() / 1000;
      await fs.utimes(absolutePath, time, time);
    }
    
    // Other metadata would need to be stored separately in a database
  }

  /**
   * Gets a public URL for a file
   * @param filePath Path to the file
   * @param options URL options
   * @returns Public URL
   */
  async getPublicUrl(filePath: string, options?: UrlOptions): Promise<string> {
    if (!this.urlPrefix) {
      throw new Error('URL prefix not configured for LocalFileSystemProvider');
    }
    
    // Encode the path for URL
    const encodedPath = encodeURIComponent(filePath).replace(/%2F/g, '/');
    
    // For simplicity, we're just joining the URL prefix with the path
    return `${this.urlPrefix.replace(/\/$/, '')}/${encodedPath.replace(/^\//, '')}`;
  }

  /**
   * Gets a signed URL for a file with expiration
   * @param filePath Path to the file
   * @param expiry Expiration time in seconds
   * @returns Signed URL
   */
  async getSignedUrl(filePath: string, expiry: number): Promise<string> {
    // Local file system doesn't support signed URLs natively
    // This would typically be implemented with a token-based system
    // For now, we'll just return a public URL with a token parameter
    
    const publicUrl = await this.getPublicUrl(filePath);
    const token = this.generateTempToken(filePath, expiry);
    
    return `${publicUrl}?token=${token}&expires=${Date.now() + expiry * 1000}`;
  }

  /**
   * Generate a temporary token for file access
   * (This is a simple implementation and not secure for production)
   * @param filePath Path to the file
   * @param expiry Expiration time in seconds
   * @returns Temporary access token
   */
  private generateTempToken(filePath: string, expiry: number): string {
    const data = `${filePath}:${Date.now() + expiry * 1000}:${this.config.basePath}`;
    return Buffer.from(data).toString('base64');
  }

  /**
   * Gets MIME type based on file extension
   * @param filePath Path to the file
   * @returns MIME type
   */
  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    
    // Simple MIME type mapping
    const mimeTypes: Record<string, string> = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.txt': 'text/plain',
      '.pdf': 'application/pdf',
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Gets the base path for this storage provider
   * @returns The base storage path
   */
  getBasePath(): string {
    return this.basePath;
  }
}