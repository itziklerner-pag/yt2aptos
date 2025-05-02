import React, { useState, useCallback } from 'react';
import { WindowState, ViewMode, FileSort, FileItem } from '@/types';
import ViewToggle from './ViewToggle';
import ListView from './ListView';
import GridView from './GridView';
import QuickLook from './QuickLook';

interface FileWindowProps {
  windowState: WindowState;
  onClose: () => void;
  onMaximize: () => void;
  onMinimize: () => void;
}

const FileWindow: React.FC<FileWindowProps> = ({
  windowState,
  onClose,
  onMaximize,
  onMinimize,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>(windowState.viewMode);
  const [sort, setSort] = useState<FileSort>(windowState.sort);
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [filterText, setFilterText] = useState("");
  const [quickLookFile, setQuickLookFile] = useState<FileItem | null>(null);
  const [quickLookIndex, setQuickLookIndex] = useState<number>(-1);

  // Mock data for files - in a real app this would come from an API or state management
  const mockFiles = [
    { 
      id: '1',
      name: 'Document.pdf',
      type: 'pdf' as const,
      size: 2500000,
      created: new Date('2023-05-20'),
      modified: new Date('2023-06-15'),
      owner: 'Current User',
      path: `${windowState.path}/Document.pdf`,
      starred: false,
    },
    { 
      id: '2',
      name: 'Vacation Photos',
      type: 'folder' as const,
      size: 0,
      created: new Date('2023-01-10'),
      modified: new Date('2023-06-21'),
      owner: 'Current User',
      path: `${windowState.path}/Vacation Photos`,
      starred: true,
    },
    { 
      id: '3',
      name: 'Project Presentation.pptx',
      type: 'document' as const,
      size: 4200000,
      created: new Date('2023-06-01'),
      modified: new Date('2023-06-20'),
      owner: 'Current User',
      path: `${windowState.path}/Project Presentation.pptx`,
      starred: false,
    },
    { 
      id: '4',
      name: 'Budget 2023.xlsx',
      type: 'document' as const,
      size: 1800000,
      created: new Date('2023-04-15'),
      modified: new Date('2023-06-10'),
      owner: 'Current User',
      path: `${windowState.path}/Budget 2023.xlsx`,
      starred: false,
    },
    { 
      id: '5',
      name: 'Profile Photo.jpg',
      type: 'image' as const,
      size: 850000,
      created: new Date('2023-02-28'),
      modified: new Date('2023-02-28'),
      owner: 'Current User',
      path: `${windowState.path}/Profile Photo.jpg`,
      starred: false,
      thumbnail: 'https://via.placeholder.com/100',
    },
    { 
      id: '6',
      name: 'Archive.zip',
      type: 'archive' as const,
      size: 15000000,
      created: new Date('2023-03-15'),
      modified: new Date('2023-03-15'),
      owner: 'Current User',
      path: `${windowState.path}/Archive.zip`,
      starred: false,
    },
    { 
      id: '7',
      name: 'Project Source Code',
      type: 'folder' as const,
      size: 0,
      created: new Date('2023-01-05'),
      modified: new Date('2023-06-22'),
      owner: 'Current User',
      path: `${windowState.path}/Project Source Code`,
      starred: false,
    },
    { 
      id: '8',
      name: 'Meeting Recording.mp4',
      type: 'video' as const,
      size: 125000000,
      created: new Date('2023-06-05'),
      modified: new Date('2023-06-05'),
      owner: 'Current User',
      path: `${windowState.path}/Meeting Recording.mp4`,
      starred: false,
    },
    { 
      id: '9',
      name: 'Music Track.mp3',
      type: 'audio' as const,
      size: 8500000,
      created: new Date('2023-05-10'),
      modified: new Date('2023-05-10'),
      owner: 'Current User',
      path: `${windowState.path}/Music Track.mp3`,
      starred: false,
    },
    { 
      id: '10',
      name: 'index.html',
      type: 'code' as const,
      size: 25000,
      created: new Date('2023-04-20'),
      modified: new Date('2023-06-18'),
      owner: 'Current User',
      path: `${windowState.path}/index.html`,
      starred: false,
    },
  ];
  
  // Filter files based on search text
  const filteredFiles = mockFiles.filter(file => 
    filterText.trim() === '' || 
    file.name.toLowerCase().includes(filterText.toLowerCase())
  );

  // Toggle view mode between list and grid
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  // Handle sort change
  const handleSortChange = (newSort: FileSort) => {
    setSort(newSort);
  };

  // Handle file selection
  const handleSelectionChange = (files: FileItem[]) => {
    setSelectedFiles(files);
  };

  // Handle file open/navigation
  const handleFileOpen = (file: FileItem) => {
    if (file.type === 'folder') {
      // Navigate to folder in a real app
      console.log(`Navigating to folder: ${file.path}`);
    } else {
      // Open file or preview
      console.log(`Opening file: ${file.path}`);
      openQuickLook(file);
    }
  };

  // Quick Look functionality
  const openQuickLook = (file: FileItem) => {
    if (file.type === 'folder') return;
    
    const index = filteredFiles.findIndex(f => f.id === file.id);
    setQuickLookFile(file);
    setQuickLookIndex(index);
  };

  const handleQuickLookClose = () => {
    setQuickLookFile(null);
    setQuickLookIndex(-1);
  };

  const navigateQuickLook = (direction: 'next' | 'prev') => {
    // Skip folders in navigation
    const nonFolderFiles = filteredFiles.filter(f => f.type !== 'folder');
    const currentIndex = nonFolderFiles.findIndex(f => quickLookFile && f.id === quickLookFile.id);
    
    if (currentIndex === -1) return;
    
    let newIndex = direction === 'next' 
      ? (currentIndex + 1) % nonFolderFiles.length 
      : (currentIndex - 1 + nonFolderFiles.length) % nonFolderFiles.length;
    
    setQuickLookFile(nonFolderFiles[newIndex]);
    setQuickLookIndex(filteredFiles.findIndex(f => f.id === nonFolderFiles[newIndex].id));
  };

  const handleQuickLookNext = () => navigateQuickLook('next');
  const handleQuickLookPrev = () => navigateQuickLook('prev');

  // Render path breadcrumbs
  const renderPathBreadcrumbs = () => {
    const parts = windowState.path.split('/').filter(Boolean);
    
    return (
      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 px-4 py-1">
        <span className="text-gray-500 dark:text-gray-500">
          <svg className="w-4 h-4 inline-block mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
        </span>
        
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            <span className="mx-1 text-gray-500">/</span>
            <span className="hover:text-finder-blue cursor-pointer">{part}</span>
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="window flex flex-col h-full">
      {/* Window header with controls */}
      <div className="window-header">
        <div className="window-controls flex items-center gap-1.5 mr-4">
          <div className="window-control window-close" onClick={onClose}></div>
          <div className="window-control window-minimize" onClick={onMinimize}></div>
          <div className="window-control window-expand" onClick={onMaximize}></div>
        </div>
        
        <div className="flex-1 text-center text-sm font-medium truncate">
          {windowState.title}
        </div>
        
        <div className="w-20">
          {/* Placeholder for optional header actions */}
        </div>
      </div>
      
      {/* Path breadcrumbs */}
      {renderPathBreadcrumbs()}
      
      {/* Toolbar with search, view toggle, etc. */}
      <div className="flex items-center justify-between border-b border-finder-border dark:border-gray-700 px-4 py-2 bg-white dark:bg-gray-900">
        <div className="flex items-center">
          <div className="relative">
            <input
              type="text"
              className="pl-8 pr-4 py-1 rounded-md text-sm border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-finder-blue w-64"
              placeholder="Search"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            
            {filterText && (
              <button
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={() => setFilterText('')}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* View toggle component */}
          <ViewToggle activeView={viewMode} onChange={handleViewModeChange} />
          
          {/* Sort dropdown - simplified version */}
          <div className="flex items-center text-sm">
            <span className="text-gray-500 dark:text-gray-400 mr-1">Sort:</span>
            <select 
              className="bg-transparent border-none text-gray-700 dark:text-gray-300 focus:outline-none text-sm"
              value={sort.field}
              onChange={(e) => handleSortChange({ ...sort, field: e.target.value as any })}
            >
              <option value="name">Name</option>
              <option value="size">Size</option>
              <option value="type">Kind</option>
              <option value="modified">Date Modified</option>
            </select>
            
            <button
              className="ml-1 text-gray-500 dark:text-gray-400"
              onClick={() => handleSortChange({ ...sort, direction: sort.direction === 'asc' ? 'desc' : 'asc' })}
              title={`Sort ${sort.direction === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                {sort.direction === 'asc' ? (
                  <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* File content area */}
      <div className="flex-1 overflow-auto bg-white dark:bg-gray-900">
        {viewMode === 'list' ? (
          <ListView 
            files={filteredFiles} 
            sort={sort} 
            onSortChange={handleSortChange}
            onFileOpen={handleFileOpen}
            onSelectionChange={handleSelectionChange}
          />
        ) : (
          <GridView 
            files={filteredFiles} 
            sort={sort}
            onSortChange={handleSortChange}
            onFileOpen={handleFileOpen}
            onSelectionChange={handleSelectionChange}
          />
        )}
      </div>
      
      {/* Status bar */}
      <div className="border-t border-finder-border dark:border-gray-700 px-4 py-1 text-xs text-gray-500 dark:text-gray-400 flex justify-between bg-white dark:bg-gray-900">
        <div>
          {selectedFiles.length > 0 
            ? `${selectedFiles.length} of ${filteredFiles.length} items selected` 
            : `${filteredFiles.length} items`}
        </div>
        <div>Available Space: 125.8 GB</div>
      </div>

      {/* QuickLook overlay */}
      <QuickLook 
        file={quickLookFile}
        files={filteredFiles.filter(f => f.type !== 'folder')}
        onClose={handleQuickLookClose}
        onNavigateNext={handleQuickLookNext}
        onNavigatePrev={handleQuickLookPrev}
      />
    </div>
  );
};

export default FileWindow;