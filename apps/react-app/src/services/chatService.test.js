/**
 * Tests for chatService
 */
import chatService from './chatService';
import apiService from './api';
import websocketService from './websocketService';

jest.mock('./api');
jest.mock('./websocketService', () => ({
  on: jest.fn(),
  emit: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn()
}));
jest.mock('./channelService');

describe('chatService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    if (chatService.channels) chatService.channels.clear();
    if (chatService.servers) chatService.servers.clear();
    if (chatService.directMessages) chatService.directMessages.clear();
    chatService.isInitialized = false;
    chatService.currentUser = null;
  });

  describe('initialization', () => {
    it('starts in uninitialized state', () => {
      expect(chatService.isInitialized).toBe(false);
    });

    it('has channel storage', () => {
      expect(chatService.channels).toBeDefined();
    });

    it('has server storage', () => {
      expect(chatService.servers).toBeDefined();
    });
  });

  describe('WebSocket integration', () => {
    it('sets up WebSocket handlers', () => {
      expect(websocketService.on).toHaveBeenCalled();
    });
  });

  describe('message operations', () => {
    it('sends message successfully', async () => {
      const mockMessage = {
        channelId: 'channel-1',
        content: 'Test message'
      };

      apiService.post.mockResolvedValue({
        success: true,
        data: { message: { ...mockMessage, id: '1' } }
      });

      const result = await chatService.sendMessage(mockMessage);

      expect(apiService.post).toHaveBeenCalled();
    });

    it('handles send errors', async () => {
      apiService.post.mockRejectedValue(new Error('Failed'));

      const result = await chatService.sendMessage({
        channelId: 'test',
        content: 'msg'
      });

      expect(result.success).toBe(false);
    });
  });
});
