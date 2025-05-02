import { Request, Response, NextFunction } from 'express';
import { externalApiService, ExternalEventType } from '../services/external-api.service';
import { logError, logInfo } from '../utils/logger';
import { monitoringService } from '../services/monitoring.service';

/**
 * Controller for external API integration endpoints
 */
export class ExternalApiController {
  /**
   * Get API keys for the authenticated user
   */
  public getApiKeys = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const apiKeys = externalApiService.getApiKeys(req.user.userId);
      
      res.status(200).json({
        success: true,
        data: apiKeys
      });
    } catch (error) {
      logError(`Error fetching API keys: ${error}`);
      next(error);
    }
  };
  
  /**
   * Create a new API key for the authenticated user
   */
  public createApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
      
      const apiKey = await externalApiService.createApiKey(
        req.user.userId,
        name,
        permissions || []
      );
      
      res.status(201).json({
        success: true,
        data: apiKey,
        message: 'API key created successfully. Please save your secret as it will not be shown again.'
      });
      
      logInfo(`API key created for user ${req.user.userId}: ${name}`);
    } catch (error) {
      logError(`Error creating API key: ${error}`);
      next(error);
    }
  };
  
  /**
   * Revoke an API key
   */
  public revokeApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }
      
      const { id } = req.params;
      
      const revoked = externalApiService.revokeApiKey(id, req.user.userId);
      
      if (revoked) {
        res.status(200).json({
          success: true,
          message: 'API key revoked successfully'
        });
        
        logInfo(`API key ${id} revoked by user ${req.user.userId}`);
      } else {
        res.status(404).json({
          success: false,
          message: 'API key not found or already revoked'
        });
      }
    } catch (error) {
      logError(`Error revoking API key: ${error}`);
      next(error);
    }
  };
  
  /**
   * Get webhooks for the authenticated user
   */
  public getWebhooks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }
      
      const webhooks = externalApiService.getWebhooks(req.user.userId);
      
      res.status(200).json({
        success: true,
        data: webhooks
      });
    } catch (error) {
      logError(`Error fetching webhooks: ${error}`);
      next(error);
    }
  };
  
  /**
   * Register a new webhook
   */
  public registerWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
      } catch (error) {
        res.status(400).json({
          success: false,
          message: 'Invalid URL format'
        });
        return;
      }
      
      // Validate events
      const validEventTypes = Object.values(ExternalEventType);
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
        const webhook = externalApiService.createWebhook(
          req.user.userId,
          apiKeyId,
          url,
          name,
          events
        );
        
        res.status(201).json({
          success: true,
          data: webhook
        });
        
        logInfo(`Webhook registered for user ${req.user.userId}: ${name} at ${url}`);
      } catch (error) {
        if ((error as Error).message === 'Invalid API key') {
          res.status(404).json({
            success: false,
            message: 'API key not found or inactive'
          });
          return;
        }
        throw error;
      }
    } catch (error) {
      logError(`Error registering webhook: ${error}`);
      next(error);
    }
  };
  
  /**
   * Update a webhook
   */
  public updateWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
      
      const updates: any = {};
      
      if (url !== undefined) {
        try {
          new URL(url);
          updates.url = url;
        } catch (error) {
          res.status(400).json({
            success: false,
            message: 'Invalid URL format'
          });
          return;
        }
      }
      
      if (name !== undefined) updates.name = name;
      if (isEnabled !== undefined) updates.isEnabled = isEnabled;
      
      if (events !== undefined) {
        // Validate events
        const validEventTypes = Object.values(ExternalEventType);
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
      
      const webhook = externalApiService.updateWebhook(id, req.user.userId, updates);
      
      if (webhook) {
        res.status(200).json({
          success: true,
          data: webhook
        });
        
        logInfo(`Webhook ${id} updated by user ${req.user.userId}`);
      } else {
        res.status(404).json({
          success: false,
          message: 'Webhook not found'
        });
      }
    } catch (error) {
      logError(`Error updating webhook: ${error}`);
      next(error);
    }
  };
  
  /**
   * Delete a webhook
   */
  public deleteWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }
      
      const { id } = req.params;
      
      const deleted = externalApiService.deleteWebhook(id, req.user.userId);
      
      if (deleted) {
        res.status(200).json({
          success: true,
          message: 'Webhook deleted successfully'
        });
        
        logInfo(`Webhook ${id} deleted by user ${req.user.userId}`);
      } else {
        res.status(404).json({
          success: false,
          message: 'Webhook not found'
        });
      }
    } catch (error) {
      logError(`Error deleting webhook: ${error}`);
      next(error);
    }
  };
  
  /**
   * Get available event types for webhooks
   */
  public getEventTypes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const eventTypes = externalApiService.getAvailableEventTypes();
      
      res.status(200).json({
        success: true,
        data: eventTypes
      });
    } catch (error) {
      logError(`Error fetching event types: ${error}`);
      next(error);
    }
  };
  
  /**
   * Get system status for external API health check
   */
  public getSystemStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check system health
      const systemHealth = await monitoringService.checkSystemHealth();
      
      // Check API health
      const apiHealth = externalApiService.checkApiHealth();
      
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
      } else if (status === 'unhealthy') {
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
    } catch (error) {
      logError(`Error checking system status: ${error}`);
      next(error);
    }
  };
  
  /**
   * Trigger a test event (for developers to test webhook integration)
   */
  public triggerTestEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
      const validEventTypes = Object.values(ExternalEventType);
      if (!validEventTypes.includes(eventType)) {
        res.status(400).json({
          success: false,
          message: `Invalid event type: ${eventType}`
        });
        return;
      }
      
      // Trigger test event
      externalApiService.triggerTestEvent(eventType, {
        ...data,
        isTest: true,
        triggeredBy: req.user.userId
      });
      
      res.status(200).json({
        success: true,
        message: `Test event ${eventType} triggered successfully`
      });
      
      logInfo(`Test event ${eventType} triggered by user ${req.user.userId}`);
    } catch (error) {
      logError(`Error triggering test event: ${error}`);
      next(error);
    }
  };
  
  /**
   * API endpoint for external services to verify API key (used by third-party integrations)
   */
  public verifyApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { key } = req.query;
      const secret = req.headers['x-api-secret'] as string;
      
      if (!key || !secret) {
        res.status(401).json({
          success: false,
          message: 'API key and secret are required'
        });
        return;
      }
      
      const apiKey = externalApiService.validateApiKey(key as string, secret);
      
      if (apiKey) {
        res.status(200).json({
          success: true,
          message: 'API key is valid',
          permissions: apiKey.permissions
        });
      } else {
        res.status(401).json({
          success: false,
          message: 'Invalid API key or secret'
        });
      }
    } catch (error) {
      logError(`Error verifying API key: ${error}`);
      next(error);
    }
  };
}

// Create and export controller instance
export const externalApiController = new ExternalApiController();