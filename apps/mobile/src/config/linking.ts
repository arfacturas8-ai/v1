import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';

const prefix = Linking.createURL('/');

export const linking: LinkingOptions<any> = {
  prefixes: ['cryb://', 'https://cryb.ai', 'https://*.cryb.ai', prefix],
  config: {
    screens: {
      Auth: {
        screens: {
          Welcome: 'welcome',
          Login: 'login',
          Register: 'register',
          ForgotPassword: 'forgot-password',
          Onboarding: 'onboarding',
        },
      },
      Main: {
        screens: {
          MainTabs: {
            screens: {
              Home: 'home',
              Chat: 'chat',
              Communities: 'communities',
              Profile: 'profile',
            },
          },
          Search: 'search',
          ChatRoom: 'chat/:roomId',
          Server: 'server/:serverId',
          CreateServer: 'create-server',
          Settings: 'settings',
          Messages: 'messages',
          CommunityDetail: 'community/:communityId',
          CreatePost: 'community/:communityId/create',
          PostDetail: 'post/:postId',
          UserProfile: 'user/:username',
          EditProfile: 'settings/profile',
          Notifications: 'notifications',
          VoiceChannel: 'voice/:channelId',
          VideoCall: 'video/:channelId',
          ActivityFeed: 'activity',
          Discover: 'discover',
          Help: 'help',

          // NFT & Wallet
          NFTMarketplace: 'nft/marketplace',
          NFTDetail: 'nft/:contractAddress/:tokenId',
          Wallet: 'wallet',
          WalletTransaction: 'wallet/transaction/:txId',

          // Settings
          PrivacySettings: 'settings/privacy',
          SecuritySettings: 'settings/security',
          NotificationSettings: 'settings/notifications',
          BlockedUsers: 'settings/blocked-users',

          // Admin
          AdminDashboard: 'admin',
          UserManagement: 'admin/users',
          ContentModeration: 'admin/moderation',

          // Error
          NotFound: '*',
          ServerError: 'error/500',
          Offline: 'offline',
        },
      },
    },
  },
  async getInitialURL() {
    // First, check if the app was opened from a deep link
    const url = await Linking.getInitialURL();
    if (url != null) {
      return url;
    }

    // Next, check if there is a notification that triggered opening the app
    // This is handled by the notification service
    return null;
  },
  subscribe(listener) {
    // Listen to incoming links from deep linking
    const onReceiveURL = ({ url }: { url: string }) => {
      listener(url);
    };

    // Listen to expo push notifications
    const subscription = Linking.addEventListener('url', onReceiveURL);

    return () => {
      subscription.remove();
    };
  },
};

// Deep link handlers
export const handleDeepLink = (url: string, navigation: any) => {
  try {
    const { hostname, path, queryParams } = Linking.parse(url);

    // Handle different deep link patterns
    if (path) {
      if (path.startsWith('community/')) {
        const communityId = path.split('/')[1];
        navigation.navigate('CommunityDetail', { communityId });
      } else if (path.startsWith('post/')) {
        const postId = path.split('/')[1];
        navigation.navigate('PostDetail', { postId });
      } else if (path.startsWith('user/')) {
        const username = path.split('/')[1];
        navigation.navigate('UserProfile', { username });
      } else if (path.startsWith('nft/')) {
        const parts = path.split('/');
        if (parts.length === 3) {
          const [, contractAddress, tokenId] = parts;
          navigation.navigate('NFTDetail', { contractAddress, tokenId });
        } else {
          navigation.navigate('NFTMarketplace');
        }
      } else if (path.startsWith('wallet')) {
        navigation.navigate('Wallet');
      }
    }

    // Handle query parameters
    if (queryParams) {
      if (queryParams.invite) {
        // Handle community invite
        navigation.navigate('CommunityInvite', { code: queryParams.invite });
      } else if (queryParams.ref) {
        // Handle referral
        // Store referral code
      }
    }
  } catch (error) {
    console.error('Error handling deep link:', error);
  }
};
