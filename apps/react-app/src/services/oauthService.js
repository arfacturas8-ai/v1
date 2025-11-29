/**
 * OAuth Service
 * Manages OAuth provider connections (Google, Discord, GitHub)
 */

import api from './api';

class OAuthService {
  /**
   * Get OAuth connection status for all providers
   */
  async getOAuthStatus() {
    try {
      const response = await api.get('/oauth/status');
      return response;
    } catch (error) {
      console.error('Failed to fetch OAuth status:', error);
      return {
        success: false,
        data: {
          providers: []
        }
      };
    }
  }

  /**
   * Initiate OAuth connection flow
   * @param {String} provider - Provider name (google, discord, github)
   */
  async connectProvider(provider) {
    try {
      const response = await api.get(`/oauth/${provider}/authorize`);

      if (response.success && response.data.authUrl) {
        // Redirect to OAuth provider
        window.location.href = response.data.authUrl;
        return response;
      } else {
        throw new Error('No authorization URL returned');
      }
    } catch (error) {
      console.error(`Failed to connect ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Disconnect an OAuth provider
   * @param {String} provider - Provider name
   */
  async disconnectProvider(provider) {
    try {
      const response = await api.delete(`/oauth/${provider}/disconnect`);
      return response;
    } catch (error) {
      console.error(`Failed to disconnect ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Get available OAuth providers
   */
  getAvailableProviders() {
    return [
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
    ];
  }
}

export default new OAuthService();
