import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AuthMethod } from '../../types/auth.types';

interface UserMenuDropdownProps {
  onLoginClick: () => void;
}

const UserMenuDropdown: React.FC<UserMenuDropdownProps> = ({ onLoginClick }) => {
  const { 
    isAuthenticated, 
    user, 
    logout, 
    authMethod,
    walletAddress,
    connectWallet,
    disconnectWallet
  } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Handle logout
  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };
  
  // Handle wallet connection/disconnection
  const handleWalletToggle = async () => {
    if (walletAddress) {
      await disconnectWallet();
    } else {
      await connectWallet();
    }
    setIsOpen(false);
  };
  
  // Format wallet address for display
  const formatWalletAddress = (address: string): string => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  return (
    <div className="relative" ref={dropdownRef}>
      {isAuthenticated ? (
        <>
          {/* Avatar/profile button */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <span className="sr-only">Open user menu</span>
            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.displayName || user.username} className="h-full w-full object-cover" />
              ) : (
                <span>{(user?.displayName || user?.username || 'U').charAt(0).toUpperCase()}</span>
              )}
            </div>
          </button>
          
          {/* Dropdown menu */}
          {isOpen && (
            <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 divide-y divide-gray-200 dark:divide-gray-700 z-10">
              {/* User info */}
              <div className="py-3 px-4">
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.displayName || user?.username}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email}
                </div>
                {authMethod === AuthMethod.WALLET && walletAddress && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                    {formatWalletAddress(walletAddress)}
                  </div>
                )}
              </div>
              
              {/* Menu items */}
              <div className="py-1">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // Profile action would go here
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Your Profile
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // Settings action would go here
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Settings
                </button>
              </div>
              
              {/* Wallet section */}
              <div className="py-1">
                {authMethod === AuthMethod.TRADITIONAL && (
                  <button
                    onClick={handleWalletToggle}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 4c0-1.1.9-2 2-2h8a2 2 0 012 2v2h2a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 2V4h8v2H6zm10 2H6v8h10V8zm-4 3a1 1 0 11-2 0 1 1 0 012 0z" />
                    </svg>
                    {walletAddress ? 'Disconnect Wallet' : 'Connect Wallet'}
                  </button>
                )}
              </div>
              
              {/* Logout */}
              <div className="py-1">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        // Login button
        <button
          type="button"
          onClick={onLoginClick}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Sign in
        </button>
      )}
    </div>
  );
};

export default UserMenuDropdown;