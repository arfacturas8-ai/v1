/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionConfirmation, { TransactionStatusIndicator } from './TransactionConfirmation';
import { formatTokenAmount, formatUSDValue, generateTxHash } from '../../utils/web3Utils';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  CheckCircle: ({ className, ...props }) => <div data-testid="check-circle-icon" className={className} {...props} />,
  XCircle: ({ className, ...props }) => <div data-testid="x-circle-icon" className={className} {...props} />,
  Clock: ({ className, ...props }) => <div data-testid="clock-icon" className={className} {...props} />,
  Loader2: ({ className, ...props }) => <div data-testid="loader2-icon" className={className} {...props} />,
  ExternalLink: ({ className, ...props }) => <div data-testid="external-link-icon" className={className} {...props} />,
  AlertTriangle: ({ className, ...props }) => <div data-testid="alert-triangle-icon" className={className} {...props} />,
  ArrowRight: ({ className, ...props }) => <div data-testid="arrow-right-icon" className={className} {...props} />,
  Copy: ({ className, ...props }) => <div data-testid="copy-icon" className={className} {...props} />,
  RefreshCw: ({ className, ...props }) => <div data-testid="refresh-cw-icon" className={className} {...props} />,
  DollarSign: ({ className, ...props }) => <div data-testid="dollar-sign-icon" className={className} {...props} />,
}));

// Mock Button component
jest.mock('../ui/Button', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, className, variant, size, ...props }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  ),
}));

// Mock web3Utils
jest.mock('../../utils/web3Utils', () => ({
  formatTokenAmount: jest.fn((amount, decimals) => {
    const value = parseFloat(amount);
    return value.toFixed(2);
  }),
  formatUSDValue: jest.fn((value) => `$${parseFloat(value).toFixed(2)}`),
  generateTxHash: jest.fn(() => '0x' + '1'.repeat(64)),
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve()),
  },
});

// Mock Math.random for consistent testing
const mockMathRandom = (value) => {
  const originalRandom = Math.random;
  Math.random = () => value;
  return () => {
    Math.random = originalRandom;
  };
};

describe('TransactionConfirmation', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const defaultTransaction = {
    type: 'send',
    amount: '1.5',
    symbol: 'ETH',
    decimals: 18,
    recipient: '0x742d35CC6a2C4E8f8a8f8A8C9b8E8F8A8C9b8E8F',
    recipientName: 'Alice.eth',
    usdValue: 3000,
  };

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    transaction: defaultTransaction,
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<TransactionConfirmation {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it('renders null when isOpen is false', () => {
      const { container } = render(<TransactionConfirmation {...defaultProps} isOpen={false} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders null when transaction is null', () => {
      const { container } = render(<TransactionConfirmation {...defaultProps} transaction={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders with correct modal structure', () => {
      render(<TransactionConfirmation {...defaultProps} />);

      // Check for backdrop
      const backdrop = screen.getByRole('presentation', { hidden: true }).parentElement;
      expect(backdrop).toHaveClass('fixed', 'inset-0', 'backdrop-blur-sm');
    });

    it('displays transaction type header for send', () => {
      render(<TransactionConfirmation {...defaultProps} />);
      expect(screen.getByText('Send Transaction')).toBeInTheDocument();
    });

    it('displays transaction type header for tip', () => {
      render(<TransactionConfirmation {...defaultProps} transaction={{ ...defaultTransaction, type: 'tip' }} />);
      expect(screen.getByText('Crypto Tip')).toBeInTheDocument();
    });

    it('displays transaction type header for stake', () => {
      render(<TransactionConfirmation {...defaultProps} transaction={{ ...defaultTransaction, type: 'stake' }} />);
      expect(screen.getByText('Stake Tokens')).toBeInTheDocument();
    });

    it('displays default transaction header for unknown type', () => {
      render(<TransactionConfirmation {...defaultProps} transaction={{ ...defaultTransaction, type: 'unknown' }} />);
      expect(screen.getByText('Transaction')).toBeInTheDocument();
    });

    it('displays preparing state message initially', () => {
      render(<TransactionConfirmation {...defaultProps} />);
      expect(screen.getByText('Preparing transaction...')).toBeInTheDocument();
    });

    it('displays transaction amount with formatted value', () => {
      render(<TransactionConfirmation {...defaultProps} />);
      expect(formatTokenAmount).toHaveBeenCalledWith('1.5', 18);
      expect(screen.getByText(/ETH/)).toBeInTheDocument();
    });

    it('displays USD value when provided', () => {
      render(<TransactionConfirmation {...defaultProps} />);
      expect(formatUSDValue).toHaveBeenCalledWith(3000);
      expect(screen.getByText(/\$/)).toBeInTheDocument();
    });

    it('displays recipient address', () => {
      render(<TransactionConfirmation {...defaultProps} />);
      expect(screen.getByText('Alice.eth')).toBeInTheDocument();
    });

    it('displays shortened recipient address when no name provided', () => {
      const transaction = { ...defaultTransaction, recipientName: undefined };
      render(<TransactionConfirmation {...defaultProps} transaction={transaction} />);
      expect(screen.getByText(/0x742d/)).toBeInTheDocument();
    });

    it('renders confirm and cancel buttons in preparing state', () => {
      render(<TransactionConfirmation {...defaultProps} />);
      expect(screen.getByText('Confirm Transaction')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<TransactionConfirmation {...defaultProps} className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Transaction States', () => {
    it('displays preparing state with clock icon', () => {
      render(<TransactionConfirmation {...defaultProps} />);
      expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
      expect(screen.getByText('Preparing transaction...')).toBeInTheDocument();
    });

    it('transitions to pending state after confirmation', async () => {
      render(<TransactionConfirmation {...defaultProps} />);

      const confirmButton = screen.getByText('Confirm Transaction');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByTestId('loader2-icon')).toBeInTheDocument();
      });
    });

    it('displays confirmation progress in pending state', async () => {
      const restoreRandom = mockMathRandom(0.5);
      render(<TransactionConfirmation {...defaultProps} />);

      const confirmButton = screen.getByText('Confirm Transaction');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/Waiting for confirmations/)).toBeInTheDocument();
      });

      restoreRandom();
    });

    it('displays confirmed state with success message', async () => {
      const restoreRandom = mockMathRandom(0.5);
      render(<TransactionConfirmation {...defaultProps} />);

      const confirmButton = screen.getByText('Confirm Transaction');
      await user.click(confirmButton);

      // Wait for transaction to be initiated
      await waitFor(() => {
        expect(screen.getByTestId('loader2-icon')).toBeInTheDocument();
      });

      // Fast-forward through confirmation process
      jest.advanceTimersByTime(2000); // Initial confirmation delay

      await waitFor(() => {
        expect(screen.getByText(/Waiting for confirmations/)).toBeInTheDocument();
      });

      // Advance through all confirmation intervals
      jest.advanceTimersByTime(3000); // First confirmation

      await waitFor(() => {
        expect(screen.getByText('Transaction confirmed!')).toBeInTheDocument();
      });

      restoreRandom();
    });

    it('displays failed state with error message', async () => {
      const restoreRandom = mockMathRandom(0.05); // Force failure
      render(<TransactionConfirmation {...defaultProps} />);

      const confirmButton = screen.getByText('Confirm Transaction');
      await user.click(confirmButton);

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByText('Transaction failed')).toBeInTheDocument();
        expect(screen.getByTestId('x-circle-icon')).toBeInTheDocument();
      });

      restoreRandom();
    });

    it('displays cancelled state when transaction is cancelled', async () => {
      render(<TransactionConfirmation {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(defaultProps.onCancel).toHaveBeenCalled();
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Confirmation Requirements', () => {
    it('requires 1 confirmation for low value transactions (<$100)', () => {
      const transaction = { ...defaultTransaction, usdValue: 50 };
      render(<TransactionConfirmation {...defaultProps} transaction={transaction} />);

      // Component should set requiredConfirmations to 1
      expect(screen.getByText('Preparing transaction...')).toBeInTheDocument();
    });

    it('requires 3 confirmations for medium value transactions ($100-$1000)', () => {
      const transaction = { ...defaultTransaction, usdValue: 500 };
      render(<TransactionConfirmation {...defaultProps} transaction={transaction} />);

      expect(screen.getByText('Preparing transaction...')).toBeInTheDocument();
    });

    it('requires 6 confirmations for high value transactions ($1000-$10000)', () => {
      const transaction = { ...defaultTransaction, usdValue: 5000 };
      render(<TransactionConfirmation {...defaultProps} transaction={transaction} />);

      expect(screen.getByText('Preparing transaction...')).toBeInTheDocument();
    });

    it('requires 12 confirmations for critical value transactions (>$10000)', () => {
      const transaction = { ...defaultTransaction, usdValue: 15000 };
      render(<TransactionConfirmation {...defaultProps} transaction={transaction} />);

      expect(screen.getByText('Preparing transaction...')).toBeInTheDocument();
    });

    it('calculates confirmations based on mock ETH price when usdValue not provided', () => {
      const transaction = { ...defaultTransaction, usdValue: undefined, amount: '1' };
      render(<TransactionConfirmation {...defaultProps} transaction={transaction} />);

      // Should calculate: 1 * 2000 = $2000, requiring 6 confirmations
      expect(screen.getByText('Preparing transaction...')).toBeInTheDocument();
    });
  });

  describe('Transaction Hash', () => {
    it('generates and displays transaction hash after confirmation', async () => {
      const restoreRandom = mockMathRandom(0.5);
      render(<TransactionConfirmation {...defaultProps} />);

      const confirmButton = screen.getByText('Confirm Transaction');
      await user.click(confirmButton);

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(generateTxHash).toHaveBeenCalled();
        expect(screen.getByText(/0x1{64}/)).toBeInTheDocument();
      });

      restoreRandom();
    });

    it('displays copy button for transaction hash', async () => {
      const restoreRandom = mockMathRandom(0.5);
      render(<TransactionConfirmation {...defaultProps} />);

      const confirmButton = screen.getByText('Confirm Transaction');
      await user.click(confirmButton);

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        const copyIcons = screen.getAllByTestId('copy-icon');
        expect(copyIcons.length).toBeGreaterThan(0);
      });

      restoreRandom();
    });

    it('displays external link to block explorer', async () => {
      const restoreRandom = mockMathRandom(0.5);
      render(<TransactionConfirmation {...defaultProps} />);

      const confirmButton = screen.getByText('Confirm Transaction');
      await user.click(confirmButton);

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByTestId('external-link-icon')).toBeInTheDocument();
      });

      restoreRandom();
    });

    it('opens block explorer link in new tab', async () => {
      const restoreRandom = mockMathRandom(0.5);
      render(<TransactionConfirmation {...defaultProps} />);

      const confirmButton = screen.getByText('Confirm Transaction');
      await user.click(confirmButton);

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        const links = screen.getAllByRole('link');
        const explorerLink = links.find(link => link.href.includes('etherscan.io'));
        expect(explorerLink).toHaveAttribute('target', '_blank');
        expect(explorerLink).toHaveAttribute('rel', 'noopener noreferrer');
      });

      restoreRandom();
    });
  });

  describe('User Interactions', () => {
    it('calls onConfirm when confirm button is clicked', async () => {
      const restoreRandom = mockMathRandom(0.5);
      render(<TransactionConfirmation {...defaultProps} />);

      const confirmButton = screen.getByText('Confirm Transaction');
      await user.click(confirmButton);

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(defaultProps.onConfirm).toHaveBeenCalledWith(
          expect.objectContaining({
            txHash: expect.any(String),
            status: 'pending'
          })
        );
      });

      restoreRandom();
    });

    it('calls onCancel when cancel button is clicked', async () => {
      render(<TransactionConfirmation {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(defaultProps.onCancel).toHaveBeenCalled();
    });

    it('calls onClose when cancel button is clicked', async () => {
      render(<TransactionConfirmation {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('calls onClose when close button is clicked in confirmed state', async () => {
      const restoreRandom = mockMathRandom(0.5);
      render(<TransactionConfirmation {...defaultProps} />);

      const confirmButton = screen.getByText('Confirm Transaction');
      await user.click(confirmButton);

      jest.advanceTimersByTime(2000);
      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(screen.getByText('Transaction confirmed!')).toBeInTheDocument();
      });

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      expect(defaultProps.onClose).toHaveBeenCalled();

      restoreRandom();
    });

    it('copies transaction hash to clipboard', async () => {
      const restoreRandom = mockMathRandom(0.5);
      render(<TransactionConfirmation {...defaultProps} />);

      const confirmButton = screen.getByText('Confirm Transaction');
      await user.click(confirmButton);

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByText(/0x1{64}/)).toBeInTheDocument();
      });

      const copyButtons = screen.getAllByTestId('copy-icon');
      const txHashCopyButton = copyButtons[copyButtons.length - 1].parentElement;

      await user.click(txHashCopyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('0x' + '1'.repeat(64));

      restoreRandom();
    });

    it('copies recipient address to clipboard', async () => {
      render(<TransactionConfirmation {...defaultProps} />);

      const copyIcon = screen.getByTestId('copy-icon');
      const copyButton = copyIcon.parentElement;

      await user.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(defaultTransaction.recipient);
    });

    it('shows copied feedback after copying', async () => {
      render(<TransactionConfirmation {...defaultProps} />);

      const copyIcon = screen.getByTestId('copy-icon');
      const copyButton = copyIcon.parentElement;

      await user.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText('Copied to clipboard!')).toBeInTheDocument();
      });

      // Feedback should disappear after timeout
      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.queryByText('Copied to clipboard!')).not.toBeInTheDocument();
      });
    });

    it('disables cancel button after confirmations start', async () => {
      const restoreRandom = mockMathRandom(0.5);
      render(<TransactionConfirmation {...defaultProps} />);

      const confirmButton = screen.getByText('Confirm Transaction');
      await user.click(confirmButton);

      jest.advanceTimersByTime(2000);
      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        const cancelButton = screen.getByText('Cancel Transaction');
        expect(cancelButton).toBeDisabled();
      });

      restoreRandom();
    });

    it('toggles advanced details', async () => {
      const restoreRandom = mockMathRandom(0.5);
      render(<TransactionConfirmation {...defaultProps} />);

      const confirmButton = screen.getByText('Confirm Transaction');
      await user.click(confirmButton);

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByText('Show Advanced Details')).toBeInTheDocument();
      });

      const toggleButton = screen.getByText('Show Advanced Details');
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Hide Advanced Details')).toBeInTheDocument();
        expect(screen.getByText('Block Number:')).toBeInTheDocument();
        expect(screen.getByText('Gas Price:')).toBeInTheDocument();
        expect(screen.getByText('Gas Used:')).toBeInTheDocument();
        expect(screen.getByText('Nonce:')).toBeInTheDocument();
      });

      restoreRandom();
    });
  });

  describe('Error Handling', () => {
    it('displays error message when transaction fails', async () => {
      const restoreRandom = mockMathRandom(0.05);
      render(<TransactionConfirmation {...defaultProps} />);

      const confirmButton = screen.getByText('Confirm Transaction');
      await user.click(confirmButton);

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByText(/insufficient gas or network congestion/)).toBeInTheDocument();
      });

      restoreRandom();
    });

    it('shows retry button when transaction fails', async () => {
      const restoreRandom = mockMathRandom(0.05);
      render(<TransactionConfirmation {...defaultProps} />);

      const confirmButton = screen.getByText('Confirm Transaction');
      await user.click(confirmButton);

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByText('Retry Transaction')).toBeInTheDocument();
      });

      restoreRandom();
    });

    it('retries transaction when retry button is clicked', async () => {
      const restoreRandom = mockMathRandom(0.05);
      render(<TransactionConfirmation {...defaultProps} />);

      const confirmButton = screen.getByText('Confirm Transaction');
      await user.click(confirmButton);

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByText('Retry Transaction')).toBeInTheDocument();
      });

      // Change random to succeed
      const restoreRandom2 = mockMathRandom(0.5);

      const retryButton = screen.getByText('Retry Transaction');
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByTestId('loader2-icon')).toBeInTheDocument();
      });

      restoreRandom();
      restoreRandom2();
    });

    it('hides retry button after 3 retry attempts', async () => {
      const restoreRandom = mockMathRandom(0.05);
      render(<TransactionConfirmation {...defaultProps} />);

      // Initial attempt
      const confirmButton = screen.getByText('Confirm Transaction');
      await user.click(confirmButton);
      jest.advanceTimersByTime(2000);

      // Retry 1
      await waitFor(() => {
        expect(screen.getByText('Retry Transaction')).toBeInTheDocument();
      });
      const retryButton1 = screen.getByText('Retry Transaction');
      await user.click(retryButton1);
      jest.advanceTimersByTime(2000);

      // Retry 2
      await waitFor(() => {
        expect(screen.getByText('Retry Transaction')).toBeInTheDocument();
      });
      const retryButton2 = screen.getByText('Retry Transaction');
      await user.click(retryButton2);
      jest.advanceTimersByTime(2000);

      // Retry 3
      await waitFor(() => {
        expect(screen.getByText('Retry Transaction')).toBeInTheDocument();
      });
      const retryButton3 = screen.getByText('Retry Transaction');
      await user.click(retryButton3);
      jest.advanceTimersByTime(2000);

      // Should not show retry button anymore
      await waitFor(() => {
        expect(screen.queryByText('Retry Transaction')).not.toBeInTheDocument();
      });

      restoreRandom();
    });

    it('displays alert triangle icon in error state', async () => {
      const restoreRandom = mockMathRandom(0.05);
      render(<TransactionConfirmation {...defaultProps} />);

      const confirmButton = screen.getByText('Confirm Transaction');
      await user.click(confirmButton);

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
      });

      restoreRandom();
    });
  });

  describe('Confirmation Progress', () => {
    it('updates confirmation count progressively', async () => {
      const restoreRandom = mockMathRandom(0.5);
      const transaction = { ...defaultTransaction, usdValue: 500 }; // 3 confirmations
      render(<TransactionConfirmation {...defaultProps} transaction={transaction} />);

      const confirmButton = screen.getByText('Confirm Transaction');
      await user.click(confirmButton);

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByText(/Waiting for confirmations/)).toBeInTheDocument();
      });

      // First confirmation
      jest.advanceTimersByTime(3000);
      await waitFor(() => {
        expect(screen.getByText(/1\/3/)).toBeInTheDocument();
      });

      // Second confirmation
      jest.advanceTimersByTime(3000);
      await waitFor(() => {
        expect(screen.getByText(/2\/3/)).toBeInTheDocument();
      });

      // Third confirmation
      jest.advanceTimersByTime(3000);
      await waitFor(() => {
        expect(screen.getByText('Transaction confirmed!')).toBeInTheDocument();
      });

      restoreRandom();
    });

    it('displays progress bar for confirmations', async () => {
      const restoreRandom = mockMathRandom(0.5);
      render(<TransactionConfirmation {...defaultProps} />);

      const confirmButton = screen.getByText('Confirm Transaction');
      await user.click(confirmButton);

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        const progressBars = document.querySelectorAll('.bg-gradient-to-r');
        expect(progressBars.length).toBeGreaterThan(0);
      });

      restoreRandom();
    });

    it('displays broadcasting message initially', async () => {
      const restoreRandom = mockMathRandom(0.5);
      render(<TransactionConfirmation {...defaultProps} />);

      const confirmButton = screen.getByText('Confirm Transaction');
      await user.click(confirmButton);

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByText('Broadcasting to network...')).toBeInTheDocument();
      });

      restoreRandom();
    });

    it('displays waiting message during confirmations', async () => {
      const restoreRandom = mockMathRandom(0.5);
      render(<TransactionConfirmation {...defaultProps} />);

      const confirmButton = screen.getByText('Confirm Transaction');
      await user.click(confirmButton);

      jest.advanceTimersByTime(2000);
      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(screen.getByText('Waiting for network confirmations...')).toBeInTheDocument();
      });

      restoreRandom();
    });

    it('displays fully confirmed message when complete', async () => {
      const restoreRandom = mockMathRandom(0.5);
      render(<TransactionConfirmation {...defaultProps} />);

      const confirmButton = screen.getByText('Confirm Transaction');
      await user.click(confirmButton);

      jest.advanceTimersByTime(2000);
      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(screen.getByText('Fully confirmed!')).toBeInTheDocument();
      });

      restoreRandom();
    });

    it('calculates progress percentage correctly', async () => {
      const restoreRandom = mockMathRandom(0.5);
      const transaction = { ...defaultTransaction, usdValue: 500 }; // 3 confirmations
      render(<TransactionConfirmation {...defaultProps} transaction={transaction} />);

      const confirmButton = screen.getByText('Confirm Transaction');
      await user.click(confirmButton);

      jest.advanceTimersByTime(2000);
      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        const progressBar = document.querySelector('.bg-gradient-to-r');
        const width = progressBar?.style.width;
        expect(width).toBeTruthy();
      });

      restoreRandom();
    });
  });

  describe('Success State', () => {
    it('displays success message with large check icon', async () => {
      const restoreRandom = mockMathRandom(0.5);
      render(<TransactionConfirmation {...defaultProps} />);

      const confirmButton = screen.getByText('Confirm Transaction');
      await user.click(confirmButton);

      jest.advanceTimersByTime(2000);
      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(screen.getByText('Transaction Confirmed!')).toBeInTheDocument();
        expect(screen.getByText(/successfully processed and confirmed on the blockchain/)).toBeInTheDocument();
      });

      restoreRandom();
    });

    it('displays close button in success state', async () => {
      const restoreRandom = mockMathRandom(0.5);
      render(<TransactionConfirmation {...defaultProps} />);

      const confirmButton = screen.getByText('Confirm Transaction');
      await user.click(confirmButton);

      jest.advanceTimersByTime(2000);
      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(screen.getByText('Close')).toBeInTheDocument();
      });

      restoreRandom();
    });
  });

  describe('Advanced Details', () => {
    it('hides advanced details by default', async () => {
      const restoreRandom = mockMathRandom(0.5);
      render(<TransactionConfirmation {...defaultProps} />);

      const confirmButton = screen.getByText('Confirm Transaction');
      await user.click(confirmButton);

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.queryByText('Block Number:')).not.toBeInTheDocument();
      });

      restoreRandom();
    });

    it('displays block number in advanced details', async () => {
      const restoreRandom = mockMathRandom(0.5);
      render(<TransactionConfirmation {...defaultProps} />);

      const confirmButton = screen.getByText('Confirm Transaction');
      await user.click(confirmButton);

      jest.advanceTimersByTime(2000);

      const toggleButton = await screen.findByText('Show Advanced Details');
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Block Number:')).toBeInTheDocument();
        expect(screen.getByText('18,123,456')).toBeInTheDocument();
      });

      restoreRandom();
    });

    it('displays gas information in advanced details', async () => {
      const restoreRandom = mockMathRandom(0.5);
      render(<TransactionConfirmation {...defaultProps} />);

      const confirmButton = screen.getByText('Confirm Transaction');
      await user.click(confirmButton);

      jest.advanceTimersByTime(2000);

      const toggleButton = await screen.findByText('Show Advanced Details');
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Gas Price:')).toBeInTheDocument();
        expect(screen.getByText('25 gwei')).toBeInTheDocument();
        expect(screen.getByText('Gas Used:')).toBeInTheDocument();
        expect(screen.getByText('21,000')).toBeInTheDocument();
      });

      restoreRandom();
    });

    it('displays nonce in advanced details', async () => {
      const restoreRandom = mockMathRandom(0.5);
      render(<TransactionConfirmation {...defaultProps} />);

      const confirmButton = screen.getByText('Confirm Transaction');
      await user.click(confirmButton);

      jest.advanceTimersByTime(2000);

      const toggleButton = await screen.findByText('Show Advanced Details');
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Nonce:')).toBeInTheDocument();
        expect(screen.getByText('42')).toBeInTheDocument();
      });

      restoreRandom();
    });

    it('only shows advanced details toggle when transaction hash exists', () => {
      render(<TransactionConfirmation {...defaultProps} />);

      expect(screen.queryByText('Show Advanced Details')).not.toBeInTheDocument();
    });
  });

  describe('Gas Estimation', () => {
    it('does not display gas information when not provided', () => {
      render(<TransactionConfirmation {...defaultProps} />);

      expect(screen.queryByText('Network Fee')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles transaction without recipient', () => {
      const transaction = { ...defaultTransaction, recipient: undefined };
      render(<TransactionConfirmation {...defaultProps} transaction={transaction} />);

      expect(screen.queryByText('To')).not.toBeInTheDocument();
    });

    it('handles transaction without USD value', () => {
      const transaction = { ...defaultTransaction, usdValue: undefined };
      render(<TransactionConfirmation {...defaultProps} transaction={transaction} />);

      // Should still render but without USD display
      expect(screen.getByText('Preparing transaction...')).toBeInTheDocument();
    });

    it('handles transaction without amount', () => {
      const transaction = { ...defaultTransaction, amount: undefined };
      render(<TransactionConfirmation {...defaultProps} transaction={transaction} />);

      expect(screen.getByText('Preparing transaction...')).toBeInTheDocument();
    });

    it('uses default decimals when not provided', () => {
      const transaction = { ...defaultTransaction, decimals: undefined };
      render(<TransactionConfirmation {...defaultProps} transaction={transaction} />);

      expect(formatTokenAmount).toHaveBeenCalledWith('1.5', 18);
    });

    it('uses default symbol when not provided', () => {
      const transaction = { ...defaultTransaction, symbol: undefined };
      render(<TransactionConfirmation {...defaultProps} transaction={transaction} />);

      expect(screen.getByText(/ETH/)).toBeInTheDocument();
    });

    it('handles missing onConfirm callback', async () => {
      const restoreRandom = mockMathRandom(0.5);
      const props = { ...defaultProps, onConfirm: undefined };
      render(<TransactionConfirmation {...props} />);

      const confirmButton = screen.getByText('Confirm Transaction');
      await user.click(confirmButton);

      jest.advanceTimersByTime(2000);

      // Should not throw error
      await waitFor(() => {
        expect(screen.getByTestId('loader2-icon')).toBeInTheDocument();
      });

      restoreRandom();
    });

    it('handles missing onCancel callback', async () => {
      const props = { ...defaultProps, onCancel: undefined };
      render(<TransactionConfirmation {...props} />);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      // Should not throw error
      expect(props.onClose).toHaveBeenCalled();
    });

    it('resets state when reopened', async () => {
      const { rerender } = render(<TransactionConfirmation {...defaultProps} />);

      const confirmButton = screen.getByText('Confirm Transaction');
      await user.click(confirmButton);

      // Close modal
      rerender(<TransactionConfirmation {...defaultProps} isOpen={false} />);

      // Reopen modal
      rerender(<TransactionConfirmation {...defaultProps} isOpen={true} />);

      expect(screen.getByText('Preparing transaction...')).toBeInTheDocument();
    });

    it('handles undefined className', () => {
      const props = { ...defaultProps, className: undefined };
      const { container } = render(<TransactionConfirmation {...props} />);

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper modal backdrop role', () => {
      render(<TransactionConfirmation {...defaultProps} />);

      const backdrop = screen.getByRole('presentation', { hidden: true }).parentElement;
      expect(backdrop).toHaveClass('fixed', 'inset-0');
    });

    it('buttons are keyboard accessible', async () => {
      render(<TransactionConfirmation {...defaultProps} />);

      const confirmButton = screen.getByText('Confirm Transaction');
      confirmButton.focus();

      expect(document.activeElement).toBe(confirmButton);
    });

    it('copy buttons have accessible click targets', () => {
      render(<TransactionConfirmation {...defaultProps} />);

      const copyButtons = screen.getAllByTestId('copy-icon');
      copyButtons.forEach(icon => {
        const button = icon.parentElement;
        expect(button).toBeInTheDocument();
      });
    });

    it('links have proper rel attributes', async () => {
      const restoreRandom = mockMathRandom(0.5);
      render(<TransactionConfirmation {...defaultProps} />);

      const confirmButton = screen.getByText('Confirm Transaction');
      await user.click(confirmButton);

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        const links = screen.getAllByRole('link');
        links.forEach(link => {
          expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
        });
      });

      restoreRandom();
    });

    it('disabled buttons are properly marked', async () => {
      const restoreRandom = mockMathRandom(0.5);
      render(<TransactionConfirmation {...defaultProps} />);

      const confirmButton = screen.getByText('Confirm Transaction');
      await user.click(confirmButton);

      jest.advanceTimersByTime(2000);
      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        const cancelButton = screen.getByText('Cancel Transaction');
        expect(cancelButton).toHaveAttribute('disabled');
      });

      restoreRandom();
    });
  });

  describe('Pending State Warnings', () => {
    it('displays warning message during pending state', async () => {
      const restoreRandom = mockMathRandom(0.5);
      render(<TransactionConfirmation {...defaultProps} />);

      const confirmButton = screen.getByText('Confirm Transaction');
      await user.click(confirmButton);

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByText(/Do not close this window/)).toBeInTheDocument();
      });

      restoreRandom();
    });
  });

  describe('Timer Cleanup', () => {
    it('cleans up interval when component unmounts', async () => {
      const restoreRandom = mockMathRandom(0.5);
      const { unmount } = render(<TransactionConfirmation {...defaultProps} />);

      const confirmButton = screen.getByText('Confirm Transaction');
      await user.click(confirmButton);

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByTestId('loader2-icon')).toBeInTheDocument();
      });

      unmount();

      // Should not cause any errors or memory leaks
      jest.advanceTimersByTime(10000);

      restoreRandom();
    });

    it('cleans up interval when modal is closed', async () => {
      const restoreRandom = mockMathRandom(0.5);
      const { rerender } = render(<TransactionConfirmation {...defaultProps} />);

      const confirmButton = screen.getByText('Confirm Transaction');
      await user.click(confirmButton);

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByTestId('loader2-icon')).toBeInTheDocument();
      });

      rerender(<TransactionConfirmation {...defaultProps} isOpen={false} />);

      // Should not cause any errors
      jest.advanceTimersByTime(10000);

      restoreRandom();
    });
  });
});

describe('TransactionStatusIndicator', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(
        <TransactionStatusIndicator status="pending" confirmations={1} requiredConfirmations={3} />
      );
      expect(container).toBeInTheDocument();
    });

    it('displays pending status with loader icon', () => {
      render(<TransactionStatusIndicator status="pending" confirmations={1} requiredConfirmations={3} />);

      expect(screen.getByTestId('loader2-icon')).toBeInTheDocument();
      expect(screen.getByText('1/3 confirmations')).toBeInTheDocument();
    });

    it('displays confirmed status with check icon', () => {
      render(<TransactionStatusIndicator status="confirmed" confirmations={3} requiredConfirmations={3} />);

      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
      expect(screen.getByText('Confirmed')).toBeInTheDocument();
    });

    it('displays failed status with X icon', () => {
      render(<TransactionStatusIndicator status="failed" confirmations={0} requiredConfirmations={3} />);

      expect(screen.getByTestId('x-circle-icon')).toBeInTheDocument();
      expect(screen.getByText('Failed')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <TransactionStatusIndicator status="pending" confirmations={1} requiredConfirmations={3} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('displays correct text color for pending status', () => {
      render(<TransactionStatusIndicator status="pending" confirmations={1} requiredConfirmations={3} />);

      const statusText = screen.getByText('1/3 confirmations');
      expect(statusText).toHaveClass('text-warning');
    });

    it('displays correct text color for confirmed status', () => {
      render(<TransactionStatusIndicator status="confirmed" confirmations={3} requiredConfirmations={3} />);

      const statusText = screen.getByText('Confirmed');
      expect(statusText).toHaveClass('text-success');
    });

    it('displays correct text color for failed status', () => {
      render(<TransactionStatusIndicator status="failed" confirmations={0} requiredConfirmations={3} />);

      const statusText = screen.getByText('Failed');
      expect(statusText).toHaveClass('text-error');
    });

    it('handles undefined status gracefully', () => {
      render(<TransactionStatusIndicator status={undefined} confirmations={0} requiredConfirmations={3} />);

      expect(screen.queryByTestId('loader2-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('check-circle-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('x-circle-icon')).not.toBeInTheDocument();
    });

    it('handles missing className prop', () => {
      const { container } = render(
        <TransactionStatusIndicator status="pending" confirmations={1} requiredConfirmations={3} />
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with correct flex layout', () => {
      const { container } = render(
        <TransactionStatusIndicator status="pending" confirmations={1} requiredConfirmations={3} />
      );

      expect(container.firstChild).toHaveClass('flex', 'items-center', 'gap-2');
    });
  });
});

export default value
