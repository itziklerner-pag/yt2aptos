import React, { useEffect, useState } from 'react';
import { useDownloadJobUpdates } from '../hooks/useSocket';

// Define the interface for download job data
interface DownloadJobData {
  'download:statusChanged'?: {
    status: string;
    message?: string;
  };
  'download:progress'?: {
    progress: number;
  };
  'download:updated'?: {
    status?: string;
    progress?: number;
    message?: string;
  };
}

interface DownloadProgressTrackerProps {
  jobId: string;
  videoTitle?: string;
  onComplete?: () => void;
}

const DownloadProgressTracker: React.FC<DownloadProgressTrackerProps> = ({
  jobId,
  videoTitle = 'Video',
  onComplete
}) => {
  const [jobData, isConnected, error] = useDownloadJobUpdates(jobId);
  const typedJobData = jobData as DownloadJobData | null;
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<string>('queued');
  const [message, setMessage] = useState<string>('');
  
  // Update progress and status when job data changes
  useEffect(() => {
    if (typedJobData && typeof typedJobData === 'object') {
      // Handle status updates
      if (typedJobData['download:statusChanged']) {
        setStatus(typedJobData['download:statusChanged'].status);
        
        if (typedJobData['download:statusChanged'].message) {
          setMessage(typedJobData['download:statusChanged'].message);
        }
        
        // Call onComplete callback when download is completed
        if (typedJobData['download:statusChanged'].status === 'completed' && onComplete) {
          onComplete();
        }
      }
      
      // Handle progress updates
      if (typedJobData['download:progress']) {
        setProgress(typedJobData['download:progress'].progress);
      }
      
      // Handle general updates
      if (typedJobData['download:updated']) {
        if (typeof typedJobData['download:updated'].progress === 'number') {
          setProgress(typedJobData['download:updated'].progress);
        }
        if (typedJobData['download:updated'].status) {
          setStatus(typedJobData['download:updated'].status);
        }
        if (typedJobData['download:updated'].message) {
          setMessage(typedJobData['download:updated'].message);
        }
      }
    }
  }, [jobData, onComplete]);
  
  // Get status color
  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return '#34c759'; // Green
      case 'processing':
        return '#007aff'; // Blue
      case 'failed':
        return '#ff3b30'; // Red
      case 'paused':
        return '#ff9500'; // Orange
      case 'canceled':
        return '#8e8e93'; // Gray
      default:
        return '#5856d6'; // Purple (queued)
    }
  };
  
  // Get status label
  const getStatusLabel = () => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'processing':
        return 'Downloading';
      case 'failed':
        return 'Failed';
      case 'paused':
        return 'Paused';
      case 'canceled':
        return 'Canceled';
      default:
        return 'Queued';
    }
  };
  
  // Format the download progress
  const getFormattedProgress = () => {
    if (status === 'completed') return '100%';
    if (status === 'failed' || status === 'canceled') return '--';
    return `${Math.round(progress)}%`;
  };
  
  return (
    <div className="download-progress-tracker" style={{ margin: '10px 0', padding: '15px', borderRadius: '8px', backgroundColor: '#f8f8f8', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 500 }}>{videoTitle}</h3>
        <span style={{ 
          display: 'inline-block',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 'bold',
          backgroundColor: getStatusColor(),
          color: 'white'
        }}>
          {getStatusLabel()}
        </span>
      </div>
      
      {/* Progress bar */}
      <div style={{ 
        width: '100%', 
        height: '8px', 
        backgroundColor: '#e0e0e0', 
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div style={{ 
          width: `${progress}%`, 
          height: '100%', 
          backgroundColor: getStatusColor(),
          borderRadius: '4px',
          transition: 'width 0.3s ease-in-out'
        }} />
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '14px' }}>
        <span style={{ color: '#666' }}>
          {status === 'processing' ? 'Downloading...' : getStatusLabel()}
        </span>
        <span style={{ fontWeight: 'bold' }}>{getFormattedProgress()}</span>
      </div>
      
      {/* Status message */}
      {message && (
        <div style={{ marginTop: '8px', fontSize: '13px', color: '#666' }}>
          {message}
        </div>
      )}
      
      {/* Connection status */}
      {!isConnected && (
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#ff3b30' }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff3b30', marginRight: '5px' }} />
          Not receiving real-time updates
        </div>
      )}
      
      {/* Error message */}
      {error && typeof error === 'object' && 'message' in error && (
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#ff3b30' }}>
          Error: {(error as Error).message}
        </div>
      )}
    </div>
  );
};

export default DownloadProgressTracker;