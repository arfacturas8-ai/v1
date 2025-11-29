import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import CryptoTippingSystem from './CryptoTippingSystem';
import { cryptoPaymentService, PAYMENT_TYPES } from '../../services/cryptoPaymentService.js';
import { walletManager } from '../../lib/web3/WalletManager.js';

// Mock dependencies
jest.mock('../../services/cryptoPaymentService.js', () => ({
  cryptoPaymentService: {
    getTransactionsByType: jest.fn(),
    getCryptoPrices: jest.fn(),
    tipUser: jest.fn(),
  },
  PAYMENT_TYPES: {
    TIP: 'TIP',
    DONATION: 'DONATION',
    PAYMENT: 'PAYMENT',
  },
}));

jest.mock('../../lib/web3/WalletManager.js', () => ({
  walletManager: {
    isConnected: false,
    connect: jest.fn(),
  },
}));

// Mock Radix UI components
jest.mock('@radix-ui/themes', () => ({
  Card: ({ children, className, ...props }) => <div className={className} {...props}>{children}</div>,
  Button: ({ children, className, onClick, disabled, variant, size, ...props }) => (
    <button className={className} onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
  Badge: ({ children, ...props }) => <span {...props}>{children}</span>,
  Progress: ({ value, ...props }) => <div role="progressbar" aria-valuenow={value} {...props} />,
  Dialog: {
    Root: ({ children, open, onOpenChange }) => (
      open ? <div data-testid="dialog-root" onClick={() => onOpenChange && onOpenChange(false)}>{children}</div> : null
    ),
    Content: ({ children, className }) => <div className={className} data-testid="dialog-content">{children}</div>,
    Title: ({ children, className }) => <h2 className={className}>{children}</h2>,
  },
  Select: {
    Root: ({ children, value, onValueChange }) => (
      <div data-testid="select-root" data-value={value}>
        {React.Children.map(children, child =>
          React.cloneElement(child, { value, onValueChange })
        )}
      </div>
    ),
    Trigger: ({ children, className }) => <button className={className}>{children}</button>,
    Value: () => <span>Select value</span>,
    Content: ({ children, value, onValueChange }) => (
      <div data-testid="select-content">
        {React.Children.map(children, child =>
          React.cloneElement(child, { onClick: () => onValueChange && onValueChange(child.props.value) })
        )}
      </div>
    ),
    Item: ({ children, value, onClick }) => (
      <div data-testid={`select-item-${value}`} onClick={onClick}>{children}</div>
    ),
  },
  Textarea: ({ value, onChange, placeholder, rows, maxLength, ...props }) => (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      maxLength={maxLength}
      {...props}
    />
  ),
}));

describe('CryptoTippingSystem', () => {
  const defaultProps = {
    recipientAddress: '0x1234567890abcdef',
    recipientName: 'Test User',
    contentId: 'content-123',
    contentType: 'post',
  };

  const mockTipHistory = [
    {
      recipient: '0x1234567890abcdef',
      amount: '10',
      token: 'CRYB',
      timestamp: 1699999999000,
      metadata: { message: 'Great content!' },
    },
    {
      recipient: '0x1234567890abcdef',
      amount: '0.01',
      token: 'ETH',
      timestamp: 1699999998000,
      metadata: { message: 'Keep it up!' },
    },
  ];

  const mockCryptoPrices = {
    CRYB: 1.5,
    ETH: 2000,
    USDC: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    cryptoPaymentService.getTransactionsByType.mockReturnValue([]);
    cryptoPaymentService.getCryptoPrices.mockResolvedValue(mockCryptoPrices);
    walletManager.isConnected = false;
  });

  describe('Component Rendering', () => {
    it('should render the main tipping interface when not embedded', () => {
      render(<CryptoTippingSystem {...defaultProps} />);

      expect(screen.getByText('Crypto Tipping')).toBeInTheDocument();
      expect(screen.getByText('Support creators with cryptocurrency tips')).toBeInTheDocument();
    });

    it('should render embedded interface when embedded prop is true', () => {
      render(<CryptoTippingSystem {...defaultProps} embedded={true} />);

      expect(screen.getByText('Tip')).toBeInTheDocument();
      expect(screen.queryByText('Crypto Tipping')).not.toBeInTheDocument();
    });

    it('should render quick tips section', () => {
      render(<CryptoTippingSystem {...defaultProps} />);

      expect(screen.getByText('Quick Tips')).toBeInTheDocument();
    });

    it('should render custom tip section', () => {
      render(<CryptoTippingSystem {...defaultProps} />);

      expect(screen.getByText('Custom Tip')).toBeInTheDocument();
      expect(screen.getByText('Send Custom Tip')).toBeInTheDocument();
    });

    it('should render tipping statistics section', () => {
      render(<CryptoTippingSystem {...defaultProps} />);

      expect(screen.getByText('Tipping Statistics')).toBeInTheDocument();
      expect(screen.getByText('Tips Sent')).toBeInTheDocument();
      expect(screen.getByText('Total Value')).toBeInTheDocument();
      expect(screen.getByText('Average Tip')).toBeInTheDocument();
    });

    it('should render recent tips section', () => {
      render(<CryptoTippingSystem {...defaultProps} />);

      expect(screen.getByText('Recent Tips')).toBeInTheDocument();
    });

    it('should display recipient name correctly', async () => {
      render(<CryptoTippingSystem {...defaultProps} />);

      const sendTipButton = screen.getByText('Send Custom Tip');
      fireEvent.click(sendTipButton);

      await waitFor(() => {
        expect(screen.getByText(`Send Tip to ${defaultProps.recipientName}`)).toBeInTheDocument();
      });
    });

    it('should use default recipient name when not provided', async () => {
      const { recipientName, ...propsWithoutName } = defaultProps;
      render(<CryptoTippingSystem {...propsWithoutName} />);

      const sendTipButton = screen.getByText('Send Custom Tip');
      fireEvent.click(sendTipButton);

      await waitFor(() => {
        expect(screen.getByText('Send Tip to User')).toBeInTheDocument();
      });
    });
  });

  describe('Tipping Modal', () => {
    it('should open modal when clicking Send Custom Tip button', async () => {
      render(<CryptoTippingSystem {...defaultProps} />);

      const sendTipButton = screen.getByText('Send Custom Tip');
      fireEvent.click(sendTipButton);

      await waitFor(() => {
        expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
      });
    });

    it('should close modal when clicking Cancel button', async () => {
      render(<CryptoTippingSystem {...defaultProps} />);

      const sendTipButton = screen.getByText('Send Custom Tip');
      fireEvent.click(sendTipButton);

      await waitFor(() => {
        expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByTestId('dialog-content')).not.toBeInTheDocument();
      });
    });

    it('should display preset amount options', async () => {
      render(<CryptoTippingSystem {...defaultProps} />);

      const sendTipButton = screen.getByText('Send Custom Tip');
      fireEvent.click(sendTipButton);

      await waitFor(() => {
        expect(screen.getByText('Coffee')).toBeInTheDocument();
        expect(screen.getByText('Pizza')).toBeInTheDocument();
        expect(screen.getByText('Rocket')).toBeInTheDocument();
        expect(screen.getByText('Custom')).toBeInTheDocument();
      });
    });

    it('should display token selection dropdown', async () => {
      render(<CryptoTippingSystem {...defaultProps} />);

      const sendTipButton = screen.getByText('Send Custom Tip');
      fireEvent.click(sendTipButton);

      await waitFor(() => {
        expect(screen.getByTestId('select-root')).toBeInTheDocument();
        expect(screen.getByTestId('select-item-CRYB')).toBeInTheDocument();
        expect(screen.getByTestId('select-item-ETH')).toBeInTheDocument();
        expect(screen.getByTestId('select-item-USDC')).toBeInTheDocument();
      });
    });
  });

  describe('Preset Amount Selection', () => {
    it('should select SMALL preset by default', async () => {
      render(<CryptoTippingSystem {...defaultProps} />);

      const sendTipButton = screen.getByText('Send Custom Tip');
      fireEvent.click(sendTipButton);

      await waitFor(() => {
        expect(screen.getByText('5 CRYB')).toBeInTheDocument();
      });
    });

    it('should change amount when selecting MEDIUM preset', async () => {
      render(<CryptoTippingSystem {...defaultProps} />);

      const sendTipButton = screen.getByText('Send Custom Tip');
      fireEvent.click(sendTipButton);

      await waitFor(() => {
        expect(screen.getByText('Pizza')).toBeInTheDocument();
      });

      const pizzaButton = screen.getByText('Pizza');
      fireEvent.click(pizzaButton);

      await waitFor(() => {
        expect(screen.getByText('25 CRYB')).toBeInTheDocument();
      });
    });

    it('should change amount when selecting LARGE preset', async () => {
      render(<CryptoTippingSystem {...defaultProps} />);

      const sendTipButton = screen.getByText('Send Custom Tip');
      fireEvent.click(sendTipButton);

      await waitFor(() => {
        expect(screen.getByText('Rocket')).toBeInTheDocument();
      });

      const rocketButton = screen.getByText('Rocket');
      fireEvent.click(rocketButton);

      await waitFor(() => {
        expect(screen.getByText('100 CRYB')).toBeInTheDocument();
      });
    });

    it('should display preset message for SMALL preset', async () => {
      render(<CryptoTippingSystem {...defaultProps} />);

      const sendTipButton = screen.getByText('Send Custom Tip');
      fireEvent.click(sendTipButton);

      await waitFor(() => {
        expect(screen.getByText('"Thanks for the great content!"')).toBeInTheDocument();
      });
    });

    it('should display preset message for MEDIUM preset', async () => {
      render(<CryptoTippingSystem {...defaultProps} />);

      const sendTipButton = screen.getByText('Send Custom Tip');
      fireEvent.click(sendTipButton);

      const pizzaButton = screen.getByText('Pizza');
      fireEvent.click(pizzaButton);

      await waitFor(() => {
        expect(screen.getByText('"Love your work, keep it up!"')).toBeInTheDocument();
      });
    });

    it('should display preset message for LARGE preset', async () => {
      render(<CryptoTippingSystem {...defaultProps} />);

      const sendTipButton = screen.getByText('Send Custom Tip');
      fireEvent.click(sendTipButton);

      const rocketButton = screen.getByText('Rocket');
      fireEvent.click(rocketButton);

      await waitFor(() => {
        expect(screen.getByText('"This content is amazing!"')).toBeInTheDocument();
      });
    });
  });

  describe('Custom Amount Input', () => {
    it('should show custom amount input when CUSTOM preset is selected', async () => {
      render(<CryptoTippingSystem {...defaultProps} />);

      const sendTipButton = screen.getByText('Send Custom Tip');
      fireEvent.click(sendTipButton);

      const customButton = screen.getByText('Custom');
      fireEvent.click(customButton);

      await waitFor(() => {
        const input = screen.getByPlaceholderText('0.00 CRYB');
        expect(input).toBeInTheDocument();
      });
    });

    it('should allow entering custom amount', async () => {
      render(<CryptoTippingSystem {...defaultProps} />);

      const sendTipButton = screen.getByText('Send Custom Tip');
      fireEvent.click(sendTipButton);

      const customButton = screen.getByText('Custom');
      fireEvent.click(customButton);

      await waitFor(() => {
        const input = screen.getByPlaceholderText('0.00 CRYB');
        fireEvent.change(input, { target: { value: '50' } });
        expect(input.value).toBe('50');
      });
    });

    it('should show custom message textarea when CUSTOM preset is selected', async () => {
      render(<CryptoTippingSystem {...defaultProps} />);

      const sendTipButton = screen.getByText('Send Custom Tip');
      fireEvent.click(sendTipButton);

      const customButton = screen.getByText('Custom');
      fireEvent.click(customButton);

      await waitFor(() => {
        const textarea = screen.getByPlaceholderText('Add a personal message...');
        expect(textarea).toBeInTheDocument();
      });
    });

    it('should allow entering custom message', async () => {
      render(<CryptoTippingSystem {...defaultProps} />);

      const sendTipButton = screen.getByText('Send Custom Tip');
      fireEvent.click(sendTipButton);

      const customButton = screen.getByText('Custom');
      fireEvent.click(customButton);

      await waitFor(() => {
        const textarea = screen.getByPlaceholderText('Add a personal message...');
        fireEvent.change(textarea, { target: { value: 'Custom message!' } });
        expect(textarea.value).toBe('Custom message!');
      });
    });

    it('should disable Send Tip button when custom amount is empty', async () => {
      render(<CryptoTippingSystem {...defaultProps} />);

      const sendTipButton = screen.getByText('Send Custom Tip');
      fireEvent.click(sendTipButton);

      const customButton = screen.getByText('Custom');
      fireEvent.click(customButton);

      await waitFor(() => {
        const sendButton = screen.getByText('Send Tip');
        expect(sendButton).toBeDisabled();
      });
    });

    it('should enable Send Tip button when custom amount is entered', async () => {
      render(<CryptoTippingSystem {...defaultProps} />);

      const sendTipButton = screen.getByText('Send Custom Tip');
      fireEvent.click(sendTipButton);

      const customButton = screen.getByText('Custom');
      fireEvent.click(customButton);

      await waitFor(() => {
        const input = screen.getByPlaceholderText('0.00 CRYB');
        fireEvent.change(input, { target: { value: '50' } });
      });

      const sendButton = screen.getByText('Send Tip');
      expect(sendButton).not.toBeDisabled();
    });
  });

  describe('Token Selection', () => {
    it('should select CRYB token by default', async () => {
      render(<CryptoTippingSystem {...defaultProps} />);

      const sendTipButton = screen.getByText('Send Custom Tip');
      fireEvent.click(sendTipButton);

      await waitFor(() => {
        const selectRoot = screen.getByTestId('select-root');
        expect(selectRoot).toHaveAttribute('data-value', 'CRYB');
      });
    });

    it('should change token to ETH when selected', async () => {
      render(<CryptoTippingSystem {...defaultProps} />);

      const sendTipButton = screen.getByText('Send Custom Tip');
      fireEvent.click(sendTipButton);

      await waitFor(() => {
        const ethOption = screen.getByTestId('select-item-ETH');
        fireEvent.click(ethOption);
      });

      await waitFor(() => {
        expect(screen.getByText('0.001 ETH')).toBeInTheDocument();
      });
    });

    it('should change token to USDC when selected', async () => {
      render(<CryptoTippingSystem {...defaultProps} />);

      const sendTipButton = screen.getByText('Send Custom Tip');
      fireEvent.click(sendTipButton);

      await waitFor(() => {
        const usdcOption = screen.getByTestId('select-item-USDC');
        fireEvent.click(usdcOption);
      });

      await waitFor(() => {
        expect(screen.getByText('2 USDC')).toBeInTheDocument();
      });
    });

    it('should update preset amounts when token changes', async () => {
      render(<CryptoTippingSystem {...defaultProps} />);

      const sendTipButton = screen.getByText('Send Custom Tip');
      fireEvent.click(sendTipButton);

      await waitFor(() => {
        expect(screen.getByText('5 CRYB')).toBeInTheDocument();
      });

      const ethOption = screen.getByTestId('select-item-ETH');
      fireEvent.click(ethOption);

      await waitFor(() => {
        expect(screen.getByText('0.001 ETH')).toBeInTheDocument();
      });
    });

    it('should update custom amount placeholder when token changes', async () => {
      render(<CryptoTippingSystem {...defaultProps} />);

      const sendTipButton = screen.getByText('Send Custom Tip');
      fireEvent.click(sendTipButton);

      const customButton = screen.getByText('Custom');
      fireEvent.click(customButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('0.00 CRYB')).toBeInTheDocument();
      });

      const ethOption = screen.getByTestId('select-item-ETH');
      fireEvent.click(ethOption);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('0.00 ETH')).toBeInTheDocument();
      });
    });
  });

  describe('Send Tip Functionality', () => {
    it('should connect wallet if not connected when sending tip', async () => {
      walletManager.isConnected = false;
      walletManager.connect.mockResolvedValue();

      render(<CryptoTippingSystem {...defaultProps} />);

      const sendTipButton = screen.getByText('Send Custom Tip');
      fireEvent.click(sendTipButton);

      await waitFor(() => {
        const sendButton = screen.getByText('Send Tip');
        fireEvent.click(sendButton);
      });

      await waitFor(() => {
        expect(walletManager.connect).toHaveBeenCalled();
      });
    });

    it('should send tip with preset amount when wallet is connected', async () => {
      walletManager.isConnected = true;
      cryptoPaymentService.tipUser.mockResolvedValue({ success: true });

      render(<CryptoTippingSystem {...defaultProps} />);

      const sendTipButton = screen.getByText('Send Custom Tip');
      fireEvent.click(sendTipButton);

      await waitFor(() => {
        const sendButton = screen.getByText('Send Tip');
        fireEvent.click(sendButton);
      });

      await waitFor(() => {
        expect(cryptoPaymentService.tipUser).toHaveBeenCalledWith(
          defaultProps.recipientAddress,
          '5',
          'CRYB',
          'Thanks for the great content!'
        );
      });
    });

    it('should send tip with custom amount', async () => {
      walletManager.isConnected = true;
      cryptoPaymentService.tipUser.mockResolvedValue({ success: true });

      render(<CryptoTippingSystem {...defaultProps} />);

      const sendTipButton = screen.getByText('Send Custom Tip');
      fireEvent.click(sendTipButton);

      const customButton = screen.getByText('Custom');
      fireEvent.click(customButton);

      await waitFor(() => {
        const input = screen.getByPlaceholderText('0.00 CRYB');
        fireEvent.change(input, { target: { value: '75' } });
      });

      const sendButton = screen.getByText('Send Tip');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(cryptoPaymentService.tipUser).toHaveBeenCalledWith(
          defaultProps.recipientAddress,
          '75',
          'CRYB',
          ''
        );
      });
    });

    it('should send tip with custom message', async () => {
      walletManager.isConnected = true;
      cryptoPaymentService.tipUser.mockResolvedValue({ success: true });

      render(<CryptoTippingSystem {...defaultProps} />);

      const sendTipButton = screen.getByText('Send Custom Tip');
      fireEvent.click(sendTipButton);

      const customButton = screen.getByText('Custom');
      fireEvent.click(customButton);

      await waitFor(() => {
        const input = screen.getByPlaceholderText('0.00 CRYB');
        fireEvent.change(input, { target: { value: '75' } });

        const textarea = screen.getByPlaceholderText('Add a personal message...');
        fireEvent.change(textarea, { target: { value: 'Amazing work!' } });
      });

      const sendButton = screen.getByText('Send Tip');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(cryptoPaymentService.tipUser).toHaveBeenCalledWith(
          defaultProps.recipientAddress,
          '75',
          'CRYB',
          'Amazing work!'
        );
      });
    });

    it('should close modal after successful tip', async () => {
      walletManager.isConnected = true;
      cryptoPaymentService.tipUser.mockResolvedValue({ success: true });

      render(<CryptoTippingSystem {...defaultProps} />);

      const sendTipButton = screen.getByText('Send Custom Tip');
      fireEvent.click(sendTipButton);

      await waitFor(() => {
        expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
      });

      const sendButton = screen.getByText('Send Tip');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.queryByTestId('dialog-content')).not.toBeInTheDocument();
      });
    });

    it('should clear custom amount after successful tip', async () => {
      walletManager.isConnected = true;
      cryptoPaymentService.tipUser.mockResolvedValue({ success: true });

      render(<CryptoTippingSystem {...defaultProps} />);

      const sendTipButton = screen.getByText('Send Custom Tip');
      fireEvent.click(sendTipButton);

      const customButton = screen.getByText('Custom');
      fireEvent.click(customButton);

      await waitFor(() => {
        const input = screen.getByPlaceholderText('0.00 CRYB');
        fireEvent.change(input, { target: { value: '75' } });
      });

      const sendButton = screen.getByText('Send Tip');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(cryptoPaymentService.tipUser).toHaveBeenCalled();
      });

      // Reopen modal
      fireEvent.click(screen.getByText('Send Custom Tip'));
      fireEvent.click(screen.getByText('Custom'));

      await waitFor(() => {
        const input = screen.getByPlaceholderText('0.00 CRYB');
        expect(input.value).toBe('');
      });
    });

    it('should clear custom message after successful tip', async () => {
      walletManager.isConnected = true;
      cryptoPaymentService.tipUser.mockResolvedValue({ success: true });

      render(<CryptoTippingSystem {...defaultProps} />);

      const sendTipButton = screen.getByText('Send Custom Tip');
      fireEvent.click(sendTipButton);

      const customButton = screen.getByText('Custom');
      fireEvent.click(customButton);

      await waitFor(() => {
        const input = screen.getByPlaceholderText('0.00 CRYB');
        fireEvent.change(input, { target: { value: '75' } });

        const textarea = screen.getByPlaceholderText('Add a personal message...');
        fireEvent.change(textarea, { target: { value: 'Great!' } });
      });

      const sendButton = screen.getByText('Send Tip');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(cryptoPaymentService.tipUser).toHaveBeenCalled();
      });

      // Reopen modal
      fireEvent.click(screen.getByText('Send Custom Tip'));
      fireEvent.click(screen.getByText('Custom'));

      await waitFor(() => {
        const textarea = screen.getByPlaceholderText('Add a personal message...');
        expect(textarea.value).toBe('');
      });
    });
  });

  describe('Quick Tip Functionality', () => {
    it('should render quick tip buttons', () => {
      render(<CryptoTippingSystem {...defaultProps} />);

      expect(screen.getByText('1 CRYB')).toBeInTheDocument();
      expect(screen.getByText('2 CRYB')).toBeInTheDocument();
      expect(screen.getByText('5 CRYB')).toBeInTheDocument();
      expect(screen.getByText('10 CRYB')).toBeInTheDocument();
      expect(screen.getByText('25 CRYB')).toBeInTheDocument();
    });

    it('should connect wallet if not connected when sending quick tip', async () => {
      walletManager.isConnected = false;
      walletManager.connect.mockResolvedValue();

      render(<CryptoTippingSystem {...defaultProps} />);

      const quickTipButton = screen.getByText('1 CRYB').closest('button');
      fireEvent.click(quickTipButton);

      await waitFor(() => {
        expect(walletManager.connect).toHaveBeenCalled();
      });
    });

    it('should send quick tip when wallet is connected', async () => {
      walletManager.isConnected = true;
      cryptoPaymentService.tipUser.mockResolvedValue({ success: true });

      render(<CryptoTippingSystem {...defaultProps} />);

      const quickTipButton = screen.getByText('1 CRYB').closest('button');
      fireEvent.click(quickTipButton);

      await waitFor(() => {
        expect(cryptoPaymentService.tipUser).toHaveBeenCalledWith(
          defaultProps.recipientAddress,
          '1',
          'CRYB',
          'Love this!'
        );
      });
    });

    it('should show visual feedback when quick tip is sent', async () => {
      walletManager.isConnected = true;
      cryptoPaymentService.tipUser.mockResolvedValue({ success: true });

      render(<CryptoTippingSystem {...defaultProps} />);

      const quickTipButton = screen.getByText('1 CRYB').closest('button');
      fireEvent.click(quickTipButton);

      await waitFor(() => {
        expect(quickTipButton).toHaveClass('animate-pulse');
      });
    });

    it('should clear visual feedback after 2 seconds', async () => {
      jest.useFakeTimers();
      walletManager.isConnected = true;
      cryptoPaymentService.tipUser.mockResolvedValue({ success: true });

      render(<CryptoTippingSystem {...defaultProps} />);

      const quickTipButton = screen.getByText('1 CRYB').closest('button');
      fireEvent.click(quickTipButton);

      await waitFor(() => {
        expect(quickTipButton).toHaveClass('animate-pulse');
      });

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(quickTipButton).not.toHaveClass('animate-pulse');
      });

      jest.useRealTimers();
    });

    it('should disable quick tip buttons when processing', async () => {
      walletManager.isConnected = true;
      cryptoPaymentService.tipUser.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      render(<CryptoTippingSystem {...defaultProps} />);

      const quickTipButtons = screen.getAllByRole('button').filter(btn => btn.textContent.includes('CRYB'));
      fireEvent.click(quickTipButtons[0]);

      await waitFor(() => {
        quickTipButtons.forEach(button => {
          expect(button).toBeDisabled();
        });
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state when sending tip', async () => {
      walletManager.isConnected = true;
      cryptoPaymentService.tipUser.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      render(<CryptoTippingSystem {...defaultProps} />);

      const sendTipButton = screen.getByText('Send Custom Tip');
      fireEvent.click(sendTipButton);

      await waitFor(() => {
        const sendButton = screen.getByText('Send Tip');
        fireEvent.click(sendButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Sending...')).toBeInTheDocument();
      });
    });

    it('should disable Send Tip button when processing', async () => {
      walletManager.isConnected = true;
      cryptoPaymentService.tipUser.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      render(<CryptoTippingSystem {...defaultProps} />);

      const sendTipButton = screen.getByText('Send Custom Tip');
      fireEvent.click(sendTipButton);

      await waitFor(() => {
        const sendButton = screen.getByText('Send Tip');
        fireEvent.click(sendButton);
      });

      await waitFor(() => {
        const sendButton = screen.getByText('Sending...');
        expect(sendButton).toBeDisabled();
      });
    });

    it('should show spinner when processing', async () => {
      walletManager.isConnected = true;
      cryptoPaymentService.tipUser.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      render(<CryptoTippingSystem {...defaultProps} />);

      const sendTipButton = screen.getByText('Send Custom Tip');
      fireEvent.click(sendTipButton);

      await waitFor(() => {
        const sendButton = screen.getByText('Send Tip');
        fireEvent.click(sendButton);
      });

      await waitFor(() => {
        const spinner = document.querySelector('.animate-spin');
        expect(spinner).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle tip sending error gracefully', async () => {
      walletManager.isConnected = true;
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      cryptoPaymentService.tipUser.mockRejectedValue(new Error('Transaction failed'));

      render(<CryptoTippingSystem {...defaultProps} />);

      const sendTipButton = screen.getByText('Send Custom Tip');
      fireEvent.click(sendTipButton);

      await waitFor(() => {
        const sendButton = screen.getByText('Send Tip');
        fireEvent.click(sendButton);
      });

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Custom tip error:', expect.any(Error));
      });

      consoleError.mockRestore();
    });

    it('should handle quick tip error gracefully', async () => {
      walletManager.isConnected = true;
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      cryptoPaymentService.tipUser.mockRejectedValue(new Error('Transaction failed'));

      render(<CryptoTippingSystem {...defaultProps} />);

      const quickTipButton = screen.getByText('1 CRYB').closest('button');
      fireEvent.click(quickTipButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Quick tip error:', expect.any(Error));
      });

      consoleError.mockRestore();
    });

    it('should handle crypto prices loading error', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      cryptoPaymentService.getCryptoPrices.mockRejectedValue(new Error('Failed to fetch prices'));

      render(<CryptoTippingSystem {...defaultProps} />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to load crypto prices:', expect.any(Error));
      });

      consoleError.mockRestore();
    });

    it('should keep modal open after error', async () => {
      walletManager.isConnected = true;
      cryptoPaymentService.tipUser.mockRejectedValue(new Error('Transaction failed'));

      render(<CryptoTippingSystem {...defaultProps} />);

      const sendTipButton = screen.getByText('Send Custom Tip');
      fireEvent.click(sendTipButton);

      await waitFor(() => {
        const sendButton = screen.getByText('Send Tip');
        fireEvent.click(sendButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
      });
    });

    it('should re-enable buttons after error', async () => {
      walletManager.isConnected = true;
      cryptoPaymentService.tipUser.mockRejectedValue(new Error('Transaction failed'));

      render(<CryptoTippingSystem {...defaultProps} />);

      const sendTipButton = screen.getByText('Send Custom Tip');
      fireEvent.click(sendTipButton);

      await waitFor(() => {
        const sendButton = screen.getByText('Send Tip');
        fireEvent.click(sendButton);
      });

      await waitFor(() => {
        const sendButton = screen.getByText('Send Tip');
        expect(sendButton).not.toBeDisabled();
      });
    });
  });

  describe('Tip History Display', () => {
    it('should load and display tip history on mount', async () => {
      cryptoPaymentService.getTransactionsByType.mockReturnValue(mockTipHistory);

      render(<CryptoTippingSystem {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('10 CRYB')).toBeInTheDocument();
        expect(screen.getByText('0.01 ETH')).toBeInTheDocument();
      });
    });

    it('should display tip messages in history', async () => {
      cryptoPaymentService.getTransactionsByType.mockReturnValue(mockTipHistory);

      render(<CryptoTippingSystem {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Great content!')).toBeInTheDocument();
        expect(screen.getByText('Keep it up!')).toBeInTheDocument();
      });
    });

    it('should display "No message" for tips without messages', async () => {
      const historyWithoutMessage = [
        {
          recipient: '0x1234567890abcdef',
          amount: '10',
          token: 'CRYB',
          timestamp: 1699999999000,
          metadata: {},
        },
      ];
      cryptoPaymentService.getTransactionsByType.mockReturnValue(historyWithoutMessage);

      render(<CryptoTippingSystem {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No message')).toBeInTheDocument();
      });
    });

    it('should display empty state when no tips sent', () => {
      cryptoPaymentService.getTransactionsByType.mockReturnValue([]);

      render(<CryptoTippingSystem {...defaultProps} />);

      expect(screen.getByText('No tips sent yet')).toBeInTheDocument();
      expect(screen.getByText('Start supporting creators with your first tip!')).toBeInTheDocument();
    });

    it('should limit history display to 5 items', async () => {
      const manyTips = Array.from({ length: 10 }, (_, i) => ({
        recipient: '0x1234567890abcdef',
        amount: `${i + 1}`,
        token: 'CRYB',
        timestamp: 1699999999000 - i * 1000,
        metadata: { message: `Tip ${i + 1}` },
      }));
      cryptoPaymentService.getTransactionsByType.mockReturnValue(manyTips);

      render(<CryptoTippingSystem {...defaultProps} />);

      await waitFor(() => {
        const tipMessages = screen.getAllByText(/Tip \d+/);
        expect(tipMessages.length).toBeLessThanOrEqual(5);
      });
    });

    it('should reload tip history after sending tip', async () => {
      walletManager.isConnected = true;
      cryptoPaymentService.tipUser.mockResolvedValue({ success: true });
      cryptoPaymentService.getTransactionsByType.mockReturnValue([]);

      render(<CryptoTippingSystem {...defaultProps} />);

      const sendTipButton = screen.getByText('Send Custom Tip');
      fireEvent.click(sendTipButton);

      await waitFor(() => {
        const sendButton = screen.getByText('Send Tip');
        fireEvent.click(sendButton);
      });

      await waitFor(() => {
        expect(cryptoPaymentService.getTransactionsByType).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Balance and Statistics', () => {
    it('should display total tips sent count', async () => {
      cryptoPaymentService.getTransactionsByType.mockReturnValue(mockTipHistory);

      render(<CryptoTippingSystem {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });

    it('should calculate and display total value in USD', async () => {
      cryptoPaymentService.getTransactionsByType.mockReturnValue(mockTipHistory);

      render(<CryptoTippingSystem {...defaultProps} />);

      await waitFor(() => {
        const totalValue = 10 * 1.5 + 0.01 * 2000;
        expect(screen.getByText(`$${totalValue.toFixed(2)}`)).toBeInTheDocument();
      });
    });

    it('should calculate and display average tip value', async () => {
      cryptoPaymentService.getTransactionsByType.mockReturnValue(mockTipHistory);

      render(<CryptoTippingSystem {...defaultProps} />);

      await waitFor(() => {
        const totalValue = 10 * 1.5 + 0.01 * 2000;
        const average = totalValue / 2;
        expect(screen.getByText(`$${average.toFixed(2)}`)).toBeInTheDocument();
      });
    });

    it('should display $0.00 for average when no tips sent', () => {
      cryptoPaymentService.getTransactionsByType.mockReturnValue([]);

      render(<CryptoTippingSystem {...defaultProps} />);

      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });

    it('should format USD values with currency symbol', async () => {
      cryptoPaymentService.getTransactionsByType.mockReturnValue(mockTipHistory);

      render(<CryptoTippingSystem {...defaultProps} />);

      await waitFor(() => {
        const usdValues = screen.getAllByText(/^\$/);
        expect(usdValues.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Notifications', () => {
    it('should listen for tip notification events on mount', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      render(<CryptoTippingSystem {...defaultProps} />);

      expect(addEventListenerSpy).toHaveBeenCalledWith('cryptoPaymentUpdate', expect.any(Function));

      addEventListenerSpy.mockRestore();
    });

    it('should remove event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = render(<CryptoTippingSystem {...defaultProps} />);
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('cryptoPaymentUpdate', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });

    it('should display notification when tip is received', async () => {
      render(<CryptoTippingSystem {...defaultProps} />);

      const tipEvent = new CustomEvent('cryptoPaymentUpdate', {
        detail: {
          type: PAYMENT_TYPES.TIP,
          amount: '5',
          token: 'CRYB',
          sender: '0xabcdef1234567890',
          metadata: { message: 'Great work!' },
        },
      });

      window.dispatchEvent(tipEvent);

      await waitFor(() => {
        expect(screen.getByText('Tip Received!')).toBeInTheDocument();
      });
    });

    it('should display tip amount in notification', async () => {
      render(<CryptoTippingSystem {...defaultProps} />);

      const tipEvent = new CustomEvent('cryptoPaymentUpdate', {
        detail: {
          type: PAYMENT_TYPES.TIP,
          amount: '5',
          token: 'CRYB',
          sender: '0xabcdef1234567890',
          metadata: { message: 'Great work!' },
        },
      });

      window.dispatchEvent(tipEvent);

      await waitFor(() => {
        expect(screen.getByText(/5 CRYB from 0xabcd.../)).toBeInTheDocument();
      });
    });

    it('should auto-remove notification after 5 seconds', async () => {
      jest.useFakeTimers();

      render(<CryptoTippingSystem {...defaultProps} />);

      const tipEvent = new CustomEvent('cryptoPaymentUpdate', {
        detail: {
          type: PAYMENT_TYPES.TIP,
          amount: '5',
          token: 'CRYB',
          sender: '0xabcdef1234567890',
          metadata: { message: 'Great work!' },
        },
      });

      window.dispatchEvent(tipEvent);

      await waitFor(() => {
        expect(screen.getByText('Tip Received!')).toBeInTheDocument();
      });

      jest.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(screen.queryByText('Tip Received!')).not.toBeInTheDocument();
      });

      jest.useRealTimers();
    });

    it('should limit notifications to 5 items', async () => {
      render(<CryptoTippingSystem {...defaultProps} />);

      for (let i = 0; i < 7; i++) {
        const tipEvent = new CustomEvent('cryptoPaymentUpdate', {
          detail: {
            type: PAYMENT_TYPES.TIP,
            amount: `${i + 1}`,
            token: 'CRYB',
            sender: `0xabcdef123456789${i}`,
            metadata: { message: `Tip ${i + 1}` },
          },
        });

        window.dispatchEvent(tipEvent);
      }

      await waitFor(() => {
        const notifications = screen.getAllByText('Tip Received!');
        expect(notifications.length).toBeLessThanOrEqual(5);
      });
    });

    it('should not add notification for non-tip payment types', async () => {
      render(<CryptoTippingSystem {...defaultProps} />);

      const paymentEvent = new CustomEvent('cryptoPaymentUpdate', {
        detail: {
          type: PAYMENT_TYPES.PAYMENT,
          amount: '5',
          token: 'CRYB',
          sender: '0xabcdef1234567890',
        },
      });

      window.dispatchEvent(paymentEvent);

      await waitFor(() => {
        expect(screen.queryByText('Tip Received!')).not.toBeInTheDocument();
      });
    });
  });

  describe('Embedded Mode', () => {
    it('should render compact quick tips in embedded mode', () => {
      render(<CryptoTippingSystem {...defaultProps} embedded={true} />);

      const quickTipButtons = screen.getAllByRole('button').filter(btn =>
        btn.textContent.match(/❤️|🔥|💯/)
      );
      expect(quickTipButtons.length).toBe(3);
    });

    it('should render Tip button in embedded mode', () => {
      render(<CryptoTippingSystem {...defaultProps} embedded={true} />);

      expect(screen.getByText('Tip')).toBeInTheDocument();
    });

    it('should not render full interface in embedded mode', () => {
      render(<CryptoTippingSystem {...defaultProps} embedded={true} />);

      expect(screen.queryByText('Crypto Tipping')).not.toBeInTheDocument();
      expect(screen.queryByText('Tipping Statistics')).not.toBeInTheDocument();
    });

    it('should open modal from embedded Tip button', async () => {
      render(<CryptoTippingSystem {...defaultProps} embedded={true} />);

      const tipButton = screen.getByText('Tip');
      fireEvent.click(tipButton);

      await waitFor(() => {
        expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('should call getTransactionsByType with TIP type', () => {
      render(<CryptoTippingSystem {...defaultProps} />);

      expect(cryptoPaymentService.getTransactionsByType).toHaveBeenCalledWith(PAYMENT_TYPES.TIP);
    });

    it('should filter transactions by recipient address', () => {
      const allTransactions = [
        ...mockTipHistory,
        {
          recipient: '0xdifferentaddress',
          amount: '10',
          token: 'CRYB',
          timestamp: 1699999997000,
          metadata: { message: 'Should not appear' },
        },
      ];
      cryptoPaymentService.getTransactionsByType.mockReturnValue(allTransactions);

      render(<CryptoTippingSystem {...defaultProps} />);

      expect(screen.queryByText('Should not appear')).not.toBeInTheDocument();
    });

    it('should call getCryptoPrices on mount', async () => {
      render(<CryptoTippingSystem {...defaultProps} />);

      await waitFor(() => {
        expect(cryptoPaymentService.getCryptoPrices).toHaveBeenCalled();
      });
    });

    it('should use fetched crypto prices for USD conversion', async () => {
      cryptoPaymentService.getTransactionsByType.mockReturnValue([
        {
          recipient: '0x1234567890abcdef',
          amount: '10',
          token: 'CRYB',
          timestamp: 1699999999000,
          metadata: { message: 'Test' },
        },
      ]);

      render(<CryptoTippingSystem {...defaultProps} />);

      await waitFor(() => {
        const expectedUSD = 10 * mockCryptoPrices.CRYB;
        expect(screen.getByText(`$${expectedUSD.toFixed(2)}`)).toBeInTheDocument();
      });
    });
  });

  describe('Formatting', () => {
    it('should format amounts with token symbol', async () => {
      cryptoPaymentService.getTransactionsByType.mockReturnValue(mockTipHistory);

      render(<CryptoTippingSystem {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('10 CRYB')).toBeInTheDocument();
        expect(screen.getByText('0.01 ETH')).toBeInTheDocument();
      });
    });

    it('should format USD values with 2 decimal places', async () => {
      render(<CryptoTippingSystem {...defaultProps} />);

      const sendTipButton = screen.getByText('Send Custom Tip');
      fireEvent.click(sendTipButton);

      await waitFor(() => {
        const usdValue = screen.getByText(/≈ \$/);
        expect(usdValue.textContent).toMatch(/\$\d+\.\d{2}/);
      });
    });

    it('should use locale string formatting for large numbers', async () => {
      cryptoPaymentService.getTransactionsByType.mockReturnValue([
        {
          recipient: '0x1234567890abcdef',
          amount: '1000000',
          token: 'CRYB',
          timestamp: 1699999999000,
          metadata: { message: 'Test' },
        },
      ]);

      render(<CryptoTippingSystem {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('1,000,000 CRYB')).toBeInTheDocument();
      });
    });

    it('should truncate sender address in notifications', async () => {
      render(<CryptoTippingSystem {...defaultProps} />);

      const tipEvent = new CustomEvent('cryptoPaymentUpdate', {
        detail: {
          type: PAYMENT_TYPES.TIP,
          amount: '5',
          token: 'CRYB',
          sender: '0xabcdef1234567890123456789012345678901234',
          metadata: { message: 'Great work!' },
        },
      });

      window.dispatchEvent(tipEvent);

      await waitFor(() => {
        expect(screen.getByText(/0xabcd.../)).toBeInTheDocument();
      });
    });
  });
});

export default defaultProps
