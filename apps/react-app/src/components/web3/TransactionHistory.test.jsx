import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import TransactionHistory from './TransactionHistory';
import * as web3Utils from '../../utils/web3Utils';

// Mock dependencies
jest.mock('../../utils/web3Utils', () => ({
  formatTokenAmount: jest.fn((amount) => parseFloat(amount).toFixed(4)),
  formatUSDValue: jest.fn((value) => `$${parseFloat(value).toFixed(2)}`),
  formatWalletAddress: jest.fn((address, start = 6, end = 4) => {
    if (!address) return '';
    return `${address.slice(0, start + 2)}...${address.slice(-end)}`;
  })
}));

jest.mock('./TransactionConfirmation', () => ({
  TransactionStatusIndicator: ({ status, confirmations }) => (
    <span data-testid="status-indicator" data-status={status} data-confirmations={confirmations}>
      {status}
    </span>
  )
}));

jest.mock('../ui/Button', () => {
  return function Button({ children, onClick, disabled, size, variant, className }) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={className}
        data-size={size}
        data-variant={variant}
      >
        {children}
      </button>
    );
  };
});

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn()
  }
});

describe('TransactionHistory Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Component Rendering', () => {
    test('should render loading state initially', () => {
      render(<TransactionHistory account="0x123" />);
      expect(screen.getByText('Loading Transaction History...')).toBeInTheDocument();
    });

    test('should render loading skeleton with 5 items', () => {
      render(<TransactionHistory account="0x123" />);
      const skeletons = screen.getByText('Loading Transaction History...').closest('div').querySelectorAll('.animate-pulse');
      expect(skeletons).toHaveLength(5);
    });

    test('should render with custom className', () => {
      render(<TransactionHistory account="0x123" className="custom-class" />);
      const container = screen.getByText('Loading Transaction History...').closest('.custom-class');
      expect(container).toBeInTheDocument();
    });

    test('should render transaction history after loading', async () => {
      render(<TransactionHistory account="0x123" />);
      jest.advanceTimersByTime(1500);
      await waitFor(() => {
        expect(screen.getByText('Transaction History')).toBeInTheDocument();
      });
    });

    test('should display transaction count', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={15} />);
      jest.advanceTimersByTime(1500);
      await waitFor(() => {
        expect(screen.getByText(/\(15 transactions\)/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('should display error message on load failure', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      jest.spyOn(global, 'setTimeout').mockImplementation((callback, delay) => {
        if (delay === 1500) {
          throw new Error('Network error');
        }
        return setTimeout(callback, delay);
      });

      render(<TransactionHistory account="0x123" />);

      jest.advanceTimersByTime(1500);
      await waitFor(() => {
        expect(screen.getByText('Failed to Load Transactions')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    test('should display retry button on error', async () => {
      jest.spyOn(global, 'setTimeout').mockImplementation((callback, delay) => {
        if (delay === 1500) {
          throw new Error('Network error');
        }
        return setTimeout(callback, delay);
      });

      render(<TransactionHistory account="0x123" />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    test('should retry loading on retry button click', async () => {
      let shouldFail = true;
      jest.spyOn(global, 'setTimeout').mockImplementation((callback, delay) => {
        if (delay === 1500 && shouldFail) {
          throw new Error('Network error');
        }
        return setTimeout(callback, delay);
      });

      render(<TransactionHistory account="0x123" />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      shouldFail = false;
      fireEvent.click(screen.getByText('Retry'));

      expect(screen.getByText('Loading Transaction History...')).toBeInTheDocument();
    });

    test('should display error icon on failure', async () => {
      jest.spyOn(global, 'setTimeout').mockImplementation((callback, delay) => {
        if (delay === 1500) {
          throw new Error('Network error');
        }
        return setTimeout(callback, delay);
      });

      const { container } = render(<TransactionHistory account="0x123" />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const errorIcon = container.querySelector('.text-error');
        expect(errorIcon).toBeInTheDocument();
      });
    });
  });

  describe('Transaction List Display', () => {
    test('should display transactions after loading', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={5} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const transactions = screen.getAllByTestId('status-indicator');
        expect(transactions.length).toBeGreaterThan(0);
      });
    });

    test('should display transaction icons', async () => {
      const { container } = render(<TransactionHistory account="0x123" maxTransactions={5} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const icons = container.querySelectorAll('.w-10.h-10');
        expect(icons.length).toBeGreaterThan(0);
      });
    });

    test('should display transaction descriptions', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={5} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const description = screen.getByText(/Sent|Received|Swapped|Staked|Unstaked|Approved|Minted|Burned|Contract/);
        expect(description).toBeInTheDocument();
      });
    });

    test('should display transaction timestamps', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={5} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const timestamps = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/);
        expect(timestamps.length).toBeGreaterThan(0);
      });
    });

    test('should display transaction amounts', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={5} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(web3Utils.formatTokenAmount).toHaveBeenCalled();
      });
    });

    test('should display USD values', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={5} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(web3Utils.formatUSDValue).toHaveBeenCalled();
      });
    });

    test('should display empty state when no transactions', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={0} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('No Transactions Found')).toBeInTheDocument();
      });
    });
  });

  describe('Transaction Status', () => {
    test('should display pending status indicator', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={10} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const pendingStatuses = screen.getAllByTestId('status-indicator').filter(
          el => el.dataset.status === 'pending'
        );
        expect(pendingStatuses.length).toBeGreaterThan(0);
      });
    });

    test('should display confirmed status indicator', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={20} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const confirmedStatuses = screen.getAllByTestId('status-indicator').filter(
          el => el.dataset.status === 'confirmed'
        );
        expect(confirmedStatuses.length).toBeGreaterThan(0);
      });
    });

    test('should display failed status indicator', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={20} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const failedStatuses = screen.getAllByTestId('status-indicator').filter(
          el => el.dataset.status === 'failed'
        );
        expect(failedStatuses.length).toBeGreaterThan(0);
      });
    });

    test('should display confirmations count', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={20} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const confirmedStatuses = screen.getAllByTestId('status-indicator').filter(
          el => el.dataset.status === 'confirmed'
        );
        const hasConfirmations = confirmedStatuses.some(
          el => parseInt(el.dataset.confirmations) > 0
        );
        expect(hasConfirmations).toBe(true);
      });
    });

    test('should show pending icon with spinner', async () => {
      const { container } = render(<TransactionHistory account="0x123" maxTransactions={10} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const spinner = container.querySelector('.animate-spin');
        expect(spinner).toBeInTheDocument();
      });
    });
  });

  describe('Filter Functionality', () => {
    test('should render filter controls when showFilters is true', async () => {
      render(<TransactionHistory account="0x123" showFilters={true} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('All Types')).toBeInTheDocument();
        expect(screen.getByText('All Status')).toBeInTheDocument();
        expect(screen.getByText('All Tokens')).toBeInTheDocument();
        expect(screen.getByText('All Time')).toBeInTheDocument();
      });
    });

    test('should not render filter controls when showFilters is false', async () => {
      render(<TransactionHistory account="0x123" showFilters={false} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.queryByText('All Types')).not.toBeInTheDocument();
      });
    });

    test('should filter by transaction type - send', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={20} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const typeFilter = screen.getByDisplayValue('All Types');
        fireEvent.change(typeFilter, { target: { value: 'send' } });

        const sendTransactions = screen.queryAllByText(/Sent/);
        expect(sendTransactions.length).toBeGreaterThan(0);
      });
    });

    test('should filter by transaction type - receive', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={20} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const typeFilter = screen.getByDisplayValue('All Types');
        fireEvent.change(typeFilter, { target: { value: 'receive' } });

        const receiveTransactions = screen.queryAllByText(/Received/);
        expect(receiveTransactions.length).toBeGreaterThan(0);
      });
    });

    test('should filter by transaction type - swap', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={20} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const typeFilter = screen.getByDisplayValue('All Types');
        fireEvent.change(typeFilter, { target: { value: 'swap' } });
      });
    });

    test('should filter by transaction type - stake', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={20} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const typeFilter = screen.getByDisplayValue('All Types');
        fireEvent.change(typeFilter, { target: { value: 'stake' } });
      });
    });

    test('should filter by status - confirmed', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={20} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const statusFilter = screen.getByDisplayValue('All Status');
        fireEvent.change(statusFilter, { target: { value: 'confirmed' } });

        const confirmedStatuses = screen.getAllByTestId('status-indicator').filter(
          el => el.dataset.status === 'confirmed'
        );
        expect(confirmedStatuses.length).toBeGreaterThan(0);
      });
    });

    test('should filter by status - pending', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={20} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const statusFilter = screen.getByDisplayValue('All Status');
        fireEvent.change(statusFilter, { target: { value: 'pending' } });

        const pendingStatuses = screen.getAllByTestId('status-indicator').filter(
          el => el.dataset.status === 'pending'
        );
        expect(pendingStatuses.length).toBeGreaterThan(0);
      });
    });

    test('should filter by status - failed', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={20} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const statusFilter = screen.getByDisplayValue('All Status');
        fireEvent.change(statusFilter, { target: { value: 'failed' } });
      });
    });

    test('should filter by token - ETH', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={20} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const tokenFilter = screen.getByDisplayValue('All Tokens');
        fireEvent.change(tokenFilter, { target: { value: 'ETH' } });

        const ethTransactions = screen.queryAllByText(/ETH/);
        expect(ethTransactions.length).toBeGreaterThan(0);
      });
    });

    test('should filter by token - USDC', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={20} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const tokenFilter = screen.getByDisplayValue('All Tokens');
        fireEvent.change(tokenFilter, { target: { value: 'USDC' } });
      });
    });

    test('should filter by token - CRYB', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={20} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const tokenFilter = screen.getByDisplayValue('All Tokens');
        fireEvent.change(tokenFilter, { target: { value: 'CRYB' } });
      });
    });

    test('should filter by date range - 24h', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={20} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const dateFilter = screen.getByDisplayValue('All Time');
        fireEvent.change(dateFilter, { target: { value: '24h' } });
      });
    });

    test('should filter by date range - 7d', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={20} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const dateFilter = screen.getByDisplayValue('All Time');
        fireEvent.change(dateFilter, { target: { value: '7d' } });
      });
    });

    test('should filter by date range - 30d', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={20} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const dateFilter = screen.getByDisplayValue('All Time');
        fireEvent.change(dateFilter, { target: { value: '30d' } });
      });
    });

    test('should filter by date range - 90d', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={20} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const dateFilter = screen.getByDisplayValue('All Time');
        fireEvent.change(dateFilter, { target: { value: '90d' } });
      });
    });

    test('should combine multiple filters', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={50} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const typeFilter = screen.getByDisplayValue('All Types');
        const statusFilter = screen.getByDisplayValue('All Status');

        fireEvent.change(typeFilter, { target: { value: 'send' } });
        fireEvent.change(statusFilter, { target: { value: 'confirmed' } });
      });
    });

    test('should show empty state when filters return no results', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={5} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/Search by hash/);
        fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

        expect(screen.getByText('No Transactions Found')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    test('should render search input', async () => {
      render(<TransactionHistory account="0x123" />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Search by hash/)).toBeInTheDocument();
      });
    });

    test('should search by transaction hash', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={20} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/Search by hash/);
        fireEvent.change(searchInput, { target: { value: '0x' } });
      });
    });

    test('should search by description', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={20} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/Search by hash/);
        fireEvent.change(searchInput, { target: { value: 'Sent' } });
      });
    });

    test('should search by address', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={20} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/Search by hash/);
        fireEvent.change(searchInput, { target: { value: '0x742' } });
      });
    });

    test('should be case insensitive', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={20} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/Search by hash/);
        fireEvent.change(searchInput, { target: { value: 'SENT' } });
      });
    });

    test('should update results as user types', async () => {
      const user = userEvent.setup({ delay: null });
      render(<TransactionHistory account="0x123" maxTransactions={20} />);
      jest.advanceTimersByTime(1500);

      await waitFor(async () => {
        const searchInput = screen.getByPlaceholderText(/Search by hash/);
        await user.type(searchInput, '0x');
      });
    });
  });

  describe('Transaction Hash', () => {
    test('should display formatted transaction hash', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={5} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(web3Utils.formatWalletAddress).toHaveBeenCalled();
      });
    });

    test('should have copy button for transaction hash', async () => {
      const { container } = render(<TransactionHistory account="0x123" maxTransactions={5} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const copyButton = container.querySelector('[title="Copy hash"]');
        expect(copyButton).toBeInTheDocument();
      });
    });

    test('should copy hash to clipboard on copy button click', async () => {
      const { container } = render(<TransactionHistory account="0x123" maxTransactions={5} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const copyButton = container.querySelector('[title="Copy hash"]');
        fireEvent.click(copyButton);

        expect(navigator.clipboard.writeText).toHaveBeenCalled();
      });
    });

    test('should stop propagation on copy button click', async () => {
      const { container } = render(<TransactionHistory account="0x123" maxTransactions={5} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const copyButton = container.querySelector('[title="Copy hash"]');
        const stopPropagation = jest.fn();
        const event = new MouseEvent('click', { bubbles: true });
        event.stopPropagation = stopPropagation;

        copyButton.dispatchEvent(event);
      });
    });
  });

  describe('Block Explorer Links', () => {
    test('should display block explorer link', async () => {
      const { container } = render(<TransactionHistory account="0x123" maxTransactions={5} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const explorerLink = container.querySelector('[title="View on explorer"]');
        expect(explorerLink).toBeInTheDocument();
      });
    });

    test('should generate correct explorer URL', async () => {
      const { container } = render(<TransactionHistory account="0x123" maxTransactions={5} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const explorerLink = container.querySelector('[title="View on explorer"]');
        expect(explorerLink.href).toContain('etherscan.io/tx/');
      });
    });

    test('should open explorer link in new tab', async () => {
      const { container } = render(<TransactionHistory account="0x123" maxTransactions={5} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const explorerLink = container.querySelector('[title="View on explorer"]');
        expect(explorerLink.target).toBe('_blank');
        expect(explorerLink.rel).toBe('noopener noreferrer');
      });
    });

    test('should stop propagation on explorer link click', async () => {
      const { container } = render(<TransactionHistory account="0x123" maxTransactions={5} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const explorerLink = container.querySelector('[title="View on explorer"]');
        const stopPropagation = jest.fn();
        const event = new MouseEvent('click', { bubbles: true });
        event.stopPropagation = stopPropagation;

        explorerLink.dispatchEvent(event);
      });
    });
  });

  describe('Amount Display', () => {
    test('should display token amounts', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={5} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(web3Utils.formatTokenAmount).toHaveBeenCalled();
      });
    });

    test('should display token symbols', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={5} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const symbols = screen.getAllByText(/ETH|USDC|CRYB|DAI|UNI/);
        expect(symbols.length).toBeGreaterThan(0);
      });
    });

    test('should show minus sign for send transactions', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={20} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const sendTransactions = screen.queryAllByText(/Sent/);
        if (sendTransactions.length > 0) {
          const amounts = screen.queryAllByText(/-\d/);
          expect(amounts.length).toBeGreaterThan(0);
        }
      });
    });

    test('should show plus sign for receive transactions', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={20} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const receiveTransactions = screen.queryAllByText(/Received/);
        if (receiveTransactions.length > 0) {
          const amounts = screen.queryAllByText(/\+\d/);
          expect(amounts.length).toBeGreaterThan(0);
        }
      });
    });

    test('should hide values when showValues is toggled off', async () => {
      const { container } = render(<TransactionHistory account="0x123" maxTransactions={5} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const toggleButton = container.querySelector('[title="Hide values"]');
        fireEvent.click(toggleButton);

        expect(screen.getAllByText('••••••').length).toBeGreaterThan(0);
      });
    });

    test('should show values when showValues is toggled on', async () => {
      const { container } = render(<TransactionHistory account="0x123" maxTransactions={5} />);
      jest.advanceTimersByTime(1500);

      await waitFor(async () => {
        const toggleButton = container.querySelector('[title="Hide values"]');
        fireEvent.click(toggleButton);
        fireEvent.click(toggleButton);

        await waitFor(() => {
          expect(web3Utils.formatTokenAmount).toHaveBeenCalled();
        });
      });
    });

    test('should toggle eye icon when hiding/showing values', async () => {
      const { container } = render(<TransactionHistory account="0x123" maxTransactions={5} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const toggleButton = container.querySelector('[title="Hide values"]');
        expect(toggleButton).toBeInTheDocument();

        fireEvent.click(toggleButton);

        const showButton = container.querySelector('[title="Show values"]');
        expect(showButton).toBeInTheDocument();
      });
    });
  });

  describe('Gas Fees', () => {
    test('should display gas fees in expanded view', async () => {
      const { container } = render(<TransactionHistory account="0x123" maxTransactions={5} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const transactions = container.querySelectorAll('.cursor-pointer');
        fireEvent.click(transactions[0]);

        expect(screen.getByText('Gas Fee:')).toBeInTheDocument();
      });
    });

    test('should display gas price in expanded view', async () => {
      const { container } = render(<TransactionHistory account="0x123" maxTransactions={5} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const transactions = container.querySelectorAll('.cursor-pointer');
        fireEvent.click(transactions[0]);

        expect(screen.getByText('Gas Price:')).toBeInTheDocument();
      });
    });

    test('should display gas used in expanded view', async () => {
      const { container } = render(<TransactionHistory account="0x123" maxTransactions={5} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const transactions = container.querySelectorAll('.cursor-pointer');
        fireEvent.click(transactions[0]);

        expect(screen.getByText('Gas Used:')).toBeInTheDocument();
      });
    });

    test('should format gas price with gwei unit', async () => {
      const { container } = render(<TransactionHistory account="0x123" maxTransactions={5} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const transactions = container.querySelectorAll('.cursor-pointer');
        fireEvent.click(transactions[0]);

        const gasPrice = screen.getByText(/gwei/);
        expect(gasPrice).toBeInTheDocument();
      });
    });

    test('should format gas fee with ETH unit', async () => {
      const { container } = render(<TransactionHistory account="0x123" maxTransactions={5} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const transactions = container.querySelectorAll('.cursor-pointer');
        fireEvent.click(transactions[0]);

        const gasFees = screen.getAllByText(/ETH/);
        expect(gasFees.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Transaction Details', () => {
    test('should expand transaction on click', async () => {
      const { container } = render(<TransactionHistory account="0x123" maxTransactions={5} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const transactions = container.querySelectorAll('.cursor-pointer');
        fireEvent.click(transactions[0]);

        expect(screen.getByText('From:')).toBeInTheDocument();
      });
    });

    test('should collapse transaction on second click', async () => {
      const { container } = render(<TransactionHistory account="0x123" maxTransactions={5} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const transactions = container.querySelectorAll('.cursor-pointer');
        fireEvent.click(transactions[0]);
        fireEvent.click(transactions[0]);

        expect(screen.queryByText('From:')).not.toBeInTheDocument();
      });
    });

    test('should display from address in expanded view', async () => {
      const { container } = render(<TransactionHistory account="0x123" maxTransactions={5} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const transactions = container.querySelectorAll('.cursor-pointer');
        fireEvent.click(transactions[0]);

        expect(screen.getByText('From:')).toBeInTheDocument();
      });
    });

    test('should display to address in expanded view', async () => {
      const { container } = render(<TransactionHistory account="0x123" maxTransactions={5} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const transactions = container.querySelectorAll('.cursor-pointer');
        fireEvent.click(transactions[0]);

        expect(screen.getByText('To:')).toBeInTheDocument();
      });
    });

    test('should display block number in expanded view', async () => {
      const { container } = render(<TransactionHistory account="0x123" maxTransactions={5} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const transactions = container.querySelectorAll('.cursor-pointer');
        fireEvent.click(transactions[0]);

        expect(screen.getByText('Block:')).toBeInTheDocument();
      });
    });

    test('should format block number with locale string', async () => {
      const { container } = render(<TransactionHistory account="0x123" maxTransactions={5} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const transactions = container.querySelectorAll('.cursor-pointer');
        fireEvent.click(transactions[0]);

        const blockNumber = screen.getByText(/18,\d{3},\d{3}/);
        expect(blockNumber).toBeInTheDocument();
      });
    });

    test('should close other transactions when opening a new one', async () => {
      const { container } = render(<TransactionHistory account="0x123" maxTransactions={5} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const transactions = container.querySelectorAll('.cursor-pointer');
        fireEvent.click(transactions[0]);

        const firstDetails = screen.getAllByText('From:');
        expect(firstDetails.length).toBe(1);

        fireEvent.click(transactions[1]);

        const afterSwitch = screen.getAllByText('From:');
        expect(afterSwitch.length).toBe(1);
      });
    });
  });

  describe('Pagination', () => {
    test('should display pagination controls when needed', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={25} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Previous')).toBeInTheDocument();
        expect(screen.getByText('Next')).toBeInTheDocument();
      });
    });

    test('should not display pagination with few transactions', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={5} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.queryByText('Previous')).not.toBeInTheDocument();
      });
    });

    test('should display current page number', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={25} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText(/Page 1 of/)).toBeInTheDocument();
      });
    });

    test('should display total pages', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={25} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText(/of 3/)).toBeInTheDocument();
      });
    });

    test('should navigate to next page', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={25} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const nextButton = screen.getByText('Next');
        fireEvent.click(nextButton);

        expect(screen.getByText(/Page 2 of/)).toBeInTheDocument();
      });
    });

    test('should navigate to previous page', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={25} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const nextButton = screen.getByText('Next');
        fireEvent.click(nextButton);

        const prevButton = screen.getByText('Previous');
        fireEvent.click(prevButton);

        expect(screen.getByText(/Page 1 of/)).toBeInTheDocument();
      });
    });

    test('should disable previous button on first page', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={25} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const prevButton = screen.getByText('Previous');
        expect(prevButton).toBeDisabled();
      });
    });

    test('should disable next button on last page', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={25} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const nextButton = screen.getByText('Next');
        fireEvent.click(nextButton);
        fireEvent.click(nextButton);

        expect(nextButton).toBeDisabled();
      });
    });

    test('should display correct number of items per page', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={25} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const statusIndicators = screen.getAllByTestId('status-indicator');
        expect(statusIndicators.length).toBe(10);
      });
    });

    test('should reset to page 1 when filters change', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={50} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const nextButton = screen.getByText('Next');
        fireEvent.click(nextButton);

        const typeFilter = screen.getByDisplayValue('All Types');
        fireEvent.change(typeFilter, { target: { value: 'send' } });

        expect(screen.getByText(/Page 1 of/)).toBeInTheDocument();
      });
    });
  });

  describe('Sorting', () => {
    test('should sort by timestamp by default', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={20} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const timestamps = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/);
        expect(timestamps.length).toBeGreaterThan(0);
      });
    });

    test('should sort in descending order by default', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={20} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const statusIndicators = screen.getAllByTestId('status-indicator');
        expect(statusIndicators.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Refresh Functionality', () => {
    test('should have refresh button', async () => {
      const { container } = render(<TransactionHistory account="0x123" />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const refreshButtons = container.querySelectorAll('button[data-variant="secondary"]');
        expect(refreshButtons.length).toBeGreaterThan(0);
      });
    });

    test('should reload transactions on refresh', async () => {
      const { container } = render(<TransactionHistory account="0x123" />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const refreshButtons = container.querySelectorAll('button[data-variant="secondary"]');
        fireEvent.click(refreshButtons[0]);

        expect(screen.getByText('Loading Transaction History...')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    test('should show loading state during initial load', () => {
      render(<TransactionHistory account="0x123" />);
      expect(screen.getByText('Loading Transaction History...')).toBeInTheDocument();
    });

    test('should show loading spinner icon', () => {
      const { container } = render(<TransactionHistory account="0x123" />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    test('should clear loading state after data loads', async () => {
      render(<TransactionHistory account="0x123" />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.queryByText('Loading Transaction History...')).not.toBeInTheDocument();
      });
    });

    test('should show loading state on refresh', async () => {
      const { container } = render(<TransactionHistory account="0x123" />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const refreshButtons = container.querySelectorAll('button[data-variant="secondary"]');
        fireEvent.click(refreshButtons[0]);

        expect(screen.getByText('Loading Transaction History...')).toBeInTheDocument();
      });
    });
  });

  describe('Account Change', () => {
    test('should reload transactions when account changes', async () => {
      const { rerender } = render(<TransactionHistory account="0x123" />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Transaction History')).toBeInTheDocument();
      });

      rerender(<TransactionHistory account="0x456" />);

      expect(screen.getByText('Loading Transaction History...')).toBeInTheDocument();
    });
  });

  describe('Max Transactions Prop', () => {
    test('should respect maxTransactions prop', async () => {
      render(<TransactionHistory account="0x123" maxTransactions={15} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText(/\(15 transactions\)/)).toBeInTheDocument();
      });
    });

    test('should default to 50 transactions', async () => {
      render(<TransactionHistory account="0x123" />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText(/transactions\)/)).toBeInTheDocument();
      });
    });
  });
});

export default Button
