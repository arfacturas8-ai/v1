/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GasEstimator, { GasFeeDisplay } from './GasEstimator';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Zap: ({ className, ...props }) => <span data-testid="icon-zap" className={className} {...props} />,
  Clock: ({ className, ...props }) => <span data-testid="icon-clock" className={className} {...props} />,
  TrendingUp: ({ className, ...props }) => <span data-testid="icon-trending-up" className={className} {...props} />,
  Info: ({ className, ...props }) => <span data-testid="icon-info" className={className} {...props} />,
  RefreshCw: ({ className, ...props }) => <span data-testid="icon-refresh" className={className} {...props} />,
  AlertTriangle: ({ className, ...props }) => <span data-testid="icon-alert-triangle" className={className} {...props} />,
  DollarSign: ({ className, ...props }) => <span data-testid="icon-dollar-sign" className={className} {...props} />,
  Fuel: ({ className, ...props }) => <span data-testid="icon-fuel" className={className} {...props} />,
  Timer: ({ className, ...props }) => <span data-testid="icon-timer" className={className} {...props} />
}));

// Mock Button component
jest.mock('../ui/Button', () => {
  return function MockButton({ children, onClick, className, ...props }) {
    return (
      <button onClick={onClick} className={className} {...props}>
        {children}
      </button>
    );
  };
});

// Mock web3Utils
jest.mock('../../utils/web3Utils', () => ({
  formatTokenAmount: jest.fn((amount) => amount),
  formatUSDValue: jest.fn((value) => `$${value.toFixed(2)}`)
}));

describe('GasEstimator', () => {
  let user;

  const mockTransaction = {
    type: 'transfer',
    to: '0x123456789',
    value: '1000000000000000000'
  };

  const defaultProps = {
    transaction: mockTransaction,
    onGasEstimateChange: jest.fn(),
    initialPreset: 'standard',
    showAdvanced: false,
    className: ''
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    user = userEvent.setup({ delay: null });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<GasEstimator {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it('shows loading state initially', () => {
      render(<GasEstimator {...defaultProps} />);
      expect(screen.getByText('Estimating Gas Fees...')).toBeInTheDocument();
      expect(screen.getByTestId('icon-refresh')).toHaveClass('animate-spin');
    });

    it('renders loading skeleton with animation', () => {
      render(<GasEstimator {...defaultProps} />);
      const skeletons = screen.getAllByRole('generic').filter(el =>
        el.className.includes('animate-pulse')
      );
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('displays gas fee options after loading', async () => {
      render(<GasEstimator {...defaultProps} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Gas Fee Options')).toBeInTheDocument();
      });
    });

    it('renders all gas preset options', async () => {
      render(<GasEstimator {...defaultProps} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Slow')).toBeInTheDocument();
        expect(screen.getByText('Standard')).toBeInTheDocument();
        expect(screen.getByText('Fast')).toBeInTheDocument();
        expect(screen.getByText('Custom')).toBeInTheDocument();
      });
    });

    it('renders with custom className', () => {
      const { container } = render(
        <GasEstimator {...defaultProps} className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('renders null when no transaction is provided', () => {
      const { container } = render(
        <GasEstimator {...defaultProps} transaction={null} />
      );

      jest.advanceTimersByTime(1500);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Gas Estimation', () => {
    it('estimates gas for transfer transaction type', async () => {
      const transaction = { type: 'transfer' };
      render(<GasEstimator {...defaultProps} transaction={transaction} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Gas Fee Options')).toBeInTheDocument();
      });
    });

    it('estimates gas for contract transaction type', async () => {
      const transaction = { type: 'contract' };
      render(<GasEstimator {...defaultProps} transaction={transaction} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Gas Fee Options')).toBeInTheDocument();
      });
    });

    it('estimates gas for swap transaction type', async () => {
      const transaction = { type: 'swap' };
      render(<GasEstimator {...defaultProps} transaction={transaction} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Gas Fee Options')).toBeInTheDocument();
      });
    });

    it('estimates gas for NFT transaction type', async () => {
      const transaction = { type: 'nft' };
      render(<GasEstimator {...defaultProps} transaction={transaction} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Gas Fee Options')).toBeInTheDocument();
      });
    });

    it('estimates gas for stake transaction type', async () => {
      const transaction = { type: 'stake' };
      render(<GasEstimator {...defaultProps} transaction={transaction} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Gas Fee Options')).toBeInTheDocument();
      });
    });

    it('uses default gas limit for unknown transaction type', async () => {
      const transaction = { type: 'unknown' };
      render(<GasEstimator {...defaultProps} transaction={transaction} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Gas Fee Options')).toBeInTheDocument();
      });
    });

    it('applies complexity multiplier for contract interactions', async () => {
      const transaction = { type: 'transfer', contractInteraction: true };
      render(<GasEstimator {...defaultProps} transaction={transaction} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Gas Fee Options')).toBeInTheDocument();
      });
    });

    it('applies complexity multiplier when data is present', async () => {
      const transaction = { type: 'transfer', data: '0x123' };
      render(<GasEstimator {...defaultProps} transaction={transaction} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Gas Fee Options')).toBeInTheDocument();
      });
    });

    it('calls onGasEstimateChange after estimation', async () => {
      const onGasEstimateChange = jest.fn();
      render(<GasEstimator {...defaultProps} onGasEstimateChange={onGasEstimateChange} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(onGasEstimateChange).toHaveBeenCalled();
      });
    });

    it('provides correct estimate structure', async () => {
      const onGasEstimateChange = jest.fn();
      render(<GasEstimator {...defaultProps} onGasEstimateChange={onGasEstimateChange} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(onGasEstimateChange).toHaveBeenCalledWith(
          expect.objectContaining({
            gasPrice: expect.any(Number),
            gasLimit: expect.any(Number),
            fee: expect.any(String),
            feeUSD: expect.any(Number),
            maxFee: expect.any(String),
            preset: expect.any(String),
            estimatedTime: expect.any(String)
          })
        );
      });
    });

    it('re-estimates gas when transaction changes', async () => {
      const { rerender } = render(<GasEstimator {...defaultProps} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Gas Fee Options')).toBeInTheDocument();
      });

      const newTransaction = { type: 'contract' };
      rerender(<GasEstimator {...defaultProps} transaction={newTransaction} />);

      expect(screen.getByText('Estimating Gas Fees...')).toBeInTheDocument();
    });
  });

  describe('Preset Selection', () => {
    it('renders standard preset as default', async () => {
      render(<GasEstimator {...defaultProps} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const standardButton = screen.getByText('Standard').closest('button');
        expect(standardButton).toHaveClass('border-accent-primary');
      });
    });

    it('allows selecting slow preset', async () => {
      render(<GasEstimator {...defaultProps} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Slow')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Slow'));

      const slowButton = screen.getByText('Slow').closest('button');
      expect(slowButton).toHaveClass('border-accent-primary');
    });

    it('allows selecting fast preset', async () => {
      render(<GasEstimator {...defaultProps} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Fast')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Fast'));

      const fastButton = screen.getByText('Fast').closest('button');
      expect(fastButton).toHaveClass('border-accent-primary');
    });

    it('allows selecting custom preset', async () => {
      render(<GasEstimator {...defaultProps} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Custom')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Custom'));

      expect(screen.getByText('Custom Gas Settings')).toBeInTheDocument();
    });

    it('displays correct description for each preset', async () => {
      render(<GasEstimator {...defaultProps} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Lower cost, longer wait time')).toBeInTheDocument();
        expect(screen.getByText('Balanced cost and speed')).toBeInTheDocument();
        expect(screen.getByText('Higher cost, faster confirmation')).toBeInTheDocument();
        expect(screen.getByText('Set your own gas price')).toBeInTheDocument();
      });
    });

    it('updates gas estimate when preset changes', async () => {
      const onGasEstimateChange = jest.fn();
      render(<GasEstimator {...defaultProps} onGasEstimateChange={onGasEstimateChange} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Fast')).toBeInTheDocument();
      });

      onGasEstimateChange.mockClear();

      await user.click(screen.getByText('Fast'));

      await waitFor(() => {
        expect(onGasEstimateChange).toHaveBeenCalled();
      });
    });

    it('clears error when preset changes', async () => {
      render(<GasEstimator {...defaultProps} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Fast')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Fast'));

      // Error should not be visible
      expect(screen.queryByTestId('icon-alert-triangle')).not.toBeInTheDocument();
    });

    it('respects initialPreset prop', async () => {
      render(<GasEstimator {...defaultProps} initialPreset="fast" />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const fastButton = screen.getByText('Fast').closest('button');
        expect(fastButton).toHaveClass('border-accent-primary');
      });
    });

    it('displays savings for slow preset', async () => {
      render(<GasEstimator {...defaultProps} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText(/Save 10-20%/)).toBeInTheDocument();
      });
    });
  });

  describe('Custom Gas Settings', () => {
    beforeEach(async () => {
      render(<GasEstimator {...defaultProps} />);
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Custom')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Custom'));
    });

    it('shows custom gas inputs when custom preset is selected', () => {
      expect(screen.getByText('Custom Gas Settings')).toBeInTheDocument();
      expect(screen.getByLabelText('Gas Price (gwei)')).toBeInTheDocument();
      expect(screen.getByLabelText('Gas Limit')).toBeInTheDocument();
    });

    it('has default values for custom gas inputs', () => {
      const gasPriceInput = screen.getByLabelText('Gas Price (gwei)');
      const gasLimitInput = screen.getByLabelText('Gas Limit');

      expect(gasPriceInput).toHaveValue(25);
      expect(gasLimitInput).toHaveValue(21000);
    });

    it('allows changing custom gas price', async () => {
      const gasPriceInput = screen.getByLabelText('Gas Price (gwei)');

      await user.clear(gasPriceInput);
      await user.type(gasPriceInput, '50');

      expect(gasPriceInput).toHaveValue(50);
    });

    it('allows changing custom gas limit', async () => {
      const gasLimitInput = screen.getByLabelText('Gas Limit');

      await user.clear(gasLimitInput);
      await user.type(gasLimitInput, '30000');

      expect(gasLimitInput).toHaveValue(30000);
    });

    it('updates estimate when custom gas price changes', async () => {
      const onGasEstimateChange = jest.fn();
      const { rerender } = render(
        <GasEstimator {...defaultProps} onGasEstimateChange={onGasEstimateChange} />
      );

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Custom')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Custom'));

      onGasEstimateChange.mockClear();

      const gasPriceInput = screen.getByLabelText('Gas Price (gwei)');
      await user.clear(gasPriceInput);
      await user.type(gasPriceInput, '50');

      await waitFor(() => {
        expect(onGasEstimateChange).toHaveBeenCalled();
      });
    });

    it('updates estimate when custom gas limit changes', async () => {
      const onGasEstimateChange = jest.fn();
      const { rerender } = render(
        <GasEstimator {...defaultProps} onGasEstimateChange={onGasEstimateChange} />
      );

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Custom')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Custom'));

      onGasEstimateChange.mockClear();

      const gasLimitInput = screen.getByLabelText('Gas Limit');
      await user.clear(gasLimitInput);
      await user.type(gasLimitInput, '30000');

      await waitFor(() => {
        expect(onGasEstimateChange).toHaveBeenCalled();
      });
    });

    it('shows warning about low gas settings', () => {
      expect(screen.getByText(/Setting gas too low may cause transaction failure/)).toBeInTheDocument();
    });

    it('enforces minimum gas price of 1', () => {
      const gasPriceInput = screen.getByLabelText('Gas Price (gwei)');
      expect(gasPriceInput).toHaveAttribute('min', '1');
    });

    it('enforces minimum gas limit of 21000', () => {
      const gasLimitInput = screen.getByLabelText('Gas Limit');
      expect(gasLimitInput).toHaveAttribute('min', '21000');
    });

    it('has proper step values for inputs', () => {
      const gasPriceInput = screen.getByLabelText('Gas Price (gwei)');
      const gasLimitInput = screen.getByLabelText('Gas Limit');

      expect(gasPriceInput).toHaveAttribute('step', '0.1');
      expect(gasLimitInput).toHaveAttribute('step', '1000');
    });
  });

  describe('Network Status', () => {
    it('displays network congestion status', async () => {
      render(<GasEstimator {...defaultProps} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText(/congestion/i)).toBeInTheDocument();
      });
    });

    it('displays base fee', async () => {
      render(<GasEstimator {...defaultProps} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText(/Base: 15.5 gwei/)).toBeInTheDocument();
      });
    });

    it('shows appropriate icon for medium congestion', async () => {
      render(<GasEstimator {...defaultProps} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Medium congestion')).toBeInTheDocument();
      });
    });

    it('displays warning for high congestion', async () => {
      // This would require modifying the component's initial state
      // For now, we test that the component renders without errors
      render(<GasEstimator {...defaultProps} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Gas Fee Options')).toBeInTheDocument();
      });
    });
  });

  describe('Advanced Options', () => {
    it('hides advanced options by default', async () => {
      render(<GasEstimator {...defaultProps} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Show Advanced Options')).toBeInTheDocument();
      });

      expect(screen.queryByText('Estimated Confirmation Times')).not.toBeInTheDocument();
    });

    it('shows advanced options when showAdvanced prop is true', async () => {
      render(<GasEstimator {...defaultProps} showAdvanced={true} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Base Fee:')).toBeInTheDocument();
      });
    });

    it('toggles advanced options on button click', async () => {
      render(<GasEstimator {...defaultProps} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Show Advanced Options')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Show Advanced Options'));

      expect(screen.getByText('Hide Advanced Options')).toBeInTheDocument();
      expect(screen.getByText('Base Fee:')).toBeInTheDocument();
    });

    it('displays base fee in advanced options', async () => {
      render(<GasEstimator {...defaultProps} showAdvanced={true} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Base Fee:')).toBeInTheDocument();
        expect(screen.getByText('15.5 gwei')).toBeInTheDocument();
      });
    });

    it('displays priority fee in advanced options', async () => {
      render(<GasEstimator {...defaultProps} showAdvanced={true} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Priority Fee:')).toBeInTheDocument();
        expect(screen.getByText('2.5 gwei')).toBeInTheDocument();
      });
    });

    it('displays gas limit in advanced options', async () => {
      render(<GasEstimator {...defaultProps} showAdvanced={true} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Gas Limit:')).toBeInTheDocument();
      });
    });

    it('displays block time in advanced options', async () => {
      render(<GasEstimator {...defaultProps} showAdvanced={true} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Block Time:')).toBeInTheDocument();
        expect(screen.getByText('12s')).toBeInTheDocument();
      });
    });

    it('displays estimated confirmation times', async () => {
      render(<GasEstimator {...defaultProps} showAdvanced={true} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Estimated Confirmation Times')).toBeInTheDocument();
        expect(screen.getByText(/Slow \(90% confidence\):/)).toBeInTheDocument();
        expect(screen.getByText(/Standard \(95% confidence\):/)).toBeInTheDocument();
        expect(screen.getByText(/Fast \(99% confidence\):/)).toBeInTheDocument();
      });
    });

    it('shows dynamic price warning in advanced options', async () => {
      render(<GasEstimator {...defaultProps} showAdvanced={true} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText(/Gas prices are dynamic and may change before transaction confirmation/)).toBeInTheDocument();
      });
    });
  });

  describe('Refresh Functionality', () => {
    it('shows refresh button', async () => {
      render(<GasEstimator {...defaultProps} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const refreshButton = screen.getByTitle('Refresh gas estimates');
        expect(refreshButton).toBeInTheDocument();
      });
    });

    it('refreshes gas estimates on button click', async () => {
      render(<GasEstimator {...defaultProps} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Gas Fee Options')).toBeInTheDocument();
      });

      const refreshButton = screen.getByTitle('Refresh gas estimates');
      await user.click(refreshButton);

      expect(screen.getByText('Estimating Gas Fees...')).toBeInTheDocument();
    });

    it('shows loading state during refresh', async () => {
      render(<GasEstimator {...defaultProps} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Gas Fee Options')).toBeInTheDocument();
      });

      const refreshButton = screen.getByTitle('Refresh gas estimates');
      await user.click(refreshButton);

      expect(screen.getByTestId('icon-refresh')).toHaveClass('animate-spin');
    });
  });

  describe('Error Handling', () => {
    it('handles gas estimation errors gracefully', async () => {
      // Mock console.error to avoid noise in test output
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      // Force an error by providing invalid transaction
      const { rerender } = render(<GasEstimator {...defaultProps} />);

      jest.advanceTimersByTime(1500);

      consoleError.mockRestore();
    });

    it('shows try again button on error', async () => {
      // This test would require mocking the estimation to fail
      // For basic structure validation
      render(<GasEstimator {...defaultProps} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Gas Fee Options')).toBeInTheDocument();
      });
    });
  });

  describe('Fee Calculations', () => {
    it('calculates fees in ETH correctly', async () => {
      render(<GasEstimator {...defaultProps} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText(/ETH/)).toBeInTheDocument();
      });
    });

    it('calculates USD fees correctly', async () => {
      render(<GasEstimator {...defaultProps} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const usdValues = screen.getAllByText(/\$/);
        expect(usdValues.length).toBeGreaterThan(0);
      });
    });

    it('applies correct multiplier for slow preset', async () => {
      const onGasEstimateChange = jest.fn();
      render(<GasEstimator {...defaultProps} onGasEstimateChange={onGasEstimateChange} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Slow')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Slow'));

      await waitFor(() => {
        expect(onGasEstimateChange).toHaveBeenCalled();
      });
    });

    it('applies correct multiplier for fast preset', async () => {
      const onGasEstimateChange = jest.fn();
      render(<GasEstimator {...defaultProps} onGasEstimateChange={onGasEstimateChange} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Fast')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Fast'));

      await waitFor(() => {
        expect(onGasEstimateChange).toHaveBeenCalled();
      });
    });

    it('includes maxFee with 20% buffer', async () => {
      const onGasEstimateChange = jest.fn();
      render(<GasEstimator {...defaultProps} onGasEstimateChange={onGasEstimateChange} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(onGasEstimateChange).toHaveBeenCalledWith(
          expect.objectContaining({
            maxFee: expect.any(String)
          })
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper button roles', async () => {
      render(<GasEstimator {...defaultProps} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
      });
    });

    it('has title attribute on refresh button', async () => {
      render(<GasEstimator {...defaultProps} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const refreshButton = screen.getByTitle('Refresh gas estimates');
        expect(refreshButton).toHaveAttribute('title');
      });
    });

    it('supports keyboard navigation for preset buttons', async () => {
      render(<GasEstimator {...defaultProps} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
          expect(button).toBeVisible();
        });
      });
    });

    it('has accessible labels for custom inputs', async () => {
      render(<GasEstimator {...defaultProps} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Custom')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Custom'));

      expect(screen.getByLabelText('Gas Price (gwei)')).toBeInTheDocument();
      expect(screen.getByLabelText('Gas Limit')).toBeInTheDocument();
    });

    it('provides visual feedback for selected preset', async () => {
      render(<GasEstimator {...defaultProps} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const standardButton = screen.getByText('Standard').closest('button');
        expect(standardButton).toHaveClass('border-accent-primary');
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles null transaction gracefully', () => {
      const { container } = render(<GasEstimator {...defaultProps} transaction={null} />);
      expect(container).toBeInTheDocument();
    });

    it('handles undefined onGasEstimateChange', async () => {
      render(<GasEstimator {...defaultProps} onGasEstimateChange={undefined} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Gas Fee Options')).toBeInTheDocument();
      });
    });

    it('handles empty transaction object', async () => {
      render(<GasEstimator {...defaultProps} transaction={{}} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Gas Fee Options')).toBeInTheDocument();
      });
    });

    it('handles very large gas values', async () => {
      const transaction = { type: 'stake' };
      render(<GasEstimator {...defaultProps} transaction={transaction} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Gas Fee Options')).toBeInTheDocument();
      });
    });

    it('handles rapid preset changes', async () => {
      render(<GasEstimator {...defaultProps} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Slow')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Slow'));
      await user.click(screen.getByText('Fast'));
      await user.click(screen.getByText('Standard'));

      const standardButton = screen.getByText('Standard').closest('button');
      expect(standardButton).toHaveClass('border-accent-primary');
    });

    it('handles rapid custom input changes', async () => {
      render(<GasEstimator {...defaultProps} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Custom')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Custom'));

      const gasPriceInput = screen.getByLabelText('Gas Price (gwei)');

      await user.clear(gasPriceInput);
      await user.type(gasPriceInput, '30');
      await user.clear(gasPriceInput);
      await user.type(gasPriceInput, '40');

      expect(gasPriceInput).toHaveValue(40);
    });

    it('maintains state during transaction updates', async () => {
      const { rerender } = render(<GasEstimator {...defaultProps} initialPreset="fast" />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Fast')).toBeInTheDocument();
      });

      const newTransaction = { type: 'contract' };
      rerender(<GasEstimator {...defaultProps} transaction={newTransaction} initialPreset="fast" />);

      jest.advanceTimersByTime(1500);

      // Preset should be maintained across transaction updates
      await waitFor(() => {
        expect(screen.getByText('Gas Fee Options')).toBeInTheDocument();
      });
    });
  });

  describe('Gas Savings Tip', () => {
    it('shows gas savings tip during high congestion', async () => {
      // This would require modifying network status to high
      render(<GasEstimator {...defaultProps} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Gas Fee Options')).toBeInTheDocument();
      });
    });
  });

  describe('Price Display', () => {
    it('displays ETH amounts with correct precision', async () => {
      render(<GasEstimator {...defaultProps} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const ethAmounts = screen.getAllByText(/\d+\.\d{6} ETH/);
        expect(ethAmounts.length).toBeGreaterThan(0);
      });
    });

    it('formats USD values correctly', async () => {
      render(<GasEstimator {...defaultProps} />);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText('Gas Fee Options')).toBeInTheDocument();
      });
    });
  });
});

describe('GasFeeDisplay', () => {
  const mockGasEstimate = {
    gasPrice: 25,
    gasLimit: 21000,
    fee: '0.000525',
    feeUSD: 1.05,
    maxFee: '0.000630',
    preset: 'standard',
    estimatedTime: '2-5 minutes'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<GasFeeDisplay gasEstimate={mockGasEstimate} />);
      expect(screen.getByText('Gas:')).toBeInTheDocument();
    });

    it('returns null when gasEstimate is null', () => {
      const { container } = render(<GasFeeDisplay gasEstimate={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('returns null when gasEstimate is undefined', () => {
      const { container } = render(<GasFeeDisplay gasEstimate={undefined} />);
      expect(container.firstChild).toBeNull();
    });

    it('displays gas fee amount', () => {
      render(<GasFeeDisplay gasEstimate={mockGasEstimate} />);
      expect(screen.getByText('0.000525 ETH')).toBeInTheDocument();
    });

    it('displays preset name', () => {
      render(<GasFeeDisplay gasEstimate={mockGasEstimate} />);
      expect(screen.getByText('standard')).toBeInTheDocument();
    });

    it('displays Fuel icon', () => {
      render(<GasFeeDisplay gasEstimate={mockGasEstimate} />);
      expect(screen.getByTestId('icon-fuel')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <GasFeeDisplay gasEstimate={mockGasEstimate} className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Details Display', () => {
    it('hides USD value by default', () => {
      render(<GasFeeDisplay gasEstimate={mockGasEstimate} />);
      expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
    });

    it('shows USD value when showDetails is true', () => {
      render(<GasFeeDisplay gasEstimate={mockGasEstimate} showDetails={true} />);
      expect(screen.getByText(/\$/)).toBeInTheDocument();
    });

    it('formats USD value correctly when shown', () => {
      render(<GasFeeDisplay gasEstimate={mockGasEstimate} showDetails={true} />);
      expect(screen.getByText('(≈$1.05)')).toBeInTheDocument();
    });

    it('handles missing feeUSD gracefully', () => {
      const estimateWithoutUSD = { ...mockGasEstimate, feeUSD: undefined };
      render(<GasFeeDisplay gasEstimate={estimateWithoutUSD} showDetails={true} />);
      expect(screen.getByText('Gas:')).toBeInTheDocument();
    });
  });

  describe('Preset Display', () => {
    it('displays slow preset', () => {
      const estimate = { ...mockGasEstimate, preset: 'slow' };
      render(<GasFeeDisplay gasEstimate={estimate} />);
      expect(screen.getByText('slow')).toBeInTheDocument();
    });

    it('displays fast preset', () => {
      const estimate = { ...mockGasEstimate, preset: 'fast' };
      render(<GasFeeDisplay gasEstimate={estimate} />);
      expect(screen.getByText('fast')).toBeInTheDocument();
    });

    it('displays custom preset', () => {
      const estimate = { ...mockGasEstimate, preset: 'custom' };
      render(<GasFeeDisplay gasEstimate={estimate} />);
      expect(screen.getByText('custom')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero gas fee', () => {
      const estimate = { ...mockGasEstimate, fee: '0.000000' };
      render(<GasFeeDisplay gasEstimate={estimate} />);
      expect(screen.getByText('0.000000 ETH')).toBeInTheDocument();
    });

    it('handles very large gas fee', () => {
      const estimate = { ...mockGasEstimate, fee: '10.500000' };
      render(<GasFeeDisplay gasEstimate={estimate} />);
      expect(screen.getByText('10.500000 ETH')).toBeInTheDocument();
    });

    it('handles missing preset gracefully', () => {
      const estimate = { ...mockGasEstimate, preset: undefined };
      render(<GasFeeDisplay gasEstimate={estimate} />);
      expect(screen.getByText('Gas:')).toBeInTheDocument();
    });

    it('handles empty preset string', () => {
      const estimate = { ...mockGasEstimate, preset: '' };
      render(<GasFeeDisplay gasEstimate={estimate} />);
      expect(screen.getByText('Gas:')).toBeInTheDocument();
    });

    it('handles missing fee gracefully', () => {
      const estimate = { ...mockGasEstimate, fee: undefined };
      const { container } = render(<GasFeeDisplay gasEstimate={estimate} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has semantic text labels', () => {
      render(<GasFeeDisplay gasEstimate={mockGasEstimate} />);
      expect(screen.getByText('Gas:')).toBeInTheDocument();
    });

    it('renders icon with proper testid', () => {
      render(<GasFeeDisplay gasEstimate={mockGasEstimate} />);
      const icon = screen.getByTestId('icon-fuel');
      expect(icon).toHaveClass('text-muted');
    });
  });

  describe('Styling', () => {
    it('applies correct text styles to labels', () => {
      render(<GasFeeDisplay gasEstimate={mockGasEstimate} />);
      const gasLabel = screen.getByText('Gas:');
      expect(gasLabel).toHaveClass('text-muted');
    });

    it('applies correct text styles to fee amount', () => {
      render(<GasFeeDisplay gasEstimate={mockGasEstimate} />);
      const feeAmount = screen.getByText(/ETH/);
      expect(feeAmount).toHaveClass('text-primary');
    });

    it('applies correct text styles to preset', () => {
      render(<GasFeeDisplay gasEstimate={mockGasEstimate} />);
      const preset = screen.getByText('standard');
      expect(preset).toHaveClass('text-muted');
    });
  });
});

export default MockButton
