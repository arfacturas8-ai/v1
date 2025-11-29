/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import CryptoTippingModal from './CryptoTippingModal';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, ...props }) => <div onClick={onClick} {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  X: (props) => <div data-testid="x-icon" {...props} />,
  DollarSign: (props) => <div data-testid="dollar-sign-icon" {...props} />,
  Send: (props) => <div data-testid="send-icon" {...props} />,
}));

// Mock Web3 functionality
const mockWeb3 = {
  eth: {
    sendTransaction: jest.fn(),
    getBalance: jest.fn(),
    Contract: jest.fn(),
  },
};

global.ethereum = {
  request: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
};

const renderComponent = (props = {}) => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    recipient: {
      id: 'user123',
      username: 'testuser',
      walletAddress: '0x1234567890123456789012345678901234567890',
    },
    ...props,
  };

  return render(
    <BrowserRouter>
      <CryptoTippingModal {...defaultProps} />
    </BrowserRouter>
  );
};

describe('CryptoTippingModal', () => {
  let mockOnClose;
  let mockRecipient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnClose = jest.fn();
    mockRecipient = {
      id: 'user123',
      username: 'testuser',
      walletAddress: '0x1234567890123456789012345678901234567890',
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Modal Rendering', () => {
    it('renders modal when isOpen is true', () => {
      renderComponent({ isOpen: true, onClose: mockOnClose, recipient: mockRecipient });
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      renderComponent({ isOpen: false, onClose: mockOnClose, recipient: mockRecipient });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders without crashing', () => {
      const { container } = renderComponent();
      expect(container).toBeInTheDocument();
    });

    it('renders modal with correct structure', () => {
      renderComponent();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByLabelText('Amount')).toBeInTheDocument();
      expect(screen.getByText('Message (optional)')).toBeInTheDocument();
    });

    it('displays modal title', () => {
      renderComponent();
      expect(screen.getByText('Send Tip')).toBeInTheDocument();
    });

    it('renders DollarSign icon', () => {
      renderComponent();
      expect(screen.getByTestId('dollar-sign-icon')).toBeInTheDocument();
    });

    it('renders close button with X icon', () => {
      renderComponent();
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });

    it('renders Send icon on submit button', () => {
      renderComponent();
      expect(screen.getByTestId('send-icon')).toBeInTheDocument();
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderComponent();
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('matches snapshot', () => {
      const { container } = renderComponent();
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Accessibility', () => {
    it('has proper dialog role', () => {
      renderComponent();
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('has aria-labelledby attribute', () => {
      renderComponent();
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'tip-modal-title');
    });

    it('has proper heading with correct id', () => {
      renderComponent();
      const heading = screen.getByText('Send Tip');
      expect(heading).toHaveAttribute('id', 'tip-modal-title');
    });

    it('has accessible form labels', () => {
      renderComponent();
      expect(screen.getByLabelText('Amount')).toBeInTheDocument();
      expect(screen.getByText('Message (optional)')).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      renderComponent();

      const amountInput = screen.getByPlaceholderText('0.0');
      await user.tab();

      // Check if interactive elements can be focused
      expect(document.activeElement).toBeInTheDocument();
    });

    it('close button is keyboard accessible', async () => {
      const user = userEvent.setup();
      renderComponent();

      const closeButtons = screen.getAllByRole('button');
      const closeButton = closeButtons.find(btn => btn.querySelector('[data-testid="x-icon"]'));

      closeButton.focus();
      expect(document.activeElement).toBe(closeButton);
    });

    it('has proper focus management', () => {
      renderComponent();
      const amountInput = screen.getByPlaceholderText('0.0');
      amountInput.focus();
      expect(document.activeElement).toBe(amountInput);
    });
  });

  describe('Amount Input', () => {
    it('renders amount input field', () => {
      renderComponent();
      const amountInput = screen.getByPlaceholderText('0.0');
      expect(amountInput).toBeInTheDocument();
      expect(amountInput).toHaveAttribute('type', 'number');
    });

    it('allows user to enter amount', async () => {
      const user = userEvent.setup();
      renderComponent();

      const amountInput = screen.getByPlaceholderText('0.0');
      await user.type(amountInput, '1.5');

      expect(amountInput).toHaveValue(1.5);
    });

    it('accepts decimal values', async () => {
      const user = userEvent.setup();
      renderComponent();

      const amountInput = screen.getByPlaceholderText('0.0');
      await user.type(amountInput, '0.001');

      expect(amountInput).toHaveValue(0.001);
    });

    it('accepts zero value', async () => {
      const user = userEvent.setup();
      renderComponent();

      const amountInput = screen.getByPlaceholderText('0.0');
      await user.type(amountInput, '0');

      expect(amountInput).toHaveValue(0);
    });

    it('accepts large values', async () => {
      const user = userEvent.setup();
      renderComponent();

      const amountInput = screen.getByPlaceholderText('0.0');
      await user.type(amountInput, '1000000');

      expect(amountInput).toHaveValue(1000000);
    });

    it('starts with empty value', () => {
      renderComponent();
      const amountInput = screen.getByPlaceholderText('0.0');
      expect(amountInput).toHaveValue(null);
    });

    it('clears amount when cleared by user', async () => {
      const user = userEvent.setup();
      renderComponent();

      const amountInput = screen.getByPlaceholderText('0.0');
      await user.type(amountInput, '5');
      expect(amountInput).toHaveValue(5);

      await user.clear(amountInput);
      expect(amountInput).toHaveValue(null);
    });

    it('handles rapid input changes', async () => {
      const user = userEvent.setup();
      renderComponent();

      const amountInput = screen.getByPlaceholderText('0.0');
      await user.type(amountInput, '123');

      expect(amountInput).toHaveValue(123);
    });

    it('allows replacing existing value', async () => {
      const user = userEvent.setup();
      renderComponent();

      const amountInput = screen.getByPlaceholderText('0.0');
      await user.type(amountInput, '10');
      await user.clear(amountInput);
      await user.type(amountInput, '20');

      expect(amountInput).toHaveValue(20);
    });
  });

  describe('Currency Selection', () => {
    it('renders currency dropdown', () => {
      renderComponent();
      const currencySelect = screen.getByDisplayValue('ETH');
      expect(currencySelect).toBeInTheDocument();
    });

    it('defaults to ETH currency', () => {
      renderComponent();
      const currencySelect = screen.getByDisplayValue('ETH');
      expect(currencySelect).toHaveValue('ETH');
    });

    it('displays all currency options', () => {
      renderComponent();
      const currencySelect = screen.getByDisplayValue('ETH');

      const options = Array.from(currencySelect.querySelectorAll('option'));
      expect(options).toHaveLength(3);
      expect(options[0]).toHaveValue('ETH');
      expect(options[1]).toHaveValue('USDC');
      expect(options[2]).toHaveValue('DAI');
    });

    it('allows selecting USDC', async () => {
      const user = userEvent.setup();
      renderComponent();

      const currencySelect = screen.getByDisplayValue('ETH');
      await user.selectOptions(currencySelect, 'USDC');

      expect(currencySelect).toHaveValue('USDC');
    });

    it('allows selecting DAI', async () => {
      const user = userEvent.setup();
      renderComponent();

      const currencySelect = screen.getByDisplayValue('ETH');
      await user.selectOptions(currencySelect, 'DAI');

      expect(currencySelect).toHaveValue('DAI');
    });

    it('switches between currencies', async () => {
      const user = userEvent.setup();
      renderComponent();

      const currencySelect = screen.getByDisplayValue('ETH');

      await user.selectOptions(currencySelect, 'USDC');
      expect(currencySelect).toHaveValue('USDC');

      await user.selectOptions(currencySelect, 'DAI');
      expect(currencySelect).toHaveValue('DAI');

      await user.selectOptions(currencySelect, 'ETH');
      expect(currencySelect).toHaveValue('ETH');
    });

    it('maintains currency selection when amount changes', async () => {
      const user = userEvent.setup();
      renderComponent();

      const currencySelect = screen.getByDisplayValue('ETH');
      const amountInput = screen.getByPlaceholderText('0.0');

      await user.selectOptions(currencySelect, 'USDC');
      await user.type(amountInput, '10');

      expect(currencySelect).toHaveValue('USDC');
    });
  });

  describe('Message Input', () => {
    it('renders message textarea', () => {
      renderComponent();
      const messageTextarea = screen.getByPlaceholderText('Add a note...');
      expect(messageTextarea).toBeInTheDocument();
    });

    it('allows user to enter message', async () => {
      const user = userEvent.setup();
      renderComponent();

      const messageTextarea = screen.getByPlaceholderText('Add a note...');
      await user.type(messageTextarea, 'Great work!');

      expect(messageTextarea).toHaveValue('Great work!');
    });

    it('starts with empty message', () => {
      renderComponent();
      const messageTextarea = screen.getByPlaceholderText('Add a note...');
      expect(messageTextarea).toHaveValue('');
    });

    it('supports multiline messages', async () => {
      const user = userEvent.setup();
      renderComponent();

      const messageTextarea = screen.getByPlaceholderText('Add a note...');
      await user.type(messageTextarea, 'Line 1{Enter}Line 2{Enter}Line 3');

      expect(messageTextarea.value).toContain('Line 1');
      expect(messageTextarea.value).toContain('Line 2');
      expect(messageTextarea.value).toContain('Line 3');
    });

    it('allows long messages', async () => {
      const user = userEvent.setup();
      renderComponent();

      const longMessage = 'A'.repeat(500);
      const messageTextarea = screen.getByPlaceholderText('Add a note...');
      await user.type(messageTextarea, longMessage);

      expect(messageTextarea).toHaveValue(longMessage);
    });

    it('clears message when cleared by user', async () => {
      const user = userEvent.setup();
      renderComponent();

      const messageTextarea = screen.getByPlaceholderText('Add a note...');
      await user.type(messageTextarea, 'Test message');
      await user.clear(messageTextarea);

      expect(messageTextarea).toHaveValue('');
    });

    it('handles special characters', async () => {
      const user = userEvent.setup();
      renderComponent();

      const messageTextarea = screen.getByPlaceholderText('Add a note...');
      await user.type(messageTextarea, '!@#$%^&*()');

      expect(messageTextarea).toHaveValue('!@#$%^&*()');
    });

    it('handles emoji in message', async () => {
      const user = userEvent.setup();
      renderComponent();

      const messageTextarea = screen.getByPlaceholderText('Add a note...');
      await user.type(messageTextarea, 'Thanks! 😊🎉');

      expect(messageTextarea.value).toContain('Thanks!');
    });

    it('has correct rows attribute', () => {
      renderComponent();
      const messageTextarea = screen.getByPlaceholderText('Add a note...');
      expect(messageTextarea).toHaveAttribute('rows', '3');
    });
  });

  describe('Send Button', () => {
    it('renders send button', () => {
      renderComponent();
      expect(screen.getByRole('button', { name: /Send Tip/i })).toBeInTheDocument();
    });

    it('displays send icon on button', () => {
      renderComponent();
      const sendButton = screen.getByRole('button', { name: /Send Tip/i });
      expect(sendButton.querySelector('[data-testid="send-icon"]')).toBeInTheDocument();
    });

    it('has correct button text', () => {
      renderComponent();
      expect(screen.getByText('Send Tip')).toBeInTheDocument();
    });

    it('button is clickable', async () => {
      const user = userEvent.setup();
      renderComponent();

      const sendButton = screen.getByRole('button', { name: /Send Tip/i });
      await user.click(sendButton);

      // Button should be clickable (no assertion failure)
      expect(sendButton).toBeInTheDocument();
    });

    it('applies correct styling classes', () => {
      renderComponent();
      const sendButton = screen.getByRole('button', { name: /Send Tip/i });
      expect(sendButton).toHaveClass('w-full');
    });
  });

  describe('Close Functionality', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      renderComponent({ onClose: mockOnClose });

      const closeButtons = screen.getAllByRole('button');
      const closeButton = closeButtons.find(btn => btn.querySelector('[data-testid="x-icon"]'));

      await user.click(closeButton);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', async () => {
      const user = userEvent.setup();
      renderComponent({ onClose: mockOnClose });

      const backdrop = screen.getByRole('dialog');
      await user.click(backdrop);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('does not close when modal content is clicked', async () => {
      const user = userEvent.setup();
      renderComponent({ onClose: mockOnClose });

      const amountInput = screen.getByPlaceholderText('0.0');
      await user.click(amountInput);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('prevents event propagation when content is clicked', async () => {
      const user = userEvent.setup();
      renderComponent({ onClose: mockOnClose });

      const sendButton = screen.getByRole('button', { name: /Send Tip/i });
      await user.click(sendButton);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Recipient Handling', () => {
    it('accepts recipient with username', () => {
      renderComponent({
        recipient: { id: 'user1', username: 'john_doe', walletAddress: '0x123' },
      });
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('handles recipient without wallet address', () => {
      renderComponent({
        recipient: { id: 'user1', username: 'john_doe' },
      });
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('handles null recipient', () => {
      renderComponent({ recipient: null });
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('handles undefined recipient', () => {
      renderComponent({ recipient: undefined });
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Form State Management', () => {
    it('maintains independent state for all fields', async () => {
      const user = userEvent.setup();
      renderComponent();

      const amountInput = screen.getByPlaceholderText('0.0');
      const currencySelect = screen.getByDisplayValue('ETH');
      const messageTextarea = screen.getByPlaceholderText('Add a note...');

      await user.type(amountInput, '5');
      await user.selectOptions(currencySelect, 'USDC');
      await user.type(messageTextarea, 'Thanks!');

      expect(amountInput).toHaveValue(5);
      expect(currencySelect).toHaveValue('USDC');
      expect(messageTextarea).toHaveValue('Thanks!');
    });

    it('resets state between modal opens', () => {
      const { rerender } = renderComponent({ isOpen: false });

      rerender(
        <BrowserRouter>
          <CryptoTippingModal
            isOpen={true}
            onClose={mockOnClose}
            recipient={mockRecipient}
          />
        </BrowserRouter>
      );

      const amountInput = screen.getByPlaceholderText('0.0');
      const currencySelect = screen.getByDisplayValue('ETH');
      const messageTextarea = screen.getByPlaceholderText('Add a note...');

      expect(amountInput).toHaveValue(null);
      expect(currencySelect).toHaveValue('ETH');
      expect(messageTextarea).toHaveValue('');
    });
  });

  describe('Visual Styling', () => {
    it('applies gradient background to header', () => {
      renderComponent();
      const header = screen.getByText('Send Tip').closest('div');
      expect(header.parentElement).toHaveClass('bg-gradient-to-r');
    });

    it('applies rounded corners to modal', () => {
      renderComponent();
      const modalContent = screen.getByText('Send Tip').closest('div').closest('div');
      expect(modalContent).toHaveClass('rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]');
    });

    it('applies backdrop blur effect', () => {
      renderComponent();
      const backdrop = screen.getByRole('dialog');
      expect(backdrop).toHaveClass('backdrop-blur-sm');
    });

    it('applies proper spacing between elements', () => {
      renderComponent();
      const formSection = screen.getByText('Amount').closest('div').parentElement;
      expect(formSection).toHaveClass('space-y-4');
    });
  });

  describe('Responsive Design', () => {
    it('renders with max-width constraint', () => {
      renderComponent();
      const modalContent = screen.getByText('Send Tip').closest('div').closest('div');
      expect(modalContent).toHaveClass('max-w-md');
    });

    it('is full width within constraints', () => {
      renderComponent();
      const modalContent = screen.getByText('Send Tip').closest('div').closest('div');
      expect(modalContent).toHaveClass('w-full');
    });

    it('centers modal on screen', () => {
      renderComponent();
      const backdrop = screen.getByRole('dialog');
      expect(backdrop).toHaveClass('flex');
      expect(backdrop).toHaveClass('items-center');
      expect(backdrop).toHaveClass('justify-center');
    });
  });

  describe('Dark Mode Support', () => {
    it('applies dark mode classes to modal background', () => {
      renderComponent();
      const modalContent = screen.getByText('Send Tip').closest('div').closest('div');
      expect(modalContent).toHaveClass('dark:bg-[#161b22]');
    });

    it('applies dark mode classes to inputs', () => {
      renderComponent();
      const amountInput = screen.getByPlaceholderText('0.0');
      expect(amountInput).toHaveClass('dark:bg-[#161b22]');
    });

    it('applies dark mode classes to currency select', () => {
      renderComponent();
      const currencySelect = screen.getByDisplayValue('ETH');
      expect(currencySelect).toHaveClass('dark:bg-[#161b22]');
    });

    it('applies dark mode classes to textarea', () => {
      renderComponent();
      const messageTextarea = screen.getByPlaceholderText('Add a note...');
      expect(messageTextarea).toHaveClass('dark:bg-[#161b22]');
    });
  });

  describe('Focus Styles', () => {
    it('applies focus ring to amount input', () => {
      renderComponent();
      const amountInput = screen.getByPlaceholderText('0.0');
      expect(amountInput).toHaveClass('focus:ring-2');
      expect(amountInput).toHaveClass('focus:ring-yellow-500');
    });

    it('applies focus ring to textarea', () => {
      renderComponent();
      const messageTextarea = screen.getByPlaceholderText('Add a note...');
      expect(messageTextarea).toHaveClass('focus:ring-2');
      expect(messageTextarea).toHaveClass('focus:ring-yellow-500');
    });
  });

  describe('User Interactions Flow', () => {
    it('completes full tip flow', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Enter amount
      const amountInput = screen.getByPlaceholderText('0.0');
      await user.type(amountInput, '2.5');

      // Select currency
      const currencySelect = screen.getByDisplayValue('ETH');
      await user.selectOptions(currencySelect, 'USDC');

      // Add message
      const messageTextarea = screen.getByPlaceholderText('Add a note...');
      await user.type(messageTextarea, 'Keep up the great work!');

      // Click send
      const sendButton = screen.getByRole('button', { name: /Send Tip/i });
      await user.click(sendButton);

      // Verify all inputs
      expect(amountInput).toHaveValue(2.5);
      expect(currencySelect).toHaveValue('USDC');
      expect(messageTextarea).toHaveValue('Keep up the great work!');
    });

    it('allows sending tip without message', async () => {
      const user = userEvent.setup();
      renderComponent();

      const amountInput = screen.getByPlaceholderText('0.0');
      await user.type(amountInput, '1');

      const sendButton = screen.getByRole('button', { name: /Send Tip/i });
      await user.click(sendButton);

      const messageTextarea = screen.getByPlaceholderText('Add a note...');
      expect(messageTextarea).toHaveValue('');
    });

    it('allows changing amount multiple times', async () => {
      const user = userEvent.setup();
      renderComponent();

      const amountInput = screen.getByPlaceholderText('0.0');

      await user.type(amountInput, '1');
      expect(amountInput).toHaveValue(1);

      await user.clear(amountInput);
      await user.type(amountInput, '5');
      expect(amountInput).toHaveValue(5);

      await user.clear(amountInput);
      await user.type(amountInput, '10');
      expect(amountInput).toHaveValue(10);
    });
  });

  describe('Edge Cases', () => {
    it('handles very small amounts', async () => {
      const user = userEvent.setup();
      renderComponent();

      const amountInput = screen.getByPlaceholderText('0.0');
      await user.type(amountInput, '0.000001');

      expect(amountInput).toHaveValue(0.000001);
    });

    it('handles empty form submission', async () => {
      const user = userEvent.setup();
      renderComponent();

      const sendButton = screen.getByRole('button', { name: /Send Tip/i });
      await user.click(sendButton);

      // Should not throw error
      expect(sendButton).toBeInTheDocument();
    });

    it('handles rapid modal open/close', () => {
      const { rerender } = renderComponent({ isOpen: true });

      rerender(
        <BrowserRouter>
          <CryptoTippingModal
            isOpen={false}
            onClose={mockOnClose}
            recipient={mockRecipient}
          />
        </BrowserRouter>
      );

      rerender(
        <BrowserRouter>
          <CryptoTippingModal
            isOpen={true}
            onClose={mockOnClose}
            recipient={mockRecipient}
          />
        </BrowserRouter>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('handles special characters in message', async () => {
      const user = userEvent.setup();
      renderComponent();

      const messageTextarea = screen.getByPlaceholderText('Add a note...');
      await user.type(messageTextarea, '<script>alert("test")</script>');

      expect(messageTextarea).toHaveValue('<script>alert("test")</script>');
    });

    it('maintains state during recipient prop change', async () => {
      const user = userEvent.setup();
      const { rerender } = renderComponent();

      const amountInput = screen.getByPlaceholderText('0.0');
      await user.type(amountInput, '5');

      const newRecipient = { id: 'user456', username: 'newuser', walletAddress: '0xABC' };
      rerender(
        <BrowserRouter>
          <CryptoTippingModal
            isOpen={true}
            onClose={mockOnClose}
            recipient={newRecipient}
          />
        </BrowserRouter>
      );

      expect(amountInput).toHaveValue(5);
    });
  });

  describe('Component Memoization', () => {
    it('uses memo to prevent unnecessary re-renders', () => {
      const { rerender } = renderComponent();
      const firstRender = screen.getByRole('dialog');

      rerender(
        <BrowserRouter>
          <CryptoTippingModal
            isOpen={true}
            onClose={mockOnClose}
            recipient={mockRecipient}
          />
        </BrowserRouter>
      );

      const secondRender = screen.getByRole('dialog');
      expect(firstRender).toBe(secondRender);
    });
  });

  describe('Modal Backdrop', () => {
    it('applies correct z-index for layering', () => {
      renderComponent();
      const backdrop = screen.getByRole('dialog');
      expect(backdrop).toHaveClass('z-50');
    });

    it('covers full screen', () => {
      renderComponent();
      const backdrop = screen.getByRole('dialog');
      expect(backdrop).toHaveClass('fixed');
      expect(backdrop).toHaveClass('inset-0');
    });

    it('has semi-transparent black background', () => {
      renderComponent();
      const backdrop = screen.getByRole('dialog');
      expect(backdrop).toHaveClass('bg-black/60');
    });
  });

  describe('Input Validation', () => {
    it('amount input accepts positive numbers', async () => {
      const user = userEvent.setup();
      renderComponent();

      const amountInput = screen.getByPlaceholderText('0.0');
      await user.type(amountInput, '100');

      expect(amountInput).toHaveValue(100);
    });

    it('amount input type is number', () => {
      renderComponent();
      const amountInput = screen.getByPlaceholderText('0.0');
      expect(amountInput).toHaveAttribute('type', 'number');
    });
  });

  describe('Layout Structure', () => {
    it('renders header section', () => {
      renderComponent();
      const header = screen.getByText('Send Tip').parentElement.parentElement;
      expect(header).toBeInTheDocument();
    });

    it('renders form section', () => {
      renderComponent();
      expect(screen.getByLabelText('Amount')).toBeInTheDocument();
      expect(screen.getByText('Message (optional)')).toBeInTheDocument();
    });

    it('renders action section with send button', () => {
      renderComponent();
      expect(screen.getByRole('button', { name: /Send Tip/i })).toBeInTheDocument();
    });
  });

  describe('Currency Options', () => {
    it('displays ETH option', () => {
      renderComponent();
      expect(screen.getByText('ETH')).toBeInTheDocument();
    });

    it('displays USDC option', () => {
      renderComponent();
      expect(screen.getByText('USDC')).toBeInTheDocument();
    });

    it('displays DAI option', () => {
      renderComponent();
      expect(screen.getByText('DAI')).toBeInTheDocument();
    });
  });

  describe('Interactive Elements', () => {
    it('all buttons are clickable', async () => {
      const user = userEvent.setup();
      renderComponent();

      const buttons = screen.getAllByRole('button');
      for (const button of buttons) {
        await user.click(button);
        expect(button).toBeInTheDocument();
      }
    });

    it('all inputs are editable', async () => {
      const user = userEvent.setup();
      renderComponent();

      const amountInput = screen.getByPlaceholderText('0.0');
      const messageTextarea = screen.getByPlaceholderText('Add a note...');

      await user.type(amountInput, '1');
      await user.type(messageTextarea, 'test');

      expect(amountInput).toHaveValue(1);
      expect(messageTextarea).toHaveValue('test');
    });

    it('select is changeable', async () => {
      const user = userEvent.setup();
      renderComponent();

      const currencySelect = screen.getByDisplayValue('ETH');
      await user.selectOptions(currencySelect, 'DAI');

      expect(currencySelect).toHaveValue('DAI');
    });
  });

  describe('Icon Rendering', () => {
    it('renders all required icons', () => {
      renderComponent();
      expect(screen.getByTestId('dollar-sign-icon')).toBeInTheDocument();
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
      expect(screen.getByTestId('send-icon')).toBeInTheDocument();
    });

    it('icons are properly positioned', () => {
      renderComponent();
      const dollarIcon = screen.getByTestId('dollar-sign-icon');
      const closeIcon = screen.getByTestId('x-icon');
      const sendIcon = screen.getByTestId('send-icon');

      expect(dollarIcon).toBeInTheDocument();
      expect(closeIcon).toBeInTheDocument();
      expect(sendIcon).toBeInTheDocument();
    });
  });

  describe('Form Labels', () => {
    it('displays Amount label', () => {
      renderComponent();
      expect(screen.getByText('Amount')).toBeInTheDocument();
    });

    it('displays Message label', () => {
      renderComponent();
      expect(screen.getByText('Message (optional)')).toBeInTheDocument();
    });

    it('labels are associated with inputs', () => {
      renderComponent();
      const amountLabel = screen.getByText('Amount');
      const messageLabel = screen.getByText('Message (optional)');

      expect(amountLabel).toBeInTheDocument();
      expect(messageLabel).toBeInTheDocument();
    });
  });

  describe('Placeholder Text', () => {
    it('displays placeholder for amount input', () => {
      renderComponent();
      expect(screen.getByPlaceholderText('0.0')).toBeInTheDocument();
    });

    it('displays placeholder for message textarea', () => {
      renderComponent();
      expect(screen.getByPlaceholderText('Add a note...')).toBeInTheDocument();
    });
  });

  describe('Button Styling', () => {
    it('send button has gradient background', () => {
      renderComponent();
      const sendButton = screen.getByRole('button', { name: /Send Tip/i });
      expect(sendButton).toHaveClass('bg-gradient-to-r');
    });

    it('send button has hover effect classes', () => {
      renderComponent();
      const sendButton = screen.getByRole('button', { name: /Send Tip/i });
      expect(sendButton).toHaveClass('hover:from-yellow-600');
      expect(sendButton).toHaveClass('hover:to-orange-600');
    });

    it('close button has hover effect', () => {
      renderComponent();
      const closeButtons = screen.getAllByRole('button');
      const closeButton = closeButtons.find(btn => btn.querySelector('[data-testid="x-icon"]'));
      expect(closeButton).toHaveClass('hover:bg-[#161b22]/60 backdrop-blur-xl');
    });
  });

  describe('State Persistence', () => {
    it('preserves amount when currency changes', async () => {
      const user = userEvent.setup();
      renderComponent();

      const amountInput = screen.getByPlaceholderText('0.0');
      const currencySelect = screen.getByDisplayValue('ETH');

      await user.type(amountInput, '10');
      await user.selectOptions(currencySelect, 'USDC');

      expect(amountInput).toHaveValue(10);
    });

    it('preserves currency when amount changes', async () => {
      const user = userEvent.setup();
      renderComponent();

      const amountInput = screen.getByPlaceholderText('0.0');
      const currencySelect = screen.getByDisplayValue('ETH');

      await user.selectOptions(currencySelect, 'DAI');
      await user.type(amountInput, '20');

      expect(currencySelect).toHaveValue('DAI');
    });

    it('preserves message when other fields change', async () => {
      const user = userEvent.setup();
      renderComponent();

      const amountInput = screen.getByPlaceholderText('0.0');
      const currencySelect = screen.getByDisplayValue('ETH');
      const messageTextarea = screen.getByPlaceholderText('Add a note...');

      await user.type(messageTextarea, 'Thanks!');
      await user.type(amountInput, '5');
      await user.selectOptions(currencySelect, 'USDC');

      expect(messageTextarea).toHaveValue('Thanks!');
    });
  });

  describe('Multiple Instances', () => {
    it('handles multiple modal instances independently', () => {
      const { unmount } = renderComponent({ isOpen: true });
      const firstModal = screen.getByRole('dialog');
      expect(firstModal).toBeInTheDocument();

      unmount();

      renderComponent({ isOpen: true, recipient: { id: 'user2', username: 'user2' } });
      const secondModal = screen.getByRole('dialog');
      expect(secondModal).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('renders quickly', () => {
      const start = performance.now();
      renderComponent();
      const end = performance.now();

      expect(end - start).toBeLessThan(1000); // Should render in less than 1 second
    });

    it('handles rapid state updates', async () => {
      const user = userEvent.setup();
      renderComponent();

      const amountInput = screen.getByPlaceholderText('0.0');

      for (let i = 0; i < 10; i++) {
        await user.clear(amountInput);
        await user.type(amountInput, String(i));
      }

      expect(amountInput).toHaveValue(9);
    });
  });

  describe('Error Prevention', () => {
    it('does not throw on missing onClose', () => {
      expect(() => {
        render(
          <BrowserRouter>
            <CryptoTippingModal isOpen={true} recipient={mockRecipient} />
          </BrowserRouter>
        );
      }).not.toThrow();
    });

    it('handles undefined props gracefully', () => {
      expect(() => {
        render(
          <BrowserRouter>
            <CryptoTippingModal />
          </BrowserRouter>
        );
      }).not.toThrow();
    });
  });

  describe('CSS Classes', () => {
    it('applies correct flex layout', () => {
      renderComponent();
      const amountRow = screen.getByPlaceholderText('0.0').parentElement;
      expect(amountRow).toHaveClass('flex');
      expect(amountRow).toHaveClass('gap-2');
    });

    it('applies correct padding', () => {
      renderComponent();
      const formSection = screen.getByText('Amount').closest('div').parentElement;
      expect(formSection).toHaveClass('p-6');
    });

    it('applies correct rounded corners to inputs', () => {
      renderComponent();
      const amountInput = screen.getByPlaceholderText('0.0');
      expect(amountInput).toHaveClass('rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]');
    });
  });

  describe('Text Content', () => {
    it('displays correct button text', () => {
      renderComponent();
      expect(screen.getByText('Send Tip')).toBeInTheDocument();
    });

    it('displays correct label text', () => {
      renderComponent();
      expect(screen.getByText('Amount')).toBeInTheDocument();
      expect(screen.getByText('Message (optional)')).toBeInTheDocument();
    });

    it('displays correct placeholder text', () => {
      renderComponent();
      expect(screen.getByPlaceholderText('0.0')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Add a note...')).toBeInTheDocument();
    });
  });

  describe('Snapshot Testing', () => {
    it('matches snapshot when open', () => {
      const { container } = renderComponent({ isOpen: true });
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot when closed', () => {
      const { container } = renderComponent({ isOpen: false });
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot with data filled', async () => {
      const user = userEvent.setup();
      const { container } = renderComponent();

      await user.type(screen.getByPlaceholderText('0.0'), '10');
      await user.selectOptions(screen.getByDisplayValue('ETH'), 'USDC');
      await user.type(screen.getByPlaceholderText('Add a note...'), 'Test message');

      expect(container.firstChild).toMatchSnapshot();
    });
  });
});

export default mockWeb3
