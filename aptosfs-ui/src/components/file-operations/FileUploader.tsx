import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useFileOperations } from '@/contexts/FileOperationsContext';
import ProgressBar from './ProgressBar';

interface FileUploaderProps {
  currentDirectory: string;
  onUploadComplete?: () => void;
  maxFileSize?: number; // In bytes, default: 10GB
  allowMultiple?: boolean;
  acceptedFileTypes?: string[];
  dropZoneLabel?: string;
  className?: string;
}

const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024; // 10GB

const FileUploader: React.FC<FileUploaderProps> = ({
  currentDirectory,
  onUploadComplete,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  allowMultiple = true,
  acceptedFileTypes,
  dropZoneLabel = 'Drag files here or click to upload',
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadOperations, setUploadOperations] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<string[]>([]);
  
  const { uploadFiles, getOperation } = useFileOperations();
  
  // Set up polling for operation status updates
  useEffect(() => {
    const operationIds = Object.keys(uploadOperations);
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
      
      setUploadOperations(updatedOperations);
      
      // If all operations are complete, clear the interval and notify parent
      if (allCompleted && operationIds.length > 0) {
        clearInterval(interval);
        if (onUploadComplete) {
          onUploadComplete();
        }
      }
    }, 500);
    
    return () => clearInterval(interval);
  }, [uploadOperations, getOperation, onUploadComplete]);
  
  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }, []);
  
  // Validate a file
  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize) {
      return `File "${file.name}" is too large (${(file.size / (1024 * 1024)).toFixed(2)} MB). Maximum file size is ${(maxFileSize / (1024 * 1024)).toFixed(2)} MB.`;
    }
    
    // Check file type if acceptedFileTypes is provided
    if (acceptedFileTypes && acceptedFileTypes.length > 0) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      const mimeType = file.type.toLowerCase();
      
      const isAcceptedType = acceptedFileTypes.some(type => {
        // Handle mime types
        if (type.includes('/')) {
          return mimeType === type || (type.endsWith('/*') && mimeType.startsWith(type.replace('*', '')));
        }
        // Handle extensions like .jpg
        if (type.startsWith('.')) {
          return `.${fileExtension}` === type;
        }
        return false;
      });
      
      if (!isAcceptedType) {
        return `File "${file.name}" has an unsupported format.`;
      }
    }
    
    return null;
  }, [maxFileSize, acceptedFileTypes]);
  
  // Process files for upload
  const processFiles = useCallback(async (files: File[]) => {
    const validFiles: File[] = [];
    const newErrors: string[] = [];
    
    // Validate each file
    for (const file of files) {
      const error = validateFile(file);
      if (error) {
        newErrors.push(error);
      } else {
        validFiles.push(file);
      }
    }
    
    if (newErrors.length > 0) {
      setErrors(prev => [...prev, ...newErrors]);
    }
    
    if (validFiles.length === 0) return;
    
    // Upload valid files
    try {
      const operations = await uploadFiles(validFiles, currentDirectory, {
        allowResume: true,
        onProgress: (event) => {
          // Progress is handled by polling in the useEffect
        },
        onComplete: (event) => {
          // Completion is handled by polling in the useEffect
        },
        onError: (event) => {
          setErrors(prev => [...prev, `Error uploading ${validFiles.length > 1 ? 'files' : 'file'}: ${event.error}`]);
        }
      });
      
      // Add operations to state for tracking
      const newOperations: Record<string, any> = {};
      operations.forEach(op => {
        newOperations[op.id] = op;
      });
      
      setUploadOperations(prev => ({
        ...prev,
        ...newOperations
      }));
      
    } catch (error) {
      setErrors(prev => [...prev, `Error starting upload: ${error instanceof Error ? error.message : String(error)}`]);
    }
  }, [currentDirectory, uploadFiles, validateFile]);
  
  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (!e.dataTransfer?.files || e.dataTransfer.files.length === 0) return;
    
    // Convert FileList to array
    const fileList = e.dataTransfer.files;
    const files: File[] = [];
    
    for (let i = 0; i < fileList.length; i++) {
      files.push(fileList[i]);
    }
    
    processFiles(files);
  }, [processFiles]);
  
  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    // Convert FileList to array
    const fileList = e.target.files;
    const files: File[] = [];
    
    for (let i = 0; i < fileList.length; i++) {
      files.push(fileList[i]);
    }
    
    processFiles(files);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFiles]);
  
  // Handle manual upload button click
  const handleUploadClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);
  
  // Clear error at index
  const clearError = useCallback((index: number) => {
    setErrors(prev => prev.filter((_, i) => i !== index));
  }, []);
  
  // Cancel an operation
  const cancelOperation = useCallback(async (operationId: string) => {
    const operation = getOperation(operationId);
    if (!operation) return;
    
    try {
      if (operation.type === 'upload') {
        await operation.cancel();
        setUploadOperations(prev => {
          const updated = { ...prev };
          if (updated[operationId]) {
            updated[operationId] = { ...updated[operationId], status: 'cancelled' };
          }
          return updated;
        });
      }
    } catch (error) {
      console.error('Error cancelling operation:', error);
    }
  }, [getOperation]);
  
  return (
    <div className={`file-uploader ${className}`}>
      {/* Drop zone */}
      <div
        ref={dropZoneRef}
        className={`drop-zone p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors
          ${isDragging 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-600'
          }`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleUploadClick}
      >
        <div className="flex flex-col items-center justify-center space-y-2">
          <svg 
            className={`w-12 h-12 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-sm text-gray-600 dark:text-gray-300">{dropZoneLabel}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {acceptedFileTypes 
              ? `Accepted formats: ${acceptedFileTypes.join(', ')}` 
              : 'All file types accepted'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Max size: {(maxFileSize / (1024 * 1024)).toFixed(0)} MB
          </p>
        </div>
      </div>
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={allowMultiple}
        accept={acceptedFileTypes?.join(',')}
        className="hidden"
        onChange={handleFileInputChange}
      />
      
      {/* Upload progress */}
      {Object.keys(uploadOperations).length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Uploads{' '}
            <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
              ({Object.keys(uploadOperations).length})
            </span>
          </h3>
          
          <div className="space-y-2">
            {Object.entries(uploadOperations).map(([id, operation]) => (
              <div key={id} className="flex items-center space-x-2">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm truncate max-w-xs" title={operation.file?.name}>
                      {operation.file?.name}
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
                    onClick={() => cancelOperation(id)}
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
      
      {/* Error messages */}
      {errors.length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="text-sm font-medium text-red-500 dark:text-red-400">
            Errors{' '}
            <span className="text-xs font-normal">
              ({errors.length})
            </span>
          </h3>
          
          <div className="space-y-2">
            {errors.map((error, index) => (
              <div key={index} className="flex items-start space-x-2 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                <p className="text-xs text-red-600 dark:text-red-400 flex-1">{error}</p>
                <button
                  type="button"
                  className="p-1 text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300"
                  onClick={() => clearError(index)}
                  title="Dismiss"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;