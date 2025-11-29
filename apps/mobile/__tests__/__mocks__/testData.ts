/**
 * Mock data generators for React Native tests
 */

export const createMockUser = (overrides = {}) => ({
  id: 'user1',
  username: 'testuser',
  displayName: 'Test User',
  email: 'test@example.com',
  avatar: null,
  isVerified: false,
  isOnline: true,
  lastSeen: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockMessage = (overrides = {}) => ({
  id: 'msg1',
  content: 'Test message content',
  type: 'text',
  channelId: 'channel1',
  authorId: 'user1',
  author: createMockUser(),
  createdAt: new Date(),
  updatedAt: new Date(),
  editedAt: null,
  deletedAt: null,
  attachments: [],
  reactions: [],
  mentions: [],
  replyToId: null,
  replyTo: null,
  isPinned: false,
  isSystem: false,
  metadata: {},
  ...overrides,
});

export const createMockServer = (overrides = {}) => ({
  id: 'server1',
  name: 'Test Server',
  description: 'A test server for unit tests',
  icon: null,
  banner: null,
  ownerId: 'user1',
  owner: createMockUser(),
  isPublic: true,
  inviteCode: 'test123',
  memberCount: 10,
  channels: [],
  members: [],
  roles: [],
  emojis: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockChannel = (overrides = {}) => ({
  id: 'channel1',
  name: 'general',
  description: 'General chat channel',
  type: 'text',
  serverId: 'server1',
  server: createMockServer(),
  position: 0,
  isPrivate: false,
  slowModeSeconds: 0,
  parentChannelId: null,
  parentChannel: null,
  childChannels: [],
  permissions: {},
  lastMessageId: null,
  lastMessage: null,
  unreadCount: 0,
  mentionCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockPost = (overrides = {}) => ({
  id: 'post1',
  title: 'Test Post',
  content: 'This is a test post content',
  type: 'text',
  authorId: 'user1',
  author: createMockUser(),
  communityId: 'community1',
  community: null,
  score: 0,
  upvotes: 0,
  downvotes: 0,
  userVote: null,
  commentCount: 0,
  viewCount: 0,
  isStickied: false,
  isLocked: false,
  isRemoved: false,
  isNsfw: false,
  isSpoiler: false,
  flairId: null,
  flair: null,
  imageUrl: null,
  linkUrl: null,
  videoUrl: null,
  thumbnailUrl: null,
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  editedAt: null,
  ...overrides,
});

export const createMockComment = (overrides = {}) => ({
  id: 'comment1',
  content: 'Test comment content',
  authorId: 'user1',
  author: createMockUser(),
  postId: 'post1',
  post: createMockPost(),
  parentCommentId: null,
  parentComment: null,
  childComments: [],
  depth: 0,
  score: 0,
  upvotes: 0,
  downvotes: 0,
  userVote: null,
  isRemoved: false,
  isEdited: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  editedAt: null,
  ...overrides,
});

export const createMockCommunity = (overrides = {}) => ({
  id: 'community1',
  name: 'testcommunity',
  displayName: 'Test Community',
  description: 'A test community for unit tests',
  icon: null,
  banner: null,
  isNsfw: false,
  isPrivate: false,
  memberCount: 100,
  postCount: 50,
  isJoined: false,
  canPost: true,
  rules: [],
  moderators: [],
  tags: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockNotification = (overrides = {}) => ({
  id: 'notification1',
  type: 'message',
  title: 'New Message',
  content: 'You have received a new message',
  userId: 'user1',
  data: {},
  isRead: false,
  actionUrl: null,
  imageUrl: null,
  createdAt: new Date(),
  readAt: null,
  ...overrides,
});

export const createMockVoiceState = (overrides = {}) => ({
  userId: 'user1',
  user: createMockUser(),
  channelId: 'voice1',
  channel: createMockChannel({ type: 'voice' }),
  serverId: 'server1',
  server: createMockServer(),
  isMuted: false,
  isDeafened: false,
  isSpeaking: false,
  joinedAt: new Date(),
  ...overrides,
});

export const createMockReaction = (overrides = {}) => ({
  emoji: '👍',
  count: 1,
  users: ['user1'],
  hasReacted: false,
  ...overrides,
});

export const createMockAttachment = (overrides = {}) => ({
  id: 'attachment1',
  filename: 'test.jpg',
  originalFilename: 'test-image.jpg',
  mimeType: 'image/jpeg',
  size: 1024000,
  url: 'https://example.com/attachments/test.jpg',
  thumbnailUrl: 'https://example.com/thumbnails/test.jpg',
  width: 1920,
  height: 1080,
  duration: null,
  uploadedAt: new Date(),
  ...overrides,
});

export const createMockTypingUser = (overrides = {}) => ({
  userId: 'user1',
  username: 'testuser',
  channelId: 'channel1',
  startedAt: new Date(),
  ...overrides,
});

export const createMockInvite = (overrides = {}) => ({
  id: 'invite1',
  code: 'abc123def',
  serverId: 'server1',
  server: createMockServer(),
  channelId: 'channel1',
  channel: createMockChannel(),
  inviterId: 'user1',
  inviter: createMockUser(),
  maxUses: null,
  uses: 0,
  maxAge: null,
  temporary: false,
  revoked: false,
  createdAt: new Date(),
  expiresAt: null,
  revokedAt: null,
  ...overrides,
});

export const createMockRole = (overrides = {}) => ({
  id: 'role1',
  name: 'Member',
  color: '#99aab5',
  position: 0,
  permissions: {},
  isHoisted: false,
  isMentionable: true,
  serverId: 'server1',
  server: createMockServer(),
  memberCount: 50,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockEmoji = (overrides = {}) => ({
  id: 'emoji1',
  name: 'test_emoji',
  image: 'https://example.com/emojis/test.png',
  serverId: 'server1',
  server: createMockServer(),
  creatorId: 'user1',
  creator: createMockUser(),
  isAnimated: false,
  isAvailable: true,
  requireColons: true,
  managed: false,
  createdAt: new Date(),
  ...overrides,
});

export const createMockWebhook = (overrides = {}) => ({
  id: 'webhook1',
  name: 'Test Webhook',
  avatar: null,
  channelId: 'channel1',
  channel: createMockChannel(),
  serverId: 'server1',
  server: createMockServer(),
  token: 'webhook_token_123',
  url: 'https://discordapp.com/api/webhooks/123/token',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockAuditLog = (overrides = {}) => ({
  id: 'audit1',
  action: 'MESSAGE_DELETE',
  targetId: 'msg1',
  targetType: 'message',
  userId: 'user1',
  user: createMockUser(),
  serverId: 'server1',
  server: createMockServer(),
  reason: null,
  changes: [],
  metadata: {},
  createdAt: new Date(),
  ...overrides,
});

// Mock API responses
export const createMockApiResponse = (data: any, success = true) => ({
  success,
  data,
  message: success ? 'Operation successful' : 'Operation failed',
  timestamp: new Date().toISOString(),
});

export const createMockPaginatedResponse = (items: any[], page = 1, limit = 25) => ({
  success: true,
  data: {
    items,
    pagination: {
      page,
      limit,
      total: items.length,
      totalPages: Math.ceil(items.length / limit),
      hasNext: page * limit < items.length,
      hasPrev: page > 1,
    },
  },
});

// Mock error responses
export const createMockErrorResponse = (message: string, code = 'UNKNOWN_ERROR', statusCode = 500) => ({
  success: false,
  error: {
    message,
    code,
    statusCode,
    timestamp: new Date().toISOString(),
  },
});

// Network error mock
export const createMockNetworkError = () => ({
  code: 'NETWORK_ERROR',
  message: 'Network request failed',
  name: 'NetworkError',
  isNetworkError: true,
});

// Validation error mock
export const createMockValidationError = (fields: { [key: string]: string[] }) => ({
  success: false,
  error: {
    message: 'Validation failed',
    code: 'VALIDATION_ERROR',
    statusCode: 400,
    fields,
  },
});

// Authentication error mock
export const createMockAuthError = () => ({
  success: false,
  error: {
    message: 'Authentication required',
    code: 'UNAUTHORIZED',
    statusCode: 401,
  },
});

// Permission error mock
export const createMockPermissionError = () => ({
  success: false,
  error: {
    message: 'Insufficient permissions',
    code: 'FORBIDDEN',
    statusCode: 403,
  },
});

// Rate limit error mock
export const createMockRateLimitError = () => ({
  success: false,
  error: {
    message: 'Rate limit exceeded',
    code: 'RATE_LIMITED',
    statusCode: 429,
    retryAfter: 60,
  },
});

export default {
  createMockUser,
  createMockMessage,
  createMockServer,
  createMockChannel,
  createMockPost,
  createMockComment,
  createMockCommunity,
  createMockNotification,
  createMockVoiceState,
  createMockReaction,
  createMockAttachment,
  createMockTypingUser,
  createMockInvite,
  createMockRole,
  createMockEmoji,
  createMockWebhook,
  createMockAuditLog,
  createMockApiResponse,
  createMockPaginatedResponse,
  createMockErrorResponse,
  createMockNetworkError,
  createMockValidationError,
  createMockAuthError,
  createMockPermissionError,
  createMockRateLimitError,
};