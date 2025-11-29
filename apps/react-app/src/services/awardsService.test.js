/**
 * Tests for awardsService
 */
import awardsService from './awardsService';
import api from './api';

jest.mock('./api');

describe('awardsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAvailableAwards', () => {
    it('fetches available awards', async () => {
      const mockAwards = [
        { id: 'gold', name: 'Gold', cost: 500 },
        { id: 'silver', name: 'Silver', cost: 100 },
        { id: 'platinum', name: 'Platinum', cost: 1800 }
      ];
      api.get.mockResolvedValue(mockAwards);

      const result = await awardsService.getAvailableAwards();

      expect(api.get).toHaveBeenCalledWith('/awards');
      expect(result).toEqual(mockAwards);
    });

    it('throws error on API failure', async () => {
      api.get.mockRejectedValue(new Error('API Error'));

      await expect(awardsService.getAvailableAwards()).rejects.toThrow('API Error');
    });
  });

  describe('giveAwardToPost', () => {
    it('gives award to post', async () => {
      const mockResponse = { success: true, awardId: 'award-1' };
      api.post.mockResolvedValue(mockResponse);

      const result = await awardsService.giveAwardToPost('post-1', 'gold');

      expect(api.post).toHaveBeenCalledWith('/awards/post/post-1', {
        awardType: 'gold',
        isAnonymous: false
      });
      expect(result).toEqual(mockResponse);
    });

    it('gives anonymous award to post', async () => {
      const mockResponse = { success: true, awardId: 'award-2' };
      api.post.mockResolvedValue(mockResponse);

      await awardsService.giveAwardToPost('post-1', 'silver', true);

      expect(api.post).toHaveBeenCalledWith('/awards/post/post-1', {
        awardType: 'silver',
        isAnonymous: true
      });
    });

    it('throws error on failure', async () => {
      api.post.mockRejectedValue(new Error('Insufficient coins'));

      await expect(
        awardsService.giveAwardToPost('post-1', 'gold')
      ).rejects.toThrow('Insufficient coins');
    });
  });

  describe('giveAwardToComment', () => {
    it('gives award to comment', async () => {
      const mockResponse = { success: true, awardId: 'award-3' };
      api.post.mockResolvedValue(mockResponse);

      const result = await awardsService.giveAwardToComment('comment-1', 'gold');

      expect(api.post).toHaveBeenCalledWith('/awards/comment/comment-1', {
        awardType: 'gold',
        isAnonymous: false
      });
      expect(result).toEqual(mockResponse);
    });

    it('gives anonymous award to comment', async () => {
      const mockResponse = { success: true, awardId: 'award-4' };
      api.post.mockResolvedValue(mockResponse);

      await awardsService.giveAwardToComment('comment-1', 'platinum', true);

      expect(api.post).toHaveBeenCalledWith('/awards/comment/comment-1', {
        awardType: 'platinum',
        isAnonymous: true
      });
    });

    it('throws error on failure', async () => {
      api.post.mockRejectedValue(new Error('Comment not found'));

      await expect(
        awardsService.giveAwardToComment('invalid', 'gold')
      ).rejects.toThrow('Comment not found');
    });
  });

  describe('getUserAwards', () => {
    it('fetches awards received by user', async () => {
      const mockAwards = [
        { id: 'award-1', type: 'gold', postId: 'post-1' },
        { id: 'award-2', type: 'silver', postId: 'post-2' }
      ];
      api.get.mockResolvedValue(mockAwards);

      const result = await awardsService.getUserAwards('user-1');

      expect(api.get).toHaveBeenCalledWith('/awards/user/user-1/received');
      expect(result).toEqual(mockAwards);
    });

    it('throws error on API failure', async () => {
      api.get.mockRejectedValue(new Error('User not found'));

      await expect(awardsService.getUserAwards('invalid')).rejects.toThrow('User not found');
    });
  });

  describe('getUserAwardsGiven', () => {
    it('fetches awards given by user', async () => {
      const mockAwards = [
        { id: 'award-5', type: 'gold', postId: 'post-3', isAnonymous: false },
        { id: 'award-6', type: 'silver', postId: 'post-4', isAnonymous: true }
      ];
      api.get.mockResolvedValue(mockAwards);

      const result = await awardsService.getUserAwardsGiven('user-1');

      expect(api.get).toHaveBeenCalledWith('/awards/user/user-1/given');
      expect(result).toEqual(mockAwards);
    });

    it('throws error on API failure', async () => {
      api.get.mockRejectedValue(new Error('Unauthorized'));

      await expect(awardsService.getUserAwardsGiven('user-1')).rejects.toThrow('Unauthorized');
    });
  });

  describe('getPostAwards', () => {
    it('fetches awards for specific post', async () => {
      const mockAwards = [
        { id: 'award-7', type: 'gold', givenBy: 'user-1' },
        { id: 'award-8', type: 'platinum', givenBy: 'user-2' }
      ];
      api.get.mockResolvedValue(mockAwards);

      const result = await awardsService.getPostAwards('post-1');

      expect(api.get).toHaveBeenCalledWith('/awards/post/post-1');
      expect(result).toEqual(mockAwards);
    });

    it('throws error on API failure', async () => {
      api.get.mockRejectedValue(new Error('Post not found'));

      await expect(awardsService.getPostAwards('invalid')).rejects.toThrow('Post not found');
    });
  });

  describe('getCommentAwards', () => {
    it('fetches awards for specific comment', async () => {
      const mockAwards = [
        { id: 'award-9', type: 'silver', givenBy: 'user-3' }
      ];
      api.get.mockResolvedValue(mockAwards);

      const result = await awardsService.getCommentAwards('comment-1');

      expect(api.get).toHaveBeenCalledWith('/awards/comment/comment-1');
      expect(result).toEqual(mockAwards);
    });

    it('throws error on API failure', async () => {
      api.get.mockRejectedValue(new Error('Comment not found'));

      await expect(awardsService.getCommentAwards('invalid')).rejects.toThrow('Comment not found');
    });
  });

  describe('purchaseCoins', () => {
    it('purchases coin package', async () => {
      const mockResponse = { success: true, coins: 1000, newBalance: 1500 };
      api.post.mockResolvedValue(mockResponse);

      const result = await awardsService.purchaseCoins('package-1');

      expect(api.post).toHaveBeenCalledWith('/awards/purchase', {
        packageId: 'package-1'
      });
      expect(result).toEqual(mockResponse);
    });

    it('throws error on payment failure', async () => {
      api.post.mockRejectedValue(new Error('Payment failed'));

      await expect(awardsService.purchaseCoins('package-1')).rejects.toThrow('Payment failed');
    });
  });

  describe('getCoinBalance', () => {
    it('fetches user coin balance', async () => {
      const mockBalance = { balance: 500 };
      api.get.mockResolvedValue(mockBalance);

      const result = await awardsService.getCoinBalance();

      expect(api.get).toHaveBeenCalledWith('/awards/balance');
      expect(result).toEqual(mockBalance);
    });

    it('throws error on API failure', async () => {
      api.get.mockRejectedValue(new Error('Unauthorized'));

      await expect(awardsService.getCoinBalance()).rejects.toThrow('Unauthorized');
    });
  });

  describe('getCoinHistory', () => {
    it('fetches coin transaction history with default pagination', async () => {
      const mockHistory = {
        items: [
          { id: 'tx-1', type: 'purchase', amount: 1000 },
          { id: 'tx-2', type: 'spent', amount: -500 }
        ],
        page: 1,
        total: 2
      };
      api.get.mockResolvedValue(mockHistory);

      const result = await awardsService.getCoinHistory();

      expect(api.get).toHaveBeenCalledWith('/awards/history', {
        params: { page: 1, limit: 20 }
      });
      expect(result).toEqual(mockHistory);
    });

    it('fetches coin history with custom pagination', async () => {
      const mockHistory = {
        items: [{ id: 'tx-3', type: 'purchase', amount: 500 }],
        page: 2,
        total: 10
      };
      api.get.mockResolvedValue(mockHistory);

      await awardsService.getCoinHistory(2, 10);

      expect(api.get).toHaveBeenCalledWith('/awards/history', {
        params: { page: 2, limit: 10 }
      });
    });

    it('throws error on API failure', async () => {
      api.get.mockRejectedValue(new Error('Database error'));

      await expect(awardsService.getCoinHistory()).rejects.toThrow('Database error');
    });
  });

  describe('getAwardStats', () => {
    it('fetches award statistics', async () => {
      const mockStats = {
        totalGiven: 50,
        totalReceived: 30,
        mostGivenAward: 'silver',
        mostReceivedAward: 'gold'
      };
      api.get.mockResolvedValue(mockStats);

      const result = await awardsService.getAwardStats();

      expect(api.get).toHaveBeenCalledWith('/awards/stats');
      expect(result).toEqual(mockStats);
    });

    it('throws error on API failure', async () => {
      api.get.mockRejectedValue(new Error('Server error'));

      await expect(awardsService.getAwardStats()).rejects.toThrow('Server error');
    });
  });
});
