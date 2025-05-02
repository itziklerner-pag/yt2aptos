import crypto from 'crypto';
import { logInfo, logError, logDebug } from '../utils/logger';
import { UserModel } from '../models/user.model';
import { websocketService } from './websocket.service';
import { SocketEventType } from '../types/socket.types';

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
    retryDelay: number; // in ms
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

export enum ExternalEventType {
  DOWNLOAD_STARTED = 'download.started',
  DOWNLOAD_PROGRESS = 'download.progress',
  DOWNLOAD_COMPLETED = 'download.completed',
  DOWNLOAD_FAILED = 'download.failed',
  CHANNEL_UPDATED = 'channel.updated',
  PLAYLIST_UPDATED = 'playlist.updated',
  STORAGE_EXCEEDED = 'storage.exceeded',
  SYSTEM_ALERT = 'system.alert'
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
export class ExternalApiService {
  private static instance: ExternalApiService;
  
  // In-memory storage for API keys and webhooks
  // In a production environment, these would be stored in the database
  private apiKeys: ApiKey[] = [];
  private webhooks: Webhook[] = [];
  
  // Map of event subscriptions
  private eventSubscriptions: Map<ExternalEventType, Set<string>> = new Map();
  
  // Queue for webhook deliveries
  // In a production environment, this would use a persistent queue
  private webhookQueue: { webhook: Webhook, payload: WebhookPayload, attempts: number }[] = [];
  private isProcessingQueue = false;
  private webhookProcessingInterval: NodeJS.Timeout | null = null;
  
  private constructor() {
    // Private constructor for singleton
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): ExternalApiService {
    if (!ExternalApiService.instance) {
      ExternalApiService.instance = new ExternalApiService();
    }
    return ExternalApiService.instance;
  }
  
  /**
   * Initialize the External API service
   */
  public initialize(): void {
    // Start the webhook delivery processor
    this.webhookProcessingInterval = setInterval(() => {
      this.processWebhookQueue();
    }, 10000); // Process every 10 seconds
    
    // Load existing API keys and webhooks from database (simulated here)
    this.loadFromDatabase();
    
    // Setup event listeners
    this.setupEventListeners();
    
    logInfo('External API service initialized');
  }
  
  /**
   * Shutdown the service
   */
  public shutdown(): void {
    if (this.webhookProcessingInterval) {
      clearInterval(this.webhookProcessingInterval);
    }
    logInfo('External API service shut down');
  }
  
  /**
   * Load API keys and webhooks from database
   * This is a placeholder - in a real implementation, you'd load from MongoDB
   */
  private async loadFromDatabase(): Promise<void> {
    // In a real implementation, this would load from the database
    // For now, using empty arrays
    this.apiKeys = [];
    this.webhooks = [];
    
    // Rebuild event subscriptions from webhooks
    this.rebuildEventSubscriptions();
    
    logDebug(`Loaded ${this.apiKeys.length} API keys and ${this.webhooks.length} webhooks`);
  }
  
  /**
   * Rebuild the event subscription map based on registered webhooks
   */
  private rebuildEventSubscriptions(): void {
    // Clear existing subscriptions
    this.eventSubscriptions.clear();
    
    // Rebuild from webhooks
    for (const webhook of this.webhooks) {
      if (!webhook.isEnabled) continue;
      
      for (const event of webhook.events) {
        const eventType = event as ExternalEventType;
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
  private setupEventListeners(): void {
    // In a real implementation, we would integrate with the event system of our application
    // Since we can't directly subscribe to WebSocket events, we'll need a different approach
    
    // For demonstration purposes, we'll create a mock event system that other services
    // could call to trigger our webhook system. In a real implementation, services like
    // the download service would call these methods directly.
    
    // Mock example of how services would call our event handler:
    // externalApiService.notifyEvent(ExternalEventType.DOWNLOAD_STARTED, downloadData);
    
    logDebug('External API event handlers ready for notifications');
  }
  
  /**
   * Method for other services to call when events occur
   * This serves as the entry point for event notifications from other services
   */
  public notifyEvent(eventType: ExternalEventType, data: any): void {
    this.handleEvent(eventType, data);
  }
  
  /**
   * Handle an event and notify subscribed webhooks
   */
  private handleEvent(eventType: ExternalEventType, data: any): void {
    const subscribers = this.eventSubscriptions.get(eventType);
    if (!subscribers || subscribers.size === 0) {
      return; // No subscribers for this event
    }
    
    // Create the webhook payload
    const payload: WebhookPayload = {
      id: crypto.randomUUID(),
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
    
    logDebug(`Queued ${subscribers.size} webhook deliveries for event ${eventType}`);
  }
  
  /**
   * Queue a webhook delivery
   */
  private queueWebhookDelivery(webhook: Webhook, payload: WebhookPayload): void {
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
  private async processWebhookQueue(): Promise<void> {
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
      
    } catch (error) {
      logError(`Error processing webhook queue: ${error}`);
    } finally {
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
  private async deliverWebhook(item: { webhook: Webhook, payload: WebhookPayload, attempts: number }): Promise<void> {
    const { webhook, payload, attempts } = item;
    
    // Skip if maximum retries has been reached
    if (attempts >= webhook.retryConfig.maxRetries) {
      logError(`Webhook delivery to ${webhook.url} failed after ${attempts} attempts`);
      return;
    }
    
    try {
      // Generate HMAC signature for payload verification
      const signature = this.generateWebhookSignature(webhook.secretKey, payload);
      
      // In a real implementation, use fetch or axios
      // Simulated delivery here
      logInfo(`Delivering webhook to ${webhook.url} (attempt ${attempts + 1})`);
      
      // Simulate HTTP request (in reality, use fetch or axios)
      const success = Math.random() > 0.2; // 80% success rate for simulation
      
      if (success) {
        // Update last triggered timestamp
        const index = this.webhooks.findIndex(w => w.id === webhook.id);
        if (index !== -1) {
          this.webhooks[index].lastTriggered = new Date();
        }
        
        logDebug(`Webhook delivered to ${webhook.url}`);
      } else {
        // Retry with exponential backoff
        const delay = webhook.retryConfig.retryDelay * Math.pow(2, attempts);
        item.attempts += 1;
        
        // Re-queue with a delay
        setTimeout(() => {
          this.webhookQueue.push(item);
        }, delay);
        
        logError(`Webhook delivery to ${webhook.url} failed, retrying in ${delay}ms`);
      }
    } catch (error) {
      logError(`Error delivering webhook to ${webhook.url}: ${error}`);
      
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
  private generateWebhookSignature(secretKey: string, payload: any): string {
    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }
  
  /**
   * Create a new API key for a user
   */
  public async createApiKey(userId: string, name: string, permissions: string[] = []): Promise<ApiKeyDTO> {
    // Generate a new API key
    const id = crypto.randomUUID();
    const key = this.generateApiKey();
    const secret = this.generateApiSecret();
    
    const apiKey: ApiKey = {
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
  private generateApiKey(): string {
    return `yta_${crypto.randomBytes(16).toString('hex')}`;
  }
  
  /**
   * Generate a new API secret
   */
  private generateApiSecret(): string {
    return crypto.randomBytes(32).toString('base64');
  }
  
  /**
   * Map API key to DTO (removing sensitive information)
   */
  private mapApiKeyToDTO(apiKey: ApiKey, includeSecret = false): ApiKeyDTO & { secret?: string } {
    const dto: ApiKeyDTO & { secret?: string } = {
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
  public getApiKeys(userId: string): ApiKeyDTO[] {
    return this.apiKeys
      .filter(key => key.userId === userId)
      .map(key => this.mapApiKeyToDTO(key));
  }
  
  /**
   * Get an API key by ID
   */
  public getApiKeyById(id: string, userId: string): ApiKeyDTO | null {
    const apiKey = this.apiKeys.find(key => key.id === id && key.userId === userId);
    return apiKey ? this.mapApiKeyToDTO(apiKey) : null;
  }
  
  /**
   * Validate API key and secret
   */
  public validateApiKey(key: string, secret: string): ApiKey | null {
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
  public revokeApiKey(id: string, userId: string): boolean {
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
  public createWebhook(
    userId: string,
    apiKeyId: string,
    url: string,
    name: string,
    events: ExternalEventType[] = []
  ): WebhookDTO {
    // Validate API key
    const apiKey = this.apiKeys.find(key => key.id === apiKeyId && key.userId === userId && key.isEnabled);
    if (!apiKey) {
      throw new Error('Invalid API key');
    }
    
    // Create webhook
    const id = crypto.randomUUID();
    const secretKey = crypto.randomBytes(32).toString('base64');
    
    const webhook: Webhook = {
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
  private mapWebhookToDTO(webhook: Webhook): WebhookDTO {
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
  public getWebhooks(userId: string): WebhookDTO[] {
    return this.webhooks
      .filter(webhook => webhook.userId === userId)
      .map(webhook => this.mapWebhookToDTO(webhook));
  }
  
  /**
   * Get a webhook by ID
   */
  public getWebhookById(id: string, userId: string): WebhookDTO | null {
    const webhook = this.webhooks.find(w => w.id === id && w.userId === userId);
    return webhook ? this.mapWebhookToDTO(webhook) : null;
  }
  
  /**
   * Update a webhook
   */
  public updateWebhook(
    id: string,
    userId: string,
    updates: Partial<{
      url: string;
      name: string;
      events: ExternalEventType[];
      isEnabled: boolean;
    }>
  ): WebhookDTO | null {
    const index = this.webhooks.findIndex(webhook => webhook.id === id && webhook.userId === userId);
    
    if (index === -1) {
      return null;
    }
    
    // Update webhook
    const webhook = this.webhooks[index];
    
    if (updates.url !== undefined) webhook.url = updates.url;
    if (updates.name !== undefined) webhook.name = updates.name;
    if (updates.isEnabled !== undefined) webhook.isEnabled = updates.isEnabled;
    
    if (updates.events !== undefined) {
      // Remove old event subscriptions
      for (const event of webhook.events) {
        const eventType = event as ExternalEventType;
        this.eventSubscriptions.get(eventType)?.delete(id);
      }
      
      // Update events
      webhook.events = [...updates.events];
      
      // Add new event subscriptions
      for (const event of webhook.events) {
        const eventType = event as ExternalEventType;
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
  public deleteWebhook(id: string, userId: string): boolean {
    const index = this.webhooks.findIndex(webhook => webhook.id === id && webhook.userId === userId);
    
    if (index !== -1) {
      const webhook = this.webhooks[index];
      
      // Remove event subscriptions
      for (const event of webhook.events) {
        const eventType = event as ExternalEventType;
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
  public triggerTestEvent(eventType: ExternalEventType, data: any): void {
    this.handleEvent(eventType, data);
  }
  
  /**
   * Get available event types
   */
  public getAvailableEventTypes(): { id: string, description: string }[] {
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
  public checkApiHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy',
    details: Record<string, any>
  } {
    const webhookQueueSize = this.webhookQueue.length;
    const activeApiKeys = this.apiKeys.filter(key => key.isEnabled).length;
    const activeWebhooks = this.webhooks.filter(webhook => webhook.isEnabled).length;
    
    // Determine health status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    const issues: string[] = [];
    
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

// Create and export singleton instance
export const externalApiService = ExternalApiService.getInstance();