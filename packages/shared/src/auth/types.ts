/**
 * Authentication and authorization type definitions for the YouTube Archiving System.
 * These types are shared between the frontend and backend.
 */

/**
 * Available authentication methods
 */
export enum AuthMethod {
  TRADITIONAL = 'traditional',
  WALLET = 'wallet',
}

/**
 * User roles for role-based access control
 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

/**
 * User permissions for fine-grained access control
 */
export enum Permission {
  // Content management permissions
  VIEW_CONTENT = 'view_content',
  MANAGE_CONTENT = 'manage_content',
  DELETE_CONTENT = 'delete_content',
  
  // User management permissions
  VIEW_USERS = 'view_users',
  MANAGE_USERS = 'manage_users',
  
  // Download management permissions
  CREATE_DOWNLOAD = 'create_download',
  VIEW_DOWNLOADS = 'view_downloads',
  MANAGE_DOWNLOADS = 'manage_downloads',
  
  // System management permissions
  SYSTEM_ADMIN = 'system_admin',
}

/**
 * Role permission mappings
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.USER]: [
    Permission.VIEW_CONTENT,
    Permission.CREATE_DOWNLOAD,
    Permission.VIEW_DOWNLOADS,
  ],
  [UserRole.ADMIN]: Object.values(Permission),
};

/**
 * Request data for traditional login
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Request data for traditional registration
 */
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}

/**
 * Request data for wallet authentication
 */
export interface WalletAuthRequest {
  address: string;
  signature: string;
  message: string;
}

/**
 * Response data for authentication operations
 */
export interface AuthResponse {
  user: UserDTO;
  tokens: AuthTokens;
}

/**
 * Data Transfer Object for User information
 */
export interface UserDTO {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  role: UserRole;
  walletAddress?: string;
  isEmailVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Authentication tokens
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * JWT token payload structure
 */
export interface JwtPayload {
  userId: string;
  username: string;
  email: string;
  role: UserRole;
  authMethod: AuthMethod;
  walletAddress?: string;
  permissions: Permission[];
}

/**
 * Request to refresh an authentication token
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password update request
 */
export interface PasswordUpdateRequest {
  resetToken: string;
  newPassword: string;
}

/**
 * Account linking request (connecting traditional account with wallet)
 */
export interface AccountLinkRequest {
  address: string;
  signature: string;
  message: string;
}

/**
 * MFA setup request
 */
export interface MfaSetupRequest {
  type: 'totp' | 'sms';
  phoneNumber?: string;
}

/**
 * MFA verification request
 */
export interface MfaVerifyRequest {
  code: string;
  userId: string;
}