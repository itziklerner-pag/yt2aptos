import { FileMetadata, UrlOptions } from './types';
import { Readable, Writable } from 'stream';

/**
 * StorageProvider interface defines the common API for all storage providers
 */
export interface StorageProvider {
  /**
   * Write a file to storage
   * @param path Path to write the file to
   * @param data File content as buffer or stream
   */
  writeFile(path: string, data: Buffer | Readable): Promise<void>;

  /**
   * Read a file from storage
   * @param path Path to the file
   * @returns File content as buffer
   */
  readFile(path: string): Promise<Buffer>;

  /**
   * Create a readable stream for a file
   * @param path Path to the file
   * @returns Readable stream
   */
  createReadStream(path: string): Readable;

  /**
   * Create a writable stream for a file
   * @param path Path to write the file to
   * @returns Writable stream
   */
  createWriteStream(path: string): Writable;

  /**
   * Delete a file from storage
   * @param path Path to the file
   */
  deleteFile(path: string): Promise<void>;

  /**
   * Check if a file exists
   * @param path Path to the file
   * @returns True if file exists, false otherwise
   */
  fileExists(path: string): Promise<boolean>;

  /**
   * Create a directory
   * @param path Path to the directory
   */
  createDirectory(path: string): Promise<void>;

  /**
   * List contents of a directory
   * @param path Path to the directory
   * @returns Array of file/directory names
   */
  listDirectory(path: string): Promise<string[]>;

  /**
   * Delete a directory
   * @param path Path to the directory
   * @param recursive Whether to delete contents recursively
   */
  deleteDirectory(path: string, recursive: boolean): Promise<void>;

  /**
   * Get metadata for a file
   * @param path Path to the file
   * @returns File metadata
   */
  getMetadata(path: string): Promise<FileMetadata>;

  /**
   * Update metadata for a file
   * @param path Path to the file
   * @param metadata Metadata to update
   */
  updateMetadata(path: string, metadata: Partial<FileMetadata>): Promise<void>;

  /**
   * Get a public URL for a file
   * @param path Path to the file
   * @param options URL options
   * @returns Public URL
   */
  getPublicUrl(path: string, options?: UrlOptions): Promise<string>;

  /**
   * Get a signed URL for a file with expiration
   * @param path Path to the file
   * @param expiry Expiration time in seconds
   * @returns Signed URL
   */
  getSignedUrl(path: string, expiry: number): Promise<string>;
}