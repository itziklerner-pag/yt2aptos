import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import WalletConnectButton from './WalletConnectButton';
import { useAuth } from '../../contexts/AuthContext';

// Authentication page view options
type AuthView = 'login' | 'register' | 'forgot-password';

interface AuthPageProps {
  defaultView?: AuthView;
  onComplete?: () => void; // Callback for when auth is complete
  showCancel?: boolean;
  onCancel?: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({
  defaultView = 'login',
  onComplete,
  showCancel = false,
  onCancel
}) => {
  const { isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState<AuthView>(defaultView);
  
  // If user becomes authenticated, call onComplete callback
  React.useEffect(() => {
    if (isAuthenticated && onComplete) {
      onComplete();
    }
  }, [isAuthenticated, onComplete]);
  
  // Render forgot password view
  const renderForgotPassword = () => (
    <div className="w-full max-w-md">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white text-center">
          Reset Password
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        
        <div className="mb-4">
          <label 
            htmlFor="reset-email" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Email address
          </label>
          <input
            id="reset-email"
            type="email"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Enter your email"
          />
        </div>
        
        <div className="mb-6">
          <button
            type="button"
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Send Reset Link
          </button>
        </div>
        
        <div className="text-center">
          <button
            type="button"
            onClick={() => setCurrentView('login')}
            className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-full flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <svg className="w-16 h-16 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          AptosFS
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Decentralized file system powered by Aptos blockchain
        </p>
      </div>
      
      {/* Cancel button */}
      {showCancel && onCancel && (
        <div className="sm:mx-auto sm:w-full sm:max-w-md mt-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Close
          </button>
        </div>
      )}
      
      {/* Auth methods */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Toggle buttons */}
        {currentView !== 'forgot-password' && (
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
            <button
              onClick={() => setCurrentView('login')}
              className={`flex-1 py-3 px-4 text-center font-medium ${
                currentView === 'login' 
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setCurrentView('register')}
              className={`flex-1 py-3 px-4 text-center font-medium ${
                currentView === 'register' 
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Create Account
            </button>
          </div>
        )}
        
        {/* Wallet connect section */}
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-2 text-center text-gray-700 dark:text-gray-300 font-medium">
            Connect with Aptos Wallet
          </div>
          <WalletConnectButton size="lg" variant="primary" className="w-full max-w-xs" />
        </div>
        
        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
              Or continue with
            </span>
          </div>
        </div>
        
        {/* Auth forms */}
        {currentView === 'login' && (
          <LoginForm 
            onForgotPassword={() => setCurrentView('forgot-password')}
            onSwitchToRegister={() => setCurrentView('register')}
          />
        )}
        
        {currentView === 'register' && (
          <RegisterForm 
            onSwitchToLogin={() => setCurrentView('login')}
          />
        )}
        
        {currentView === 'forgot-password' && renderForgotPassword()}
      </div>
    </div>
  );
};

export default AuthPage;