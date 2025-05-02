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
declare const router: import("express-serve-static-core").Router;
export default router;
