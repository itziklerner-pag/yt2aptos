"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.externalApiController = exports.ExternalApiController = void 0;
const external_api_service_1 = require("../services/external-api.service");
const logger_1 = require("../utils/logger");
const monitoring_service_1 = require("../services/monitoring.service");
/**
 * Controller for external API integration endpoints
 */
class ExternalApiController {
    /**
     * Get API keys for the authenticated user
     */
    getApiKeys = async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            const apiKeys = external_api_service_1.externalApiService.getApiKeys(req.user.userId);
            res.status(200).json({
                success: true,
                data: apiKeys
            });
        }
        catch (error) {
            (0, logger_1.logError)(`Error fetching API keys: ${error}`);
            next(error);
        }
    };
    /**
     * Create a new API key for the authenticated user
     */
    createApiKey = async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            const { name, permissions } = req.body;
            if (!name) {
                res.status(400).json({
                    success: false,
                    message: 'API key name is required'
                });
                return;
            }
            const apiKey = await external_api_service_1.externalApiService.createApiKey(req.user.userId, name, permissions || []);
            res.status(201).json({
                success: true,
                data: apiKey,
                message: 'API key created successfully. Please save your secret as it will not be shown again.'
            });
            (0, logger_1.logInfo)(`API key created for user ${req.user.userId}: ${name}`);
        }
        catch (error) {
            (0, logger_1.logError)(`Error creating API key: ${error}`);
            next(error);
        }
    };
    /**
     * Revoke an API key
     */
    revokeApiKey = async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            const { id } = req.params;
            const revoked = external_api_service_1.externalApiService.revokeApiKey(id, req.user.userId);
            if (revoked) {
                res.status(200).json({
                    success: true,
                    message: 'API key revoked successfully'
                });
                (0, logger_1.logInfo)(`API key ${id} revoked by user ${req.user.userId}`);
            }
            else {
                res.status(404).json({
                    success: false,
                    message: 'API key not found or already revoked'
                });
            }
        }
        catch (error) {
            (0, logger_1.logError)(`Error revoking API key: ${error}`);
            next(error);
        }
    };
    /**
     * Get webhooks for the authenticated user
     */
    getWebhooks = async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            const webhooks = external_api_service_1.externalApiService.getWebhooks(req.user.userId);
            res.status(200).json({
                success: true,
                data: webhooks
            });
        }
        catch (error) {
            (0, logger_1.logError)(`Error fetching webhooks: ${error}`);
            next(error);
        }
    };
    /**
     * Register a new webhook
     */
    registerWebhook = async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            const { apiKeyId, url, name, events } = req.body;
            if (!apiKeyId || !url || !name || !events) {
                res.status(400).json({
                    success: false,
                    message: 'API key ID, URL, name, and events are required'
                });
                return;
            }
            // Validate URL format
            try {
                new URL(url);
            }
            catch (error) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid URL format'
                });
                return;
            }
            // Validate events
            const validEventTypes = Object.values(external_api_service_1.ExternalEventType);
            for (const event of events) {
                if (!validEventTypes.includes(event)) {
                    res.status(400).json({
                        success: false,
                        message: `Invalid event type: ${event}`
                    });
                    return;
                }
            }
            try {
                const webhook = external_api_service_1.externalApiService.createWebhook(req.user.userId, apiKeyId, url, name, events);
                res.status(201).json({
                    success: true,
                    data: webhook
                });
                (0, logger_1.logInfo)(`Webhook registered for user ${req.user.userId}: ${name} at ${url}`);
            }
            catch (error) {
                if (error.message === 'Invalid API key') {
                    res.status(404).json({
                        success: false,
                        message: 'API key not found or inactive'
                    });
                    return;
                }
                throw error;
            }
        }
        catch (error) {
            (0, logger_1.logError)(`Error registering webhook: ${error}`);
            next(error);
        }
    };
    /**
     * Update a webhook
     */
    updateWebhook = async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            const { id } = req.params;
            const { url, name, events, isEnabled } = req.body;
            const updates = {};
            if (url !== undefined) {
                try {
                    new URL(url);
                    updates.url = url;
                }
                catch (error) {
                    res.status(400).json({
                        success: false,
                        message: 'Invalid URL format'
                    });
                    return;
                }
            }
            if (name !== undefined)
                updates.name = name;
            if (isEnabled !== undefined)
                updates.isEnabled = isEnabled;
            if (events !== undefined) {
                // Validate events
                const validEventTypes = Object.values(external_api_service_1.ExternalEventType);
                for (const event of events) {
                    if (!validEventTypes.includes(event)) {
                        res.status(400).json({
                            success: false,
                            message: `Invalid event type: ${event}`
                        });
                        return;
                    }
                }
                updates.events = events;
            }
            const webhook = external_api_service_1.externalApiService.updateWebhook(id, req.user.userId, updates);
            if (webhook) {
                res.status(200).json({
                    success: true,
                    data: webhook
                });
                (0, logger_1.logInfo)(`Webhook ${id} updated by user ${req.user.userId}`);
            }
            else {
                res.status(404).json({
                    success: false,
                    message: 'Webhook not found'
                });
            }
        }
        catch (error) {
            (0, logger_1.logError)(`Error updating webhook: ${error}`);
            next(error);
        }
    };
    /**
     * Delete a webhook
     */
    deleteWebhook = async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            const { id } = req.params;
            const deleted = external_api_service_1.externalApiService.deleteWebhook(id, req.user.userId);
            if (deleted) {
                res.status(200).json({
                    success: true,
                    message: 'Webhook deleted successfully'
                });
                (0, logger_1.logInfo)(`Webhook ${id} deleted by user ${req.user.userId}`);
            }
            else {
                res.status(404).json({
                    success: false,
                    message: 'Webhook not found'
                });
            }
        }
        catch (error) {
            (0, logger_1.logError)(`Error deleting webhook: ${error}`);
            next(error);
        }
    };
    /**
     * Get available event types for webhooks
     */
    getEventTypes = async (req, res, next) => {
        try {
            const eventTypes = external_api_service_1.externalApiService.getAvailableEventTypes();
            res.status(200).json({
                success: true,
                data: eventTypes
            });
        }
        catch (error) {
            (0, logger_1.logError)(`Error fetching event types: ${error}`);
            next(error);
        }
    };
    /**
     * Get system status for external API health check
     */
    getSystemStatus = async (req, res, next) => {
        try {
            // Check system health
            const systemHealth = await monitoring_service_1.monitoringService.checkSystemHealth();
            // Check API health
            const apiHealth = external_api_service_1.externalApiService.checkApiHealth();
            // Combine health checks
            const status = systemHealth.status === 'unhealthy' || apiHealth.status === 'unhealthy'
                ? 'unhealthy'
                : systemHealth.status === 'degraded' || apiHealth.status === 'degraded'
                    ? 'degraded'
                    : 'healthy';
            // Set appropriate HTTP status code
            let statusCode = 200;
            if (status === 'degraded') {
                statusCode = 200; // Still operational but with issues
            }
            else if (status === 'unhealthy') {
                statusCode = 503; // Service unavailable
            }
            res.status(statusCode).json({
                success: status !== 'unhealthy',
                status,
                version: '1.0.0', // Should be pulled from package.json in production
                timestamp: new Date(),
                details: {
                    system: {
                        status: systemHealth.status,
                        ...systemHealth.details
                    },
                    api: {
                        status: apiHealth.status,
                        ...apiHealth.details
                    }
                }
            });
        }
        catch (error) {
            (0, logger_1.logError)(`Error checking system status: ${error}`);
            next(error);
        }
    };
    /**
     * Trigger a test event (for developers to test webhook integration)
     */
    triggerTestEvent = async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            const { eventType, data } = req.body;
            if (!eventType || !data) {
                res.status(400).json({
                    success: false,
                    message: 'Event type and data are required'
                });
                return;
            }
            // Validate event type
            const validEventTypes = Object.values(external_api_service_1.ExternalEventType);
            if (!validEventTypes.includes(eventType)) {
                res.status(400).json({
                    success: false,
                    message: `Invalid event type: ${eventType}`
                });
                return;
            }
            // Trigger test event
            external_api_service_1.externalApiService.triggerTestEvent(eventType, {
                ...data,
                isTest: true,
                triggeredBy: req.user.userId
            });
            res.status(200).json({
                success: true,
                message: `Test event ${eventType} triggered successfully`
            });
            (0, logger_1.logInfo)(`Test event ${eventType} triggered by user ${req.user.userId}`);
        }
        catch (error) {
            (0, logger_1.logError)(`Error triggering test event: ${error}`);
            next(error);
        }
    };
    /**
     * API endpoint for external services to verify API key (used by third-party integrations)
     */
    verifyApiKey = async (req, res, next) => {
        try {
            const { key } = req.query;
            const secret = req.headers['x-api-secret'];
            if (!key || !secret) {
                res.status(401).json({
                    success: false,
                    message: 'API key and secret are required'
                });
                return;
            }
            const apiKey = external_api_service_1.externalApiService.validateApiKey(key, secret);
            if (apiKey) {
                res.status(200).json({
                    success: true,
                    message: 'API key is valid',
                    permissions: apiKey.permissions
                });
            }
            else {
                res.status(401).json({
                    success: false,
                    message: 'Invalid API key or secret'
                });
            }
        }
        catch (error) {
            (0, logger_1.logError)(`Error verifying API key: ${error}`);
            next(error);
        }
    };
}
exports.ExternalApiController = ExternalApiController;
// Create and export controller instance
exports.externalApiController = new ExternalApiController();
//# sourceMappingURL=external-api.controller.js.map