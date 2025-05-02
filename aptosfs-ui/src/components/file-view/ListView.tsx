import React, { useState, useRef, useEffect } from 'react';
import { FileItem, FileSort, SortField } from '@/types';
import FileIcon from '../file-item/FileIcon';
import FileContextMenu from '../file-item/FileContextMenu';
import { useFileView, FileViewBaseProps } from './FileViewBase';

interface ListViewProps extends FileViewBaseProps {
  onColumnResize?: (column: string, width: number) => void;
  onColumnReorder?: (fromIndex: number, toIndex: number) => void;
}

const ListView: React.FC<ListViewProps> = ({
  files,
  sort,
  onSortChange,
  onFileOpen,
  onSelectionChange,
  onColumnResize,
  onColumnReorder
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [contextMenuFile, setContextMenuFile] = useState<FileItem | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [columnWidths, setColumnWidths] = useState({
    name: 40, // percentage width
    size: 15,
    type: 15,
    modified: 20,
    owner: 10
  });
  
  // Use the base file view logic
  const {
    selectedFiles,
    sortedFiles,
    handleFileSelect,
    handleSort,
    handleKeyDown,
  } = useFileView({
    files,
    sort,
    onSortChange,
    onFileOpen,
    onSelectionChange,
  });

  // Set up keyboard event listener for the list
  useEffect(() => {
    const currentRef = listRef.current;
    if (currentRef) {
      currentRef.focus();
    }
  }, []);

  // Handle right click to show context menu
  const handleContextMenu = (e: React.MouseEvent, file: FileItem) => {
    e.preventDefault();
    setContextMenuFile(file);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    // Select the file if not already selected
    if (!selectedFiles.has(file.id)) {
      handleFileSelect(file, e);
    }
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

  // Format file size to human readable format
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '—';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  };
  
  // Format date to readable format
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Column resizing logic
  const startColumnResize = (column: string, e: React.MouseEvent) => {
    e.preventDefault();
    setResizingColumn(column);

    const startX = e.clientX;
    const startWidth = columnWidths[column as keyof typeof columnWidths];
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (resizingColumn) {
        const delta = moveEvent.clientX - startX;
        const newWidth = Math.max(10, startWidth + (delta / 10)); // Convert pixels to percentage
        
        setColumnWidths(prev => ({
          ...prev,
          [column]: newWidth
        }));
        
        if (onColumnResize) {
          onColumnResize(column, newWidth);
        }
      }
    };
    
    const handleMouseUp = () => {
      setResizingColumn(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Column drag for reordering
  const [draggedColumn, setDraggedColumn] = useState<number | null>(null);
  
  const handleColumnDragStart = (index: number) => {
    setDraggedColumn(index);
  };
  
  const handleColumnDragOver = (index: number) => {
    if (draggedColumn !== null && draggedColumn !== index) {
      if (onColumnReorder) {
        onColumnReorder(draggedColumn, index);
      }
      setDraggedColumn(index);
    }
  };
  
  const handleColumnDragEnd = () => {
    setDraggedColumn(null);
  };

  // Get style for a row based on selection state
  const getRowStyle = (fileId: string, index: number) => {
    const isSelected = selectedFiles.has(fileId);
    const isEven = index % 2 === 0;
    
    let className = 'grid grid-cols-12 gap-4 px-4 py-2 cursor-pointer text-sm border-b border-gray-100 dark:border-gray-800 ';
    
    if (isSelected) {
      className += 'bg-finder-blue/20 dark:bg-finder-blue/30 ';
    } else if (isEven) {
      className += 'bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 ';
    } else {
      className += 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 ';
    }
    
    return className;
  };

  // Calculate column styles based on columnWidths
  const getColumnStyle = (column: keyof typeof columnWidths) => {
    return {
      width: `${columnWidths[column]}%`,
    };
  };

  // Build column headers with sort indicators
  const renderColumnHeader = (field: SortField, label: string, index: number) => {
    const isSorted = sort.field === field;
    const sortIcon = sort.direction === 'asc' ? '↑' : '↓';
    
    return (
      <div 
        key={field}
        className="px-2 py-1 flex items-center justify-between cursor-pointer select-none"
        style={getColumnStyle(field as keyof typeof columnWidths)}
        onClick={() => handleSort(field)}
        draggable
        onDragStart={() => handleColumnDragStart(index)}
        onDragOver={() => handleColumnDragOver(index)}
        onDragEnd={handleColumnDragEnd}
      >
        <span>{label}</span>
        {isSorted && <span className="text-finder-blue">{sortIcon}</span>}
        
        {/* Resizer handle */}
        <div
          className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-finder-blue/50 group"
          onMouseDown={(e) => startColumnResize(field, e)}
        >
          <div className="invisible group-hover:visible h-full w-1 bg-finder-blue"></div>
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={listRef}
      className="list-view"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Table header */}
      <div className="sticky top-0 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 select-none">
        <div className="flex items-center relative">
          {renderColumnHeader('name', 'Name', 0)}
          {renderColumnHeader('size', 'Size', 1)}
          {renderColumnHeader('type', 'Kind', 2)}
          {renderColumnHeader('modified', 'Date Modified', 3)}
          {renderColumnHeader('owner', 'Owner', 4)}
        </div>
      </div>
      
      {/* File list */}
      <div className="file-list">
        {sortedFiles.map((file, index) => (
          <div 
            key={file.id}
            className={getRowStyle(file.id, index)}
            onClick={(e) => handleFileSelect(file, e)}
            onContextMenu={(e) => handleContextMenu(e, file)}
            onDoubleClick={() => handleDoubleClick(file)}
          >
            <div className="col-span-5 flex items-center overflow-hidden"
              style={getColumnStyle('name')}>
              <div className="flex-shrink-0 mr-2">
                <FileIcon fileType={file.type} />
              </div>
              <span className="truncate">{file.name}</span>
              {file.starred && (
                <svg className="ml-2 h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              )}
              {file.shared && (
                <svg className="ml-2 h-4 w-4 text-finder-blue" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              )}
            </div>
            
            <div className="col-span-2 text-right text-gray-500 dark:text-gray-400"
              style={getColumnStyle('size')}>
              {formatFileSize(file.size)}
            </div>
            
            <div className="col-span-2 text-gray-500 dark:text-gray-400 capitalize"
              style={getColumnStyle('type')}>
              {file.type}
            </div>
            
            <div className="col-span-2 text-right text-gray-500 dark:text-gray-400"
              style={getColumnStyle('modified')}>
              {formatDate(file.modified)}
            </div>
            
            <div className="col-span-1 text-gray-500 dark:text-gray-400 truncate"
              style={getColumnStyle('owner')}>
              {file.owner || '—'}
            </div>
          </div>
        ))}
      </div>
      
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

export default ListView;