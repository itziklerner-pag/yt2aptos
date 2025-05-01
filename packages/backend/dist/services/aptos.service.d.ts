import { AuthResponse, UserDTO, WalletAuthRequest, AccountLinkRequest } from '@yt2aptos/shared';
/**
 * Aptos integration service that handles wallet-based authentication
 * and blockchain interactions
 */
declare class AptosService {
    private readonly aptos;
    private readonly WALLET_AUTH_MESSAGE_PREFIX;
    private readonly ACCOUNT_LINK_MESSAGE_PREFIX;
    constructor();
    /**
     * Generate a new random nonce for wallet authentication
     */
    generateNonce(walletAddress: string): Promise<string>;
    /**
     * Authenticate a user using wallet signature
     */
    authenticateWithWallet(authRequest: WalletAuthRequest): Promise<AuthResponse>;
    /**
     * Link a wallet to an existing traditional account
     */
    linkWalletToAccount(userId: string, linkRequest: AccountLinkRequest): Promise<UserDTO>;
    /**
     * Verify a signature against a wallet address and message
     */
    private verifySignature;
    /**
     * Extract nonce from authentication message
     */
    private extractNonceFromMessage;
    /**
     * Generate authentication tokens for a wallet user
     */
    private generateTokens;
    /**
     * Map User document to UserDTO
     */
    private mapUserToDTO;
}
declare const _default: AptosService;
export default _default;
