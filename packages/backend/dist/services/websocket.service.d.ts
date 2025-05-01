import { Server as HttpServer } from 'http';
import { SocketEventType, ContentUpdatePayload, DownloadJobUpdatePayload, SystemNotificationPayload } from '../types/socket.types';
/**
 * WebSocket service to handle real-time communication
 */
export declare class WebSocketService {
    private io;
    private userSockets;
    private userRooms;
    private messageQueue;
    private reconnectTimers;
    /**
     * Initialize Socket.IO server with HTTP server
     * @param httpServer The HTTP server to attach Socket.IO server
     */
    initialize(httpServer: HttpServer): void;
    /**
     * Initialize Socket.IO namespaces with middleware and event handlers
     */
    private initializeNamespaces;
    /**
     * Authentication middleware for Socket.IO connections
     */
    private authMiddleware;
    /**
     * Setup content namespace event handlers
     */
    private setupContentNamespace;
    /**
     * Setup downloads namespace event handlers
     */
    private setupDownloadsNamespace;
    /**
     * Setup users namespace event handlers
     */
    private setupUsersNamespace;
    /**
     * Setup system namespace event handlers
     */
    private setupSystemNamespace;
    /**
     * Handle socket reconnection and deliver missed messages
     */
    private handleReconnection;
    /**
     * Handle socket disconnection
     */
    private handleDisconnect;
    /**
     * Handle message acknowledgment from client
     */
    private handleMessageAcknowledgment;
    /**
     * Emit event to a specific user across all their connected sockets
     */
    emitToUser(userId: string, event: SocketEventType, payload: any): void;
    /**
     * Emit event to a specific room in a namespace
     */
    private emitToNamespace;
    /**
     * Queue a message for later delivery to a user
     */
    private queueMessageForUser;
    /**
     * Emit system-wide broadcast event
     */
    broadcast(event: SocketEventType, payload: any): void;
    /**
     * Broadcast content update event
     */
    broadcastContentUpdate(payload: ContentUpdatePayload): void;
    /**
     * Broadcast download job update
     */
    broadcastDownloadUpdate(payload: DownloadJobUpdatePayload): void;
    /**
     * Send system notification to all connected clients
     */
    sendSystemNotification(payload: SystemNotificationPayload): void;
}
export declare const websocketService: WebSocketService;
