/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import YieldFarmingDashboard from './YieldFarmingDashboard';
import { getCRYBTokenContract, STAKING_POOLS, YIELD_FARMS } from '../../lib/contracts/cryb-contracts.js';
import { walletManager } from '../../lib/web3/WalletManager.js';

// Mock dependencies
jest.mock('../../lib/contracts/cryb-contracts.js', () => ({
  getCRYBTokenContract: jest.fn(),
  STAKING_POOLS: {
    basic: {
      id: 1,
      name: 'Basic Pool',
      baseAPY: 15,
      bonusMultiplier: 1.2,
      lockPeriod: 7 * 24 * 60 * 60,
      minStake: BigInt('1000000000000000000'), // 1 token
    },
    premium: {
      id: 2,
      name: 'Premium Pool',
      baseAPY: 25,
      bonusMultiplier: 1.5,
      lockPeriod: 30 * 24 * 60 * 60,
      minStake: BigInt('10000000000000000000'), // 10 tokens
    },
  },
  YIELD_FARMS: {
    crybEth: {
      id: 1,
      name: 'CRYB-ETH LP',
      multiplier: 2,
    },
    crybUsdc: {
      id: 2,
      name: 'CRYB-USDC LP',
      multiplier: 1.5,
    },
  },
}));

jest.mock('../../lib/web3/WalletManager.js', () => ({
  walletManager: {
    isConnected: false,
    currentChainId: 1,
    account: '0x1234567890abcdef',
    connect: jest.fn(),
  },
}));

// Mock Radix UI components
jest.mock('@radix-ui/themes', () => ({
  Card: ({ children, className, ...props }) => <div className={className} {...props}>{children}</div>,
  Button: ({ children, className, onClick, disabled, variant, ...props }) => (
    <button className={className} onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
  Badge: ({ children, color, variant, ...props }) => <span data-color={color} data-variant={variant} {...props}>{children}</span>,
  Progress: ({ value, ...props }) => <div role="progressbar" aria-valuenow={value} {...props} />,
  Dialog: {
    Root: ({ children, open, onOpenChange }) => (
      open ? <div data-testid="dialog-root" onClick={() => onOpenChange && onOpenChange(false)}>{children}</div> : null
    ),
    Content: ({ children, className }) => <div className={className} data-testid="dialog-content">{children}</div>,
    Title: ({ children, className }) => <h2 className={className}>{children}</h2>,
  },
  Tabs: {
    Root: ({ children, value, onValueChange }) => (
      <div data-testid="tabs-root" data-value={value}>
        {React.Children.map(children, child =>
          React.cloneElement(child, { value, onValueChange })
        )}
      </div>
    ),
    List: ({ children, value, onValueChange }) => (
      <div data-testid="tabs-list">
        {React.Children.map(children, child =>
          React.cloneElement(child, { value, onValueChange })
        )}
      </div>
    ),
    Trigger: ({ children, value: tabValue, value: currentValue, onValueChange }) => (
      <button
        data-testid={`tab-trigger-${tabValue}`}
        onClick={() => onValueChange && onValueChange(tabValue)}
      >
        {children}
      </button>
    ),
    Content: ({ children, value: tabValue, value: currentValue }) => (
      tabValue === currentValue ? <div data-testid={`tab-content-${tabValue}`}>{children}</div> : null
    ),
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  TrendingUp: () => <span data-testid="icon-trending-up">TrendingUp</span>,
  DollarSign: () => <span data-testid="icon-dollar-sign">DollarSign</span>,
  Zap: () => <span data-testid="icon-zap">Zap</span>,
  RefreshCw: ({ className }) => <span data-testid="icon-refresh-cw" className={className}>RefreshCw</span>,
  Settings: () => <span data-testid="icon-settings">Settings</span>,
  PlusCircle: () => <span data-testid="icon-plus-circle">PlusCircle</span>,
  MinusCircle: () => <span data-testid="icon-minus-circle">MinusCircle</span>,
  Target: () => <span data-testid="icon-target">Target</span>,
  Calendar: () => <span data-testid="icon-calendar">Calendar</span>,
  Info: () => <span data-testid="icon-info">Info</span>,
  ArrowUpRight: () => <span data-testid="icon-arrow-up-right">ArrowUpRight</span>,
  ArrowDownRight: () => <span data-testid="icon-arrow-down-right">ArrowDownRight</span>,
  Coins: () => <span data-testid="icon-coins">Coins</span>,
  Shield: () => <span data-testid="icon-shield">Shield</span>,
  AlertTriangle: () => <span data-testid="icon-alert-triangle">AlertTriangle</span>,
  CheckCircle: () => <span data-testid="icon-check-circle">CheckCircle</span>,
  ExternalLink: () => <span data-testid="icon-external-link">ExternalLink</span>,
  Copy: () => <span data-testid="icon-copy">Copy</span>,
}));

describe('YieldFarmingDashboard', () => {
  let mockContract;

  beforeEach(() => {
    jest.clearAllMocks();

    mockContract = {
      getUserStakeInfo: jest.fn(),
      getUserFarmInfo: jest.fn(),
      getTotalValueLocked: jest.fn(),
      stakeInPool: jest.fn(),
      unstake: jest.fn(),
      compoundStakingRewards: jest.fn(),
      depositToFarm: jest.fn(),
      withdrawFromFarm: jest.fn(),
      harvestFarmRewards: jest.fn(),
    };

    getCRYBTokenContract.mockReturnValue(mockContract);
    walletManager.isConnected = false;
    walletManager.currentChainId = 1;
    walletManager.account = '0x1234567890abcdef';
  });

  describe('Dashboard Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<YieldFarmingDashboard />);
      expect(container).toBeInTheDocument();
    });

    it('should render wallet connection prompt when wallet not connected', () => {
      walletManager.isConnected = false;
      render(<YieldFarmingDashboard />);

      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
      expect(screen.getByText('Connect your wallet to access DeFi yield farming features')).toBeInTheDocument();
    });

    it('should render dashboard when wallet is connected', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt(0),
        pendingRewards: BigInt(0),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('DeFi Yield Farming')).toBeInTheDocument();
      });
    });

    it('should render dashboard header with title', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({ amount: BigInt(0), pendingRewards: BigInt(0), stakeTime: Date.now() });
      mockContract.getUserFarmInfo.mockResolvedValue({ stakedAmount: BigInt(0), pendingRewards: BigInt(0), lastHarvestTime: Date.now() });
      mockContract.getTotalValueLocked.mockResolvedValue({ totalValueUSD: 0, totalStaked: BigInt(0), totalFarmed: BigInt(0) });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('DeFi Yield Farming')).toBeInTheDocument();
        expect(screen.getByText('Maximize your CRYB token rewards')).toBeInTheDocument();
      });
    });

    it('should render tabs navigation', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({ amount: BigInt(0), pendingRewards: BigInt(0), stakeTime: Date.now() });
      mockContract.getUserFarmInfo.mockResolvedValue({ stakedAmount: BigInt(0), pendingRewards: BigInt(0), lastHarvestTime: Date.now() });
      mockContract.getTotalValueLocked.mockResolvedValue({ totalValueUSD: 0, totalStaked: BigInt(0), totalFarmed: BigInt(0) });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-overview')).toBeInTheDocument();
        expect(screen.getByTestId('tab-trigger-staking')).toBeInTheDocument();
        expect(screen.getByTestId('tab-trigger-farming')).toBeInTheDocument();
      });
    });

    it('should render refresh button in header', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({ amount: BigInt(0), pendingRewards: BigInt(0), stakeTime: Date.now() });
      mockContract.getUserFarmInfo.mockResolvedValue({ stakedAmount: BigInt(0), pendingRewards: BigInt(0), lastHarvestTime: Date.now() });
      mockContract.getTotalValueLocked.mockResolvedValue({ totalValueUSD: 0, totalStaked: BigInt(0), totalFarmed: BigInt(0) });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument();
      });
    });

    it('should render settings button in header', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({ amount: BigInt(0), pendingRewards: BigInt(0), stakeTime: Date.now() });
      mockContract.getUserFarmInfo.mockResolvedValue({ stakedAmount: BigInt(0), pendingRewards: BigInt(0), lastHarvestTime: Date.now() });
      mockContract.getTotalValueLocked.mockResolvedValue({ totalValueUSD: 0, totalStaked: BigInt(0), totalFarmed: BigInt(0) });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });
    });
  });

  describe('Wallet Connection Check', () => {
    it('should show connect wallet button when not connected', () => {
      walletManager.isConnected = false;
      render(<YieldFarmingDashboard />);

      const connectButton = screen.getByText('Connect Wallet');
      expect(connectButton).toBeInTheDocument();
    });

    it('should call walletManager.connect when connect button clicked', async () => {
      walletManager.isConnected = false;
      walletManager.connect.mockResolvedValue();

      render(<YieldFarmingDashboard />);

      const connectButton = screen.getByText('Connect Wallet');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(walletManager.connect).toHaveBeenCalled();
      });
    });

    it('should not load data when wallet is not connected', () => {
      walletManager.isConnected = false;
      render(<YieldFarmingDashboard />);

      expect(mockContract.getUserStakeInfo).not.toHaveBeenCalled();
      expect(mockContract.getUserFarmInfo).not.toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should show loading indicator when fetching contract data', () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockImplementation(() => new Promise(() => {}));
      mockContract.getUserFarmInfo.mockImplementation(() => new Promise(() => {}));
      mockContract.getTotalValueLocked.mockImplementation(() => new Promise(() => {}));

      render(<YieldFarmingDashboard />);

      expect(screen.getByText('Loading DeFi dashboard...')).toBeInTheDocument();
    });

    it('should show spinner icon while loading', () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockImplementation(() => new Promise(() => {}));
      mockContract.getUserFarmInfo.mockImplementation(() => new Promise(() => {}));
      mockContract.getTotalValueLocked.mockImplementation(() => new Promise(() => {}));

      render(<YieldFarmingDashboard />);

      const spinner = screen.getByTestId('icon-refresh-cw');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('');
    });

    it('should hide loading state after data is loaded', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({ amount: BigInt(0), pendingRewards: BigInt(0), stakeTime: Date.now() });
      mockContract.getUserFarmInfo.mockResolvedValue({ stakedAmount: BigInt(0), pendingRewards: BigInt(0), lastHarvestTime: Date.now() });
      mockContract.getTotalValueLocked.mockResolvedValue({ totalValueUSD: 0, totalStaked: BigInt(0), totalFarmed: BigInt(0) });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Loading DeFi dashboard...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Total Value Locked (TVL) Display', () => {
    it('should display TVL section', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({ amount: BigInt(0), pendingRewards: BigInt(0), stakeTime: Date.now() });
      mockContract.getUserFarmInfo.mockResolvedValue({ stakedAmount: BigInt(0), pendingRewards: BigInt(0), lastHarvestTime: Date.now() });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Value Locked (TVL)')).toBeInTheDocument();
      });
    });

    it('should display total TVL in USD', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({ amount: BigInt(0), pendingRewards: BigInt(0), stakeTime: Date.now() });
      mockContract.getUserFarmInfo.mockResolvedValue({ stakedAmount: BigInt(0), pendingRewards: BigInt(0), lastHarvestTime: Date.now() });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1234567.89,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('$1,234,567.89')).toBeInTheDocument();
      });
    });

    it('should display total staked amount', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({ amount: BigInt(0), pendingRewards: BigInt(0), stakeTime: Date.now() });
      mockContract.getUserFarmInfo.mockResolvedValue({ stakedAmount: BigInt(0), pendingRewards: BigInt(0), lastHarvestTime: Date.now() });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Staked CRYB')).toBeInTheDocument();
      });
    });

    it('should display total farmed LP amount', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({ amount: BigInt(0), pendingRewards: BigInt(0), stakeTime: Date.now() });
      mockContract.getUserFarmInfo.mockResolvedValue({ stakedAmount: BigInt(0), pendingRewards: BigInt(0), lastHarvestTime: Date.now() });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total LP Farmed')).toBeInTheDocument();
      });
    });
  });

  describe('User Portfolio Display', () => {
    it('should display portfolio value card', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt('5000000000000000000'),
        pendingRewards: BigInt('100000000000000000'),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt('2000000000000000000'),
        pendingRewards: BigInt('50000000000000000'),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Portfolio Value')).toBeInTheDocument();
      });
    });

    it('should display total staked amount in portfolio', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt('5000000000000000000'),
        pendingRewards: BigInt('100000000000000000'),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Staked')).toBeInTheDocument();
      });
    });

    it('should display total farmed amount in portfolio', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt(0),
        pendingRewards: BigInt(0),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt('2000000000000000000'),
        pendingRewards: BigInt('50000000000000000'),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Farmed')).toBeInTheDocument();
      });
    });

    it('should display pending rewards in portfolio', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt('5000000000000000000'),
        pendingRewards: BigInt('100000000000000000'),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt('2000000000000000000'),
        pendingRewards: BigInt('50000000000000000'),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Pending Rewards')).toBeInTheDocument();
      });
    });
  });

  describe('Claimable Rewards Display', () => {
    it('should display claimable rewards amount', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt('5000000000000000000'),
        pendingRewards: BigInt('123456789000000000'),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Pending Rewards')).toBeInTheDocument();
      });
    });

    it('should format rewards with proper decimals', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt('5000000000000000000'),
        pendingRewards: BigInt('123456789123456789'),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const rewardsText = screen.getAllByText(/0\.123457/);
        expect(rewardsText.length).toBeGreaterThan(0);
      });
    });
  });

  describe('APY/APR Display', () => {
    it('should display APY for staking pools', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt('5000000000000000000'),
        pendingRewards: BigInt(0),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const stakingTab = screen.getByTestId('tab-trigger-staking');
        fireEvent.click(stakingTab);
      });

      await waitFor(() => {
        const apyBadges = screen.getAllByText(/% APY/);
        expect(apyBadges.length).toBeGreaterThan(0);
      });
    });

    it('should display APY for farming pools', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt(0),
        pendingRewards: BigInt(0),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt('2000000000000000000'),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const farmingTab = screen.getByTestId('tab-trigger-farming');
        fireEvent.click(farmingTab);
      });

      await waitFor(() => {
        const apyBadges = screen.getAllByText(/% APY/);
        expect(apyBadges.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Staking Pool List', () => {
    it('should render staking pools when tab is selected', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt(0),
        pendingRewards: BigInt(0),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const stakingTab = screen.getByTestId('tab-trigger-staking');
        fireEvent.click(stakingTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Basic Pool')).toBeInTheDocument();
        expect(screen.getByText('Premium Pool')).toBeInTheDocument();
      });
    });

    it('should display pool lock period', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt(0),
        pendingRewards: BigInt(0),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const stakingTab = screen.getByTestId('tab-trigger-staking');
        fireEvent.click(stakingTab);
      });

      await waitFor(() => {
        expect(screen.getByText(/Lock: 7 days/)).toBeInTheDocument();
        expect(screen.getByText(/Lock: 30 days/)).toBeInTheDocument();
      });
    });

    it('should display minimum stake requirement', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt(0),
        pendingRewards: BigInt(0),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const stakingTab = screen.getByTestId('tab-trigger-staking');
        fireEvent.click(stakingTab);
      });

      await waitFor(() => {
        expect(screen.getByText(/Min: 1.00/)).toBeInTheDocument();
        expect(screen.getByText(/Min: 10.00/)).toBeInTheDocument();
      });
    });
  });

  describe('Farming Pool List', () => {
    it('should render farming pools when tab is selected', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt(0),
        pendingRewards: BigInt(0),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const farmingTab = screen.getByTestId('tab-trigger-farming');
        fireEvent.click(farmingTab);
      });

      await waitFor(() => {
        expect(screen.getByText('CRYB-ETH LP')).toBeInTheDocument();
        expect(screen.getByText('CRYB-USDC LP')).toBeInTheDocument();
      });
    });

    it('should display farm multiplier', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt(0),
        pendingRewards: BigInt(0),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const farmingTab = screen.getByTestId('tab-trigger-farming');
        fireEvent.click(farmingTab);
      });

      await waitFor(() => {
        expect(screen.getByText(/Multiplier: 2x/)).toBeInTheDocument();
        expect(screen.getByText(/Multiplier: 1.5x/)).toBeInTheDocument();
      });
    });
  });

  describe('Stake Tokens Functionality', () => {
    it('should open stake modal when stake button clicked', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt(0),
        pendingRewards: BigInt(0),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const stakingTab = screen.getByTestId('tab-trigger-staking');
        fireEvent.click(stakingTab);
      });

      await waitFor(() => {
        const stakeButtons = screen.getAllByText('Stake');
        fireEvent.click(stakeButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('Stake CRYB Tokens')).toBeInTheDocument();
      });
    });

    it('should show amount input in stake modal', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt(0),
        pendingRewards: BigInt(0),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const stakingTab = screen.getByTestId('tab-trigger-staking');
        fireEvent.click(stakingTab);
      });

      await waitFor(() => {
        const stakeButtons = screen.getAllByText('Stake');
        fireEvent.click(stakeButtons[0]);
      });

      await waitFor(() => {
        const input = screen.getByPlaceholderText('0.00');
        expect(input).toBeInTheDocument();
      });
    });

    it('should allow entering stake amount', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt(0),
        pendingRewards: BigInt(0),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const stakingTab = screen.getByTestId('tab-trigger-staking');
        fireEvent.click(stakingTab);
      });

      await waitFor(() => {
        const stakeButtons = screen.getAllByText('Stake');
        fireEvent.click(stakeButtons[0]);
      });

      await waitFor(() => {
        const input = screen.getByPlaceholderText('0.00');
        fireEvent.change(input, { target: { value: '100' } });
        expect(input.value).toBe('100');
      });
    });

    it('should call stakeInPool when confirming stake', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt(0),
        pendingRewards: BigInt(0),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });
      mockContract.stakeInPool.mockResolvedValue('0xtxhash');

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const stakingTab = screen.getByTestId('tab-trigger-staking');
        fireEvent.click(stakingTab);
      });

      await waitFor(() => {
        const stakeButtons = screen.getAllByText('Stake');
        fireEvent.click(stakeButtons[0]);
      });

      await waitFor(() => {
        const input = screen.getByPlaceholderText('0.00');
        fireEvent.change(input, { target: { value: '100' } });
      });

      const confirmButton = screen.getByText('Confirm stake');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockContract.stakeInPool).toHaveBeenCalledWith(1, BigInt('100000000000000000000'));
      });
    });

    it('should show processing state during stake', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt(0),
        pendingRewards: BigInt(0),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });
      mockContract.stakeInPool.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const stakingTab = screen.getByTestId('tab-trigger-staking');
        fireEvent.click(stakingTab);
      });

      await waitFor(() => {
        const stakeButtons = screen.getAllByText('Stake');
        fireEvent.click(stakeButtons[0]);
      });

      await waitFor(() => {
        const input = screen.getByPlaceholderText('0.00');
        fireEvent.change(input, { target: { value: '100' } });
      });

      const confirmButton = screen.getByText('Confirm stake');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('Processing...')).toBeInTheDocument();
      });
    });

    it('should close modal after successful stake', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt(0),
        pendingRewards: BigInt(0),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });
      mockContract.stakeInPool.mockResolvedValue('0xtxhash');

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const stakingTab = screen.getByTestId('tab-trigger-staking');
        fireEvent.click(stakingTab);
      });

      await waitFor(() => {
        const stakeButtons = screen.getAllByText('Stake');
        fireEvent.click(stakeButtons[0]);
      });

      await waitFor(() => {
        const input = screen.getByPlaceholderText('0.00');
        fireEvent.change(input, { target: { value: '100' } });
      });

      const confirmButton = screen.getByText('Confirm stake');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.queryByTestId('dialog-content')).not.toBeInTheDocument();
      });
    });
  });

  describe('Unstake Tokens Functionality', () => {
    it('should show unstake button when user has staked tokens', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt('5000000000000000000'),
        pendingRewards: BigInt(0),
        stakeTime: Date.now() - (8 * 24 * 60 * 60 * 1000), // 8 days ago
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const stakingTab = screen.getByTestId('tab-trigger-staking');
        fireEvent.click(stakingTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Unstake')).toBeInTheDocument();
      });
    });

    it('should disable unstake button when lock period not expired', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt('5000000000000000000'),
        pendingRewards: BigInt(0),
        stakeTime: Date.now() - (3 * 24 * 60 * 60 * 1000), // 3 days ago (less than 7 day lock)
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const stakingTab = screen.getByTestId('tab-trigger-staking');
        fireEvent.click(stakingTab);
      });

      await waitFor(() => {
        const unstakeButton = screen.getByText('Unstake');
        expect(unstakeButton).toBeDisabled();
      });
    });

    it('should open unstake modal when unstake button clicked', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt('5000000000000000000'),
        pendingRewards: BigInt(0),
        stakeTime: Date.now() - (8 * 24 * 60 * 60 * 1000),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const stakingTab = screen.getByTestId('tab-trigger-staking');
        fireEvent.click(stakingTab);
      });

      await waitFor(() => {
        const unstakeButton = screen.getByText('Unstake');
        fireEvent.click(unstakeButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Unstake CRYB Tokens')).toBeInTheDocument();
      });
    });

    it('should call unstake when confirming unstake', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt('5000000000000000000'),
        pendingRewards: BigInt(0),
        stakeTime: Date.now() - (8 * 24 * 60 * 60 * 1000),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });
      mockContract.unstake.mockResolvedValue('0xtxhash');

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const stakingTab = screen.getByTestId('tab-trigger-staking');
        fireEvent.click(stakingTab);
      });

      await waitFor(() => {
        const unstakeButton = screen.getByText('Unstake');
        fireEvent.click(unstakeButton);
      });

      await waitFor(() => {
        const input = screen.getByPlaceholderText('0.00');
        fireEvent.change(input, { target: { value: '2' } });
      });

      const confirmButton = screen.getByText('Confirm unstake');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockContract.unstake).toHaveBeenCalledWith(BigInt('2000000000000000000'));
      });
    });
  });

  describe('Claim Rewards Functionality', () => {
    it('should show compound button when rewards available', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt('5000000000000000000'),
        pendingRewards: BigInt('100000000000000000'),
        stakeTime: Date.now() - (8 * 24 * 60 * 60 * 1000),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const stakingTab = screen.getByTestId('tab-trigger-staking');
        fireEvent.click(stakingTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Compound')).toBeInTheDocument();
      });
    });

    it('should disable compound button when no rewards', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt('5000000000000000000'),
        pendingRewards: BigInt(0),
        stakeTime: Date.now() - (8 * 24 * 60 * 60 * 1000),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const stakingTab = screen.getByTestId('tab-trigger-staking');
        fireEvent.click(stakingTab);
      });

      await waitFor(() => {
        const compoundButton = screen.getByText('Compound');
        expect(compoundButton).toBeDisabled();
      });
    });

    it('should call compoundStakingRewards when compound clicked', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt('5000000000000000000'),
        pendingRewards: BigInt('100000000000000000'),
        stakeTime: Date.now() - (8 * 24 * 60 * 60 * 1000),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });
      mockContract.compoundStakingRewards.mockResolvedValue('0xtxhash');

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const stakingTab = screen.getByTestId('tab-trigger-staking');
        fireEvent.click(stakingTab);
      });

      await waitFor(() => {
        const compoundButton = screen.getByText('Compound');
        fireEvent.click(compoundButton);
      });

      await waitFor(() => {
        const confirmButton = screen.getByText('Confirm compound');
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(mockContract.compoundStakingRewards).toHaveBeenCalled();
      });
    });

    it('should show harvest button for farms with rewards', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt(0),
        pendingRewards: BigInt(0),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt('2000000000000000000'),
        pendingRewards: BigInt('50000000000000000'),
        lastHarvestTime: Date.now() - (24 * 60 * 60 * 1000),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const farmingTab = screen.getByTestId('tab-trigger-farming');
        fireEvent.click(farmingTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Harvest')).toBeInTheDocument();
      });
    });

    it('should call harvestFarmRewards when harvest clicked', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt(0),
        pendingRewards: BigInt(0),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt('2000000000000000000'),
        pendingRewards: BigInt('50000000000000000'),
        lastHarvestTime: Date.now() - (24 * 60 * 60 * 1000),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });
      mockContract.harvestFarmRewards.mockResolvedValue('0xtxhash');

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const farmingTab = screen.getByTestId('tab-trigger-farming');
        fireEvent.click(farmingTab);
      });

      await waitFor(() => {
        const harvestButton = screen.getByText('Harvest');
        fireEvent.click(harvestButton);
      });

      await waitFor(() => {
        expect(mockContract.harvestFarmRewards).toHaveBeenCalledWith(1, '0');
      });
    });
  });

  describe('LP Token Support', () => {
    it('should show deposit LP button for farming pools', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt(0),
        pendingRewards: BigInt(0),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const farmingTab = screen.getByTestId('tab-trigger-farming');
        fireEvent.click(farmingTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Deposit LP')).toBeInTheDocument();
      });
    });

    it('should open deposit modal when deposit LP clicked', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt(0),
        pendingRewards: BigInt(0),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const farmingTab = screen.getByTestId('tab-trigger-farming');
        fireEvent.click(farmingTab);
      });

      await waitFor(() => {
        const depositButton = screen.getByText('Deposit LP');
        fireEvent.click(depositButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Deposit LP Tokens')).toBeInTheDocument();
      });
    });

    it('should call depositToFarm when confirming deposit', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt(0),
        pendingRewards: BigInt(0),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });
      mockContract.depositToFarm.mockResolvedValue('0xtxhash');

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const farmingTab = screen.getByTestId('tab-trigger-farming');
        fireEvent.click(farmingTab);
      });

      await waitFor(() => {
        const depositButton = screen.getByText('Deposit LP');
        fireEvent.click(depositButton);
      });

      await waitFor(() => {
        const input = screen.getByPlaceholderText('0.00');
        fireEvent.change(input, { target: { value: '5' } });
      });

      const confirmButton = screen.getByText('Confirm deposit');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockContract.depositToFarm).toHaveBeenCalledWith(1, BigInt('5000000000000000000'));
      });
    });

    it('should show withdraw button when LP tokens deposited', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt(0),
        pendingRewards: BigInt(0),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt('2000000000000000000'),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const farmingTab = screen.getByTestId('tab-trigger-farming');
        fireEvent.click(farmingTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Withdraw')).toBeInTheDocument();
      });
    });

    it('should call withdrawFromFarm when confirming withdrawal', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt(0),
        pendingRewards: BigInt(0),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt('2000000000000000000'),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });
      mockContract.withdrawFromFarm.mockResolvedValue('0xtxhash');

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const farmingTab = screen.getByTestId('tab-trigger-farming');
        fireEvent.click(farmingTab);
      });

      await waitFor(() => {
        const withdrawButton = screen.getByText('Withdraw');
        fireEvent.click(withdrawButton);
      });

      await waitFor(() => {
        const input = screen.getByPlaceholderText('0.00');
        fireEvent.change(input, { target: { value: '1' } });
      });

      const confirmButton = screen.getByText('Confirm withdraw');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockContract.withdrawFromFarm).toHaveBeenCalledWith(1, BigInt('1000000000000000000'));
      });
    });
  });

  describe('Transaction Processing States', () => {
    it('should disable buttons during transaction processing', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt(0),
        pendingRewards: BigInt(0),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });
      mockContract.stakeInPool.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 2000)));

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const stakingTab = screen.getByTestId('tab-trigger-staking');
        fireEvent.click(stakingTab);
      });

      await waitFor(() => {
        const stakeButtons = screen.getAllByText('Stake');
        fireEvent.click(stakeButtons[0]);
      });

      await waitFor(() => {
        const input = screen.getByPlaceholderText('0.00');
        fireEvent.change(input, { target: { value: '100' } });
      });

      const confirmButton = screen.getByText('Confirm stake');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(confirmButton).toBeDisabled();
      });
    });

    it('should show processing text during transaction', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt(0),
        pendingRewards: BigInt(0),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });
      mockContract.stakeInPool.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 2000)));

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const stakingTab = screen.getByTestId('tab-trigger-staking');
        fireEvent.click(stakingTab);
      });

      await waitFor(() => {
        const stakeButtons = screen.getAllByText('Stake');
        fireEvent.click(stakeButtons[0]);
      });

      await waitFor(() => {
        const input = screen.getByPlaceholderText('0.00');
        fireEvent.change(input, { target: { value: '100' } });
      });

      const confirmButton = screen.getByText('Confirm stake');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('Processing...')).toBeInTheDocument();
      });
    });

    it('should show spinner icon during processing', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt(0),
        pendingRewards: BigInt(0),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });
      mockContract.stakeInPool.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 2000)));

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const stakingTab = screen.getByTestId('tab-trigger-staking');
        fireEvent.click(stakingTab);
      });

      await waitFor(() => {
        const stakeButtons = screen.getAllByText('Stake');
        fireEvent.click(stakeButtons[0]);
      });

      await waitFor(() => {
        const input = screen.getByPlaceholderText('0.00');
        fireEvent.change(input, { target: { value: '100' } });
      });

      const confirmButton = screen.getByText('Confirm stake');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        const spinner = document.querySelector('.');
        expect(spinner).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle stake error gracefully', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt(0),
        pendingRewards: BigInt(0),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      mockContract.stakeInPool.mockRejectedValue(new Error('Insufficient balance'));

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const stakingTab = screen.getByTestId('tab-trigger-staking');
        fireEvent.click(stakingTab);
      });

      await waitFor(() => {
        const stakeButtons = screen.getAllByText('Stake');
        fireEvent.click(stakeButtons[0]);
      });

      await waitFor(() => {
        const input = screen.getByPlaceholderText('0.00');
        fireEvent.change(input, { target: { value: '100' } });
      });

      const confirmButton = screen.getByText('Confirm stake');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('stake error:', expect.any(Error));
      });

      consoleError.mockRestore();
    });

    it('should handle contract loading error', async () => {
      walletManager.isConnected = true;
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      mockContract.getUserStakeInfo.mockRejectedValue(new Error('Contract not found'));
      mockContract.getUserFarmInfo.mockRejectedValue(new Error('Contract not found'));
      mockContract.getTotalValueLocked.mockRejectedValue(new Error('Contract not found'));

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to load dashboard data:', expect.any(Error));
      });

      consoleError.mockRestore();
    });

    it('should re-enable buttons after error', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt(0),
        pendingRewards: BigInt(0),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });
      jest.spyOn(console, 'error').mockImplementation();
      mockContract.stakeInPool.mockRejectedValue(new Error('Transaction failed'));

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const stakingTab = screen.getByTestId('tab-trigger-staking');
        fireEvent.click(stakingTab);
      });

      await waitFor(() => {
        const stakeButtons = screen.getAllByText('Stake');
        fireEvent.click(stakeButtons[0]);
      });

      await waitFor(() => {
        const input = screen.getByPlaceholderText('0.00');
        fireEvent.change(input, { target: { value: '100' } });
      });

      const confirmButton = screen.getByText('Confirm stake');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(confirmButton).not.toBeDisabled();
      });
    });
  });

  describe('Amount Input Validation', () => {
    it('should disable confirm button when amount is empty', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt(0),
        pendingRewards: BigInt(0),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const stakingTab = screen.getByTestId('tab-trigger-staking');
        fireEvent.click(stakingTab);
      });

      await waitFor(() => {
        const stakeButtons = screen.getAllByText('Stake');
        fireEvent.click(stakeButtons[0]);
      });

      await waitFor(() => {
        const confirmButton = screen.getByText('Confirm stake');
        expect(confirmButton).toBeDisabled();
      });
    });

    it('should enable confirm button when valid amount entered', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt(0),
        pendingRewards: BigInt(0),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const stakingTab = screen.getByTestId('tab-trigger-staking');
        fireEvent.click(stakingTab);
      });

      await waitFor(() => {
        const stakeButtons = screen.getAllByText('Stake');
        fireEvent.click(stakeButtons[0]);
      });

      await waitFor(() => {
        const input = screen.getByPlaceholderText('0.00');
        fireEvent.change(input, { target: { value: '10' } });
      });

      const confirmButton = screen.getByText('Confirm stake');
      expect(confirmButton).not.toBeDisabled();
    });

    it('should show minimum stake requirement in modal', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt(0),
        pendingRewards: BigInt(0),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const stakingTab = screen.getByTestId('tab-trigger-staking');
        fireEvent.click(stakingTab);
      });

      await waitFor(() => {
        const stakeButtons = screen.getAllByText('Stake');
        fireEvent.click(stakeButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByText(/Minimum: 1.00/)).toBeInTheDocument();
      });
    });

    it('should accept decimal amounts', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt(0),
        pendingRewards: BigInt(0),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const stakingTab = screen.getByTestId('tab-trigger-staking');
        fireEvent.click(stakingTab);
      });

      await waitFor(() => {
        const stakeButtons = screen.getAllByText('Stake');
        fireEvent.click(stakeButtons[0]);
      });

      await waitFor(() => {
        const input = screen.getByPlaceholderText('0.00');
        fireEvent.change(input, { target: { value: '10.5' } });
        expect(input.value).toBe('10.5');
      });
    });
  });

  describe('Quick Actions', () => {
    it('should render quick actions section', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt(0),
        pendingRewards: BigInt(0),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      });
    });

    it('should have Stake CRYB quick action', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt(0),
        pendingRewards: BigInt(0),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Stake CRYB')).toBeInTheDocument();
      });
    });

    it('should have View Pools quick action', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt(0),
        pendingRewards: BigInt(0),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('View Pools')).toBeInTheDocument();
      });
    });

    it('should have Farm LP quick action', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt(0),
        pendingRewards: BigInt(0),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Farm LP')).toBeInTheDocument();
      });
    });

    it('should disable Claim All when no rewards', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt('5000000000000000000'),
        pendingRewards: BigInt(0),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const claimButton = screen.getByText('Claim All');
        expect(claimButton).toBeDisabled();
      });
    });
  });

  describe('Data Refresh', () => {
    it('should refresh data when refresh button clicked', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt(0),
        pendingRewards: BigInt(0),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument();
      });

      mockContract.getUserStakeInfo.mockClear();
      mockContract.getUserFarmInfo.mockClear();
      mockContract.getTotalValueLocked.mockClear();

      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockContract.getUserStakeInfo).toHaveBeenCalled();
        expect(mockContract.getUserFarmInfo).toHaveBeenCalled();
        expect(mockContract.getTotalValueLocked).toHaveBeenCalled();
      });
    });

    it('should refresh data after successful transaction', async () => {
      jest.useFakeTimers();
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt(0),
        pendingRewards: BigInt(0),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });
      mockContract.stakeInPool.mockResolvedValue('0xtxhash');

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const stakingTab = screen.getByTestId('tab-trigger-staking');
        fireEvent.click(stakingTab);
      });

      await waitFor(() => {
        const stakeButtons = screen.getAllByText('Stake');
        fireEvent.click(stakeButtons[0]);
      });

      await waitFor(() => {
        const input = screen.getByPlaceholderText('0.00');
        fireEvent.change(input, { target: { value: '100' } });
      });

      mockContract.getUserStakeInfo.mockClear();
      mockContract.getUserFarmInfo.mockClear();
      mockContract.getTotalValueLocked.mockClear();

      const confirmButton = screen.getByText('Confirm stake');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockContract.stakeInPool).toHaveBeenCalled();
      });

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(mockContract.getUserStakeInfo).toHaveBeenCalled();
      });

      jest.useRealTimers();
    });
  });

  describe('Modal Functionality', () => {
    it('should close modal when cancel button clicked', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt(0),
        pendingRewards: BigInt(0),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const stakingTab = screen.getByTestId('tab-trigger-staking');
        fireEvent.click(stakingTab);
      });

      await waitFor(() => {
        const stakeButtons = screen.getAllByText('Stake');
        fireEvent.click(stakeButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByTestId('dialog-content')).not.toBeInTheDocument();
      });
    });

    it('should clear amount input when modal reopened', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt(0),
        pendingRewards: BigInt(0),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });
      mockContract.stakeInPool.mockResolvedValue('0xtxhash');

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const stakingTab = screen.getByTestId('tab-trigger-staking');
        fireEvent.click(stakingTab);
      });

      await waitFor(() => {
        const stakeButtons = screen.getAllByText('Stake');
        fireEvent.click(stakeButtons[0]);
      });

      await waitFor(() => {
        const input = screen.getByPlaceholderText('0.00');
        fireEvent.change(input, { target: { value: '100' } });
      });

      const confirmButton = screen.getByText('Confirm stake');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.queryByTestId('dialog-content')).not.toBeInTheDocument();
      });

      await waitFor(() => {
        const stakeButtons = screen.getAllByText('Stake');
        fireEvent.click(stakeButtons[0]);
      });

      await waitFor(() => {
        const input = screen.getByPlaceholderText('0.00');
        expect(input.value).toBe('');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper button labels', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt(0),
        pendingRewards: BigInt(0),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
      });
    });

    it('should have proper input attributes', async () => {
      walletManager.isConnected = true;
      mockContract.getUserStakeInfo.mockResolvedValue({
        amount: BigInt(0),
        pendingRewards: BigInt(0),
        stakeTime: Date.now(),
      });
      mockContract.getUserFarmInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        lastHarvestTime: Date.now(),
      });
      mockContract.getTotalValueLocked.mockResolvedValue({
        totalValueUSD: 1000000,
        totalStaked: BigInt('1000000000000000000000'),
        totalFarmed: BigInt('500000000000000000000'),
      });

      render(<YieldFarmingDashboard />);

      await waitFor(() => {
        const stakingTab = screen.getByTestId('tab-trigger-staking');
        fireEvent.click(stakingTab);
      });

      await waitFor(() => {
        const stakeButtons = screen.getAllByText('Stake');
        fireEvent.click(stakeButtons[0]);
      });

      await waitFor(() => {
        const input = screen.getByPlaceholderText('0.00');
        expect(input).toHaveAttribute('type', 'number');
        expect(input).toHaveAttribute('step', '0.01');
        expect(input).toHaveAttribute('min', '0');
      });
    });
  });
});

export default connectButton
