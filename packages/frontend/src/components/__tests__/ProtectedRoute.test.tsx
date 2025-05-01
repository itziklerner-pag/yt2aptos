import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import authService from '../../services/auth.service';
import { Permission } from '../../../../shared/src/auth/types';

// Mock the auth service
jest.mock('../../services/auth.service', () => ({
  isAuthenticated: jest.fn(),
  getCurrentUser: jest.fn(),
  getAccessToken: jest.fn()
}));

// Mock Buffer for JWT decoding
global.Buffer = {
  from: jest.fn().mockReturnValue({
    toString: jest.fn()
  })
} as any;

// Mock JSON.parse for JWT payload
const originalJSONParse = JSON.parse;
jest.spyOn(JSON, 'parse').mockImplementation((text) => {
  if (typeof text === 'string' && text.includes('mockPayload')) {
    return { permissions: [Permission.VIEW_CONTENT, Permission.MANAGE_CONTENT] };
  }
  return originalJSONParse(text);
});

describe('ProtectedRoute Component', () => {
  // Setup test routes
  const TestComponent = () => <div data-testid="protected-content">Protected Content</div>;
  const LoginComponent = () => <div data-testid="login-page">Login Page</div>;
  
  const renderProtectedRoute = (requiredPermission?: Permission) => {
    return render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<LoginComponent />} />
          <Route 
            path="/protected" 
            element={
              <ProtectedRoute requiredPermission={requiredPermission}>
                <TestComponent />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays loading state initially', async () => {
    // Setup mock to delay authentication check
    (authService.isAuthenticated as jest.Mock).mockImplementation(() => {
      return new Promise(resolve => setTimeout(() => resolve(true), 100));
    });
    
    renderProtectedRoute();
    
    // Should show loading spinner first
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('redirects to login when user is not authenticated', async () => {
    // Setup mock to return not authenticated
    (authService.isAuthenticated as jest.Mock).mockReturnValue(false);
    
    renderProtectedRoute();
    
    // Wait for authentication check to complete
    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
    
    // Verify the auth service was called
    expect(authService.isAuthenticated).toHaveBeenCalled();
  });

  it('allows access when user is authenticated and no permission is required', async () => {
    // Setup mock to return authenticated
    (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
    
    renderProtectedRoute();
    
    // Wait for authentication check to complete
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
    
    // Verify the auth service was called
    expect(authService.isAuthenticated).toHaveBeenCalled();
  });

  it('redirects when user lacks required permission', async () => {
    // Setup mocks
    (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
    (authService.getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user1', name: 'Test User' });
    (authService.getAccessToken as jest.Mock).mockReturnValue('header.eyJtb2NrUGF5bG9hZCI6dHJ1ZX0=.signature');
    
    // Set up Buffer mock to return a payload without the required permission
    (Buffer.from as jest.Mock).mockReturnValue({
      toString: jest.fn().mockReturnValue('{"mockPayload":true}')
    });
    
    renderProtectedRoute(Permission.SYSTEM_ADMIN);
    
    // Wait for authentication check to complete
    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
    
    // Verify the services were called
    expect(authService.isAuthenticated).toHaveBeenCalled();
    expect(authService.getCurrentUser).toHaveBeenCalled();
    expect(authService.getAccessToken).toHaveBeenCalled();
  });

  it('allows access when user has required permission', async () => {
    // Setup mocks
    (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
    (authService.getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user1', name: 'Test User' });
    (authService.getAccessToken as jest.Mock).mockReturnValue('header.eyJtb2NrUGF5bG9hZCI6dHJ1ZX0=.signature');
    
    // Set up Buffer mock to return a payload with the required permission
    (Buffer.from as jest.Mock).mockReturnValue({
      toString: jest.fn().mockReturnValue('{"mockPayload":true}')
    });
    
    renderProtectedRoute(Permission.VIEW_CONTENT);
    
    // Wait for authentication check to complete
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
    
    // Verify the services were called
    expect(authService.isAuthenticated).toHaveBeenCalled();
    expect(authService.getCurrentUser).toHaveBeenCalled();
    expect(authService.getAccessToken).toHaveBeenCalled();
  });

  it('redirects when token parsing fails', async () => {
    // Setup mocks
    (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
    (authService.getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user1', name: 'Test User' });
    (authService.getAccessToken as jest.Mock).mockReturnValue('invalid.token.format');
    
    // Force JSON.parse to throw an error for this test
    jest.spyOn(JSON, 'parse').mockImplementationOnce(() => {
      throw new Error('Invalid token');
    });
    
    renderProtectedRoute(Permission.VIEW_CONTENT);
    
    // Wait for authentication check to complete
    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
    
    // Verify the services were called
    expect(authService.isAuthenticated).toHaveBeenCalled();
    expect(authService.getCurrentUser).toHaveBeenCalled();
    expect(authService.getAccessToken).toHaveBeenCalled();
  });

  it('redirects when no token is available', async () => {
    // Setup mocks
    (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
    (authService.getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user1', name: 'Test User' });
    (authService.getAccessToken as jest.Mock).mockReturnValue(null);
    
    renderProtectedRoute(Permission.VIEW_CONTENT);
    
    // Wait for authentication check to complete
    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
    
    // Verify the services were called
    expect(authService.isAuthenticated).toHaveBeenCalled();
    expect(authService.getCurrentUser).toHaveBeenCalled();
    expect(authService.getAccessToken).toHaveBeenCalled();
  });

  it('redirects when getCurrentUser throws an error', async () => {
    // Setup mocks
    (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
    (authService.getCurrentUser as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    renderProtectedRoute(Permission.VIEW_CONTENT);
    
    // Wait for authentication check to complete
    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
    
    // Verify the services were called
    expect(authService.isAuthenticated).toHaveBeenCalled();
    expect(authService.getCurrentUser).toHaveBeenCalled();
  });

  it('redirects to a custom path when specified', async () => {
    // Setup test with custom redirect path
    const customRender = () => {
      return render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/custom-login" element={<div data-testid="custom-login">Custom Login</div>} />
            <Route 
              path="/protected" 
              element={
                <ProtectedRoute redirectPath="/custom-login">
                  <TestComponent />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </MemoryRouter>
      );
    };
    
    // Setup mock to return not authenticated
    (authService.isAuthenticated as jest.Mock).mockReturnValue(false);
    
    customRender();
    
    // Wait for authentication check to complete
    await waitFor(() => {
      expect(screen.getByTestId('custom-login')).toBeInTheDocument();
    });
  });
});