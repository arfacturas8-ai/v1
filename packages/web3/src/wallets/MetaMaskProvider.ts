import { CryptoWallet, WalletProvider } from '../types';
import { ethers } from 'ethers';

export class MetaMaskProvider implements WalletProvider {
  private ethereum: any;

  constructor() {
    if (typeof window !== 'undefined') {
      this.ethereum = (window as any).ethereum;
    }
  }

  async connect(): Promise<CryptoWallet> {
    if (!this.isInstalled()) {
      throw new Error('MetaMask not installed. Please install MetaMask browser extension.');
    }

    try {
      // Request account access
      const accounts = await this.ethereum.request({
        method: 'eth_requestAccounts'
      });

      // Get network
      const chainId = await this.ethereum.request({
        method: 'eth_chainId'
      });

      // Get balance
      const balance = await this.ethereum.request({
        method: 'eth_getBalance',
        params: [accounts[0], 'latest']
      });

      return {
        address: accounts[0],
        network: this.getNetworkName(chainId),
        type: 'metamask',
        balance: this.hexToEth(balance),
        chainId: parseInt(chainId, 16),
        isConnected: true
      };
    } catch (error: any) {
      throw new Error(`MetaMask connection failed: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    // MetaMask doesn't have a true disconnect method
    // We can only clear our internal state
    // The user must manually disconnect from MetaMask
    console.log('Please disconnect from MetaMask manually');
  }

  async signMessage(message: string): Promise<string> {
    const accounts = await this.ethereum.request({
      method: 'eth_accounts'
    });

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts connected');
    }

    return await this.ethereum.request({
      method: 'personal_sign',
      params: [message, accounts[0]]
    });
  }

  async sendTransaction(transaction: any): Promise<string> {
    return await this.ethereum.request({
      method: 'eth_sendTransaction',
      params: [transaction]
    });
  }

  async getBalance(address: string): Promise<string> {
    const balance = await this.ethereum.request({
      method: 'eth_getBalance',
      params: [address, 'latest']
    });
    return this.hexToEth(balance);
  }

  isInstalled(): boolean {
    return Boolean(this.ethereum && this.ethereum.isMetaMask);
  }

  // Event listeners
  onAccountChanged(callback: (accounts: string[]) => void): void {
    if (this.ethereum) {
      this.ethereum.on('accountsChanged', callback);
    }
  }

  onChainChanged(callback: (chainId: string) => void): void {
    if (this.ethereum) {
      this.ethereum.on('chainChanged', callback);
    }
  }

  // Switch to a different network
  async switchNetwork(chainId: number): Promise<void> {
    const chainIdHex = `0x${chainId.toString(16)}`;
    
    try {
      await this.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }]
      });
    } catch (error: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (error.code === 4902) {
        throw new Error('Please add this network to MetaMask');
      }
      throw error;
    }
  }

  // Add a custom network
  async addNetwork(chainConfig: any): Promise<void> {
    await this.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [chainConfig]
    });
  }

  // Helper methods
  private getNetworkName(chainId: string): 'ethereum' | 'polygon' | 'arbitrum' | 'optimism' {
    const networks: Record<string, 'ethereum' | 'polygon' | 'arbitrum' | 'optimism'> = {
      '0x1': 'ethereum',
      '0x89': 'polygon',
      '0xa4b1': 'arbitrum',
      '0xa': 'optimism'
    };
    return networks[chainId] || 'ethereum';
  }

  private hexToEth(hex: string): string {
    return ethers.formatEther(hex);
  }

  // Get the current connected account
  async getCurrentAccount(): Promise<string | null> {
    const accounts = await this.ethereum.request({
      method: 'eth_accounts'
    });
    return accounts && accounts.length > 0 ? accounts[0] : null;
  }

  // Request permissions (for mobile wallets)
  async requestPermissions(): Promise<any> {
    return await this.ethereum.request({
      method: 'wallet_requestPermissions',
      params: [{ eth_accounts: {} }]
    });
  }

  // Watch an asset (add token to MetaMask)
  async watchAsset(tokenAddress: string, tokenSymbol: string, tokenDecimals: number, tokenImage?: string): Promise<boolean> {
    return await this.ethereum.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20',
        options: {
          address: tokenAddress,
          symbol: tokenSymbol,
          decimals: tokenDecimals,
          image: tokenImage
        }
      }
    });
  }
}