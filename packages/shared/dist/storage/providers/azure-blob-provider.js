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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureBlobProvider = void 0;
const storage_blob_1 = require("@azure/storage-blob");
const path_1 = __importDefault(require("path"));
const stream_1 = require("stream");
/**
 * Storage provider implementation for Azure Blob Storage
 */
class AzureBlobProvider {
    /**
     * Creates a new instance of AzureBlobProvider
     * @param config Provider configuration
     */
    constructor(config) {
        this.config = config;
        this.basePath = config.basePath || '';
        this.containerName = config.containerName;
        this.accountName = config.accountName;
        this.accountKey = config.accountKey;
        // Initialize Azure Blob Storage client
        if (config.connectionString) {
            // Use connection string if provided
            this.blobServiceClient = storage_blob_1.BlobServiceClient.fromConnectionString(config.connectionString);
        }
        else if (config.accountName && config.accountKey) {
            // Use account name and key
            const credential = new storage_blob_1.StorageSharedKeyCredential(config.accountName, config.accountKey);
            const baseUrl = config.endpoint || `https://${config.accountName}.blob.core.windows.net`;
            this.blobServiceClient = new storage_blob_1.BlobServiceClient(baseUrl, credential);
        }
        else if (config.accountName && config.sasToken) {
            // Use SAS token
            const baseUrl = config.endpoint || `https://${config.accountName}.blob.core.windows.net`;
            this.blobServiceClient = new storage_blob_1.BlobServiceClient(`${baseUrl}?${config.sasToken}`);
        }
        else {
            throw new Error('Azure Blob Storage configuration requires either connectionString, accountName+accountKey, or accountName+sasToken');
        }
        // Get the container client
        this.containerClient = this.blobServiceClient.getContainerClient(this.containerName);
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
     * Gets a blob client for the specified path
     * @param filePath Path to the file
     * @returns BlockBlobClient instance
     */
    getBlobClient(filePath) {
        const blobPath = this.getFullPath(filePath);
        return this.containerClient.getBlockBlobClient(blobPath);
    }
    /**
     * Writes a file to storage
     * @param filePath Path to write the file to
     * @param data File content as buffer or stream
     */
    writeFile(filePath, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const blobClient = this.getBlobClient(filePath);
            const contentType = this.getMimeType(filePath);
            const options = {
                blobHTTPHeaders: {
                    blobContentType: contentType,
                },
            };
            if (Buffer.isBuffer(data)) {
                yield blobClient.upload(data, data.length, options);
            }
            else {
                // For stream data, we need to buffer it
                return new Promise((resolve, reject) => {
                    const chunks = [];
                    data.on('data', (chunk) => chunks.push(chunk));
                    data.on('error', (err) => reject(err));
                    data.on('end', () => __awaiter(this, void 0, void 0, function* () {
                        try {
                            const buffer = Buffer.concat(chunks);
                            yield blobClient.upload(buffer, buffer.length, options);
                            resolve();
                        }
                        catch (err) {
                            reject(err);
                        }
                    }));
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
            const blobClient = this.getBlobClient(filePath);
            const downloadResponse = yield blobClient.download(0);
            if (!downloadResponse.readableStreamBody) {
                throw new Error(`File ${filePath} not found or has no content`);
            }
            // Convert the stream to a buffer
            const stream = downloadResponse.readableStreamBody;
            return new Promise((resolve, reject) => {
                const chunks = [];
                stream.on('data', (chunk) => chunks.push(chunk));
                stream.on('error', (err) => reject(err));
                stream.on('end', () => resolve(Buffer.concat(chunks)));
            });
        });
    }
    /**
     * Creates a readable stream for a file
     * @param filePath Path to the file
     * @returns Readable stream
     */
    createReadStream(filePath) {
        const blobClient = this.getBlobClient(filePath);
        const passThrough = new stream_1.PassThrough();
        blobClient.download(0).then(response => {
            if (!response.readableStreamBody) {
                passThrough.emit('error', new Error(`File ${filePath} not found or has no content`));
                return;
            }
            response.readableStreamBody.pipe(passThrough);
        }).catch(err => {
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
        const blobClient = this.getBlobClient(filePath);
        const contentType = this.getMimeType(filePath);
        const passThrough = new stream_1.PassThrough();
        // Collect chunks and upload when the stream is finished
        const chunks = [];
        passThrough.on('data', (chunk) => chunks.push(chunk));
        passThrough.on('end', () => __awaiter(this, void 0, void 0, function* () {
            try {
                const buffer = Buffer.concat(chunks);
                yield blobClient.upload(buffer, buffer.length, {
                    blobHTTPHeaders: {
                        blobContentType: contentType,
                    },
                });
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
            const blobClient = this.getBlobClient(filePath);
            yield blobClient.delete();
        });
    }
    /**
     * Checks if a file exists
     * @param filePath Path to the file
     * @returns True if file exists, false otherwise
     */
    fileExists(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const blobClient = this.getBlobClient(filePath);
            return blobClient.exists();
        });
    }
    /**
     * Creates a directory (Azure Blob Storage doesn't have directories, so we create a marker blob)
     * @param dirPath Path to the directory
     */
    createDirectory(dirPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const path = this.getFullPath(dirPath);
            const normalizedPath = path.endsWith('/') ? path : `${path}/`;
            const placeholderBlobClient = this.containerClient.getBlockBlobClient(`${normalizedPath}_$folder$`);
            // Upload an empty blob as a directory marker
            yield placeholderBlobClient.upload('', 0);
        });
    }
    /**
     * Lists contents of a directory
     * @param dirPath Path to the directory
     * @returns Array of file/directory names
     */
    listDirectory(dirPath) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, e_1, _b, _c, _d, e_2, _e, _f;
            const prefix = this.getFullPath(dirPath);
            const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
            // List blobs with the specified prefix
            const results = [];
            const options = { prefix: normalizedPrefix };
            try {
                // Use for-await-of to handle pagination automatically
                for (var _g = true, _h = __asyncValues(this.containerClient.listBlobsFlat(options)), _j; _j = yield _h.next(), _a = _j.done, !_a; _g = true) {
                    _c = _j.value;
                    _g = false;
                    const blob = _c;
                    // Extract relative path from the blob name
                    const relativePath = blob.name.slice(normalizedPrefix.length);
                    // Skip empty names and directory markers
                    if (relativePath && !relativePath.includes('/') && !relativePath.endsWith('_$folder$')) {
                        results.push(relativePath);
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_g && !_a && (_b = _h.return)) yield _b.call(_h);
                }
                finally { if (e_1) throw e_1.error; }
            }
            // Detect subdirectories (in Azure they're not real, just name prefixes)
            const directories = new Set();
            try {
                for (var _k = true, _l = __asyncValues(this.containerClient.listBlobsFlat(options)), _m; _m = yield _l.next(), _d = _m.done, !_d; _k = true) {
                    _f = _m.value;
                    _k = false;
                    const blob = _f;
                    const relativePath = blob.name.slice(normalizedPrefix.length);
                    const parts = relativePath.split('/');
                    // If there are multiple parts, the first part is a subdirectory name
                    if (parts.length > 1 && parts[0]) {
                        directories.add(parts[0]);
                    }
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (!_k && !_d && (_e = _l.return)) yield _e.call(_l);
                }
                finally { if (e_2) throw e_2.error; }
            }
            // Add directories to results
            for (const dir of directories) {
                results.push(dir);
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
            var _a, e_3, _b, _c;
            const prefix = this.getFullPath(dirPath);
            const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
            if (!recursive) {
                // Check if directory is empty
                const options = { prefix: normalizedPrefix, maxResults: 2 };
                const iterator = this.containerClient.listBlobsFlat(options);
                let response = yield iterator.next();
                if (!response.done && response.value) {
                    // If we find a blob that isn't the directory marker itself, the directory isn't empty
                    if (response.value.name !== `${normalizedPrefix}_$folder$`) {
                        throw new Error(`Directory ${dirPath} is not empty`);
                    }
                    // Check if there's a second blob
                    response = yield iterator.next();
                    if (!response.done && response.value) {
                        throw new Error(`Directory ${dirPath} is not empty`);
                    }
                }
                // Delete the directory marker if it exists
                const markerBlobClient = this.containerClient.getBlockBlobClient(`${normalizedPrefix}_$folder$`);
                if (yield markerBlobClient.exists()) {
                    yield markerBlobClient.delete();
                }
                return;
            }
            try {
                // Recursive delete - list all blobs with the prefix and delete them
                for (var _d = true, _e = __asyncValues(this.containerClient.listBlobsFlat({ prefix: normalizedPrefix })), _f; _f = yield _e.next(), _a = _f.done, !_a; _d = true) {
                    _c = _f.value;
                    _d = false;
                    const blob = _c;
                    yield this.containerClient.getBlockBlobClient(blob.name).delete();
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
                }
                finally { if (e_3) throw e_3.error; }
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
            const blobClient = this.getBlobClient(filePath);
            const properties = yield blobClient.getProperties();
            return {
                name: path_1.default.basename(filePath),
                path: filePath,
                size: properties.contentLength || 0,
                contentType: properties.contentType || this.getMimeType(filePath),
                lastModified: properties.lastModified || new Date(),
                createdAt: properties.createdOn || new Date(),
                custom: properties.metadata || {},
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
            const blobClient = this.getBlobClient(filePath);
            // Azure Blob Storage allows us to directly update metadata
            yield blobClient.setMetadata(metadata.custom || {});
            // If content type is specified, we need to update properties
            if (metadata.contentType) {
                yield blobClient.setHTTPHeaders({
                    blobContentType: metadata.contentType,
                });
            }
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
            const blobClient = this.getBlobClient(filePath);
            // Check if container is public for anonymous access
            const containerProperties = yield this.containerClient.getProperties();
            const isPublicAccess = containerProperties.blobPublicAccess === 'blob' ||
                containerProperties.blobPublicAccess === 'container';
            if (!isPublicAccess && (options === null || options === void 0 ? void 0 : options.access) === 'public') {
                throw new Error('Container is not configured for public access. Use getSignedUrl instead.');
            }
            // Return the blob URL directly
            return blobClient.url;
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
            if (!this.accountKey) {
                throw new Error('Account key is required for generating signed URLs');
            }
            const blobClient = this.getBlobClient(filePath);
            // Create a SAS token with read permission
            const sasOptions = {
                containerName: this.containerName,
                blobName: this.getFullPath(filePath),
                permissions: storage_blob_1.BlobSASPermissions.parse('r'), // Read permission
                startsOn: new Date(),
                expiresOn: new Date(Date.now() + expiry * 1000),
            };
            const credential = new storage_blob_1.StorageSharedKeyCredential(this.accountName, this.accountKey);
            const sasToken = (0, storage_blob_1.generateBlobSASQueryParameters)(sasOptions, credential).toString();
            // Return the URL with the SAS token
            return `${blobClient.url}?${sasToken}`;
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
exports.AzureBlobProvider = AzureBlobProvider;
//# sourceMappingURL=azure-blob-provider.js.map