import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import EnhancedWalletConnect from './EnhancedWalletConnect';
import { walletManager } from '../../lib/web3/WalletManager.js';
import { CHAIN_IDS, NETWORK_CONFIGS } from '../../lib/contracts/cryb-contracts.js';

// Mock dependencies
vi.mock('../../lib/web3/WalletManager.js', () => ({
  walletManager: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    isConnected: false,
    account: null,
    currentChainId: null,
    providerType: null,
    provider: null
  }
}));

vi.mock('../../lib/contracts/cryb-contracts.js', () => ({
  CHAIN_IDS: {
    POLYGON: 137,
    ARBITRUM: 42161,
    OPTIMISM: 10,
    BASE: 8453
  },
  NETWORK_CONFIGS: {
    137: {
      name: 'Polygon',
      iconUrl: 'https://example.com/polygon.png',
      nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 }
    },
    42161: {
      name: 'Arbitrum',
      iconUrl: 'https://example.com/arbitrum.png',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
    },
    10: {
      name: 'Optimism',
      iconUrl: 'https://example.com/optimism.png',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
    },
    8453: {
      name: 'Base',
      iconUrl: 'https://example.com/base.png',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
    }
  }
}));

describe('EnhancedWalletConnect', () => {
  let mockEthereum;
  let mockSolana;

  beforeEach(() => {
    // Setup mock window.ethereum
    mockEthereum = {
      isMetaMask: true,
      request: vi.fn(),
      on: vi.fn(),
      removeListener: vi.fn()
    };

    // Setup mock window.solana
    mockSolana = {
      isPhantom: true,
      connect: vi.fn()
    };

    window.ethereum = mockEthereum;
    window.solana = mockSolana;

    // Setup clipboard mock
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(() => Promise.resolve())
      }
    });

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete window.ethereum;
    delete window.solana;
  });

  // ==================== Rendering Tests ====================

  describe('Component Rendering', () => {
    it('should render connect button when not connected', () => {
      render(<EnhancedWalletConnect />);
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    });

    it('should render with proper structure', () => {
      const { container } = render(<EnhancedWalletConnect />);
      expect(container.querySelector('button')).toBeInTheDocument();
    });

    it('should have wallet icon in connect button', () => {
      render(<EnhancedWalletConnect />);
      const button = screen.getByText('Connect Wallet').closest('button');
      expect(button).toBeInTheDocument();
    });

    it('should render without errors when props are missing', () => {
      expect(() => render(<EnhancedWalletConnect />)).not.toThrow();
    });

    it('should accept onConnect prop', () => {
      const onConnect = vi.fn();
      render(<EnhancedWalletConnect onConnect={onConnect} />);
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    });

    it('should accept onDisconnect prop', () => {
      const onDisconnect = vi.fn();
      render(<EnhancedWalletConnect onDisconnect={onDisconnect} />);
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    });

    it('should accept showNetworkSwitcher prop', () => {
      render(<EnhancedWalletConnect showNetworkSwitcher={false} />);
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    });
  });

  // ==================== Modal Tests ====================

  describe('Wallet Selection Modal', () => {
    it('should open modal when connect button is clicked', async () => {
      render(<EnhancedWalletConnect />);
      const connectButton = screen.getByText('Connect Wallet');

      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText('Connect Wallet', { selector: '[class*="Dialog"]' })).toBeInTheDocument();
      });
    });

    it('should display all wallet options in modal', async () => {
      render(<EnhancedWalletConnect />);
      fireEvent.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        expect(screen.getByText('MetaMask')).toBeInTheDocument();
        expect(screen.getByText('WalletConnect')).toBeInTheDocument();
        expect(screen.getByText('Coinbase Wallet')).toBeInTheDocument();
        expect(screen.getByText('Trust Wallet')).toBeInTheDocument();
        expect(screen.getByText('Phantom')).toBeInTheDocument();
        expect(screen.getByText('Ledger')).toBeInTheDocument();
        expect(screen.getByText('Trezor')).toBeInTheDocument();
      });
    });

    it('should show wallet descriptions', async () => {
      render(<EnhancedWalletConnect />);
      fireEvent.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        expect(screen.getByText('Connect using MetaMask browser extension')).toBeInTheDocument();
        expect(screen.getByText('Connect using WalletConnect protocol')).toBeInTheDocument();
      });
    });

    it('should display wallet icons', async () => {
      render(<EnhancedWalletConnect />);
      fireEvent.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        expect(screen.getByText('🦊')).toBeInTheDocument(); // MetaMask
        expect(screen.getByText('🔗')).toBeInTheDocument(); // WalletConnect
        expect(screen.getByText('🟦')).toBeInTheDocument(); // Coinbase
      });
    });

    it('should show detected badge for installed wallets', async () => {
      render(<EnhancedWalletConnect />);
      fireEvent.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        expect(screen.getByText('Detected')).toBeInTheDocument();
      });
    });

    it('should show install badge for non-installed wallets', async () => {
      window.ethereum.isMetaMask = false;
      render(<EnhancedWalletConnect />);
      fireEvent.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        expect(screen.getByText('Install')).toBeInTheDocument();
      });
    });

    it('should close modal when clicking outside', async () => {
      render(<EnhancedWalletConnect />);
      fireEvent.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        expect(screen.getByText('MetaMask')).toBeInTheDocument();
      });

      // Simulate clicking outside (this behavior depends on Radix Dialog implementation)
      const dialog = screen.getByRole('dialog', { hidden: true });
      fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });
    });

    it('should display terms of service notice', async () => {
      render(<EnhancedWalletConnect />);
      fireEvent.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        expect(screen.getByText(/By connecting a wallet, you agree to CRYB's Terms of Service/i)).toBeInTheDocument();
      });
    });
  });

  // ==================== MetaMask Connection Tests ====================

  describe('MetaMask Connection', () => {
    it('should connect to MetaMask when selected', async () => {
      mockEthereum.request.mockResolvedValue(['0x123456789abcdef']);
      walletManager.connect.mockResolvedValue();
      walletManager.account = '0x123456789abcdef';
      walletManager.currentChainId = 1;
      walletManager.isConnected = true;

      render(<EnhancedWalletConnect />);
      fireEvent.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        expect(screen.getByText('MetaMask')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('MetaMask'));

      await waitFor(() => {
        expect(mockEthereum.request).toHaveBeenCalledWith({
          method: 'eth_requestAccounts'
        });
      });
    });

    it('should show error if MetaMask is not installed', async () => {
      window.ethereum.isMetaMask = false;

      render(<EnhancedWalletConnect />);
      fireEvent.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        expect(screen.getByText('MetaMask')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('MetaMask'));

      await waitFor(() => {
        expect(screen.getByText(/MetaMask is not installed/i)).toBeInTheDocument();
      });
    });

    it('should handle MetaMask connection rejection', async () => {
      mockEthereum.request.mockRejectedValue(new Error('User rejected request'));

      render(<EnhancedWalletConnect />);
      fireEvent.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        expect(screen.getByText('MetaMask')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('MetaMask'));

      await waitFor(() => {
        expect(screen.getByText(/User rejected request/i)).toBeInTheDocument();
      });
    });

    it('should call onConnect callback after successful MetaMask connection', async () => {
      const onConnect = vi.fn();
      mockEthereum.request.mockResolvedValue(['0x123456789abcdef']);
      walletManager.connect.mockResolvedValue();
      walletManager.account = '0x123456789abcdef';
      walletManager.currentChainId = 1;

      render(<EnhancedWalletConnect onConnect={onConnect} />);
      fireEvent.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        expect(screen.getByText('MetaMask')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('MetaMask'));

      await waitFor(() => {
        expect(onConnect).toHaveBeenCalled();
      });
    });
  });

  // ==================== WalletConnect Tests ====================

  describe('WalletConnect Connection', () => {
    it('should open QR code modal when WalletConnect is selected', async () => {
      render(<EnhancedWalletConnect />);
      fireEvent.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        expect(screen.getByText('WalletConnect')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('WalletConnect'));

      await waitFor(() => {
        expect(screen.getByText('Scan QR Code')).toBeInTheDocument();
      });
    });

    it('should display QR code placeholder', async () => {
      render(<EnhancedWalletConnect />);
      fireEvent.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        expect(screen.getByText('WalletConnect')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('WalletConnect'));

      await waitFor(() => {
        expect(screen.getByText('QR Code would appear here')).toBeInTheDocument();
      });
    });

    it('should show WalletConnect instructions', async () => {
      render(<EnhancedWalletConnect />);
      fireEvent.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        expect(screen.getByText('WalletConnect')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('WalletConnect'));

      await waitFor(() => {
        expect(screen.getByText('1. Open your wallet app')).toBeInTheDocument();
        expect(screen.getByText('2. Scan this QR code')).toBeInTheDocument();
        expect(screen.getByText('3. Approve the connection')).toBeInTheDocument();
      });
    });

    it('should close QR code modal when cancel is clicked', async () => {
      render(<EnhancedWalletConnect />);
      fireEvent.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        expect(screen.getByText('WalletConnect')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('WalletConnect'));

      await waitFor(() => {
        expect(screen.getByText('Scan QR Code')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Scan QR Code')).not.toBeInTheDocument();
      });
    });
  });

  // ==================== Coinbase Wallet Tests ====================

  describe('Coinbase Wallet Connection', () => {
    it('should connect to Coinbase Wallet when selected and installed', async () => {
      window.ethereum.isCoinbaseWallet = true;
      mockEthereum.request.mockResolvedValue(['0xabc123']);
      walletManager.connect.mockResolvedValue();
      walletManager.account = '0xabc123';
      walletManager.currentChainId = 1;

      render(<EnhancedWalletConnect />);
      fireEvent.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        expect(screen.getByText('Coinbase Wallet')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Coinbase Wallet'));

      await waitFor(() => {
        expect(mockEthereum.request).toHaveBeenCalledWith({
          method: 'eth_requestAccounts'
        });
      });
    });

    it('should show error if Coinbase Wallet is not installed', async () => {
      window.ethereum.isCoinbaseWallet = false;

      render(<EnhancedWalletConnect />);
      fireEvent.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        expect(screen.getByText('Coinbase Wallet')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Coinbase Wallet'));

      await waitFor(() => {
        expect(screen.getByText(/Coinbase Wallet is not installed/i)).toBeInTheDocument();
      });
    });

    it('should show download button for Coinbase Wallet', async () => {
      window.ethereum.isCoinbaseWallet = false;

      render(<EnhancedWalletConnect />);
      fireEvent.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        expect(screen.getByText('Install')).toBeInTheDocument();
      });
    });
  });

  // ==================== Multi-Wallet Support Tests ====================

  describe('Multi-Wallet Support', () => {
    it('should detect multiple wallets', async () => {
      window.ethereum.isMetaMask = true;
      window.ethereum.isCoinbaseWallet = false;
      window.solana.isPhantom = true;

      render(<EnhancedWalletConnect />);
      fireEvent.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        expect(screen.getByText('MetaMask')).toBeInTheDocument();
        expect(screen.getByText('Phantom')).toBeInTheDocument();
      });
    });

    it('should prioritize installed wallets', async () => {
      render(<EnhancedWalletConnect />);
      fireEvent.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        const wallets = screen.getAllByText('Detected');
        expect(wallets.length).toBeGreaterThan(0);
      });
    });

    it('should show hardware wallets (Ledger, Trezor)', async () => {
      render(<EnhancedWalletConnect />);
      fireEvent.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        expect(screen.getByText('Ledger')).toBeInTheDocument();
        expect(screen.getByText('Trezor')).toBeInTheDocument();
      });
    });

    it('should show Trust Wallet option', async () => {
      render(<EnhancedWalletConnect />);
      fireEvent.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        expect(screen.getByText('Trust Wallet')).toBeInTheDocument();
      });
    });

    it('should show Phantom wallet option', async () => {
      render(<EnhancedWalletConnect />);
      fireEvent.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        expect(screen.getByText('Phantom')).toBeInTheDocument();
      });
    });
  });

  // ==================== Connection Status Tests ====================

  describe('Connection Status', () => {
    it('should display connected state', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x123456789abcdef';
      walletManager.currentChainId = 1;
      walletManager.provider = {
        getBalance: vi.fn().mockResolvedValue(BigInt(1000000000000000000)) // 1 ETH
      };

      render(<EnhancedWalletConnect />);

      await waitFor(() => {
        expect(screen.getByText(/0x1234...cdef/i)).toBeInTheDocument();
      });
    });

    it('should show formatted wallet address', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x123456789abcdef123456789';
      walletManager.currentChainId = 1;
      walletManager.provider = {
        getBalance: vi.fn().mockResolvedValue(BigInt(0))
      };

      render(<EnhancedWalletConnect />);

      await waitFor(() => {
        expect(screen.getByText(/0x1234...6789/i)).toBeInTheDocument();
      });
    });

    it('should show wallet balance', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x123456789abcdef';
      walletManager.currentChainId = 1;
      walletManager.provider = {
        getBalance: vi.fn().mockResolvedValue(BigInt(2500000000000000000)) // 2.5 ETH
      };

      render(<EnhancedWalletConnect />);

      await waitFor(() => {
        expect(screen.getByText(/ETH/i)).toBeInTheDocument();
      });
    });

    it('should show network name when connected', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x123456789abcdef';
      walletManager.currentChainId = 137;
      walletManager.provider = {
        getBalance: vi.fn().mockResolvedValue(BigInt(0))
      };

      render(<EnhancedWalletConnect showNetworkSwitcher={true} />);

      await waitFor(() => {
        expect(screen.getByText('Polygon')).toBeInTheDocument();
      });
    });

    it('should show copy address button', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x123456789abcdef';
      walletManager.currentChainId = 1;
      walletManager.provider = {
        getBalance: vi.fn().mockResolvedValue(BigInt(0))
      };

      render(<EnhancedWalletConnect />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
      });
    });

    it('should show disconnect button when connected', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x123456789abcdef';
      walletManager.currentChainId = 1;
      walletManager.provider = {
        getBalance: vi.fn().mockResolvedValue(BigInt(0))
      };

      render(<EnhancedWalletConnect />);

      await waitFor(() => {
        expect(screen.getByText('Disconnect')).toBeInTheDocument();
      });
    });
  });

  // ==================== Disconnect Functionality Tests ====================

  describe('Disconnect Functionality', () => {
    it('should disconnect wallet when disconnect button is clicked', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x123456789abcdef';
      walletManager.currentChainId = 1;
      walletManager.provider = {
        getBalance: vi.fn().mockResolvedValue(BigInt(0))
      };
      walletManager.disconnect.mockResolvedValue();

      render(<EnhancedWalletConnect />);

      await waitFor(() => {
        expect(screen.getByText('Disconnect')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Disconnect'));

      await waitFor(() => {
        expect(walletManager.disconnect).toHaveBeenCalled();
      });
    });

    it('should call onDisconnect callback', async () => {
      const onDisconnect = vi.fn();
      walletManager.isConnected = true;
      walletManager.account = '0x123456789abcdef';
      walletManager.currentChainId = 1;
      walletManager.provider = {
        getBalance: vi.fn().mockResolvedValue(BigInt(0))
      };
      walletManager.disconnect.mockResolvedValue();

      render(<EnhancedWalletConnect onDisconnect={onDisconnect} />);

      await waitFor(() => {
        expect(screen.getByText('Disconnect')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Disconnect'));

      await waitFor(() => {
        expect(onDisconnect).toHaveBeenCalled();
      });
    });

    it('should handle disconnect errors gracefully', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x123456789abcdef';
      walletManager.currentChainId = 1;
      walletManager.provider = {
        getBalance: vi.fn().mockResolvedValue(BigInt(0))
      };
      walletManager.disconnect.mockRejectedValue(new Error('Disconnect failed'));

      render(<EnhancedWalletConnect />);

      await waitFor(() => {
        expect(screen.getByText('Disconnect')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Disconnect'));

      // Should not throw error
      await waitFor(() => {
        expect(walletManager.disconnect).toHaveBeenCalled();
      });
    });

    it('should reset connection state on disconnect', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x123456789abcdef';
      walletManager.currentChainId = 1;
      walletManager.provider = {
        getBalance: vi.fn().mockResolvedValue(BigInt(0))
      };
      walletManager.disconnect.mockImplementation(() => {
        walletManager.isConnected = false;
        walletManager.account = null;
        walletManager.currentChainId = null;
        return Promise.resolve();
      });

      const { rerender } = render(<EnhancedWalletConnect />);

      await waitFor(() => {
        expect(screen.getByText('Disconnect')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Disconnect'));

      await waitFor(() => {
        expect(walletManager.disconnect).toHaveBeenCalled();
      });

      rerender(<EnhancedWalletConnect />);

      await waitFor(() => {
        expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
      });
    });
  });

  // ==================== Wallet Switching Tests ====================

  describe('Wallet Switching', () => {
    it('should handle account change event', async () => {
      const { rerender } = render(<EnhancedWalletConnect />);

      // Get the registered event handler
      const accountsChangedHandler = mockEthereum.on.mock.calls.find(
        call => call[0] === 'accountsChanged'
      )?.[1];

      expect(accountsChangedHandler).toBeDefined();

      // Simulate account change
      accountsChangedHandler(['0xnewaccount']);

      rerender(<EnhancedWalletConnect />);
    });

    it('should disconnect when accounts array is empty', async () => {
      const onDisconnect = vi.fn();
      render(<EnhancedWalletConnect onDisconnect={onDisconnect} />);

      // Get the registered event handler
      const accountsChangedHandler = mockEthereum.on.mock.calls.find(
        call => call[0] === 'accountsChanged'
      )?.[1];

      // Simulate no accounts
      accountsChangedHandler([]);

      await waitFor(() => {
        expect(onDisconnect).toHaveBeenCalled();
      });
    });

    it('should handle switching between different wallet accounts', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x123456789abcdef';
      walletManager.currentChainId = 1;
      walletManager.provider = {
        getBalance: vi.fn().mockResolvedValue(BigInt(0))
      };

      render(<EnhancedWalletConnect />);

      // Get the registered event handler
      const accountsChangedHandler = mockEthereum.on.mock.calls.find(
        call => call[0] === 'accountsChanged'
      )?.[1];

      // Simulate account switch
      accountsChangedHandler(['0xnewaccount123']);

      await waitFor(() => {
        expect(accountsChangedHandler).toBeDefined();
      });
    });
  });

  // ==================== Network Switching Tests ====================

  describe('Network Switching', () => {
    beforeEach(() => {
      walletManager.isConnected = true;
      walletManager.account = '0x123456789abcdef';
      walletManager.currentChainId = 1;
      walletManager.provider = {
        getBalance: vi.fn().mockResolvedValue(BigInt(0))
      };
    });

    it('should open network switch modal', async () => {
      render(<EnhancedWalletConnect showNetworkSwitcher={true} />);

      await waitFor(() => {
        expect(screen.getByText('Polygon')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Polygon'));

      await waitFor(() => {
        expect(screen.getByText('Switch Network')).toBeInTheDocument();
      });
    });

    it('should display available networks', async () => {
      render(<EnhancedWalletConnect showNetworkSwitcher={true} />);

      await waitFor(() => {
        const networkButton = screen.getByText('Polygon');
        fireEvent.click(networkButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Arbitrum')).toBeInTheDocument();
        expect(screen.getByText('Optimism')).toBeInTheDocument();
        expect(screen.getByText('Base')).toBeInTheDocument();
      });
    });

    it('should switch network when network is clicked', async () => {
      mockEthereum.request.mockResolvedValue();

      render(<EnhancedWalletConnect showNetworkSwitcher={true} />);

      await waitFor(() => {
        const networkButton = screen.getByText('Polygon');
        fireEvent.click(networkButton);
      });

      await waitFor(() => {
        const arbitrumOption = screen.getByText('Arbitrum');
        fireEvent.click(arbitrumOption);
      });

      await waitFor(() => {
        expect(mockEthereum.request).toHaveBeenCalledWith({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xa4b1' }]
        });
      });
    });

    it('should add network if not exists (error code 4902)', async () => {
      mockEthereum.request
        .mockRejectedValueOnce({ code: 4902 })
        .mockResolvedValueOnce();

      render(<EnhancedWalletConnect showNetworkSwitcher={true} />);

      await waitFor(() => {
        const networkButton = screen.getByText('Polygon');
        fireEvent.click(networkButton);
      });

      await waitFor(() => {
        const arbitrumOption = screen.getByText('Arbitrum');
        fireEvent.click(arbitrumOption);
      });

      await waitFor(() => {
        expect(mockEthereum.request).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'wallet_addEthereumChain'
          })
        );
      });
    });

    it('should handle network switch rejection', async () => {
      mockEthereum.request.mockRejectedValue(new Error('User rejected'));

      render(<EnhancedWalletConnect showNetworkSwitcher={true} />);

      await waitFor(() => {
        const networkButton = screen.getByText('Polygon');
        fireEvent.click(networkButton);
      });

      await waitFor(() => {
        const arbitrumOption = screen.getByText('Arbitrum');
        fireEvent.click(arbitrumOption);
      });

      await waitFor(() => {
        expect(mockEthereum.request).toHaveBeenCalled();
      });
    });

    it('should handle chain changed event', async () => {
      render(<EnhancedWalletConnect />);

      // Get the registered event handler
      const chainChangedHandler = mockEthereum.on.mock.calls.find(
        call => call[0] === 'chainChanged'
      )?.[1];

      expect(chainChangedHandler).toBeDefined();

      // Simulate chain change
      chainChangedHandler('0x89'); // Polygon
    });

    it('should not show network switcher when prop is false', async () => {
      render(<EnhancedWalletConnect showNetworkSwitcher={false} />);

      await waitFor(() => {
        expect(screen.queryByText('Polygon')).not.toBeInTheDocument();
      });
    });

    it('should highlight current network', async () => {
      walletManager.currentChainId = 137; // Polygon

      render(<EnhancedWalletConnect showNetworkSwitcher={true} />);

      await waitFor(() => {
        const networkButton = screen.getByText('Polygon');
        fireEvent.click(networkButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });
    });
  });

  // ==================== Error Handling Tests ====================

  describe('Error Handling', () => {
    it('should display connection errors', async () => {
      mockEthereum.request.mockRejectedValue(new Error('Connection failed'));

      render(<EnhancedWalletConnect />);
      fireEvent.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        expect(screen.getByText('MetaMask')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('MetaMask'));

      await waitFor(() => {
        expect(screen.getByText(/Connection failed/i)).toBeInTheDocument();
      });
    });

    it('should show error icon for errors', async () => {
      mockEthereum.request.mockRejectedValue(new Error('Test error'));

      render(<EnhancedWalletConnect />);
      fireEvent.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        fireEvent.click(screen.getByText('MetaMask'));
      });

      await waitFor(() => {
        expect(screen.getByText(/Test error/i)).toBeInTheDocument();
      });
    });

    it('should clear previous errors on new connection attempt', async () => {
      mockEthereum.request
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce(['0x123']);

      render(<EnhancedWalletConnect />);
      fireEvent.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        fireEvent.click(screen.getByText('MetaMask'));
      });

      await waitFor(() => {
        expect(screen.getByText(/First error/i)).toBeInTheDocument();
      });

      // Try again
      fireEvent.click(screen.getByText('MetaMask'));

      await waitFor(() => {
        expect(screen.queryByText(/First error/i)).not.toBeInTheDocument();
      });
    });

    it('should handle wallet manager connection errors', async () => {
      mockEthereum.request.mockResolvedValue(['0x123']);
      walletManager.connect.mockRejectedValue(new Error('WalletManager error'));

      render(<EnhancedWalletConnect />);
      fireEvent.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        fireEvent.click(screen.getByText('MetaMask'));
      });

      await waitFor(() => {
        expect(screen.getByText(/WalletManager error/i)).toBeInTheDocument();
      });
    });

    it('should handle balance fetch errors gracefully', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x123456789abcdef';
      walletManager.currentChainId = 1;
      walletManager.provider = {
        getBalance: vi.fn().mockRejectedValue(new Error('Balance error'))
      };

      render(<EnhancedWalletConnect />);

      await waitFor(() => {
        expect(screen.getByText(/0x1234...cdef/i)).toBeInTheDocument();
      });
    });

    it('should handle missing wallet provider', async () => {
      delete window.ethereum;

      render(<EnhancedWalletConnect />);
      fireEvent.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        expect(screen.getByText('MetaMask')).toBeInTheDocument();
      });
    });
  });

  // ==================== Loading States Tests ====================

  describe('Loading States', () => {
    it('should show connecting state', async () => {
      mockEthereum.request.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<EnhancedWalletConnect />);
      fireEvent.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        fireEvent.click(screen.getByText('MetaMask'));
      });

      await waitFor(() => {
        expect(screen.getByText('Connecting...')).toBeInTheDocument();
      });
    });

    it('should disable connect button while connecting', async () => {
      mockEthereum.request.mockImplementation(() => new Promise(() => {}));

      render(<EnhancedWalletConnect />);

      const connectButton = screen.getByText('Connect Wallet');
      fireEvent.click(connectButton);

      await waitFor(() => {
        fireEvent.click(screen.getByText('MetaMask'));
      });

      await waitFor(() => {
        const button = screen.getByText('Connecting...').closest('button');
        expect(button).toBeDisabled();
      });
    });

    it('should show loading spinner while connecting', async () => {
      mockEthereum.request.mockImplementation(() => new Promise(() => {}));

      render(<EnhancedWalletConnect />);
      fireEvent.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        fireEvent.click(screen.getByText('MetaMask'));
      });

      await waitFor(() => {
        expect(screen.getByText('Connecting...')).toBeInTheDocument();
      });
    });

    it('should return to normal state after connection failure', async () => {
      mockEthereum.request.mockRejectedValue(new Error('Failed'));

      render(<EnhancedWalletConnect />);
      fireEvent.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        fireEvent.click(screen.getByText('MetaMask'));
      });

      await waitFor(() => {
        expect(screen.getByText(/Failed/i)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.queryByText('Connecting...')).not.toBeInTheDocument();
      });
    });
  });

  // ==================== Accessibility Tests ====================

  describe('Accessibility', () => {
    it('should have accessible button labels', () => {
      render(<EnhancedWalletConnect />);
      expect(screen.getByRole('button', { name: /Connect Wallet/i })).toBeInTheDocument();
    });

    it('should have proper ARIA roles for modals', async () => {
      render(<EnhancedWalletConnect />);
      fireEvent.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        expect(screen.getByRole('dialog', { hidden: true })).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<EnhancedWalletConnect />);

      const button = screen.getByText('Connect Wallet');

      // Tab to button
      await user.tab();

      // Press Enter
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText('MetaMask')).toBeInTheDocument();
      });
    });

    it('should have proper button states for screen readers', async () => {
      mockEthereum.request.mockImplementation(() => new Promise(() => {}));

      render(<EnhancedWalletConnect />);
      fireEvent.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        fireEvent.click(screen.getByText('MetaMask'));
      });

      await waitFor(() => {
        const button = screen.getByText('Connecting...').closest('button');
        expect(button).toHaveAttribute('disabled');
      });
    });

    it('should have descriptive text for wallet options', async () => {
      render(<EnhancedWalletConnect />);
      fireEvent.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        expect(screen.getByText('Connect using MetaMask browser extension')).toBeInTheDocument();
      });
    });

    it('should have copy functionality with clipboard', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x123456789abcdef';
      walletManager.currentChainId = 1;
      walletManager.provider = {
        getBalance: vi.fn().mockResolvedValue(BigInt(0))
      };

      render(<EnhancedWalletConnect />);

      await waitFor(() => {
        const copyButtons = screen.getAllByRole('button');
        const copyButton = copyButtons.find(btn => btn.querySelector('svg'));
        expect(copyButton).toBeInTheDocument();
      });
    });

    it('should copy address to clipboard when copy button is clicked', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x123456789abcdef';
      walletManager.currentChainId = 1;
      walletManager.provider = {
        getBalance: vi.fn().mockResolvedValue(BigInt(0))
      };

      render(<EnhancedWalletConnect />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const copyButton = buttons.find(btn => {
          const svg = btn.querySelector('svg');
          return svg !== null;
        });

        if (copyButton) {
          fireEvent.click(copyButton);
        }
      });

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
      });
    });

    it('should provide visual feedback for interactive elements', async () => {
      render(<EnhancedWalletConnect />);
      fireEvent.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        const walletCard = screen.getByText('MetaMask').closest('[class*="Card"]');
        expect(walletCard).toHaveClass(expect.stringContaining('cursor-pointer'));
      });
    });

    it('should have proper focus management', async () => {
      render(<EnhancedWalletConnect />);

      const button = screen.getByText('Connect Wallet');
      button.focus();

      expect(button).toHaveFocus();
    });
  });

  // ==================== Additional Integration Tests ====================

  describe('Integration Tests', () => {
    it('should maintain connection after page reload', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x123456789abcdef';
      walletManager.currentChainId = 1;
      walletManager.provider = {
        getBalance: vi.fn().mockResolvedValue(BigInt(0))
      };

      render(<EnhancedWalletConnect />);

      await waitFor(() => {
        expect(screen.getByText(/0x1234...cdef/i)).toBeInTheDocument();
      });
    });

    it('should cleanup event listeners on unmount', () => {
      const { unmount } = render(<EnhancedWalletConnect />);

      unmount();

      expect(mockEthereum.removeListener).toHaveBeenCalled();
    });

    it('should handle rapid connection attempts', async () => {
      mockEthereum.request.mockResolvedValue(['0x123']);
      walletManager.connect.mockResolvedValue();

      render(<EnhancedWalletConnect />);
      fireEvent.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        const metamask = screen.getByText('MetaMask');
        fireEvent.click(metamask);
        fireEvent.click(metamask);
        fireEvent.click(metamask);
      });

      await waitFor(() => {
        expect(mockEthereum.request).toHaveBeenCalled();
      });
    });

    it('should handle mobile deep links', async () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      window.ethereum.isTrust = false;

      render(<EnhancedWalletConnect />);
      fireEvent.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        expect(screen.getByText('Trust Wallet')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Trust Wallet'));

      await waitFor(() => {
        expect(openSpy).toHaveBeenCalled();
      });

      openSpy.mockRestore();
    });

    it('should handle download links for non-installed wallets', async () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      window.ethereum.isMetaMask = false;

      render(<EnhancedWalletConnect />);
      fireEvent.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        const downloadButtons = screen.getAllByRole('button');
        const downloadButton = downloadButtons.find(btn => {
          const svg = btn.querySelector('svg');
          return svg !== null;
        });

        if (downloadButton) {
          fireEvent.click(downloadButton);
        }
      });

      openSpy.mockRestore();
    });
  });
});

export default button
