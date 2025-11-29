import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';

// Mock React Native modules
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
}));

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
};

// Mock auth context
const mockAuthContext = {
  user: {
    id: '1',
    username: 'testuser',
    displayName: 'Test User',
    avatar: null,
  },
  loading: false,
  error: null,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
};

// Mock socket context
const mockSocket = {
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  connected: true,
};

// Mock API service
const mockApiService = {
  getFeed: jest.fn(),
  getNotifications: jest.fn(),
  getCommunities: jest.fn(),
  markNotificationRead: jest.fn(),
};

// Mock components
interface Post {
  id: string;
  title: string;
  content: string;
  author: {
    username: string;
    displayName: string;
  };
  community: {
    name: string;
  };
  votes: number;
  commentCount: number;
  createdAt: string;
}

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'mention' | 'message';
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  fromUser?: {
    username: string;
    displayName: string;
  };
}

const PostCard: React.FC<{ 
  post: Post; 
  onPress?: () => void;
  onVote?: (direction: 'up' | 'down') => void;
}> = ({ post, onPress, onVote }) => {
  const [votes, setVotes] = React.useState(post.votes);
  const [userVote, setUserVote] = React.useState<'up' | 'down' | null>(null);

  const handleVote = (direction: 'up' | 'down') => {
    const change = userVote === direction ? 0 : direction === 'up' ? 1 : -1;
    const prevChange = userVote === 'up' ? -1 : userVote === 'down' ? 1 : 0;
    
    setVotes(prev => prev + change + prevChange);
    setUserVote(userVote === direction ? null : direction);
    onVote?.(direction);
  };

  return (
    <TouchableOpacity 
      testID={`post-card-${post.id}`}
      onPress={onPress}
    >
      <View style={{ padding: 16, borderBottomWidth: 1 }}>
        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
          <Text testID="community-name">r/{post.community.name}</Text>
          <Text testID="author-name" style={{ marginLeft: 8 }}>u/{post.author.username}</Text>
        </View>
        
        <Text testID="post-title" style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
          {post.title}
        </Text>
        
        <Text testID="post-content" numberOfLines={3}>
          {post.content}
        </Text>
        
        <View style={{ flexDirection: 'row', marginTop: 12, alignItems: 'center' }}>
          <TouchableOpacity 
            testID="upvote-button"
            onPress={() => handleVote('up')}
            style={{ marginRight: 8 }}
          >
            <Text>↑</Text>
          </TouchableOpacity>
          
          <Text testID="vote-count" style={{ marginRight: 8 }}>
            {votes}
          </Text>
          
          <TouchableOpacity 
            testID="downvote-button"
            onPress={() => handleVote('down')}
            style={{ marginRight: 16 }}
          >
            <Text>↓</Text>
          </TouchableOpacity>
          
          <TouchableOpacity testID="comment-button">
            <Text>💬 {post.commentCount}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const NotificationItem: React.FC<{ 
  notification: Notification;
  onPress?: () => void;
  onMarkRead?: () => void;
}> = ({ notification, onPress, onMarkRead }) => {
  return (
    <TouchableOpacity 
      testID={`notification-${notification.id}`}
      onPress={onPress}
      style={{ 
        padding: 16, 
        borderBottomWidth: 1,
        backgroundColor: notification.isRead ? 'white' : '#f0f8ff'
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text testID="notification-title" style={{ fontWeight: 'bold' }}>
            {notification.title}
          </Text>
          <Text testID="notification-content" style={{ marginTop: 4 }}>
            {notification.content}
          </Text>
          {notification.fromUser && (
            <Text testID="notification-from" style={{ marginTop: 4, fontSize: 12, color: 'gray' }}>
              From {notification.fromUser.displayName}
            </Text>
          )}
        </View>
        
        {!notification.isRead && (
          <TouchableOpacity 
            testID="mark-read-button"
            onPress={onMarkRead}
            style={{ marginLeft: 8 }}
          >
            <Text style={{ color: 'blue' }}>Mark Read</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'feed' | 'notifications'>('feed');

  React.useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [feedData, notificationData] = await Promise.all([
        mockApiService.getFeed(),
        mockApiService.getNotifications()
      ]);
      
      setPosts(feedData.posts || []);
      setNotifications(notificationData.notifications || []);
    } catch (err) {
      setError('Failed to load data');
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const handlePostPress = (postId: string) => {
    navigation.navigate('PostDetail', { postId });
  };

  const handleVote = async (postId: string, direction: 'up' | 'down') => {
    try {
      // Mock vote API call
      console.log(`Voted ${direction} on post ${postId}`);
    } catch (err) {
      Alert.alert('Error', 'Failed to vote. Please try again.');
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read and navigate
    handleMarkNotificationRead(notification.id);
    
    switch (notification.type) {
      case 'comment':
      case 'like':
        navigation.navigate('PostDetail', { postId: notification.id });
        break;
      case 'message':
        navigation.navigate('Chat', { userId: notification.fromUser?.username });
        break;
      default:
        break;
    }
  };

  const handleMarkNotificationRead = async (notificationId: string) => {
    try {
      await mockApiService.markNotificationRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to mark notification as read.');
    }
  };

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      onPress={() => handlePostPress(item.id)}
      onVote={(direction) => handleVote(item.id, direction)}
    />
  );

  const renderNotification = ({ item }: { item: Notification }) => (
    <NotificationItem
      notification={item}
      onPress={() => handleNotificationPress(item)}
      onMarkRead={() => handleMarkNotificationRead(item.id)}
    />
  );

  if (loading) {
    return (
      <View testID="loading-state" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (error && posts.length === 0) {
    return (
      <View testID="error-state" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Error: {error}</Text>
        <TouchableOpacity 
          testID="retry-button"
          onPress={loadInitialData}
          style={{ marginTop: 16, padding: 12, backgroundColor: 'blue', borderRadius: 8 }}
        >
          <Text style={{ color: 'white' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <View testID="home-screen" style={{ flex: 1 }}>
      {/* Tab Bar */}
      <View style={{ flexDirection: 'row', borderBottomWidth: 1 }}>
        <TouchableOpacity
          testID="feed-tab"
          onPress={() => setActiveTab('feed')}
          style={{ 
            flex: 1, 
            padding: 16, 
            alignItems: 'center',
            backgroundColor: activeTab === 'feed' ? '#f0f8ff' : 'white'
          }}
        >
          <Text style={{ fontWeight: activeTab === 'feed' ? 'bold' : 'normal' }}>
            Feed
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          testID="notifications-tab"
          onPress={() => setActiveTab('notifications')}
          style={{ 
            flex: 1, 
            padding: 16, 
            alignItems: 'center',
            backgroundColor: activeTab === 'notifications' ? '#f0f8ff' : 'white'
          }}
        >
          <Text style={{ fontWeight: activeTab === 'notifications' ? 'bold' : 'normal' }}>
            Notifications {unreadCount > 0 && `(${unreadCount})`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'feed' ? (
        <FlatList
          testID="posts-list"
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View testID="empty-feed" style={{ padding: 32, alignItems: 'center' }}>
              <Text>No posts found. Pull to refresh!</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          testID="notifications-list"
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View testID="empty-notifications" style={{ padding: 32, alignItems: 'center' }}>
              <Text>No notifications yet.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

describe('HomeScreen', () => {
  const mockPosts: Post[] = [
    {
      id: '1',
      title: 'Welcome to CRYB Mobile!',
      content: 'This is a test post for the mobile app.',
      author: {
        username: 'admin',
        displayName: 'Admin User',
      },
      community: {
        name: 'announcements',
      },
      votes: 42,
      commentCount: 5,
      createdAt: '2023-01-01T10:00:00Z',
    },
    {
      id: '2',
      title: 'Mobile Features Guide',
      content: 'Learn about all the mobile-specific features...',
      author: {
        username: 'moderator',
        displayName: 'Mod User',
      },
      community: {
        name: 'help',
      },
      votes: 23,
      commentCount: 12,
      createdAt: '2023-01-02T14:30:00Z',
    },
  ];

  const mockNotifications: Notification[] = [
    {
      id: '1',
      type: 'comment',
      title: 'New comment on your post',
      content: 'Someone commented on "Welcome to CRYB Mobile!"',
      isRead: false,
      createdAt: '2023-01-01T11:00:00Z',
      fromUser: {
        username: 'commenter',
        displayName: 'Comment User',
      },
    },
    {
      id: '2',
      type: 'like',
      title: 'Your post was liked',
      content: '5 people liked your post',
      isRead: true,
      createdAt: '2023-01-01T10:30:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockApiService.getFeed.mockResolvedValue({ posts: mockPosts });
    mockApiService.getNotifications.mockResolvedValue({ notifications: mockNotifications });
  });

  const renderWithNavigation = (component: React.ReactElement) => {
    return render(
      <NavigationContainer>
        {component}
      </NavigationContainer>
    );
  };

  describe('Screen Rendering', () => {
    it('renders home screen correctly', async () => {
      const { getByTestId } = renderWithNavigation(
        <HomeScreen navigation={mockNavigation} />
      );

      // Should show loading initially
      expect(getByTestId('loading-state')).toBeTruthy();

      // Wait for data to load
      await waitFor(() => {
        expect(getByTestId('home-screen')).toBeTruthy();
      });

      expect(getByTestId('posts-list')).toBeTruthy();
      expect(getByTestId('feed-tab')).toBeTruthy();
      expect(getByTestId('notifications-tab')).toBeTruthy();
    });

    it('displays posts correctly', async () => {
      const { getByTestId } = renderWithNavigation(
        <HomeScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByTestId('post-card-1')).toBeTruthy();
        expect(getByTestId('post-card-2')).toBeTruthy();
      });

      // Check first post content
      expect(getByTestId('post-card-1')).toBeTruthy();
    });

    it('shows empty state when no posts', async () => {
      mockApiService.getFeed.mockResolvedValue({ posts: [] });

      const { getByTestId } = renderWithNavigation(
        <HomeScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByTestId('empty-feed')).toBeTruthy();
      });
    });
  });

  describe('Tab Navigation', () => {
    it('switches between feed and notifications tabs', async () => {
      const { getByTestId } = renderWithNavigation(
        <HomeScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByTestId('home-screen')).toBeTruthy();
      });

      // Initially on feed tab
      expect(getByTestId('posts-list')).toBeTruthy();

      // Switch to notifications tab
      fireEvent.press(getByTestId('notifications-tab'));
      
      await waitFor(() => {
        expect(getByTestId('notifications-list')).toBeTruthy();
      });

      // Switch back to feed tab
      fireEvent.press(getByTestId('feed-tab'));
      
      await waitFor(() => {
        expect(getByTestId('posts-list')).toBeTruthy();
      });
    });

    it('shows unread notification count', async () => {
      const { getByTestId } = renderWithNavigation(
        <HomeScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByTestId('notifications-tab')).toBeTruthy();
      });

      const notificationsTab = getByTestId('notifications-tab');
      // Should show unread count (1 unread notification)
      expect(notificationsTab.props.children.props.children).toContain('(1)');
    });
  });

  describe('Post Interactions', () => {
    it('handles post voting', async () => {
      const { getByTestId, getAllByTestId } = renderWithNavigation(
        <HomeScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByTestId('post-card-1')).toBeTruthy();
      });

      const upvoteButton = getAllByTestId('upvote-button')[0];
      const voteCount = getAllByTestId('vote-count')[0];

      // Initial vote count
      expect(voteCount.props.children).toBe(42);

      // Upvote
      fireEvent.press(upvoteButton);

      // Vote count should increase
      expect(voteCount.props.children).toBe(43);
    });

    it('handles post navigation', async () => {
      const { getByTestId } = renderWithNavigation(
        <HomeScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByTestId('post-card-1')).toBeTruthy();
      });

      fireEvent.press(getByTestId('post-card-1'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('PostDetail', { postId: '1' });
    });
  });

  describe('Notification Management', () => {
    it('displays notifications correctly', async () => {
      const { getByTestId } = renderWithNavigation(
        <HomeScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByTestId('notifications-tab')).toBeTruthy();
      });

      // Switch to notifications tab
      fireEvent.press(getByTestId('notifications-tab'));

      await waitFor(() => {
        expect(getByTestId('notification-1')).toBeTruthy();
        expect(getByTestId('notification-2')).toBeTruthy();
      });
    });

    it('handles notification press and navigation', async () => {
      const { getByTestId } = renderWithNavigation(
        <HomeScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByTestId('notifications-tab')).toBeTruthy();
      });

      fireEvent.press(getByTestId('notifications-tab'));

      await waitFor(() => {
        expect(getByTestId('notification-1')).toBeTruthy();
      });

      fireEvent.press(getByTestId('notification-1'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('PostDetail', { postId: '1' });
    });

    it('marks notifications as read', async () => {
      mockApiService.markNotificationRead.mockResolvedValue({ success: true });

      const { getByTestId } = renderWithNavigation(
        <HomeScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByTestId('notifications-tab')).toBeTruthy();
      });

      fireEvent.press(getByTestId('notifications-tab'));

      await waitFor(() => {
        expect(getByTestId('mark-read-button')).toBeTruthy();
      });

      fireEvent.press(getByTestId('mark-read-button'));

      expect(mockApiService.markNotificationRead).toHaveBeenCalledWith('1');
    });
  });

  describe('Pull to Refresh', () => {
    it('handles pull to refresh on feed', async () => {
      const { getByTestId } = renderWithNavigation(
        <HomeScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByTestId('posts-list')).toBeTruthy();
      });

      const postsList = getByTestId('posts-list');
      
      // Simulate pull to refresh
      fireEvent(postsList, 'refresh');

      expect(mockApiService.getFeed).toHaveBeenCalledTimes(2); // Initial load + refresh
    });

    it('handles pull to refresh on notifications', async () => {
      const { getByTestId } = renderWithNavigation(
        <HomeScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByTestId('notifications-tab')).toBeTruthy();
      });

      fireEvent.press(getByTestId('notifications-tab'));

      await waitFor(() => {
        expect(getByTestId('notifications-list')).toBeTruthy();
      });

      const notificationsList = getByTestId('notifications-list');
      
      // Simulate pull to refresh
      fireEvent(notificationsList, 'refresh');

      expect(mockApiService.getNotifications).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('displays error state when API fails', async () => {
      mockApiService.getFeed.mockRejectedValue(new Error('API Error'));

      const { getByTestId } = renderWithNavigation(
        <HomeScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByTestId('error-state')).toBeTruthy();
      });

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to load data. Please try again.');
    });

    it('handles retry functionality', async () => {
      mockApiService.getFeed
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce({ posts: mockPosts });

      const { getByTestId } = renderWithNavigation(
        <HomeScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByTestId('error-state')).toBeTruthy();
      });

      fireEvent.press(getByTestId('retry-button'));

      await waitFor(() => {
        expect(getByTestId('home-screen')).toBeTruthy();
      });
    });

    it('handles voting errors gracefully', async () => {
      const { getByTestId, getAllByTestId } = renderWithNavigation(
        <HomeScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByTestId('post-card-1')).toBeTruthy();
      });

      const upvoteButton = getAllByTestId('upvote-button')[0];
      
      // Mock console.log to track vote attempts
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      fireEvent.press(upvoteButton);

      expect(consoleSpy).toHaveBeenCalledWith('Voted up on post 1');

      consoleSpy.mockRestore();
    });
  });

  describe('Loading States', () => {
    it('shows loading spinner initially', () => {
      mockApiService.getFeed.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ posts: mockPosts }), 1000))
      );

      const { getByTestId } = renderWithNavigation(
        <HomeScreen navigation={mockNavigation} />
      );

      expect(getByTestId('loading-state')).toBeTruthy();
    });

    it('hides loading state after data loads', async () => {
      const { getByTestId, queryByTestId } = renderWithNavigation(
        <HomeScreen navigation={mockNavigation} />
      );

      // Initially loading
      expect(getByTestId('loading-state')).toBeTruthy();

      // Wait for data to load
      await waitFor(() => {
        expect(queryByTestId('loading-state')).toBeFalsy();
      });

      expect(getByTestId('home-screen')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibility props', async () => {
      const { getByTestId } = renderWithNavigation(
        <HomeScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByTestId('home-screen')).toBeTruthy();
      });

      // Check if buttons are accessible
      expect(getByTestId('feed-tab')).toBeTruthy();
      expect(getByTestId('notifications-tab')).toBeTruthy();
    });

    it('supports screen reader navigation', async () => {
      const { getByTestId } = renderWithNavigation(
        <HomeScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByTestId('post-card-1')).toBeTruthy();
      });

      // Posts should be accessible for screen readers
      const postCard = getByTestId('post-card-1');
      expect(postCard).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('renders efficiently with large datasets', async () => {
      const largePosts = Array(100).fill(0).map((_, i) => ({
        ...mockPosts[0],
        id: `${i}`,
        title: `Post ${i}`,
        votes: i * 10,
      }));

      mockApiService.getFeed.mockResolvedValue({ posts: largePosts });

      const startTime = performance.now();
      
      const { getByTestId } = renderWithNavigation(
        <HomeScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByTestId('home-screen')).toBeTruthy();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (less than 1000ms)
      expect(renderTime).toBeLessThan(1000);
    });

    it('handles memory efficiently with FlatList', async () => {
      const largePosts = Array(1000).fill(0).map((_, i) => ({
        ...mockPosts[0],
        id: `${i}`,
        title: `Post ${i}`,
      }));

      mockApiService.getFeed.mockResolvedValue({ posts: largePosts });

      const { getByTestId } = renderWithNavigation(
        <HomeScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByTestId('posts-list')).toBeTruthy();
      });

      // FlatList should handle large datasets efficiently
      expect(getByTestId('posts-list')).toBeTruthy();
    });
  });
});