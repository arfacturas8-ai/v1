/**
 * Tests for botService
 */
import botService from './botService';
import api from './api';

jest.mock('./api');

describe('botService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBots', () => {
    it('fetches all bots', async () => {
      const mockBots = {
        success: true,
        data: {
          items: [
            { id: 'bot-1', name: 'Moderation Bot', type: 'moderation' },
            { id: 'bot-2', name: 'Music Bot', type: 'music' }
          ]
        }
      };
      api.get.mockResolvedValue(mockBots);

      const result = await botService.getBots();

      expect(api.get).toHaveBeenCalledWith('/bots');
      expect(result).toEqual(mockBots);
    });

    it('returns fallback on API failure', async () => {
      api.get.mockRejectedValue(new Error('Network error'));

      const result = await botService.getBots();

      expect(result).toEqual({ success: false, data: { items: [] } });
    });

    it('returns fallback on server error', async () => {
      api.get.mockRejectedValue(new Error('500 Internal Server Error'));

      const result = await botService.getBots();

      expect(result.success).toBe(false);
      expect(result.data.items).toEqual([]);
    });
  });

  describe('getBot', () => {
    it('fetches single bot details', async () => {
      const mockBot = {
        success: true,
        data: {
          id: 'bot-1',
          name: 'Moderation Bot',
          token: 'bot_abc123',
          permissions: ['read_messages', 'send_messages']
        }
      };
      api.get.mockResolvedValue(mockBot);

      const result = await botService.getBot('bot-1');

      expect(api.get).toHaveBeenCalledWith('/bots/bot-1');
      expect(result).toEqual(mockBot);
    });

    it('throws error when bot not found', async () => {
      api.get.mockRejectedValue(new Error('Bot not found'));

      await expect(botService.getBot('invalid')).rejects.toThrow('Bot not found');
    });

    it('throws error on unauthorized access', async () => {
      api.get.mockRejectedValue(new Error('Unauthorized'));

      await expect(botService.getBot('bot-1')).rejects.toThrow('Unauthorized');
    });
  });

  describe('createBot', () => {
    it('creates a new bot', async () => {
      const botData = {
        name: 'New Bot',
        type: 'utility',
        permissions: ['read_messages', 'send_messages']
      };
      const mockResponse = {
        success: true,
        data: {
          id: 'bot-3',
          ...botData,
          token: 'bot_xyz789'
        }
      };
      api.post.mockResolvedValue(mockResponse);

      const result = await botService.createBot(botData);

      expect(api.post).toHaveBeenCalledWith('/bots', botData);
      expect(result).toEqual(mockResponse);
    });

    it('creates bot with default values', async () => {
      const botData = {
        name: 'Simple Bot'
      };
      const mockResponse = { success: true, data: { id: 'bot-4', name: 'Simple Bot' } };
      api.post.mockResolvedValue(mockResponse);

      const result = await botService.createBot(botData);

      expect(api.post).toHaveBeenCalledWith('/bots', botData);
      expect(result.success).toBe(true);
    });

    it('throws error on invalid data', async () => {
      api.post.mockRejectedValue(new Error('Validation error: name is required'));

      await expect(botService.createBot({})).rejects.toThrow('Validation error');
    });

    it('throws error when limit exceeded', async () => {
      api.post.mockRejectedValue(new Error('Bot limit exceeded'));

      await expect(botService.createBot({ name: 'Too Many Bots' })).rejects.toThrow('Bot limit exceeded');
    });
  });

  describe('updateBot', () => {
    it('updates bot configuration', async () => {
      const updates = {
        name: 'Updated Bot Name',
        permissions: ['read_messages', 'send_messages', 'manage_messages']
      };
      const mockResponse = {
        success: true,
        data: {
          id: 'bot-1',
          ...updates
        }
      };
      api.patch.mockResolvedValue(mockResponse);

      const result = await botService.updateBot('bot-1', updates);

      expect(api.patch).toHaveBeenCalledWith('/bots/bot-1', updates);
      expect(result).toEqual(mockResponse);
    });

    it('updates single field', async () => {
      const updates = { name: 'New Name' };
      const mockResponse = { success: true, data: { id: 'bot-1', name: 'New Name' } };
      api.patch.mockResolvedValue(mockResponse);

      await botService.updateBot('bot-1', updates);

      expect(api.patch).toHaveBeenCalledWith('/bots/bot-1', updates);
    });

    it('updates permissions', async () => {
      const updates = { permissions: ['moderation', 'manage_channels'] };
      const mockResponse = { success: true };
      api.patch.mockResolvedValue(mockResponse);

      await botService.updateBot('bot-1', updates);

      expect(api.patch).toHaveBeenCalledWith('/bots/bot-1', updates);
    });

    it('throws error when bot not found', async () => {
      api.patch.mockRejectedValue(new Error('Bot not found'));

      await expect(botService.updateBot('invalid', { name: 'Test' })).rejects.toThrow('Bot not found');
    });

    it('throws error on update failure', async () => {
      api.patch.mockRejectedValue(new Error('Update failed'));

      await expect(botService.updateBot('bot-1', { name: 'Test' })).rejects.toThrow('Update failed');
    });
  });

  describe('deleteBot', () => {
    it('deletes a bot', async () => {
      const mockResponse = { success: true };
      api.delete.mockResolvedValue(mockResponse);

      const result = await botService.deleteBot('bot-1');

      expect(api.delete).toHaveBeenCalledWith('/bots/bot-1');
      expect(result).toEqual(mockResponse);
    });

    it('throws error when bot not found', async () => {
      api.delete.mockRejectedValue(new Error('Bot not found'));

      await expect(botService.deleteBot('invalid')).rejects.toThrow('Bot not found');
    });

    it('throws error on unauthorized delete', async () => {
      api.delete.mockRejectedValue(new Error('Unauthorized'));

      await expect(botService.deleteBot('bot-1')).rejects.toThrow('Unauthorized');
    });
  });

  describe('regenerateToken', () => {
    it('regenerates bot token', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'bot-1',
          token: 'bot_new_token_123'
        }
      };
      api.post.mockResolvedValue(mockResponse);

      const result = await botService.regenerateToken('bot-1');

      expect(api.post).toHaveBeenCalledWith('/bots/bot-1/regenerate-token');
      expect(result).toEqual(mockResponse);
    });

    it('returns new token on success', async () => {
      const mockResponse = {
        success: true,
        data: { token: 'bot_new_token_456' }
      };
      api.post.mockResolvedValue(mockResponse);

      const result = await botService.regenerateToken('bot-1');

      expect(result.data.token).toBeDefined();
      expect(result.data.token).toContain('bot_');
    });

    it('throws error when bot not found', async () => {
      api.post.mockRejectedValue(new Error('Bot not found'));

      await expect(botService.regenerateToken('invalid')).rejects.toThrow('Bot not found');
    });
  });

  describe('getBotStats', () => {
    it('fetches bot statistics', async () => {
      const mockStats = {
        success: true,
        data: {
          requests: 1500,
          lastUsed: '2024-01-15T10:30:00Z',
          commandUsage: {
            '/help': 500,
            '/kick': 300
          }
        }
      };
      api.get.mockResolvedValue(mockStats);

      const result = await botService.getBotStats('bot-1');

      expect(api.get).toHaveBeenCalledWith('/bots/bot-1/stats');
      expect(result).toEqual(mockStats);
    });

    it('returns fallback on API failure', async () => {
      api.get.mockRejectedValue(new Error('Stats unavailable'));

      const result = await botService.getBotStats('bot-1');

      expect(result).toEqual({
        success: false,
        data: { requests: 0, lastUsed: null }
      });
    });

    it('returns fallback on network error', async () => {
      api.get.mockRejectedValue(new Error('Network timeout'));

      const result = await botService.getBotStats('bot-1');

      expect(result.success).toBe(false);
      expect(result.data.requests).toBe(0);
      expect(result.data.lastUsed).toBeNull();
    });
  });

  describe('getAvailablePermissions', () => {
    it('returns all available permissions', () => {
      const permissions = botService.getAvailablePermissions();

      expect(permissions).toHaveLength(8);
      expect(permissions).toEqual([
        { id: 'read_messages', name: 'Read Messages', description: 'Read messages in channels where bot is added' },
        { id: 'send_messages', name: 'Send Messages', description: 'Send messages to channels' },
        { id: 'manage_messages', name: 'Manage Messages', description: 'Delete and pin messages' },
        { id: 'read_users', name: 'Read Users', description: 'Access user profile information' },
        { id: 'manage_channels', name: 'Manage Channels', description: 'Create and modify channels' },
        { id: 'moderation', name: 'Moderation', description: 'Ban, kick, and timeout users' },
        { id: 'webhooks', name: 'Webhooks', description: 'Create and manage webhooks' },
        { id: 'voice', name: 'Voice', description: 'Join and manage voice channels' }
      ]);
    });

    it('returns same permissions on multiple calls', () => {
      const permissions1 = botService.getAvailablePermissions();
      const permissions2 = botService.getAvailablePermissions();

      expect(permissions1).toEqual(permissions2);
    });

    it('includes read messages permission', () => {
      const permissions = botService.getAvailablePermissions();
      const readMessages = permissions.find(p => p.id === 'read_messages');

      expect(readMessages).toBeDefined();
      expect(readMessages.name).toBe('Read Messages');
    });

    it('includes send messages permission', () => {
      const permissions = botService.getAvailablePermissions();
      const sendMessages = permissions.find(p => p.id === 'send_messages');

      expect(sendMessages).toBeDefined();
    });

    it('includes manage messages permission', () => {
      const permissions = botService.getAvailablePermissions();
      const manageMessages = permissions.find(p => p.id === 'manage_messages');

      expect(manageMessages).toBeDefined();
    });

    it('includes read users permission', () => {
      const permissions = botService.getAvailablePermissions();
      const readUsers = permissions.find(p => p.id === 'read_users');

      expect(readUsers).toBeDefined();
    });

    it('includes manage channels permission', () => {
      const permissions = botService.getAvailablePermissions();
      const manageChannels = permissions.find(p => p.id === 'manage_channels');

      expect(manageChannels).toBeDefined();
    });

    it('includes moderation permission', () => {
      const permissions = botService.getAvailablePermissions();
      const moderation = permissions.find(p => p.id === 'moderation');

      expect(moderation).toBeDefined();
    });

    it('includes webhooks permission', () => {
      const permissions = botService.getAvailablePermissions();
      const webhooks = permissions.find(p => p.id === 'webhooks');

      expect(webhooks).toBeDefined();
    });

    it('includes voice permission', () => {
      const permissions = botService.getAvailablePermissions();
      const voice = permissions.find(p => p.id === 'voice');

      expect(voice).toBeDefined();
    });
  });

  describe('getBotTypes', () => {
    it('returns all bot types', () => {
      const types = botService.getBotTypes();

      expect(types).toHaveLength(6);
      expect(types).toEqual([
        { id: 'moderation', name: 'Moderation Bot', icon: '🛡️', description: 'Auto-moderation and user management' },
        { id: 'utility', name: 'Utility Bot', icon: '🔧', description: 'Tools and helpful commands' },
        { id: 'music', name: 'Music Bot', icon: '🎵', description: 'Play music in voice channels' },
        { id: 'game', name: 'Game Bot', icon: '🎮', description: 'Games and entertainment' },
        { id: 'analytics', name: 'Analytics Bot', icon: '📊', description: 'Server statistics and insights' },
        { id: 'custom', name: 'Custom Bot', icon: '⚙️', description: 'Custom functionality' }
      ]);
    });

    it('returns same types on multiple calls', () => {
      const types1 = botService.getBotTypes();
      const types2 = botService.getBotTypes();

      expect(types1).toEqual(types2);
    });

    it('includes moderation bot type', () => {
      const types = botService.getBotTypes();
      const moderation = types.find(t => t.id === 'moderation');

      expect(moderation).toBeDefined();
      expect(moderation.name).toBe('Moderation Bot');
      expect(moderation.icon).toBe('🛡️');
    });

    it('includes utility bot type', () => {
      const types = botService.getBotTypes();
      const utility = types.find(t => t.id === 'utility');

      expect(utility).toBeDefined();
    });

    it('includes music bot type', () => {
      const types = botService.getBotTypes();
      const music = types.find(t => t.id === 'music');

      expect(music).toBeDefined();
    });

    it('includes game bot type', () => {
      const types = botService.getBotTypes();
      const game = types.find(t => t.id === 'game');

      expect(game).toBeDefined();
    });

    it('includes analytics bot type', () => {
      const types = botService.getBotTypes();
      const analytics = types.find(t => t.id === 'analytics');

      expect(analytics).toBeDefined();
    });

    it('includes custom bot type', () => {
      const types = botService.getBotTypes();
      const custom = types.find(t => t.id === 'custom');

      expect(custom).toBeDefined();
    });
  });
});
