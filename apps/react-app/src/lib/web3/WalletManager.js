// CRYB Platform Advanced Wallet Manager
// Enterprise-grade wallet connection with multiple providers and security features

import { ethers } from 'ethers';
import { CHAIN_IDS, NETWORK_CONFIGS } from '../contracts/cryb-contracts.js';

// Wallet provider types
export const WALLET_PROVIDERS = {
  METAMASK: 'metamask',
  WALLETCONNECT: 'walletconnect',
  COINBASE: 'coinbase',
  TRUST: 'trust',
  RAINBOW: 'rainbow',
  INJECTED: 'injected'
};

// Wallet connection states
export const CONNECTION_STATE = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error'
};

// Transaction types for monitoring
export const TRANSACTION_TYPES = {
  TRANSFER: 'transfer',
  APPROVAL: 'approval',
  SWAP: 'swap',
  STAKE: 'stake',
  UNSTAKE: 'unstake',
  NFT_MINT: 'nft_mint',
  NFT_TRANSFER: 'nft_transfer',
  GOVERNANCE_VOTE: 'governance_vote',
  MARKETPLACE_BUY: 'marketplace_buy',
  MARKETPLACE_SELL: 'marketplace_sell'
};

// Security levels for transaction validation
export const SECURITY_LEVELS = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4
};

class WalletManager {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.account = null;
    this.chainId = null;
    this.providerType = null;
    this.connectionState = CONNECTION_STATE.DISCONNECTED;
    this.eventListeners = new Map();
    this.transactionQueue = [];
    this.securitySettings = {
      requireConfirmation: true,
      maxTransactionValue: BigInt('10') * BigInt(10 ** 18), // 10 ETH equivalent
      trustedContracts: new Set(),
      blocklistContracts: new Set()
    };
    
    this.initialize();
  }

  async initialize() {
    // Check for existing connections
    await this.checkExistingConnections();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Initialize wallet detection
    this.detectWallets();
  }

  async checkExistingConnections() {
    try {
      // Check localStorage for saved connection
      const savedConnection = localStorage.getItem('cryb_wallet_connection');
      if (savedConnection) {
        const { providerType, account, chainId } = JSON.parse(savedConnection);
        await this.reconnect(providerType);
      }
      
      // Check for injected providers
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await this.connect(WALLET_PROVIDERS.INJECTED);
        }
      }
    } catch (error) {
    }
  }

  detectWallets() {
    const wallets = {
      [WALLET_PROVIDERS.METAMASK]: {
        name: 'MetaMask',
        icon: '/icons/metamask.svg',
        installed: typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask,
        downloadUrl: 'https://metamask.io/download.html'
      },
      [WALLET_PROVIDERS.COINBASE]: {
        name: 'Coinbase Wallet',
        icon: '/icons/coinbase.svg',
        installed: typeof window.ethereum !== 'undefined' && window.ethereum.isCoinbaseWallet,
        downloadUrl: 'https://www.coinbase.com/wallet/downloads'
      },
      [WALLET_PROVIDERS.TRUST]: {
        name: 'Trust Wallet',
        icon: '/icons/trust.svg',
        installed: typeof window.ethereum !== 'undefined' && window.ethereum.isTrust,
        downloadUrl: 'https://trustwallet.com/download'
      },
      [WALLET_PROVIDERS.RAINBOW]: {
        name: 'Rainbow',
        icon: '/icons/rainbow.svg',
        installed: typeof window.ethereum !== 'undefined' && window.ethereum.isRainbow,
        downloadUrl: 'https://rainbow.me/download'
      }
    };

    this.availableWallets = wallets;
    return wallets;
  }

  async connect(providerType = WALLET_PROVIDERS.METAMASK) {
    try {
      this.connectionState = CONNECTION_STATE.CONNECTING;
      this.emit('connectionStateChanged', this.connectionState);

      let provider;
      
      switch (providerType) {
        case WALLET_PROVIDERS.METAMASK:
          provider = await this.connectMetaMask();
          break;
        case WALLET_PROVIDERS.WALLETCONNECT:
          provider = await this.connectWalletConnect();
          break;
        case WALLET_PROVIDERS.COINBASE:
          provider = await this.connectCoinbase();
          break;
        case WALLET_PROVIDERS.INJECTED:
          provider = await this.connectInjected();
          break;
        default:
          throw new Error(`Unsupported provider type: ${providerType}`);
      }

      if (!provider) {
        throw new Error('Failed to initialize provider');
      }

      this.provider = new ethers.BrowserProvider(provider);
      this.signer = await this.provider.getSigner();
      this.account = await this.signer.getAddress();
      
      const network = await this.provider.getNetwork();
      this.chainId = Number(network.chainId);
      this.providerType = providerType;
      
      // Validate network
      await this.validateNetwork();
      
      // Save connection info
      this.saveConnectionInfo();
      
      // Setup provider event listeners
      this.setupProviderListeners(provider);
      
      this.connectionState = CONNECTION_STATE.CONNECTED;
      this.emit('connectionStateChanged', this.connectionState);
      this.emit('accountChanged', this.account);
      this.emit('chainChanged', this.chainId);
      this.emit('connected', {
        provider: providerType,
        account: this.account,
        chainId: this.chainId
      });

      return {
        account: this.account,
        chainId: this.chainId,
        provider: this.provider,
        signer: this.signer
      };
      
    } catch (error) {
      this.connectionState = CONNECTION_STATE.ERROR;
      this.emit('connectionStateChanged', this.connectionState);
      this.emit('error', error);
      throw error;
    }
  }

  async connectMetaMask() {
    if (!window.ethereum || !window.ethereum.isMetaMask) {
      throw new Error('MetaMask not installed');
    }
    
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    return window.ethereum;
  }

  async connectWalletConnect() {
    try {
      // Dynamically import WalletConnect to avoid bundling if not used
      const { EthereumProvider } = await import('@walletconnect/ethereum-provider');

      const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

      if (!projectId) {
        throw new Error(
          'WalletConnect Project ID not configured. Please set VITE_WALLETCONNECT_PROJECT_ID in your .env file. Get one at https://cloud.walletconnect.com'
        );
      }

      const provider = await EthereumProvider.init({
        projectId,
        chains: [1], // Ethereum Mainnet
        optionalChains: [11155111, 137, 56, 42161, 10, 8453], // Sepolia, Polygon, BSC, Arbitrum, Optimism, Base
        showQrModal: true,
        qrModalOptions: {
          themeMode: 'dark',
          themeVariables: {
            '--wcm-z-index': '9999'
          }
        },
        metadata: {
          name: 'CRYB Platform',
          description: 'The next-generation community platform',
          url: window.location.origin,
          icons: [`${window.location.origin}/logo.png`]
        }
      });

      await provider.enable();
      return provider;
    } catch (error) {
      console.error('WalletConnect initialization failed:', error);
      throw new Error(
        error.message || 'Failed to initialize WalletConnect. Please try MetaMask or Coinbase Wallet instead.'
      );
    }
  }

  async connectCoinbase() {
    if (!window.ethereum || !window.ethereum.isCoinbaseWallet) {
      throw new Error('Coinbase Wallet not installed');
    }
    
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    return window.ethereum;
  }

  async connectInjected() {
    if (!window.ethereum) {
      throw new Error('No injected wallet found');
    }
    
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    return window.ethereum;
  }

  async reconnect(providerType) {
    try {
      this.connectionState = CONNECTION_STATE.RECONNECTING;
      this.emit('connectionStateChanged', this.connectionState);
      
      await this.connect(providerType);
    } catch (error) {
      console.error('Reconnection failed:', error);
      this.disconnect();
    }
  }

  async disconnect() {
    try {
      // Clear provider references
      this.provider = null;
      this.signer = null;
      this.account = null;
      this.chainId = null;
      this.providerType = null;
      
      // Clear saved connection
      localStorage.removeItem('cryb_wallet_connection');
      localStorage.removeItem('cryb_wallet_session');
      
      this.connectionState = CONNECTION_STATE.DISCONNECTED;
      this.emit('connectionStateChanged', this.connectionState);
      this.emit('disconnected');
      
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }

  async switchNetwork(chainId) {
    try {
      if (!this.provider) {
        throw new Error('No wallet connected');
      }

      const hexChainId = `0x${chainId.toString(16)}`;
      const networkConfig = NETWORK_CONFIGS[chainId];
      
      if (!networkConfig) {
        throw new Error(`Unsupported network: ${chainId}`);
      }

      try {
        // Try to switch to the network
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: hexChainId }],
        });
      } catch (switchError) {
        // Network not added to wallet, try to add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: hexChainId,
              chainName: networkConfig.name,
              nativeCurrency: networkConfig.nativeCurrency,
              rpcUrls: networkConfig.rpcUrls,
              blockExplorerUrls: networkConfig.blockExplorerUrls,
              iconUrls: [networkConfig.iconUrl]
            }],
          });
        } else {
          throw switchError;
        }
      }

      this.chainId = chainId;
      this.emit('chainChanged', chainId);
      
      return true;
    } catch (error) {
      console.error('Network switch failed:', error);
      throw error;
    }
  }

  async addToken(tokenAddress, symbol, decimals, image) {
    try {
      if (!this.provider) {
        throw new Error('No wallet connected');
      }

      const success = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: tokenAddress,
            symbol,
            decimals,
            image
          }
        }
      });

      return success;
    } catch (error) {
      console.error('Add token failed:', error);
      throw error;
    }
  }

  async sendTransaction(transaction, options = {}) {
    try {
      if (!this.signer) {
        throw new Error('No wallet connected');
      }

      // Security validation
      await this.validateTransaction(transaction, options);
      
      // Add to transaction queue
      const txInfo = {
        id: Date.now().toString(),
        transaction,
        options,
        timestamp: Date.now(),
        status: 'pending'
      };
      
      this.transactionQueue.push(txInfo);
      this.emit('transactionQueued', txInfo);

      // Execute transaction
      const tx = await this.signer.sendTransaction(transaction);
      
      txInfo.hash = tx.hash;
      txInfo.status = 'submitted';
      this.emit('transactionSubmitted', txInfo);

      // Wait for confirmation
      const receipt = await tx.wait();
      
      txInfo.receipt = receipt;
      txInfo.status = 'confirmed';
      this.emit('transactionConfirmed', txInfo);

      // Remove from queue
      this.transactionQueue = this.transactionQueue.filter(t => t.id !== txInfo.id);

      return receipt;
    } catch (error) {
      console.error('Transaction failed:', error);
      this.emit('transactionFailed', { transaction, error });
      throw error;
    }
  }

  async validateTransaction(transaction, options) {
    const { requireConfirmation, maxTransactionValue, trustedContracts, blocklistContracts } = this.securitySettings;
    
    // Check if contract is blocklisted
    if (transaction.to && blocklistContracts.has(transaction.to.toLowerCase())) {
      throw new Error('Transaction to blocklisted contract rejected');
    }
    
    // Check transaction value limits
    if (transaction.value && BigInt(transaction.value) > maxTransactionValue) {
      if (requireConfirmation && !options.userConfirmed) {
        throw new Error('Transaction exceeds maximum value limit and requires user confirmation');
      }
    }
    
    // Check for suspicious patterns
    await this.detectSuspiciousActivity(transaction);
    
    // Gas estimation and validation
    if (!transaction.gasLimit) {
      try {
        const estimatedGas = await this.provider.estimateGas(transaction);
        transaction.gasLimit = estimatedGas;
      } catch (error) {
        throw new Error('Gas estimation failed: ' + error.message);
      }
    }
    
    return true;
  }

  async detectSuspiciousActivity(transaction) {
    // Check for common attack patterns
    const suspiciousPatterns = [
      // MEV sandwich attacks
      { pattern: /0x(.*?)(deadbeef|cafebabe)/, description: 'Potential MEV attack' },
      // Flash loan patterns
      { pattern: /flashloan|flash_loan/i, description: 'Flash loan detected' },
      // Suspicious function signatures
      { pattern: /0xa9059cbb00000000/, description: 'Suspicious transfer pattern' }
    ];
    
    if (transaction.data) {
      for (const { pattern, description } of suspiciousPatterns) {
        if (pattern.test(transaction.data)) {
          // Could implement user warning or auto-rejection here
        }
      }
    }
  }

  async signMessage(message, options = {}) {
    try {
      if (!this.signer) {
        throw new Error('No wallet connected');
      }

      // Validate message signing request
      if (options.requireConfirmation && !options.userConfirmed) {
        this.emit('signatureRequested', { message, options });
        throw new Error('Signature requires user confirmation');
      }

      const signature = await this.signer.signMessage(message);
      
      this.emit('messageSigned', { message, signature });
      return signature;
    } catch (error) {
      console.error('Message signing failed:', error);
      this.emit('signatureFailed', { message, error });
      throw error;
    }
  }

  async signTypedData(domain, types, value, options = {}) {
    try {
      if (!this.signer) {
        throw new Error('No wallet connected');
      }

      const signature = await this.signer.signTypedData(domain, types, value);
      
      this.emit('typedDataSigned', { domain, types, value, signature });
      return signature;
    } catch (error) {
      console.error('Typed data signing failed:', error);
      throw error;
    }
  }

  // Security management
  updateSecuritySettings(newSettings) {
    this.securitySettings = {
      ...this.securitySettings,
      ...newSettings
    };
    
    this.emit('securitySettingsUpdated', this.securitySettings);
  }

  addTrustedContract(address) {
    this.securitySettings.trustedContracts.add(address.toLowerCase());
    this.emit('trustedContractAdded', address);
  }

  removeTrustedContract(address) {
    this.securitySettings.trustedContracts.delete(address.toLowerCase());
    this.emit('trustedContractRemoved', address);
  }

  addBlocklistedContract(address) {
    this.securitySettings.blocklistContracts.add(address.toLowerCase());
    this.emit('blocklistedContractAdded', address);
  }

  removeBlocklistedContract(address) {
    this.securitySettings.blocklistContracts.delete(address.toLowerCase());
    this.emit('blocklistedContractRemoved', address);
  }

  // Event handling
  setupEventListeners() {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this));
      window.ethereum.on('chainChanged', this.handleChainChanged.bind(this));
      window.ethereum.on('disconnect', this.handleDisconnect.bind(this));
    }
  }

  setupProviderListeners(provider) {
    provider.on('accountsChanged', this.handleAccountsChanged.bind(this));
    provider.on('chainChanged', this.handleChainChanged.bind(this));
    provider.on('disconnect', this.handleDisconnect.bind(this));
  }

  async handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      await this.disconnect();
    } else if (accounts[0] !== this.account) {
      this.account = accounts[0];
      this.emit('accountChanged', this.account);
      this.saveConnectionInfo();
    }
  }

  async handleChainChanged(chainId) {
    const newChainId = parseInt(chainId, 16);
    if (newChainId !== this.chainId) {
      this.chainId = newChainId;
      this.emit('chainChanged', this.chainId);
      this.saveConnectionInfo();
      
      // Validate the new network
      try {
        await this.validateNetwork();
      } catch (error) {
        this.emit('unsupportedNetwork', { chainId: this.chainId, error });
      }
    }
  }

  handleDisconnect() {
    this.disconnect();
  }

  async validateNetwork() {
    if (!NETWORK_CONFIGS[this.chainId]) {
      throw new Error(`Unsupported network: ${this.chainId}`);
    }
  }

  saveConnectionInfo() {
    const connectionInfo = {
      providerType: this.providerType,
      account: this.account,
      chainId: this.chainId,
      timestamp: Date.now()
    };
    
    localStorage.setItem('cryb_wallet_connection', JSON.stringify(connectionInfo));
  }

  // Event emitter functionality
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Event listener error for ${event}:`, error);
        }
      });
    }
  }

  // Getters
  get isConnected() {
    return this.connectionState === CONNECTION_STATE.CONNECTED;
  }

  get currentAccount() {
    return this.account;
  }

  get currentChainId() {
    return this.chainId;
  }

  get currentProvider() {
    return this.provider;
  }

  get currentSigner() {
    return this.signer;
  }

  get connectionInfo() {
    return {
      account: this.account,
      chainId: this.chainId,
      providerType: this.providerType,
      connectionState: this.connectionState,
      isConnected: this.isConnected
    };
  }

  get transactionHistory() {
    return [...this.transactionQueue];
  }

  get availableNetworks() {
    return Object.entries(NETWORK_CONFIGS).map(([chainId, config]) => ({
      chainId: parseInt(chainId),
      ...config
    }));
  }

  // Utility methods
  async getBalance(address = null) {
    if (!this.provider) {
      throw new Error('No provider available');
    }
    
    const account = address || this.account;
    if (!account) {
      throw new Error('No account specified');
    }
    
    return await this.provider.getBalance(account);
  }

  async getTokenBalance(tokenAddress, address = null) {
    if (!this.provider) {
      throw new Error('No provider available');
    }
    
    const account = address || this.account;
    if (!account) {
      throw new Error('No account specified');
    }
    
    // Simple ERC20 balance call
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ['function balanceOf(address) view returns (uint256)'],
      this.provider
    );
    
    return await tokenContract.balanceOf(account);
  }

  formatAddress(address, chars = 4) {
    if (!address) return '';
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
  }

  formatBalance(balance, decimals = 18, precision = 4) {
    if (!balance) return '0';
    return ethers.formatUnits(balance, decimals);
  }
}

// Create singleton instance
export const walletManager = new WalletManager();

// Export utility functions
export function useWalletManager() {
  return walletManager;
}

export function formatAddress(address, chars = 4) {
  return walletManager.formatAddress(address, chars);
}

export function formatBalance(balance, decimals = 18, precision = 4) {
  return walletManager.formatBalance(balance, decimals, precision);
}

export default walletManager;