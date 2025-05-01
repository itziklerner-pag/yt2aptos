"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalFileSystemProvider = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
/**
 * Storage provider implementation for local file system
 */
class LocalFileSystemProvider {
    /**
     * Creates a new instance of LocalFileSystemProvider
     * @param config Provider configuration
     */
    constructor(config) {
        this.config = config;
        this.basePath = path_1.default.resolve(config.basePath);
        this.urlPrefix = config.urlPrefix || '';
        // Ensure base directory exists
        fs_extra_1.default.ensureDirSync(this.basePath);
    }
    /**
     * Gets the absolute path for a file
     * @param filePath Relative file path
     * @returns Absolute file path
     */
    getAbsolutePath(filePath) {
        // Sanitize path to prevent directory traversal attacks
        const normalizedPath = path_1.default.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
        return path_1.default.join(this.basePath, normalizedPath);
    }
    /**
     * Creates parent directory for a file if it doesn't exist
     * @param filePath Path to the file
     */
    ensureParentDir(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const dirPath = path_1.default.dirname(this.getAbsolutePath(filePath));
            yield fs_extra_1.default.ensureDir(dirPath);
        });
    }
    /**
     * Writes a file to storage
     * @param filePath Path to write the file to
     * @param data File content as buffer or stream
     */
    writeFile(filePath, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const absolutePath = this.getAbsolutePath(filePath);
            yield this.ensureParentDir(filePath);
            if (Buffer.isBuffer(data)) {
                yield fs_extra_1.default.writeFile(absolutePath, data);
            }
            else {
                // Handle stream data
                const writeStream = fs_extra_1.default.createWriteStream(absolutePath);
                return new Promise((resolve, reject) => {
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
        });
    }
    /**
     * Reads a file from storage
     * @param filePath Path to the file
     * @returns File content as buffer
     */
    readFile(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const absolutePath = this.getAbsolutePath(filePath);
            return fs_extra_1.default.readFile(absolutePath);
        });
    }
    /**
     * Creates a readable stream for a file
     * @param filePath Path to the file
     * @returns Readable stream
     */
    createReadStream(filePath) {
        const absolutePath = this.getAbsolutePath(filePath);
        return fs_extra_1.default.createReadStream(absolutePath);
    }
    /**
     * Creates a writable stream for a file
     * @param filePath Path to write the file to
     * @returns Writable stream
     */
    createWriteStream(filePath) {
        const absolutePath = this.getAbsolutePath(filePath);
        this.ensureParentDir(filePath).catch((err) => {
            console.error('Failed to create parent directory', err);
        });
        return fs_extra_1.default.createWriteStream(absolutePath);
    }
    /**
     * Deletes a file from storage
     * @param filePath Path to the file
     */
    deleteFile(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const absolutePath = this.getAbsolutePath(filePath);
            yield fs_extra_1.default.remove(absolutePath);
        });
    }
    /**
     * Checks if a file exists
     * @param filePath Path to the file
     * @returns True if file exists, false otherwise
     */
    fileExists(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const absolutePath = this.getAbsolutePath(filePath);
            try {
                const stat = yield fs_extra_1.default.stat(absolutePath);
                return stat.isFile();
            }
            catch (error) {
                return false;
            }
        });
    }
    /**
     * Creates a directory
     * @param dirPath Path to the directory
     */
    createDirectory(dirPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const absolutePath = this.getAbsolutePath(dirPath);
            yield fs_extra_1.default.ensureDir(absolutePath);
        });
    }
    /**
     * Lists contents of a directory
     * @param dirPath Path to the directory
     * @returns Array of file/directory names
     */
    listDirectory(dirPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const absolutePath = this.getAbsolutePath(dirPath);
            try {
                return yield fs_extra_1.default.readdir(absolutePath);
            }
            catch (error) {
                if (error.code === 'ENOENT') {
                    return [];
                }
                throw error;
            }
        });
    }
    /**
     * Deletes a directory
     * @param dirPath Path to the directory
     * @param recursive Whether to delete contents recursively
     */
    deleteDirectory(dirPath, recursive) {
        return __awaiter(this, void 0, void 0, function* () {
            const absolutePath = this.getAbsolutePath(dirPath);
            if (recursive) {
                yield fs_extra_1.default.remove(absolutePath);
            }
            else {
                yield fs_extra_1.default.rmdir(absolutePath);
            }
        });
    }
    /**
     * Gets metadata for a file
     * @param filePath Path to the file
     * @returns File metadata
     */
    getMetadata(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const absolutePath = this.getAbsolutePath(filePath);
            const stats = yield fs_extra_1.default.stat(absolutePath);
            return {
                name: path_1.default.basename(filePath),
                path: filePath,
                size: stats.size,
                contentType: this.getMimeType(filePath),
                lastModified: stats.mtime,
                createdAt: stats.birthtime,
            };
        });
    }
    /**
     * Updates metadata for a file
     * @param filePath Path to the file
     * @param metadata Metadata to update
     */
    updateMetadata(filePath, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            // For local file system, we can only update times
            const absolutePath = this.getAbsolutePath(filePath);
            if (metadata.lastModified) {
                const time = metadata.lastModified.getTime() / 1000;
                yield fs_extra_1.default.utimes(absolutePath, time, time);
            }
            // Other metadata would need to be stored separately in a database
        });
    }
    /**
     * Gets a public URL for a file
     * @param filePath Path to the file
     * @param options URL options
     * @returns Public URL
     */
    getPublicUrl(filePath, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.urlPrefix) {
                throw new Error('URL prefix not configured for LocalFileSystemProvider');
            }
            // Encode the path for URL
            const encodedPath = encodeURIComponent(filePath).replace(/%2F/g, '/');
            // For simplicity, we're just joining the URL prefix with the path
            return `${this.urlPrefix.replace(/\/$/, '')}/${encodedPath.replace(/^\//, '')}`;
        });
    }
    /**
     * Gets a signed URL for a file with expiration
     * @param filePath Path to the file
     * @param expiry Expiration time in seconds
     * @returns Signed URL
     */
    getSignedUrl(filePath, expiry) {
        return __awaiter(this, void 0, void 0, function* () {
            // Local file system doesn't support signed URLs natively
            // This would typically be implemented with a token-based system
            // For now, we'll just return a public URL with a token parameter
            const publicUrl = yield this.getPublicUrl(filePath);
            const token = this.generateTempToken(filePath, expiry);
            return `${publicUrl}?token=${token}&expires=${Date.now() + expiry * 1000}`;
        });
    }
    /**
     * Generate a temporary token for file access
     * (This is a simple implementation and not secure for production)
     * @param filePath Path to the file
     * @param expiry Expiration time in seconds
     * @returns Temporary access token
     */
    generateTempToken(filePath, expiry) {
        const data = `${filePath}:${Date.now() + expiry * 1000}:${this.config.basePath}`;
        return Buffer.from(data).toString('base64');
    }
    /**
     * Gets MIME type based on file extension
     * @param filePath Path to the file
     * @returns MIME type
     */
    getMimeType(filePath) {
        const ext = path_1.default.extname(filePath).toLowerCase();
        // Simple MIME type mapping
        const mimeTypes = {
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
    getBasePath() {
        return this.basePath;
    }
}
exports.LocalFileSystemProvider = LocalFileSystemProvider;
//# sourceMappingURL=local-file-system.provider.js.map