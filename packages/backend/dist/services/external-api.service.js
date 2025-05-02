"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.externalApiService = exports.ExternalApiService = exports.ExternalEventType = void 0;
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../utils/logger");
var ExternalEventType;
(function (ExternalEventType) {
    ExternalEventType["DOWNLOAD_STARTED"] = "download.started";
    ExternalEventType["DOWNLOAD_PROGRESS"] = "download.progress";
    ExternalEventType["DOWNLOAD_COMPLETED"] = "download.completed";
    ExternalEventType["DOWNLOAD_FAILED"] = "download.failed";
    ExternalEventType["CHANNEL_UPDATED"] = "channel.updated";
    ExternalEventType["PLAYLIST_UPDATED"] = "playlist.updated";
    ExternalEventType["STORAGE_EXCEEDED"] = "storage.exceeded";
    ExternalEventType["SYSTEM_ALERT"] = "system.alert";
})(ExternalEventType || (exports.ExternalEventType = ExternalEventType = {}));
/**
 * Service for managing external API access, API keys, and webhooks
 */
class ExternalApiService {
    static instance;
    // In-memory storage for API keys and webhooks
    // In a production environment, these would be stored in the database
    apiKeys = [];
    webhooks = [];
    // Map of event subscriptions
    eventSubscriptions = new Map();
    // Queue for webhook deliveries
    // In a production environment, this would use a persistent queue
    webhookQueue = [];
    isProcessingQueue = false;
    webhookProcessingInterval = null;
    constructor() {
        // Private constructor for singleton
    }
    /**
     * Get the singleton instance
     */
    static getInstance() {
        if (!ExternalApiService.instance) {
            ExternalApiService.instance = new ExternalApiService();
        }
        return ExternalApiService.instance;
    }
    /**
     * Initialize the External API service
     */
    initialize() {
        // Start the webhook delivery processor
        this.webhookProcessingInterval = setInterval(() => {
            this.processWebhookQueue();
        }, 10000); // Process every 10 seconds
        // Load existing API keys and webhooks from database (simulated here)
        this.loadFromDatabase();
        // Setup event listeners
        this.setupEventListeners();
        (0, logger_1.logInfo)('External API service initialized');
    }
    /**
     * Shutdown the service
     */
    shutdown() {
        if (this.webhookProcessingInterval) {
            clearInterval(this.webhookProcessingInterval);
        }
        (0, logger_1.logInfo)('External API service shut down');
    }
    /**
     * Load API keys and webhooks from database
     * This is a placeholder - in a real implementation, you'd load from MongoDB
     */
    async loadFromDatabase() {
        // In a real implementation, this would load from the database
        // For now, using empty arrays
        this.apiKeys = [];
        this.webhooks = [];
        // Rebuild event subscriptions from webhooks
        this.rebuildEventSubscriptions();
        (0, logger_1.logDebug)(`Loaded ${this.apiKeys.length} API keys and ${this.webhooks.length} webhooks`);
    }
    /**
     * Rebuild the event subscription map based on registered webhooks
     */
    rebuildEventSubscriptions() {
        // Clear existing subscriptions
        this.eventSubscriptions.clear();
        // Rebuild from webhooks
        for (const webhook of this.webhooks) {
            if (!webhook.isEnabled)
                continue;
            for (const event of webhook.events) {
                const eventType = event;
                if (!this.eventSubscriptions.has(eventType)) {
                    this.eventSubscriptions.set(eventType, new Set());
                }
                this.eventSubscriptions.get(eventType)?.add(webhook.id);
            }
        }
    }
    /**
     * Setup event listeners for various system events
     */
    setupEventListeners() {
        // In a real implementation, we would integrate with the event system of our application
        // Since we can't directly subscribe to WebSocket events, we'll need a different approach
        // For demonstration purposes, we'll create a mock event system that other services
        // could call to trigger our webhook system. In a real implementation, services like
        // the download service would call these methods directly.
        // Mock example of how services would call our event handler:
        // externalApiService.notifyEvent(ExternalEventType.DOWNLOAD_STARTED, downloadData);
        (0, logger_1.logDebug)('External API event handlers ready for notifications');
    }
    /**
     * Method for other services to call when events occur
     * This serves as the entry point for event notifications from other services
     */
    notifyEvent(eventType, data) {
        this.handleEvent(eventType, data);
    }
    /**
     * Handle an event and notify subscribed webhooks
     */
    handleEvent(eventType, data) {
        const subscribers = this.eventSubscriptions.get(eventType);
        if (!subscribers || subscribers.size === 0) {
            return; // No subscribers for this event
        }
        // Create the webhook payload
        const payload = {
            id: crypto_1.default.randomUUID(),
            event: eventType,
            timestamp: new Date(),
            data
        };
        // Queue webhook deliveries for all subscribers
        for (const webhookId of subscribers) {
            const webhook = this.webhooks.find(w => w.id === webhookId);
            if (webhook && webhook.isEnabled) {
                this.queueWebhookDelivery(webhook, payload);
            }
        }
        (0, logger_1.logDebug)(`Queued ${subscribers.size} webhook deliveries for event ${eventType}`);
    }
    /**
     * Queue a webhook delivery
     */
    queueWebhookDelivery(webhook, payload) {
        this.webhookQueue.push({
            webhook,
            payload,
            attempts: 0
        });
        // If not already processing, start processing the queue
        if (!this.isProcessingQueue) {
            this.processWebhookQueue();
        }
    }
    /**
     * Process the webhook delivery queue
     */
    async processWebhookQueue() {
        if (this.isProcessingQueue || this.webhookQueue.length === 0) {
            return;
        }
        this.isProcessingQueue = true;
        try {
            // Process a batch of items (up to 10)
            const batch = this.webhookQueue.splice(0, 10);
            // Process each webhook delivery
            const deliveryPromises = batch.map(item => this.deliverWebhook(item));
            // Wait for all deliveries to complete
            await Promise.allSettled(deliveryPromises);
        }
        catch (error) {
            (0, logger_1.logError)(`Error processing webhook queue: ${error}`);
        }
        finally {
            this.isProcessingQueue = false;
            // If there are more items, continue processing
            if (this.webhookQueue.length > 0) {
                setTimeout(() => this.processWebhookQueue(), 1000);
            }
        }
    }
    /**
     * Deliver a webhook payload to its destination
     */
    async deliverWebhook(item) {
        const { webhook, payload, attempts } = item;
        // Skip if maximum retries has been reached
        if (attempts >= webhook.retryConfig.maxRetries) {
            (0, logger_1.logError)(`Webhook delivery to ${webhook.url} failed after ${attempts} attempts`);
            return;
        }
        try {
            // Generate HMAC signature for payload verification
            const signature = this.generateWebhookSignature(webhook.secretKey, payload);
            // In a real implementation, use fetch or axios
            // Simulated delivery here
            (0, logger_1.logInfo)(`Delivering webhook to ${webhook.url} (attempt ${attempts + 1})`);
            // Simulate HTTP request (in reality, use fetch or axios)
            const success = Math.random() > 0.2; // 80% success rate for simulation
            if (success) {
                // Update last triggered timestamp
                const index = this.webhooks.findIndex(w => w.id === webhook.id);
                if (index !== -1) {
                    this.webhooks[index].lastTriggered = new Date();
                }
                (0, logger_1.logDebug)(`Webhook delivered to ${webhook.url}`);
            }
            else {
                // Retry with exponential backoff
                const delay = webhook.retryConfig.retryDelay * Math.pow(2, attempts);
                item.attempts += 1;
                // Re-queue with a delay
                setTimeout(() => {
                    this.webhookQueue.push(item);
                }, delay);
                (0, logger_1.logError)(`Webhook delivery to ${webhook.url} failed, retrying in ${delay}ms`);
            }
        }
        catch (error) {
            (0, logger_1.logError)(`Error delivering webhook to ${webhook.url}: ${error}`);
            // Retry with exponential backoff
            const delay = webhook.retryConfig.retryDelay * Math.pow(2, attempts);
            item.attempts += 1;
            // Re-queue with a delay
            setTimeout(() => {
                this.webhookQueue.push(item);
            }, delay);
        }
    }
    /**
     * Generate HMAC signature for webhook payload
     */
    generateWebhookSignature(secretKey, payload) {
        const hmac = crypto_1.default.createHmac('sha256', secretKey);
        hmac.update(JSON.stringify(payload));
        return hmac.digest('hex');
    }
    /**
     * Create a new API key for a user
     */
    async createApiKey(userId, name, permissions = []) {
        // Generate a new API key
        const id = crypto_1.default.randomUUID();
        const key = this.generateApiKey();
        const secret = this.generateApiSecret();
        const apiKey = {
            id,
            key,
            secret,
            userId,
            name,
            permissions,
            createdAt: new Date(),
            isEnabled: true
        };
        // Store the API key
        this.apiKeys.push(apiKey);
        // In a production environment, you would store this in the database
        // Return the API key (without the secret)
        return this.mapApiKeyToDTO(apiKey, true);
    }
    /**
     * Generate a new API key
     */
    generateApiKey() {
        return `yta_${crypto_1.default.randomBytes(16).toString('hex')}`;
    }
    /**
     * Generate a new API secret
     */
    generateApiSecret() {
        return crypto_1.default.randomBytes(32).toString('base64');
    }
    /**
     * Map API key to DTO (removing sensitive information)
     */
    mapApiKeyToDTO(apiKey, includeSecret = false) {
        const dto = {
            id: apiKey.id,
            key: apiKey.key,
            name: apiKey.name,
            permissions: [...apiKey.permissions],
            createdAt: new Date(apiKey.createdAt),
            lastUsed: apiKey.lastUsed ? new Date(apiKey.lastUsed) : undefined,
            isEnabled: apiKey.isEnabled
        };
        // Include secret only for newly created keys
        if (includeSecret) {
            dto.secret = apiKey.secret;
        }
        return dto;
    }
    /**
     * Get API keys for a user
     */
    getApiKeys(userId) {
        return this.apiKeys
            .filter(key => key.userId === userId)
            .map(key => this.mapApiKeyToDTO(key));
    }
    /**
     * Get an API key by ID
     */
    getApiKeyById(id, userId) {
        const apiKey = this.apiKeys.find(key => key.id === id && key.userId === userId);
        return apiKey ? this.mapApiKeyToDTO(apiKey) : null;
    }
    /**
     * Validate API key and secret
     */
    validateApiKey(key, secret) {
        const apiKey = this.apiKeys.find(k => k.key === key && k.secret === secret && k.isEnabled);
        if (apiKey) {
            // Update last used timestamp
            const index = this.apiKeys.findIndex(k => k.id === apiKey.id);
            if (index !== -1) {
                this.apiKeys[index].lastUsed = new Date();
            }
            return apiKey;
        }
        return null;
    }
    /**
     * Revoke an API key
     */
    revokeApiKey(id, userId) {
        const index = this.apiKeys.findIndex(key => key.id === id && key.userId === userId);
        if (index !== -1) {
            // Disable rather than delete for audit trail
            this.apiKeys[index].isEnabled = false;
            // In production environment, update in database
            // Remove associated webhooks
            this.webhooks = this.webhooks.filter(webhook => webhook.apiKeyId !== id);
            // Rebuild event subscriptions
            this.rebuildEventSubscriptions();
            return true;
        }
        return false;
    }
    /**
     * Create a new webhook
     */
    createWebhook(userId, apiKeyId, url, name, events = []) {
        // Validate API key
        const apiKey = this.apiKeys.find(key => key.id === apiKeyId && key.userId === userId && key.isEnabled);
        if (!apiKey) {
            throw new Error('Invalid API key');
        }
        // Create webhook
        const id = crypto_1.default.randomUUID();
        const secretKey = crypto_1.default.randomBytes(32).toString('base64');
        const webhook = {
            id,
            url,
            apiKeyId,
            userId,
            name,
            events: [...events],
            secretKey,
            createdAt: new Date(),
            isEnabled: true,
            retryConfig: {
                maxRetries: 5,
                retryDelay: 60000 // 1 minute
            }
        };
        // Store the webhook
        this.webhooks.push(webhook);
        // Update event subscriptions
        for (const event of events) {
            if (!this.eventSubscriptions.has(event)) {
                this.eventSubscriptions.set(event, new Set());
            }
            this.eventSubscriptions.get(event)?.add(id);
        }
        // In a production environment, you would store this in the database
        // Return webhook info (without the secret)
        return this.mapWebhookToDTO(webhook);
    }
    /**
     * Map webhook to DTO (removing sensitive information)
     */
    mapWebhookToDTO(webhook) {
        return {
            id: webhook.id,
            url: webhook.url,
            name: webhook.name,
            events: [...webhook.events],
            createdAt: new Date(webhook.createdAt),
            lastTriggered: webhook.lastTriggered ? new Date(webhook.lastTriggered) : undefined,
            isEnabled: webhook.isEnabled
        };
    }
    /**
     * Get webhooks for a user
     */
    getWebhooks(userId) {
        return this.webhooks
            .filter(webhook => webhook.userId === userId)
            .map(webhook => this.mapWebhookToDTO(webhook));
    }
    /**
     * Get a webhook by ID
     */
    getWebhookById(id, userId) {
        const webhook = this.webhooks.find(w => w.id === id && w.userId === userId);
        return webhook ? this.mapWebhookToDTO(webhook) : null;
    }
    /**
     * Update a webhook
     */
    updateWebhook(id, userId, updates) {
        const index = this.webhooks.findIndex(webhook => webhook.id === id && webhook.userId === userId);
        if (index === -1) {
            return null;
        }
        // Update webhook
        const webhook = this.webhooks[index];
        if (updates.url !== undefined)
            webhook.url = updates.url;
        if (updates.name !== undefined)
            webhook.name = updates.name;
        if (updates.isEnabled !== undefined)
            webhook.isEnabled = updates.isEnabled;
        if (updates.events !== undefined) {
            // Remove old event subscriptions
            for (const event of webhook.events) {
                const eventType = event;
                this.eventSubscriptions.get(eventType)?.delete(id);
            }
            // Update events
            webhook.events = [...updates.events];
            // Add new event subscriptions
            for (const event of webhook.events) {
                const eventType = event;
                if (!this.eventSubscriptions.has(eventType)) {
                    this.eventSubscriptions.set(eventType, new Set());
                }
                this.eventSubscriptions.get(eventType)?.add(id);
            }
        }
        // In a production environment, update in database
        return this.mapWebhookToDTO(webhook);
    }
    /**
     * Delete a webhook
     */
    deleteWebhook(id, userId) {
        const index = this.webhooks.findIndex(webhook => webhook.id === id && webhook.userId === userId);
        if (index !== -1) {
            const webhook = this.webhooks[index];
            // Remove event subscriptions
            for (const event of webhook.events) {
                const eventType = event;
                this.eventSubscriptions.get(eventType)?.delete(id);
            }
            // Remove webhook
            this.webhooks.splice(index, 1);
            // In production environment, delete from database
            return true;
        }
        return false;
    }
    /**
     * Manually trigger an event for testing
     */
    triggerTestEvent(eventType, data) {
        this.handleEvent(eventType, data);
    }
    /**
     * Get available event types
     */
    getAvailableEventTypes() {
        return [
            { id: ExternalEventType.DOWNLOAD_STARTED, description: 'Fired when a download job is started' },
            { id: ExternalEventType.DOWNLOAD_PROGRESS, description: 'Fired when download progress is updated' },
            { id: ExternalEventType.DOWNLOAD_COMPLETED, description: 'Fired when a download job is completed' },
            { id: ExternalEventType.DOWNLOAD_FAILED, description: 'Fired when a download job fails' },
            { id: ExternalEventType.CHANNEL_UPDATED, description: 'Fired when a channel is updated' },
            { id: ExternalEventType.PLAYLIST_UPDATED, description: 'Fired when a playlist is updated' },
            { id: ExternalEventType.STORAGE_EXCEEDED, description: 'Fired when storage limit is exceeded' },
            { id: ExternalEventType.SYSTEM_ALERT, description: 'Fired when a system alert is triggered' }
        ];
    }
    /**
     * Check system health status for API
     */
    checkApiHealth() {
        const webhookQueueSize = this.webhookQueue.length;
        const activeApiKeys = this.apiKeys.filter(key => key.isEnabled).length;
        const activeWebhooks = this.webhooks.filter(webhook => webhook.isEnabled).length;
        // Determine health status
        let status = 'healthy';
        const issues = [];
        // Check webhook queue
        if (webhookQueueSize > 1000) {
            status = 'degraded';
            issues.push('Webhook delivery queue size is very high');
        }
        return {
            status,
            details: {
                apiKeys: activeApiKeys,
                webhooks: activeWebhooks,
                webhookQueueSize,
                issues
            }
        };
    }
}
exports.ExternalApiService = ExternalApiService;
// Create and export singleton instance
exports.externalApiService = ExternalApiService.getInstance();
//# sourceMappingURL=external-api.service.js.map