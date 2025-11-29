/**
 * DEEP LINKING SERVICE
 * Handles universal links and navigation from notifications
 */

import * as Linking from 'expo-linking';
import { NavigationContainerRef } from '@react-navigation/native';
import { CrashDetector } from '../utils/CrashDetector';
import { useAuthStore } from '../stores/authStore';

export interface DeepLinkData {
  type: 'post' | 'comment' | 'user' | 'community' | 'channel' | 'message' | 'server' | 'voice' | 'settings';
  id: string;
  params?: Record<string, any>;
  requiresAuth?: boolean;
}

export interface NavigationRoute {
  screen: string;
  params?: Record<string, any>;
}

class DeepLinkingService {
  private static instance: DeepLinkingService;
  private navigationRef: NavigationContainerRef<any> | null = null;
  private pendingLink: string | null = null;

  static getInstance(): DeepLinkingService {
    if (!DeepLinkingService.instance) {
      DeepLinkingService.instance = new DeepLinkingService();
    }
    return DeepLinkingService.instance;
  }

  setNavigationRef(ref: NavigationContainerRef<any>) {
    this.navigationRef = ref;
    
    // Process any pending links
    if (this.pendingLink) {
      this.handleDeepLink(this.pendingLink);
      this.pendingLink = null;
    }
  }

  async initialize(): Promise<void> {
    try {
      // Handle initial URL if app was launched via deep link
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        console.log('[DeepLinkingService] Initial URL:', initialUrl);
        this.handleDeepLink(initialUrl);
      }

      // Set up listener for subsequent deep links
      const subscription = Linking.addEventListener('url', (event) => {
        console.log('[DeepLinkingService] URL received:', event.url);
        this.handleDeepLink(event.url);
      });

      console.log('[DeepLinkingService] Initialized successfully');
      return () => subscription?.remove();
    } catch (error) {
      console.error('[DeepLinkingService] Initialization error:', error);
      
      await CrashDetector.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { action: 'initializeDeepLinking' },
        'medium'
      );
    }
  }

  handleDeepLink(url: string): void {
    try {
      if (!this.navigationRef) {
        // Store the link to process later when navigation is ready
        this.pendingLink = url;
        return;
      }

      const deepLinkData = this.parseDeepLink(url);
      if (!deepLinkData) {
        console.warn('[DeepLinkingService] Invalid deep link format:', url);
        return;
      }

      // Check authentication if required
      if (deepLinkData.requiresAuth && !useAuthStore.getState().isAuthenticated) {
        console.log('[DeepLinkingService] Auth required for deep link, storing for later');
        // Store the link to process after authentication
        this.storePendingLink(deepLinkData);
        this.navigateToAuth();
        return;
      }

      this.navigateFromDeepLink(deepLinkData);
    } catch (error) {
      console.error('[DeepLinkingService] Handle deep link error:', error);
      
      CrashDetector.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { action: 'handleDeepLink', url },
        'low'
      );
    }
  }

  private parseDeepLink(url: string): DeepLinkData | null {
    try {
      const parsed = Linking.parse(url);
      const { hostname, path, queryParams } = parsed;

      // Handle different URL formats
      // cryb://post/123
      // https://cryb.app/post/123
      // https://cryb.app/r/community/post/123

      if (!path) return null;

      const pathParts = path.split('/').filter(Boolean);
      
      if (pathParts.length === 0) return null;

      const type = pathParts[0] as DeepLinkData['type'];
      const id = pathParts[1];

      if (!id) return null;

      let requiresAuth = true;
      let params: Record<string, any> = { ...queryParams };

      // Handle specific route patterns
      switch (type) {
        case 'post':
          if (pathParts[2] === 'comment' && pathParts[3]) {
            params.commentId = pathParts[3];
          }
          break;
        
        case 'community':
        case 'r': // Reddit-style /r/community
          if (pathParts[2] === 'post' && pathParts[3]) {
            return {
              type: 'post',
              id: pathParts[3],
              params: { communityId: id, ...params },
              requiresAuth,
            };
          }
          break;
        
        case 'user':
        case 'u': // Reddit-style /u/user
          requiresAuth = false; // Public user profiles
          break;
        
        case 'channel':
          if (pathParts[2]) {
            params.serverId = id;
            return {
              type: 'channel',
              id: pathParts[2],
              params,
              requiresAuth,
            };
          }
          break;
        
        case 'voice':
          if (pathParts[2]) {
            params.serverId = id;
            return {
              type: 'voice',
              id: pathParts[2],
              params,
              requiresAuth,
            };
          }
          break;
        
        case 'message':
          if (pathParts[2]) {
            params.channelId = id;
            return {
              type: 'message',
              id: pathParts[2],
              params,
              requiresAuth,
            };
          }
          break;
      }

      return {
        type,
        id,
        params,
        requiresAuth,
      };
    } catch (error) {
      console.error('[DeepLinkingService] Parse deep link error:', error);
      return null;
    }
  }

  private navigateFromDeepLink(data: DeepLinkData): void {
    try {
      if (!this.navigationRef) {
        console.warn('[DeepLinkingService] Navigation ref not available');
        return;
      }

      const route = this.getNavigationRoute(data);
      if (!route) {
        console.warn('[DeepLinkingService] Could not determine navigation route for:', data);
        return;
      }

      console.log('[DeepLinkingService] Navigating to:', route);

      // Use navigate with nested navigation
      if (route.screen.includes('.')) {
        const [navigator, screen] = route.screen.split('.');
        this.navigationRef.navigate(navigator as never, {
          screen,
          params: route.params,
        } as never);
      } else {
        this.navigationRef.navigate(route.screen as never, route.params as never);
      }
    } catch (error) {
      console.error('[DeepLinkingService] Navigate from deep link error:', error);
    }
  }

  private getNavigationRoute(data: DeepLinkData): NavigationRoute | null {
    switch (data.type) {
      case 'post':
        return {
          screen: 'Main.Community.PostDetail',
          params: { postId: data.id, ...data.params },
        };
      
      case 'comment':
        return {
          screen: 'Main.Community.PostDetail',
          params: { 
            postId: data.params?.postId,
            commentId: data.id,
            scrollToComment: true,
            ...data.params,
          },
        };
      
      case 'user':
        return {
          screen: 'Main.UserProfile',
          params: { userId: data.id, ...data.params },
        };
      
      case 'community':
        return {
          screen: 'Main.Community.Detail',
          params: { communityId: data.id, ...data.params },
        };
      
      case 'channel':
        return {
          screen: 'Main.Chat.Channel',
          params: { 
            channelId: data.id,
            serverId: data.params?.serverId,
            ...data.params,
          },
        };
      
      case 'message':
        return {
          screen: 'Main.Chat.Room',
          params: { 
            messageId: data.id,
            channelId: data.params?.channelId,
            scrollToMessage: true,
            ...data.params,
          },
        };
      
      case 'server':
        return {
          screen: 'Main.Chat.Server',
          params: { serverId: data.id, ...data.params },
        };
      
      case 'voice':
        return {
          screen: 'Main.Voice.Channel',
          params: { 
            channelId: data.id,
            serverId: data.params?.serverId,
            autoJoin: data.params?.autoJoin === 'true',
            ...data.params,
          },
        };
      
      case 'settings':
        return {
          screen: 'Main.Settings',
          params: { section: data.id, ...data.params },
        };
      
      default:
        return null;
    }
  }

  private navigateToAuth(): void {
    if (this.navigationRef) {
      this.navigationRef.navigate('Auth' as never);
    }
  }

  private async storePendingLink(data: DeepLinkData): Promise<void> {
    try {
      const linkData = JSON.stringify(data);
      // Store in AsyncStorage for post-auth processing
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem('@cryb_pending_deep_link', linkData);
      console.log('[DeepLinkingService] Stored pending deep link');
    } catch (error) {
      console.error('[DeepLinkingService] Store pending link error:', error);
    }
  }

  async processPendingLink(): Promise<void> {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const pendingLinkData = await AsyncStorage.getItem('@cryb_pending_deep_link');
      
      if (pendingLinkData) {
        const data: DeepLinkData = JSON.parse(pendingLinkData);
        console.log('[DeepLinkingService] Processing pending deep link:', data);
        
        // Clear the stored link
        await AsyncStorage.removeItem('@cryb_pending_deep_link');
        
        // Navigate to the deep link
        this.navigateFromDeepLink(data);
      }
    } catch (error) {
      console.error('[DeepLinkingService] Process pending link error:', error);
    }
  }

  // Public methods for generating deep links

  generatePostLink(postId: string, communityId?: string): string {
    const baseUrl = 'https://cryb.app';
    if (communityId) {
      return `${baseUrl}/r/${communityId}/post/${postId}`;
    }
    return `${baseUrl}/post/${postId}`;
  }

  generateUserLink(userId: string): string {
    return `https://cryb.app/u/${userId}`;
  }

  generateCommunityLink(communityId: string): string {
    return `https://cryb.app/r/${communityId}`;
  }

  generateChannelLink(serverId: string, channelId: string): string {
    return `https://cryb.app/server/${serverId}/channel/${channelId}`;
  }

  generateVoiceChannelLink(serverId: string, channelId: string, autoJoin: boolean = false): string {
    const baseUrl = `https://cryb.app/server/${serverId}/voice/${channelId}`;
    return autoJoin ? `${baseUrl}?autoJoin=true` : baseUrl;
  }

  generateMessageLink(channelId: string, messageId: string): string {
    return `https://cryb.app/channel/${channelId}/message/${messageId}`;
  }

  // Share functionality
  async sharePost(postId: string, communityId?: string): Promise<void> {
    try {
      const url = this.generatePostLink(postId, communityId);
      const { Share } = await import('react-native');
      
      await Share.share({
        message: 'Check out this post on CRYB',
        url,
      });
    } catch (error) {
      console.error('[DeepLinkingService] Share post error:', error);
    }
  }

  async shareUser(userId: string, username: string): Promise<void> {
    try {
      const url = this.generateUserLink(userId);
      const { Share } = await import('react-native');
      
      await Share.share({
        message: `Check out @${username} on CRYB`,
        url,
      });
    } catch (error) {
      console.error('[DeepLinkingService] Share user error:', error);
    }
  }

  async shareCommunity(communityId: string, communityName: string): Promise<void> {
    try {
      const url = this.generateCommunityLink(communityId);
      const { Share } = await import('react-native');
      
      await Share.share({
        message: `Join the ${communityName} community on CRYB`,
        url,
      });
    } catch (error) {
      console.error('[DeepLinkingService] Share community error:', error);
    }
  }

  // Test deep link functionality
  async testDeepLink(url: string): Promise<boolean> {
    try {
      console.log('[DeepLinkingService] Testing deep link:', url);
      const data = this.parseDeepLink(url);
      
      if (data) {
        console.log('[DeepLinkingService] Deep link parsed successfully:', data);
        return true;
      } else {
        console.warn('[DeepLinkingService] Deep link parsing failed');
        return false;
      }
    } catch (error) {
      console.error('[DeepLinkingService] Test deep link error:', error);
      return false;
    }
  }
}

export const deepLinkingService = DeepLinkingService.getInstance();