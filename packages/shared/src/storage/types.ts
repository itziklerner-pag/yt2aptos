/**
 * File metadata information
 */
export interface FileMetadata {
  /** File name */
  name: string;
  /** File path */
  path: string;
  /** File size in bytes */
  size: number;
  /** File MIME type */
  contentType: string;
  /** Last modified timestamp */
  lastModified: Date;
  /** Creation timestamp */
  createdAt: Date;
  /** Custom metadata key-value pairs */
  custom?: Record<string, any>;
}

/**
 * Options for URL generation
 */
export interface UrlOptions {
  /** Duration in seconds for URL validity */
  expiresIn?: number;
  /** Content disposition */
  contentDisposition?: 'inline' | 'attachment';
  /** HTTP headers to include */
  headers?: Record<string, string>;
  /** Access control */
  access?: 'public' | 'private';
}

/**
 * Storage provider configuration
 */
export interface StorageConfig {
  /** Provider type */
  type: 'local' | 's3' | 'azure' | string;
  /** Base path or root directory */
  basePath?: string;
  /** Provider-specific credentials and options */
  options?: Record<string, any>;
  /** Default URL options */
  defaultUrlOptions?: UrlOptions;
}

/**
 * Enum of supported storage provider types
 */
export enum StorageProviderType {
  LOCAL = 'local',
  S3 = 's3',
  AZURE = 'azure'
}