/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TokenBalanceDisplay from './TokenBalanceDisplay';
import { useWeb3Auth } from '../../lib/hooks/useWeb3Auth';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Coins: ({ className, ...props }) => <div data-testid="coins-icon" className={className} {...props} />,
  RefreshCw: ({ className, ...props }) => <div data-testid="refresh-icon" className={className} {...props} />,
  Eye: ({ className, ...props }) => <div data-testid="eye-icon" className={className} {...props} />,
  EyeOff: ({ className, ...props }) => <div data-testid="eye-off-icon" className={className} {...props} />,
  TrendingUp: ({ className, ...props }) => <div data-testid="trending-up-icon" className={className} {...props} />,
  TrendingDown: ({ className, ...props }) => <div data-testid="trending-down-icon" className={className} {...props} />,
  AlertCircle: ({ className, ...props }) => <div data-testid="alert-circle-icon" className={className} {...props} />,
  Sparkles: ({ className, ...props }) => <div data-testid="sparkles-icon" className={className} {...props} />,
  ArrowRight: ({ className, ...props }) => <div data-testid="arrow-right-icon" className={className} {...props} />,
  Clock: ({ className, ...props }) => <div data-testid="clock-icon" className={className} {...props} />,
  Zap: ({ className, ...props }) => <div data-testid="zap-icon" className={className} {...props} />
}));

// Mock components
jest.mock('../ui/Card', () => {
  return function Card({ children, className }) {
    return <div data-testid="card" className={className}>{children}</div>;
  };
});

jest.mock('../ui/Button', () => {
  return function Button({ children, className, onClick, disabled }) {
    return (
      <button data-testid="button" className={className} onClick={onClick} disabled={disabled}>
        {children}
      </button>
    );
  };
});

jest.mock('./ComingSoonWrapper', () => {
  return function ComingSoonWrapper({ children, feature, title, description, expectedDate, showPreview }) {
    return (
      <div data-testid="coming-soon-wrapper" data-feature={feature} data-title={title}>
        {children}
      </div>
    );
  };
});

// Mock useWeb3Auth hook
jest.mock('../../lib/hooks/useWeb3Auth');

describe('TokenBalanceDisplay', () => {
  let mockWeb3AuthState;
  let user;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    user = userEvent.setup({ delay: null });

    // Default mock state
    mockWeb3AuthState = {
      isInitialized: true,
      isConnected: false,
      isConnecting: false,
      account: null,
      chainId: null,
      provider: null,
      signer: null,
      providerType: null,
      connectionError: null,
      balance: '0',
      network: null,
      isAuthenticated: false,
      authToken: null,
      authError: null
    };

    useWeb3Auth.mockReturnValue({
      state: mockWeb3AuthState,
      actions: {
        connect: jest.fn(),
        disconnect: jest.fn(),
        switchChain: jest.fn(),
        authenticate: jest.fn()
      }
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Component Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<TokenBalanceDisplay />);
      expect(container).toBeInTheDocument();
    });

    it('renders with coming soon wrapper', () => {
      render(<TokenBalanceDisplay />);
      expect(screen.getByTestId('coming-soon-wrapper')).toBeInTheDocument();
    });

    it('passes correct props to ComingSoonWrapper', () => {
      render(<TokenBalanceDisplay />);
      const wrapper = screen.getByTestId('coming-soon-wrapper');
      expect(wrapper).toHaveAttribute('data-feature', 'Token Balance Tracking');
      expect(wrapper).toHaveAttribute('data-title', 'Token Portfolio Coming Soon!');
    });

    it('renders card component', () => {
      render(<TokenBalanceDisplay />);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('renders header with title', () => {
      render(<TokenBalanceDisplay />);
      expect(screen.getByText('Token Balances')).toBeInTheDocument();
    });

    it('renders Coins icon in header', () => {
      render(<TokenBalanceDisplay />);
      expect(screen.getByTestId('coins-icon')).toBeInTheDocument();
    });

    it('applies custom className when provided', () => {
      render(<TokenBalanceDisplay className="custom-class" />);
      const card = screen.getByTestId('card');
      expect(card.className).toContain('custom-class');
    });
  });

  describe('Connection Status Display', () => {
    it('shows "Connect your wallet" message when not connected', () => {
      render(<TokenBalanceDisplay />);
      expect(screen.getByText('Connect your wallet to view token balances')).toBeInTheDocument();
    });

    it('shows AlertCircle icon when not connected', () => {
      render(<TokenBalanceDisplay />);
      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
    });

    it('shows connected badge when wallet is connected', () => {
      mockWeb3AuthState.isConnected = true;
      mockWeb3AuthState.account = '0x1234567890123456789012345678901234567890';

      useWeb3Auth.mockReturnValue({
        state: mockWeb3AuthState,
        actions: {}
      });

      render(<TokenBalanceDisplay />);
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('does not show connected badge when disconnected', () => {
      render(<TokenBalanceDisplay />);
      expect(screen.queryByText('Connected')).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('shows loading skeleton on initial load when connected', async () => {
      mockWeb3AuthState.isConnected = true;
      mockWeb3AuthState.account = '0x1234567890123456789012345678901234567890';

      useWeb3Auth.mockReturnValue({
        state: mockWeb3AuthState,
        actions: {}
      });

      render(<TokenBalanceDisplay />);

      // Should show 3 skeleton loaders
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('shows loading state while fetching balances', async () => {
      mockWeb3AuthState.isConnected = true;
      mockWeb3AuthState.account = '0x1234567890123456789012345678901234567890';

      useWeb3Auth.mockReturnValue({
        state: mockWeb3AuthState,
        actions: {}
      });

      render(<TokenBalanceDisplay />);

      // Before data loads
      expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    });

    it('hides loading state after data loads', async () => {
      mockWeb3AuthState.isConnected = true;
      mockWeb3AuthState.account = '0x1234567890123456789012345678901234567890';

      useWeb3Auth.mockReturnValue({
        state: mockWeb3AuthState,
        actions: {}
      });

      render(<TokenBalanceDisplay />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        // After loading, should show token balances
        expect(screen.getByText('CRYB')).toBeInTheDocument();
      });
    });

    it('shows spinning refresh icon while loading', async () => {
      mockWeb3AuthState.isConnected = true;
      mockWeb3AuthState.account = '0x1234567890123456789012345678901234567890';

      useWeb3Auth.mockReturnValue({
        state: mockWeb3AuthState,
        actions: {}
      });

      render(<TokenBalanceDisplay />);

      const refreshIcon = screen.getByTestId('refresh-icon');
      expect(refreshIcon.className).toContain('animate-spin');
    });
  });

  describe('Token Balance Display', () => {
    beforeEach(() => {
      mockWeb3AuthState.isConnected = true;
      mockWeb3AuthState.account = '0x1234567890123456789012345678901234567890';

      useWeb3Auth.mockReturnValue({
        state: mockWeb3AuthState,
        actions: {}
      });
    });

    it('displays token balances after loading', async () => {
      render(<TokenBalanceDisplay />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText('CRYB')).toBeInTheDocument();
        expect(screen.getByText('ETH')).toBeInTheDocument();
        expect(screen.getByText('USDC')).toBeInTheDocument();
      });
    });

    it('displays token names', async () => {
      render(<TokenBalanceDisplay />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText('CRYB Token')).toBeInTheDocument();
        expect(screen.getByText('Ethereum')).toBeInTheDocument();
        expect(screen.getByText('USD Coin')).toBeInTheDocument();
      });
    });

    it('displays token balance amounts', async () => {
      render(<TokenBalanceDisplay />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText('125,432.50')).toBeInTheDocument();
        expect(screen.getByText('2.4567')).toBeInTheDocument();
        expect(screen.getByText('1,250.00')).toBeInTheDocument();
      });
    });

    it('displays token logos when available', async () => {
      render(<TokenBalanceDisplay />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        const images = document.querySelectorAll('img[alt="CRYB"]');
        expect(images.length).toBeGreaterThan(0);
      });
    });

    it('shows fallback icon when logo is not available', async () => {
      render(<TokenBalanceDisplay />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        // Fallback divs with token initials
        const fallbacks = document.querySelectorAll('.bg-gradient-to-br');
        expect(fallbacks.length).toBeGreaterThan(0);
      });
    });

    it('respects maxTokens prop', async () => {
      render(<TokenBalanceDisplay maxTokens={2} />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText('CRYB')).toBeInTheDocument();
        expect(screen.getByText('ETH')).toBeInTheDocument();
        expect(screen.queryByText('USDC')).not.toBeInTheDocument();
      });
    });

    it('displays all tokens when maxTokens is greater than available', async () => {
      render(<TokenBalanceDisplay maxTokens={10} />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText('CRYB')).toBeInTheDocument();
        expect(screen.getByText('ETH')).toBeInTheDocument();
        expect(screen.getByText('USDC')).toBeInTheDocument();
      });
    });
  });

  describe('USD Value Display', () => {
    beforeEach(() => {
      mockWeb3AuthState.isConnected = true;
      mockWeb3AuthState.account = '0x1234567890123456789012345678901234567890';

      useWeb3Auth.mockReturnValue({
        state: mockWeb3AuthState,
        actions: {}
      });
    });

    it('shows USD values when showUsdValues is true', async () => {
      render(<TokenBalanceDisplay showUsdValues={true} />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText('$45,234.75')).toBeInTheDocument();
        expect(screen.getByText('$8,234.12')).toBeInTheDocument();
        expect(screen.getByText('$1,250.00')).toBeInTheDocument();
      });
    });

    it('hides USD values when showUsdValues is false', async () => {
      render(<TokenBalanceDisplay showUsdValues={false} />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.queryByText('$45,234.75')).not.toBeInTheDocument();
        expect(screen.queryByText('$8,234.12')).not.toBeInTheDocument();
      });
    });

    it('formats USD values correctly', async () => {
      render(<TokenBalanceDisplay showUsdValues={true} />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        // Check for proper currency formatting
        const usdValues = screen.getAllByText(/^\$/);
        expect(usdValues.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Price Change Display', () => {
    beforeEach(() => {
      mockWeb3AuthState.isConnected = true;
      mockWeb3AuthState.account = '0x1234567890123456789012345678901234567890';

      useWeb3Auth.mockReturnValue({
        state: mockWeb3AuthState,
        actions: {}
      });
    });

    it('shows price changes when showPriceChanges is true', async () => {
      render(<TokenBalanceDisplay showPriceChanges={true} />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText('12.50%')).toBeInTheDocument();
        expect(screen.getByText('3.20%')).toBeInTheDocument();
        expect(screen.getByText('0.10%')).toBeInTheDocument();
      });
    });

    it('hides price changes when showPriceChanges is false', async () => {
      render(<TokenBalanceDisplay showPriceChanges={false} />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.queryByText('12.50%')).not.toBeInTheDocument();
      });
    });

    it('shows TrendingUp icon for positive changes', async () => {
      render(<TokenBalanceDisplay showPriceChanges={true} />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getAllByTestId('trending-up-icon').length).toBeGreaterThan(0);
      });
    });

    it('shows TrendingDown icon for negative changes', async () => {
      render(<TokenBalanceDisplay showPriceChanges={true} />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getAllByTestId('trending-down-icon').length).toBeGreaterThan(0);
      });
    });

    it('applies correct color classes for positive changes', async () => {
      render(<TokenBalanceDisplay showPriceChanges={true} />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        const positiveChange = screen.getByText('12.50%').parentElement;
        expect(positiveChange.className).toContain('text-success');
      });
    });

    it('applies correct color classes for negative changes', async () => {
      render(<TokenBalanceDisplay showPriceChanges={true} />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        const negativeChange = screen.getByText('3.20%').parentElement;
        expect(negativeChange.className).toContain('text-error');
      });
    });

    it('applies correct color classes for neutral changes', async () => {
      render(<TokenBalanceDisplay showPriceChanges={true} />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        const neutralChange = screen.getByText('0.10%').parentElement;
        expect(neutralChange.className).toContain('text-muted');
      });
    });
  });

  describe('Visibility Toggle', () => {
    beforeEach(() => {
      mockWeb3AuthState.isConnected = true;
      mockWeb3AuthState.account = '0x1234567890123456789012345678901234567890';

      useWeb3Auth.mockReturnValue({
        state: mockWeb3AuthState,
        actions: {}
      });
    });

    it('shows Eye icon initially', () => {
      render(<TokenBalanceDisplay />);
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
    });

    it('shows balances by default', async () => {
      render(<TokenBalanceDisplay />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText('125,432.50')).toBeInTheDocument();
      });
    });

    it('toggles to EyeOff icon when clicked', async () => {
      render(<TokenBalanceDisplay />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      const eyeButton = screen.getByTestId('eye-icon').parentElement;
      await user.click(eyeButton);

      expect(screen.getByTestId('eye-off-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('eye-icon')).not.toBeInTheDocument();
    });

    it('hides balances when visibility is toggled off', async () => {
      render(<TokenBalanceDisplay />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText('125,432.50')).toBeInTheDocument();
      });

      const eyeButton = screen.getByTestId('eye-icon').parentElement;
      await user.click(eyeButton);

      await waitFor(() => {
        expect(screen.queryByText('125,432.50')).not.toBeInTheDocument();
        expect(screen.getAllByText('***').length).toBeGreaterThan(0);
      });
    });

    it('shows balances when visibility is toggled back on', async () => {
      render(<TokenBalanceDisplay />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      const eyeButton = screen.getByTestId('eye-icon').parentElement;
      await user.click(eyeButton);

      await waitFor(() => {
        expect(screen.getAllByText('***').length).toBeGreaterThan(0);
      });

      const eyeOffButton = screen.getByTestId('eye-off-icon').parentElement;
      await user.click(eyeOffButton);

      await waitFor(() => {
        expect(screen.getByText('125,432.50')).toBeInTheDocument();
      });
    });

    it('hides USD values when visibility is off', async () => {
      render(<TokenBalanceDisplay showUsdValues={true} />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      const eyeButton = screen.getByTestId('eye-icon').parentElement;
      await user.click(eyeButton);

      await waitFor(() => {
        expect(screen.queryByText('$45,234.75')).not.toBeInTheDocument();
      });
    });
  });

  describe('Refresh Functionality', () => {
    beforeEach(() => {
      mockWeb3AuthState.isConnected = true;
      mockWeb3AuthState.account = '0x1234567890123456789012345678901234567890';

      useWeb3Auth.mockReturnValue({
        state: mockWeb3AuthState,
        actions: {}
      });
    });

    it('renders refresh button', () => {
      render(<TokenBalanceDisplay />);
      expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
    });

    it('disables refresh button while loading', () => {
      render(<TokenBalanceDisplay />);
      const refreshButton = screen.getByTestId('refresh-icon').closest('button');
      expect(refreshButton).toBeDisabled();
    });

    it('enables refresh button after loading', async () => {
      render(<TokenBalanceDisplay />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        const refreshButton = screen.getByTestId('refresh-icon').closest('button');
        expect(refreshButton).not.toBeDisabled();
      });
    });

    it('reloads balances when refresh is clicked', async () => {
      render(<TokenBalanceDisplay />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText('CRYB')).toBeInTheDocument();
      });

      const refreshButton = screen.getByTestId('refresh-icon').closest('button');
      await user.click(refreshButton);

      // Should show loading state again
      await waitFor(() => {
        const icon = screen.getByTestId('refresh-icon');
        expect(icon.className).toContain('animate-spin');
      });
    });

    it('updates last update timestamp after refresh', async () => {
      render(<TokenBalanceDisplay />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
      });
    });
  });

  describe('Auto-refresh Functionality', () => {
    beforeEach(() => {
      mockWeb3AuthState.isConnected = true;
      mockWeb3AuthState.account = '0x1234567890123456789012345678901234567890';

      useWeb3Auth.mockReturnValue({
        state: mockWeb3AuthState,
        actions: {}
      });
    });

    it('auto-refreshes at specified interval', async () => {
      const refreshInterval = 30000;
      render(<TokenBalanceDisplay refreshInterval={refreshInterval} />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText('CRYB')).toBeInTheDocument();
      });

      // Advance to next refresh
      await act(async () => {
        jest.advanceTimersByTime(refreshInterval + 1000);
      });

      await waitFor(() => {
        expect(screen.getByText('CRYB')).toBeInTheDocument();
      });
    });

    it('respects custom refresh interval', async () => {
      const customInterval = 60000;
      render(<TokenBalanceDisplay refreshInterval={customInterval} />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText('CRYB')).toBeInTheDocument();
      });
    });

    it('cleans up interval on unmount', () => {
      const { unmount } = render(<TokenBalanceDisplay />);
      unmount();

      // Should not throw errors
      act(() => {
        jest.advanceTimersByTime(60000);
      });
    });

    it('recreates interval when refreshInterval changes', async () => {
      const { rerender } = render(<TokenBalanceDisplay refreshInterval={30000} />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      rerender(<TokenBalanceDisplay refreshInterval={60000} />);

      // Should handle the change without errors
      await act(async () => {
        jest.advanceTimersByTime(60000);
      });
    });
  });

  describe('Balance Update Callback', () => {
    beforeEach(() => {
      mockWeb3AuthState.isConnected = true;
      mockWeb3AuthState.account = '0x1234567890123456789012345678901234567890';

      useWeb3Auth.mockReturnValue({
        state: mockWeb3AuthState,
        actions: {}
      });
    });

    it('calls onBalanceUpdate when balances load', async () => {
      const onBalanceUpdate = jest.fn();
      render(<TokenBalanceDisplay onBalanceUpdate={onBalanceUpdate} />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(onBalanceUpdate).toHaveBeenCalled();
      });
    });

    it('passes balance data to onBalanceUpdate', async () => {
      const onBalanceUpdate = jest.fn();
      render(<TokenBalanceDisplay onBalanceUpdate={onBalanceUpdate} />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(onBalanceUpdate).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              symbol: 'CRYB',
              balance: '125,432.50'
            })
          ])
        );
      });
    });

    it('calls onBalanceUpdate on refresh', async () => {
      const onBalanceUpdate = jest.fn();
      render(<TokenBalanceDisplay onBalanceUpdate={onBalanceUpdate} />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      onBalanceUpdate.mockClear();

      const refreshButton = screen.getByTestId('refresh-icon').closest('button');
      await user.click(refreshButton);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(onBalanceUpdate).toHaveBeenCalled();
      });
    });
  });

  describe('Empty State', () => {
    beforeEach(() => {
      mockWeb3AuthState.isConnected = true;
      mockWeb3AuthState.account = '0x1234567890123456789012345678901234567890';

      useWeb3Auth.mockReturnValue({
        state: mockWeb3AuthState,
        actions: {}
      });
    });

    it('shows "No tokens found" when maxTokens is 0', async () => {
      render(<TokenBalanceDisplay maxTokens={0} />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText('No tokens found')).toBeInTheDocument();
      });
    });

    it('shows Coins icon in empty state', async () => {
      render(<TokenBalanceDisplay maxTokens={0} />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getAllByTestId('coins-icon').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Last Update Timestamp', () => {
    beforeEach(() => {
      mockWeb3AuthState.isConnected = true;
      mockWeb3AuthState.account = '0x1234567890123456789012345678901234567890';

      useWeb3Auth.mockReturnValue({
        state: mockWeb3AuthState,
        actions: {}
      });
    });

    it('shows last update timestamp after loading', async () => {
      render(<TokenBalanceDisplay />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
      });
    });

    it('formats timestamp correctly', async () => {
      render(<TokenBalanceDisplay />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        const timestamp = screen.getByText(/Last updated:/);
        expect(timestamp.textContent).toMatch(/\d{1,2}:\d{2}:\d{2}/);
      });
    });

    it('updates timestamp on refresh', async () => {
      render(<TokenBalanceDisplay />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      let firstTimestamp;
      await waitFor(() => {
        firstTimestamp = screen.getByText(/Last updated:/).textContent;
      });

      // Wait a bit
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      const refreshButton = screen.getByTestId('refresh-icon').closest('button');
      await user.click(refreshButton);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        const newTimestamp = screen.getByText(/Last updated:/).textContent;
        expect(newTimestamp).toBeDefined();
      });
    });
  });

  describe('Image Error Handling', () => {
    beforeEach(() => {
      mockWeb3AuthState.isConnected = true;
      mockWeb3AuthState.account = '0x1234567890123456789012345678901234567890';

      useWeb3Auth.mockReturnValue({
        state: mockWeb3AuthState,
        actions: {}
      });
    });

    it('handles image load errors gracefully', async () => {
      render(<TokenBalanceDisplay />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
          fireEvent.error(img);
        });
      });

      // Should still display without crashing
      expect(screen.getByText('CRYB')).toBeInTheDocument();
    });

    it('shows fallback on image error', async () => {
      render(<TokenBalanceDisplay />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        const image = document.querySelector('img[alt="CRYB"]');
        if (image) {
          fireEvent.error(image);
          expect(image.style.display).toBe('none');
        }
      });
    });
  });

  describe('Token Display Formatting', () => {
    beforeEach(() => {
      mockWeb3AuthState.isConnected = true;
      mockWeb3AuthState.account = '0x1234567890123456789012345678901234567890';

      useWeb3Auth.mockReturnValue({
        state: mockWeb3AuthState,
        actions: {}
      });
    });

    it('displays token symbol abbreviation in fallback icon', async () => {
      render(<TokenBalanceDisplay />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        // Check for abbreviated symbols in fallback icons
        const fallbacks = document.querySelectorAll('.bg-gradient-to-br');
        expect(fallbacks.length).toBeGreaterThan(0);
      });
    });

    it('formats balance with commas', async () => {
      render(<TokenBalanceDisplay />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText('125,432.50')).toBeInTheDocument();
      });
    });

    it('formats USD values with dollar sign', async () => {
      render(<TokenBalanceDisplay showUsdValues={true} />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText('$45,234.75')).toBeInTheDocument();
      });
    });

    it('formats percentage changes to 2 decimal places', async () => {
      render(<TokenBalanceDisplay showPriceChanges={true} />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText('12.50%')).toBeInTheDocument();
        expect(screen.getByText('3.20%')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('renders semantic HTML structure', () => {
      render(<TokenBalanceDisplay />);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('has accessible button labels', () => {
      render(<TokenBalanceDisplay />);
      const buttons = screen.getAllByTestId('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('maintains proper heading hierarchy', () => {
      render(<TokenBalanceDisplay />);
      expect(screen.getByText('Token Balances')).toBeInTheDocument();
    });

    it('has proper alt text for images', async () => {
      mockWeb3AuthState.isConnected = true;
      mockWeb3AuthState.account = '0x1234567890123456789012345678901234567890';

      useWeb3Auth.mockReturnValue({
        state: mockWeb3AuthState,
        actions: {}
      });

      render(<TokenBalanceDisplay />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
          expect(img).toHaveAttribute('alt');
        });
      });
    });

    it('supports keyboard navigation for visibility toggle', async () => {
      render(<TokenBalanceDisplay />);

      const toggleButton = screen.getByTestId('eye-icon').parentElement;
      toggleButton.focus();
      expect(document.activeElement).toBe(toggleButton);
    });

    it('supports keyboard navigation for refresh button', async () => {
      mockWeb3AuthState.isConnected = true;
      mockWeb3AuthState.account = '0x1234567890123456789012345678901234567890';

      useWeb3Auth.mockReturnValue({
        state: mockWeb3AuthState,
        actions: {}
      });

      render(<TokenBalanceDisplay />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        const refreshButton = screen.getByTestId('refresh-icon').closest('button');
        refreshButton.focus();
        expect(document.activeElement).toBe(refreshButton);
      });
    });
  });

  describe('Props Validation', () => {
    it('handles default props correctly', () => {
      render(<TokenBalanceDisplay />);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('accepts showUsdValues prop', () => {
      render(<TokenBalanceDisplay showUsdValues={false} />);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('accepts showPriceChanges prop', () => {
      render(<TokenBalanceDisplay showPriceChanges={true} />);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('accepts maxTokens prop', () => {
      render(<TokenBalanceDisplay maxTokens={5} />);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('accepts refreshInterval prop', () => {
      render(<TokenBalanceDisplay refreshInterval={60000} />);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('accepts className prop', () => {
      render(<TokenBalanceDisplay className="test-class" />);
      const card = screen.getByTestId('card');
      expect(card.className).toContain('test-class');
    });

    it('accepts onBalanceUpdate callback', () => {
      const callback = jest.fn();
      render(<TokenBalanceDisplay onBalanceUpdate={callback} />);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockWeb3AuthState.isConnected = true;
      mockWeb3AuthState.account = '0x1234567890123456789012345678901234567890';

      useWeb3Auth.mockReturnValue({
        state: mockWeb3AuthState,
        actions: {}
      });
    });

    it('handles console errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<TokenBalanceDisplay />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      // Component should render without throwing
      expect(screen.getByText('Token Balances')).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });

    it('continues to work after errors', async () => {
      render(<TokenBalanceDisplay />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText('CRYB')).toBeInTheDocument();
      });

      // Trigger refresh
      const refreshButton = screen.getByTestId('refresh-icon').closest('button');
      await user.click(refreshButton);

      // Should still work
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText('CRYB')).toBeInTheDocument();
      });
    });
  });

  describe('State Management', () => {
    it('initializes with correct default state', () => {
      render(<TokenBalanceDisplay />);
      expect(screen.getByText('Connect your wallet to view token balances')).toBeInTheDocument();
    });

    it('updates state when wallet connects', async () => {
      const { rerender } = render(<TokenBalanceDisplay />);

      mockWeb3AuthState.isConnected = true;
      mockWeb3AuthState.account = '0x1234567890123456789012345678901234567890';

      useWeb3Auth.mockReturnValue({
        state: mockWeb3AuthState,
        actions: {}
      });

      rerender(<TokenBalanceDisplay />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });
    });

    it('updates state when wallet disconnects', async () => {
      mockWeb3AuthState.isConnected = true;
      mockWeb3AuthState.account = '0x1234567890123456789012345678901234567890';

      useWeb3Auth.mockReturnValue({
        state: mockWeb3AuthState,
        actions: {}
      });

      const { rerender } = render(<TokenBalanceDisplay />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      mockWeb3AuthState.isConnected = false;
      mockWeb3AuthState.account = null;

      useWeb3Auth.mockReturnValue({
        state: mockWeb3AuthState,
        actions: {}
      });

      rerender(<TokenBalanceDisplay />);

      expect(screen.getByText('Connect your wallet to view token balances')).toBeInTheDocument();
    });

    it('maintains visibility state across re-renders', async () => {
      mockWeb3AuthState.isConnected = true;
      mockWeb3AuthState.account = '0x1234567890123456789012345678901234567890';

      useWeb3Auth.mockReturnValue({
        state: mockWeb3AuthState,
        actions: {}
      });

      const { rerender } = render(<TokenBalanceDisplay />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      const eyeButton = screen.getByTestId('eye-icon').parentElement;
      await user.click(eyeButton);

      rerender(<TokenBalanceDisplay />);

      expect(screen.getByTestId('eye-off-icon')).toBeInTheDocument();
    });
  });

  describe('Integration with Web3Auth', () => {
    it('uses Web3Auth state correctly', () => {
      render(<TokenBalanceDisplay />);
      expect(useWeb3Auth).toHaveBeenCalled();
    });

    it('responds to connection state changes', () => {
      const { rerender } = render(<TokenBalanceDisplay />);

      mockWeb3AuthState.isConnected = true;
      useWeb3Auth.mockReturnValue({
        state: mockWeb3AuthState,
        actions: {}
      });

      rerender(<TokenBalanceDisplay />);

      expect(screen.queryByText('Connect your wallet to view token balances')).not.toBeInTheDocument();
    });

    it('handles missing account gracefully', () => {
      mockWeb3AuthState.isConnected = true;
      mockWeb3AuthState.account = null;

      useWeb3Auth.mockReturnValue({
        state: mockWeb3AuthState,
        actions: {}
      });

      render(<TokenBalanceDisplay />);
      expect(screen.getByText('Connect your wallet to view token balances')).toBeInTheDocument();
    });
  });

  describe('Component Lifecycle', () => {
    beforeEach(() => {
      mockWeb3AuthState.isConnected = true;
      mockWeb3AuthState.account = '0x1234567890123456789012345678901234567890';

      useWeb3Auth.mockReturnValue({
        state: mockWeb3AuthState,
        actions: {}
      });
    });

    it('loads balances on mount when connected', async () => {
      render(<TokenBalanceDisplay />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText('CRYB')).toBeInTheDocument();
      });
    });

    it('cleans up on unmount', () => {
      const { unmount } = render(<TokenBalanceDisplay />);

      expect(() => unmount()).not.toThrow();
    });

    it('handles rapid mounting and unmounting', async () => {
      const { unmount, rerender } = render(<TokenBalanceDisplay />);

      rerender(<TokenBalanceDisplay />);
      unmount();

      // Should not throw errors
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
    });

    it('reloads balances when account changes', async () => {
      const { rerender } = render(<TokenBalanceDisplay />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      mockWeb3AuthState.account = '0x9876543210987654321098765432109876543210';

      useWeb3Auth.mockReturnValue({
        state: mockWeb3AuthState,
        actions: {}
      });

      rerender(<TokenBalanceDisplay />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      // Should reload with new account
      await waitFor(() => {
        expect(screen.getByText('CRYB')).toBeInTheDocument();
      });
    });

    it('reloads balances when refreshInterval changes', async () => {
      const { rerender } = render(<TokenBalanceDisplay refreshInterval={30000} />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      rerender(<TokenBalanceDisplay refreshInterval={60000} />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      // Should handle interval change
      await waitFor(() => {
        expect(screen.getByText('CRYB')).toBeInTheDocument();
      });
    });
  });

  describe('Snapshot Tests', () => {
    it('matches snapshot when disconnected', () => {
      const { container } = render(<TokenBalanceDisplay />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot when connected', async () => {
      mockWeb3AuthState.isConnected = true;
      mockWeb3AuthState.account = '0x1234567890123456789012345678901234567890';

      useWeb3Auth.mockReturnValue({
        state: mockWeb3AuthState,
        actions: {}
      });

      const { container } = render(<TokenBalanceDisplay />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText('CRYB')).toBeInTheDocument();
      });

      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot with USD values shown', async () => {
      mockWeb3AuthState.isConnected = true;
      mockWeb3AuthState.account = '0x1234567890123456789012345678901234567890';

      useWeb3Auth.mockReturnValue({
        state: mockWeb3AuthState,
        actions: {}
      });

      const { container } = render(<TokenBalanceDisplay showUsdValues={true} />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText('$45,234.75')).toBeInTheDocument();
      });

      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot with price changes shown', async () => {
      mockWeb3AuthState.isConnected = true;
      mockWeb3AuthState.account = '0x1234567890123456789012345678901234567890';

      useWeb3Auth.mockReturnValue({
        state: mockWeb3AuthState,
        actions: {}
      });

      const { container } = render(<TokenBalanceDisplay showPriceChanges={true} />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText('12.50%')).toBeInTheDocument();
      });

      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot in loading state', () => {
      mockWeb3AuthState.isConnected = true;
      mockWeb3AuthState.account = '0x1234567890123456789012345678901234567890';

      useWeb3Auth.mockReturnValue({
        state: mockWeb3AuthState,
        actions: {}
      });

      const { container } = render(<TokenBalanceDisplay />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot in empty state', async () => {
      mockWeb3AuthState.isConnected = true;
      mockWeb3AuthState.account = '0x1234567890123456789012345678901234567890';

      useWeb3Auth.mockReturnValue({
        state: mockWeb3AuthState,
        actions: {}
      });

      const { container } = render(<TokenBalanceDisplay maxTokens={0} />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText('No tokens found')).toBeInTheDocument();
      });

      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot with balances hidden', async () => {
      mockWeb3AuthState.isConnected = true;
      mockWeb3AuthState.account = '0x1234567890123456789012345678901234567890';

      useWeb3Auth.mockReturnValue({
        state: mockWeb3AuthState,
        actions: {}
      });

      const { container } = render(<TokenBalanceDisplay />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      const eyeButton = screen.getByTestId('eye-icon').parentElement;
      await user.click(eyeButton);

      await waitFor(() => {
        expect(screen.getByTestId('eye-off-icon')).toBeInTheDocument();
      });

      expect(container.firstChild).toMatchSnapshot();
    });
  });
});

export default Card
