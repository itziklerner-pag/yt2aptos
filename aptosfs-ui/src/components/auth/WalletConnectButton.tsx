import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface WalletConnectButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
}

const WalletConnectButton: React.FC<WalletConnectButtonProps> = ({
  className = '',
  size = 'md',
  variant = 'primary'
}) => {
  const { 
    connectWallet, 
    disconnectWallet, 
    isLoading, 
    error, 
    isWalletConnected,
    walletAddress 
  } = useAuth();
  
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Size classes
  const sizeClasses = {
    sm: 'py-1 px-3 text-xs',
    md: 'py-2 px-4 text-sm',
    lg: 'py-3 px-6 text-base'
  };
  
  // Variant classes
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white border-transparent',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 border-transparent dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white',
    outline: 'bg-transparent hover:bg-gray-100 text-blue-600 border-blue-600 dark:hover:bg-gray-800 dark:text-blue-400 dark:border-blue-400'
  };
  
  // Base button classes
  const baseClasses = 'flex items-center justify-center rounded-md border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  // Combined classes
  const buttonClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;
  
  // Handle wallet connection
  const handleConnect = async () => {
    if (isWalletConnected() && walletAddress) {
      // If wallet is already connected, disconnect it
      try {
        await disconnectWallet();
      } catch (error) {
        console.error('Error disconnecting wallet:', error);
      }
    } else {
      // Otherwise, connect wallet
      setIsConnecting(true);
      try {
        await connectWallet();
      } catch (error) {
        console.error('Error connecting wallet:', error);
      } finally {
        setIsConnecting(false);
      }
    }
  };
  
  // Format wallet address for display
  const formatWalletAddress = (address: string): string => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={handleConnect}
        disabled={isLoading || isConnecting}
        className={buttonClasses}
      >
        {isLoading || isConnecting ? (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <WalletIcon className="w-5 h-5 mr-2" />
        )}
        
        {isLoading || isConnecting 
          ? 'Connecting...' 
          : isWalletConnected() && walletAddress 
            ? formatWalletAddress(walletAddress)
            : 'Connect Aptos Wallet'
        }
      </button>
      
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      
      {isWalletConnected() && walletAddress && (
        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          Connected: {formatWalletAddress(walletAddress)}
        </div>
      )}
    </div>
  );
};

// Wallet icon SVG component
const WalletIcon: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <svg 
      className={className} 
      fill="currentColor" 
      viewBox="0 0 20 20" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M4 4c0-1.1.9-2 2-2h8a2 2 0 012 2v2h2a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 2V4h8v2H6zm10 2H6v8h10V8zm-4 3a1 1 0 11-2 0 1 1 0 012 0z" />
    </svg>
  );
};

export default WalletConnectButton;