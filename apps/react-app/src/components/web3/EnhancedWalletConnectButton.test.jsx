import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import EnhancedWalletConnectButton from './EnhancedWalletConnectButton';
import { useWeb3Auth } from '../../lib/hooks/useWeb3Auth';
import { useWeb3ErrorHandler } from './Web3ErrorHandler';

// Mock dependencies
vi.mock('../../lib/hooks/useWeb3Auth');
vi.mock('./Web3ErrorHandler', () => ({
  default: ({ error, onRetry, onDismiss }) => (
    <div data-testid="web3-error-handler">
      <div data-testid="error-message">{error.message}</div>
      <button onClick={onRetry} data-testid="error-retry">Retry</button>
      <button onClick={onDismiss} data-testid="error-dismiss">Dismiss</button>
    </div>
  ),
  useWeb3ErrorHandler: vi.fn()
}));

vi.mock('./Web3Skeletons', () => ({
  WalletConnectSkeleton: ({ className }) => (
    <div data-testid="wallet-skeleton" className={className}>Loading...</div>
  )
}));

vi.mock('../ui/Button', () => ({
  default: ({ children, onClick, variant, className, disabled }) => (
    <button
      onClick={onClick}
      data-variant={variant}
      className={className}
      disabled={disabled}
      data-testid="button"
    >
      {children}
    </button>
  )
}));

describe('EnhancedWalletConnectButton', () => {
  const mockConnect = vi.fn();
  const mockDisconnect = vi.fn();
  const mockRetry = vi.fn();
  const mockAddError = vi.fn();
  const mockDismissError = vi.fn();

  const defaultWeb3State = {
    state: {
      isInitialized: true,
      isConnected: false,
      isConnecting: false,
      account: null,
      balance: null,
      chainId: null,
      ensName: null,
      providerType: null
    },
    actions: {
      connect: mockConnect,
      disconnect: mockDisconnect,
      retry: mockRetry
    }
  };

  const defaultErrorHandler = {
    errors: [],
    addError: mockAddError,
    dismissError: mockDismissError
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useWeb3Auth.mockReturnValue(defaultWeb3State);
    useWeb3ErrorHandler.mockReturnValue(defaultErrorHandler);

    // Mock window.ethereum
    global.window.ethereum = {
      isMetaMask: true
    };

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn()
      }
    });

    // Reset environment variable
    import.meta.env.VITE_ENABLE_WEB3_FEATURES = 'true';
  });

  afterEach(() => {
    delete global.window.ethereum;
  });

  describe('Button Rendering', () => {
    it('should render connect wallet button when not connected', () => {
      render(<EnhancedWalletConnectButton />);
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    });

    it('should render with small size', () => {
      render(<EnhancedWalletConnectButton size="sm" />);
      const button = screen.getByText('Connect Wallet').closest('button');
      expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm');
    });

    it('should render with medium size (default)', () => {
      render(<EnhancedWalletConnectButton />);
      const button = screen.getByText('Connect Wallet').closest('button');
      expect(button).toHaveClass('px-4', 'py-2', 'text-base');
    });

    it('should render with large size', () => {
      render(<EnhancedWalletConnectButton size="lg" />);
      const button = screen.getByText('Connect Wallet').closest('button');
      expect(button).toHaveClass('px-6', 'py-3', 'text-lg');
    });

    it('should render with primary variant (default)', () => {
      render(<EnhancedWalletConnectButton />);
      const button = screen.getByText('Connect Wallet').closest('button');
      expect(button).toHaveClass('bg-gradient-to-r');
    });

    it('should render with secondary variant', () => {
      render(<EnhancedWalletConnectButton variant="secondary" />);
      const button = screen.getByText('Connect Wallet').closest('button');
      expect(button).toHaveClass('bg-secondary');
    });

    it('should render with outline variant', () => {
      render(<EnhancedWalletConnectButton variant="outline" />);
      const button = screen.getByText('Connect Wallet').closest('button');
      expect(button).toHaveClass('bg-transparent');
    });

    it('should apply custom className', () => {
      render(<EnhancedWalletConnectButton className="custom-class" />);
      expect(screen.getByText('Connect Wallet').closest('.wallet-dropdown')).toHaveClass('custom-class');
    });
  });

  describe('Loading and Initialization States', () => {
    it('should show skeleton when not initialized', () => {
      useWeb3Auth.mockReturnValue({
        ...defaultWeb3State,
        state: { ...defaultWeb3State.state, isInitialized: false }
      });

      render(<EnhancedWalletConnectButton />);
      expect(screen.getByTestId('wallet-skeleton')).toBeInTheDocument();
    });

    it('should show connecting state', () => {
      useWeb3Auth.mockReturnValue({
        ...defaultWeb3State,
        state: { ...defaultWeb3State.state, isConnecting: true }
      });

      render(<EnhancedWalletConnectButton />);
      expect(screen.getByText('Connecting...')).toBeInTheDocument();
    });

    it('should disable button during connecting state', () => {
      useWeb3Auth.mockReturnValue({
        ...defaultWeb3State,
        state: { ...defaultWeb3State.state, isConnecting: true }
      });

      render(<EnhancedWalletConnectButton />);
      const button = screen.getByText('Connecting...').closest('button');
      expect(button).toBeDisabled();
    });

    it('should show loading spinner in connecting state', () => {
      useWeb3Auth.mockReturnValue({
        ...defaultWeb3State,
        state: { ...defaultWeb3State.state, isConnecting: true }
      });

      const { container } = render(<EnhancedWalletConnectButton />);
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Coming Soon State', () => {
    it('should show coming soon badge when web3 features disabled', () => {
      import.meta.env.VITE_ENABLE_WEB3_FEATURES = 'false';

      render(<EnhancedWalletConnectButton />);
      expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    });

    it('should disable button when coming soon', () => {
      import.meta.env.VITE_ENABLE_WEB3_FEATURES = 'false';

      render(<EnhancedWalletConnectButton />);
      const button = screen.getByText('Connect Wallet').closest('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Connected State', () => {
    const connectedState = {
      state: {
        isInitialized: true,
        isConnected: true,
        isConnecting: false,
        account: '0x1234567890123456789012345678901234567890',
        balance: '1000000000000000000',
        chainId: 1,
        ensName: null,
        providerType: 'metamask'
      },
      actions: {
        connect: mockConnect,
        disconnect: mockDisconnect,
        retry: mockRetry
      }
    };

    it('should display formatted wallet address when connected', () => {
      useWeb3Auth.mockReturnValue(connectedState);

      render(<EnhancedWalletConnectButton />);
      expect(screen.getByText('0x1234...7890')).toBeInTheDocument();
    });

    it('should display ENS name instead of address when available', () => {
      useWeb3Auth.mockReturnValue({
        ...connectedState,
        state: { ...connectedState.state, ensName: 'vitalik.eth' }
      });

      render(<EnhancedWalletConnectButton />);
      expect(screen.getByText('vitalik.eth')).toBeInTheDocument();
    });

    it('should display wallet avatar with account prefix', () => {
      useWeb3Auth.mockReturnValue(connectedState);

      const { container } = render(<EnhancedWalletConnectButton />);
      // Account is 0x1234... so slice(2,4) is "12"
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('should display formatted balance', () => {
      useWeb3Auth.mockReturnValue(connectedState);

      render(<EnhancedWalletConnectButton />);
      const button = screen.getByText('0x1234...7890').closest('button');
      fireEvent.click(button);

      expect(screen.getByText(/0.0010 ETH/)).toBeInTheDocument();
    });

    it('should display zero balance when balance is null', () => {
      useWeb3Auth.mockReturnValue({
        ...connectedState,
        state: { ...connectedState.state, balance: null }
      });

      render(<EnhancedWalletConnectButton />);
      const button = screen.getByText('0x1234...7890').closest('button');
      fireEvent.click(button);

      expect(screen.getByText(/0 ETH/)).toBeInTheDocument();
    });

    it('should show connected badge in dropdown', () => {
      useWeb3Auth.mockReturnValue(connectedState);

      render(<EnhancedWalletConnectButton />);
      const button = screen.getByText('0x1234...7890').closest('button');
      fireEvent.click(button);

      expect(screen.getByText('Connected')).toBeInTheDocument();
    });
  });

  describe('Network Display', () => {
    it('should display Ethereum network', () => {
      useWeb3Auth.mockReturnValue({
        ...defaultWeb3State,
        state: {
          ...defaultWeb3State.state,
          isConnected: true,
          account: '0x1234567890123456789012345678901234567890',
          chainId: 1
        }
      });

      render(<EnhancedWalletConnectButton />);
      const button = screen.getByText('0x1234...7890').closest('button');
      fireEvent.click(button);

      expect(screen.getByText('Ethereum')).toBeInTheDocument();
    });

    it('should display Polygon network', () => {
      useWeb3Auth.mockReturnValue({
        ...defaultWeb3State,
        state: {
          ...defaultWeb3State.state,
          isConnected: true,
          account: '0x1234567890123456789012345678901234567890',
          chainId: 137
        }
      });

      render(<EnhancedWalletConnectButton />);
      const button = screen.getByText('0x1234...7890').closest('button');
      fireEvent.click(button);

      expect(screen.getByText('Polygon')).toBeInTheDocument();
    });

    it('should display Arbitrum network', () => {
      useWeb3Auth.mockReturnValue({
        ...defaultWeb3State,
        state: {
          ...defaultWeb3State.state,
          isConnected: true,
          account: '0x1234567890123456789012345678901234567890',
          chainId: 42161
        }
      });

      render(<EnhancedWalletConnectButton />);
      const button = screen.getByText('0x1234...7890').closest('button');
      fireEvent.click(button);

      expect(screen.getByText('Arbitrum')).toBeInTheDocument();
    });

    it('should display Base network', () => {
      useWeb3Auth.mockReturnValue({
        ...defaultWeb3State,
        state: {
          ...defaultWeb3State.state,
          isConnected: true,
          account: '0x1234567890123456789012345678901234567890',
          chainId: 8453
        }
      });

      render(<EnhancedWalletConnectButton />);
      const button = screen.getByText('0x1234...7890').closest('button');
      fireEvent.click(button);

      expect(screen.getByText('Base')).toBeInTheDocument();
    });

    it('should display unknown chain with chain ID', () => {
      useWeb3Auth.mockReturnValue({
        ...defaultWeb3State,
        state: {
          ...defaultWeb3State.state,
          isConnected: true,
          account: '0x1234567890123456789012345678901234567890',
          chainId: 99999
        }
      });

      render(<EnhancedWalletConnectButton />);
      const button = screen.getByText('0x1234...7890').closest('button');
      fireEvent.click(button);

      expect(screen.getByText('Chain 99999')).toBeInTheDocument();
    });
  });

  describe('Provider List and Selection', () => {
    it('should open provider dropdown when showProviderList is true', () => {
      render(<EnhancedWalletConnectButton showProviderList={true} />);
      const button = screen.getByText('Connect Wallet').closest('button');
      fireEvent.click(button);

      expect(screen.getByText('MetaMask')).toBeInTheDocument();
      expect(screen.getByText('WalletConnect')).toBeInTheDocument();
      expect(screen.getByText('Coinbase Wallet')).toBeInTheDocument();
    });

    it('should connect directly when showProviderList is false', async () => {
      render(<EnhancedWalletConnectButton showProviderList={false} />);
      const button = screen.getByText('Connect Wallet').closest('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockConnect).toHaveBeenCalledWith('metamask');
      });
    });

    it('should show recommended badge for MetaMask', () => {
      render(<EnhancedWalletConnectButton />);
      const button = screen.getByText('Connect Wallet').closest('button');
      fireEvent.click(button);

      expect(screen.getByText('Recommended')).toBeInTheDocument();
    });

    it('should show install badge for uninstalled providers', () => {
      global.window.ethereum = { isMetaMask: false };

      render(<EnhancedWalletConnectButton />);
      const button = screen.getByText('Connect Wallet').closest('button');
      fireEvent.click(button);

      const installBadges = screen.getAllByText('Install');
      expect(installBadges.length).toBeGreaterThan(0);
    });

    it('should show chevron icon in dropdown button', () => {
      const { container } = render(<EnhancedWalletConnectButton showProviderList={true} />);
      expect(container.querySelector('.lucide-chevron-down')).toBeInTheDocument();
    });

    it('should rotate chevron when dropdown is open', () => {
      const { container } = render(<EnhancedWalletConnectButton showProviderList={true} />);
      const button = screen.getByText('Connect Wallet').closest('button');

      const chevron = container.querySelector('.lucide-chevron-down');
      expect(chevron).not.toHaveClass('rotate-180');

      fireEvent.click(button);
      expect(chevron).toHaveClass('rotate-180');
    });
  });

  describe('Wallet Connection', () => {
    it('should call connect with MetaMask when provider is selected', async () => {
      render(<EnhancedWalletConnectButton />);
      const button = screen.getByText('Connect Wallet').closest('button');
      fireEvent.click(button);

      const metamaskButton = screen.getByText('MetaMask').closest('button');
      fireEvent.click(metamaskButton);

      await waitFor(() => {
        expect(mockConnect).toHaveBeenCalledWith('metamask');
      });
    });

    it('should call connect with WalletConnect', async () => {
      render(<EnhancedWalletConnectButton />);
      const button = screen.getByText('Connect Wallet').closest('button');
      fireEvent.click(button);

      const walletConnectButton = screen.getByText('WalletConnect').closest('button');
      fireEvent.click(walletConnectButton);

      await waitFor(() => {
        expect(mockConnect).toHaveBeenCalledWith('walletconnect');
      });
    });

    it('should call connect with Coinbase Wallet', async () => {
      global.window.ethereum = { isCoinbaseWallet: true };

      render(<EnhancedWalletConnectButton />);
      const button = screen.getByText('Connect Wallet').closest('button');
      fireEvent.click(button);

      const coinbaseButton = screen.getByText('Coinbase Wallet').closest('button');
      fireEvent.click(coinbaseButton);

      await waitFor(() => {
        expect(mockConnect).toHaveBeenCalledWith('coinbase');
      });
    });

    it('should close dropdown after connection attempt', async () => {
      render(<EnhancedWalletConnectButton />);
      const button = screen.getByText('Connect Wallet').closest('button');
      fireEvent.click(button);

      const metamaskButton = screen.getByText('MetaMask').closest('button');
      fireEvent.click(metamaskButton);

      await waitFor(() => {
        expect(screen.queryByText('Choose how you want to connect to Web3')).not.toBeInTheDocument();
      });
    });

    it('should call onConnect callback after successful connection', async () => {
      const onConnect = vi.fn();
      render(<EnhancedWalletConnectButton onConnect={onConnect} />);

      const button = screen.getByText('Connect Wallet').closest('button');
      fireEvent.click(button);

      const metamaskButton = screen.getByText('MetaMask').closest('button');
      fireEvent.click(metamaskButton);

      await waitFor(() => {
        expect(onConnect).toHaveBeenCalled();
      });
    });
  });

  describe('Install Wallet Modal', () => {
    beforeEach(() => {
      global.window.ethereum = undefined;
    });

    it('should show install modal when uninstalled provider is clicked', async () => {
      render(<EnhancedWalletConnectButton showInstallPrompts={true} />);

      const button = screen.getByText('Connect Wallet').closest('button');
      fireEvent.click(button);

      const metamaskButton = screen.getByText('MetaMask').closest('button');
      fireEvent.click(metamaskButton);

      await waitFor(() => {
        expect(screen.getByText('Install MetaMask')).toBeInTheDocument();
      });
    });

    it('should not show install modal when showInstallPrompts is false', async () => {
      mockConnect.mockResolvedValue();

      render(<EnhancedWalletConnectButton showInstallPrompts={false} />);

      const button = screen.getByText('Connect Wallet').closest('button');
      fireEvent.click(button);

      const metamaskButton = screen.getByText('MetaMask').closest('button');
      fireEvent.click(metamaskButton);

      await waitFor(() => {
        expect(screen.queryByText('Install MetaMask')).not.toBeInTheDocument();
      });
    });

    it('should open download URL when install button clicked', async () => {
      const windowOpen = vi.spyOn(window, 'open').mockImplementation(() => {});

      render(<EnhancedWalletConnectButton showInstallPrompts={true} />);

      const button = screen.getByText('Connect Wallet').closest('button');
      fireEvent.click(button);

      const metamaskButton = screen.getByText('MetaMask').closest('button');
      fireEvent.click(metamaskButton);

      await waitFor(() => {
        expect(screen.getByText('Install MetaMask')).toBeInTheDocument();
      });

      const installButton = screen.getAllByTestId('button').find(btn =>
        btn.textContent.includes('Install MetaMask')
      );
      fireEvent.click(installButton);

      expect(windowOpen).toHaveBeenCalledWith('https://metamask.io/download/', '_blank');
    });

    it('should close modal when cancel button clicked', async () => {
      render(<EnhancedWalletConnectButton showInstallPrompts={true} />);

      const button = screen.getByText('Connect Wallet').closest('button');
      fireEvent.click(button);

      const metamaskButton = screen.getByText('MetaMask').closest('button');
      fireEvent.click(metamaskButton);

      await waitFor(() => {
        expect(screen.getByText('Install MetaMask')).toBeInTheDocument();
      });

      const cancelButton = screen.getAllByTestId('button').find(btn =>
        btn.textContent === 'Cancel'
      );
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Install MetaMask')).not.toBeInTheDocument();
      });
    });
  });

  describe('Disconnect Functionality', () => {
    const connectedState = {
      state: {
        isInitialized: true,
        isConnected: true,
        account: '0x1234567890123456789012345678901234567890',
        balance: '1000000000000000000',
        chainId: 1,
        providerType: 'metamask'
      },
      actions: {
        connect: mockConnect,
        disconnect: mockDisconnect,
        retry: mockRetry
      }
    };

    it('should show disconnect button when connected', () => {
      useWeb3Auth.mockReturnValue(connectedState);

      render(<EnhancedWalletConnectButton />);
      const button = screen.getByText('0x1234...7890').closest('button');
      fireEvent.click(button);

      expect(screen.getByText('Disconnect')).toBeInTheDocument();
    });

    it('should call disconnect when disconnect button clicked', async () => {
      useWeb3Auth.mockReturnValue(connectedState);

      render(<EnhancedWalletConnectButton />);
      const button = screen.getByText('0x1234...7890').closest('button');
      fireEvent.click(button);

      const disconnectButton = screen.getByText('Disconnect').closest('button');
      fireEvent.click(disconnectButton);

      await waitFor(() => {
        expect(mockDisconnect).toHaveBeenCalled();
      });
    });

    it('should call onDisconnect callback after disconnection', async () => {
      const onDisconnect = vi.fn();
      useWeb3Auth.mockReturnValue(connectedState);

      render(<EnhancedWalletConnectButton onDisconnect={onDisconnect} />);
      const button = screen.getByText('0x1234...7890').closest('button');
      fireEvent.click(button);

      const disconnectButton = screen.getByText('Disconnect').closest('button');
      fireEvent.click(disconnectButton);

      await waitFor(() => {
        expect(onDisconnect).toHaveBeenCalled();
      });
    });

    it('should show disconnecting state during disconnect', async () => {
      useWeb3Auth.mockReturnValue(connectedState);
      mockDisconnect.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<EnhancedWalletConnectButton />);
      const button = screen.getByText('0x1234...7890').closest('button');
      fireEvent.click(button);

      const disconnectButton = screen.getByText('Disconnect').closest('button');
      fireEvent.click(disconnectButton);

      expect(await screen.findByText('Disconnecting...')).toBeInTheDocument();
    });

    it('should disable disconnect button during disconnection', async () => {
      useWeb3Auth.mockReturnValue(connectedState);
      mockDisconnect.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<EnhancedWalletConnectButton />);
      const button = screen.getByText('0x1234...7890').closest('button');
      fireEvent.click(button);

      const disconnectButton = screen.getByText('Disconnect').closest('button');
      fireEvent.click(disconnectButton);

      await waitFor(() => {
        const disconnectingButton = screen.getByText('Disconnecting...').closest('button');
        expect(disconnectingButton).toBeDisabled();
      });
    });
  });

  describe('Copy Address Functionality', () => {
    const connectedState = {
      state: {
        isInitialized: true,
        isConnected: true,
        account: '0x1234567890123456789012345678901234567890',
        balance: '1000000000000000000',
        chainId: 1,
        providerType: 'metamask'
      },
      actions: {
        connect: mockConnect,
        disconnect: mockDisconnect,
        retry: mockRetry
      }
    };

    it('should show copy address button when connected', () => {
      useWeb3Auth.mockReturnValue(connectedState);

      render(<EnhancedWalletConnectButton />);
      const button = screen.getByText('0x1234...7890').closest('button');
      fireEvent.click(button);

      expect(screen.getByText('Copy Address')).toBeInTheDocument();
    });

    it('should copy address to clipboard when copy button clicked', () => {
      useWeb3Auth.mockReturnValue(connectedState);

      render(<EnhancedWalletConnectButton />);
      const button = screen.getByText('0x1234...7890').closest('button');
      fireEvent.click(button);

      const copyButton = screen.getByText('Copy Address').closest('button');
      fireEvent.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('0x1234567890123456789012345678901234567890');
    });

    it('should close dropdown after copying address', () => {
      useWeb3Auth.mockReturnValue(connectedState);

      render(<EnhancedWalletConnectButton />);
      const button = screen.getByText('0x1234...7890').closest('button');
      fireEvent.click(button);

      const copyButton = screen.getByText('Copy Address').closest('button');
      fireEvent.click(copyButton);

      expect(screen.queryByText('Copy Address')).not.toBeInTheDocument();
    });
  });

  describe('Dropdown Behavior', () => {
    it('should toggle dropdown on button click', () => {
      render(<EnhancedWalletConnectButton />);
      const button = screen.getByText('Connect Wallet').closest('button');

      fireEvent.click(button);
      expect(screen.getByText('Choose how you want to connect to Web3')).toBeInTheDocument();

      fireEvent.click(button);
      expect(screen.queryByText('Choose how you want to connect to Web3')).not.toBeInTheDocument();
    });

    it('should close dropdown when clicking outside', () => {
      render(<EnhancedWalletConnectButton />);
      const button = screen.getByText('Connect Wallet').closest('button');
      fireEvent.click(button);

      expect(screen.getByText('Choose how you want to connect to Web3')).toBeInTheDocument();

      fireEvent.click(document.body);

      expect(screen.queryByText('Choose how you want to connect to Web3')).not.toBeInTheDocument();
    });

    it('should keep dropdown open when clicking inside dropdown', () => {
      render(<EnhancedWalletConnectButton />);
      const button = screen.getByText('Connect Wallet').closest('button');
      fireEvent.click(button);

      const dropdownContent = screen.getByText('Choose how you want to connect to Web3');
      fireEvent.click(dropdownContent);

      expect(screen.getByText('Choose how you want to connect to Web3')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error when connection fails', async () => {
      const error = new Error('User rejected connection');
      mockConnect.mockRejectedValue(error);
      mockAddError.mockReturnValue('error-1');

      render(<EnhancedWalletConnectButton />);
      const button = screen.getByText('Connect Wallet').closest('button');
      fireEvent.click(button);

      const metamaskButton = screen.getByText('MetaMask').closest('button');
      fireEvent.click(metamaskButton);

      await waitFor(() => {
        expect(mockAddError).toHaveBeenCalledWith(
          error,
          expect.objectContaining({
            actionLabel: 'Retry MetaMask Connection'
          })
        );
      });
    });

    it('should call onError callback when connection fails', async () => {
      const onError = vi.fn();
      const error = new Error('Connection failed');
      mockConnect.mockRejectedValue(error);

      render(<EnhancedWalletConnectButton onError={onError} />);
      const button = screen.getByText('Connect Wallet').closest('button');
      fireEvent.click(button);

      const metamaskButton = screen.getByText('MetaMask').closest('button');
      fireEvent.click(metamaskButton);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error, 'metamask');
      });
    });

    it('should auto-dismiss user rejection errors', async () => {
      vi.useFakeTimers();
      const error = new Error('User rejected the request');
      mockConnect.mockRejectedValue(error);
      mockAddError.mockReturnValue('error-1');

      render(<EnhancedWalletConnectButton />);
      const button = screen.getByText('Connect Wallet').closest('button');
      fireEvent.click(button);

      const metamaskButton = screen.getByText('MetaMask').closest('button');
      fireEvent.click(metamaskButton);

      await waitFor(() => {
        expect(mockAddError).toHaveBeenCalled();
      });

      vi.advanceTimersByTime(3000);

      expect(mockDismissError).toHaveBeenCalledWith('error-1');

      vi.useRealTimers();
    });

    it('should display error handler component when errors exist', () => {
      const error = new Error('Test error');
      useWeb3ErrorHandler.mockReturnValue({
        errors: [{ id: 'error-1', error, action: vi.fn() }],
        addError: mockAddError,
        dismissError: mockDismissError
      });

      render(<EnhancedWalletConnectButton />);

      expect(screen.getByTestId('web3-error-handler')).toBeInTheDocument();
      expect(screen.getByTestId('error-message')).toHaveTextContent('Test error');
    });

    it('should retry connection when error retry is clicked', () => {
      const retryAction = vi.fn();
      useWeb3ErrorHandler.mockReturnValue({
        errors: [{ id: 'error-1', error: new Error('Test'), action: retryAction }],
        addError: mockAddError,
        dismissError: mockDismissError
      });

      render(<EnhancedWalletConnectButton />);

      const retryButton = screen.getByTestId('error-retry');
      fireEvent.click(retryButton);

      expect(retryAction).toHaveBeenCalled();
    });

    it('should dismiss error when dismiss is clicked', () => {
      useWeb3ErrorHandler.mockReturnValue({
        errors: [{ id: 'error-1', error: new Error('Test'), action: vi.fn() }],
        addError: mockAddError,
        dismissError: mockDismissError
      });

      render(<EnhancedWalletConnectButton />);

      const dismissButton = screen.getByTestId('error-dismiss');
      fireEvent.click(dismissButton);

      expect(mockDismissError).toHaveBeenCalledWith('error-1');
    });

    it('should handle disconnect errors', async () => {
      const error = new Error('Disconnect failed');
      mockDisconnect.mockRejectedValue(error);

      useWeb3Auth.mockReturnValue({
        state: {
          isInitialized: true,
          isConnected: true,
          account: '0x1234567890123456789012345678901234567890',
          balance: '1000000000000000000',
          chainId: 1,
          providerType: 'metamask'
        },
        actions: {
          connect: mockConnect,
          disconnect: mockDisconnect,
          retry: mockRetry
        }
      });

      render(<EnhancedWalletConnectButton />);
      const button = screen.getByText('0x1234...7890').closest('button');
      fireEvent.click(button);

      const disconnectButton = screen.getByText('Disconnect').closest('button');
      fireEvent.click(disconnectButton);

      await waitFor(() => {
        expect(mockAddError).toHaveBeenCalledWith(
          error,
          expect.objectContaining({
            actionLabel: 'Retry Disconnect'
          })
        );
      });
    });

    it('should call onError callback on disconnect failure', async () => {
      const onError = vi.fn();
      const error = new Error('Disconnect failed');
      mockDisconnect.mockRejectedValue(error);

      useWeb3Auth.mockReturnValue({
        state: {
          isInitialized: true,
          isConnected: true,
          account: '0x1234567890123456789012345678901234567890',
          balance: '1000000000000000000',
          chainId: 1,
          providerType: 'metamask'
        },
        actions: {
          connect: mockConnect,
          disconnect: mockDisconnect,
          retry: mockRetry
        }
      });

      render(<EnhancedWalletConnectButton onError={onError} />);
      const button = screen.getByText('0x1234...7890').closest('button');
      fireEvent.click(button);

      const disconnectButton = screen.getByText('Disconnect').closest('button');
      fireEvent.click(disconnectButton);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error, 'disconnect');
      });
    });
  });

  describe('Provider Detection', () => {
    it('should detect MetaMask when installed', () => {
      global.window.ethereum = { isMetaMask: true };

      render(<EnhancedWalletConnectButton />);
      const button = screen.getByText('Connect Wallet').closest('button');
      fireEvent.click(button);

      const metamaskButton = screen.getByText('MetaMask').closest('button');
      expect(metamaskButton).not.toHaveClass('text-muted/70');
    });

    it('should detect Coinbase Wallet when installed', () => {
      global.window.ethereum = { isCoinbaseWallet: true };

      render(<EnhancedWalletConnectButton />);
      const button = screen.getByText('Connect Wallet').closest('button');
      fireEvent.click(button);

      const coinbaseButton = screen.getByText('Coinbase Wallet').closest('button');
      expect(coinbaseButton).toBeTruthy();
    });

    it('should always show WalletConnect as available', () => {
      global.window.ethereum = undefined;

      render(<EnhancedWalletConnectButton />);
      const button = screen.getByText('Connect Wallet').closest('button');
      fireEvent.click(button);

      const walletConnectButton = screen.getByText('WalletConnect').closest('button');
      expect(walletConnectButton).not.toHaveClass('text-muted/70');
    });
  });

  describe('Provider Information Display', () => {
    it('should show provider type when connected', () => {
      useWeb3Auth.mockReturnValue({
        state: {
          isInitialized: true,
          isConnected: true,
          account: '0x1234567890123456789012345678901234567890',
          balance: '1000000000000000000',
          chainId: 1,
          providerType: 'metamask'
        },
        actions: {
          connect: mockConnect,
          disconnect: mockDisconnect,
          retry: mockRetry
        }
      });

      render(<EnhancedWalletConnectButton />);
      const button = screen.getByText('0x1234...7890').closest('button');
      fireEvent.click(button);

      expect(screen.getByText('metamask')).toBeInTheDocument();
    });

    it('should capitalize provider type display', () => {
      useWeb3Auth.mockReturnValue({
        state: {
          isInitialized: true,
          isConnected: true,
          account: '0x1234567890123456789012345678901234567890',
          balance: '1000000000000000000',
          chainId: 1,
          providerType: 'walletconnect'
        },
        actions: {
          connect: mockConnect,
          disconnect: mockDisconnect,
          retry: mockRetry
        }
      });

      render(<EnhancedWalletConnectButton />);
      const button = screen.getByText('0x1234...7890').closest('button');
      fireEvent.click(button);

      const providerText = screen.getByText('walletconnect');
      expect(providerText.closest('span')).toHaveClass('capitalize');
    });
  });

  describe('Address Formatting', () => {
    it('should format long addresses correctly', () => {
      useWeb3Auth.mockReturnValue({
        state: {
          isInitialized: true,
          isConnected: true,
          account: '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12',
          balance: '1000000000000000000',
          chainId: 1,
          providerType: 'metamask'
        },
        actions: {
          connect: mockConnect,
          disconnect: mockDisconnect,
          retry: mockRetry
        }
      });

      render(<EnhancedWalletConnectButton />);
      expect(screen.getByText('0xAbCd...Ef12')).toBeInTheDocument();
    });
  });

  describe('Balance Formatting', () => {
    it('should format large balance correctly', () => {
      useWeb3Auth.mockReturnValue({
        state: {
          isInitialized: true,
          isConnected: true,
          account: '0x1234567890123456789012345678901234567890',
          balance: '5000000000000000000',
          chainId: 1,
          providerType: 'metamask'
        },
        actions: {
          connect: mockConnect,
          disconnect: mockDisconnect,
          retry: mockRetry
        }
      });

      render(<EnhancedWalletConnectButton />);
      const button = screen.getByText('0x1234...7890').closest('button');
      fireEvent.click(button);

      expect(screen.getByText(/5.0000 ETH/)).toBeInTheDocument();
    });

    it('should format small balance correctly', () => {
      useWeb3Auth.mockReturnValue({
        state: {
          isInitialized: true,
          isConnected: true,
          account: '0x1234567890123456789012345678901234567890',
          balance: '100000000000000',
          chainId: 1,
          providerType: 'metamask'
        },
        actions: {
          connect: mockConnect,
          disconnect: mockDisconnect,
          retry: mockRetry
        }
      });

      render(<EnhancedWalletConnectButton />);
      const button = screen.getByText('0x1234...7890').closest('button');
      fireEvent.click(button);

      expect(screen.getByText(/0.0001 ETH/)).toBeInTheDocument();
    });
  });
});

export default mockConnect
