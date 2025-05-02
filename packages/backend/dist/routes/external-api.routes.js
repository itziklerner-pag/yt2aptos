"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const external_api_controller_1 = require("../controllers/external-api.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
/**
 * @swagger
 * tags:
 *   name: API Keys
 *   description: API key management endpoints for external integration
 */
/**
 * @swagger
 * tags:
 *   name: Webhooks
 *   description: Webhook registration and management for event notifications
 */
/**
 * @swagger
 * tags:
 *   name: System
 *   description: System status and health check endpoints
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     ApiKey:
 *       type: object
 *       required:
 *         - id
 *         - key
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           description: Unique API key ID
 *         key:
 *           type: string
 *           description: API key string
 *         name:
 *           type: string
 *           description: Human-readable name for the API key
 *         permissions:
 *           type: array
 *           items:
 *             type: string
 *           description: List of permissions for this API key
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the API key was created
 *         lastUsed:
 *           type: string
 *           format: date-time
 *           description: When the API key was last used
 *         isEnabled:
 *           type: boolean
 *           description: Whether the API key is active
 *     Webhook:
 *       type: object
 *       required:
 *         - id
 *         - url
 *         - name
 *         - events
 *       properties:
 *         id:
 *           type: string
 *           description: Unique webhook ID
 *         url:
 *           type: string
 *           description: URL to deliver webhook payloads to
 *         name:
 *           type: string
 *           description: Human-readable name for the webhook
 *         events:
 *           type: array
 *           items:
 *             type: string
 *             enum: [download.started, download.progress, download.completed, download.failed, channel.updated, playlist.updated, storage.exceeded, system.alert]
 *           description: Events to trigger this webhook
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the webhook was created
 *         lastTriggered:
 *           type: string
 *           format: date-time
 *           description: When the webhook was last triggered
 *         isEnabled:
 *           type: boolean
 *           description: Whether the webhook is active
 */
const router = express_1.default.Router();
/**
 * API Key Management Routes
 */
/**
 * @swagger
 * /v1/external/keys:
 *   get:
 *     summary: Get all API keys for the authenticated user
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of API keys
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ApiKey'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/keys', auth_middleware_1.authMiddleware.authenticate, external_api_controller_1.externalApiController.getApiKeys);
/**
 * @swagger
 * /v1/external/keys:
 *   post:
 *     summary: Create a new API key
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Human-readable name for the API key
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Permissions to assign to the API key
 *     responses:
 *       201:
 *         description: API key created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ApiKey'
 *                 message:
 *                   type: string
 *                   example: API key created successfully. Please save your secret as it will not be shown again.
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/keys', auth_middleware_1.authMiddleware.authenticate, external_api_controller_1.externalApiController.createApiKey);
/**
 * @swagger
 * /v1/external/keys/{id}:
 *   delete:
 *     summary: Revoke an API key
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: API key ID to revoke
 *     responses:
 *       200:
 *         description: API key revoked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: API key revoked successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/keys/:id', auth_middleware_1.authMiddleware.authenticate, external_api_controller_1.externalApiController.revokeApiKey);
/**
 * Webhook Registration Routes
 */
/**
 * @swagger
 * /v1/external/hook:
 *   get:
 *     summary: Get all webhooks for the authenticated user
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of webhooks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Webhook'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/hook', auth_middleware_1.authMiddleware.authenticate, external_api_controller_1.externalApiController.getWebhooks);
/**
 * @swagger
 * /v1/external/hook:
 *   post:
 *     summary: Register a new webhook
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - apiKeyId
 *               - url
 *               - name
 *               - events
 *             properties:
 *               apiKeyId:
 *                 type: string
 *                 description: ID of the API key to associate with this webhook
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: URL to deliver webhook payloads to
 *               name:
 *                 type: string
 *                 description: Human-readable name for the webhook
 *               events:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [download.started, download.progress, download.completed, download.failed, channel.updated, playlist.updated, storage.exceeded, system.alert]
 *                 description: Events to trigger this webhook
 *     responses:
 *       201:
 *         description: Webhook registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Webhook'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: API key not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/hook', auth_middleware_1.authMiddleware.authenticate, external_api_controller_1.externalApiController.registerWebhook);
/**
 * @swagger
 * /v1/external/hook/{id}:
 *   put:
 *     summary: Update a webhook
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Webhook ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: URL to deliver webhook payloads to
 *               name:
 *                 type: string
 *                 description: Human-readable name for the webhook
 *               events:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [download.started, download.progress, download.completed, download.failed, channel.updated, playlist.updated, storage.exceeded, system.alert]
 *                 description: Events to trigger this webhook
 *               isEnabled:
 *                 type: boolean
 *                 description: Whether the webhook is active
 *     responses:
 *       200:
 *         description: Webhook updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Webhook'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/hook/:id', auth_middleware_1.authMiddleware.authenticate, external_api_controller_1.externalApiController.updateWebhook);
/**
 * @swagger
 * /v1/external/hook/{id}:
 *   delete:
 *     summary: Delete a webhook
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Webhook ID to delete
 *     responses:
 *       200:
 *         description: Webhook deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Webhook deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/hook/:id', auth_middleware_1.authMiddleware.authenticate, external_api_controller_1.externalApiController.deleteWebhook);
/**
 * @swagger
 * /v1/external/events:
 *   get:
 *     summary: Get available event types for webhooks
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available event types
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: download.started
 *                       description:
 *                         type: string
 *                         example: Fired when a download job is started
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/events', auth_middleware_1.authMiddleware.authenticate, external_api_controller_1.externalApiController.getEventTypes);
/**
 * System Status and Testing Routes
 */
/**
 * @swagger
 * /v1/external/status:
 *   get:
 *     summary: Get system status and health information
 *     tags: [System]
 *     description: Public endpoint that provides health status of the API and underlying systems
 *     responses:
 *       200:
 *         description: System status information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: string
 *                   enum: [healthy, degraded, unhealthy]
 *                 version:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 details:
 *                   type: object
 *                   properties:
 *                     system:
 *                       type: object
 *                     api:
 *                       type: object
 *       503:
 *         description: System is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 status:
 *                   type: string
 *                   example: unhealthy
 *                 details:
 *                   type: object
 */
router.get('/status', external_api_controller_1.externalApiController.getSystemStatus);
/**
 * @swagger
 * /v1/external/trigger:
 *   post:
 *     summary: Trigger a test event to test webhook delivery
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventType
 *               - data
 *             properties:
 *               eventType:
 *                 type: string
 *                 enum: [download.started, download.progress, download.completed, download.failed, channel.updated, playlist.updated, storage.exceeded, system.alert]
 *                 description: Type of event to trigger
 *               data:
 *                 type: object
 *                 description: Event payload data
 *     responses:
 *       200:
 *         description: Test event triggered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Test event download.started triggered successfully
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/trigger', auth_middleware_1.authMiddleware.authenticate, external_api_controller_1.externalApiController.triggerTestEvent);
/**
 * API Key Verification (for third-party integrations)
 */
/**
 * @swagger
 * /v1/external/verify:
 *   get:
 *     summary: Verify API key and secret
 *     tags: [API Keys]
 *     description: Endpoint for third-party applications to verify API key validity
 *     security:
 *       - apiKeyAuth: []
 *       - apiSecretAuth: []
 *     parameters:
 *       - in: query
 *         name: key
 *         schema:
 *           type: string
 *         required: true
 *         description: API key to verify
 *     responses:
 *       200:
 *         description: API key is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: API key is valid
 *                 permissions:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Invalid API key or secret
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/verify', external_api_controller_1.externalApiController.verifyApiKey);
exports.default = router;
//# sourceMappingURL=external-api.routes.js.map