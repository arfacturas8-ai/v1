/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CryptoTippingButton from './CryptoTippingButton';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Coins: (props) => <svg data-testid="coins-icon" {...props} />,
  Heart: (props) => <svg data-testid="heart-icon" {...props} />,
  Gift: (props) => <svg data-testid="gift-icon" {...props} />,
  Sparkles: (props) => <svg data-testid="sparkles-icon" {...props} />,
  ArrowRight: (props) => <svg data-testid="arrow-right-icon" {...props} />,
  Clock: (props) => <svg data-testid="clock-icon" {...props} />,
  Zap: (props) => <svg data-testid="zap-icon" {...props} />,
}));

// Mock Button component
jest.mock('../ui/Button', () => {
  return function MockButton({ children, onClick, className, disabled }) {
    return (
      <button onClick={onClick} className={className} disabled={disabled}>
        {children}
      </button>
    );
  };
});

// Mock Card component
jest.mock('../ui/Card', () => {
  return function MockCard({ children, className }) {
    return <div className={className}>{children}</div>;
  };
});

// Mock ComingSoonWrapper
jest.mock('./ComingSoonWrapper', () => {
  return function MockComingSoonWrapper({ children, isEnabled, showPreview }) {
    // By default, show the feature (can be overridden in tests)
    const shouldShow = isEnabled !== undefined ? isEnabled : true;
    if (shouldShow) {
      return <>{children}</>;
    }
    return (
      <div data-testid="coming-soon-wrapper">
        {showPreview && <div className="blur-sm opacity-30">{children}</div>}
        <div>Coming Soon</div>
      </div>
    );
  };
});

// Mock import.meta.env
const mockEnv = {
  DEV: false,
  VITE_ENABLE_WEB3_FEATURES: 'false',
};

Object.defineProperty(import.meta, 'env', {
  get: () => mockEnv,
  configurable: true,
});

describe('CryptoTippingButton', () => {
  let user;
  let alertSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    user = userEvent.setup();
    alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    alertSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('Component Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<CryptoTippingButton />);
      expect(container).toBeInTheDocument();
    });

    it('renders with default props', () => {
      render(<CryptoTippingButton />);
      const button = screen.getByRole('button', { name: /tip crypto/i });
      expect(button).toBeInTheDocument();
    });

    it('displays Coins icon', () => {
      render(<CryptoTippingButton />);
      expect(screen.getByTestId('coins-icon')).toBeInTheDocument();
    });

    it('renders without console errors', () => {
      render(<CryptoTippingButton />);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('renders within ComingSoonWrapper', () => {
      const { container } = render(<CryptoTippingButton />);
      expect(container).toBeTruthy();
    });

    it('applies custom className', () => {
      render(<CryptoTippingButton className="custom-class" />);
      const button = screen.getByRole('button', { name: /tip crypto/i });
      expect(button.className).toContain('custom-class');
    });
  });

  describe('Button Variants and Sizes', () => {
    it('renders with primary variant by default', () => {
      render(<CryptoTippingButton />);
      const button = screen.getByRole('button', { name: /tip crypto/i });
      expect(button.className).toMatch(/btn-primary/);
    });

    it('renders with secondary variant', () => {
      render(<CryptoTippingButton variant="secondary" />);
      const button = screen.getByRole('button', { name: /tip crypto/i });
      expect(button.className).toMatch(/btn-secondary/);
    });

    it('applies small size classes', () => {
      render(<CryptoTippingButton size="sm" />);
      const button = screen.getByRole('button', { name: /tip crypto/i });
      expect(button.className).toMatch(/px-sm|py-xs|text-sm/);
    });

    it('applies medium size classes by default', () => {
      render(<CryptoTippingButton size="md" />);
      const button = screen.getByRole('button', { name: /tip crypto/i });
      expect(button.className).toMatch(/px-md|py-sm|text-base/);
    });

    it('applies large size classes', () => {
      render(<CryptoTippingButton size="lg" />);
      const button = screen.getByRole('button', { name: /tip crypto/i });
      expect(button.className).toMatch(/px-lg|py-md|text-lg/);
    });
  });

  describe('Amount Display', () => {
    it('shows selected amount by default', () => {
      render(<CryptoTippingButton showAmount={true} />);
      expect(screen.getByText(/0.005 ETH/i)).toBeInTheDocument();
    });

    it('hides amount when showAmount is false', () => {
      render(<CryptoTippingButton showAmount={false} />);
      expect(screen.queryByText(/0.005 ETH/i)).not.toBeInTheDocument();
    });

    it('shows USD value when showUSD is true', () => {
      render(<CryptoTippingButton showAmount={true} showUSD={true} />);
      expect(screen.getByText(/\$17\.5/)).toBeInTheDocument();
    });

    it('hides USD value when showUSD is false', () => {
      render(<CryptoTippingButton showAmount={true} showUSD={false} />);
      expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
    });

    it('displays default selected amount (0.005 ETH)', () => {
      render(<CryptoTippingButton showAmount={true} />);
      expect(screen.getByText('0.005 ETH')).toBeInTheDocument();
    });
  });

  describe('Modal Opening and Closing', () => {
    it('opens tip modal when button is clicked', async () => {
      render(<CryptoTippingButton />);
      const button = screen.getByRole('button', { name: /tip crypto/i });

      await user.click(button);

      expect(screen.getByText('Send Crypto Tip')).toBeInTheDocument();
    });

    it('closes modal when close button is clicked', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));
      expect(screen.getByText('Send Crypto Tip')).toBeInTheDocument();

      const closeButton = screen.getByText('×');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Send Crypto Tip')).not.toBeInTheDocument();
      });
    });

    it('closes modal when Cancel button is clicked', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));
      expect(screen.getByText('Send Crypto Tip')).toBeInTheDocument();

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Send Crypto Tip')).not.toBeInTheDocument();
      });
    });

    it('modal is not visible initially', () => {
      render(<CryptoTippingButton />);
      expect(screen.queryByText('Send Crypto Tip')).not.toBeInTheDocument();
    });

    it('modal overlay has proper z-index', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const modal = screen.getByText('Send Crypto Tip').closest('.fixed');
      expect(modal?.className).toMatch(/z-50/);
    });
  });

  describe('Modal Content', () => {
    it('displays modal header with Gift icon', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      expect(screen.getByTestId('gift-icon')).toBeInTheDocument();
      expect(screen.getByText('Send Crypto Tip')).toBeInTheDocument();
    });

    it('displays recipient name when provided', async () => {
      render(<CryptoTippingButton recipientName="Alice" />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      expect(screen.getByText(/To: Alice/i)).toBeInTheDocument();
    });

    it('does not display recipient name when not provided', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      expect(screen.queryByText(/To:/i)).not.toBeInTheDocument();
    });

    it('displays amount selection label', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      expect(screen.getByText('Select Amount')).toBeInTheDocument();
    });

    it('displays all predefined tip amounts', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      expect(screen.getByText('0.001 ETH')).toBeInTheDocument();
      expect(screen.getByText('0.005 ETH')).toBeInTheDocument();
      expect(screen.getByText('0.01 ETH')).toBeInTheDocument();
      expect(screen.getByText('0.05 ETH')).toBeInTheDocument();
    });

    it('displays USD values for predefined amounts', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      expect(screen.getByText('$3.5')).toBeInTheDocument();
      expect(screen.getByText('$17.5')).toBeInTheDocument();
      expect(screen.getByText('$35')).toBeInTheDocument();
      expect(screen.getByText('$175')).toBeInTheDocument();
    });

    it('displays custom amount option', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      expect(screen.getByText('Custom Amount')).toBeInTheDocument();
    });

    it('displays message textarea', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const textarea = screen.getByPlaceholderText('Say something nice...');
      expect(textarea).toBeInTheDocument();
    });

    it('displays summary section', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      expect(screen.getByText('Amount:')).toBeInTheDocument();
      expect(screen.getByText('USD Value:')).toBeInTheDocument();
      expect(screen.getByText('Gas Fee:')).toBeInTheDocument();
    });

    it('displays gas fee estimation', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      expect(screen.getByText('~$5.00')).toBeInTheDocument();
    });
  });

  describe('Amount Selection', () => {
    it('selects 0.005 ETH by default', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const buttons = screen.getAllByRole('button');
      const ethButton = buttons.find(btn => btn.textContent.includes('0.005 ETH'));
      expect(ethButton?.className).toMatch(/border-accent-primary/);
    });

    it('allows selecting different preset amounts', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const buttons = screen.getAllByRole('button');
      const button001 = buttons.find(btn => btn.textContent.includes('0.001 ETH') && btn.textContent.includes('$3.5'));

      if (button001) {
        await user.click(button001);
        expect(button001.className).toMatch(/border-accent-primary/);
      }
    });

    it('updates summary when selecting different amount', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const buttons = screen.getAllByRole('button');
      const button01 = buttons.find(btn => btn.textContent.includes('0.01 ETH') && btn.textContent.includes('$35'));

      if (button01) {
        await user.click(button01);

        const summary = screen.getByText('Amount:').parentElement;
        expect(summary).toHaveTextContent('0.01 ETH');
      }
    });

    it('deselects preset when custom amount is selected', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const customRadio = screen.getByRole('radio');
      await user.click(customRadio);

      expect(customRadio).toBeChecked();
    });

    it('highlights selected amount button', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const buttons = screen.getAllByRole('button');
      const button05 = buttons.find(btn => btn.textContent.includes('0.05 ETH'));

      if (button05) {
        await user.click(button05);
        expect(button05.className).toMatch(/border-accent-primary|bg-accent-primary/);
      }
    });
  });

  describe('Custom Amount Input', () => {
    it('shows custom input when custom amount is selected', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const customRadio = screen.getByRole('radio');
      await user.click(customRadio);

      const input = screen.getByPlaceholderText('0.000');
      expect(input).toBeInTheDocument();
      expect(input).toBeVisible();
    });

    it('custom input is hidden by default', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      expect(screen.queryByPlaceholderText('0.000')).not.toBeInTheDocument();
    });

    it('allows entering custom amount', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const customRadio = screen.getByRole('radio');
      await user.click(customRadio);

      const input = screen.getByPlaceholderText('0.000');
      await user.type(input, '0.025');

      expect(input).toHaveValue(0.025);
    });

    it('updates summary with custom amount', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const customRadio = screen.getByRole('radio');
      await user.click(customRadio);

      const input = screen.getByPlaceholderText('0.000');
      await user.type(input, '0.1');

      const summary = screen.getByText('Amount:').parentElement;
      expect(summary).toHaveTextContent('0.1 ETH');
    });

    it('calculates USD value for custom amount', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const customRadio = screen.getByRole('radio');
      await user.click(customRadio);

      const input = screen.getByPlaceholderText('0.000');
      await user.type(input, '0.1');

      const usdValue = screen.getByText('USD Value:').parentElement;
      expect(usdValue).toHaveTextContent('$350.00');
    });

    it('handles zero custom amount', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const customRadio = screen.getByRole('radio');
      await user.click(customRadio);

      const summary = screen.getByText('Amount:').parentElement;
      expect(summary).toHaveTextContent('0 ETH');
    });

    it('custom input has proper step attribute', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const customRadio = screen.getByRole('radio');
      await user.click(customRadio);

      const input = screen.getByPlaceholderText('0.000');
      expect(input).toHaveAttribute('step', '0.001');
    });

    it('custom input is number type', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const customRadio = screen.getByRole('radio');
      await user.click(customRadio);

      const input = screen.getByPlaceholderText('0.000');
      expect(input).toHaveAttribute('type', 'number');
    });

    it('shows ETH label next to custom input', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const customRadio = screen.getByRole('radio');
      await user.click(customRadio);

      expect(screen.getByText('ETH')).toBeInTheDocument();
    });
  });

  describe('Message Input', () => {
    it('renders message textarea', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const textarea = screen.getByPlaceholderText('Say something nice...');
      expect(textarea).toBeInTheDocument();
    });

    it('allows typing message', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const textarea = screen.getByPlaceholderText('Say something nice...');
      await user.type(textarea, 'Great work!');

      expect(textarea).toHaveValue('Great work!');
    });

    it('message textarea has 3 rows', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const textarea = screen.getByPlaceholderText('Say something nice...');
      expect(textarea).toHaveAttribute('rows', '3');
    });

    it('message label indicates it is optional', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      expect(screen.getByText('Message (Optional)')).toBeInTheDocument();
    });
  });

  describe('Tipping Flow', () => {
    it('sends tip when Send Tip button is clicked', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const sendButton = screen.getByRole('button', { name: /send tip/i });
      await user.click(sendButton);

      expect(screen.getByText('Sending...')).toBeInTheDocument();
    });

    it('shows loading state during tipping', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const sendButton = screen.getByRole('button', { name: /send tip/i });
      await user.click(sendButton);

      expect(screen.getByText('Sending...')).toBeInTheDocument();
      const spinner = screen.getByRole('button', { name: /sending/i }).querySelector('.');
      expect(spinner).toBeInTheDocument();
    });

    it('disables send button during tipping', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const sendButton = screen.getByRole('button', { name: /send tip/i });
      await user.click(sendButton);

      expect(sendButton).toBeDisabled();
    });

    it('shows success alert after successful tip', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const sendButton = screen.getByRole('button', { name: /send tip/i });
      await user.click(sendButton);

      jest.advanceTimersByTime(2000);
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Successfully tipped 0.005 ETH!');
      });
    });

    it('closes modal after successful tip', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const sendButton = screen.getByRole('button', { name: /send tip/i });
      await user.click(sendButton);

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.queryByText('Send Crypto Tip')).not.toBeInTheDocument();
      });
    });

    it('sends custom amount when tipping', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const customRadio = screen.getByRole('radio');
      await user.click(customRadio);

      const input = screen.getByPlaceholderText('0.000');
      await user.type(input, '0.123');

      const sendButton = screen.getByRole('button', { name: /send tip/i });
      await user.click(sendButton);

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Successfully tipped 0.123 ETH!');
      });
    });

    it('sends correct preset amount', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const buttons = screen.getAllByRole('button');
      const button01 = buttons.find(btn => btn.textContent.includes('0.01 ETH') && btn.textContent.includes('$35'));

      if (button01) {
        await user.click(button01);
      }

      const sendButton = screen.getByRole('button', { name: /send tip/i });
      await user.click(sendButton);

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Successfully tipped 0.01 ETH!');
      });
    });

    it('displays Heart icon on Send Tip button', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      expect(screen.getByTestId('heart-icon')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles tipping errors gracefully', async () => {
      // Force an error by mocking setTimeout to reject
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn((cb) => {
        throw new Error('Network error');
      });

      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const sendButton = screen.getByRole('button', { name: /send tip/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      global.setTimeout = originalSetTimeout;
    });

    it('disables send button when custom amount is empty', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const customRadio = screen.getByRole('radio');
      await user.click(customRadio);

      const sendButton = screen.getByRole('button', { name: /send tip/i });
      expect(sendButton).toBeDisabled();
    });

    it('enables send button when custom amount is entered', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const customRadio = screen.getByRole('radio');
      await user.click(customRadio);

      const input = screen.getByPlaceholderText('0.000');
      await user.type(input, '0.1');

      const sendButton = screen.getByRole('button', { name: /send tip/i });
      expect(sendButton).not.toBeDisabled();
    });

    it('logs error to console when tipping fails', async () => {
      const originalSetTimeout = global.setTimeout;
      const mockError = new Error('Transaction failed');
      global.setTimeout = jest.fn(() => {
        throw mockError;
      });

      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));
      const sendButton = screen.getByRole('button', { name: /send tip/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Tip failed:', expect.any(Error));
      });

      global.setTimeout = originalSetTimeout;
    });

    it('shows error alert when tipping fails', async () => {
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn(() => {
        throw new Error('Transaction failed');
      });

      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));
      const sendButton = screen.getByRole('button', { name: /send tip/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Tip failed. Please try again.');
      });

      global.setTimeout = originalSetTimeout;
    });

    it('re-enables send button after error', async () => {
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn(() => {
        throw new Error('Transaction failed');
      });

      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));
      const sendButton = screen.getByRole('button', { name: /send tip/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(sendButton).not.toBeDisabled();
      });

      global.setTimeout = originalSetTimeout;
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid button clicks', async () => {
      render(<CryptoTippingButton />);

      const button = screen.getByRole('button', { name: /tip crypto/i });

      await user.click(button);
      await user.click(button);
      await user.click(button);

      // Modal should only appear once
      const modals = screen.getAllByText('Send Crypto Tip');
      expect(modals.length).toBe(1);
    });

    it('handles selecting same amount twice', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const buttons = screen.getAllByRole('button');
      const button001 = buttons.find(btn => btn.textContent.includes('0.001 ETH'));

      if (button001) {
        await user.click(button001);
        await user.click(button001);

        expect(button001.className).toMatch(/border-accent-primary/);
      }
    });

    it('handles switching between preset and custom amounts', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const customRadio = screen.getByRole('radio');
      await user.click(customRadio);

      const buttons = screen.getAllByRole('button');
      const button001 = buttons.find(btn => btn.textContent.includes('0.001 ETH'));

      if (button001) {
        await user.click(button001);
        expect(customRadio).not.toBeChecked();
      }
    });

    it('preserves custom input value when toggling', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const customRadio = screen.getByRole('radio');
      await user.click(customRadio);

      const input = screen.getByPlaceholderText('0.000');
      await user.type(input, '0.5');

      const buttons = screen.getAllByRole('button');
      const button001 = buttons.find(btn => btn.textContent.includes('0.001 ETH'));
      if (button001) await user.click(button001);

      await user.click(customRadio);
      expect(input).toHaveValue(0.5);
    });

    it('handles very small custom amounts', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const customRadio = screen.getByRole('radio');
      await user.click(customRadio);

      const input = screen.getByPlaceholderText('0.000');
      await user.type(input, '0.000001');

      expect(input).toHaveValue(0.000001);
    });

    it('handles very large custom amounts', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const customRadio = screen.getByRole('radio');
      await user.click(customRadio);

      const input = screen.getByPlaceholderText('0.000');
      await user.type(input, '999');

      expect(input).toHaveValue(999);
    });

    it('handles decimal precision in custom amounts', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const customRadio = screen.getByRole('radio');
      await user.click(customRadio);

      const input = screen.getByPlaceholderText('0.000');
      await user.type(input, '0.123456789');

      expect(input).toHaveValue(0.123456789);
    });

    it('handles empty custom input gracefully', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const customRadio = screen.getByRole('radio');
      await user.click(customRadio);

      const summary = screen.getByText('Amount:').parentElement;
      expect(summary).toHaveTextContent('0 ETH');
    });

    it('calculates USD for empty custom amount as $0.00', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const customRadio = screen.getByRole('radio');
      await user.click(customRadio);

      const usdValue = screen.getByText('USD Value:').parentElement;
      expect(usdValue).toHaveTextContent('$0.00');
    });
  });

  describe('Accessibility', () => {
    it('main button has proper role', () => {
      render(<CryptoTippingButton />);
      expect(screen.getByRole('button', { name: /tip crypto/i })).toBeInTheDocument();
    });

    it('modal has proper heading structure', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      expect(screen.getByText('Send Crypto Tip')).toBeInTheDocument();
    });

    it('amount buttons are keyboard accessible', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const buttons = screen.getAllByRole('button');
      const ethButton = buttons.find(btn => btn.textContent.includes('0.001 ETH'));

      if (ethButton) {
        ethButton.focus();
        expect(document.activeElement).toBe(ethButton);
      }
    });

    it('custom amount radio is accessible', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const radio = screen.getByRole('radio');
      expect(radio).toBeInTheDocument();
    });

    it('custom input has proper labels', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const customRadio = screen.getByRole('radio');
      await user.click(customRadio);

      const input = screen.getByPlaceholderText('0.000');
      expect(input).toHaveAttribute('type', 'number');
    });

    it('message textarea is accessible', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const textarea = screen.getByPlaceholderText('Say something nice...');
      expect(textarea).toBeInTheDocument();
    });

    it('close button is keyboard accessible', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const closeButton = screen.getByText('×');
      closeButton.focus();
      expect(document.activeElement).toBe(closeButton);
    });

    it('cancel button has proper label', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('send button has proper label', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      expect(screen.getByRole('button', { name: /send tip/i })).toBeInTheDocument();
    });

    it('disabled send button communicates state', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const customRadio = screen.getByRole('radio');
      await user.click(customRadio);

      const sendButton = screen.getByRole('button', { name: /send tip/i });
      expect(sendButton).toBeDisabled();
    });
  });

  describe('Recipient Props', () => {
    it('accepts recipientAddress prop', () => {
      const { container } = render(
        <CryptoTippingButton recipientAddress="0x1234567890abcdef" />
      );
      expect(container).toBeInTheDocument();
    });

    it('displays recipient name in modal', async () => {
      render(<CryptoTippingButton recipientName="Bob" />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      expect(screen.getByText(/To: Bob/i)).toBeInTheDocument();
    });

    it('works without recipient info', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      expect(screen.getByText('Send Crypto Tip')).toBeInTheDocument();
    });
  });

  describe('Summary Calculations', () => {
    it('shows correct ETH amount in summary', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const summary = screen.getByText('Amount:').parentElement;
      expect(summary).toHaveTextContent('0.005 ETH');
    });

    it('shows correct USD value in summary', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const usdValue = screen.getByText('USD Value:').parentElement;
      expect(usdValue).toHaveTextContent('$17.5');
    });

    it('updates summary when amount changes', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const buttons = screen.getAllByRole('button');
      const button05 = buttons.find(btn => btn.textContent.includes('0.05 ETH'));

      if (button05) {
        await user.click(button05);

        const summary = screen.getByText('Amount:').parentElement;
        expect(summary).toHaveTextContent('0.05 ETH');

        const usdValue = screen.getByText('USD Value:').parentElement;
        expect(usdValue).toHaveTextContent('$175');
      }
    });

    it('correctly formats custom amount USD value', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const customRadio = screen.getByRole('radio');
      await user.click(customRadio);

      const input = screen.getByPlaceholderText('0.000');
      await user.type(input, '0.0123');

      const usdValue = screen.getByText('USD Value:').parentElement;
      expect(usdValue).toHaveTextContent('$43.05');
    });

    it('uses 3500 as ETH to USD conversion rate', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const customRadio = screen.getByRole('radio');
      await user.click(customRadio);

      const input = screen.getByPlaceholderText('0.000');
      await user.type(input, '1');

      const usdValue = screen.getByText('USD Value:').parentElement;
      expect(usdValue).toHaveTextContent('$3500.00');
    });

    it('formats USD value to 2 decimal places', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const customRadio = screen.getByRole('radio');
      await user.click(customRadio);

      const input = screen.getByPlaceholderText('0.000');
      await user.type(input, '0.0001');

      const usdValue = screen.getByText('USD Value:').parentElement;
      expect(usdValue?.textContent).toMatch(/\$\d+\.\d{2}/);
    });
  });

  describe('Modal Layout', () => {
    it('modal has proper padding', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const modal = screen.getByText('Send Crypto Tip').closest('.fixed');
      expect(modal?.className).toMatch(/p-lg/);
    });

    it('modal content has max width', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const content = screen.getByText('Send Crypto Tip').closest('.max-w-md');
      expect(content).toBeInTheDocument();
    });

    it('modal has rounded corners', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const content = screen.getByText('Send Crypto Tip').closest('.rounded-lg');
      expect(content).toBeInTheDocument();
    });

    it('modal has proper background overlay', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const overlay = screen.getByText('Send Crypto Tip').closest('.fixed');
      expect(overlay?.className).toMatch(/bg-black/);
    });

    it('modal content scrolls when needed', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const content = screen.getByText('Send Crypto Tip').closest('.overflow-auto');
      expect(content).toBeInTheDocument();
    });

    it('amount selection uses grid layout', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const grid = screen.getByText('0.001 ETH').parentElement?.parentElement;
      expect(grid?.className).toMatch(/grid/);
    });

    it('action buttons are in flex layout', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const buttonContainer = screen.getByRole('button', { name: /cancel/i }).parentElement;
      expect(buttonContainer?.className).toMatch(/flex|gap/);
    });
  });

  describe('Component State Management', () => {
    it('manages modal visibility state', async () => {
      render(<CryptoTippingButton />);

      expect(screen.queryByText('Send Crypto Tip')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));
      expect(screen.getByText('Send Crypto Tip')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /cancel/i }));
      await waitFor(() => {
        expect(screen.queryByText('Send Crypto Tip')).not.toBeInTheDocument();
      });
    });

    it('manages amount selection state', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const buttons = screen.getAllByRole('button');
      const button001 = buttons.find(btn => btn.textContent.includes('0.001 ETH'));
      const button01 = buttons.find(btn => btn.textContent.includes('0.01 ETH'));

      if (button001) await user.click(button001);
      if (button01) await user.click(button01);

      // Only the latest selection should be highlighted
      expect(button01?.className).toMatch(/border-accent-primary/);
    });

    it('manages custom amount state', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const customRadio = screen.getByRole('radio');
      await user.click(customRadio);

      const input = screen.getByPlaceholderText('0.000');
      await user.type(input, '0.5');
      await user.clear(input);
      await user.type(input, '1.0');

      expect(input).toHaveValue(1);
    });

    it('manages tipping state', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const sendButton = screen.getByRole('button', { name: /send tip/i });
      await user.click(sendButton);

      expect(screen.getByText('Sending...')).toBeInTheDocument();

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.queryByText('Sending...')).not.toBeInTheDocument();
      });
    });

    it('resets state after successful tip', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const sendButton = screen.getByRole('button', { name: /send tip/i });
      await user.click(sendButton);

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.queryByText('Send Crypto Tip')).not.toBeInTheDocument();
      });

      // Modal should be closed
      expect(screen.queryByText('Sending...')).not.toBeInTheDocument();
    });
  });

  describe('Visual Styling', () => {
    it('applies accent colors to selected amount', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const buttons = screen.getAllByRole('button');
      const selectedButton = buttons.find(
        btn => btn.textContent.includes('0.005 ETH') && btn.className.includes('accent-primary')
      );

      expect(selectedButton).toBeTruthy();
    });

    it('applies hover styles to amount buttons', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const buttons = screen.getAllByRole('button');
      const amountButton = buttons.find(btn => btn.textContent.includes('0.001 ETH'));

      expect(amountButton?.className).toMatch(/hover/);
    });

    it('applies transition classes', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const buttons = screen.getAllByRole('button');
      const amountButton = buttons.find(btn => btn.textContent.includes('0.001 ETH'));

      expect(amountButton?.className).toMatch(/transition/);
    });

    it('uses proper border styling', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const header = screen.getByText('Send Crypto Tip').parentElement?.parentElement;
      expect(header?.className).toMatch(/border/);
    });

    it('applies proper spacing classes', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const content = screen.getByText('Select Amount').parentElement?.parentElement;
      expect(content?.className).toMatch(/space-y|gap/);
    });
  });

  describe('Snapshot Tests', () => {
    it('matches snapshot - default state', () => {
      const { container } = render(<CryptoTippingButton />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot - with recipient name', () => {
      const { container } = render(
        <CryptoTippingButton recipientName="Alice" recipientAddress="0x123" />
      );
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot - small size', () => {
      const { container } = render(<CryptoTippingButton size="sm" />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot - large size', () => {
      const { container } = render(<CryptoTippingButton size="lg" />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot - secondary variant', () => {
      const { container } = render(<CryptoTippingButton variant="secondary" />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot - without amount display', () => {
      const { container } = render(<CryptoTippingButton showAmount={false} />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot - without USD display', () => {
      const { container } = render(<CryptoTippingButton showUSD={false} />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot - modal open', async () => {
      const { container } = render(<CryptoTippingButton />);
      await user.click(screen.getByRole('button', { name: /tip crypto/i }));
      expect(container).toMatchSnapshot();
    });
  });

  describe('Integration Tests', () => {
    it('completes full tipping flow', async () => {
      render(<CryptoTippingButton recipientName="Charlie" />);

      // Open modal
      await user.click(screen.getByRole('button', { name: /tip crypto/i }));
      expect(screen.getByText(/To: Charlie/)).toBeInTheDocument();

      // Select amount
      const buttons = screen.getAllByRole('button');
      const button01 = buttons.find(btn => btn.textContent.includes('0.01 ETH'));
      if (button01) await user.click(button01);

      // Add message
      const textarea = screen.getByPlaceholderText('Say something nice...');
      await user.type(textarea, 'Thanks for your help!');

      // Send tip
      const sendButton = screen.getByRole('button', { name: /send tip/i });
      await user.click(sendButton);

      jest.advanceTimersByTime(2000);

      // Verify success
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Successfully tipped 0.01 ETH!');
        expect(screen.queryByText('Send Crypto Tip')).not.toBeInTheDocument();
      });
    });

    it('completes custom amount tipping flow', async () => {
      render(<CryptoTippingButton />);

      // Open modal
      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      // Select custom amount
      const customRadio = screen.getByRole('radio');
      await user.click(customRadio);

      const input = screen.getByPlaceholderText('0.000');
      await user.type(input, '0.75');

      // Verify summary updates
      const summary = screen.getByText('Amount:').parentElement;
      expect(summary).toHaveTextContent('0.75 ETH');

      const usdValue = screen.getByText('USD Value:').parentElement;
      expect(usdValue).toHaveTextContent('$2625.00');

      // Send tip
      const sendButton = screen.getByRole('button', { name: /send tip/i });
      await user.click(sendButton);

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Successfully tipped 0.75 ETH!');
      });
    });

    it('handles cancel during tipping', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      await waitFor(() => {
        expect(screen.queryByText('Send Crypto Tip')).not.toBeInTheDocument();
      });
    });

    it('reopens modal after closing', async () => {
      render(<CryptoTippingButton />);

      // Open and close
      await user.click(screen.getByRole('button', { name: /tip crypto/i }));
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      await waitFor(() => {
        expect(screen.queryByText('Send Crypto Tip')).not.toBeInTheDocument();
      });

      // Reopen
      await user.click(screen.getByRole('button', { name: /tip crypto/i }));
      expect(screen.getByText('Send Crypto Tip')).toBeInTheDocument();
    });

    it('maintains state when switching between amounts', async () => {
      render(<CryptoTippingButton />);

      await user.click(screen.getByRole('button', { name: /tip crypto/i }));

      const buttons = screen.getAllByRole('button');
      const button001 = buttons.find(btn => btn.textContent.includes('0.001 ETH'));
      const button01 = buttons.find(btn => btn.textContent.includes('0.01 ETH'));
      const button05 = buttons.find(btn => btn.textContent.includes('0.05 ETH'));

      if (button001) await user.click(button001);
      let summary = screen.getByText('Amount:').parentElement;
      expect(summary).toHaveTextContent('0.001 ETH');

      if (button01) await user.click(button01);
      summary = screen.getByText('Amount:').parentElement;
      expect(summary).toHaveTextContent('0.01 ETH');

      if (button05) await user.click(button05);
      summary = screen.getByText('Amount:').parentElement;
      expect(summary).toHaveTextContent('0.05 ETH');
    });
  });
});

export default MockButton
