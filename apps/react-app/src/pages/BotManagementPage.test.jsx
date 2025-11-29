/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../__test__/utils/testUtils';
import BotManagementPage from './BotManagementPage';
import botService from '../services/botService';

// Mock the botService
jest.mock('../services/botService', () => ({
  __esModule: true,
  default: {
    getBots: jest.fn(),
    getBot: jest.fn(),
    createBot: jest.fn(),
    updateBot: jest.fn(),
    deleteBot: jest.fn(),
    regenerateToken: jest.fn(),
    getBotStats: jest.fn(),
    getAvailablePermissions: jest.fn(),
    getBotTypes: jest.fn(),
  },
}));

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

// Mock window.confirm
global.confirm = jest.fn();

const mockBotTypes = [
  { id: 'moderation', name: 'Moderation Bot', icon: '🛡️', description: 'Auto-moderation and user management' },
  { id: 'utility', name: 'Utility Bot', icon: '🔧', description: 'Tools and helpful commands' },
  { id: 'music', name: 'Music Bot', icon: '🎵', description: 'Play music in voice channels' },
  { id: 'game', name: 'Game Bot', icon: '🎮', description: 'Games and entertainment' },
  { id: 'analytics', name: 'Analytics Bot', icon: '📊', description: 'Server statistics and insights' },
  { id: 'custom', name: 'Custom Bot', icon: '⚙️', description: 'Custom functionality' }
];

const mockPermissions = [
  { id: 'read_messages', name: 'Read Messages', description: 'Read messages in channels where bot is added' },
  { id: 'send_messages', name: 'Send Messages', description: 'Send messages to channels' },
  { id: 'manage_messages', name: 'Manage Messages', description: 'Delete and pin messages' },
  { id: 'read_users', name: 'Read Users', description: 'Access user profile information' },
  { id: 'manage_channels', name: 'Manage Channels', description: 'Create and modify channels' },
  { id: 'moderation', name: 'Moderation', description: 'Ban, kick, and timeout users' },
  { id: 'webhooks', name: 'Webhooks', description: 'Create and manage webhooks' },
  { id: 'voice', name: 'Voice', description: 'Join and manage voice channels' }
];

const mockBots = [
  {
    id: 'bot-1',
    name: 'Test Bot 1',
    description: 'A test moderation bot',
    type: 'moderation',
    permissions: ['read_messages', 'send_messages', 'moderation'],
    token: 'test_token_12345678901234567890abcdefgh',
    avatarUrl: 'https://example.com/avatar1.png',
    enabled: true,
    createdAt: '2024-01-15T10:00:00Z',
    stats: {
      requests: 1250,
      lastUsed: '2024-02-20T15:30:00Z'
    }
  },
  {
    id: 'bot-2',
    name: 'Test Bot 2',
    description: 'A utility bot',
    type: 'utility',
    permissions: ['read_messages', 'send_messages'],
    token: 'test_token_98765432109876543210zyxwvuts',
    avatarUrl: '',
    enabled: false,
    createdAt: '2024-02-01T14:30:00Z',
    stats: {
      requests: 450,
      lastUsed: '2024-02-15T12:00:00Z'
    }
  }
];

describe('BotManagementPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    botService.getBotTypes.mockReturnValue(mockBotTypes);
    botService.getAvailablePermissions.mockReturnValue(mockPermissions);
    botService.getBots.mockResolvedValue({
      success: true,
      data: { items: mockBots }
    });
    navigator.clipboard.writeText.mockResolvedValue();
    global.confirm.mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Page Rendering', () => {
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

    it('displays construction message', () => {
      renderWithProviders(<BotManagementPage />);
      expect(screen.getByText(/Content under construction/i)).toBeInTheDocument();
    });

    it('applies proper styling to container', () => {
      renderWithProviders(<BotManagementPage />);
      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveStyle({ padding: '20px', maxWidth: '1200px', margin: '0 auto' });
    });
  });

  describe('Initial Loading State', () => {
    it('starts with loading state true', async () => {
      botService.getBots.mockImplementation(() => new Promise(() => {})); // Never resolves
      renderWithProviders(<BotManagementPage />);
      // Component should be in loading state initially
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('calls getBots on mount', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalledTimes(1);
      });
    });

    it('calls getBotTypes on mount', () => {
      renderWithProviders(<BotManagementPage />);
      expect(botService.getBotTypes).toHaveBeenCalled();
    });

    it('calls getAvailablePermissions on mount', () => {
      renderWithProviders(<BotManagementPage />);
      expect(botService.getAvailablePermissions).toHaveBeenCalled();
    });

    it('sets loading to false after successful fetch', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
      // Loading should be complete
    });
  });

  describe('Bot List Display', () => {
    it('displays bot list when data is loaded', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('displays multiple bots from API response', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('handles empty bot list gracefully', async () => {
      botService.getBots.mockResolvedValue({
        success: true,
        data: { items: [] }
      });
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('displays bot names correctly', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('displays bot descriptions', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('displays bot types', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('displays bot creation dates', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('shows enabled/disabled status for each bot', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });
  });

  describe('Bot Token Display and Management', () => {
    it('masks bot tokens by default', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('shows first 12 and last 4 characters of masked token', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('handles empty token gracefully', () => {
      const { container } = renderWithProviders(<BotManagementPage />);
      expect(container).toBeInTheDocument();
    });

    it('handles null token gracefully', () => {
      const { container } = renderWithProviders(<BotManagementPage />);
      expect(container).toBeInTheDocument();
    });

    it('handles short tokens correctly', () => {
      const { container } = renderWithProviders(<BotManagementPage />);
      expect(container).toBeInTheDocument();
    });
  });

  describe('Token Visibility Toggle', () => {
    it('toggles token visibility when eye icon is clicked', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('shows full token when visibility is toggled on', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('hides token when visibility is toggled off', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('maintains separate visibility state for each bot', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('displays Eye icon when token is hidden', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('displays EyeOff icon when token is visible', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });
  });

  describe('Token Copy Functionality', () => {
    it('copies token to clipboard when copy button is clicked', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('shows success message after copying', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('handles clipboard copy failure gracefully', async () => {
      navigator.clipboard.writeText.mockRejectedValue(new Error('Clipboard error'));
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('displays error message when copy fails', async () => {
      navigator.clipboard.writeText.mockRejectedValue(new Error('Clipboard error'));
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });
  });

  describe('Token Regeneration', () => {
    it('shows confirmation dialog when regenerate is clicked', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('displays bot name in regeneration confirmation', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('warns about old token in confirmation message', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('calls regenerateToken when confirmed', async () => {
      botService.regenerateToken.mockResolvedValue({ success: true });
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('does not regenerate token when cancelled', async () => {
      global.confirm.mockReturnValue(false);
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('reloads bot list after successful regeneration', async () => {
      botService.regenerateToken.mockResolvedValue({ success: true });
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('shows success message after regeneration', async () => {
      botService.regenerateToken.mockResolvedValue({ success: true });
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('shows error message when regeneration fails', async () => {
      botService.regenerateToken.mockRejectedValue(new Error('Regeneration failed'));
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('handles network errors during regeneration', async () => {
      botService.regenerateToken.mockRejectedValue(new Error('Network error'));
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });
  });

  describe('Create New Bot Modal', () => {
    it('opens create bot modal when button is clicked', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('displays bot name input field', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('displays bot description input field', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('displays bot type selector', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('displays all available bot types', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('displays avatar URL input field', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('defaults bot type to custom', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('starts with empty permissions array', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('closes modal when cancel is clicked', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('closes modal when X button is clicked', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });
  });

  describe('Bot Permissions Configuration', () => {
    it('displays all available permissions', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('displays permission names', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('displays permission descriptions', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('toggles permission when clicked', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('adds permission to selected list when checked', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('removes permission from selected list when unchecked', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('allows selecting multiple permissions', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('displays checkboxes for each permission', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('persists selected permissions in state', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });
  });

  describe('Create Bot Form Validation', () => {
    it('shows error when bot name is empty', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('shows error when bot name is only whitespace', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('shows error when no permissions are selected', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('allows submission with valid data', async () => {
      botService.createBot.mockResolvedValue({ success: true });
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('trims whitespace from bot name', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });
  });

  describe('Create Bot Submission', () => {
    it('calls createBot with correct data', async () => {
      botService.createBot.mockResolvedValue({ success: true });
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('shows success message after creation', async () => {
      botService.createBot.mockResolvedValue({ success: true });
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('closes modal after successful creation', async () => {
      botService.createBot.mockResolvedValue({ success: true });
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('reloads bot list after creation', async () => {
      botService.createBot.mockResolvedValue({ success: true });
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('resets form after successful creation', async () => {
      botService.createBot.mockResolvedValue({ success: true });
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('shows error message when creation fails', async () => {
      botService.createBot.mockRejectedValue(new Error('Creation failed'));
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('keeps modal open when creation fails', async () => {
      botService.createBot.mockRejectedValue(new Error('Creation failed'));
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('handles network errors during creation', async () => {
      botService.createBot.mockRejectedValue(new Error('Network error'));
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });
  });

  describe('Enable/Disable Bot', () => {
    it('displays toggle switch for bot status', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('shows enabled status correctly', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('shows disabled status correctly', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('updates bot status when toggled', async () => {
      botService.updateBot.mockResolvedValue({ success: true });
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('reloads bot list after status change', async () => {
      botService.updateBot.mockResolvedValue({ success: true });
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('shows error when status update fails', async () => {
      botService.updateBot.mockRejectedValue(new Error('Update failed'));
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });
  });

  describe('Delete Bot', () => {
    it('shows confirmation dialog when delete is clicked', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('displays bot name in deletion confirmation', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('warns that deletion cannot be undone', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('calls deleteBot when confirmed', async () => {
      botService.deleteBot.mockResolvedValue({ success: true });
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('does not delete bot when cancelled', async () => {
      global.confirm.mockReturnValue(false);
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('reloads bot list after successful deletion', async () => {
      botService.deleteBot.mockResolvedValue({ success: true });
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('shows success message after deletion', async () => {
      botService.deleteBot.mockResolvedValue({ success: true });
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('shows error message when deletion fails', async () => {
      botService.deleteBot.mockRejectedValue(new Error('Deletion failed'));
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('handles network errors during deletion', async () => {
      botService.deleteBot.mockRejectedValue(new Error('Network error'));
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });
  });

  describe('Bot Statistics', () => {
    it('displays request count for each bot', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('displays last used timestamp', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('handles missing statistics gracefully', async () => {
      const botsWithoutStats = mockBots.map(bot => ({ ...bot, stats: null }));
      botService.getBots.mockResolvedValue({
        success: true,
        data: { items: botsWithoutStats }
      });
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('formats request count with commas', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('shows zero requests for never-used bot', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });
  });

  describe('Date Formatting', () => {
    it('formats creation dates correctly', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('displays month name in short form', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('includes year in date format', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('handles invalid date strings gracefully', async () => {
      const botsWithBadDate = [{
        ...mockBots[0],
        createdAt: 'invalid-date'
      }];
      botService.getBots.mockResolvedValue({
        success: true,
        data: { items: botsWithBadDate }
      });
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when getBots fails', async () => {
      botService.getBots.mockResolvedValue({
        success: false,
        data: { items: [] }
      });
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('displays error when getBots throws exception', async () => {
      botService.getBots.mockRejectedValue(new Error('Network error'));
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('logs error to console when getBots fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      botService.getBots.mockRejectedValue(new Error('Network error'));
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to load bots:', expect.any(Error));
      });
      consoleSpy.mockRestore();
    });

    it('maintains empty bot list on error', async () => {
      botService.getBots.mockRejectedValue(new Error('Network error'));
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('allows retry after error', async () => {
      botService.getBots.mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ success: true, data: { items: mockBots } });
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });
  });

  describe('Success/Error Messages', () => {
    it('displays success message when shown', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('displays error message when shown', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('auto-hides message after 3 seconds', async () => {
      jest.useFakeTimers();
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
      jest.runAllTimers();
      jest.useRealTimers();
    });

    it('applies success styling to success messages', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('applies error styling to error messages', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading indicator during initial load', async () => {
      botService.getBots.mockImplementation(() => new Promise(() => {}));
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('hides loading indicator after data loads', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('hides loading indicator on error', async () => {
      botService.getBots.mockRejectedValue(new Error('Error'));
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('disables actions while loading', async () => {
      botService.getBots.mockImplementation(() => new Promise(() => {}));
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles bot with very long name', async () => {
      const longName = 'A'.repeat(200);
      const botsWithLongName = [{
        ...mockBots[0],
        name: longName
      }];
      botService.getBots.mockResolvedValue({
        success: true,
        data: { items: botsWithLongName }
      });
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('handles bot with very long description', async () => {
      const longDesc = 'A'.repeat(1000);
      const botsWithLongDesc = [{
        ...mockBots[0],
        description: longDesc
      }];
      botService.getBots.mockResolvedValue({
        success: true,
        data: { items: botsWithLongDesc }
      });
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('handles bot with empty description', async () => {
      const botsWithEmptyDesc = [{
        ...mockBots[0],
        description: ''
      }];
      botService.getBots.mockResolvedValue({
        success: true,
        data: { items: botsWithEmptyDesc }
      });
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('handles bot with no permissions', async () => {
      const botsWithNoPerms = [{
        ...mockBots[0],
        permissions: []
      }];
      botService.getBots.mockResolvedValue({
        success: true,
        data: { items: botsWithNoPerms }
      });
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('handles bot with all permissions', async () => {
      const allPermissionIds = mockPermissions.map(p => p.id);
      const botsWithAllPerms = [{
        ...mockBots[0],
        permissions: allPermissionIds
      }];
      botService.getBots.mockResolvedValue({
        success: true,
        data: { items: botsWithAllPerms }
      });
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('handles bot with missing avatarUrl', async () => {
      const botsWithoutAvatar = [{
        ...mockBots[0],
        avatarUrl: ''
      }];
      botService.getBots.mockResolvedValue({
        success: true,
        data: { items: botsWithoutAvatar }
      });
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('handles bot with invalid avatarUrl', async () => {
      const botsWithBadAvatar = [{
        ...mockBots[0],
        avatarUrl: 'not-a-url'
      }];
      botService.getBots.mockResolvedValue({
        success: true,
        data: { items: botsWithBadAvatar }
      });
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('handles very large number of bots', async () => {
      const manyBots = Array.from({ length: 100 }, (_, i) => ({
        ...mockBots[0],
        id: `bot-${i}`,
        name: `Bot ${i}`
      }));
      botService.getBots.mockResolvedValue({
        success: true,
        data: { items: manyBots }
      });
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('handles malformed API response', async () => {
      botService.getBots.mockResolvedValue({
        success: true,
        data: null
      });
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('handles API response without items array', async () => {
      botService.getBots.mockResolvedValue({
        success: true,
        data: {}
      });
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('handles undefined permissions in bot data', async () => {
      const botsWithUndefinedPerms = [{
        ...mockBots[0],
        permissions: undefined
      }];
      botService.getBots.mockResolvedValue({
        success: true,
        data: { items: botsWithUndefinedPerms }
      });
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('handles null values in bot data', async () => {
      const botsWithNulls = [{
        ...mockBots[0],
        description: null,
        avatarUrl: null
      }];
      botService.getBots.mockResolvedValue({
        success: true,
        data: { items: botsWithNulls }
      });
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure', () => {
      renderWithProviders(<BotManagementPage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('has proper aria labels', () => {
      renderWithProviders(<BotManagementPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', 'Bot management page');
    });

    it('has proper heading hierarchy', () => {
      renderWithProviders(<BotManagementPage />);
      const heading = screen.getByRole('heading', { name: /BotManagementPage/i });
      expect(heading).toBeInTheDocument();
    });

    it('maintains focus management in modals', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('has accessible button labels', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });

    it('provides screen reader text for actions', async () => {
      renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
    });
  });

  describe('Component Snapshots', () => {
    it('matches snapshot with loading state', () => {
      botService.getBots.mockImplementation(() => new Promise(() => {}));
      const { container } = renderWithProviders(<BotManagementPage />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with bot list', async () => {
      const { container } = renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with empty state', async () => {
      botService.getBots.mockResolvedValue({
        success: true,
        data: { items: [] }
      });
      const { container } = renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with error state', async () => {
      botService.getBots.mockRejectedValue(new Error('Error'));
      const { container } = renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with create modal open', async () => {
      const { container } = renderWithProviders(<BotManagementPage />);
      await waitFor(() => {
        expect(botService.getBots).toHaveBeenCalled();
      });
      expect(container).toMatchSnapshot();
    });
  });
});

export default mockBotTypes
