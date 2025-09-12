import { prisma } from '@cryb/database';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';

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