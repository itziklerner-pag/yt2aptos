import { Request, Response, NextFunction } from 'express';
/**
 * Controller for external API integration endpoints
 */
export declare class ExternalApiController {
    /**
     * Get API keys for the authenticated user
     */
    getApiKeys: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Create a new API key for the authenticated user
     */
    createApiKey: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Revoke an API key
     */
    revokeApiKey: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Get webhooks for the authenticated user
     */
    getWebhooks: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Register a new webhook
     */
    registerWebhook: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Update a webhook
     */
    updateWebhook: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Delete a webhook
     */
    deleteWebhook: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Get available event types for webhooks
     */
    getEventTypes: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Get system status for external API health check
     */
    getSystemStatus: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Trigger a test event (for developers to test webhook integration)
     */
    triggerTestEvent: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * API endpoint for external services to verify API key (used by third-party integrations)
     */
    verifyApiKey: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export declare const externalApiController: ExternalApiController;
