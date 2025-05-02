import { Readable, Writable } from 'stream';
import { StorageProvider } from '../provider.interface';
import { FileMetadata, StorageConfig, UrlOptions } from '../types';
/**
 * Configuration options for AzureBlobProvider
 */
export interface AzureBlobProviderConfig extends StorageConfig {
    /** Azure Storage account name */
    accountName: string;
    /** Azure Storage account key */
    accountKey: string;
    /** Azure Blob container name */
    containerName: string;
    /** Connection string (alternative to accountName/accountKey) */
    connectionString?: string;
    /** Base path inside the container */
    basePath?: string;
    /** SAS token (alternative to accountKey) */
    sasToken?: string;
    /** Custom endpoint for Azure Storage */
    endpoint?: string;
}
/**
 * Storage provider implementation for Azure Blob Storage
 */
export declare class AzureBlobProvider implements StorageProvider {
    private readonly config;
    private readonly blobServiceClient;
    private readonly containerClient;
    private readonly containerName;
    private readonly basePath;
    private readonly accountName;
    private readonly accountKey?;
    /**
     * Creates a new instance of AzureBlobProvider
     * @param config Provider configuration
     */
    constructor(config: AzureBlobProviderConfig);
    /**
     * Gets the full path including the base path
     * @param filePath Relative file path
     * @returns Full path
     */
    private getFullPath;
    /**
     * Gets a blob client for the specified path
     * @param filePath Path to the file
     * @returns BlockBlobClient instance
     */
    private getBlobClient;
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
     * Creates a directory (Azure Blob Storage doesn't have directories, so we create a marker blob)
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
//# sourceMappingURL=azure-blob-provider.d.ts.map