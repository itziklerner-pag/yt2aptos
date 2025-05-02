import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface RegisterFormProps {
  onSwitchToLogin: () => void; // Handler to switch to login view
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const { register, isLoading, error } = useAuth();
  
  // Form state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  // Validation state
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [termsError, setTermsError] = useState('');
  
  // Regular expressions for validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  
  // Reset validation errors when inputs change
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    setUsernameError('');
  };
  
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setEmailError('');
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setPasswordError('');
    
    // Clear confirm password error if both match
    if (confirmPassword && e.target.value === confirmPassword) {
      setConfirmPasswordError('');
    }
  };
  
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    
    if (e.target.value !== password) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };
  
  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayName(e.target.value);
  };
  
  const handleAcceptTermsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAcceptTerms(e.target.checked);
    setTermsError('');
  };
  
  // Validate form inputs
  const validateForm = (): boolean => {
    let isValid = true;
    
    // Validate username
    if (!username.trim()) {
      setUsernameError('Username is required');
      isValid = false;
    } else if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      isValid = false;
    }
    
    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }
    
    // Validate password
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (!passwordRegex.test(password)) {
      setPasswordError('Password must be at least 8 characters and include uppercase, lowercase, number, and special character');
      isValid = false;
    }
    
    // Validate confirm password
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    }
    
    // Validate terms acceptance
    if (!acceptTerms) {
      setTermsError('You must accept the terms and conditions');
      isValid = false;
    }
    
    return isValid;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await register(username, email, password, displayName || undefined);
      // Successful registration is handled by the AuthContext
    } catch (error) {
      // Error is displayed via the AuthContext error state
      console.error('Registration error:', error);
    }
  };
  
  return (
    <div className="w-full max-w-md">
      <form 
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
      >
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white text-center">
          Create an Account
        </h2>
        
        {/* Error message */}
        {error && (
          <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {/* Username field */}
        <div className="mb-4">
          <label 
            htmlFor="register-username" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Username*
          </label>
          <input
            id="register-username"
            type="text"
            value={username}
            onChange={handleUsernameChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
              usernameError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Choose a username"
            disabled={isLoading}
          />
          {usernameError && (
            <p className="mt-1 text-sm text-red-600">{usernameError}</p>
          )}
        </div>
        
        {/* Email field */}
        <div className="mb-4">
          <label 
            htmlFor="register-email" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Email address*
          </label>
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={handleEmailChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
              emailError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Enter your email"
            disabled={isLoading}
          />
          {emailError && (
            <p className="mt-1 text-sm text-red-600">{emailError}</p>
          )}
        </div>
        
        {/* Display name field */}
        <div className="mb-4">
          <label 
            htmlFor="display-name" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Display Name (optional)
          </label>
          <input
            id="display-name"
            type="text"
            value={displayName}
            onChange={handleDisplayNameChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Enter your display name"
            disabled={isLoading}
          />
        </div>
        
        {/* Password field */}
        <div className="mb-4">
          <label 
            htmlFor="register-password" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Password*
          </label>
          <input
            id="register-password"
            type="password"
            value={password}
            onChange={handlePasswordChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
              passwordError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Create a password"
            disabled={isLoading}
          />
          {passwordError && (
            <p className="mt-1 text-sm text-red-600">{passwordError}</p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Password must be at least 8 characters and include uppercase, lowercase, number, and special character.
          </p>
        </div>
        
        {/* Confirm Password field */}
        <div className="mb-4">
          <label 
            htmlFor="confirm-password" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Confirm Password*
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
              confirmPasswordError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Confirm your password"
            disabled={isLoading}
          />
          {confirmPasswordError && (
            <p className="mt-1 text-sm text-red-600">{confirmPasswordError}</p>
          )}
        </div>
        
        {/* Terms and conditions checkbox */}
        <div className="mb-6">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="terms"
                type="checkbox"
                checked={acceptTerms}
                onChange={handleAcceptTermsChange}
                className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
                  termsError ? 'border-red-500' : ''
                }`}
                disabled={isLoading}
              />
            </div>
            <div className="ml-3 text-sm">
              <label 
                htmlFor="terms" 
                className="font-medium text-gray-700 dark:text-gray-300"
              >
                I accept the <a href="#" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">Terms and Conditions</a> and <a href="#" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">Privacy Policy</a>*
              </label>
              {termsError && (
                <p className="mt-1 text-sm text-red-600">{termsError}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Submit button */}
        <div className="mb-6">
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </div>
        
        {/* Sign in link */}
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              disabled={isLoading}
            >
              Sign in
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;