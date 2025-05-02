import React, { useState, useEffect, useCallback, KeyboardEvent } from 'react';
import { FileItem, FileSort, SortDirection, SortField } from '@/types';

// Props that both GridView and ListView will need
export interface FileViewBaseProps {
  files: FileItem[];
  sort: FileSort;
  onSortChange?: (sort: FileSort) => void;
  onFileOpen?: (file: FileItem) => void;
  onSelectionChange?: (selectedFiles: FileItem[]) => void;
}

// State shared between file views
export interface FileViewState {
  selectedFiles: Set<string>;
  sortedFiles: FileItem[];
  filterText: string;
  lastClickedFile: string | null;
  isCtrlPressed: boolean;
  isShiftPressed: boolean;
}

// Custom hook for file view functionality
export const useFileView = ({ 
  files, 
  sort,
  onSortChange,
  onSelectionChange
}: FileViewBaseProps) => {
  // Selection state
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [lastClickedFile, setLastClickedFile] = useState<string | null>(null);
  
  // Keyboard modifier tracking
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  
  // Filter state
  const [filterText, setFilterText] = useState('');
  
  // Sort and filter files
  const sortedFiles = React.useMemo(() => {
    // First filter the files if there's filter text
    const filtered = filterText
      ? files.filter(file => 
          file.name.toLowerCase().includes(filterText.toLowerCase()))
      : files;
    
    // Then sort the filtered files
    return [...filtered].sort((a, b) => {
      let result = 0;
      
      // Always sort folders before files
      if (a.type === 'folder' && b.type !== 'folder') {
        return -1;
      } else if (a.type !== 'folder' && b.type === 'folder') {
        return 1;
      }
      
      // Then apply the selected sort
      switch (sort.field) {
        case 'name':
          result = a.name.localeCompare(b.name);
          break;
        case 'size':
          result = a.size - b.size;
          break;
        case 'type':
          result = a.type.localeCompare(b.type);
          break;
        case 'created':
          result = a.created.getTime() - b.created.getTime();
          break;
        case 'modified':
          result = a.modified.getTime() - b.modified.getTime();
          break;
        case 'owner':
          if (a.owner && b.owner) {
            result = a.owner.localeCompare(b.owner);
          }
          break;
      }
      
      // Apply sort direction
      return sort.direction === 'asc' ? result : -result;
    });
  }, [files, sort, filterText]);

  // Notify parent of selection changes
  useEffect(() => {
    if (onSelectionChange) {
      const selectedItems = sortedFiles.filter(file => selectedFiles.has(file.id));
      onSelectionChange(selectedItems);
    }
  }, [selectedFiles, sortedFiles, onSelectionChange]);

  // Handle keyboard event listeners
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        setIsCtrlPressed(true);
      } else if (e.key === 'Shift') {
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        setIsCtrlPressed(false);
      } else if (e.key === 'Shift') {
        setIsShiftPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Handle sorting
  const handleSort = useCallback((field: SortField) => {
    if (onSortChange) {
      // If clicking the same field, toggle direction
      const direction: SortDirection = 
        sort.field === field && sort.direction === 'asc' ? 'desc' : 'asc';
      onSortChange({ field, direction });
    }
  }, [sort, onSortChange]);

  // Handle file selection
  const handleFileSelect = useCallback((file: FileItem, event?: React.MouseEvent) => {
    // Get the natural index of this file
    const fileIndex = sortedFiles.findIndex(f => f.id === file.id);
    
    setSelectedFiles(prev => {
      const newSelection = new Set(prev);
      
      // Handle different selection modes
      if (event?.ctrlKey || event?.metaKey || isCtrlPressed) {
        // Toggle this file's selection
        if (newSelection.has(file.id)) {
          newSelection.delete(file.id);
        } else {
          newSelection.add(file.id);
        }
      } else if (event?.shiftKey || isShiftPressed) {
        // Range selection from last clicked to current
        if (lastClickedFile) {
          const lastIndex = sortedFiles.findIndex(f => f.id === lastClickedFile);
          
          if (lastIndex !== -1) {
            // Clear previous selection
            newSelection.clear();
            
            // Select everything between lastIndex and fileIndex
            const start = Math.min(lastIndex, fileIndex);
            const end = Math.max(lastIndex, fileIndex);
            
            for (let i = start; i <= end; i++) {
              newSelection.add(sortedFiles[i].id);
            }
          }
        } else {
          // No last clicked file, just select this one
          newSelection.clear();
          newSelection.add(file.id);
        }
      } else {
        // Regular click - clear selection and select just this file
        newSelection.clear();
        newSelection.add(file.id);
      }
      
      return newSelection;
    });
    
    // Update last clicked file
    setLastClickedFile(file.id);
  }, [sortedFiles, lastClickedFile, isCtrlPressed, isShiftPressed]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!sortedFiles.length) return;
    
    // Find the currently selected file's index
    let currentIndex = -1;
    
    if (selectedFiles.size === 1) {
      // Get the first (and only) selected file
      const selectedFileId = Array.from(selectedFiles)[0];
      currentIndex = sortedFiles.findIndex(file => file.id === selectedFileId);
    } else if (lastClickedFile) {
      // Use the last clicked file as reference
      currentIndex = sortedFiles.findIndex(file => file.id === lastClickedFile);
    }
    
    // If no file is selected or found, use the first file
    if (currentIndex === -1) currentIndex = 0;
    
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        if (currentIndex > 0) {
          handleFileSelect(sortedFiles[currentIndex - 1], event as unknown as React.MouseEvent);
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (currentIndex < sortedFiles.length - 1) {
          handleFileSelect(sortedFiles[currentIndex + 1], event as unknown as React.MouseEvent);
        }
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (currentIndex > 0) {
          handleFileSelect(sortedFiles[currentIndex - 1], event as unknown as React.MouseEvent);
        }
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (currentIndex < sortedFiles.length - 1) {
          handleFileSelect(sortedFiles[currentIndex + 1], event as unknown as React.MouseEvent);
        }
        break;
      case 'a':
        if (event.ctrlKey || event.metaKey) {
          // Select all files
          event.preventDefault();
          setSelectedFiles(new Set(sortedFiles.map(file => file.id)));
        }
        break;
      case 'Escape':
        // Clear selection
        event.preventDefault();
        setSelectedFiles(new Set());
        setLastClickedFile(null);
        break;
    }
  }, [sortedFiles, selectedFiles, lastClickedFile, handleFileSelect]);

  return {
    selectedFiles,
    sortedFiles,
    filterText,
    lastClickedFile,
    isCtrlPressed,
    isShiftPressed,
    setFilterText,
    handleSort,
    handleFileSelect,
    handleKeyDown,
    setSelectedFiles
  };
};

// This is an abstract component that shouldn't be used directly
const FileViewBase: React.FC<FileViewBaseProps> = () => {
  return null; // This is meant to be extended, not rendered directly
};

export default FileViewBase;