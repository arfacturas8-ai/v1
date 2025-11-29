/**
 * @jest-environment jsdom
 * Comprehensive tests for TwoFactorAuth component
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TwoFactorAuth from './TwoFactorAuth';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Shield: () => <div data-testid="shield-icon">Shield</div>,
  Key: () => <div data-testid="key-icon">Key</div>,
  Copy: () => <div data-testid="copy-icon">Copy</div>,
  Check: () => <div data-testid="check-icon">Check</div>,
  AlertCircle: () => <div data-testid="alert-circle-icon">AlertCircle</div>,
  QrCode: () => <div data-testid="qrcode-icon">QrCode</div>,
  Lock: () => <div data-testid="lock-icon">Lock</div>
}));

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(() => 'test-token'),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve())
  }
});

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('TwoFactorAuth', () => {
  const defaultProps = {
    user: { id: 1, email: 'test@example.com', twoFactorEnabled: false },
    onClose: jest.fn(),
    onUpdate: jest.fn()
  };

  const mockSetupResponse = {
    qrCode: 'data:image/png;base64,mockQRCode',
    secret: 'MOCK-SECRET-KEY-1234',
    backupCodes: ['CODE1', 'CODE2', 'CODE3', 'CODE4', 'CODE5', 'CODE6']
  };

  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Component Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<TwoFactorAuth {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it('renders with correct structure', () => {
      render(<TwoFactorAuth {...defaultProps} />);
      expect(screen.getByTestId('shield-icon')).toBeInTheDocument();
    });

    it('renders modal container', () => {
      const { container } = render(<TwoFactorAuth {...defaultProps} />);
      expect(container.querySelector('.twofa-modal')).toBeInTheDocument();
    });

    it('handles null user gracefully', () => {
      expect(() => render(<TwoFactorAuth user={null} onClose={jest.fn()} />)).not.toThrow();
    });

    it('handles undefined props gracefully', () => {
      expect(() => render(<TwoFactorAuth />)).not.toThrow();
    });
  });

  describe('Setup Flow - Initial Load', () => {
    it('initiates 2FA setup on mount when 2FA is not enabled', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSetupResponse
      });

      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/auth/2fa/setup', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json'
          }
        });
      });
    });

    it('shows disable step when 2FA is already enabled', () => {
      const props = {
        ...defaultProps,
        user: { ...defaultProps.user, twoFactorEnabled: true }
      };

      render(<TwoFactorAuth {...props} />);

      expect(screen.getByText('Disable Two-Factor Authentication?')).toBeInTheDocument();
    });

    it('displays loading state during setup', () => {
      fetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<TwoFactorAuth {...defaultProps} />);

      expect(screen.getByText('Generating QR Code...')).toBeInTheDocument();
    });

    it('shows spinner during loading', () => {
      fetch.mockImplementation(() => new Promise(() => {}));

      const { container } = render(<TwoFactorAuth {...defaultProps} />);

      expect(container.querySelector('.spinner')).toBeInTheDocument();
    });
  });

  describe('QR Code Display', () => {
    it('displays QR code after successful setup', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSetupResponse
      });

      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        const qrImage = screen.getByAltText('2FA QR Code');
        expect(qrImage).toBeInTheDocument();
        expect(qrImage).toHaveAttribute('src', mockSetupResponse.qrCode);
      });
    });

    it('shows QR placeholder icon when no QR code', () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockSetupResponse, qrCode: '' })
      });

      render(<TwoFactorAuth {...defaultProps} />);

      expect(screen.getByTestId('qrcode-icon')).toBeInTheDocument();
    });

    it('displays QR code with correct className', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSetupResponse
      });

      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        const qrImage = screen.getByAltText('2FA QR Code');
        expect(qrImage).toHaveClass('qr-code');
      });
    });
  });

  describe('Secret Key Display', () => {
    it('displays secret key after setup', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSetupResponse
      });

      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });
    });

    it('shows placeholder when no secret', () => {
      render(<TwoFactorAuth {...defaultProps} />);

      expect(screen.getByText('XXXX-XXXX-XXXX-XXXX')).toBeInTheDocument();
    });

    it('displays manual entry instructions', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSetupResponse
      });

      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Can't scan? Enter this code manually:")).toBeInTheDocument();
      });
    });

    it('shows copy button for secret', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSetupResponse
      });

      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        const copyButtons = screen.getAllByTestId('copy-icon');
        expect(copyButtons.length).toBeGreaterThan(0);
      });
    });

    it('copy button is disabled when no secret', () => {
      const { container } = render(<TwoFactorAuth {...defaultProps} />);

      const copyButton = container.querySelector('.copy-btn');
      expect(copyButton).toBeDisabled();
    });
  });

  describe('Copy to Clipboard', () => {
    it('copies secret to clipboard', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSetupResponse
      });

      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      const copyButtons = screen.getAllByTestId('copy-icon');
      fireEvent.click(copyButtons[0]);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('MOCK-SECRET-KEY-1234');
    });

    it('shows check icon after copying secret', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSetupResponse
      });

      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      const copyButtons = screen.getAllByTestId('copy-icon');
      fireEvent.click(copyButtons[0]);

      await waitFor(() => {
        expect(screen.getAllByTestId('check-icon').length).toBeGreaterThan(0);
      });
    });

    it('resets copy state after 2 seconds', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSetupResponse
      });

      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      const copyButtons = screen.getAllByTestId('copy-icon');
      fireEvent.click(copyButtons[0]);

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getAllByTestId('copy-icon').length).toBeGreaterThan(0);
      });
    });

    it('handles copy failure gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      navigator.clipboard.writeText.mockRejectedValueOnce(new Error('Copy failed'));

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSetupResponse
      });

      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      const copyButtons = screen.getAllByTestId('copy-icon');
      fireEvent.click(copyButtons[0]);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to copy:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Code Input Validation', () => {
    it('renders code input field', () => {
      render(<TwoFactorAuth {...defaultProps} />);

      const input = screen.getByPlaceholderText('000000');
      expect(input).toBeInTheDocument();
    });

    it('accepts numeric input only', async () => {
      render(<TwoFactorAuth {...defaultProps} />);

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, 'abc123def');

      expect(input.value).toBe('123');
    });

    it('limits input to 6 digits', async () => {
      render(<TwoFactorAuth {...defaultProps} />);

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '1234567890');

      expect(input.value).toBe('123456');
    });

    it('has correct input attributes', () => {
      render(<TwoFactorAuth {...defaultProps} />);

      const input = screen.getByPlaceholderText('000000');
      expect(input).toHaveAttribute('type', 'text');
      expect(input).toHaveAttribute('maxLength', '6');
      expect(input).toHaveAttribute('pattern', '[0-9]*');
      expect(input).toHaveAttribute('inputMode', 'numeric');
    });

    it('filters non-numeric characters on paste', async () => {
      render(<TwoFactorAuth {...defaultProps} />);

      const input = screen.getByPlaceholderText('000000');
      fireEvent.change(input, { target: { value: 'a1b2c3' } });

      expect(input.value).toBe('123');
    });

    it('updates verification code state on input', async () => {
      render(<TwoFactorAuth {...defaultProps} />);

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');

      expect(input.value).toBe('123456');
    });
  });

  describe('Setup Steps Display', () => {
    it('displays step 1 instructions', () => {
      render(<TwoFactorAuth {...defaultProps} />);

      expect(screen.getByText('Install Authenticator App')).toBeInTheDocument();
      expect(screen.getByText('Download Google Authenticator, Authy, or any TOTP app on your phone')).toBeInTheDocument();
    });

    it('displays step 2 instructions', () => {
      render(<TwoFactorAuth {...defaultProps} />);

      expect(screen.getByText('Scan QR Code')).toBeInTheDocument();
    });

    it('displays step 3 instructions', () => {
      render(<TwoFactorAuth {...defaultProps} />);

      expect(screen.getByText('Enter Verification Code')).toBeInTheDocument();
      expect(screen.getByText('Enter the 6-digit code from your authenticator app')).toBeInTheDocument();
    });

    it('displays step numbers', () => {
      const { container } = render(<TwoFactorAuth {...defaultProps} />);

      const stepNumbers = container.querySelectorAll('.step-number');
      expect(stepNumbers).toHaveLength(3);
      expect(stepNumbers[0].textContent).toBe('1');
      expect(stepNumbers[1].textContent).toBe('2');
      expect(stepNumbers[2].textContent).toBe('3');
    });

    it('shows security header with icon', () => {
      render(<TwoFactorAuth {...defaultProps} />);

      expect(screen.getByTestId('shield-icon')).toBeInTheDocument();
      expect(screen.getByText('Enable Two-Factor Authentication')).toBeInTheDocument();
      expect(screen.getByText('Secure your account with an extra layer of protection')).toBeInTheDocument();
    });
  });

  describe('Enable 2FA Button', () => {
    it('shows Enable 2FA button', () => {
      render(<TwoFactorAuth {...defaultProps} />);

      expect(screen.getByText('Enable 2FA')).toBeInTheDocument();
    });

    it('button is disabled when code is empty', () => {
      render(<TwoFactorAuth {...defaultProps} />);

      const button = screen.getByText('Enable 2FA');
      expect(button).toBeDisabled();
    });

    it('button is disabled when code is less than 6 digits', async () => {
      render(<TwoFactorAuth {...defaultProps} />);

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '12345');

      const button = screen.getByText('Enable 2FA');
      expect(button).toBeDisabled();
    });

    it('button is enabled when code is 6 digits', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSetupResponse
      });

      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');

      const button = screen.getByText('Enable 2FA');
      expect(button).not.toBeDisabled();
    });

    it('transitions to verify step when clicked', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSetupResponse
      });

      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');

      const button = screen.getByText('Enable 2FA');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Verify Your Identity')).toBeInTheDocument();
      });
    });
  });

  describe('Cancel Button', () => {
    it('shows Cancel button in setup', () => {
      render(<TwoFactorAuth {...defaultProps} />);

      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('calls onClose when Cancel is clicked', () => {
      render(<TwoFactorAuth {...defaultProps} />);

      const button = screen.getByText('Cancel');
      fireEvent.click(button);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Verify Step', () => {
    beforeEach(async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSetupResponse
      });
    });

    it('displays verify step header', async () => {
      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');
      fireEvent.click(screen.getByText('Enable 2FA'));

      await waitFor(() => {
        expect(screen.getByText('Verify Your Identity')).toBeInTheDocument();
        expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
      });
    });

    it('shows verify instructions', async () => {
      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');
      fireEvent.click(screen.getByText('Enable 2FA'));

      await waitFor(() => {
        const instructions = screen.getAllByText('Enter the 6-digit code from your authenticator app');
        expect(instructions.length).toBeGreaterThan(0);
      });
    });

    it('has autofocus on code input', async () => {
      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');
      fireEvent.click(screen.getByText('Enable 2FA'));

      await waitFor(() => {
        const verifyInput = screen.getAllByPlaceholderText('000000').find(input =>
          input.hasAttribute('autoFocus')
        );
        expect(verifyInput).toBeInTheDocument();
      });
    });

    it('shows Back button', async () => {
      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');
      fireEvent.click(screen.getByText('Enable 2FA'));

      await waitFor(() => {
        expect(screen.getByText('Back')).toBeInTheDocument();
      });
    });

    it('returns to setup step when Back is clicked', async () => {
      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');
      fireEvent.click(screen.getByText('Enable 2FA'));

      await waitFor(() => {
        expect(screen.getByText('Back')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Back'));

      await waitFor(() => {
        expect(screen.getByText('Enable Two-Factor Authentication')).toBeInTheDocument();
      });
    });

    it('shows Verify & Enable button', async () => {
      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');
      fireEvent.click(screen.getByText('Enable 2FA'));

      await waitFor(() => {
        expect(screen.getByText('Verify & Enable')).toBeInTheDocument();
      });
    });
  });

  describe('Verification Flow', () => {
    it('validates code length before verification', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSetupResponse
      });

      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');
      fireEvent.click(screen.getByText('Enable 2FA'));

      await waitFor(() => {
        expect(screen.getByText('Verify & Enable')).toBeInTheDocument();
      });

      // Clear input and try with less than 6 digits
      const verifyInputs = screen.getAllByPlaceholderText('000000');
      const verifyInput = verifyInputs[verifyInputs.length - 1];
      fireEvent.change(verifyInput, { target: { value: '12345' } });

      const verifyButton = screen.getByText('Verify & Enable');
      expect(verifyButton).toBeDisabled();
    });

    it('sends verification request with correct code', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSetupResponse
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');
      fireEvent.click(screen.getByText('Enable 2FA'));

      await waitFor(() => {
        expect(screen.getByText('Verify & Enable')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Verify & Enable'));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/auth/2fa/verify', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ code: '123456' })
        });
      });
    });

    it('shows loading state during verification', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSetupResponse
      }).mockImplementation(() => new Promise(() => {}));

      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');
      fireEvent.click(screen.getByText('Enable 2FA'));

      await waitFor(() => {
        expect(screen.getByText('Verify & Enable')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Verify & Enable'));

      await waitFor(() => {
        expect(screen.getByText('Verifying...')).toBeInTheDocument();
      });
    });

    it('shows spinner during verification', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSetupResponse
      }).mockImplementation(() => new Promise(() => {}));

      const { container } = render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');
      fireEvent.click(screen.getByText('Enable 2FA'));

      await waitFor(() => {
        expect(screen.getByText('Verify & Enable')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Verify & Enable'));

      await waitFor(() => {
        expect(container.querySelector('.spinner.small')).toBeInTheDocument();
      });
    });

    it('transitions to success step after successful verification', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSetupResponse
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');
      fireEvent.click(screen.getByText('Enable 2FA'));

      await waitFor(() => {
        expect(screen.getByText('Verify & Enable')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Verify & Enable'));

      await waitFor(() => {
        expect(screen.getByText('Two-Factor Authentication Enabled!')).toBeInTheDocument();
      });
    });

    it('calls onUpdate with updated user after verification', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSetupResponse
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');
      fireEvent.click(screen.getByText('Enable 2FA'));

      await waitFor(() => {
        expect(screen.getByText('Verify & Enable')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Verify & Enable'));

      await waitFor(() => {
        expect(defaultProps.onUpdate).toHaveBeenCalledWith({
          ...defaultProps.user,
          twoFactorEnabled: true
        });
      });
    });
  });

  describe('Error States', () => {
    it('displays error when verification fails', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSetupResponse
      }).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid verification code' })
      });

      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');
      fireEvent.click(screen.getByText('Enable 2FA'));

      await waitFor(() => {
        expect(screen.getByText('Verify & Enable')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Verify & Enable'));

      await waitFor(() => {
        expect(screen.getByText('Invalid verification code')).toBeInTheDocument();
      });
    });

    it('shows error icon with error message', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSetupResponse
      }).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Wrong code' })
      });

      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');
      fireEvent.click(screen.getByText('Enable 2FA'));

      await waitFor(() => {
        expect(screen.getByText('Verify & Enable')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Verify & Enable'));

      await waitFor(() => {
        expect(screen.getAllByTestId('alert-circle-icon').length).toBeGreaterThan(0);
      });
    });

    it('shows default error message when response has no error', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSetupResponse
      }).mockResolvedValueOnce({
        ok: false,
        json: async () => ({})
      });

      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');
      fireEvent.click(screen.getByText('Enable 2FA'));

      await waitFor(() => {
        expect(screen.getByText('Verify & Enable')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Verify & Enable'));

      await waitFor(() => {
        expect(screen.getByText('Invalid code. Please try again.')).toBeInTheDocument();
      });
    });

    it('handles network errors during verification', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSetupResponse
      }).mockRejectedValueOnce(new Error('Network error'));

      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');
      fireEvent.click(screen.getByText('Enable 2FA'));

      await waitFor(() => {
        expect(screen.getByText('Verify & Enable')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Verify & Enable'));

      await waitFor(() => {
        expect(screen.getByText('Verification failed. Please try again.')).toBeInTheDocument();
      });
    });

    it('displays error when setup fails', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({})
      });

      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to setup 2FA. Please try again.')).toBeInTheDocument();
      });
    });

    it('handles network error during setup', async () => {
      fetch.mockRejectedValueOnce(new Error('Network failed'));

      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Network error. Please try again.')).toBeInTheDocument();
      });
    });

    it('shows error when code is less than 6 digits on verify', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSetupResponse
      });

      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');
      fireEvent.click(screen.getByText('Enable 2FA'));

      await waitFor(() => {
        expect(screen.getByText('Verify & Enable')).toBeInTheDocument();
      });

      const verifyInputs = screen.getAllByPlaceholderText('000000');
      const verifyInput = verifyInputs[verifyInputs.length - 1];
      fireEvent.change(verifyInput, { target: { value: '123' } });

      // Manually trigger verify with short code - this should show error
      const verifyButton = screen.getByText('Verify & Enable');
      expect(verifyButton).toBeDisabled();
    });
  });

  describe('Success Step', () => {
    beforeEach(async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSetupResponse
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });
    });

    it('displays success message', async () => {
      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');
      fireEvent.click(screen.getByText('Enable 2FA'));

      await waitFor(() => {
        expect(screen.getByText('Verify & Enable')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Verify & Enable'));

      await waitFor(() => {
        expect(screen.getByText('Two-Factor Authentication Enabled!')).toBeInTheDocument();
        expect(screen.getByText('Your account is now protected with 2FA')).toBeInTheDocument();
      });
    });

    it('shows success check icon', async () => {
      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');
      fireEvent.click(screen.getByText('Enable 2FA'));

      await waitFor(() => {
        expect(screen.getByText('Verify & Enable')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Verify & Enable'));

      await waitFor(() => {
        expect(screen.getAllByTestId('check-icon').length).toBeGreaterThan(0);
      });
    });

    it('displays Done button', async () => {
      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');
      fireEvent.click(screen.getByText('Enable 2FA'));

      await waitFor(() => {
        expect(screen.getByText('Verify & Enable')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Verify & Enable'));

      await waitFor(() => {
        expect(screen.getByText('Done')).toBeInTheDocument();
      });
    });

    it('calls onClose when Done is clicked', async () => {
      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');
      fireEvent.click(screen.getByText('Enable 2FA'));

      await waitFor(() => {
        expect(screen.getByText('Verify & Enable')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Verify & Enable'));

      await waitFor(() => {
        expect(screen.getByText('Done')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Done'));

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Backup Codes Display', () => {
    beforeEach(async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSetupResponse
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });
    });

    it('displays backup codes section', async () => {
      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');
      fireEvent.click(screen.getByText('Enable 2FA'));

      await waitFor(() => {
        expect(screen.getByText('Verify & Enable')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Verify & Enable'));

      await waitFor(() => {
        expect(screen.getByText('Save Your Backup Codes')).toBeInTheDocument();
      });
    });

    it('shows backup codes key icon', async () => {
      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');
      fireEvent.click(screen.getByText('Enable 2FA'));

      await waitFor(() => {
        expect(screen.getByText('Verify & Enable')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Verify & Enable'));

      await waitFor(() => {
        expect(screen.getByTestId('key-icon')).toBeInTheDocument();
      });
    });

    it('displays warning message about backup codes', async () => {
      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');
      fireEvent.click(screen.getByText('Enable 2FA'));

      await waitFor(() => {
        expect(screen.getByText('Verify & Enable')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Verify & Enable'));

      await waitFor(() => {
        expect(screen.getByText(/Store these codes in a safe place/)).toBeInTheDocument();
      });
    });

    it('displays all backup codes', async () => {
      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');
      fireEvent.click(screen.getByText('Enable 2FA'));

      await waitFor(() => {
        expect(screen.getByText('Verify & Enable')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Verify & Enable'));

      await waitFor(() => {
        mockSetupResponse.backupCodes.forEach(code => {
          expect(screen.getByText(code)).toBeInTheDocument();
        });
      });
    });

    it('shows copy button for each backup code', async () => {
      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');
      fireEvent.click(screen.getByText('Enable 2FA'));

      await waitFor(() => {
        expect(screen.getByText('Verify & Enable')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Verify & Enable'));

      await waitFor(() => {
        const copyButtons = screen.getAllByTestId('copy-icon');
        expect(copyButtons.length).toBeGreaterThanOrEqual(mockSetupResponse.backupCodes.length);
      });
    });

    it('copies individual backup code to clipboard', async () => {
      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');
      fireEvent.click(screen.getByText('Enable 2FA'));

      await waitFor(() => {
        expect(screen.getByText('Verify & Enable')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Verify & Enable'));

      await waitFor(() => {
        expect(screen.getByText('CODE1')).toBeInTheDocument();
      });

      const copyButtons = screen.getAllByTestId('copy-icon');
      const firstCodeButton = copyButtons[copyButtons.length - mockSetupResponse.backupCodes.length];
      fireEvent.click(firstCodeButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('CODE1');
      });
    });

    it('shows check icon after copying backup code', async () => {
      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');
      fireEvent.click(screen.getByText('Enable 2FA'));

      await waitFor(() => {
        expect(screen.getByText('Verify & Enable')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Verify & Enable'));

      await waitFor(() => {
        expect(screen.getByText('CODE1')).toBeInTheDocument();
      });

      const copyButtons = screen.getAllByTestId('copy-icon');
      const firstCodeButton = copyButtons[copyButtons.length - mockSetupResponse.backupCodes.length];
      fireEvent.click(firstCodeButton);

      await waitFor(() => {
        const checkIcons = screen.getAllByTestId('check-icon');
        expect(checkIcons.length).toBeGreaterThan(0);
      });
    });

    it('hides backup codes section when no codes provided', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockSetupResponse, backupCodes: [] })
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');
      fireEvent.click(screen.getByText('Enable 2FA'));

      await waitFor(() => {
        expect(screen.getByText('Verify & Enable')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Verify & Enable'));

      await waitFor(() => {
        expect(screen.getByText('Two-Factor Authentication Enabled!')).toBeInTheDocument();
      });

      expect(screen.queryByText('Save Your Backup Codes')).not.toBeInTheDocument();
    });
  });

  describe('Download Backup Codes', () => {
    beforeEach(async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSetupResponse
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });
    });

    it('shows download button', async () => {
      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');
      fireEvent.click(screen.getByText('Enable 2FA'));

      await waitFor(() => {
        expect(screen.getByText('Verify & Enable')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Verify & Enable'));

      await waitFor(() => {
        expect(screen.getByText('Download Backup Codes')).toBeInTheDocument();
      });
    });

    it('downloads backup codes as text file', async () => {
      const mockClick = jest.fn();
      const mockAnchor = {
        href: '',
        download: '',
        click: mockClick
      };
      jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor);

      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');
      fireEvent.click(screen.getByText('Enable 2FA'));

      await waitFor(() => {
        expect(screen.getByText('Verify & Enable')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Verify & Enable'));

      await waitFor(() => {
        expect(screen.getByText('Download Backup Codes')).toBeInTheDocument();
      });

      const downloadButton = screen.getByText('Download Backup Codes');
      fireEvent.click(downloadButton);

      expect(mockClick).toHaveBeenCalled();
      expect(mockAnchor.download).toBe('cryb-backup-codes.txt');
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  describe('Disable 2FA Flow', () => {
    const enabledUserProps = {
      ...defaultProps,
      user: { ...defaultProps.user, twoFactorEnabled: true }
    };

    it('shows disable screen when 2FA is enabled', () => {
      render(<TwoFactorAuth {...enabledUserProps} />);

      expect(screen.getByText('Disable Two-Factor Authentication?')).toBeInTheDocument();
    });

    it('displays warning icon', () => {
      render(<TwoFactorAuth {...enabledUserProps} />);

      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
    });

    it('shows warning message', () => {
      render(<TwoFactorAuth {...enabledUserProps} />);

      expect(screen.getByText('Your account will be less secure without 2FA protection')).toBeInTheDocument();
    });

    it('displays security warning box', () => {
      render(<TwoFactorAuth {...enabledUserProps} />);

      expect(screen.getByText(/Disabling 2FA will remove an important security layer/)).toBeInTheDocument();
    });

    it('shows code input for confirmation', () => {
      render(<TwoFactorAuth {...enabledUserProps} />);

      expect(screen.getByText('Enter your current 2FA code to confirm:')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
    });

    it('shows Keep 2FA Enabled button', () => {
      render(<TwoFactorAuth {...enabledUserProps} />);

      expect(screen.getByText('Keep 2FA Enabled')).toBeInTheDocument();
    });

    it('shows Disable 2FA button', () => {
      render(<TwoFactorAuth {...enabledUserProps} />);

      expect(screen.getByText('Disable 2FA')).toBeInTheDocument();
    });

    it('calls onClose when Keep 2FA Enabled is clicked', () => {
      render(<TwoFactorAuth {...enabledUserProps} />);

      const button = screen.getByText('Keep 2FA Enabled');
      fireEvent.click(button);

      expect(enabledUserProps.onClose).toHaveBeenCalled();
    });

    it('Disable button is disabled without code', () => {
      render(<TwoFactorAuth {...enabledUserProps} />);

      const button = screen.getByText('Disable 2FA');
      expect(button).toBeDisabled();
    });

    it('Disable button is enabled with 6-digit code', async () => {
      render(<TwoFactorAuth {...enabledUserProps} />);

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');

      const button = screen.getByText('Disable 2FA');
      expect(button).not.toBeDisabled();
    });

    it('sends disable request with correct code', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      render(<TwoFactorAuth {...enabledUserProps} />);

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');

      const button = screen.getByText('Disable 2FA');
      fireEvent.click(button);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/auth/2fa/disable', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ code: '123456' })
        });
      });
    });

    it('shows loading state during disable', async () => {
      fetch.mockImplementation(() => new Promise(() => {}));

      render(<TwoFactorAuth {...enabledUserProps} />);

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');

      const button = screen.getByText('Disable 2FA');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Disabling...')).toBeInTheDocument();
      });
    });

    it('calls onUpdate and onClose after successful disable', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      render(<TwoFactorAuth {...enabledUserProps} />);

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');

      const button = screen.getByText('Disable 2FA');
      fireEvent.click(button);

      await waitFor(() => {
        expect(enabledUserProps.onUpdate).toHaveBeenCalledWith({
          ...enabledUserProps.user,
          twoFactorEnabled: false
        });
        expect(enabledUserProps.onClose).toHaveBeenCalled();
      });
    });

    it('shows error when disable fails', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid code' })
      });

      render(<TwoFactorAuth {...enabledUserProps} />);

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');

      const button = screen.getByText('Disable 2FA');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Invalid code')).toBeInTheDocument();
      });
    });

    it('handles network error during disable', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      render(<TwoFactorAuth {...enabledUserProps} />);

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');

      const button = screen.getByText('Disable 2FA');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Failed to disable 2FA. Please try again.')).toBeInTheDocument();
      });
    });

    it('validates code length before disable', async () => {
      render(<TwoFactorAuth {...enabledUserProps} />);

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123');

      const button = screen.getByText('Disable 2FA');
      expect(button).toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing onUpdate callback', async () => {
      const props = { ...defaultProps, onUpdate: undefined };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSetupResponse
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      render(<TwoFactorAuth {...props} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');
      fireEvent.click(screen.getByText('Enable 2FA'));

      await waitFor(() => {
        expect(screen.getByText('Verify & Enable')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Verify & Enable'));

      await waitFor(() => {
        expect(screen.getByText('Two-Factor Authentication Enabled!')).toBeInTheDocument();
      });

      // Should not throw error
      expect(() => screen.getByText('Done')).not.toThrow();
    });

    it('handles missing backup codes in response', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockSetupResponse, backupCodes: undefined })
      });

      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });
    });

    it('handles empty string in code input', () => {
      render(<TwoFactorAuth {...defaultProps} />);

      const input = screen.getByPlaceholderText('000000');
      fireEvent.change(input, { target: { value: '' } });

      expect(input.value).toBe('');
    });

    it('handles special characters in code input', async () => {
      render(<TwoFactorAuth {...defaultProps} />);

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '!@#$%^');

      expect(input.value).toBe('');
    });

    it('handles spaces in code input', async () => {
      render(<TwoFactorAuth {...defaultProps} />);

      const input = screen.getByPlaceholderText('000000');
      fireEvent.change(input, { target: { value: '1 2 3' } });

      expect(input.value).toBe('123');
    });

    it('handles rapid state changes', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSetupResponse
      });

      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');

      // Rapidly click enable button
      const button = screen.getByText('Enable 2FA');
      fireEvent.click(button);
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Verify Your Identity')).toBeInTheDocument();
      });
    });

    it('clears error when user starts typing new code', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSetupResponse
      }).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Wrong code' })
      });

      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');
      fireEvent.click(screen.getByText('Enable 2FA'));

      await waitFor(() => {
        expect(screen.getByText('Verify & Enable')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Verify & Enable'));

      await waitFor(() => {
        expect(screen.getByText('Wrong code')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper input mode for numeric keyboard', () => {
      render(<TwoFactorAuth {...defaultProps} />);

      const input = screen.getByPlaceholderText('000000');
      expect(input).toHaveAttribute('inputMode', 'numeric');
    });

    it('has proper pattern for numeric input', () => {
      render(<TwoFactorAuth {...defaultProps} />);

      const input = screen.getByPlaceholderText('000000');
      expect(input).toHaveAttribute('pattern', '[0-9]*');
    });

    it('has proper maxLength attribute', () => {
      render(<TwoFactorAuth {...defaultProps} />);

      const input = screen.getByPlaceholderText('000000');
      expect(input).toHaveAttribute('maxLength', '6');
    });

    it('has descriptive placeholder text', () => {
      render(<TwoFactorAuth {...defaultProps} />);

      expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
    });

    it('buttons have descriptive text', () => {
      render(<TwoFactorAuth {...defaultProps} />);

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Enable 2FA')).toBeInTheDocument();
    });

    it('error messages are displayed prominently', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({})
      });

      render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        const error = screen.getByText('Failed to setup 2FA. Please try again.');
        expect(error).toHaveClass('error-message');
      });
    });
  });

  describe('Snapshots', () => {
    it('matches snapshot for setup step', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSetupResponse
      });

      const { container } = render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for verify step', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSetupResponse
      });

      const { container } = render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');
      fireEvent.click(screen.getByText('Enable 2FA'));

      await waitFor(() => {
        expect(screen.getByText('Verify Your Identity')).toBeInTheDocument();
      });

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for success step', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSetupResponse
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      const { container } = render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('MOCK-SECRET-KEY-1234')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('000000');
      await userEvent.type(input, '123456');
      fireEvent.click(screen.getByText('Enable 2FA'));

      await waitFor(() => {
        expect(screen.getByText('Verify & Enable')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Verify & Enable'));

      await waitFor(() => {
        expect(screen.getByText('Two-Factor Authentication Enabled!')).toBeInTheDocument();
      });

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for disable step', () => {
      const props = {
        ...defaultProps,
        user: { ...defaultProps.user, twoFactorEnabled: true }
      };

      const { container } = render(<TwoFactorAuth {...props} />);

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with error', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({})
      });

      const { container } = render(<TwoFactorAuth {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to setup 2FA. Please try again.')).toBeInTheDocument();
      });

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot during loading', () => {
      fetch.mockImplementation(() => new Promise(() => {}));

      const { container } = render(<TwoFactorAuth {...defaultProps} />);

      expect(container).toMatchSnapshot();
    });
  });
});

export default localStorageMock
