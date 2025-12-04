import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { Search, TrendingUp, Users, Hash } from 'lucide-react-native';

interface TrendingTopic {
  tag: string;
  posts: number;
  growth: string;
}

interface SuggestedUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  followers: number;
  isVerified: boolean;
}

interface TrendingPost {
  id: string;
  author: {
    username: string;
    displayName: string;
    avatar: string;
    isVerified: boolean;
  };
  content: string;
  likes: number;
  reposts: number;
  comments: number;
  timestamp: string;
}

export default function ExploreScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'trending' | 'people' | 'topics'>('trending');

  const [trendingTopics] = useState<TrendingTopic[]>([
    { tag: '#Web3Gaming', posts: 12400, growth: '+24%' },
    { tag: '#NFTArt', posts: 8900, growth: '+18%' },
    { tag: '#DeFi', posts: 15600, growth: '+32%' },
    { tag: '#Metaverse', posts: 9200, growth: '+15%' },
    { tag: '#CryptoNews', posts: 21000, growth: '+45%' },
    { tag: '#DAOs', posts: 5400, growth: '+12%' },
  ]);

  const [suggestedUsers] = useState<SuggestedUser[]>([
    {
      id: '1',
      username: 'vitalik.eth',
      displayName: 'Vitalik Buterin',
      avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=vitalik',
      bio: 'Ethereum co-founder',
      followers: 500000,
      isVerified: true,
    },
    {
      id: '2',
      username: 'beeple',
      displayName: 'Beeple',
      avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=beeple',
      bio: 'Digital artist',
      followers: 250000,
      isVerified: true,
    },
    {
      id: '3',
      username: 'punk6529',
      displayName: 'punk6529',
      avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=punk6529',
      bio: 'NFT collector & advocate',
      followers: 180000,
      isVerified: true,
    },
  ]);

  const [trendingPosts] = useState<TrendingPost[]>([
    {
      id: '1',
      author: {
        username: 'cryptowhale',
        displayName: 'Crypto Whale',
        avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=whale',
        isVerified: true,
      },
      content: 'Just minted my first NFT collection on CRYB! The future of social Web3 is here 🚀',
      likes: 2400,
      reposts: 580,
      comments: 320,
      timestamp: '2h ago',
    },
    {
      id: '2',
      author: {
        username: 'web3builder',
        displayName: 'Web3 Builder',
        avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=builder',
        isVerified: false,
      },
      content: 'The CRYB platform is changing the game. Social + NFTs + DeFi all in one place 🔥',
      likes: 1800,
      reposts: 420,
      comments: 210,
      timestamp: '4h ago',
    },
  ]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const renderTrendingContent = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <TrendingUp size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Trending Topics
          </Text>
        </View>
        {trendingTopics.slice(0, 3).map((topic, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.topicCard, { backgroundColor: colors.cardBackground }]}
            onPress={() => navigation.navigate('Search', { query: topic.tag })}
          >
            <View style={styles.topicHeader}>
              <Text style={[styles.topicTag, { color: colors.primary }]}>
                {topic.tag}
              </Text>
              <View style={[styles.growthBadge, { backgroundColor: `${colors.success}20` }]}>
                <Text style={[styles.growthText, { color: colors.success }]}>
                  {topic.growth}
                </Text>
              </View>
            </View>
            <Text style={[styles.topicPosts, { color: colors.textSecondary }]}>
              {formatNumber(topic.posts)} posts
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <TrendingUp size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Trending Posts
          </Text>
        </View>
        {trendingPosts.map((post) => (
          <TouchableOpacity
            key={post.id}
            style={[styles.postCard, { backgroundColor: colors.cardBackground }]}
            onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
          >
            <View style={styles.postHeader}>
              <Image source={{ uri: post.author.avatar }} style={styles.avatar} />
              <View style={styles.postAuthor}>
                <View style={styles.authorName}>
                  <Text style={[styles.displayName, { color: colors.text }]}>
                    {post.author.displayName}
                  </Text>
                  {post.author.isVerified && (
                    <Text style={styles.verified}>✓</Text>
                  )}
                </View>
                <Text style={[styles.username, { color: colors.textSecondary }]}>
                  @{post.author.username} · {post.timestamp}
                </Text>
              </View>
            </View>
            <Text style={[styles.postContent, { color: colors.text }]}>
              {post.content}
            </Text>
            <View style={styles.postStats}>
              <Text style={[styles.stat, { color: colors.textSecondary }]}>
                ❤️ {formatNumber(post.likes)}
              </Text>
              <Text style={[styles.stat, { color: colors.textSecondary }]}>
                🔄 {formatNumber(post.reposts)}
              </Text>
              <Text style={[styles.stat, { color: colors.textSecondary }]}>
                💬 {formatNumber(post.comments)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderPeopleContent = () => (
    <FlatList
      data={suggestedUsers}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.tabContent}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.userCard, { backgroundColor: colors.cardBackground }]}
          onPress={() => navigation.navigate('Profile', { username: item.username })}
        >
          <Image source={{ uri: item.avatar }} style={styles.userAvatar} />
          <View style={styles.userInfo}>
            <View style={styles.userNameRow}>
              <Text style={[styles.userDisplayName, { color: colors.text }]}>
                {item.displayName}
              </Text>
              {item.isVerified && (
                <Text style={styles.verified}>✓</Text>
              )}
            </View>
            <Text style={[styles.userUsername, { color: colors.textSecondary }]}>
              @{item.username}
            </Text>
            <Text style={[styles.userBio, { color: colors.textSecondary }]}>
              {item.bio}
            </Text>
            <Text style={[styles.userFollowers, { color: colors.textTertiary }]}>
              {formatNumber(item.followers)} followers
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.viewButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('Profile', { username: item.username })}
          >
            <Text style={styles.viewButtonText}>View</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    />
  );

  const renderTopicsContent = () => (
    <FlatList
      data={trendingTopics}
      keyExtractor={(item, index) => index.toString()}
      numColumns={2}
      contentContainerStyle={styles.tabContent}
      columnWrapperStyle={styles.topicsGrid}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.topicGridCard, { backgroundColor: colors.cardBackground }]}
          onPress={() => navigation.navigate('Search', { query: item.tag })}
        >
          <Hash size={24} color={colors.primary} />
          <Text style={[styles.topicGridTag, { color: colors.text }]}>
            {item.tag.replace('#', '')}
          </Text>
          <Text style={[styles.topicGridPosts, { color: colors.textSecondary }]}>
            {formatNumber(item.posts)} posts
          </Text>
          <View style={[styles.topicGridGrowth, { backgroundColor: `${colors.success}20` }]}>
            <Text style={[styles.topicGridGrowthText, { color: colors.success }]}>
              {item.growth}
            </Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchBar, { backgroundColor: colors.cardBackground }]}>
        <Search size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search CRYB"
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => {
            if (searchQuery.trim()) {
              navigation.navigate('Search', { query: searchQuery });
            }
          }}
        />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'trending' && [styles.activeTab, { borderBottomColor: colors.primary }],
          ]}
          onPress={() => setActiveTab('trending')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'trending' ? colors.primary : colors.textSecondary },
            ]}
          >
            Trending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'people' && [styles.activeTab, { borderBottomColor: colors.primary }],
          ]}
          onPress={() => setActiveTab('people')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'people' ? colors.primary : colors.textSecondary },
            ]}
          >
            People
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'topics' && [styles.activeTab, { borderBottomColor: colors.primary }],
          ]}
          onPress={() => setActiveTab('topics')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'topics' ? colors.primary : colors.textSecondary },
            ]}
          >
            Topics
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'trending' && renderTrendingContent()}
      {activeTab === 'people' && renderPeopleContent()}
      {activeTab === 'topics' && renderTopicsContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  tabContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  topicCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  topicTag: {
    fontSize: 16,
    fontWeight: '600',
  },
  growthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  growthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  topicPosts: {
    fontSize: 14,
  },
  postCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  postHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  postAuthor: {
    flex: 1,
  },
  authorName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  displayName: {
    fontSize: 15,
    fontWeight: '600',
  },
  verified: {
    color: '#1DA1F2',
    fontSize: 14,
  },
  username: {
    fontSize: 14,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  postStats: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    fontSize: 14,
  },
  userCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userDisplayName: {
    fontSize: 16,
    fontWeight: '600',
  },
  userUsername: {
    fontSize: 14,
    marginTop: 2,
  },
  userBio: {
    fontSize: 14,
    marginTop: 4,
  },
  userFollowers: {
    fontSize: 12,
    marginTop: 4,
  },
  viewButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  topicsGrid: {
    gap: 12,
    marginBottom: 12,
  },
  topicGridCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  topicGridTag: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  topicGridPosts: {
    fontSize: 13,
    marginTop: 4,
  },
  topicGridGrowth: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  topicGridGrowthText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
