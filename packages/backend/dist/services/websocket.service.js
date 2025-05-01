"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.websocketService = exports.WebSocketService = void 0;
const socket_io_1 = require("socket.io");
const logger_1 = require("../utils/logger");
const socket_types_1 = require("../types/socket.types");
/**
 * WebSocket service to handle real-time communication
 */
class WebSocketService {
    io = null;
    userSockets = new Map();
    userRooms = new Map();
    messageQueue = new Map();
    reconnectTimers = new Map();
    /**
     * Initialize Socket.IO server with HTTP server
     * @param httpServer The HTTP server to attach Socket.IO server
     */
    initialize(httpServer) {
        // Create Socket.IO server with CORS configuration
        this.io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: process.env.CORS_ORIGIN || '*',
                methods: ['GET', 'POST'],
                credentials: true,
            },
            // Connection timeout
            connectTimeout: 10000,
            // Ping timeout
            pingTimeout: 5000,
            // Ping interval
            pingInterval: 10000,
            // Enable transport upgrade to WebSocket
            allowUpgrades: true,
            // Transport options
            transports: ['websocket', 'polling'],
        });
        // Initialize namespaces
        this.initializeNamespaces();
        (0, logger_1.logInfo)('WebSocket server initialized');
    }
    /**
     * Initialize Socket.IO namespaces with middleware and event handlers
     */
    initializeNamespaces() {
        if (!this.io) {
            (0, logger_1.logError)('Cannot initialize namespaces: Socket.IO server not initialized');
            return;
        }
        // Content namespace for content updates
        const contentNamespace = this.io.of(socket_types_1.SocketNamespace.CONTENT);
        contentNamespace.use(this.authMiddleware);
        this.setupContentNamespace(contentNamespace);
        // Downloads namespace for download job updates
        const downloadsNamespace = this.io.of(socket_types_1.SocketNamespace.DOWNLOADS);
        downloadsNamespace.use(this.authMiddleware);
        this.setupDownloadsNamespace(downloadsNamespace);
        // Users namespace for user activity
        const usersNamespace = this.io.of(socket_types_1.SocketNamespace.USERS);
        usersNamespace.use(this.authMiddleware);
        this.setupUsersNamespace(usersNamespace);
        // System namespace for system-wide notifications
        const systemNamespace = this.io.of(socket_types_1.SocketNamespace.SYSTEM);
        this.setupSystemNamespace(systemNamespace);
        (0, logger_1.logInfo)('WebSocket namespaces initialized');
    }
    /**
     * Authentication middleware for Socket.IO connections
     */
    authMiddleware = (socket, next) => {
        // Get token from handshake auth or query parameters
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        if (!token) {
            // Allow unauthenticated connections to specific namespaces only (e.g., system)
            if (socket.nsp.name === socket_types_1.SocketNamespace.SYSTEM) {
                (0, logger_1.logDebug)(`Anonymous connection allowed to ${socket.nsp.name}`);
                return next();
            }
            const error = new Error('Authentication error: Token not provided');
            (0, logger_1.logError)(`Socket connection rejected: ${error.message}`);
            return next(error);
        }
        // TODO: Implement actual token validation logic
        // This is a placeholder for future authentication implementation
        const userId = 'user-' + Math.random().toString(36).substring(2, 9);
        // Attach user data to socket
        socket.data.userId = userId;
        socket.data.authenticated = true;
        // Add socket to user's sockets collection
        if (!this.userSockets.has(userId)) {
            this.userSockets.set(userId, new Set());
        }
        this.userSockets.get(userId)?.add(socket.id);
        (0, logger_1.logDebug)(`User ${userId} authenticated on socket ${socket.id}`);
        next();
    };
    /**
     * Setup content namespace event handlers
     */
    setupContentNamespace(namespace) {
        namespace.on(socket_types_1.SocketEventType.CONNECT, (socket) => {
            const userId = socket.data.userId;
            (0, logger_1.logInfo)(`User ${userId} connected to content namespace`);
            // Join user's personal room for targeted messages
            if (userId) {
                const userRoom = `user:${userId}`;
                socket.join(userRoom);
                // Track user rooms
                if (!this.userRooms.has(userId)) {
                    this.userRooms.set(userId, new Set());
                }
                this.userRooms.get(userId)?.add(userRoom);
                (0, logger_1.logDebug)(`User ${userId} joined room ${userRoom}`);
            }
            // Handle reconnection and deliver missed messages
            this.handleReconnection(socket);
            // Handle channel subscription
            socket.on('subscribe:channel', (channelId) => {
                const room = `channel:${channelId}`;
                socket.join(room);
                if (userId) {
                    this.userRooms.get(userId)?.add(room);
                }
                (0, logger_1.logDebug)(`Socket ${socket.id} subscribed to channel ${channelId}`);
            });
            // Handle playlist subscription
            socket.on('subscribe:playlist', (playlistId) => {
                const room = `playlist:${playlistId}`;
                socket.join(room);
                if (userId) {
                    this.userRooms.get(userId)?.add(room);
                }
                (0, logger_1.logDebug)(`Socket ${socket.id} subscribed to playlist ${playlistId}`);
            });
            // Handle disconnect
            socket.on(socket_types_1.SocketEventType.DISCONNECT, () => {
                this.handleDisconnect(socket);
            });
            // Handle acknowledgments
            socket.on(socket_types_1.SocketEventType.ACK, (messageId) => {
                this.handleMessageAcknowledgment(socket, messageId);
            });
        });
    }
    /**
     * Setup downloads namespace event handlers
     */
    setupDownloadsNamespace(namespace) {
        namespace.on(socket_types_1.SocketEventType.CONNECT, (socket) => {
            const userId = socket.data.userId;
            (0, logger_1.logInfo)(`User ${userId} connected to downloads namespace`);
            // Join user's personal room for download updates
            if (userId) {
                const userRoom = `user:${userId}:downloads`;
                socket.join(userRoom);
                if (!this.userRooms.has(userId)) {
                    this.userRooms.set(userId, new Set());
                }
                this.userRooms.get(userId)?.add(userRoom);
                (0, logger_1.logDebug)(`User ${userId} joined room ${userRoom}`);
            }
            // Handle specific download job subscription
            socket.on('subscribe:job', (jobId) => {
                const room = `job:${jobId}`;
                socket.join(room);
                if (userId) {
                    this.userRooms.get(userId)?.add(room);
                }
                (0, logger_1.logDebug)(`Socket ${socket.id} subscribed to job ${jobId}`);
            });
            // Handle disconnect
            socket.on(socket_types_1.SocketEventType.DISCONNECT, () => {
                this.handleDisconnect(socket);
            });
            // Handle acknowledgments
            socket.on(socket_types_1.SocketEventType.ACK, (messageId) => {
                this.handleMessageAcknowledgment(socket, messageId);
            });
        });
    }
    /**
     * Setup users namespace event handlers
     */
    setupUsersNamespace(namespace) {
        namespace.on(socket_types_1.SocketEventType.CONNECT, (socket) => {
            const userId = socket.data.userId;
            (0, logger_1.logInfo)(`User ${userId} connected to users namespace`);
            if (userId) {
                // Broadcast user presence to other users
                socket.broadcast.emit(socket_types_1.SocketEventType.USER_PRESENCE, {
                    userId,
                    status: 'online',
                    timestamp: new Date(),
                });
                // Handle user activity updates
                socket.on(socket_types_1.SocketEventType.USER_ACTIVITY, (activity) => {
                    // Broadcast to relevant rooms
                    socket.broadcast.emit(socket_types_1.SocketEventType.USER_ACTIVITY, activity);
                    (0, logger_1.logDebug)(`User ${userId} activity broadcasted: ${activity.action}`);
                });
            }
            // Handle disconnect
            socket.on(socket_types_1.SocketEventType.DISCONNECT, () => {
                if (userId) {
                    // Broadcast user offline status
                    socket.broadcast.emit(socket_types_1.SocketEventType.USER_PRESENCE, {
                        userId,
                        status: 'offline',
                        timestamp: new Date(),
                    });
                }
                this.handleDisconnect(socket);
            });
        });
    }
    /**
     * Setup system namespace event handlers
     */
    setupSystemNamespace(namespace) {
        namespace.on(socket_types_1.SocketEventType.CONNECT, (socket) => {
            (0, logger_1.logInfo)(`Client connected to system namespace: ${socket.id}`);
            // Join broadcast room for system-wide events
            socket.join('broadcast');
            // Handle disconnect
            socket.on(socket_types_1.SocketEventType.DISCONNECT, () => {
                (0, logger_1.logInfo)(`Client disconnected from system namespace: ${socket.id}`);
            });
        });
    }
    /**
     * Handle socket reconnection and deliver missed messages
     */
    handleReconnection(socket) {
        const userId = socket.data.userId;
        if (!userId)
            return;
        // Clear any existing reconnect timer
        if (this.reconnectTimers.has(userId)) {
            clearTimeout(this.reconnectTimers.get(userId));
            this.reconnectTimers.delete(userId);
        }
        // Deliver queued messages
        const queuedMessages = this.messageQueue.get(userId) || [];
        if (queuedMessages.length > 0) {
            (0, logger_1.logDebug)(`Delivering ${queuedMessages.length} queued messages to user ${userId}`);
            queuedMessages.forEach(message => {
                socket.emit(message.type, {
                    ...message.payload,
                    _messageId: message.id,
                });
            });
            // Clear delivered messages
            this.messageQueue.delete(userId);
        }
    }
    /**
     * Handle socket disconnection
     */
    handleDisconnect(socket) {
        const userId = socket.data.userId;
        if (userId) {
            // Remove socket from user's sockets collection
            this.userSockets.get(userId)?.delete(socket.id);
            // If this was the last socket for the user, set a reconnect timer
            if (this.userSockets.get(userId)?.size === 0) {
                const reconnectTimer = setTimeout(() => {
                    // User didn't reconnect within grace period
                    (0, logger_1.logDebug)(`User ${userId} didn't reconnect within grace period`);
                    // Do cleanup if needed
                    this.userRooms.delete(userId);
                    this.userSockets.delete(userId);
                    this.reconnectTimers.delete(userId);
                }, 60000); // 1-minute grace period for reconnection
                this.reconnectTimers.set(userId, reconnectTimer);
            }
        }
        (0, logger_1.logInfo)(`Socket disconnected: ${socket.id}`);
    }
    /**
     * Handle message acknowledgment from client
     */
    handleMessageAcknowledgment(socket, messageId) {
        const userId = socket.data.userId;
        if (!userId)
            return;
        (0, logger_1.logDebug)(`Message ${messageId} acknowledged by user ${userId}`);
        // Update delivery status for the message
        // This would interact with a messages collection in the database
        // TODO: Implement message acknowledgment storage
    }
    /**
     * Emit event to a specific user across all their connected sockets
     */
    emitToUser(userId, event, payload) {
        if (!this.io) {
            (0, logger_1.logError)('Cannot emit event: Socket.IO server not initialized');
            return;
        }
        // Generate a unique message ID
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        // Create a socket message object
        const message = {
            id: messageId,
            type: event,
            userId,
            payload,
            sentAt: new Date(),
        };
        // Get user's room
        const userRoom = `user:${userId}`;
        // Attempt to deliver to the namespace based on event type
        let delivered = false;
        if (event.startsWith('content:')) {
            delivered = this.emitToNamespace(socket_types_1.SocketNamespace.CONTENT, userRoom, event, message);
        }
        else if (event.startsWith('download:')) {
            delivered = this.emitToNamespace(socket_types_1.SocketNamespace.DOWNLOADS, userRoom, event, message);
        }
        else if (event.startsWith('user:')) {
            delivered = this.emitToNamespace(socket_types_1.SocketNamespace.USERS, userRoom, event, message);
        }
        else if (event.startsWith('system:')) {
            delivered = this.emitToNamespace(socket_types_1.SocketNamespace.SYSTEM, userRoom, event, message);
        }
        // If not delivered, queue the message for later delivery
        if (!delivered) {
            this.queueMessageForUser(userId, message);
        }
    }
    /**
     * Emit event to a specific room in a namespace
     */
    emitToNamespace(namespace, room, event, message) {
        if (!this.io)
            return false;
        const nsp = this.io.of(namespace);
        const roomSockets = nsp.adapter.rooms.get(room);
        if (!roomSockets || roomSockets.size === 0) {
            return false;
        }
        // Emit the event to the room
        nsp.to(room).emit(event, {
            ...message.payload,
            _messageId: message.id,
        });
        return true;
    }
    /**
     * Queue a message for later delivery to a user
     */
    queueMessageForUser(userId, message) {
        if (!this.messageQueue.has(userId)) {
            this.messageQueue.set(userId, []);
        }
        this.messageQueue.get(userId)?.push(message);
        (0, logger_1.logDebug)(`Message queued for user ${userId}: ${message.id}`);
        // TODO: Persist message to database for long-term storage
    }
    /**
     * Emit system-wide broadcast event
     */
    broadcast(event, payload) {
        if (!this.io) {
            (0, logger_1.logError)('Cannot broadcast event: Socket.IO server not initialized');
            return;
        }
        // Broadcast to all connected clients in the system namespace
        this.io.of(socket_types_1.SocketNamespace.SYSTEM).to('broadcast').emit(event, payload);
        (0, logger_1.logInfo)(`Broadcast event ${event} sent to all clients`);
    }
    /**
     * Broadcast content update event
     */
    broadcastContentUpdate(payload) {
        if (!this.io) {
            (0, logger_1.logError)('Cannot broadcast content update: Socket.IO server not initialized');
            return;
        }
        // Determine the appropriate room based on content type
        let room;
        switch (payload.type) {
            case 'channel':
                room = `channel:${payload.id}`;
                break;
            case 'playlist':
                room = `playlist:${payload.id}`;
                break;
            case 'video':
                room = `video:${payload.id}`;
                break;
            default:
                room = 'broadcast';
        }
        // Broadcast to specific content room
        this.io.of(socket_types_1.SocketNamespace.CONTENT).to(room).emit(socket_types_1.SocketEventType.CONTENT_UPDATED, payload);
        (0, logger_1.logInfo)(`Content update broadcasted: ${payload.type} ${payload.id} ${payload.action}`);
    }
    /**
     * Broadcast download job update
     */
    broadcastDownloadUpdate(payload) {
        if (!this.io) {
            (0, logger_1.logError)('Cannot broadcast download update: Socket.IO server not initialized');
            return;
        }
        // Broadcast to specific job room
        this.io.of(socket_types_1.SocketNamespace.DOWNLOADS).to(`job:${payload.jobId}`).emit(socket_types_1.SocketEventType.DOWNLOAD_UPDATED, payload);
        // If status changed, emit a status change event too
        if (payload.status) {
            this.io.of(socket_types_1.SocketNamespace.DOWNLOADS).to(`job:${payload.jobId}`).emit(socket_types_1.SocketEventType.DOWNLOAD_STATUS_CHANGED, payload);
        }
        // If progress updated, emit a progress event
        if (typeof payload.progress === 'number') {
            this.io.of(socket_types_1.SocketNamespace.DOWNLOADS).to(`job:${payload.jobId}`).emit(socket_types_1.SocketEventType.DOWNLOAD_PROGRESS, payload);
        }
        (0, logger_1.logInfo)(`Download update broadcasted: job ${payload.jobId}, status ${payload.status}, progress ${payload.progress}%`);
    }
    /**
     * Send system notification to all connected clients
     */
    sendSystemNotification(payload) {
        this.broadcast(socket_types_1.SocketEventType.SYSTEM_NOTIFICATION, payload);
    }
}
exports.WebSocketService = WebSocketService;
// Create and export singleton instance
exports.websocketService = new WebSocketService();
//# sourceMappingURL=websocket.service.js.map