import React, { useState, useEffect } from 'react';
import { useFileOperations } from '@/contexts/FileOperationsContext';

interface ClipboardOperationsProps {
  onOperationComplete?: () => void;
  className?: string;
}

const ClipboardOperations: React.FC<ClipboardOperationsProps> = ({
  onOperationComplete,
  className = '',
}) => {
  const [clipboardState, setClipboardState] = useState<{ operationType: 'cut' | 'copy' | null, count: number }>({
    operationType: null,
    count: 0,
  });
  const [isPasting, setIsPasting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    selectedItems, 
    cutToClipboard, 
    copyToClipboard, 
    pasteFromClipboard, 
    getClipboardState,
    refreshCurrentDirectory,
    currentDirectory,
  } = useFileOperations();
  
  // Update clipboard state when it changes
  useEffect(() => {
    const state = getClipboardState();
    setClipboardState({
      operationType: state.operationType,
      count: state.items.length
    });
  }, [getClipboardState]);
  
  // Handle cut action
  const handleCut = () => {
    if (selectedItems.length === 0) {
      setError('No items selected to cut');
      return;
    }
    
    try {
      cutToClipboard(selectedItems);
      setError(null);
    } catch (error) {
      setError(`Error cutting items: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  // Handle copy action
  const handleCopy = () => {
    if (selectedItems.length === 0) {
      setError('No items selected to copy');
      return;
    }
    
    try {
      copyToClipboard(selectedItems);
      setError(null);
    } catch (error) {
      setError(`Error copying items: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  // Handle paste action
  const handlePaste = async () => {
    if (clipboardState.operationType === null || clipboardState.count === 0) {
      setError('Nothing to paste');
      return;
    }
    
    setIsPasting(true);
    setError(null);
    
    try {
      const result = await pasteFromClipboard();
      
      if (result) {
        // Refresh the current directory to show changes
        await refreshCurrentDirectory();
        
        if (onOperationComplete) {
          onOperationComplete();
        }
      }
    } catch (error) {
      setError(`Error pasting items: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsPasting(false);
    }
  };
  
  return (
    <div className={`clipboard-operations ${className}`}>
      <div className="flex items-center space-x-1">
        {/* Cut button */}
        <button
          onClick={handleCut}
          disabled={selectedItems.length === 0}
          className="
            p-2 rounded-md text-gray-700 dark:text-gray-300
            hover:bg-gray-100 dark:hover:bg-gray-800
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
          title="Cut"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
              d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" 
            />
          </svg>
        </button>
        
        {/* Copy button */}
        <button
          onClick={handleCopy}
          disabled={selectedItems.length === 0}
          className="
            p-2 rounded-md text-gray-700 dark:text-gray-300
            hover:bg-gray-100 dark:hover:bg-gray-800
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
          title="Copy"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
              d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" 
            />
          </svg>
        </button>
        
        {/* Paste button */}
        <button
          onClick={handlePaste}
          disabled={clipboardState.operationType === null || isPasting}
          className="
            p-2 rounded-md text-gray-700 dark:text-gray-300
            hover:bg-gray-100 dark:hover:bg-gray-800
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
            relative
          "
          title="Paste"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
            />
          </svg>
          
          {/* Clipboard badge */}
          {clipboardState.operationType && clipboardState.count > 0 && (
            <span className="
              absolute -top-1 -right-1 flex items-center justify-center
              w-4 h-4 text-[10px] font-bold text-white
              bg-blue-500 rounded-full
            ">
              {clipboardState.count}
            </span>
          )}
        </button>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="
          mt-2 text-xs text-red-600 dark:text-red-400 
          bg-red-50 dark:bg-red-900/20 p-1 rounded
        ">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-1 text-red-500 hover:text-red-700 dark:hover:text-red-300"
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

export default ClipboardOperations;