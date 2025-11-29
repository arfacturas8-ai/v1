import crypto from 'crypto';
import axios from 'axios';
import { Redis } from 'ioredis';
import { prisma } from '@cryb/database';
import { AUTH_CONSTANTS } from '../models/auth-models';
import logger from '../utils/logger';

export interface OAuthProvider {
  name: 'google' | 'discord' | 'github' | 'twitter' | 'apple';
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  scope: string[];
  auth_url: string;
  token_url: string;
  user_info_url: string;
}

export interface OAuthConfig {
  google?: OAuthProvider;
  discord?: OAuthProvider;
  github?: OAuthProvider;
  twitter?: OAuthProvider;
  apple?: OAuthProvider;
}

export interface OAuthAuthorizationUrl {
  url: string;
  state: string;
}

export interface OAuthUserInfo {
  provider_id: string;
  email?: string;
  username?: string;
  name?: string;
  avatar?: string;
  verified?: boolean;
  raw_data: any;
}

export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_at?: Date;
  scope?: string;
}

export interface OAuthResult {
  success: boolean;
  user_info?: OAuthUserInfo;
  tokens?: OAuthTokens;
  is_new_user?: boolean;
  error?: string;
}

export class ComprehensiveOAuthService {
  private redis: Redis;
  private providers: Map<string, OAuthProvider> = new Map();
  private readonly STATE_EXPIRY = AUTH_CONSTANTS.OAUTH_STATE_EXPIRY;

  constructor(redis: Redis) {
    this.redis = redis;
    this.initializeProviders();
  }

  /**
   * Initialize OAuth providers from environment variables
   */
  private initializeProviders(): void {
    // Google OAuth
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      this.providers.set('google', {
        name: 'google',
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || `${process.env.BASE_URL}/api/v1/oauth/google/callback`,
        scope: ['openid', 'email', 'profile'],
        auth_url: 'https://accounts.google.com/o/oauth2/v2/auth',
        token_url: 'https://oauth2.googleapis.com/token',
        user_info_url: 'https://www.googleapis.com/oauth2/v2/userinfo'
      });
    }

    // Discord OAuth
    if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
      this.providers.set('discord', {
        name: 'discord',
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        redirect_uri: process.env.DISCORD_REDIRECT_URI || `${process.env.BASE_URL}/api/v1/oauth/discord/callback`,
        scope: ['identify', 'email'],
        auth_url: 'https://discord.com/api/oauth2/authorize',
        token_url: 'https://discord.com/api/oauth2/token',
        user_info_url: 'https://discord.com/api/users/@me'
      });
    }

    // GitHub OAuth
    if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
      this.providers.set('github', {
        name: 'github',
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        redirect_uri: process.env.GITHUB_REDIRECT_URI || `${process.env.BASE_URL}/api/v1/oauth/github/callback`,
        scope: ['user:email'],
        auth_url: 'https://github.com/login/oauth/authorize',
        token_url: 'https://github.com/login/oauth/access_token',
        user_info_url: 'https://api.github.com/user'
      });
    }

    // Twitter OAuth (v2)
    if (process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET) {
      this.providers.set('twitter', {
        name: 'twitter',
        client_id: process.env.TWITTER_CLIENT_ID,
        client_secret: process.env.TWITTER_CLIENT_SECRET,
        redirect_uri: process.env.TWITTER_REDIRECT_URI || `${process.env.BASE_URL}/api/v1/oauth/twitter/callback`,
        scope: ['tweet.read', 'users.read'],
        auth_url: 'https://twitter.com/i/oauth2/authorize',
        token_url: 'https://api.twitter.com/2/oauth2/token',
        user_info_url: 'https://api.twitter.com/2/users/me'
      });
    }

    // Apple OAuth
    if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET) {
      this.providers.set('apple', {
        name: 'apple',
        client_id: process.env.APPLE_CLIENT_ID,
        client_secret: process.env.APPLE_CLIENT_SECRET,
        redirect_uri: process.env.APPLE_REDIRECT_URI || `${process.env.BASE_URL}/api/v1/oauth/apple/callback`,
        scope: ['name', 'email'],
        auth_url: 'https://appleid.apple.com/auth/authorize',
        token_url: 'https://appleid.apple.com/auth/token',
        user_info_url: 'https://appleid.apple.com/auth/userinfo'
      });
    }

    logger.info(`OAuth providers initialized: ${Array.from(this.providers.keys()).join(', ')}`);
  }

  /**
   * Generate authorization URL for OAuth provider
   */
  async generateAuthorizationUrl(providerName: string, options?: {
    redirect_uri?: string;
    additional_scopes?: string[];
  }): Promise<OAuthAuthorizationUrl> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`OAuth provider '${providerName}' not configured`);
    }

    // Generate state parameter for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');
    
    // Store state in Redis with expiration
    await this.redis.setex(`oauth_state:${state}`, this.STATE_EXPIRY / 1000, JSON.stringify({
      provider: providerName,
      created_at: new Date().toISOString(),
      redirect_uri: options?.redirect_uri
    }));

    // Build scope
    const scopes = [...provider.scope];
    if (options?.additional_scopes) {
      scopes.push(...options.additional_scopes);
    }

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: provider.client_id,
      redirect_uri: options?.redirect_uri || provider.redirect_uri,
      scope: scopes.join(' '),
      state,
      response_type: 'code'
    });

    // Provider-specific parameters
    if (providerName === 'google') {
      params.append('access_type', 'offline');
      params.append('prompt', 'consent');
    } else if (providerName === 'discord') {
      params.append('prompt', 'consent');
    } else if (providerName === 'twitter') {
      params.append('code_challenge', 'challenge');
      params.append('code_challenge_method', 'plain');
    } else if (providerName === 'apple') {
      params.append('response_mode', 'form_post');
    }

    const authUrl = `${provider.auth_url}?${params.toString()}`;

    return {
      url: authUrl,
      state
    };
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   */
  async handleCallback(
    providerName: string,
    code: string,
    state: string,
    sessionInfo: {
      ip_address: string;
      user_agent: string;
    }
  ): Promise<OAuthResult> {
    try {
      const provider = this.providers.get(providerName);
      if (!provider) {
        return {
          success: false,
          error: `OAuth provider '${providerName}' not configured`
        };
      }

      // Verify state parameter
      const stateData = await this.redis.get(`oauth_state:${state}`);
      if (!stateData) {
        await this.logSecurityEvent({
          event_type: 'oauth_invalid_state',
          ip_address: sessionInfo.ip_address,
          user_agent: sessionInfo.user_agent,
          metadata: {
            provider: providerName,
            state,
            reason: 'state_not_found'
          },
          risk_score: 60
        });

        return {
          success: false,
          error: 'Invalid or expired state parameter'
        };
      }

      // Delete used state
      await this.redis.del(`oauth_state:${state}`);

      const parsedState = JSON.parse(stateData);
      if (parsedState.provider !== providerName) {
        return {
          success: false,
          error: 'State parameter provider mismatch'
        };
      }

      // Exchange authorization code for tokens
      const tokens = await this.exchangeCodeForTokens(provider, code);
      if (!tokens.success) {
        return tokens;
      }

      // Get user information
      const userInfo = await this.getUserInfo(provider, tokens.tokens!.access_token);
      if (!userInfo.success) {
        return {
          success: false,
          error: userInfo.error || 'Failed to get user information'
        };
      }

      // Check if user already exists
      let user = null;
      let isNewUser = false;

      // First, check if OAuth connection already exists
      const existingOAuth = await prisma.oauthProvider.findFirst({
        where: {
          provider: providerName,
          provider_id: userInfo.user_info!.provider_id
        },
        include: {
          user: true
        }
      });

      if (existingOAuth) {
        user = existingOAuth.user;
        
        // Update OAuth tokens
        await prisma.oauthProvider.update({
          where: { id: existingOAuth.id },
          data: {
            access_token: tokens.tokens!.access_token,
            refresh_token: tokens.tokens!.refresh_token,
            expires_at: tokens.tokens!.expires_at,
            scope: tokens.tokens!.scope,
            provider_email: userInfo.user_info!.email,
            provider_username: userInfo.user_info!.username
          }
        });
      } else {
        // Check if user exists by email
        if (userInfo.user_info!.email) {
          user = await prisma.user.findUnique({
            where: { email: userInfo.user_info!.email }
          });
        }

        if (!user) {
          // Create new user
          isNewUser = true;
          user = await prisma.user.create({
            data: {
              email: userInfo.user_info!.email || `${userInfo.user_info!.provider_id}@${providerName}.oauth`,
              username: userInfo.user_info!.username || `${providerName}_${userInfo.user_info!.provider_id}`,
              email_verified: userInfo.user_info!.verified || false
            }
          });

          // Assign default user role
          const userRole = await prisma.role.findFirst({
            where: { name: AUTH_CONSTANTS.SYSTEM_ROLES.USER }
          });

          if (userRole) {
            await prisma.userRole.create({
              data: {
                user_id: user.id,
                role_id: userRole.id,
                granted_by: user.id // Self-granted for OAuth signup
              }
            });
          }
        }

        // Create OAuth connection
        await prisma.oauthProvider.create({
          data: {
            user_id: user.id,
            provider: providerName,
            provider_id: userInfo.user_info!.provider_id,
            provider_email: userInfo.user_info!.email,
            provider_username: userInfo.user_info!.username,
            access_token: tokens.tokens!.access_token,
            refresh_token: tokens.tokens!.refresh_token,
            expires_at: tokens.tokens!.expires_at,
            scope: tokens.tokens!.scope
          }
        });
      }

      // Log successful OAuth login
      await this.logSecurityEvent({
        user_id: user.id,
        event_type: 'oauth_connected',
        ip_address: sessionInfo.ip_address,
        user_agent: sessionInfo.user_agent,
        metadata: {
          provider: providerName,
          provider_id: userInfo.user_info!.provider_id,
          is_new_user: isNewUser
        }
      });

      return {
        success: true,
        user_info: userInfo.user_info,
        tokens: tokens.tokens,
        is_new_user: isNewUser
      };

    } catch (error) {
      logger.error(`OAuth callback error for ${providerName}:`, error);
      return {
        success: false,
        error: 'OAuth authentication failed'
      };
    }
  }

  /**
   * Exchange authorization code for access tokens
   */
  private async exchangeCodeForTokens(provider: OAuthProvider, code: string): Promise<{
    success: boolean;
    tokens?: OAuthTokens;
    error?: string;
  }> {
    try {
      const data: any = {
        client_id: provider.client_id,
        client_secret: provider.client_secret,
        code,
        redirect_uri: provider.redirect_uri
      };

      // Provider-specific parameters
      if (provider.name === 'github') {
        data.grant_type = 'authorization_code';
      } else if (provider.name === 'twitter') {
        data.grant_type = 'authorization_code';
        data.code_verifier = 'challenge'; // In production, store this properly
      } else if (provider.name === 'apple') {
        data.grant_type = 'authorization_code';
      } else {
        data.grant_type = 'authorization_code';
      }

      const headers: any = {
        'Content-Type': 'application/x-www-form-urlencoded'
      };

      // GitHub requires Accept header
      if (provider.name === 'github') {
        headers.Accept = 'application/json';
      }

      const response = await axios.post(
        provider.token_url,
        new URLSearchParams(data).toString(),
        { headers }
      );

      const tokenData = response.data;

      let expiresAt: Date | undefined;
      if (tokenData.expires_in) {
        expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
      }

      return {
        success: true,
        tokens: {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: expiresAt,
          scope: tokenData.scope
        }
      };

    } catch (error: any) {
      logger.error(`Token exchange error for ${provider.name}:`, error);
      return {
        success: false,
        error: error.response?.data?.error_description || 'Token exchange failed'
      };
    }
  }

  /**
   * Get user information from OAuth provider
   */
  private async getUserInfo(provider: OAuthProvider, accessToken: string): Promise<{
    success: boolean;
    user_info?: OAuthUserInfo;
    error?: string;
  }> {
    try {
      const headers = {
        Authorization: `Bearer ${accessToken}`
      };

      let userResponse;
      let userData: any;

      if (provider.name === 'github') {
        // GitHub requires User-Agent header
        headers['User-Agent'] = 'CRYB-Platform';
        
        userResponse = await axios.get(provider.user_info_url, { headers });
        userData = userResponse.data;

        // Get primary email for GitHub
        try {
          const emailResponse = await axios.get('https://api.github.com/user/emails', { headers });
          const emails = emailResponse.data;
          const primaryEmail = emails.find((email: any) => email.primary);
          if (primaryEmail) {
            userData.email = primaryEmail.email;
            userData.verified = primaryEmail.verified;
          }
        } catch (emailError) {
          logger.warn('Failed to get GitHub user emails:', emailError);
        }
      } else if (provider.name === 'twitter') {
        userResponse = await axios.get(`${provider.user_info_url}?user.fields=email,username,verified`, { headers });
        userData = userResponse.data.data;
      } else {
        userResponse = await axios.get(provider.user_info_url, { headers });
        userData = userResponse.data;
      }

      // Normalize user data across providers
      const userInfo: OAuthUserInfo = {
        provider_id: this.extractProviderId(provider.name, userData),
        email: this.extractEmail(provider.name, userData),
        username: this.extractUsername(provider.name, userData),
        name: this.extractName(provider.name, userData),
        avatar: this.extractAvatar(provider.name, userData),
        verified: this.extractVerified(provider.name, userData),
        raw_data: userData
      };

      return {
        success: true,
        user_info: userInfo
      };

    } catch (error: any) {
      logger.error(`User info error for ${provider.name}:`, error);
      return {
        success: false,
        error: error.response?.data?.error_description || 'Failed to get user information'
      };
    }
  }

  /**
   * Extract provider ID from user data
   */
  private extractProviderId(providerName: string, userData: any): string {
    switch (providerName) {
      case 'google':
        return userData.id;
      case 'discord':
        return userData.id;
      case 'github':
        return userData.id.toString();
      case 'twitter':
        return userData.id;
      case 'apple':
        return userData.sub;
      default:
        return userData.id || userData.sub;
    }
  }

  /**
   * Extract email from user data
   */
  private extractEmail(providerName: string, userData: any): string | undefined {
    switch (providerName) {
      case 'google':
      case 'discord':
      case 'github':
      case 'apple':
        return userData.email;
      case 'twitter':
        return userData.email; // Note: Twitter email requires special approval
      default:
        return userData.email;
    }
  }

  /**
   * Extract username from user data
   */
  private extractUsername(providerName: string, userData: any): string | undefined {
    switch (providerName) {
      case 'google':
        return userData.email?.split('@')[0];
      case 'discord':
        return userData.username;
      case 'github':
        return userData.login;
      case 'twitter':
        return userData.username;
      case 'apple':
        return userData.email?.split('@')[0];
      default:
        return userData.username || userData.login;
    }
  }

  /**
   * Extract name from user data
   */
  private extractName(providerName: string, userData: any): string | undefined {
    switch (providerName) {
      case 'google':
        return userData.name;
      case 'discord':
        return userData.global_name || userData.username;
      case 'github':
        return userData.name;
      case 'twitter':
        return userData.name;
      case 'apple':
        return userData.name ? `${userData.name.firstName} ${userData.name.lastName}` : undefined;
      default:
        return userData.name;
    }
  }

  /**
   * Extract avatar from user data
   */
  private extractAvatar(providerName: string, userData: any): string | undefined {
    switch (providerName) {
      case 'google':
        return userData.picture;
      case 'discord':
        return userData.avatar ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` : undefined;
      case 'github':
        return userData.avatar_url;
      case 'twitter':
        return userData.profile_image_url;
      case 'apple':
        return undefined; // Apple doesn't provide avatar
      default:
        return userData.avatar || userData.picture || userData.avatar_url;
    }
  }

  /**
   * Extract verified status from user data
   */
  private extractVerified(providerName: string, userData: any): boolean {
    switch (providerName) {
      case 'google':
        return userData.email_verified || false;
      case 'discord':
        return userData.verified || false;
      case 'github':
        return userData.verified || false;
      case 'twitter':
        return userData.verified || false;
      case 'apple':
        return userData.email_verified || false;
      default:
        return userData.verified || userData.email_verified || false;
    }
  }

  /**
   * Disconnect OAuth provider from user account
   */
  async disconnectProvider(userId: string, providerName: string): Promise<boolean> {
    try {
      const oauthProvider = await prisma.oauthProvider.findFirst({
        where: {
          user_id: userId,
          provider: providerName
        }
      });

      if (!oauthProvider) {
        throw new Error('OAuth provider not connected');
      }

      // Check if user has other authentication methods
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          oauth_providers: true
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Ensure user has either password or other OAuth providers
      const hasPassword = !!user.password_hash;
      const otherProviders = user.oauth_providers.filter(p => p.provider !== providerName);

      if (!hasPassword && otherProviders.length === 0) {
        throw new Error('Cannot disconnect last authentication method');
      }

      // Delete OAuth provider
      await prisma.oauthProvider.delete({
        where: { id: oauthProvider.id }
      });

      // Log disconnection
      await this.logSecurityEvent({
        user_id: userId,
        event_type: 'oauth_disconnected',
        ip_address: '0.0.0.0',
        user_agent: 'system',
        metadata: {
          provider: providerName,
          provider_id: oauthProvider.provider_id
        }
      });

      return true;

    } catch (error) {
      logger.error('Error disconnecting OAuth provider:', error);
      throw error;
    }
  }

  /**
   * Get connected OAuth providers for user
   */
  async getUserOAuthProviders(userId: string): Promise<Array<{
    provider: string;
    provider_id: string;
    provider_email?: string;
    provider_username?: string;
    connected_at: Date;
  }>> {
    try {
      const providers = await prisma.oauthProvider.findMany({
        where: { user_id: userId },
        select: {
          provider: true,
          provider_id: true,
          provider_email: true,
          provider_username: true,
          created_at: true
        },
        orderBy: { created_at: 'desc' }
      });

      return providers.map(p => ({
        provider: p.provider,
        provider_id: p.provider_id,
        provider_email: p.provider_email,
        provider_username: p.provider_username,
        connected_at: p.created_at
      }));

    } catch (error) {
      logger.error('Error getting user OAuth providers:', error);
      return [];
    }
  }

  /**
   * Get available OAuth providers
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if provider is configured
   */
  isProviderConfigured(providerName: string): boolean {
    return this.providers.has(providerName);
  }

  /**
   * Log security event
   */
  private async logSecurityEvent(event: {
    user_id?: string;
    event_type: string;
    ip_address: string;
    user_agent: string;
    location?: any;
    metadata?: any;
    risk_score?: number;
  }): Promise<void> {
    try {
      await prisma.securityEvent.create({
        data: {
          user_id: event.user_id,
          event_type: event.event_type as any,
          ip_address: event.ip_address,
          user_agent: event.user_agent,
          location: event.location,
          metadata: event.metadata || {},
          risk_score: event.risk_score || 0
        }
      });
    } catch (error) {
      logger.error('Error logging security event:', error);
    }
  }
}