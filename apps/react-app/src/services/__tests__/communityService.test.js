import { describe, it, expect, vi, beforeEach } from 'vitest';
import communityService from '../communityService';

jest.mock('../api', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('communityService', () => {
  let apiMock;

  beforeEach(async () => {
    apiMock = (await import('../api')).default;
    jest.clearAllMocks();
  });

  describe('getCommunities', () => {
    it('should fetch communities successfully', async () => {
      const mockCommunities = [
        { id: '1', name: 'community-1', displayName: 'Community 1' },
        { id: '2', name: 'community-2', displayName: 'Community 2' },
      ];
      apiMock.get.mockResolvedValue({ success: true, data: mockCommunities });

      const result = await communityService.getCommunities();

      expect(apiMock.get).toHaveBeenCalledWith('/communities');
      expect(result.data).toEqual(mockCommunities);
    });
  });

  describe('getCommunity', () => {
    it('should fetch single community', async () => {
      const mockCommunity = { id: '1', name: 'test-community' };
      apiMock.get.mockResolvedValue({ success: true, data: mockCommunity });

      const result = await communityService.getCommunity('1');

      expect(apiMock.get).toHaveBeenCalledWith('/communities/1');
      expect(result.data).toEqual(mockCommunity);
    });

    it('should handle not found error', async () => {
      apiMock.get.mockResolvedValue({ success: false, message: 'Not found' });

      const result = await communityService.getCommunity('invalid');

      expect(result.success).toBe(false);
    });
  });

  describe('createCommunity', () => {
    it('should create community successfully', async () => {
      const newCommunity = { name: 'new-community', displayName: 'New Community' };
      const mockResponse = { success: true, data: { id: '1', ...newCommunity } };
      apiMock.post.mockResolvedValue(mockResponse);

      const result = await communityService.createCommunity(newCommunity);

      expect(apiMock.post).toHaveBeenCalledWith('/communities', newCommunity);
      expect(result.data.name).toBe('new-community');
    });
  });

  describe('updateCommunity', () => {
    it('should update community successfully', async () => {
      const updates = { displayName: 'Updated Name' };
      const mockResponse = { success: true, data: { id: '1', ...updates } };
      apiMock.put.mockResolvedValue(mockResponse);

      const result = await communityService.updateCommunity('1', updates);

      expect(apiMock.put).toHaveBeenCalledWith('/communities/1', updates);
      expect(result.data.displayName).toBe('Updated Name');
    });
  });

  describe('deleteCommunity', () => {
    it('should delete community successfully', async () => {
      apiMock.delete.mockResolvedValue({ success: true });

      const result = await communityService.deleteCommunity('1');

      expect(apiMock.delete).toHaveBeenCalledWith('/communities/1');
      expect(result.success).toBe(true);
    });
  });

  describe('joinCommunity', () => {
    it('should join community successfully', async () => {
      apiMock.post.mockResolvedValue({ success: true });

      const result = await communityService.joinCommunity('1');

      expect(apiMock.post).toHaveBeenCalledWith('/communities/1/join');
      expect(result.success).toBe(true);
    });
  });

  describe('leaveCommunity', () => {
    it('should leave community successfully', async () => {
      apiMock.post.mockResolvedValue({ success: true });

      const result = await communityService.leaveCommunity('1');

      expect(apiMock.post).toHaveBeenCalledWith('/communities/1/leave');
      expect(result.success).toBe(true);
    });
  });

  describe('getMembers', () => {
    it('should fetch community members', async () => {
      const mockMembers = [
        { id: '1', username: 'user1' },
        { id: '2', username: 'user2' },
      ];
      apiMock.get.mockResolvedValue({ success: true, data: mockMembers });

      const result = await communityService.getMembers('1');

      expect(apiMock.get).toHaveBeenCalledWith('/communities/1/members');
      expect(result.data).toEqual(mockMembers);
    });
  });

  describe('searchCommunities', () => {
    it('should search communities by query', async () => {
      const mockResults = [{ id: '1', name: 'search-result' }];
      apiMock.get.mockResolvedValue({ success: true, data: mockResults });

      const result = await communityService.searchCommunities('test');

      expect(apiMock.get).toHaveBeenCalledWith('/communities/search', {
        params: { q: 'test' },
      });
      expect(result.data).toEqual(mockResults);
    });
  });
});
