import { StorageProvider } from './provider.interface';
import { StorageConfig } from './types';
import { LocalFileSystemProvider, LocalFileSystemConfig } from './providers/local-file-system.provider';

/**
 * Factory for creating storage provider instances
 */
export class StorageProviderFactory {
  /**
   * Map of registered provider types to their constructor functions
   */
  private static providers: Record<string, new (config: any) => StorageProvider> = {
    local: LocalFileSystemProvider,
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
}