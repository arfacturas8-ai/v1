import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

interface SeedOptions {
  users?: number;
  servers?: number;
  channelsPerServer?: number;
  messagesPerChannel?: number;
  voiceSessionsPerUser?: number;
}

const DEFAULT_OPTIONS: SeedOptions = {
  users: 100,
  servers: 10,
  channelsPerServer: 15,
  messagesPerChannel: 200,
  voiceSessionsPerUser: 5,
};

// Predefined data for realistic testing
const SERVER_NAMES = [
  'Gaming Paradise',
  'Developer Hub',
  'Crypto Traders',
  'Art & Design',
  'Music Lovers',
  'Book Club',
  'Tech Talk',
  'Fitness Enthusiasts',
  'Movie Critics',
  'Study Group',
];

const CHANNEL_NAMES = {
  TEXT: [
    'general', 'announcements', 'random', 'memes', 'help', 'off-topic',
    'introductions', 'resources', 'feedback', 'events', 'rules', 'bot-commands'
  ],
  VOICE: [
    'General Voice', 'Study Room', 'Gaming Room', 'Music Lounge', 
    'Meeting Room', 'Chill Zone', 'AFK Channel'
  ],
  CATEGORY: [
    'General', 'Voice Channels', 'Gaming', 'Work', 'Community', 'Admin'
  ]
};

const ROLE_NAMES = [
  'Admin', 'Moderator', 'VIP', 'Member', 'Bot', 'Verified', 'Nitro Booster'
];

const ACTIVITY_TYPES = ['PLAYING', 'STREAMING', 'LISTENING', 'WATCHING', 'CUSTOM', 'COMPETING'];

const MESSAGE_TEMPLATES = [
  "Hey everyone! How's it going?",
  "Just joined the server, excited to be here!",
  "Anyone want to play some games later?",
  "Check out this cool project I've been working on",
  "Morning everyone! ☀️",
  "Has anyone seen the latest update?",
  "Thanks for the help with my question earlier",
  "This community is awesome! 🎉",
  "Looking forward to the next event",
  "Great discussion we had yesterday"
];

async function cleanDatabase() {
  console.log('🧹 Cleaning existing data...');
  
  // Delete in reverse order of dependencies
  await prisma.serverAnalytics.deleteMany();
  await prisma.voiceAnalytics.deleteMany();
  await prisma.messageAnalytics.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.serverSticker.deleteMany();
  await prisma.serverEmoji.deleteMany();
  await prisma.messageReference.deleteMany();
  await prisma.messageEmbed.deleteMany();
  await prisma.messageAttachment.deleteMany();
  await prisma.voiceState.deleteMany();
  await prisma.directMessageParticipant.deleteMany();
  await prisma.block.deleteMany();
  await prisma.friendship.deleteMany();
  await prisma.userActivity.deleteMany();
  await prisma.userPresence.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.message.deleteMany();
  await prisma.channelPermission.deleteMany();
  await prisma.thread.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.memberRole.deleteMany();
  await prisma.role.deleteMany();
  await prisma.ban.deleteMany();
  await prisma.invite.deleteMany();
  await prisma.serverMember.deleteMany();
  await prisma.server.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.session.deleteMany();
  await prisma.token.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.award.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.flair.deleteMany();
  await prisma.moderator.deleteMany();
  await prisma.communityMember.deleteMany();
  await prisma.community.deleteMany();
  await prisma.user.deleteMany();
}

async function createUsers(count: number) {
  console.log(`👥 Creating ${count} users...`);
  
  const users = [];
  for (let i = 0; i < count; i++) {
    const username = faker.internet.userName();
    const discriminator = faker.number.int({ min: 1, max: 9999 }).toString().padStart(4, '0');
    
    users.push({
      username,
      discriminator,
      displayName: faker.person.fullName(),
      email: faker.internet.email(),
      avatar: faker.image.avatar(),
      banner: Math.random() > 0.7 ? faker.image.url() : null,
      bio: Math.random() > 0.5 ? faker.lorem.sentence() : null,
      pronouns: Math.random() > 0.8 ? faker.helpers.arrayElement(['he/him', 'she/her', 'they/them']) : null,
      isVerified: Math.random() > 0.9,
      isBot: Math.random() > 0.95,
      premiumType: faker.helpers.arrayElement(['NONE', 'NITRO_CLASSIC', 'NITRO', 'NITRO_BASIC']) as any,
      locale: faker.helpers.arrayElement(['en-US', 'es-ES', 'fr-FR', 'de-DE', 'ja-JP']),
      lastSeenAt: faker.date.recent(),
    });
  }
  
  const createdUsers = await Promise.all(
    users.map(user => prisma.user.create({ data: user }))
  );
  
  console.log(`✅ Created ${createdUsers.length} users`);
  return createdUsers;
}

async function createUserPresences(users: any[]) {
  console.log('🟢 Creating user presences...');
  
  const presences = users.map(user => ({
    userId: user.id,
    status: faker.helpers.arrayElement(['ONLINE', 'IDLE', 'DND', 'INVISIBLE', 'OFFLINE']) as any,
    clientStatus: {
      desktop: Math.random() > 0.5 ? 'online' : undefined,
      mobile: Math.random() > 0.7 ? 'online' : undefined,
      web: Math.random() > 0.6 ? 'online' : undefined,
    }
  }));
  
  const createdPresences = await Promise.all(
    presences.map(presence => prisma.userPresence.create({ data: presence }))
  );
  
  // Create activities for some users
  const activities = [];
  for (const presence of createdPresences.slice(0, Math.floor(users.length * 0.3))) {
    activities.push({
      userId: presence.userId,
      presenceId: presence.id,
      type: faker.helpers.arrayElement(ACTIVITY_TYPES) as any,
      name: faker.helpers.arrayElement([
        'Visual Studio Code', 'Spotify', 'YouTube', 'Twitch', 'Discord',
        'Counter-Strike 2', 'Valorant', 'League of Legends', 'Minecraft'
      ]),
      details: Math.random() > 0.5 ? faker.lorem.sentence() : null,
      state: Math.random() > 0.5 ? faker.lorem.words(3) : null,
    });
  }
  
  await Promise.all(
    activities.map(activity => prisma.userActivity.create({ data: activity }))
  );
  
  console.log(`✅ Created ${createdPresences.length} presences and ${activities.length} activities`);
  return createdPresences;
}

async function createFriendships(users: any[]) {
  console.log('👫 Creating friendships...');
  
  const friendships: any[] = [];
  const friendshipCount = Math.floor(users.length * 0.3);
  
  for (let i = 0; i < friendshipCount; i++) {
    const initiator = faker.helpers.arrayElement(users);
    const receiver = faker.helpers.arrayElement(users.filter(u => u.id !== initiator.id));
    
    // Check if friendship already exists
    const existing = friendships.find(f => 
      (f.initiatorId === initiator.id && f.receiverId === receiver.id) ||
      (f.initiatorId === receiver.id && f.receiverId === initiator.id)
    );
    
    if (!existing) {
      friendships.push({
        initiatorId: initiator.id,
        receiverId: receiver.id,
        status: faker.helpers.arrayElement(['PENDING', 'ACCEPTED']) as any,
      });
    }
  }
  
  const createdFriendships = await Promise.all(
    friendships.map(friendship => prisma.friendship.create({ data: friendship }))
  );
  
  console.log(`✅ Created ${createdFriendships.length} friendships`);
  return createdFriendships;
}

async function createServers(users: any[], count: number) {
  console.log(`🏠 Creating ${count} servers...`);
  
  const servers = [];
  for (let i = 0; i < count; i++) {
    const owner = faker.helpers.arrayElement(users);
    const serverName = faker.helpers.arrayElement(SERVER_NAMES) + ` ${i + 1}`;
    
    servers.push({
      name: serverName,
      description: faker.lorem.paragraph(),
      icon: faker.image.url(),
      banner: Math.random() > 0.5 ? faker.image.url() : null,
      ownerId: owner.id,
      isPublic: Math.random() > 0.3,
      maxMembers: faker.number.int({ min: 100, max: 100000 }),
      verificationLevel: faker.number.int({ min: 0, max: 4 }),
      features: JSON.stringify(faker.helpers.arrayElements([
        'ANIMATED_ICON', 'BANNER', 'COMMERCE', 'COMMUNITY', 'DISCOVERABLE',
        'INVITE_SPLASH', 'MEMBER_VERIFICATION_GATE_ENABLED', 'NEWS',
        'PARTNERED', 'PREVIEW_ENABLED', 'VANITY_URL', 'VERIFIED'
      ], { min: 0, max: 5 })),
      vanityUrlCode: Math.random() > 0.8 ? faker.lorem.slug() : null,
      premiumTier: faker.number.int({ min: 0, max: 3 }),
    });
  }
  
  const createdServers = await Promise.all(
    servers.map(server => prisma.server.create({ data: server }))
  );
  
  console.log(`✅ Created ${createdServers.length} servers`);
  return createdServers;
}

async function createRoles(servers: any[]) {
  console.log('🎭 Creating roles...');
  
  const allRoles = [];
  for (const server of servers) {
    const roles = [];
    const roleCount = faker.number.int({ min: 3, max: 8 });
    
    for (let i = 0; i < roleCount; i++) {
      const roleName = faker.helpers.arrayElement(ROLE_NAMES);
      
      roles.push({
        serverId: server.id,
        name: `${roleName} ${i + 1}`,
        color: faker.color.rgb(),
        position: i,
        permissions: BigInt(faker.number.int({ min: 0, max: 2147483647 })),
        mentionable: Math.random() > 0.5,
        hoisted: Math.random() > 0.7,
      });
    }
    
    const createdRoles = await Promise.all(
      roles.map(role => prisma.role.create({ data: role }))
    );
    
    allRoles.push(...createdRoles);
  }
  
  console.log(`✅ Created ${allRoles.length} roles`);
  return allRoles;
}

async function createServerMembers(servers: any[], users: any[], roles: any[]) {
  console.log('👥 Creating server members...');
  
  const allMembers = [];
  for (const server of servers) {
    const memberCount = faker.number.int({ min: 10, max: 50 });
    const selectedUsers = faker.helpers.arrayElements(users, memberCount);
    
    for (const user of selectedUsers) {
      const member = await prisma.serverMember.create({
        data: {
          serverId: server.id,
          userId: user.id,
          nickname: Math.random() > 0.7 ? faker.person.firstName() : null,
          joinedAt: faker.date.past(),
          pending: Math.random() > 0.9,
          deaf: Math.random() > 0.95,
          mute: Math.random() > 0.95,
        }
      });
      
      // Assign random roles
      const serverRoles = roles.filter(r => r.serverId === server.id);
      const memberRoles = faker.helpers.arrayElements(serverRoles, { min: 1, max: 3 });
      
      for (const role of memberRoles) {
        await prisma.memberRole.create({
          data: {
            serverId: server.id,
            userId: user.id,
            roleId: role.id,
          }
        });
      }
      
      allMembers.push(member);
    }
  }
  
  console.log(`✅ Created ${allMembers.length} server members`);
  return allMembers;
}

async function createChannels(servers: any[], channelsPerServer: number) {
  console.log(`📺 Creating channels (${channelsPerServer} per server)...`);
  
  const allChannels = [];
  for (const server of servers) {
    const channels = [];
    
    // Create categories first
    const categoryCount = faker.number.int({ min: 2, max: 4 });
    const categories = [];
    
    for (let i = 0; i < categoryCount; i++) {
      const category = await prisma.channel.create({
        data: {
          serverId: server.id,
          name: faker.helpers.arrayElement(CHANNEL_NAMES.CATEGORY),
          type: 'GUILD_CATEGORY',
          position: i,
        }
      });
      categories.push(category);
      channels.push(category);
    }
    
    // Create text channels
    const textChannelCount = Math.floor(channelsPerServer * 0.7);
    for (let i = 0; i < textChannelCount; i++) {
      const parent = Math.random() > 0.3 ? faker.helpers.arrayElement(categories) : null;
      
      const channel = await prisma.channel.create({
        data: {
          serverId: server.id,
          name: faker.helpers.arrayElement(CHANNEL_NAMES.TEXT),
          type: 'GUILD_TEXT',
          position: i,
          parentId: parent?.id,
          topic: Math.random() > 0.5 ? faker.lorem.sentence() : null,
          slowMode: Math.random() > 0.8 ? faker.number.int({ min: 5, max: 120 }) : 0,
          nsfw: Math.random() > 0.9,
        }
      });
      channels.push(channel);
    }
    
    // Create voice channels
    const voiceChannelCount = Math.floor(channelsPerServer * 0.3);
    for (let i = 0; i < voiceChannelCount; i++) {
      const parent = Math.random() > 0.3 ? faker.helpers.arrayElement(categories) : null;
      
      const channel = await prisma.channel.create({
        data: {
          serverId: server.id,
          name: faker.helpers.arrayElement(CHANNEL_NAMES.VOICE),
          type: 'GUILD_VOICE',
          position: i,
          parentId: parent?.id,
          bitrate: faker.number.int({ min: 64000, max: 384000 }),
          userLimit: Math.random() > 0.5 ? faker.number.int({ min: 2, max: 99 }) : null,
        }
      });
      channels.push(channel);
    }
    
    allChannels.push(...channels);
  }
  
  // Create some DM channels
  const dmChannels = [];
  for (let i = 0; i < 20; i++) {
    const channel = await prisma.channel.create({
      data: {
        name: `DM-${i + 1}`,
        type: 'DM',
      }
    });
    dmChannels.push(channel);
  }
  
  allChannels.push(...dmChannels);
  console.log(`✅ Created ${allChannels.length} channels`);
  return allChannels;
}

async function createMessages(channels: any[], users: any[], messagesPerChannel: number) {
  console.log(`💬 Creating messages (${messagesPerChannel} per channel)...`);
  
  const textChannels = channels.filter(c => 
    c.type === 'GUILD_TEXT' || c.type === 'DM' || c.type === 'GROUP_DM'
  );
  
  let totalMessages = 0;
  for (const channel of textChannels.slice(0, Math.min(textChannels.length, 50))) {
    const messageCount = faker.number.int({ min: 10, max: messagesPerChannel });
    const messages = [];
    
    for (let i = 0; i < messageCount; i++) {
      const user = faker.helpers.arrayElement(users);
      const content = faker.helpers.arrayElement([
        ...MESSAGE_TEMPLATES,
        faker.lorem.sentence(),
        faker.lorem.paragraph(),
      ]);
      
      const message = await prisma.message.create({
        data: {
          channelId: channel.id,
          userId: user.id,
          content,
          timestamp: faker.date.past(),
          type: faker.helpers.weightedArrayElement([
            { weight: 0.9, value: 0 }, // DEFAULT
            { weight: 0.05, value: 7 }, // REPLY
            { weight: 0.05, value: 19 }, // THREAD_STARTER_MESSAGE
          ]),
          mentionEveryone: Math.random() > 0.95,
          mentions: Math.random() > 0.8 ? JSON.stringify([
            faker.helpers.arrayElement(users).id
          ]) as any : null,
        }
      });
      
      // Create attachments for some messages
      if (Math.random() > 0.9) {
        await prisma.messageAttachment.create({
          data: {
            messageId: message.id,
            filename: faker.system.fileName(),
            contentType: faker.helpers.arrayElement(['image/png', 'image/jpeg', 'image/gif']),
            size: faker.number.int({ min: 1024, max: 5242880 }),
            url: faker.image.url(),
            proxyUrl: faker.image.url(),
            width: faker.number.int({ min: 100, max: 2000 }),
            height: faker.number.int({ min: 100, max: 2000 }),
          }
        });
      }
      
      // Create embeds for some messages
      if (Math.random() > 0.95) {
        await prisma.messageEmbed.create({
          data: {
            messageId: message.id,
            title: faker.lorem.sentence(),
            description: faker.lorem.paragraph(),
            color: parseInt(faker.color.rgb().replace('#', ''), 16),
            url: faker.internet.url(),
          }
        });
      }
      
      messages.push(message);
    }
    
    totalMessages += messages.length;
    
    // Create some reactions
    const messagesSample = faker.helpers.arrayElements(messages, Math.min(messages.length, 10));
    for (const message of messagesSample) {
      const reactionCount = faker.number.int({ min: 1, max: 5 });
      for (let i = 0; i < reactionCount; i++) {
        const user = faker.helpers.arrayElement(users);
        const emoji = faker.helpers.arrayElement(['👍', '👎', '❤️', '😂', '😮', '😢', '😡']);
        
        try {
          await prisma.reaction.create({
            data: {
              messageId: message.id,
              userId: user.id,
              emoji,
            }
          });
        } catch (error) {
          // Ignore duplicate reactions
        }
      }
    }
  }
  
  console.log(`✅ Created ${totalMessages} messages with attachments and reactions`);
}

async function createVoiceStates(users: any[], channels: any[]) {
  console.log('🎤 Creating voice states...');
  
  const voiceChannels = channels.filter(c => 
    c.type === 'GUILD_VOICE' || c.type === 'GUILD_STAGE_VOICE'
  );
  
  const voiceStates = [];
  const activeUsers = faker.helpers.arrayElements(users, Math.floor(users.length * 0.1));
  
  for (const user of activeUsers) {
    const channel = faker.helpers.arrayElement(voiceChannels);
    const server = channel.serverId;
    
    if (server) {
      const voiceState = await prisma.voiceState.create({
        data: {
          userId: user.id,
          serverId: server,
          channelId: channel.id,
          sessionId: faker.string.uuid(),
          deaf: Math.random() > 0.9,
          mute: Math.random() > 0.8,
          selfDeaf: Math.random() > 0.7,
          selfMute: Math.random() > 0.6,
          selfStream: Math.random() > 0.9,
          selfVideo: Math.random() > 0.8,
        }
      });
      voiceStates.push(voiceState);
    }
  }
  
  console.log(`✅ Created ${voiceStates.length} voice states`);
  return voiceStates;
}

async function createAnalytics(servers: any[], channels: any[], users: any[]) {
  console.log('📊 Creating analytics data...');
  
  const now = new Date();
  const daysBack = 30;
  
  // Message Analytics
  const messageAnalytics = [];
  for (let day = 0; day < daysBack; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);
    
    for (const server of servers.slice(0, 5)) {
      const serverChannels = channels.filter(c => c.serverId === server.id);
      
      for (const channel of serverChannels.slice(0, 3)) {
        const activeUsers = faker.helpers.arrayElements(users, { min: 1, max: 10 });
        
        for (const user of activeUsers) {
          messageAnalytics.push({
            serverId: server.id,
            channelId: channel.id,
            userId: user.id,
            messageCount: faker.number.int({ min: 1, max: 20 }),
            characterCount: faker.number.int({ min: 10, max: 2000 }),
            wordCount: faker.number.int({ min: 2, max: 300 }),
            attachmentCount: faker.number.int({ min: 0, max: 3 }),
            mentionCount: faker.number.int({ min: 0, max: 5 }),
            reactionCount: faker.number.int({ min: 0, max: 10 }),
            timestamp: date,
          });
        }
      }
    }
  }
  
  // Create in batches to avoid memory issues
  const batchSize = 100;
  for (let i = 0; i < messageAnalytics.length; i += batchSize) {
    const batch = messageAnalytics.slice(i, i + batchSize);
    await Promise.all(
      batch.map(analytics => prisma.messageAnalytics.create({ data: analytics }))
    );
  }
  
  // Voice Analytics
  const voiceAnalytics = [];
  for (let day = 0; day < daysBack; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);
    
    const voiceChannels = channels.filter(c => 
      c.type === 'GUILD_VOICE' && c.serverId
    );
    
    for (const channel of voiceChannels.slice(0, 10)) {
      const activeUsers = faker.helpers.arrayElements(users, { min: 1, max: 5 });
      
      for (const user of activeUsers) {
        voiceAnalytics.push({
          serverId: channel.serverId!,
          channelId: channel.id,
          userId: user.id,
          sessionDuration: faker.number.int({ min: 300, max: 7200 }), // 5 minutes to 2 hours
          timestamp: date,
        });
      }
    }
  }
  
  for (let i = 0; i < voiceAnalytics.length; i += batchSize) {
    const batch = voiceAnalytics.slice(i, i + batchSize);
    await Promise.all(
      batch.map(analytics => prisma.voiceAnalytics.create({ data: analytics }))
    );
  }
  
  // Server Analytics
  const serverAnalytics = [];
  for (let day = 0; day < daysBack; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);
    
    for (const server of servers) {
      serverAnalytics.push({
        serverId: server.id,
        memberCount: faker.number.int({ min: 10, max: 1000 }),
        onlineCount: faker.number.int({ min: 5, max: 500 }),
        messageCount: faker.number.int({ min: 50, max: 5000 }),
        voiceMinutes: faker.number.int({ min: 100, max: 10000 }),
        timestamp: date,
      });
    }
  }
  
  await Promise.all(
    serverAnalytics.map(analytics => prisma.serverAnalytics.create({ data: analytics }))
  );
  
  console.log(`✅ Created ${messageAnalytics.length} message analytics, ${voiceAnalytics.length} voice analytics, and ${serverAnalytics.length} server analytics records`);
}

async function createServerFeatures(servers: any[]) {
  console.log('✨ Creating server features (emojis, stickers, audit logs)...');
  
  let totalFeatures = 0;
  
  for (const server of servers) {
    // Create emojis
    const emojiCount = faker.number.int({ min: 5, max: 20 });
    for (let i = 0; i < emojiCount; i++) {
      await prisma.serverEmoji.create({
        data: {
          serverId: server.id,
          name: faker.lorem.word() + i,
          image: faker.image.url(),
          animated: Math.random() > 0.8,
          requireColons: Math.random() > 0.1,
        }
      });
      totalFeatures++;
    }
    
    // Create stickers
    const stickerCount = faker.number.int({ min: 2, max: 10 });
    for (let i = 0; i < stickerCount; i++) {
      await prisma.serverSticker.create({
        data: {
          serverId: server.id,
          name: faker.lorem.word() + i,
          description: faker.lorem.sentence(),
          tags: faker.lorem.words(3),
          formatType: faker.helpers.arrayElement([1, 2, 3, 4]), // PNG, APNG, LOTTIE, GIF
        }
      });
      totalFeatures++;
    }
    
    // Create audit logs
    const auditLogCount = faker.number.int({ min: 10, max: 50 });
    for (let i = 0; i < auditLogCount; i++) {
      await prisma.auditLog.create({
        data: {
          serverId: server.id,
          actionType: faker.number.int({ min: 1, max: 90 }),
          reason: Math.random() > 0.5 ? faker.lorem.sentence() : null,
          changes: Math.random() > 0.7 ? JSON.stringify([{
            key: faker.lorem.word(),
            old_value: faker.lorem.word(),
            new_value: faker.lorem.word(),
          }]) as any : null,
          createdAt: faker.date.past(),
        }
      });
      totalFeatures++;
    }
  }
  
  console.log(`✅ Created ${totalFeatures} server features`);
}

export async function seed(options: SeedOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    console.log('🌱 Starting database seed...');
    console.log(`Options: ${JSON.stringify(opts, null, 2)}`);
    
    await cleanDatabase();
    
    const users = await createUsers(opts.users!);
    await createUserPresences(users);
    await createFriendships(users);
    
    const servers = await createServers(users, opts.servers!);
    const roles = await createRoles(servers);
    const members = await createServerMembers(servers, users, roles);
    
    const channels = await createChannels(servers, opts.channelsPerServer!);
    await createMessages(channels, users, opts.messagesPerChannel!);
    await createVoiceStates(users, channels);
    
    await createAnalytics(servers, channels, users);
    await createServerFeatures(servers);
    
    console.log('🎉 Seed completed successfully!');
    console.log('\n📊 Final Statistics:');
    
    const stats = {
      users: await prisma.user.count(),
      servers: await prisma.server.count(),
      channels: await prisma.channel.count(),
      messages: await prisma.message.count(),
      reactions: await prisma.reaction.count(),
      voiceStates: await prisma.voiceState.count(),
      friendships: await prisma.friendship.count(),
    };
    
    console.table(stats);
    
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// CLI support
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: SeedOptions = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '') as keyof SeedOptions;
    const value = parseInt(args[i + 1]);
    if (key && !isNaN(value)) {
      options[key] = value;
    }
  }
  
  seed(options)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}