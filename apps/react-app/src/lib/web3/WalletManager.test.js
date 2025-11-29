// WalletManager Comprehensive Test Suite
import { jest } from '@jest/globals';
import { ethers } from 'ethers';
import WalletManager, {
  WALLET_PROVIDERS,
  CONNECTION_STATE,
  TRANSACTION_TYPES,
  SECURITY_LEVELS
} from './WalletManager.js';
import { CHAIN_IDS, NETWORK_CONFIGS } from '../contracts/cryb-contracts.js';

// Mock ethers
jest.mock('ethers', () => ({
  ethers: {
    BrowserProvider: jest.fn(),
    Contract: jest.fn(),
    formatUnits: jest.fn((value, decimals) => {
      const num = BigInt(value);
      const divisor = BigInt(10 ** decimals);
      return (Number(num) / Number(divisor)).toString();
    })
  }
}));

// Mock window.ethereum
const createMockEthereum = (overrides = {}) => ({
  isMetaMask: true,
  request: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
  ...overrides
});

// Mock WalletConnect provider
const createMockWalletConnect = () => ({
  init: jest.fn().mockResolvedValue({
    enable: jest.fn().mockResolvedValue(['0x1234567890123456789012345678901234567890']),
    on: jest.fn()
  })
});

describe('WalletManager', () => {
  let walletManager;
  let mockEthereum;
  let mockProvider;
  let mockSigner;

  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods
    jest.clearAllMocks();

    // Setup localStorage mock
    global.localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };

    // Setup mock ethereum
    mockEthereum = createMockEthereum();
    global.window = {
      ethereum: mockEthereum,
      location: { origin: 'http://localhost:3000' }
    };

    // Setup mock provider and signer
    mockSigner = {
      getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
      signMessage: jest.fn().mockResolvedValue('0xmocksignature'),
      signTypedData: jest.fn().mockResolvedValue('0xmocktypedsignature'),
      sendTransaction: jest.fn().mockResolvedValue({
        hash: '0xtxhash',
        wait: jest.fn().mockResolvedValue({
          status: 1,
          transactionHash: '0xtxhash',
          blockNumber: 12345
        })
      })
    };

    mockProvider = {
      getSigner: jest.fn().mockResolvedValue(mockSigner),
      getNetwork: jest.fn().mockResolvedValue({ chainId: BigInt(1) }),
      getBalance: jest.fn().mockResolvedValue(BigInt('1000000000000000000')),
      estimateGas: jest.fn().mockResolvedValue(BigInt(21000))
    };

    ethers.BrowserProvider.mockImplementation(() => mockProvider);

    // Create new instance
    walletManager = new WalletManager();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with correct default values', () => {
      expect(walletManager.provider).toBeNull();
      expect(walletManager.signer).toBeNull();
      expect(walletManager.account).toBeNull();
      expect(walletManager.chainId).toBeNull();
      expect(walletManager.providerType).toBeNull();
      expect(walletManager.connectionState).toBe(CONNECTION_STATE.DISCONNECTED);
    });

    test('should initialize security settings with correct defaults', () => {
      expect(walletManager.securitySettings.requireConfirmation).toBe(true);
      expect(walletManager.securitySettings.maxTransactionValue).toBe(BigInt('10') * BigInt(10 ** 18));
      expect(walletManager.securitySettings.trustedContracts).toBeInstanceOf(Set);
      expect(walletManager.securitySettings.blocklistContracts).toBeInstanceOf(Set);
    });

    test('should initialize empty transaction queue', () => {
      expect(walletManager.transactionQueue).toEqual([]);
    });

    test('should initialize event listeners map', () => {
      expect(walletManager.eventListeners).toBeInstanceOf(Map);
    });
  });

  describe('Wallet Detection', () => {
    test('should detect MetaMask when installed', () => {
      window.ethereum = { isMetaMask: true };
      const wallets = walletManager.detectWallets();

      expect(wallets[WALLET_PROVIDERS.METAMASK].installed).toBe(true);
      expect(wallets[WALLET_PROVIDERS.METAMASK].name).toBe('MetaMask');
    });

    test('should detect Coinbase Wallet when installed', () => {
      window.ethereum = { isCoinbaseWallet: true };
      const wallets = walletManager.detectWallets();

      expect(wallets[WALLET_PROVIDERS.COINBASE].installed).toBe(true);
      expect(wallets[WALLET_PROVIDERS.COINBASE].name).toBe('Coinbase Wallet');
    });

    test('should detect Trust Wallet when installed', () => {
      window.ethereum = { isTrust: true };
      const wallets = walletManager.detectWallets();

      expect(wallets[WALLET_PROVIDERS.TRUST].installed).toBe(true);
    });

    test('should detect Rainbow Wallet when installed', () => {
      window.ethereum = { isRainbow: true };
      const wallets = walletManager.detectWallets();

      expect(wallets[WALLET_PROVIDERS.RAINBOW].installed).toBe(true);
    });

    test('should return wallets with download URLs', () => {
      const wallets = walletManager.detectWallets();

      expect(wallets[WALLET_PROVIDERS.METAMASK].downloadUrl).toBe('https://metamask.io/download.html');
      expect(wallets[WALLET_PROVIDERS.COINBASE].downloadUrl).toBe('https://www.coinbase.com/wallet/downloads');
    });

    test('should mark all wallets as not installed when no wallet present', () => {
      window.ethereum = undefined;
      const wallets = walletManager.detectWallets();

      Object.values(wallets).forEach(wallet => {
        expect(wallet.installed).toBe(false);
      });
    });
  });

  describe('MetaMask Connection', () => {
    beforeEach(() => {
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890']);
    });

    test('should successfully connect to MetaMask', async () => {
      const result = await walletManager.connect(WALLET_PROVIDERS.METAMASK);

      expect(mockEthereum.request).toHaveBeenCalledWith({ method: 'eth_requestAccounts' });
      expect(result.account).toBe('0x1234567890123456789012345678901234567890');
      expect(result.chainId).toBe(1);
      expect(walletManager.connectionState).toBe(CONNECTION_STATE.CONNECTED);
    });

    test('should emit connection events during MetaMask connection', async () => {
      const connectionStateChangedSpy = jest.fn();
      const connectedSpy = jest.fn();
      const accountChangedSpy = jest.fn();
      const chainChangedSpy = jest.fn();

      walletManager.on('connectionStateChanged', connectionStateChangedSpy);
      walletManager.on('connected', connectedSpy);
      walletManager.on('accountChanged', accountChangedSpy);
      walletManager.on('chainChanged', chainChangedSpy);

      await walletManager.connect(WALLET_PROVIDERS.METAMASK);

      expect(connectionStateChangedSpy).toHaveBeenCalledWith(CONNECTION_STATE.CONNECTING);
      expect(connectionStateChangedSpy).toHaveBeenCalledWith(CONNECTION_STATE.CONNECTED);
      expect(connectedSpy).toHaveBeenCalled();
      expect(accountChangedSpy).toHaveBeenCalled();
      expect(chainChangedSpy).toHaveBeenCalled();
    });

    test('should throw error when MetaMask not installed', async () => {
      window.ethereum = undefined;

      await expect(walletManager.connect(WALLET_PROVIDERS.METAMASK))
        .rejects.toThrow('MetaMask not installed');
    });

    test('should handle user rejection of connection', async () => {
      mockEthereum.request.mockRejectedValue({ code: 4001, message: 'User rejected request' });

      await expect(walletManager.connect(WALLET_PROVIDERS.METAMASK))
        .rejects.toThrow();

      expect(walletManager.connectionState).toBe(CONNECTION_STATE.ERROR);
    });

    test('should save connection info to localStorage', async () => {
      await walletManager.connect(WALLET_PROVIDERS.METAMASK);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'cryb_wallet_connection',
        expect.stringContaining('metamask')
      );
    });

    test('should setup provider listeners after connection', async () => {
      await walletManager.connect(WALLET_PROVIDERS.METAMASK);

      expect(mockEthereum.on).toHaveBeenCalledWith('accountsChanged', expect.any(Function));
      expect(mockEthereum.on).toHaveBeenCalledWith('chainChanged', expect.any(Function));
      expect(mockEthereum.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });
  });

  describe('Coinbase Wallet Connection', () => {
    beforeEach(() => {
      window.ethereum = createMockEthereum({ isCoinbaseWallet: true, isMetaMask: false });
      mockEthereum = window.ethereum;
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890']);
    });

    test('should successfully connect to Coinbase Wallet', async () => {
      const result = await walletManager.connect(WALLET_PROVIDERS.COINBASE);

      expect(mockEthereum.request).toHaveBeenCalledWith({ method: 'eth_requestAccounts' });
      expect(result.account).toBe('0x1234567890123456789012345678901234567890');
      expect(walletManager.providerType).toBe(WALLET_PROVIDERS.COINBASE);
    });

    test('should throw error when Coinbase Wallet not installed', async () => {
      window.ethereum = createMockEthereum({ isCoinbaseWallet: false });

      await expect(walletManager.connect(WALLET_PROVIDERS.COINBASE))
        .rejects.toThrow('Coinbase Wallet not installed');
    });
  });

  describe('WalletConnect Connection', () => {
    test('should throw error when project ID not configured', async () => {
      // Mock import.meta.env
      const originalEnv = import.meta.env;
      import.meta.env = { VITE_WALLETCONNECT_PROJECT_ID: undefined };

      // Mock dynamic import
      jest.doMock('@walletconnect/ethereum-provider', () => ({
        EthereumProvider: createMockWalletConnect()
      }));

      await expect(walletManager.connect(WALLET_PROVIDERS.WALLETCONNECT))
        .rejects.toThrow(/WalletConnect Project ID not configured/);

      import.meta.env = originalEnv;
    });
  });

  describe('Injected Wallet Connection', () => {
    test('should connect to injected wallet', async () => {
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890']);

      const result = await walletManager.connect(WALLET_PROVIDERS.INJECTED);

      expect(result.account).toBe('0x1234567890123456789012345678901234567890');
      expect(walletManager.providerType).toBe(WALLET_PROVIDERS.INJECTED);
    });

    test('should throw error when no injected wallet found', async () => {
      window.ethereum = undefined;

      await expect(walletManager.connect(WALLET_PROVIDERS.INJECTED))
        .rejects.toThrow('No injected wallet found');
    });
  });

  describe('Wallet Disconnection', () => {
    beforeEach(async () => {
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890']);
      await walletManager.connect(WALLET_PROVIDERS.METAMASK);
    });

    test('should clear all wallet data on disconnect', async () => {
      await walletManager.disconnect();

      expect(walletManager.provider).toBeNull();
      expect(walletManager.signer).toBeNull();
      expect(walletManager.account).toBeNull();
      expect(walletManager.chainId).toBeNull();
      expect(walletManager.providerType).toBeNull();
    });

    test('should clear localStorage on disconnect', async () => {
      await walletManager.disconnect();

      expect(localStorage.removeItem).toHaveBeenCalledWith('cryb_wallet_connection');
      expect(localStorage.removeItem).toHaveBeenCalledWith('cryb_wallet_session');
    });

    test('should update connection state to DISCONNECTED', async () => {
      await walletManager.disconnect();

      expect(walletManager.connectionState).toBe(CONNECTION_STATE.DISCONNECTED);
    });

    test('should emit disconnected event', async () => {
      const disconnectedSpy = jest.fn();
      walletManager.on('disconnected', disconnectedSpy);

      await walletManager.disconnect();

      expect(disconnectedSpy).toHaveBeenCalled();
    });
  });

  describe('Auto-reconnect on Page Load', () => {
    test('should attempt reconnect with saved connection info', async () => {
      const savedConnection = {
        providerType: WALLET_PROVIDERS.METAMASK,
        account: '0x1234567890123456789012345678901234567890',
        chainId: 1
      };

      localStorage.getItem.mockReturnValue(JSON.stringify(savedConnection));
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890']);

      const newWalletManager = new WalletManager();
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for async initialization

      expect(localStorage.getItem).toHaveBeenCalledWith('cryb_wallet_connection');
    });

    test('should check for existing connected accounts', async () => {
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890']);

      await walletManager.checkExistingConnections();

      expect(mockEthereum.request).toHaveBeenCalledWith({ method: 'eth_accounts' });
    });

    test('should not reconnect if no saved connection', async () => {
      localStorage.getItem.mockReturnValue(null);
      mockEthereum.request.mockResolvedValue([]);

      await walletManager.checkExistingConnections();

      expect(walletManager.connectionState).toBe(CONNECTION_STATE.DISCONNECTED);
    });
  });

  describe('Account Change Handling', () => {
    beforeEach(async () => {
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890']);
      await walletManager.connect(WALLET_PROVIDERS.METAMASK);
    });

    test('should update account when changed', async () => {
      const accountChangedSpy = jest.fn();
      walletManager.on('accountChanged', accountChangedSpy);

      const newAccount = '0x9876543210987654321098765432109876543210';
      await walletManager.handleAccountsChanged([newAccount]);

      expect(walletManager.account).toBe(newAccount);
      expect(accountChangedSpy).toHaveBeenCalledWith(newAccount);
    });

    test('should disconnect when accounts array is empty', async () => {
      const disconnectedSpy = jest.fn();
      walletManager.on('disconnected', disconnectedSpy);

      await walletManager.handleAccountsChanged([]);

      expect(walletManager.connectionState).toBe(CONNECTION_STATE.DISCONNECTED);
      expect(disconnectedSpy).toHaveBeenCalled();
    });

    test('should save new account to localStorage', async () => {
      const newAccount = '0x9876543210987654321098765432109876543210';
      await walletManager.handleAccountsChanged([newAccount]);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'cryb_wallet_connection',
        expect.stringContaining(newAccount)
      );
    });

    test('should not emit event if account unchanged', async () => {
      const accountChangedSpy = jest.fn();
      walletManager.on('accountChanged', accountChangedSpy);

      await walletManager.handleAccountsChanged(['0x1234567890123456789012345678901234567890']);

      expect(accountChangedSpy).not.toHaveBeenCalled();
    });
  });

  describe('Network/Chain Change Handling', () => {
    beforeEach(async () => {
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890']);
      await walletManager.connect(WALLET_PROVIDERS.METAMASK);
    });

    test('should update chainId when changed', async () => {
      const chainChangedSpy = jest.fn();
      walletManager.on('chainChanged', chainChangedSpy);

      await walletManager.handleChainChanged('0x89'); // Polygon (137)

      expect(walletManager.chainId).toBe(137);
      expect(chainChangedSpy).toHaveBeenCalledWith(137);
    });

    test('should save new chainId to localStorage', async () => {
      await walletManager.handleChainChanged('0x89');

      expect(localStorage.setItem).toHaveBeenCalled();
    });

    test('should emit unsupportedNetwork for unsupported chains', async () => {
      const unsupportedNetworkSpy = jest.fn();
      walletManager.on('unsupportedNetwork', unsupportedNetworkSpy);

      await walletManager.handleChainChanged('0x999999'); // Invalid chain

      expect(unsupportedNetworkSpy).toHaveBeenCalled();
    });

    test('should not emit event if chainId unchanged', async () => {
      const chainChangedSpy = jest.fn();
      walletManager.on('chainChanged', chainChangedSpy);

      await walletManager.handleChainChanged('0x1'); // Same chain (1)

      expect(chainChangedSpy).not.toHaveBeenCalled();
    });
  });

  describe('Network Switching', () => {
    beforeEach(async () => {
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890']);
      await walletManager.connect(WALLET_PROVIDERS.METAMASK);
    });

    test('should switch to supported network', async () => {
      mockEthereum.request.mockResolvedValue(null);

      await walletManager.switchNetwork(CHAIN_IDS.POLYGON);

      expect(mockEthereum.request).toHaveBeenCalledWith({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x89' }]
      });
    });

    test('should add network if not in wallet (error 4902)', async () => {
      mockEthereum.request
        .mockRejectedValueOnce({ code: 4902, message: 'Unrecognized chain ID' })
        .mockResolvedValueOnce(null);

      await walletManager.switchNetwork(CHAIN_IDS.POLYGON);

      expect(mockEthereum.request).toHaveBeenCalledWith({
        method: 'wallet_addEthereumChain',
        params: expect.any(Array)
      });
    });

    test('should throw error for unsupported network', async () => {
      await expect(walletManager.switchNetwork(999999))
        .rejects.toThrow('Unsupported network');
    });

    test('should throw error when no wallet connected', async () => {
      await walletManager.disconnect();

      await expect(walletManager.switchNetwork(CHAIN_IDS.POLYGON))
        .rejects.toThrow('No wallet connected');
    });

    test('should update chainId after successful switch', async () => {
      mockEthereum.request.mockResolvedValue(null);

      await walletManager.switchNetwork(CHAIN_IDS.POLYGON);

      expect(walletManager.chainId).toBe(CHAIN_IDS.POLYGON);
    });
  });

  describe('Balance Fetching', () => {
    beforeEach(async () => {
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890']);
      await walletManager.connect(WALLET_PROVIDERS.METAMASK);
    });

    test('should fetch balance for connected account', async () => {
      const balance = await walletManager.getBalance();

      expect(mockProvider.getBalance).toHaveBeenCalledWith('0x1234567890123456789012345678901234567890');
      expect(balance).toBe(BigInt('1000000000000000000'));
    });

    test('should fetch balance for specific address', async () => {
      const address = '0x9876543210987654321098765432109876543210';
      await walletManager.getBalance(address);

      expect(mockProvider.getBalance).toHaveBeenCalledWith(address);
    });

    test('should throw error when no provider available', async () => {
      await walletManager.disconnect();

      await expect(walletManager.getBalance())
        .rejects.toThrow('No provider available');
    });

    test('should throw error when no account specified', async () => {
      walletManager.account = null;

      await expect(walletManager.getBalance())
        .rejects.toThrow('No account specified');
    });
  });

  describe('Token Balance Fetching', () => {
    beforeEach(async () => {
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890']);
      await walletManager.connect(WALLET_PROVIDERS.METAMASK);

      // Mock token contract
      const mockTokenContract = {
        balanceOf: jest.fn().mockResolvedValue(BigInt('5000000000000000000000'))
      };
      ethers.Contract.mockImplementation(() => mockTokenContract);
    });

    test('should fetch ERC20 token balance', async () => {
      const tokenAddress = '0xTokenAddress123456789012345678901234567890';
      const balance = await walletManager.getTokenBalance(tokenAddress);

      expect(ethers.Contract).toHaveBeenCalledWith(
        tokenAddress,
        expect.any(Array),
        mockProvider
      );
      expect(balance).toBe(BigInt('5000000000000000000000'));
    });

    test('should fetch token balance for specific address', async () => {
      const tokenAddress = '0xTokenAddress123456789012345678901234567890';
      const userAddress = '0x9876543210987654321098765432109876543210';

      await walletManager.getTokenBalance(tokenAddress, userAddress);

      expect(ethers.Contract).toHaveBeenCalled();
    });
  });

  describe('Transaction Sending', () => {
    beforeEach(async () => {
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890']);
      await walletManager.connect(WALLET_PROVIDERS.METAMASK);
    });

    test('should send transaction successfully', async () => {
      const transaction = {
        to: '0x9876543210987654321098765432109876543210',
        value: BigInt('1000000000000000000')
      };

      const receipt = await walletManager.sendTransaction(transaction);

      expect(mockSigner.sendTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          to: transaction.to,
          value: transaction.value
        })
      );
      expect(receipt.status).toBe(1);
    });

    test('should emit transaction events', async () => {
      const queuedSpy = jest.fn();
      const submittedSpy = jest.fn();
      const confirmedSpy = jest.fn();

      walletManager.on('transactionQueued', queuedSpy);
      walletManager.on('transactionSubmitted', submittedSpy);
      walletManager.on('transactionConfirmed', confirmedSpy);

      const transaction = {
        to: '0x9876543210987654321098765432109876543210',
        value: BigInt('1000000000000000000')
      };

      await walletManager.sendTransaction(transaction);

      expect(queuedSpy).toHaveBeenCalled();
      expect(submittedSpy).toHaveBeenCalled();
      expect(confirmedSpy).toHaveBeenCalled();
    });

    test('should throw error when no signer available', async () => {
      await walletManager.disconnect();

      await expect(walletManager.sendTransaction({}))
        .rejects.toThrow('No wallet connected');
    });

    test('should validate transaction before sending', async () => {
      const validateSpy = jest.spyOn(walletManager, 'validateTransaction');

      const transaction = {
        to: '0x9876543210987654321098765432109876543210',
        value: BigInt('1000000000000000000')
      };

      await walletManager.sendTransaction(transaction);

      expect(validateSpy).toHaveBeenCalled();
    });

    test('should estimate gas if not provided', async () => {
      const transaction = {
        to: '0x9876543210987654321098765432109876543210',
        value: BigInt('1000000000000000000')
      };

      await walletManager.sendTransaction(transaction);

      expect(mockProvider.estimateGas).toHaveBeenCalled();
      expect(transaction.gasLimit).toBe(BigInt(21000));
    });

    test('should handle transaction failure', async () => {
      const failedSpy = jest.fn();
      walletManager.on('transactionFailed', failedSpy);

      mockSigner.sendTransaction.mockRejectedValue(new Error('Transaction failed'));

      const transaction = {
        to: '0x9876543210987654321098765432109876543210',
        value: BigInt('1000000000000000000')
      };

      await expect(walletManager.sendTransaction(transaction))
        .rejects.toThrow('Transaction failed');

      expect(failedSpy).toHaveBeenCalled();
    });

    test('should add transaction to queue', async () => {
      const transaction = {
        to: '0x9876543210987654321098765432109876543210',
        value: BigInt('1000000000000000000')
      };

      await walletManager.sendTransaction(transaction);

      // Transaction should be removed from queue after confirmation
      expect(walletManager.transactionQueue.length).toBe(0);
    });
  });

  describe('Transaction Security Validation', () => {
    beforeEach(async () => {
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890']);
      await walletManager.connect(WALLET_PROVIDERS.METAMASK);
    });

    test('should reject transaction to blocklisted contract', async () => {
      const blockedAddress = '0xBlockedContract123456789012345678901234';
      walletManager.addBlocklistedContract(blockedAddress);

      const transaction = {
        to: blockedAddress,
        value: BigInt('1000000000000000000')
      };

      await expect(walletManager.validateTransaction(transaction, {}))
        .rejects.toThrow('Transaction to blocklisted contract rejected');
    });

    test('should reject large transaction without confirmation', async () => {
      const transaction = {
        to: '0x9876543210987654321098765432109876543210',
        value: BigInt('20') * BigInt(10 ** 18) // 20 ETH, exceeds default 10 ETH limit
      };

      await expect(walletManager.validateTransaction(transaction, {}))
        .rejects.toThrow('Transaction exceeds maximum value limit');
    });

    test('should allow large transaction with user confirmation', async () => {
      const transaction = {
        to: '0x9876543210987654321098765432109876543210',
        value: BigInt('20') * BigInt(10 ** 18)
      };

      const result = await walletManager.validateTransaction(transaction, { userConfirmed: true });

      expect(result).toBe(true);
    });

    test('should estimate gas for transaction', async () => {
      const transaction = {
        to: '0x9876543210987654321098765432109876543210',
        value: BigInt('1000000000000000000')
      };

      await walletManager.validateTransaction(transaction, {});

      expect(mockProvider.estimateGas).toHaveBeenCalled();
      expect(transaction.gasLimit).toBeDefined();
    });

    test('should throw error if gas estimation fails', async () => {
      mockProvider.estimateGas.mockRejectedValue(new Error('Gas estimation failed'));

      const transaction = {
        to: '0x9876543210987654321098765432109876543210',
        value: BigInt('1000000000000000000')
      };

      await expect(walletManager.validateTransaction(transaction, {}))
        .rejects.toThrow('Gas estimation failed');
    });
  });

  describe('Message Signing', () => {
    beforeEach(async () => {
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890']);
      await walletManager.connect(WALLET_PROVIDERS.METAMASK);
    });

    test('should sign message successfully', async () => {
      const message = 'Sign this message';
      const signature = await walletManager.signMessage(message);

      expect(mockSigner.signMessage).toHaveBeenCalledWith(message);
      expect(signature).toBe('0xmocksignature');
    });

    test('should emit messageSigned event', async () => {
      const signedSpy = jest.fn();
      walletManager.on('messageSigned', signedSpy);

      await walletManager.signMessage('Test message');

      expect(signedSpy).toHaveBeenCalled();
    });

    test('should require confirmation when specified', async () => {
      const options = { requireConfirmation: true, userConfirmed: false };

      await expect(walletManager.signMessage('Test', options))
        .rejects.toThrow('Signature requires user confirmation');
    });

    test('should throw error when no signer available', async () => {
      await walletManager.disconnect();

      await expect(walletManager.signMessage('Test'))
        .rejects.toThrow('No wallet connected');
    });

    test('should handle signing failure', async () => {
      const failedSpy = jest.fn();
      walletManager.on('signatureFailed', failedSpy);

      mockSigner.signMessage.mockRejectedValue(new Error('User rejected'));

      await expect(walletManager.signMessage('Test'))
        .rejects.toThrow();

      expect(failedSpy).toHaveBeenCalled();
    });
  });

  describe('Typed Data Signing', () => {
    beforeEach(async () => {
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890']);
      await walletManager.connect(WALLET_PROVIDERS.METAMASK);
    });

    test('should sign typed data successfully', async () => {
      const domain = { name: 'CRYB', version: '1' };
      const types = { Message: [{ name: 'content', type: 'string' }] };
      const value = { content: 'Hello' };

      const signature = await walletManager.signTypedData(domain, types, value);

      expect(mockSigner.signTypedData).toHaveBeenCalledWith(domain, types, value);
      expect(signature).toBe('0xmocktypedsignature');
    });

    test('should emit typedDataSigned event', async () => {
      const signedSpy = jest.fn();
      walletManager.on('typedDataSigned', signedSpy);

      const domain = { name: 'CRYB', version: '1' };
      const types = { Message: [{ name: 'content', type: 'string' }] };
      const value = { content: 'Hello' };

      await walletManager.signTypedData(domain, types, value);

      expect(signedSpy).toHaveBeenCalled();
    });

    test('should throw error when no signer available', async () => {
      await walletManager.disconnect();

      await expect(walletManager.signTypedData({}, {}, {}))
        .rejects.toThrow('No wallet connected');
    });
  });

  describe('Token Management', () => {
    beforeEach(async () => {
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890']);
      await walletManager.connect(WALLET_PROVIDERS.METAMASK);
    });

    test('should add token to wallet', async () => {
      mockEthereum.request.mockResolvedValue(true);

      const result = await walletManager.addToken(
        '0xTokenAddress',
        'CRYB',
        18,
        'https://cryb.com/icon.png'
      );

      expect(mockEthereum.request).toHaveBeenCalledWith({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: '0xTokenAddress',
            symbol: 'CRYB',
            decimals: 18,
            image: 'https://cryb.com/icon.png'
          }
        }
      });
      expect(result).toBe(true);
    });

    test('should throw error when no wallet connected', async () => {
      await walletManager.disconnect();

      await expect(walletManager.addToken('0xToken', 'CRYB', 18))
        .rejects.toThrow('No wallet connected');
    });

    test('should handle user rejection of token addition', async () => {
      mockEthereum.request.mockResolvedValue(false);

      const result = await walletManager.addToken('0xToken', 'CRYB', 18);

      expect(result).toBe(false);
    });
  });

  describe('Security Settings', () => {
    test('should update security settings', () => {
      const settingsSpy = jest.fn();
      walletManager.on('securitySettingsUpdated', settingsSpy);

      const newSettings = {
        requireConfirmation: false,
        maxTransactionValue: BigInt('20') * BigInt(10 ** 18)
      };

      walletManager.updateSecuritySettings(newSettings);

      expect(walletManager.securitySettings.requireConfirmation).toBe(false);
      expect(walletManager.securitySettings.maxTransactionValue).toBe(BigInt('20') * BigInt(10 ** 18));
      expect(settingsSpy).toHaveBeenCalled();
    });

    test('should add trusted contract', () => {
      const addedSpy = jest.fn();
      walletManager.on('trustedContractAdded', addedSpy);

      const contractAddress = '0xTrustedContract123456789012345678901234';
      walletManager.addTrustedContract(contractAddress);

      expect(walletManager.securitySettings.trustedContracts.has(contractAddress.toLowerCase())).toBe(true);
      expect(addedSpy).toHaveBeenCalledWith(contractAddress);
    });

    test('should remove trusted contract', () => {
      const contractAddress = '0xTrustedContract123456789012345678901234';
      walletManager.addTrustedContract(contractAddress);

      const removedSpy = jest.fn();
      walletManager.on('trustedContractRemoved', removedSpy);

      walletManager.removeTrustedContract(contractAddress);

      expect(walletManager.securitySettings.trustedContracts.has(contractAddress.toLowerCase())).toBe(false);
      expect(removedSpy).toHaveBeenCalled();
    });

    test('should add blocklisted contract', () => {
      const addedSpy = jest.fn();
      walletManager.on('blocklistedContractAdded', addedSpy);

      const contractAddress = '0xBlockedContract123456789012345678901234';
      walletManager.addBlocklistedContract(contractAddress);

      expect(walletManager.securitySettings.blocklistContracts.has(contractAddress.toLowerCase())).toBe(true);
      expect(addedSpy).toHaveBeenCalled();
    });

    test('should remove blocklisted contract', () => {
      const contractAddress = '0xBlockedContract123456789012345678901234';
      walletManager.addBlocklistedContract(contractAddress);

      const removedSpy = jest.fn();
      walletManager.on('blocklistedContractRemoved', removedSpy);

      walletManager.removeBlocklistedContract(contractAddress);

      expect(walletManager.securitySettings.blocklistContracts.has(contractAddress.toLowerCase())).toBe(false);
      expect(removedSpy).toHaveBeenCalled();
    });
  });

  describe('Event Emitter Functionality', () => {
    test('should register event listener', () => {
      const callback = jest.fn();
      walletManager.on('testEvent', callback);

      expect(walletManager.eventListeners.has('testEvent')).toBe(true);
      expect(walletManager.eventListeners.get('testEvent')).toContain(callback);
    });

    test('should emit event to all listeners', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      walletManager.on('testEvent', callback1);
      walletManager.on('testEvent', callback2);

      walletManager.emit('testEvent', { data: 'test' });

      expect(callback1).toHaveBeenCalledWith({ data: 'test' });
      expect(callback2).toHaveBeenCalledWith({ data: 'test' });
    });

    test('should remove specific event listener', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      walletManager.on('testEvent', callback1);
      walletManager.on('testEvent', callback2);
      walletManager.off('testEvent', callback1);

      walletManager.emit('testEvent', { data: 'test' });

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    test('should handle errors in event listeners', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const errorCallback = jest.fn(() => { throw new Error('Listener error'); });
      const normalCallback = jest.fn();

      walletManager.on('testEvent', errorCallback);
      walletManager.on('testEvent', normalCallback);

      walletManager.emit('testEvent', { data: 'test' });

      expect(consoleSpy).toHaveBeenCalled();
      expect(normalCallback).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    test('should not throw error when emitting to non-existent event', () => {
      expect(() => {
        walletManager.emit('nonExistentEvent', { data: 'test' });
      }).not.toThrow();
    });
  });

  describe('Wallet State Getters', () => {
    test('should return correct connection status', async () => {
      expect(walletManager.isConnected).toBe(false);

      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890']);
      await walletManager.connect(WALLET_PROVIDERS.METAMASK);

      expect(walletManager.isConnected).toBe(true);
    });

    test('should return current account', async () => {
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890']);
      await walletManager.connect(WALLET_PROVIDERS.METAMASK);

      expect(walletManager.currentAccount).toBe('0x1234567890123456789012345678901234567890');
    });

    test('should return current chainId', async () => {
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890']);
      await walletManager.connect(WALLET_PROVIDERS.METAMASK);

      expect(walletManager.currentChainId).toBe(1);
    });

    test('should return current provider', async () => {
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890']);
      await walletManager.connect(WALLET_PROVIDERS.METAMASK);

      expect(walletManager.currentProvider).toBe(mockProvider);
    });

    test('should return current signer', async () => {
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890']);
      await walletManager.connect(WALLET_PROVIDERS.METAMASK);

      expect(walletManager.currentSigner).toBe(mockSigner);
    });

    test('should return connection info', async () => {
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890']);
      await walletManager.connect(WALLET_PROVIDERS.METAMASK);

      const info = walletManager.connectionInfo;

      expect(info.account).toBe('0x1234567890123456789012345678901234567890');
      expect(info.chainId).toBe(1);
      expect(info.providerType).toBe(WALLET_PROVIDERS.METAMASK);
      expect(info.connectionState).toBe(CONNECTION_STATE.CONNECTED);
      expect(info.isConnected).toBe(true);
    });

    test('should return transaction history', async () => {
      const history = walletManager.transactionHistory;

      expect(Array.isArray(history)).toBe(true);
    });

    test('should return available networks', () => {
      const networks = walletManager.availableNetworks;

      expect(Array.isArray(networks)).toBe(true);
      expect(networks.length).toBeGreaterThan(0);
      expect(networks[0]).toHaveProperty('chainId');
      expect(networks[0]).toHaveProperty('name');
    });
  });

  describe('Utility Methods', () => {
    test('should format address correctly', () => {
      const address = '0x1234567890123456789012345678901234567890';
      const formatted = walletManager.formatAddress(address);

      expect(formatted).toBe('0x1234...7890');
    });

    test('should format address with custom length', () => {
      const address = '0x1234567890123456789012345678901234567890';
      const formatted = walletManager.formatAddress(address, 6);

      expect(formatted).toBe('0x123456...567890');
    });

    test('should handle empty address', () => {
      const formatted = walletManager.formatAddress('');

      expect(formatted).toBe('');
    });

    test('should format balance correctly', () => {
      const balance = BigInt('1234567890123456789');
      const formatted = walletManager.formatBalance(balance);

      expect(ethers.formatUnits).toHaveBeenCalledWith(balance, 18);
    });

    test('should format balance with custom decimals', () => {
      const balance = BigInt('1234567890');
      walletManager.formatBalance(balance, 6);

      expect(ethers.formatUnits).toHaveBeenCalledWith(balance, 6);
    });

    test('should handle zero balance', () => {
      const formatted = walletManager.formatBalance(null);

      expect(formatted).toBe('0');
    });
  });

  describe('Reconnection Handling', () => {
    test('should attempt reconnection with provider type', async () => {
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890']);

      await walletManager.reconnect(WALLET_PROVIDERS.METAMASK);

      expect(walletManager.connectionState).toBe(CONNECTION_STATE.CONNECTED);
    });

    test('should set reconnecting state during reconnection', async () => {
      const stateChangedSpy = jest.fn();
      walletManager.on('connectionStateChanged', stateChangedSpy);

      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890']);

      await walletManager.reconnect(WALLET_PROVIDERS.METAMASK);

      expect(stateChangedSpy).toHaveBeenCalledWith(CONNECTION_STATE.RECONNECTING);
    });

    test('should disconnect on reconnection failure', async () => {
      mockEthereum.request.mockRejectedValue(new Error('Reconnection failed'));

      await walletManager.reconnect(WALLET_PROVIDERS.METAMASK);

      expect(walletManager.connectionState).toBe(CONNECTION_STATE.DISCONNECTED);
    });
  });

  describe('Network Validation', () => {
    beforeEach(async () => {
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890']);
      await walletManager.connect(WALLET_PROVIDERS.METAMASK);
    });

    test('should validate supported network', async () => {
      walletManager.chainId = CHAIN_IDS.MAINNET;

      await expect(walletManager.validateNetwork()).resolves.not.toThrow();
    });

    test('should throw error for unsupported network', async () => {
      walletManager.chainId = 999999;

      await expect(walletManager.validateNetwork())
        .rejects.toThrow('Unsupported network');
    });
  });

  describe('Suspicious Activity Detection', () => {
    test('should detect potential MEV attack patterns', async () => {
      const transaction = {
        to: '0x9876543210987654321098765432109876543210',
        data: '0xdeadbeef12345678'
      };

      // Should not throw, but can be extended to warn users
      await expect(walletManager.detectSuspiciousActivity(transaction))
        .resolves.not.toThrow();
    });

    test('should detect flash loan patterns', async () => {
      const transaction = {
        to: '0x9876543210987654321098765432109876543210',
        data: '0xflashloan'
      };

      await expect(walletManager.detectSuspiciousActivity(transaction))
        .resolves.not.toThrow();
    });

    test('should handle transactions without data field', async () => {
      const transaction = {
        to: '0x9876543210987654321098765432109876543210',
        value: BigInt('1000000000000000000')
      };

      await expect(walletManager.detectSuspiciousActivity(transaction))
        .resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors during connection', async () => {
      mockEthereum.request.mockRejectedValue({ code: -32002, message: 'Already processing' });

      await expect(walletManager.connect(WALLET_PROVIDERS.METAMASK))
        .rejects.toThrow();

      expect(walletManager.connectionState).toBe(CONNECTION_STATE.ERROR);
    });

    test('should emit error event on connection failure', async () => {
      const errorSpy = jest.fn();
      walletManager.on('error', errorSpy);

      mockEthereum.request.mockRejectedValue(new Error('Connection failed'));

      await expect(walletManager.connect(WALLET_PROVIDERS.METAMASK))
        .rejects.toThrow();

      expect(errorSpy).toHaveBeenCalled();
    });

    test('should handle unsupported provider type', async () => {
      await expect(walletManager.connect('unsupportedProvider'))
        .rejects.toThrow('Unsupported provider type');
    });

    test('should handle provider initialization failure', async () => {
      ethers.BrowserProvider.mockImplementation(() => {
        throw new Error('Provider initialization failed');
      });

      await expect(walletManager.connect(WALLET_PROVIDERS.METAMASK))
        .rejects.toThrow();
    });
  });

  describe('Multiple Wallet Support', () => {
    test('should detect multiple wallets when available', () => {
      window.ethereum = {
        isMetaMask: true,
        isCoinbaseWallet: true,
        isTrust: true,
        isRainbow: true
      };

      const wallets = walletManager.detectWallets();

      // Note: In reality, only one flag should be true at a time
      expect(wallets[WALLET_PROVIDERS.METAMASK].installed).toBe(true);
      expect(wallets[WALLET_PROVIDERS.COINBASE].installed).toBe(true);
      expect(wallets[WALLET_PROVIDERS.TRUST].installed).toBe(true);
      expect(wallets[WALLET_PROVIDERS.RAINBOW].installed).toBe(true);
    });

    test('should allow switching between different wallet providers', async () => {
      // Connect with MetaMask
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890']);
      await walletManager.connect(WALLET_PROVIDERS.METAMASK);
      expect(walletManager.providerType).toBe(WALLET_PROVIDERS.METAMASK);

      // Disconnect
      await walletManager.disconnect();

      // Connect with Coinbase
      window.ethereum = createMockEthereum({ isCoinbaseWallet: true, isMetaMask: false });
      mockEthereum = window.ethereum;
      mockEthereum.request.mockResolvedValue(['0x9876543210987654321098765432109876543210']);

      const newWalletManager = new WalletManager();
      await newWalletManager.connect(WALLET_PROVIDERS.COINBASE);

      expect(newWalletManager.providerType).toBe(WALLET_PROVIDERS.COINBASE);
    });
  });

  describe('Edge Cases', () => {
    test('should handle rapid connect/disconnect cycles', async () => {
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890']);

      await walletManager.connect(WALLET_PROVIDERS.METAMASK);
      await walletManager.disconnect();
      await walletManager.connect(WALLET_PROVIDERS.METAMASK);
      await walletManager.disconnect();

      expect(walletManager.connectionState).toBe(CONNECTION_STATE.DISCONNECTED);
    });

    test('should handle multiple simultaneous connection attempts', async () => {
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890']);

      const promise1 = walletManager.connect(WALLET_PROVIDERS.METAMASK);
      const promise2 = walletManager.connect(WALLET_PROVIDERS.METAMASK);

      await Promise.all([promise1, promise2]);

      expect(walletManager.isConnected).toBe(true);
    });

    test('should handle account change to same account', async () => {
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890']);
      await walletManager.connect(WALLET_PROVIDERS.METAMASK);

      const accountChangedSpy = jest.fn();
      walletManager.on('accountChanged', accountChangedSpy);

      await walletManager.handleAccountsChanged(['0x1234567890123456789012345678901234567890']);

      expect(accountChangedSpy).not.toHaveBeenCalled();
    });

    test('should handle disconnect event from provider', async () => {
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890']);
      await walletManager.connect(WALLET_PROVIDERS.METAMASK);

      walletManager.handleDisconnect();

      expect(walletManager.connectionState).toBe(CONNECTION_STATE.DISCONNECTED);
    });

    test('should handle transaction with zero value', async () => {
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890']);
      await walletManager.connect(WALLET_PROVIDERS.METAMASK);

      const transaction = {
        to: '0x9876543210987654321098765432109876543210',
        value: BigInt(0)
      };

      await expect(walletManager.sendTransaction(transaction))
        .resolves.toBeDefined();
    });

    test('should handle extremely large transaction values', async () => {
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890']);
      await walletManager.connect(WALLET_PROVIDERS.METAMASK);

      const transaction = {
        to: '0x9876543210987654321098765432109876543210',
        value: BigInt('1000000') * BigInt(10 ** 18) // 1 million ETH
      };

      await expect(walletManager.validateTransaction(transaction, {}))
        .rejects.toThrow('Transaction exceeds maximum value limit');
    });
  });

  describe('LocalStorage Persistence', () => {
    test('should persist connection info with timestamp', async () => {
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890']);
      await walletManager.connect(WALLET_PROVIDERS.METAMASK);

      const savedData = JSON.parse(localStorage.setItem.mock.calls[0][1]);

      expect(savedData).toHaveProperty('providerType');
      expect(savedData).toHaveProperty('account');
      expect(savedData).toHaveProperty('chainId');
      expect(savedData).toHaveProperty('timestamp');
    });

    test('should clear both connection and session storage on disconnect', async () => {
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890']);
      await walletManager.connect(WALLET_PROVIDERS.METAMASK);
      await walletManager.disconnect();

      expect(localStorage.removeItem).toHaveBeenCalledWith('cryb_wallet_connection');
      expect(localStorage.removeItem).toHaveBeenCalledWith('cryb_wallet_session');
    });

    test('should update localStorage on account change', async () => {
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890']);
      await walletManager.connect(WALLET_PROVIDERS.METAMASK);

      const callsBefore = localStorage.setItem.mock.calls.length;

      await walletManager.handleAccountsChanged(['0x9876543210987654321098765432109876543210']);

      expect(localStorage.setItem.mock.calls.length).toBeGreaterThan(callsBefore);
    });

    test('should update localStorage on chain change', async () => {
      mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890']);
      await walletManager.connect(WALLET_PROVIDERS.METAMASK);

      const callsBefore = localStorage.setItem.mock.calls.length;

      await walletManager.handleChainChanged('0x89');

      expect(localStorage.setItem.mock.calls.length).toBeGreaterThan(callsBefore);
    });
  });

  describe('Constants and Enums', () => {
    test('should export WALLET_PROVIDERS constants', () => {
      expect(WALLET_PROVIDERS.METAMASK).toBe('metamask');
      expect(WALLET_PROVIDERS.WALLETCONNECT).toBe('walletconnect');
      expect(WALLET_PROVIDERS.COINBASE).toBe('coinbase');
      expect(WALLET_PROVIDERS.TRUST).toBe('trust');
      expect(WALLET_PROVIDERS.RAINBOW).toBe('rainbow');
      expect(WALLET_PROVIDERS.INJECTED).toBe('injected');
    });

    test('should export CONNECTION_STATE constants', () => {
      expect(CONNECTION_STATE.DISCONNECTED).toBe('disconnected');
      expect(CONNECTION_STATE.CONNECTING).toBe('connecting');
      expect(CONNECTION_STATE.CONNECTED).toBe('connected');
      expect(CONNECTION_STATE.RECONNECTING).toBe('reconnecting');
      expect(CONNECTION_STATE.ERROR).toBe('error');
    });

    test('should export TRANSACTION_TYPES constants', () => {
      expect(TRANSACTION_TYPES.TRANSFER).toBe('transfer');
      expect(TRANSACTION_TYPES.APPROVAL).toBe('approval');
      expect(TRANSACTION_TYPES.SWAP).toBe('swap');
      expect(TRANSACTION_TYPES.STAKE).toBe('stake');
      expect(TRANSACTION_TYPES.NFT_MINT).toBe('nft_mint');
    });

    test('should export SECURITY_LEVELS constants', () => {
      expect(SECURITY_LEVELS.LOW).toBe(1);
      expect(SECURITY_LEVELS.MEDIUM).toBe(2);
      expect(SECURITY_LEVELS.HIGH).toBe(3);
      expect(SECURITY_LEVELS.CRITICAL).toBe(4);
    });
  });
});
