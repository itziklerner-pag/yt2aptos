import { Request, Response, NextFunction } from 'express';
import { monitoringService } from '../services/monitoring.service';
import { logError, logInfo } from '../utils/logger';

/**
 * Controller for monitoring-related endpoints
 */
export class MonitoringController {
  /**
   * Get system metrics
   */
  public getSystemMetrics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { history } = req.query;
      let metrics;
      
      if (history === 'true') {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
        metrics = monitoringService.getSystemMetricsHistory(limit);
      } else {
        metrics = monitoringService.getSystemMetrics();
      }
      
      res.status(200).json({
        success: true,
        data: metrics
      });
    } catch (error) {
      logError(`Error fetching system metrics: ${error}`);
      next(error);
    }
  };
  
  /**
   * Get download metrics
   */
  public getDownloadMetrics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { history } = req.query;
      let metrics;
      
      if (history === 'true') {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
        metrics = monitoringService.getDownloadMetricsHistory(limit);
      } else {
        metrics = monitoringService.getDownloadMetrics();
      }
      
      res.status(200).json({
        success: true,
        data: metrics
      });
    } catch (error) {
      logError(`Error fetching download metrics: ${error}`);
      next(error);
    }
  };
  
  /**
   * Get storage metrics
   */
  public getStorageMetrics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { history } = req.query;
      let metrics;
      
      if (history === 'true') {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
        metrics = monitoringService.getStorageMetricsHistory(limit);
      } else {
        metrics = monitoringService.getStorageMetrics();
      }
      
      res.status(200).json({
        success: true,
        data: metrics
      });
    } catch (error) {
      logError(`Error fetching storage metrics: ${error}`);
      next(error);
    }
  };
  
  /**
   * Get active alerts
   */
  public getActiveAlerts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const alerts = monitoringService.getActiveAlerts();
      
      res.status(200).json({
        success: true,
        data: alerts
      });
    } catch (error) {
      logError(`Error fetching active alerts: ${error}`);
      next(error);
    }
  };
  
  /**
   * Get alert history
   */
  public getAlertHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const alerts = monitoringService.getAlertHistory(limit);
      
      res.status(200).json({
        success: true,
        data: alerts
      });
    } catch (error) {
      logError(`Error fetching alert history: ${error}`);
      next(error);
    }
  };
  
  /**
   * Get alert configurations
   */
  public getAlertConfigs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const configs = monitoringService.getAlertConfigs();
      
      res.status(200).json({
        success: true,
        data: configs
      });
    } catch (error) {
      logError(`Error fetching alert configs: ${error}`);
      next(error);
    }
  };
  
  /**
   * Create new alert configuration
   */
  public createAlertConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const config = req.body;
      
      // Validate required fields
      if (!config.name || !config.type || !config.condition || !config.threshold) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: name, type, condition, and threshold are required'
        });
        return;
      }
      
      const newConfig = monitoringService.saveAlertConfig(config);
      
      res.status(201).json({
        success: true,
        data: newConfig
      });
      
      logInfo(`Alert configuration created: ${newConfig.name}`);
    } catch (error) {
      logError(`Error creating alert config: ${error}`);
      next(error);
    }
  };
  
  /**
   * Update existing alert configuration
   */
  public updateAlertConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const config = req.body;
      
      // Ensure ID in body matches URL parameter
      config.id = id;
      
      try {
        const updatedConfig = monitoringService.saveAlertConfig(config);
        
        res.status(200).json({
          success: true,
          data: updatedConfig
        });
        
        logInfo(`Alert configuration updated: ${updatedConfig.name}`);
      } catch (error) {
        res.status(404).json({
          success: false,
          message: `Alert configuration with ID ${id} not found`
        });
      }
    } catch (error) {
      logError(`Error updating alert config: ${error}`);
      next(error);
    }
  };
  
  /**
   * Delete alert configuration
   */
  public deleteAlertConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const deleted = monitoringService.deleteAlertConfig(id);
      
      if (deleted) {
        res.status(200).json({
          success: true,
          message: `Alert configuration ${id} deleted successfully`
        });
        
        logInfo(`Alert configuration deleted: ${id}`);
      } else {
        res.status(404).json({
          success: false,
          message: `Alert configuration with ID ${id} not found`
        });
      }
    } catch (error) {
      logError(`Error deleting alert config: ${error}`);
      next(error);
    }
  };
  
  /**
   * Get system health status
   */
  public getSystemHealth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const health = await monitoringService.checkSystemHealth();
      
      // Set appropriate HTTP status based on health status
      let statusCode = 200;
      if (health.status === 'degraded') {
        statusCode = 200; // Still operational but with issues
      } else if (health.status === 'unhealthy') {
        statusCode = 503; // Service unavailable
      }
      
      res.status(statusCode).json({
        success: true,
        data: health
      });
    } catch (error) {
      logError(`Error checking system health: ${error}`);
      next(error);
    }
  };
  
  /**
   * Force refresh of all metrics (trigger immediate collection)
   */
  public refreshMetrics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // This would call collection methods directly for immediate refresh
      // For now, we'll just return the latest metrics
      
      const systemMetrics = monitoringService.getSystemMetrics();
      const downloadMetrics = monitoringService.getDownloadMetrics();
      const storageMetrics = monitoringService.getStorageMetrics();
      
      res.status(200).json({
        success: true,
        data: {
          system: systemMetrics,
          downloads: downloadMetrics,
          storage: storageMetrics,
          timestamp: new Date()
        }
      });
      
      logInfo('Metrics refresh requested');
    } catch (error) {
      logError(`Error refreshing metrics: ${error}`);
      next(error);
    }
  };
}

// Create and export controller instance
export const monitoringController = new MonitoringController();