import React, { useEffect, useRef, useState } from 'react';
import { FileItem } from '@/types';
import { useFileOperations } from '@/contexts/FileOperationsContext';
import { FileDownloader } from '@/components/file-operations';

interface FileContextMenuProps {
  file: FileItem;
  position: { x: number; y: number };
  onClose: () => void;
}

const FileContextMenu: React.FC<FileContextMenuProps> = ({
  file,
  position,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState(position);
  const {
    cutToClipboard,
    copyToClipboard,
    renameItem,
    deleteItems,
    refreshCurrentDirectory,
    currentDirectory,
  } = useFileOperations();

  // Adjust menu position if it would go off screen
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let x = position.x;
      let y = position.y;
      
      if (x + rect.width > viewportWidth) {
        x = viewportWidth - rect.width;
      }
      
      if (y + rect.height > viewportHeight) {
        y = viewportHeight - rect.height;
      }
      
      setMenuPosition({ x, y });
    }
  }, [position]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Menu item handlers
  const handleOpen = () => {
    // For folders, we would navigate to the folder
    // For files, we would open them in appropriate viewer
    if (file.type === 'folder') {
      // Navigate to folder implementation would be here
    } else {
      // Open file implementation would be here
    }
    onClose();
  };

  const handleDownload = () => {
    // Download file using FileDownloader component
    // Actual download happens when clicking the component
    onClose();
  };

  const handleRename = () => {
    // Implementation would typically show a rename dialog
    // For simplicity, we'll just use a prompt
    const newName = prompt('Enter new name:', file.name);
    if (newName && newName !== file.name) {
      renameItem(file, newName)
        .then(result => {
          if (result) {
            refreshCurrentDirectory();
          }
        })
        .catch(error => {
          console.error('Error renaming file:', error);
        });
    }
    onClose();
  };

  const handleCut = () => {
    cutToClipboard([file]);
    onClose();
  };

  const handleCopy = () => {
    copyToClipboard([file]);
    onClose();
  };

  const handleDelete = () => {
    // Confirm before deleting
    if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
      deleteItems([file], true)
        .then(result => {
          if (result) {
            refreshCurrentDirectory();
          }
        })
        .catch(error => {
          console.error('Error deleting file:', error);
        });
    }
    onClose();
  };

  // Is file in trash?
  const isInTrash = currentDirectory.startsWith('/Trash');

  return (
    <div
      ref={menuRef}
      className="absolute shadow-lg rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
      style={{
        left: `${menuPosition.x}px`,
        top: `${menuPosition.y}px`,
      }}
    >
      <ul className="py-1">
        <li>
          <button
            onClick={handleOpen}
            className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {file.type === 'folder' ? 'Open' : 'Open'}
          </button>
        </li>
        
        {file.type !== 'folder' && (
          <li>
            <FileDownloader file={file}>
              <button className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
            </FileDownloader>
          </li>
        )}
        
        <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
        
        {!isInTrash && (
          <>
            <li>
              <button
                onClick={handleCut}
                className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                </svg>
                Cut
              </button>
            </li>
            
            <li>
              <button
                onClick={handleCopy}
                className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
                Copy
              </button>
            </li>
            
            <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
            
            <li>
              <button
                onClick={handleRename}
                className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Rename
              </button>
            </li>
          </>
        )}
        
        <li>
          <button
            onClick={handleDelete}
            className="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {isInTrash ? 'Delete Permanently' : 'Move to Trash'}
          </button>
        </li>
      </ul>
    </div>
  );
};

export default FileContextMenu;