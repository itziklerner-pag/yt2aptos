import React, { useState } from 'react';
import { Theme } from '@/types';
import UserMenuDropdown from '../auth/UserMenuDropdown';
import AuthModal from '../auth/AuthModal';

interface TopMenuBarProps {
  theme: Theme;
  toggleTheme: () => void;
}

const TopMenuBar: React.FC<TopMenuBarProps> = ({ theme, toggleTheme }) => {
  // State for auth modal
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'register'>('login');
  
  // Open auth modal with specified view
  const openAuthModal = (view: 'login' | 'register') => {
    setAuthModalView(view);
    setIsAuthModalOpen(true);
  };
  
  return (
    <>
      <div className="bg-window-header dark:bg-gray-800 h-8 flex items-center justify-between px-4 border-b border-finder-border dark:border-gray-700">
        {/* Apple Logo */}
        <div className="flex items-center">
          <button className="mr-4 text-black dark:text-white hover:opacity-80 transition-opacity">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
          </button>
          
          {/* Menu Items */}
          <div className="flex space-x-4">
            <div className="font-semibold text-black dark:text-white">AptosFS</div>
            <div className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white">File</div>
            <div className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white">Edit</div>
            <div className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white">View</div>
            <div className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white">Go</div>
            <div className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white">Window</div>
            <div className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white">Help</div>
          </div>
        </div>
        
        {/* Status Icons (right side) */}
        <div className="flex items-center space-x-3">
          {/* User Menu Dropdown */}
          <UserMenuDropdown onLoginClick={() => openAuthModal('login')} />
          
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white"
          >
            {theme === 'light' ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>

          {/* Battery Icon */}
          <div className="text-gray-700 dark:text-gray-300">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12H3l9-9 9 9h-2M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          </div>
          
          {/* WiFi Icon */}
          <div className="text-gray-700 dark:text-gray-300">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.246-3.905 14.15 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
          </div>
          
          {/* Date/Time */}
          <div className="text-xs text-gray-700 dark:text-gray-300">
            {new Date().toLocaleString('en-US', { 
              weekday: 'short',
              month: 'short', 
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })}
          </div>
        </div>
      </div>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        defaultView={authModalView}
      />
    </>
  );
};

export default TopMenuBar;