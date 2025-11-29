import { faker } from '@faker-js/faker';

/**
 * Comprehensive Test Data Factory for CRYB Platform
 * Provides consistent test data generation across all test suites
 */

// User-related test data
export const UserFactory = {
  // Create a basic user object
  createUser: (overrides: Partial<any> = {}) => ({
    id: faker.string.uuid(),
    username: faker.internet.userName().toLowerCase(),
    email: faker.internet.email().toLowerCase(),
    displayName: faker.person.fullName(),
    avatar: faker.image.avatar(),
    bio: faker.lorem.sentence(),
    karma: faker.number.int({ min: 0, max: 10000 }),
    verified: faker.datatype.boolean({ probability: 0.7 }),
    createdAt: faker.date.past({ years: 2 }),
    updatedAt: faker.date.recent(),
    role: 'user',
    status: faker.helpers.arrayElement(['online', 'offline', 'away', 'busy']),
    location: faker.location.city(),
    website: faker.internet.url(),
    twoFactorEnabled: faker.datatype.boolean({ probability: 0.3 }),
    lastActiveAt: faker.date.recent(),
    preferences: {
      theme: faker.helpers.arrayElement(['light', 'dark', 'auto']),
      notifications: {
        email: faker.datatype.boolean(),
        push: faker.datatype.boolean(),
        mentions: faker.datatype.boolean(),
        replies: faker.datatype.boolean(),
      },
      privacy: {
        showEmail: faker.datatype.boolean({ probability: 0.1 }),
        showOnlineStatus: faker.datatype.boolean({ probability: 0.8 }),
        allowDirectMessages: faker.datatype.boolean({ probability: 0.9 }),
      }
    },
    ...overrides,
  }),

  // Create admin user
  createAdmin: (overrides: Partial<any> = {}) => UserFactory.createUser({
    role: 'admin',
    verified: true,
    karma: faker.number.int({ min: 5000, max: 50000 }),
    ...overrides,
  }),

  // Create moderator user
  createModerator: (overrides: Partial<any> = {}) => UserFactory.createUser({
    role: 'moderator',
    verified: true,
    karma: faker.number.int({ min: 1000, max: 15000 }),
    ...overrides,
  }),

  // Create batch of users
  createBatch: (count: number, overrides: Partial<any> = {}) => 
    Array.from({ length: count }, () => UserFactory.createUser(overrides)),
};

// Post-related test data
export const PostFactory = {
  createPost: (overrides: Partial<any> = {}) => ({
    id: faker.string.uuid(),
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraphs(faker.number.int({ min: 1, max: 5 })),
    type: faker.helpers.arrayElement(['text', 'image', 'link', 'video']),
    authorId: faker.string.uuid(),
    communityId: faker.string.uuid(),
    score: faker.number.int({ min: -100, max: 10000 }),
    upvotes: faker.number.int({ min: 0, max: 5000 }),
    downvotes: faker.number.int({ min: 0, max: 500 }),
    commentCount: faker.number.int({ min: 0, max: 500 }),
    viewCount: faker.number.int({ min: 0, max: 50000 }),
    tags: faker.helpers.arrayElements([
      'technology', 'gaming', 'music', 'art', 'science', 'sports', 
      'politics', 'news', 'entertainment', 'education'
    ], { min: 0, max: 5 }),
    imageUrl: null,
    videoUrl: null,
    linkUrl: null,
    nsfw: faker.datatype.boolean({ probability: 0.05 }),
    spoiler: faker.datatype.boolean({ probability: 0.1 }),
    locked: faker.datatype.boolean({ probability: 0.02 }),
    pinned: faker.datatype.boolean({ probability: 0.01 }),
    archived: faker.datatype.boolean({ probability: 0.05 }),
    edited: faker.datatype.boolean({ probability: 0.15 }),
    editedAt: null,
    createdAt: faker.date.past({ years: 1 }),
    updatedAt: faker.date.recent(),
    ...overrides,
  }),

  createImagePost: (overrides: Partial<any> = {}) => PostFactory.createPost({
    type: 'image',
    imageUrl: faker.image.url(),
    content: faker.lorem.sentence(),
    ...overrides,
  }),

  createLinkPost: (overrides: Partial<any> = {}) => PostFactory.createPost({
    type: 'link',
    linkUrl: faker.internet.url(),
    content: faker.lorem.paragraph(),
    ...overrides,
  }),

  createVideoPost: (overrides: Partial<any> = {}) => PostFactory.createPost({
    type: 'video',
    videoUrl: `https://youtube.com/watch?v=${faker.string.alphanumeric(11)}`,
    content: faker.lorem.sentence(),
    ...overrides,
  }),

  createBatch: (count: number, overrides: Partial<any> = {}) =>
    Array.from({ length: count }, () => PostFactory.createPost(overrides)),
};

// Comment-related test data
export const CommentFactory = {
  createComment: (overrides: Partial<any> = {}) => ({
    id: faker.string.uuid(),
    content: faker.lorem.sentences(faker.number.int({ min: 1, max: 3 })),
    authorId: faker.string.uuid(),
    postId: faker.string.uuid(),
    parentId: null,
    depth: 0,
    score: faker.number.int({ min: -50, max: 1000 }),
    upvotes: faker.number.int({ min: 0, max: 500 }),
    downvotes: faker.number.int({ min: 0, max: 50 }),
    replyCount: faker.number.int({ min: 0, max: 20 }),
    edited: faker.datatype.boolean({ probability: 0.1 }),
    editedAt: null,
    deleted: faker.datatype.boolean({ probability: 0.02 }),
    deletedAt: null,
    createdAt: faker.date.past({ months: 6 }),
    updatedAt: faker.date.recent(),
    ...overrides,
  }),

  createReply: (parentCommentId: string, overrides: Partial<any> = {}) => 
    CommentFactory.createComment({
      parentId: parentCommentId,
      depth: 1,
      ...overrides,
    }),

  createThread: (postId: string, maxDepth: number = 3, maxReplies: number = 5) => {
    const rootComment = CommentFactory.createComment({ postId });
    const thread = [rootComment];

    const createReplies = (parentId: string, currentDepth: number) => {
      if (currentDepth >= maxDepth) return;
      
      const replyCount = faker.number.int({ min: 0, max: maxReplies });
      for (let i = 0; i < replyCount; i++) {
        const reply = CommentFactory.createComment({
          postId,
          parentId,
          depth: currentDepth + 1,
        });
        thread.push(reply);
        
        // Recursively create nested replies
        createReplies(reply.id, currentDepth + 1);
      }
    };

    createReplies(rootComment.id, 0);
    return thread;
  },

  createBatch: (count: number, overrides: Partial<any> = {}) =>
    Array.from({ length: count }, () => CommentFactory.createComment(overrides)),
};

// Community-related test data
export const CommunityFactory = {
  createCommunity: (overrides: Partial<any> = {}) => ({
    id: faker.string.uuid(),
    name: faker.lorem.slug(),
    displayName: faker.company.name(),
    description: faker.lorem.paragraph(),
    icon: faker.image.avatar(),
    banner: faker.image.urlLoremFlickr({ category: 'abstract' }),
    ownerId: faker.string.uuid(),
    memberCount: faker.number.int({ min: 1, max: 100000 }),
    postCount: faker.number.int({ min: 0, max: 10000 }),
    isPublic: faker.datatype.boolean({ probability: 0.8 }),
    nsfw: faker.datatype.boolean({ probability: 0.1 }),
    verified: faker.datatype.boolean({ probability: 0.3 }),
    category: faker.helpers.arrayElement([
      'Technology', 'Gaming', 'Music', 'Art', 'Science', 'Sports',
      'Politics', 'News', 'Entertainment', 'Education', 'Lifestyle'
    ]),
    rules: Array.from({ length: faker.number.int({ min: 3, max: 10 }) }, () => ({
      title: faker.lorem.words(3),
      description: faker.lorem.sentence(),
    })),
    settings: {
      allowImagePosts: faker.datatype.boolean({ probability: 0.9 }),
      allowLinkPosts: faker.datatype.boolean({ probability: 0.8 }),
      allowVideoPosts: faker.datatype.boolean({ probability: 0.7 }),
      requireApproval: faker.datatype.boolean({ probability: 0.2 }),
      allowCrossposts: faker.datatype.boolean({ probability: 0.6 }),
      minimumKarma: faker.number.int({ min: 0, max: 100 }),
    },
    createdAt: faker.date.past({ years: 3 }),
    updatedAt: faker.date.recent(),
    ...overrides,
  }),

  createBatch: (count: number, overrides: Partial<any> = {}) =>
    Array.from({ length: count }, () => CommunityFactory.createCommunity(overrides)),
};

// Server and Channel data (Discord-style)
export const ServerFactory = {
  createServer: (overrides: Partial<any> = {}) => ({
    id: faker.string.uuid(),
    name: faker.company.name(),
    description: faker.lorem.paragraph(),
    icon: faker.image.avatar(),
    banner: faker.image.urlLoremFlickr({ category: 'business' }),
    ownerId: faker.string.uuid(),
    memberCount: faker.number.int({ min: 1, max: 50000 }),
    channelCount: faker.number.int({ min: 1, max: 100 }),
    isPublic: faker.datatype.boolean({ probability: 0.6 }),
    verified: faker.datatype.boolean({ probability: 0.1 }),
    partnered: faker.datatype.boolean({ probability: 0.05 }),
    boostLevel: faker.number.int({ min: 0, max: 3 }),
    boostCount: faker.number.int({ min: 0, max: 100 }),
    vanityUrl: faker.datatype.boolean({ probability: 0.3 }) ? faker.lorem.slug() : null,
    features: faker.helpers.arrayElements([
      'INVITE_SPLASH', 'VIP_REGIONS', 'VANITY_URL', 'VERIFIED',
      'PARTNERED', 'MORE_EMOJI', 'DISCOVERABLE', 'ANIMATED_ICON'
    ], { min: 0, max: 5 }),
    region: faker.helpers.arrayElement(['us-east', 'us-west', 'europe', 'asia']),
    afkTimeout: faker.helpers.arrayElement([300, 900, 1800, 3600]),
    systemChannelFlags: faker.number.int({ min: 0, max: 15 }),
    createdAt: faker.date.past({ years: 2 }),
    updatedAt: faker.date.recent(),
    ...overrides,
  }),

  createChannel: (serverId: string, overrides: Partial<any> = {}) => ({
    id: faker.string.uuid(),
    name: faker.lorem.slug(),
    description: faker.lorem.sentence(),
    type: faker.helpers.arrayElement(['text', 'voice', 'category', 'announcement']),
    serverId,
    categoryId: faker.datatype.boolean({ probability: 0.7 }) ? faker.string.uuid() : null,
    position: faker.number.int({ min: 0, max: 50 }),
    isPrivate: faker.datatype.boolean({ probability: 0.2 }),
    nsfw: faker.datatype.boolean({ probability: 0.05 }),
    rateLimitPerUser: faker.helpers.arrayElement([0, 5, 10, 15, 30, 60, 120]),
    topic: faker.datatype.boolean({ probability: 0.5 }) ? faker.lorem.sentence() : null,
    // Voice channel specific
    bitrate: faker.helpers.arrayElement([64000, 96000, 128000, 256000, 384000]),
    userLimit: faker.helpers.arrayElement([0, 2, 5, 10, 25, 50, 99]),
    // Permissions
    permissions: [],
    createdAt: faker.date.past({ months: 12 }),
    updatedAt: faker.date.recent(),
    ...overrides,
  }),

  createBatch: (count: number, overrides: Partial<any> = {}) =>
    Array.from({ length: count }, () => ServerFactory.createServer(overrides)),
};

// Message data
export const MessageFactory = {
  createMessage: (overrides: Partial<any> = {}) => ({
    id: faker.string.uuid(),
    content: faker.lorem.sentences(faker.number.int({ min: 1, max: 3 })),
    authorId: faker.string.uuid(),
    channelId: faker.string.uuid(),
    type: faker.helpers.arrayElement(['text', 'image', 'file', 'voice', 'video']),
    edited: faker.datatype.boolean({ probability: 0.1 }),
    editedAt: null,
    deleted: faker.datatype.boolean({ probability: 0.01 }),
    deletedAt: null,
    pinned: faker.datatype.boolean({ probability: 0.005 }),
    attachments: [],
    embeds: [],
    reactions: [],
    mentions: [],
    referencedMessage: null,
    createdAt: faker.date.past({ months: 1 }),
    updatedAt: faker.date.recent(),
    ...overrides,
  }),

  createImageMessage: (overrides: Partial<any> = {}) => MessageFactory.createMessage({
    type: 'image',
    content: faker.lorem.sentence(),
    attachments: [{
      id: faker.string.uuid(),
      filename: `${faker.lorem.slug()}.jpg`,
      url: faker.image.url(),
      size: faker.number.int({ min: 1024, max: 10485760 }), // 1KB to 10MB
      width: faker.number.int({ min: 100, max: 4096 }),
      height: faker.number.int({ min: 100, max: 4096 }),
      contentType: 'image/jpeg',
    }],
    ...overrides,
  }),

  createFileMessage: (overrides: Partial<any> = {}) => MessageFactory.createMessage({
    type: 'file',
    content: 'File uploaded',
    attachments: [{
      id: faker.string.uuid(),
      filename: `${faker.system.fileName()}.pdf`,
      url: faker.internet.url(),
      size: faker.number.int({ min: 1024, max: 104857600 }), // 1KB to 100MB
      contentType: 'application/pdf',
    }],
    ...overrides,
  }),

  createBatch: (count: number, overrides: Partial<any> = {}) =>
    Array.from({ length: count }, () => MessageFactory.createMessage(overrides)),
};

// Notification data
export const NotificationFactory = {
  createNotification: (overrides: Partial<any> = {}) => ({
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    type: faker.helpers.arrayElement([
      'post_reply', 'comment_reply', 'mention', 'vote', 'follow',
      'message', 'server_invite', 'announcement', 'system'
    ]),
    title: faker.lorem.words(3),
    message: faker.lorem.sentence(),
    data: {
      postId: faker.string.uuid(),
      commentId: faker.string.uuid(),
      fromUserId: faker.string.uuid(),
    },
    read: faker.datatype.boolean({ probability: 0.3 }),
    readAt: null,
    actionUrl: faker.internet.url(),
    imageUrl: faker.datatype.boolean({ probability: 0.4 }) ? faker.image.avatar() : null,
    priority: faker.helpers.arrayElement(['low', 'normal', 'high', 'urgent']),
    channel: faker.helpers.arrayElement(['web', 'mobile', 'email', 'push']),
    createdAt: faker.date.past({ days: 30 }),
    updatedAt: faker.date.recent(),
    ...overrides,
  }),

  createBatch: (count: number, overrides: Partial<any> = {}) =>
    Array.from({ length: count }, () => NotificationFactory.createNotification(overrides)),
};

// Analytics and metrics data
export const AnalyticsFactory = {
  createUserMetrics: (userId: string, overrides: Partial<any> = {}) => ({
    userId,
    period: 'month',
    postsCreated: faker.number.int({ min: 0, max: 100 }),
    commentsCreated: faker.number.int({ min: 0, max: 500 }),
    karma: faker.number.int({ min: 0, max: 10000 }),
    upvotesReceived: faker.number.int({ min: 0, max: 5000 }),
    downvotesReceived: faker.number.int({ min: 0, max: 500 }),
    profileViews: faker.number.int({ min: 0, max: 1000 }),
    messagesReceived: faker.number.int({ min: 0, max: 200 }),
    messagesSent: faker.number.int({ min: 0, max: 300 }),
    activeHours: Array.from({ length: 24 }, () => faker.number.int({ min: 0, max: 60 })),
    topCommunities: Array.from({ length: 5 }, () => ({
      communityId: faker.string.uuid(),
      name: faker.lorem.slug(),
      activityCount: faker.number.int({ min: 1, max: 100 }),
    })),
    ...overrides,
  }),

  createPlatformMetrics: (overrides: Partial<any> = {}) => ({
    period: 'day',
    timestamp: faker.date.recent(),
    activeUsers: faker.number.int({ min: 1000, max: 100000 }),
    newUsers: faker.number.int({ min: 10, max: 1000 }),
    postsCreated: faker.number.int({ min: 100, max: 10000 }),
    commentsCreated: faker.number.int({ min: 500, max: 50000 }),
    messagesCreated: faker.number.int({ min: 1000, max: 100000 }),
    totalUsers: faker.number.int({ min: 10000, max: 1000000 }),
    totalPosts: faker.number.int({ min: 50000, max: 5000000 }),
    totalComments: faker.number.int({ min: 200000, max: 20000000 }),
    serverLoad: faker.number.float({ min: 0.1, max: 1.0, fractionDigits: 2 }),
    responseTime: faker.number.float({ min: 50, max: 500, fractionDigits: 1 }),
    errorRate: faker.number.float({ min: 0.001, max: 0.05, fractionDigits: 4 }),
    ...overrides,
  }),
};

// Mock API responses
export const ApiResponseFactory = {
  success: (data: any, meta: any = {}) => ({
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: faker.string.uuid(),
      ...meta,
    },
  }),

  error: (message: string, code: number = 400, details: any = {}) => ({
    success: false,
    error: {
      message,
      code,
      details,
      timestamp: new Date().toISOString(),
      requestId: faker.string.uuid(),
    },
  }),

  paginated: (data: any[], page: number = 1, limit: number = 20, total?: number) => ({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total: total || data.length,
      totalPages: Math.ceil((total || data.length) / limit),
      hasNext: page * limit < (total || data.length),
      hasPrev: page > 1,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: faker.string.uuid(),
    },
  }),
};

// File and media data
export const MediaFactory = {
  createImageFile: (overrides: Partial<any> = {}) => ({
    id: faker.string.uuid(),
    filename: `${faker.lorem.slug()}.jpg`,
    originalName: `${faker.lorem.words(2)}.jpg`,
    url: faker.image.url(),
    thumbnailUrl: faker.image.url(),
    size: faker.number.int({ min: 1024, max: 10485760 }),
    width: faker.number.int({ min: 100, max: 4096 }),
    height: faker.number.int({ min: 100, max: 4096 }),
    mimeType: 'image/jpeg',
    uploadedBy: faker.string.uuid(),
    uploadedAt: faker.date.recent(),
    ...overrides,
  }),

  createVideoFile: (overrides: Partial<any> = {}) => ({
    id: faker.string.uuid(),
    filename: `${faker.lorem.slug()}.mp4`,
    originalName: `${faker.lorem.words(2)}.mp4`,
    url: faker.internet.url(),
    thumbnailUrl: faker.image.url(),
    size: faker.number.int({ min: 1048576, max: 1073741824 }), // 1MB to 1GB
    duration: faker.number.int({ min: 1, max: 3600 }), // 1 second to 1 hour
    width: faker.number.int({ min: 480, max: 1920 }),
    height: faker.number.int({ min: 360, max: 1080 }),
    mimeType: 'video/mp4',
    uploadedBy: faker.string.uuid(),
    uploadedAt: faker.date.recent(),
    ...overrides,
  }),
};

// Test scenarios and user journeys
export const ScenarioFactory = {
  createNewUserJourney: () => {
    const user = UserFactory.createUser();
    const communities = CommunityFactory.createBatch(3);
    const firstPost = PostFactory.createPost({ authorId: user.id, communityId: communities[0].id });
    const comments = CommentFactory.createBatch(2, { postId: firstPost.id });
    
    return {
      user,
      communities,
      posts: [firstPost],
      comments,
      notifications: NotificationFactory.createBatch(1, { userId: user.id }),
    };
  },

  createActiveUserJourney: () => {
    const user = UserFactory.createUser({ karma: 5000, verified: true });
    const communities = CommunityFactory.createBatch(5);
    const posts = PostFactory.createBatch(10, { authorId: user.id });
    const comments = CommentFactory.createBatch(25, { authorId: user.id });
    const notifications = NotificationFactory.createBatch(15, { userId: user.id });
    
    return {
      user,
      communities,
      posts,
      comments,
      notifications,
      metrics: AnalyticsFactory.createUserMetrics(user.id),
    };
  },

  createCommunityModerationScenario: () => {
    const moderator = UserFactory.createModerator();
    const community = CommunityFactory.createCommunity({ ownerId: moderator.id });
    const flaggedPosts = PostFactory.createBatch(5, { 
      communityId: community.id,
      nsfw: true 
    });
    const reportedComments = CommentFactory.createBatch(3);
    
    return {
      moderator,
      community,
      flaggedPosts,
      reportedComments,
    };
  },
};

// Utility functions for test data
export const TestDataUtils = {
  // Reset faker seed for consistent test data
  resetSeed: (seed: number = 12345) => {
    faker.seed(seed);
  },

  // Generate realistic username based on display name
  generateUsername: (displayName: string) => {
    return displayName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20) + faker.number.int({ min: 10, max: 99 });
  },

  // Generate realistic email from username
  generateEmail: (username: string) => {
    const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'example.com'];
    return `${username}@${faker.helpers.arrayElement(domains)}`;
  },

  // Create related data set (user with their posts, comments, etc.)
  createRelatedDataSet: (userId: string) => {
    const posts = PostFactory.createBatch(faker.number.int({ min: 1, max: 10 }), { authorId: userId });
    const comments = CommentFactory.createBatch(faker.number.int({ min: 5, max: 50 }), { authorId: userId });
    const notifications = NotificationFactory.createBatch(faker.number.int({ min: 0, max: 20 }), { userId });
    
    return { posts, comments, notifications };
  },

  // Clean test data (for cleanup in tests)
  createCleanupData: () => ({
    userIds: Array.from({ length: 10 }, () => faker.string.uuid()),
    postIds: Array.from({ length: 20 }, () => faker.string.uuid()),
    commentIds: Array.from({ length: 50 }, () => faker.string.uuid()),
    communityIds: Array.from({ length: 5 }, () => faker.string.uuid()),
  }),
};

export default {
  UserFactory,
  PostFactory,
  CommentFactory,
  CommunityFactory,
  ServerFactory,
  MessageFactory,
  NotificationFactory,
  AnalyticsFactory,
  ApiResponseFactory,
  MediaFactory,
  ScenarioFactory,
  TestDataUtils,
};