/**
 * Mock Data for Testing
 * Centralized mock data to ensure consistency across tests
 */

export const mockUser = {
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  displayName: 'Test User',
  avatar: 'https://example.com/avatar.jpg',
  bio: 'Test bio',
  role: 'user',
  isVerified: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  walletAddress: '0x1234567890123456789012345678901234567890',
  followers: 100,
  following: 50,
  postsCount: 25,
  settings: {
    emailNotifications: true,
    pushNotifications: false,
    darkMode: false,
    language: 'en',
  },
};

export const mockAdmin = {
  ...mockUser,
  id: '2',
  username: 'admin',
  email: 'admin@example.com',
  role: 'admin',
};

export const mockCommunity = {
  id: '1',
  name: 'test-community',
  displayName: 'Test Community',
  description: 'A test community for testing',
  icon: 'https://example.com/icon.jpg',
  banner: 'https://example.com/banner.jpg',
  memberCount: 1000,
  postCount: 500,
  isPublic: true,
  isNSFW: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  rules: ['Rule 1', 'Rule 2'],
  tags: ['testing', 'community'],
  createdBy: mockUser,
};

export const mockPost = {
  id: '1',
  title: 'Test Post',
  content: 'This is a test post content',
  author: mockUser,
  community: mockCommunity,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  likes: 10,
  dislikes: 2,
  comments: 5,
  views: 100,
  isEdited: false,
  isPinned: false,
  isLocked: false,
  tags: ['test', 'post'],
  media: [],
  userVote: null,
};

export const mockComment = {
  id: '1',
  content: 'This is a test comment',
  author: mockUser,
  post: mockPost,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  likes: 5,
  dislikes: 1,
  replies: [],
  isEdited: false,
  userVote: null,
};

export const mockMessage = {
  id: '1',
  content: 'Test message',
  sender: mockUser,
  recipient: {
    id: '2',
    username: 'recipient',
    displayName: 'Recipient User',
  },
  createdAt: '2024-01-01T00:00:00.000Z',
  isRead: false,
  isDeleted: false,
};

export const mockConversation = {
  id: '1',
  participants: [
    mockUser,
    {
      id: '2',
      username: 'recipient',
      displayName: 'Recipient User',
      avatar: 'https://example.com/avatar2.jpg',
    },
  ],
  lastMessage: mockMessage,
  unreadCount: 3,
  updatedAt: '2024-01-01T00:00:00.000Z',
};

export const mockNFT = {
  id: '1',
  tokenId: '123',
  name: 'Test NFT',
  description: 'A test NFT',
  image: 'https://example.com/nft.jpg',
  owner: mockUser,
  creator: mockUser,
  price: '100',
  currency: 'ETH',
  blockchain: 'ethereum',
  contract: '0x1234567890123456789012345678901234567890',
  collection: 'Test Collection',
  attributes: [
    { trait_type: 'Color', value: 'Blue' },
    { trait_type: 'Rarity', value: 'Common' },
  ],
  createdAt: '2024-01-01T00:00:00.000Z',
  isListed: true,
};

export const mockNotification = {
  id: '1',
  type: 'like',
  title: 'New Like',
  message: 'Someone liked your post',
  sender: mockUser,
  link: '/post/1',
  isRead: false,
  createdAt: '2024-01-01T00:00:00.000Z',
};

export const mockServer = {
  id: '1',
  name: 'Test Server',
  description: 'A test server',
  icon: 'https://example.com/server-icon.jpg',
  owner: mockUser,
  memberCount: 50,
  channels: [
    {
      id: '1',
      name: 'general',
      type: 'text',
      topic: 'General discussion',
    },
    {
      id: '2',
      name: 'voice-chat',
      type: 'voice',
      topic: 'Voice channel',
    },
  ],
  roles: [
    {
      id: '1',
      name: 'Admin',
      color: '#FF0000',
      permissions: ['manage_server', 'manage_channels'],
    },
  ],
  createdAt: '2024-01-01T00:00:00.000Z',
};

export const mockChannel = {
  id: '1',
  name: 'general',
  type: 'text',
  topic: 'General discussion',
  server: mockServer,
  messages: [],
  permissions: [],
  createdAt: '2024-01-01T00:00:00.000Z',
};

export const mockReport = {
  id: '1',
  type: 'post',
  targetId: '1',
  reason: 'Spam',
  description: 'This post is spam',
  reporter: mockUser,
  status: 'pending',
  createdAt: '2024-01-01T00:00:00.000Z',
};

export const mockStats = {
  totalUsers: 10000,
  activeUsers: 500,
  onlineUsers: 100,
  totalPosts: 50000,
  totalCommunities: 500,
  totalVolume: 1000000,
  transactions: 5000,
};

export const mockActivity = {
  id: '1',
  type: 'post_created',
  user: mockUser,
  target: mockPost,
  createdAt: '2024-01-01T00:00:00.000Z',
};

export const mockWallet = {
  address: '0x1234567890123456789012345678901234567890',
  balance: '10.5',
  currency: 'ETH',
  network: 'ethereum',
  isConnected: true,
};

export const mockTransaction = {
  id: '1',
  hash: '0xabcdef1234567890',
  from: '0x1234567890123456789012345678901234567890',
  to: '0x0987654321098765432109876543210987654321',
  amount: '1.5',
  currency: 'ETH',
  status: 'confirmed',
  timestamp: '2024-01-01T00:00:00.000Z',
  gasUsed: '21000',
  gasPrice: '50',
};

// Mock API responses
export const mockApiResponses = {
  success: {
    success: true,
    message: 'Operation successful',
  },
  error: {
    success: false,
    message: 'Operation failed',
    error: 'An error occurred',
  },
  userProfile: {
    success: true,
    data: mockUser,
  },
  communities: {
    success: true,
    data: [mockCommunity],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      hasMore: false,
    },
  },
  posts: {
    success: true,
    data: [mockPost],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      hasMore: false,
    },
  },
  comments: {
    success: true,
    data: [mockComment],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      hasMore: false,
    },
  },
  notifications: {
    success: true,
    data: [mockNotification],
    unreadCount: 1,
  },
  stats: {
    success: true,
    data: mockStats,
  },
};

// Mock form data
export const mockFormData = {
  login: {
    email: 'test@example.com',
    password: 'password123',
  },
  register: {
    username: 'newuser',
    email: 'newuser@example.com',
    password: 'password123',
    confirmPassword: 'password123',
  },
  createPost: {
    title: 'New Post Title',
    content: 'New post content',
    communityId: '1',
    tags: ['test'],
  },
  createCommunity: {
    name: 'new-community',
    displayName: 'New Community',
    description: 'A new community',
    isPublic: true,
  },
  updateProfile: {
    displayName: 'Updated Name',
    bio: 'Updated bio',
  },
};

export default {
  mockUser,
  mockAdmin,
  mockCommunity,
  mockPost,
  mockComment,
  mockMessage,
  mockConversation,
  mockNFT,
  mockNotification,
  mockServer,
  mockChannel,
  mockReport,
  mockStats,
  mockActivity,
  mockWallet,
  mockTransaction,
  mockApiResponses,
  mockFormData,
};
