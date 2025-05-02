"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageProviderFactory = void 0;
const types_1 = require("./types");
const local_file_system_provider_1 = require("./providers/local-file-system.provider");
const s3_provider_1 = require("./providers/s3-provider");
const azure_blob_provider_1 = require("./providers/azure-blob-provider");
/**
 * Factory for creating storage provider instances
 */
class StorageProviderFactory {
    /**
     * Register a new storage provider type
     * @param type Provider type identifier
     * @param providerClass Provider constructor
     */
    static registerProvider(type, providerClass) {
        this.providers[type] = providerClass;
    }
    /**
     * Create a storage provider instance based on configuration
     * @param config Provider configuration
     * @returns Storage provider instance
     */
    static createProvider(config) {
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
    static createLocalProvider(config) {
        return new local_file_system_provider_1.LocalFileSystemProvider(config);
    }
    /**
     * Create an S3 storage provider
     * @param config S3 configuration
     * @returns S3 provider instance
     */
    static createS3Provider(config) {
        return new s3_provider_1.S3Provider(config);
    }
    /**
     * Create an Azure Blob storage provider
     * @param config Azure Blob configuration
     * @returns Azure Blob provider instance
     */
    static createAzureBlobProvider(config) {
        return new azure_blob_provider_1.AzureBlobProvider(config);
    }
}
exports.StorageProviderFactory = StorageProviderFactory;
/**
 * Map of registered provider types to their constructor functions
 */
StorageProviderFactory.providers = {
    [types_1.StorageProviderType.LOCAL]: local_file_system_provider_1.LocalFileSystemProvider,
    [types_1.StorageProviderType.S3]: s3_provider_1.S3Provider,
    [types_1.StorageProviderType.AZURE]: azure_blob_provider_1.AzureBlobProvider,
};
//# sourceMappingURL=provider.factory.js.map