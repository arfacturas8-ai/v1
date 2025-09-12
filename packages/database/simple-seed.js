#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error'],
});

const SAMPLE_USERS = [
  { username: 'alice', displayName: 'Alice Johnson', email: 'alice@example.com' },
  { username: 'bob', displayName: 'Bob Smith', email: 'bob@example.com' },
  { username: 'charlie', displayName: 'Charlie Brown', email: 'charlie@example.com' },
  { username: 'diana', displayName: 'Diana Prince', email: 'diana@example.com' },
  { username: 'eve', displayName: 'Eve Adams', email: 'eve@example.com' },
];

const SAMPLE_SERVERS = [
  { name: 'Test Server 1', description: 'A test server for development' },
  { name: 'Test Server 2', description: 'Another test server' },
];

const SAMPLE_CHANNELS = [
  { name: 'general', type: 'GUILD_TEXT' },
  { name: 'random', type: 'GUILD_TEXT' },
  { name: 'Voice Chat', type: 'GUILD_VOICE' },
];

const SAMPLE_MESSAGES = [
  "Hello everyone! How's it going?",
  "Just testing the database setup",
  "This is a sample message for development",
  "Great work on the platform!",
  "Looking forward to using this",
];

async function simpleSeed() {
  console.log('🌱 Running simple database seed...');
  
  try {
    // Create users
    console.log('👥 Creating users...');
    const users = [];
    for (let i = 0; i < SAMPLE_USERS.length; i++) {
      const userData = SAMPLE_USERS[i];
      const user = await prisma.user.create({
        data: {
          username: userData.username,
          discriminator: String(1000 + i).padStart(4, '0'),
          displayName: userData.displayName,
          email: userData.email,
          lastSeenAt: new Date(),
        }
      });
      users.push(user);
      
      // Create user presence
      await prisma.userPresence.create({
        data: {
          userId: user.id,
          status: i < 2 ? 'ONLINE' : 'OFFLINE',
        }
      });
    }
    console.log(`✅ Created ${users.length} users`);

    // Create servers
    console.log('🏠 Creating servers...');
    const servers = [];
    for (let i = 0; i < SAMPLE_SERVERS.length; i++) {
      const serverData = SAMPLE_SERVERS[i];
      const owner = users[i % users.length];
      
      const server = await prisma.server.create({
        data: {
          name: serverData.name,
          description: serverData.description,
          ownerId: owner.id,
          isPublic: true,
        }
      });
      servers.push(server);

      // Add owner as member
      await prisma.serverMember.create({
        data: {
          serverId: server.id,
          userId: owner.id,
          joinedAt: new Date(),
        }
      });

      // Add other users as members
      for (let j = 0; j < users.length; j++) {
        if (users[j].id !== owner.id) {
          await prisma.serverMember.create({
            data: {
              serverId: server.id,
              userId: users[j].id,
              joinedAt: new Date(),
            }
          });
        }
      }
    }
    console.log(`✅ Created ${servers.length} servers`);

    // Create channels
    console.log('📺 Creating channels...');
    let totalChannels = 0;
    for (const server of servers) {
      for (let i = 0; i < SAMPLE_CHANNELS.length; i++) {
        const channelData = SAMPLE_CHANNELS[i];
        
        const channel = await prisma.channel.create({
          data: {
            serverId: server.id,
            name: channelData.name,
            type: channelData.type,
            position: i,
          }
        });
        
        // Create messages for text channels
        if (channel.type === 'GUILD_TEXT') {
          for (let j = 0; j < SAMPLE_MESSAGES.length; j++) {
            const user = users[j % users.length];
            const message = await prisma.message.create({
              data: {
                channelId: channel.id,
                userId: user.id,
                content: SAMPLE_MESSAGES[j],
                timestamp: new Date(Date.now() - (j * 3600000)), // 1 hour apart
              }
            });

            // Add some reactions
            if (j < 2) {
              await prisma.reaction.create({
                data: {
                  messageId: message.id,
                  userId: users[(j + 1) % users.length].id,
                  emoji: '👍',
                }
              });
            }
          }
        }
        
        totalChannels++;
      }
    }
    console.log(`✅ Created ${totalChannels} channels`);

    // Create some friendships
    console.log('👫 Creating friendships...');
    let friendships = 0;
    for (let i = 0; i < users.length - 1; i++) {
      for (let j = i + 1; j < Math.min(i + 3, users.length); j++) {
        await prisma.friendship.create({
          data: {
            initiatorId: users[i].id,
            receiverId: users[j].id,
            status: 'ACCEPTED',
          }
        });
        friendships++;
      }
    }
    console.log(`✅ Created ${friendships} friendships`);

    // Create some analytics data
    console.log('📊 Creating analytics data...');
    let analyticsRecords = 0;
    const now = new Date();
    
    for (let day = 0; day < 7; day++) {
      const date = new Date(now);
      date.setDate(date.getDate() - day);
      
      for (const server of servers) {
        // Server analytics
        await prisma.serverAnalytics.create({
          data: {
            serverId: server.id,
            memberCount: users.length,
            onlineCount: Math.floor(users.length * 0.6),
            messageCount: Math.floor(Math.random() * 100) + 50,
            voiceMinutes: Math.floor(Math.random() * 500) + 100,
            timestamp: date,
          }
        });
        analyticsRecords++;
        
        // Message analytics
        for (let i = 0; i < 3; i++) {
          await prisma.messageAnalytics.create({
            data: {
              serverId: server.id,
              channelId: `channel-${i}`,
              userId: users[i % users.length].id,
              messageCount: Math.floor(Math.random() * 10) + 1,
              characterCount: Math.floor(Math.random() * 1000) + 100,
              wordCount: Math.floor(Math.random() * 100) + 10,
              timestamp: date,
            }
          });
          analyticsRecords++;
        }
      }
    }
    console.log(`✅ Created ${analyticsRecords} analytics records`);

    // Create some notifications
    console.log('🔔 Creating notifications...');
    let notifications = 0;
    for (const user of users.slice(0, 3)) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'MENTION',
          title: 'You were mentioned',
          content: 'Someone mentioned you in a message',
          isRead: false,
        }
      });
      notifications++;
    }
    console.log(`✅ Created ${notifications} notifications`);

    console.log('\n🎉 Simple seed completed successfully!');
    
    // Show final stats
    const stats = {
      users: await prisma.user.count(),
      servers: await prisma.server.count(),
      channels: await prisma.channel.count(),
      messages: await prisma.message.count(),
      reactions: await prisma.reaction.count(),
      friendships: await prisma.friendship.count(),
      serverAnalytics: await prisma.serverAnalytics.count(),
      messageAnalytics: await prisma.messageAnalytics.count(),
      notifications: await prisma.notification.count(),
    };
    
    console.log('\n📊 Database Statistics:');
    console.table(stats);

    return true;

  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  simpleSeed()
    .then(success => process.exit(success ? 0 : 1))
    .catch(() => process.exit(1));
}

module.exports = { simpleSeed };