/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InviteModal from './InviteModal';
import serverService from '../../services/serverService';

jest.mock('../../services/serverService');

jest.mock('../ui', () => ({
  Button: ({ children, onClick, loading, disabled, variant }) => (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      data-loading={loading}
      data-variant={variant}
    >
      {loading ? '' : children}
    </button>
  ),
  Input: ({ value, onChange, onKeyPress, disabled, autoFocus, placeholder, className }) => (
    <input
      value={value}
      onChange={onChange}
      onKeyPress={onKeyPress}
      disabled={disabled}
      autoFocus={autoFocus}
      placeholder={placeholder}
      className={className}
      data-testid="invite-code-input"
    />
  ),
}));

jest.mock('lucide-react', () => ({
  X: () => <div data-testid="x-icon">X</div>,
  Users: () => <div data-testid="users-icon">Users</div>,
  Globe: () => <div data-testid="globe-icon">Globe</div>,
  Lock: () => <div data-testid="lock-icon">Lock</div>,
  CheckCircle: () => <div data-testid="check-circle-icon">CheckCircle</div>,
  AlertCircle: () => <div data-testid="alert-circle-icon">AlertCircle</div>,
}));

describe('InviteModal', () => {
  const mockOnClose = jest.fn();
  const mockOnJoin = jest.fn();

  const defaultProps = {
    onClose: mockOnClose,
    onJoin: mockOnJoin,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Modal Rendering', () => {
    it('renders without crashing', () => {
      render(<InviteModal {...defaultProps} />);
      expect(screen.getByText('Join a Server')).toBeInTheDocument();
    });

    it('renders the modal overlay', () => {
      const { container } = render(<InviteModal {...defaultProps} />);
      const overlay = container.querySelector('.fixed.inset-0');
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveClass('bg-black/50');
    });

    it('renders modal header with title', () => {
      render(<InviteModal {...defaultProps} />);
      expect(screen.getByText('Join a Server')).toBeInTheDocument();
    });

    it('renders close button in header', () => {
      render(<InviteModal {...defaultProps} />);
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });

    it('renders instructions text', () => {
      render(<InviteModal {...defaultProps} />);
      expect(screen.getByText('Enter an invite code to join a server')).toBeInTheDocument();
    });

    it('renders invite code input field', () => {
      render(<InviteModal {...defaultProps} />);
      expect(screen.getByTestId('invite-code-input')).toBeInTheDocument();
    });

    it('renders input placeholder text', () => {
      render(<InviteModal {...defaultProps} />);
      const input = screen.getByPlaceholderText('e.g., abc123xyz');
      expect(input).toBeInTheDocument();
    });

    it('renders helper text for invite codes', () => {
      render(<InviteModal {...defaultProps} />);
      expect(screen.getByText(/Invite codes look like:/)).toBeInTheDocument();
    });

    it('renders Check button initially', () => {
      render(<InviteModal {...defaultProps} />);
      expect(screen.getByText('Check')).toBeInTheDocument();
    });

    it('renders Cancel button in footer', () => {
      render(<InviteModal {...defaultProps} />);
      const cancelButtons = screen.getAllByText('Cancel');
      expect(cancelButtons.length).toBeGreaterThan(0);
    });

    it('renders Join Server button in footer', () => {
      render(<InviteModal {...defaultProps} />);
      expect(screen.getByText('Join Server')).toBeInTheDocument();
    });

    it('autofocuses the input field', () => {
      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');
      expect(input).toHaveAttribute('autoFocus');
    });
  });

  describe('Invite Code Input', () => {
    it('updates invite code on input change', async () => {
      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');

      await userEvent.type(input, 'abc123xyz');

      expect(input.value).toBe('abc123xyz');
    });

    it('trims whitespace from invite code', async () => {
      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');

      fireEvent.change(input, { target: { value: '  abc123xyz  ' } });

      expect(input.value).toBe('abc123xyz');
    });

    it('clears error when input changes', async () => {
      serverService.validateInvite.mockRejectedValueOnce(new Error('Invalid'));

      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');
      const checkButton = screen.getByText('Check');

      await userEvent.type(input, 'invalid');
      await userEvent.click(checkButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to validate invite code')).toBeInTheDocument();
      });

      await userEvent.type(input, 'a');

      await waitFor(() => {
        expect(screen.queryByText('Failed to validate invite code')).not.toBeInTheDocument();
      });
    });

    it('clears invite data when input changes', async () => {
      const mockInviteData = {
        success: true,
        invite: {
          server: { name: 'Test Server', memberCount: 10 },
          inviter: { username: 'testuser' },
        },
      };

      serverService.validateInvite.mockResolvedValueOnce(mockInviteData);

      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');
      const checkButton = screen.getByText('Check');

      await userEvent.type(input, 'valid123');
      await userEvent.click(checkButton);

      await waitFor(() => {
        expect(screen.getByText('Test Server')).toBeInTheDocument();
      });

      await userEvent.clear(input);
      await userEvent.type(input, 'new');

      await waitFor(() => {
        expect(screen.queryByText('Test Server')).not.toBeInTheDocument();
      });
    });

    it('disables input during validation', async () => {
      serverService.validateInvite.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ success: false }), 100))
      );

      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');

      await userEvent.type(input, 'test123');
      const checkButton = screen.getByText('Check');
      await userEvent.click(checkButton);

      expect(input).toBeDisabled();

      await waitFor(() => {
        expect(input).not.toBeDisabled();
      });
    });

    it('disables input during join process', async () => {
      const mockInviteData = {
        success: true,
        invite: { server: { name: 'Test Server' } },
      };

      serverService.validateInvite.mockResolvedValueOnce(mockInviteData);
      serverService.joinByInvite.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ success: true, server: {} }), 100))
      );

      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');

      await userEvent.type(input, 'test123');
      await userEvent.click(screen.getByText('Check'));

      await waitFor(() => {
        expect(screen.getByText('Join Server')).toBeInTheDocument();
      });

      const joinButton = screen.getAllByText('Join Server')[0];
      await userEvent.click(joinButton);

      expect(input).toBeDisabled();
    });
  });

  describe('Invite Validation', () => {
    it('validates invite code successfully', async () => {
      const mockInviteData = {
        success: true,
        invite: {
          server: { name: 'Test Server', memberCount: 10 },
        },
      };

      serverService.validateInvite.mockResolvedValueOnce(mockInviteData);

      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');

      await userEvent.type(input, 'valid123');
      await userEvent.click(screen.getByText('Check'));

      await waitFor(() => {
        expect(serverService.validateInvite).toHaveBeenCalledWith('valid123');
      });
    });

    it('shows error when validating empty code', async () => {
      render(<InviteModal {...defaultProps} />);
      const checkButton = screen.getByText('Check');

      await userEvent.click(checkButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter an invite code')).toBeInTheDocument();
      });
    });

    it('shows error for invalid invite code', async () => {
      serverService.validateInvite.mockResolvedValueOnce({
        success: false,
        error: 'Invalid or expired invite code',
      });

      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');

      await userEvent.type(input, 'invalid123');
      await userEvent.click(screen.getByText('Check'));

      await waitFor(() => {
        expect(screen.getByText('Invalid or expired invite code')).toBeInTheDocument();
      });
    });

    it('shows generic error when API returns success false without error message', async () => {
      serverService.validateInvite.mockResolvedValueOnce({
        success: false,
      });

      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');

      await userEvent.type(input, 'invalid123');
      await userEvent.click(screen.getByText('Check'));

      await waitFor(() => {
        expect(screen.getByText('Invalid or expired invite code')).toBeInTheDocument();
      });
    });

    it('handles validation network error', async () => {
      serverService.validateInvite.mockRejectedValueOnce(new Error('Network error'));

      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');

      await userEvent.type(input, 'test123');
      await userEvent.click(screen.getByText('Check'));

      await waitFor(() => {
        expect(screen.getByText('Failed to validate invite code')).toBeInTheDocument();
      });
    });

    it('displays loading state during validation', async () => {
      serverService.validateInvite.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');

      await userEvent.type(input, 'test123');
      const checkButton = screen.getByText('Check');
      await userEvent.click(checkButton);

      expect(checkButton).toHaveAttribute('data-loading', 'true');

      await waitFor(() => {
        expect(checkButton).toHaveAttribute('data-loading', 'false');
      });
    });

    it('disables Check button when no invite code entered', () => {
      render(<InviteModal {...defaultProps} />);
      const checkButton = screen.getByText('Check');

      expect(checkButton).toBeDisabled();
    });

    it('enables Check button when invite code is entered', async () => {
      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');
      const checkButton = screen.getByText('Check');

      await userEvent.type(input, 'abc123');

      expect(checkButton).not.toBeDisabled();
    });
  });

  describe('Invite Preview Display', () => {
    it('displays invite preview after successful validation', async () => {
      const mockInviteData = {
        success: true,
        invite: {
          server: { name: 'Test Server', memberCount: 10 },
        },
      };

      serverService.validateInvite.mockResolvedValueOnce(mockInviteData);

      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');

      await userEvent.type(input, 'valid123');
      await userEvent.click(screen.getByText('Check'));

      await waitFor(() => {
        expect(screen.getByText('Valid Invite')).toBeInTheDocument();
        expect(screen.getByText('Test Server')).toBeInTheDocument();
      });
    });

    it('hides Check button after successful validation', async () => {
      const mockInviteData = {
        success: true,
        invite: {
          server: { name: 'Test Server' },
        },
      };

      serverService.validateInvite.mockResolvedValueOnce(mockInviteData);

      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');

      await userEvent.type(input, 'valid123');
      await userEvent.click(screen.getByText('Check'));

      await waitFor(() => {
        expect(screen.queryByText('Check')).not.toBeInTheDocument();
      });
    });

    it('displays server icon when available', async () => {
      const mockInviteData = {
        success: true,
        invite: {
          server: { name: 'Test Server', icon: '/icon.png' },
        },
      };

      serverService.validateInvite.mockResolvedValueOnce(mockInviteData);

      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');

      await userEvent.type(input, 'valid123');
      await userEvent.click(screen.getByText('Check'));

      await waitFor(() => {
        const img = screen.getByAltText('Test Server');
        expect(img).toHaveAttribute('src', '/icon.png');
      });
    });

    it('displays server initial when no icon available', async () => {
      const mockInviteData = {
        success: true,
        invite: {
          server: { name: 'Test Server' },
        },
      };

      serverService.validateInvite.mockResolvedValueOnce(mockInviteData);

      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');

      await userEvent.type(input, 'valid123');
      await userEvent.click(screen.getByText('Check'));

      await waitFor(() => {
        expect(screen.getByText('T')).toBeInTheDocument();
      });
    });

    it('displays Globe icon for public servers', async () => {
      const mockInviteData = {
        success: true,
        invite: {
          server: { name: 'Test Server', isPublic: true },
        },
      };

      serverService.validateInvite.mockResolvedValueOnce(mockInviteData);

      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');

      await userEvent.type(input, 'valid123');
      await userEvent.click(screen.getByText('Check'));

      await waitFor(() => {
        expect(screen.getByTestId('globe-icon')).toBeInTheDocument();
      });
    });

    it('displays Lock icon for private servers', async () => {
      const mockInviteData = {
        success: true,
        invite: {
          server: { name: 'Test Server', isPublic: false },
        },
      };

      serverService.validateInvite.mockResolvedValueOnce(mockInviteData);

      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');

      await userEvent.type(input, 'valid123');
      await userEvent.click(screen.getByText('Check'));

      await waitFor(() => {
        expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
      });
    });

    it('displays server description when available', async () => {
      const mockInviteData = {
        success: true,
        invite: {
          server: { name: 'Test Server', description: 'A great server' },
        },
      };

      serverService.validateInvite.mockResolvedValueOnce(mockInviteData);

      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');

      await userEvent.type(input, 'valid123');
      await userEvent.click(screen.getByText('Check'));

      await waitFor(() => {
        expect(screen.getByText('A great server')).toBeInTheDocument();
      });
    });

    it('displays member count', async () => {
      const mockInviteData = {
        success: true,
        invite: {
          server: { name: 'Test Server', memberCount: 42 },
        },
      };

      serverService.validateInvite.mockResolvedValueOnce(mockInviteData);

      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');

      await userEvent.type(input, 'valid123');
      await userEvent.click(screen.getByText('Check'));

      await waitFor(() => {
        expect(screen.getByText('42 members')).toBeInTheDocument();
      });
    });

    it('displays online count when available', async () => {
      const mockInviteData = {
        success: true,
        invite: {
          server: { name: 'Test Server', memberCount: 42, onlineCount: 15 },
        },
      };

      serverService.validateInvite.mockResolvedValueOnce(mockInviteData);

      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');

      await userEvent.type(input, 'valid123');
      await userEvent.click(screen.getByText('Check'));

      await waitFor(() => {
        expect(screen.getByText('15 online')).toBeInTheDocument();
      });
    });

    it('displays inviter information', async () => {
      const mockInviteData = {
        success: true,
        invite: {
          server: { name: 'Test Server' },
          inviter: { username: 'john_doe' },
        },
      };

      serverService.validateInvite.mockResolvedValueOnce(mockInviteData);

      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');

      await userEvent.type(input, 'valid123');
      await userEvent.click(screen.getByText('Check'));

      await waitFor(() => {
        expect(screen.getByText('john_doe')).toBeInTheDocument();
      });
    });

    it('displays expiration date', async () => {
      const expiresAt = new Date('2025-12-31');
      const mockInviteData = {
        success: true,
        invite: {
          server: { name: 'Test Server' },
          expiresAt: expiresAt.toISOString(),
        },
      };

      serverService.validateInvite.mockResolvedValueOnce(mockInviteData);

      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');

      await userEvent.type(input, 'valid123');
      await userEvent.click(screen.getByText('Check'));

      await waitFor(() => {
        expect(screen.getByText(expiresAt.toLocaleDateString())).toBeInTheDocument();
      });
    });

    it('displays max uses information', async () => {
      const mockInviteData = {
        success: true,
        invite: {
          server: { name: 'Test Server' },
          maxUses: 10,
          uses: 5,
        },
      };

      serverService.validateInvite.mockResolvedValueOnce(mockInviteData);

      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');

      await userEvent.type(input, 'valid123');
      await userEvent.click(screen.getByText('Check'));

      await waitFor(() => {
        expect(screen.getByText('5 / 10')).toBeInTheDocument();
      });
    });
  });

  describe('Join Server Functionality', () => {
    it('joins server successfully with valid invite', async () => {
      const mockInviteData = {
        success: true,
        invite: {
          server: { name: 'Test Server' },
        },
      };

      const mockServerData = {
        success: true,
        server: { id: 'server-1', name: 'Test Server' },
      };

      serverService.validateInvite.mockResolvedValueOnce(mockInviteData);
      serverService.joinByInvite.mockResolvedValueOnce(mockServerData);

      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');

      await userEvent.type(input, 'valid123');
      await userEvent.click(screen.getByText('Check'));

      await waitFor(() => {
        expect(screen.getByText('Join Server')).toBeInTheDocument();
      });

      const joinButton = screen.getAllByText('Join Server')[0];
      await userEvent.click(joinButton);

      await waitFor(() => {
        expect(serverService.joinByInvite).toHaveBeenCalledWith('valid123');
        expect(mockOnJoin).toHaveBeenCalledWith(mockServerData.server);
      });
    });

    it('shows error when joining without invite code', async () => {
      render(<InviteModal {...defaultProps} />);
      const joinButton = screen.getByText('Join Server');

      await userEvent.click(joinButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter an invite code')).toBeInTheDocument();
      });
    });

    it('shows error when join fails', async () => {
      const mockInviteData = {
        success: true,
        invite: {
          server: { name: 'Test Server' },
        },
      };

      serverService.validateInvite.mockResolvedValueOnce(mockInviteData);
      serverService.joinByInvite.mockResolvedValueOnce({
        success: false,
        error: 'Server is full',
      });

      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');

      await userEvent.type(input, 'valid123');
      await userEvent.click(screen.getByText('Check'));

      await waitFor(() => {
        expect(screen.getByText('Join Server')).toBeInTheDocument();
      });

      const joinButton = screen.getAllByText('Join Server')[0];
      await userEvent.click(joinButton);

      await waitFor(() => {
        expect(screen.getByText('Server is full')).toBeInTheDocument();
      });
    });

    it('shows generic error when join fails without error message', async () => {
      const mockInviteData = {
        success: true,
        invite: {
          server: { name: 'Test Server' },
        },
      };

      serverService.validateInvite.mockResolvedValueOnce(mockInviteData);
      serverService.joinByInvite.mockResolvedValueOnce({
        success: false,
      });

      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');

      await userEvent.type(input, 'valid123');
      await userEvent.click(screen.getByText('Check'));

      await waitFor(() => {
        expect(screen.getByText('Join Server')).toBeInTheDocument();
      });

      const joinButton = screen.getAllByText('Join Server')[0];
      await userEvent.click(joinButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to join server')).toBeInTheDocument();
      });
    });

    it('handles join network error', async () => {
      const mockInviteData = {
        success: true,
        invite: {
          server: { name: 'Test Server' },
        },
      };

      serverService.validateInvite.mockResolvedValueOnce(mockInviteData);
      serverService.joinByInvite.mockRejectedValueOnce(new Error('Network error'));

      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');

      await userEvent.type(input, 'valid123');
      await userEvent.click(screen.getByText('Check'));

      await waitFor(() => {
        expect(screen.getByText('Join Server')).toBeInTheDocument();
      });

      const joinButton = screen.getAllByText('Join Server')[0];
      await userEvent.click(joinButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to join server')).toBeInTheDocument();
      });
    });

    it('displays loading state during join', async () => {
      const mockInviteData = {
        success: true,
        invite: {
          server: { name: 'Test Server' },
        },
      };

      serverService.validateInvite.mockResolvedValueOnce(mockInviteData);
      serverService.joinByInvite.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ success: true, server: {} }), 100))
      );

      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');

      await userEvent.type(input, 'valid123');
      await userEvent.click(screen.getByText('Check'));

      await waitFor(() => {
        expect(screen.getByText('Join Server')).toBeInTheDocument();
      });

      const joinButton = screen.getAllByText('Join Server')[0];
      await userEvent.click(joinButton);

      expect(joinButton).toHaveAttribute('data-loading', 'true');

      await waitFor(() => {
        expect(joinButton).toHaveAttribute('data-loading', 'false');
      });
    });

    it('disables Join Server button when no invite data', () => {
      render(<InviteModal {...defaultProps} />);
      const joinButton = screen.getByText('Join Server');

      expect(joinButton).toBeDisabled();
    });

    it('disables Join Server button during validation', async () => {
      serverService.validateInvite.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ success: false }), 100))
      );

      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');

      await userEvent.type(input, 'test123');
      const checkButton = screen.getByText('Check');
      await userEvent.click(checkButton);

      const joinButton = screen.getByText('Join Server');
      expect(joinButton).toBeDisabled();
    });
  });

  describe('Keyboard Interactions', () => {
    it('validates invite on Enter key when no invite data', async () => {
      serverService.validateInvite.mockResolvedValueOnce({
        success: true,
        invite: { server: { name: 'Test Server' } },
      });

      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');

      await userEvent.type(input, 'valid123');
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });

      await waitFor(() => {
        expect(serverService.validateInvite).toHaveBeenCalledWith('valid123');
      });
    });

    it('joins server on Enter key when invite data exists', async () => {
      const mockInviteData = {
        success: true,
        invite: { server: { name: 'Test Server' } },
      };

      const mockServerData = {
        success: true,
        server: { id: 'server-1', name: 'Test Server' },
      };

      serverService.validateInvite.mockResolvedValueOnce(mockInviteData);
      serverService.joinByInvite.mockResolvedValueOnce(mockServerData);

      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');

      await userEvent.type(input, 'valid123');
      await userEvent.click(screen.getByText('Check'));

      await waitFor(() => {
        expect(screen.getByText('Valid Invite')).toBeInTheDocument();
      });

      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });

      await waitFor(() => {
        expect(serverService.joinByInvite).toHaveBeenCalledWith('valid123');
      });
    });
  });

  describe('Modal Controls', () => {
    it('calls onClose when X button is clicked', async () => {
      render(<InviteModal {...defaultProps} />);
      const closeButton = screen.getByTestId('x-icon').parentElement;

      await userEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Cancel button is clicked', async () => {
      render(<InviteModal {...defaultProps} />);
      const cancelButton = screen.getAllByText('Cancel')[0];

      await userEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('disables Cancel button during join', async () => {
      const mockInviteData = {
        success: true,
        invite: { server: { name: 'Test Server' } },
      };

      serverService.validateInvite.mockResolvedValueOnce(mockInviteData);
      serverService.joinByInvite.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ success: true, server: {} }), 100))
      );

      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');

      await userEvent.type(input, 'valid123');
      await userEvent.click(screen.getByText('Check'));

      await waitFor(() => {
        expect(screen.getByText('Join Server')).toBeInTheDocument();
      });

      const joinButton = screen.getAllByText('Join Server')[0];
      await userEvent.click(joinButton);

      const cancelButton = screen.getAllByText('Cancel')[0];
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('Error Display', () => {
    it('displays error message with alert icon', async () => {
      serverService.validateInvite.mockResolvedValueOnce({
        success: false,
        error: 'Test error message',
      });

      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');

      await userEvent.type(input, 'invalid');
      await userEvent.click(screen.getByText('Check'));

      await waitFor(() => {
        expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
        expect(screen.getByText('Test error message')).toBeInTheDocument();
      });
    });

    it('clears error message after successful validation', async () => {
      serverService.validateInvite
        .mockResolvedValueOnce({ success: false, error: 'Invalid code' })
        .mockResolvedValueOnce({ success: true, invite: { server: { name: 'Test Server' } } });

      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');

      await userEvent.type(input, 'invalid');
      await userEvent.click(screen.getByText('Check'));

      await waitFor(() => {
        expect(screen.getByText('Invalid code')).toBeInTheDocument();
      });

      await userEvent.clear(input);
      await userEvent.type(input, 'valid123');
      await userEvent.click(screen.getByText('Check'));

      await waitFor(() => {
        expect(screen.queryByText('Invalid code')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles missing server name gracefully', async () => {
      const mockInviteData = {
        success: true,
        invite: {
          server: {},
        },
      };

      serverService.validateInvite.mockResolvedValueOnce(mockInviteData);

      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');

      await userEvent.type(input, 'valid123');
      await userEvent.click(screen.getByText('Check'));

      await waitFor(() => {
        expect(screen.getByText('Unknown Server')).toBeInTheDocument();
      });
    });

    it('handles zero member count', async () => {
      const mockInviteData = {
        success: true,
        invite: {
          server: { name: 'Test Server', memberCount: 0 },
        },
      };

      serverService.validateInvite.mockResolvedValueOnce(mockInviteData);

      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');

      await userEvent.type(input, 'valid123');
      await userEvent.click(screen.getByText('Check'));

      await waitFor(() => {
        expect(screen.getByText('0 members')).toBeInTheDocument();
      });
    });

    it('handles undefined member count', async () => {
      const mockInviteData = {
        success: true,
        invite: {
          server: { name: 'Test Server' },
        },
      };

      serverService.validateInvite.mockResolvedValueOnce(mockInviteData);

      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');

      await userEvent.type(input, 'valid123');
      await userEvent.click(screen.getByText('Check'));

      await waitFor(() => {
        expect(screen.getByText('0 members')).toBeInTheDocument();
      });
    });

    it('handles missing inviter gracefully', async () => {
      const mockInviteData = {
        success: true,
        invite: {
          server: { name: 'Test Server' },
        },
      };

      serverService.validateInvite.mockResolvedValueOnce(mockInviteData);

      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');

      await userEvent.type(input, 'valid123');
      await userEvent.click(screen.getByText('Check'));

      await waitFor(() => {
        expect(screen.queryByText('Invited by:')).not.toBeInTheDocument();
      });
    });

    it('handles inviter without username', async () => {
      const mockInviteData = {
        success: true,
        invite: {
          server: { name: 'Test Server' },
          inviter: {},
        },
      };

      serverService.validateInvite.mockResolvedValueOnce(mockInviteData);

      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');

      await userEvent.type(input, 'valid123');
      await userEvent.click(screen.getByText('Check'));

      await waitFor(() => {
        expect(screen.getByText('Unknown')).toBeInTheDocument();
      });
    });

    it('handles console errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      serverService.validateInvite.mockRejectedValueOnce(new Error('Test error'));

      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');

      await userEvent.type(input, 'test123');
      await userEvent.click(screen.getByText('Check'));

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to validate invite:', expect.any(Error));
      });

      consoleError.mockRestore();
    });

    it('handles join console errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      const mockInviteData = {
        success: true,
        invite: { server: { name: 'Test Server' } },
      };

      serverService.validateInvite.mockResolvedValueOnce(mockInviteData);
      serverService.joinByInvite.mockRejectedValueOnce(new Error('Test error'));

      render(<InviteModal {...defaultProps} />);
      const input = screen.getByTestId('invite-code-input');

      await userEvent.type(input, 'valid123');
      await userEvent.click(screen.getByText('Check'));

      await waitFor(() => {
        expect(screen.getByText('Join Server')).toBeInTheDocument();
      });

      const joinButton = screen.getAllByText('Join Server')[0];
      await userEvent.click(joinButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to join server:', expect.any(Error));
      });

      consoleError.mockRestore();
    });
  });
});

export default mockOnClose
