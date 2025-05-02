import React, { useState } from 'react';
import { FileItem } from '@/types';
import FileIcon from './FileIcon';

interface FolderItemProps {
  folder: FileItem;
  selected: boolean;
  onSelect: (file: FileItem, event: React.MouseEvent) => void;
  onOpen: (folder: FileItem) => void;
  onContextMenu?: (event: React.MouseEvent, folder: FileItem) => void;
  onDragStart?: (event: React.DragEvent, folder: FileItem) => void;
  onDrop?: (event: React.DragEvent, targetFolder: FileItem) => void;
  view: 'grid' | 'list';
  size?: 'small' | 'medium' | 'large';
}

const FolderItem: React.FC<FolderItemProps> = ({
  folder,
  selected,
  onSelect,
  onOpen,
  onContextMenu,
  onDragStart,
  onDrop,
  view,
  size = 'medium',
}) => {
  const [isOver, setIsOver] = useState(false);
  
  // Handle drop events for folder
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    
    if (!isOver) {
      setIsOver(true);
    }
  };
  
  const handleDragLeave = () => {
    setIsOver(false);
  };
  
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsOver(false);
    
    if (onDrop) {
      onDrop(event, folder);
    }
  };
  
  const handleDragStart = (event: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(event, folder);
    }
  };
  
  // Get size classes based on prop
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return view === 'grid' 
          ? 'w-10 h-10' 
          : 'w-4 h-4';
      case 'large':
        return view === 'grid'
          ? 'w-20 h-20'
          : 'w-8 h-8';
      case 'medium':
      default:
        return view === 'grid'
          ? 'w-16 h-16'
          : 'w-6 h-6';
    }
  };

  // Handle double click to open folder
  const handleDoubleClick = () => {
    onOpen(folder);
  };

  if (view === 'grid') {
    return (
      <div
        className={`folder-item flex flex-col items-center justify-center p-2 rounded cursor-pointer transition-all duration-150
          ${selected 
            ? 'bg-finder-blue/20 dark:bg-finder-blue/30 ring-2 ring-finder-blue' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }
          ${isOver ? 'bg-finder-blue/10 dark:bg-finder-blue/20 scale-105' : ''}
        `}
        onClick={(e) => onSelect(folder, e)}
        onContextMenu={(e) => onContextMenu && onContextMenu(e, folder)}
        onDoubleClick={handleDoubleClick}
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="relative mb-2 group">
          <div className={`flex items-center justify-center ${getSizeClasses()}`}>
            <FileIcon 
              fileType="folder" 
              size={size} 
            />
          </div>
          
          {/* Status indicators */}
          {folder.starred && (
            <div className="absolute top-0 right-0 -mr-2 -mt-2">
              <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          )}
          
          {folder.shared && (
            <div className="absolute bottom-0 right-0 -mr-2 -mb-2">
              <svg className="h-4 w-4 text-finder-blue" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>
          )}
          
          {/* Hover effect for drag target */}
          {isOver && (
            <div className="absolute inset-0 border-2 border-finder-blue/50 rounded-md animate-pulse"></div>
          )}
        </div>
        
        <div className="text-center w-full px-1">
          <div
            className={`truncate max-w-full ${
              size === 'small' ? 'text-xs max-w-[64px]' :
              size === 'large' ? 'text-sm max-w-[120px]' : 'text-xs max-w-[80px]'
            }`}
          >
            {folder.name}
          </div>
        </div>
      </div>
    );
  } else {
    // List view layout
    return (
      <div 
        className={`grid grid-cols-12 gap-4 px-4 py-2 cursor-pointer text-sm border-b border-gray-100 dark:border-gray-800 
          ${selected 
            ? 'bg-finder-blue/20 dark:bg-finder-blue/30' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }
          ${isOver ? 'bg-finder-blue/10 dark:bg-finder-blue/20' : ''}
        `}
        onClick={(e) => onSelect(folder, e)}
        onContextMenu={(e) => onContextMenu && onContextMenu(e, folder)}
        onDoubleClick={handleDoubleClick}
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="col-span-6 flex items-center overflow-hidden">
          <div className="flex-shrink-0 mr-2 relative">
            <FileIcon fileType="folder" size={size} />
            {isOver && (
              <div className="absolute inset-0 border-2 border-finder-blue/50 rounded-md animate-pulse"></div>
            )}
          </div>
          
          <span className="truncate">
            {folder.name}
          </span>
          
          {folder.starred && (
            <svg className="ml-2 h-4 w-4 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          )}
          
          {folder.shared && (
            <svg className="ml-2 h-4 w-4 text-finder-blue flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
          )}
        </div>
        
        <div className="col-span-2 text-right text-gray-500 dark:text-gray-400">
          —
        </div>
        
        <div className="col-span-2 text-gray-500 dark:text-gray-400 capitalize">
          Folder
        </div>
        
        <div className="col-span-2 text-right text-gray-500 dark:text-gray-400">
          {folder.modified.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </div>
      </div>
    );
  }
};

export default FolderItem;