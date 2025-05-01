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
