/**
 * Tests for oauthService
 */
import oauthService from './oauthService';
import api from './api';

jest.mock('./api');

// Mock window.location
delete window.location;
window.location = { href: '' };

describe('oauthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.location.href = '';
  });

  describe('getOAuthStatus', () => {
    it('fetches OAuth connection status', async () => {
      const mockStatus = {
        success: true,
        data: {
          providers: [
            { name: 'google', connected: true, email: 'user@gmail.com' },
            { name: 'discord', connected: false },
            { name: 'github', connected: true, username: 'developer' }
          ]
        }
      };
      api.get.mockResolvedValue(mockStatus);

      const result = await oauthService.getOAuthStatus();

      expect(api.get).toHaveBeenCalledWith('/oauth/status');
      expect(result).toEqual(mockStatus);
    });

    it('returns fallback on API failure', async () => {
      api.get.mockRejectedValue(new Error('Network error'));

      const result = await oauthService.getOAuthStatus();

      expect(result).toEqual({
        success: false,
        data: {
          providers: []
        }
      });
    });

    it('returns fallback on server error', async () => {
      api.get.mockRejectedValue(new Error('500 Internal Server Error'));

      const result = await oauthService.getOAuthStatus();

      expect(result.success).toBe(false);
      expect(result.data.providers).toEqual([]);
    });
  });

  describe('connectProvider', () => {
    it('redirects to Google OAuth', async () => {
      const mockResponse = {
        success: true,
        data: {
          authUrl: 'https://accounts.google.com/oauth/authorize?...'
        }
      };
      api.get.mockResolvedValue(mockResponse);

      await oauthService.connectProvider('google');

      expect(api.get).toHaveBeenCalledWith('/oauth/google/authorize');
      expect(window.location.href).toBe('https://accounts.google.com/oauth/authorize?...');
    });

    it('redirects to Discord OAuth', async () => {
      const mockResponse = {
        success: true,
        data: {
          authUrl: 'https://discord.com/api/oauth2/authorize?...'
        }
      };
      api.get.mockResolvedValue(mockResponse);

      await oauthService.connectProvider('discord');

      expect(api.get).toHaveBeenCalledWith('/oauth/discord/authorize');
      expect(window.location.href).toBe('https://discord.com/api/oauth2/authorize?...');
    });

    it('redirects to GitHub OAuth', async () => {
      const mockResponse = {
        success: true,
        data: {
          authUrl: 'https://github.com/login/oauth/authorize?...'
        }
      };
      api.get.mockResolvedValue(mockResponse);

      await oauthService.connectProvider('github');

      expect(api.get).toHaveBeenCalledWith('/oauth/github/authorize');
      expect(window.location.href).toBe('https://github.com/login/oauth/authorize?...');
    });

    it('throws error when no auth URL returned', async () => {
      const mockResponse = {
        success: true,
        data: {}
      };
      api.get.mockResolvedValue(mockResponse);

      await expect(oauthService.connectProvider('google')).rejects.toThrow('No authorization URL returned');
    });

    it('throws error when success is false', async () => {
      const mockResponse = {
        success: false,
        error: 'OAuth provider not configured'
      };
      api.get.mockResolvedValue(mockResponse);

      await expect(oauthService.connectProvider('google')).rejects.toThrow('No authorization URL returned');
    });

    it('throws error on API failure', async () => {
      api.get.mockRejectedValue(new Error('Network error'));

      await expect(oauthService.connectProvider('google')).rejects.toThrow('Network error');
    });

    it('does not redirect when auth URL is missing', async () => {
      const mockResponse = {
        success: true,
        data: {
          authUrl: null
        }
      };
      api.get.mockResolvedValue(mockResponse);

      await expect(oauthService.connectProvider('google')).rejects.toThrow();
      expect(window.location.href).toBe('');
    });
  });

  describe('disconnectProvider', () => {
    it('disconnects Google provider', async () => {
      const mockResponse = {
        success: true,
        message: 'Provider disconnected successfully'
      };
      api.delete.mockResolvedValue(mockResponse);

      const result = await oauthService.disconnectProvider('google');

      expect(api.delete).toHaveBeenCalledWith('/oauth/google/disconnect');
      expect(result).toEqual(mockResponse);
    });

    it('disconnects Discord provider', async () => {
      const mockResponse = { success: true };
      api.delete.mockResolvedValue(mockResponse);

      await oauthService.disconnectProvider('discord');

      expect(api.delete).toHaveBeenCalledWith('/oauth/discord/disconnect');
    });

    it('disconnects GitHub provider', async () => {
      const mockResponse = { success: true };
      api.delete.mockResolvedValue(mockResponse);

      await oauthService.disconnectProvider('github');

      expect(api.delete).toHaveBeenCalledWith('/oauth/github/disconnect');
    });

    it('throws error when provider not found', async () => {
      api.delete.mockRejectedValue(new Error('Provider not connected'));

      await expect(oauthService.disconnectProvider('google')).rejects.toThrow('Provider not connected');
    });

    it('throws error on unauthorized disconnect', async () => {
      api.delete.mockRejectedValue(new Error('Unauthorized'));

      await expect(oauthService.disconnectProvider('discord')).rejects.toThrow('Unauthorized');
    });

    it('throws error on network failure', async () => {
      api.delete.mockRejectedValue(new Error('Network error'));

      await expect(oauthService.disconnectProvider('github')).rejects.toThrow('Network error');
    });
  });

  describe('getAvailableProviders', () => {
    it('returns all available providers', () => {
      const providers = oauthService.getAvailableProviders();

      expect(providers).toHaveLength(3);
      expect(providers).toEqual([
        {
          id: 'google',
          name: 'Google',
          icon: 'https://www.google.com/favicon.ico',
          color: '#4285F4',
          description: 'Connect your Google account for easy sign-in'
        },
        {
          id: 'discord',
          name: 'Discord',
          icon: 'https://discord.com/assets/847541504914fd33810e70a0ea73177e.ico',
          color: '#5865F2',
          description: 'Connect your Discord account to import servers'
        },
        {
          id: 'github',
          name: 'GitHub',
          icon: 'https://github.com/favicon.ico',
          color: '#181717',
          description: 'Connect your GitHub account for developer features'
        }
      ]);
    });

    it('returns same providers on multiple calls', () => {
      const providers1 = oauthService.getAvailableProviders();
      const providers2 = oauthService.getAvailableProviders();

      expect(providers1).toEqual(providers2);
    });

    it('includes Google provider', () => {
      const providers = oauthService.getAvailableProviders();
      const google = providers.find(p => p.id === 'google');

      expect(google).toBeDefined();
      expect(google.name).toBe('Google');
      expect(google.color).toBe('#4285F4');
    });

    it('includes Discord provider', () => {
      const providers = oauthService.getAvailableProviders();
      const discord = providers.find(p => p.id === 'discord');

      expect(discord).toBeDefined();
      expect(discord.name).toBe('Discord');
      expect(discord.color).toBe('#5865F2');
    });

    it('includes GitHub provider', () => {
      const providers = oauthService.getAvailableProviders();
      const github = providers.find(p => p.id === 'github');

      expect(github).toBeDefined();
      expect(github.name).toBe('GitHub');
      expect(github.color).toBe('#181717');
    });

    it('all providers have required fields', () => {
      const providers = oauthService.getAvailableProviders();

      providers.forEach(provider => {
        expect(provider.id).toBeDefined();
        expect(provider.name).toBeDefined();
        expect(provider.icon).toBeDefined();
        expect(provider.color).toBeDefined();
        expect(provider.description).toBeDefined();
      });
    });

    it('all providers have valid color hex codes', () => {
      const providers = oauthService.getAvailableProviders();

      providers.forEach(provider => {
        expect(provider.color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });

    it('all providers have valid icon URLs', () => {
      const providers = oauthService.getAvailableProviders();

      providers.forEach(provider => {
        expect(provider.icon).toMatch(/^https?:\/\//);
      });
    });
  });
});
