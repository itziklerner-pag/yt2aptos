import { StorageProvider, StorageConfig, FileMetadata } from '@yt2aptos/shared';
import { Readable } from 'stream';
/**
 * Service for managing storage operations
 */
export declare class StorageService {
    private provider;
    /**
     * Creates a new instance of StorageService
     */
    constructor();
    /**
     * Get the current storage provider
     */
    getProvider(): StorageProvider;
    /**
     * Change the storage provider
     * @param config Storage provider configuration
     */
    changeProvider(config: StorageConfig): void;
    /**
     * Write a file to storage
     * @param filePath Path to write the file to
     * @param data File content as buffer or stream
     */
    writeFile(filePath: string, data: Buffer | Readable): Promise<void>;
    /**
     * Read a file from storage
     * @param filePath Path to the file
     * @returns File content as buffer
     */
    readFile(filePath: string): Promise<Buffer>;
    /**
     * Create a readable stream for a file
     * @param filePath Path to the file
     * @returns Readable stream
     */
    createReadStream(filePath: string): Readable;
    /**
     * Delete a file from storage
     * @param filePath Path to the file
     */
    deleteFile(filePath: string): Promise<void>;
    /**
     * Create a directory
     * @param dirPath Path to the directory
     */
    createDirectory(dirPath: string): Promise<void>;
    /**
     * List contents of a directory
     * @param dirPath Path to the directory
     * @returns Array of file/directory names
     */
    listDirectory(dirPath: string): Promise<string[]>;
    /**
     * Get metadata for a file
     * @param filePath Path to the file
     * @returns File metadata
     */
    getMetadata(filePath: string): Promise<FileMetadata>;
    /**
     * Get a public URL for a file
     * @param filePath Path to the file
     * @returns Public URL
     */
    getPublicUrl(filePath: string): Promise<string>;
    /**
     * Get a signed URL for a file with expiration
     * @param filePath Path to the file
     * @param expiry Expiration time in seconds
     * @returns Signed URL
     */
    getSignedUrl(filePath: string, expiry: number): Promise<string>;
    /**
     * Generate a path for a channel
     * @param channelId YouTube channel ID
     * @param channelName Channel name (will be sanitized)
     * @returns Storage path for the channel
     */
    generateChannelPath(channelId: string, channelName: string): string;
    /**
     * Generate a path for a playlist
     * @param channelPath Path to the channel directory
     * @param playlistId YouTube playlist ID
     * @param playlistName Playlist name (will be sanitized)
     * @returns Storage path for the playlist
     */
    generatePlaylistPath(channelPath: string, playlistId: string, playlistName: string): string;
    /**
     * Generate a path for a video
     * @param playlistPath Path to the playlist directory
     * @param videoId YouTube video ID
     * @param uploadDate Upload date of the video (YYYY-MM-DD)
     * @param videoTitle Video title (will be sanitized)
     * @returns Storage path for the video
     */
    generateVideoPath(playlistPath: string, videoId: string, uploadDate: string, videoTitle: string): string;
    /**
     * Sanitize a string for use in a file path
     * @param value Input string
     * @returns Sanitized string
     */
    private sanitizePathComponent;
}
export declare const storageService: StorageService;
