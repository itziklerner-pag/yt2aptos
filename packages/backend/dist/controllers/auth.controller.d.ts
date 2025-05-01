import { Request, Response } from 'express';
/**
 * Controller for authentication operations
 */
export declare class AuthController {
    /**
     * Register a new user
     * @param req Express request
     * @param res Express response
     */
    static register(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Login a user
     * @param req Express request
     * @param res Express response
     */
    static login(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Logout a user
     * @param req Express request
     * @param res Express response
     */
    static logout(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Refresh an access token
     * @param req Express request
     * @param res Express response
     */
    static refreshToken(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Request a password reset
     * @param req Express request
     * @param res Express response
     */
    static requestPasswordReset(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Reset a password using a token
     * @param req Express request
     * @param res Express response
     */
    static resetPassword(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Generate a wallet authentication nonce
     * @param req Express request
     * @param res Express response
     */
    static generateWalletNonce(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Authenticate using a wallet
     * @param req Express request
     * @param res Express response
     */
    static walletAuth(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Link a wallet to an existing account
     * @param req Express request
     * @param res Express response
     */
    static linkWallet(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Get the currently authenticated user
     * @param req Express request
     * @param res Express response
     */
    static getCurrentUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
