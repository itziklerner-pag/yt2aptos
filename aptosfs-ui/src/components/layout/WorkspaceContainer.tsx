import React from 'react';
import { WindowState } from '@/types';
import FileWindow from '../file-view/FileWindow';

interface WorkspaceContainerProps {
  windows: WindowState[];
  onWindowActivate: (windowId: string) => void;
  onWindowClose: (windowId: string) => void;
}

const WorkspaceContainer: React.FC<WorkspaceContainerProps> = ({
  windows,
  onWindowActivate,
  onWindowClose,
}) => {
  // Handle click on window to activate it
  const handleWindowClick = (windowId: string) => {
    onWindowActivate(windowId);
  };

  // Compute the z-index for each window based on active state
  const getZIndex = (isActive: boolean, index: number) => {
    return isActive ? windows.length + 100 : index + 10;
  };

  return (
    <div className="workspace-container flex-1 bg-gray-200 dark:bg-gray-800 relative overflow-hidden">
      {windows.length === 0 ? (
        <div className="flex h-full items-center justify-center text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <svg
              className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <p className="text-lg">No open windows</p>
            <p className="text-sm mt-2">
              Click on a location in the sidebar to open a new window
            </p>
          </div>
        </div>
      ) : (
        windows.map((window, index) => (
          <div
            key={window.id}
            className={`absolute inset-4 ${
              window.isActive ? 'shadow-xl' : 'shadow-lg'
            }`}
            style={{
              zIndex: getZIndex(window.isActive, index),
              ...(window.position && {
                top: `${window.position.y}px`,
                left: `${window.position.x}px`,
              }),
              ...(window.size && {
                width: `${window.size.width}px`,
                height: `${window.size.height}px`,
              }),
              ...(window.isMaximized && {
                top: '4px',
                left: '4px',
                right: '4px',
                bottom: '4px',
                width: 'auto',
                height: 'auto',
              }),
            }}
            onClick={() => handleWindowClick(window.id)}
          >
            <FileWindow
              windowState={window}
              onClose={() => onWindowClose(window.id)}
              onMaximize={() => {
                // Would dispatch an action to toggle maximize state - placeholder for now
                console.log('Maximize window', window.id);
              }}
              onMinimize={() => {
                // Would dispatch an action to minimize - placeholder for now
                console.log('Minimize window', window.id);
              }}
            />
          </div>
        ))
      )}
    </div>
  );
};

export default WorkspaceContainer;