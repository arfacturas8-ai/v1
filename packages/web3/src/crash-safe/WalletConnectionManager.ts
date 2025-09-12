import { WalletClient, PublicClient } from 'viem';
import { connectionManager } from './ConnectionManager';
import { siweAuthManager } from './SiweAuthManager';

export interface WalletProvider {
  id: string;
  name: string;
  icon: string;
  rdns?: string;
  uuid?: string;
  isInstalled: () => boolean;
  connect: () => Promise<WalletConnectionResult>;
  disconnect: () => Promise<void>;
  getAccounts: () => Promise<string[]>;
  getChainId: () => Promise<number>;
  switchChain: (chainId: number) => Promise<void>;
  watchAsset: (asset: WatchAssetParams) => Promise<boolean>;
  personalSign: (message: string, address: string) => Promise<string>;
  signTypedData?: (data: any) => Promise<string>;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback: (...args: any[]) => void) => void;
}

export interface WalletConnectionResult {
  success: boolean;
  accounts: string[];
  chainId: number;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface WatchAssetParams {
  type: 'ERC20';
  options: {
    address: string;
    symbol: string;
    decimals: number;
    image?: string;
  };
}

export interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  account: string | null;
  accounts: string[];
  chainId: number | null;
  provider: WalletProvider | null;
  error: string | null;
  lastConnection: number;
  connectionAttempts: number;
}

export interface WalletConnectionConfig {
  maxRetries: number;
  retryDelay: number;
  connectionTimeout: number;
  enableAutoReconnect: boolean;
  reconnectInterval: number;
  requireUserGesture: boolean;
  supportedChainIds: number[];
}

export class CrashSafeWalletConnectionManager {
  private providers = new Map<string, WalletProvider>();
  private state: WalletState = {
    isConnected: false,
    isConnecting: false,
    account: null,
    accounts: [],
    chainId: null,
    provider: null,
    error: null,
    lastConnection: 0,
    connectionAttempts: 0
  };

  private listeners = new Map<string, Function[]>();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private logger = console;

  private readonly config: WalletConnectionConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    connectionTimeout: 30000,
    enableAutoReconnect: true,
    reconnectInterval: 5000,
    requireUserGesture: true,
    supportedChainIds: [1, 137, 42161, 8453, 10, 56] // Ethereum, Polygon, Arbitrum, Base, Optimism, BSC
  };

  constructor(config?: Partial<WalletConnectionConfig>) {
    this.config = { ...this.config, ...config };
    this.initializeProviders();
    this.setupEventListeners();
    this.loadPersistedState();
  }

  private initializeProviders(): void {
    // MetaMask Provider
    this.providers.set('metamask', {
      id: 'metamask',
      name: 'MetaMask',
      icon: 'https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg',
      rdns: 'io.metamask',
      isInstalled: () => {
        return typeof window !== 'undefined' && 
               typeof window.ethereum !== 'undefined' && 
               window.ethereum.isMetaMask === true;
      },
      connect: async () => this.connectMetaMask(),
      disconnect: async () => this.disconnectMetaMask(),
      getAccounts: async () => this.getMetaMaskAccounts(),
      getChainId: async () => this.getMetaMaskChainId(),
      switchChain: async (chainId: number) => this.switchMetaMaskChain(chainId),
      watchAsset: async (asset: WatchAssetParams) => this.watchMetaMaskAsset(asset),
      personalSign: async (message: string, address: string) => this.metaMaskPersonalSign(message, address),
      on: (event: string, callback: (...args: any[]) => void) => this.onMetaMaskEvent(event, callback),
      off: (event: string, callback: (...args: any[]) => void) => this.offMetaMaskEvent(event, callback)
    });

    // WalletConnect Provider (placeholder)
    this.providers.set('walletconnect', {
      id: 'walletconnect',
      name: 'WalletConnect',
      icon: 'https://registry.walletconnect.com/v2/logo/lg/walletconnect-logo.png',
      isInstalled: () => true, // WalletConnect is always available
      connect: async () => this.connectWalletConnect(),
      disconnect: async () => this.disconnectWalletConnect(),
      getAccounts: async () => this.getWalletConnectAccounts(),
      getChainId: async () => this.getWalletConnectChainId(),
      switchChain: async (chainId: number) => this.switchWalletConnectChain(chainId),
      watchAsset: async (asset: WatchAssetParams) => false,
      personalSign: async (message: string, address: string) => this.walletConnectPersonalSign(message, address),
      on: (event: string, callback: (...args: any[]) => void) => this.onWalletConnectEvent(event, callback),
      off: (event: string, callback: (...args: any[]) => void) => this.offWalletConnectEvent(event, callback)
    });

    // Coinbase Wallet Provider
    this.providers.set('coinbase', {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      icon: 'https://www.coinbase.com/img/favicon.ico',
      rdns: 'com.coinbase.wallet',
      isInstalled: () => {
        return typeof window !== 'undefined' && 
               typeof window.ethereum !== 'undefined' && 
               (window.ethereum.isCoinbaseWallet === true || window.ethereum.selectedProvider?.isCoinbaseWallet === true);
      },
      connect: async () => this.connectCoinbase(),
      disconnect: async () => this.disconnectCoinbase(),
      getAccounts: async () => this.getCoinbaseAccounts(),
      getChainId: async () => this.getCoinbaseChainId(),
      switchChain: async (chainId: number) => this.switchCoinbaseChain(chainId),
      watchAsset: async (asset: WatchAssetParams) => this.watchCoinbaseAsset(asset),
      personalSign: async (message: string, address: string) => this.coinbasePersonalSign(message, address),
      on: (event: string, callback: (...args: any[]) => void) => this.onCoinbaseEvent(event, callback),
      off: (event: string, callback: (...args: any[]) => void) => this.offCoinbaseEvent(event, callback)
    });
  }

  public getAvailableProviders(): WalletProvider[] {
    return Array.from(this.providers.values()).filter(provider => provider.isInstalled());
  }

  public async connectWallet(providerId: string, options?: { force?: boolean }): Promise<WalletConnectionResult> {
    if (this.state.isConnecting && !options?.force) {
      return {
        success: false,
        accounts: [],
        chainId: 0,
        error: {
          code: 'ALREADY_CONNECTING',
          message: 'Connection already in progress'
        }
      };
    }

    const provider = this.providers.get(providerId);
    if (!provider) {
      return {
        success: false,
        accounts: [],
        chainId: 0,
        error: {
          code: 'PROVIDER_NOT_FOUND',
          message: `Wallet provider ${providerId} not found`
        }
      };
    }

    if (!provider.isInstalled()) {
      return {
        success: false,
        accounts: [],
        chainId: 0,
        error: {
          code: 'PROVIDER_NOT_INSTALLED',
          message: `${provider.name} is not installed`
        }
      };
    }

    this.setState({ isConnecting: true, error: null });

    try {
      const result = await this.executeWithTimeout(
        async () => this.attemptConnectionWithRetries(provider),
        this.config.connectionTimeout
      );

      if (result.success) {
        this.setState({
          isConnected: true,
          isConnecting: false,
          provider,
          account: result.accounts[0] || null,
          accounts: result.accounts,
          chainId: result.chainId,
          error: null,
          lastConnection: Date.now(),
          connectionAttempts: 0
        });

        this.persistState();
        this.emit('connect', { provider: provider.id, account: result.accounts[0], chainId: result.chainId });
        
        if (this.config.enableAutoReconnect) {
          this.startReconnectMonitoring();
        }
      } else {
        this.setState({
          isConnecting: false,
          error: result.error?.message || 'Connection failed'
        });
        this.emit('error', result.error);
      }

      return result;
    } catch (error: any) {
      const errorResult = {
        success: false,
        accounts: [],
        chainId: 0,
        error: {
          code: 'CONNECTION_ERROR',
          message: error.message || 'Unknown connection error',
          details: error
        }
      };

      this.setState({
        isConnecting: false,
        error: errorResult.error.message
      });

      this.emit('error', errorResult.error);
      return errorResult;
    }
  }

  private async attemptConnectionWithRetries(provider: WalletProvider): Promise<WalletConnectionResult> {
    let lastError: any = null;

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        this.logger.info(`Connection attempt ${attempt + 1}/${this.config.maxRetries} for ${provider.name}`);
        
        const result = await provider.connect();
        
        if (result.success) {
          // Validate chain ID is supported
          if (!this.config.supportedChainIds.includes(result.chainId)) {
            this.logger.warn(`Unsupported chain ID: ${result.chainId}, attempting to switch`);
            
            try {
              await provider.switchChain(this.config.supportedChainIds[0]);
              result.chainId = this.config.supportedChainIds[0];
            } catch (switchError) {
              this.logger.warn('Failed to switch to supported chain:', switchError);
            }
          }

          return result;
        }

        lastError = result.error;
      } catch (error) {
        lastError = error;
        this.logger.warn(`Connection attempt ${attempt + 1} failed:`, error);
      }

      if (attempt < this.config.maxRetries - 1) {
        const delay = this.config.retryDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return {
      success: false,
      accounts: [],
      chainId: 0,
      error: {
        code: 'CONNECTION_FAILED',
        message: lastError?.message || 'Failed to connect after all retries',
        details: lastError
      }
    };
  }

  public async disconnectWallet(): Promise<void> {
    try {
      if (this.state.provider) {
        await this.state.provider.disconnect();
      }

      this.setState({
        isConnected: false,
        isConnecting: false,
        account: null,
        accounts: [],
        chainId: null,
        provider: null,
        error: null,
        lastConnection: 0,
        connectionAttempts: 0
      });

      this.clearPersistedState();
      this.stopReconnectMonitoring();
      this.emit('disconnect', {});
    } catch (error: any) {
      this.logger.warn('Error during wallet disconnect:', error);
      this.emit('error', { code: 'DISCONNECT_ERROR', message: error.message });
    }
  }

  public async switchChain(chainId: number): Promise<void> {
    if (!this.state.provider || !this.state.isConnected) {
      throw new Error('No wallet connected');
    }

    if (!this.config.supportedChainIds.includes(chainId)) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    try {
      await this.state.provider.switchChain(chainId);
      this.setState({ chainId, error: null });
      this.emit('chainChanged', { chainId });
    } catch (error: any) {
      const errorMsg = `Failed to switch to chain ${chainId}: ${error.message}`;
      this.setState({ error: errorMsg });
      throw new Error(errorMsg);
    }
  }

  public async signMessage(message: string): Promise<string> {
    if (!this.state.provider || !this.state.account) {
      throw new Error('No wallet connected');
    }

    try {
      return await this.state.provider.personalSign(message, this.state.account);
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('User rejected the signing request');
      }
      throw new Error(`Failed to sign message: ${error.message}`);
    }
  }

  public async watchAsset(asset: WatchAssetParams): Promise<boolean> {
    if (!this.state.provider) {
      throw new Error('No wallet connected');
    }

    try {
      return await this.state.provider.watchAsset(asset);
    } catch (error: any) {
      this.logger.warn('Failed to add asset to wallet:', error);
      return false;
    }
  }

  // MetaMask specific implementations
  private async connectMetaMask(): Promise<WalletConnectionResult> {
    if (!window.ethereum?.isMetaMask) {
      return {
        success: false,
        accounts: [],
        chainId: 0,
        error: { code: 'METAMASK_NOT_FOUND', message: 'MetaMask not found' }
      };
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });

      return {
        success: true,
        accounts: accounts.map((addr: string) => addr.toLowerCase()),
        chainId: parseInt(chainId, 16)
      };
    } catch (error: any) {
      return {
        success: false,
        accounts: [],
        chainId: 0,
        error: {
          code: error.code || 'METAMASK_ERROR',
          message: error.message || 'MetaMask connection failed'
        }
      };
    }
  }

  private async disconnectMetaMask(): Promise<void> {
    // MetaMask doesn't have a disconnect method, just remove listeners
    if (window.ethereum?.isMetaMask) {
      window.ethereum.removeAllListeners?.('accountsChanged');
      window.ethereum.removeAllListeners?.('chainChanged');
      window.ethereum.removeAllListeners?.('disconnect');
    }
  }

  private async getMetaMaskAccounts(): Promise<string[]> {
    if (!window.ethereum?.isMetaMask) return [];
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    return accounts.map((addr: string) => addr.toLowerCase());
  }

  private async getMetaMaskChainId(): Promise<number> {
    if (!window.ethereum?.isMetaMask) return 0;
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    return parseInt(chainId, 16);
  }

  private async switchMetaMaskChain(chainId: number): Promise<void> {
    if (!window.ethereum?.isMetaMask) return;
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        // Chain not added, attempt to add it
        await connectionManager.switchNetwork(chainId);
      } else {
        throw error;
      }
    }
  }

  private async watchMetaMaskAsset(asset: WatchAssetParams): Promise<boolean> {
    if (!window.ethereum?.isMetaMask) return false;
    
    try {
      return await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: asset.type,
          options: asset.options,
        },
      });
    } catch {
      return false;
    }
  }

  private async metaMaskPersonalSign(message: string, address: string): Promise<string> {
    if (!window.ethereum?.isMetaMask) throw new Error('MetaMask not available');
    
    return await window.ethereum.request({
      method: 'personal_sign',
      params: [message, address],
    });
  }

  private onMetaMaskEvent(event: string, callback: (...args: any[]) => void): void {
    if (window.ethereum?.isMetaMask) {
      window.ethereum.on(event, callback);
    }
  }

  private offMetaMaskEvent(event: string, callback: (...args: any[]) => void): void {
    if (window.ethereum?.isMetaMask) {
      window.ethereum.removeListener(event, callback);
    }
  }

  // WalletConnect implementations (placeholder - would need actual WalletConnect integration)
  private async connectWalletConnect(): Promise<WalletConnectionResult> {
    // This would integrate with @walletconnect/ethereum-provider
    return {
      success: false,
      accounts: [],
      chainId: 0,
      error: { code: 'NOT_IMPLEMENTED', message: 'WalletConnect not implemented yet' }
    };
  }

  private async disconnectWalletConnect(): Promise<void> {
    // WalletConnect disconnect implementation
  }

  private async getWalletConnectAccounts(): Promise<string[]> {
    return [];
  }

  private async getWalletConnectChainId(): Promise<number> {
    return 1;
  }

  private async switchWalletConnectChain(chainId: number): Promise<void> {
    // WalletConnect chain switching
  }

  private async walletConnectPersonalSign(message: string, address: string): Promise<string> {
    throw new Error('WalletConnect signing not implemented');
  }

  private onWalletConnectEvent(event: string, callback: (...args: any[]) => void): void {
    // WalletConnect event handling
  }

  private offWalletConnectEvent(event: string, callback: (...args: any[]) => void): void {
    // WalletConnect event removal
  }

  // Coinbase Wallet implementations (similar structure to MetaMask)
  private async connectCoinbase(): Promise<WalletConnectionResult> {
    const ethereum = window.ethereum?.selectedProvider?.isCoinbaseWallet ? 
      window.ethereum.selectedProvider : 
      window.ethereum?.providers?.find((p: any) => p.isCoinbaseWallet) || window.ethereum;

    if (!ethereum?.isCoinbaseWallet) {
      return {
        success: false,
        accounts: [],
        chainId: 0,
        error: { code: 'COINBASE_NOT_FOUND', message: 'Coinbase Wallet not found' }
      };
    }

    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      const chainId = await ethereum.request({ method: 'eth_chainId' });

      return {
        success: true,
        accounts: accounts.map((addr: string) => addr.toLowerCase()),
        chainId: parseInt(chainId, 16)
      };
    } catch (error: any) {
      return {
        success: false,
        accounts: [],
        chainId: 0,
        error: {
          code: error.code || 'COINBASE_ERROR',
          message: error.message || 'Coinbase Wallet connection failed'
        }
      };
    }
  }

  private async disconnectCoinbase(): Promise<void> {
    // Similar to MetaMask disconnect
  }

  private async getCoinbaseAccounts(): Promise<string[]> {
    const ethereum = window.ethereum?.selectedProvider?.isCoinbaseWallet ? 
      window.ethereum.selectedProvider : 
      window.ethereum?.providers?.find((p: any) => p.isCoinbaseWallet);
    
    if (!ethereum) return [];
    
    const accounts = await ethereum.request({ method: 'eth_accounts' });
    return accounts.map((addr: string) => addr.toLowerCase());
  }

  private async getCoinbaseChainId(): Promise<number> {
    const ethereum = window.ethereum?.selectedProvider?.isCoinbaseWallet ? 
      window.ethereum.selectedProvider : 
      window.ethereum?.providers?.find((p: any) => p.isCoinbaseWallet);
    
    if (!ethereum) return 0;
    
    const chainId = await ethereum.request({ method: 'eth_chainId' });
    return parseInt(chainId, 16);
  }

  private async switchCoinbaseChain(chainId: number): Promise<void> {
    const ethereum = window.ethereum?.selectedProvider?.isCoinbaseWallet ? 
      window.ethereum.selectedProvider : 
      window.ethereum?.providers?.find((p: any) => p.isCoinbaseWallet);
    
    if (!ethereum) return;
    
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });
  }

  private async watchCoinbaseAsset(asset: WatchAssetParams): Promise<boolean> {
    const ethereum = window.ethereum?.selectedProvider?.isCoinbaseWallet ? 
      window.ethereum.selectedProvider : 
      window.ethereum?.providers?.find((p: any) => p.isCoinbaseWallet);
    
    if (!ethereum) return false;
    
    try {
      return await ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: asset.type,
          options: asset.options,
        },
      });
    } catch {
      return false;
    }
  }

  private async coinbasePersonalSign(message: string, address: string): Promise<string> {
    const ethereum = window.ethereum?.selectedProvider?.isCoinbaseWallet ? 
      window.ethereum.selectedProvider : 
      window.ethereum?.providers?.find((p: any) => p.isCoinbaseWallet);
    
    if (!ethereum) throw new Error('Coinbase Wallet not available');
    
    return await ethereum.request({
      method: 'personal_sign',
      params: [message, address],
    });
  }

  private onCoinbaseEvent(event: string, callback: (...args: any[]) => void): void {
    const ethereum = window.ethereum?.selectedProvider?.isCoinbaseWallet ? 
      window.ethereum.selectedProvider : 
      window.ethereum?.providers?.find((p: any) => p.isCoinbaseWallet);
    
    if (ethereum?.on) {
      ethereum.on(event, callback);
    }
  }

  private offCoinbaseEvent(event: string, callback: (...args: any[]) => void): void {
    const ethereum = window.ethereum?.selectedProvider?.isCoinbaseWallet ? 
      window.ethereum.selectedProvider : 
      window.ethereum?.providers?.find((p: any) => p.isCoinbaseWallet);
    
    if (ethereum?.removeListener) {
      ethereum.removeListener(event, callback);
    }
  }

  // Utility methods
  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    // MetaMask events
    if (window.ethereum?.isMetaMask) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        this.handleAccountsChanged(accounts);
      });

      window.ethereum.on('chainChanged', (chainId: string) => {
        this.handleChainChanged(parseInt(chainId, 16));
      });

      window.ethereum.on('disconnect', () => {
        this.handleDisconnect();
      });
    }

    // Handle page visibility for reconnection
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.config.enableAutoReconnect) {
        this.attemptReconnection();
      }
    });
  }

  private handleAccountsChanged(accounts: string[]): void {
    if (accounts.length === 0) {
      this.disconnectWallet();
    } else {
      const newAccount = accounts[0].toLowerCase();
      if (newAccount !== this.state.account) {
        this.setState({
          account: newAccount,
          accounts: accounts.map(addr => addr.toLowerCase())
        });
        this.emit('accountChanged', { account: newAccount });
      }
    }
  }

  private handleChainChanged(chainId: number): void {
    this.setState({ chainId });
    this.emit('chainChanged', { chainId });
  }

  private handleDisconnect(): void {
    this.disconnectWallet();
  }

  private startReconnectMonitoring(): void {
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
    }

    this.reconnectTimer = setInterval(() => {
      this.attemptReconnection();
    }, this.config.reconnectInterval);
  }

  private stopReconnectMonitoring(): void {
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private async attemptReconnection(): Promise<void> {
    if (this.state.isConnecting || this.state.isConnected) {
      return;
    }

    const lastProvider = this.getPersistedProvider();
    if (lastProvider && this.providers.has(lastProvider)) {
      try {
        await this.connectWallet(lastProvider, { force: false });
      } catch (error) {
        this.logger.warn('Reconnection failed:', error);
      }
    }
  }

  private async executeWithTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Operation timed out')), timeout)
      )
    ]);
  }

  private setState(updates: Partial<WalletState>): void {
    this.state = { ...this.state, ...updates };
    this.emit('stateChange', this.state);
  }

  private persistState(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stateToSave = {
          providerId: this.state.provider?.id,
          lastConnection: this.state.lastConnection
        };
        window.localStorage.setItem('cryb_wallet_state', JSON.stringify(stateToSave));
      }
    } catch (error) {
      this.logger.warn('Failed to persist wallet state:', error);
    }
  }

  private loadPersistedState(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem('cryb_wallet_state');
        if (saved) {
          const state = JSON.parse(saved);
          // Only attempt auto-reconnect if it was recent (within 1 hour)
          if (state.lastConnection && Date.now() - state.lastConnection < 3600000) {
            setTimeout(() => this.attemptReconnection(), 1000);
          }
        }
      }
    } catch (error) {
      this.logger.warn('Failed to load persisted wallet state:', error);
    }
  }

  private clearPersistedState(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('cryb_wallet_state');
      }
    } catch (error) {
      this.logger.warn('Failed to clear persisted wallet state:', error);
    }
  }

  private getPersistedProvider(): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem('cryb_wallet_state');
        if (saved) {
          const state = JSON.parse(saved);
          return state.providerId || null;
        }
      }
    } catch (error) {
      this.logger.warn('Failed to get persisted provider:', error);
    }
    return null;
  }

  // Event management
  public on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  public off(event: string, callback: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          this.logger.warn('Error in event callback:', error);
        }
      });
    }
  }

  // Public getters
  public getState(): Readonly<WalletState> {
    return { ...this.state };
  }

  public isConnected(): boolean {
    return this.state.isConnected;
  }

  public getAccount(): string | null {
    return this.state.account;
  }

  public getChainId(): number | null {
    return this.state.chainId;
  }

  public getProvider(): WalletProvider | null {
    return this.state.provider;
  }

  public cleanup(): void {
    this.stopReconnectMonitoring();
    this.listeners.clear();
    
    // Clean up provider event listeners
    if (this.state.provider) {
      try {
        this.state.provider.disconnect();
      } catch (error) {
        this.logger.warn('Error during provider cleanup:', error);
      }
    }
  }
}

// Global window ethereum interface
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      isCoinbaseWallet?: boolean;
      selectedProvider?: any;
      providers?: any[];
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
      removeAllListeners?: (event?: string) => void;
    };
  }
}

// Export singleton instance
export const walletConnectionManager = new CrashSafeWalletConnectionManager();