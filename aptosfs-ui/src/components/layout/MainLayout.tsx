import React, { useState } from 'react';
import { Theme, WindowState } from '@/types';
import TopMenuBar from './TopMenuBar';
import Sidebar from './Sidebar';
import WorkspaceContainer from './WorkspaceContainer';

interface MainLayoutProps {
  theme: Theme;
  toggleTheme: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ theme, toggleTheme }) => {
  const [windows, setWindows] = useState<WindowState[]>([
    {
      id: 'home',
      title: 'Home',
      path: '/',
      isActive: true,
      isMaximized: false,
      viewMode: 'grid',
      sort: { field: 'name', direction: 'asc' }
    }
  ]);

  const [sidebarWidth, setSidebarWidth] = useState(240);

  // Handler for window activation
  const handleWindowActivate = (windowId: string) => {
    setWindows(windows.map(window => ({
      ...window,
      isActive: window.id === windowId
    })));
  };

  // Handler for window close
  const handleWindowClose = (windowId: string) => {
    setWindows(windows.filter(window => window.id !== windowId));
    
    // If we closed the active window, activate another one if available
    if (windows.find(w => w.id === windowId)?.isActive && windows.length > 1) {
      const remainingWindows = windows.filter(w => w.id !== windowId);
      handleWindowActivate(remainingWindows[0].id);
    }
  };

  // Handler for creating a new window
  const handleNewWindow = (path: string, title: string) => {
    const newWindow: WindowState = {
      id: `window-${Date.now()}`,
      title,
      path,
      isActive: true,
      isMaximized: false,
      viewMode: 'grid',
      sort: { field: 'name', direction: 'asc' }
    };

    // Set all windows to inactive and add the new one
    setWindows([
      ...windows.map(w => ({ ...w, isActive: false })),
      newWindow
    ]);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopMenuBar theme={theme} toggleTheme={toggleTheme} />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar 
          width={sidebarWidth} 
          onResize={newWidth => setSidebarWidth(newWidth)}
          onNavigate={(path, title) => handleNewWindow(path, title)}
        />
        
        <WorkspaceContainer 
          windows={windows}
          onWindowActivate={handleWindowActivate}
          onWindowClose={handleWindowClose}
        />
      </div>
    </div>
  );
};

export default MainLayout;