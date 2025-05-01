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
export declare class LocalFileSystemProvider implements StorageProvider {
    private readonly config;
    private readonly basePath;
    private readonly urlPrefix;
    /**
     * Creates a new instance of LocalFileSystemProvider
     * @param config Provider configuration
     */
    constructor(config: LocalFileSystemConfig);
    /**
     * Gets the absolute path for a file
     * @param filePath Relative file path
     * @returns Absolute file path
     */
    private getAbsolutePath;
    /**
     * Creates parent directory for a file if it doesn't exist
     * @param filePath Path to the file
     */
    private ensureParentDir;
    /**
     * Writes a file to storage
     * @param filePath Path to write the file to
     * @param data File content as buffer or stream
     */
    writeFile(filePath: string, data: Buffer | Readable): Promise<void>;
    /**
     * Reads a file from storage
     * @param filePath Path to the file
     * @returns File content as buffer
     */
    readFile(filePath: string): Promise<Buffer>;
    /**
     * Creates a readable stream for a file
     * @param filePath Path to the file
     * @returns Readable stream
     */
    createReadStream(filePath: string): Readable;
    /**
     * Creates a writable stream for a file
     * @param filePath Path to write the file to
     * @returns Writable stream
     */
    createWriteStream(filePath: string): Writable;
    /**
     * Deletes a file from storage
     * @param filePath Path to the file
     */
    deleteFile(filePath: string): Promise<void>;
    /**
     * Checks if a file exists
     * @param filePath Path to the file
     * @returns True if file exists, false otherwise
     */
    fileExists(filePath: string): Promise<boolean>;
    /**
     * Creates a directory
     * @param dirPath Path to the directory
     */
    createDirectory(dirPath: string): Promise<void>;
    /**
     * Lists contents of a directory
     * @param dirPath Path to the directory
     * @returns Array of file/directory names
     */
    listDirectory(dirPath: string): Promise<string[]>;
    /**
     * Deletes a directory
     * @param dirPath Path to the directory
     * @param recursive Whether to delete contents recursively
     */
    deleteDirectory(dirPath: string, recursive: boolean): Promise<void>;
    /**
     * Gets metadata for a file
     * @param filePath Path to the file
     * @returns File metadata
     */
    getMetadata(filePath: string): Promise<FileMetadata>;
    /**
     * Updates metadata for a file
     * @param filePath Path to the file
     * @param metadata Metadata to update
     */
    updateMetadata(filePath: string, metadata: Partial<FileMetadata>): Promise<void>;
    /**
     * Gets a public URL for a file
     * @param filePath Path to the file
     * @param options URL options
     * @returns Public URL
     */
    getPublicUrl(filePath: string, options?: UrlOptions): Promise<string>;
    /**
     * Gets a signed URL for a file with expiration
     * @param filePath Path to the file
     * @param expiry Expiration time in seconds
     * @returns Signed URL
     */
    getSignedUrl(filePath: string, expiry: number): Promise<string>;
    /**
     * Generate a temporary token for file access
     * (This is a simple implementation and not secure for production)
     * @param filePath Path to the file
     * @param expiry Expiration time in seconds
     * @returns Temporary access token
     */
    private generateTempToken;
    /**
     * Gets MIME type based on file extension
     * @param filePath Path to the file
     * @returns MIME type
     */
    private getMimeType;
    /**
     * Gets the base path for this storage provider
     * @returns The base storage path
     */
    getBasePath(): string;
}
//# sourceMappingURL=local-file-system.provider.d.ts.map