import { renderHook, act } from '@testing-library/react';
import { useSocket, useMultipleEvents } from '../useSocket';
import { socketService } from '../../services/socket.service';
import { SocketNamespace } from '../../types/socket.types';

// Mock socket service
jest.mock('../../services/socket.service', () => ({
  initialize: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  emit: jest.fn(),
  isConnected: jest.fn(),
  disconnect: jest.fn(),
  subscribeToRoom: jest.fn()
}));

describe('useSocket Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default implementation for isConnected
    (socketService.isConnected as jest.Mock).mockReturnValue(true);
  });

  it('should subscribe to the specified event', () => {
    // Setup mock to return an unsubscribe function
    const mockUnsubscribe = jest.fn();
    (socketService.subscribe as jest.Mock).mockReturnValue(mockUnsubscribe);
    
    // Render the hook with a specific event
    const { result } = renderHook(() => useSocket({
      namespace: SocketNamespace.DOWNLOADS,
      eventName: 'download:progress',
      initialValue: null,
      enabled: true
    }));
    
    // Check if connection status was checked
    expect(socketService.isConnected).toHaveBeenCalledWith(SocketNamespace.DOWNLOADS);
    
    // Check if subscription was set up
    expect(socketService.subscribe).toHaveBeenCalledWith(
      SocketNamespace.DOWNLOADS,
      'download:progress',
      expect.any(Function)
    );
    
    // Check the returned values
    const [data, emit, isConnected, error] = result.current;
    expect(data).toBeNull();
    expect(typeof emit).toBe('function');
    expect(isConnected).toBe(true);
    expect(error).toBeNull();
  });

  it('should emit events when using the emit function', () => {
    // Setup mocks
    (socketService.emit as jest.Mock).mockReturnValue('message-id-123');
    
    // Render the hook
    const { result } = renderHook(() => useSocket({
      namespace: SocketNamespace.DOWNLOADS,
      eventName: 'download:progress'
    }));
    
    // Extract the emit function from the returned values
    const [, emit] = result.current;
    
    // Use the emit function
    const messageId = emit({ progress: 50 });
    
    // Check if the socket service's emit method was called
    expect(socketService.emit).toHaveBeenCalledWith(
      SocketNamespace.DOWNLOADS,
      'download:progress',
      { progress: 50 }
    );
    
    // Check if the message ID was returned
    expect(messageId).toBe('message-id-123');
  });

  it('should clean up subscription on unmount', () => {
    // Setup mock to return an unsubscribe function
    const mockUnsubscribe = jest.fn();
    (socketService.subscribe as jest.Mock).mockReturnValue(mockUnsubscribe);
    
    // Render the hook
    const { unmount } = renderHook(() => useSocket({
      namespace: SocketNamespace.DOWNLOADS,
      eventName: 'download:progress'
    }));
    
    // Unmount the hook to trigger cleanup
    unmount();
    
    // Check if unsubscribe was called
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('should not subscribe if enabled is false', () => {
    // Render the hook with enabled set to false
    renderHook(() => useSocket({
      namespace: SocketNamespace.DOWNLOADS,
      eventName: 'download:progress',
      enabled: false
    }));
    
    // Check that subscribe was not called
    expect(socketService.subscribe).not.toHaveBeenCalled();
  });

  it('should update event data when receiving an event', () => {
    // Create a handler capture function to access the handler passed to subscribe
    let capturedHandler: ((data: any) => void) | null = null;
    (socketService.subscribe as jest.Mock).mockImplementation((
      /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
      namespace,
      /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
      event,
      handler
    ) => {
      capturedHandler = handler;
      return jest.fn();
    });
    
    // Render the hook
    const { result } = renderHook(() => useSocket({
      namespace: SocketNamespace.DOWNLOADS,
      eventName: 'download:progress'
    }));
    
    // Initially, data should be null
    expect(result.current[0]).toBeNull();
    
    // Simulate receiving an event
    act(() => {
      if (capturedHandler) {
        capturedHandler({ progress: 75 });
      }
    });
    
    // Check that the data was updated
    expect(result.current[0]).toEqual({ progress: 75 });
  });

  it('should handle event with _messageId property', () => {
    // Create a handler capture function
    let capturedHandler: ((data: any) => void) | null = null;
    (socketService.subscribe as jest.Mock).mockImplementation((
      /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
      namespace,
      /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
      event,
      handler
    ) => {
      capturedHandler = handler;
      return jest.fn();
    });
    
    // Render the hook
    const { result } = renderHook(() => useSocket({
      namespace: SocketNamespace.DOWNLOADS,
      eventName: 'download:progress'
    }));
    
    // Simulate receiving an event with _messageId
    act(() => {
      if (capturedHandler) {
        capturedHandler({
          _messageId: 'msg123',
          progress: 50,
          speed: '1MB/s'
        });
      }
    });
    
    // Check that _messageId was removed before updating the data
    expect(result.current[0]).toEqual({
      progress: 50,
      speed: '1MB/s'
    });
    expect(result.current[0]).not.toHaveProperty('_messageId');
  });
});

describe('useMultipleEvents Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (socketService.isConnected as jest.Mock).mockReturnValue(true);
  });
  
  it('should subscribe to multiple events', () => {
    // Setup mock to return unsubscribe functions
    const mockUnsubscribe = jest.fn();
    (socketService.subscribe as jest.Mock).mockReturnValue(mockUnsubscribe);
    
    // Render the hook
    const { result } = renderHook(() => useMultipleEvents(
      SocketNamespace.DOWNLOADS,
      ['download:progress', 'download:statusChanged'],
      true
    ));
    
    // Check if connection status was checked
    expect(socketService.isConnected).toHaveBeenCalledWith(SocketNamespace.DOWNLOADS);
    
    // Check if subscriptions were set up
    expect(socketService.subscribe).toHaveBeenCalledTimes(2);
    expect(socketService.subscribe).toHaveBeenCalledWith(
      SocketNamespace.DOWNLOADS,
      'download:progress',
      expect.any(Function)
    );
    expect(socketService.subscribe).toHaveBeenCalledWith(
      SocketNamespace.DOWNLOADS,
      'download:statusChanged',
      expect.any(Function)
    );
    
    // Check the returned values
    const [data, emit, isConnected, error] = result.current;
    expect(data).toEqual({});
    expect(typeof emit).toBe('function');
    expect(isConnected).toBe(true);
    expect(error).toBeNull();
  });
  
  it('should clean up multiple subscriptions on unmount', () => {
    // Setup mock to return unsubscribe functions
    const mockUnsubscribe = jest.fn();
    (socketService.subscribe as jest.Mock).mockReturnValue(mockUnsubscribe);
    
    // Render the hook
    const { unmount } = renderHook(() => useMultipleEvents(
      SocketNamespace.DOWNLOADS,
      ['download:progress', 'download:statusChanged'],
      true
    ));
    
    // Unmount the hook
    unmount();
    
    // Check if unsubscribe was called for each event
    expect(mockUnsubscribe).toHaveBeenCalledTimes(2);
  });
  
  it('should emit events with the correct event name', () => {
    // Setup mocks
    (socketService.emit as jest.Mock).mockReturnValue('message-id-456');
    
    // Render the hook
    const { result } = renderHook(() => useMultipleEvents(
      SocketNamespace.DOWNLOADS,
      ['download:progress', 'download:statusChanged']
    ));
    
    // Extract the emit function
    const [, emit] = result.current;
    
    // Use the emit function with a specific event name
    const messageId = emit('download:progress', { progress: 75 });
    
    // Check if emit was called correctly
    expect(socketService.emit).toHaveBeenCalledWith(
      SocketNamespace.DOWNLOADS,
      'download:progress',
      { progress: 75 }
    );
    
    // Check the returned message ID
    expect(messageId).toBe('message-id-456');
  });
});