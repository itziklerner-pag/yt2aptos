import { externalApiService, ExternalEventType } from '../external-api.service';

describe('ExternalApiService', () => {
  beforeEach(() => {
    // Reset service state between tests
    jest.clearAllMocks();
  });

  describe('API Key Management', () => {
    test('should create a new API key', async () => {
      const userId = 'test-user-id';
      const keyName = 'Test API Key';
      
      const apiKey = await externalApiService.createApiKey(userId, keyName);
      
      expect(apiKey).toBeDefined();
      expect(apiKey.name).toBe(keyName);
      // userId should not be exposed in DTO
      expect('userId' in apiKey).toBe(false);
      expect(apiKey.key).toMatch(/^yta_/);
      // Secret should be included only for newly created keys
      expect('secret' in apiKey).toBe(true);
      expect((apiKey as any).secret).toBeDefined();
      expect(apiKey.isEnabled).toBe(true);
    });
    
    test('should get API keys for a user', () => {
      const userId = 'test-user-id';
      
      // Create test keys
      externalApiService.createApiKey(userId, 'Key 1');
      externalApiService.createApiKey(userId, 'Key 2');
      
      const apiKeys = externalApiService.getApiKeys(userId);
      
      expect(apiKeys.length).toBeGreaterThanOrEqual(2);
      // Secret should not be exposed in GET
      expect('secret' in apiKeys[0]).toBe(false);
    });
    
    test('should revoke an API key', async () => {
      const userId = 'test-user-id';
      const keyName = 'Key To Revoke';
      
      const apiKey = await externalApiService.createApiKey(userId, keyName);
      const revoked = externalApiService.revokeApiKey(apiKey.id, userId);
      
      expect(revoked).toBe(true);
      
      // Key should no longer be in active keys
      const keys = externalApiService.getApiKeys(userId);
      const revokedKey = keys.find(k => k.id === apiKey.id);
      
      expect(revokedKey?.isEnabled).toBe(false);
    });
    
    test('should validate API key and secret', async () => {
      const userId = 'test-user-id';
      const keyName = 'Validation Test Key';
      
      const apiKey = await externalApiService.createApiKey(userId, keyName);
      const key = apiKey.key;
      const secret = (apiKey as any).secret;
      
      const validatedKey = externalApiService.validateApiKey(key, secret);
      
      expect(validatedKey).toBeDefined();
      expect(validatedKey?.key).toBe(key);
      
      // Should fail with wrong secret
      const invalidValidation = externalApiService.validateApiKey(key, 'wrong-secret');
      expect(invalidValidation).toBeNull();
    });
  });
  
  describe('Webhook Management', () => {
    let userId: string;
    let apiKeyId: string;
    
    beforeEach(async () => {
      userId = 'test-webhook-user';
      const apiKey = await externalApiService.createApiKey(userId, 'Webhook Test Key');
      apiKeyId = apiKey.id;
    });
    
    test('should create a webhook', () => {
      const webhook = externalApiService.createWebhook(
        userId,
        apiKeyId,
        'https://example.com/webhook',
        'Test Webhook',
        [ExternalEventType.DOWNLOAD_COMPLETED]
      );
      
      expect(webhook).toBeDefined();
      expect(webhook.url).toBe('https://example.com/webhook');
      expect(webhook.events).toContain(ExternalEventType.DOWNLOAD_COMPLETED);
    });
    
    test('should get webhooks for a user', () => {
      externalApiService.createWebhook(
        userId,
        apiKeyId,
        'https://example.com/webhook1',
        'Test Webhook 1',
        [ExternalEventType.DOWNLOAD_COMPLETED]
      );
      
      externalApiService.createWebhook(
        userId,
        apiKeyId,
        'https://example.com/webhook2',
        'Test Webhook 2',
        [ExternalEventType.SYSTEM_ALERT]
      );
      
      const webhooks = externalApiService.getWebhooks(userId);
      
      expect(webhooks.length).toBeGreaterThanOrEqual(2);
    });
    
    test('should update a webhook', () => {
      const webhook = externalApiService.createWebhook(
        userId,
        apiKeyId,
        'https://example.com/webhook',
        'Test Webhook',
        [ExternalEventType.DOWNLOAD_COMPLETED]
      );
      
      const updatedWebhook = externalApiService.updateWebhook(
        webhook.id,
        userId,
        {
          name: 'Updated Webhook',
          events: [ExternalEventType.DOWNLOAD_COMPLETED, ExternalEventType.DOWNLOAD_FAILED]
        }
      );
      
      expect(updatedWebhook).toBeDefined();
      expect(updatedWebhook!.name).toBe('Updated Webhook');
      expect(updatedWebhook!.events.length).toBe(2);
    });
    
    test('should delete a webhook', () => {
      const webhook = externalApiService.createWebhook(
        userId,
        apiKeyId,
        'https://example.com/webhook',
        'Test Webhook',
        [ExternalEventType.DOWNLOAD_COMPLETED]
      );
      
      const deleted = externalApiService.deleteWebhook(webhook.id, userId);
      
      expect(deleted).toBe(true);
      
      // Webhook should no longer be available
      const webhooks = externalApiService.getWebhooks(userId);
      const deletedWebhook = webhooks.find(w => w.id === webhook.id);
      
      expect(deletedWebhook).toBeUndefined();
    });
  });
  
  describe('Event Management', () => {
    test('should provide available event types', () => {
      const eventTypes = externalApiService.getAvailableEventTypes();
      
      expect(eventTypes.length).toBeGreaterThan(0);
      expect(eventTypes[0]).toHaveProperty('id');
      expect(eventTypes[0]).toHaveProperty('description');
    });
    
    test('should check API health', () => {
      const health = externalApiService.checkApiHealth();
      
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('details');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
    });
  });
});