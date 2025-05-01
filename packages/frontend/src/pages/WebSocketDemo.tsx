import React, { useState } from 'react';
import { socketService } from '../services/socket.service';
import { SocketNamespace, SocketEventType } from '../types/socket.types';
import DownloadProgressTracker from '../components/DownloadProgressTracker';

const WebSocketDemo: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [message, setMessage] = useState('');
  const [notificationLevel, setNotificationLevel] = useState<'info' | 'warning' | 'error'>('info');
  const [demoJobs] = useState([
    { 
      id: 'demo-job-1', 
      title: 'Example Video 1', 
      initialStatus: 'processing', 
      initialProgress: 35 
    },
    { 
      id: 'demo-job-2', 
      title: 'Example Video 2', 
      initialStatus: 'queued', 
      initialProgress: 0 
    },
    { 
      id: 'demo-job-3', 
      title: 'Example Video 3', 
      initialStatus: 'completed', 
      initialProgress: 100 
    }
  ]);
  
  // Initialize WebSocket connection
  const initializeWebSockets = () => {
    socketService.initialize({
      autoReconnect: true,
      offlineQueueing: true,
    });
    setIsInitialized(true);
  };
  
  // Disconnect WebSocket
  const disconnectWebSockets = () => {
    socketService.disconnect();
    setIsInitialized(false);
  };
  
  // Send a system notification
  const sendSystemNotification = () => {
    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }
    
    const payload = {
      level: notificationLevel,
      message: message,
      timestamp: new Date(),
      code: `DEMO-${Math.floor(Math.random() * 1000)}`,
    };
    
    socketService.emit(SocketNamespace.SYSTEM, SocketEventType.SYSTEM_NOTIFICATION, payload);
    setMessage('');
  };
  
  // Simulate download progress update
  const simulateDownloadProgress = (jobId: string) => {
    const progress = Math.min(95, Math.floor(Math.random() * 100));
    
    const payload = {
      jobId,
      videoId: `video-${jobId}`,
      status: 'processing',
      progress,
      timestamp: new Date(),
      message: `Downloading... ${progress}%`,
    };
    
    socketService.emit(SocketNamespace.DOWNLOADS, SocketEventType.DOWNLOAD_PROGRESS, payload);
  };
  
  // Simulate download status change
  const simulateDownloadStatusChange = (jobId: string, status: string) => {
    const payload = {
      jobId,
      videoId: `video-${jobId}`,
      status,
      progress: status === 'completed' ? 100 : status === 'failed' ? 0 : 50,
      timestamp: new Date(),
      message: status === 'completed' 
        ? 'Download completed successfully' 
        : status === 'failed' 
          ? 'Download failed due to network error' 
          : `Download ${status}`,
    };
    
    socketService.emit(SocketNamespace.DOWNLOADS, SocketEventType.DOWNLOAD_STATUS_CHANGED, payload);
  };
  
  // Simulate content update
  const simulateContentUpdate = (type: 'video' | 'channel' | 'playlist', action: 'created' | 'updated' | 'deleted') => {
    const id = `demo-${type}-${Math.floor(Math.random() * 1000)}`;
    
    const payload = {
      id,
      type,
      action,
      timestamp: new Date(),
      data: {
        title: `Demo ${type} ${id}`,
        description: `This is a demo ${type} that was ${action}`,
      },
    };
    
    socketService.emit(SocketNamespace.CONTENT, SocketEventType.CONTENT_UPDATED, payload);
    
    // Also send a system notification
    const notificationPayload = {
      level: 'info' as const,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} ${id} has been ${action}`,
      timestamp: new Date(),
    };
    
    socketService.emit(SocketNamespace.SYSTEM, SocketEventType.SYSTEM_NOTIFICATION, notificationPayload);
  };
  
  return (
    <div className="websocket-demo">
      <h1>WebSocket Features Demo</h1>
      
      <div className="card" style={{ 
        padding: '20px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '20px' 
      }}>
        <h2>Connection Management</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <p>
            Status: 
            <span style={{ 
              display: 'inline-block',
              marginLeft: '8px',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: isInitialized ? '#34c759' : '#ff3b30'
            }}></span>
            <span style={{ marginLeft: '5px', fontWeight: 'bold' }}>
              {isInitialized ? 'Connected' : 'Disconnected'}
            </span>
          </p>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={initializeWebSockets}
              disabled={isInitialized}
              style={{ 
                padding: '8px 16px',
                backgroundColor: isInitialized ? '#e0e0e0' : '#007aff',
                color: isInitialized ? '#999' : 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isInitialized ? 'default' : 'pointer'
              }}
            >
              Connect
            </button>
            
            <button 
              onClick={disconnectWebSockets}
              disabled={!isInitialized}
              style={{ 
                padding: '8px 16px',
                backgroundColor: !isInitialized ? '#e0e0e0' : '#ff3b30',
                color: !isInitialized ? '#999' : 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: !isInitialized ? 'default' : 'pointer'
              }}
            >
              Disconnect
            </button>
          </div>
        </div>
        
        <div style={{ marginTop: '20px', color: '#666' }}>
          <p>
            <strong>Note:</strong> You can see the connection status indicator in the bottom-right corner of the screen. 
            Click it to open the notification panel.
          </p>
        </div>
      </div>
      
      <div className="card" style={{ 
        padding: '20px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '20px' 
      }}>
        <h2>System Notifications</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Message:</label>
            <input 
              type="text" 
              value={message} 
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter notification message"
              style={{ 
                width: '100%', 
                padding: '8px', 
                borderRadius: '4px', 
                border: '1px solid #ddd' 
              }}
            />
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Level:</label>
            <select 
              value={notificationLevel}
              onChange={(e) => setNotificationLevel(e.target.value as any)}
              style={{ 
                width: '100%', 
                padding: '8px', 
                borderRadius: '4px', 
                border: '1px solid #ddd' 
              }}
            >
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>
          
          <button 
            onClick={sendSystemNotification}
            disabled={!isInitialized}
            style={{ 
              padding: '8px 16px',
              backgroundColor: !isInitialized ? '#e0e0e0' : '#007aff',
              color: !isInitialized ? '#999' : 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: !isInitialized ? 'default' : 'pointer'
            }}
          >
            Send Notification
          </button>
        </div>
        
        <div style={{ color: '#666' }}>
          <p>
            <strong>Note:</strong> Notifications will appear in the notification panel. 
            If the panel is not open, a notification indicator will appear in the bottom-right corner.
          </p>
        </div>
      </div>
      
      <div className="card" style={{ 
        padding: '20px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '20px' 
      }}>
        <h2>Download Job Progress</h2>
        
        <div>
          {demoJobs.map(job => (
            <div key={job.id} style={{ marginBottom: '20px' }}>
              <DownloadProgressTracker
                jobId={job.id}
                videoTitle={job.title}
              />
              
              <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => simulateDownloadProgress(job.id)}
                  disabled={!isInitialized}
                  style={{ 
                    padding: '8px 16px',
                    backgroundColor: !isInitialized ? '#e0e0e0' : '#007aff',
                    color: !isInitialized ? '#999' : 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: !isInitialized ? 'default' : 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Update Progress
                </button>
                
                <button 
                  onClick={() => simulateDownloadStatusChange(job.id, 'completed')}
                  disabled={!isInitialized}
                  style={{ 
                    padding: '8px 16px',
                    backgroundColor: !isInitialized ? '#e0e0e0' : '#34c759',
                    color: !isInitialized ? '#999' : 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: !isInitialized ? 'default' : 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Mark Completed
                </button>
                
                <button 
                  onClick={() => simulateDownloadStatusChange(job.id, 'failed')}
                  disabled={!isInitialized}
                  style={{ 
                    padding: '8px 16px',
                    backgroundColor: !isInitialized ? '#e0e0e0' : '#ff3b30',
                    color: !isInitialized ? '#999' : 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: !isInitialized ? 'default' : 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Mark Failed
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="card" style={{ 
        padding: '20px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '20px' 
      }}>
        <h2>Content Updates</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <h3>Videos</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button 
              onClick={() => simulateContentUpdate('video', 'created')}
              disabled={!isInitialized}
              style={{ 
                padding: '8px 16px',
                backgroundColor: !isInitialized ? '#e0e0e0' : '#007aff',
                color: !isInitialized ? '#999' : 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: !isInitialized ? 'default' : 'pointer'
              }}
            >
              Create Video
            </button>
            
            <button 
              onClick={() => simulateContentUpdate('video', 'updated')}
              disabled={!isInitialized}
              style={{ 
                padding: '8px 16px',
                backgroundColor: !isInitialized ? '#e0e0e0' : '#34c759',
                color: !isInitialized ? '#999' : 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: !isInitialized ? 'default' : 'pointer'
              }}
            >
              Update Video
            </button>
            
            <button 
              onClick={() => simulateContentUpdate('video', 'deleted')}
              disabled={!isInitialized}
              style={{ 
                padding: '8px 16px',
                backgroundColor: !isInitialized ? '#e0e0e0' : '#ff3b30',
                color: !isInitialized ? '#999' : 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: !isInitialized ? 'default' : 'pointer'
              }}
            >
              Delete Video
            </button>
          </div>
          
          <h3>Channels</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button 
              onClick={() => simulateContentUpdate('channel', 'created')}
              disabled={!isInitialized}
              style={{ 
                padding: '8px 16px',
                backgroundColor: !isInitialized ? '#e0e0e0' : '#007aff',
                color: !isInitialized ? '#999' : 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: !isInitialized ? 'default' : 'pointer'
              }}
            >
              Create Channel
            </button>
            
            <button 
              onClick={() => simulateContentUpdate('channel', 'updated')}
              disabled={!isInitialized}
              style={{ 
                padding: '8px 16px',
                backgroundColor: !isInitialized ? '#e0e0e0' : '#34c759',
                color: !isInitialized ? '#999' : 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: !isInitialized ? 'default' : 'pointer'
              }}
            >
              Update Channel
            </button>
            
            <button 
              onClick={() => simulateContentUpdate('channel', 'deleted')}
              disabled={!isInitialized}
              style={{ 
                padding: '8px 16px',
                backgroundColor: !isInitialized ? '#e0e0e0' : '#ff3b30',
                color: !isInitialized ? '#999' : 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: !isInitialized ? 'default' : 'pointer'
              }}
            >
              Delete Channel
            </button>
          </div>
          
          <h3>Playlists</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => simulateContentUpdate('playlist', 'created')}
              disabled={!isInitialized}
              style={{ 
                padding: '8px 16px',
                backgroundColor: !isInitialized ? '#e0e0e0' : '#007aff',
                color: !isInitialized ? '#999' : 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: !isInitialized ? 'default' : 'pointer'
              }}
            >
              Create Playlist
            </button>
            
            <button 
              onClick={() => simulateContentUpdate('playlist', 'updated')}
              disabled={!isInitialized}
              style={{ 
                padding: '8px 16px',
                backgroundColor: !isInitialized ? '#e0e0e0' : '#34c759',
                color: !isInitialized ? '#999' : 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: !isInitialized ? 'default' : 'pointer'
              }}
            >
              Update Playlist
            </button>
            
            <button 
              onClick={() => simulateContentUpdate('playlist', 'deleted')}
              disabled={!isInitialized}
              style={{ 
                padding: '8px 16px',
                backgroundColor: !isInitialized ? '#e0e0e0' : '#ff3b30',
                color: !isInitialized ? '#999' : 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: !isInitialized ? 'default' : 'pointer'
              }}
            >
              Delete Playlist
            </button>
          </div>
        </div>
        
        <div style={{ color: '#666' }}>
          <p>
            <strong>Note:</strong> Content update events will generate system notifications that you can see in the 
            notification panel.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WebSocketDemo;