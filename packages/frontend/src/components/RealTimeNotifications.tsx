import React, { useEffect, useState } from 'react';
import { socketService } from '../services/socket.service';
import { useSystemNotifications } from '../hooks/useSocket';
// Types are imported but not directly used in this file
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { SocketNamespace } from '../types/socket.types';

interface Notification {
  id: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  timestamp: Date;
  read: boolean;
}

interface RealTimeNotificationsProps {
  maxNotifications?: number;
  autoHideDelay?: number;
}

const RealTimeNotifications: React.FC<RealTimeNotificationsProps> = ({
  maxNotifications = 5,
  autoHideDelay = 5000
}) => {
  // State for notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  
  // Use our custom hook for system notifications
  const [systemNotification, isConnected, error] = useSystemNotifications();
  
  // Initialize socket connection
  useEffect(() => {
    // Initialize socket service
    socketService.initialize({
      autoReconnect: true,
      offlineQueueing: true,
    });
    
    // Clean up on unmount
    return () => {
      socketService.disconnect();
    };
  }, []);
  
  // Handle new system notifications
  useEffect(() => {
    if (systemNotification) {
      const newNotification: Notification = {
        id: `notification_${Date.now()}`,
        level: systemNotification.level || 'info',
        message: systemNotification.message,
        timestamp: new Date(systemNotification.timestamp),
        read: false
      };
      
      // Add new notification to the list
      setNotifications(prev => {
        // Add to the beginning and limit to maxNotifications
        const updatedNotifications = [newNotification, ...prev].slice(0, maxNotifications);
        return updatedNotifications;
      });
      
      // Show notifications panel
      setIsVisible(true);
      
      // Auto-hide after delay if needed
      if (autoHideDelay > 0) {
        setTimeout(() => {
          setIsVisible(false);
        }, autoHideDelay);
      }
    }
  }, [systemNotification, maxNotifications, autoHideDelay]);
  
  // Mark a notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
  };
  
  // Remove a notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    
    // Hide panel if no notifications left
    if (notifications.length <= 1) {
      setIsVisible(false);
    }
  };
  
  // Toggle visibility of notifications panel
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };
  
  // Get connection status indicator color
  const getConnectionStatusColor = () => {
    if (error) return '#ff3b30'; // Red for error
    if (isConnected) return '#34c759'; // Green for connected
    return '#ff9500'; // Orange for disconnected
  };
  
  return (
    <div className="real-time-notifications">
      {/* Connection status indicator */}
      <div 
        className="connection-status" 
        style={{ 
          position: 'fixed', 
          bottom: '20px', 
          right: '20px',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: getConnectionStatusColor(),
          cursor: 'pointer',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          zIndex: 1000
        }}
        onClick={toggleVisibility}
        title={error ? 'Connection error' : isConnected ? 'Connected' : 'Disconnected'}
      />
      
      {/* Notifications panel */}
      {isVisible && (
        <div 
          className="notifications-panel"
          style={{
            position: 'fixed',
            bottom: '40px',
            right: '20px',
            width: '300px',
            maxHeight: '400px',
            overflowY: 'auto',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 999,
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Notifications</h3>
            <button 
              onClick={() => setIsVisible(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              &times;
            </button>
          </div>
          
          {notifications.length === 0 ? (
            <div style={{ padding: '10px', textAlign: 'center', color: '#888' }}>
              No notifications
            </div>
          ) : (
            notifications.map(notification => (
              <div 
                key={notification.id} 
                className={`notification notification-${notification.level}`}
                style={{
                  padding: '10px',
                  borderRadius: '4px',
                  backgroundColor: notification.read ? '#f8f8f8' : 
                    notification.level === 'error' ? '#ffeeee' : 
                    notification.level === 'warning' ? '#fff9e6' : 
                    '#e6f7ff',
                  opacity: notification.read ? 0.7 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  fontSize: '14px'
                }}
                onClick={() => markAsRead(notification.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ 
                    fontWeight: 'bold',
                    color: notification.level === 'error' ? '#cc0000' : 
                      notification.level === 'warning' ? '#cc8800' : 
                      '#0066cc'
                  }}>
                    {notification.level.charAt(0).toUpperCase() + notification.level.slice(1)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(notification.id);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#888',
                      padding: '0 4px'
                    }}
                  >
                    &times;
                  </button>
                </div>
                <div style={{ margin: '4px 0' }}>{notification.message}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  {notification.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default RealTimeNotifications;