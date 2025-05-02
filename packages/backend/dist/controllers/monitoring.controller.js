"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.monitoringController = exports.MonitoringController = void 0;
const monitoring_service_1 = require("../services/monitoring.service");
const logger_1 = require("../utils/logger");
/**
 * Controller for monitoring-related endpoints
 */
class MonitoringController {
    /**
     * Get system metrics
     */
    getSystemMetrics = async (req, res, next) => {
        try {
            const { history } = req.query;
            let metrics;
            if (history === 'true') {
                const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
                metrics = monitoring_service_1.monitoringService.getSystemMetricsHistory(limit);
            }
            else {
                metrics = monitoring_service_1.monitoringService.getSystemMetrics();
            }
            res.status(200).json({
                success: true,
                data: metrics
            });
        }
        catch (error) {
            (0, logger_1.logError)(`Error fetching system metrics: ${error}`);
            next(error);
        }
    };
    /**
     * Get download metrics
     */
    getDownloadMetrics = async (req, res, next) => {
        try {
            const { history } = req.query;
            let metrics;
            if (history === 'true') {
                const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
                metrics = monitoring_service_1.monitoringService.getDownloadMetricsHistory(limit);
            }
            else {
                metrics = monitoring_service_1.monitoringService.getDownloadMetrics();
            }
            res.status(200).json({
                success: true,
                data: metrics
            });
        }
        catch (error) {
            (0, logger_1.logError)(`Error fetching download metrics: ${error}`);
            next(error);
        }
    };
    /**
     * Get storage metrics
     */
    getStorageMetrics = async (req, res, next) => {
        try {
            const { history } = req.query;
            let metrics;
            if (history === 'true') {
                const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
                metrics = monitoring_service_1.monitoringService.getStorageMetricsHistory(limit);
            }
            else {
                metrics = monitoring_service_1.monitoringService.getStorageMetrics();
            }
            res.status(200).json({
                success: true,
                data: metrics
            });
        }
        catch (error) {
            (0, logger_1.logError)(`Error fetching storage metrics: ${error}`);
            next(error);
        }
    };
    /**
     * Get active alerts
     */
    getActiveAlerts = async (req, res, next) => {
        try {
            const alerts = monitoring_service_1.monitoringService.getActiveAlerts();
            res.status(200).json({
                success: true,
                data: alerts
            });
        }
        catch (error) {
            (0, logger_1.logError)(`Error fetching active alerts: ${error}`);
            next(error);
        }
    };
    /**
     * Get alert history
     */
    getAlertHistory = async (req, res, next) => {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
            const alerts = monitoring_service_1.monitoringService.getAlertHistory(limit);
            res.status(200).json({
                success: true,
                data: alerts
            });
        }
        catch (error) {
            (0, logger_1.logError)(`Error fetching alert history: ${error}`);
            next(error);
        }
    };
    /**
     * Get alert configurations
     */
    getAlertConfigs = async (req, res, next) => {
        try {
            const configs = monitoring_service_1.monitoringService.getAlertConfigs();
            res.status(200).json({
                success: true,
                data: configs
            });
        }
        catch (error) {
            (0, logger_1.logError)(`Error fetching alert configs: ${error}`);
            next(error);
        }
    };
    /**
     * Create new alert configuration
     */
    createAlertConfig = async (req, res, next) => {
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
            const newConfig = monitoring_service_1.monitoringService.saveAlertConfig(config);
            res.status(201).json({
                success: true,
                data: newConfig
            });
            (0, logger_1.logInfo)(`Alert configuration created: ${newConfig.name}`);
        }
        catch (error) {
            (0, logger_1.logError)(`Error creating alert config: ${error}`);
            next(error);
        }
    };
    /**
     * Update existing alert configuration
     */
    updateAlertConfig = async (req, res, next) => {
        try {
            const { id } = req.params;
            const config = req.body;
            // Ensure ID in body matches URL parameter
            config.id = id;
            try {
                const updatedConfig = monitoring_service_1.monitoringService.saveAlertConfig(config);
                res.status(200).json({
                    success: true,
                    data: updatedConfig
                });
                (0, logger_1.logInfo)(`Alert configuration updated: ${updatedConfig.name}`);
            }
            catch (error) {
                res.status(404).json({
                    success: false,
                    message: `Alert configuration with ID ${id} not found`
                });
            }
        }
        catch (error) {
            (0, logger_1.logError)(`Error updating alert config: ${error}`);
            next(error);
        }
    };
    /**
     * Delete alert configuration
     */
    deleteAlertConfig = async (req, res, next) => {
        try {
            const { id } = req.params;
            const deleted = monitoring_service_1.monitoringService.deleteAlertConfig(id);
            if (deleted) {
                res.status(200).json({
                    success: true,
                    message: `Alert configuration ${id} deleted successfully`
                });
                (0, logger_1.logInfo)(`Alert configuration deleted: ${id}`);
            }
            else {
                res.status(404).json({
                    success: false,
                    message: `Alert configuration with ID ${id} not found`
                });
            }
        }
        catch (error) {
            (0, logger_1.logError)(`Error deleting alert config: ${error}`);
            next(error);
        }
    };
    /**
     * Get system health status
     */
    getSystemHealth = async (req, res, next) => {
        try {
            const health = await monitoring_service_1.monitoringService.checkSystemHealth();
            // Set appropriate HTTP status based on health status
            let statusCode = 200;
            if (health.status === 'degraded') {
                statusCode = 200; // Still operational but with issues
            }
            else if (health.status === 'unhealthy') {
                statusCode = 503; // Service unavailable
            }
            res.status(statusCode).json({
                success: true,
                data: health
            });
        }
        catch (error) {
            (0, logger_1.logError)(`Error checking system health: ${error}`);
            next(error);
        }
    };
    /**
     * Force refresh of all metrics (trigger immediate collection)
     */
    refreshMetrics = async (req, res, next) => {
        try {
            // This would call collection methods directly for immediate refresh
            // For now, we'll just return the latest metrics
            const systemMetrics = monitoring_service_1.monitoringService.getSystemMetrics();
            const downloadMetrics = monitoring_service_1.monitoringService.getDownloadMetrics();
            const storageMetrics = monitoring_service_1.monitoringService.getStorageMetrics();
            res.status(200).json({
                success: true,
                data: {
                    system: systemMetrics,
                    downloads: downloadMetrics,
                    storage: storageMetrics,
                    timestamp: new Date()
                }
            });
            (0, logger_1.logInfo)('Metrics refresh requested');
        }
        catch (error) {
            (0, logger_1.logError)(`Error refreshing metrics: ${error}`);
            next(error);
        }
    };
}
exports.MonitoringController = MonitoringController;
// Create and export controller instance
exports.monitoringController = new MonitoringController();
//# sourceMappingURL=monitoring.controller.js.map