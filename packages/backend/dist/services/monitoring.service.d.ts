/**
 * Types for monitoring metrics
 */
export interface SystemMetrics {
    cpu: {
        usage: number;
        loadAverage: number[];
        cores: number;
    };
    memory: {
        total: number;
        free: number;
        usage: number;
    };
    uptime: number;
    timestamp: Date;
}
export interface DownloadMetrics {
    activeJobs: number;
    queuedJobs: number;
    completedJobs: number;
    failedJobs: number;
    averageSpeed: number;
    totalDownloaded: number;
    timestamp: Date;
}
export interface StorageMetrics {
    totalSpace: number;
    usedSpace: number;
    freeSpace: number;
    providers: {
        [provider: string]: {
            usage: number;
            count: number;
        };
    };
    timestamp: Date;
}
export interface AlertConfig {
    id: string;
    name: string;
    type: 'system' | 'download' | 'storage';
    condition: string;
    threshold: number;
    status: 'active' | 'inactive';
    severity: 'info' | 'warning' | 'error';
    message: string;
    lastTriggered?: Date;
    createdAt: Date;
}
export interface Alert {
    id: string;
    configId: string;
    type: 'system' | 'download' | 'storage';
    severity: 'info' | 'warning' | 'error';
    message: string;
    value: number;
    threshold: number;
    timestamp: Date;
}
export declare enum MonitoringEventType {
    SYSTEM_METRICS_UPDATED = "monitoring:systemMetricsUpdated",
    DOWNLOAD_METRICS_UPDATED = "monitoring:downloadMetricsUpdated",
    STORAGE_METRICS_UPDATED = "monitoring:storageMetricsUpdated",
    ALERT_TRIGGERED = "monitoring:alertTriggered",
    ALERT_RESOLVED = "monitoring:alertResolved"
}
/**
 * Monitoring Service to track system health metrics and performance
 */
export declare class MonitoringService {
    private static instance;
    private systemMetricsInterval;
    private downloadMetricsInterval;
    private storageMetricsInterval;
    private alertCheckInterval;
    private systemMetrics;
    private downloadMetrics;
    private storageMetrics;
    private activeAlerts;
    private alertConfigs;
    private systemMetricsHistory;
    private downloadMetricsHistory;
    private storageMetricsHistory;
    private alertHistory;
    private readonly historyLimit;
    private constructor();
    /**
     * Get the singleton instance
     */
    static getInstance(): MonitoringService;
    /**
     * Initialize the monitoring service
     */
    initialize(): void;
    /**
     * Start collecting metrics at regular intervals
     */
    private startMetricsCollection;
    /**
     * Stop collecting metrics
     */
    shutdown(): void;
    /**
     * Collect system metrics (CPU, memory, uptime)
     */
    private collectSystemMetrics;
    /**
     * Collect download metrics by querying the database
     */
    private collectDownloadMetrics;
    /**
     * Collect storage metrics by querying storage providers
     */
    private collectStorageMetrics;
    /**
     * Load alert configurations from database or config
     */
    private loadAlertConfigs;
    /**
     * Check for alert conditions and trigger alerts if needed
     */
    private checkAlerts;
    /**
     * Trigger a new alert
     */
    private triggerAlert;
    /**
     * Resolve an active alert
     */
    private resolveAlert;
    /**
     * Broadcast metrics update through WebSocket
     */
    private broadcastMetricsUpdate;
    /**
     * Setup event listeners for WebSocket events that monitoring should track
     */
    private setupWebSocketEvents;
    /**
     * Register a download progress update
     */
    registerDownloadProgress(jobId: string, progress: number, speed: number): void;
    /**
     * Get current system metrics
     */
    getSystemMetrics(): SystemMetrics;
    /**
     * Get system metrics history
     */
    getSystemMetricsHistory(limit?: number): SystemMetrics[];
    /**
     * Get current download metrics
     */
    getDownloadMetrics(): DownloadMetrics;
    /**
     * Get download metrics history
     */
    getDownloadMetricsHistory(limit?: number): DownloadMetrics[];
    /**
     * Get current storage metrics
     */
    getStorageMetrics(): StorageMetrics;
    /**
     * Get storage metrics history
     */
    getStorageMetricsHistory(limit?: number): StorageMetrics[];
    /**
     * Get active alerts
     */
    getActiveAlerts(): Alert[];
    /**
     * Get alert history
     */
    getAlertHistory(limit?: number): Alert[];
    /**
     * Get alert configurations
     */
    getAlertConfigs(): AlertConfig[];
    /**
     * Create or update an alert configuration
     */
    saveAlertConfig(config: Partial<AlertConfig>): AlertConfig;
    /**
     * Delete an alert configuration
     */
    deleteAlertConfig(id: string): boolean;
    /**
     * Run a system health check and return status
     */
    checkSystemHealth(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        metrics: SystemMetrics;
        details: Record<string, any>;
    }>;
}
export declare const monitoringService: MonitoringService;
