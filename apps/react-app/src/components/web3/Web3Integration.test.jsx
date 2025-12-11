/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Web3Integration, { SimpleWeb3Integration, Web3HeaderIntegration } from './Web3Integration';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Wallet: ({ className, ...props }) => <div data-testid="wallet-icon" className={className} {...props} />,
  Zap: ({ className, ...props }) => <div data-testid="zap-icon" className={className} {...props} />,
  History: ({ className, ...props }) => <div data-testid="history-icon" className={className} {...props} />,
  Settings: ({ className, ...props }) => <div data-testid="settings-icon" className={className} {...props} />,
  Globe: ({ className, ...props }) => <div data-testid="globe-icon" className={className} {...props} />,
  Send: ({ className, ...props }) => <div data-testid="send-icon" className={className} {...props} />,
  ArrowUpRight: ({ className, ...props }) => <div data-testid="arrow-up-right-icon" className={className} {...props} />,
  Shield: ({ className, ...props }) => <div data-testid="shield-icon" className={className} {...props} />,
  TrendingUp: ({ className, ...props }) => <div data-testid="trending-up-icon" className={className} {...props} />,
  DollarSign: ({ className, ...props }) => <div data-testid="dollar-sign-icon" className={className} {...props} />,
}));

// Mock UI components
jest.mock('../ui/Button', () => {
  return function MockButton({ children, onClick, className, variant, size, ...props }) {
    return (
      <button
        onClick={onClick}
        className={className}
        data-variant={variant}
        data-size={size}
        {...props}
      >
        {children}
      </button>
    );
  };
});

// Mock Web3 components
jest.mock('./EnhancedWalletConnectButton', () => {
  return function MockEnhancedWalletConnectButton({
    onConnect,
    onError,
    size,
    showInstallPrompts,
    showProviderList,
    variant,
    ...props
  }) {
    return (
      <button
        data-testid="enhanced-wallet-connect-button"
        data-size={size}
        data-show-install-prompts={showInstallPrompts}
        data-show-provider-list={showProviderList}
        data-variant={variant}
        onClick={() => {
          if (onConnect) {
            onConnect('MetaMask', '0x123');
          }
        }}
        {...props}
      >
        Connect Wallet
      </button>
    );
  };
});

jest.mock('./NetworkSwitcher', () => {
  return function MockNetworkSwitcher({ size, showDropdown, ...props }) {
    return (
      <div
        data-testid="network-switcher"
        data-size={size}
        data-show-dropdown={showDropdown}
        {...props}
      >
        Network Switcher
      </div>
    );
  };
});

jest.mock('./GasEstimator', () => {
  return function MockGasEstimator({ transaction, onGasEstimateChange, showAdvanced, ...props }) {
    React.useEffect(() => {
      if (onGasEstimateChange) {
        onGasEstimateChange({ gasPrice: '20', gasLimit: '21000' });
      }
    }, [onGasEstimateChange]);

    return (
      <div
        data-testid="gas-estimator"
        data-show-advanced={showAdvanced}
        {...props}
      >
        Gas Estimator
      </div>
    );
  };
});

jest.mock('./TransactionConfirmation', () => {
  return function MockTransactionConfirmation({
    isOpen,
    onClose,
    transaction,
    onConfirm,
    onCancel,
    ...props
  }) {
    if (!isOpen) return null;

    return (
      <div data-testid="transaction-confirmation-modal" {...props}>
        <div>Transaction Confirmation</div>
        <div>Amount: {transaction.amount} {transaction.symbol}</div>
        <div>Recipient: {transaction.recipient}</div>
        <button onClick={() => onConfirm(transaction)}>Confirm</button>
        <button onClick={onCancel}>Cancel</button>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

jest.mock('./TransactionHistory', () => {
  return function MockTransactionHistory({
    account,
    maxTransactions,
    showFilters,
    ...props
  }) {
    return (
      <div
        data-testid="transaction-history"
        data-account={account}
        data-max-transactions={maxTransactions}
        data-show-filters={showFilters}
        {...props}
      >
        Transaction History
      </div>
    );
  };
});

jest.mock('./TokenBalanceDisplay', () => {
  return function MockTokenBalanceDisplay({
    account,
    showUsdValues,
    showPrivacyToggle,
    showRefreshButton,
    ...props
  }) {
    return (
      <div
        data-testid="token-balance-display"
        data-account={account}
        data-show-usd-values={showUsdValues}
        data-show-privacy-toggle={showPrivacyToggle}
        data-show-refresh-button={showRefreshButton}
        {...props}
      >
        Token Balance Display
      </div>
    );
  };
});

jest.mock('./CryptoTippingButton', () => {
  return function MockCryptoTippingButton({ recipientName, className, ...props }) {
    return (
      <button
        data-testid="crypto-tipping-button"
        data-recipient-name={recipientName}
        className={className}
        {...props}
      >
        Tip {recipientName}
      </button>
    );
  };
});

jest.mock('./NFTProfileBadge', () => {
  return function MockNFTProfileBadge({ collection, rarity, size, ...props }) {
    return (
      <div
        data-testid="nft-profile-badge"
        data-collection={collection}
        data-rarity={rarity}
        data-size={size}
        {...props}
      >
        NFT Badge
      </div>
    );
  };
});

// Mock Web3 Provider
const mockWeb3State = {
  isConnected: false,
  isInitializing: false,
  account: null,
  providerType: null,
  chainId: null,
  balance: null,
};

const mockWeb3Actions = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  extendSession: jest.fn(),
  clearAllSessions: jest.fn(),
};

const mockWeb3Utils = {
  isSessionExpiringSoon: jest.fn(() => false),
  formatSessionTime: jest.fn(() => '24 hours'),
};

jest.mock('../../lib/providers/Web3Provider', () => ({
  useWeb3: jest.fn(() => ({
    state: mockWeb3State,
    actions: mockWeb3Actions,
    utils: mockWeb3Utils,
  })),
}));

// Mock Web3 Error Handler
jest.mock('./Web3ErrorHandler', () => ({
  __esModule: true,
  default: ({ error, onDismiss }) => {
    if (!error) return null;
    return (
      <div data-testid="web3-error-handler">
        Error: {error}
        <button onClick={onDismiss}>Dismiss</button>
      </div>
    );
  },
  Web3ErrorBoundary: ({ children }) => <div data-testid="web3-error-boundary">{children}</div>,
}));

// Mock Skeletons
jest.mock('./Web3Skeletons', () => ({
  WalletConnectSkeleton: () => <div data-testid="wallet-connect-skeleton"></div>,
  TokenBalanceSkeleton: () => <div data-testid="token-balance-skeleton">Loading balances...</div>,
  TransactionHistorySkeleton: ({ itemCount }) => (
    <div data-testid="transaction-history-skeleton">Loading {itemCount} items...</div>
  ),
  GasEstimatorSkeleton: () => <div data-testid="gas-estimator-skeleton">Loading gas...</div>,
}));

describe('Web3Integration', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();

    // Reset mock state
    mockWeb3State.isConnected = false;
    mockWeb3State.isInitializing = false;
    mockWeb3State.account = null;
    mockWeb3State.providerType = null;
    mockWeb3Utils.isSessionExpiringSoon.mockReturnValue(false);
    mockWeb3Utils.formatSessionTime.mockReturnValue('24 hours');

    // Mock window.open
    global.window.open = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering - Initialization State', () => {
    it('renders without crashing', () => {
      const { container } = render(<Web3Integration />);
      expect(container).toBeInTheDocument();
    });

    it('shows skeleton loaders during initialization', () => {
      mockWeb3State.isInitializing = true;

      render(<Web3Integration />);

      expect(screen.getByTestId('wallet-connect-skeleton')).toBeInTheDocument();
      expect(screen.getByTestId('token-balance-skeleton')).toBeInTheDocument();
      expect(screen.getByTestId('transaction-history-skeleton')).toBeInTheDocument();
    });

    it('shows correct number of skeleton items for transaction history', () => {
      mockWeb3State.isInitializing = true;

      render(<Web3Integration />);

      const skeleton = screen.getByTestId('transaction-history-skeleton');
      expect(skeleton).toHaveTextContent('Loading 3 items');
    });

    it('hides transaction history skeleton when showHistory is false', () => {
      mockWeb3State.isInitializing = true;

      render(<Web3Integration showHistory={false} />);

      expect(screen.queryByTestId('transaction-history-skeleton')).not.toBeInTheDocument();
    });

    it('applies custom className during initialization', () => {
      mockWeb3State.isInitializing = true;

      const { container } = render(<Web3Integration className="custom-class" />);

      const mainDiv = container.querySelector('.custom-class');
      expect(mainDiv).toBeInTheDocument();
    });
  });

  describe('Rendering - Not Connected State', () => {
    it('displays connect wallet prompt when not connected', () => {
      render(<Web3Integration />);

      expect(screen.getByText('Connect Your Wallet')).toBeInTheDocument();
      expect(screen.getByText(/Connect your Web3 wallet to access decentralized features/i)).toBeInTheDocument();
    });

    it('shows wallet icon in not connected state', () => {
      render(<Web3Integration />);

      const icons = screen.getAllByTestId('wallet-icon');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('displays EnhancedWalletConnectButton in not connected state', () => {
      render(<Web3Integration />);

      const connectButtons = screen.getAllByTestId('enhanced-wallet-connect-button');
      expect(connectButtons.length).toBeGreaterThan(0);
    });

    it('shows provider list in not connected state', () => {
      render(<Web3Integration />);

      const buttons = screen.getAllByTestId('enhanced-wallet-connect-button');
      const notConnectedButton = buttons.find(
        btn => btn.getAttribute('data-show-provider-list') === 'true'
      );
      expect(notConnectedButton).toBeInTheDocument();
    });

    it('displays "Learn About Wallets" button when not connected', () => {
      render(<Web3Integration />);

      expect(screen.getByText('Learn About Wallets')).toBeInTheDocument();
    });

    it('opens wallet education link when "Learn About Wallets" is clicked', async () => {
      render(<Web3Integration />);

      const learnButton = screen.getByText('Learn About Wallets');
      await user.click(learnButton);

      expect(window.open).toHaveBeenCalledWith('https://ethereum.org/wallets/', '_blank');
    });
  });

  describe('Rendering - Connected State', () => {
    beforeEach(() => {
      mockWeb3State.isConnected = true;
      mockWeb3State.account = '0x742d35CC6a2C4E8f8a8f8A8C9b8E8F8A8C9b8E8F';
      mockWeb3State.providerType = 'MetaMask';
    });

    it('displays Web3 Dashboard header when connected', () => {
      render(<Web3Integration />);

      expect(screen.getByText('Web3 Dashboard')).toBeInTheDocument();
    });

    it('shows connection status when connected', () => {
      render(<Web3Integration />);

      expect(screen.getByText('Connected to MetaMask')).toBeInTheDocument();
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('displays default provider type when providerType is null', () => {
      mockWeb3State.providerType = null;

      render(<Web3Integration />);

      expect(screen.getByText('Connected to wallet')).toBeInTheDocument();
    });

    it('shows NetworkSwitcher in header when connected', () => {
      render(<Web3Integration />);

      const switchers = screen.getAllByTestId('network-switcher');
      expect(switchers.length).toBeGreaterThan(0);
    });

    it('shows EnhancedWalletConnectButton in header when connected', () => {
      render(<Web3Integration />);

      const buttons = screen.getAllByTestId('enhanced-wallet-connect-button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('displays tab navigation when showFullInterface is true', () => {
      render(<Web3Integration showFullInterface={true} />);

      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Balances')).toBeInTheDocument();
      expect(screen.getByText('History')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('hides tab navigation when showFullInterface is false', () => {
      render(<Web3Integration showFullInterface={false} />);

      expect(screen.queryByText('Overview')).not.toBeInTheDocument();
      expect(screen.queryByText('Balances')).not.toBeInTheDocument();
    });

    it('displays quick action buttons on overview tab', () => {
      render(<Web3Integration />);

      expect(screen.getByText('Send Transaction')).toBeInTheDocument();
      expect(screen.getByText('Block Explorer')).toBeInTheDocument();
    });

    it('shows crypto tipping button when showTipping is true', () => {
      render(<Web3Integration showTipping={true} />);

      expect(screen.getByTestId('crypto-tipping-button')).toBeInTheDocument();
    });

    it('hides crypto tipping button when showTipping is false', () => {
      render(<Web3Integration showTipping={false} />);

      expect(screen.queryByTestId('crypto-tipping-button')).not.toBeInTheDocument();
    });

    it('displays token balances when showBalances is true', () => {
      render(<Web3Integration showBalances={true} />);

      expect(screen.getByText('Token Balances')).toBeInTheDocument();
      expect(screen.getByTestId('token-balance-display')).toBeInTheDocument();
    });

    it('hides token balances when showBalances is false', () => {
      render(<Web3Integration showBalances={false} />);

      expect(screen.queryByText('Token Balances')).not.toBeInTheDocument();
      expect(screen.queryByTestId('token-balance-display')).not.toBeInTheDocument();
    });

    it('displays transaction history when showHistory is true', () => {
      render(<Web3Integration showHistory={true} />);

      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByTestId('transaction-history')).toBeInTheDocument();
    });

    it('hides transaction history when showHistory is false', () => {
      render(<Web3Integration showHistory={false} />);

      expect(screen.queryByText('Recent Activity')).not.toBeInTheDocument();
      expect(screen.queryByTestId('transaction-history')).not.toBeInTheDocument();
    });

    it('passes correct props to TokenBalanceDisplay in overview', () => {
      render(<Web3Integration />);

      const display = screen.getByTestId('token-balance-display');
      expect(display).toHaveAttribute('data-account', mockWeb3State.account);
      expect(display).toHaveAttribute('data-show-usd-values', 'true');
      expect(display).toHaveAttribute('data-show-privacy-toggle', 'true');
    });

    it('passes correct props to TransactionHistory in overview', () => {
      render(<Web3Integration />);

      const history = screen.getByTestId('transaction-history');
      expect(history).toHaveAttribute('data-account', mockWeb3State.account);
      expect(history).toHaveAttribute('data-max-transactions', '5');
      expect(history).toHaveAttribute('data-show-filters', 'false');
    });
  });

  describe('Tab Navigation', () => {
    beforeEach(() => {
      mockWeb3State.isConnected = true;
      mockWeb3State.account = '0x123';
    });

    it('defaults to overview tab', () => {
      render(<Web3Integration />);

      const overviewTab = screen.getByText('Overview').closest('button');
      expect(overviewTab).toHaveClass('text-accent-primary');
      expect(overviewTab).toHaveClass('border-accent-primary');
    });

    it('switches to balances tab when clicked', async () => {
      render(<Web3Integration />);

      const balancesTab = screen.getByText('Balances');
      await user.click(balancesTab);

      expect(screen.getByText('Portfolio Performance')).toBeInTheDocument();
    });

    it('switches to history tab when clicked', async () => {
      render(<Web3Integration />);

      const historyTab = screen.getByText('History');
      await user.click(historyTab);

      const history = screen.getByTestId('transaction-history');
      expect(history).toHaveAttribute('data-show-filters', 'true');
      expect(history).toHaveAttribute('data-max-transactions', '50');
    });

    it('switches to settings tab when clicked', async () => {
      render(<Web3Integration />);

      const settingsTab = screen.getByText('Settings');
      await user.click(settingsTab);

      expect(screen.getByText('Network Settings')).toBeInTheDocument();
      expect(screen.getByText('Gas Settings')).toBeInTheDocument();
      expect(screen.getByText('Session Management')).toBeInTheDocument();
    });

    it('displays correct icon for each tab', () => {
      render(<Web3Integration />);

      expect(screen.getByTestId('wallet-icon')).toBeInTheDocument();
      expect(screen.getByTestId('dollar-sign-icon')).toBeInTheDocument();
      expect(screen.getByTestId('history-icon')).toBeInTheDocument();
      expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
    });

    it('applies active styles to selected tab', async () => {
      render(<Web3Integration />);

      const balancesTab = screen.getByText('Balances').closest('button');
      await user.click(balancesTab);

      expect(balancesTab).toHaveClass('text-accent-primary');
      expect(balancesTab).toHaveClass('border-b-2');
      expect(balancesTab).toHaveClass('border-accent-primary');
    });

    it('applies hover styles to inactive tabs', () => {
      render(<Web3Integration />);

      const historyTab = screen.getByText('History').closest('button');
      expect(historyTab).toHaveClass('hover:text-primary');
      expect(historyTab).toHaveClass('hover:bg-muted/20');
    });
  });

  describe('Balances Tab', () => {
    beforeEach(() => {
      mockWeb3State.isConnected = true;
      mockWeb3State.account = '0x123';
    });

    it('displays TokenBalanceDisplay with refresh button on balances tab', async () => {
      render(<Web3Integration />);

      const balancesTab = screen.getByText('Balances');
      await user.click(balancesTab);

      const displays = screen.getAllByTestId('token-balance-display');
      const balancesDisplay = displays.find(
        d => d.getAttribute('data-show-refresh-button') === 'true'
      );
      expect(balancesDisplay).toBeInTheDocument();
    });

    it('shows portfolio performance section', async () => {
      render(<Web3Integration />);

      const balancesTab = screen.getByText('Balances');
      await user.click(balancesTab);

      expect(screen.getByText('Portfolio Performance')).toBeInTheDocument();
      expect(screen.getByText('24h Change')).toBeInTheDocument();
      expect(screen.getByText('+5.67%')).toBeInTheDocument();
      expect(screen.getByText('Total Value')).toBeInTheDocument();
      expect(screen.getByText('$2,847.32')).toBeInTheDocument();
    });

    it('displays trending up icon in portfolio performance', async () => {
      render(<Web3Integration />);

      const balancesTab = screen.getByText('Balances');
      await user.click(balancesTab);

      expect(screen.getByTestId('trending-up-icon')).toBeInTheDocument();
    });

    it('does not show balances tab content when showBalances is false', async () => {
      render(<Web3Integration showBalances={false} />);

      const balancesTab = screen.getByText('Balances');
      await user.click(balancesTab);

      expect(screen.queryByText('Portfolio Performance')).not.toBeInTheDocument();
    });
  });

  describe('History Tab', () => {
    beforeEach(() => {
      mockWeb3State.isConnected = true;
      mockWeb3State.account = '0x123';
    });

    it('displays TransactionHistory with filters on history tab', async () => {
      render(<Web3Integration />);

      const historyTab = screen.getByText('History');
      await user.click(historyTab);

      const history = screen.getByTestId('transaction-history');
      expect(history).toHaveAttribute('data-show-filters', 'true');
      expect(history).toHaveAttribute('data-max-transactions', '50');
    });

    it('does not show history tab content when showHistory is false', async () => {
      render(<Web3Integration showHistory={false} />);

      const historyTab = screen.getByText('History');
      await user.click(historyTab);

      // Should not render transaction history
      expect(screen.queryByTestId('transaction-history')).not.toBeInTheDocument();
    });
  });

  describe('Settings Tab', () => {
    beforeEach(() => {
      mockWeb3State.isConnected = true;
      mockWeb3State.account = '0x123';
    });

    it('displays network settings section', async () => {
      render(<Web3Integration />);

      const settingsTab = screen.getByText('Settings');
      await user.click(settingsTab);

      expect(screen.getByText('Network Settings')).toBeInTheDocument();
      expect(screen.getByText('Active Network')).toBeInTheDocument();
      expect(screen.getByText('Switch between supported networks')).toBeInTheDocument();
    });

    it('displays NetworkSwitcher with dropdown in settings', async () => {
      render(<Web3Integration />);

      const settingsTab = screen.getByText('Settings');
      await user.click(settingsTab);

      const switchers = screen.getAllByTestId('network-switcher');
      const settingsSwitcher = switchers.find(
        s => s.getAttribute('data-show-dropdown') === 'true'
      );
      expect(settingsSwitcher).toBeInTheDocument();
    });

    it('displays gas settings section with GasEstimator', async () => {
      render(<Web3Integration />);

      const settingsTab = screen.getByText('Settings');
      await user.click(settingsTab);

      expect(screen.getByText('Gas Settings')).toBeInTheDocument();
      expect(screen.getByTestId('gas-estimator')).toBeInTheDocument();
    });

    it('passes showAdvanced prop to GasEstimator', async () => {
      render(<Web3Integration />);

      const settingsTab = screen.getByText('Settings');
      await user.click(settingsTab);

      const estimator = screen.getByTestId('gas-estimator');
      expect(estimator).toHaveAttribute('data-show-advanced', 'true');
    });

    it('displays session management section', async () => {
      render(<Web3Integration />);

      const settingsTab = screen.getByText('Settings');
      await user.click(settingsTab);

      expect(screen.getByText('Session Management')).toBeInTheDocument();
      expect(screen.getByText('Session expires:')).toBeInTheDocument();
      expect(screen.getByText('24 hours')).toBeInTheDocument();
    });

    it('shows extend session button in settings', async () => {
      render(<Web3Integration />);

      const settingsTab = screen.getByText('Settings');
      await user.click(settingsTab);

      const extendButtons = screen.getAllByText('Extend Session');
      expect(extendButtons.length).toBeGreaterThan(0);
    });

    it('shows clear all data button in settings', async () => {
      render(<Web3Integration />);

      const settingsTab = screen.getByText('Settings');
      await user.click(settingsTab);

      expect(screen.getByText('Clear All Data')).toBeInTheDocument();
    });

    it('calls extendSession when extend button is clicked', async () => {
      render(<Web3Integration />);

      const settingsTab = screen.getByText('Settings');
      await user.click(settingsTab);

      const extendButton = screen.getAllByText('Extend Session')[0];
      await user.click(extendButton);

      expect(mockWeb3Actions.extendSession).toHaveBeenCalled();
    });

    it('calls clearAllSessions when clear all data button is clicked', async () => {
      render(<Web3Integration />);

      const settingsTab = screen.getByText('Settings');
      await user.click(settingsTab);

      const clearButton = screen.getByText('Clear All Data');
      await user.click(clearButton);

      expect(mockWeb3Actions.clearAllSessions).toHaveBeenCalled();
    });
  });

  describe('Session Management', () => {
    beforeEach(() => {
      mockWeb3State.isConnected = true;
      mockWeb3State.account = '0x123';
    });

    it('shows session expiration warning when session is expiring soon', () => {
      mockWeb3Utils.isSessionExpiringSoon.mockReturnValue(true);
      mockWeb3Utils.formatSessionTime.mockReturnValue('5 minutes');

      render(<Web3Integration />);

      expect(screen.getByText(/Session expires in/i)).toBeInTheDocument();
      expect(screen.getByText(/5 minutes/i)).toBeInTheDocument();
    });

    it('does not show session warning when session is not expiring soon', () => {
      mockWeb3Utils.isSessionExpiringSoon.mockReturnValue(false);

      render(<Web3Integration />);

      expect(screen.queryByText(/Session expires in/i)).not.toBeInTheDocument();
    });

    it('displays shield icon with session expiration warning', () => {
      mockWeb3Utils.isSessionExpiringSoon.mockReturnValue(true);

      render(<Web3Integration />);

      expect(screen.getByTestId('shield-icon')).toBeInTheDocument();
    });

    it('shows extend button in session warning', () => {
      mockWeb3Utils.isSessionExpiringSoon.mockReturnValue(true);

      render(<Web3Integration />);

      const extendButtons = screen.getAllByText('Extend');
      expect(extendButtons.length).toBeGreaterThan(0);
    });

    it('calls extendSession when warning extend button is clicked', async () => {
      mockWeb3Utils.isSessionExpiringSoon.mockReturnValue(true);

      render(<Web3Integration />);

      const extendButton = screen.getByText('Extend');
      await user.click(extendButton);

      expect(mockWeb3Actions.extendSession).toHaveBeenCalled();
    });
  });

  describe('Transaction Handling', () => {
    beforeEach(() => {
      mockWeb3State.isConnected = true;
      mockWeb3State.account = '0x123';
    });

    it('opens transaction modal when Send Transaction is clicked', async () => {
      render(<Web3Integration />);

      const sendButton = screen.getByText('Send Transaction');
      await user.click(sendButton);

      expect(screen.getByTestId('transaction-confirmation-modal')).toBeInTheDocument();
    });

    it('displays transaction details in modal', async () => {
      render(<Web3Integration />);

      const sendButton = screen.getByText('Send Transaction');
      await user.click(sendButton);

      expect(screen.getByText('Amount: 0.1 ETH')).toBeInTheDocument();
      expect(screen.getByText(/Recipient: 0x742d35CC6a2C4E8f8a8f8A8C9b8E8F8A8C9b8E8F/i)).toBeInTheDocument();
    });

    it('closes modal when confirm is clicked', async () => {
      render(<Web3Integration />);

      const sendButton = screen.getByText('Send Transaction');
      await user.click(sendButton);

      const confirmButton = screen.getByText('Confirm');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.queryByTestId('transaction-confirmation-modal')).not.toBeInTheDocument();
      });
    });

    it('closes modal when cancel is clicked', async () => {
      render(<Web3Integration />);

      const sendButton = screen.getByText('Send Transaction');
      await user.click(sendButton);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByTestId('transaction-confirmation-modal')).not.toBeInTheDocument();
      });
    });

    it('closes modal when close is clicked', async () => {
      render(<Web3Integration />);

      const sendButton = screen.getByText('Send Transaction');
      await user.click(sendButton);

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('transaction-confirmation-modal')).not.toBeInTheDocument();
      });
    });

    it('does not show modal initially', () => {
      render(<Web3Integration />);

      expect(screen.queryByTestId('transaction-confirmation-modal')).not.toBeInTheDocument();
    });
  });

  describe('Quick Actions', () => {
    beforeEach(() => {
      mockWeb3State.isConnected = true;
      mockWeb3State.account = '0x123';
    });

    it('opens block explorer when clicked', async () => {
      render(<Web3Integration />);

      const explorerButton = screen.getByText('Block Explorer');
      await user.click(explorerButton);

      expect(window.open).toHaveBeenCalledWith('https://etherscan.io', '_blank');
    });

    it('displays send icon on send transaction button', () => {
      render(<Web3Integration />);

      expect(screen.getByTestId('send-icon')).toBeInTheDocument();
    });

    it('displays arrow up right icon on block explorer button', () => {
      render(<Web3Integration />);

      expect(screen.getByTestId('arrow-up-right-icon')).toBeInTheDocument();
    });

    it('renders crypto tipping button with correct recipient', () => {
      render(<Web3Integration showTipping={true} />);

      const tippingButton = screen.getByTestId('crypto-tipping-button');
      expect(tippingButton).toHaveAttribute('data-recipient-name', '@demo');
    });
  });

  describe('Gas Estimation', () => {
    beforeEach(() => {
      mockWeb3State.isConnected = true;
      mockWeb3State.account = '0x123';
    });

    it('updates gas estimate when GasEstimator calls callback', async () => {
      render(<Web3Integration />);

      const settingsTab = screen.getByText('Settings');
      await user.click(settingsTab);

      // Gas estimator should have called the callback
      await waitFor(() => {
        expect(screen.getByTestId('gas-estimator')).toBeInTheDocument();
      });
    });
  });

  describe('Error Boundary', () => {
    it('wraps component in Web3ErrorBoundary', () => {
      render(<Web3Integration />);

      expect(screen.getByTestId('web3-error-boundary')).toBeInTheDocument();
    });
  });

  describe('Props and Customization', () => {
    beforeEach(() => {
      mockWeb3State.isConnected = true;
      mockWeb3State.account = '0x123';
    });

    it('applies custom className', () => {
      const { container } = render(<Web3Integration className="custom-test-class" />);

      const mainDiv = container.querySelector('.custom-test-class');
      expect(mainDiv).toBeInTheDocument();
    });

    it('handles showFullInterface prop', () => {
      render(<Web3Integration showFullInterface={false} />);

      expect(screen.queryByText('Overview')).not.toBeInTheDocument();
      expect(screen.queryByText('Balances')).not.toBeInTheDocument();
    });

    it('handles showHistory prop', () => {
      render(<Web3Integration showHistory={false} />);

      expect(screen.queryByText('Recent Activity')).not.toBeInTheDocument();
    });

    it('handles showBalances prop', () => {
      render(<Web3Integration showBalances={false} />);

      expect(screen.queryByText('Token Balances')).not.toBeInTheDocument();
    });

    it('handles showTipping prop', () => {
      render(<Web3Integration showTipping={false} />);

      expect(screen.queryByTestId('crypto-tipping-button')).not.toBeInTheDocument();
    });
  });

  describe('SimpleWeb3Integration Export', () => {
    it('renders SimpleWeb3Integration without crashing', () => {
      const { container } = render(<SimpleWeb3Integration />);
      expect(container).toBeInTheDocument();
    });

    it('hides full interface in SimpleWeb3Integration', () => {
      mockWeb3State.isConnected = true;
      mockWeb3State.account = '0x123';

      render(<SimpleWeb3Integration />);

      expect(screen.queryByText('Overview')).not.toBeInTheDocument();
      expect(screen.queryByText('Balances')).not.toBeInTheDocument();
    });

    it('hides history in SimpleWeb3Integration', () => {
      mockWeb3State.isConnected = true;
      mockWeb3State.account = '0x123';

      render(<SimpleWeb3Integration />);

      expect(screen.queryByText('Recent Activity')).not.toBeInTheDocument();
    });

    it('shows balances in SimpleWeb3Integration', () => {
      mockWeb3State.isConnected = true;
      mockWeb3State.account = '0x123';

      render(<SimpleWeb3Integration />);

      expect(screen.getByTestId('token-balance-display')).toBeInTheDocument();
    });

    it('hides tipping in SimpleWeb3Integration', () => {
      mockWeb3State.isConnected = true;
      mockWeb3State.account = '0x123';

      render(<SimpleWeb3Integration />);

      expect(screen.queryByTestId('crypto-tipping-button')).not.toBeInTheDocument();
    });

    it('applies custom className to SimpleWeb3Integration', () => {
      const { container } = render(<SimpleWeb3Integration className="simple-custom" />);

      const mainDiv = container.querySelector('.simple-custom');
      expect(mainDiv).toBeInTheDocument();
    });
  });

  describe('Web3HeaderIntegration Export', () => {
    it('renders Web3HeaderIntegration without crashing', () => {
      const { container } = render(<Web3HeaderIntegration />);
      expect(container).toBeInTheDocument();
    });

    it('displays NetworkSwitcher in header integration', () => {
      render(<Web3HeaderIntegration />);

      expect(screen.getByTestId('network-switcher')).toBeInTheDocument();
    });

    it('displays EnhancedWalletConnectButton in header integration', () => {
      render(<Web3HeaderIntegration />);

      expect(screen.getByTestId('enhanced-wallet-connect-button')).toBeInTheDocument();
    });

    it('sets small size for NetworkSwitcher in header', () => {
      render(<Web3HeaderIntegration />);

      const switcher = screen.getByTestId('network-switcher');
      expect(switcher).toHaveAttribute('data-size', 'sm');
    });

    it('sets small size for wallet button in header', () => {
      render(<Web3HeaderIntegration />);

      const button = screen.getByTestId('enhanced-wallet-connect-button');
      expect(button).toHaveAttribute('data-size', 'sm');
    });

    it('shows provider list in header wallet button', () => {
      render(<Web3HeaderIntegration />);

      const button = screen.getByTestId('enhanced-wallet-connect-button');
      expect(button).toHaveAttribute('data-show-provider-list', 'true');
    });

    it('uses outline variant for header wallet button', () => {
      render(<Web3HeaderIntegration />);

      const button = screen.getByTestId('enhanced-wallet-connect-button');
      expect(button).toHaveAttribute('data-variant', 'outline');
    });

    it('displays NFT badge when connected', () => {
      mockWeb3State.isConnected = true;

      render(<Web3HeaderIntegration />);

      expect(screen.getByTestId('nft-profile-badge')).toBeInTheDocument();
    });

    it('does not display NFT badge when not connected', () => {
      mockWeb3State.isConnected = false;

      render(<Web3HeaderIntegration />);

      expect(screen.queryByTestId('nft-profile-badge')).not.toBeInTheDocument();
    });

    it('passes correct props to NFT badge', () => {
      mockWeb3State.isConnected = true;

      render(<Web3HeaderIntegration />);

      const badge = screen.getByTestId('nft-profile-badge');
      expect(badge).toHaveAttribute('data-collection', 'CRYB Genesis');
      expect(badge).toHaveAttribute('data-rarity', 'legendary');
      expect(badge).toHaveAttribute('data-size', 'sm');
    });

    it('applies custom className to header integration', () => {
      const { container } = render(<Web3HeaderIntegration className="header-custom" />);

      const mainDiv = container.querySelector('.header-custom');
      expect(mainDiv).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockWeb3State.isConnected = true;
      mockWeb3State.account = '0x123';
    });

    it('has proper heading structure', () => {
      render(<Web3Integration />);

      expect(screen.getByText('Web3 Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Token Balances')).toBeInTheDocument();
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    });

    it('tabs are keyboard navigable buttons', async () => {
      render(<Web3Integration />);

      const balancesTab = screen.getByText('Balances').closest('button');
      balancesTab.focus();

      fireEvent.keyDown(balancesTab, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Portfolio Performance')).toBeInTheDocument();
      });
    });

    it('displays descriptive text for connection status', () => {
      render(<Web3Integration />);

      expect(screen.getByText('Connected to MetaMask')).toBeInTheDocument();
    });

    it('provides descriptive labels for settings sections', async () => {
      render(<Web3Integration />);

      const settingsTab = screen.getByText('Settings');
      await user.click(settingsTab);

      expect(screen.getByText('Switch between supported networks')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles null/undefined props gracefully', () => {
      expect(() => render(<Web3Integration />)).not.toThrow();
    });

    it('handles missing account gracefully', () => {
      mockWeb3State.isConnected = true;
      mockWeb3State.account = null;

      expect(() => render(<Web3Integration />)).not.toThrow();
    });

    it('handles missing providerType gracefully', () => {
      mockWeb3State.isConnected = true;
      mockWeb3State.providerType = null;

      render(<Web3Integration />);

      expect(screen.getByText('Connected to wallet')).toBeInTheDocument();
    });

    it('handles all props as false', () => {
      mockWeb3State.isConnected = true;
      mockWeb3State.account = '0x123';

      expect(() => render(
        <Web3Integration
          showFullInterface={false}
          showHistory={false}
          showBalances={false}
          showTipping={false}
        />
      )).not.toThrow();
    });

    it('handles rapid tab switching', async () => {
      mockWeb3State.isConnected = true;
      mockWeb3State.account = '0x123';

      render(<Web3Integration />);

      const tabs = ['Balances', 'History', 'Settings', 'Overview'];

      for (const tabName of tabs) {
        const tab = screen.getByText(tabName);
        await user.click(tab);
      }

      expect(screen.getByText('Send Transaction')).toBeInTheDocument();
    });

    it('handles opening and closing transaction modal multiple times', async () => {
      mockWeb3State.isConnected = true;
      mockWeb3State.account = '0x123';

      render(<Web3Integration />);

      const sendButton = screen.getByText('Send Transaction');

      // Open and close multiple times
      for (let i = 0; i < 3; i++) {
        await user.click(sendButton);
        expect(screen.getByTestId('transaction-confirmation-modal')).toBeInTheDocument();

        const cancelButton = screen.getByText('Cancel');
        await user.click(cancelButton);

        await waitFor(() => {
          expect(screen.queryByTestId('transaction-confirmation-modal')).not.toBeInTheDocument();
        });
      }
    });

    it('handles empty className prop', () => {
      const { container } = render(<Web3Integration className="" />);
      expect(container).toBeInTheDocument();
    });

    it('handles transition from initializing to connected', () => {
      mockWeb3State.isInitializing = true;

      const { rerender } = render(<Web3Integration />);

      expect(screen.getByTestId('wallet-connect-skeleton')).toBeInTheDocument();

      mockWeb3State.isInitializing = false;
      mockWeb3State.isConnected = true;
      mockWeb3State.account = '0x123';

      rerender(<Web3Integration />);

      expect(screen.queryByTestId('wallet-connect-skeleton')).not.toBeInTheDocument();
      expect(screen.getByText('Web3 Dashboard')).toBeInTheDocument();
    });

    it('handles transition from initializing to not connected', () => {
      mockWeb3State.isInitializing = true;

      const { rerender } = render(<Web3Integration />);

      expect(screen.getByTestId('wallet-connect-skeleton')).toBeInTheDocument();

      mockWeb3State.isInitializing = false;
      mockWeb3State.isConnected = false;

      rerender(<Web3Integration />);

      expect(screen.queryByTestId('wallet-connect-skeleton')).not.toBeInTheDocument();
      expect(screen.getByText('Connect Your Wallet')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    beforeEach(() => {
      mockWeb3State.isConnected = true;
      mockWeb3State.account = '0x742d35CC6a2C4E8f8a8f8A8C9b8E8F8A8C9b8E8F';
    });

    it('passes account to all child components that need it', () => {
      render(<Web3Integration />);

      const tokenDisplay = screen.getByTestId('token-balance-display');
      const transactionHistory = screen.getByTestId('transaction-history');

      expect(tokenDisplay).toHaveAttribute('data-account', mockWeb3State.account);
      expect(transactionHistory).toHaveAttribute('data-account', mockWeb3State.account);
    });

    it('renders all expected child components when connected', () => {
      render(<Web3Integration />);

      expect(screen.getByTestId('enhanced-wallet-connect-button')).toBeInTheDocument();
      expect(screen.getByTestId('network-switcher')).toBeInTheDocument();
      expect(screen.getByTestId('token-balance-display')).toBeInTheDocument();
      expect(screen.getByTestId('transaction-history')).toBeInTheDocument();
      expect(screen.getByTestId('crypto-tipping-button')).toBeInTheDocument();
    });

    it('renders minimal child components when showFullInterface is false', () => {
      render(<Web3Integration showFullInterface={false} />);

      expect(screen.getByTestId('enhanced-wallet-connect-button')).toBeInTheDocument();
      expect(screen.getByTestId('network-switcher')).toBeInTheDocument();
      expect(screen.queryByTestId('crypto-tipping-button')).not.toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('maintains tab state across renders', async () => {
      mockWeb3State.isConnected = true;
      mockWeb3State.account = '0x123';

      const { rerender } = render(<Web3Integration />);

      const balancesTab = screen.getByText('Balances');
      await user.click(balancesTab);

      expect(screen.getByText('Portfolio Performance')).toBeInTheDocument();

      rerender(<Web3Integration />);

      expect(screen.getByText('Portfolio Performance')).toBeInTheDocument();
    });

    it('maintains transaction modal state', async () => {
      mockWeb3State.isConnected = true;
      mockWeb3State.account = '0x123';

      const { rerender } = render(<Web3Integration />);

      const sendButton = screen.getByText('Send Transaction');
      await user.click(sendButton);

      expect(screen.getByTestId('transaction-confirmation-modal')).toBeInTheDocument();

      rerender(<Web3Integration />);

      expect(screen.getByTestId('transaction-confirmation-modal')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      mockWeb3State.isConnected = true;
      mockWeb3State.account = '0x123';

      const { rerender } = render(<Web3Integration />);

      // Get initial snapshot
      const initialContent = screen.getByText('Web3 Dashboard');

      // Re-render with same props
      rerender(<Web3Integration />);

      // Content should still be there
      expect(screen.getByText('Web3 Dashboard')).toBe(initialContent);
    });
  });

  describe('Window Interactions', () => {
    beforeEach(() => {
      mockWeb3State.isConnected = true;
      mockWeb3State.account = '0x123';
    });

    it('opens external links in new tab', async () => {
      render(<Web3Integration />);

      const explorerButton = screen.getByText('Block Explorer');
      await user.click(explorerButton);

      expect(window.open).toHaveBeenCalledWith(expect.any(String), '_blank');
    });

    it('opens correct URL for block explorer', async () => {
      render(<Web3Integration />);

      const explorerButton = screen.getByText('Block Explorer');
      await user.click(explorerButton);

      expect(window.open).toHaveBeenCalledWith('https://etherscan.io', '_blank');
    });

    it('opens correct URL for wallet education', async () => {
      mockWeb3State.isConnected = false;

      render(<Web3Integration />);

      const learnButton = screen.getByText('Learn About Wallets');
      await user.click(learnButton);

      expect(window.open).toHaveBeenCalledWith('https://ethereum.org/wallets/', '_blank');
    });
  });
});

export default MockButton
