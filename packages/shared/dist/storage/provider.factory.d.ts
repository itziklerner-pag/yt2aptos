import { StorageProvider } from './provider.interface';
import { StorageConfig } from './types';
import { LocalFileSystemProvider, LocalFileSystemConfig } from './providers/local-file-system.provider';
/**
 * Factory for creating storage provider instances
 */
export declare class StorageProviderFactory {
    /**
     * Map of registered provider types to their constructor functions
     */
    private static providers;
    /**
     * Register a new storage provider type
     * @param type Provider type identifier
     * @param providerClass Provider constructor
     */
    static registerProvider(type: string, providerClass: new (config: any) => StorageProvider): void;
    /**
     * Create a storage provider instance based on configuration
     * @param config Provider configuration
     * @returns Storage provider instance
     */
    static createProvider(config: StorageConfig): StorageProvider;
    /**
     * Create a local file system storage provider
     * @param config Local file system configuration
     * @returns Local file system provider instance
     */
    static createLocalProvider(config: LocalFileSystemConfig): LocalFileSystemProvider;
}
//# sourceMappingURL=provider.factory.d.ts.map