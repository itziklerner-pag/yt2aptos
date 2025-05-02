import React, { useState } from 'react';
import { useFileOperations } from '@/contexts/FileOperationsContext';
import ClipboardOperations from './ClipboardOperations';
import CreateFileFolder from './CreateFileFolder';
import { FileItem } from '@/types';

interface FileOperationsToolbarProps {
  onOperationComplete?: () => void;
  className?: string;
}

const FileOperationsToolbar: React.FC<FileOperationsToolbarProps> = ({
  onOperationComplete,
  className = '',
}) => {
  const { 
    selectedItems, 
    deleteItems,
    undo,
    redo,
    canUndo,
    canRedo,
    refreshCurrentDirectory,
    currentDirectory
  } = useFileOperations();
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createDialogType, setCreateDialogType] = useState<'file' | 'folder'>('folder');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Open create dialog
  const openCreateDialog = (type: 'file' | 'folder') => {
    setCreateDialogType(type);
    setCreateDialogOpen(true);
  };
  
  // Handle create success
  const handleCreateSuccess = (name: string, isFolder: boolean) => {
    setCreateDialogOpen(false);
    setStatusMessage({
      text: `${isFolder ? 'Folder' : 'File'} "${name}" created successfully`,
      type: 'success'
    });
    
    if (onOperationComplete) {
      onOperationComplete();
    }
    
    // Clear status message after 3 seconds
    setTimeout(() => {
      setStatusMessage(null);
    }, 3000);
  };
  
  // Open delete confirmation dialog
  const openDeleteDialog = () => {
    if (selectedItems.length === 0) {
      setStatusMessage({
        text: 'No items selected for deletion',
        type: 'error'
      });
      return;
    }
    
    setDeleteDialogOpen(true);
  };
  
  // Perform delete operation
  const confirmDelete = async () => {
    setIsProcessing(true);
    
    try {
      const result = await deleteItems(selectedItems, true); // Move to trash
      
      if (result) {
        setStatusMessage({
          text: `${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''} moved to trash`,
          type: 'success'
        });
        
        if (onOperationComplete) {
          onOperationComplete();
        }
      } else {
        setStatusMessage({
          text: 'Failed to delete selected items',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Delete error:', error);
      setStatusMessage({
        text: 'An error occurred during deletion',
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
      setDeleteDialogOpen(false);
      
      // Clear status message after 3 seconds
      setTimeout(() => {
        setStatusMessage(null);
      }, 3000);
    }
  };
  
  // Perform permanent delete operation
  const confirmPermanentDelete = async () => {
    setIsProcessing(true);
    
    try {
      const result = await deleteItems(selectedItems, false); // Permanent delete
      
      if (result) {
        setStatusMessage({
          text: `${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''} permanently deleted`,
          type: 'success'
        });
        
        if (onOperationComplete) {
          onOperationComplete();
        }
      } else {
        setStatusMessage({
          text: 'Failed to delete selected items',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Delete error:', error);
      setStatusMessage({
        text: 'An error occurred during deletion',
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
      setDeleteDialogOpen(false);
      
      // Clear status message after 3 seconds
      setTimeout(() => {
        setStatusMessage(null);
      }, 3000);
    }
  };
  
  // Handle undo action
  const handleUndo = async () => {
    if (!canUndo) return;
    
    setIsProcessing(true);
    
    try {
      const result = await undo();
      
      if (result) {
        setStatusMessage({
          text: 'Undo successful',
          type: 'success'
        });
        
        if (onOperationComplete) {
          onOperationComplete();
        }
      } else {
        setStatusMessage({
          text: 'Failed to undo last action',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Undo error:', error);
      setStatusMessage({
        text: 'An error occurred during undo',
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
      
      // Clear status message after 3 seconds
      setTimeout(() => {
        setStatusMessage(null);
      }, 3000);
    }
  };
  
  // Handle redo action
  const handleRedo = async () => {
    if (!canRedo) return;
    
    setIsProcessing(true);
    
    try {
      const result = await redo();
      
      if (result) {
        setStatusMessage({
          text: 'Redo successful',
          type: 'success'
        });
        
        if (onOperationComplete) {
          onOperationComplete();
        }
      } else {
        setStatusMessage({
          text: 'Failed to redo last action',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Redo error:', error);
      setStatusMessage({
        text: 'An error occurred during redo',
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
      
      // Clear status message after 3 seconds
      setTimeout(() => {
        setStatusMessage(null);
      }, 3000);
    }
  };
  
  // Handle refresh action
  const handleRefresh = async () => {
    setIsProcessing(true);
    
    try {
      await refreshCurrentDirectory();
      
      setStatusMessage({
        text: 'Refreshed directory',
        type: 'success'
      });
    } catch (error) {
      console.error('Refresh error:', error);
      setStatusMessage({
        text: 'An error occurred during refresh',
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
      
      // Clear status message after 3 seconds
      setTimeout(() => {
        setStatusMessage(null);
      }, 3000);
    }
  };
  
  // Check if we're in trash directory
  const isTrashDirectory = currentDirectory === '/Trash';
  
  return (
    <div className={`file-operations-toolbar ${className}`}>
      <div className="flex flex-wrap items-center space-x-2">
        {/* New Folder button */}
        <button
          onClick={() => openCreateDialog('folder')}
          disabled={isTrashDirectory || isProcessing}
          className="
            p-2 rounded-md text-gray-700 dark:text-gray-300
            hover:bg-gray-100 dark:hover:bg-gray-800
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors flex items-center
          "
          title="New Folder"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
              d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" 
            />
          </svg>
        </button>
        
        {/* New File button */}
        <button
          onClick={() => openCreateDialog('file')}
          disabled={isTrashDirectory || isProcessing}
          className="
            p-2 rounded-md text-gray-700 dark:text-gray-300
            hover:bg-gray-100 dark:hover:bg-gray-800
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors flex items-center
          "
          title="New File"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
              d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
        </button>
        
        {/* Separator */}
        <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-1"></div>
        
        {/* Clipboard operations */}
        <ClipboardOperations 
          onOperationComplete={onOperationComplete}
        />
        
        {/* Separator */}
        <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-1"></div>
        
        {/* Delete button */}
        <button
          onClick={openDeleteDialog}
          disabled={selectedItems.length === 0 || isProcessing}
          className="
            p-2 rounded-md text-gray-700 dark:text-gray-300
            hover:bg-gray-100 dark:hover:bg-gray-800
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
          title="Delete"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
            />
          </svg>
        </button>
        
        {/* Separator */}
        <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-1"></div>
        
        {/* Undo button */}
        <button
          onClick={handleUndo}
          disabled={!canUndo || isProcessing}
          className="
            p-2 rounded-md text-gray-700 dark:text-gray-300
            hover:bg-gray-100 dark:hover:bg-gray-800
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
          title="Undo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
              d="M3 10h10a4 4 0 0 1 0 8H9m-6-8l4-4m0 0L3 2m4 4H3" 
            />
          </svg>
        </button>
        
        {/* Redo button */}
        <button
          onClick={handleRedo}
          disabled={!canRedo || isProcessing}
          className="
            p-2 rounded-md text-gray-700 dark:text-gray-300
            hover:bg-gray-100 dark:hover:bg-gray-800
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
          title="Redo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
              d="M21 10H11a4 4 0 0 0 0 8h4m6-8l-4-4m0 0l4-4m-4 4h4" 
            />
          </svg>
        </button>
        
        {/* Refresh button */}
        <button
          onClick={handleRefresh}
          disabled={isProcessing}
          className="
            p-2 rounded-md text-gray-700 dark:text-gray-300
            hover:bg-gray-100 dark:hover:bg-gray-800
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
          title="Refresh"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
        </button>
      </div>
      
      {/* Status message */}
      {statusMessage && (
        <div className={`
          mt-2 px-3 py-1 text-sm rounded
          ${statusMessage.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : ''}
          ${statusMessage.type === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : ''}
          ${statusMessage.type === 'info' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : ''}
        `}>
          {statusMessage.text}
        </div>
      )}
      
      {/* Create dialog */}
      {createDialogOpen && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="min-h-screen px-4 text-center">
            <div className="fixed inset-0 bg-black bg-opacity-30" aria-hidden="true" onClick={() => setCreateDialogOpen(false)}></div>
            
            <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
                Create New {createDialogType === 'folder' ? 'Folder' : 'File'}
              </h3>
              
              <div className="mt-4">
                <CreateFileFolder
                  defaultIsFolder={createDialogType === 'folder'}
                  onSuccess={handleCreateSuccess}
                  onCancel={() => setCreateDialogOpen(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete confirmation dialog */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="min-h-screen px-4 text-center">
            <div className="fixed inset-0 bg-black bg-opacity-30" aria-hidden="true" onClick={() => !isProcessing && setDeleteDialogOpen(false)}></div>
            
            <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
                Confirm Delete
              </h3>
              
              <div className="mt-2">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Are you sure you want to delete 
                  {selectedItems.length === 1 
                    ? ` "${selectedItems[0].name}"` 
                    : ` ${selectedItems.length} items`
                  }?
                </p>
                
                {/* List items if more than one and less than 5 */}
                {selectedItems.length > 1 && selectedItems.length < 6 && (
                  <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300 list-disc list-inside">
                    {selectedItems.map(item => (
                      <li key={item.id}>{item.name}</li>
                    ))}
                  </ul>
                )}
                
                {/* Show count if more than 5 */}
                {selectedItems.length >= 6 && (
                  <p className="mt-2 text-sm italic text-gray-500 dark:text-gray-400">
                    {selectedItems.length} items selected for deletion
                  </p>
                )}
                
                {/* Warning about folders */}
                {selectedItems.some(item => item.type === 'folder') && (
                  <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                    Warning: This will delete folders and all their contents.
                  </p>
                )}
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="
                    px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200
                    bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600
                    rounded shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600
                    focus:outline-none focus:ring-2 focus:ring-finder-blue
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                  onClick={() => setDeleteDialogOpen(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                
                {isTrashDirectory && (
                  <button
                    type="button"
                    className="
                      px-3 py-1.5 text-sm font-medium text-white
                      bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800
                      rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500
                      disabled:opacity-50 disabled:cursor-not-allowed
                      flex items-center
                    "
                    onClick={confirmPermanentDelete}
                    disabled={isProcessing}
                  >
                    {isProcessing && (
                      <svg className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    Delete Permanently
                  </button>
                )}
                
                {!isTrashDirectory && (
                  <button
                    type="button"
                    className="
                      px-3 py-1.5 text-sm font-medium text-white
                      bg-finder-blue hover:bg-finder-blue-dark
                      rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-finder-blue
                      disabled:opacity-50 disabled:cursor-not-allowed
                      flex items-center
                    "
                    onClick={confirmDelete}
                    disabled={isProcessing}
                  >
                    {isProcessing && (
                      <svg className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    Move to Trash
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileOperationsToolbar;