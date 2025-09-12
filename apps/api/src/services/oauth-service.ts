import axios, { AxiosError } from 'axios';
import { randomUUID, createHmac } from 'crypto';
import { prisma } from '@cryb/database';

export interface OAuthProvider {
  name: 'google' | 'discord' | 'github';
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes?: string[];
}

export interface OAuthUserInfo {
  id: string;
  email?: string;
  name?: string;
  username?: string;
  avatar?: string;
  verified?: boolean;
}

export interface OAuthResult {
  success: boolean;
  user?: OAuthUserInfo;
  error?: string;
  retryable?: boolean;
}

/**
 * Enhanced OAuth2 Service with comprehensive error handling and recovery
 */
export class OAuthService {
  private providers: Map<string, OAuthProvider> = new Map();
  private stateStore: Map<string, { provider: string; expiresAt: number; userId?: string }> = new Map();
  private readonly STATE_EXPIRES_MS = 10 * 60 * 1000; // 10 minutes

  constructor(providers: OAuthProvider[]) {
    providers.forEach(provider => {
      this.providers.set(provider.name, provider);
    });
    
    // Clean up expired states every 5 minutes
    setInterval(() => this.cleanupExpiredStates(), 5 * 60 * 1000);
    
    console.log(`✅ OAuth service initialized with providers: ${providers.map(p => p.name).join(', ')}`);
  }

  /**
   * Generate OAuth authorization URL with state protection
   */
  generateAuthUrl(provider: 'google' | 'discord' | 'github', userId?: string): { url: string; state: string } {
    const providerConfig = this.providers.get(provider);
    if (!providerConfig) {
      throw new Error(`OAuth provider ${provider} not configured`);
    }

    const state = this.generateSecureState();
    this.stateStore.set(state, {
      provider,
      expiresAt: Date.now() + this.STATE_EXPIRES_MS,
      userId
    });

    let authUrl: string;
    const params = new URLSearchParams({
      client_id: providerConfig.clientId,
      redirect_uri: providerConfig.redirectUri,
      state,
      response_type: 'code'
    });

    switch (provider) {
      case 'google':
        params.set('scope', providerConfig.scopes?.join(' ') || 'openid email profile');
        params.set('access_type', 'offline');
        params.set('prompt', 'consent');
        authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
        break;
        
      case 'discord':
        params.set('scope', providerConfig.scopes?.join(' ') || 'identify email');
        authUrl = `https://discord.com/api/oauth2/authorize?${params}`;
        break;
        
      case 'github':
        params.set('scope', providerConfig.scopes?.join(' ') || 'user:email');
        authUrl = `https://github.com/login/oauth/authorize?${params}`;
        break;
        
      default:
        throw new Error(`Unsupported OAuth provider: ${provider}`);
    }

    return { url: authUrl, state };
  }

  /**
   * Handle OAuth callback with comprehensive error recovery
   */
  async handleCallback(
    provider: 'google' | 'discord' | 'github',
    code: string,
    state: string,
    error?: string
  ): Promise<OAuthResult> {
    try {
      // Handle OAuth errors
      if (error) {
        console.warn(`OAuth ${provider} callback error:`, error);
        return {
          success: false,
          error: this.getHumanReadableError(error),
          retryable: this.isRetryableError(error)
        };
      }

      // Validate state parameter
      const stateInfo = this.stateStore.get(state);
      if (!stateInfo) {
        return {
          success: false,
          error: 'Invalid or expired OAuth state. Please try again.',
          retryable: true
        };
      }

      if (stateInfo.expiresAt < Date.now()) {
        this.stateStore.delete(state);
        return {
          success: false,
          error: 'OAuth state has expired. Please try again.',
          retryable: true
        };
      }

      if (stateInfo.provider !== provider) {
        return {
          success: false,
          error: 'OAuth provider mismatch. Please try again.',
          retryable: true
        };
      }

      // Exchange code for access token
      const tokenResult = await this.exchangeCodeForToken(provider, code);
      if (!tokenResult.success) {
        return tokenResult;
      }

      // Get user information
      const userResult = await this.getUserInfo(provider, tokenResult.accessToken!);
      if (!userResult.success) {
        return userResult;
      }

      // Clean up state
      this.stateStore.delete(state);

      return {
        success: true,
        user: userResult.user
      };

    } catch (error) {
      console.error(`OAuth ${provider} callback error:`, error);
      return {
        success: false,
        error: 'OAuth authentication failed due to an internal error',
        retryable: true
      };
    }
  }

  /**
   * Exchange authorization code for access token
   */
  private async exchangeCodeForToken(
    provider: 'google' | 'discord' | 'github',
    code: string
  ): Promise<{ success: boolean; accessToken?: string; error?: string; retryable?: boolean }> {
    const providerConfig = this.providers.get(provider);
    if (!providerConfig) {
      return { success: false, error: 'Provider not configured' };
    }

    try {
      let tokenUrl: string;
      let requestData: any;
      let headers: any = { 'Accept': 'application/json' };

      switch (provider) {
        case 'google':
          tokenUrl = 'https://oauth2.googleapis.com/token';
          requestData = {
            client_id: providerConfig.clientId,
            client_secret: providerConfig.clientSecret,
            code,
            grant_type: 'authorization_code',
            redirect_uri: providerConfig.redirectUri
          };
          headers['Content-Type'] = 'application/x-www-form-urlencoded';
          break;
          
        case 'discord':
          tokenUrl = 'https://discord.com/api/oauth2/token';
          requestData = new URLSearchParams({
            client_id: providerConfig.clientId,
            client_secret: providerConfig.clientSecret,
            code,
            grant_type: 'authorization_code',
            redirect_uri: providerConfig.redirectUri
          });
          headers['Content-Type'] = 'application/x-www-form-urlencoded';
          break;
          
        case 'github':
          tokenUrl = 'https://github.com/login/oauth/access_token';
          requestData = {
            client_id: providerConfig.clientId,
            client_secret: providerConfig.clientSecret,
            code
          };
          break;
          
        default:
          return { success: false, error: 'Unsupported provider' };
      }

      const response = await axios.post(tokenUrl, requestData, {
        headers,
        timeout: 30000, // 30 second timeout
        validateStatus: (status) => status < 500 // Don't throw on 4xx errors
      });

      if (response.status >= 400) {
        const errorMessage = response.data?.error_description || response.data?.error || 'Token exchange failed';
        return {
          success: false,
          error: errorMessage,
          retryable: response.status >= 500 || response.status === 429
        };
      }

      const { access_token } = response.data;
      if (!access_token) {
        return {
          success: false,
          error: 'No access token received from provider',
          retryable: false
        };
      }

      return { success: true, accessToken: access_token };

    } catch (error) {
      console.error(`Token exchange failed for ${provider}:`, error);
      
      if (error instanceof AxiosError) {
        const isRetryable = error.code === 'ECONNABORTED' || 
                           error.response?.status === undefined ||
                           error.response?.status >= 500;
        
        return {
          success: false,
          error: 'Failed to exchange authorization code for access token',
          retryable: isRetryable
        };
      }

      return {
        success: false,
        error: 'Token exchange failed due to network error',
        retryable: true
      };
    }
  }

  /**
   * Get user information from OAuth provider
   */
  private async getUserInfo(
    provider: 'google' | 'discord' | 'github',
    accessToken: string
  ): Promise<{ success: boolean; user?: OAuthUserInfo; error?: string; retryable?: boolean }> {
    try {
      let userUrl: string;
      let headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      };

      switch (provider) {
        case 'google':
          userUrl = 'https://www.googleapis.com/oauth2/v2/userinfo';
          break;
        case 'discord':
          userUrl = 'https://discord.com/api/users/@me';
          break;
        case 'github':
          userUrl = 'https://api.github.com/user';
          headers['Authorization'] = `token ${accessToken}`;
          break;
        default:
          return { success: false, error: 'Unsupported provider' };
      }

      const response = await axios.get(userUrl, {
        headers,
        timeout: 15000,
        validateStatus: (status) => status < 500
      });

      if (response.status >= 400) {
        return {
          success: false,
          error: 'Failed to fetch user information',
          retryable: response.status >= 500 || response.status === 429
        };
      }

      const userData = response.data;
      let userInfo: OAuthUserInfo;

      switch (provider) {
        case 'google':
          userInfo = {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            avatar: userData.picture,
            verified: userData.verified_email
          };
          break;
          
        case 'discord':
          userInfo = {
            id: userData.id,
            username: userData.username,
            email: userData.email,
            avatar: userData.avatar ? 
              `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` : 
              undefined,
            verified: userData.verified
          };
          break;
          
        case 'github':
          // GitHub doesn't always provide email in the user endpoint
          let email = userData.email;
          if (!email) {
            try {
              const emailResponse = await axios.get('https://api.github.com/user/emails', {
                headers,
                timeout: 10000
              });
              const primaryEmail = emailResponse.data.find((e: any) => e.primary);
              email = primaryEmail?.email;
            } catch (emailError) {
              console.warn('Failed to fetch GitHub email:', emailError);
            }
          }
          
          userInfo = {
            id: userData.id.toString(),
            username: userData.login,
            name: userData.name,
            email,
            avatar: userData.avatar_url,
            verified: true // GitHub emails are considered verified
          };
          break;
          
        default:
          return { success: false, error: 'Unsupported provider' };
      }

      return { success: true, user: userInfo };

    } catch (error) {
      console.error(`Failed to get user info from ${provider}:`, error);
      
      if (error instanceof AxiosError) {
        const isRetryable = error.code === 'ECONNABORTED' ||
                           error.response?.status === undefined ||
                           error.response?.status >= 500;
        
        return {
          success: false,
          error: 'Failed to retrieve user information',
          retryable: isRetryable
        };
      }

      return {
        success: false,
        error: 'User information retrieval failed',
        retryable: true
      };
    }
  }

  /**
   * Find or create user from OAuth information
   */
  async findOrCreateUser(
    provider: 'google' | 'discord' | 'github',
    userInfo: OAuthUserInfo,
    existingUserId?: string
  ): Promise<{ success: boolean; user?: any; error?: string; isNewUser?: boolean }> {
    try {
      const providerKey = `${provider}_id`;
      
      // Try to find existing user by OAuth provider ID
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { [providerKey]: userInfo.id },
            userInfo.email ? { email: userInfo.email } : {}
          ].filter(Boolean)
        }
      });

      let isNewUser = false;

      if (!user && existingUserId) {
        // Link OAuth account to existing user
        user = await prisma.user.update({
          where: { id: existingUserId },
          data: {
            [providerKey]: userInfo.id,
            email: user?.email || userInfo.email,
            isVerified: true // OAuth accounts are considered verified
          }
        });
      } else if (!user) {
        // Create new user
        const username = await this.generateUniqueUsername(
          userInfo.username || userInfo.name || `${provider}user`
        );
        
        user = await prisma.user.create({
          data: {
            username,
            displayName: userInfo.name || userInfo.username || username,
            email: userInfo.email,
            [providerKey]: userInfo.id,
            avatar: userInfo.avatar,
            isVerified: userInfo.verified || true // OAuth users are typically verified
          }
        });
        
        isNewUser = true;
      } else if (user && !user[providerKey]) {
        // Update existing user with OAuth info
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            [providerKey]: userInfo.id,
            isVerified: true
          }
        });
      }

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          email: user.email,
          avatar: user.avatar,
          isVerified: user.isVerified
        },
        isNewUser
      };

    } catch (error) {
      console.error('OAuth user creation/update failed:', error);
      return {
        success: false,
        error: 'Failed to create or update user account'
      };
    }
  }

  /**
   * Generate unique username
   */
  private async generateUniqueUsername(baseUsername: string): Promise<string> {
    const sanitized = baseUsername.toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .substring(0, 28); // Leave room for suffix
    
    let username = sanitized;
    let counter = 1;
    
    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${sanitized}_${counter}`;
      counter++;
      
      if (counter > 1000) {
        // Fallback to random suffix
        username = `${sanitized}_${randomUUID().substring(0, 8)}`;
        break;
      }
    }
    
    return username;
  }

  /**
   * Generate secure state parameter
   */
  private generateSecureState(): string {
    const timestamp = Date.now().toString();
    const random = randomUUID();
    const hmac = createHmac('sha256', process.env.JWT_SECRET || 'fallback-secret');
    hmac.update(`${timestamp}:${random}`);
    const signature = hmac.digest('hex').substring(0, 16);
    
    return `${timestamp}.${random}.${signature}`;
  }

  /**
   * Clean up expired states
   */
  private cleanupExpiredStates(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [state, info] of this.stateStore.entries()) {
      if (info.expiresAt < now) {
        this.stateStore.delete(state);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired OAuth states`);
    }
  }

  /**
   * Convert OAuth error codes to human-readable messages
   */
  private getHumanReadableError(error: string): string {
    const errorMap: Record<string, string> = {
      'access_denied': 'You denied access to your account. Please try again if this was a mistake.',
      'invalid_request': 'The authentication request was invalid. Please try again.',
      'unauthorized_client': 'The application is not authorized. Please contact support.',
      'unsupported_response_type': 'Authentication method not supported. Please contact support.',
      'invalid_scope': 'Requested permissions are not available. Please contact support.',
      'server_error': 'Authentication server error. Please try again later.',
      'temporarily_unavailable': 'Authentication service is temporarily unavailable. Please try again later.'
    };
    
    return errorMap[error] || 'An unknown error occurred during authentication. Please try again.';
  }

  /**
   * Check if an OAuth error is retryable
   */
  private isRetryableError(error: string): boolean {
    const retryableErrors = [
      'server_error',
      'temporarily_unavailable'
    ];
    
    return retryableErrors.includes(error);
  }

  /**
   * Get provider statistics
   */
  getStats(): {
    providers: string[];
    activeStates: number;
    stateCleanupNeeded: number;
  } {
    const now = Date.now();
    let expiredStates = 0;
    
    for (const [, info] of this.stateStore.entries()) {
      if (info.expiresAt < now) {
        expiredStates++;
      }
    }
    
    return {
      providers: Array.from(this.providers.keys()),
      activeStates: this.stateStore.size,
      stateCleanupNeeded: expiredStates
    };
  }
}