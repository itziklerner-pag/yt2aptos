/**
 * Socket event types for standardization
 */
export declare enum SocketEventType {
    CONNECT = "connect",
    DISCONNECT = "disconnect",
    RECONNECT = "reconnect",
    ERROR = "error",
    CONTENT_UPDATED = "content:updated",
    CONTENT_CREATED = "content:created",
    CONTENT_DELETED = "content:deleted",
    DOWNLOAD_CREATED = "download:created",
    DOWNLOAD_UPDATED = "download:updated",
    DOWNLOAD_STATUS_CHANGED = "download:statusChanged",
    DOWNLOAD_PROGRESS = "download:progress",
    USER_ACTIVITY = "user:activity",
    USER_PRESENCE = "user:presence",
    SYSTEM_NOTIFICATION = "system:notification",
    SYSTEM_ERROR = "system:error",
    SYSTEM_MAINTENANCE = "system:maintenance",
    SYSTEM_METRICS_UPDATED = "monitoring:systemMetricsUpdated",
    DOWNLOAD_METRICS_UPDATED = "monitoring:downloadMetricsUpdated",
    STORAGE_METRICS_UPDATED = "monitoring:storageMetricsUpdated",
    ALERT_TRIGGERED = "monitoring:alertTriggered",
    ALERT_RESOLVED = "monitoring:alertResolved",
    ACK = "ack",
    RECEIVED = "received"
}
/**
 * Socket namespaces
 */
export declare enum SocketNamespace {
    CONTENT = "/content",
    DOWNLOADS = "/downloads",
    USERS = "/users",
    SYSTEM = "/system"
}
/**
 * Socket event payload interfaces
 */
export interface ContentUpdatePayload {
    id: string;
    type: 'video' | 'channel' | 'playlist';
    action: 'created' | 'updated' | 'deleted';
    timestamp: Date;
    data?: any;
}
export interface DownloadJobUpdatePayload {
    jobId: string;
    videoId: string;
    status: string;
    progress: number;
    timestamp: Date;
    message?: string;
    error?: string;
}
export interface UserActivityPayload {
    userId: string;
    action: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}
export interface SystemNotificationPayload {
    level: 'info' | 'warning' | 'error';
    message: string;
    timestamp: Date;
    code?: string;
    metadata?: Record<string, any>;
}
/**
 * Monitoring related payload interfaces
 */
export interface SystemMetricsPayload {
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
export interface DownloadMetricsPayload {
    activeJobs: number;
    queuedJobs: number;
    completedJobs: number;
    failedJobs: number;
    averageSpeed: number;
    totalDownloaded: number;
    timestamp: Date;
}
export interface StorageMetricsPayload {
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
export interface AlertPayload {
    id: string;
    configId: string;
    type: 'system' | 'download' | 'storage';
    severity: 'info' | 'warning' | 'error';
    message: string;
    value: number;
    threshold: number;
    timestamp: Date;
    resolvedAt?: Date;
}
/**
 * Socket Message interface for persistent storage
 */
export interface SocketMessage {
    id: string;
    type: SocketEventType;
    roomId?: string;
    userId?: string;
    payload: any;
    sentAt: Date;
    deliveredAt?: Date;
    readAt?: Date;
    error?: string;
}
