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
exports.S3Provider = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const path_1 = __importDefault(require("path"));
const stream_1 = require("stream");
/**
 * Storage provider implementation for AWS S3
 */
class S3Provider {
    /**
     * Creates a new instance of S3Provider
     * @param config Provider configuration
     */
    constructor(config) {
        this.config = config;
        const clientConfig = {
            region: config.region,
        };
        // Set credentials if provided
        if (config.accessKeyId && config.secretAccessKey) {
            clientConfig.credentials = {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey,
                sessionToken: config.sessionToken,
            };
        }
        // Set custom endpoint if provided
        if (config.endpoint) {
            clientConfig.endpoint = config.endpoint;
        }
        // Set path style if needed
        if (config.forcePathStyle) {
            clientConfig.forcePathStyle = true;
        }
        this.client = new client_s3_1.S3Client(clientConfig);
        this.bucket = config.bucket;
        this.basePath = config.basePath || '';
    }
    /**
     * Gets the full path including the base path
     * @param filePath Relative file path
     * @returns Full path
     */
    getFullPath(filePath) {
        // Normalize path and remove leading slashes
        const normalizedPath = path_1.default.normalize(filePath).replace(/^\/+/, '');
        // Combine with base path if it exists
        if (this.basePath) {
            return path_1.default.join(this.basePath, normalizedPath).replace(/\\/g, '/');
        }
        return normalizedPath.replace(/\\/g, '/');
    }
    /**
     * Writes a file to storage
     * @param filePath Path to write the file to
     * @param data File content as buffer or stream
     */
    writeFile(filePath, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = this.getFullPath(filePath);
            const contentType = this.getMimeType(filePath);
            // If data is a buffer, we can upload it directly
            if (Buffer.isBuffer(data)) {
                const params = {
                    Bucket: this.bucket,
                    Key: key,
                    Body: data,
                    ContentType: contentType,
                };
                yield this.client.send(new client_s3_1.PutObjectCommand(params));
                return;
            }
            // For streams, we need to collect data before sending
            return new Promise((resolve, reject) => {
                const chunks = [];
                data.on('data', (chunk) => chunks.push(chunk));
                data.on('error', (err) => reject(err));
                data.on('end', () => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const buffer = Buffer.concat(chunks);
                        const params = {
                            Bucket: this.bucket,
                            Key: key,
                            Body: buffer,
                            ContentType: contentType,
                        };
                        yield this.client.send(new client_s3_1.PutObjectCommand(params));
                        resolve();
                    }
                    catch (err) {
                        reject(err);
                    }
                }));
            });
        });
    }
    /**
     * Reads a file from storage
     * @param filePath Path to the file
     * @returns File content as buffer
     */
    readFile(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = this.getFullPath(filePath);
            const params = {
                Bucket: this.bucket,
                Key: key,
            };
            const response = yield this.client.send(new client_s3_1.GetObjectCommand(params));
            if (!response.Body) {
                throw new Error(`File ${filePath} not found or has no content`);
            }
            // Convert the stream to a buffer
            return new Promise((resolve, reject) => {
                const chunks = [];
                // @ts-ignore (Body implements a Stream interface)
                response.Body.on('data', (chunk) => chunks.push(chunk));
                // @ts-ignore
                response.Body.on('error', (err) => reject(err));
                // @ts-ignore
                response.Body.on('end', () => resolve(Buffer.concat(chunks)));
            });
        });
    }
    /**
     * Creates a readable stream for a file
     * @param filePath Path to the file
     * @returns Readable stream
     */
    createReadStream(filePath) {
        const key = this.getFullPath(filePath);
        const params = {
            Bucket: this.bucket,
            Key: key,
        };
        const passThrough = new stream_1.PassThrough();
        this.client.send(new client_s3_1.GetObjectCommand(params))
            .then(response => {
            if (!response.Body) {
                passThrough.emit('error', new Error(`File ${filePath} not found or has no content`));
                return;
            }
            // @ts-ignore (Body implements a Stream interface)
            response.Body.pipe(passThrough);
        })
            .catch(err => {
            passThrough.emit('error', err);
        });
        return passThrough;
    }
    /**
     * Creates a writable stream for a file
     * @param filePath Path to write the file to
     * @returns Writable stream
     */
    createWriteStream(filePath) {
        const key = this.getFullPath(filePath);
        const contentType = this.getMimeType(filePath);
        const passThrough = new stream_1.PassThrough();
        // Collect chunks and upload when the stream is finished
        const chunks = [];
        passThrough.on('data', (chunk) => chunks.push(chunk));
        passThrough.on('end', () => __awaiter(this, void 0, void 0, function* () {
            try {
                const buffer = Buffer.concat(chunks);
                const params = {
                    Bucket: this.bucket,
                    Key: key,
                    Body: buffer,
                    ContentType: contentType,
                };
                yield this.client.send(new client_s3_1.PutObjectCommand(params));
            }
            catch (err) {
                passThrough.emit('error', err);
            }
        }));
        return passThrough;
    }
    /**
     * Deletes a file from storage
     * @param filePath Path to the file
     */
    deleteFile(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = this.getFullPath(filePath);
            const params = {
                Bucket: this.bucket,
                Key: key,
            };
            yield this.client.send(new client_s3_1.DeleteObjectCommand(params));
        });
    }
    /**
     * Checks if a file exists
     * @param filePath Path to the file
     * @returns True if file exists, false otherwise
     */
    fileExists(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = this.getFullPath(filePath);
            const params = {
                Bucket: this.bucket,
                Key: key,
            };
            try {
                yield this.client.send(new client_s3_1.HeadObjectCommand(params));
                return true;
            }
            catch (error) {
                // HTTP 404 means the file doesn't exist
                if (error.name === 'NotFound') {
                    return false;
                }
                throw error;
            }
        });
    }
    /**
     * Creates a directory (S3 doesn't have directories, so we create an empty object with a trailing slash)
     * @param dirPath Path to the directory
     */
    createDirectory(dirPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = this.getFullPath(dirPath);
            const normalizedKey = key.endsWith('/') ? key : `${key}/`;
            const params = {
                Bucket: this.bucket,
                Key: normalizedKey,
                Body: '',
            };
            yield this.client.send(new client_s3_1.PutObjectCommand(params));
        });
    }
    /**
     * Lists contents of a directory
     * @param dirPath Path to the directory
     * @returns Array of file/directory names
     */
    listDirectory(dirPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const prefix = this.getFullPath(dirPath);
            const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
            const params = {
                Bucket: this.bucket,
                Prefix: normalizedPrefix,
                Delimiter: '/',
            };
            const response = yield this.client.send(new client_s3_1.ListObjectsV2Command(params));
            const results = [];
            // Process common prefixes (directories)
            if (response.CommonPrefixes) {
                for (const prefix of response.CommonPrefixes) {
                    if (prefix.Prefix) {
                        // Extract the directory name from the prefix
                        const name = prefix.Prefix.slice(normalizedPrefix.length);
                        if (name && !name.includes('/')) {
                            results.push(name);
                        }
                    }
                }
            }
            // Process contents (files)
            if (response.Contents) {
                for (const content of response.Contents) {
                    if (content.Key && content.Key !== normalizedPrefix) {
                        // Extract the file name from the key
                        const relativePath = content.Key.slice(normalizedPrefix.length);
                        if (relativePath && !relativePath.includes('/')) {
                            results.push(relativePath);
                        }
                    }
                }
            }
            return results;
        });
    }
    /**
     * Deletes a directory
     * @param dirPath Path to the directory
     * @param recursive Whether to delete contents recursively
     */
    deleteDirectory(dirPath, recursive) {
        return __awaiter(this, void 0, void 0, function* () {
            const prefix = this.getFullPath(dirPath);
            const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
            if (!recursive) {
                // Check if directory is empty first
                const params = {
                    Bucket: this.bucket,
                    Prefix: normalizedPrefix,
                    MaxKeys: 2, // We only need to know if there's at least one object
                };
                const response = yield this.client.send(new client_s3_1.ListObjectsV2Command(params));
                if (response.Contents && response.Contents.length > 1) {
                    throw new Error(`Directory ${dirPath} is not empty`);
                }
                // Delete the directory marker
                yield this.client.send(new client_s3_1.DeleteObjectCommand({
                    Bucket: this.bucket,
                    Key: normalizedPrefix,
                }));
                return;
            }
            // Recursive delete - list all objects and delete them
            let isTruncated = true;
            let continuationToken;
            while (isTruncated) {
                const params = {
                    Bucket: this.bucket,
                    Prefix: normalizedPrefix,
                    ContinuationToken: continuationToken,
                };
                const response = yield this.client.send(new client_s3_1.ListObjectsV2Command(params));
                if (response.Contents) {
                    for (const content of response.Contents) {
                        if (content.Key) {
                            yield this.client.send(new client_s3_1.DeleteObjectCommand({
                                Bucket: this.bucket,
                                Key: content.Key,
                            }));
                        }
                    }
                }
                isTruncated = response.IsTruncated || false;
                continuationToken = response.NextContinuationToken;
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
            const key = this.getFullPath(filePath);
            const params = {
                Bucket: this.bucket,
                Key: key,
            };
            const response = yield this.client.send(new client_s3_1.HeadObjectCommand(params));
            const fileName = path_1.default.basename(filePath);
            const lastModified = response.LastModified || new Date();
            const size = response.ContentLength || 0;
            const contentType = response.ContentType || this.getMimeType(filePath);
            // Map to standard metadata format
            const metadata = {
                name: fileName,
                path: filePath,
                size: size,
                contentType: contentType,
                lastModified: lastModified,
                createdAt: lastModified, // S3 doesn't track creation time separately
                custom: response.Metadata || {},
            };
            return metadata;
        });
    }
    /**
     * Updates metadata for a file
     * @param filePath Path to the file
     * @param metadata Metadata to update
     */
    updateMetadata(filePath, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            // For S3, we need to implement custom metadata update
            // We need to get the current content and re-upload with new metadata
            const key = this.getFullPath(filePath);
            // First, get the current content of the file
            const fileContent = yield this.readFile(filePath);
            // Then re-upload with updated metadata
            const params = {
                Bucket: this.bucket,
                Key: key,
                Body: fileContent,
                ContentType: metadata.contentType || this.getMimeType(filePath),
                Metadata: metadata.custom,
            };
            yield this.client.send(new client_s3_1.PutObjectCommand(params));
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
            const key = this.getFullPath(filePath);
            // If public access is desired, we need to make the object public
            if ((options === null || options === void 0 ? void 0 : options.access) === 'public') {
                const params = {
                    Bucket: this.bucket,
                    Key: key,
                    ACL: 'public-read',
                };
                yield this.client.send(new client_s3_1.PutObjectCommand(params));
            }
            // Construct the URL manually
            // Format: https://<bucketname>.s3.<region>.amazonaws.com/<key>
            let endpoint = this.config.endpoint;
            if (!endpoint) {
                // Use the default AWS S3 endpoint format
                endpoint = `https://${this.bucket}.s3.${this.config.region}.amazonaws.com`;
            }
            return `${endpoint}/${key}`;
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
            const key = this.getFullPath(filePath);
            const command = new client_s3_1.GetObjectCommand({
                Bucket: this.bucket,
                Key: key,
            });
            // Generate the presigned URL
            return (0, s3_request_presigner_1.getSignedUrl)(this.client, command, { expiresIn: expiry });
        });
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
exports.S3Provider = S3Provider;
//# sourceMappingURL=s3-provider.js.map