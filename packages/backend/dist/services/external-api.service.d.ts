/**
 * Types for External API service
 */
export interface ApiKey {
    id: string;
    key: string;
    secret: string;
    userId: string;
    name: string;
    permissions: string[];
    createdAt: Date;
    lastUsed?: Date;
    isEnabled: boolean;
}
export interface ApiKeyDTO {
    id: string;
    key: string;
    name: string;
    permissions: string[];
    createdAt: Date;
    lastUsed?: Date;
    isEnabled: boolean;
}
export interface Webhook {
    id: string;
    url: string;
    apiKeyId: string;
    userId: string;
    name: string;
    events: string[];
    secretKey: string;
    createdAt: Date;
    lastTriggered?: Date;
    isEnabled: boolean;
    retryConfig: {
        maxRetries: number;
        retryDelay: number;
    };
}
export interface WebhookDTO {
    id: string;
    url: string;
    name: string;
    events: string[];
    createdAt: Date;
    lastTriggered?: Date;
    isEnabled: boolean;
}
export declare enum ExternalEventType {
    DOWNLOAD_STARTED = "download.started",
    DOWNLOAD_PROGRESS = "download.progress",
    DOWNLOAD_COMPLETED = "download.completed",
    DOWNLOAD_FAILED = "download.failed",
    CHANNEL_UPDATED = "channel.updated",
    PLAYLIST_UPDATED = "playlist.updated",
    STORAGE_EXCEEDED = "storage.exceeded",
    SYSTEM_ALERT = "system.alert"
}
export interface WebhookPayload {
    id: string;
    event: ExternalEventType;
    timestamp: Date;
    data: any;
}
/**
 * Service for managing external API access, API keys, and webhooks
 */
export declare class ExternalApiService {
    private static instance;
    private apiKeys;
    private webhooks;
    private eventSubscriptions;
    private webhookQueue;
    private isProcessingQueue;
    private webhookProcessingInterval;
    private constructor();
    /**
     * Get the singleton instance
     */
    static getInstance(): ExternalApiService;
    /**
     * Initialize the External API service
     */
    initialize(): void;
    /**
     * Shutdown the service
     */
    shutdown(): void;
    /**
     * Load API keys and webhooks from database
     * This is a placeholder - in a real implementation, you'd load from MongoDB
     */
    private loadFromDatabase;
    /**
     * Rebuild the event subscription map based on registered webhooks
     */
    private rebuildEventSubscriptions;
    /**
     * Setup event listeners for various system events
     */
    private setupEventListeners;
    /**
     * Method for other services to call when events occur
     * This serves as the entry point for event notifications from other services
     */
    notifyEvent(eventType: ExternalEventType, data: any): void;
    /**
     * Handle an event and notify subscribed webhooks
     */
    private handleEvent;
    /**
     * Queue a webhook delivery
     */
    private queueWebhookDelivery;
    /**
     * Process the webhook delivery queue
     */
    private processWebhookQueue;
    /**
     * Deliver a webhook payload to its destination
     */
    private deliverWebhook;
    /**
     * Generate HMAC signature for webhook payload
     */
    private generateWebhookSignature;
    /**
     * Create a new API key for a user
     */
    createApiKey(userId: string, name: string, permissions?: string[]): Promise<ApiKeyDTO>;
    /**
     * Generate a new API key
     */
    private generateApiKey;
    /**
     * Generate a new API secret
     */
    private generateApiSecret;
    /**
     * Map API key to DTO (removing sensitive information)
     */
    private mapApiKeyToDTO;
    /**
     * Get API keys for a user
     */
    getApiKeys(userId: string): ApiKeyDTO[];
    /**
     * Get an API key by ID
     */
    getApiKeyById(id: string, userId: string): ApiKeyDTO | null;
    /**
     * Validate API key and secret
     */
    validateApiKey(key: string, secret: string): ApiKey | null;
    /**
     * Revoke an API key
     */
    revokeApiKey(id: string, userId: string): boolean;
    /**
     * Create a new webhook
     */
    createWebhook(userId: string, apiKeyId: string, url: string, name: string, events?: ExternalEventType[]): WebhookDTO;
    /**
     * Map webhook to DTO (removing sensitive information)
     */
    private mapWebhookToDTO;
    /**
     * Get webhooks for a user
     */
    getWebhooks(userId: string): WebhookDTO[];
    /**
     * Get a webhook by ID
     */
    getWebhookById(id: string, userId: string): WebhookDTO | null;
    /**
     * Update a webhook
     */
    updateWebhook(id: string, userId: string, updates: Partial<{
        url: string;
        name: string;
        events: ExternalEventType[];
        isEnabled: boolean;
    }>): WebhookDTO | null;
    /**
     * Delete a webhook
     */
    deleteWebhook(id: string, userId: string): boolean;
    /**
     * Manually trigger an event for testing
     */
    triggerTestEvent(eventType: ExternalEventType, data: any): void;
    /**
     * Get available event types
     */
    getAvailableEventTypes(): {
        id: string;
        description: string;
    }[];
    /**
     * Check system health status for API
     */
    checkApiHealth(): {
        status: 'healthy' | 'degraded' | 'unhealthy';
        details: Record<string, any>;
    };
}
export declare const externalApiService: ExternalApiService;
