import { io, Socket, ManagerOptions, SocketOptions } from 'socket.io-client';
import { SocketEventType, SocketNamespace } from '../types/socket.types';

/**
 * Reconnection strategy configuration
 */
interface ReconnectionConfig {
  reconnectionAttempts: number;
  reconnectionDelay: number;
  reconnectionDelayMax: number;
  randomizationFactor: number;
}

/**
 * Default reconnection configuration with exponential backoff
 */
const DEFAULT_RECONNECTION_CONFIG: ReconnectionConfig = {
  reconnectionAttempts: 10,
  reconnectionDelay: 1000, // Start with 1s delay
  reconnectionDelayMax: 30000, // Max 30s delay
  randomizationFactor: 0.5, // Add randomization to prevent connection storms
};

/**
 * Queue item for offline messages
 */
interface QueuedMessage {
  id: string;
  namespace: SocketNamespace;
  event: string;
  payload: any;
  timestamp: Date;
  attempts: number;
}

/**
 * Message handler callback function type
 */
type MessageHandler = (payload: any) => void;

/**
 * Socket connection options
 */
interface SocketConnectionOptions {
  token?: string;
  reconnectionConfig?: Partial<ReconnectionConfig>;
  autoReconnect?: boolean;
  offlineQueueing?: boolean;
}

/**
 * Socket.IO client service for handling real-time communication
 */
export class SocketService {
  private sockets: Map<SocketNamespace, Socket> = new Map();
  private messageQueue: QueuedMessage[] = [];
  private eventHandlers: Map<string, Set<MessageHandler>> = new Map();
  private reconnecting: boolean = false;
  private reconnectionConfig: ReconnectionConfig;
  private connected: boolean = false;
  private offlineQueueing: boolean = true;
  private autoReconnect: boolean = true;
  private reconnectionTimer: number | null = null;
  private token?: string;
  
  constructor() {
    this.reconnectionConfig = { ...DEFAULT_RECONNECTION_CONFIG };
    
    // Load queued messages from local storage
    this.loadQueuedMessages();
    
    // Handle online/offline browser events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
      
      // Check initial connection state
      if (navigator.onLine) {
        this.handleOnline();
      } else {
        this.handleOffline();
      }
    }
  }
  
  /**
   * Initialize connection to WebSocket server
   * @param options Connection options
   */
  public initialize(options?: SocketConnectionOptions): void {
    // Store connection options
    this.token = options?.token;
    this.autoReconnect = options?.autoReconnect ?? true;
    this.offlineQueueing = options?.offlineQueueing ?? true;
    
    // Apply custom reconnection configuration if provided
    if (options?.reconnectionConfig) {
      this.reconnectionConfig = {
        ...this.reconnectionConfig,
        ...options.reconnectionConfig,
      };
    }
    
    // Connect to namespaces
    this.connectToNamespace(SocketNamespace.CONTENT);
    this.connectToNamespace(SocketNamespace.DOWNLOADS);
    this.connectToNamespace(SocketNamespace.USERS);
    this.connectToNamespace(SocketNamespace.SYSTEM);
    
    console.log('Socket service initialized');
  }
  
  /**
   * Connect to a specific Socket.IO namespace
   * @param namespace The namespace to connect to
   */
  private connectToNamespace(namespace: SocketNamespace): void {
    // Basic connection options
    const socketOptions: Partial<ManagerOptions & SocketOptions> = {
      autoConnect: true,
      reconnection: this.autoReconnect,
      reconnectionAttempts: this.reconnectionConfig.reconnectionAttempts,
      reconnectionDelay: this.reconnectionConfig.reconnectionDelay,
      reconnectionDelayMax: this.reconnectionConfig.reconnectionDelayMax,
      randomizationFactor: this.reconnectionConfig.randomizationFactor,
      timeout: 10000,
      forceNew: false,
    };
    
    // Auth options if token is available
    if (this.token) {
      socketOptions.auth = { token: this.token };
    }
    
    // Create socket for namespace
    const socket = io(`${window.location.origin}${namespace}`, socketOptions);
    
    // Set up event listeners
    this.setupSocketEventListeners(socket, namespace);
    
    // Store socket in map
    this.sockets.set(namespace, socket);
    
    console.log(`Connected to namespace: ${namespace}`);
  }
  
  /**
   * Set up basic event listeners for a socket
   * @param socket The socket to configure
   * @param namespace The namespace of the socket
   */
  private setupSocketEventListeners(socket: Socket, namespace: SocketNamespace): void {
    // Connection events
    socket.on('connect', () => {
      console.log(`Socket connected to ${namespace}`);
      this.connected = true;
      
      // Process any queued messages for this namespace
      if (this.messageQueue.length > 0) {
        this.processQueue(namespace);
      }
    });
    
    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected from ${namespace}: ${reason}`);
      this.connected = false;
      
      // Handle reconnection if disconnected
      if (this.autoReconnect && !this.reconnecting) {
        this.handleReconnection(namespace);
      }
    });
    
    socket.on('connect_error', (error) => {
      console.error(`Connection error to ${namespace}:`, error);
      
      // Handle reconnection
      if (this.autoReconnect && !this.reconnecting) {
        this.handleReconnection(namespace);
      }
    });
    
    // Handle message acknowledgments
    socket.on(SocketEventType.RECEIVED, (messageId: string) => {
      console.log(`Message ${messageId} was received by the server`);
    });
    
    // Set up fallback handler for any event
    socket.onAny((event, ...args) => {
      // Find any registered handlers for this event
      const handlers = this.eventHandlers.get(`${namespace}:${event}`);
      if (handlers) {
        handlers.forEach(handler => handler(args[0]));
      }
      
      console.log(`Received event ${event} on ${namespace}:`, args[0]);
      
      // If the message has an ID, acknowledge it
      if (args[0]?._messageId) {
        socket.emit(SocketEventType.ACK, args[0]._messageId);
      }
    });
  }
  
  /**
   * Subscribe to events from a specific namespace
   * @param namespace The namespace to subscribe to
   * @param event The event type to subscribe to
   * @param handler The handler function for the event
   * @returns A function to unsubscribe
   */
  public subscribe(namespace: SocketNamespace, event: string, handler: MessageHandler): () => void {
    const key = `${namespace}:${event}`;
    
    // Create handler set if it doesn't exist
    if (!this.eventHandlers.has(key)) {
      this.eventHandlers.set(key, new Set());
    }
    
    // Add handler to set
    this.eventHandlers.get(key)?.add(handler);
    
    console.log(`Subscribed to ${event} on ${namespace}`);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(key);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.eventHandlers.delete(key);
        }
      }
    };
  }
  
  /**
   * Emit an event to a specific namespace
   * @param namespace The namespace to emit to
   * @param event The event type to emit
   * @param payload The payload to send
   * @returns Generated message ID
   */
  public emit(namespace: SocketNamespace, event: string, payload: any): string {
    // Generate a unique message ID
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Add message ID to payload
    const messagePayload = {
      ...payload,
      _messageId: messageId,
    };
    
    // Get socket for namespace
    const socket = this.sockets.get(namespace);
    
    // If connected, emit immediately
    if (socket?.connected) {
      socket.emit(event, messagePayload);
      console.log(`Emitted ${event} to ${namespace}:`, payload);
    }
    // Otherwise, queue message if offlineQueueing is enabled
    else if (this.offlineQueueing) {
      this.queueMessage(namespace, event, payload, messageId);
    }
    
    return messageId;
  }
  
  /**
   * Subscribe to a specific room (e.g., channel, playlist, download job)
   * @param namespace The namespace to subscribe in
   * @param roomType The type of room
   * @param roomId The ID of the room
   */
  public subscribeToRoom(namespace: SocketNamespace, roomType: string, roomId: string): void {
    const socket = this.sockets.get(namespace);
    if (socket?.connected) {
      socket.emit(`subscribe:${roomType}`, roomId);
      console.log(`Subscribed to ${roomType} ${roomId} in ${namespace}`);
    }
  }
  
  /**
   * Queue a message for later sending when reconnected
   * @param namespace The target namespace
   * @param event The event type
   * @param payload The message payload
   * @param messageId The generated message ID
   */
  private queueMessage(namespace: SocketNamespace, event: string, payload: any, messageId: string): void {
    // Create queue item
    const queueItem: QueuedMessage = {
      id: messageId,
      namespace,
      event,
      payload,
      timestamp: new Date(),
      attempts: 0,
    };
    
    // Add to queue
    this.messageQueue.push(queueItem);
    
    // Save queue to localStorage
    this.saveQueuedMessages();
    
    console.log(`Message queued for ${namespace}:${event}`, payload);
  }
  
  /**
   * Process queued messages for a namespace
   * @param namespace The namespace to process messages for
   */
  private processQueue(namespace: SocketNamespace): void {
    // Get socket for namespace
    const socket = this.sockets.get(namespace);
    if (!socket?.connected) return;
    
    // Find messages for this namespace
    const messages = this.messageQueue.filter(msg => msg.namespace === namespace);
    if (messages.length === 0) return;
    
    console.log(`Processing ${messages.length} queued messages for ${namespace}`);
    
    // Send messages
    messages.forEach(msg => {
      socket.emit(msg.event, {
        ...msg.payload,
        _messageId: msg.id,
      });
      
      // Remove from queue
      this.messageQueue = this.messageQueue.filter(m => m.id !== msg.id);
    });
    
    // Save updated queue
    this.saveQueuedMessages();
  }
  
  /**
   * Save queued messages to localStorage
   */
  private saveQueuedMessages(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('socket_message_queue', JSON.stringify(this.messageQueue));
    } catch (error) {
      console.error('Failed to save queued messages to localStorage:', error);
    }
  }
  
  /**
   * Load queued messages from localStorage
   */
  private loadQueuedMessages(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const saved = localStorage.getItem('socket_message_queue');
      if (saved) {
        this.messageQueue = JSON.parse(saved);
        console.log(`Loaded ${this.messageQueue.length} queued messages from localStorage`);
      }
    } catch (error) {
      console.error('Failed to load queued messages from localStorage:', error);
    }
  }
  
  /**
   * Handle browser going online
   */
  private handleOnline = (): void => {
    console.log('Browser is online, reconnecting sockets');
    this.reconnecting = false;
    
    // Reconnect all sockets
    this.sockets.forEach((socket, namespace) => {
      if (!socket.connected) {
        socket.connect();
      }
    });
    
    // Clear any pending reconnection timer
    if (this.reconnectionTimer !== null) {
      window.clearTimeout(this.reconnectionTimer);
      this.reconnectionTimer = null;
    }
  };
  
  /**
   * Handle browser going offline
   */
  private handleOffline = (): void => {
    console.log('Browser is offline, disconnecting sockets');
    
    // Disconnect all sockets
    this.sockets.forEach(socket => {
      socket.disconnect();
    });
    
    this.connected = false;
  };
  
  /**
   * Handle reconnection with exponential backoff
   * @param namespace The namespace to reconnect
   * @param attempt Current attempt number
   */
  private handleReconnection(namespace: SocketNamespace, attempt: number = 0): void {
    if (attempt >= this.reconnectionConfig.reconnectionAttempts) {
      console.log(`Max reconnection attempts (${this.reconnectionConfig.reconnectionAttempts}) reached for ${namespace}`);
      return;
    }
    
    this.reconnecting = true;
    
    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.reconnectionConfig.reconnectionDelay * Math.pow(2, attempt) * (1 + this.reconnectionConfig.randomizationFactor * Math.random()),
      this.reconnectionConfig.reconnectionDelayMax
    );
    
    console.log(`Attempting to reconnect to ${namespace} in ${delay}ms (attempt ${attempt + 1}/${this.reconnectionConfig.reconnectionAttempts})`);
    
    // Set timer for reconnection
    this.reconnectionTimer = window.setTimeout(() => {
      const socket = this.sockets.get(namespace);
      if (socket) {
        // Try to reconnect
        socket.connect();
        
        // Check if connection successful
        if (!socket.connected) {
          this.handleReconnection(namespace, attempt + 1);
        } else {
          this.reconnecting = false;
          this.reconnectionTimer = null;
        }
      }
    }, delay);
  }
  
  /**
   * Disconnect all sockets and clean up
   */
  public disconnect(): void {
    // Disconnect all sockets
    this.sockets.forEach(socket => {
      socket.disconnect();
    });
    
    // Clear event handlers
    this.eventHandlers.clear();
    
    // Clear sockets
    this.sockets.clear();
    
    // Clear reconnection timer
    if (this.reconnectionTimer !== null && typeof window !== 'undefined') {
      window.clearTimeout(this.reconnectionTimer);
      this.reconnectionTimer = null;
    }
    
    // Remove event listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    
    console.log('Socket service disconnected');
  }
  
  /**
   * Check if connected to a specific namespace
   * @param namespace The namespace to check
   * @returns True if connected, false otherwise
   */
  public isConnected(namespace?: SocketNamespace): boolean {
    if (namespace) {
      return this.sockets.get(namespace)?.connected ?? false;
    }
    return this.connected;
  }
  
  /**
   * Get socket instance for a namespace
   * @param namespace The namespace to get socket for
   * @returns The Socket instance or undefined if not found
   */
  public getSocket(namespace: SocketNamespace): Socket | undefined {
    return this.sockets.get(namespace);
  }
}

// Create and export singleton instance
export const socketService = new SocketService();