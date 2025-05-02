import React, { useState, useEffect, useCallback } from 'react';
import { FileOperationsProvider, useFileOperations } from '@/contexts/FileOperationsContext';
import { FileOperationsToolbar, FileUploader } from '@/components/file-operations';
import { FileItem, ViewMode } from '@/types';
import { GridView, ListView } from '@/components/file-view';
import { FileContextMenu } from '@/components/file-item';

/**
 * Main file explorer component that integrates file views and operations
 */
const FileExplorerContent: React.FC = () => {
  const {
    currentDirectory,
    setCurrentDirectory,
    listFiles,
    selectedItems,
    selectItem,
    deselectItem,
    selectAll,
    deselectAll,
    refreshCurrentDirectory
  } = useFileOperations();

  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [contextMenuFile, setContextMenuFile] = useState<FileItem | null>(null);

  // Load directory contents
  const loadDirectory = useCallback(async () => {
    setIsLoading(true);
    try {
      const directoryContents = await listFiles(currentDirectory);
      setFiles(directoryContents);
    } catch (error) {
      console.error('Error loading directory:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentDirectory, listFiles]);

  // Load on mount and when directory changes
  useEffect(() => {
    loadDirectory();
  }, [loadDirectory, currentDirectory]);

  // Handle file/folder double click (navigation)
  const handleDoubleClick = useCallback((item: FileItem) => {
    if (item.type === 'folder') {
      setCurrentDirectory(item.path);
    }
    // For files, would typically open a viewer or editor
  }, [setCurrentDirectory]);

  // Handle context menu
  const handleContextMenu = useCallback((event: React.MouseEvent, file: FileItem) => {
    event.preventDefault();
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
    setContextMenuFile(file);
  }, []);

  // Close context menu
  const closeContextMenu = useCallback(() => {
    setContextMenuPosition(null);
    setContextMenuFile(null);
  }, []);

  // Toggle view mode
  const toggleViewMode = useCallback(() => {
    setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
  }, []);

  // Handle operation completion (refresh directory)
  const handleOperationComplete = useCallback(() => {
    refreshCurrentDirectory();
  }, [refreshCurrentDirectory]);

  // Handle back navigation
  const navigateUp = useCallback(() => {
    if (currentDirectory === '/') return;
    
    const parentPath = currentDirectory.split('/').slice(0, -1).join('/');
    setCurrentDirectory(parentPath || '/');
  }, [currentDirectory, setCurrentDirectory]);

  return (
    <div className="flex flex-col h-full">
      {/* Header with path and tools */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-3">
        <div className="flex items-center space-x-2">
          {/* Back button */}
          <button
            onClick={navigateUp}
            disabled={currentDirectory === '/'}
            className="
              p-1.5 rounded-md text-gray-700 dark:text-gray-300
              hover:bg-gray-100 dark:hover:bg-gray-800
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            title="Navigate Up"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Path display */}
          <div className="text-sm font-medium text-gray-800 dark:text-gray-200 overflow-hidden text-ellipsis">
            {currentDirectory === '/' ? 'Home' : currentDirectory}
          </div>
        </div>

        {/* View toggle */}
        <button
          onClick={toggleViewMode}
          className="
            p-1.5 rounded-md text-gray-700 dark:text-gray-300
            hover:bg-gray-100 dark:hover:bg-gray-800
          "
          title={viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}
        >
          {viewMode === 'grid' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          )}
        </button>
      </div>

      {/* Toolbar */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-2">
        <FileOperationsToolbar onOperationComplete={handleOperationComplete} />
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-finder-blue"></div>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <GridView
                files={files}
                selectedItems={selectedItems}
                onSelect={(file, event) => event.ctrlKey || event.metaKey ? selectItem(file, true) : selectItem(file)}
                onDoubleClick={handleDoubleClick}
                onContextMenu={handleContextMenu}
              />
            ) : (
              <ListView
                files={files}
                selectedItems={selectedItems}
                onSelect={(file, event) => event.ctrlKey || event.metaKey ? selectItem(file, true) : selectItem(file)}
                onDoubleClick={handleDoubleClick}
                onContextMenu={handleContextMenu}
              />
            )}

            {files.length === 0 && (
              <div className="flex flex-col items-center justify-center h-48 text-gray-500 dark:text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg">This folder is empty</p>
                <p className="text-sm mt-1">Upload files or create a new folder</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Upload area */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3">
        <FileUploader
          compact={true}
          showDropIndicator={false}
          onUploadStart={() => {}}
          onAllUploadsComplete={handleOperationComplete}
        />
      </div>

      {/* Context menu */}
      {contextMenuPosition && contextMenuFile && (
        <FileContextMenu
          file={contextMenuFile}
          position={contextMenuPosition}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
};

/**
 * File Explorer with FileOperationsProvider wrapper
 */
const FileExplorer: React.FC = () => {
  return (
    <FileOperationsProvider>
      <div className="h-full flex flex-col bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
        <FileExplorerContent />
      </div>
    </FileOperationsProvider>
  );
};

export default FileExplorer;