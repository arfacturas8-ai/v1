import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Web3ErrorHandler, {
  Web3ErrorBoundary,
  useWeb3ErrorHandler,
  getWeb3ErrorMessage
} from './Web3ErrorHandler';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  AlertTriangle: (props) => <svg data-testid="alert-triangle-icon" {...props} />,
  XCircle: (props) => <svg data-testid="x-circle-icon" {...props} />,
  RefreshCw: (props) => <svg data-testid="refresh-cw-icon" {...props} />,
  ExternalLink: (props) => <svg data-testid="external-link-icon" {...props} />,
  Info: (props) => <svg data-testid="info-icon" {...props} />,
  Zap: (props) => <svg data-testid="zap-icon" {...props} />,
  Wifi: (props) => <svg data-testid="wifi-icon" {...props} />,
  WifiOff: (props) => <svg data-testid="wifi-off-icon" {...props} />,
  Shield: (props) => <svg data-testid="shield-icon" {...props} />,
  AlertCircle: (props) => <svg data-testid="alert-circle-icon" {...props} />,
  Download: (props) => <svg data-testid="download-icon" {...props} />,
  ArrowRight: (props) => <svg data-testid="arrow-right-icon" {...props} />,
  X: (props) => <svg data-testid="x-icon" {...props} />,
}));

// Mock Button component
jest.mock('../ui/Button', () => {
  return function Button({ children, onClick, size, variant, className, ...props }) {
    return (
      <button
        onClick={onClick}
        data-size={size}
        data-variant={variant}
        className={className}
        {...props}
      >
        {children}
      </button>
    );
  };
});

describe('Web3ErrorHandler', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing with a basic error', () => {
      const error = new Error('Test error');
      render(<Web3ErrorHandler error={error} />);
      expect(screen.getByText(/Unexpected Error/i)).toBeInTheDocument();
    });

    it('returns null when no error is provided', () => {
      const { container } = render(<Web3ErrorHandler error={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('returns null when error is undefined', () => {
      const { container } = render(<Web3ErrorHandler error={undefined} />);
      expect(container.firstChild).toBeNull();
    });

    it('applies custom className when provided', () => {
      const error = new Error('Test error');
      const { container } = render(<Web3ErrorHandler error={error} className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('renders with default empty className', () => {
      const error = new Error('Test error');
      render(<Web3ErrorHandler error={error} />);
      expect(screen.getByText(/Unexpected Error/i)).toBeInTheDocument();
    });
  });

  describe('Wallet Connection Errors', () => {
    it('displays wallet not found error correctly', () => {
      const error = new Error('No Web3 wallet detected');
      render(<Web3ErrorHandler error={error} />);

      expect(screen.getByText('Wallet Not Found')).toBeInTheDocument();
      expect(screen.getByText(/No Web3 wallet detected/i)).toBeInTheDocument();
      expect(screen.getByTestId('x-circle-icon')).toBeInTheDocument();
    });

    it('displays wallet not connected error correctly', () => {
      const error = new Error('wallet not connected');
      render(<Web3ErrorHandler error={error} />);

      expect(screen.getByText('Wallet Not Connected')).toBeInTheDocument();
      expect(screen.getByText(/Please connect your wallet/i)).toBeInTheDocument();
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
    });

    it('displays no account error as wallet not connected', () => {
      const error = new Error('no account available');
      render(<Web3ErrorHandler error={error} />);

      expect(screen.getByText('Wallet Not Connected')).toBeInTheDocument();
    });

    it('displays connection rejected error correctly', () => {
      const error = new Error('User rejected the request');
      render(<Web3ErrorHandler error={error} />);

      expect(screen.getByText('Connection Rejected')).toBeInTheDocument();
      expect(screen.getByText(/You rejected the wallet connection/i)).toBeInTheDocument();
    });

    it('handles lowercase user rejected', () => {
      const error = new Error('user rejected the connection');
      render(<Web3ErrorHandler error={error} />);

      expect(screen.getByText('Connection Rejected')).toBeInTheDocument();
    });
  });

  describe('Transaction Errors', () => {
    it('displays insufficient funds error correctly', () => {
      const error = new Error('insufficient funds for transfer');
      render(<Web3ErrorHandler error={error} />);

      expect(screen.getByText('Insufficient Funds')).toBeInTheDocument();
      expect(screen.getByText(/don't have enough funds/i)).toBeInTheDocument();
      expect(screen.getByTestId('x-circle-icon')).toBeInTheDocument();
    });

    it('displays insufficient balance as insufficient funds', () => {
      const error = new Error('insufficient balance');
      render(<Web3ErrorHandler error={error} />);

      expect(screen.getByText('Insufficient Funds')).toBeInTheDocument();
    });

    it('displays gas estimation failed error correctly', () => {
      const error = new Error('gas estimation failed');
      render(<Web3ErrorHandler error={error} />);

      expect(screen.getByText('Gas Estimation Failed')).toBeInTheDocument();
      expect(screen.getByText(/Unable to estimate gas fees/i)).toBeInTheDocument();
    });

    it('displays gas estimate error', () => {
      const error = new Error('cannot estimate gas');
      render(<Web3ErrorHandler error={error} />);

      expect(screen.getByText('Gas Estimation Failed')).toBeInTheDocument();
    });

    it('displays transaction failed error correctly', () => {
      const error = new Error('transaction failed');
      render(<Web3ErrorHandler error={error} />);

      expect(screen.getByText('Transaction Failed')).toBeInTheDocument();
      expect(screen.getByText(/could not be processed/i)).toBeInTheDocument();
    });

    it('displays execution reverted as transaction failed', () => {
      const error = new Error('execution reverted');
      render(<Web3ErrorHandler error={error} />);

      expect(screen.getByText('Transaction Failed')).toBeInTheDocument();
    });

    it('displays user rejected transaction error correctly', () => {
      const error = new Error('User rejected transaction');
      render(<Web3ErrorHandler error={error} />);

      expect(screen.getByText('Transaction Rejected')).toBeInTheDocument();
      expect(screen.getByText(/You cancelled the transaction/i)).toBeInTheDocument();
      expect(screen.getByTestId('info-icon')).toBeInTheDocument();
    });

    it('handles lowercase user rejected transaction', () => {
      const error = new Error('user rejected the transaction request');
      render(<Web3ErrorHandler error={error} />);

      expect(screen.getByText('Transaction Rejected')).toBeInTheDocument();
    });
  });

  describe('Network and Chain Errors', () => {
    it('displays network error correctly', () => {
      const error = new Error('network error occurred');
      render(<Web3ErrorHandler error={error} />);

      expect(screen.getByText('Network Error')).toBeInTheDocument();
      expect(screen.getByText(/Unable to connect to the blockchain/i)).toBeInTheDocument();
    });

    it('displays unsupported chain error correctly', () => {
      const error = new Error('unsupported chain');
      render(<Web3ErrorHandler error={error} />);

      expect(screen.getByText('Unsupported Network')).toBeInTheDocument();
      expect(screen.getByText(/not currently supported/i)).toBeInTheDocument();
    });

    it('displays chain switch rejected error correctly', () => {
      const error = new Error('User rejected switch chain');
      render(<Web3ErrorHandler error={error} />);

      expect(screen.getByText('Network Switch Rejected')).toBeInTheDocument();
      expect(screen.getByText(/rejected the network switch/i)).toBeInTheDocument();
    });

    it('displays chain not added error using error code 4902', () => {
      const error = { code: 4902, message: 'Chain not added' };
      render(<Web3ErrorHandler error={error} />);

      expect(screen.getByText('Network Not Added')).toBeInTheDocument();
      expect(screen.getByText(/not added to your wallet/i)).toBeInTheDocument();
    });
  });

  describe('Authentication Errors', () => {
    it('displays signature rejected error correctly', () => {
      const error = new Error('User rejected signature request');
      render(<Web3ErrorHandler error={error} />);

      expect(screen.getByText('Signature Rejected')).toBeInTheDocument();
      expect(screen.getByText(/rejected the signature/i)).toBeInTheDocument();
    });

    it('handles sign rejection', () => {
      const error = new Error('User rejected sign message');
      render(<Web3ErrorHandler error={error} />);

      expect(screen.getByText('Signature Rejected')).toBeInTheDocument();
    });
  });

  describe('General Errors', () => {
    it('displays timeout error correctly', () => {
      const error = new Error('Request timeout');
      render(<Web3ErrorHandler error={error} />);

      expect(screen.getByText('Request Timeout')).toBeInTheDocument();
      expect(screen.getByText(/took too long to complete/i)).toBeInTheDocument();
    });

    it('handles timed out error', () => {
      const error = new Error('Operation timed out');
      render(<Web3ErrorHandler error={error} />);

      expect(screen.getByText('Request Timeout')).toBeInTheDocument();
    });

    it('displays unknown error for unrecognized patterns', () => {
      const error = new Error('Some random error message');
      render(<Web3ErrorHandler error={error} />);

      expect(screen.getByText('Unexpected Error')).toBeInTheDocument();
      expect(screen.getByText(/An unexpected error occurred/i)).toBeInTheDocument();
    });

    it('handles error without message', () => {
      const error = {};
      render(<Web3ErrorHandler error={error} />);

      expect(screen.getByText('Unexpected Error')).toBeInTheDocument();
    });

    it('handles error that is a string', () => {
      const error = 'String error message';
      render(<Web3ErrorHandler error={error} />);

      expect(screen.getByText('Unexpected Error')).toBeInTheDocument();
    });
  });

  describe('Error Severity Styling', () => {
    it('applies error severity styling', () => {
      const error = new Error('insufficient funds');
      const { container } = render(<Web3ErrorHandler error={error} />);

      expect(container.querySelector('.text-error')).toBeInTheDocument();
      expect(container.querySelector('.bg-error\\/10')).toBeInTheDocument();
      expect(container.querySelector('.border-error\\/30')).toBeInTheDocument();
    });

    it('applies warning severity styling', () => {
      const error = new Error('wallet not connected');
      const { container } = render(<Web3ErrorHandler error={error} />);

      expect(container.querySelector('.text-warning')).toBeInTheDocument();
      expect(container.querySelector('.bg-warning\\/10')).toBeInTheDocument();
      expect(container.querySelector('.border-warning\\/30')).toBeInTheDocument();
    });

    it('applies info severity styling', () => {
      const error = new Error('User rejected transaction');
      const { container } = render(<Web3ErrorHandler error={error} />);

      expect(container.querySelector('.text-info')).toBeInTheDocument();
      expect(container.querySelector('.bg-info\\/10')).toBeInTheDocument();
      expect(container.querySelector('.border-info\\/30')).toBeInTheDocument();
    });
  });

  describe('Retry Functionality', () => {
    it('shows retry button when onRetry is provided and error is actionable', () => {
      const error = new Error('network error');
      const onRetry = jest.fn();

      render(<Web3ErrorHandler error={error} onRetry={onRetry} />);

      expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
      expect(screen.getByTestId('refresh-cw-icon')).toBeInTheDocument();
    });

    it('calls onRetry when retry button is clicked', () => {
      const error = new Error('network error');
      const onRetry = jest.fn();

      render(<Web3ErrorHandler error={error} onRetry={onRetry} />);

      const retryButton = screen.getByRole('button', { name: /Try Again/i });
      fireEvent.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('does not show retry button when onRetry is not provided', () => {
      const error = new Error('network error');

      render(<Web3ErrorHandler error={error} />);

      expect(screen.queryByRole('button', { name: /Try Again/i })).not.toBeInTheDocument();
    });

    it('does not show retry button for non-actionable errors', () => {
      const error = new Error('User rejected transaction');
      const onRetry = jest.fn();

      render(<Web3ErrorHandler error={error} onRetry={onRetry} />);

      expect(screen.queryByRole('button', { name: /Try Again/i })).not.toBeInTheDocument();
    });

    it('can retry multiple times', async () => {
      const error = new Error('network error');
      const onRetry = jest.fn();

      render(<Web3ErrorHandler error={error} onRetry={onRetry} />);

      const retryButton = screen.getByRole('button', { name: /Try Again/i });

      fireEvent.click(retryButton);
      fireEvent.click(retryButton);
      fireEvent.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(3);
    });
  });

  describe('Dismiss Functionality', () => {
    it('shows dismiss button when onDismiss is provided', () => {
      const error = new Error('Test error');
      const onDismiss = jest.fn();

      render(<Web3ErrorHandler error={error} onDismiss={onDismiss} />);

      const dismissButton = screen.getByTestId('x-icon').closest('button');
      expect(dismissButton).toBeInTheDocument();
    });

    it('calls onDismiss when dismiss button is clicked', () => {
      const error = new Error('Test error');
      const onDismiss = jest.fn();

      render(<Web3ErrorHandler error={error} onDismiss={onDismiss} />);

      const dismissButton = screen.getByTestId('x-icon').closest('button');
      fireEvent.click(dismissButton);

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('does not show dismiss button when onDismiss is not provided', () => {
      const error = new Error('Test error');

      render(<Web3ErrorHandler error={error} />);

      const xIcon = screen.queryByTestId('x-icon');
      expect(xIcon).not.toBeInTheDocument();
    });
  });

  describe('Solutions Display', () => {
    it('shows solutions button when solutions are available', () => {
      const error = new Error('insufficient funds');
      render(<Web3ErrorHandler error={error} />);

      expect(screen.getByRole('button', { name: /Show Solutions/i })).toBeInTheDocument();
    });

    it('toggles solutions display when button is clicked', async () => {
      const error = new Error('insufficient funds');
      render(<Web3ErrorHandler error={error} />);

      const solutionsButton = screen.getByRole('button', { name: /Show Solutions/i });

      expect(screen.queryByText(/Suggested Solutions/i)).not.toBeInTheDocument();

      fireEvent.click(solutionsButton);

      await waitFor(() => {
        expect(screen.getByText(/Suggested Solutions/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/Add more funds to your wallet/i)).toBeInTheDocument();
      expect(screen.getByText(/Reduce the transaction amount/i)).toBeInTheDocument();
    });

    it('changes button text when solutions are shown', async () => {
      const error = new Error('insufficient funds');
      render(<Web3ErrorHandler error={error} />);

      const solutionsButton = screen.getByRole('button', { name: /Show Solutions/i });
      fireEvent.click(solutionsButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Hide Solutions/i })).toBeInTheDocument();
      });
    });

    it('displays all solutions with arrow icons', async () => {
      const error = new Error('wallet not found');
      render(<Web3ErrorHandler error={error} />);

      const solutionsButton = screen.getByRole('button', { name: /Show Solutions/i });
      fireEvent.click(solutionsButton);

      await waitFor(() => {
        expect(screen.getByText(/Install MetaMask browser extension/i)).toBeInTheDocument();
        expect(screen.getByText(/Install Coinbase Wallet/i)).toBeInTheDocument();
        expect(screen.getByText(/Use a Web3-enabled browser/i)).toBeInTheDocument();
      });

      const arrowIcons = screen.getAllByTestId('arrow-right-icon');
      expect(arrowIcons.length).toBe(3);
    });

    it('can toggle solutions multiple times', async () => {
      const error = new Error('gas estimation failed');
      render(<Web3ErrorHandler error={error} />);

      const solutionsButton = screen.getByRole('button', { name: /Show Solutions/i });

      fireEvent.click(solutionsButton);
      await waitFor(() => expect(screen.getByText(/Suggested Solutions/i)).toBeInTheDocument());

      fireEvent.click(solutionsButton);
      await waitFor(() => expect(screen.queryByText(/Suggested Solutions/i)).not.toBeInTheDocument());

      fireEvent.click(solutionsButton);
      await waitFor(() => expect(screen.getByText(/Suggested Solutions/i)).toBeInTheDocument());
    });
  });

  describe('Technical Details', () => {
    it('shows technical details button when showTechnicalDetails is true', () => {
      const error = new Error('Test error');
      render(<Web3ErrorHandler error={error} showTechnicalDetails={true} />);

      expect(screen.getByRole('button', { name: /Technical Details/i })).toBeInTheDocument();
    });

    it('does not show technical details button when showTechnicalDetails is false', () => {
      const error = new Error('Test error');
      render(<Web3ErrorHandler error={error} showTechnicalDetails={false} />);

      expect(screen.queryByRole('button', { name: /Technical Details/i })).not.toBeInTheDocument();
    });

    it('toggles technical details display when button is clicked', async () => {
      const error = new Error('Detailed error message');
      render(<Web3ErrorHandler error={error} showTechnicalDetails={true} />);

      const detailsButton = screen.getByRole('button', { name: /Technical Details/i });

      expect(screen.queryByText(/Technical Details:/i)).not.toBeInTheDocument();

      fireEvent.click(detailsButton);

      await waitFor(() => {
        expect(screen.getByText(/Technical Details:/i)).toBeInTheDocument();
        expect(screen.getByText('Detailed error message')).toBeInTheDocument();
      });
    });

    it('changes button text when details are shown', async () => {
      const error = new Error('Test error');
      render(<Web3ErrorHandler error={error} showTechnicalDetails={true} />);

      const detailsButton = screen.getByRole('button', { name: /Technical Details/i });
      fireEvent.click(detailsButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Hide Details/i })).toBeInTheDocument();
      });
    });

    it('displays stack trace when available', async () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at line 1\n    at line 2';

      render(<Web3ErrorHandler error={error} showTechnicalDetails={true} />);

      const detailsButton = screen.getByRole('button', { name: /Technical Details/i });
      fireEvent.click(detailsButton);

      await waitFor(() => {
        expect(screen.getByText(/Stack Trace/i)).toBeInTheDocument();
      });
    });

    it('expands stack trace when summary is clicked', async () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at line 1\n    at line 2';

      render(<Web3ErrorHandler error={error} showTechnicalDetails={true} />);

      const detailsButton = screen.getByRole('button', { name: /Technical Details/i });
      fireEvent.click(detailsButton);

      await waitFor(() => {
        const stackSummary = screen.getByText(/Stack Trace/i);
        fireEvent.click(stackSummary);
      });
    });

    it('shows message when no additional details available', async () => {
      const error = {};
      render(<Web3ErrorHandler error={error} showTechnicalDetails={true} />);

      const detailsButton = screen.getByRole('button', { name: /Technical Details/i });
      fireEvent.click(detailsButton);

      await waitFor(() => {
        expect(screen.getByText(/No additional details available/i)).toBeInTheDocument();
      });
    });
  });

  describe('Combined Interactions', () => {
    it('can show solutions and technical details simultaneously', async () => {
      const error = new Error('insufficient funds');
      render(
        <Web3ErrorHandler
          error={error}
          showTechnicalDetails={true}
          onRetry={jest.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /Show Solutions/i }));
      fireEvent.click(screen.getByRole('button', { name: /Technical Details/i }));

      await waitFor(() => {
        expect(screen.getByText(/Suggested Solutions/i)).toBeInTheDocument();
        expect(screen.getByText(/Technical Details:/i)).toBeInTheDocument();
      });
    });

    it('shows all action buttons together', () => {
      const error = new Error('network error');
      render(
        <Web3ErrorHandler
          error={error}
          onRetry={jest.fn()}
          showTechnicalDetails={true}
        />
      );

      expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Show Solutions/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Technical Details/i })).toBeInTheDocument();
    });

    it('allows interaction with all features independently', async () => {
      const error = new Error('gas estimation failed');
      const onRetry = jest.fn();
      const onDismiss = jest.fn();

      render(
        <Web3ErrorHandler
          error={error}
          onRetry={onRetry}
          onDismiss={onDismiss}
          showTechnicalDetails={true}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /Try Again/i }));
      expect(onRetry).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole('button', { name: /Show Solutions/i }));
      await waitFor(() => expect(screen.getByText(/Suggested Solutions/i)).toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: /Technical Details/i }));
      await waitFor(() => expect(screen.getByText(/Technical Details:/i)).toBeInTheDocument());

      const dismissButton = screen.getByTestId('x-icon').closest('button');
      fireEvent.click(dismissButton);
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('handles null error gracefully', () => {
      const { container } = render(<Web3ErrorHandler error={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('handles empty string error', () => {
      const error = '';
      render(<Web3ErrorHandler error={error} />);
      expect(screen.getByText('Unexpected Error')).toBeInTheDocument();
    });

    it('handles error with only code property', () => {
      const error = { code: 12345 };
      render(<Web3ErrorHandler error={error} />);
      expect(screen.getByText('Unexpected Error')).toBeInTheDocument();
    });

    it('handles error with toString method', () => {
      const error = {
        toString: () => 'Custom toString error'
      };
      render(<Web3ErrorHandler error={error} />);
      expect(screen.getByText('Unexpected Error')).toBeInTheDocument();
    });

    it('handles very long error messages', () => {
      const longMessage = 'A'.repeat(1000);
      const error = new Error(longMessage);
      render(<Web3ErrorHandler error={error} showTechnicalDetails={true} />);

      const detailsButton = screen.getByRole('button', { name: /Technical Details/i });
      fireEvent.click(detailsButton);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('handles special characters in error messages', () => {
      const error = new Error('Error with <html> & "quotes" and \'apostrophes\'');
      render(<Web3ErrorHandler error={error} showTechnicalDetails={true} />);

      const detailsButton = screen.getByRole('button', { name: /Technical Details/i });
      fireEvent.click(detailsButton);

      expect(screen.getByText(/Error with <html>/i)).toBeInTheDocument();
    });

    it('handles error without actionable flag', () => {
      const error = new Error('User rejected transaction');
      render(<Web3ErrorHandler error={error} onRetry={jest.fn()} />);

      expect(screen.queryByRole('button', { name: /Try Again/i })).not.toBeInTheDocument();
    });

    it('handles error with empty solutions array', () => {
      const error = new Error('Test error');
      render(<Web3ErrorHandler error={error} />);

      // Unknown error should still have solutions
      expect(screen.getByRole('button', { name: /Show Solutions/i })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper button roles', () => {
      const error = new Error('network error');
      render(
        <Web3ErrorHandler
          error={error}
          onRetry={jest.fn()}
          onDismiss={jest.fn()}
          showTechnicalDetails={true}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('dismiss button has proper interaction', () => {
      const error = new Error('Test error');
      const onDismiss = jest.fn();

      render(<Web3ErrorHandler error={error} onDismiss={onDismiss} />);

      const dismissButton = screen.getByTestId('x-icon').closest('button');
      expect(dismissButton).toBeInTheDocument();

      fireEvent.click(dismissButton);
      expect(onDismiss).toHaveBeenCalled();
    });

    it('retry button has proper semantic structure', () => {
      const error = new Error('network error');
      const onRetry = jest.fn();

      render(<Web3ErrorHandler error={error} onRetry={onRetry} />);

      const retryButton = screen.getByRole('button', { name: /Try Again/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('has proper heading hierarchy', () => {
      const error = new Error('network error');
      render(<Web3ErrorHandler error={error} />);

      const heading = screen.getByText('Network Error');
      expect(heading.tagName).toBe('H4');
    });

    it('solutions list has proper structure', async () => {
      const error = new Error('insufficient funds');
      render(<Web3ErrorHandler error={error} />);

      fireEvent.click(screen.getByRole('button', { name: /Show Solutions/i }));

      await waitFor(() => {
        const list = document.querySelector('ul');
        expect(list).toBeInTheDocument();
        expect(list.querySelectorAll('li').length).toBeGreaterThan(0);
      });
    });

    it('technical details use details/summary elements', async () => {
      const error = new Error('Test error');
      error.stack = 'Stack trace';

      render(<Web3ErrorHandler error={error} showTechnicalDetails={true} />);

      fireEvent.click(screen.getByRole('button', { name: /Technical Details/i }));

      await waitFor(() => {
        const details = document.querySelector('details');
        expect(details).toBeInTheDocument();

        const summary = details.querySelector('summary');
        expect(summary).toBeInTheDocument();
      });
    });
  });
});

describe('Web3ErrorBoundary', () => {
  // Helper component that throws an error
  const ThrowError = ({ error }) => {
    throw error || new Error('Test error');
  };

  // Suppress console.error for error boundary tests
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('Basic Error Boundary', () => {
    it('catches errors and displays fallback UI', () => {
      render(
        <Web3ErrorBoundary>
          <ThrowError />
        </Web3ErrorBoundary>
      );

      expect(screen.getByText('Web3 Component Error')).toBeInTheDocument();
      expect(screen.getByTestId('x-circle-icon')).toBeInTheDocument();
    });

    it('renders children when no error occurs', () => {
      render(
        <Web3ErrorBoundary>
          <div>Normal content</div>
        </Web3ErrorBoundary>
      );

      expect(screen.getByText('Normal content')).toBeInTheDocument();
      expect(screen.queryByText('Web3 Component Error')).not.toBeInTheDocument();
    });

    it('displays error ID', () => {
      render(
        <Web3ErrorBoundary>
          <ThrowError />
        </Web3ErrorBoundary>
      );

      expect(screen.getByText(/Error ID:/i)).toBeInTheDocument();
    });

    it('has Try Again button', () => {
      render(
        <Web3ErrorBoundary>
          <ThrowError />
        </Web3ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
      expect(screen.getByTestId('refresh-cw-icon')).toBeInTheDocument();
    });
  });

  describe('Error Recovery', () => {
    it('resets error state when Try Again is clicked', () => {
      const { rerender } = render(
        <Web3ErrorBoundary>
          <ThrowError />
        </Web3ErrorBoundary>
      );

      expect(screen.getByText('Web3 Component Error')).toBeInTheDocument();

      const tryAgainButton = screen.getByRole('button', { name: /Try Again/i });
      fireEvent.click(tryAgainButton);

      // After reset, the component should try to render children again
      // Since ThrowError always throws, it will show error again
      expect(screen.getByText('Web3 Component Error')).toBeInTheDocument();
    });
  });

  describe('Custom Fallback', () => {
    it('renders custom fallback when provided', () => {
      const customFallback = (error, reset) => (
        <div>
          <h1>Custom Error UI</h1>
          <button onClick={reset}>Custom Reset</button>
        </div>
      );

      render(
        <Web3ErrorBoundary fallback={customFallback}>
          <ThrowError />
        </Web3ErrorBoundary>
      );

      expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Custom Reset/i })).toBeInTheDocument();
      expect(screen.queryByText('Web3 Component Error')).not.toBeInTheDocument();
    });

    it('custom fallback reset function works', () => {
      const customFallback = (error, reset) => (
        <button onClick={reset}>Reset Error</button>
      );

      render(
        <Web3ErrorBoundary fallback={customFallback}>
          <ThrowError />
        </Web3ErrorBoundary>
      );

      const resetButton = screen.getByRole('button', { name: /Reset Error/i });
      fireEvent.click(resetButton);

      // Component should attempt to re-render
      expect(screen.getByRole('button', { name: /Reset Error/i })).toBeInTheDocument();
    });

    it('passes error to custom fallback', () => {
      const testError = new Error('Specific test error');
      const customFallback = (error) => <div>Error: {error.message}</div>;

      render(
        <Web3ErrorBoundary fallback={customFallback}>
          <ThrowError error={testError} />
        </Web3ErrorBoundary>
      );

      expect(screen.getByText('Error: Specific test error')).toBeInTheDocument();
    });
  });

  describe('Error Logging', () => {
    it('calls onError callback when error occurs', () => {
      const onError = jest.fn();

      render(
        <Web3ErrorBoundary onError={onError}>
          <ThrowError />
        </Web3ErrorBoundary>
      );

      expect(onError).toHaveBeenCalled();
      expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    });

    it('logs to console.error', () => {
      render(
        <Web3ErrorBoundary>
          <ThrowError />
        </Web3ErrorBoundary>
      );

      expect(console.error).toHaveBeenCalled();
    });

    it('does not call onError when no error occurs', () => {
      const onError = jest.fn();

      render(
        <Web3ErrorBoundary onError={onError}>
          <div>No error</div>
        </Web3ErrorBoundary>
      );

      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('Multiple Children', () => {
    it('handles multiple children without errors', () => {
      render(
        <Web3ErrorBoundary>
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </Web3ErrorBoundary>
      );

      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
      expect(screen.getByText('Child 3')).toBeInTheDocument();
    });

    it('catches error from any child', () => {
      render(
        <Web3ErrorBoundary>
          <div>Safe child 1</div>
          <ThrowError />
          <div>Safe child 2</div>
        </Web3ErrorBoundary>
      );

      expect(screen.getByText('Web3 Component Error')).toBeInTheDocument();
      expect(screen.queryByText('Safe child 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Safe child 2')).not.toBeInTheDocument();
    });
  });

  describe('Nested Error Boundaries', () => {
    it('inner boundary catches errors before outer', () => {
      const outerFallback = () => <div>Outer Error</div>;
      const innerFallback = () => <div>Inner Error</div>;

      render(
        <Web3ErrorBoundary fallback={outerFallback}>
          <div>Outer content</div>
          <Web3ErrorBoundary fallback={innerFallback}>
            <ThrowError />
          </Web3ErrorBoundary>
        </Web3ErrorBoundary>
      );

      expect(screen.getByText('Inner Error')).toBeInTheDocument();
      expect(screen.queryByText('Outer Error')).not.toBeInTheDocument();
      expect(screen.getByText('Outer content')).toBeInTheDocument();
    });
  });

  describe('Error Boundary State', () => {
    it('generates unique error ID for each error', () => {
      const { rerender } = render(
        <Web3ErrorBoundary>
          <ThrowError />
        </Web3ErrorBoundary>
      );

      const firstErrorId = screen.getByText(/Error ID:/i).textContent;

      // Reset and cause error again
      const tryAgain = screen.getByRole('button', { name: /Try Again/i });
      fireEvent.click(tryAgain);

      // Should generate new error ID
      const secondErrorId = screen.getByText(/Error ID:/i).textContent;
      expect(secondErrorId).toBeTruthy();
    });
  });
});

describe('useWeb3ErrorHandler Hook', () => {
  const TestComponent = () => {
    const { errors, addError, dismissError, clearAllErrors } = useWeb3ErrorHandler();

    return (
      <div>
        <div data-testid="error-count">{errors.length}</div>
        <button onClick={() => addError(new Error('Test error 1'))}>Add Error 1</button>
        <button onClick={() => addError(new Error('Test error 2'))}>Add Error 2</button>
        <button onClick={() => addError(new Error('User rejected transaction'))}>Add Info Error</button>
        <button onClick={clearAllErrors}>Clear All</button>
        {errors.map(err => (
          <div key={err.id}>
            <span data-testid={`error-${err.id}`}>{err.error.message}</span>
            <button onClick={() => dismissError(err.id)}>Dismiss {err.id}</button>
          </div>
        ))}
      </div>
    );
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Basic Functionality', () => {
    it('initializes with empty errors array', () => {
      render(<TestComponent />);
      expect(screen.getByTestId('error-count')).toHaveTextContent('0');
    });

    it('adds errors to the list', () => {
      render(<TestComponent />);

      fireEvent.click(screen.getByRole('button', { name: /Add Error 1/i }));

      expect(screen.getByTestId('error-count')).toHaveTextContent('1');
      expect(screen.getByText('Test error 1')).toBeInTheDocument();
    });

    it('adds multiple errors', () => {
      render(<TestComponent />);

      fireEvent.click(screen.getByRole('button', { name: /Add Error 1/i }));
      fireEvent.click(screen.getByRole('button', { name: /Add Error 2/i }));

      expect(screen.getByTestId('error-count')).toHaveTextContent('2');
      expect(screen.getByText('Test error 1')).toBeInTheDocument();
      expect(screen.getByText('Test error 2')).toBeInTheDocument();
    });

    it('returns unique error ID when adding error', () => {
      const TestWithIdCheck = () => {
        const { addError } = useWeb3ErrorHandler();
        const [errorId, setErrorId] = React.useState(null);

        return (
          <div>
            <button onClick={() => {
              const id = addError(new Error('Test'));
              setErrorId(id);
            }}>Add Error</button>
            <div data-testid="error-id">{errorId}</div>
          </div>
        );
      };

      render(<TestWithIdCheck />);
      fireEvent.click(screen.getByRole('button', { name: /Add Error/i }));

      const errorId = screen.getByTestId('error-id').textContent;
      expect(errorId).toBeTruthy();
      expect(errorId.length).toBeGreaterThan(0);
    });
  });

  describe('Error Dismissal', () => {
    it('dismisses specific error by ID', async () => {
      render(<TestComponent />);

      fireEvent.click(screen.getByRole('button', { name: /Add Error 1/i }));
      fireEvent.click(screen.getByRole('button', { name: /Add Error 2/i }));

      expect(screen.getByTestId('error-count')).toHaveTextContent('2');

      const dismissButtons = screen.getAllByRole('button', { name: /Dismiss/i });
      fireEvent.click(dismissButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('error-count')).toHaveTextContent('1');
      });
    });

    it('clears all errors', async () => {
      render(<TestComponent />);

      fireEvent.click(screen.getByRole('button', { name: /Add Error 1/i }));
      fireEvent.click(screen.getByRole('button', { name: /Add Error 2/i }));

      expect(screen.getByTestId('error-count')).toHaveTextContent('2');

      fireEvent.click(screen.getByRole('button', { name: /Clear All/i }));

      await waitFor(() => {
        expect(screen.getByTestId('error-count')).toHaveTextContent('0');
      });
    });
  });

  describe('Auto-dismiss for Info Errors', () => {
    it('auto-dismisses info severity errors after 5 seconds', async () => {
      render(<TestComponent />);

      fireEvent.click(screen.getByRole('button', { name: /Add Info Error/i }));

      expect(screen.getByTestId('error-count')).toHaveTextContent('1');
      expect(screen.getByText('User rejected transaction')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(screen.getByTestId('error-count')).toHaveTextContent('0');
      });
    });

    it('does not auto-dismiss non-info errors', async () => {
      render(<TestComponent />);

      fireEvent.click(screen.getByRole('button', { name: /Add Error 1/i }));

      expect(screen.getByTestId('error-count')).toHaveTextContent('1');

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(screen.getByTestId('error-count')).toHaveTextContent('1');
      });
    });
  });

  describe('Error Limit', () => {
    it('keeps maximum of 5 errors', () => {
      const TestManyErrors = () => {
        const { errors, addError } = useWeb3ErrorHandler();

        return (
          <div>
            <div data-testid="error-count">{errors.length}</div>
            <button onClick={() => {
              for (let i = 0; i < 10; i++) {
                addError(new Error(`Error ${i}`));
              }
            }}>Add Many Errors</button>
          </div>
        );
      };

      render(<TestManyErrors />);
      fireEvent.click(screen.getByRole('button', { name: /Add Many Errors/i }));

      expect(screen.getByTestId('error-count')).toHaveTextContent('5');
    });

    it('shows most recent errors when limit exceeded', () => {
      const TestManyErrors = () => {
        const { errors, addError } = useWeb3ErrorHandler();

        return (
          <div>
            <button onClick={() => {
              addError(new Error('Old error'));
              addError(new Error('Error 1'));
              addError(new Error('Error 2'));
              addError(new Error('Error 3'));
              addError(new Error('Error 4'));
              addError(new Error('Recent error'));
            }}>Add Errors</button>
            {errors.map(err => (
              <div key={err.id}>{err.error.message}</div>
            ))}
          </div>
        );
      };

      render(<TestManyErrors />);
      fireEvent.click(screen.getByRole('button', { name: /Add Errors/i }));

      expect(screen.getByText('Recent error')).toBeInTheDocument();
      expect(screen.queryByText('Old error')).not.toBeInTheDocument();
    });
  });

  describe('Error Metadata', () => {
    it('includes timestamp in error entry', () => {
      const TestWithMetadata = () => {
        const { errors, addError } = useWeb3ErrorHandler();

        return (
          <div>
            <button onClick={() => addError(new Error('Test'))}>Add Error</button>
            {errors.map(err => (
              <div key={err.id}>
                <span data-testid="has-timestamp">{err.timestamp ? 'yes' : 'no'}</span>
              </div>
            ))}
          </div>
        );
      };

      render(<TestWithMetadata />);
      fireEvent.click(screen.getByRole('button', { name: /Add Error/i }));

      expect(screen.getByTestId('has-timestamp')).toHaveTextContent('yes');
    });

    it('accepts additional options when adding error', () => {
      const TestWithOptions = () => {
        const { errors, addError } = useWeb3ErrorHandler();

        return (
          <div>
            <button onClick={() => addError(new Error('Test'), { metadata: 'custom' })}>
              Add Error
            </button>
            {errors.map(err => (
              <div key={err.id}>
                <span data-testid="metadata">{err.metadata}</span>
              </div>
            ))}
          </div>
        );
      };

      render(<TestWithOptions />);
      fireEvent.click(screen.getByRole('button', { name: /Add Error/i }));

      expect(screen.getByTestId('metadata')).toHaveTextContent('custom');
    });
  });
});

describe('getWeb3ErrorMessage Utility', () => {
  it('returns message for wallet not found error', () => {
    const error = new Error('No Web3 wallet detected');
    const message = getWeb3ErrorMessage(error);

    expect(message).toBe('No Web3 wallet detected. Please install a compatible wallet.');
  });

  it('returns message for insufficient funds error', () => {
    const error = new Error('insufficient funds');
    const message = getWeb3ErrorMessage(error);

    expect(message).toContain("don't have enough funds");
  });

  it('returns message for user rejected transaction', () => {
    const error = new Error('User rejected transaction');
    const message = getWeb3ErrorMessage(error);

    expect(message).toBe('You cancelled the transaction.');
  });

  it('returns message for network error', () => {
    const error = new Error('network error');
    const message = getWeb3ErrorMessage(error);

    expect(message).toBe('Unable to connect to the blockchain network.');
  });

  it('returns unknown error message for unrecognized errors', () => {
    const error = new Error('Random error');
    const message = getWeb3ErrorMessage(error);

    expect(message).toBe('An unexpected error occurred.');
  });

  it('handles null error', () => {
    const message = getWeb3ErrorMessage(null);
    expect(message).toBe('An unexpected error occurred.');
  });

  it('handles error object without message', () => {
    const error = {};
    const message = getWeb3ErrorMessage(error);

    expect(message).toBe('An unexpected error occurred.');
  });

  it('returns correct message for all error types', () => {
    const errorTypes = [
      { error: new Error('wallet not found'), expectedText: 'No Web3 wallet' },
      { error: new Error('wallet not connected'), expectedText: 'connect your wallet' },
      { error: new Error('User rejected'), expectedText: 'rejected' },
      { error: new Error('insufficient funds'), expectedText: 'enough funds' },
      { error: new Error('gas estimation failed'), expectedText: 'estimate gas' },
      { error: new Error('transaction failed'), expectedText: 'not be processed' },
      { error: new Error('unsupported chain'), expectedText: 'not currently supported' },
      { error: new Error('timeout'), expectedText: 'too long' },
    ];

    errorTypes.forEach(({ error, expectedText }) => {
      const message = getWeb3ErrorMessage(error);
      expect(message.toLowerCase()).toContain(expectedText.toLowerCase());
    });
  });
});

describe('Snapshot Tests', () => {
  it('matches snapshot for wallet not found error', () => {
    const error = new Error('No Web3 wallet');
    const { container } = render(<Web3ErrorHandler error={error} />);
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot for insufficient funds with all features', () => {
    const error = new Error('insufficient funds');
    const { container } = render(
      <Web3ErrorHandler
        error={error}
        onRetry={jest.fn()}
        onDismiss={jest.fn()}
        showTechnicalDetails={true}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot for error boundary fallback', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    jest.spyOn(console, 'error').mockImplementation(() => {});

    const { container } = render(
      <Web3ErrorBoundary>
        <ThrowError />
      </Web3ErrorBoundary>
    );

    expect(container).toMatchSnapshot();
    console.error.mockRestore();
  });

  it('matches snapshot for info severity error', () => {
    const error = new Error('User rejected transaction');
    const { container } = render(<Web3ErrorHandler error={error} />);
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot for warning severity error', () => {
    const error = new Error('wallet not connected');
    const { container } = render(<Web3ErrorHandler error={error} />);
    expect(container).toMatchSnapshot();
  });
});

export default Button
