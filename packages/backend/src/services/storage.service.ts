import { 
  StorageProvider, 
  StorageProviderFactory, 
  LocalFileSystemProvider,
  StorageConfig,
  FileMetadata
} from '@yt2aptos/shared';
import { env } from '../config/env';
import { Readable } from 'stream';
import path from 'path';
import { logError, logInfo } from '../utils/logger';

/**
 * Service for managing storage operations
 */
export class StorageService {
  private provider: StorageProvider;
  
  /**
   * Creates a new instance of StorageService
   */
  constructor() {
    const config: StorageConfig = {
      type: env.STORAGE_TYPE,
      basePath: env.STORAGE_PATH,
      options: {
        urlPrefix: env.STORAGE_URL_PREFIX,
      }
    };
    
    this.provider = StorageProviderFactory.createProvider(config);
    logInfo(`Initialized ${env.STORAGE_TYPE} storage provider at ${env.STORAGE_PATH}`);
  }
  
  /**
   * Get the current storage provider
   */
  getProvider(): StorageProvider {
    return this.provider;
  }
  
  /**
   * Change the storage provider
   * @param config Storage provider configuration
   */
  changeProvider(config: StorageConfig): void {
    this.provider = StorageProviderFactory.createProvider(config);
    logInfo(`Changed storage provider to ${config.type}`);
  }
  
  /**
   * Write a file to storage
   * @param filePath Path to write the file to
   * @param data File content as buffer or stream
   */
  async writeFile(filePath: string, data: Buffer | Readable): Promise<void> {
    try {
      await this.provider.writeFile(filePath, data);
    } catch (error) {
      logError(`Failed to write file: ${filePath}`, error as Error);
      throw error;
    }
  }
  
  /**
   * Read a file from storage
   * @param filePath Path to the file
   * @returns File content as buffer
   */
  async readFile(filePath: string): Promise<Buffer> {
    try {
      return await this.provider.readFile(filePath);
    } catch (error) {
      logError(`Failed to read file: ${filePath}`, error as Error);
      throw error;
    }
  }
  
  /**
   * Create a readable stream for a file
   * @param filePath Path to the file
   * @returns Readable stream
   */
  createReadStream(filePath: string): Readable {
    try {
      return this.provider.createReadStream(filePath);
    } catch (error) {
      logError(`Failed to create read stream: ${filePath}`, error as Error);
      throw error;
    }
  }
  
  /**
   * Delete a file from storage
   * @param filePath Path to the file
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      await this.provider.deleteFile(filePath);
    } catch (error) {
      logError(`Failed to delete file: ${filePath}`, error as Error);
      throw error;
    }
  }
  
  /**
   * Create a directory
   * @param dirPath Path to the directory
   */
  async createDirectory(dirPath: string): Promise<void> {
    try {
      await this.provider.createDirectory(dirPath);
    } catch (error) {
      logError(`Failed to create directory: ${dirPath}`, error as Error);
      throw error;
    }
  }
  
  /**
   * List contents of a directory
   * @param dirPath Path to the directory
   * @returns Array of file/directory names
   */
  async listDirectory(dirPath: string): Promise<string[]> {
    try {
      return await this.provider.listDirectory(dirPath);
    } catch (error) {
      logError(`Failed to list directory: ${dirPath}`, error as Error);
      throw error;
    }
  }
  
  /**
   * Get metadata for a file
   * @param filePath Path to the file
   * @returns File metadata
   */
  async getMetadata(filePath: string): Promise<FileMetadata> {
    try {
      return await this.provider.getMetadata(filePath);
    } catch (error) {
      logError(`Failed to get metadata: ${filePath}`, error as Error);
      throw error;
    }
  }
  
  /**
   * Get a public URL for a file
   * @param filePath Path to the file
   * @returns Public URL
   */
  async getPublicUrl(filePath: string): Promise<string> {
    try {
      return await this.provider.getPublicUrl(filePath);
    } catch (error) {
      logError(`Failed to get public URL: ${filePath}`, error as Error);
      throw error;
    }
  }
  
  /**
   * Get a signed URL for a file with expiration
   * @param filePath Path to the file
   * @param expiry Expiration time in seconds
   * @returns Signed URL
   */
  async getSignedUrl(filePath: string, expiry: number): Promise<string> {
    try {
      return await this.provider.getSignedUrl(filePath, expiry);
    } catch (error) {
      logError(`Failed to get signed URL: ${filePath}`, error as Error);
      throw error;
    }
  }
  
  /**
   * Generate a path for a channel
   * @param channelId YouTube channel ID
   * @param channelName Channel name (will be sanitized)
   * @returns Storage path for the channel
   */
  generateChannelPath(channelId: string, channelName: string): string {
    const sanitizedName = this.sanitizePathComponent(channelName);
    return path.join('archive', `${channelId}-${sanitizedName}`);
  }
  
  /**
   * Generate a path for a playlist
   * @param channelPath Path to the channel directory
   * @param playlistId YouTube playlist ID
   * @param playlistName Playlist name (will be sanitized)
   * @returns Storage path for the playlist
   */
  generatePlaylistPath(channelPath: string, playlistId: string, playlistName: string): string {
    const sanitizedName = this.sanitizePathComponent(playlistName);
    return path.join(channelPath, `${playlistId}-${sanitizedName}`);
  }
  
  /**
   * Generate a path for a video
   * @param playlistPath Path to the playlist directory
   * @param videoId YouTube video ID
   * @param uploadDate Upload date of the video (YYYY-MM-DD)
   * @param videoTitle Video title (will be sanitized)
   * @returns Storage path for the video
   */
  generateVideoPath(
    playlistPath: string, 
    videoId: string, 
    uploadDate: string, 
    videoTitle: string
  ): string {
    const sanitizedTitle = this.sanitizePathComponent(videoTitle);
    return path.join(playlistPath, `${videoId}-${uploadDate}-${sanitizedTitle}`);
  }
  
  /**
   * Sanitize a string for use in a file path
   * @param value Input string
   * @returns Sanitized string
   */
  private sanitizePathComponent(value: string): string {
    // Remove invalid characters and trim
    let sanitized = value
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_') // Replace invalid chars with underscore
      .replace(/\s+/g, '-')                   // Replace spaces with hyphen
      .replace(/-+/g, '-')                    // Collapse multiple hyphens
      .replace(/^-|-$/g, '')                  // Remove leading/trailing hyphens
      .trim();
    
    // Limit length to prevent path too long errors
    if (sanitized.length > 100) {
      sanitized = sanitized.substring(0, 100);
    }
    
    return sanitized || 'unnamed';  // Default if empty
  }
}

// Create singleton instance
export const storageService = new StorageService();