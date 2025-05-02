import React, { useState, useRef, useEffect } from 'react';
import { SidebarItem } from '@/types';

interface SidebarProps {
  width: number;
  onResize: (newWidth: number) => void;
  onNavigate: (path: string, title: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ width, onResize, onNavigate }) => {
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(width);
  const resizerRef = useRef<HTMLDivElement>(null);

  // Mock sidebar items
  const sidebarItems: SidebarItem[] = [
    { id: 'favorites', name: 'Favorites', icon: 'star', path: '', type: 'favorites' },
    { id: 'home', name: 'Home', icon: 'home', path: '/', type: 'favorites' },
    { id: 'documents', name: 'Documents', icon: 'document', path: '/documents', type: 'favorites' },
    { id: 'applications', name: 'Applications', icon: 'application', path: '/applications', type: 'favorites' },
    { id: 'downloads', name: 'Downloads', icon: 'download', path: '/downloads', type: 'favorites' },
    { id: 'pictures', name: 'Pictures', icon: 'image', path: '/pictures', type: 'favorites' },
    { id: 'music', name: 'Music', icon: 'music', path: '/music', type: 'favorites' },
    { id: 'videos', name: 'Videos', icon: 'video', path: '/videos', type: 'favorites' },
    { id: 'device', name: 'This Device', icon: 'computer', path: '', type: 'device' },
    { id: 'shared', name: 'Shared', icon: 'users', path: '/shared', type: 'shared' },
    { id: 'tags', name: 'Tags', icon: 'tag', path: '', type: 'tag' },
  ];

  // Handle resizing of the sidebar
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    setStartX(e.clientX);
    setStartWidth(width);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = Math.max(180, Math.min(400, startWidth + e.clientX - startX));
      onResize(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, onResize, startWidth, startX]);

  // Group sidebar items by type
  const renderGroupedItems = () => {
    const favorites = sidebarItems.filter(item => item.type === 'favorites' && item.id !== 'favorites');
    const devices = sidebarItems.filter(item => item.type === 'device');
    const shared = sidebarItems.filter(item => item.type === 'shared');
    const tags = sidebarItems.filter(item => item.type === 'tag');

    return (
      <>
        <div className="sidebar-section mb-4">
          <div className="sidebar-section-title text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-1">
            Favorites
          </div>
          <div className="sidebar-section-content">
            {favorites.map(item => renderSidebarItem(item))}
          </div>
        </div>

        <div className="sidebar-section mb-4">
          <div className="sidebar-section-title text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-1">
            This Device
          </div>
          <div className="sidebar-section-content">
            {devices.map(item => renderSidebarItem(item))}
          </div>
        </div>

        <div className="sidebar-section mb-4">
          <div className="sidebar-section-title text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-1">
            Shared
          </div>
          <div className="sidebar-section-content">
            {shared.map(item => renderSidebarItem(item))}
          </div>
        </div>

        <div className="sidebar-section mb-4">
          <div className="sidebar-section-title text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-1">
            Tags
          </div>
          <div className="sidebar-section-content">
            {tags.map(item => renderSidebarItem(item))}
          </div>
        </div>
      </>
    );
  };

  // Render individual sidebar item with icon
  const renderSidebarItem = (item: SidebarItem) => {
    if (!item.path) return null;
    
    return (
      <div 
        key={item.id}
        className="sidebar-item"
        onClick={() => onNavigate(item.path, item.name)}
      >
        <div className="sidebar-item-icon text-gray-500 dark:text-gray-400">
          {getIconForItem(item)}
        </div>
        <div className="sidebar-item-text text-sm">{item.name}</div>
      </div>
    );
  };

  // Return appropriate icon SVG based on item type
  const getIconForItem = (item: SidebarItem) => {
    switch (item.icon) {
      case 'home':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
        );
      case 'document':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        );
      case 'download':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      case 'image':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        );
      case 'application':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
          </svg>
        );
      case 'music':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
          </svg>
        );
      case 'video':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
          </svg>
        );
      case 'computer':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
          </svg>
        );
      case 'users':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
        );
      case 'tag':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1.581.814l-4.419-2.95-4.419 2.95A1 1 0 014 16V4z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <>
      <div 
        className="sidebar bg-sidebar-bg dark:bg-gray-900 overflow-y-auto flex-none border-r border-finder-border dark:border-gray-700"
        style={{ width: `${width}px` }}
      >
        <div className="p-1">
          {renderGroupedItems()}
        </div>
      </div>
      
      {/* Resizer */}
      <div
        ref={resizerRef}
        className="cursor-col-resize w-1 hover:bg-finder-blue active:bg-finder-blue flex-none"
        onMouseDown={handleMouseDown}
      />
    </>
  );
};

export default Sidebar;