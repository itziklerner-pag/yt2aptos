import { UserDocument } from '../models/user.model';
import { AuthResponse, AuthTokens, JwtPayload, LoginRequest, RegisterRequest, UserRole, Permission, RefreshTokenRequest, PasswordResetRequest, PasswordUpdateRequest } from '@yt2aptos/shared';
/**
 * Authentication service that handles user authentication and authorization
 */
declare class AuthService {
    private readonly SALT_ROUNDS;
    private readonly ACCESS_TOKEN_EXPIRY;
    private readonly REFRESH_TOKEN_EXPIRY;
    private readonly PASSWORD_RESET_EXPIRY;
    private readonly JWT_REFRESH_SECRET;
    private readonly refreshTokens;
    private readonly resetTokens;
    /**
     * Register a new user with traditional authentication
     */
    register(userData: RegisterRequest): Promise<AuthResponse>;
    /**
     * Login with username and password
     */
    login(credentials: LoginRequest): Promise<AuthResponse>;
    /**
     * Logout user by blacklisting their refresh token
     */
    logout(refreshToken: string): Promise<void>;
    /**
     * Refresh access token using refresh token
     */
    refreshToken(tokenRequest: RefreshTokenRequest): Promise<AuthTokens>;
    /**
     * Validate access token and get user data
     */
    validateToken(token: string): Promise<JwtPayload>;
    /**
     * Request password reset
     */
    requestPasswordReset(request: PasswordResetRequest): Promise<{
        message: string;
    }>;
    /**
     * Reset password with token
     */
    resetPassword(request: PasswordUpdateRequest): Promise<{
        message: string;
    }>;
    /**
     * Check if user has a specific permission
     */
    hasPermission(user: UserDocument | JwtPayload, permission: Permission): boolean;
    /**
     * Get user permissions based on role
     */
    getUserPermissions(role: UserRole): Permission[];
    /**
     * Hash a password
     */
    private hashPassword;
    /**
     * Verify a password against a hash
     */
    private verifyPassword;
    /**
     * Generate access and refresh tokens
     */
    private generateTokens;
    /**
     * Store refresh token
     */
    private storeRefreshToken;
    /**
     * Map User document to UserDTO
     */
    private mapUserToDTO;
}
declare const _default: AuthService;
export default _default;
