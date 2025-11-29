/**
 * Tests for reactionService
 */
import apiService from './api';
import { socket } from './socket';

jest.mock('./api');
jest.mock('./socket', () => ({
  socket: {
    on: jest.fn(),
    emit: jest.fn(),
    connected: true
  }
}));

// Import after mocks
import reactionService from './reactionService';

describe('reactionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    reactionService.cache.clear();
    // Reset window.dispatchEvent spy
    global.window.dispatchEvent = jest.fn();
  });

  describe('initialization', () => {
    it('sets up realtime listeners on initialization', () => {
      expect(socket.on).toHaveBeenCalledWith('reaction_added', expect.any(Function));
      expect(socket.on).toHaveBeenCalledWith('reaction_removed', expect.any(Function));
      expect(socket.on).toHaveBeenCalledWith('reaction_notification', expect.any(Function));
      expect(socket.on).toHaveBeenCalledWith('reaction_analytics', expect.any(Function));
      expect(socket.on).toHaveBeenCalledWith('trending_reactions', expect.any(Function));
    });

    it('has cache storage', () => {
      expect(reactionService.cache).toBeInstanceOf(Map);
    });
  });

  describe('addReaction', () => {
    it('adds a reaction successfully', async () => {
      apiService.post.mockResolvedValue({
        data: {
          success: true,
          data: {
            reactionType: 'like',
            summary: { likes: 1 }
          }
        }
      });

      const result = await reactionService.addReaction('post', 'post-1', 'like');

      expect(apiService.post).toHaveBeenCalledWith('/reactions', {
        contentType: 'post',
        contentId: 'post-1',
        reactionType: 'like',
        customEmojiName: undefined,
        customEmojiId: undefined
      });
      expect(result.reactionType).toBe('like');
    });

    it('adds reaction with custom emoji', async () => {
      apiService.post.mockResolvedValue({
        data: {
          success: true,
          data: {
            reactionType: 'custom',
            summary: {}
          }
        }
      });

      await reactionService.addReaction('post', 'post-1', 'custom', {
        customEmojiName: 'party',
        customEmojiId: 'emoji-123'
      });

      expect(apiService.post).toHaveBeenCalledWith('/reactions', {
        contentType: 'post',
        contentId: 'post-1',
        reactionType: 'custom',
        customEmojiName: 'party',
        customEmojiId: 'emoji-123'
      });
    });

    it('emits socket event for optimistic update', async () => {
      apiService.post.mockResolvedValue({
        data: {
          success: true,
          data: { summary: {} }
        }
      });

      await reactionService.addReaction('post', 'post-1', 'like');

      expect(socket.emit).toHaveBeenCalledWith('add_reaction', {
        contentType: 'post',
        contentId: 'post-1',
        reactionType: 'like',
        customEmojiName: undefined,
        customEmojiId: undefined
      });
    });

    it('updates cache on successful reaction', async () => {
      const mockSummary = { likes: 5, loves: 2 };
      apiService.post.mockResolvedValue({
        data: {
          success: true,
          data: { summary: mockSummary }
        }
      });

      await reactionService.addReaction('post', 'post-1', 'like');

      const cached = reactionService.cache.get('post:post-1');
      expect(cached.summary).toEqual(mockSummary);
    });

    it('handles errors gracefully', async () => {
      apiService.post.mockRejectedValue(new Error('Failed to add reaction'));

      await expect(
        reactionService.addReaction('post', 'post-1', 'like')
      ).rejects.toThrow('Failed to add reaction');
    });
  });

  describe('removeReaction', () => {
    it('removes a reaction successfully', async () => {
      apiService.delete.mockResolvedValue({
        data: {
          success: true,
          data: {
            summary: { likes: 0 }
          }
        }
      });

      const result = await reactionService.removeReaction('post', 'post-1', 'like');

      expect(apiService.delete).toHaveBeenCalledWith('/reactions', {
        data: {
          contentType: 'post',
          contentId: 'post-1',
          reactionType: 'like'
        }
      });
      expect(result.summary.likes).toBe(0);
    });

    it('emits socket event for optimistic update', async () => {
      apiService.delete.mockResolvedValue({
        data: {
          success: true,
          data: { summary: {} }
        }
      });

      await reactionService.removeReaction('comment', 'comment-1', 'love');

      expect(socket.emit).toHaveBeenCalledWith('remove_reaction', {
        contentType: 'comment',
        contentId: 'comment-1',
        reactionType: 'love'
      });
    });

    it('updates cache after removal', async () => {
      apiService.delete.mockResolvedValue({
        data: {
          success: true,
          data: { summary: { likes: 0 } }
        }
      });

      await reactionService.removeReaction('post', 'post-1', 'like');

      const cached = reactionService.cache.get('post:post-1');
      expect(cached.summary.likes).toBe(0);
    });
  });

  describe('toggleReaction', () => {
    it('adds reaction when not currently reacted', async () => {
      apiService.post.mockResolvedValue({
        data: {
          success: true,
          data: { summary: { likes: 1 } }
        }
      });

      await reactionService.toggleReaction('post', 'post-1', 'like', false);

      expect(apiService.post).toHaveBeenCalledWith('/reactions', expect.any(Object));
    });

    it('removes reaction when currently reacted', async () => {
      apiService.delete.mockResolvedValue({
        data: {
          success: true,
          data: { summary: { likes: 0 } }
        }
      });

      await reactionService.toggleReaction('post', 'post-1', 'like', true);

      expect(apiService.delete).toHaveBeenCalledWith('/reactions', expect.any(Object));
    });
  });

  describe('getReactions', () => {
    it('fetches reactions for content', async () => {
      const mockReactions = {
        reactions: [
          { type: 'like', count: 5 },
          { type: 'love', count: 2 }
        ],
        summary: { likes: 5, loves: 2 }
      };

      apiService.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReactions
        }
      });

      const result = await reactionService.getReactions('post', 'post-1');

      expect(apiService.get).toHaveBeenCalledWith(
        expect.stringContaining('/reactions/post/post-1')
      );
      expect(result.reactions).toHaveLength(2);
    });

    it('uses cache when available and fresh', async () => {
      const cachedData = {
        summary: { likes: 5 },
        lastUpdated: Date.now()
      };
      reactionService.cache.set('post:post-1', cachedData);

      const result = await reactionService.getReactions('post', 'post-1');

      expect(apiService.get).not.toHaveBeenCalled();
      expect(result.summary.likes).toBe(5);
    });

    it('bypasses cache when forced', async () => {
      const cachedData = {
        summary: { likes: 5 },
        lastUpdated: Date.now()
      };
      reactionService.cache.set('post:post-1', cachedData);

      apiService.get.mockResolvedValue({
        data: {
          success: true,
          data: { summary: { likes: 10 } }
        }
      });

      await reactionService.getReactions('post', 'post-1', { force: true });

      expect(apiService.get).toHaveBeenCalled();
    });

    it('includes pagination and filter options', async () => {
      apiService.get.mockResolvedValue({
        data: {
          success: true,
          data: { reactions: [] }
        }
      });

      await reactionService.getReactions('post', 'post-1', {
        page: 2,
        limit: 25,
        reactionType: 'like'
      });

      expect(apiService.get).toHaveBeenCalledWith(
        expect.stringContaining('page=2')
      );
      expect(apiService.get).toHaveBeenCalledWith(
        expect.stringContaining('limit=25')
      );
      expect(apiService.get).toHaveBeenCalledWith(
        expect.stringContaining('reactionType=like')
      );
    });
  });

  describe('getTrending', () => {
    it('fetches trending reactions', async () => {
      const mockTrending = [
        { contentId: 'post-1', reactionCount: 100 },
        { contentId: 'post-2', reactionCount: 75 }
      ];

      apiService.get.mockResolvedValue({
        data: {
          success: true,
          data: mockTrending
        }
      });

      const result = await reactionService.getTrending();

      expect(apiService.get).toHaveBeenCalledWith(
        expect.stringContaining('/reactions/trending')
      );
      expect(result).toEqual(mockTrending);
    });

    it('uses cache when available', async () => {
      const cachedTrending = [{ contentId: 'post-1', reactionCount: 100 }];
      reactionService.cache.set('trending', {
        data: cachedTrending,
        lastUpdated: Date.now()
      });

      const result = await reactionService.getTrending();

      expect(apiService.get).not.toHaveBeenCalled();
      expect(result).toEqual(cachedTrending);
    });

    it('supports timeframe and content type filters', async () => {
      apiService.get.mockResolvedValue({
        data: {
          success: true,
          data: []
        }
      });

      await reactionService.getTrending({
        period: '7d',
        limit: 20,
        contentType: 'post'
      });

      expect(apiService.get).toHaveBeenCalledWith(
        expect.stringContaining('period=7d')
      );
      expect(apiService.get).toHaveBeenCalledWith(
        expect.stringContaining('limit=20')
      );
      expect(apiService.get).toHaveBeenCalledWith(
        expect.stringContaining('contentType=post')
      );
    });
  });

  describe('getUserAnalytics', () => {
    it('fetches user reaction analytics', async () => {
      const mockAnalytics = {
        totalReactions: 150,
        byType: { like: 100, love: 50 }
      };

      apiService.get.mockResolvedValue({
        data: {
          success: true,
          data: mockAnalytics
        }
      });

      const result = await reactionService.getUserAnalytics();

      expect(apiService.get).toHaveBeenCalledWith(
        expect.stringContaining('/reactions/analytics/user')
      );
      expect(result.totalReactions).toBe(150);
    });

    it('supports timeframe and pagination', async () => {
      apiService.get.mockResolvedValue({
        data: {
          success: true,
          data: {}
        }
      });

      await reactionService.getUserAnalytics({
        timeframe: '7d',
        page: 2,
        limit: 50
      });

      expect(apiService.get).toHaveBeenCalledWith(
        expect.stringContaining('timeframe=7d')
      );
      expect(apiService.get).toHaveBeenCalledWith(
        expect.stringContaining('page=2')
      );
    });
  });

  describe('getNotifications', () => {
    it('fetches reaction notifications', async () => {
      const mockNotifications = [
        { id: '1', type: 'reaction_added', read: false },
        { id: '2', type: 'reaction_added', read: true }
      ];

      apiService.get.mockResolvedValue({
        data: {
          success: true,
          data: mockNotifications
        }
      });

      const result = await reactionService.getNotifications();

      expect(apiService.get).toHaveBeenCalledWith(
        expect.stringContaining('/reactions/notifications')
      );
      expect(result).toEqual(mockNotifications);
    });

    it('supports unread filter', async () => {
      apiService.get.mockResolvedValue({
        data: {
          success: true,
          data: []
        }
      });

      await reactionService.getNotifications({ unreadOnly: true });

      expect(apiService.get).toHaveBeenCalledWith(
        expect.stringContaining('unreadOnly=true')
      );
    });
  });

  describe('markNotificationsRead', () => {
    it('marks specific notifications as read', async () => {
      apiService.post.mockResolvedValue({
        data: {
          success: true
        }
      });

      const result = await reactionService.markNotificationsRead(['notif-1', 'notif-2']);

      expect(apiService.post).toHaveBeenCalledWith('/reactions/notifications/read', {
        notificationIds: ['notif-1', 'notif-2'],
        markAll: false
      });
      expect(result).toBe(true);
    });

    it('marks all notifications as read', async () => {
      apiService.post.mockResolvedValue({
        data: {
          success: true
        }
      });

      await reactionService.markNotificationsRead([], true);

      expect(apiService.post).toHaveBeenCalledWith('/reactions/notifications/read', {
        notificationIds: [],
        markAll: true
      });
    });
  });

  describe('getAvailableEmojis', () => {
    it('fetches available emojis', async () => {
      const mockEmojis = [
        { id: '1', name: 'party', url: 'emoji1.png' },
        { id: '2', name: 'rocket', url: 'emoji2.png' }
      ];

      apiService.get.mockResolvedValue({
        data: {
          success: true,
          data: mockEmojis
        }
      });

      const result = await reactionService.getAvailableEmojis();

      expect(apiService.get).toHaveBeenCalledWith(
        expect.stringContaining('/reactions/emoji')
      );
      expect(result).toEqual(mockEmojis);
    });

    it('supports server and community filters', async () => {
      apiService.get.mockResolvedValue({
        data: {
          success: true,
          data: []
        }
      });

      await reactionService.getAvailableEmojis({
        serverId: 'server-1',
        communityId: 'community-1'
      });

      expect(apiService.get).toHaveBeenCalledWith(
        expect.stringContaining('serverId=server-1')
      );
      expect(apiService.get).toHaveBeenCalledWith(
        expect.stringContaining('communityId=community-1')
      );
    });
  });

  describe('createCustomEmoji', () => {
    it('creates a custom emoji', async () => {
      const emojiData = {
        name: 'custom-party',
        imageUrl: 'https://example.com/emoji.png'
      };

      apiService.post.mockResolvedValue({
        data: {
          success: true,
          data: { id: 'emoji-1', ...emojiData }
        }
      });

      const result = await reactionService.createCustomEmoji(emojiData);

      expect(apiService.post).toHaveBeenCalledWith('/reactions/emoji', emojiData);
      expect(result.name).toBe('custom-party');
    });
  });

  describe('getLeaderboard', () => {
    it('fetches reaction leaderboard', async () => {
      const mockLeaderboard = [
        { userId: 'user-1', reactionCount: 1000 },
        { userId: 'user-2', reactionCount: 750 }
      ];

      apiService.get.mockResolvedValue({
        data: {
          success: true,
          data: mockLeaderboard
        }
      });

      const result = await reactionService.getLeaderboard();

      expect(apiService.get).toHaveBeenCalledWith(
        expect.stringContaining('/reactions/leaderboard')
      );
      expect(result).toEqual(mockLeaderboard);
    });

    it('supports timeframe and limit', async () => {
      apiService.get.mockResolvedValue({
        data: {
          success: true,
          data: []
        }
      });

      await reactionService.getLeaderboard({ timeframe: '7d', limit: 50 });

      expect(apiService.get).toHaveBeenCalledWith(
        expect.stringContaining('timeframe=7d')
      );
      expect(apiService.get).toHaveBeenCalledWith(
        expect.stringContaining('limit=50')
      );
    });
  });

  describe('joinContentRoom', () => {
    it('joins content room via socket', () => {
      reactionService.joinContentRoom('post', 'post-1');

      expect(socket.emit).toHaveBeenCalledWith('join_content_room', {
        contentType: 'post',
        contentId: 'post-1'
      });
    });
  });

  describe('leaveContentRoom', () => {
    it('leaves content room via socket', () => {
      reactionService.leaveContentRoom('post', 'post-1');

      expect(socket.emit).toHaveBeenCalledWith('leave_content_room', {
        contentType: 'post',
        contentId: 'post-1'
      });
    });
  });

  describe('utility functions', () => {
    it('formats reaction count', () => {
      expect(reactionService.formatReactionCount(500)).toBe('500');
      expect(reactionService.formatReactionCount(1500)).toBe('1.5K');
      expect(reactionService.formatReactionCount(1500000)).toBe('1.5M');
    });

    it('gets reaction color', () => {
      expect(reactionService.getReactionColor('like')).toBe('#1da1f2');
      expect(reactionService.getReactionColor('love')).toBe('#e91e63');
      expect(reactionService.getReactionColor('fire')).toBe('#ff5722');
      expect(reactionService.getReactionColor('unknown')).toBe('#888888');
    });

    it('gets reaction emoji', () => {
      expect(reactionService.getReactionEmoji('like')).toBe('👍');
      expect(reactionService.getReactionEmoji('love')).toBe('❤️');
      expect(reactionService.getReactionEmoji('fire')).toBe('🔥');
      expect(reactionService.getReactionEmoji('unknown')).toBe('❓');
    });
  });

  describe('cache management', () => {
    it('clears cache', () => {
      reactionService.cache.set('test', 'data');
      reactionService.clearCache();

      expect(reactionService.cache.size).toBe(0);
    });

    it('gets cache stats', () => {
      reactionService.cache.set('post:1', { data: 'test1' });
      reactionService.cache.set('post:2', { data: 'test2' });

      const stats = reactionService.getCacheStats();

      expect(stats.size).toBe(2);
      expect(stats.keys).toContain('post:1');
      expect(stats.keys).toContain('post:2');
    });
  });

  describe('realtime event handlers', () => {
    it('handles reaction added event', () => {
      const eventData = {
        contentType: 'post',
        contentId: 'post-1',
        userId: 'user-1',
        reactionType: 'like',
        summary: { likes: 1 }
      };

      reactionService.handleReactionAdded(eventData);

      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'reactionAdded'
        })
      );
    });

    it('handles reaction removed event', () => {
      const eventData = {
        contentType: 'post',
        contentId: 'post-1',
        userId: 'user-1',
        reactionType: 'like',
        summary: { likes: 0 }
      };

      reactionService.handleReactionRemoved(eventData);

      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'reactionRemoved'
        })
      );
    });

    it('handles reaction notification event', () => {
      const notificationData = {
        id: 'notif-1',
        message: 'Someone reacted to your post'
      };

      reactionService.handleReactionNotification(notificationData);

      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'reactionNotification'
        })
      );
    });

    it('handles analytics update event', () => {
      const analyticsData = {
        totalReactions: 500,
        byType: { like: 300, love: 200 }
      };

      reactionService.handleAnalyticsUpdate(analyticsData);

      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'analyticsUpdate'
        })
      );
    });

    it('handles trending update event', () => {
      const trendingData = [
        { contentId: 'post-1', reactionCount: 100 }
      ];

      reactionService.handleTrendingUpdate(trendingData);

      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'trendingUpdate'
        })
      );
    });
  });

  describe('realtime methods', () => {
    it('gets analytics realtime', () => {
      reactionService.getAnalyticsRealtime('post', 'post-1', '7d');

      expect(socket.emit).toHaveBeenCalledWith('get_reaction_analytics', {
        contentType: 'post',
        contentId: 'post-1',
        timeframe: '7d'
      });
    });

    it('gets trending realtime', () => {
      reactionService.getTrendingRealtime('post', '24h', 10);

      expect(socket.emit).toHaveBeenCalledWith('get_trending_reactions', {
        contentType: 'post',
        period: '24h',
        limit: 10
      });
    });

    it('gets user history realtime', () => {
      reactionService.getUserHistoryRealtime('user-1', 25);

      expect(socket.emit).toHaveBeenCalledWith('get_user_reaction_history', {
        userId: 'user-1',
        limit: 25
      });
    });
  });
});
