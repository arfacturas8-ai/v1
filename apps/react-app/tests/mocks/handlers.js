/**
 * Mock Service Handlers
 * Provides mock implementations for all services
 */

import { vi } from 'vitest';
import { mockApiResponses, mockUser, mockCommunity, mockPost } from './mockData';

/**
 * Mock Auth Service
 */
export const mockAuthService = {
  login: vi.fn().mockResolvedValue({
    success: true,
    user: mockUser,
    token: 'mock-token',
  }),
  register: vi.fn().mockResolvedValue({
    success: true,
    user: mockUser,
    token: 'mock-token',
  }),
  logout: vi.fn().mockResolvedValue({ success: true }),
  getCurrentUser: vi.fn().mockResolvedValue({
    success: true,
    user: mockUser,
  }),
  refreshToken: vi.fn().mockResolvedValue({
    success: true,
    token: 'mock-token',
  }),
  forgotPassword: vi.fn().mockResolvedValue({ success: true }),
  resetPassword: vi.fn().mockResolvedValue({ success: true }),
  verifyEmail: vi.fn().mockResolvedValue({ success: true }),
  changePassword: vi.fn().mockResolvedValue({ success: true }),
  setupMFA: vi.fn().mockResolvedValue({
    success: true,
    qrCode: 'mock-qr-code',
    secret: 'mock-secret',
  }),
  verifyMFA: vi.fn().mockResolvedValue({ success: true }),
};

/**
 * Mock Community Service
 */
export const mockCommunityService = {
  getCommunities: vi.fn().mockResolvedValue({
    success: true,
    data: [mockCommunity],
  }),
  getCommunity: vi.fn().mockResolvedValue({
    success: true,
    data: mockCommunity,
  }),
  createCommunity: vi.fn().mockResolvedValue({
    success: true,
    data: mockCommunity,
  }),
  updateCommunity: vi.fn().mockResolvedValue({
    success: true,
    data: mockCommunity,
  }),
  deleteCommunity: vi.fn().mockResolvedValue({ success: true }),
  joinCommunity: vi.fn().mockResolvedValue({ success: true }),
  leaveCommunity: vi.fn().mockResolvedValue({ success: true }),
  getMembers: vi.fn().mockResolvedValue({
    success: true,
    data: [mockUser],
  }),
  searchCommunities: vi.fn().mockResolvedValue({
    success: true,
    data: [mockCommunity],
  }),
};

/**
 * Mock Posts Service
 */
export const mockPostsService = {
  getPosts: vi.fn().mockResolvedValue({
    success: true,
    data: [mockPost],
  }),
  getPost: vi.fn().mockResolvedValue({
    success: true,
    data: mockPost,
  }),
  createPost: vi.fn().mockResolvedValue({
    success: true,
    data: mockPost,
  }),
  updatePost: vi.fn().mockResolvedValue({
    success: true,
    data: mockPost,
  }),
  deletePost: vi.fn().mockResolvedValue({ success: true }),
  likePost: vi.fn().mockResolvedValue({ success: true }),
  unlikePost: vi.fn().mockResolvedValue({ success: true }),
  savePost: vi.fn().mockResolvedValue({ success: true }),
  unsavePost: vi.fn().mockResolvedValue({ success: true }),
  reportPost: vi.fn().mockResolvedValue({ success: true }),
  searchPosts: vi.fn().mockResolvedValue({
    success: true,
    data: [mockPost],
  }),
};

/**
 * Mock API Service
 */
export const mockApiService = {
  get: vi.fn().mockResolvedValue(mockApiResponses.success),
  post: vi.fn().mockResolvedValue(mockApiResponses.success),
  put: vi.fn().mockResolvedValue(mockApiResponses.success),
  patch: vi.fn().mockResolvedValue(mockApiResponses.success),
  delete: vi.fn().mockResolvedValue(mockApiResponses.success),
  request: vi.fn().mockResolvedValue(mockApiResponses.success),
};

/**
 * Mock WebSocket Service
 */
export const mockWebSocketService = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  isConnected: vi.fn().mockReturnValue(true),
  reconnect: vi.fn(),
};

/**
 * Mock NFT Service
 */
export const mockNFTService = {
  getNFTs: vi.fn().mockResolvedValue({
    success: true,
    data: [],
  }),
  getNFT: vi.fn().mockResolvedValue({
    success: true,
    data: {},
  }),
  mintNFT: vi.fn().mockResolvedValue({
    success: true,
    data: {},
  }),
  transferNFT: vi.fn().mockResolvedValue({ success: true }),
  listNFT: vi.fn().mockResolvedValue({ success: true }),
  buyNFT: vi.fn().mockResolvedValue({ success: true }),
};

/**
 * Mock User Service
 */
export const mockUserService = {
  getUser: vi.fn().mockResolvedValue({
    success: true,
    data: mockUser,
  }),
  updateProfile: vi.fn().mockResolvedValue({
    success: true,
    data: mockUser,
  }),
  uploadAvatar: vi.fn().mockResolvedValue({
    success: true,
    url: 'https://example.com/avatar.jpg',
  }),
  followUser: vi.fn().mockResolvedValue({ success: true }),
  unfollowUser: vi.fn().mockResolvedValue({ success: true }),
  blockUser: vi.fn().mockResolvedValue({ success: true }),
  unblockUser: vi.fn().mockResolvedValue({ success: true }),
  reportUser: vi.fn().mockResolvedValue({ success: true }),
  searchUsers: vi.fn().mockResolvedValue({
    success: true,
    data: [mockUser],
  }),
};

/**
 * Mock Message Service
 */
export const mockMessageService = {
  getConversations: vi.fn().mockResolvedValue({
    success: true,
    data: [],
  }),
  getMessages: vi.fn().mockResolvedValue({
    success: true,
    data: [],
  }),
  sendMessage: vi.fn().mockResolvedValue({
    success: true,
    data: {},
  }),
  deleteMessage: vi.fn().mockResolvedValue({ success: true }),
  markAsRead: vi.fn().mockResolvedValue({ success: true }),
};

/**
 * Mock Notification Service
 */
export const mockNotificationService = {
  getNotifications: vi.fn().mockResolvedValue({
    success: true,
    data: [],
  }),
  markAsRead: vi.fn().mockResolvedValue({ success: true }),
  markAllAsRead: vi.fn().mockResolvedValue({ success: true }),
  deleteNotification: vi.fn().mockResolvedValue({ success: true }),
  getUnreadCount: vi.fn().mockResolvedValue({
    success: true,
    count: 0,
  }),
};

/**
 * Mock Crypto Payment Service
 */
export const mockCryptoPaymentService = {
  createPayment: vi.fn().mockResolvedValue({
    success: true,
    data: {},
  }),
  verifyPayment: vi.fn().mockResolvedValue({
    success: true,
    verified: true,
  }),
  getTransactions: vi.fn().mockResolvedValue({
    success: true,
    data: [],
  }),
  connectWallet: vi.fn().mockResolvedValue({
    success: true,
    address: '0x1234567890123456789012345678901234567890',
  }),
  disconnectWallet: vi.fn().mockResolvedValue({ success: true }),
  getBalance: vi.fn().mockResolvedValue({
    success: true,
    balance: '10.5',
  }),
};

/**
 * Mock Offline Storage Service
 */
export const mockOfflineStorageService = {
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
  remove: vi.fn().mockResolvedValue(undefined),
  clear: vi.fn().mockResolvedValue(undefined),
  keys: vi.fn().mockResolvedValue([]),
};

/**
 * Mock Admin Service
 */
export const mockAdminService = {
  getStats: vi.fn().mockResolvedValue({
    success: true,
    data: {},
  }),
  getUsers: vi.fn().mockResolvedValue({
    success: true,
    data: [],
  }),
  banUser: vi.fn().mockResolvedValue({ success: true }),
  unbanUser: vi.fn().mockResolvedValue({ success: true }),
  deletePost: vi.fn().mockResolvedValue({ success: true }),
  getReports: vi.fn().mockResolvedValue({
    success: true,
    data: [],
  }),
  handleReport: vi.fn().mockResolvedValue({ success: true }),
};

/**
 * Mock Analytics Service
 */
export const mockAnalyticsService = {
  trackEvent: vi.fn(),
  trackPageView: vi.fn(),
  trackError: vi.fn(),
  setUser: vi.fn(),
  clearUser: vi.fn(),
};

/**
 * Mock Search Service
 */
export const mockSearchService = {
  search: vi.fn().mockResolvedValue({
    success: true,
    data: {
      posts: [],
      users: [],
      communities: [],
    },
  }),
  searchPosts: vi.fn().mockResolvedValue({
    success: true,
    data: [],
  }),
  searchUsers: vi.fn().mockResolvedValue({
    success: true,
    data: [],
  }),
  searchCommunities: vi.fn().mockResolvedValue({
    success: true,
    data: [],
  }),
};

/**
 * Reset all mocks
 */
export const resetAllMocks = () => {
  Object.values(mockAuthService).forEach((mock) => {
    if (typeof mock === 'function' && mock.mockClear) {
      mock.mockClear();
    }
  });
  Object.values(mockCommunityService).forEach((mock) => {
    if (typeof mock === 'function' && mock.mockClear) {
      mock.mockClear();
    }
  });
  Object.values(mockPostsService).forEach((mock) => {
    if (typeof mock === 'function' && mock.mockClear) {
      mock.mockClear();
    }
  });
  Object.values(mockApiService).forEach((mock) => {
    if (typeof mock === 'function' && mock.mockClear) {
      mock.mockClear();
    }
  });
  // Add more as needed
};

export default {
  mockAuthService,
  mockCommunityService,
  mockPostsService,
  mockApiService,
  mockWebSocketService,
  mockNFTService,
  mockUserService,
  mockMessageService,
  mockNotificationService,
  mockCryptoPaymentService,
  mockOfflineStorageService,
  mockAdminService,
  mockAnalyticsService,
  mockSearchService,
  resetAllMocks,
};
