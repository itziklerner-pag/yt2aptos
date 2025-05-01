"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageProviderFactory = void 0;
const local_file_system_provider_1 = require("./providers/local-file-system.provider");
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
}
exports.StorageProviderFactory = StorageProviderFactory;
/**
 * Map of registered provider types to their constructor functions
 */
StorageProviderFactory.providers = {
    local: local_file_system_provider_1.LocalFileSystemProvider,
};
//# sourceMappingURL=provider.factory.js.map