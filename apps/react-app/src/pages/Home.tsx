import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { colors, spacing } from '../design-system/tokens';
import { Feed, Composer, Text } from '../design-system';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Mock data for demonstration
const mockPosts = [
  {
    id: '1',
    author: {
      username: 'cryptowhale',
      displayName: 'Crypto Whale',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cryptowhale',
      isVerified: true,
    },
    content: 'Just minted my first NFT on CRYB! The platform is incredible. Social-first Web3 is the future. 🚀',
    createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    likeCount: 42,
    repostCount: 12,
    replyCount: 8,
    bookmarkCount: 15,
    isLiked: false,
    isReposted: false,
    isBookmarked: false,
  },
  {
    id: '2',
    author: {
      username: 'nftartist',
      displayName: 'NFT Artist',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nftartist',
      isVerified: false,
    },
    content: 'Check out my new collection dropping tomorrow! Who\'s ready?',
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    likeCount: 156,
    repostCount: 34,
    replyCount: 23,
    bookmarkCount: 67,
    isLiked: true,
    isReposted: false,
    isBookmarked: true,
    media: [
      {
        type: 'IMAGE' as const,
        url: 'https://picsum.photos/600/400',
        thumbnail: 'https://picsum.photos/300/200',
      },
    ],
  },
  {
    id: '3',
    author: {
      username: 'defidev',
      displayName: 'DeFi Developer',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=defidev',
      isVerified: true,
    },
    content: 'Love how @cryptowhale is building on CRYB. The social features are smooth!',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    likeCount: 89,
    repostCount: 21,
    replyCount: 15,
    bookmarkCount: 32,
    isLiked: false,
    isReposted: true,
    isBookmarked: false,
    quotedPost: {
      author: {
        username: 'cryptowhale',
        displayName: 'Crypto Whale',
      },
      content: 'Just minted my first NFT on CRYB! The platform is incredible.',
    },
  },
];

const mockCurrentUser = {
  username: 'yourhandle',
  displayName: 'Your Name',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=yourhandle',
};

export const Home: React.FC = () => {
  const [posts, setPosts] = React.useState(mockPosts);
  const [activeTab, setActiveTab] = React.useState<'foryou' | 'following'>('foryou');

  const handlePost = async (content: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const newPost = {
      id: String(Date.now()),
      author: mockCurrentUser,
      content,
      createdAt: new Date(),
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
      bookmarkCount: 0,
      isLiked: false,
      isReposted: false,
      isBookmarked: false,
    };

    setPosts([newPost, ...posts]);
  };

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: colors['bg-primary'],
  };

  const maxWidthContainerStyle: React.CSSProperties = {
    maxWidth: '600px',
    margin: '0 auto',
    padding: spacing[4],
  };

  const headerStyle: React.CSSProperties = {
    position: 'sticky',
    top: 0,
    backgroundColor: colors['bg-primary'],
    borderBottom: `1px solid ${colors['border-default']}`,
    padding: spacing[4],
    marginBottom: spacing[4],
    zIndex: 10,
  };

  const tabsStyle: React.CSSProperties = {
    display: 'flex',
    gap: spacing[4],
  };

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    cursor: 'pointer',
    padding: `${spacing[2]} 0`,
    borderBottom: `2px solid ${isActive ? colors['brand-primary'] : 'transparent'}`,
    transition: 'all 150ms ease-out',
  });

  const composerWrapperStyle: React.CSSProperties = {
    marginBottom: spacing[4],
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div style={containerStyle}>
        <div style={maxWidthContainerStyle}>
          {/* Header */}
          <div style={headerStyle}>
            <Text size="xl" weight="bold" style={{ marginBottom: spacing[3] }}>
              CRYB.AI
            </Text>
            <div style={tabsStyle}>
              <div
                style={tabStyle(activeTab === 'foryou')}
                onClick={() => setActiveTab('foryou')}
              >
                <Text weight={activeTab === 'foryou' ? 'semibold' : 'regular'}>
                  For You
                </Text>
              </div>
              <div
                style={tabStyle(activeTab === 'following')}
                onClick={() => setActiveTab('following')}
              >
                <Text weight={activeTab === 'following' ? 'semibold' : 'regular'}>
                  Following
                </Text>
              </div>
            </div>
          </div>

          {/* Composer */}
          <div style={composerWrapperStyle}>
            <Composer
              currentUser={mockCurrentUser}
              onPost={handlePost}
              placeholder="What's happening on CRYB?"
            />
          </div>

          {/* Feed */}
          <Feed
            posts={posts}
            isLoading={false}
            hasMore={false}
            onPostClick={(postId) => console.log('Post clicked:', postId)}
            onUserClick={(username) => console.log('User clicked:', username)}
            onReplyClick={(postId) => console.log('Reply clicked:', postId)}
          />
        </div>
      </div>
    </QueryClientProvider>
  );
};

export default Home;
