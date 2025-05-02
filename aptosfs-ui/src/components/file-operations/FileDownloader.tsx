import React, { useCallback, useState, useEffect } from 'react';
import { FileItem } from '@/types';
import { useFileOperations } from '@/contexts/FileOperationsContext';
import ProgressBar from './ProgressBar';

interface FileDownloaderProps {
  file?: FileItem;
  files?: FileItem[];
  children?: React.ReactNode;
  onDownloadComplete?: () => void;
  showProgress?: boolean;
  autoDownload?: boolean;
  saveAs?: string;
  className?: string;
}

const FileDownloader: React.FC<FileDownloaderProps> = ({
  file,
  files,
  children,
  onDownloadComplete,
  showProgress = true,
  autoDownload = false,
  saveAs,
  className = '',
}) => {
  const [downloadOperations, setDownloadOperations] = useState<Record<string, any>>({});
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { downloadFile, downloadFiles, getOperation } = useFileOperations();
  
  // Set up polling for operation status updates
  useEffect(() => {
    const operationIds = Object.keys(downloadOperations);
    if (operationIds.length === 0) return;
    
    const interval = setInterval(() => {
      const updatedOperations: Record<string, any> = {};
      let allCompleted = true;
      
      for (const id of operationIds) {
        const operation = getOperation(id);
        if (operation) {
          updatedOperations[id] = operation;
          if (operation.status !== 'completed' && operation.status !== 'error' && operation.status !== 'cancelled') {
            allCompleted = false;
          }
        }
      }
      
      setDownloadOperations(updatedOperations);
      
      // If all operations are complete, clear the interval and notify parent
      if (allCompleted && operationIds.length > 0) {
        clearInterval(interval);
        setIsDownloading(false);
        if (onDownloadComplete) {
          onDownloadComplete();
        }
      }
    }, 500);
    
    return () => clearInterval(interval);
  }, [downloadOperations, getOperation, onDownloadComplete]);
  
  // Auto-download effect
  useEffect(() => {
    if (autoDownload && !isDownloading && (file || (files && files.length > 0))) {
      handleDownload();
    }
  }, [autoDownload, file, files, isDownloading]);
  
  // Handle download action
  const handleDownload = useCallback(async () => {
    if (isDownloading) return;
    
    try {
      setIsDownloading(true);
      setError(null);
      
      let operations;
      
      if (file) {
        // Single file download
        const operation = await downloadFile(file, {
          saveAs: saveAs,
          allowResume: true,
          onProgress: (event) => {
            // Progress is handled by polling in the useEffect
          },
          onComplete: (event) => {
            // Completion is handled by polling in the useEffect
          },
          onError: (event) => {
            setError(`Error downloading ${file.name}: ${event.error}`);
            setIsDownloading(false);
          },
        });
        
        operations = [operation];
      } else if (files && files.length > 0) {
        // Multi-file download
        operations = await downloadFiles(files, {
          allowResume: true,
          onProgress: (event) => {
            // Progress is handled by polling in the useEffect
          },
          onComplete: (event) => {
            // Completion is handled by polling in the useEffect
          },
          onError: (event) => {
            setError(`Error downloading files: ${event.error}`);
            setIsDownloading(false);
          },
        });
      } else {
        setError('No file(s) specified for download');
        setIsDownloading(false);
        return;
      }
      
      // Add operations to state for tracking
      const newOperations: Record<string, any> = {};
      operations.forEach(op => {
        newOperations[op.id] = op;
      });
      
      setDownloadOperations(newOperations);
      
    } catch (error) {
      setError(`Error starting download: ${error instanceof Error ? error.message : String(error)}`);
      setIsDownloading(false);
    }
  }, [file, files, isDownloading, downloadFile, downloadFiles, saveAs]);
  
  // Cancel download
  const cancelDownload = useCallback(async (operationId: string) => {
    const operation = getOperation(operationId);
    if (!operation) return;
    
    try {
      if (operation.type === 'download') {
        // In a real implementation, we would call an API to cancel the download
        // For now, just update the UI state
        setDownloadOperations(prev => {
          const updated = { ...prev };
          if (updated[operationId]) {
            updated[operationId] = { ...updated[operationId], status: 'cancelled' };
          }
          return updated;
        });
      }
    } catch (error) {
      console.error('Error cancelling download:', error);
    }
  }, [getOperation]);
  
  // Render download button/children
  if (!showProgress || Object.keys(downloadOperations).length === 0) {
    return (
      <div 
        className={`file-downloader ${className}`}
        onClick={handleDownload}
      >
        {children || (
          <button
            type="button"
            className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={isDownloading}
          >
            {isDownloading ? 'Downloading...' : 'Download'}
          </button>
        )}
      </div>
    );
  }
  
  // Render download progress
  return (
    <div className={`file-downloader ${className}`}>
      {/* Download button/children */}
      <div onClick={handleDownload}>
        {children || (
          <button
            type="button"
            className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={isDownloading}
          >
            {isDownloading ? 'Downloading...' : 'Download'}
          </button>
        )}
      </div>
      
      {/* Download progress */}
      {showProgress && Object.keys(downloadOperations).length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Downloads{' '}
            <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
              ({Object.keys(downloadOperations).length})
            </span>
          </h3>
          
          <div className="space-y-2">
            {Object.entries(downloadOperations).map(([id, operation]) => (
              <div key={id} className="flex items-center space-x-2">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm truncate max-w-xs" title={operation.fileItem?.name}>
                      {operation.fileItem?.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {operation.status === 'completed' 
                        ? 'Complete' 
                        : operation.status === 'error' 
                          ? 'Error' 
                          : operation.status === 'cancelled' 
                            ? 'Cancelled'
                            : `${Math.round(operation.progress)}%`}
                    </span>
                  </div>
                  <ProgressBar 
                    progress={operation.progress} 
                    status={operation.status}
                  />
                </div>
                
                {/* Cancel button (only show for in-progress operations) */}
                {operation.status === 'in-progress' || operation.status === 'pending' ? (
                  <button
                    type="button"
                    className="p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                    onClick={() => cancelDownload(id)}
                    title="Cancel"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="mt-4 bg-red-50 dark:bg-red-900/20 p-2 rounded text-xs text-red-600 dark:text-red-400">
          {error}
          <button
            type="button"
            className="ml-2 text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300"
            onClick={() => setError(null)}
            title="Dismiss"
          >
            <svg className="inline-block w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default FileDownloader;