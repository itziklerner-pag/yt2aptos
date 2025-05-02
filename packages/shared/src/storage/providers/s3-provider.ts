import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommandInput,
  GetObjectCommandInput,
  DeleteObjectCommandInput,
  HeadObjectCommandInput,
  ListObjectsV2CommandInput,
  S3ClientConfig,
  ObjectCannedACL,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  CompletedPart,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable, Writable } from 'stream';
import { StorageProvider } from '../provider.interface';
import { FileMetadata, StorageConfig, UrlOptions } from '../types';
import path from 'path';
import { PassThrough } from 'stream';

/**
 * Configuration options for S3Provider
 */
export interface S3ProviderConfig extends StorageConfig {
  /** AWS region */
  region: string;
  /** S3 bucket name */
  bucket: string;
  /** AWS access key ID */
  accessKeyId?: string;
  /** AWS secret access key */
  secretAccessKey?: string;
  /** AWS session token */
  sessionToken?: string;
  /** Custom endpoint for S3 compatible services (e.g., MinIO) */
  endpoint?: string;
  /** Force path style endpoint */
  forcePathStyle?: boolean;
  /** Base path inside the bucket */
  basePath?: string;
}

/**
 * Storage provider implementation for AWS S3
 */
export class S3Provider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly basePath: string;

  /**
   * Creates a new instance of S3Provider
   * @param config Provider configuration
   */
  constructor(private readonly config: S3ProviderConfig) {
    const clientConfig: S3ClientConfig = {
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

    this.client = new S3Client(clientConfig);
    this.bucket = config.bucket;
    this.basePath = config.basePath || '';
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
   * Writes a file to storage
   * @param filePath Path to write the file to
   * @param data File content as buffer or stream
   */
  async writeFile(filePath: string, data: Buffer | Readable): Promise<void> {
    const key = this.getFullPath(filePath);
    const contentType = this.getMimeType(filePath);

    // If data is a buffer, we can upload it directly
    if (Buffer.isBuffer(data)) {
      const params: PutObjectCommandInput = {
        Bucket: this.bucket,
        Key: key,
        Body: data,
        ContentType: contentType,
      };

      await this.client.send(new PutObjectCommand(params));
      return;
    }

    // For streams, we need to collect data before sending
    return new Promise<void>((resolve, reject) => {
      const chunks: any[] = [];
      data.on('data', (chunk) => chunks.push(chunk));
      data.on('error', (err) => reject(err));
      data.on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks);
          const params: PutObjectCommandInput = {
            Bucket: this.bucket,
            Key: key,
            Body: buffer,
            ContentType: contentType,
          };

          await this.client.send(new PutObjectCommand(params));
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  /**
   * Reads a file from storage
   * @param filePath Path to the file
   * @returns File content as buffer
   */
  async readFile(filePath: string): Promise<Buffer> {
    const key = this.getFullPath(filePath);
    const params: GetObjectCommandInput = {
      Bucket: this.bucket,
      Key: key,
    };

    const response = await this.client.send(new GetObjectCommand(params));
    if (!response.Body) {
      throw new Error(`File ${filePath} not found or has no content`);
    }

    // Convert the stream to a buffer
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: any[] = [];
      // @ts-ignore (Body implements a Stream interface)
      response.Body.on('data', (chunk) => chunks.push(chunk));
      // @ts-ignore
      response.Body.on('error', (err) => reject(err));
      // @ts-ignore
      response.Body.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  /**
   * Creates a readable stream for a file
   * @param filePath Path to the file
   * @returns Readable stream
   */
  createReadStream(filePath: string): Readable {
    const key = this.getFullPath(filePath);
    const params: GetObjectCommandInput = {
      Bucket: this.bucket,
      Key: key,
    };

    const passThrough = new PassThrough();

    this.client.send(new GetObjectCommand(params))
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
  createWriteStream(filePath: string): Writable {
    const key = this.getFullPath(filePath);
    const contentType = this.getMimeType(filePath);
    const passThrough = new PassThrough();
    
    // Collect chunks and upload when the stream is finished
    const chunks: any[] = [];
    passThrough.on('data', (chunk) => chunks.push(chunk));
    passThrough.on('end', async () => {
      try {
        const buffer = Buffer.concat(chunks);
        const params: PutObjectCommandInput = {
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        };

        await this.client.send(new PutObjectCommand(params));
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
    const key = this.getFullPath(filePath);
    const params: DeleteObjectCommandInput = {
      Bucket: this.bucket,
      Key: key,
    };

    await this.client.send(new DeleteObjectCommand(params));
  }

  /**
   * Checks if a file exists
   * @param filePath Path to the file
   * @returns True if file exists, false otherwise
   */
  async fileExists(filePath: string): Promise<boolean> {
    const key = this.getFullPath(filePath);
    const params: HeadObjectCommandInput = {
      Bucket: this.bucket,
      Key: key,
    };

    try {
      await this.client.send(new HeadObjectCommand(params));
      return true;
    } catch (error) {
      // HTTP 404 means the file doesn't exist
      if ((error as any).name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Creates a directory (S3 doesn't have directories, so we create an empty object with a trailing slash)
   * @param dirPath Path to the directory
   */
  async createDirectory(dirPath: string): Promise<void> {
    const key = this.getFullPath(dirPath);
    const normalizedKey = key.endsWith('/') ? key : `${key}/`;
    
    const params: PutObjectCommandInput = {
      Bucket: this.bucket,
      Key: normalizedKey,
      Body: '',
    };

    await this.client.send(new PutObjectCommand(params));
  }

  /**
   * Lists contents of a directory
   * @param dirPath Path to the directory
   * @returns Array of file/directory names
   */
  async listDirectory(dirPath: string): Promise<string[]> {
    const prefix = this.getFullPath(dirPath);
    const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
    
    const params: ListObjectsV2CommandInput = {
      Bucket: this.bucket,
      Prefix: normalizedPrefix,
      Delimiter: '/',
    };

    const response = await this.client.send(new ListObjectsV2Command(params));
    const results: string[] = [];

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
      // Check if directory is empty first
      const params: ListObjectsV2CommandInput = {
        Bucket: this.bucket,
        Prefix: normalizedPrefix,
        MaxKeys: 2, // We only need to know if there's at least one object
      };

      const response = await this.client.send(new ListObjectsV2Command(params));
      
      if (response.Contents && response.Contents.length > 1) {
        throw new Error(`Directory ${dirPath} is not empty`);
      }

      // Delete the directory marker
      await this.client.send(new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: normalizedPrefix,
      }));
      
      return;
    }

    // Recursive delete - list all objects and delete them
    let isTruncated = true;
    let continuationToken: string | undefined;

    while (isTruncated) {
      const params: ListObjectsV2CommandInput = {
        Bucket: this.bucket,
        Prefix: normalizedPrefix,
        ContinuationToken: continuationToken,
      };

      const response = await this.client.send(new ListObjectsV2Command(params));
      
      if (response.Contents) {
        for (const content of response.Contents) {
          if (content.Key) {
            await this.client.send(new DeleteObjectCommand({
              Bucket: this.bucket,
              Key: content.Key,
            }));
          }
        }
      }

      isTruncated = response.IsTruncated || false;
      continuationToken = response.NextContinuationToken;
    }
  }

  /**
   * Gets metadata for a file
   * @param filePath Path to the file
   * @returns File metadata
   */
  async getMetadata(filePath: string): Promise<FileMetadata> {
    const key = this.getFullPath(filePath);
    const params: HeadObjectCommandInput = {
      Bucket: this.bucket,
      Key: key,
    };

    const response = await this.client.send(new HeadObjectCommand(params));
    
    const fileName = path.basename(filePath);
    const lastModified = response.LastModified || new Date();
    const size = response.ContentLength || 0;
    const contentType = response.ContentType || this.getMimeType(filePath);
    
    // Map to standard metadata format
    const metadata: FileMetadata = {
      name: fileName,
      path: filePath,
      size: size,
      contentType: contentType,
      lastModified: lastModified,
      createdAt: lastModified, // S3 doesn't track creation time separately
      custom: response.Metadata || {},
    };

    return metadata;
  }

  /**
   * Updates metadata for a file
   * @param filePath Path to the file
   * @param metadata Metadata to update
   */
  async updateMetadata(filePath: string, metadata: Partial<FileMetadata>): Promise<void> {
    // For S3, we need to implement custom metadata update
    // We need to get the current content and re-upload with new metadata
    const key = this.getFullPath(filePath);
    
    // First, get the current content of the file
    const fileContent = await this.readFile(filePath);
    
    // Then re-upload with updated metadata
    const params: PutObjectCommandInput = {
      Bucket: this.bucket,
      Key: key,
      Body: fileContent,
      ContentType: metadata.contentType || this.getMimeType(filePath),
      Metadata: metadata.custom as Record<string, string>,
    };
    
    await this.client.send(new PutObjectCommand(params));
  }

  /**
   * Gets a public URL for a file
   * @param filePath Path to the file
   * @param options URL options
   * @returns Public URL
   */
  async getPublicUrl(filePath: string, options?: UrlOptions): Promise<string> {
    const key = this.getFullPath(filePath);
    
    // If public access is desired, we need to make the object public
    if (options?.access === 'public') {
      const params: PutObjectCommandInput = {
        Bucket: this.bucket,
        Key: key,
        ACL: 'public-read' as ObjectCannedACL,
      };
      
      await this.client.send(new PutObjectCommand(params));
    }
    
    // Construct the URL manually
    // Format: https://<bucketname>.s3.<region>.amazonaws.com/<key>
    let endpoint = this.config.endpoint;
    if (!endpoint) {
      // Use the default AWS S3 endpoint format
      endpoint = `https://${this.bucket}.s3.${this.config.region}.amazonaws.com`;
    }
    
    return `${endpoint}/${key}`;
  }

  /**
   * Gets a signed URL for a file with expiration
   * @param filePath Path to the file
   * @param expiry Expiration time in seconds
   * @returns Signed URL
   */
  async getSignedUrl(filePath: string, expiry: number): Promise<string> {
    const key = this.getFullPath(filePath);
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    
    // Generate the presigned URL
    return getSignedUrl(this.client, command, { expiresIn: expiry });
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