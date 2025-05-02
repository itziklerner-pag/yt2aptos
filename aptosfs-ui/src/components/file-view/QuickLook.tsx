import React, { useState, useEffect, useRef } from 'react';
import { FileItem, FileType } from '@/types';

interface QuickLookProps {
  file: FileItem | null;
  files?: FileItem[];
  onClose: () => void;
  onNavigateNext?: () => void;
  onNavigatePrev?: () => void;
}

const QuickLook: React.FC<QuickLookProps> = ({
  file,
  files = [],
  onClose,
  onNavigateNext,
  onNavigatePrev,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Effects for handling animations and keyboard navigation
  useEffect(() => {
    if (file) {
      // Small delay to trigger the animation
      setTimeout(() => {
        setIsVisible(true);
      }, 50);
      
      // Reset loading state when file changes
      setIsLoading(true);
      setError(null);
      
      // Simulate loading content
      const loadingTimer = setTimeout(() => {
        setIsLoading(false);
      }, 800);
      
      return () => {
        clearTimeout(loadingTimer);
      };
    }
  }, [file]);
  
  // Handle keyboard events for navigation and closing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowRight' && onNavigateNext) {
        onNavigateNext();
      } else if (e.key === 'ArrowLeft' && onNavigatePrev) {
        onNavigatePrev();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onNavigateNext, onNavigatePrev]);
  
  // Handle closing with animation
  const handleClose = () => {
    setIsVisible(false);
    
    // Wait for animation to complete before removing from DOM
    setTimeout(() => {
      onClose();
    }, 300);
  };
  
  // Handle click outside to close
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      handleClose();
    }
  };
  
  // If no file is provided, don't render anything
  if (!file) return null;
  
  // Render preview based on file type
  const renderPreview = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-finder-blue"></div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-red-500 dark:text-red-400 p-8">
          <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-center font-medium">{error}</p>
        </div>
      );
    }
    
    switch (file.type) {
      case 'image':
        return (
          <div className="flex items-center justify-center h-full">
            <img 
              src={file.thumbnail || file.path} 
              alt={file.name} 
              className="max-h-full max-w-full object-contain"
              onError={() => setError("Failed to load image")}
            />
          </div>
        );
        
      case 'video':
        return (
          <div className="flex items-center justify-center h-full">
            <video 
              className="max-h-full max-w-full" 
              controls 
              autoPlay 
              src={file.path}
              onError={() => setError("Failed to load video")}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        );
        
      case 'audio':
        return (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
            </div>
            
            <p className="text-lg font-medium mb-4">{file.name}</p>
            
            <audio 
              className="w-full max-w-md" 
              controls 
              src={file.path}
              onError={() => setError("Failed to load audio")}
            >
              Your browser does not support the audio tag.
            </audio>
          </div>
        );
        
      case 'pdf':
        return (
          <div className="flex items-center justify-center h-full">
            <iframe 
              src={`${file.path}#toolbar=0`}
              className="w-full h-full"
              title={file.name}
              onError={() => setError("Failed to load PDF")}
            />
          </div>
        );
        
      case 'code':
        return (
          <div className="h-full w-full overflow-auto bg-gray-100 dark:bg-gray-800 p-4">
            <pre className="text-sm font-mono">
              <code>
                {/* In a real app, you would fetch and display the file content */}
                {`// ${file.name}\n// Code preview would be shown here`}
              </code>
            </pre>
          </div>
        );
        
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="w-24 h-24 mb-4">
              <FileTypeIcon type={file.type} />
            </div>
            <p className="text-lg font-medium mb-2">{file.name}</p>
            <p className="text-gray-500 dark:text-gray-400 text-center">
              Preview not available for this file type.
            </p>
            <button 
              className="mt-4 px-4 py-2 bg-finder-blue text-white rounded-md hover:bg-finder-blue-dark transition-colors"
              onClick={() => {
                console.log(`Opening ${file.name} with default application`);
                // In a real app, this would open the file with its default application
              }}
            >
              Open with Default App
            </button>
          </div>
        );
    }
  };
  
  // Navigation buttons
  const renderNavigationButtons = () => {
    const hasMultipleFiles = files.length > 1;
    
    if (!hasMultipleFiles) return null;
    
    return (
      <>
        <button 
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
          onClick={onNavigatePrev}
          disabled={!onNavigatePrev}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <button 
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
          onClick={onNavigateNext}
          disabled={!onNavigateNext}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </>
    );
  };
  
  return (
    <div 
      ref={overlayRef}
      className={`fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleOverlayClick}
    >
      {/* Content container with animation */}
      <div 
        ref={contentRef}
        className={`bg-white dark:bg-gray-900 rounded-lg shadow-xl overflow-hidden max-w-5xl max-h-[90vh] w-[90%] transition-all duration-300 ${
          isVisible ? 'opacity-100 transform scale-100' : 'opacity-0 transform scale-95'
        }`}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 truncate">
            {file.name}
          </h3>
          <button 
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
            onClick={handleClose}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Preview content */}
        <div className="h-[calc(90vh-60px)]">
          {renderPreview()}
        </div>
        
        {/* Navigation controls */}
        {renderNavigationButtons()}
      </div>
    </div>
  );
};

// Helper component for file type icons
const FileTypeIcon: React.FC<{ type: FileType }> = ({ type }) => {
  const getColorForType = () => {
    switch (type) {
      case 'folder':
        return 'text-blue-500';
      case 'image':
        return 'text-green-500';
      case 'video':
        return 'text-purple-500';
      case 'audio':
        return 'text-pink-500';
      case 'document':
        return 'text-orange-500';
      case 'pdf':
        return 'text-red-500';
      case 'archive':
        return 'text-yellow-500';
      case 'code':
        return 'text-indigo-500';
      default:
        return 'text-gray-500';
    }
  };
  
  return (
    <div className={`w-full h-full flex items-center justify-center ${getColorForType()}`}>
      {type === 'folder' && (
        <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
        </svg>
      )}
      
      {type === 'image' && (
        <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      )}
      
      {type === 'video' && (
        <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          <path d="M14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
        </svg>
      )}
      
      {type === 'audio' && (
        <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
        </svg>
      )}
      
      {type === 'document' && (
        <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      )}
      
      {type === 'pdf' && (
        <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          <path fillRule="evenodd" d="M8 11a1 1 0 00-1 1v2a1 1 0 002 0v-2a1 1 0 00-1-1zm2-5a1 1 0 00-1 1v6a1 1 0 002 0V7a1 1 0 00-1-1zm2 3a1 1 0 00-1 1v4a1 1 0 002 0v-4a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      )}
      
      {type === 'archive' && (
        <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
          <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      )}
      
      {type === 'code' && (
        <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      )}
      
      {type === 'unknown' && (
        <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      )}
    </div>
  );
};

export default QuickLook;