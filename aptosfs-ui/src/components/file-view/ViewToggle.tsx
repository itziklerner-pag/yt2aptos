import React, { useEffect } from 'react';
import { ViewMode } from '@/types';

interface ViewToggleProps {
  activeView: ViewMode;
  onChange: (view: ViewMode) => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ activeView, onChange }) => {
  // Load persisted view preference on mount
  useEffect(() => {
    const savedView = localStorage.getItem('aptosfs-view-mode');
    if (savedView && (savedView === 'list' || savedView === 'grid') && savedView !== activeView) {
      onChange(savedView as ViewMode);
    }
  }, [onChange, activeView]);

  // Persist view preference when changed
  const handleViewChange = (view: ViewMode) => {
    localStorage.setItem('aptosfs-view-mode', view);
    onChange(view);
  };

  return (
    <div className="view-toggle inline-flex rounded-md shadow-sm">
      <button
        type="button"
        className={`relative inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-l-md focus:z-10 focus:outline-none transition-all duration-200 ease-in-out ${
          activeView === 'list'
            ? 'bg-finder-blue text-white scale-105 shadow-sm'
            : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
        onClick={() => handleViewChange('list')}
        aria-label="List view"
        title="List view"
      >
        <svg 
          className={`w-4 h-4 transition-all duration-200 ${activeView === 'list' ? 'scale-110' : ''}`} 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      <button
        type="button"
        className={`relative -ml-px inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-r-md focus:z-10 focus:outline-none transition-all duration-200 ease-in-out ${
          activeView === 'grid'
            ? 'bg-finder-blue text-white scale-105 shadow-sm'
            : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
        onClick={() => handleViewChange('grid')}
        aria-label="Grid view"
        title="Grid view"
      >
        <svg 
          className={`w-4 h-4 transition-all duration-200 ${activeView === 'grid' ? 'scale-110' : ''}`} 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      </button>
      
      {/* Visual indicator for animation */}
      <div
        className={`absolute h-full bg-finder-blue rounded transition-all duration-300 ease-in-out ${
          activeView === 'list' ? 'w-1/2 left-0' : 'w-1/2 left-1/2'
        }`}
        style={{ 
          opacity: 0.1, 
          top: 0, 
          zIndex: -1 
        }}
      ></div>
    </div>
  );
};

export default ViewToggle;