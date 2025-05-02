import React, { useState, useEffect } from 'react';
import AuthPage from './AuthPage';
import { useAuth } from '../../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultView?: 'login' | 'register' | 'forgot-password';
  message?: string; // Optional message to display
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultView = 'login',
  message
}) => {
  const { isAuthenticated } = useAuth();
  const [isClosing, setIsClosing] = useState(false);
  
  // Close modal when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated) {
      handleClose();
    }
  }, [isAuthenticated]);
  
  // Handle closing animation
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300); // Duration matches transition duration
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-300 ${
          isClosing ? 'opacity-0' : 'opacity-50'
        }`}
        onClick={handleClose}
      ></div>
      
      {/* Modal */}
      <div 
        className={`flex items-center justify-center min-h-screen p-4 text-center sm:block sm:p-0 transition-opacity duration-300 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="inline-block align-bottom bg-white dark:bg-gray-900 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Close button */}
          <button
            type="button"
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
            onClick={handleClose}
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
          
          {/* Optional message */}
          {message && (
            <div className="bg-blue-50 dark:bg-blue-900 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700 dark:text-blue-200">
                    {message}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Auth content */}
          <div className="w-full">
            <AuthPage 
              defaultView={defaultView} 
              onComplete={onClose}
              showCancel={true}
              onCancel={handleClose}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;