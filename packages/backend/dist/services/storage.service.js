"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageService = exports.StorageService = void 0;
const shared_1 = require("@yt2aptos/shared");
const env_1 = require("../config/env");
const path_1 = __importDefault(require("path"));
const logger_1 = require("../utils/logger");
/**
 * Service for managing storage operations
 */
class StorageService {
    provider;
    /**
     * Creates a new instance of StorageService
     */
    constructor() {
        const config = {
            type: env_1.env.STORAGE_TYPE,
            basePath: env_1.env.STORAGE_PATH,
            options: {
                urlPrefix: env_1.env.STORAGE_URL_PREFIX,
            }
        };
        this.provider = shared_1.StorageProviderFactory.createProvider(config);
        (0, logger_1.logInfo)(`Initialized ${env_1.env.STORAGE_TYPE} storage provider at ${env_1.env.STORAGE_PATH}`);
    }
    /**
     * Get the current storage provider
     */
    getProvider() {
        return this.provider;
    }
    /**
     * Change the storage provider
     * @param config Storage provider configuration
     */
    changeProvider(config) {
        this.provider = shared_1.StorageProviderFactory.createProvider(config);
        (0, logger_1.logInfo)(`Changed storage provider to ${config.type}`);
    }
    /**
     * Write a file to storage
     * @param filePath Path to write the file to
     * @param data File content as buffer or stream
     */
    async writeFile(filePath, data) {
        try {
            await this.provider.writeFile(filePath, data);
        }
        catch (error) {
            (0, logger_1.logError)(`Failed to write file: ${filePath}`, error);
            throw error;
        }
    }
    /**
     * Read a file from storage
     * @param filePath Path to the file
     * @returns File content as buffer
     */
    async readFile(filePath) {
        try {
            return await this.provider.readFile(filePath);
        }
        catch (error) {
            (0, logger_1.logError)(`Failed to read file: ${filePath}`, error);
            throw error;
        }
    }
    /**
     * Create a readable stream for a file
     * @param filePath Path to the file
     * @returns Readable stream
     */
    createReadStream(filePath) {
        try {
            return this.provider.createReadStream(filePath);
        }
        catch (error) {
            (0, logger_1.logError)(`Failed to create read stream: ${filePath}`, error);
            throw error;
        }
    }
    /**
     * Delete a file from storage
     * @param filePath Path to the file
     */
    async deleteFile(filePath) {
        try {
            await this.provider.deleteFile(filePath);
        }
        catch (error) {
            (0, logger_1.logError)(`Failed to delete file: ${filePath}`, error);
            throw error;
        }
    }
    /**
     * Create a directory
     * @param dirPath Path to the directory
     */
    async createDirectory(dirPath) {
        try {
            await this.provider.createDirectory(dirPath);
        }
        catch (error) {
            (0, logger_1.logError)(`Failed to create directory: ${dirPath}`, error);
            throw error;
        }
    }
    /**
     * List contents of a directory
     * @param dirPath Path to the directory
     * @returns Array of file/directory names
     */
    async listDirectory(dirPath) {
        try {
            return await this.provider.listDirectory(dirPath);
        }
        catch (error) {
            (0, logger_1.logError)(`Failed to list directory: ${dirPath}`, error);
            throw error;
        }
    }
    /**
     * Get metadata for a file
     * @param filePath Path to the file
     * @returns File metadata
     */
    async getMetadata(filePath) {
        try {
            return await this.provider.getMetadata(filePath);
        }
        catch (error) {
            (0, logger_1.logError)(`Failed to get metadata: ${filePath}`, error);
            throw error;
        }
    }
    /**
     * Get a public URL for a file
     * @param filePath Path to the file
     * @returns Public URL
     */
    async getPublicUrl(filePath) {
        try {
            return await this.provider.getPublicUrl(filePath);
        }
        catch (error) {
            (0, logger_1.logError)(`Failed to get public URL: ${filePath}`, error);
            throw error;
        }
    }
    /**
     * Get a signed URL for a file with expiration
     * @param filePath Path to the file
     * @param expiry Expiration time in seconds
     * @returns Signed URL
     */
    async getSignedUrl(filePath, expiry) {
        try {
            return await this.provider.getSignedUrl(filePath, expiry);
        }
        catch (error) {
            (0, logger_1.logError)(`Failed to get signed URL: ${filePath}`, error);
            throw error;
        }
    }
    /**
     * Generate a path for a channel
     * @param channelId YouTube channel ID
     * @param channelName Channel name (will be sanitized)
     * @returns Storage path for the channel
     */
    generateChannelPath(channelId, channelName) {
        const sanitizedName = this.sanitizePathComponent(channelName);
        return path_1.default.join('archive', `${channelId}-${sanitizedName}`);
    }
    /**
     * Generate a path for a playlist
     * @param channelPath Path to the channel directory
     * @param playlistId YouTube playlist ID
     * @param playlistName Playlist name (will be sanitized)
     * @returns Storage path for the playlist
     */
    generatePlaylistPath(channelPath, playlistId, playlistName) {
        const sanitizedName = this.sanitizePathComponent(playlistName);
        return path_1.default.join(channelPath, `${playlistId}-${sanitizedName}`);
    }
    /**
     * Generate a path for a video
     * @param playlistPath Path to the playlist directory
     * @param videoId YouTube video ID
     * @param uploadDate Upload date of the video (YYYY-MM-DD)
     * @param videoTitle Video title (will be sanitized)
     * @returns Storage path for the video
     */
    generateVideoPath(playlistPath, videoId, uploadDate, videoTitle) {
        const sanitizedTitle = this.sanitizePathComponent(videoTitle);
        return path_1.default.join(playlistPath, `${videoId}-${uploadDate}-${sanitizedTitle}`);
    }
    /**
     * Sanitize a string for use in a file path
     * @param value Input string
     * @returns Sanitized string
     */
    sanitizePathComponent(value) {
        // Remove invalid characters and trim
        let sanitized = value
            .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_') // Replace invalid chars with underscore
            .replace(/\s+/g, '-') // Replace spaces with hyphen
            .replace(/-+/g, '-') // Collapse multiple hyphens
            .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
            .trim();
        // Limit length to prevent path too long errors
        if (sanitized.length > 100) {
            sanitized = sanitized.substring(0, 100);
        }
        return sanitized || 'unnamed'; // Default if empty
    }
}
exports.StorageService = StorageService;
// Create singleton instance
exports.storageService = new StorageService();
//# sourceMappingURL=storage.service.js.map