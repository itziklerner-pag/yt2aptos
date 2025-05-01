import axios from 'axios';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  PasswordResetRequest,
  PasswordUpdateRequest,
  AuthTokens,
  JwtPayload,
  UserDTO
} from '../../../shared/src/auth/types';
import { jwtDecode } from 'jwt-decode';
import api from '../utils/api-client';

/**
 * Token storage keys
 */
const TOKEN_STORAGE_KEY = 'yt2aptos_auth_tokens';
const USER_STORAGE_KEY = 'yt2aptos_user';

/**
 * Authentication service for frontend
 */
class AuthService {
  private tokens: AuthTokens | null = null;
  private user: UserDTO | null = null;
  private refreshPromise: Promise<AuthTokens> | null = null;
  private tokenRefreshTimeout: NodeJS.Timeout | null = null;
  
  constructor() {
    this.loadFromStorage();
    this.setupTokenRefresh();
    this.setupApiInterceptors();
  }
  
  /**
   * Register a new user
   * @param userData User registration data
   */
  public async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', userData);
    this.setAuthData(response.data);
    return response.data;
  }
  
  /**
   * Login a user with username and password
   * @param credentials User login credentials
   */
  public async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    this.setAuthData(response.data);
    return response.data;
  }
  
  /**
   * Logout the current user
   */
  public async logout(): Promise<void> {
    try {
      if (this.tokens?.refreshToken) {
        await api.post('/auth/logout', { refreshToken: this.tokens.refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuthData();
    }
  }
  
  /**
   * Refresh the access token
   */
  public async refreshToken(): Promise<AuthTokens> {
    // If another refresh is in progress, return that promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    
    try {
      this.refreshPromise = new Promise<AuthTokens>(async (resolve, reject) => {
        try {
          if (!this.tokens?.refreshToken) {
            throw new Error('No refresh token available');
          }
          
          const request: RefreshTokenRequest = {
            refreshToken: this.tokens.refreshToken
          };
          
          const response = await axios.post<AuthTokens>(
            `${api.defaults.baseURL}/auth/refresh-token`,
            request
          );
          
          this.tokens = response.data;
          this.saveToStorage();
          this.setupTokenRefresh();
          
          resolve(response.data);
        } catch (error) {
          this.clearAuthData();
          reject(error);
        }
      });
      
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }
  
  /**
   * Request a password reset
   * @param email User email
   */
  public async requestPasswordReset(email: string): Promise<{ message: string }> {
    const request: PasswordResetRequest = { email };
    const response = await api.post<{ message: string }>('/auth/password-reset/request', request);
    return response.data;
  }
  
  /**
   * Reset password with token
   * @param resetToken Password reset token
   * @param newPassword New password
   */
  public async resetPassword(resetToken: string, newPassword: string): Promise<{ message: string }> {
    const request: PasswordUpdateRequest = { resetToken, newPassword };
    const response = await api.post<{ message: string }>('/auth/password-reset/reset', request);
    return response.data;
  }
  
  /**
   * Get current user
   */
  public async getCurrentUser(): Promise<UserDTO | null> {
    try {
      if (!this.isAuthenticated()) {
        return null;
      }
      
      const response = await api.get<{ user: UserDTO }>('/auth/me');
      this.user = response.data.user;
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(this.user));
      return this.user;
    } catch (error) {
      console.error('Get current user error:', error);
      
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        this.clearAuthData();
      }
      
      return null;
    }
  }
  
  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return !!this.tokens?.accessToken && !this.isTokenExpired();
  }
  
  /**
   * Get the current user data
   */
  public getUser(): UserDTO | null {
    return this.user;
  }
  
  /**
   * Get access token
   */
  public getAccessToken(): string | null {
    return this.tokens?.accessToken || null;
  }
  
  /**
   * Check if token is expired
   */
  private isTokenExpired(): boolean {
    if (!this.tokens?.accessToken) {
      return true;
    }
    
    try {
      const decoded = jwtDecode<JwtPayload & { exp: number }>(this.tokens.accessToken);
      const currentTime = Date.now() / 1000;
      
      return decoded.exp < currentTime;
    } catch (error) {
      console.error('Token decode error:', error);
      return true;
    }
  }
  
  /**
   * Set authentication data after login or register
   */
  private setAuthData(authResponse: AuthResponse): void {
    this.tokens = authResponse.tokens;
    this.user = authResponse.user;
    this.saveToStorage();
    this.setupTokenRefresh();
  }
  
  /**
   * Clear authentication data on logout
   */
  private clearAuthData(): void {
    this.tokens = null;
    this.user = null;
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    
    if (this.tokenRefreshTimeout) {
      clearTimeout(this.tokenRefreshTimeout);
      this.tokenRefreshTimeout = null;
    }
  }
  
  /**
   * Save authentication data to local storage
   */
  private saveToStorage(): void {
    if (this.tokens) {
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(this.tokens));
    }
    
    if (this.user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(this.user));
    }
  }
  
  /**
   * Load authentication data from local storage
   */
  private loadFromStorage(): void {
    const tokensStr = localStorage.getItem(TOKEN_STORAGE_KEY);
    const userStr = localStorage.getItem(USER_STORAGE_KEY);
    
    if (tokensStr) {
      try {
        this.tokens = JSON.parse(tokensStr);
      } catch (error) {
        console.error('Error parsing tokens from storage:', error);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    }
    
    if (userStr) {
      try {
        this.user = JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user from storage:', error);
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
  }
  
  /**
   * Setup automatic token refresh before expiration
   */
  private setupTokenRefresh(): void {
    if (this.tokenRefreshTimeout) {
      clearTimeout(this.tokenRefreshTimeout);
      this.tokenRefreshTimeout = null;
    }
    
    if (!this.tokens?.accessToken) {
      return;
    }
    
    try {
      const decoded = jwtDecode<JwtPayload & { exp: number }>(this.tokens.accessToken);
      const expiresInMs = (decoded.exp * 1000) - Date.now() - 60000; // Refresh 1 minute before expiry
      
      if (expiresInMs <= 0) {
        // Token already expired or about to expire, refresh immediately
        this.refreshToken().catch(error => {
          console.error('Token refresh error:', error);
          this.clearAuthData();
        });
        return;
      }
      
      this.tokenRefreshTimeout = setTimeout(() => {
        this.refreshToken().catch(error => {
          console.error('Token refresh error:', error);
          this.clearAuthData();
        });
      }, expiresInMs);
    } catch (error) {
      console.error('Setup token refresh error:', error);
    }
  }
  
  /**
   * Setup API interceptors for automatic token handling
   */
  private setupApiInterceptors(): void {
    // Request interceptor to add token
    api.interceptors.request.use(
      config => {
        if (this.tokens?.accessToken) {
          config.headers.Authorization = `Bearer ${this.tokens.accessToken}`;
        }
        return config;
      },
      error => Promise.reject(error)
    );
    
    // Response interceptor to handle token refresh
    api.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;
        
        // If error is 401 Unauthorized and not from a token refresh request
        if (error.response?.status === 401 && 
            !originalRequest._retry && 
            originalRequest.url !== '/auth/refresh-token') {
          
          originalRequest._retry = true;
          
          try {
            // Try to refresh the token
            const tokens = await this.refreshToken();
            
            // Update the request with the new token
            originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
            
            // Retry the original request
            return api(originalRequest);
          } catch (refreshError) {
            // If refresh fails, clear auth data and reject
            this.clearAuthData();
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }
}

export default new AuthService();