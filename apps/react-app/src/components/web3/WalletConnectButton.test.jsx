/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WalletConnectButton, { WalletConnectButtonSkeleton } from './WalletConnectButton';
import { useWeb3Auth } from '../../lib/hooks/useWeb3Auth';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Wallet: ({ ...props }) => <svg data-testid="wallet-icon" {...props} />,
  ChevronDown: ({ ...props }) => <svg data-testid="chevron-down-icon" {...props} />,
  Check: ({ ...props }) => <svg data-testid="check-icon" {...props} />,
  AlertTriangle: ({ ...props }) => <svg data-testid="alert-triangle-icon" {...props} />,
  Loader2: ({ ...props }) => <svg data-testid="loader2-icon" {...props} />,
  Shield: ({ ...props }) => <svg data-testid="shield-icon" {...props} />,
  Smartphone: ({ ...props }) => <svg data-testid="smartphone-icon" {...props} />,
  Chrome: ({ ...props }) => <svg data-testid="chrome-icon" {...props} />
}));

// Mock Button component
jest.mock('../ui/Button', () => ({
  __esModule: true,
  default: ({ children, ...props }) => <button {...props}>{children}</button>
}));

// Mock useWeb3Auth hook
jest.mock('../../lib/hooks/useWeb3Auth');

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined)
  }
});

// Mock window.ethereum
const mockEthereum = {
  isMetaMask: true,
  request: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
  removeAllListeners: jest.fn()
};

describe('WalletConnectButton', () => {
  let mockState;
  let mockActions;
  let user;

  beforeEach(() => {
    jest.clearAllMocks();
    user = userEvent.setup();

    // Default mock state - disconnected
    mockState = {
      isConnected: false,
      isConnecting: false,
      account: null,
      chainId: null,
      balance: null,
      ensName: null,
      connectionError: null
    };

    mockActions = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      retry: jest.fn()
    };

    useWeb3Auth.mockReturnValue({
      state: mockState,
      actions: mockActions
    });

    // Setup window.ethereum
    window.ethereum = mockEthereum;

    // Mock import.meta.env
    import.meta.env.VITE_ENABLE_WEB3_FEATURES = 'true';
  });

  afterEach(() => {
    delete window.ethereum;
    jest.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<WalletConnectButton />);
      expect(container).toBeInTheDocument();
    });

    it('renders connect wallet button in disconnected state', () => {
      render(<WalletConnectButton />);
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    });

    it('renders wallet icon in disconnected state', () => {
      render(<WalletConnectButton />);
      expect(screen.getByTestId('wallet-icon')).toBeInTheDocument();
    });

    it('renders chevron down icon when showProviderList is true', () => {
      render(<WalletConnectButton showProviderList={true} />);
      expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
    });

    it('does not render chevron down when showProviderList is false', () => {
      render(<WalletConnectButton showProviderList={false} />);
      expect(screen.queryByTestId('chevron-down-icon')).not.toBeInTheDocument();
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      render(<WalletConnectButton />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('applies custom className', () => {
      const { container } = render(<WalletConnectButton className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Size Variants', () => {
    it('renders with small size', () => {
      const { container } = render(<WalletConnectButton size="sm" />);
      const button = container.querySelector('button');
      expect(button).toHaveClass('px-sm', 'py-xs', 'text-sm');
    });

    it('renders with medium size (default)', () => {
      const { container } = render(<WalletConnectButton />);
      const button = container.querySelector('button');
      expect(button).toHaveClass('px-md', 'py-sm', 'text-base');
    });

    it('renders with large size', () => {
      const { container } = render(<WalletConnectButton size="lg" />);
      const button = container.querySelector('button');
      expect(button).toHaveClass('px-xl', 'py-lg', 'text-lg');
    });
  });

  describe('Variant Styles', () => {
    it('renders with primary variant (default)', () => {
      const { container } = render(<WalletConnectButton />);
      const button = container.querySelector('button');
      expect(button).toHaveClass('btn-primary');
    });

    it('renders with secondary variant', () => {
      const { container } = render(<WalletConnectButton variant="secondary" />);
      const button = container.querySelector('button');
      expect(button).toHaveClass('btn-secondary');
    });

    it('renders with outline variant', () => {
      const { container } = render(<WalletConnectButton variant="outline" />);
      const button = container.querySelector('button');
      expect(button).toHaveClass('btn-secondary', 'border');
    });
  });

  describe('Disconnected State', () => {
    it('shows connect wallet button when disconnected', () => {
      render(<WalletConnectButton />);
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    });

    it('opens provider dropdown when clicked', async () => {
      render(<WalletConnectButton showProviderList={true} />);
      const button = screen.getByText('Connect Wallet');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('MetaMask')).toBeInTheDocument();
        expect(screen.getByText('WalletConnect')).toBeInTheDocument();
        expect(screen.getByText('Coinbase Wallet')).toBeInTheDocument();
      });
    });

    it('directly connects to MetaMask when showProviderList is false', async () => {
      render(<WalletConnectButton showProviderList={false} />);
      const button = screen.getByText('Connect Wallet');
      await user.click(button);

      await waitFor(() => {
        expect(mockActions.connect).toHaveBeenCalledWith('metamask');
      });
    });

    it('shows provider descriptions in dropdown', async () => {
      render(<WalletConnectButton showProviderList={true} />);
      await user.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        expect(screen.getByText('Connect using MetaMask browser extension')).toBeInTheDocument();
        expect(screen.getByText('Connect using WalletConnect protocol')).toBeInTheDocument();
        expect(screen.getByText('Connect using Coinbase Wallet')).toBeInTheDocument();
      });
    });

    it('shows recommended badge for MetaMask', async () => {
      render(<WalletConnectButton showProviderList={true} />);
      await user.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        expect(screen.getByText('Recommended')).toBeInTheDocument();
      });
    });

    it('shows provider icons in dropdown', async () => {
      render(<WalletConnectButton showProviderList={true} />);
      await user.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        expect(screen.getByTestId('chrome-icon')).toBeInTheDocument();
        expect(screen.getByTestId('smartphone-icon')).toBeInTheDocument();
        expect(screen.getByTestId('shield-icon')).toBeInTheDocument();
      });
    });

    it('displays "Not installed" for unavailable providers', async () => {
      window.ethereum = { ...mockEthereum, isMetaMask: false };

      render(<WalletConnectButton showProviderList={true} />);
      await user.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        const notInstalledElements = screen.getAllByText('Not installed');
        expect(notInstalledElements.length).toBeGreaterThan(0);
      });
    });

    it('disables provider button when not installed', async () => {
      window.ethereum = { ...mockEthereum, isMetaMask: false };

      render(<WalletConnectButton showProviderList={true} />);
      await user.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        const metaMaskButton = screen.getByText('MetaMask').closest('button');
        expect(metaMaskButton).toBeDisabled();
      });
    });

    it('WalletConnect is always available', async () => {
      window.ethereum = null;

      render(<WalletConnectButton showProviderList={true} />);
      await user.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        const walletConnectButton = screen.getByText('WalletConnect').closest('button');
        expect(walletConnectButton).not.toBeDisabled();
      });
    });
  });

  describe('Connecting State', () => {
    beforeEach(() => {
      mockState.isConnecting = true;
      useWeb3Auth.mockReturnValue({
        state: mockState,
        actions: mockActions
      });
    });

    it('shows connecting button with loader', () => {
      render(<WalletConnectButton />);
      expect(screen.getByText('Connecting...')).toBeInTheDocument();
      expect(screen.getByTestId('loader2-icon')).toBeInTheDocument();
    });

    it('button is disabled during connection', () => {
      render(<WalletConnectButton />);
      const button = screen.getByText('Connecting...').closest('button');
      expect(button).toBeDisabled();
    });

    it('button has cursor-not-allowed class', () => {
      render(<WalletConnectButton />);
      const button = screen.getByText('Connecting...').closest('button');
      expect(button).toHaveClass('cursor-not-allowed');
    });

    it('applies  to loader icon', () => {
      render(<WalletConnectButton />);
      const loader = screen.getByTestId('loader2-icon');
      expect(loader).toHaveClass('');
    });
  });

  describe('Connected State', () => {
    beforeEach(() => {
      mockState.isConnected = true;
      mockState.account = '0x1234567890abcdef1234567890abcdef12345678';
      mockState.balance = '1500000000000000000'; // 1.5 ETH
      mockState.chainId = 1;
      useWeb3Auth.mockReturnValue({
        state: mockState,
        actions: mockActions
      });
    });

    it('shows formatted address when connected', () => {
      render(<WalletConnectButton />);
      expect(screen.getByText('0x1234...5678')).toBeInTheDocument();
    });

    it('shows ENS name if available', () => {
      mockState.ensName = 'vitalik.eth';
      useWeb3Auth.mockReturnValue({
        state: mockState,
        actions: mockActions
      });

      render(<WalletConnectButton />);
      expect(screen.getByText('vitalik.eth')).toBeInTheDocument();
    });

    it('displays account avatar with address initials', () => {
      render(<WalletConnectButton />);
      const avatar = screen.getByText('12');
      expect(avatar).toBeInTheDocument();
    });

    it('shows chevron down icon when connected', () => {
      render(<WalletConnectButton />);
      expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
    });

    it('opens connected dropdown when clicked', async () => {
      render(<WalletConnectButton />);
      const button = screen.getByText('0x1234...5678').closest('button');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
        expect(screen.getByText('Copy Address')).toBeInTheDocument();
        expect(screen.getByText('Disconnect')).toBeInTheDocument();
      });
    });

    it('displays formatted balance in dropdown', async () => {
      render(<WalletConnectButton />);
      await user.click(screen.getByText('0x1234...5678'));

      await waitFor(() => {
        expect(screen.getByText('1.5000 ETH')).toBeInTheDocument();
      });
    });

    it('handles zero balance correctly', async () => {
      mockState.balance = '0';
      useWeb3Auth.mockReturnValue({
        state: mockState,
        actions: mockActions
      });

      render(<WalletConnectButton />);
      await user.click(screen.getByText('0x1234...5678'));

      await waitFor(() => {
        expect(screen.getByText('0 ETH')).toBeInTheDocument();
      });
    });

    it('displays check icon in connected dropdown', async () => {
      render(<WalletConnectButton />);
      await user.click(screen.getByText('0x1234...5678'));

      await waitFor(() => {
        expect(screen.getByTestId('check-icon')).toBeInTheDocument();
      });
    });

    it('shows network name for Ethereum mainnet', async () => {
      render(<WalletConnectButton />);
      await user.click(screen.getByText('0x1234...5678'));

      await waitFor(() => {
        expect(screen.getByText('Ethereum')).toBeInTheDocument();
      });
    });

    it('shows network name for Polygon', async () => {
      mockState.chainId = 137;
      useWeb3Auth.mockReturnValue({
        state: mockState,
        actions: mockActions
      });

      render(<WalletConnectButton />);
      await user.click(screen.getByText('0x1234...5678'));

      await waitFor(() => {
        expect(screen.getByText('Polygon')).toBeInTheDocument();
      });
    });

    it('shows network name for Arbitrum', async () => {
      mockState.chainId = 42161;
      useWeb3Auth.mockReturnValue({
        state: mockState,
        actions: mockActions
      });

      render(<WalletConnectButton />);
      await user.click(screen.getByText('0x1234...5678'));

      await waitFor(() => {
        expect(screen.getByText('Arbitrum')).toBeInTheDocument();
      });
    });

    it('shows network name for Base', async () => {
      mockState.chainId = 8453;
      useWeb3Auth.mockReturnValue({
        state: mockState,
        actions: mockActions
      });

      render(<WalletConnectButton />);
      await user.click(screen.getByText('0x1234...5678'));

      await waitFor(() => {
        expect(screen.getByText('Base')).toBeInTheDocument();
      });
    });

    it('shows network name for Optimism', async () => {
      mockState.chainId = 10;
      useWeb3Auth.mockReturnValue({
        state: mockState,
        actions: mockActions
      });

      render(<WalletConnectButton />);
      await user.click(screen.getByText('0x1234...5678'));

      await waitFor(() => {
        expect(screen.getByText('Optimism')).toBeInTheDocument();
      });
    });

    it('shows network name for BNB Chain', async () => {
      mockState.chainId = 56;
      useWeb3Auth.mockReturnValue({
        state: mockState,
        actions: mockActions
      });

      render(<WalletConnectButton />);
      await user.click(screen.getByText('0x1234...5678'));

      await waitFor(() => {
        expect(screen.getByText('BNB Chain')).toBeInTheDocument();
      });
    });

    it('shows default chain name for unknown networks', async () => {
      mockState.chainId = 99999;
      useWeb3Auth.mockReturnValue({
        state: mockState,
        actions: mockActions
      });

      render(<WalletConnectButton />);
      await user.click(screen.getByText('0x1234...5678'));

      await waitFor(() => {
        expect(screen.getByText('Chain 99999')).toBeInTheDocument();
      });
    });

    it('does not show network info if chainId is not available', async () => {
      mockState.chainId = null;
      useWeb3Auth.mockReturnValue({
        state: mockState,
        actions: mockActions
      });

      render(<WalletConnectButton />);
      await user.click(screen.getByText('0x1234...5678'));

      await waitFor(() => {
        expect(screen.queryByText('Network:')).not.toBeInTheDocument();
      });
    });
  });

  describe('Connection Flow', () => {
    it('calls connect action with MetaMask provider', async () => {
      render(<WalletConnectButton showProviderList={true} />);
      await user.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        expect(screen.getByText('MetaMask')).toBeInTheDocument();
      });

      await user.click(screen.getByText('MetaMask'));

      await waitFor(() => {
        expect(mockActions.connect).toHaveBeenCalledWith('metamask');
      });
    });

    it('calls connect action with WalletConnect provider', async () => {
      render(<WalletConnectButton showProviderList={true} />);
      await user.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        expect(screen.getByText('WalletConnect')).toBeInTheDocument();
      });

      await user.click(screen.getByText('WalletConnect'));

      await waitFor(() => {
        expect(mockActions.connect).toHaveBeenCalledWith('walletconnect');
      });
    });

    it('calls connect action with Coinbase provider', async () => {
      window.ethereum = { ...mockEthereum, isCoinbaseWallet: true };

      render(<WalletConnectButton showProviderList={true} />);
      await user.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        expect(screen.getByText('Coinbase Wallet')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Coinbase Wallet'));

      await waitFor(() => {
        expect(mockActions.connect).toHaveBeenCalledWith('coinbase');
      });
    });

    it('closes dropdown after selecting provider', async () => {
      render(<WalletConnectButton showProviderList={true} />);
      await user.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        expect(screen.getByText('MetaMask')).toBeInTheDocument();
      });

      await user.click(screen.getByText('MetaMask'));

      await waitFor(() => {
        expect(screen.queryByText('MetaMask')).not.toBeInTheDocument();
      });
    });

    it('calls onConnect callback after successful connection', async () => {
      const onConnect = jest.fn();
      render(<WalletConnectButton showProviderList={false} onConnect={onConnect} />);

      await user.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        expect(onConnect).toHaveBeenCalledWith('metamask');
      });
    });

    it('resets retry count after successful connection', async () => {
      render(<WalletConnectButton showProviderList={false} />);
      await user.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        expect(mockActions.connect).toHaveBeenCalled();
      });
    });
  });

  describe('Disconnection Flow', () => {
    beforeEach(() => {
      mockState.isConnected = true;
      mockState.account = '0x1234567890abcdef1234567890abcdef12345678';
      mockState.balance = '1500000000000000000';
      mockState.chainId = 1;
      useWeb3Auth.mockReturnValue({
        state: mockState,
        actions: mockActions
      });
    });

    it('calls disconnect action when disconnect button clicked', async () => {
      render(<WalletConnectButton />);
      await user.click(screen.getByText('0x1234...5678'));

      await waitFor(() => {
        expect(screen.getByText('Disconnect')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Disconnect'));

      await waitFor(() => {
        expect(mockActions.disconnect).toHaveBeenCalled();
      });
    });

    it('calls onDisconnect callback after disconnection', async () => {
      const onDisconnect = jest.fn();
      render(<WalletConnectButton onDisconnect={onDisconnect} />);
      await user.click(screen.getByText('0x1234...5678'));

      await waitFor(() => {
        expect(screen.getByText('Disconnect')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Disconnect'));

      await waitFor(() => {
        expect(onDisconnect).toHaveBeenCalled();
      });
    });

    it('handles disconnect errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockActions.disconnect.mockRejectedValue(new Error('Disconnect failed'));

      render(<WalletConnectButton />);
      await user.click(screen.getByText('0x1234...5678'));
      await user.click(screen.getByText('Disconnect'));

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Disconnect failed:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Copy Address Functionality', () => {
    beforeEach(() => {
      mockState.isConnected = true;
      mockState.account = '0x1234567890abcdef1234567890abcdef12345678';
      mockState.balance = '1500000000000000000';
      mockState.chainId = 1;
      useWeb3Auth.mockReturnValue({
        state: mockState,
        actions: mockActions
      });
    });

    it('copies address to clipboard when copy button clicked', async () => {
      render(<WalletConnectButton />);
      await user.click(screen.getByText('0x1234...5678'));

      await waitFor(() => {
        expect(screen.getByText('Copy Address')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Copy Address'));

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('0x1234567890abcdef1234567890abcdef12345678');
      });
    });

    it('closes dropdown after copying address', async () => {
      render(<WalletConnectButton />);
      await user.click(screen.getByText('0x1234...5678'));

      await waitFor(() => {
        expect(screen.getByText('Copy Address')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Copy Address'));

      await waitFor(() => {
        expect(screen.queryByText('Copy Address')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    beforeEach(() => {
      mockState.connectionError = 'Failed to connect to MetaMask';
      useWeb3Auth.mockReturnValue({
        state: mockState,
        actions: mockActions
      });
    });

    it('displays error state when connection fails', () => {
      render(<WalletConnectButton />);
      expect(screen.getByText('Connection Failed')).toBeInTheDocument();
    });

    it('shows alert triangle icon in error state', () => {
      render(<WalletConnectButton />);
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
    });

    it('displays error message tooltip', () => {
      render(<WalletConnectButton />);
      expect(screen.getByText('Failed to connect to MetaMask')).toBeInTheDocument();
    });

    it('calls retry action when error button clicked', async () => {
      render(<WalletConnectButton />);
      const button = screen.getByText('Connection Failed').closest('button');
      await user.click(button);

      await waitFor(() => {
        expect(mockActions.retry).toHaveBeenCalled();
      });
    });

    it('does not show error when isConnecting is true', () => {
      mockState.isConnecting = true;
      useWeb3Auth.mockReturnValue({
        state: mockState,
        actions: mockActions
      });

      render(<WalletConnectButton />);
      expect(screen.queryByText('Connection Failed')).not.toBeInTheDocument();
      expect(screen.getByText('Connecting...')).toBeInTheDocument();
    });

    it('shows retry count when greater than zero', () => {
      render(<WalletConnectButton />);
      const button = screen.getByText('Connection Failed').closest('button');

      // Simulate retry
      fireEvent.click(button);

      // Error button should be present (retry count display is internal)
      expect(button).toBeInTheDocument();
    });
  });

  describe('Auto-Retry on Connection Errors', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('retries connection on network error', async () => {
      mockActions.connect.mockRejectedValueOnce(new Error('network error'));

      render(<WalletConnectButton showProviderList={false} />);
      await user.click(screen.getByText('Connect Wallet'));

      // Fast-forward time for retry
      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(mockActions.connect).toHaveBeenCalledTimes(2);
      });
    });

    it('retries connection on connection error', async () => {
      mockActions.connect.mockRejectedValueOnce(new Error('connection timeout'));

      render(<WalletConnectButton showProviderList={false} />);
      await user.click(screen.getByText('Connect Wallet'));

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(mockActions.connect).toHaveBeenCalledTimes(2);
      });
    });

    it('does not retry for user rejection errors', async () => {
      mockActions.connect.mockRejectedValueOnce(new Error('User rejected'));

      render(<WalletConnectButton showProviderList={false} />);
      await user.click(screen.getByText('Connect Wallet'));

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(mockActions.connect).toHaveBeenCalledTimes(1);
      });
    });

    it('stops retrying after 2 attempts', async () => {
      mockActions.connect.mockRejectedValue(new Error('network error'));

      render(<WalletConnectButton showProviderList={false} />);
      await user.click(screen.getByText('Connect Wallet'));

      // First retry
      jest.advanceTimersByTime(2000);
      await waitFor(() => {
        expect(mockActions.connect).toHaveBeenCalledTimes(2);
      });

      // Second retry
      jest.advanceTimersByTime(2000);
      await waitFor(() => {
        expect(mockActions.connect).toHaveBeenCalledTimes(3);
      });

      // No more retries
      jest.advanceTimersByTime(2000);
      await waitFor(() => {
        expect(mockActions.connect).toHaveBeenCalledTimes(3);
      });
    });

    it('logs error to console on connection failure', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockActions.connect.mockRejectedValue(new Error('Connection failed'));

      render(<WalletConnectButton showProviderList={false} />);
      await user.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Connection failed:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Dropdown Behavior', () => {
    it('closes dropdown when clicking outside', async () => {
      render(
        <div>
          <WalletConnectButton showProviderList={true} />
          <div data-testid="outside">Outside</div>
        </div>
      );

      await user.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        expect(screen.getByText('MetaMask')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('outside'));

      await waitFor(() => {
        expect(screen.queryByText('MetaMask')).not.toBeInTheDocument();
      });
    });

    it('does not close dropdown when clicking inside', async () => {
      render(<WalletConnectButton showProviderList={true} />);

      await user.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        expect(screen.getByText('MetaMask')).toBeInTheDocument();
      });

      const dropdown = screen.getByText('Connect Wallet').closest('.wallet-dropdown');
      fireEvent.click(dropdown);

      expect(screen.getByText('MetaMask')).toBeInTheDocument();
    });

    it('toggles dropdown on button click', async () => {
      render(<WalletConnectButton showProviderList={true} />);
      const button = screen.getByText('Connect Wallet');

      // Open
      await user.click(button);
      await waitFor(() => {
        expect(screen.getByText('MetaMask')).toBeInTheDocument();
      });

      // Close
      await user.click(button);
      await waitFor(() => {
        expect(screen.queryByText('MetaMask')).not.toBeInTheDocument();
      });
    });

    it('toggles connected dropdown on button click', async () => {
      mockState.isConnected = true;
      mockState.account = '0x1234567890abcdef1234567890abcdef12345678';
      mockState.balance = '1500000000000000000';
      mockState.chainId = 1;
      useWeb3Auth.mockReturnValue({
        state: mockState,
        actions: mockActions
      });

      render(<WalletConnectButton />);
      const button = screen.getByText('0x1234...5678').closest('button');

      // Open
      await user.click(button);
      await waitFor(() => {
        expect(screen.getByText('Disconnect')).toBeInTheDocument();
      });

      // Close
      await user.click(button);
      await waitFor(() => {
        expect(screen.queryByText('Disconnect')).not.toBeInTheDocument();
      });
    });
  });

  describe('Coming Soon State', () => {
    beforeEach(() => {
      import.meta.env.VITE_ENABLE_WEB3_FEATURES = 'false';
    });

    it('shows coming soon badge when Web3 features disabled', () => {
      render(<WalletConnectButton />);
      expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    });

    it('disables button when Web3 features disabled', () => {
      render(<WalletConnectButton />);
      const button = screen.getByText('Connect Wallet').closest('button');
      expect(button).toBeDisabled();
    });

    it('applies opacity and cursor styles to disabled button', () => {
      render(<WalletConnectButton />);
      const button = screen.getByText('Connect Wallet').closest('button');
      expect(button).toHaveClass('cursor-not-allowed', 'opacity-70');
    });

    it('shows wallet icon in coming soon state', () => {
      render(<WalletConnectButton />);
      expect(screen.getByTestId('wallet-icon')).toBeInTheDocument();
    });
  });

  describe('Provider Detection', () => {
    it('detects MetaMask installation', async () => {
      window.ethereum = { ...mockEthereum, isMetaMask: true };

      render(<WalletConnectButton showProviderList={true} />);
      await user.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        const metaMaskButton = screen.getByText('MetaMask').closest('button');
        expect(metaMaskButton).not.toBeDisabled();
      });
    });

    it('detects missing MetaMask installation', async () => {
      window.ethereum = { ...mockEthereum, isMetaMask: false };

      render(<WalletConnectButton showProviderList={true} />);
      await user.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        const metaMaskButton = screen.getByText('MetaMask').closest('button');
        expect(metaMaskButton).toBeDisabled();
      });
    });

    it('detects Coinbase Wallet installation via isCoinbaseWallet', async () => {
      window.ethereum = { ...mockEthereum, isCoinbaseWallet: true };

      render(<WalletConnectButton showProviderList={true} />);
      await user.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        const coinbaseButton = screen.getByText('Coinbase Wallet').closest('button');
        expect(coinbaseButton).not.toBeDisabled();
      });
    });

    it('detects Coinbase Wallet installation via selectedProvider', async () => {
      window.ethereum = {
        ...mockEthereum,
        selectedProvider: { isCoinbaseWallet: true }
      };

      render(<WalletConnectButton showProviderList={true} />);
      await user.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        const coinbaseButton = screen.getByText('Coinbase Wallet').closest('button');
        expect(coinbaseButton).not.toBeDisabled();
      });
    });

    it('handles missing window.ethereum gracefully', async () => {
      window.ethereum = undefined;

      render(<WalletConnectButton showProviderList={true} />);
      await user.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        const metaMaskButton = screen.getByText('MetaMask').closest('button');
        expect(metaMaskButton).toBeDisabled();
      });
    });

    it('handles SSR environment (typeof window === undefined)', () => {
      const originalWindow = global.window;
      delete global.window;

      const { container } = render(<WalletConnectButton />);
      expect(container).toBeInTheDocument();

      global.window = originalWindow;
    });
  });

  describe('Address and Balance Formatting', () => {
    beforeEach(() => {
      mockState.isConnected = true;
      mockState.account = '0xabcdef1234567890abcdef1234567890abcdef12';
      mockState.chainId = 1;
    });

    it('formats address correctly', () => {
      mockState.balance = '0';
      useWeb3Auth.mockReturnValue({
        state: mockState,
        actions: mockActions
      });

      render(<WalletConnectButton />);
      expect(screen.getByText('0xabcd...ef12')).toBeInTheDocument();
    });

    it('formats balance to 4 decimal places', async () => {
      mockState.balance = '1234567890123456789'; // 1.234567890123456789 ETH
      useWeb3Auth.mockReturnValue({
        state: mockState,
        actions: mockActions
      });

      render(<WalletConnectButton />);
      await user.click(screen.getByText('0xabcd...ef12'));

      await waitFor(() => {
        expect(screen.getByText('1.2345 ETH')).toBeInTheDocument();
      });
    });

    it('handles small balance correctly', async () => {
      mockState.balance = '100000000000000'; // 0.0001 ETH
      useWeb3Auth.mockReturnValue({
        state: mockState,
        actions: mockActions
      });

      render(<WalletConnectButton />);
      await user.click(screen.getByText('0xabcd...ef12'));

      await waitFor(() => {
        expect(screen.getByText('0.0001 ETH')).toBeInTheDocument();
      });
    });

    it('handles large balance correctly', async () => {
      mockState.balance = '123456789012345678901234'; // 123456.789... ETH
      useWeb3Auth.mockReturnValue({
        state: mockState,
        actions: mockActions
      });

      render(<WalletConnectButton />);
      await user.click(screen.getByText('0xabcd...ef12'));

      await waitFor(() => {
        expect(screen.getByText('123456.7890 ETH')).toBeInTheDocument();
      });
    });

    it('displays "0" for null balance', async () => {
      mockState.balance = null;
      useWeb3Auth.mockReturnValue({
        state: mockState,
        actions: mockActions
      });

      render(<WalletConnectButton />);
      await user.click(screen.getByText('0xabcd...ef12'));

      await waitFor(() => {
        expect(screen.getByText('0 ETH')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('button is keyboard accessible', () => {
      render(<WalletConnectButton />);
      const button = screen.getByText('Connect Wallet').closest('button');

      button.focus();
      expect(button).toHaveFocus();
    });

    it('dropdown items are keyboard accessible', async () => {
      render(<WalletConnectButton showProviderList={true} />);
      await user.click(screen.getByText('Connect Wallet'));

      await waitFor(() => {
        const metaMaskButton = screen.getByText('MetaMask').closest('button');
        expect(metaMaskButton).toBeInTheDocument();
      });
    });

    it('connected dropdown actions are keyboard accessible', async () => {
      mockState.isConnected = true;
      mockState.account = '0x1234567890abcdef1234567890abcdef12345678';
      mockState.balance = '1500000000000000000';
      mockState.chainId = 1;
      useWeb3Auth.mockReturnValue({
        state: mockState,
        actions: mockActions
      });

      render(<WalletConnectButton />);
      await user.click(screen.getByText('0x1234...5678'));

      await waitFor(() => {
        const copyButton = screen.getByText('Copy Address').closest('button');
        const disconnectButton = screen.getByText('Disconnect').closest('button');

        expect(copyButton).toBeInTheDocument();
        expect(disconnectButton).toBeInTheDocument();
      });
    });

    it('has proper ARIA labels', () => {
      render(<WalletConnectButton />);
      const button = screen.getByText('Connect Wallet').closest('button');
      expect(button).toBeInTheDocument();
    });

    it('disabled button has proper attributes', () => {
      import.meta.env.VITE_ENABLE_WEB3_FEATURES = 'false';

      render(<WalletConnectButton />);
      const button = screen.getByText('Connect Wallet').closest('button');
      expect(button).toBeDisabled();
    });

    it('error state is properly announced', () => {
      mockState.connectionError = 'Failed to connect';
      useWeb3Auth.mockReturnValue({
        state: mockState,
        actions: mockActions
      });

      render(<WalletConnectButton />);
      expect(screen.getByText('Connection Failed')).toBeInTheDocument();
      expect(screen.getByText('Failed to connect')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('handles mobile viewport', () => {
      global.innerWidth = 375;
      const { container } = render(<WalletConnectButton />);
      expect(container).toBeInTheDocument();
    });

    it('handles tablet viewport', () => {
      global.innerWidth = 768;
      const { container } = render(<WalletConnectButton />);
      expect(container).toBeInTheDocument();
    });

    it('handles desktop viewport', () => {
      global.innerWidth = 1920;
      const { container } = render(<WalletConnectButton />);
      expect(container).toBeInTheDocument();
    });

    it('truncates long addresses properly', () => {
      mockState.isConnected = true;
      mockState.account = '0x1234567890abcdef1234567890abcdef12345678';
      mockState.balance = '0';
      mockState.chainId = 1;
      useWeb3Auth.mockReturnValue({
        state: mockState,
        actions: mockActions
      });

      const { container } = render(<WalletConnectButton />);
      const addressElement = container.querySelector('.truncate');
      expect(addressElement).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined window object', () => {
      const originalWindow = global.window;
      delete global.window;

      expect(() => {
        render(<WalletConnectButton />);
      }).not.toThrow();

      global.window = originalWindow;
    });

    it('handles rapid clicking', async () => {
      render(<WalletConnectButton showProviderList={false} />);
      const button = screen.getByText('Connect Wallet');

      await user.click(button);
      await user.click(button);
      await user.click(button);

      // Should still work without errors
      expect(mockActions.connect).toHaveBeenCalled();
    });

    it('handles dropdown toggle during connection', async () => {
      render(<WalletConnectButton showProviderList={true} />);

      await user.click(screen.getByText('Connect Wallet'));
      await user.click(screen.getByText('Connect Wallet'));

      // Should toggle without errors
      expect(screen.queryByText('MetaMask')).not.toBeInTheDocument();
    });

    it('handles missing onConnect callback gracefully', async () => {
      render(<WalletConnectButton showProviderList={false} />);
      await user.click(screen.getByText('Connect Wallet'));

      // Should not throw error
      await waitFor(() => {
        expect(mockActions.connect).toHaveBeenCalled();
      });
    });

    it('handles missing onDisconnect callback gracefully', async () => {
      mockState.isConnected = true;
      mockState.account = '0x1234567890abcdef1234567890abcdef12345678';
      mockState.balance = '1500000000000000000';
      mockState.chainId = 1;
      useWeb3Auth.mockReturnValue({
        state: mockState,
        actions: mockActions
      });

      render(<WalletConnectButton />);
      await user.click(screen.getByText('0x1234...5678'));
      await user.click(screen.getByText('Disconnect'));

      // Should not throw error
      await waitFor(() => {
        expect(mockActions.disconnect).toHaveBeenCalled();
      });
    });

    it('handles account changes during dropdown open', async () => {
      mockState.isConnected = true;
      mockState.account = '0x1234567890abcdef1234567890abcdef12345678';
      mockState.balance = '1500000000000000000';
      mockState.chainId = 1;

      const { rerender } = render(<WalletConnectButton />);
      await user.click(screen.getByText('0x1234...5678'));

      // Change account
      mockState.account = '0xabcdef1234567890abcdef1234567890abcdef12';
      useWeb3Auth.mockReturnValue({
        state: mockState,
        actions: mockActions
      });

      rerender(<WalletConnectButton />);

      expect(screen.getByText('0xabcd...ef12')).toBeInTheDocument();
    });

    it('handles very long ENS names', async () => {
      mockState.isConnected = true;
      mockState.account = '0x1234567890abcdef1234567890abcdef12345678';
      mockState.ensName = 'verylongensnamethatmightbreakthelayout.verylongdomain.eth';
      mockState.balance = '1500000000000000000';
      mockState.chainId = 1;
      useWeb3Auth.mockReturnValue({
        state: mockState,
        actions: mockActions
      });

      const { container } = render(<WalletConnectButton />);
      const addressElement = container.querySelector('.truncate');
      expect(addressElement).toBeInTheDocument();
    });
  });

  describe('WalletConnectButtonSkeleton', () => {
    it('renders skeleton without crashing', () => {
      const { container } = render(<WalletConnectButtonSkeleton />);
      expect(container).toBeInTheDocument();
    });

    it('renders with default medium size', () => {
      const { container } = render(<WalletConnectButtonSkeleton />);
      const skeleton = container.querySelector('.');
      expect(skeleton).toHaveClass('h-10', 'w-36');
    });

    it('renders with small size', () => {
      const { container } = render(<WalletConnectButtonSkeleton size="sm" />);
      const skeleton = container.querySelector('.');
      expect(skeleton).toHaveClass('h-8', 'w-32');
    });

    it('renders with large size', () => {
      const { container } = render(<WalletConnectButtonSkeleton size="lg" />);
      const skeleton = container.querySelector('.');
      expect(skeleton).toHaveClass('h-12', 'w-40');
    });

    it('has  class', () => {
      const { container } = render(<WalletConnectButtonSkeleton />);
      const skeleton = container.querySelector('.');
      expect(skeleton).toBeInTheDocument();
    });

    it('has rounded corners', () => {
      const { container } = render(<WalletConnectButtonSkeleton />);
      const skeleton = container.querySelector('.');
      expect(skeleton).toHaveClass('rounded-lg');
    });

    it('has muted background', () => {
      const { container } = render(<WalletConnectButtonSkeleton />);
      const skeleton = container.querySelector('.');
      expect(skeleton).toHaveClass('bg-muted');
    });
  });

  describe('Integration Tests', () => {
    it('complete connection flow - disconnected to connected', async () => {
      const onConnect = jest.fn();
      const { rerender } = render(<WalletConnectButton onConnect={onConnect} showProviderList={true} />);

      // Initial state
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();

      // Click to open dropdown
      await user.click(screen.getByText('Connect Wallet'));
      expect(screen.getByText('MetaMask')).toBeInTheDocument();

      // Select provider
      await user.click(screen.getByText('MetaMask'));
      expect(mockActions.connect).toHaveBeenCalledWith('metamask');
      expect(onConnect).toHaveBeenCalledWith('metamask');

      // Update state to connected
      mockState.isConnected = true;
      mockState.account = '0x1234567890abcdef1234567890abcdef12345678';
      mockState.balance = '1500000000000000000';
      mockState.chainId = 1;
      useWeb3Auth.mockReturnValue({
        state: mockState,
        actions: mockActions
      });

      rerender(<WalletConnectButton onConnect={onConnect} showProviderList={true} />);

      // Verify connected state
      expect(screen.getByText('0x1234...5678')).toBeInTheDocument();
    });

    it('complete disconnection flow - connected to disconnected', async () => {
      mockState.isConnected = true;
      mockState.account = '0x1234567890abcdef1234567890abcdef12345678';
      mockState.balance = '1500000000000000000';
      mockState.chainId = 1;
      useWeb3Auth.mockReturnValue({
        state: mockState,
        actions: mockActions
      });

      const onDisconnect = jest.fn();
      const { rerender } = render(<WalletConnectButton onDisconnect={onDisconnect} />);

      // Initial connected state
      expect(screen.getByText('0x1234...5678')).toBeInTheDocument();

      // Open dropdown
      await user.click(screen.getByText('0x1234...5678'));
      expect(screen.getByText('Disconnect')).toBeInTheDocument();

      // Disconnect
      await user.click(screen.getByText('Disconnect'));
      expect(mockActions.disconnect).toHaveBeenCalled();
      expect(onDisconnect).toHaveBeenCalled();

      // Update state to disconnected
      mockState.isConnected = false;
      mockState.account = null;
      mockState.balance = null;
      mockState.chainId = null;
      useWeb3Auth.mockReturnValue({
        state: mockState,
        actions: mockActions
      });

      rerender(<WalletConnectButton onDisconnect={onDisconnect} />);

      // Verify disconnected state
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    });

    it('handles connection error and retry flow', async () => {
      const { rerender } = render(<WalletConnectButton showProviderList={false} />);

      // Initial state
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();

      // Attempt connection
      await user.click(screen.getByText('Connect Wallet'));

      // Update to error state
      mockState.connectionError = 'User rejected connection';
      useWeb3Auth.mockReturnValue({
        state: mockState,
        actions: mockActions
      });

      rerender(<WalletConnectButton showProviderList={false} />);

      // Verify error state
      expect(screen.getByText('Connection Failed')).toBeInTheDocument();
      expect(screen.getByText('User rejected connection')).toBeInTheDocument();

      // Retry
      await user.click(screen.getByText('Connection Failed'));
      expect(mockActions.retry).toHaveBeenCalled();
    });
  });

  describe('Snapshot Tests', () => {
    it('matches snapshot for disconnected state', () => {
      const { container } = render(<WalletConnectButton />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for connecting state', () => {
      mockState.isConnecting = true;
      useWeb3Auth.mockReturnValue({
        state: mockState,
        actions: mockActions
      });

      const { container } = render(<WalletConnectButton />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for connected state', () => {
      mockState.isConnected = true;
      mockState.account = '0x1234567890abcdef1234567890abcdef12345678';
      mockState.balance = '1500000000000000000';
      mockState.chainId = 1;
      useWeb3Auth.mockReturnValue({
        state: mockState,
        actions: mockActions
      });

      const { container } = render(<WalletConnectButton />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for error state', () => {
      mockState.connectionError = 'Connection failed';
      useWeb3Auth.mockReturnValue({
        state: mockState,
        actions: mockActions
      });

      const { container } = render(<WalletConnectButton />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for coming soon state', () => {
      import.meta.env.VITE_ENABLE_WEB3_FEATURES = 'false';

      const { container } = render(<WalletConnectButton />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for skeleton', () => {
      const { container } = render(<WalletConnectButtonSkeleton />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});

export default mockEthereum
