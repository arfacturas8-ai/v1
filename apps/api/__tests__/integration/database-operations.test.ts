import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { testData, createTestUser, createTestCommunity, cleanupTestData } from '../helpers/test-data';

describe('Database Operations', () => {
  let prisma: PrismaClient;

  beforeEach(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
  });

  afterEach(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  describe('User Operations', () => {
    describe('Create User', () => {
      it('should create user with valid data', async () => {
        const userData = testData.validUser();
        
        const user = await prisma.user.create({
          data: {
            username: userData.username,
            email: userData.email,
            password: userData.password,
            displayName: userData.displayName
          }
        });

        expect(user).toHaveProperty('id');
        expect(user.username).toBe(userData.username);
        expect(user.email).toBe(userData.email);
        expect(user.displayName).toBe(userData.displayName);
        expect(user).toHaveProperty('createdAt');
        expect(user).toHaveProperty('updatedAt');
      });

      it('should enforce unique email constraint', async () => {
        const userData = testData.validUser();
        
        // Create first user
        await prisma.user.create({
          data: {
            username: userData.username,
            email: userData.email,
            password: userData.password,
            displayName: userData.displayName
          }
        });

        // Try to create second user with same email
        await expect(
          prisma.user.create({
            data: {
              username: 'different_username',
              email: userData.email, // Same email
              password: userData.password,
              displayName: 'Different Name'
            }
          })
        ).rejects.toThrow();
      });

      it('should enforce unique username constraint', async () => {
        const userData = testData.validUser();
        
        // Create first user
        await prisma.user.create({
          data: {
            username: userData.username,
            email: userData.email,
            password: userData.password,
            displayName: userData.displayName
          }
        });

        // Try to create second user with same username
        await expect(
          prisma.user.create({
            data: {
              username: userData.username, // Same username
              email: 'different@example.com',
              password: userData.password,
              displayName: 'Different Name'
            }
          })
        ).rejects.toThrow();
      });

      it('should handle unicode characters in user data', async () => {
        const userData = testData.validUser();
        userData.displayName = testData.unicodeString();
        userData.username = 'unicode_user_' + Date.now();

        const user = await prisma.user.create({
          data: {
            username: userData.username,
            email: userData.email,
            password: userData.password,
            displayName: userData.displayName
          }
        });

        expect(user.displayName).toBe(userData.displayName);
      });
    });

    describe('Update User', () => {
      let userId: string;

      beforeEach(async () => {
        const user = await createTestUser();
        userId = user.id;
      });

      it('should update user fields', async () => {
        const updateData = {
          displayName: 'Updated Display Name',
          bio: 'Updated bio content'
        };

        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: updateData
        });

        expect(updatedUser.displayName).toBe(updateData.displayName);
        expect(updatedUser.bio).toBe(updateData.bio);
        expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(updatedUser.createdAt.getTime());
      });

      it('should handle partial updates', async () => {
        const originalUser = await prisma.user.findUnique({
          where: { id: userId }
        });

        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: { displayName: 'Only Display Name Updated' }
        });

        expect(updatedUser.displayName).toBe('Only Display Name Updated');
        expect(updatedUser.email).toBe(originalUser?.email);
        expect(updatedUser.username).toBe(originalUser?.username);
      });

      it('should update user status and activity', async () => {
        const statusUpdate = {
          status: 'away' as const,
          lastSeen: new Date(),
          isOnline: false
        };

        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: statusUpdate
        });

        expect(updatedUser.status).toBe(statusUpdate.status);
        expect(updatedUser.isOnline).toBe(statusUpdate.isOnline);
        expect(updatedUser.lastSeen).toBeInstanceOf(Date);
      });
    });

    describe('Query User', () => {
      let testUsers: any[];

      beforeEach(async () => {
        // Create multiple test users
        testUsers = await Promise.all([
          createTestUser({ username: 'alice', displayName: 'Alice Smith' }),
          createTestUser({ username: 'bob', displayName: 'Bob Johnson' }),
          createTestUser({ username: 'charlie', displayName: 'Charlie Brown' })
        ]);
      });

      it('should find user by id', async () => {
        const user = await prisma.user.findUnique({
          where: { id: testUsers[0].id }
        });

        expect(user).toBeDefined();
        expect(user?.id).toBe(testUsers[0].id);
        expect(user?.username).toBe(testUsers[0].username);
      });

      it('should find user by email', async () => {
        const user = await prisma.user.findUnique({
          where: { email: testUsers[0].email }
        });

        expect(user).toBeDefined();
        expect(user?.email).toBe(testUsers[0].email);
      });

      it('should find user by username', async () => {
        const user = await prisma.user.findUnique({
          where: { username: testUsers[0].username }
        });

        expect(user).toBeDefined();
        expect(user?.username).toBe(testUsers[0].username);
      });

      it('should search users by partial name match', async () => {
        const users = await prisma.user.findMany({
          where: {
            OR: [
              { username: { contains: 'a', mode: 'insensitive' } },
              { displayName: { contains: 'a', mode: 'insensitive' } }
            ]
          }
        });

        // Should find Alice and Charlie
        expect(users.length).toBeGreaterThanOrEqual(2);
        expect(users.some(u => u.username === 'alice')).toBe(true);
        expect(users.some(u => u.username === 'charlie')).toBe(true);
      });

      it('should paginate user results', async () => {
        const page1 = await prisma.user.findMany({
          take: 2,
          skip: 0,
          orderBy: { username: 'asc' }
        });

        const page2 = await prisma.user.findMany({
          take: 2,
          skip: 2,
          orderBy: { username: 'asc' }
        });

        expect(page1).toHaveLength(2);
        expect(page2.length).toBeGreaterThanOrEqual(1);
        expect(page1[0].id).not.toBe(page2[0]?.id);
      });
    });

    describe('Delete User', () => {
      let userId: string;

      beforeEach(async () => {
        const user = await createTestUser();
        userId = user.id;
      });

      it('should soft delete user', async () => {
        const deletedUser = await prisma.user.update({
          where: { id: userId },
          data: { 
            isDeleted: true,
            deletedAt: new Date()
          }
        });

        expect(deletedUser.isDeleted).toBe(true);
        expect(deletedUser.deletedAt).toBeInstanceOf(Date);
      });

      it('should exclude deleted users from normal queries', async () => {
        // Soft delete the user
        await prisma.user.update({
          where: { id: userId },
          data: { 
            isDeleted: true,
            deletedAt: new Date()
          }
        });

        // Normal query should not return deleted user
        const activeUsers = await prisma.user.findMany({
          where: { isDeleted: false }
        });

        expect(activeUsers.some(u => u.id === userId)).toBe(false);
      });

      it('should hard delete user and cascade relations', async () => {
        // Create some related data first
        const community = await createTestCommunity(userId);

        // Hard delete user
        await prisma.user.delete({
          where: { id: userId }
        });

        // User should not exist
        const deletedUser = await prisma.user.findUnique({
          where: { id: userId }
        });

        expect(deletedUser).toBeNull();

        // Related communities should be updated or deleted based on cascade rules
        const orphanedCommunity = await prisma.community.findUnique({
          where: { id: community.id }
        });

        // Depending on your cascade rules, this might be null or have updated ownerId
        expect(orphanedCommunity?.ownerId).not.toBe(userId);
      });
    });
  });

  describe('Community Operations', () => {
    let ownerId: string;

    beforeEach(async () => {
      const user = await createTestUser();
      ownerId = user.id;
    });

    describe('Create Community', () => {
      it('should create community with valid data', async () => {
        const communityData = testData.validCommunity();

        const community = await prisma.community.create({
          data: {
            name: communityData.name,
            description: communityData.description,
            ownerId,
            isPublic: communityData.isPublic
          }
        });

        expect(community).toHaveProperty('id');
        expect(community.name).toBe(communityData.name);
        expect(community.ownerId).toBe(ownerId);
        expect(community.memberCount).toBe(0); // Should be 0 initially
      });

      it('should enforce unique community names within scope', async () => {
        const communityData = testData.validCommunity();

        // Create first community
        await prisma.community.create({
          data: {
            name: communityData.name,
            description: communityData.description,
            ownerId,
            isPublic: true
          }
        });

        // Try to create another community with same name
        await expect(
          prisma.community.create({
            data: {
              name: communityData.name, // Same name
              description: 'Different description',
              ownerId,
              isPublic: true
            }
          })
        ).rejects.toThrow();
      });

      it('should create community with default channels', async () => {
        const communityData = testData.validCommunity();

        const community = await prisma.community.create({
          data: {
            name: communityData.name,
            description: communityData.description,
            ownerId,
            isPublic: true
          }
        });

        // Create default channels
        const defaultChannels = await Promise.all([
          prisma.channel.create({
            data: {
              name: 'general',
              description: 'General discussion',
              type: 'text',
              communityId: community.id,
              position: 0
            }
          }),
          prisma.channel.create({
            data: {
              name: 'announcements',
              description: 'Community announcements',
              type: 'text',
              communityId: community.id,
              position: 1
            }
          })
        ]);

        expect(defaultChannels).toHaveLength(2);
        expect(defaultChannels[0].communityId).toBe(community.id);
        expect(defaultChannels[1].communityId).toBe(community.id);
      });
    });

    describe('Community Membership', () => {
      let communityId: string;
      let memberId: string;

      beforeEach(async () => {
        const community = await createTestCommunity(ownerId);
        communityId = community.id;

        const member = await createTestUser();
        memberId = member.id;
      });

      it('should add member to community', async () => {
        const membership = await prisma.communityMember.create({
          data: {
            communityId,
            userId: memberId,
            role: 'member',
            joinedAt: new Date()
          }
        });

        expect(membership.communityId).toBe(communityId);
        expect(membership.userId).toBe(memberId);
        expect(membership.role).toBe('member');

        // Update member count
        await prisma.community.update({
          where: { id: communityId },
          data: { memberCount: { increment: 1 } }
        });

        const updatedCommunity = await prisma.community.findUnique({
          where: { id: communityId }
        });

        expect(updatedCommunity?.memberCount).toBe(2); // Owner + new member
      });

      it('should prevent duplicate memberships', async () => {
        // Add member first time
        await prisma.communityMember.create({
          data: {
            communityId,
            userId: memberId,
            role: 'member',
            joinedAt: new Date()
          }
        });

        // Try to add same member again
        await expect(
          prisma.communityMember.create({
            data: {
              communityId,
              userId: memberId,
              role: 'member',
              joinedAt: new Date()
            }
          })
        ).rejects.toThrow();
      });

      it('should update member roles', async () => {
        // Add member
        await prisma.communityMember.create({
          data: {
            communityId,
            userId: memberId,
            role: 'member',
            joinedAt: new Date()
          }
        });

        // Promote to moderator
        const updatedMembership = await prisma.communityMember.update({
          where: {
            communityId_userId: {
              communityId,
              userId: memberId
            }
          },
          data: { role: 'moderator' }
        });

        expect(updatedMembership.role).toBe('moderator');
      });

      it('should remove member from community', async () => {
        // Add member
        await prisma.communityMember.create({
          data: {
            communityId,
            userId: memberId,
            role: 'member',
            joinedAt: new Date()
          }
        });

        // Remove member
        await prisma.communityMember.delete({
          where: {
            communityId_userId: {
              communityId,
              userId: memberId
            }
          }
        });

        // Update member count
        await prisma.community.update({
          where: { id: communityId },
          data: { memberCount: { decrement: 1 } }
        });

        // Verify member is removed
        const membership = await prisma.communityMember.findUnique({
          where: {
            communityId_userId: {
              communityId,
              userId: memberId
            }
          }
        });

        expect(membership).toBeNull();
      });

      it('should query community members with roles', async () => {
        // Add multiple members with different roles
        const member2 = await createTestUser();
        const member3 = await createTestUser();

        await Promise.all([
          prisma.communityMember.create({
            data: { communityId, userId: memberId, role: 'member', joinedAt: new Date() }
          }),
          prisma.communityMember.create({
            data: { communityId, userId: member2.id, role: 'moderator', joinedAt: new Date() }
          }),
          prisma.communityMember.create({
            data: { communityId, userId: member3.id, role: 'member', joinedAt: new Date() }
          })
        ]);

        // Get all members
        const allMembers = await prisma.communityMember.findMany({
          where: { communityId },
          include: { user: true }
        });

        expect(allMembers.length).toBe(4); // 3 new + 1 owner

        // Get only moderators and owners
        const staff = await prisma.communityMember.findMany({
          where: {
            communityId,
            role: { in: ['owner', 'moderator'] }
          },
          include: { user: true }
        });

        expect(staff.length).toBe(2); // 1 owner + 1 moderator
      });
    });
  });

  describe('Message Operations', () => {
    let channelId: string;
    let authorId: string;

    beforeEach(async () => {
      const user = await createTestUser();
      authorId = user.id;

      const community = await createTestCommunity(authorId);
      
      const channel = await prisma.channel.create({
        data: {
          name: 'test-channel',
          description: 'Test channel',
          type: 'text',
          communityId: community.id,
          position: 0
        }
      });
      
      channelId = channel.id;
    });

    describe('Create Message', () => {
      it('should create message with valid data', async () => {
        const messageData = testData.validMessage();

        const message = await prisma.message.create({
          data: {
            channelId,
            authorId,
            content: messageData.content,
            type: messageData.type,
            timestamp: new Date()
          }
        });

        expect(message).toHaveProperty('id');
        expect(message.content).toBe(messageData.content);
        expect(message.authorId).toBe(authorId);
        expect(message.channelId).toBe(channelId);
        expect(message.type).toBe(messageData.type);
      });

      it('should create message with attachments', async () => {
        const message = await prisma.message.create({
          data: {
            channelId,
            authorId,
            content: 'Message with attachment',
            type: 'text',
            timestamp: new Date(),
            attachments: {
              create: [
                {
                  filename: 'test-image.jpg',
                  url: 'https://example.com/test-image.jpg',
                  size: 1024,
                  mimeType: 'image/jpeg'
                }
              ]
            }
          },
          include: { attachments: true }
        });

        expect(message.attachments).toHaveLength(1);
        expect(message.attachments[0].filename).toBe('test-image.jpg');
      });

      it('should create message thread (reply)', async () => {
        // Create parent message
        const parentMessage = await prisma.message.create({
          data: {
            channelId,
            authorId,
            content: 'Parent message',
            type: 'text',
            timestamp: new Date()
          }
        });

        // Create reply
        const replyMessage = await prisma.message.create({
          data: {
            channelId,
            authorId,
            content: 'Reply message',
            type: 'text',
            timestamp: new Date(),
            replyToId: parentMessage.id
          }
        });

        expect(replyMessage.replyToId).toBe(parentMessage.id);
      });
    });

    describe('Query Messages', () => {
      let messages: any[];

      beforeEach(async () => {
        // Create multiple test messages
        messages = await Promise.all([
          prisma.message.create({
            data: {
              channelId, authorId,
              content: 'First message',
              type: 'text',
              timestamp: new Date(Date.now() - 3000)
            }
          }),
          prisma.message.create({
            data: {
              channelId, authorId,
              content: 'Second message',
              type: 'text',
              timestamp: new Date(Date.now() - 2000)
            }
          }),
          prisma.message.create({
            data: {
              channelId, authorId,
              content: 'Third message',
              type: 'text',
              timestamp: new Date(Date.now() - 1000)
            }
          })
        ]);
      });

      it('should get messages by channel ordered by timestamp', async () => {
        const channelMessages = await prisma.message.findMany({
          where: { channelId },
          orderBy: { timestamp: 'asc' },
          include: { author: true }
        });

        expect(channelMessages).toHaveLength(3);
        expect(channelMessages[0].content).toBe('First message');
        expect(channelMessages[2].content).toBe('Third message');
      });

      it('should paginate messages correctly', async () => {
        const page1 = await prisma.message.findMany({
          where: { channelId },
          orderBy: { timestamp: 'desc' },
          take: 2
        });

        const page2 = await prisma.message.findMany({
          where: { channelId },
          orderBy: { timestamp: 'desc' },
          skip: 2,
          take: 2
        });

        expect(page1).toHaveLength(2);
        expect(page2).toHaveLength(1);
        expect(page1[0].id).not.toBe(page2[0].id);
      });

      it('should search messages by content', async () => {
        const searchResults = await prisma.message.findMany({
          where: {
            channelId,
            content: { contains: 'Second', mode: 'insensitive' }
          }
        });

        expect(searchResults).toHaveLength(1);
        expect(searchResults[0].content).toBe('Second message');
      });

      it('should get messages after specific timestamp', async () => {
        const cutoffTime = new Date(Date.now() - 1500);
        
        const recentMessages = await prisma.message.findMany({
          where: {
            channelId,
            timestamp: { gt: cutoffTime }
          },
          orderBy: { timestamp: 'asc' }
        });

        expect(recentMessages).toHaveLength(1);
        expect(recentMessages[0].content).toBe('Third message');
      });
    });

    describe('Update Message', () => {
      let messageId: string;

      beforeEach(async () => {
        const message = await prisma.message.create({
          data: {
            channelId,
            authorId,
            content: 'Original message content',
            type: 'text',
            timestamp: new Date()
          }
        });
        messageId = message.id;
      });

      it('should edit message content', async () => {
        const updatedMessage = await prisma.message.update({
          where: { id: messageId },
          data: {
            content: 'Edited message content',
            isEdited: true,
            editedAt: new Date()
          }
        });

        expect(updatedMessage.content).toBe('Edited message content');
        expect(updatedMessage.isEdited).toBe(true);
        expect(updatedMessage.editedAt).toBeInstanceOf(Date);
      });

      it('should add reactions to message', async () => {
        const updatedMessage = await prisma.message.update({
          where: { id: messageId },
          data: {
            reactions: {
              create: [
                {
                  emoji: '👍',
                  userId: authorId
                },
                {
                  emoji: '❤️',
                  userId: authorId
                }
              ]
            }
          },
          include: { reactions: true }
        });

        expect(updatedMessage.reactions).toHaveLength(2);
      });
    });

    describe('Delete Message', () => {
      let messageId: string;

      beforeEach(async () => {
        const message = await prisma.message.create({
          data: {
            channelId,
            authorId,
            content: 'Message to delete',
            type: 'text',
            timestamp: new Date()
          }
        });
        messageId = message.id;
      });

      it('should soft delete message', async () => {
        const deletedMessage = await prisma.message.update({
          where: { id: messageId },
          data: {
            content: '[deleted]',
            isDeleted: true,
            deletedAt: new Date()
          }
        });

        expect(deletedMessage.content).toBe('[deleted]');
        expect(deletedMessage.isDeleted).toBe(true);
      });

      it('should hard delete message and cascade reactions', async () => {
        // Add reactions first
        await prisma.reaction.create({
          data: {
            messageId,
            userId: authorId,
            emoji: '👍'
          }
        });

        // Hard delete message
        await prisma.message.delete({
          where: { id: messageId }
        });

        // Message should not exist
        const deletedMessage = await prisma.message.findUnique({
          where: { id: messageId }
        });

        expect(deletedMessage).toBeNull();

        // Reactions should be cascaded
        const orphanedReactions = await prisma.reaction.findMany({
          where: { messageId }
        });

        expect(orphanedReactions).toHaveLength(0);
      });
    });
  });

  describe('Transaction Operations', () => {
    let userId: string;

    beforeEach(async () => {
      const user = await createTestUser();
      userId = user.id;
    });

    it('should handle atomic community creation with owner membership', async () => {
      const communityData = testData.validCommunity();

      const result = await prisma.$transaction(async (tx) => {
        // Create community
        const community = await tx.community.create({
          data: {
            name: communityData.name,
            description: communityData.description,
            ownerId: userId,
            isPublic: true,
            memberCount: 1
          }
        });

        // Add owner as member
        const membership = await tx.communityMember.create({
          data: {
            communityId: community.id,
            userId: userId,
            role: 'owner',
            joinedAt: new Date()
          }
        });

        return { community, membership };
      });

      expect(result.community.ownerId).toBe(userId);
      expect(result.membership.role).toBe('owner');
      expect(result.membership.communityId).toBe(result.community.id);
    });

    it('should rollback on transaction failure', async () => {
      const communityData = testData.validCommunity();

      try {
        await prisma.$transaction(async (tx) => {
          // Create community
          await tx.community.create({
            data: {
              name: communityData.name,
              description: communityData.description,
              ownerId: userId,
              isPublic: true
            }
          });

          // Intentionally cause error
          throw new Error('Simulated transaction failure');
        });
      } catch (error) {
        expect(error.message).toBe('Simulated transaction failure');
      }

      // Community should not exist due to rollback
      const communities = await prisma.community.findMany({
        where: { name: communityData.name }
      });

      expect(communities).toHaveLength(0);
    });

    it('should handle concurrent message creation', async () => {
      const community = await createTestCommunity(userId);
      
      const channel = await prisma.channel.create({
        data: {
          name: 'concurrent-test',
          description: 'Test channel',
          type: 'text',
          communityId: community.id,
          position: 0
        }
      });

      // Create multiple messages concurrently
      const messagePromises = Array(10).fill(0).map((_, i) =>
        prisma.message.create({
          data: {
            channelId: channel.id,
            authorId: userId,
            content: `Concurrent message ${i}`,
            type: 'text',
            timestamp: new Date()
          }
        })
      );

      const messages = await Promise.all(messagePromises);

      expect(messages).toHaveLength(10);
      expect(new Set(messages.map(m => m.id)).size).toBe(10); // All unique IDs
    });
  });

  describe('Performance and Optimization', () => {
    let userId: string;
    let communityId: string;
    let channelId: string;

    beforeEach(async () => {
      const user = await createTestUser();
      userId = user.id;

      const community = await createTestCommunity(userId);
      communityId = community.id;

      const channel = await prisma.channel.create({
        data: {
          name: 'performance-test',
          description: 'Performance test channel',
          type: 'text',
          communityId,
          position: 0
        }
      });
      channelId = channel.id;
    });

    it('should efficiently query with proper includes', async () => {
      // Create test data
      await Promise.all(Array(50).fill(0).map((_, i) =>
        prisma.message.create({
          data: {
            channelId,
            authorId: userId,
            content: `Performance test message ${i}`,
            type: 'text',
            timestamp: new Date(Date.now() - i * 1000)
          }
        })
      ));

      const startTime = Date.now();

      // Query with optimized includes
      const messages = await prisma.message.findMany({
        where: { channelId },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true
            }
          },
          reactions: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true
                }
              }
            }
          }
        },
        orderBy: { timestamp: 'desc' },
        take: 20
      });

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(messages).toHaveLength(20);
      expect(queryTime).toBeLessThan(1000); // Should complete within 1 second
      expect(messages[0].author).toBeDefined();
    });

    it('should handle bulk operations efficiently', async () => {
      const startTime = Date.now();

      // Bulk create messages
      const messageData = Array(100).fill(0).map((_, i) => ({
        channelId,
        authorId: userId,
        content: `Bulk message ${i}`,
        type: 'text' as const,
        timestamp: new Date(Date.now() - i * 100)
      }));

      await prisma.message.createMany({
        data: messageData
      });

      const endTime = Date.now();
      const bulkTime = endTime - startTime;

      expect(bulkTime).toBeLessThan(2000); // Should complete within 2 seconds

      // Verify all messages were created
      const messageCount = await prisma.message.count({
        where: { channelId }
      });

      expect(messageCount).toBe(100);
    });

    it('should use database indexes effectively', async () => {
      // Create large dataset
      await Promise.all(Array(200).fill(0).map((_, i) =>
        prisma.message.create({
          data: {
            channelId,
            authorId: userId,
            content: `Indexed search test message ${i}`,
            type: 'text',
            timestamp: new Date(Date.now() - i * 1000)
          }
        })
      ));

      const startTime = Date.now();

      // Query that should use indexes
      const recentMessages = await prisma.message.findMany({
        where: {
          channelId, // Should use channelId index
          timestamp: { 
            gte: new Date(Date.now() - 60000) // Should use timestamp index
          }
        },
        orderBy: { timestamp: 'desc' }
      });

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(queryTime).toBeLessThan(500); // Should be very fast with proper indexes
      expect(recentMessages.length).toBeGreaterThan(0);
    });

    it('should handle aggregation queries efficiently', async () => {
      // Create messages with reactions
      const messages = await Promise.all(Array(20).fill(0).map((_, i) =>
        prisma.message.create({
          data: {
            channelId,
            authorId: userId,
            content: `Aggregation test message ${i}`,
            type: 'text',
            timestamp: new Date()
          }
        })
      ));

      // Add reactions to some messages
      await Promise.all(messages.slice(0, 10).map(message =>
        prisma.reaction.createMany({
          data: [
            { messageId: message.id, userId, emoji: '👍' },
            { messageId: message.id, userId, emoji: '❤️' }
          ]
        })
      ));

      const startTime = Date.now();

      // Aggregation query
      const stats = await prisma.message.groupBy({
        by: ['type'],
        where: { channelId },
        _count: {
          id: true
        },
        _max: {
          timestamp: true
        }
      });

      const endTime = Date.now();
      const aggregationTime = endTime - startTime;

      expect(aggregationTime).toBeLessThan(1000);
      expect(stats).toHaveLength(1); // All messages are 'text' type
      expect(stats[0]._count.id).toBe(20);
    });
  });
});