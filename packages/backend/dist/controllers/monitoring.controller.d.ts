import { Request, Response, NextFunction } from 'express';
/**
 * Controller for monitoring-related endpoints
 */
export declare class MonitoringController {
    /**
     * Get system metrics
     */
    getSystemMetrics: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Get download metrics
     */
    getDownloadMetrics: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Get storage metrics
     */
    getStorageMetrics: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Get active alerts
     */
    getActiveAlerts: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Get alert history
     */
    getAlertHistory: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Get alert configurations
     */
    getAlertConfigs: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Create new alert configuration
     */
    createAlertConfig: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Update existing alert configuration
     */
    updateAlertConfig: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Delete alert configuration
     */
    deleteAlertConfig: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Get system health status
     */
    getSystemHealth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Force refresh of all metrics (trigger immediate collection)
     */
    refreshMetrics: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export declare const monitoringController: MonitoringController;
