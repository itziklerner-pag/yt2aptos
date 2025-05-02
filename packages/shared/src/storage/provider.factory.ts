import { StorageProvider } from './provider.interface';
import { StorageConfig, StorageProviderType } from './types';
import { LocalFileSystemProvider, LocalFileSystemConfig } from './providers/local-file-system.provider';
import { S3Provider, S3ProviderConfig } from './providers/s3-provider';
import { AzureBlobProvider, AzureBlobProviderConfig } from './providers/azure-blob-provider';

/**
 * Factory for creating storage provider instances
 */
export class StorageProviderFactory {
  /**
   * Map of registered provider types to their constructor functions
   */
  private static providers: Record<string, new (config: any) => StorageProvider> = {
    [StorageProviderType.LOCAL]: LocalFileSystemProvider,
    [StorageProviderType.S3]: S3Provider,
    [StorageProviderType.AZURE]: AzureBlobProvider,
  };

  /**
   * Register a new storage provider type
   * @param type Provider type identifier
   * @param providerClass Provider constructor
   */
  static registerProvider(type: string, providerClass: new (config: any) => StorageProvider): void {
    this.providers[type] = providerClass;
  }

  /**
   * Create a storage provider instance based on configuration
   * @param config Provider configuration
   * @returns Storage provider instance
   */
  static createProvider(config: StorageConfig): StorageProvider {
    const { type } = config;
    
    const ProviderClass = this.providers[type];
    if (!ProviderClass) {
      throw new Error(`Storage provider type '${type}' is not registered`);
    }
    
    return new ProviderClass(config);
  }

  /**
   * Create a local file system storage provider
   * @param config Local file system configuration
   * @returns Local file system provider instance
   */
  static createLocalProvider(config: LocalFileSystemConfig): LocalFileSystemProvider {
    return new LocalFileSystemProvider(config);
  }

  /**
   * Create an S3 storage provider
   * @param config S3 configuration
   * @returns S3 provider instance
   */
  static createS3Provider(config: S3ProviderConfig): S3Provider {
    return new S3Provider(config);
  }

  /**
   * Create an Azure Blob storage provider
   * @param config Azure Blob configuration
   * @returns Azure Blob provider instance
   */
  static createAzureBlobProvider(config: AzureBlobProviderConfig): AzureBlobProvider {
    return new AzureBlobProvider(config);
  }
}