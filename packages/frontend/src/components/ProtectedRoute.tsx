import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authService from '../services/auth.service';
import LoadingSpinner from './LoadingSpinner';
import { Permission } from '../../../shared/src/auth/types';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: Permission;
  redirectPath?: string;
}

/**
 * A wrapper component that protects routes requiring authentication
 * - Checks if the user is authenticated
 * - Optionally verifies specific permissions
 * - Redirects to login if not authenticated
 * - Shows loading state during authentication check
 */
const ProtectedRoute = ({
  children,
  requiredPermission,
  redirectPath = '/login'
}: ProtectedRouteProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        
        if (!authService.isAuthenticated()) {
          setIsAllowed(false);
          setIsLoading(false);
          return;
        }
        
        // If we need to check for a specific permission
        if (requiredPermission) {
          // Get updated user data to ensure permissions are current
          const user = await authService.getCurrentUser();
          
          if (!user) {
            setIsAllowed(false);
            setIsLoading(false);
            return;
          }
          
          // We need to check permissions from the JWT payload
          // Since permissions are stored in the JWT payload, not on the UserDTO,
          // we'll decode the JWT manually to check permissions
          
          const token = authService.getAccessToken();
          if (token) {
            try {
              // Extract payload from token without verifying signature
              // (verification happens on the server)
              const payload = JSON.parse(
                Buffer.from(token.split('.')[1], 'base64').toString()
              );
              
              // Check if the required permission is in the payload's permissions array
              const hasPermission = payload.permissions?.includes(requiredPermission);
              setIsAllowed(!!hasPermission);
            } catch (error) {
              console.error('Error parsing JWT payload:', error);
              setIsAllowed(false);
            }
          } else {
            setIsAllowed(false);
          }
        } else {
          // No specific permission required, just authentication
          setIsAllowed(true);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAllowed(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [requiredPermission, location.pathname]);
  
  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="protected-route-loading">
        <LoadingSpinner />
      </div>
    );
  }
  
  // If not authenticated or doesn't have required permission, redirect to login
  if (!isAllowed) {
    return (
      <Navigate 
        to={redirectPath} 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }
  
  // If authenticated and has required permission, render the children
  return <>{children}</>;
};

export default ProtectedRoute;