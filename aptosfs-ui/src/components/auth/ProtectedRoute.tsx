import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string; // Optional redirect path
}

/**
 * ProtectedRoute component
 * Ensures a route is only accessible to authenticated users
 * Redirects to login page or another specified route if not authenticated
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children,
  redirectTo = '/auth'
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Show loading state while authentication is being checked
  if (isLoading) {
    return (
      <div className="h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }
  
  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }
  
  // Render children if authenticated
  return <>{children}</>;
};

export default ProtectedRoute;