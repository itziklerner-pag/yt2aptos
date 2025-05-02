import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  ContainerClient,
  BlockBlobClient,
  BlobSASPermissions,
  BlobSASSignatureValues,
  generateBlobSASQueryParameters,
} from '@azure/storage-blob';
import { Readable, Writable } from 'stream';
import { StorageProvider } from '../provider.interface';
import { FileMetadata, StorageConfig, UrlOptions } from '../types';
import path from 'path';
import { PassThrough } from 'stream';

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
export class AzureBlobProvider implements StorageProvider {
  private readonly blobServiceClient: BlobServiceClient;
  private readonly containerClient: ContainerClient;
  private readonly containerName: string;
  private readonly basePath: string;
  private readonly accountName: string;
  private readonly accountKey?: string;

  /**
   * Creates a new instance of AzureBlobProvider
   * @param config Provider configuration
   */
  constructor(private readonly config: AzureBlobProviderConfig) {
    this.basePath = config.basePath || '';
    this.containerName = config.containerName;
    this.accountName = config.accountName;
    this.accountKey = config.accountKey;

    // Initialize Azure Blob Storage client
    if (config.connectionString) {
      // Use connection string if provided
      this.blobServiceClient = BlobServiceClient.fromConnectionString(config.connectionString);
    } else if (config.accountName && config.accountKey) {
      // Use account name and key
      const credential = new StorageSharedKeyCredential(config.accountName, config.accountKey);
      const baseUrl = config.endpoint || `https://${config.accountName}.blob.core.windows.net`;
      this.blobServiceClient = new BlobServiceClient(baseUrl, credential);
    } else if (config.accountName && config.sasToken) {
      // Use SAS token
      const baseUrl = config.endpoint || `https://${config.accountName}.blob.core.windows.net`;
      this.blobServiceClient = new BlobServiceClient(`${baseUrl}?${config.sasToken}`);
    } else {
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
  private getFullPath(filePath: string): string {
    // Normalize path and remove leading slashes
    const normalizedPath = path.normalize(filePath).replace(/^\/+/, '');
    // Combine with base path if it exists
    if (this.basePath) {
      return path.join(this.basePath, normalizedPath).replace(/\\/g, '/');
    }
    return normalizedPath.replace(/\\/g, '/');
  }

  /**
   * Gets a blob client for the specified path
   * @param filePath Path to the file
   * @returns BlockBlobClient instance
   */
  private getBlobClient(filePath: string): BlockBlobClient {
    const blobPath = this.getFullPath(filePath);
    return this.containerClient.getBlockBlobClient(blobPath);
  }

  /**
   * Writes a file to storage
   * @param filePath Path to write the file to
   * @param data File content as buffer or stream
   */
  async writeFile(filePath: string, data: Buffer | Readable): Promise<void> {
    const blobClient = this.getBlobClient(filePath);
    const contentType = this.getMimeType(filePath);
    const options = {
      blobHTTPHeaders: {
        blobContentType: contentType,
      },
    };

    if (Buffer.isBuffer(data)) {
      await blobClient.upload(data, data.length, options);
    } else {
      // For stream data, we need to buffer it
      return new Promise<void>((resolve, reject) => {
        const chunks: any[] = [];
        data.on('data', (chunk) => chunks.push(chunk));
        data.on('error', (err) => reject(err));
        data.on('end', async () => {
          try {
            const buffer = Buffer.concat(chunks);
            await blobClient.upload(buffer, buffer.length, options);
            resolve();
          } catch (err) {
            reject(err);
          }
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
    const blobClient = this.getBlobClient(filePath);
    const downloadResponse = await blobClient.download(0);
    
    if (!downloadResponse.readableStreamBody) {
      throw new Error(`File ${filePath} not found or has no content`);
    }

    // Convert the stream to a buffer
    const stream = downloadResponse.readableStreamBody;
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: any[] = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('error', (err) => reject(err));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  /**
   * Creates a readable stream for a file
   * @param filePath Path to the file
   * @returns Readable stream
   */
  createReadStream(filePath: string): Readable {
    const blobClient = this.getBlobClient(filePath);
    const passThrough = new PassThrough();

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
  createWriteStream(filePath: string): Writable {
    const blobClient = this.getBlobClient(filePath);
    const contentType = this.getMimeType(filePath);
    const passThrough = new PassThrough();
    
    // Collect chunks and upload when the stream is finished
    const chunks: any[] = [];
    passThrough.on('data', (chunk) => chunks.push(chunk));
    passThrough.on('end', async () => {
      try {
        const buffer = Buffer.concat(chunks);
        await blobClient.upload(buffer, buffer.length, {
          blobHTTPHeaders: {
            blobContentType: contentType,
          },
        });
      } catch (err) {
        passThrough.emit('error', err);
      }
    });

    return passThrough;
  }

  /**
   * Deletes a file from storage
   * @param filePath Path to the file
   */
  async deleteFile(filePath: string): Promise<void> {
    const blobClient = this.getBlobClient(filePath);
    await blobClient.delete();
  }

  /**
   * Checks if a file exists
   * @param filePath Path to the file
   * @returns True if file exists, false otherwise
   */
  async fileExists(filePath: string): Promise<boolean> {
    const blobClient = this.getBlobClient(filePath);
    return blobClient.exists();
  }

  /**
   * Creates a directory (Azure Blob Storage doesn't have directories, so we create a marker blob)
   * @param dirPath Path to the directory
   */
  async createDirectory(dirPath: string): Promise<void> {
    const path = this.getFullPath(dirPath);
    const normalizedPath = path.endsWith('/') ? path : `${path}/`;
    const placeholderBlobClient = this.containerClient.getBlockBlobClient(`${normalizedPath}_$folder$`);
    
    // Upload an empty blob as a directory marker
    await placeholderBlobClient.upload('', 0);
  }

  /**
   * Lists contents of a directory
   * @param dirPath Path to the directory
   * @returns Array of file/directory names
   */
  async listDirectory(dirPath: string): Promise<string[]> {
    const prefix = this.getFullPath(dirPath);
    const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
    
    // List blobs with the specified prefix
    const results: string[] = [];
    const options = { prefix: normalizedPrefix };
    
    // Use for-await-of to handle pagination automatically
    for await (const blob of this.containerClient.listBlobsFlat(options)) {
      // Extract relative path from the blob name
      const relativePath = blob.name.slice(normalizedPrefix.length);
      
      // Skip empty names and directory markers
      if (relativePath && !relativePath.includes('/') && !relativePath.endsWith('_$folder$')) {
        results.push(relativePath);
      }
    }
    
    // Detect subdirectories (in Azure they're not real, just name prefixes)
    const directories = new Set<string>();
    for await (const blob of this.containerClient.listBlobsFlat(options)) {
      const relativePath = blob.name.slice(normalizedPrefix.length);
      const parts = relativePath.split('/');
      
      // If there are multiple parts, the first part is a subdirectory name
      if (parts.length > 1 && parts[0]) {
        directories.add(parts[0]);
      }
    }
    
    // Add directories to results
    for (const dir of directories) {
      results.push(dir);
    }
    
    return results;
  }

  /**
   * Deletes a directory
   * @param dirPath Path to the directory
   * @param recursive Whether to delete contents recursively
   */
  async deleteDirectory(dirPath: string, recursive: boolean): Promise<void> {
    const prefix = this.getFullPath(dirPath);
    const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
    
    if (!recursive) {
      // Check if directory is empty
      const options = { prefix: normalizedPrefix, maxResults: 2 };
      const iterator = this.containerClient.listBlobsFlat(options);
      let response = await iterator.next();
      
      if (!response.done && response.value) {
        // If we find a blob that isn't the directory marker itself, the directory isn't empty
        if (response.value.name !== `${normalizedPrefix}_$folder$`) {
          throw new Error(`Directory ${dirPath} is not empty`);
        }
        
        // Check if there's a second blob
        response = await iterator.next();
        if (!response.done && response.value) {
          throw new Error(`Directory ${dirPath} is not empty`);
        }
      }
      
      // Delete the directory marker if it exists
      const markerBlobClient = this.containerClient.getBlockBlobClient(`${normalizedPrefix}_$folder$`);
      if (await markerBlobClient.exists()) {
        await markerBlobClient.delete();
      }
      
      return;
    }
    
    // Recursive delete - list all blobs with the prefix and delete them
    for await (const blob of this.containerClient.listBlobsFlat({ prefix: normalizedPrefix })) {
      await this.containerClient.getBlockBlobClient(blob.name).delete();
    }
  }

  /**
   * Gets metadata for a file
   * @param filePath Path to the file
   * @returns File metadata
   */
  async getMetadata(filePath: string): Promise<FileMetadata> {
    const blobClient = this.getBlobClient(filePath);
    const properties = await blobClient.getProperties();
    
    return {
      name: path.basename(filePath),
      path: filePath,
      size: properties.contentLength || 0,
      contentType: properties.contentType || this.getMimeType(filePath),
      lastModified: properties.lastModified || new Date(),
      createdAt: properties.createdOn || new Date(),
      custom: properties.metadata || {},
    };
  }

  /**
   * Updates metadata for a file
   * @param filePath Path to the file
   * @param metadata Metadata to update
   */
  async updateMetadata(filePath: string, metadata: Partial<FileMetadata>): Promise<void> {
    const blobClient = this.getBlobClient(filePath);
    
    // Azure Blob Storage allows us to directly update metadata
    await blobClient.setMetadata(metadata.custom || {});
    
    // If content type is specified, we need to update properties
    if (metadata.contentType) {
      await blobClient.setHTTPHeaders({
        blobContentType: metadata.contentType,
      });
    }
  }

  /**
   * Gets a public URL for a file
   * @param filePath Path to the file
   * @param options URL options
   * @returns Public URL
   */
  async getPublicUrl(filePath: string, options?: UrlOptions): Promise<string> {
    const blobClient = this.getBlobClient(filePath);
    
    // Check if container is public for anonymous access
    const containerProperties = await this.containerClient.getProperties();
    const isPublicAccess = containerProperties.blobPublicAccess === 'blob' || 
                          containerProperties.blobPublicAccess === 'container';
    
    if (!isPublicAccess && options?.access === 'public') {
      throw new Error('Container is not configured for public access. Use getSignedUrl instead.');
    }
    
    // Return the blob URL directly
    return blobClient.url;
  }

  /**
   * Gets a signed URL for a file with expiration
   * @param filePath Path to the file
   * @param expiry Expiration time in seconds
   * @returns Signed URL
   */
  async getSignedUrl(filePath: string, expiry: number): Promise<string> {
    if (!this.accountKey) {
      throw new Error('Account key is required for generating signed URLs');
    }
    
    const blobClient = this.getBlobClient(filePath);
    
    // Create a SAS token with read permission
    const sasOptions: BlobSASSignatureValues = {
      containerName: this.containerName,
      blobName: this.getFullPath(filePath),
      permissions: BlobSASPermissions.parse('r'), // Read permission
      startsOn: new Date(),
      expiresOn: new Date(Date.now() + expiry * 1000),
    };
    
    const credential = new StorageSharedKeyCredential(this.accountName, this.accountKey);
    const sasToken = generateBlobSASQueryParameters(sasOptions, credential).toString();
    
    // Return the URL with the SAS token
    return `${blobClient.url}?${sasToken}`;
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