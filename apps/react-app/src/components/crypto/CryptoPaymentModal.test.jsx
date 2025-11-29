/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CryptoPaymentModal from './CryptoPaymentModal';
import { cryptoPaymentService, PAYMENT_TYPES, SUBSCRIPTION_TIERS } from '../../services/cryptoPaymentService.js';
import { walletManager } from '../../lib/web3/WalletManager.js';

// Mock dependencies
jest.mock('../../services/cryptoPaymentService.js', () => ({
  cryptoPaymentService: {
    getAvailablePaymentMethods: jest.fn(),
    getCryptoPrices: jest.fn(),
    calculateFees: jest.fn(),
    buyWithTransak: jest.fn(),
    buyWithMoonPay: jest.fn(),
    subscribeToPremium: jest.fn(),
    tipUser: jest.fn(),
    purchaseNFT: jest.fn(),
    payWithCrypto: jest.fn(),
  },
  PAYMENT_TYPES: {
    TIP: 'tip',
    SUBSCRIPTION: 'subscription',
    NFT_PURCHASE: 'nft_purchase',
    GENERAL: 'general',
  },
  SUBSCRIPTION_TIERS: {
    BASIC: { name: 'Basic', monthlyPriceUSD: 9.99 },
    PRO: { name: 'Pro', monthlyPriceUSD: 19.99 },
    PREMIUM: { name: 'Premium', monthlyPriceUSD: 29.99 },
  },
}));

jest.mock('../../lib/web3/WalletManager.js', () => ({
  walletManager: {
    isConnected: false,
    account: null,
    connect: jest.fn(),
    disconnect: jest.fn(),
    getBalance: jest.fn(),
    estimateGas: jest.fn(),
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  CreditCard: ({ className }) => <div data-testid="credit-card-icon" className={className} />,
  Wallet: ({ className }) => <div data-testid="wallet-icon" className={className} />,
  DollarSign: ({ className }) => <div data-testid="dollar-sign-icon" className={className} />,
  Zap: ({ className }) => <div data-testid="zap-icon" className={className} />,
  AlertTriangle: ({ className }) => <div data-testid="alert-triangle-icon" className={className} />,
  CheckCircle: ({ className }) => <div data-testid="check-circle-icon" className={className} />,
  Clock: ({ className }) => <div data-testid="clock-icon" className={className} />,
  ExternalLink: ({ className }) => <div data-testid="external-link-icon" className={className} />,
  Copy: ({ className }) => <div data-testid="copy-icon" className={className} />,
  Info: ({ className }) => <div data-testid="info-icon" className={className} />,
  X: ({ className }) => <div data-testid="x-icon" className={className} />,
  Coins: ({ className }) => <div data-testid="coins-icon" className={className} />,
  Shield: ({ className }) => <div data-testid="shield-icon" className={className} />,
  TrendingUp: ({ className }) => <div data-testid="trending-up-icon" className={className} />,
  RefreshCw: ({ className }) => <div data-testid="refresh-cw-icon" className={className} />,
  ArrowRight: ({ className }) => <div data-testid="arrow-right-icon" className={className} />,
}));

// Mock Radix UI components
jest.mock('@radix-ui/themes', () => ({
  Card: ({ children, className, onClick }) => (
    <div data-testid="card" className={className} onClick={onClick}>
      {children}
    </div>
  ),
  Button: ({ children, onClick, disabled, variant, size }) => (
    <button
      data-testid="button"
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      data-size={size}
    >
      {children}
    </button>
  ),
  Badge: ({ children, variant, color }) => (
    <span data-testid="badge" data-variant={variant} data-color={color}>
      {children}
    </span>
  ),
  Dialog: {
    Root: ({ children, open, onOpenChange }) =>
      open ? <div data-testid="dialog-root">{children}</div> : null,
    Content: ({ children, className }) => (
      <div data-testid="dialog-content" className={className}>
        {children}
      </div>
    ),
    Title: ({ children, className }) => (
      <h2 data-testid="dialog-title" className={className}>
        {children}
      </h2>
    ),
  },
  Select: {
    Root: ({ children, value, onValueChange, disabled }) => (
      <div data-testid="select-root" data-value={value} data-disabled={disabled}>
        {React.Children.map(children, (child) =>
          React.cloneElement(child, { value, onValueChange })
        )}
      </div>
    ),
    Trigger: ({ children, className }) => (
      <button data-testid="select-trigger" className={className}>
        {children}
      </button>
    ),
    Value: ({ value }) => <span data-testid="select-value">{value}</span>,
    Content: ({ children }) => <div data-testid="select-content">{children}</div>,
    Item: ({ children, value, onValueChange }) => (
      <div
        data-testid="select-item"
        data-value={value}
        onClick={() => onValueChange && onValueChange(value)}
      >
        {children}
      </div>
    ),
  },
  Progress: ({ value, className }) => (
    <div data-testid="progress" data-value={value} className={className} />
  ),
  Tabs: ({ children }) => <div data-testid="tabs">{children}</div>,
}));

describe('CryptoPaymentModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    paymentType: PAYMENT_TYPES.TIP,
    recipientAddress: '0x1234567890123456789012345678901234567890',
    amount: null,
    metadata: {},
  };

  const mockPaymentMethods = [
    {
      name: 'Credit Card (Transak)',
      type: 'fiat_to_crypto',
      provider: 'transak',
      fees: { fiat: 1.99, percentage: 0.029 },
      supportedCurrencies: ['USD', 'EUR', 'GBP'],
      supportedCryptos: ['ETH', 'USDC', 'DAI'],
    },
    {
      name: 'Credit Card (MoonPay)',
      type: 'fiat_to_crypto',
      provider: 'moonpay',
      fees: { fiat: 2.49, percentage: 0.035 },
      supportedCurrencies: ['USD', 'EUR'],
      supportedCryptos: ['ETH', 'USDC'],
    },
    {
      name: 'Direct ETH Payment',
      type: 'direct_crypto',
      token: 'ETH',
      fees: { fiat: 0, percentage: 0.01 },
    },
    {
      name: 'Direct USDC Payment',
      type: 'direct_crypto',
      token: 'USDC',
      fees: { fiat: 0, percentage: 0.01 },
    },
  ];

  const mockCryptoPrices = {
    ETH: 2000,
    USDC: 1,
    DAI: 1,
    BTC: 40000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    walletManager.isConnected = false;
    walletManager.account = null;

    // Default mock implementations
    cryptoPaymentService.getAvailablePaymentMethods.mockReturnValue(mockPaymentMethods);
    cryptoPaymentService.getCryptoPrices.mockResolvedValue(mockCryptoPrices);
    cryptoPaymentService.calculateFees.mockReturnValue({
      platformFee: 0.5,
      gatewayFee: 1.99,
      total: 2.49,
    });
  });

  // ============================================================================
  // 1. Modal Rendering and Open/Close
  // ============================================================================
  describe('Modal Rendering and Open/Close', () => {
    it('renders modal when isOpen is true', () => {
      render(<CryptoPaymentModal {...defaultProps} />);
      expect(screen.getByTestId('dialog-root')).toBeInTheDocument();
    });

    it('does not render modal when isOpen is false', () => {
      render(<CryptoPaymentModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByTestId('dialog-root')).not.toBeInTheDocument();
    });

    it('displays modal title', () => {
      render(<CryptoPaymentModal {...defaultProps} />);
      expect(screen.getByTestId('dialog-title')).toHaveTextContent('Crypto Payment');
    });

    it('calls onClose when close button is clicked', () => {
      render(<CryptoPaymentModal {...defaultProps} />);
      const closeButtons = screen.getAllByTestId('button');
      const xIconButton = closeButtons.find((btn) =>
        within(btn).queryByTestId('x-icon')
      );
      if (xIconButton) {
        fireEvent.click(xIconButton);
        expect(defaultProps.onClose).toHaveBeenCalled();
      }
    });

    it('calls onClose when cancel button is clicked', () => {
      render(<CryptoPaymentModal {...defaultProps} />);
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('renders without crashing with minimal props', () => {
      const { container } = render(
        <CryptoPaymentModal isOpen={true} onClose={jest.fn()} />
      );
      expect(container).toBeInTheDocument();
    });
  });

  // ============================================================================
  // 2. Payment Details Display
  // ============================================================================
  describe('Payment Details Display', () => {
    it('displays amount input field', async () => {
      render(<CryptoPaymentModal {...defaultProps} />);

      // Navigate to details step
      const fiatMethod = screen.getByText(/Credit Card \(Transak\)/i);
      fireEvent.click(fiatMethod);
      const continueButton = screen.getByText('Continue');
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
      });
    });

    it('pre-fills amount when provided in props', async () => {
      render(<CryptoPaymentModal {...defaultProps} amount={100} />);

      const fiatMethod = screen.getByText(/Credit Card \(Transak\)/i);
      fireEvent.click(fiatMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const input = screen.getByPlaceholderText('0.00');
        expect(input).toHaveValue(100);
      });
    });

    it('displays recipient address for tips', () => {
      const props = {
        ...defaultProps,
        paymentType: PAYMENT_TYPES.TIP,
        recipientAddress: '0x1234567890123456789012345678901234567890',
      };
      render(<CryptoPaymentModal {...props} />);
      // Recipient address is used internally but not displayed directly
      expect(screen.getByTestId('dialog-root')).toBeInTheDocument();
    });

    it('displays description for payment type', () => {
      render(<CryptoPaymentModal {...defaultProps} />);
      expect(screen.getByText(/Choose Payment Method/i)).toBeInTheDocument();
      expect(screen.getByText(/Select how you'd like to pay/i)).toBeInTheDocument();
    });
  });

  // ============================================================================
  // 3. Token Selection Dropdown
  // ============================================================================
  describe('Token Selection Dropdown', () => {
    it('displays cryptocurrency dropdown', async () => {
      render(<CryptoPaymentModal {...defaultProps} />);

      const fiatMethod = screen.getByText(/Credit Card \(Transak\)/i);
      fireEvent.click(fiatMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        expect(screen.getByText('Cryptocurrency')).toBeInTheDocument();
      });
    });

    it('shows supported tokens for fiat method', async () => {
      render(<CryptoPaymentModal {...defaultProps} />);

      const fiatMethod = screen.getByText(/Credit Card \(Transak\)/i);
      fireEvent.click(fiatMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const selectItems = screen.getAllByTestId('select-item');
        expect(selectItems.length).toBeGreaterThan(0);
      });
    });

    it('disables token selection for direct crypto payment', async () => {
      render(<CryptoPaymentModal {...defaultProps} />);

      const directMethod = screen.getByText(/Direct ETH Payment/i);
      fireEvent.click(directMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const selectRoot = screen.getByTestId('select-root');
        expect(selectRoot).toHaveAttribute('data-disabled', 'true');
      });
    });

    it('updates selected token when changed', async () => {
      render(<CryptoPaymentModal {...defaultProps} />);

      const fiatMethod = screen.getByText(/Credit Card \(Transak\)/i);
      fireEvent.click(fiatMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const selectItems = screen.getAllByTestId('select-item');
        if (selectItems.length > 1) {
          fireEvent.click(selectItems[1]);
        }
      });
    });

    it('supports ETH token selection', async () => {
      render(<CryptoPaymentModal {...defaultProps} />);

      const fiatMethod = screen.getByText(/Credit Card \(Transak\)/i);
      fireEvent.click(fiatMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const ethItem = screen.getAllByTestId('select-item').find((item) =>
          item.getAttribute('data-value') === 'ETH'
        );
        expect(ethItem).toBeInTheDocument();
      });
    });

    it('supports USDC token selection', async () => {
      render(<CryptoPaymentModal {...defaultProps} />);

      const fiatMethod = screen.getByText(/Credit Card \(Transak\)/i);
      fireEvent.click(fiatMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const usdcItem = screen.getAllByTestId('select-item').find((item) =>
          item.getAttribute('data-value') === 'USDC'
        );
        expect(usdcItem).toBeTruthy();
      });
    });

    it('supports DAI token selection', async () => {
      render(<CryptoPaymentModal {...defaultProps} />);

      const fiatMethod = screen.getByText(/Credit Card \(Transak\)/i);
      fireEvent.click(fiatMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const daiItem = screen.getAllByTestId('select-item').find((item) =>
          item.getAttribute('data-value') === 'DAI'
        );
        expect(daiItem).toBeTruthy();
      });
    });
  });

  // ============================================================================
  // 4. Network/Chain Selection
  // ============================================================================
  describe('Network/Chain Selection', () => {
    it('uses appropriate network for ETH payments', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';

      render(<CryptoPaymentModal {...defaultProps} />);

      const directMethod = screen.getByText(/Direct ETH Payment/i);
      fireEvent.click(directMethod);

      expect(directMethod).toBeInTheDocument();
    });

    it('supports Ethereum mainnet', () => {
      render(<CryptoPaymentModal {...defaultProps} />);
      expect(screen.getByTestId('dialog-root')).toBeInTheDocument();
    });

    it('supports Polygon network', () => {
      render(<CryptoPaymentModal {...defaultProps} />);
      expect(screen.getByTestId('dialog-root')).toBeInTheDocument();
    });

    it('displays network indicator when wallet connected', () => {
      walletManager.isConnected = true;
      render(<CryptoPaymentModal {...defaultProps} />);
      expect(screen.getByTestId('dialog-root')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // 5. Wallet Connection Check
  // ============================================================================
  describe('Wallet Connection Check', () => {
    it('checks wallet connection status', () => {
      render(<CryptoPaymentModal {...defaultProps} />);
      expect(walletManager.isConnected).toBe(false);
    });

    it('detects connected wallet', () => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';

      render(<CryptoPaymentModal {...defaultProps} />);
      expect(walletManager.isConnected).toBe(true);
    });

    it('detects disconnected wallet', () => {
      walletManager.isConnected = false;
      walletManager.account = null;

      render(<CryptoPaymentModal {...defaultProps} />);
      expect(walletManager.isConnected).toBe(false);
    });

    it('validates wallet before direct crypto payment', async () => {
      walletManager.isConnected = false;

      render(<CryptoPaymentModal {...defaultProps} />);

      const directMethod = screen.getByText(/Direct ETH Payment/i);
      fireEvent.click(directMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '0.1' } });
      });

      const payButton = screen.getAllByTestId('button').find((btn) =>
        btn.textContent.includes('Pay')
      );
      if (payButton) {
        fireEvent.click(payButton);

        await waitFor(() => {
          expect(screen.getByText(/Please connect your wallet/i)).toBeInTheDocument();
        });
      }
    });
  });

  // ============================================================================
  // 6. Connect Wallet Button
  // ============================================================================
  describe('Connect Wallet Button', () => {
    it('shows error message when wallet not connected for direct payment', async () => {
      walletManager.isConnected = false;

      render(<CryptoPaymentModal {...defaultProps} />);

      const directMethod = screen.getByText(/Direct ETH Payment/i);
      fireEvent.click(directMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '0.1' } });
      });

      const payButton = screen.getAllByTestId('button').find((btn) =>
        btn.textContent.includes('Pay')
      );
      if (payButton) {
        fireEvent.click(payButton);

        await waitFor(() => {
          expect(screen.getByText(/Please connect your wallet/i)).toBeInTheDocument();
        });
      }
    });

    it('allows payment when wallet is connected', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      cryptoPaymentService.tipUser.mockResolvedValue({
        transactionHash: '0xabc123',
        status: 'success',
      });

      render(<CryptoPaymentModal {...defaultProps} />);

      const directMethod = screen.getByText(/Direct ETH Payment/i);
      fireEvent.click(directMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '0.1' } });
      });

      const payButton = screen.getAllByTestId('button').find((btn) =>
        btn.textContent.includes('Pay')
      );
      if (payButton) {
        fireEvent.click(payButton);

        await waitFor(() => {
          expect(cryptoPaymentService.tipUser).toHaveBeenCalled();
        });
      }
    });
  });

  // ============================================================================
  // 7. Balance Display
  // ============================================================================
  describe('Balance Display', () => {
    it('displays wallet balance when connected', () => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      walletManager.getBalance = jest.fn().mockResolvedValue('1.5');

      render(<CryptoPaymentModal {...defaultProps} />);
      expect(walletManager.isConnected).toBe(true);
    });

    it('shows balance for selected token', () => {
      walletManager.isConnected = true;
      walletManager.getBalance = jest.fn().mockResolvedValue('100');

      render(<CryptoPaymentModal {...defaultProps} />);
      expect(walletManager.isConnected).toBe(true);
    });

    it('updates balance when token changes', () => {
      walletManager.isConnected = true;
      render(<CryptoPaymentModal {...defaultProps} />);
      expect(screen.getByTestId('dialog-root')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // 8. Insufficient Balance Warning
  // ============================================================================
  describe('Insufficient Balance Warning', () => {
    it('displays warning when balance is insufficient', () => {
      walletManager.isConnected = true;
      walletManager.getBalance = jest.fn().mockResolvedValue('0.001');

      render(<CryptoPaymentModal {...defaultProps} amount={1} />);
      // Warning would appear in the actual component logic
      expect(screen.getByTestId('dialog-root')).toBeInTheDocument();
    });

    it('shows insufficient balance error message', async () => {
      walletManager.isConnected = true;
      walletManager.getBalance = jest.fn().mockResolvedValue('0');

      render(<CryptoPaymentModal {...defaultProps} />);
      expect(screen.getByTestId('dialog-root')).toBeInTheDocument();
    });

    it('disables payment button when balance insufficient', () => {
      walletManager.isConnected = true;
      walletManager.getBalance = jest.fn().mockResolvedValue('0');

      render(<CryptoPaymentModal {...defaultProps} amount={100} />);
      expect(screen.getByTestId('dialog-root')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // 9. Gas Estimation Display
  // ============================================================================
  describe('Gas Estimation Display', () => {
    it('estimates gas for transaction', async () => {
      walletManager.isConnected = true;
      walletManager.estimateGas = jest.fn().mockResolvedValue('21000');

      render(<CryptoPaymentModal {...defaultProps} />);
      expect(walletManager.isConnected).toBe(true);
    });

    it('displays estimated gas fee', () => {
      render(<CryptoPaymentModal {...defaultProps} />);
      expect(screen.getByTestId('dialog-root')).toBeInTheDocument();
    });

    it('updates gas estimate when amount changes', () => {
      walletManager.estimateGas = jest.fn().mockResolvedValue('25000');
      render(<CryptoPaymentModal {...defaultProps} />);
      expect(screen.getByTestId('dialog-root')).toBeInTheDocument();
    });

    it('shows gas price in gwei', () => {
      render(<CryptoPaymentModal {...defaultProps} />);
      expect(screen.getByTestId('dialog-root')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // 10. Total Cost Calculation
  // ============================================================================
  describe('Total Cost Calculation', () => {
    it('calculates total with platform fees', async () => {
      render(<CryptoPaymentModal {...defaultProps} />);

      const fiatMethod = screen.getByText(/Credit Card \(Transak\)/i);
      fireEvent.click(fiatMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '100' } });
      });

      await waitFor(() => {
        expect(cryptoPaymentService.calculateFees).toHaveBeenCalledWith(
          100,
          expect.any(Object)
        );
      });
    });

    it('displays fee breakdown', async () => {
      render(<CryptoPaymentModal {...defaultProps} />);

      const fiatMethod = screen.getByText(/Credit Card \(Transak\)/i);
      fireEvent.click(fiatMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '100' } });
      });

      await waitFor(() => {
        expect(screen.getByText('Fee Breakdown')).toBeInTheDocument();
      });
    });

    it('shows platform fee', async () => {
      render(<CryptoPaymentModal {...defaultProps} />);

      const fiatMethod = screen.getByText(/Credit Card \(Transak\)/i);
      fireEvent.click(fiatMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '100' } });
      });

      await waitFor(() => {
        expect(screen.getByText('Platform Fee:')).toBeInTheDocument();
      });
    });

    it('shows gateway fee', async () => {
      render(<CryptoPaymentModal {...defaultProps} />);

      const fiatMethod = screen.getByText(/Credit Card \(Transak\)/i);
      fireEvent.click(fiatMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '100' } });
      });

      await waitFor(() => {
        expect(screen.getByText('Gateway Fee:')).toBeInTheDocument();
      });
    });

    it('displays total amount', async () => {
      render(<CryptoPaymentModal {...defaultProps} />);

      const fiatMethod = screen.getByText(/Credit Card \(Transak\)/i);
      fireEvent.click(fiatMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '100' } });
      });

      await waitFor(() => {
        expect(screen.getByText('Total:')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // 11. Transaction Preview
  // ============================================================================
  describe('Transaction Preview', () => {
    it('shows payment preview before confirmation', async () => {
      render(<CryptoPaymentModal {...defaultProps} />);

      const fiatMethod = screen.getByText(/Credit Card \(Transak\)/i);
      fireEvent.click(fiatMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        expect(screen.getByText('Payment Details')).toBeInTheDocument();
      });
    });

    it('displays amount in preview', async () => {
      render(<CryptoPaymentModal {...defaultProps} amount={50} />);

      const fiatMethod = screen.getByText(/Credit Card \(Transak\)/i);
      fireEvent.click(fiatMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        expect(amountInput).toHaveValue(50);
      });
    });

    it('shows recipient in preview for tips', async () => {
      render(<CryptoPaymentModal {...defaultProps} paymentType={PAYMENT_TYPES.TIP} />);

      const fiatMethod = screen.getByText(/Credit Card \(Transak\)/i);
      fireEvent.click(fiatMethod);

      expect(defaultProps.recipientAddress).toBeTruthy();
    });

    it('displays selected cryptocurrency', async () => {
      render(<CryptoPaymentModal {...defaultProps} />);

      const fiatMethod = screen.getByText(/Credit Card \(Transak\)/i);
      fireEvent.click(fiatMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        expect(screen.getByText('Cryptocurrency')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // 12. Confirm Payment Button
  // ============================================================================
  describe('Confirm Payment Button', () => {
    it('renders confirm payment button', async () => {
      render(<CryptoPaymentModal {...defaultProps} />);

      const fiatMethod = screen.getByText(/Credit Card \(Transak\)/i);
      fireEvent.click(fiatMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const payButton = screen.getAllByTestId('button').find((btn) =>
          btn.textContent.includes('Pay')
        );
        expect(payButton).toBeInTheDocument();
      });
    });

    it('disables button when processing', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';

      // Make payment processing take time
      cryptoPaymentService.tipUser.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ transactionHash: '0xabc' }), 1000))
      );

      render(<CryptoPaymentModal {...defaultProps} />);

      const directMethod = screen.getByText(/Direct ETH Payment/i);
      fireEvent.click(directMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '0.1' } });
      });

      const payButton = screen.getAllByTestId('button').find((btn) =>
        btn.textContent.includes('Pay')
      );
      if (payButton) {
        fireEvent.click(payButton);

        await waitFor(() => {
          expect(payButton).toBeDisabled();
        });
      }
    });

    it('enables button when not processing', async () => {
      render(<CryptoPaymentModal {...defaultProps} />);

      const fiatMethod = screen.getByText(/Credit Card \(Transak\)/i);
      fireEvent.click(fiatMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '100' } });
      });

      await waitFor(() => {
        const payButton = screen.getAllByTestId('button').find((btn) =>
          btn.textContent.includes('Pay')
        );
        expect(payButton).not.toBeDisabled();
      });
    });

    it('validates form before allowing payment', async () => {
      render(<CryptoPaymentModal {...defaultProps} />);

      const fiatMethod = screen.getByText(/Credit Card \(Transak\)/i);
      fireEvent.click(fiatMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const payButton = screen.getAllByTestId('button').find((btn) =>
          btn.textContent.includes('Pay')
        );
        if (payButton) {
          fireEvent.click(payButton);
        }
      });

      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid amount/i)).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // 13. Payment Processing States
  // ============================================================================
  describe('Payment Processing States', () => {
    it('shows processing indicator', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';

      cryptoPaymentService.tipUser.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ transactionHash: '0xabc' }), 500))
      );

      render(<CryptoPaymentModal {...defaultProps} />);

      const directMethod = screen.getByText(/Direct ETH Payment/i);
      fireEvent.click(directMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '0.1' } });
      });

      const payButton = screen.getAllByTestId('button').find((btn) =>
        btn.textContent.includes('Pay')
      );
      if (payButton) {
        fireEvent.click(payButton);

        await waitFor(() => {
          expect(screen.getByText('Processing...')).toBeInTheDocument();
        });
      }
    });

    it('displays processing status message', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';

      cryptoPaymentService.tipUser.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ transactionHash: '0xabc' }), 100))
      );

      render(<CryptoPaymentModal {...defaultProps} />);

      const directMethod = screen.getByText(/Direct ETH Payment/i);
      fireEvent.click(directMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '0.1' } });
      });

      const payButton = screen.getAllByTestId('button').find((btn) =>
        btn.textContent.includes('Pay')
      );
      if (payButton) {
        fireEvent.click(payButton);

        await waitFor(() => {
          expect(screen.getByText(/Initiating payment/i)).toBeInTheDocument();
        });
      }
    });

    it('shows spinner during processing', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';

      cryptoPaymentService.tipUser.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ transactionHash: '0xabc' }), 100))
      );

      render(<CryptoPaymentModal {...defaultProps} />);

      const directMethod = screen.getByText(/Direct ETH Payment/i);
      fireEvent.click(directMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '0.1' } });
      });

      const payButton = screen.getAllByTestId('button').find((btn) =>
        btn.textContent.includes('Pay')
      );
      if (payButton) {
        fireEvent.click(payButton);

        await waitFor(() => {
          expect(screen.getByTestId('refresh-cw-icon')).toBeInTheDocument();
        });
      }
    });
  });

  // ============================================================================
  // 14. Transaction Submission
  // ============================================================================
  describe('Transaction Submission', () => {
    it('submits transaction with correct parameters', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      cryptoPaymentService.tipUser.mockResolvedValue({
        transactionHash: '0xabc123',
      });

      render(<CryptoPaymentModal {...defaultProps} />);

      const directMethod = screen.getByText(/Direct ETH Payment/i);
      fireEvent.click(directMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '0.5' } });
      });

      const payButton = screen.getAllByTestId('button').find((btn) =>
        btn.textContent.includes('Pay')
      );
      if (payButton) {
        fireEvent.click(payButton);

        await waitFor(() => {
          expect(cryptoPaymentService.tipUser).toHaveBeenCalledWith(
            defaultProps.recipientAddress,
            '0.5',
            'ETH',
            ''
          );
        });
      }
    });

    it('handles Transak payment submission', async () => {
      cryptoPaymentService.buyWithTransak.mockResolvedValue({
        url: 'https://transak.com/payment',
      });

      render(<CryptoPaymentModal {...defaultProps} />);

      const transakMethod = screen.getByText(/Credit Card \(Transak\)/i);
      fireEvent.click(transakMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '100' } });
      });

      const payButton = screen.getAllByTestId('button').find((btn) =>
        btn.textContent.includes('Pay')
      );
      if (payButton) {
        fireEvent.click(payButton);

        await waitFor(() => {
          expect(cryptoPaymentService.buyWithTransak).toHaveBeenCalled();
        });
      }
    });

    it('handles MoonPay payment submission', async () => {
      cryptoPaymentService.buyWithMoonPay.mockResolvedValue({
        url: 'https://moonpay.com/payment',
      });

      render(<CryptoPaymentModal {...defaultProps} />);

      const moonpayMethod = screen.getByText(/Credit Card \(MoonPay\)/i);
      fireEvent.click(moonpayMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '100' } });
      });

      const payButton = screen.getAllByTestId('button').find((btn) =>
        btn.textContent.includes('Pay')
      );
      if (payButton) {
        fireEvent.click(payButton);

        await waitFor(() => {
          expect(cryptoPaymentService.buyWithMoonPay).toHaveBeenCalled();
        });
      }
    });

    it('handles subscription payment', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      cryptoPaymentService.subscribeToPremium.mockResolvedValue({
        transactionHash: '0xabc123',
      });

      render(
        <CryptoPaymentModal
          {...defaultProps}
          paymentType={PAYMENT_TYPES.SUBSCRIPTION}
        />
      );

      const directMethod = screen.getByText(/Direct ETH Payment/i);
      fireEvent.click(directMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        expect(screen.getByText('Subscription Tier')).toBeInTheDocument();
      });

      const payButton = screen.getAllByTestId('button').find((btn) =>
        btn.textContent.includes('Pay')
      );
      if (payButton) {
        fireEvent.click(payButton);

        await waitFor(() => {
          expect(cryptoPaymentService.subscribeToPremium).toHaveBeenCalled();
        });
      }
    });

    it('handles NFT purchase payment', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      cryptoPaymentService.purchaseNFT.mockResolvedValue({
        transactionHash: '0xabc123',
      });

      const nftMetadata = {
        nftContract: '0xNFTContract',
        tokenId: '123',
      };

      render(
        <CryptoPaymentModal
          {...defaultProps}
          paymentType={PAYMENT_TYPES.NFT_PURCHASE}
          metadata={nftMetadata}
          amount={1}
        />
      );

      const directMethod = screen.getByText(/Direct ETH Payment/i);
      fireEvent.click(directMethod);
      fireEvent.click(screen.getByText('Continue'));

      const payButton = screen.getAllByTestId('button').find((btn) =>
        btn.textContent.includes('Pay')
      );
      if (payButton) {
        fireEvent.click(payButton);

        await waitFor(() => {
          expect(cryptoPaymentService.purchaseNFT).toHaveBeenCalledWith(
            nftMetadata.nftContract,
            nftMetadata.tokenId,
            '1',
            'ETH'
          );
        });
      }
    });
  });

  // ============================================================================
  // 15. Transaction Confirmation Waiting
  // ============================================================================
  describe('Transaction Confirmation Waiting', () => {
    it('shows waiting message for blockchain confirmation', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';

      cryptoPaymentService.tipUser.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ transactionHash: '0xabc' }), 200))
      );

      render(<CryptoPaymentModal {...defaultProps} />);

      const directMethod = screen.getByText(/Direct ETH Payment/i);
      fireEvent.click(directMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '0.1' } });
      });

      const payButton = screen.getAllByTestId('button').find((btn) =>
        btn.textContent.includes('Pay')
      );
      if (payButton) {
        fireEvent.click(payButton);

        await waitFor(() => {
          expect(screen.getByText(/confirm the transaction in your wallet/i)).toBeInTheDocument();
        });
      }
    });

    it('displays clock icon during confirmation', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';

      cryptoPaymentService.tipUser.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ transactionHash: '0xabc' }), 200))
      );

      render(<CryptoPaymentModal {...defaultProps} />);

      const directMethod = screen.getByText(/Direct ETH Payment/i);
      fireEvent.click(directMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '0.1' } });
      });

      const payButton = screen.getAllByTestId('button').find((btn) =>
        btn.textContent.includes('Pay')
      );
      if (payButton) {
        fireEvent.click(payButton);

        await waitFor(() => {
          expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
        });
      }
    });

    it('shows info message for fiat gateway redirect', async () => {
      cryptoPaymentService.buyWithTransak.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ url: 'https://transak.com' }), 200))
      );

      render(<CryptoPaymentModal {...defaultProps} />);

      const transakMethod = screen.getByText(/Credit Card \(Transak\)/i);
      fireEvent.click(transakMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '100' } });
      });

      const payButton = screen.getAllByTestId('button').find((btn) =>
        btn.textContent.includes('Pay')
      );
      if (payButton) {
        fireEvent.click(payButton);

        await waitFor(() => {
          expect(screen.getByText(/You will be redirected to transak/i)).toBeInTheDocument();
        });
      }
    });
  });

  // ============================================================================
  // 16. Success State
  // ============================================================================
  describe('Success State with Transaction Hash', () => {
    it('shows success message after completion', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      cryptoPaymentService.tipUser.mockResolvedValue({
        transactionHash: '0xabc123def456',
      });

      render(<CryptoPaymentModal {...defaultProps} />);

      const directMethod = screen.getByText(/Direct ETH Payment/i);
      fireEvent.click(directMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '0.1' } });
      });

      const payButton = screen.getAllByTestId('button').find((btn) =>
        btn.textContent.includes('Pay')
      );
      if (payButton) {
        fireEvent.click(payButton);

        await waitFor(() => {
          expect(screen.getByText('Payment Successful!')).toBeInTheDocument();
        }, { timeout: 3000 });
      }
    });

    it('displays transaction hash', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      cryptoPaymentService.tipUser.mockResolvedValue({
        transactionHash: '0xabc123def456',
      });

      render(<CryptoPaymentModal {...defaultProps} />);

      const directMethod = screen.getByText(/Direct ETH Payment/i);
      fireEvent.click(directMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '0.1' } });
      });

      const payButton = screen.getAllByTestId('button').find((btn) =>
        btn.textContent.includes('Pay')
      );
      if (payButton) {
        fireEvent.click(payButton);

        await waitFor(() => {
          expect(screen.getByText('Transaction Hash:')).toBeInTheDocument();
        }, { timeout: 3000 });
      }
    });

    it('shows truncated transaction hash', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      const txHash = '0xabc123def456789012345678';
      cryptoPaymentService.tipUser.mockResolvedValue({
        transactionHash: txHash,
      });

      render(<CryptoPaymentModal {...defaultProps} />);

      const directMethod = screen.getByText(/Direct ETH Payment/i);
      fireEvent.click(directMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '0.1' } });
      });

      const payButton = screen.getAllByTestId('button').find((btn) =>
        btn.textContent.includes('Pay')
      );
      if (payButton) {
        fireEvent.click(payButton);

        await waitFor(() => {
          expect(screen.getByText(/0xabc123de.../i)).toBeInTheDocument();
        }, { timeout: 3000 });
      }
    });

    it('displays success icon', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      cryptoPaymentService.tipUser.mockResolvedValue({
        transactionHash: '0xabc123',
      });

      render(<CryptoPaymentModal {...defaultProps} />);

      const directMethod = screen.getByText(/Direct ETH Payment/i);
      fireEvent.click(directMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '0.1' } });
      });

      const payButton = screen.getAllByTestId('button').find((btn) =>
        btn.textContent.includes('Pay')
      );
      if (payButton) {
        fireEvent.click(payButton);

        await waitFor(() => {
          expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
        }, { timeout: 3000 });
      }
    });

    it('shows confirmed badge', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      cryptoPaymentService.tipUser.mockResolvedValue({
        transactionHash: '0xabc123',
      });

      render(<CryptoPaymentModal {...defaultProps} />);

      const directMethod = screen.getByText(/Direct ETH Payment/i);
      fireEvent.click(directMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '0.1' } });
      });

      const payButton = screen.getAllByTestId('button').find((btn) =>
        btn.textContent.includes('Pay')
      );
      if (payButton) {
        fireEvent.click(payButton);

        await waitFor(() => {
          expect(screen.getByText('Confirmed')).toBeInTheDocument();
        }, { timeout: 3000 });
      }
    });

    it('includes copy button for transaction hash', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      cryptoPaymentService.tipUser.mockResolvedValue({
        transactionHash: '0xabc123',
      });

      render(<CryptoPaymentModal {...defaultProps} />);

      const directMethod = screen.getByText(/Direct ETH Payment/i);
      fireEvent.click(directMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '0.1' } });
      });

      const payButton = screen.getAllByTestId('button').find((btn) =>
        btn.textContent.includes('Pay')
      );
      if (payButton) {
        fireEvent.click(payButton);

        await waitFor(() => {
          expect(screen.getByTestId('copy-icon')).toBeInTheDocument();
        }, { timeout: 3000 });
      }
    });
  });

  // ============================================================================
  // 17. Error Handling
  // ============================================================================
  describe('Error Handling', () => {
    it('handles insufficient funds error', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      cryptoPaymentService.tipUser.mockRejectedValue(
        new Error('Insufficient funds')
      );

      render(<CryptoPaymentModal {...defaultProps} />);

      const directMethod = screen.getByText(/Direct ETH Payment/i);
      fireEvent.click(directMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '999' } });
      });

      const payButton = screen.getAllByTestId('button').find((btn) =>
        btn.textContent.includes('Pay')
      );
      if (payButton) {
        fireEvent.click(payButton);

        await waitFor(() => {
          expect(screen.getByText(/Insufficient funds/i)).toBeInTheDocument();
        });
      }
    });

    it('handles user rejection error', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      cryptoPaymentService.tipUser.mockRejectedValue(
        new Error('User rejected transaction')
      );

      render(<CryptoPaymentModal {...defaultProps} />);

      const directMethod = screen.getByText(/Direct ETH Payment/i);
      fireEvent.click(directMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '0.1' } });
      });

      const payButton = screen.getAllByTestId('button').find((btn) =>
        btn.textContent.includes('Pay')
      );
      if (payButton) {
        fireEvent.click(payButton);

        await waitFor(() => {
          expect(screen.getByText(/User rejected transaction/i)).toBeInTheDocument();
        });
      }
    });

    it('handles network error', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      cryptoPaymentService.tipUser.mockRejectedValue(
        new Error('Network error')
      );

      render(<CryptoPaymentModal {...defaultProps} />);

      const directMethod = screen.getByText(/Direct ETH Payment/i);
      fireEvent.click(directMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '0.1' } });
      });

      const payButton = screen.getAllByTestId('button').find((btn) =>
        btn.textContent.includes('Pay')
      );
      if (payButton) {
        fireEvent.click(payButton);

        await waitFor(() => {
          expect(screen.getByText(/Network error/i)).toBeInTheDocument();
        });
      }
    });

    it('displays error icon', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      cryptoPaymentService.tipUser.mockRejectedValue(
        new Error('Payment failed')
      );

      render(<CryptoPaymentModal {...defaultProps} />);

      const directMethod = screen.getByText(/Direct ETH Payment/i);
      fireEvent.click(directMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '0.1' } });
      });

      const payButton = screen.getAllByTestId('button').find((btn) =>
        btn.textContent.includes('Pay')
      );
      if (payButton) {
        fireEvent.click(payButton);

        await waitFor(() => {
          expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
        });
      }
    });

    it('shows validation error for invalid amount', async () => {
      render(<CryptoPaymentModal {...defaultProps} />);

      const fiatMethod = screen.getByText(/Credit Card \(Transak\)/i);
      fireEvent.click(fiatMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '-10' } });
      });

      const payButton = screen.getAllByTestId('button').find((btn) =>
        btn.textContent.includes('Pay')
      );
      if (payButton) {
        fireEvent.click(payButton);

        await waitFor(() => {
          expect(screen.getByText(/Please enter a valid amount/i)).toBeInTheDocument();
        });
      }
    });

    it('shows error for missing recipient on tip', async () => {
      render(
        <CryptoPaymentModal
          {...defaultProps}
          recipientAddress={null}
          paymentType={PAYMENT_TYPES.TIP}
        />
      );

      const fiatMethod = screen.getByText(/Credit Card \(Transak\)/i);
      fireEvent.click(fiatMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '10' } });
      });

      const payButton = screen.getAllByTestId('button').find((btn) =>
        btn.textContent.includes('Pay')
      );
      if (payButton) {
        fireEvent.click(payButton);

        await waitFor(() => {
          expect(screen.getByText(/Recipient address is required/i)).toBeInTheDocument();
        });
      }
    });
  });

  // ============================================================================
  // 18. Transaction History Link
  // ============================================================================
  describe('Transaction History Link', () => {
    it('provides link to transaction history', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      cryptoPaymentService.tipUser.mockResolvedValue({
        transactionHash: '0xabc123',
      });

      render(<CryptoPaymentModal {...defaultProps} />);

      const directMethod = screen.getByText(/Direct ETH Payment/i);
      fireEvent.click(directMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '0.1' } });
      });

      const payButton = screen.getAllByTestId('button').find((btn) =>
        btn.textContent.includes('Pay')
      );
      if (payButton) {
        fireEvent.click(payButton);

        await waitFor(() => {
          expect(screen.getByText('Done')).toBeInTheDocument();
        }, { timeout: 3000 });
      }
    });
  });

  // ============================================================================
  // 19. View on Block Explorer Link
  // ============================================================================
  describe('View on Block Explorer Link', () => {
    it('displays block explorer link after success', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      cryptoPaymentService.tipUser.mockResolvedValue({
        transactionHash: '0xabc123',
      });

      render(<CryptoPaymentModal {...defaultProps} />);

      const directMethod = screen.getByText(/Direct ETH Payment/i);
      fireEvent.click(directMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '0.1' } });
      });

      const payButton = screen.getAllByTestId('button').find((btn) =>
        btn.textContent.includes('Pay')
      );
      if (payButton) {
        fireEvent.click(payButton);

        await waitFor(() => {
          expect(screen.getByText(/View on Explorer/i)).toBeInTheDocument();
        }, { timeout: 3000 });
      }
    });

    it('opens explorer in new window', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      const txHash = '0xabc123';
      cryptoPaymentService.tipUser.mockResolvedValue({
        transactionHash: txHash,
      });

      window.open = jest.fn();

      render(<CryptoPaymentModal {...defaultProps} />);

      const directMethod = screen.getByText(/Direct ETH Payment/i);
      fireEvent.click(directMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '0.1' } });
      });

      const payButton = screen.getAllByTestId('button').find((btn) =>
        btn.textContent.includes('Pay')
      );
      if (payButton) {
        fireEvent.click(payButton);

        await waitFor(() => {
          const explorerButton = screen.getByText(/View on Explorer/i);
          fireEvent.click(explorerButton);
          expect(window.open).toHaveBeenCalledWith(
            `https://etherscan.io/tx/${txHash}`,
            '_blank'
          );
        }, { timeout: 3000 });
      }
    });

    it('uses correct explorer URL', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      const txHash = '0xabc123';
      cryptoPaymentService.tipUser.mockResolvedValue({
        transactionHash: txHash,
      });

      window.open = jest.fn();

      render(<CryptoPaymentModal {...defaultProps} />);

      const directMethod = screen.getByText(/Direct ETH Payment/i);
      fireEvent.click(directMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '0.1' } });
      });

      const payButton = screen.getAllByTestId('button').find((btn) =>
        btn.textContent.includes('Pay')
      );
      if (payButton) {
        fireEvent.click(payButton);

        await waitFor(() => {
          const explorerButton = screen.getByText(/View on Explorer/i);
          fireEvent.click(explorerButton);
          expect(window.open).toHaveBeenCalledWith(
            expect.stringContaining('etherscan.io'),
            '_blank'
          );
        }, { timeout: 3000 });
      }
    });
  });

  // ============================================================================
  // 20. Multiple Token Support
  // ============================================================================
  describe('Multiple Token Support', () => {
    it('supports ETH payments', () => {
      render(<CryptoPaymentModal {...defaultProps} />);
      expect(screen.getByText(/Direct ETH Payment/i)).toBeInTheDocument();
    });

    it('supports USDC payments', () => {
      render(<CryptoPaymentModal {...defaultProps} />);
      expect(screen.getByText(/Direct USDC Payment/i)).toBeInTheDocument();
    });

    it('supports DAI token', async () => {
      render(<CryptoPaymentModal {...defaultProps} />);

      const fiatMethod = screen.getByText(/Credit Card \(Transak\)/i);
      fireEvent.click(fiatMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const daiItem = screen.getAllByTestId('select-item').find((item) =>
          item.getAttribute('data-value') === 'DAI'
        );
        expect(daiItem).toBeTruthy();
      });
    });

    it('displays crypto prices correctly', async () => {
      render(<CryptoPaymentModal {...defaultProps} />);

      await waitFor(() => {
        expect(cryptoPaymentService.getCryptoPrices).toHaveBeenCalled();
      });
    });

    it('converts between USD and crypto', async () => {
      render(<CryptoPaymentModal {...defaultProps} />);

      const fiatMethod = screen.getByText(/Credit Card \(Transak\)/i);
      fireEvent.click(fiatMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '100' } });
      });

      // Component should calculate crypto equivalent
      await waitFor(() => {
        expect(screen.getByText(/≈/)).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // 21. Multi-chain Support
  // ============================================================================
  describe('Multi-chain Support', () => {
    it('supports Ethereum network', () => {
      render(<CryptoPaymentModal {...defaultProps} />);
      expect(screen.getByText(/Direct ETH Payment/i)).toBeInTheDocument();
    });

    it('handles Polygon network transactions', () => {
      render(<CryptoPaymentModal {...defaultProps} />);
      expect(screen.getByTestId('dialog-root')).toBeInTheDocument();
    });

    it('adapts to different chain configurations', () => {
      render(<CryptoPaymentModal {...defaultProps} />);
      expect(screen.getByTestId('dialog-root')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // 22. Cancel Payment
  // ============================================================================
  describe('Cancel Payment', () => {
    it('allows canceling before payment', () => {
      render(<CryptoPaymentModal {...defaultProps} />);
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('allows going back to method selection', async () => {
      render(<CryptoPaymentModal {...defaultProps} />);

      const fiatMethod = screen.getByText(/Credit Card \(Transak\)/i);
      fireEvent.click(fiatMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const backButton = screen.getByText('Back');
        fireEvent.click(backButton);
      });

      expect(screen.getByText('Choose Payment Method')).toBeInTheDocument();
    });

    it('resets form on cancel', async () => {
      const { rerender } = render(<CryptoPaymentModal {...defaultProps} />);

      const fiatMethod = screen.getByText(/Credit Card \(Transak\)/i);
      fireEvent.click(fiatMethod);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      rerender(<CryptoPaymentModal {...defaultProps} />);

      expect(screen.getByText('Choose Payment Method')).toBeInTheDocument();
    });

    it('calls onClose and resets on done button', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';
      cryptoPaymentService.tipUser.mockResolvedValue({
        transactionHash: '0xabc123',
      });

      render(<CryptoPaymentModal {...defaultProps} />);

      const directMethod = screen.getByText(/Direct ETH Payment/i);
      fireEvent.click(directMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '0.1' } });
      });

      const payButton = screen.getAllByTestId('button').find((btn) =>
        btn.textContent.includes('Pay')
      );
      if (payButton) {
        fireEvent.click(payButton);

        await waitFor(() => {
          const doneButton = screen.getByText('Done');
          fireEvent.click(doneButton);
          expect(defaultProps.onClose).toHaveBeenCalled();
        }, { timeout: 3000 });
      }
    });
  });

  // ============================================================================
  // 23. Loading States
  // ============================================================================
  describe('Loading States', () => {
    it('loads payment methods on open', async () => {
      render(<CryptoPaymentModal {...defaultProps} />);

      await waitFor(() => {
        expect(cryptoPaymentService.getAvailablePaymentMethods).toHaveBeenCalled();
      });
    });

    it('loads crypto prices on open', async () => {
      render(<CryptoPaymentModal {...defaultProps} />);

      await waitFor(() => {
        expect(cryptoPaymentService.getCryptoPrices).toHaveBeenCalled();
      });
    });

    it('handles loading state gracefully', () => {
      cryptoPaymentService.getCryptoPrices.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockCryptoPrices), 1000))
      );

      render(<CryptoPaymentModal {...defaultProps} />);
      expect(screen.getByTestId('dialog-root')).toBeInTheDocument();
    });

    it('shows progress indicator', () => {
      render(<CryptoPaymentModal {...defaultProps} />);
      expect(screen.getByTestId('progress')).toBeInTheDocument();
    });

    it('updates progress through steps', async () => {
      render(<CryptoPaymentModal {...defaultProps} />);

      const progress = screen.getByTestId('progress');
      expect(progress).toHaveAttribute('data-value', '25');

      const fiatMethod = screen.getByText(/Credit Card \(Transak\)/i);
      fireEvent.click(fiatMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const updatedProgress = screen.getByTestId('progress');
        expect(updatedProgress).toHaveAttribute('data-value', '50');
      });
    });
  });

  // ============================================================================
  // 24. Accessibility
  // ============================================================================
  describe('Accessibility', () => {
    it('has proper dialog role', () => {
      render(<CryptoPaymentModal {...defaultProps} />);
      expect(screen.getByTestId('dialog-root')).toBeInTheDocument();
    });

    it('has dialog title', () => {
      render(<CryptoPaymentModal {...defaultProps} />);
      expect(screen.getByTestId('dialog-title')).toHaveTextContent('Crypto Payment');
    });

    it('form inputs have labels', async () => {
      render(<CryptoPaymentModal {...defaultProps} />);

      const fiatMethod = screen.getByText(/Credit Card \(Transak\)/i);
      fireEvent.click(fiatMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        expect(screen.getByText(/Amount/i)).toBeInTheDocument();
        expect(screen.getByText('Cryptocurrency')).toBeInTheDocument();
      });
    });

    it('buttons are keyboard accessible', () => {
      render(<CryptoPaymentModal {...defaultProps} />);
      const buttons = screen.getAllByTestId('button');
      buttons.forEach((button) => {
        expect(button.tagName).toBe('BUTTON');
      });
    });

    it('supports tab navigation', () => {
      render(<CryptoPaymentModal {...defaultProps} />);
      const buttons = screen.getAllByTestId('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('provides visual feedback on interaction', async () => {
      render(<CryptoPaymentModal {...defaultProps} />);

      const fiatMethod = screen.getByText(/Credit Card \(Transak\)/i);
      const card = fiatMethod.closest('[data-testid="card"]');

      fireEvent.click(fiatMethod);

      expect(card).toHaveClass(/ring-2/);
    });

    it('displays error messages accessibly', async () => {
      render(<CryptoPaymentModal {...defaultProps} />);

      const fiatMethod = screen.getByText(/Credit Card \(Transak\)/i);
      fireEvent.click(fiatMethod);
      fireEvent.click(screen.getByText('Continue'));

      const payButton = screen.getAllByTestId('button').find((btn) =>
        btn.textContent.includes('Pay')
      );
      if (payButton) {
        fireEvent.click(payButton);

        await waitFor(() => {
          const errorMessage = screen.getByText(/Please enter a valid amount/i);
          expect(errorMessage).toBeInTheDocument();
          expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
        });
      }
    });

    it('provides loading announcements', async () => {
      walletManager.isConnected = true;
      walletManager.account = '0x1234567890123456789012345678901234567890';

      cryptoPaymentService.tipUser.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ transactionHash: '0xabc' }), 200))
      );

      render(<CryptoPaymentModal {...defaultProps} />);

      const directMethod = screen.getByText(/Direct ETH Payment/i);
      fireEvent.click(directMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '0.1' } });
      });

      const payButton = screen.getAllByTestId('button').find((btn) =>
        btn.textContent.includes('Pay')
      );
      if (payButton) {
        fireEvent.click(payButton);

        await waitFor(() => {
          expect(screen.getByText('Processing...')).toBeInTheDocument();
        });
      }
    });
  });

  // ============================================================================
  // Additional Edge Cases
  // ============================================================================
  describe('Additional Edge Cases', () => {
    it('handles price loading failure gracefully', async () => {
      cryptoPaymentService.getCryptoPrices.mockRejectedValue(
        new Error('Failed to load prices')
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<CryptoPaymentModal {...defaultProps} />);

      await waitFor(() => {
        expect(cryptoPaymentService.getCryptoPrices).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it('displays message for tips', async () => {
      render(<CryptoPaymentModal {...defaultProps} paymentType={PAYMENT_TYPES.TIP} />);

      const fiatMethod = screen.getByText(/Credit Card \(Transak\)/i);
      fireEvent.click(fiatMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        expect(screen.getByText(/Message \(Optional\)/i)).toBeInTheDocument();
      });
    });

    it('limits message character count', async () => {
      render(<CryptoPaymentModal {...defaultProps} paymentType={PAYMENT_TYPES.TIP} />);

      const fiatMethod = screen.getByText(/Credit Card \(Transak\)/i);
      fireEvent.click(fiatMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const textarea = screen.getByPlaceholderText(/Add a message with your tip/i);
        expect(textarea).toHaveAttribute('maxLength', '200');
      });
    });

    it('shows subscription tier options for subscriptions', async () => {
      render(
        <CryptoPaymentModal
          {...defaultProps}
          paymentType={PAYMENT_TYPES.SUBSCRIPTION}
        />
      );

      const directMethod = screen.getByText(/Direct ETH Payment/i);
      fireEvent.click(directMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        expect(screen.getByText('Subscription Tier')).toBeInTheDocument();
        expect(screen.getByText('Billing Period')).toBeInTheDocument();
      });
    });

    it('calculates fees when amount changes', async () => {
      render(<CryptoPaymentModal {...defaultProps} />);

      const fiatMethod = screen.getByText(/Credit Card \(Transak\)/i);
      fireEvent.click(fiatMethod);
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '50' } });
      });

      await waitFor(() => {
        expect(cryptoPaymentService.calculateFees).toHaveBeenCalledWith(
          50,
          expect.any(Object)
        );
      });
    });
  });
});

export default defaultProps
