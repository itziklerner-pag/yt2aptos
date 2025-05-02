import { 
  WalletAuthRequest, 
  AccountLinkRequest, 
  AuthResponse 
} from '../types/auth.types';
import apiClient from '../utils/api-client';
import authService from './auth.service';

/**
 * Service for Aptos blockchain wallet integration with the frontend
 */
class AptosService {
  private wallet: any = null; // Will be set when connected to a wallet
  
  /**
   * Initialize the Aptos service
   */
  constructor() {
    // Check if wallet is available in window
    this.detectWallet();
    
    // Listen for wallet changes (account changes, disconnect, etc.)
    this.setupWalletListeners();
  }
  
  /**
   * Detect available wallet
   */
  private detectWallet(): void {
    // Check if Petra, Martian, or other Aptos wallets are available in window
    if (typeof window !== 'undefined') {
      // Check for window.aptos (Petra wallet)
      if ((window as any).aptos) {
        console.log('Petra wallet detected');
      } else if ((window as any).martian) {
        console.log('Martian wallet detected');
      }
      
      // Check for other Aptos wallets as needed
      // This can be expanded as more wallets become available
    }
  }
  
  /**
   * Setup wallet event listeners
   */
  private setupWalletListeners(): void {
    if (typeof window !== 'undefined') {
      // Listen for wallet events
      // This will be implemented based on the specific wallet's API
      
      // Example for Petra wallet events:
      if ((window as any).aptos) {
        (window as any).aptos.onAccountChange((account: any) => {
          console.log('Wallet account changed:', account);
          // Handle account change
        });
        
        (window as any).aptos.onNetworkChange((network: any) => {
          console.log('Wallet network changed:', network);
          // Handle network change
        });
        
        (window as any).aptos.onDisconnect(() => {
          console.log('Wallet disconnected');
          this.wallet = null;
          // Handle wallet disconnect
        });
      }
      
      // Example for Martian wallet events:
      else if ((window as any).martian) {
        // Set up Martian wallet listeners if they have an event system
      }
    }
  }
  
  /**
   * Check if a wallet is connected
   */
  public isWalletConnected(): boolean {
    return !!this.wallet;
  }
  
  /**
   * Get the connected wallet address
   */
  public getWalletAddress(): string | null {
    try {
      return this.wallet?.address || null;
    } catch (error) {
      console.error('Error getting wallet address:', error);
      return null;
    }
  }
  
  /**
   * Connect to an Aptos wallet
   */
  public async connectWallet(): Promise<string | null> {
    try {
      // Connect to the wallet
      if (typeof window !== 'undefined') {
        // Try to connect to Petra wallet
        if ((window as any).aptos) {
          try {
            const response = await (window as any).aptos.connect();
            console.log('Connected to Petra wallet:', response);
            this.wallet = response;
            return response.address;
          } catch (error) {
            console.error('Error connecting to Petra wallet:', error);
            throw error;
          }
        } 
        // Try to connect to Martian wallet
        else if ((window as any).martian) {
          try {
            const response = await (window as any).martian.connect();
            console.log('Connected to Martian wallet:', response);
            this.wallet = response;
            return response.address;
          } catch (error) {
            console.error('Error connecting to Martian wallet:', error);
            throw error;
          }
        } 
        // No compatible wallet found
        else {
          throw new Error('No Aptos wallet detected. Please install Petra or Martian wallet extension.');
        }
      }
      return null;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }
  
  /**
   * Disconnect from the wallet
   */
  public async disconnectWallet(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && this.wallet) {
        if ((window as any).aptos) {
          // Disconnect from Petra wallet
          await (window as any).aptos.disconnect();
        } 
        else if ((window as any).martian) {
          // Disconnect from Martian wallet
          await (window as any).martian.disconnect();
        }
        this.wallet = null;
      }
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      throw error;
    }
  }
  
  /**
   * Generate a challenge for wallet authentication
   */
  public async generateChallenge(address: string): Promise<{ nonce: string, prefix: string }> {
    try {
      // Use the web3 challenge endpoint
      const response = await apiClient.get<{ nonce: string, walletAuthPrefix: string }>('/auth/web3/challenge', {
        params: { address } // Pass address as query parameter
      });
      
      return {
        nonce: response.data.nonce,
        prefix: response.data.walletAuthPrefix
      };
    } catch (error) {
      console.error('Error generating authentication challenge:', error);
      throw error;
    }
  }
  
  /**
   * Sign a message with the wallet
   */
  public async signMessage(message: string): Promise<string> {
    try {
      if (!this.wallet) {
        throw new Error('Wallet not connected');
      }
      
      if (typeof window !== 'undefined') {
        // Sign with Petra wallet
        if ((window as any).aptos) {
          const response = await (window as any).aptos.signMessage({
            message, // The message to sign
            nonce: 'APTOSFS_NONCE' // Optional nonce for additional security
          });
          
          console.log('Message signed with Petra wallet:', response);
          return response.signature;
        } 
        // Sign with Martian wallet
        else if ((window as any).martian) {
          const response = await (window as any).martian.signMessage(message);
          console.log('Message signed with Martian wallet:', response);
          return response.signature;
        } 
        // No compatible wallet found
        else {
          throw new Error('No Aptos wallet detected');
        }
      }
      
      throw new Error('Browser environment not available');
    } catch (error) {
      console.error('Error signing message:', error);
      throw error;
    }
  }
  
  /**
   * Authenticate with wallet
   */
  public async authenticateWithWallet(): Promise<AuthResponse> {
    try {
      // 1. Connect to wallet
      const address = await this.connectWallet();
      
      if (!address) {
        throw new Error('Failed to connect to wallet');
      }
      
      // 2. Generate challenge
      const { nonce, prefix } = await this.generateChallenge(address);
      
      // 3. Sign the message
      const message = `${prefix}${nonce}`;
      const signature = await this.signMessage(message);
      
      // 4. Authenticate with backend
      const authRequest: WalletAuthRequest = {
        address,
        signature,
        message
      };
      
      const response = await apiClient.post<AuthResponse>('/auth/web3/verify', authRequest);
      
      // Store authentication data
      localStorage.setItem('aptosfs_auth_tokens', JSON.stringify(response.data.tokens));
      localStorage.setItem('aptosfs_user', JSON.stringify(response.data.user));
      
      return response.data;
    } catch (error) {
      console.error('Wallet authentication error:', error);
      throw error;
    }
  }
  
  /**
   * Link wallet to existing account
   */
  public async linkWalletToAccount(): Promise<{ message: string, user: any }> {
    try {
      // 1. Make sure user is authenticated
      if (!authService.isAuthenticated()) {
        throw new Error('You must be logged in to link a wallet');
      }
      
      // 2. Connect to wallet
      const address = await this.connectWallet();
      
      if (!address) {
        throw new Error('Failed to connect to wallet');
      }
      
      // 3. Generate challenge for linking
      const { nonce, prefix } = await this.generateChallenge(address);
      
      // 4. Sign the message
      const message = `${prefix}${nonce}`;
      const signature = await this.signMessage(message);
      
      // 5. Link the wallet
      const linkRequest: AccountLinkRequest = {
        address,
        signature,
        message
      };
      
      const response = await apiClient.post<{ message: string, user: any }>('/auth/web3/link', linkRequest);
      
      return response.data;
    } catch (error) {
      console.error('Wallet linking error:', error);
      throw error;
    }
  }
  
  /**
   * Get wallet authentication profile
   * Specifically for Web3 authenticated users
   */
  public async getWeb3Profile(): Promise<any> {
    try {
      // Make sure user is authenticated
      if (!authService.isAuthenticated()) {
        throw new Error('You must be logged in to view Web3 profile');
      }
      
      // Get profile from the web3 profile endpoint
      const response = await apiClient.get<{ user: any }>('/auth/web3/profile');
      
      return response.data.user;
    } catch (error) {
      console.error('Error getting Web3 profile:', error);
      throw error;
    }
  }
  
  /**
   * Check if the connected wallet has special properties
   * like NFTs or token balances that would grant additional permissions
   */
  public async checkWalletProperties(): Promise<{
    hasSpecialNft: boolean,
    tokenBalance: number,
    role: string
  }> {
    try {
      if (!this.isWalletConnected()) {
        throw new Error('Wallet not connected');
      }
      
      // This would be a custom API endpoint, we'll mock it for now
      // In a real implementation, this would query the blockchain or backend
      // which would check the blockchain for the wallet's properties
      
      // For demo purposes, we'll just return some mock data
      return {
        hasSpecialNft: true,
        tokenBalance: 1000,
        role: 'user'
      };
    } catch (error) {
      console.error('Error checking wallet properties:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new AptosService();