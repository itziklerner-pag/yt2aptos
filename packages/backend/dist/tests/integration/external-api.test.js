"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const external_api_service_1 = require("../../services/external-api.service");
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
// Mock axios for webhook delivery testing
jest.mock('axios');
const mockedAxios = axios_1.default;
describe('External API Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset the service state between tests
        external_api_service_1.externalApiService.apiKeys = [];
        external_api_service_1.externalApiService.webhooks = [];
        external_api_service_1.externalApiService.eventSubscriptions = new Map();
        external_api_service_1.externalApiService.webhookQueue = [];
    });
    describe('API Key Management', () => {
        const testUserId = 'user-123';
        it('should create an API key with proper format', async () => {
            const keyName = 'Test API Key';
            const permissions = ['read:videos', 'write:metadata'];
            const apiKey = await external_api_service_1.externalApiService.createApiKey(testUserId, keyName, permissions);
            expect(apiKey).toBeDefined();
            expect(apiKey.id).toBeDefined();
            expect(apiKey.key).toMatch(/^yta_[a-f0-9]{32}$/); // Check format: yta_<32 hex chars>
            expect(apiKey.name).toBe(keyName);
            expect(apiKey.permissions).toEqual(permissions);
            expect(apiKey.isEnabled).toBe(true);
            // The createApiKey method specially returns the secret for newly created keys
            expect(apiKey.secret).toBeDefined(); // Secret should be included in creation response
        });
        it('should retrieve API keys for a user', async () => {
            // Create a few keys
            await external_api_service_1.externalApiService.createApiKey(testUserId, 'Key 1', ['read:videos']);
            await external_api_service_1.externalApiService.createApiKey(testUserId, 'Key 2', ['write:metadata']);
            const keys = external_api_service_1.externalApiService.getApiKeys(testUserId);
            expect(keys).toHaveLength(2);
            expect(keys[0].name).toBe('Key 1');
            expect(keys[1].name).toBe('Key 2');
            // Regular DTO objects don't include secrets
            expect(keys[0].secret).toBeUndefined(); // Secret should not be returned in list view
            expect(keys[1].secret).toBeUndefined();
        });
        it('should validate API key and secret', async () => {
            const apiKey = await external_api_service_1.externalApiService.createApiKey(testUserId, 'Validation Test', ['read:videos']);
            // Store key and secret for validation
            const keyString = apiKey.key;
            const secretString = apiKey.secret;
            // Validate with correct credentials
            const validatedKey = external_api_service_1.externalApiService.validateApiKey(keyString, secretString);
            expect(validatedKey).toBeDefined();
            expect(validatedKey?.id).toBe(apiKey.id);
            // Validate with incorrect secret
            const invalidValidation = external_api_service_1.externalApiService.validateApiKey(keyString, 'wrong-secret');
            expect(invalidValidation).toBeNull();
        });
        it('should revoke an API key', async () => {
            // Create a key
            const apiKey = await external_api_service_1.externalApiService.createApiKey(testUserId, 'Revoke Test', ['read:videos']);
            // Revoke it
            const revoked = external_api_service_1.externalApiService.revokeApiKey(apiKey.id, testUserId);
            expect(revoked).toBe(true);
            // Key should no longer be usable
            const keys = external_api_service_1.externalApiService.getApiKeys(testUserId);
            expect(keys.find(k => k.id === apiKey.id)?.isEnabled).toBe(false);
            // Validate should fail
            const validatedKey = external_api_service_1.externalApiService.validateApiKey(apiKey.key, apiKey.secret);
            expect(validatedKey).toBeNull();
        });
    });
    describe('Webhook Registration and Delivery', () => {
        const testUserId = 'user-456';
        let testApiKeyId;
        beforeEach(async () => {
            // Create an API key to use for webhook registration
            const apiKey = await external_api_service_1.externalApiService.createApiKey(testUserId, 'Webhook Test Key', ['read:videos']);
            testApiKeyId = apiKey.id;
        });
        it('should register a webhook', async () => {
            const webhookUrl = 'https://example.com/webhook';
            const webhookName = 'Test Webhook';
            const events = [external_api_service_1.ExternalEventType.DOWNLOAD_COMPLETED, external_api_service_1.ExternalEventType.SYSTEM_ALERT];
            const webhook = external_api_service_1.externalApiService.createWebhook(testUserId, testApiKeyId, webhookUrl, webhookName, events);
            expect(webhook).toBeDefined();
            expect(webhook.id).toBeDefined();
            expect(webhook.url).toBe(webhookUrl);
            expect(webhook.name).toBe(webhookName);
            expect(webhook.events).toEqual(events);
            expect(webhook.isEnabled).toBe(true);
        });
        it('should retrieve webhooks for a user', async () => {
            // Create a couple webhooks
            external_api_service_1.externalApiService.createWebhook(testUserId, testApiKeyId, 'https://example.com/hook1', 'Hook 1', [external_api_service_1.ExternalEventType.DOWNLOAD_COMPLETED]);
            external_api_service_1.externalApiService.createWebhook(testUserId, testApiKeyId, 'https://example.com/hook2', 'Hook 2', [external_api_service_1.ExternalEventType.SYSTEM_ALERT]);
            const webhooks = external_api_service_1.externalApiService.getWebhooks(testUserId);
            expect(webhooks).toHaveLength(2);
            expect(webhooks[0].name).toBe('Hook 1');
            expect(webhooks[1].name).toBe('Hook 2');
        });
        it('should update a webhook', async () => {
            // Create a webhook
            const webhook = external_api_service_1.externalApiService.createWebhook(testUserId, testApiKeyId, 'https://example.com/original', 'Original Name', [external_api_service_1.ExternalEventType.DOWNLOAD_COMPLETED]);
            // Update it
            const updates = {
                url: 'https://example.com/updated',
                name: 'Updated Name',
                events: [external_api_service_1.ExternalEventType.DOWNLOAD_COMPLETED, external_api_service_1.ExternalEventType.DOWNLOAD_FAILED],
                isEnabled: false
            };
            const updatedWebhook = external_api_service_1.externalApiService.updateWebhook(webhook.id, testUserId, updates);
            expect(updatedWebhook).toBeDefined();
            expect(updatedWebhook?.url).toBe(updates.url);
            expect(updatedWebhook?.name).toBe(updates.name);
            expect(updatedWebhook?.events).toEqual(updates.events);
            expect(updatedWebhook?.isEnabled).toBe(updates.isEnabled);
        });
        it('should deliver webhooks when events are triggered', async () => {
            // Setup mock for axios.post
            mockedAxios.post.mockResolvedValue({ status: 200, data: 'success' });
            // Create a webhook
            const webhook = external_api_service_1.externalApiService.createWebhook(testUserId, testApiKeyId, 'https://example.com/webhook', 'Delivery Test', [external_api_service_1.ExternalEventType.DOWNLOAD_COMPLETED]);
            // Trigger an event
            const testData = { downloadId: 'dl-123', fileSize: 1024, duration: 120 };
            external_api_service_1.externalApiService.notifyEvent(external_api_service_1.ExternalEventType.DOWNLOAD_COMPLETED, testData);
            // Wait for async webhook processing
            await new Promise(resolve => setTimeout(resolve, 100));
            // Verify webhook delivery was attempted
            expect(mockedAxios.post).toHaveBeenCalled();
            expect(mockedAxios.post.mock.calls[0][0]).toBe('https://example.com/webhook');
            expect(mockedAxios.post.mock.calls[0][1]).toMatchObject({
                event: external_api_service_1.ExternalEventType.DOWNLOAD_COMPLETED,
                data: testData
            });
            // Verify headers contain signature
            expect(mockedAxios.post.mock.calls[0][2]?.headers?.['X-Webhook-Signature']).toBeDefined();
        });
        it('should retry failed webhook deliveries', async () => {
            // Setup mock for axios.post to fail the first time, succeed the second
            mockedAxios.post
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce({ status: 200, data: 'success' });
            // Create a webhook with minimal retry config for testing
            const webhook = external_api_service_1.externalApiService.createWebhook(testUserId, testApiKeyId, 'https://example.com/webhook', 'Retry Test', [external_api_service_1.ExternalEventType.DOWNLOAD_FAILED]);
            // Set retry config to be very quick for testing
            external_api_service_1.externalApiService.webhooks[0].retryConfig = {
                maxRetries: 3,
                retryDelay: 10 // 10ms delay for testing
            };
            // Trigger an event
            external_api_service_1.externalApiService.notifyEvent(external_api_service_1.ExternalEventType.DOWNLOAD_FAILED, { error: 'Test error' });
            // Wait for initial delivery + retry
            await new Promise(resolve => setTimeout(resolve, 100));
            // Verify it was called twice - once for initial attempt, once for retry
            expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        });
    });
    describe('Third-party API Access', () => {
        let mockServer;
        let receivedRequests = [];
        const TEST_PORT = 5002;
        const API_URL = `http://localhost:${TEST_PORT}`;
        beforeAll((done) => {
            // Setup a mock third-party API server
            const app = (0, express_1.default)();
            app.use(body_parser_1.default.json());
            app.get('/api/v1/resource', (req, res) => {
                receivedRequests.push({
                    method: 'GET',
                    path: '/api/v1/resource',
                    headers: req.headers,
                    query: req.query
                });
                // Check for API key
                const apiKey = req.headers['x-api-key'];
                if (apiKey !== 'valid-key') {
                    return res.status(401).json({ error: 'Invalid API key' });
                }
                res.json({ success: true, data: [{ id: 1, name: 'Resource 1' }] });
            });
            app.post('/api/v1/resource', (req, res) => {
                receivedRequests.push({
                    method: 'POST',
                    path: '/api/v1/resource',
                    headers: req.headers,
                    body: req.body
                });
                // Check for API key
                const apiKey = req.headers['x-api-key'];
                if (apiKey !== 'valid-key') {
                    return res.status(401).json({ error: 'Invalid API key' });
                }
                res.status(201).json({ success: true, id: crypto_1.default.randomUUID() });
            });
            // API versioning endpoints
            app.get('/api/v2/resource', (req, res) => {
                receivedRequests.push({
                    method: 'GET',
                    path: '/api/v2/resource',
                    headers: req.headers,
                    query: req.query
                });
                res.json({
                    success: true,
                    data: [{ id: 1, name: 'Resource 1', extra: 'V2 Field' }],
                    meta: { version: 'v2' }
                });
            });
            mockServer = app.listen(TEST_PORT, () => {
                done();
            });
        });
        afterAll((done) => {
            mockServer.close(() => {
                done();
            });
        });
        beforeEach(() => {
            receivedRequests = [];
        });
        it('should access third-party API with proper credentials', async () => {
            // This test simulates how our external API service would help manage
            // access to third-party APIs
            // Create an API key (normally this would be stored and managed by our service)
            const userId = 'user-789';
            const apiKey = await external_api_service_1.externalApiService.createApiKey(userId, 'Third-party Access', ['external:read']);
            // Simulate an authenticated request to our service
            const isValid = external_api_service_1.externalApiService.validateApiKey(apiKey.key, apiKey.secret);
            expect(isValid).not.toBeNull();
            // Our service would then proxy or facilitate the third-party API call
            // Here we simulate the service making a request to the third-party API
            const response = await axios_1.default.get(`${API_URL}/api/v1/resource`, {
                headers: {
                    'X-API-Key': 'valid-key' // This would be managed by our service
                }
            });
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(receivedRequests.length).toBe(1);
            expect(receivedRequests[0].headers['x-api-key']).toBe('valid-key');
        });
        it('should support API versioning for third-party access', async () => {
            // Test with V1 endpoint
            const v1Response = await axios_1.default.get(`${API_URL}/api/v1/resource`, {
                headers: { 'X-API-Key': 'valid-key' }
            });
            expect(v1Response.data.data[0]).not.toHaveProperty('extra');
            expect(v1Response.data).not.toHaveProperty('meta');
            // Test with V2 endpoint
            const v2Response = await axios_1.default.get(`${API_URL}/api/v2/resource`, {
                headers: { 'X-API-Key': 'valid-key' }
            });
            expect(v2Response.data.data[0]).toHaveProperty('extra', 'V2 Field');
            expect(v2Response.data.meta.version).toBe('v2');
            // Verify both requests were properly logged
            expect(receivedRequests.length).toBe(2);
            expect(receivedRequests[0].path).toBe('/api/v1/resource');
            expect(receivedRequests[1].path).toBe('/api/v2/resource');
        });
        it('should handle third-party API errors gracefully', async () => {
            try {
                // Make a request with invalid API key
                await axios_1.default.get(`${API_URL}/api/v1/resource`, {
                    headers: { 'X-API-Key': 'invalid-key' }
                });
                // This should fail
                fail('Request should have thrown an error');
            }
            catch (error) {
                expect(error.response.status).toBe(401);
                expect(error.response.data.error).toBe('Invalid API key');
            }
            // Verify request was received, despite the error
            expect(receivedRequests.length).toBe(1);
            expect(receivedRequests[0].headers['x-api-key']).toBe('invalid-key');
        });
    });
    describe('Event Notification System', () => {
        it('should properly handle event subscriptions', async () => {
            // Create API key and webhook
            const userId = 'user-test';
            const apiKey = await external_api_service_1.externalApiService.createApiKey(userId, 'Event Test', ['read:events']);
            const webhook = external_api_service_1.externalApiService.createWebhook(userId, apiKey.id, 'https://example.com/events', 'Event Webhook', [
                external_api_service_1.ExternalEventType.DOWNLOAD_STARTED,
                external_api_service_1.ExternalEventType.DOWNLOAD_COMPLETED
            ]);
            // Check subscriptions were created
            const subscriptions = external_api_service_1.externalApiService.eventSubscriptions;
            expect(subscriptions.has(external_api_service_1.ExternalEventType.DOWNLOAD_STARTED)).toBe(true);
            expect(subscriptions.has(external_api_service_1.ExternalEventType.DOWNLOAD_COMPLETED)).toBe(true);
            expect(subscriptions.get(external_api_service_1.ExternalEventType.DOWNLOAD_STARTED).has(webhook.id)).toBe(true);
            // Update webhook to change subscriptions
            external_api_service_1.externalApiService.updateWebhook(webhook.id, userId, {
                events: [external_api_service_1.ExternalEventType.SYSTEM_ALERT]
            });
            // Check subscriptions were updated
            expect(subscriptions.has(external_api_service_1.ExternalEventType.DOWNLOAD_STARTED)).toBe(false);
            expect(subscriptions.has(external_api_service_1.ExternalEventType.SYSTEM_ALERT)).toBe(true);
            expect(subscriptions.get(external_api_service_1.ExternalEventType.SYSTEM_ALERT).has(webhook.id)).toBe(true);
        });
        it('should trigger the notification process when events occur', async () => {
            // Mock the webhook delivery
            mockedAxios.post.mockResolvedValue({ status: 200 });
            // Create webhook
            const userId = 'user-trigger';
            const apiKey = await external_api_service_1.externalApiService.createApiKey(userId, 'Trigger Test', ['read:events']);
            const webhook = external_api_service_1.externalApiService.createWebhook(userId, apiKey.id, 'https://example.com/trigger', 'Trigger Webhook', [external_api_service_1.ExternalEventType.DOWNLOAD_PROGRESS]);
            // Spy on private methods
            const handleEventSpy = jest.spyOn(external_api_service_1.externalApiService, 'handleEvent');
            const queueWebhookDeliverySpy = jest.spyOn(external_api_service_1.externalApiService, 'queueWebhookDelivery');
            // Trigger event
            const eventData = { downloadId: 'dl-456', progress: 50 };
            external_api_service_1.externalApiService.notifyEvent(external_api_service_1.ExternalEventType.DOWNLOAD_PROGRESS, eventData);
            // Check methods were called
            expect(handleEventSpy).toHaveBeenCalledWith(external_api_service_1.ExternalEventType.DOWNLOAD_PROGRESS, eventData);
            // Wait for async processing
            await new Promise(resolve => setTimeout(resolve, 50));
            // Verify webhook delivery was queued
            expect(queueWebhookDeliverySpy).toHaveBeenCalled();
            expect(queueWebhookDeliverySpy.mock.calls[0][0]).toMatchObject({
                id: webhook.id,
                url: webhook.url
            });
            // Clean up spies
            handleEventSpy.mockRestore();
            queueWebhookDeliverySpy.mockRestore();
        });
    });
});
//# sourceMappingURL=external-api.test.js.map