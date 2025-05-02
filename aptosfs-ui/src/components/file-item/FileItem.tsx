import React, { useState, useRef, useEffect } from 'react';
import { FileItem as FileItemType } from '@/types';
import FileIcon from './FileIcon';

interface FileItemProps {
  file: FileItemType;
  selected: boolean;
  onSelect: (file: FileItemType, event: React.MouseEvent) => void;
  onDoubleClick?: (file: FileItemType) => void;
  onContextMenu?: (event: React.MouseEvent, file: FileItemType) => void;
  onRename?: (file: FileItemType, newName: string) => void;
  onDragStart?: (event: React.DragEvent, file: FileItemType) => void;
  view: 'grid' | 'list';
  showThumbnail?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const FileItem: React.FC<FileItemProps> = ({
  file,
  selected,
  onSelect,
  onDoubleClick,
  onContextMenu,
  onRename,
  onDragStart,
  view,
  showThumbnail = true,
  size = 'medium',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(file.name);
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  // Handle edit mode when user wants to rename the file
  useEffect(() => {
    if (isEditing && nameInputRef.current) {
      nameInputRef.current.focus();
      
      // Select file name without extension for easier editing
      const lastDotIndex = file.name.lastIndexOf('.');
      if (lastDotIndex > 0 && file.type !== 'folder') {
        nameInputRef.current.setSelectionRange(0, lastDotIndex);
      } else {
        nameInputRef.current.select();
      }
    }
  }, [isEditing, file.name, file.type]);
  
  // Handle file dragging
  const handleDragStart = (event: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(event, file);
    }
  };
  
  // Handle rename operations
  const startRename = () => {
    if (onRename) {
      setIsEditing(true);
    }
  };
  
  const cancelRename = () => {
    setEditName(file.name);
    setIsEditing(false);
  };
  
  const confirmRename = () => {
    if (onRename && editName.trim() !== '' && editName !== file.name) {
      onRename(file, editName);
    }
    setIsEditing(false);
  };
  
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      confirmRename();
    } else if (event.key === 'Escape') {
      cancelRename();
    }
  };

  // Format size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '—';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  };
  
  // Determine if we should show a thumbnail for this file
  const showFileThumb = showThumbnail && 
    file.type === 'image' && 
    file.thumbnail && 
    view === 'grid';

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

  // Render different layouts based on view type
  if (view === 'grid') {
    return (
      <div
        className={`file-item flex flex-col items-center justify-center p-2 rounded cursor-pointer transition-all duration-150
          ${selected 
            ? 'bg-finder-blue/20 dark:bg-finder-blue/30 ring-2 ring-finder-blue' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        onClick={(e) => onSelect(file, e)}
        onContextMenu={(e) => onContextMenu && onContextMenu(e, file)}
        onDoubleClick={() => onDoubleClick && onDoubleClick(file)}
        draggable
        onDragStart={handleDragStart}
      >
        <div className="relative mb-2 group">
          {showFileThumb ? (
            <img
              src={file.thumbnail}
              alt={file.name}
              className={`object-cover rounded ${getSizeClasses()}`}
            />
          ) : (
            <div className={`flex items-center justify-center ${getSizeClasses()}`}>
              <FileIcon 
                fileType={file.type} 
                size={size} 
              />
            </div>
          )}
          
          {/* Status indicators */}
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
        </div>
        
        {/* File name (editable or static) */}
        <div className="text-center w-full px-1">
          {isEditing ? (
            <input
              ref={nameInputRef}
              type="text"
              className="w-full text-center bg-white dark:bg-gray-800 border border-finder-blue rounded px-1 py-0.5 text-xs focus:outline-none"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={confirmRename}
              onKeyDown={handleKeyDown}
            />
          ) : (
            <div
              className={`truncate max-w-full ${
                size === 'small' ? 'text-xs max-w-[64px]' :
                size === 'large' ? 'text-sm max-w-[120px]' : 'text-xs max-w-[80px]'
              }`}
              onDoubleClick={startRename}
            >
              {file.name}
            </div>
          )}
        </div>
      </div>
    );
  } else {
    // List view layout
    return (
      <div 
        className={`grid grid-cols-12 gap-4 px-4 py-2 cursor-pointer text-sm border-b border-gray-100 dark:border-gray-800 ${
          selected 
            ? 'bg-finder-blue/20 dark:bg-finder-blue/30' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        onClick={(e) => onSelect(file, e)}
        onContextMenu={(e) => onContextMenu && onContextMenu(e, file)}
        onDoubleClick={() => onDoubleClick && onDoubleClick(file)}
        draggable
        onDragStart={handleDragStart}
      >
        <div className="col-span-6 flex items-center overflow-hidden">
          <div className="flex-shrink-0 mr-2">
            <FileIcon fileType={file.type} size={size} />
          </div>
          
          {/* File name (editable or static) */}
          {isEditing ? (
            <input
              ref={nameInputRef}
              type="text"
              className="flex-1 bg-white dark:bg-gray-800 border border-finder-blue rounded px-1 py-0.5 text-sm focus:outline-none"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={confirmRename}
              onKeyDown={handleKeyDown}
            />
          ) : (
            <span className="truncate" onDoubleClick={startRename}>
              {file.name}
            </span>
          )}
          
          {file.starred && (
            <svg className="ml-2 h-4 w-4 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          )}
          
          {file.shared && (
            <svg className="ml-2 h-4 w-4 text-finder-blue flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
          )}
        </div>
        
        <div className="col-span-2 text-right text-gray-500 dark:text-gray-400">
          {formatFileSize(file.size)}
        </div>
        
        <div className="col-span-2 text-gray-500 dark:text-gray-400 capitalize">
          {file.type}
        </div>
        
        <div className="col-span-2 text-right text-gray-500 dark:text-gray-400">
          {file.modified.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </div>
      </div>
    );
  }
};

export default FileItem;