import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuthStore } from '../stores/authStore';
import { MainStackParamList } from '../navigation/MainNavigator';

type HomeScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'MainTabs'>;

interface FeedItem {
  id: string;
  type: 'post' | 'server-activity' | 'announcement';
  title: string;
  content: string;
  author: string;
  timestamp: string;
  serverName?: string;
  imageUrl?: string;
  likes: number;
  comments: number;
}

const mockFeedData: FeedItem[] = [
  {
    id: '1',
    type: 'announcement',
    title: 'Welcome to CRYB!',
    content: 'Explore our hybrid platform combining Discord-like chat with Reddit-style communities.',
    author: 'CRYB Team',
    timestamp: '2 hours ago',
    likes: 42,
    comments: 8,
  },
  {
    id: '2',
    type: 'server-activity',
    title: 'New message in Gaming Hub',
    content: 'Join the discussion about the latest game releases and upcoming tournaments.',
    author: 'GameMaster',
    timestamp: '4 hours ago',
    serverName: 'Gaming Hub',
    likes: 15,
    comments: 3,
  },
  {
    id: '3',
    type: 'post',
    title: 'Crypto Market Analysis',
    content: 'Share your thoughts on the current market trends and predictions for the upcoming quarter.',
    author: 'CryptoAnalyst',
    timestamp: '6 hours ago',
    imageUrl: 'https://via.placeholder.com/300x150',
    likes: 28,
    comments: 12,
  },
];

export function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { colors } = useTheme();
  const { user } = useAuthStore();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedData, setFeedData] = useState<FeedItem[]>(mockFeedData);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // TODO: Fetch fresh data from API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setFeedData(mockFeedData);
    } catch (error) {
      console.error('Error refreshing feed:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleItemPress = useCallback((item: FeedItem) => {
    if (item.type === 'server-activity' && item.serverName) {
      // Navigate to server
      navigation.navigate('Server', {
        serverId: 'server-1',
        serverName: item.serverName,
      });
    }
  }, [navigation]);

  const renderFeedItem = ({ item }: { item: FeedItem }) => (
    <TouchableOpacity 
      style={[styles.feedItem, { backgroundColor: colors.card }]}
      onPress={() => handleItemPress(item)}
    >
      <View style={styles.feedItemHeader}>
        <View style={styles.feedItemType}>
          <Ionicons 
            name={item.type === 'announcement' ? 'megaphone' : 
                 item.type === 'server-activity' ? 'people' : 'document-text'}
            size={16}
            color={colors.primary}
          />
          <Text style={[styles.feedItemTypeText, { color: colors.primary }]}>
            {item.type === 'announcement' ? 'Announcement' :
             item.type === 'server-activity' ? 'Server Activity' : 'Post'}
          </Text>
        </View>
        <Text style={[styles.feedItemTimestamp, { color: colors.textSecondary }]}>
          {item.timestamp}
        </Text>
      </View>

      <Text style={[styles.feedItemTitle, { color: colors.text }]}>
        {item.title}
      </Text>
      
      <Text style={[styles.feedItemContent, { color: colors.textSecondary }]}>
        {item.content}
      </Text>

      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.feedItemImage} />
      )}

      <View style={styles.feedItemFooter}>
        <View style={styles.feedItemAuthor}>
          <Text style={[styles.feedItemAuthorText, { color: colors.textSecondary }]}>
            by {item.author}
          </Text>
          {item.serverName && (
            <Text style={[styles.feedItemServerName, { color: colors.primary }]}>
              in {item.serverName}
            </Text>
          )}
        </View>

        <View style={styles.feedItemActions}>
          <View style={styles.feedItemAction}>
            <Ionicons name="heart-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.feedItemActionText, { color: colors.textSecondary }]}>
              {item.likes}
            </Text>
          </View>
          <View style={styles.feedItemAction}>
            <Ionicons name="chatbubble-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.feedItemActionText, { color: colors.textSecondary }]}>
              {item.comments}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.text }]}>
            Welcome back, {user?.username || 'User'}!
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Stay connected with your communities
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={[styles.quickAction, { backgroundColor: colors.surface }]}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Chat' })}
        >
          <Ionicons name="chatbubbles" size={24} color={colors.primary} />
          <Text style={[styles.quickActionText, { color: colors.text }]}>Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.quickAction, { backgroundColor: colors.surface }]}
          onPress={() => navigation.navigate('CreateServer')}
        >
          <Ionicons name="add-circle" size={24} color={colors.primary} />
          <Text style={[styles.quickActionText, { color: colors.text }]}>Create</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.quickAction, { backgroundColor: colors.surface }]}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Communities' })}
        >
          <Ionicons name="people" size={24} color={colors.primary} />
          <Text style={[styles.quickActionText, { color: colors.text }]}>Communities</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Recent Activity
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={feedData}
        renderItem={renderFeedItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  settingsButton: {
    padding: 8,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  feedItem: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  feedItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedItemType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  feedItemTypeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  feedItemTimestamp: {
    fontSize: 12,
  },
  feedItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  feedItemContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  feedItemImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
  },
  feedItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedItemAuthor: {
    flex: 1,
  },
  feedItemAuthorText: {
    fontSize: 12,
  },
  feedItemServerName: {
    fontSize: 12,
    fontWeight: '600',
  },
  feedItemActions: {
    flexDirection: 'row',
    gap: 16,
  },
  feedItemAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  feedItemActionText: {
    fontSize: 12,
  },
});