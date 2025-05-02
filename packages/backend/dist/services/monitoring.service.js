"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.monitoringService = exports.MonitoringService = exports.MonitoringEventType = void 0;
const os_1 = __importDefault(require("os"));
const logger_1 = require("../utils/logger");
const websocket_service_1 = require("./websocket.service");
const mongoose_1 = __importDefault(require("mongoose"));
var MonitoringEventType;
(function (MonitoringEventType) {
    MonitoringEventType["SYSTEM_METRICS_UPDATED"] = "monitoring:systemMetricsUpdated";
    MonitoringEventType["DOWNLOAD_METRICS_UPDATED"] = "monitoring:downloadMetricsUpdated";
    MonitoringEventType["STORAGE_METRICS_UPDATED"] = "monitoring:storageMetricsUpdated";
    MonitoringEventType["ALERT_TRIGGERED"] = "monitoring:alertTriggered";
    MonitoringEventType["ALERT_RESOLVED"] = "monitoring:alertResolved";
})(MonitoringEventType || (exports.MonitoringEventType = MonitoringEventType = {}));
/**
 * Monitoring Service to track system health metrics and performance
 */
class MonitoringService {
    static instance;
    systemMetricsInterval = null;
    downloadMetricsInterval = null;
    storageMetricsInterval = null;
    alertCheckInterval = null;
    systemMetrics = {
        cpu: {
            usage: 0,
            loadAverage: [0, 0, 0],
            cores: os_1.default.cpus().length
        },
        memory: {
            total: 0,
            free: 0,
            usage: 0
        },
        uptime: 0,
        timestamp: new Date()
    };
    downloadMetrics = {
        activeJobs: 0,
        queuedJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        averageSpeed: 0,
        totalDownloaded: 0,
        timestamp: new Date()
    };
    storageMetrics = {
        totalSpace: 0,
        usedSpace: 0,
        freeSpace: 0,
        providers: {},
        timestamp: new Date()
    };
    activeAlerts = new Map();
    alertConfigs = [];
    // Performance history - keep limited history for performance reasons
    systemMetricsHistory = [];
    downloadMetricsHistory = [];
    storageMetricsHistory = [];
    alertHistory = [];
    historyLimit = 100; // Keep last 100 data points
    constructor() {
        // Private constructor for singleton
    }
    /**
     * Get the singleton instance
     */
    static getInstance() {
        if (!MonitoringService.instance) {
            MonitoringService.instance = new MonitoringService();
        }
        return MonitoringService.instance;
    }
    /**
     * Initialize the monitoring service
     */
    initialize() {
        this.loadAlertConfigs();
        this.startMetricsCollection();
        // Register with socket.io to monitor download progress updates
        this.setupWebSocketEvents();
        (0, logger_1.logInfo)('Monitoring service initialized');
    }
    /**
     * Start collecting metrics at regular intervals
     */
    startMetricsCollection() {
        // Collect system metrics every 30 seconds
        this.systemMetricsInterval = setInterval(() => {
            this.collectSystemMetrics();
        }, 30000);
        // Collect download metrics every minute
        this.downloadMetricsInterval = setInterval(() => {
            this.collectDownloadMetrics();
        }, 60000);
        // Collect storage metrics every 5 minutes
        this.storageMetricsInterval = setInterval(() => {
            this.collectStorageMetrics();
        }, 300000);
        // Check alerts every minute
        this.alertCheckInterval = setInterval(() => {
            this.checkAlerts();
        }, 60000);
        // Collect initial metrics immediately
        this.collectSystemMetrics();
        this.collectDownloadMetrics();
        this.collectStorageMetrics();
        (0, logger_1.logInfo)('Metrics collection started');
    }
    /**
     * Stop collecting metrics
     */
    shutdown() {
        if (this.systemMetricsInterval)
            clearInterval(this.systemMetricsInterval);
        if (this.downloadMetricsInterval)
            clearInterval(this.downloadMetricsInterval);
        if (this.storageMetricsInterval)
            clearInterval(this.storageMetricsInterval);
        if (this.alertCheckInterval)
            clearInterval(this.alertCheckInterval);
        (0, logger_1.logInfo)('Monitoring service shut down');
    }
    /**
     * Collect system metrics (CPU, memory, uptime)
     */
    async collectSystemMetrics() {
        try {
            const cpus = os_1.default.cpus();
            let totalIdle = 0;
            let totalTick = 0;
            // Calculate CPU usage across all cores
            cpus.forEach(cpu => {
                for (const type in cpu.times) {
                    totalTick += cpu.times[type];
                }
                totalIdle += cpu.times.idle;
            });
            const idlePercentage = totalIdle / totalTick;
            const usagePercentage = 100 - (idlePercentage * 100);
            // Update system metrics
            this.systemMetrics = {
                cpu: {
                    usage: Math.round(usagePercentage * 100) / 100, // Round to 2 decimal places
                    loadAverage: os_1.default.loadavg(),
                    cores: cpus.length
                },
                memory: {
                    total: os_1.default.totalmem(),
                    free: os_1.default.freemem(),
                    usage: Math.round(((os_1.default.totalmem() - os_1.default.freemem()) / os_1.default.totalmem() * 100) * 100) / 100
                },
                uptime: os_1.default.uptime(),
                timestamp: new Date()
            };
            // Store in history, maintain limit
            this.systemMetricsHistory.push(this.systemMetrics);
            if (this.systemMetricsHistory.length > this.historyLimit) {
                this.systemMetricsHistory.shift();
            }
            // Broadcast through WebSocket
            this.broadcastMetricsUpdate(MonitoringEventType.SYSTEM_METRICS_UPDATED, this.systemMetrics);
            (0, logger_1.logDebug)(`System metrics collected - CPU: ${this.systemMetrics.cpu.usage}%, Memory: ${this.systemMetrics.memory.usage}%`);
        }
        catch (error) {
            (0, logger_1.logError)(`Error collecting system metrics: ${error}`);
        }
    }
    /**
     * Collect download metrics by querying the database
     */
    async collectDownloadMetrics() {
        try {
            // We'll need to query the database to get real metrics
            // This is a placeholder for now - in a real implementation, you'd query MongoDB
            // const DownloadJob = require('../models/download-job.model').DownloadJob;
            // Example with mongoose query (commented out)
            // const activeCount = await DownloadJob.countDocuments({ status: DownloadJobStatus.DOWNLOADING });
            // const queuedCount = await DownloadJob.countDocuments({ status: DownloadJobStatus.QUEUED });
            // const completedCount = await DownloadJob.countDocuments({ status: DownloadJobStatus.COMPLETED });
            // const failedCount = await DownloadJob.countDocuments({ status: DownloadJobStatus.FAILED });
            // Placeholder metrics for demo purposes
            this.downloadMetrics = {
                activeJobs: 2,
                queuedJobs: 5,
                completedJobs: 45,
                failedJobs: 3,
                averageSpeed: 1500000, // 1.5 MB/s
                totalDownloaded: 1024 * 1024 * 1024 * 5, // 5 GB
                timestamp: new Date()
            };
            // Store in history, maintain limit
            this.downloadMetricsHistory.push(this.downloadMetrics);
            if (this.downloadMetricsHistory.length > this.historyLimit) {
                this.downloadMetricsHistory.shift();
            }
            // Broadcast through WebSocket
            this.broadcastMetricsUpdate(MonitoringEventType.DOWNLOAD_METRICS_UPDATED, this.downloadMetrics);
            (0, logger_1.logDebug)(`Download metrics collected - Active: ${this.downloadMetrics.activeJobs}, Queued: ${this.downloadMetrics.queuedJobs}`);
        }
        catch (error) {
            (0, logger_1.logError)(`Error collecting download metrics: ${error}`);
        }
    }
    /**
     * Collect storage metrics by querying storage providers
     */
    async collectStorageMetrics() {
        try {
            // In a real implementation, you'd query each storage provider
            // For now, using placeholder metrics
            this.storageMetrics = {
                totalSpace: 1024 * 1024 * 1024 * 100, // 100 GB
                usedSpace: 1024 * 1024 * 1024 * 25, // 25 GB
                freeSpace: 1024 * 1024 * 1024 * 75, // 75 GB
                providers: {
                    'local': {
                        usage: 1024 * 1024 * 1024 * 10, // 10 GB
                        count: 150
                    },
                    's3': {
                        usage: 1024 * 1024 * 1024 * 15, // 15 GB
                        count: 200
                    }
                },
                timestamp: new Date()
            };
            // Store in history, maintain limit
            this.storageMetricsHistory.push(this.storageMetrics);
            if (this.storageMetricsHistory.length > this.historyLimit) {
                this.storageMetricsHistory.shift();
            }
            // Broadcast through WebSocket
            this.broadcastMetricsUpdate(MonitoringEventType.STORAGE_METRICS_UPDATED, this.storageMetrics);
            (0, logger_1.logDebug)(`Storage metrics collected - Used: ${Math.round(this.storageMetrics.usedSpace / 1024 / 1024 / 1024)}GB, Free: ${Math.round(this.storageMetrics.freeSpace / 1024 / 1024 / 1024)}GB`);
        }
        catch (error) {
            (0, logger_1.logError)(`Error collecting storage metrics: ${error}`);
        }
    }
    /**
     * Load alert configurations from database or config
     */
    async loadAlertConfigs() {
        // In real implementation, load from database
        // For now, adding default alert configs
        this.alertConfigs = [
            {
                id: '1',
                name: 'High CPU Usage',
                type: 'system',
                condition: 'value > threshold',
                threshold: 80, // 80% CPU usage
                status: 'active',
                severity: 'warning',
                message: 'CPU usage is high',
                createdAt: new Date()
            },
            {
                id: '2',
                name: 'Low Disk Space',
                type: 'storage',
                condition: 'value < threshold',
                threshold: 10, // Less than 10% free space
                status: 'active',
                severity: 'error',
                message: 'Storage space is critically low',
                createdAt: new Date()
            },
            {
                id: '3',
                name: 'High Download Queue',
                type: 'download',
                condition: 'value > threshold',
                threshold: 20, // More than 20 queued jobs
                status: 'active',
                severity: 'info',
                message: 'Download queue is building up',
                createdAt: new Date()
            }
        ];
        (0, logger_1.logInfo)(`Loaded ${this.alertConfigs.length} alert configurations`);
    }
    /**
     * Check for alert conditions and trigger alerts if needed
     */
    checkAlerts() {
        for (const config of this.alertConfigs) {
            if (config.status !== 'active')
                continue;
            let currentValue = 0;
            let condition = false;
            // Get current value based on alert type
            switch (config.type) {
                case 'system':
                    currentValue = this.systemMetrics.cpu.usage;
                    break;
                case 'download':
                    currentValue = this.downloadMetrics.queuedJobs;
                    break;
                case 'storage':
                    // Calculate free space percentage
                    currentValue = (this.storageMetrics.freeSpace / this.storageMetrics.totalSpace) * 100;
                    break;
            }
            // Evaluate condition
            try {
                // Using Function constructor to evaluate the condition string
                // Note: In production, you should use a safer evaluation method
                const evalFn = new Function('value', 'threshold', `return ${config.condition};`);
                condition = evalFn(currentValue, config.threshold);
            }
            catch (error) {
                (0, logger_1.logError)(`Error evaluating alert condition: ${error}`);
                continue;
            }
            const alertId = `alert_${config.id}`;
            // If condition is met and alert not already active, trigger a new alert
            if (condition && !this.activeAlerts.has(alertId)) {
                const alert = {
                    id: alertId,
                    configId: config.id,
                    type: config.type,
                    severity: config.severity,
                    message: config.message,
                    value: currentValue,
                    threshold: config.threshold,
                    timestamp: new Date()
                };
                this.triggerAlert(alert);
            }
            // If condition is no longer met but alert is active, resolve it
            else if (!condition && this.activeAlerts.has(alertId)) {
                this.resolveAlert(alertId);
            }
        }
    }
    /**
     * Trigger a new alert
     */
    triggerAlert(alert) {
        this.activeAlerts.set(alert.id, alert);
        // Add to history
        this.alertHistory.push(alert);
        if (this.alertHistory.length > this.historyLimit) {
            this.alertHistory.shift();
        }
        // Update the last triggered timestamp on the config
        const configIndex = this.alertConfigs.findIndex(c => c.id === alert.configId);
        if (configIndex !== -1) {
            this.alertConfigs[configIndex].lastTriggered = new Date();
        }
        // Create system notification
        const notification = {
            level: alert.severity,
            message: alert.message,
            timestamp: alert.timestamp,
            code: `ALERT_${alert.configId}`,
            metadata: {
                type: alert.type,
                value: alert.value,
                threshold: alert.threshold
            }
        };
        // Send notification through WebSocket
        websocket_service_1.websocketService.sendSystemNotification(notification);
        // Broadcast alert through monitoring channel
        this.broadcastMetricsUpdate(MonitoringEventType.ALERT_TRIGGERED, alert);
        (0, logger_1.logInfo)(`Alert triggered: ${alert.message} (${alert.value} ${alert.type === 'storage' ? 'below' : 'exceeds'} threshold of ${alert.threshold})`);
    }
    /**
     * Resolve an active alert
     */
    resolveAlert(alertId) {
        const alert = this.activeAlerts.get(alertId);
        if (!alert)
            return;
        this.activeAlerts.delete(alertId);
        // Create resolved alert notification
        const resolvedAlert = {
            ...alert,
            resolvedAt: new Date()
        };
        // Broadcast resolved alert
        this.broadcastMetricsUpdate(MonitoringEventType.ALERT_RESOLVED, resolvedAlert);
        (0, logger_1.logInfo)(`Alert resolved: ${alert.message}`);
    }
    /**
     * Broadcast metrics update through WebSocket
     */
    broadcastMetricsUpdate(eventType, data) {
        // Using system namespace for monitoring events
        websocket_service_1.websocketService.broadcast(eventType, data);
    }
    /**
     * Setup event listeners for WebSocket events that monitoring should track
     */
    setupWebSocketEvents() {
        // Here we would register listeners for download progress events
        // For now, we'll rely on the polling mechanism
        (0, logger_1.logDebug)('WebSocket event listeners set up for monitoring');
    }
    /**
     * Register a download progress update
     */
    registerDownloadProgress(jobId, progress, speed) {
        // Update speed and progress tracking in real-time
        // This would be called from the download service when progress updates
        (0, logger_1.logDebug)(`Download progress for job ${jobId}: ${progress}% at ${Math.round(speed / 1024 / 1024 * 100) / 100} MB/s`);
        // This could trigger an immediate metrics update if needed
        // For now, we'll rely on the polling mechanism
    }
    /**
     * Get current system metrics
     */
    getSystemMetrics() {
        return this.systemMetrics;
    }
    /**
     * Get system metrics history
     */
    getSystemMetricsHistory(limit = this.historyLimit) {
        return this.systemMetricsHistory.slice(-limit);
    }
    /**
     * Get current download metrics
     */
    getDownloadMetrics() {
        return this.downloadMetrics;
    }
    /**
     * Get download metrics history
     */
    getDownloadMetricsHistory(limit = this.historyLimit) {
        return this.downloadMetricsHistory.slice(-limit);
    }
    /**
     * Get current storage metrics
     */
    getStorageMetrics() {
        return this.storageMetrics;
    }
    /**
     * Get storage metrics history
     */
    getStorageMetricsHistory(limit = this.historyLimit) {
        return this.storageMetricsHistory.slice(-limit);
    }
    /**
     * Get active alerts
     */
    getActiveAlerts() {
        return Array.from(this.activeAlerts.values());
    }
    /**
     * Get alert history
     */
    getAlertHistory(limit = this.historyLimit) {
        return this.alertHistory.slice(-limit);
    }
    /**
     * Get alert configurations
     */
    getAlertConfigs() {
        return this.alertConfigs;
    }
    /**
     * Create or update an alert configuration
     */
    saveAlertConfig(config) {
        if (!config.id) {
            // Create new alert config
            const newConfig = {
                id: `config_${Date.now()}`,
                name: config.name || 'New Alert',
                type: config.type || 'system',
                condition: config.condition || 'value > threshold',
                threshold: config.threshold || 90,
                status: config.status || 'active',
                severity: config.severity || 'info',
                message: config.message || 'Alert triggered',
                createdAt: new Date()
            };
            this.alertConfigs.push(newConfig);
            (0, logger_1.logInfo)(`New alert configuration created: ${newConfig.name}`);
            return newConfig;
        }
        else {
            // Update existing config
            const index = this.alertConfigs.findIndex(c => c.id === config.id);
            if (index === -1) {
                throw new Error(`Alert configuration with ID ${config.id} not found`);
            }
            const updatedConfig = {
                ...this.alertConfigs[index],
                ...config
            };
            this.alertConfigs[index] = updatedConfig;
            (0, logger_1.logInfo)(`Alert configuration updated: ${updatedConfig.name}`);
            return updatedConfig;
        }
    }
    /**
     * Delete an alert configuration
     */
    deleteAlertConfig(id) {
        const index = this.alertConfigs.findIndex(c => c.id === id);
        if (index === -1) {
            return false;
        }
        this.alertConfigs.splice(index, 1);
        // Remove any active alerts associated with this config
        const alertId = `alert_${id}`;
        if (this.activeAlerts.has(alertId)) {
            this.activeAlerts.delete(alertId);
        }
        (0, logger_1.logInfo)(`Alert configuration deleted: ${id}`);
        return true;
    }
    /**
     * Run a system health check and return status
     */
    async checkSystemHealth() {
        await this.collectSystemMetrics();
        // Determine system health based on metrics
        let status = 'healthy';
        const issues = [];
        if (this.systemMetrics.cpu.usage > 90) {
            status = 'degraded';
            issues.push('CPU usage is extremely high');
        }
        else if (this.systemMetrics.cpu.usage > 75) {
            if (status === 'healthy')
                status = 'degraded';
            issues.push('CPU usage is high');
        }
        if (this.systemMetrics.memory.usage > 90) {
            status = 'degraded';
            issues.push('Memory usage is extremely high');
        }
        else if (this.systemMetrics.memory.usage > 75) {
            if (status === 'healthy')
                status = 'degraded';
            issues.push('Memory usage is high');
        }
        // Check database connection
        try {
            const dbStatus = mongoose_1.default.connection.readyState;
            if (dbStatus !== 1) { // 1 = connected
                status = 'unhealthy';
                issues.push('Database connection is not established');
            }
        }
        catch (error) {
            status = 'unhealthy';
            issues.push(`Database error: ${error}`);
        }
        // If any active alerts with severity 'error', system is unhealthy
        const criticalAlerts = Array.from(this.activeAlerts.values())
            .filter(alert => alert.severity === 'error');
        if (criticalAlerts.length > 0) {
            status = 'unhealthy';
            issues.push(`${criticalAlerts.length} critical alerts active`);
        }
        return {
            status,
            metrics: this.systemMetrics,
            details: {
                issues,
                activeAlerts: this.getActiveAlerts().length,
                mongodbConnected: mongoose_1.default.connection.readyState === 1
            }
        };
    }
}
exports.MonitoringService = MonitoringService;
// Create and export singleton instance
exports.monitoringService = MonitoringService.getInstance();
//# sourceMappingURL=monitoring.service.js.map