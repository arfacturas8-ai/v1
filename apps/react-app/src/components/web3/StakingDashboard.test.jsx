import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import StakingDashboard from './StakingDashboard';
import { getCRYBTokenContract, ACCESS_LEVELS } from '../../lib/contracts/cryb-contracts.js';
import { walletManager } from '../../lib/web3/WalletManager.js';
import { transactionManager } from '../../lib/web3/TransactionManager.js';

// Mock dependencies
vi.mock('../../lib/contracts/cryb-contracts.js', () => ({
  getCRYBTokenContract: vi.fn(),
  ACCESS_LEVELS: ['None', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond']
}));

vi.mock('../../lib/web3/WalletManager.js', () => ({
  walletManager: {
    isConnected: false,
    account: null,
    currentChainId: 1,
    connect: vi.fn(),
    on: vi.fn(),
    off: vi.fn()
  }
}));

vi.mock('../../lib/web3/TransactionManager.js', () => ({
  transactionManager: {
    executeTransaction: vi.fn()
  }
}));

vi.mock('@radix-ui/themes', () => ({
  Card: ({ children, className }) => <div data-testid="card" className={className}>{children}</div>,
  Button: ({ children, onClick, disabled, className, variant, color }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-variant={variant}
      data-color={color}
      data-testid="button"
    >
      {children}
    </button>
  ),
  Input: ({ value, onChange, type, placeholder }) => (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      data-testid="input"
    />
  ),
  Badge: ({ children, color }) => <span data-testid="badge" data-color={color}>{children}</span>,
  Progress: ({ value, className }) => (
    <div data-testid="progress" data-value={value} className={className} />
  ),
  Dialog: ({ open, onOpenChange, children }) => (
    open ? <div data-testid="dialog" onClick={() => onOpenChange(false)}>{children}</div> : null
  ),
  Tabs: ({ children }) => <div data-testid="tabs">{children}</div>
}));

vi.mock('lucide-react', () => ({
  Coins: () => <div data-testid="coins-icon">Coins</div>,
  TrendingUp: () => <div data-testid="trending-up-icon">TrendingUp</div>,
  Shield: () => <div data-testid="shield-icon">Shield</div>,
  Timer: () => <div data-testid="timer-icon">Timer</div>,
  AlertTriangle: () => <div data-testid="alert-triangle-icon">AlertTriangle</div>,
  CheckCircle: () => <div data-testid="check-circle-icon">CheckCircle</div>
}));

describe('StakingDashboard', () => {
  let mockCrybContract;

  beforeEach(() => {
    vi.clearAllMocks();

    mockCrybContract = {
      address: '0x123',
      abi: [
        { name: 'stake' },
        { name: 'unstake' },
        { name: 'claimRewards' }
      ],
      getBalance: vi.fn().mockResolvedValue(BigInt('1000000000000000000000')),
      getStakingInfo: vi.fn().mockResolvedValue({
        stakedAmount: BigInt('500000000000000000000'),
        pendingRewards: BigInt('50000000000000000000'),
        accessLevel: 2,
        stakingStart: Date.now() - (5 * 24 * 60 * 60 * 1000)
      }),
      getTokenInfo: vi.fn().mockResolvedValue({
        name: 'CRYB',
        symbol: 'CRYB'
      }),
      parseTokenAmount: vi.fn((amount) => BigInt(Number(amount) * 10 ** 18)),
      formatTokenAmount: vi.fn((amount) => (Number(amount) / 10 ** 18).toFixed(2))
    };

    getCRYBTokenContract.mockReturnValue(mockCrybContract);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Dashboard Rendering', () => {
    it('should render connect wallet card when wallet is not connected', () => {
      walletManager.isConnected = false;

      render(<StakingDashboard />);

      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
      expect(screen.getByText('Connect your wallet to start staking CRYB tokens')).toBeInTheDocument();
    });

    it('should show connect button when wallet is not connected', () => {
      walletManager.isConnected = false;

      render(<StakingDashboard />);

      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      expect(connectButton).toBeInTheDocument();
    });

    it('should call walletManager.connect when connect button is clicked', () => {
      walletManager.isConnected = false;

      render(<StakingDashboard />);

      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      fireEvent.click(connectButton);

      expect(walletManager.connect).toHaveBeenCalled();
    });

    it('should render shield icon in connect wallet state', () => {
      walletManager.isConnected = false;

      render(<StakingDashboard />);

      expect(screen.getByTestId('shield-icon')).toBeInTheDocument();
    });

    it('should show loading state initially when wallet is connected', () => {
      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      render(<StakingDashboard />);

      const loadingElements = screen.getAllByTestId('card');
      expect(loadingElements[0]).toBeInTheDocument();
    });

    it('should display loading skeleton with correct structure', () => {
      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      render(<StakingDashboard />);

      const loadingCard = screen.getAllByTestId('card')[0];
      expect(loadingCard.querySelector('.')).toBeInTheDocument();
    });
  });

  describe('Staking Stats Display', () => {
    beforeEach(async () => {
      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      render(<StakingDashboard />);

      await waitFor(() => {
        expect(mockCrybContract.getBalance).toHaveBeenCalled();
      });
    });

    it('should display total balance card', async () => {
      await waitFor(() => {
        expect(screen.getByText('Total Balance')).toBeInTheDocument();
        expect(screen.getByText(/1000\.00 CRYB/)).toBeInTheDocument();
      });
    });

    it('should display staked amount card', async () => {
      await waitFor(() => {
        expect(screen.getByText('Staked')).toBeInTheDocument();
        expect(screen.getByText(/500\.00 CRYB/)).toBeInTheDocument();
      });
    });

    it('should display rewards card', async () => {
      await waitFor(() => {
        expect(screen.getByText('Rewards')).toBeInTheDocument();
        expect(screen.getByText(/50\.00 CRYB/)).toBeInTheDocument();
      });
    });

    it('should display access level card', async () => {
      await waitFor(() => {
        expect(screen.getByText('Access Level')).toBeInTheDocument();
        expect(screen.getByText('Silver')).toBeInTheDocument();
      });
    });

    it('should show correct icons for each stat card', async () => {
      await waitFor(() => {
        expect(screen.getAllByTestId('coins-icon').length).toBeGreaterThan(0);
        expect(screen.getAllByTestId('shield-icon').length).toBeGreaterThan(0);
        expect(screen.getAllByTestId('trending-up-icon').length).toBeGreaterThan(0);
      });
    });

    it('should format balance with correct decimals', async () => {
      mockCrybContract.formatTokenAmount.mockReturnValue('1234.56');
      mockCrybContract.getBalance.mockResolvedValue(BigInt('1234560000000000000000'));

      const { rerender } = render(<StakingDashboard />);
      rerender(<StakingDashboard />);

      await waitFor(() => {
        expect(mockCrybContract.formatTokenAmount).toHaveBeenCalled();
      });
    });

    it('should display current APR', async () => {
      await waitFor(() => {
        expect(screen.getByText('12.5%')).toBeInTheDocument();
      });
    });

    it('should display staking duration', async () => {
      await waitFor(() => {
        expect(screen.getByText(/5 days/)).toBeInTheDocument();
      });
    });

    it('should calculate and display annual yield', async () => {
      await waitFor(() => {
        expect(screen.getByText(/Annual Yield/)).toBeInTheDocument();
      });
    });
  });

  describe('Available Balance', () => {
    it('should load balance from contract on mount', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      render(<StakingDashboard />);

      await waitFor(() => {
        expect(mockCrybContract.getBalance).toHaveBeenCalledWith('0xabc');
      });
    });

    it('should display zero balance correctly', async () => {
      mockCrybContract.getBalance.mockResolvedValue(BigInt(0));
      mockCrybContract.formatTokenAmount.mockReturnValue('0.00');

      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      render(<StakingDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/0\.00 CRYB/)).toBeInTheDocument();
      });
    });

    it('should disable stake button when balance is zero', async () => {
      mockCrybContract.getBalance.mockResolvedValue(BigInt(0));

      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      render(<StakingDashboard />);

      await waitFor(() => {
        const stakeButtons = screen.getAllByRole('button', { name: /stake/i });
        const mainStakeButton = stakeButtons.find(btn => !btn.textContent.includes('Unstake'));
        expect(mainStakeButton).toBeDisabled();
      });
    });

    it('should show available balance in stake dialog', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      render(<StakingDashboard />);

      await waitFor(() => {
        const stakeButtons = screen.getAllByRole('button', { name: /stake/i });
        const mainStakeButton = stakeButtons.find(btn => !btn.textContent.includes('Unstake'));
        fireEvent.click(mainStakeButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/Available:/)).toBeInTheDocument();
      });
    });

    it('should refresh balance after account change', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      let accountChangedCallback;
      walletManager.on.mockImplementation((event, callback) => {
        if (event === 'accountChanged') {
          accountChangedCallback = callback;
        }
      });

      render(<StakingDashboard />);

      await waitFor(() => {
        expect(mockCrybContract.getBalance).toHaveBeenCalled();
      });

      mockCrybContract.getBalance.mockClear();
      walletManager.account = '0xdef';
      accountChangedCallback();

      await waitFor(() => {
        expect(mockCrybContract.getBalance).toHaveBeenCalled();
      });
    });
  });

  describe('Staked Amount', () => {
    it('should load staked amount from contract', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      render(<StakingDashboard />);

      await waitFor(() => {
        expect(mockCrybContract.getStakingInfo).toHaveBeenCalledWith('0xabc');
      });
    });

    it('should display staked amount correctly', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      render(<StakingDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/500\.00 CRYB/)).toBeInTheDocument();
      });
    });

    it('should disable unstake button when staked amount is zero', async () => {
      mockCrybContract.getStakingInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        accessLevel: 0,
        stakingStart: null
      });

      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      render(<StakingDashboard />);

      await waitFor(() => {
        const unstakeButton = screen.getByRole('button', { name: /^Unstake$/ });
        expect(unstakeButton).toBeDisabled();
      });
    });

    it('should show staked amount in unstake dialog', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      render(<StakingDashboard />);

      await waitFor(() => {
        const unstakeButton = screen.getByRole('button', { name: /^Unstake$/ });
        fireEvent.click(unstakeButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/Staked:/)).toBeInTheDocument();
      });
    });

    it('should calculate user share of total staked', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      render(<StakingDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Your Share/)).toBeInTheDocument();
      });
    });
  });

  describe('Rewards Earned', () => {
    it('should display pending rewards', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      render(<StakingDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/50\.00 CRYB/)).toBeInTheDocument();
      });
    });

    it('should show claim button when rewards are available', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      render(<StakingDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Claim/i })).toBeInTheDocument();
      });
    });

    it('should not show claim button when no rewards', async () => {
      mockCrybContract.getStakingInfo.mockResolvedValue({
        stakedAmount: BigInt('500000000000000000000'),
        pendingRewards: BigInt(0),
        accessLevel: 2,
        stakingStart: Date.now()
      });

      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      render(<StakingDashboard />);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Claim/i })).not.toBeInTheDocument();
      });
    });

    it('should display reward amount on claim button', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      render(<StakingDashboard />);

      await waitFor(() => {
        const claimButton = screen.getByRole('button', { name: /Claim.*50\.00 CRYB/i });
        expect(claimButton).toBeInTheDocument();
      });
    });
  });

  describe('Stake Tokens', () => {
    beforeEach(async () => {
      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      transactionManager.executeTransaction.mockResolvedValue({
        hash: '0xtxhash123',
        wait: vi.fn().mockResolvedValue({ status: 1 })
      });
    });

    it('should open stake dialog when stake button clicked', async () => {
      render(<StakingDashboard />);

      await waitFor(() => {
        const stakeButtons = screen.getAllByRole('button', { name: /stake/i });
        const mainStakeButton = stakeButtons.find(btn => !btn.textContent.includes('Unstake'));
        fireEvent.click(mainStakeButton);
      });

      expect(screen.getByText('Stake CRYB Tokens')).toBeInTheDocument();
    });

    it('should allow entering stake amount', async () => {
      render(<StakingDashboard />);

      await waitFor(() => {
        const stakeButtons = screen.getAllByRole('button', { name: /stake/i });
        const mainStakeButton = stakeButtons.find(btn => !btn.textContent.includes('Unstake'));
        fireEvent.click(mainStakeButton);
      });

      const input = screen.getByPlaceholderText('0.0');
      fireEvent.change(input, { target: { value: '100' } });

      expect(input.value).toBe('100');
    });

    it('should disable stake button in dialog when amount is empty', async () => {
      render(<StakingDashboard />);

      await waitFor(() => {
        const stakeButtons = screen.getAllByRole('button', { name: /stake/i });
        const mainStakeButton = stakeButtons.find(btn => !btn.textContent.includes('Unstake'));
        fireEvent.click(mainStakeButton);
      });

      await waitFor(() => {
        const dialogStakeButton = screen.getByRole('button', { name: /^Stake$/ });
        expect(dialogStakeButton).toBeDisabled();
      });
    });

    it('should disable stake button when amount is zero', async () => {
      render(<StakingDashboard />);

      await waitFor(() => {
        const stakeButtons = screen.getAllByRole('button', { name: /stake/i });
        const mainStakeButton = stakeButtons.find(btn => !btn.textContent.includes('Unstake'));
        fireEvent.click(mainStakeButton);
      });

      const input = screen.getByPlaceholderText('0.0');
      fireEvent.change(input, { target: { value: '0' } });

      const dialogStakeButton = screen.getByRole('button', { name: /^Stake$/ });
      expect(dialogStakeButton).toBeDisabled();
    });

    it('should disable stake button when amount is negative', async () => {
      render(<StakingDashboard />);

      await waitFor(() => {
        const stakeButtons = screen.getAllByRole('button', { name: /stake/i });
        const mainStakeButton = stakeButtons.find(btn => !btn.textContent.includes('Unstake'));
        fireEvent.click(mainStakeButton);
      });

      const input = screen.getByPlaceholderText('0.0');
      fireEvent.change(input, { target: { value: '-10' } });

      const dialogStakeButton = screen.getByRole('button', { name: /^Stake$/ });
      expect(dialogStakeButton).toBeDisabled();
    });

    it('should execute stake transaction when confirmed', async () => {
      render(<StakingDashboard />);

      await waitFor(() => {
        const stakeButtons = screen.getAllByRole('button', { name: /stake/i });
        const mainStakeButton = stakeButtons.find(btn => !btn.textContent.includes('Unstake'));
        fireEvent.click(mainStakeButton);
      });

      const input = screen.getByPlaceholderText('0.0');
      fireEvent.change(input, { target: { value: '100' } });

      const dialogStakeButton = screen.getByRole('button', { name: /^Stake$/ });
      fireEvent.click(dialogStakeButton);

      await waitFor(() => {
        expect(transactionManager.executeTransaction).toHaveBeenCalled();
      });
    });

    it('should parse stake amount correctly', async () => {
      render(<StakingDashboard />);

      await waitFor(() => {
        const stakeButtons = screen.getAllByRole('button', { name: /stake/i });
        const mainStakeButton = stakeButtons.find(btn => !btn.textContent.includes('Unstake'));
        fireEvent.click(mainStakeButton);
      });

      const input = screen.getByPlaceholderText('0.0');
      fireEvent.change(input, { target: { value: '100' } });

      const dialogStakeButton = screen.getByRole('button', { name: /^Stake$/ });
      fireEvent.click(dialogStakeButton);

      await waitFor(() => {
        expect(mockCrybContract.parseTokenAmount).toHaveBeenCalledWith('100');
      });
    });

    it('should show error when staking amount exceeds balance', async () => {
      mockCrybContract.parseTokenAmount.mockReturnValue(BigInt('2000000000000000000000'));

      render(<StakingDashboard />);

      await waitFor(() => {
        const stakeButtons = screen.getAllByRole('button', { name: /stake/i });
        const mainStakeButton = stakeButtons.find(btn => !btn.textContent.includes('Unstake'));
        fireEvent.click(mainStakeButton);
      });

      const input = screen.getByPlaceholderText('0.0');
      fireEvent.change(input, { target: { value: '2000' } });

      const dialogStakeButton = screen.getByRole('button', { name: /^Stake$/ });
      fireEvent.click(dialogStakeButton);

      await waitFor(() => {
        expect(transactionManager.executeTransaction).not.toHaveBeenCalled();
      });
    });

    it('should show staking loading state', async () => {
      transactionManager.executeTransaction.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ hash: '0xtxhash' }), 1000))
      );

      render(<StakingDashboard />);

      await waitFor(() => {
        const stakeButtons = screen.getAllByRole('button', { name: /stake/i });
        const mainStakeButton = stakeButtons.find(btn => !btn.textContent.includes('Unstake'));
        fireEvent.click(mainStakeButton);
      });

      const input = screen.getByPlaceholderText('0.0');
      fireEvent.change(input, { target: { value: '100' } });

      const dialogStakeButton = screen.getByRole('button', { name: /^Stake$/ });
      fireEvent.click(dialogStakeButton);

      await waitFor(() => {
        expect(screen.getByText('Staking...')).toBeInTheDocument();
      });
    });

    it('should close dialog after successful stake', async () => {
      render(<StakingDashboard />);

      await waitFor(() => {
        const stakeButtons = screen.getAllByRole('button', { name: /stake/i });
        const mainStakeButton = stakeButtons.find(btn => !btn.textContent.includes('Unstake'));
        fireEvent.click(mainStakeButton);
      });

      const input = screen.getByPlaceholderText('0.0');
      fireEvent.change(input, { target: { value: '100' } });

      const dialogStakeButton = screen.getByRole('button', { name: /^Stake$/ });
      fireEvent.click(dialogStakeButton);

      await waitFor(() => {
        expect(screen.queryByText('Stake CRYB Tokens')).not.toBeInTheDocument();
      });
    });

    it('should reset stake amount after successful transaction', async () => {
      render(<StakingDashboard />);

      await waitFor(() => {
        const stakeButtons = screen.getAllByRole('button', { name: /stake/i });
        const mainStakeButton = stakeButtons.find(btn => !btn.textContent.includes('Unstake'));
        fireEvent.click(mainStakeButton);
      });

      const input = screen.getByPlaceholderText('0.0');
      fireEvent.change(input, { target: { value: '100' } });

      const dialogStakeButton = screen.getByRole('button', { name: /^Stake$/ });
      fireEvent.click(dialogStakeButton);

      await waitFor(() => {
        expect(transactionManager.executeTransaction).toHaveBeenCalled();
      });

      await waitFor(() => {
        const stakeButtons = screen.getAllByRole('button', { name: /stake/i });
        const mainStakeButton = stakeButtons.find(btn => !btn.textContent.includes('Unstake'));
        fireEvent.click(mainStakeButton);
      });

      const newInput = screen.getByPlaceholderText('0.0');
      expect(newInput.value).toBe('');
    });

    it('should reload staking data after stake', async () => {
      render(<StakingDashboard />);

      await waitFor(() => {
        expect(mockCrybContract.getStakingInfo).toHaveBeenCalled();
      });

      mockCrybContract.getStakingInfo.mockClear();

      await waitFor(() => {
        const stakeButtons = screen.getAllByRole('button', { name: /stake/i });
        const mainStakeButton = stakeButtons.find(btn => !btn.textContent.includes('Unstake'));
        fireEvent.click(mainStakeButton);
      });

      const input = screen.getByPlaceholderText('0.0');
      fireEvent.change(input, { target: { value: '100' } });

      const dialogStakeButton = screen.getByRole('button', { name: /^Stake$/ });
      fireEvent.click(dialogStakeButton);

      await waitFor(() => {
        expect(mockCrybContract.getStakingInfo).toHaveBeenCalled();
      });
    });

    it('should show warning about unstaking period', async () => {
      render(<StakingDashboard />);

      await waitFor(() => {
        const stakeButtons = screen.getAllByRole('button', { name: /stake/i });
        const mainStakeButton = stakeButtons.find(btn => !btn.textContent.includes('Unstake'));
        fireEvent.click(mainStakeButton);
      });

      expect(screen.getByText(/cannot be withdrawn immediately/i)).toBeInTheDocument();
    });

    it('should add transaction to history', async () => {
      render(<StakingDashboard />);

      await waitFor(() => {
        const stakeButtons = screen.getAllByRole('button', { name: /stake/i });
        const mainStakeButton = stakeButtons.find(btn => !btn.textContent.includes('Unstake'));
        fireEvent.click(mainStakeButton);
      });

      const input = screen.getByPlaceholderText('0.0');
      fireEvent.change(input, { target: { value: '100' } });

      const dialogStakeButton = screen.getByRole('button', { name: /^Stake$/ });
      fireEvent.click(dialogStakeButton);

      await waitFor(() => {
        expect(screen.getByText('Recent Transactions')).toBeInTheDocument();
      });
    });

    it('should close dialog when cancel button clicked', async () => {
      render(<StakingDashboard />);

      await waitFor(() => {
        const stakeButtons = screen.getAllByRole('button', { name: /stake/i });
        const mainStakeButton = stakeButtons.find(btn => !btn.textContent.includes('Unstake'));
        fireEvent.click(mainStakeButton);
      });

      const cancelButton = screen.getByRole('button', { name: /Cancel/ });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Stake CRYB Tokens')).not.toBeInTheDocument();
      });
    });
  });

  describe('Unstake Tokens', () => {
    beforeEach(async () => {
      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      transactionManager.executeTransaction.mockResolvedValue({
        hash: '0xtxhash456',
        wait: vi.fn().mockResolvedValue({ status: 1 })
      });
    });

    it('should open unstake dialog when unstake button clicked', async () => {
      render(<StakingDashboard />);

      await waitFor(() => {
        const unstakeButton = screen.getByRole('button', { name: /^Unstake$/ });
        fireEvent.click(unstakeButton);
      });

      expect(screen.getByText('Unstake CRYB Tokens')).toBeInTheDocument();
    });

    it('should allow entering unstake amount', async () => {
      render(<StakingDashboard />);

      await waitFor(() => {
        const unstakeButton = screen.getByRole('button', { name: /^Unstake$/ });
        fireEvent.click(unstakeButton);
      });

      const input = screen.getByPlaceholderText('0.0');
      fireEvent.change(input, { target: { value: '50' } });

      expect(input.value).toBe('50');
    });

    it('should disable unstake button in dialog when amount is empty', async () => {
      render(<StakingDashboard />);

      await waitFor(() => {
        const unstakeButton = screen.getByRole('button', { name: /^Unstake$/ });
        fireEvent.click(unstakeButton);
      });

      await waitFor(() => {
        const dialogUnstakeButton = screen.getAllByRole('button', { name: /Unstake/ })[1];
        expect(dialogUnstakeButton).toBeDisabled();
      });
    });

    it('should execute unstake transaction when confirmed', async () => {
      render(<StakingDashboard />);

      await waitFor(() => {
        const unstakeButton = screen.getByRole('button', { name: /^Unstake$/ });
        fireEvent.click(unstakeButton);
      });

      const input = screen.getByPlaceholderText('0.0');
      fireEvent.change(input, { target: { value: '50' } });

      const dialogUnstakeButton = screen.getAllByRole('button', { name: /Unstake/ })[1];
      fireEvent.click(dialogUnstakeButton);

      await waitFor(() => {
        expect(transactionManager.executeTransaction).toHaveBeenCalled();
      });
    });

    it('should show error when unstaking amount exceeds staked balance', async () => {
      mockCrybContract.parseTokenAmount.mockReturnValue(BigInt('600000000000000000000'));

      render(<StakingDashboard />);

      await waitFor(() => {
        const unstakeButton = screen.getByRole('button', { name: /^Unstake$/ });
        fireEvent.click(unstakeButton);
      });

      const input = screen.getByPlaceholderText('0.0');
      fireEvent.change(input, { target: { value: '600' } });

      const dialogUnstakeButton = screen.getAllByRole('button', { name: /Unstake/ })[1];
      fireEvent.click(dialogUnstakeButton);

      await waitFor(() => {
        expect(transactionManager.executeTransaction).not.toHaveBeenCalled();
      });
    });

    it('should show unstaking loading state', async () => {
      transactionManager.executeTransaction.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ hash: '0xtxhash' }), 1000))
      );

      render(<StakingDashboard />);

      await waitFor(() => {
        const unstakeButton = screen.getByRole('button', { name: /^Unstake$/ });
        fireEvent.click(unstakeButton);
      });

      const input = screen.getByPlaceholderText('0.0');
      fireEvent.change(input, { target: { value: '50' } });

      const dialogUnstakeButton = screen.getAllByRole('button', { name: /Unstake/ })[1];
      fireEvent.click(dialogUnstakeButton);

      await waitFor(() => {
        expect(screen.getByText('Unstaking...')).toBeInTheDocument();
      });
    });

    it('should close dialog after successful unstake', async () => {
      render(<StakingDashboard />);

      await waitFor(() => {
        const unstakeButton = screen.getByRole('button', { name: /^Unstake$/ });
        fireEvent.click(unstakeButton);
      });

      const input = screen.getByPlaceholderText('0.0');
      fireEvent.change(input, { target: { value: '50' } });

      const dialogUnstakeButton = screen.getAllByRole('button', { name: /Unstake/ })[1];
      fireEvent.click(dialogUnstakeButton);

      await waitFor(() => {
        expect(screen.queryByText('Unstake CRYB Tokens')).not.toBeInTheDocument();
      });
    });

    it('should reset unstake amount after successful transaction', async () => {
      render(<StakingDashboard />);

      await waitFor(() => {
        const unstakeButton = screen.getByRole('button', { name: /^Unstake$/ });
        fireEvent.click(unstakeButton);
      });

      const input = screen.getByPlaceholderText('0.0');
      fireEvent.change(input, { target: { value: '50' } });

      const dialogUnstakeButton = screen.getAllByRole('button', { name: /Unstake/ })[1];
      fireEvent.click(dialogUnstakeButton);

      await waitFor(() => {
        expect(transactionManager.executeTransaction).toHaveBeenCalled();
      });

      await waitFor(() => {
        const unstakeButton = screen.getByRole('button', { name: /^Unstake$/ });
        fireEvent.click(unstakeButton);
      });

      const newInput = screen.getByPlaceholderText('0.0');
      expect(newInput.value).toBe('');
    });

    it('should reload staking data after unstake', async () => {
      render(<StakingDashboard />);

      await waitFor(() => {
        expect(mockCrybContract.getStakingInfo).toHaveBeenCalled();
      });

      mockCrybContract.getStakingInfo.mockClear();

      await waitFor(() => {
        const unstakeButton = screen.getByRole('button', { name: /^Unstake$/ });
        fireEvent.click(unstakeButton);
      });

      const input = screen.getByPlaceholderText('0.0');
      fireEvent.change(input, { target: { value: '50' } });

      const dialogUnstakeButton = screen.getAllByRole('button', { name: /Unstake/ })[1];
      fireEvent.click(dialogUnstakeButton);

      await waitFor(() => {
        expect(mockCrybContract.getStakingInfo).toHaveBeenCalled();
      });
    });

    it('should show info about claiming rewards when unstaking', async () => {
      render(<StakingDashboard />);

      await waitFor(() => {
        const unstakeButton = screen.getByRole('button', { name: /^Unstake$/ });
        fireEvent.click(unstakeButton);
      });

      expect(screen.getByText(/also claim any pending rewards/i)).toBeInTheDocument();
    });

    it('should add unstake transaction to history', async () => {
      render(<StakingDashboard />);

      await waitFor(() => {
        const unstakeButton = screen.getByRole('button', { name: /^Unstake$/ });
        fireEvent.click(unstakeButton);
      });

      const input = screen.getByPlaceholderText('0.0');
      fireEvent.change(input, { target: { value: '50' } });

      const dialogUnstakeButton = screen.getAllByRole('button', { name: /Unstake/ })[1];
      fireEvent.click(dialogUnstakeButton);

      await waitFor(() => {
        expect(screen.getByText('Recent Transactions')).toBeInTheDocument();
      });
    });
  });

  describe('Claim Rewards', () => {
    beforeEach(async () => {
      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      transactionManager.executeTransaction.mockResolvedValue({
        hash: '0xtxhash789',
        wait: vi.fn().mockResolvedValue({ status: 1 })
      });
    });

    it('should execute claim transaction when button clicked', async () => {
      render(<StakingDashboard />);

      await waitFor(() => {
        const claimButton = screen.getByRole('button', { name: /Claim/i });
        fireEvent.click(claimButton);
      });

      await waitFor(() => {
        expect(transactionManager.executeTransaction).toHaveBeenCalled();
      });
    });

    it('should show claiming loading state', async () => {
      transactionManager.executeTransaction.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ hash: '0xtxhash' }), 1000))
      );

      render(<StakingDashboard />);

      await waitFor(() => {
        const claimButton = screen.getByRole('button', { name: /Claim/i });
        fireEvent.click(claimButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Claiming...')).toBeInTheDocument();
      });
    });

    it('should disable claim button while claiming', async () => {
      transactionManager.executeTransaction.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ hash: '0xtxhash' }), 1000))
      );

      render(<StakingDashboard />);

      await waitFor(() => {
        const claimButton = screen.getByRole('button', { name: /Claim/i });
        fireEvent.click(claimButton);
      });

      await waitFor(() => {
        const claimButton = screen.getByRole('button', { name: /Claiming/i });
        expect(claimButton).toBeDisabled();
      });
    });

    it('should reload staking data after claim', async () => {
      render(<StakingDashboard />);

      await waitFor(() => {
        expect(mockCrybContract.getStakingInfo).toHaveBeenCalled();
      });

      mockCrybContract.getStakingInfo.mockClear();

      await waitFor(() => {
        const claimButton = screen.getByRole('button', { name: /Claim/i });
        fireEvent.click(claimButton);
      });

      await waitFor(() => {
        expect(mockCrybContract.getStakingInfo).toHaveBeenCalled();
      });
    });

    it('should add claim transaction to history', async () => {
      render(<StakingDashboard />);

      await waitFor(() => {
        const claimButton = screen.getByRole('button', { name: /Claim/i });
        fireEvent.click(claimButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Recent Transactions')).toBeInTheDocument();
      });
    });

    it('should not claim when wallet is not connected', async () => {
      walletManager.isConnected = false;

      render(<StakingDashboard />);

      expect(screen.queryByRole('button', { name: /Claim/i })).not.toBeInTheDocument();
    });

    it('should not claim when rewards are zero', async () => {
      mockCrybContract.getStakingInfo.mockResolvedValue({
        stakedAmount: BigInt('500000000000000000000'),
        pendingRewards: BigInt(0),
        accessLevel: 2,
        stakingStart: Date.now()
      });

      render(<StakingDashboard />);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Claim/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('APY Display', () => {
    it('should display current APR percentage', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      render(<StakingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('12.5%')).toBeInTheDocument();
      });
    });

    it('should display APR label', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      render(<StakingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Current APR')).toBeInTheDocument();
      });
    });

    it('should calculate annual yield based on staked amount', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      render(<StakingDashboard />);

      await waitFor(() => {
        const annualYield = (500 * 12.5) / 100;
        expect(screen.getByText(`${annualYield.toFixed(2)} CRYB`)).toBeInTheDocument();
      });
    });

    it('should show zero annual yield when not staking', async () => {
      mockCrybContract.getStakingInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        accessLevel: 0,
        stakingStart: null
      });

      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      render(<StakingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('0.00 CRYB')).toBeInTheDocument();
      });
    });
  });

  describe('Staking History', () => {
    beforeEach(async () => {
      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      transactionManager.executeTransaction.mockResolvedValue({
        hash: '0xtxhash123',
        wait: vi.fn().mockResolvedValue({ status: 1 })
      });
    });

    it('should not show transaction history when empty', async () => {
      render(<StakingDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Recent Transactions')).not.toBeInTheDocument();
      });
    });

    it('should display transaction history after staking', async () => {
      render(<StakingDashboard />);

      await waitFor(() => {
        const stakeButtons = screen.getAllByRole('button', { name: /stake/i });
        const mainStakeButton = stakeButtons.find(btn => !btn.textContent.includes('Unstake'));
        fireEvent.click(mainStakeButton);
      });

      const input = screen.getByPlaceholderText('0.0');
      fireEvent.change(input, { target: { value: '100' } });

      const dialogStakeButton = screen.getByRole('button', { name: /^Stake$/ });
      fireEvent.click(dialogStakeButton);

      await waitFor(() => {
        expect(screen.getByText('Recent Transactions')).toBeInTheDocument();
      });
    });

    it('should show transaction type in history', async () => {
      render(<StakingDashboard />);

      await waitFor(() => {
        const stakeButtons = screen.getAllByRole('button', { name: /stake/i });
        const mainStakeButton = stakeButtons.find(btn => !btn.textContent.includes('Unstake'));
        fireEvent.click(mainStakeButton);
      });

      const input = screen.getByPlaceholderText('0.0');
      fireEvent.change(input, { target: { value: '100' } });

      const dialogStakeButton = screen.getByRole('button', { name: /^Stake$/ });
      fireEvent.click(dialogStakeButton);

      await waitFor(() => {
        expect(screen.getByText(/stake/i)).toBeInTheDocument();
      });
    });

    it('should show transaction timestamp', async () => {
      render(<StakingDashboard />);

      await waitFor(() => {
        const stakeButtons = screen.getAllByRole('button', { name: /stake/i });
        const mainStakeButton = stakeButtons.find(btn => !btn.textContent.includes('Unstake'));
        fireEvent.click(mainStakeButton);
      });

      const input = screen.getByPlaceholderText('0.0');
      fireEvent.change(input, { target: { value: '100' } });

      const dialogStakeButton = screen.getByRole('button', { name: /^Stake$/ });
      fireEvent.click(dialogStakeButton);

      await waitFor(() => {
        const transactionElements = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/);
        expect(transactionElements.length).toBeGreaterThan(0);
      });
    });

    it('should limit displayed transactions to 5', async () => {
      const { rerender } = render(<StakingDashboard />);

      await waitFor(() => {
        expect(mockCrybContract.getBalance).toHaveBeenCalled();
      });

      for (let i = 0; i < 7; i++) {
        await waitFor(() => {
          const stakeButtons = screen.getAllByRole('button', { name: /stake/i });
          const mainStakeButton = stakeButtons.find(btn => !btn.textContent.includes('Unstake'));
          fireEvent.click(mainStakeButton);
        });

        const input = screen.getByPlaceholderText('0.0');
        fireEvent.change(input, { target: { value: '10' } });

        const dialogStakeButton = screen.getByRole('button', { name: /^Stake$/ });
        fireEvent.click(dialogStakeButton);

        await waitFor(() => {
          expect(transactionManager.executeTransaction).toHaveBeenCalled();
        });

        transactionManager.executeTransaction.mockClear();
      }

      rerender(<StakingDashboard />);
    });
  });

  describe('API Integration', () => {
    it('should call contract methods on component mount', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      render(<StakingDashboard />);

      await waitFor(() => {
        expect(mockCrybContract.getBalance).toHaveBeenCalled();
        expect(mockCrybContract.getStakingInfo).toHaveBeenCalled();
        expect(mockCrybContract.getTokenInfo).toHaveBeenCalled();
      });
    });

    it('should pass correct parameters to getBalance', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0xabc123';

      render(<StakingDashboard />);

      await waitFor(() => {
        expect(mockCrybContract.getBalance).toHaveBeenCalledWith('0xabc123');
      });
    });

    it('should pass correct parameters to getStakingInfo', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0xdef456';

      render(<StakingDashboard />);

      await waitFor(() => {
        expect(mockCrybContract.getStakingInfo).toHaveBeenCalledWith('0xdef456');
      });
    });

    it('should use correct chain ID when getting contract', () => {
      walletManager.currentChainId = 5;

      render(<StakingDashboard />);

      expect(getCRYBTokenContract).toHaveBeenCalledWith(5);
    });

    it('should default to chain ID 1 when not set', () => {
      walletManager.currentChainId = null;

      render(<StakingDashboard />);

      expect(getCRYBTokenContract).toHaveBeenCalledWith(1);
    });
  });

  describe('Loading States', () => {
    it('should show loading state on initial render', () => {
      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      render(<StakingDashboard />);

      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('should hide loading state after data loads', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      render(<StakingDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Total Balance')).toBeInTheDocument();
      });
    });

    it('should show loading when staking', async () => {
      transactionManager.executeTransaction.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ hash: '0xtxhash' }), 100))
      );

      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      render(<StakingDashboard />);

      await waitFor(() => {
        const stakeButtons = screen.getAllByRole('button', { name: /stake/i });
        const mainStakeButton = stakeButtons.find(btn => !btn.textContent.includes('Unstake'));
        fireEvent.click(mainStakeButton);
      });

      const input = screen.getByPlaceholderText('0.0');
      fireEvent.change(input, { target: { value: '100' } });

      const dialogStakeButton = screen.getByRole('button', { name: /^Stake$/ });
      fireEvent.click(dialogStakeButton);

      expect(screen.getByText('Staking...')).toBeInTheDocument();
    });

    it('should show loading when unstaking', async () => {
      transactionManager.executeTransaction.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ hash: '0xtxhash' }), 100))
      );

      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      render(<StakingDashboard />);

      await waitFor(() => {
        const unstakeButton = screen.getByRole('button', { name: /^Unstake$/ });
        fireEvent.click(unstakeButton);
      });

      const input = screen.getByPlaceholderText('0.0');
      fireEvent.change(input, { target: { value: '50' } });

      const dialogUnstakeButton = screen.getAllByRole('button', { name: /Unstake/ })[1];
      fireEvent.click(dialogUnstakeButton);

      expect(screen.getByText('Unstaking...')).toBeInTheDocument();
    });

    it('should show loading when claiming', async () => {
      transactionManager.executeTransaction.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ hash: '0xtxhash' }), 100))
      );

      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      render(<StakingDashboard />);

      await waitFor(() => {
        const claimButton = screen.getByRole('button', { name: /Claim/i });
        fireEvent.click(claimButton);
      });

      expect(screen.getByText('Claiming...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle getBalance error gracefully', async () => {
      mockCrybContract.getBalance.mockRejectedValue(new Error('Network error'));

      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<StakingDashboard />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to load staking data:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });

    it('should handle getStakingInfo error gracefully', async () => {
      mockCrybContract.getStakingInfo.mockRejectedValue(new Error('Contract error'));

      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<StakingDashboard />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });

    it('should handle stake transaction error', async () => {
      transactionManager.executeTransaction.mockRejectedValue(new Error('Transaction failed'));

      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<StakingDashboard />);

      await waitFor(() => {
        const stakeButtons = screen.getAllByRole('button', { name: /stake/i });
        const mainStakeButton = stakeButtons.find(btn => !btn.textContent.includes('Unstake'));
        fireEvent.click(mainStakeButton);
      });

      const input = screen.getByPlaceholderText('0.0');
      fireEvent.change(input, { target: { value: '100' } });

      const dialogStakeButton = screen.getByRole('button', { name: /^Stake$/ });
      fireEvent.click(dialogStakeButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Staking failed:', expect.any(Error));
      });

      consoleError.mockRestore();
    });

    it('should handle unstake transaction error', async () => {
      transactionManager.executeTransaction.mockRejectedValue(new Error('Transaction failed'));

      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<StakingDashboard />);

      await waitFor(() => {
        const unstakeButton = screen.getByRole('button', { name: /^Unstake$/ });
        fireEvent.click(unstakeButton);
      });

      const input = screen.getByPlaceholderText('0.0');
      fireEvent.change(input, { target: { value: '50' } });

      const dialogUnstakeButton = screen.getAllByRole('button', { name: /Unstake/ })[1];
      fireEvent.click(dialogUnstakeButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Unstaking failed:', expect.any(Error));
      });

      consoleError.mockRestore();
    });

    it('should handle claim rewards error', async () => {
      transactionManager.executeTransaction.mockRejectedValue(new Error('Claim failed'));

      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<StakingDashboard />);

      await waitFor(() => {
        const claimButton = screen.getByRole('button', { name: /Claim/i });
        fireEvent.click(claimButton);
      });

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Claiming rewards failed:', expect.any(Error));
      });

      consoleError.mockRestore();
    });

    it('should stop loading state after error', async () => {
      mockCrybContract.getBalance.mockRejectedValue(new Error('Network error'));

      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<StakingDashboard />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });

    it('should reset staking state after error', async () => {
      transactionManager.executeTransaction.mockRejectedValue(new Error('Transaction failed'));

      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<StakingDashboard />);

      await waitFor(() => {
        const stakeButtons = screen.getAllByRole('button', { name: /stake/i });
        const mainStakeButton = stakeButtons.find(btn => !btn.textContent.includes('Unstake'));
        fireEvent.click(mainStakeButton);
      });

      const input = screen.getByPlaceholderText('0.0');
      fireEvent.change(input, { target: { value: '100' } });

      const dialogStakeButton = screen.getByRole('button', { name: /^Stake$/ });
      fireEvent.click(dialogStakeButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      await waitFor(() => {
        const stakeButtons = screen.getAllByRole('button', { name: /stake/i });
        const mainStakeButton = stakeButtons.find(btn => !btn.textContent.includes('Unstake'));
        expect(mainStakeButton).not.toBeDisabled();
      });

      consoleError.mockRestore();
    });
  });

  describe('Wallet Event Listeners', () => {
    it('should register accountChanged event listener', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      render(<StakingDashboard />);

      await waitFor(() => {
        expect(walletManager.on).toHaveBeenCalledWith('accountChanged', expect.any(Function));
      });
    });

    it('should register chainChanged event listener', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      render(<StakingDashboard />);

      await waitFor(() => {
        expect(walletManager.on).toHaveBeenCalledWith('chainChanged', expect.any(Function));
      });
    });

    it('should cleanup event listeners on unmount', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      const { unmount } = render(<StakingDashboard />);

      await waitFor(() => {
        expect(walletManager.on).toHaveBeenCalled();
      });

      unmount();

      expect(walletManager.off).toHaveBeenCalledWith('accountChanged', expect.any(Function));
      expect(walletManager.off).toHaveBeenCalledWith('chainChanged', expect.any(Function));
    });

    it('should reload data on chain change', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      let chainChangedCallback;
      walletManager.on.mockImplementation((event, callback) => {
        if (event === 'chainChanged') {
          chainChangedCallback = callback;
        }
      });

      render(<StakingDashboard />);

      await waitFor(() => {
        expect(mockCrybContract.getBalance).toHaveBeenCalled();
      });

      mockCrybContract.getBalance.mockClear();
      chainChangedCallback();

      await waitFor(() => {
        expect(mockCrybContract.getBalance).toHaveBeenCalled();
      });
    });
  });

  describe('Access Level', () => {
    it('should display access level badge with correct color', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      render(<StakingDashboard />);

      await waitFor(() => {
        const badge = screen.getByTestId('badge');
        expect(badge).toHaveAttribute('data-color', 'silver');
      });
    });

    it('should display access level progress bar', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      render(<StakingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Access Level Progress')).toBeInTheDocument();
        expect(screen.getByText('Level 2/5')).toBeInTheDocument();
      });
    });

    it('should show next level information', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      render(<StakingDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Next Level:/)).toBeInTheDocument();
        expect(screen.getByText('Gold')).toBeInTheDocument();
      });
    });

    it('should not show next level info when at max level', async () => {
      mockCrybContract.getStakingInfo.mockResolvedValue({
        stakedAmount: BigInt('500000000000000000000'),
        pendingRewards: BigInt('50000000000000000000'),
        accessLevel: 5,
        stakingStart: Date.now()
      });

      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      render(<StakingDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/Next Level:/)).not.toBeInTheDocument();
      });
    });

    it('should display correct icon for Bronze level', async () => {
      mockCrybContract.getStakingInfo.mockResolvedValue({
        stakedAmount: BigInt('100000000000000000000'),
        pendingRewards: BigInt(0),
        accessLevel: 1,
        stakingStart: Date.now()
      });

      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      render(<StakingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Bronze')).toBeInTheDocument();
      });
    });
  });

  describe('Staking Duration', () => {
    it('should display "Not staking" when stakingStart is null', async () => {
      mockCrybContract.getStakingInfo.mockResolvedValue({
        stakedAmount: BigInt(0),
        pendingRewards: BigInt(0),
        accessLevel: 0,
        stakingStart: null
      });

      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      render(<StakingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Not staking')).toBeInTheDocument();
      });
    });

    it('should display "Less than 1 day" for same day staking', async () => {
      mockCrybContract.getStakingInfo.mockResolvedValue({
        stakedAmount: BigInt('500000000000000000000'),
        pendingRewards: BigInt('50000000000000000000'),
        accessLevel: 2,
        stakingStart: Date.now() - (12 * 60 * 60 * 1000)
      });

      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      render(<StakingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Less than 1 day')).toBeInTheDocument();
      });
    });

    it('should display singular "day" for 1 day duration', async () => {
      mockCrybContract.getStakingInfo.mockResolvedValue({
        stakedAmount: BigInt('500000000000000000000'),
        pendingRewards: BigInt('50000000000000000000'),
        accessLevel: 2,
        stakingStart: Date.now() - (25 * 60 * 60 * 1000)
      });

      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      render(<StakingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('1 day')).toBeInTheDocument();
      });
    });

    it('should display plural "days" for multiple days', async () => {
      mockCrybContract.getStakingInfo.mockResolvedValue({
        stakedAmount: BigInt('500000000000000000000'),
        pendingRewards: BigInt('50000000000000000000'),
        accessLevel: 2,
        stakingStart: Date.now() - (10 * 24 * 60 * 60 * 1000)
      });

      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      render(<StakingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('10 days')).toBeInTheDocument();
      });
    });
  });

  describe('Global Staking Stats', () => {
    it('should display total staked globally', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      render(<StakingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Staked')).toBeInTheDocument();
      });
    });

    it('should display user share percentage', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      render(<StakingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Your Share')).toBeInTheDocument();
      });
    });

    it('should display network participation rate', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      render(<StakingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Network Participation')).toBeInTheDocument();
        expect(screen.getByText('65.2%')).toBeInTheDocument();
      });
    });

    it('should handle zero total staked', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0xabc';

      render(<StakingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Your Share')).toBeInTheDocument();
      });
    });
  });
});

export default connectButton
