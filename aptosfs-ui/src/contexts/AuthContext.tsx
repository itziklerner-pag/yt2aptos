import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthMethod, UserDTO, AuthTokens } from '../types/auth.types';
import authService from '../services/auth.service';
import aptosService from '../services/aptos.service';

// Define the authentication state interface
interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserDTO | null;
  authMethod: AuthMethod | null;
  tokens: AuthTokens | null;
  walletAddress: string | null;
  error: string | null;
}

// Define the context interface
interface AuthContextType extends AuthState {
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (username: string, email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  isWalletConnected: () => boolean;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create a provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    authMethod: null,
    tokens: null,
    walletAddress: null,
    error: null
  });

  // Initialize auth state from storage on component mount
  useEffect(() => {
    const initAuth = async () => {
      setState(prev => ({ ...prev, isLoading: true }));
      
      try {
        // Check if the user is already authenticated
        if (authService.isAuthenticated()) {
          const user = await authService.getCurrentUser();
          
          if (user) {
            setState({
              isAuthenticated: true,
              isLoading: false,
              user,
              authMethod: user.walletAddress ? AuthMethod.WALLET : AuthMethod.TRADITIONAL,
              tokens: {
                accessToken: authService.getAccessToken() || '',
                refreshToken: '', // The refresh token is stored securely and not exposed
                expiresIn: 0 // This will be handled internally by the authService
              },
              walletAddress: user.walletAddress || null,
              error: null
            });
            return;
          }
        }
        
        // Check if a wallet is connected but not authenticated
        if (aptosService.isWalletConnected()) {
          const walletAddress = aptosService.getWalletAddress();
          setState(prev => ({ 
            ...prev, 
            walletAddress,
            isLoading: false
          }));
          return;
        }
        
        // No authentication found
        setState(prev => ({ ...prev, isLoading: false }));
      } catch (error) {
        console.error('Authentication initialization error:', error);
        setState(prev => ({ 
          ...prev, 
          isLoading: false,
          error: 'Failed to initialize authentication'
        }));
      }
    };

    initAuth();
  }, []);

  // Traditional login
  const login = async (username: string, password: string, rememberMe = false) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await authService.login({ username, password });
      
      setState({
        isAuthenticated: true,
        isLoading: false,
        user: response.user,
        authMethod: AuthMethod.TRADITIONAL,
        tokens: response.tokens,
        walletAddress: response.user.walletAddress || null,
        error: null
      });
    } catch (error: any) {
      console.error('Login error:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: error.response?.data?.message || 'Login failed. Please check your credentials.'
      }));
      throw error;
    }
  };

  // Traditional registration
  const register = async (username: string, email: string, password: string, displayName?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await authService.register({ username, email, password, displayName });
      
      setState({
        isAuthenticated: true,
        isLoading: false,
        user: response.user,
        authMethod: AuthMethod.TRADITIONAL,
        tokens: response.tokens,
        walletAddress: null,
        error: null
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: error.response?.data?.message || 'Registration failed. Please try again.'
      }));
      throw error;
    }
  };

  // Connect wallet and authenticate
  const connectWallet = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // First connect the wallet
      const address = await aptosService.connectWallet();
      
      if (!address) {
        throw new Error('Failed to connect wallet');
      }
      
      // Then authenticate with the wallet
      const response = await aptosService.authenticateWithWallet();
      
      setState({
        isAuthenticated: true,
        isLoading: false,
        user: response.user,
        authMethod: AuthMethod.WALLET,
        tokens: response.tokens,
        walletAddress: address,
        error: null
      });
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      
      // If we connected the wallet but failed to authenticate,
      // we should still show the wallet as connected
      const walletAddress = aptosService.getWalletAddress();
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        walletAddress,
        error: error.message || 'Failed to connect wallet'
      }));
      
      throw error;
    }
  };

  // Disconnect wallet
  const disconnectWallet = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await aptosService.disconnectWallet();
      
      // If the user was authenticated with a wallet, also log them out
      if (state.authMethod === AuthMethod.WALLET) {
        await logout();
      } else {
        setState(prev => ({ 
          ...prev, 
          walletAddress: null,
          isLoading: false
        }));
      }
    } catch (error) {
      console.error('Disconnect wallet error:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: 'Failed to disconnect wallet'
      }));
    }
  };

  // Logout
  const logout = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await authService.logout();
      
      setState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        authMethod: null,
        tokens: null,
        walletAddress: aptosService.isWalletConnected() ? aptosService.getWalletAddress() : null,
        error: null
      });
    } catch (error) {
      console.error('Logout error:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: 'Logout failed'
      }));
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    if (!state.isAuthenticated) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const user = await authService.getCurrentUser();
      
      if (user) {
        setState(prev => ({ 
          ...prev, 
          user,
          isLoading: false
        }));
      } else {
        // If getCurrentUser returns null, the user is no longer authenticated
        setState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          authMethod: null,
          tokens: null,
          walletAddress: aptosService.isWalletConnected() ? aptosService.getWalletAddress() : null,
          error: null
        });
      }
    } catch (error) {
      console.error('Refresh user error:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false
      }));
    }
  };

  // Clear error
  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  // Check if wallet is connected
  const isWalletConnected = (): boolean => {
    return aptosService.isWalletConnected();
  };

  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    connectWallet,
    disconnectWallet,
    refreshUser,
    clearError,
    isWalletConnected
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};