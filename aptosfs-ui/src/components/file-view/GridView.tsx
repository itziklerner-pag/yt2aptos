import React, { useState, useRef, useEffect } from 'react';
import { FileItem, FileSort } from '@/types';
import FileIcon from '../file-item/FileIcon';
import FileContextMenu from '../file-item/FileContextMenu';
import { useFileView, FileViewBaseProps } from './FileViewBase';

interface GridViewProps extends FileViewBaseProps {
  gridSize?: 'small' | 'medium' | 'large';
}

const GridView: React.FC<GridViewProps> = ({
  files,
  sort,
  onSortChange,
  onFileOpen,
  onSelectionChange,
  gridSize = 'medium',
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [contextMenuFile, setContextMenuFile] = useState<FileItem | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  
  // Use the base file view logic
  const {
    selectedFiles,
    sortedFiles,
    handleFileSelect,
    handleKeyDown,
  } = useFileView({
    files,
    sort,
    onSortChange,
    onFileOpen,
    onSelectionChange,
  });

  // Set up keyboard event listener for the grid
  useEffect(() => {
    const currentRef = gridRef.current;
    if (currentRef) {
      currentRef.focus();
    }
  }, []);

  // Handle right click to show context menu
  const handleContextMenu = (e: React.MouseEvent, file: FileItem) => {
    e.preventDefault();
    setContextMenuFile(file);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    handleFileSelect(file, e);
  };

  // Handle closing the context menu
  const handleCloseContextMenu = () => {
    setContextMenuFile(null);
    setContextMenuPosition(null);
  };

  // Handle double click on file/folder
  const handleDoubleClick = (file: FileItem) => {
    if (onFileOpen) {
      onFileOpen(file);
    }
  };

  // Determine grid column size based on gridSize prop
  const getGridColsClass = () => {
    switch (gridSize) {
      case 'small':
        return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12';
      case 'large':
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6';
      case 'medium':
      default:
        return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8';
    }
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, file: FileItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(file));
    e.dataTransfer.effectAllowed = 'move';
    
    // If the file being dragged is not already selected, select only this file
    if (!selectedFiles.has(file.id)) {
      handleFileSelect(file);
    }
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent, targetFile?: FileItem) => {
    e.preventDefault();
    
    try {
      const fileData = e.dataTransfer.getData('application/json');
      
      if (fileData) {
        const draggedFile = JSON.parse(fileData) as FileItem;
        
        if (targetFile) {
          // Only handle drops on folders
          if (targetFile.type === 'folder') {
            console.log(`Moving ${draggedFile.name} to ${targetFile.path}`);
            // This would trigger a move operation in a real implementation
          }
        } else {
          // Drop on the empty space (current directory)
          console.log(`Moving ${draggedFile.name} to current directory`);
          // This would trigger a move operation in a real implementation
        }
      }
    } catch (error) {
      console.error('Error processing drag and drop:', error);
    }
  };

  return (
    <div 
      ref={gridRef}
      className={`grid-view p-4 grid ${getGridColsClass()} gap-4`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e)}
    >
      {sortedFiles.map((file) => (
        <div
          key={file.id}
          className={`file-item flex flex-col items-center justify-center p-2 rounded cursor-pointer transition-all duration-150
            ${selectedFiles.has(file.id) 
              ? 'bg-finder-blue/20 dark:bg-finder-blue/30 ring-2 ring-finder-blue' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          onClick={(e) => handleFileSelect(file, e)}
          onContextMenu={(e) => handleContextMenu(e, file)}
          onDoubleClick={() => handleDoubleClick(file)}
          draggable
          onDragStart={(e) => handleDragStart(e, file)}
          onDrop={(e) => file.type === 'folder' ? handleDrop(e, file) : undefined}
        >
          <div className="relative mb-2 group">
            {file.thumbnail && file.type === 'image' ? (
              <img
                src={file.thumbnail}
                alt={file.name}
                className={`object-cover rounded ${
                  gridSize === 'small' ? 'w-12 h-12' :
                  gridSize === 'large' ? 'w-24 h-24' : 'w-16 h-16'
                }`}
              />
            ) : (
              <div className={`flex items-center justify-center ${
                gridSize === 'small' ? 'w-12 h-12' :
                gridSize === 'large' ? 'w-24 h-24' : 'w-16 h-16'
              }`}>
                <FileIcon 
                  fileType={file.type} 
                  size={gridSize === 'small' ? 'small' : gridSize === 'large' ? 'large' : 'medium'} 
                />
              </div>
            )}
            
            {file.starred && (
              <div className="absolute top-0 right-0 -mr-2 -mt-2">
                <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            )}
            
            {file.shared && (
              <div className="absolute bottom-0 right-0 -mr-2 -mb-2">
                <svg className="h-4 w-4 text-finder-blue" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
            )}
            
            {/* Quick action buttons (visible on hover) */}
            <div className="absolute top-0 left-0 w-full h-full bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-white/5 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-full shadow-md p-1 transform scale-90 group-hover:scale-100 transition-transform">
                {file.type !== 'folder' && (
                  <button 
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Quick Look"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log(`Quick Look ${file.name}`);
                    }}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                )}
                <button 
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="More options"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContextMenu(e, file);
                  }}
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <div className="text-center w-full">
            <div className={`truncate max-w-full ${
              gridSize === 'small' ? 'text-xs max-w-[64px]' :
              gridSize === 'large' ? 'text-sm max-w-[120px]' : 'text-xs max-w-[80px]'
            }`}>
              {file.name}
            </div>
          </div>
        </div>
      ))}
      
      {/* Context menu */}
      {contextMenuFile && contextMenuPosition && (
        <FileContextMenu
          file={contextMenuFile}
          position={contextMenuPosition}
          onClose={handleCloseContextMenu}
          selectedFiles={Array.from(selectedFiles).length > 1 
            ? sortedFiles.filter(f => selectedFiles.has(f.id))
            : [contextMenuFile]}
        />
      )}
    </div>
  );
};

export default GridView;