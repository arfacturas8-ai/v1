/**
 * Tests for apiKeysService
 */
import apiKeysService from './apiKeysService';
import api from './api';

jest.mock('./api');

describe('apiKeysService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAPIKeys', () => {
    it('fetches all API keys', async () => {
      const mockKeys = {
        success: true,
        data: {
          items: [
            { id: 'key-1', name: 'Production Key', scopes: ['read:posts'] },
            { id: 'key-2', name: 'Dev Key', scopes: ['read:profile'] }
          ]
        }
      };
      api.get.mockResolvedValue(mockKeys);

      const result = await apiKeysService.getAPIKeys();

      expect(api.get).toHaveBeenCalledWith('/api-keys');
      expect(result).toEqual(mockKeys);
    });

    it('returns fallback on API failure', async () => {
      api.get.mockRejectedValue(new Error('Network error'));

      const result = await apiKeysService.getAPIKeys();

      expect(result).toEqual({ success: false, data: { items: [] } });
    });

    it('returns fallback on server error', async () => {
      api.get.mockRejectedValue(new Error('500 Internal Server Error'));

      const result = await apiKeysService.getAPIKeys();

      expect(result.success).toBe(false);
      expect(result.data.items).toEqual([]);
    });
  });

  describe('createAPIKey', () => {
    it('creates API key with default expiration', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'key-3',
          name: 'New Key',
          key: 'cryb_abc123',
          scopes: ['read:posts']
        }
      };
      api.post.mockResolvedValue(mockResponse);

      const result = await apiKeysService.createAPIKey('New Key', ['read:posts']);

      expect(api.post).toHaveBeenCalledWith('/api-keys', {
        name: 'New Key',
        scopes: ['read:posts'],
        expiresIn: null
      });
      expect(result).toEqual(mockResponse);
    });

    it('creates API key with custom expiration', async () => {
      const mockResponse = {
        success: true,
        data: { id: 'key-4', name: 'Temp Key', expiresAt: '2024-12-31' }
      };
      api.post.mockResolvedValue(mockResponse);

      await apiKeysService.createAPIKey('Temp Key', ['read:posts'], 30);

      expect(api.post).toHaveBeenCalledWith('/api-keys', {
        name: 'Temp Key',
        scopes: ['read:posts'],
        expiresIn: 30 * 24 * 60 * 60 * 1000 // 30 days in ms
      });
    });

    it('creates API key with empty scopes', async () => {
      const mockResponse = { success: true, data: { id: 'key-5' } };
      api.post.mockResolvedValue(mockResponse);

      await apiKeysService.createAPIKey('No Scopes Key');

      expect(api.post).toHaveBeenCalledWith('/api-keys', {
        name: 'No Scopes Key',
        scopes: [],
        expiresIn: null
      });
    });

    it('creates API key with multiple scopes', async () => {
      const mockResponse = { success: true, data: { id: 'key-6' } };
      api.post.mockResolvedValue(mockResponse);

      await apiKeysService.createAPIKey('Multi Scope Key', [
        'read:posts',
        'write:posts',
        'read:profile'
      ]);

      expect(api.post).toHaveBeenCalledWith('/api-keys', {
        name: 'Multi Scope Key',
        scopes: ['read:posts', 'write:posts', 'read:profile'],
        expiresIn: null
      });
    });

    it('throws error on API failure', async () => {
      api.post.mockRejectedValue(new Error('Invalid scopes'));

      await expect(
        apiKeysService.createAPIKey('Bad Key', ['invalid:scope'])
      ).rejects.toThrow('Invalid scopes');
    });
  });

  describe('revokeAPIKey', () => {
    it('revokes API key', async () => {
      const mockResponse = { success: true };
      api.delete.mockResolvedValue(mockResponse);

      const result = await apiKeysService.revokeAPIKey('key-1');

      expect(api.delete).toHaveBeenCalledWith('/api-keys/key-1');
      expect(result).toEqual(mockResponse);
    });

    it('throws error when key not found', async () => {
      api.delete.mockRejectedValue(new Error('API key not found'));

      await expect(apiKeysService.revokeAPIKey('invalid')).rejects.toThrow('API key not found');
    });

    it('throws error on unauthorized revoke', async () => {
      api.delete.mockRejectedValue(new Error('Unauthorized'));

      await expect(apiKeysService.revokeAPIKey('key-1')).rejects.toThrow('Unauthorized');
    });
  });

  describe('updateAPIKey', () => {
    it('updates API key name', async () => {
      const mockResponse = {
        success: true,
        data: { id: 'key-1', name: 'Updated Name' }
      };
      api.patch.mockResolvedValue(mockResponse);

      const result = await apiKeysService.updateAPIKey('key-1', {
        name: 'Updated Name'
      });

      expect(api.patch).toHaveBeenCalledWith('/api-keys/key-1', {
        name: 'Updated Name'
      });
      expect(result).toEqual(mockResponse);
    });

    it('updates API key scopes', async () => {
      const mockResponse = {
        success: true,
        data: { id: 'key-1', scopes: ['read:posts', 'write:posts'] }
      };
      api.patch.mockResolvedValue(mockResponse);

      await apiKeysService.updateAPIKey('key-1', {
        scopes: ['read:posts', 'write:posts']
      });

      expect(api.patch).toHaveBeenCalledWith('/api-keys/key-1', {
        scopes: ['read:posts', 'write:posts']
      });
    });

    it('updates multiple fields', async () => {
      const mockResponse = { success: true };
      api.patch.mockResolvedValue(mockResponse);

      await apiKeysService.updateAPIKey('key-1', {
        name: 'New Name',
        scopes: ['admin:all']
      });

      expect(api.patch).toHaveBeenCalledWith('/api-keys/key-1', {
        name: 'New Name',
        scopes: ['admin:all']
      });
    });

    it('throws error on API failure', async () => {
      api.patch.mockRejectedValue(new Error('Update failed'));

      await expect(
        apiKeysService.updateAPIKey('key-1', { name: 'New' })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('getAPIKeyStats', () => {
    it('fetches API key usage statistics', async () => {
      const mockStats = {
        success: true,
        data: {
          requests: 1500,
          lastUsed: '2024-01-15T10:30:00Z',
          requestsByEndpoint: {
            '/api/posts': 800,
            '/api/users': 700
          }
        }
      };
      api.get.mockResolvedValue(mockStats);

      const result = await apiKeysService.getAPIKeyStats('key-1');

      expect(api.get).toHaveBeenCalledWith('/api-keys/key-1/stats');
      expect(result).toEqual(mockStats);
    });

    it('returns fallback on API failure', async () => {
      api.get.mockRejectedValue(new Error('Stats unavailable'));

      const result = await apiKeysService.getAPIKeyStats('key-1');

      expect(result).toEqual({
        success: false,
        data: { requests: 0, lastUsed: null }
      });
    });

    it('returns fallback on network error', async () => {
      api.get.mockRejectedValue(new Error('Network timeout'));

      const result = await apiKeysService.getAPIKeyStats('key-1');

      expect(result.success).toBe(false);
      expect(result.data.requests).toBe(0);
      expect(result.data.lastUsed).toBeNull();
    });
  });

  describe('getAvailableScopes', () => {
    it('returns all available scopes', () => {
      const scopes = apiKeysService.getAvailableScopes();

      expect(scopes).toHaveLength(10);
      expect(scopes).toEqual([
        { id: 'read:profile', name: 'Read Profile', description: 'Read user profile information' },
        { id: 'write:profile', name: 'Write Profile', description: 'Update user profile' },
        { id: 'read:posts', name: 'Read Posts', description: 'Read posts and comments' },
        { id: 'write:posts', name: 'Write Posts', description: 'Create and edit posts' },
        { id: 'read:communities', name: 'Read Communities', description: 'Read community data' },
        { id: 'write:communities', name: 'Write Communities', description: 'Manage communities' },
        { id: 'read:messages', name: 'Read Messages', description: 'Read direct messages' },
        { id: 'write:messages', name: 'Write Messages', description: 'Send messages' },
        { id: 'read:analytics', name: 'Read Analytics', description: 'Access analytics data' },
        { id: 'admin:all', name: 'Admin Access', description: 'Full admin access (use with caution)' }
      ]);
    });

    it('returns same scopes on multiple calls', () => {
      const scopes1 = apiKeysService.getAvailableScopes();
      const scopes2 = apiKeysService.getAvailableScopes();

      expect(scopes1).toEqual(scopes2);
    });

    it('includes read profile scope', () => {
      const scopes = apiKeysService.getAvailableScopes();
      const readProfile = scopes.find(s => s.id === 'read:profile');

      expect(readProfile).toBeDefined();
      expect(readProfile.name).toBe('Read Profile');
    });

    it('includes write profile scope', () => {
      const scopes = apiKeysService.getAvailableScopes();
      const writeProfile = scopes.find(s => s.id === 'write:profile');

      expect(writeProfile).toBeDefined();
    });

    it('includes read posts scope', () => {
      const scopes = apiKeysService.getAvailableScopes();
      const readPosts = scopes.find(s => s.id === 'read:posts');

      expect(readPosts).toBeDefined();
    });

    it('includes write posts scope', () => {
      const scopes = apiKeysService.getAvailableScopes();
      const writePosts = scopes.find(s => s.id === 'write:posts');

      expect(writePosts).toBeDefined();
    });

    it('includes read communities scope', () => {
      const scopes = apiKeysService.getAvailableScopes();
      const readCommunities = scopes.find(s => s.id === 'read:communities');

      expect(readCommunities).toBeDefined();
    });

    it('includes write communities scope', () => {
      const scopes = apiKeysService.getAvailableScopes();
      const writeCommunities = scopes.find(s => s.id === 'write:communities');

      expect(writeCommunities).toBeDefined();
    });

    it('includes read messages scope', () => {
      const scopes = apiKeysService.getAvailableScopes();
      const readMessages = scopes.find(s => s.id === 'read:messages');

      expect(readMessages).toBeDefined();
    });

    it('includes write messages scope', () => {
      const scopes = apiKeysService.getAvailableScopes();
      const writeMessages = scopes.find(s => s.id === 'write:messages');

      expect(writeMessages).toBeDefined();
    });

    it('includes analytics scope', () => {
      const scopes = apiKeysService.getAvailableScopes();
      const analytics = scopes.find(s => s.id === 'read:analytics');

      expect(analytics).toBeDefined();
    });

    it('includes admin scope', () => {
      const scopes = apiKeysService.getAvailableScopes();
      const admin = scopes.find(s => s.id === 'admin:all');

      expect(admin).toBeDefined();
      expect(admin.description).toContain('caution');
    });
  });
});
