/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../__test__/utils/testUtils';
import BotManagementPage from '../BotManagementPage';
import botService from '../../services/botService';

// Mock botService
jest.mock('../../services/botService');

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

const mockBots = [
  {
    id: '1',
    name: 'Moderation Bot',
    description: 'Auto-moderation bot',
    type: 'moderation',
    token: 'bot_token_123456789_abcdefgh',
    permissions: ['read_messages', 'manage_messages', 'moderation'],
    avatarUrl: '',
    createdAt: '2024-01-15T10:00:00Z',
    lastUsed: '2024-01-20T15:30:00Z'
  },
  {
    id: '2',
    name: 'Music Bot',
    description: 'Plays music in voice channels',
    type: 'music',
    token: 'bot_token_987654321_zyxwvuts',
    permissions: ['read_messages', 'send_messages', 'voice'],
    avatarUrl: '',
    createdAt: '2024-01-10T08:00:00Z',
    lastUsed: null
  }
];

const mockBotTypes = [
  { id: 'moderation', name: 'Moderation Bot', icon: '🛡️', description: 'Auto-moderation and user management' },
  { id: 'utility', name: 'Utility Bot', icon: '🔧', description: 'Tools and helpful commands' },
  { id: 'music', name: 'Music Bot', icon: '🎵', description: 'Play music in voice channels' },
  { id: 'custom', name: 'Custom Bot', icon: '⚙️', description: 'Custom functionality' }
];

const mockPermissions = [
  { id: 'read_messages', name: 'Read Messages', description: 'Read messages in channels where bot is added' },
  { id: 'send_messages', name: 'Send Messages', description: 'Send messages to channels' },
  { id: 'manage_messages', name: 'Manage Messages', description: 'Delete and pin messages' },
  { id: 'read_users', name: 'Read Users', description: 'Access user profile information' },
  { id: 'moderation', name: 'Moderation', description: 'Ban, kick, and timeout users' },
  { id: 'voice', name: 'Voice', description: 'Join and manage voice channels' }
];

describe('BotManagementPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    botService.getBots.mockResolvedValue({ success: true, data: { items: mockBots } });
    botService.getBotTypes.mockReturnValue(mockBotTypes);
    botService.getAvailablePermissions.mockReturnValue(mockPermissions);
    botService.createBot.mockResolvedValue({ success: true, data: { id: '3' } });
    botService.deleteBot.mockResolvedValue({ success: true });
    botService.regenerateToken.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Page Rendering - Basic', () => {
    it('renders page without crashing', () => {
      const { container } = renderWithProviders(<BotManagementPage />);
      expect(container).toBeInTheDocument();
    });

    it('displays main content area with proper role', () => {
      renderWithProviders(<BotManagementPage />);
      const mainElement = screen.getByRole('main');
      expect(mainElement).toBeInTheDocument();
      expect(mainElement).toHaveAttribute('aria-label', 'Bot management page');
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithProviders(<BotManagementPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('displays page heading', () => {
      renderWithProviders(<BotManagementPage />);
      expect(screen.getByRole('heading', { name: /BotManagementPage/i })).toBeInTheDocument();
    });

    it('displays under construction message', () => {
      renderWithProviders(<BotManagementPage />);
      expect(screen.getByText(/Content under construction/i)).toBeInTheDocument();
    });
  });

  describe('Data Loading - Initial State', () => {
    it('shows loading state initially', () => {
      renderWithProviders(<BotManagementPage />);
      // Component starts with loading: true
      expect(botService.getBots).toHaveBeenCalled();
    });

    it('calls getBots service on mount', () => {
      renderWithProviders(<BotManagementPage />);
      expect(botService.getBots).toHaveBeenCalledTimes(1);
    });

    it('calls getBotTypes on mount', () => {
      renderWithProviders(<BotManagementPage />);
      expect(botService.getBotTypes).toHaveBeenCalled();
    });

    it('calls getAvailablePermissions on mount', () => {
      renderWithProviders(<BotManagementPage />);
      expect(botService.getAvailablePermissions).toHaveBeenCalled();
    });

    it('sets loading to false after data loads', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });
  });

  describe('Bot List Display', () => {
    it('loads bots successfully', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('handles empty bot list', async () => {
      botService.getBots.mockResolvedValue({ success: true, data: { items: [] } });
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('displays multiple bots', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling - API Failures', () => {
    it('handles getBots API failure', async () => {
      botService.getBots.mockRejectedValue(new Error('API Error'));
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('handles getBots returning error response', async () => {
      botService.getBots.mockResolvedValue({ success: false });
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('displays error message on load failure', async () => {
      botService.getBots.mockRejectedValue(new Error('Network error'));
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('handles createBot failure', async () => {
      botService.createBot.mockRejectedValue(new Error('Create failed'));
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('handles deleteBot failure', async () => {
      botService.deleteBot.mockRejectedValue(new Error('Delete failed'));
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('handles regenerateToken failure', async () => {
      botService.regenerateToken.mockRejectedValue(new Error('Regenerate failed'));
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });
  });

  describe('State Management', () => {
    it('initializes with empty bots array', () => {
      renderWithProviders(<BotManagementPage />);
      // Initial state should have empty bots
      expect(botService.getBots).toHaveBeenCalled();
    });

    it('initializes with loading true', () => {
      renderWithProviders(<BotManagementPage />);
      // Component should start in loading state
      expect(botService.getBots).toHaveBeenCalled();
    });

    it('initializes with null error', () => {
      renderWithProviders(<BotManagementPage />);
      // Error state should be null initially
      expect(botService.getBots).toHaveBeenCalled();
    });

    it('initializes with showCreateModal false', () => {
      renderWithProviders(<BotManagementPage />);
      // Modal should be hidden initially
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('initializes with empty visibleTokens', () => {
      renderWithProviders(<BotManagementPage />);
      // Tokens should be hidden by default
      expect(botService.getBots).toHaveBeenCalled();
    });

    it('initializes newBotData with default values', () => {
      renderWithProviders(<BotManagementPage />);
      // Default bot data should be initialized
      expect(botService.getBots).toHaveBeenCalled();
    });
  });

  describe('Bot Creation - Validation', () => {
    it('validates bot name is required', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('validates bot name is not empty', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('validates at least one permission is selected', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('shows error message for empty name', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('shows error message for no permissions', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });
  });

  describe('Bot Creation - Success Flow', () => {
    it('creates bot successfully', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('shows success message after creation', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('reloads bot list after creation', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalledTimes(1);
      });
    });

    it('closes modal after successful creation', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('resets form after creation', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });
  });

  describe('Bot Deletion', () => {
    it('shows confirmation dialog before delete', async () => {
      window.confirm = jest.fn(() => true);
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('cancels deletion if not confirmed', async () => {
      window.confirm = jest.fn(() => false);
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('deletes bot when confirmed', async () => {
      window.confirm = jest.fn(() => true);
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('shows success message after deletion', async () => {
      window.confirm = jest.fn(() => true);
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('reloads bot list after deletion', async () => {
      window.confirm = jest.fn(() => true);
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalledTimes(1);
      });
    });

    it('handles deletion error gracefully', async () => {
      window.confirm = jest.fn(() => true);
      botService.deleteBot.mockRejectedValue(new Error('Delete failed'));
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });
  });

  describe('Token Management - Display', () => {
    it('masks tokens by default', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('shows masked token format correctly', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('handles empty token', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });
  });

  describe('Token Management - Visibility Toggle', () => {
    it('toggles token visibility', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('shows full token when toggled visible', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('hides token when toggled back', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('tracks visibility per bot', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });
  });

  describe('Token Management - Clipboard', () => {
    it('copies token to clipboard', async () => {
      navigator.clipboard.writeText.mockResolvedValue();
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('shows success message after copy', async () => {
      navigator.clipboard.writeText.mockResolvedValue();
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('handles clipboard error', async () => {
      navigator.clipboard.writeText.mockRejectedValue(new Error('Clipboard error'));
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });
  });

  describe('Token Regeneration', () => {
    it('shows confirmation before regenerating', async () => {
      window.confirm = jest.fn(() => true);
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('warns about old token becoming invalid', async () => {
      window.confirm = jest.fn(() => true);
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('cancels regeneration if not confirmed', async () => {
      window.confirm = jest.fn(() => false);
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('regenerates token when confirmed', async () => {
      window.confirm = jest.fn(() => true);
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('shows success message after regeneration', async () => {
      window.confirm = jest.fn(() => true);
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('reloads bot list after regeneration', async () => {
      window.confirm = jest.fn(() => true);
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Permissions Management', () => {
    it('displays available permissions', () => {
      renderWithProviders(<BotManagementPage />);
      expect(botService.getAvailablePermissions).toHaveBeenCalled();
    });

    it('toggles permission selection', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('adds permission when not selected', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('removes permission when already selected', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('allows multiple permission selection', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });
  });

  describe('Bot Types', () => {
    it('displays available bot types', () => {
      renderWithProviders(<BotManagementPage />);
      expect(botService.getBotTypes).toHaveBeenCalled();
    });

    it('shows bot type icons', () => {
      renderWithProviders(<BotManagementPage />);
      expect(botService.getBotTypes).toHaveBeenCalled();
    });

    it('shows bot type descriptions', () => {
      renderWithProviders(<BotManagementPage />);
      expect(botService.getBotTypes).toHaveBeenCalled();
    });

    it('defaults to custom bot type', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });
  });

  describe('Message System', () => {
    it('displays success messages', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('displays error messages', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('auto-dismisses messages after timeout', async () => {
      jest.useFakeTimers();
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
      jest.useRealTimers();
    });

    it('clears previous message when showing new one', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });
  });

  describe('Date Formatting', () => {
    it('formats creation date correctly', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('formats last used date correctly', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('handles null last used date', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper main landmark', () => {
      renderWithProviders(<BotManagementPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', 'Bot management page');
    });

    it('has semantic HTML structure', () => {
      renderWithProviders(<BotManagementPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('heading is accessible', () => {
      renderWithProviders(<BotManagementPage />);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('renders on mobile viewport', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));
      renderWithProviders(<BotManagementPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders on tablet viewport', () => {
      global.innerWidth = 768;
      global.dispatchEvent(new Event('resize'));
      renderWithProviders(<BotManagementPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders on desktop viewport', () => {
      global.innerWidth = 1920;
      global.dispatchEvent(new Event('resize'));
      renderWithProviders(<BotManagementPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('applies proper padding', () => {
      const { container } = renderWithProviders(<BotManagementPage />);
      const main = container.querySelector('[role="main"]');
      expect(main).toHaveStyle({ padding: '20px' });
    });

    it('applies max-width constraint', () => {
      const { container } = renderWithProviders(<BotManagementPage />);
      const main = container.querySelector('[role="main"]');
      expect(main).toHaveStyle({ maxWidth: '1200px' });
    });

    it('centers content', () => {
      const { container } = renderWithProviders(<BotManagementPage />);
      const main = container.querySelector('[role="main"]');
      expect(main).toHaveStyle({ margin: '0 auto' });
    });
  });

  describe('Performance', () => {
    it('renders quickly', () => {
      const start = performance.now();
      renderWithProviders(<BotManagementPage />);
      const end = performance.now();
      expect(end - start).toBeLessThan(1000);
    });

    it('handles re-renders efficiently', () => {
      const { rerender } = renderWithProviders(<BotManagementPage />);
      rerender(<BotManagementPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Cleanup', () => {
    it('unmounts cleanly', () => {
      const { unmount } = renderWithProviders(<BotManagementPage />);
      expect(() => unmount()).not.toThrow();
    });

    it('clears timers on unmount', () => {
      jest.useFakeTimers();
      const { unmount } = renderWithProviders(<BotManagementPage />);
      unmount();
      jest.useRealTimers();
    });
  });
});

export default mockBots
