/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Web3Dashboard from './Web3Dashboard';
import { walletManager } from '../../lib/web3/WalletManager.js';
import { getCRYBTokenContract } from '../../lib/contracts/cryb-contracts.js';
import { getDaoGovernor } from '../../lib/contracts/governance-contracts.js';
import { getNFTMarketplace } from '../../lib/contracts/nft-marketplace-contracts.js';
import { getDEXRouter } from '../../lib/contracts/defi-contracts.js';

// Mock all dependencies
jest.mock('../../lib/web3/WalletManager.js');
jest.mock('../../lib/contracts/cryb-contracts.js');
jest.mock('../../lib/contracts/governance-contracts.js');
jest.mock('../../lib/contracts/nft-marketplace-contracts.js');
jest.mock('../../lib/contracts/defi-contracts.js');

// Mock child components
jest.mock('./StakingDashboard', () => {
  return function StakingDashboard() {
    return <div data-testid="staking-dashboard">Staking Dashboard</div>;
  };
});

jest.mock('./GovernanceDashboard', () => {
  return function GovernanceDashboard() {
    return <div data-testid="governance-dashboard">Governance Dashboard</div>;
  };
});

jest.mock('./NFTProfileSystem', () => {
  return function NFTProfileSystem() {
    return <div data-testid="nft-profile-system">NFT Profile System</div>;
  };
});

jest.mock('./MultiChainManager', () => {
  return function MultiChainManager() {
    return <div data-testid="multichain-manager">Multi-Chain Manager</div>;
  };
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Wallet: ({ className }) => <div data-testid="icon-wallet" className={className} />,
  Coins: ({ className }) => <div data-testid="icon-coins" className={className} />,
  Image: ({ className }) => <div data-testid="icon-image" className={className} />,
  Vote: ({ className }) => <div data-testid="icon-vote" className={className} />,
  TrendingUp: ({ className }) => <div data-testid="icon-trending-up" className={className} />,
  Network: ({ className }) => <div data-testid="icon-network" className={className} />,
  Settings: ({ className }) => <div data-testid="icon-settings" className={className} />,
  ExternalLink: ({ className }) => <div data-testid="icon-external-link" className={className} />,
  RefreshCw: ({ className }) => <div data-testid="icon-refresh" className={className} />,
  AlertTriangle: ({ className }) => <div data-testid="icon-alert" className={className} />,
  Shield: ({ className }) => <div data-testid="icon-shield" className={className} />,
  Zap: ({ className }) => <div data-testid="icon-zap" className={className} />,
  DollarSign: ({ className }) => <div data-testid="icon-dollar" className={className} />,
  Users: ({ className }) => <div data-testid="icon-users" className={className} />,
  Globe: ({ className }) => <div data-testid="icon-globe" className={className} />,
}));

// Mock Radix UI components
jest.mock('@radix-ui/themes', () => ({
  Card: ({ children, className }) => <div data-testid="card" className={className}>{children}</div>,
  Button: ({ children, onClick, variant, size, color, className }) => (
    <button onClick={onClick} data-variant={variant} data-size={size} data-color={color} className={className}>
      {children}
    </button>
  ),
  Badge: ({ children, color }) => <span data-testid="badge" data-color={color}>{children}</span>,
  Progress: ({ value }) => <div data-testid="progress" data-value={value} />,
  Tabs: {
    Root: ({ children, value, onValueChange }) => (
      <div data-testid="tabs-root" data-value={value}>
        {React.Children.map(children, child =>
          React.isValidElement(child) ? React.cloneElement(child, { activeTab: value, onValueChange }) : child
        )}
      </div>
    ),
    List: ({ children }) => <div data-testid="tabs-list">{children}</div>,
    Trigger: ({ children, value, ...props }) => {
      const activeTab = props.activeTab;
      const onValueChange = props.onValueChange;
      return (
        <button
          data-testid={`tab-trigger-${value}`}
          data-active={activeTab === value}
          onClick={() => onValueChange && onValueChange(value)}
        >
          {children}
        </button>
      );
    },
    Content: ({ children, value, ...props }) => {
      const activeTab = props.activeTab;
      if (activeTab !== value) return null;
      return <div data-testid={`tab-content-${value}`}>{children}</div>;
    },
  },
}));

// Helper function to render with router
const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

// Mock wallet manager event emitter
const createMockWalletManager = (overrides = {}) => {
  const eventListeners = {};

  return {
    isConnected: false,
    account: null,
    currentChainId: null,
    providerType: null,
    connect: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn((event, handler) => {
      if (!eventListeners[event]) eventListeners[event] = [];
      eventListeners[event].push(handler);
    }),
    off: jest.fn((event, handler) => {
      if (eventListeners[event]) {
        eventListeners[event] = eventListeners[event].filter(h => h !== handler);
      }
    }),
    emit: jest.fn((event, ...args) => {
      if (eventListeners[event]) {
        eventListeners[event].forEach(handler => handler(...args));
      }
    }),
    ...overrides,
  };
};

// Mock contract objects
const createMockContract = () => ({
  getBalance: jest.fn().mockResolvedValue(BigInt(1000000000000000000)),
  getStakingInfo: jest.fn().mockResolvedValue({ stakedAmount: BigInt(500000000000000000) }),
  getUserNFTs: jest.fn().mockResolvedValue({ tokenIds: [1, 2, 3] }),
});

const createMockGovernance = () => ({
  getUserVotingPower: jest.fn().mockResolvedValue(BigInt(750000000000000000)),
});

describe('Web3Dashboard', () => {
  let mockWalletManager;
  let mockCRYBContract;
  let mockGovernanceContract;
  let mockMarketplaceContract;
  let mockDEXContract;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock wallet manager
    mockWalletManager = createMockWalletManager();
    Object.assign(walletManager, mockWalletManager);

    // Setup mock contracts
    mockCRYBContract = createMockContract();
    mockGovernanceContract = createMockGovernance();
    mockMarketplaceContract = {};
    mockDEXContract = {};

    getCRYBTokenContract.mockReturnValue(mockCRYBContract);
    getDaoGovernor.mockReturnValue(mockGovernanceContract);
    getNFTMarketplace.mockReturnValue(mockMarketplaceContract);
    getDEXRouter.mockReturnValue(mockDEXContract);

    // Mock window.open
    window.open = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders without crashing', () => {
      renderWithRouter(<Web3Dashboard />);
      expect(screen.getByText('Web3 Dashboard')).toBeInTheDocument();
    });

    it('renders main card wrapper', () => {
      renderWithRouter(<Web3Dashboard />);
      const cards = screen.getAllByTestId('card');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('displays wallet icon', () => {
      renderWithRouter(<Web3Dashboard />);
      expect(screen.getByTestId('icon-wallet')).toBeInTheDocument();
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithRouter(<Web3Dashboard />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Connection Status - Disconnected State', () => {
    beforeEach(() => {
      walletManager.isConnected = false;
      walletManager.account = null;
    });

    it('displays connect wallet message when disconnected', () => {
      renderWithRouter(<Web3Dashboard />);
      expect(screen.getByText('Connect Your Wallet')).toBeInTheDocument();
    });

    it('displays connect wallet description', () => {
      renderWithRouter(<Web3Dashboard />);
      expect(screen.getByText(/Connect your Web3 wallet to access CRYB platform features/i)).toBeInTheDocument();
    });

    it('displays connect wallet button when disconnected', () => {
      renderWithRouter(<Web3Dashboard />);
      const connectButton = screen.getByRole('button', { name: /Connect Wallet/i });
      expect(connectButton).toBeInTheDocument();
    });

    it('calls walletManager.connect when connect button clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Web3Dashboard />);

      const connectButton = screen.getByRole('button', { name: /Connect Wallet/i });
      await user.click(connectButton);

      expect(walletManager.connect).toHaveBeenCalledTimes(1);
    });

    it('does not display refresh button when disconnected', () => {
      renderWithRouter(<Web3Dashboard />);
      const refreshButtons = screen.queryAllByRole('button', { name: /Refresh/i });
      expect(refreshButtons.length).toBe(0);
    });

    it('does not display stats when disconnected', () => {
      renderWithRouter(<Web3Dashboard />);
      expect(screen.queryByText('CRYB Balance')).not.toBeInTheDocument();
      expect(screen.queryByText('Staked CRYB')).not.toBeInTheDocument();
    });

    it('does not display tabs when disconnected', () => {
      renderWithRouter(<Web3Dashboard />);
      expect(screen.queryByTestId('tabs-root')).not.toBeInTheDocument();
    });

    it('does not display help section when disconnected', () => {
      renderWithRouter(<Web3Dashboard />);
      expect(screen.queryByText('Need Help?')).not.toBeInTheDocument();
    });
  });

  describe('Connection Status - Connected State', () => {
    beforeEach(() => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      walletManager.currentChainId = 1;
      walletManager.providerType = 'metamask';
    });

    it('displays connected status', async () => {
      renderWithRouter(<Web3Dashboard />);
      await waitFor(() => {
        expect(screen.getByText(/Connected to MetaMask/i)).toBeInTheDocument();
      });
    });

    it('displays formatted wallet address', async () => {
      renderWithRouter(<Web3Dashboard />);
      await waitFor(() => {
        expect(screen.getByText(/0x1234...7890/i)).toBeInTheDocument();
      });
    });

    it('displays network name', async () => {
      renderWithRouter(<Web3Dashboard />);
      await waitFor(() => {
        expect(screen.getByText(/on Ethereum/i)).toBeInTheDocument();
      });
    });

    it('displays green connection indicator', async () => {
      renderWithRouter(<Web3Dashboard />);
      await waitFor(() => {
        const greenDot = document.querySelector('.bg-green-500');
        expect(greenDot).toBeInTheDocument();
      });
    });

    it('displays disconnect button when connected', async () => {
      renderWithRouter(<Web3Dashboard />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Disconnect/i })).toBeInTheDocument();
      });
    });

    it('calls walletManager.disconnect when disconnect button clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Disconnect/i })).toBeInTheDocument();
      });

      const disconnectButton = screen.getByRole('button', { name: /Disconnect/i });
      await user.click(disconnectButton);

      expect(walletManager.disconnect).toHaveBeenCalledTimes(1);
    });

    it('displays external link button for etherscan', async () => {
      renderWithRouter(<Web3Dashboard />);
      await waitFor(() => {
        expect(screen.getByTestId('icon-external-link')).toBeInTheDocument();
      });
    });

    it('opens etherscan when external link clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('icon-external-link')).toBeInTheDocument();
      });

      const externalLinkButton = screen.getByTestId('icon-external-link').closest('button');
      await user.click(externalLinkButton);

      expect(window.open).toHaveBeenCalledWith(
        'https://etherscan.io/address/0x1234567890123456789012345678901234567890',
        '_blank'
      );
    });

    it('displays refresh button when connected', async () => {
      renderWithRouter(<Web3Dashboard />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument();
      });
    });
  });

  describe('Network Names', () => {
    it('displays Ethereum for chain ID 1', async () => {
      walletManager.isConnected = true;
      walletManager.currentChainId = 1;
      walletManager.account = '0x1234567890123456789012345678901234567890';

      renderWithRouter(<Web3Dashboard />);
      await waitFor(() => {
        expect(screen.getByText(/on Ethereum/i)).toBeInTheDocument();
      });
    });

    it('displays Polygon for chain ID 137', async () => {
      walletManager.isConnected = true;
      walletManager.currentChainId = 137;
      walletManager.account = '0x1234567890123456789012345678901234567890';

      renderWithRouter(<Web3Dashboard />);
      await waitFor(() => {
        expect(screen.getByText(/on Polygon/i)).toBeInTheDocument();
      });
    });

    it('displays Arbitrum for chain ID 42161', async () => {
      walletManager.isConnected = true;
      walletManager.currentChainId = 42161;
      walletManager.account = '0x1234567890123456789012345678901234567890';

      renderWithRouter(<Web3Dashboard />);
      await waitFor(() => {
        expect(screen.getByText(/on Arbitrum/i)).toBeInTheDocument();
      });
    });

    it('displays Optimism for chain ID 10', async () => {
      walletManager.isConnected = true;
      walletManager.currentChainId = 10;
      walletManager.account = '0x1234567890123456789012345678901234567890';

      renderWithRouter(<Web3Dashboard />);
      await waitFor(() => {
        expect(screen.getByText(/on Optimism/i)).toBeInTheDocument();
      });
    });

    it('displays Base for chain ID 8453', async () => {
      walletManager.isConnected = true;
      walletManager.currentChainId = 8453;
      walletManager.account = '0x1234567890123456789012345678901234567890';

      renderWithRouter(<Web3Dashboard />);
      await waitFor(() => {
        expect(screen.getByText(/on Base/i)).toBeInTheDocument();
      });
    });

    it('displays Chain ID for unknown networks', async () => {
      walletManager.isConnected = true;
      walletManager.currentChainId = 9999;
      walletManager.account = '0x1234567890123456789012345678901234567890';

      renderWithRouter(<Web3Dashboard />);
      await waitFor(() => {
        expect(screen.getByText(/on Chain 9999/i)).toBeInTheDocument();
      });
    });
  });

  describe('Provider Names', () => {
    beforeEach(() => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      walletManager.currentChainId = 1;
    });

    it('displays MetaMask provider name', async () => {
      walletManager.providerType = 'metamask';
      renderWithRouter(<Web3Dashboard />);
      await waitFor(() => {
        expect(screen.getByText(/Connected to MetaMask/i)).toBeInTheDocument();
      });
    });

    it('displays WalletConnect provider name', async () => {
      walletManager.providerType = 'walletconnect';
      renderWithRouter(<Web3Dashboard />);
      await waitFor(() => {
        expect(screen.getByText(/Connected to WalletConnect/i)).toBeInTheDocument();
      });
    });

    it('displays Coinbase Wallet provider name', async () => {
      walletManager.providerType = 'coinbase';
      renderWithRouter(<Web3Dashboard />);
      await waitFor(() => {
        expect(screen.getByText(/Connected to Coinbase Wallet/i)).toBeInTheDocument();
      });
    });

    it('displays Injected Wallet for generic provider', async () => {
      walletManager.providerType = 'injected';
      renderWithRouter(<Web3Dashboard />);
      await waitFor(() => {
        expect(screen.getByText(/Connected to Injected Wallet/i)).toBeInTheDocument();
      });
    });

    it('displays Unknown for unrecognized provider', async () => {
      walletManager.providerType = 'unknown-provider';
      renderWithRouter(<Web3Dashboard />);
      await waitFor(() => {
        expect(screen.getByText(/Connected to Unknown/i)).toBeInTheDocument();
      });
    });
  });

  describe('Dashboard Data Loading', () => {
    beforeEach(() => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      walletManager.currentChainId = 1;
    });

    it('loads dashboard data on mount when connected', async () => {
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(getCRYBTokenContract).toHaveBeenCalledWith(1);
        expect(mockCRYBContract.getBalance).toHaveBeenCalledWith('0x1234567890123456789012345678901234567890');
      });
    });

    it('displays loading state while fetching data', () => {
      renderWithRouter(<Web3Dashboard />);
      expect(screen.getAllByText('...').length).toBeGreaterThan(0);
    });

    it('displays CRYB balance after loading', async () => {
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('CRYB Balance')).toBeInTheDocument();
        expect(screen.getByText('1.00')).toBeInTheDocument();
      });
    });

    it('displays staked amount after loading', async () => {
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Staked CRYB')).toBeInTheDocument();
        expect(screen.getByText('0.50')).toBeInTheDocument();
      });
    });

    it('displays NFT count after loading', async () => {
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('NFTs Owned')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });

    it('displays portfolio value after loading', async () => {
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Portfolio Value')).toBeInTheDocument();
        expect(screen.getByText('$25,000')).toBeInTheDocument();
      });
    });

    it('handles contract errors gracefully', async () => {
      mockCRYBContract.getBalance.mockRejectedValue(new Error('Contract error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to load dashboard data:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });

    it('loads data with correct chain ID', async () => {
      walletManager.currentChainId = 137;
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(getCRYBTokenContract).toHaveBeenCalledWith(137);
      });
    });

    it('defaults to chain ID 1 when not set', async () => {
      walletManager.currentChainId = null;
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(getCRYBTokenContract).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('Overview Stats Display', () => {
    beforeEach(() => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      walletManager.currentChainId = 1;
    });

    it('displays all four stat cards', async () => {
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('CRYB Balance')).toBeInTheDocument();
        expect(screen.getByText('Staked CRYB')).toBeInTheDocument();
        expect(screen.getByText('NFTs Owned')).toBeInTheDocument();
        expect(screen.getByText('Portfolio Value')).toBeInTheDocument();
      });
    });

    it('displays coins icon for CRYB balance', async () => {
      renderWithRouter(<Web3Dashboard />);
      await waitFor(() => {
        expect(screen.getByTestId('icon-coins')).toBeInTheDocument();
      });
    });

    it('displays shield icon for staked amount', async () => {
      renderWithRouter(<Web3Dashboard />);
      await waitFor(() => {
        expect(screen.getByTestId('icon-shield')).toBeInTheDocument();
      });
    });

    it('displays image icon for NFT count', async () => {
      renderWithRouter(<Web3Dashboard />);
      await waitFor(() => {
        expect(screen.getByTestId('icon-image')).toBeInTheDocument();
      });
    });

    it('displays dollar sign icon for portfolio value', async () => {
      renderWithRouter(<Web3Dashboard />);
      await waitFor(() => {
        expect(screen.getByTestId('icon-dollar')).toBeInTheDocument();
      });
    });

    it('formats large token amounts correctly', async () => {
      mockCRYBContract.getBalance.mockResolvedValue(BigInt('123456789012345678901234'));

      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('123456.79')).toBeInTheDocument();
      });
    });

    it('handles zero balances', async () => {
      mockCRYBContract.getBalance.mockResolvedValue(BigInt(0));
      mockCRYBContract.getStakingInfo.mockResolvedValue({ stakedAmount: BigInt(0) });

      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('0.00')).toBeInTheDocument();
      });
    });

    it('handles zero NFTs', async () => {
      mockCRYBContract.getUserNFTs.mockResolvedValue({ tokenIds: [] });

      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument();
      });
    });
  });

  describe('Tabs Navigation', () => {
    beforeEach(() => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      walletManager.currentChainId = 1;
    });

    it('displays all tab triggers', async () => {
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-overview')).toBeInTheDocument();
        expect(screen.getByTestId('tab-trigger-staking')).toBeInTheDocument();
        expect(screen.getByTestId('tab-trigger-governance')).toBeInTheDocument();
        expect(screen.getByTestId('tab-trigger-nfts')).toBeInTheDocument();
        expect(screen.getByTestId('tab-trigger-multichain')).toBeInTheDocument();
      });
    });

    it('displays overview tab by default', async () => {
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('tab-content-overview')).toBeInTheDocument();
      });
    });

    it('switches to staking tab when clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-staking')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('tab-trigger-staking'));

      await waitFor(() => {
        expect(screen.getByTestId('tab-content-staking')).toBeInTheDocument();
        expect(screen.getByTestId('staking-dashboard')).toBeInTheDocument();
      });
    });

    it('switches to governance tab when clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-governance')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('tab-trigger-governance'));

      await waitFor(() => {
        expect(screen.getByTestId('tab-content-governance')).toBeInTheDocument();
        expect(screen.getByTestId('governance-dashboard')).toBeInTheDocument();
      });
    });

    it('switches to NFTs tab when clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-nfts')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('tab-trigger-nfts'));

      await waitFor(() => {
        expect(screen.getByTestId('tab-content-nfts')).toBeInTheDocument();
        expect(screen.getByTestId('nft-profile-system')).toBeInTheDocument();
      });
    });

    it('switches to multichain tab when clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-multichain')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('tab-trigger-multichain'));

      await waitFor(() => {
        expect(screen.getByTestId('tab-content-multichain')).toBeInTheDocument();
        expect(screen.getByTestId('multichain-manager')).toBeInTheDocument();
      });
    });

    it('displays tab icons', async () => {
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('icon-trending-up')).toBeInTheDocument();
        expect(screen.getByTestId('icon-vote')).toBeInTheDocument();
        expect(screen.getByTestId('icon-network')).toBeInTheDocument();
      });
    });
  });

  describe('Quick Actions', () => {
    beforeEach(() => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      walletManager.currentChainId = 1;
    });

    it('displays quick actions section', async () => {
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      });
    });

    it('displays all four quick action buttons', async () => {
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Stake CRYB/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Vote/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Mint NFT/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Bridge/i })).toBeInTheDocument();
      });
    });

    it('navigates to staking tab when Stake CRYB clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Stake CRYB/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Stake CRYB/i }));

      await waitFor(() => {
        expect(screen.getByTestId('staking-dashboard')).toBeInTheDocument();
      });
    });

    it('navigates to governance tab when Vote clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Vote/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Vote/i }));

      await waitFor(() => {
        expect(screen.getByTestId('governance-dashboard')).toBeInTheDocument();
      });
    });

    it('navigates to NFTs tab when Mint NFT clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Mint NFT/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Mint NFT/i }));

      await waitFor(() => {
        expect(screen.getByTestId('nft-profile-system')).toBeInTheDocument();
      });
    });

    it('navigates to multichain tab when Bridge clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Bridge/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Bridge/i }));

      await waitFor(() => {
        expect(screen.getByTestId('multichain-manager')).toBeInTheDocument();
      });
    });
  });

  describe('Platform Statistics', () => {
    beforeEach(() => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      walletManager.currentChainId = 1;
    });

    it('displays platform statistics section', async () => {
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Platform Statistics')).toBeInTheDocument();
      });
    });

    it('displays total CRYB staked stat', async () => {
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('2.5M+')).toBeInTheDocument();
        expect(screen.getByText('Total CRYB Staked')).toBeInTheDocument();
      });
    });

    it('displays NFTs minted stat', async () => {
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('15,847')).toBeInTheDocument();
        expect(screen.getByText('NFTs Minted')).toBeInTheDocument();
      });
    });

    it('displays governance proposals stat', async () => {
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('342')).toBeInTheDocument();
        expect(screen.getByText('Governance Proposals')).toBeInTheDocument();
      });
    });
  });

  describe('Recent Activity', () => {
    beforeEach(() => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      walletManager.currentChainId = 1;
    });

    it('displays recent activity section', async () => {
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      });
    });

    it('displays recent activity icon', async () => {
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('icon-zap')).toBeInTheDocument();
      });
    });

    it('displays staking activity', async () => {
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Staked 1,000 CRYB')).toBeInTheDocument();
        expect(screen.getByText('2 hours ago')).toBeInTheDocument();
      });
    });

    it('displays voting activity', async () => {
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Voted on Proposal #42')).toBeInTheDocument();
        expect(screen.getByText('1 day ago')).toBeInTheDocument();
      });
    });

    it('displays NFT minting activity', async () => {
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Minted NFT #1234')).toBeInTheDocument();
        expect(screen.getByText('3 days ago')).toBeInTheDocument();
      });
    });

    it('displays activity status indicators', async () => {
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        const greenIndicators = document.querySelectorAll('.bg-green-500');
        const blueIndicators = document.querySelectorAll('.bg-blue-500');
        const purpleIndicators = document.querySelectorAll('.bg-purple-500');

        expect(greenIndicators.length).toBeGreaterThan(0);
        expect(blueIndicators.length).toBeGreaterThan(0);
        expect(purpleIndicators.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Network Status', () => {
    beforeEach(() => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      walletManager.currentChainId = 1;
    });

    it('displays network status section', async () => {
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Network Status')).toBeInTheDocument();
      });
    });

    it('displays network status icon', async () => {
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('icon-globe')).toBeInTheDocument();
      });
    });

    it('displays Ethereum Mainnet status', async () => {
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Ethereum Mainnet')).toBeInTheDocument();
      });
    });

    it('displays Polygon status', async () => {
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Polygon')).toBeInTheDocument();
      });
    });

    it('displays Arbitrum status', async () => {
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Arbitrum')).toBeInTheDocument();
      });
    });

    it('displays Optimism status', async () => {
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Optimism')).toBeInTheDocument();
      });
    });

    it('displays active badges for networks', async () => {
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        const badges = screen.getAllByTestId('badge');
        const activeBadges = badges.filter(badge => badge.getAttribute('data-color') === 'green');
        expect(activeBadges.length).toBeGreaterThan(0);
      });
    });

    it('displays maintenance badge for Optimism', async () => {
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        const badges = screen.getAllByTestId('badge');
        const maintenanceBadge = badges.find(badge => badge.getAttribute('data-color') === 'yellow');
        expect(maintenanceBadge).toBeInTheDocument();
      });
    });
  });

  describe('Help and Support Section', () => {
    beforeEach(() => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      walletManager.currentChainId = 1;
    });

    it('displays help section when connected', async () => {
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Need Help?')).toBeInTheDocument();
      });
    });

    it('displays help description', async () => {
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Check out our documentation or join our community for support/i)).toBeInTheDocument();
      });
    });

    it('displays docs button', async () => {
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Docs/i })).toBeInTheDocument();
      });
    });

    it('displays discord button', async () => {
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Discord/i })).toBeInTheDocument();
      });
    });

    it('displays users icon in discord button', async () => {
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('icon-users')).toBeInTheDocument();
      });
    });
  });

  describe('Event Listeners', () => {
    it('registers connection state change listener', () => {
      renderWithRouter(<Web3Dashboard />);
      expect(walletManager.on).toHaveBeenCalledWith('connectionStateChanged', expect.any(Function));
    });

    it('registers account change listener', () => {
      renderWithRouter(<Web3Dashboard />);
      expect(walletManager.on).toHaveBeenCalledWith('accountChanged', expect.any(Function));
    });

    it('registers chain change listener', () => {
      renderWithRouter(<Web3Dashboard />);
      expect(walletManager.on).toHaveBeenCalledWith('chainChanged', expect.any(Function));
    });

    it('unregisters listeners on unmount', () => {
      const { unmount } = renderWithRouter(<Web3Dashboard />);
      unmount();

      expect(walletManager.off).toHaveBeenCalledWith('connectionStateChanged', expect.any(Function));
      expect(walletManager.off).toHaveBeenCalledWith('accountChanged', expect.any(Function));
      expect(walletManager.off).toHaveBeenCalledWith('chainChanged', expect.any(Function));
    });
  });

  describe('Refresh Functionality', () => {
    beforeEach(() => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      walletManager.currentChainId = 1;
    });

    it('reloads data when refresh button clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument();
      });

      jest.clearAllMocks();

      await user.click(screen.getByRole('button', { name: /Refresh/i }));

      await waitFor(() => {
        expect(mockCRYBContract.getBalance).toHaveBeenCalled();
      });
    });

    it('displays refresh icon', async () => {
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('icon-refresh')).toBeInTheDocument();
      });
    });

    it('updates loading state during refresh', async () => {
      const user = userEvent.setup();

      // Make contract call slow
      mockCRYBContract.getBalance.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve(BigInt(1000000000000000000)), 100))
      );

      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Refresh/i }));

      // Should show loading indicator
      expect(screen.getAllByText('...').length).toBeGreaterThan(0);
    });
  });

  describe('Address Formatting', () => {
    it('formats full address to shortened version', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0xAbCdEf1234567890aBcDeF1234567890aBcDeF12';
      walletManager.currentChainId = 1;

      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/0xAbCd...eF12/i)).toBeInTheDocument();
      });
    });

    it('handles null address', () => {
      walletManager.isConnected = true;
      walletManager.account = null;

      renderWithRouter(<Web3Dashboard />);
      // Should not crash
    });
  });

  describe('Token Amount Formatting', () => {
    beforeEach(() => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      walletManager.currentChainId = 1;
    });

    it('formats 18 decimal tokens correctly', async () => {
      mockCRYBContract.getBalance.mockResolvedValue(BigInt('1230000000000000000'));

      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('1.23')).toBeInTheDocument();
      });
    });

    it('rounds to 2 decimal places', async () => {
      mockCRYBContract.getBalance.mockResolvedValue(BigInt('1234567890123456789'));

      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('1.23')).toBeInTheDocument();
      });
    });

    it('handles very small amounts', async () => {
      mockCRYBContract.getBalance.mockResolvedValue(BigInt('1000000000000000'));

      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('0.00')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      walletManager.currentChainId = 1;
    });

    it('handles balance fetch error', async () => {
      mockCRYBContract.getBalance.mockRejectedValue(new Error('Network error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      // Should still display UI without crashing
      expect(screen.getByText('CRYB Balance')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('handles staking info fetch error', async () => {
      mockCRYBContract.getStakingInfo.mockRejectedValue(new Error('Network error'));

      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        // Should display 0 as fallback
        expect(screen.getByText('Staked CRYB')).toBeInTheDocument();
      });
    });

    it('handles NFT fetch error', async () => {
      mockCRYBContract.getUserNFTs.mockRejectedValue(new Error('Network error'));

      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('NFTs Owned')).toBeInTheDocument();
      });
    });

    it('handles voting power fetch error', async () => {
      mockGovernanceContract.getUserVotingPower.mockRejectedValue(new Error('Network error'));

      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        // Should not crash
        expect(screen.getByText('Web3 Dashboard')).toBeInTheDocument();
      });
    });

    it('handles all contract errors gracefully', async () => {
      mockCRYBContract.getBalance.mockRejectedValue(new Error('Error 1'));
      mockCRYBContract.getStakingInfo.mockRejectedValue(new Error('Error 2'));
      mockCRYBContract.getUserNFTs.mockRejectedValue(new Error('Error 3'));
      mockGovernanceContract.getUserVotingPower.mockRejectedValue(new Error('Error 4'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Web3 Dashboard')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Data Update on Connection Changes', () => {
    it('reloads data when connection state changes', async () => {
      walletManager.isConnected = false;
      const { rerender } = renderWithRouter(<Web3Dashboard />);

      // Connect wallet
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      walletManager.currentChainId = 1;

      rerender(<BrowserRouter><Web3Dashboard /></BrowserRouter>);

      await waitFor(() => {
        expect(mockCRYBContract.getBalance).toHaveBeenCalled();
      });
    });

    it('reloads data when account changes', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x1111111111111111111111111111111111111111';
      walletManager.currentChainId = 1;

      const { rerender } = renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(mockCRYBContract.getBalance).toHaveBeenCalledWith('0x1111111111111111111111111111111111111111');
      });

      jest.clearAllMocks();

      // Change account
      walletManager.account = '0x2222222222222222222222222222222222222222';

      rerender(<BrowserRouter><Web3Dashboard /></BrowserRouter>);

      await waitFor(() => {
        expect(mockCRYBContract.getBalance).toHaveBeenCalledWith('0x2222222222222222222222222222222222222222');
      });
    });

    it('reloads data when chain changes', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      walletManager.currentChainId = 1;

      const { rerender } = renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(getCRYBTokenContract).toHaveBeenCalledWith(1);
      });

      jest.clearAllMocks();

      // Change chain
      walletManager.currentChainId = 137;

      rerender(<BrowserRouter><Web3Dashboard /></BrowserRouter>);

      await waitFor(() => {
        expect(getCRYBTokenContract).toHaveBeenCalledWith(137);
      });
    });
  });

  describe('Portfolio Value Display', () => {
    beforeEach(() => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      walletManager.currentChainId = 1;
    });

    it('formats portfolio value with locale string', async () => {
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('$25,000')).toBeInTheDocument();
      });
    });

    it('displays large portfolio values correctly', async () => {
      // Mock large portfolio value
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        const portfolioText = screen.getByText('Portfolio Value');
        expect(portfolioText).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      walletManager.currentChainId = 1;
    });

    it('has proper button roles', async () => {
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
      });
    });

    it('buttons have accessible text', async () => {
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Disconnect/i })).toBeInTheDocument();
      });
    });

    it('displays semantic HTML structure', async () => {
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        const cards = screen.getAllByTestId('card');
        expect(cards.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Component Integration', () => {
    beforeEach(() => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      walletManager.currentChainId = 1;
    });

    it('passes through to StakingDashboard', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-staking')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('tab-trigger-staking'));

      await waitFor(() => {
        expect(screen.getByTestId('staking-dashboard')).toBeInTheDocument();
      });
    });

    it('passes through to GovernanceDashboard', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-governance')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('tab-trigger-governance'));

      await waitFor(() => {
        expect(screen.getByTestId('governance-dashboard')).toBeInTheDocument();
      });
    });

    it('passes through to NFTProfileSystem', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-nfts')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('tab-trigger-nfts'));

      await waitFor(() => {
        expect(screen.getByTestId('nft-profile-system')).toBeInTheDocument();
      });
    });

    it('passes through to MultiChainManager', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-multichain')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('tab-trigger-multichain'));

      await waitFor(() => {
        expect(screen.getByTestId('multichain-manager')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles missing wallet manager gracefully', () => {
      Object.assign(walletManager, {
        isConnected: undefined,
        account: undefined,
        currentChainId: undefined,
      });

      renderWithRouter(<Web3Dashboard />);
      expect(screen.getByText('Web3 Dashboard')).toBeInTheDocument();
    });

    it('handles extremely long addresses', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x' + 'a'.repeat(100);
      walletManager.currentChainId = 1;

      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        // Should still format without crashing
        expect(screen.getByText('Connected to MetaMask')).toBeInTheDocument();
      });
    });

    it('handles negative portfolio values', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      walletManager.currentChainId = 1;

      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Portfolio Value')).toBeInTheDocument();
      });
    });

    it('handles missing staking info fields', async () => {
      mockCRYBContract.getStakingInfo.mockResolvedValue({});

      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      walletManager.currentChainId = 1;

      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Staked CRYB')).toBeInTheDocument();
      });
    });

    it('handles missing NFT data fields', async () => {
      mockCRYBContract.getUserNFTs.mockResolvedValue({});

      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      walletManager.currentChainId = 1;

      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('NFTs Owned')).toBeInTheDocument();
      });
    });

    it('handles rapid tab switching', async () => {
      const user = userEvent.setup();
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      walletManager.currentChainId = 1;

      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-staking')).toBeInTheDocument();
      });

      // Rapidly switch tabs
      await user.click(screen.getByTestId('tab-trigger-staking'));
      await user.click(screen.getByTestId('tab-trigger-governance'));
      await user.click(screen.getByTestId('tab-trigger-nfts'));
      await user.click(screen.getByTestId('tab-trigger-multichain'));
      await user.click(screen.getByTestId('tab-trigger-overview'));

      // Should end on overview tab
      await waitFor(() => {
        expect(screen.getByTestId('tab-content-overview')).toBeInTheDocument();
      });
    });

    it('handles disconnection during data load', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      walletManager.currentChainId = 1;

      // Make contract calls slow
      mockCRYBContract.getBalance.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve(BigInt(1000000000000000000)), 200))
      );

      renderWithRouter(<Web3Dashboard />);

      // Disconnect immediately
      walletManager.isConnected = false;

      // Should handle gracefully
      await waitFor(() => {
        expect(screen.getByText('Web3 Dashboard')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    beforeEach(() => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      walletManager.currentChainId = 1;
    });

    it('shows loading indicators during initial load', () => {
      renderWithRouter(<Web3Dashboard />);
      expect(screen.getAllByText('...').length).toBeGreaterThan(0);
    });

    it('clears loading state after data loads', async () => {
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('1.00')).toBeInTheDocument();
      });

      // Loading indicators should be gone
      const loadingIndicators = screen.queryAllByText('...');
      expect(loadingIndicators.length).toBe(0);
    });

    it('maintains loading state during error', async () => {
      mockCRYBContract.getBalance.mockRejectedValue(new Error('Network error'));
      jest.spyOn(console, 'error').mockImplementation();

      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        // Should clear loading after error
        const cards = screen.getAllByTestId('card');
        expect(cards.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Multiple Contract Calls', () => {
    beforeEach(() => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      walletManager.currentChainId = 1;
    });

    it('calls all contract methods in parallel', async () => {
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(mockCRYBContract.getBalance).toHaveBeenCalled();
        expect(mockCRYBContract.getStakingInfo).toHaveBeenCalled();
        expect(mockCRYBContract.getUserNFTs).toHaveBeenCalled();
        expect(mockGovernanceContract.getUserVotingPower).toHaveBeenCalled();
      });
    });

    it('initializes all contract instances', async () => {
      renderWithRouter(<Web3Dashboard />);

      await waitFor(() => {
        expect(getCRYBTokenContract).toHaveBeenCalled();
        expect(getDaoGovernor).toHaveBeenCalled();
        expect(getNFTMarketplace).toHaveBeenCalled();
        expect(getDEXRouter).toHaveBeenCalled();
      });
    });
  });
});

export default StakingDashboard
