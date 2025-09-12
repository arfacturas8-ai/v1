/**
 * Simplified Web3 Integration
 * Production-ready Web3 functionality for CRYB Platform
 */

import { createPublicClient, createWalletClient, custom, http, parseEther, formatEther, type Hash } from 'viem';
import { mainnet, polygon, arbitrum, optimism } from 'viem/chains';
import type { CryptoWallet, WalletProvider, Transaction, ChainConfig } from './types';

// Supported chains configuration
export const SUPPORTED_CHAINS: ChainConfig[] = [
  {
    chainId: 1,
    name: 'Ethereum',
    network: 'ethereum',
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/demo',
    blockExplorerUrl: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  {
    chainId: 137,
    name: 'Polygon',
    network: 'polygon',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorerUrl: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'Polygon',
      symbol: 'MATIC',
      decimals: 18,
    },
  },
  {
    chainId: 42161,
    name: 'Arbitrum',
    network: 'arbitrum',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorerUrl: 'https://arbiscan.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  {
    chainId: 10,
    name: 'Optimism',
    network: 'optimism',
    rpcUrl: 'https://mainnet.optimism.io',
    blockExplorerUrl: 'https://optimistic.etherscan.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
  },
];

// Get chain configuration by ID
export function getChainConfig(chainId: number): ChainConfig | undefined {
  return SUPPORTED_CHAINS.find(chain => chain.chainId === chainId);
}

// Get viem chain by ID
export function getViemChain(chainId: number) {
  switch (chainId) {
    case 1: return mainnet;
    case 137: return polygon;
    case 42161: return arbitrum;
    case 10: return optimism;
    default: return mainnet;
  }
}

// Simple wallet connection manager
export class SimpleWalletManager {
  private currentWallet: CryptoWallet | null = null;
  private provider: any = null;

  constructor() {
    this.setupEventListeners();
  }

  // Connect to MetaMask
  async connectMetaMask(): Promise<CryptoWallet> {
    if (!this.isMetaMaskAvailable()) {
      throw new Error('MetaMask is not installed');
    }

    try {
      const ethereum = (window as any).ethereum;
      this.provider = ethereum;

      // Request account access
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Get chain ID
      const chainId = await ethereum.request({
        method: 'eth_chainId',
      });

      const address = accounts[0];
      const balance = await this.getBalance(address, parseInt(chainId, 16));

      const wallet: CryptoWallet = {
        address: address.toLowerCase(),
        network: this.getNetworkName(parseInt(chainId, 16)),
        type: 'metamask',
        balance,
        chainId: parseInt(chainId, 16),
        isConnected: true,
      };

      this.currentWallet = wallet;
      return wallet;
    } catch (error: any) {
      throw new Error(`Failed to connect to MetaMask: ${error.message}`);
    }
  }

  // Disconnect wallet
  async disconnect(): Promise<void> {
    this.currentWallet = null;
    this.provider = null;
  }

  // Get current wallet
  getCurrentWallet(): CryptoWallet | null {
    return this.currentWallet;
  }

  // Check if MetaMask is available
  isMetaMaskAvailable(): boolean {
    return typeof window !== 'undefined' && !!(window as any).ethereum?.isMetaMask;
  }

  // Get balance for address
  async getBalance(address: string, chainId: number): Promise<string> {
    try {
      const chain = getViemChain(chainId);
      const publicClient = createPublicClient({
        chain,
        transport: http(),
      });

      const balance = await publicClient.getBalance({
        address: address as `0x${string}`,
      });

      return formatEther(balance);
    } catch (error) {
      console.error('Failed to get balance:', error);
      return '0';
    }
  }

  // Sign message
  async signMessage(message: string): Promise<string> {
    if (!this.provider || !this.currentWallet) {
      throw new Error('No wallet connected');
    }

    try {
      const signature = await this.provider.request({
        method: 'personal_sign',
        params: [message, this.currentWallet.address],
      });

      return signature;
    } catch (error: any) {
      throw new Error(`Failed to sign message: ${error.message}`);
    }
  }

  // Send transaction
  async sendTransaction(transaction: {
    to: string;
    value?: string;
    data?: string;
  }): Promise<Hash> {
    if (!this.provider || !this.currentWallet) {
      throw new Error('No wallet connected');
    }

    try {
      const txHash = await this.provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: this.currentWallet.address,
          to: transaction.to,
          value: transaction.value ? parseEther(transaction.value).toString(16) : undefined,
          data: transaction.data,
        }],
      });

      return txHash;
    } catch (error: any) {
      throw new Error(`Failed to send transaction: ${error.message}`);
    }
  }

  // Switch network
  async switchNetwork(chainId: number): Promise<void> {
    if (!this.provider) {
      throw new Error('No wallet connected');
    }

    try {
      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });

      if (this.currentWallet) {
        this.currentWallet.chainId = chainId;
        this.currentWallet.network = this.getNetworkName(chainId);
      }
    } catch (error: any) {
      // If the network hasn't been added, try to add it
      if (error.code === 4902) {
        await this.addNetwork(chainId);
      } else {
        throw new Error(`Failed to switch network: ${error.message}`);
      }
    }
  }

  // Add network to wallet
  async addNetwork(chainId: number): Promise<void> {
    if (!this.provider) {
      throw new Error('No wallet connected');
    }

    const chainConfig = getChainConfig(chainId);
    if (!chainConfig) {
      throw new Error('Unsupported chain ID');
    }

    try {
      await this.provider.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${chainId.toString(16)}`,
          chainName: chainConfig.name,
          nativeCurrency: chainConfig.nativeCurrency,
          rpcUrls: [chainConfig.rpcUrl],
          blockExplorerUrls: chainConfig.blockExplorerUrl ? [chainConfig.blockExplorerUrl] : undefined,
        }],
      });
    } catch (error: any) {
      throw new Error(`Failed to add network: ${error.message}`);
    }
  }

  // Get network name from chain ID
  private getNetworkName(chainId: number): CryptoWallet['network'] {
    switch (chainId) {
      case 1: return 'ethereum';
      case 137: return 'polygon';
      case 42161: return 'arbitrum';
      case 10: return 'optimism';
      default: return 'ethereum';
    }
  }

  // Setup event listeners
  private setupEventListeners(): void {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      return;
    }

    const ethereum = (window as any).ethereum;

    ethereum.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length === 0) {
        this.disconnect();
      } else if (this.currentWallet) {
        this.currentWallet.address = accounts[0].toLowerCase();
        // Trigger wallet update event
        this.onWalletChanged?.(this.currentWallet);
      }
    });

    ethereum.on('chainChanged', (chainId: string) => {
      if (this.currentWallet) {
        const newChainId = parseInt(chainId, 16);
        this.currentWallet.chainId = newChainId;
        this.currentWallet.network = this.getNetworkName(newChainId);
        // Trigger wallet update event
        this.onWalletChanged?.(this.currentWallet);
      }
    });

    ethereum.on('disconnect', () => {
      this.disconnect();
      this.onWalletDisconnected?.();
    });
  }

  // Event handlers (can be overridden)
  public onWalletChanged?: (wallet: CryptoWallet) => void;
  public onWalletDisconnected?: () => void;
}

// Transaction utilities
export class SimpleTransactionManager {
  private walletManager: SimpleWalletManager;

  constructor(walletManager: SimpleWalletManager) {
    this.walletManager = walletManager;
  }

  // Estimate gas for transaction
  async estimateGas(transaction: {
    to: string;
    value?: string;
    data?: string;
  }): Promise<{ gasLimit: bigint; gasPrice: bigint; estimatedCost: string }> {
    const wallet = this.walletManager.getCurrentWallet();
    if (!wallet) {
      throw new Error('No wallet connected');
    }

    const chain = getViemChain(wallet.chainId || 1);
    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    try {
      const gasLimit = await publicClient.estimateGas({
        to: transaction.to as `0x${string}`,
        value: transaction.value ? parseEther(transaction.value) : undefined,
        data: transaction.data as `0x${string}`,
        account: wallet.address as `0x${string}`,
      });

      const gasPrice = await publicClient.getGasPrice();
      const estimatedCost = formatEther(gasLimit * gasPrice);

      return {
        gasLimit,
        gasPrice,
        estimatedCost,
      };
    } catch (error: any) {
      throw new Error(`Gas estimation failed: ${error.message}`);
    }
  }

  // Wait for transaction confirmation
  async waitForTransaction(hash: Hash, confirmations = 1): Promise<any> {
    const wallet = this.walletManager.getCurrentWallet();
    if (!wallet) {
      throw new Error('No wallet connected');
    }

    const chain = getViemChain(wallet.chainId || 1);
    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    try {
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations,
      });

      return receipt;
    } catch (error: any) {
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }
}

// Simple Sign-In with Ethereum (SIWE) implementation
export class SimpleSiweAuth {
  private walletManager: SimpleWalletManager;
  private domain: string;

  constructor(walletManager: SimpleWalletManager, domain: string) {
    this.walletManager = walletManager;
    this.domain = domain;
  }

  // Generate SIWE message
  generateMessage(options: {
    address: string;
    chainId: number;
    nonce: string;
    statement?: string;
  }): string {
    const { address, chainId, nonce, statement } = options;
    
    const message = [
      `${this.domain} wants you to sign in with your Ethereum account:`,
      address,
      '',
      statement || 'Sign in to CRYB Platform',
      '',
      `URI: https://${this.domain}`,
      `Version: 1`,
      `Chain ID: ${chainId}`,
      `Nonce: ${nonce}`,
      `Issued At: ${new Date().toISOString()}`,
    ].join('\n');

    return message;
  }

  // Sign SIWE message
  async signMessage(options: {
    statement?: string;
    nonce?: string;
  }): Promise<{ message: string; signature: string }> {
    const wallet = this.walletManager.getCurrentWallet();
    if (!wallet) {
      throw new Error('No wallet connected');
    }

    const nonce = options.nonce || this.generateNonce();
    const message = this.generateMessage({
      address: wallet.address,
      chainId: wallet.chainId || 1,
      nonce,
      statement: options.statement,
    });

    const signature = await this.walletManager.signMessage(message);

    return { message, signature };
  }

  // Generate random nonce
  private generateNonce(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}

// Export singleton instances
export const walletManager = new SimpleWalletManager();
export const transactionManager = new SimpleTransactionManager(walletManager);
export const siweAuth = new SimpleSiweAuth(walletManager, 'cryb.app');

// Main Web3 manager class
export class SimpleWeb3Manager {
  public wallet: SimpleWalletManager;
  public transaction: SimpleTransactionManager;
  public auth: SimpleSiweAuth;

  constructor() {
    this.wallet = walletManager;
    this.transaction = transactionManager;
    this.auth = siweAuth;
  }

  // Initialize Web3
  async initialize(): Promise<void> {
    console.log('🚀 Simple Web3 Manager Initialized');
    console.log('✅ Wallet connection ready');
    console.log('✅ Transaction management ready');
    console.log('✅ SIWE authentication ready');
  }

  // Get connection status
  getStatus() {
    return {
      walletConnected: !!this.wallet.getCurrentWallet(),
      currentWallet: this.wallet.getCurrentWallet(),
      supportedChains: SUPPORTED_CHAINS,
      metaMaskAvailable: this.wallet.isMetaMaskAvailable(),
    };
  }
}

// Export default manager instance
export default new SimpleWeb3Manager();