import { useEffect, useState, useCallback, useRef } from 'react';
import { socketService } from '../services/socket.service';
import { SocketNamespace } from '../types/socket.types';

/**
 * Hook parameters for useSocket
 */
interface UseSocketParams {
  namespace: SocketNamespace;
  eventName: string;
  initialValue?: any;
  enabled?: boolean;
}

/**
 * Custom hook for subscribing to socket events
 * 
 * @param params - Hook parameters
 * @returns [eventData, emit, isConnected, error]
 *   - eventData: The latest event data received
 *   - emit: Function to emit events to the server
 *   - isConnected: Whether the socket is connected
 *   - error: Any connection error
 */
export function useSocket<T = any, E = any>({
  namespace,
  eventName,
  initialValue = null,
  enabled = true
}: UseSocketParams): [T | null, (payload: E) => string, boolean, Error | null] {
  // State for event data, connection status and errors
  const [eventData, setEventData] = useState<T | null>(initialValue);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Use ref to hold unsubscribe function
  const unsubscribeRef = useRef<(() => void) | null>(null);
  
  // Check connection status on mount and when namespace changes
  useEffect(() => {
    const checkConnection = () => {
      const connected = socketService.isConnected(namespace);
      setIsConnected(connected);
    };
    
    // Initial check
    checkConnection();
    
    // Setup interval to periodically check connection
    const intervalId = setInterval(checkConnection, 5000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [namespace]);
  
  // Subscribe to the event when component mounts
  useEffect(() => {
    if (!enabled) return;
    
    try {
      // Clean up previous subscription if exists
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      
      // Subscribe to event
      const handler = (data: T) => {
        // Remove internal message ID before setting data
        if (data && typeof data === 'object' && '_messageId' in data) {
          const { _messageId, ...restData } = data as any;
          setEventData(restData as T);
        } else {
          setEventData(data);
        }
      };
      
      // Store unsubscribe function
      unsubscribeRef.current = socketService.subscribe(namespace, eventName, handler);
      
      // Check initial connection state
      setIsConnected(socketService.isConnected(namespace));
      
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
    
    // Cleanup subscription when component unmounts or params change
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [namespace, eventName, enabled]);
  
  // Function to emit events
  const emit = useCallback((payload: E): string => {
    return socketService.emit(namespace, eventName, payload);
  }, [namespace, eventName]);
  
  return [eventData, emit, isConnected, error];
}

/**
 * Hook for subscribing to multiple socket events
 * 
 * @param namespace The socket namespace to use
 * @param events Array of event names to subscribe to
 * @returns [eventsData, emit, isConnected, error]
 */
export function useMultipleEvents<T = Record<string, any>, E = any>(
  namespace: SocketNamespace,
  events: string[],
  enabled = true
): [T, (eventName: string, payload: E) => string, boolean, Error | null] {
  // State for all events data
  const [eventsData, setEventsData] = useState<T>({} as T);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Store unsubscribe functions
  const unsubscribeRefs = useRef<Map<string, () => void>>(new Map());
  
  // Check connection status
  useEffect(() => {
    const checkConnection = () => {
      const connected = socketService.isConnected(namespace);
      setIsConnected(connected);
    };
    
    // Initial check
    checkConnection();
    
    // Setup interval to check connection
    const intervalId = setInterval(checkConnection, 5000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [namespace]);
  
  // Subscribe to events
  useEffect(() => {
    if (!enabled) return;
    
    try {
      // Clean up previous subscriptions
      unsubscribeRefs.current.forEach(unsub => unsub());
      unsubscribeRefs.current.clear();
      
      // Subscribe to each event
      events.forEach(eventName => {
        const handler = (data: any) => {
          // Remove internal message ID before setting data
          if (data && typeof data === 'object' && '_messageId' in data) {
            const { _messageId, ...restData } = data;
            setEventsData(prev => ({ ...prev, [eventName]: restData }));
          } else {
            setEventsData(prev => ({ ...prev, [eventName]: data }));
          }
        };
        
        // Store unsubscribe function
        const unsubscribe = socketService.subscribe(namespace, eventName, handler);
        unsubscribeRefs.current.set(eventName, unsubscribe);
      });
      
      // Check connection state
      setIsConnected(socketService.isConnected(namespace));
      
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
    
    // Cleanup subscriptions
    return () => {
      unsubscribeRefs.current.forEach(unsub => unsub());
      unsubscribeRefs.current.clear();
    };
  }, [namespace, JSON.stringify(events), enabled]);
  
  // Function to emit events
  const emit = useCallback((eventName: string, payload: E): string => {
    return socketService.emit(namespace, eventName, payload);
  }, [namespace]);
  
  return [eventsData, emit, isConnected, error];
}

/**
 * Hook for subscribing to real-time download job updates
 * 
 * @param jobId The download job ID to monitor
 * @returns [jobData, isConnected, error]
 */
export function useDownloadJobUpdates(jobId: string, enabled = true) {
  const [subscribed, setSubscribed] = useState(false);
  
  // Subscribe to the job's specific room when the component mounts
  useEffect(() => {
    if (!enabled || !jobId) return;
    
    try {
      // Subscribe to the job's room
      socketService.subscribeToRoom(SocketNamespace.DOWNLOADS, 'job', jobId);
      setSubscribed(true);
    } catch (err) {
      console.error('Failed to subscribe to download job updates:', err);
    }
  }, [jobId, enabled]);
  
  // Use the multi-event hook to listen for all job-related events
  const [jobData, emit, isConnected, error] = useMultipleEvents(
    SocketNamespace.DOWNLOADS,
    [
      'download:updated',
      'download:statusChanged',
      'download:progress'
    ],
    enabled && subscribed
  );
  
  return [jobData, isConnected, error];
}

/**
 * Hook for subscribing to content updates (channels, playlists, videos)
 * 
 * @param contentType The type of content ('channel', 'playlist', 'video')
 * @param contentId The content ID to monitor
 * @returns [contentData, isConnected, error]
 */
export function useContentUpdates(contentType: 'channel' | 'playlist' | 'video', contentId: string, enabled = true) {
  const [subscribed, setSubscribed] = useState(false);
  
  // Subscribe to the content's specific room when the component mounts
  useEffect(() => {
    if (!enabled || !contentId) return;
    
    try {
      // Subscribe to the content's room
      socketService.subscribeToRoom(SocketNamespace.CONTENT, contentType, contentId);
      setSubscribed(true);
    } catch (err) {
      console.error(`Failed to subscribe to ${contentType} updates:`, err);
    }
  }, [contentType, contentId, enabled]);
  
  // Use the multi-event hook to listen for all content-related events
  const [contentData, emit, isConnected, error] = useMultipleEvents(
    SocketNamespace.CONTENT,
    [
      'content:updated',
      'content:created',
      'content:deleted'
    ],
    enabled && subscribed
  );
  
  return [contentData, isConnected, error];
}

/**
 * Hook for system-wide notifications
 * 
 * @returns [notifications, isConnected, error]
 */
export function useSystemNotifications(enabled = true) {
  // Use the socket hook to listen for system notifications
  const [notifications, emit, isConnected, error] = useSocket({
    namespace: SocketNamespace.SYSTEM,
    eventName: 'system:notification',
    enabled
  });
  
  return [notifications, isConnected, error];
}