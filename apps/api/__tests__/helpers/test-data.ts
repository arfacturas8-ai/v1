import { prisma } from '@cryb/database';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export async function createTestUser(overrides: Partial<any> = {}) {
  const userId = randomUUID();
  const baseUsername = overrides.username || `testuser_${userId.substring(0, 8)}`;
  const username = baseUsername;
  const email = overrides.email || `${username}@test.example`;

  return await prisma.user.create({
    data: {
      id: userId,
      username,
      email,
      displayName: overrides.displayName || `Test User ${userId.substring(0, 8)}`,
      password: await bcrypt.hash('testpassword123', 10),
      isVerified: true,
      status: 'online',
      avatar: null,
      banner: null,
      bio: 'Test user created for integration tests',
      ...overrides
    }
  });
}

export async function createTestCommunity(ownerId: string, overrides: Partial<any> = {}) {
  const communityId = randomUUID();
  
  const community = await prisma.community.create({
    data: {
      id: communityId,
      name: `Test Community ${communityId.substring(0, 8)}`,
      description: 'Test community created for integration tests',
      ownerId,
      isPublic: true,
      memberCount: 1,
      ...overrides
    }
  });

  // Add the owner as a member
  await prisma.communityMember.create({
    data: {
      communityId: community.id,
      userId: ownerId,
      role: 'owner',
      joinedAt: new Date()
    }
  });

  return community;
}

export async function createTestChannel(communityId: string, overrides: Partial<any> = {}) {
  return await prisma.channel.create({
    data: {
      id: randomUUID(),
      name: `test-channel-${Date.now()}`,
      description: 'Test channel created for integration tests',
      type: 'text',
      communityId,
      position: 0,
      ...overrides
    }
  });
}

export async function createTestMessage(channelId: string, authorId: string, overrides: Partial<any> = {}) {
  return await prisma.message.create({
    data: {
      id: randomUUID(),
      channelId,
      authorId,
      content: 'Test message content',
      timestamp: new Date(),
      ...overrides
    }
  });
}

export async function cleanupTestData() {
  // Clean up in reverse dependency order
  await prisma.message.deleteMany({
    where: { content: { contains: 'Test message content' } }
  });
  
  await prisma.channel.deleteMany({
    where: { name: { startsWith: 'test-channel-' } }
  });
  
  await prisma.communityMember.deleteMany({
    where: { 
      community: { 
        name: { startsWith: 'Test Community' } 
      } 
    }
  });
  
  await prisma.community.deleteMany({
    where: { name: { startsWith: 'Test Community' } }
  });
  
  await prisma.user.deleteMany({
    where: { username: { startsWith: 'testuser_' } }
  });
}

export const TEST_JWT_SECRET = 'test-jwt-secret-for-integration-tests';

// JWT Helper functions
export function generateAuthToken(user: any): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role || 'user'
    },
    TEST_JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function verifyAuthToken(token: string): any {
  try {
    return jwt.verify(token, TEST_JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// Database seeding functions
export async function seedTestDatabase() {
  // Create test users
  const adminUser = await createTestUser({
    username: 'admin_test',
    email: 'admin@test.com',
    displayName: 'Admin User',
    role: 'admin'
  });

  const regularUser = await createTestUser({
    username: 'user_test',
    email: 'user@test.com',
    displayName: 'Regular User'
  });

  const moderatorUser = await createTestUser({
    username: 'mod_test',
    email: 'mod@test.com',
    displayName: 'Moderator User',
    role: 'moderator'
  });

  // Create test communities
  const generalCommunity = await createTestCommunity(adminUser.id, {
    name: 'test_general',
    description: 'General test community'
  });

  const techCommunity = await createTestCommunity(adminUser.id, {
    name: 'test_technology',
    description: 'Technology test community'
  });

  // Create test channels
  const generalChannel = await createTestChannel(generalCommunity.id, {
    name: 'general-chat',
    description: 'General chat channel'
  });

  const techChannel = await createTestChannel(techCommunity.id, {
    name: 'tech-discussion',
    description: 'Technology discussion channel'
  });

  return {
    users: { adminUser, regularUser, moderatorUser },
    communities: { generalCommunity, techCommunity },
    channels: { generalChannel, techChannel }
  };
}

// Helper functions for generating test data
export const testData = {
  validUser: (email?: string) => ({
    username: `testuser_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    email: email || `test_${Date.now()}_${Math.random().toString(36).substr(2, 5)}@example.com`,
    password: 'TestPassword123!',
    displayName: 'Test User'
  }),

  validPost: (title?: string, category?: string) => ({
    title: title || `Test Post ${Date.now()}`,
    content: 'This is a test post content with some sample text.',
    category: category || 'general',
    tags: ['test', 'sample']
  }),

  validComment: (postId: number, parentId?: number, content?: string) => ({
    postId,
    parentId,
    content: content || `Test comment ${Date.now()}`
  }),

  validChannel: (name?: string) => ({
    name: name || `test-channel-${Date.now()}`,
    description: 'Test channel for integration tests',
    type: 'text' as const,
    isPrivate: false
  }),

  validMessage: (content?: string) => ({
    content: content || `Test message ${Date.now()}`,
    type: 'text' as const
  }),

  validCommunity: (name?: string) => ({
    name: name || `Test Community ${Date.now()}`,
    description: 'Test community for integration tests',
    isPublic: true,
    category: 'general'
  }),

  // Security test data
  xssPayload: () => '<script>alert("xss")</script>',
  sqlInjectionPayload: () => "'; DROP TABLE users; --",
  maliciousFilename: () => '../../../etc/passwd',
  longString: (length: number = 1000) => 'x'.repeat(length),

  // Edge case data
  emptyString: () => '',
  whitespaceString: () => '   \t\n   ',
  unicodeString: () => '🚀 Unicode test 中文 عربي 🎉',
  specialCharacters: () => '!@#$%^&*()[]{}|;:,.<>?',

  // File upload test data
  imageFile: () => ({
    fieldname: 'image',
    originalname: 'test-image.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024 * 100, // 100KB
    buffer: Buffer.from('fake-image-data')
  }),

  videoFile: () => ({
    fieldname: 'video',
    originalname: 'test-video.mp4',
    encoding: '7bit',
    mimetype: 'video/mp4',
    size: 1024 * 1024 * 5, // 5MB
    buffer: Buffer.from('fake-video-data')
  }),

  // Auth test data
  weakPassword: () => '123',
  strongPassword: () => 'StrongP@ssw0rd123!',
  invalidEmail: () => 'invalid-email',
  validEmail: () => `test${Date.now()}@example.com`,

  // Crypto/Web3 test data
  validEthereumAddress: () => '0x742d35Cc6634C0532925a3b8D8631d7C8D6C09D9',
  invalidEthereumAddress: () => '0xinvalid',
  validSignature: () => '0x1234567890abcdef...',

  // Performance test data
  largeDataset: (size: number) => Array(size).fill(0).map((_, i) => ({
    id: i,
    name: `Item ${i}`,
    data: `Data for item ${i}`.repeat(10)
  })),

  // Rate limiting test data
  rapidRequests: (count: number) => Array(count).fill(0).map((_, i) => ({
    timestamp: Date.now() + i,
    data: `Request ${i}`
  }))
};