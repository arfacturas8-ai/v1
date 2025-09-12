#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'],
});

async function createEssentialSeedData() {
  try {
    console.log('🌱 Creating essential seed data for CRYB Platform...');
    
    const startTime = Date.now();
    
    // 1. Create System User for notifications and automated actions
    console.log('🤖 Creating system user...');
    
    const systemUser = await prisma.user.upsert({
      where: { username: 'system' },
      update: {},
      create: {
        username: 'system',
        discriminator: '0000',
        displayName: 'CRYB System',
        email: 'system@cryb.ai',
        isSystem: true,
        isBot: true,
        isVerified: true,
        avatar: 'https://cdn.cryb.ai/assets/system-avatar.png',
        bio: 'Official CRYB system account for notifications and automated messages.',
        locale: 'en-US',
        premiumType: 'NONE',
      }
    });
    
    console.log(`✅ System user created: ${systemUser.id}`);
    
    // 2. Create Default Welcome Server
    console.log('🏠 Creating default welcome server...');
    
    // Check if welcome server already exists
    let welcomeServer = await prisma.server.findFirst({
      where: { 
        name: 'CRYB Welcome Server',
        ownerId: systemUser.id 
      }
    });
    
    if (!welcomeServer) {
      welcomeServer = await prisma.server.create({
        data: {
        name: 'CRYB Welcome Server',
        description: 'Welcome to CRYB! This is the official community server where you can get help, meet other users, and learn about platform features.',
        ownerId: systemUser.id,
        isPublic: true,
        icon: 'https://cdn.cryb.ai/assets/welcome-server-icon.png',
        banner: 'https://cdn.cryb.ai/assets/welcome-server-banner.png',
        verificationLevel: 1,
        defaultMessageNotifications: 0,
        explicitContentFilter: 1,
        features: JSON.stringify([
          'COMMUNITY',
          'WELCOME_SCREEN_ENABLED',
          'MEMBER_VERIFICATION_GATE_ENABLED',
          'NEWS'
        ]),
        maxMembers: 100000,
          preferredLocale: 'en-US',
        }
      });
    }
    
    console.log(`✅ Welcome server created: ${welcomeServer.id}`);
    
    // 3. Create Default Roles for Welcome Server (only if server was just created)
    console.log('🎭 Creating default roles...');
    
    const roles = [];
    
    // Check if server already has roles
    const existingRoles = await prisma.role.findMany({
      where: { serverId: welcomeServer.id }
    });
    
    let adminRole;
    
    if (existingRoles.length === 0) {
      // Create roles only if none exist
      const roleData = [
        {
          name: '@everyone',
          position: 0,
          permissions: BigInt('104324673'),
          color: '#000000',
          mentionable: false,
          hoisted: false,
        },
        {
          name: 'Admin',
          position: 5,
          permissions: BigInt('8'),
          color: '#FF0000',
          mentionable: true,
          hoisted: true,
        },
        {
          name: 'Moderator',
          position: 4,
          permissions: BigInt('268435462'),
          color: '#00FF00',
          mentionable: true,
          hoisted: true,
        },
        {
          name: 'Helper',
          position: 3,
          permissions: BigInt('104324673'),
          color: '#0099FF',
          mentionable: true,
          hoisted: true,
        },
        {
          name: 'Verified',
          position: 2,
          permissions: BigInt('104388177'),
          color: '#9932CC',
          mentionable: false,
          hoisted: false,
        },
        {
          name: 'New Member',
          position: 1,
          permissions: BigInt('104324672'),
          color: '#FFD700',
          mentionable: false,
          hoisted: false,
        }
      ];
      
      for (const roleInfo of roleData) {
        const role = await prisma.role.create({
          data: {
            serverId: welcomeServer.id,
            ...roleInfo
          }
        });
        roles.push(role);
        
        if (role.name === 'Admin') {
          adminRole = role;
        }
      }
      
      console.log(`✅ Created ${roles.length} default roles`);
    } else {
      // Use existing roles
      roles.push(...existingRoles);
      adminRole = existingRoles.find(r => r.name === 'Admin');
      console.log(`✅ Using ${existingRoles.length} existing roles`);
    }
    
    // 4. Create System Server Member
    let systemMember = await prisma.serverMember.findFirst({
      where: {
        serverId: welcomeServer.id,
        userId: systemUser.id
      }
    });
    
    if (!systemMember) {
      systemMember = await prisma.serverMember.create({
        data: {
          serverId: welcomeServer.id,
          userId: systemUser.id,
          nickname: 'CRYB System',
          joinedAt: new Date(),
          pending: false,
        }
      });
    }
    
    // Assign admin role to system user if admin role exists
    if (adminRole) {
      const existingMemberRole = await prisma.memberRole.findFirst({
        where: {
          memberId: systemMember.id,
          roleId: adminRole.id
        }
      });
      
      if (!existingMemberRole) {
        await prisma.memberRole.create({
          data: {
            memberId: systemMember.id,
            roleId: adminRole.id,
          }
        });
      }
    }
    
    console.log('✅ System user added to welcome server with admin role');
    
    // 5. Create Channel Categories and Channels
    console.log('📺 Creating default channels...');
    
    const channels = [];
    
    // Welcome category
    const welcomeCategory = await prisma.channel.create({
      data: {
        serverId: welcomeServer.id,
        name: 'Welcome',
        type: 'GUILD_CATEGORY',
        position: 0,
      }
    });
    channels.push(welcomeCategory);
    
    // Welcome channel
    const welcomeChannel = await prisma.channel.create({
      data: {
        serverId: welcomeServer.id,
        name: 'welcome',
        type: 'GUILD_TEXT',
        parentId: welcomeCategory.id,
        position: 0,
        topic: 'Welcome to CRYB! Please read the rules and introduce yourself.',
      }
    });
    channels.push(welcomeChannel);
    
    // Note: System channel will be set later if needed
    
    // Rules channel
    const rulesChannel = await prisma.channel.create({
      data: {
        serverId: welcomeServer.id,
        name: 'rules',
        type: 'GUILD_TEXT',
        parentId: welcomeCategory.id,
        position: 1,
        topic: 'Please read and follow these rules to maintain a positive community.',
      }
    });
    channels.push(rulesChannel);
    
    // Note: Rules channel will be set later if needed
    
    // Announcements channel
    const announcementsChannel = await prisma.channel.create({
      data: {
        serverId: welcomeServer.id,
        name: 'announcements',
        type: 'GUILD_ANNOUNCEMENT',
        parentId: welcomeCategory.id,
        position: 2,
        topic: 'Official announcements from the CRYB team.',
      }
    });
    channels.push(announcementsChannel);
    
    // Community category
    const communityCategory = await prisma.channel.create({
      data: {
        serverId: welcomeServer.id,
        name: 'Community',
        type: 'GUILD_CATEGORY',
        position: 1,
      }
    });
    channels.push(communityCategory);
    
    // General chat
    const generalChannel = await prisma.channel.create({
      data: {
        serverId: welcomeServer.id,
        name: 'general',
        type: 'GUILD_TEXT',
        parentId: communityCategory.id,
        position: 0,
        topic: 'General discussion and casual conversation.',
      }
    });
    channels.push(generalChannel);
    
    // Help channel
    const helpChannel = await prisma.channel.create({
      data: {
        serverId: welcomeServer.id,
        name: 'help',
        type: 'GUILD_TEXT',
        parentId: communityCategory.id,
        position: 1,
        topic: 'Need help? Ask questions here and our community will assist you.',
      }
    });
    channels.push(helpChannel);
    
    // Feedback channel
    const feedbackChannel = await prisma.channel.create({
      data: {
        serverId: welcomeServer.id,
        name: 'feedback',
        type: 'GUILD_TEXT',
        parentId: communityCategory.id,
        position: 2,
        topic: 'Share your feedback and suggestions for improving CRYB.',
      }
    });
    channels.push(feedbackChannel);
    
    // Voice category
    const voiceCategory = await prisma.channel.create({
      data: {
        serverId: welcomeServer.id,
        name: 'Voice Channels',
        type: 'GUILD_CATEGORY',
        position: 2,
      }
    });
    channels.push(voiceCategory);
    
    // General voice
    const generalVoiceChannel = await prisma.channel.create({
      data: {
        serverId: welcomeServer.id,
        name: 'General Voice',
        type: 'GUILD_VOICE',
        parentId: voiceCategory.id,
        position: 0,
        bitrate: 64000,
        userLimit: 10,
      }
    });
    channels.push(generalVoiceChannel);
    
    // Study room
    const studyRoomChannel = await prisma.channel.create({
      data: {
        serverId: welcomeServer.id,
        name: 'Study Room',
        type: 'GUILD_VOICE',
        parentId: voiceCategory.id,
        position: 1,
        bitrate: 64000,
        userLimit: 5,
      }
    });
    channels.push(studyRoomChannel);
    
    console.log(`✅ Created ${channels.length} default channels`);
    
    // 6. Create Welcome Messages
    console.log('💬 Creating welcome messages...');
    
    const messages = [];
    
    // Welcome message
    const welcomeMessage = await prisma.message.create({
      data: {
        channelId: welcomeChannel.id,
        userId: systemUser.id,
        content: `🎉 **Welcome to CRYB!** 🎉

We're excited to have you join our community! CRYB is a next-generation Discord-like platform with powerful Web3 features.

**Getting Started:**
• Read our <#${rulesChannel.id}> to understand community guidelines
• Introduce yourself and tell us what brings you to CRYB
• Check out <#${helpChannel.id}> if you need assistance
• Share your thoughts in <#${feedbackChannel.id}>

**What makes CRYB special:**
🔗 **Web3 Integration** - Connect your crypto wallets
💎 **Token-Gated Communities** - Access exclusive servers with NFTs
🚀 **Enhanced Analytics** - Real-time insights and data
⚡ **Better Performance** - Optimized for speed and scalability

Ready to explore? Let's build the future of online communities together! 🚀`,
        timestamp: new Date(),
        type: 0,
        isPinned: true,
      }
    });
    messages.push(welcomeMessage);
    
    // Rules message
    const rulesMessage = await prisma.message.create({
      data: {
        channelId: rulesChannel.id,
        userId: systemUser.id,
        content: `📋 **CRYB Community Rules** 📋

Please read and follow these rules to maintain a positive and welcoming environment for everyone:

**1. Be Respectful**
• Treat all members with kindness and respect
• No harassment, bullying, or discrimination
• Respect different opinions and perspectives

**2. Keep It Appropriate**
• No NSFW content outside designated channels
• No spam, excessive caps, or off-topic discussions
• Use appropriate language and avoid excessive profanity

**3. No Scams or Harmful Content**
• No cryptocurrency scams or pump & dump schemes
• No malware, phishing links, or harmful software
• No financial advice or investment recommendations

**4. Follow Discord Terms of Service**
• All Discord TOS rules apply here
• Must be 13+ years old to participate
• No ban evasion or multiple accounts

**5. Web3 Guidelines**
• Verify ownership before claiming token-gated access
• No fake or manipulated wallet connections
• Report suspicious Web3 activity to moderators

**Violations may result in warnings, mutes, kicks, or permanent bans.**

Questions? Contact our Moderator team! 💜`,
        timestamp: new Date(),
        type: 0,
        isPinned: true,
      }
    });
    messages.push(rulesMessage);
    
    // Announcements message
    const announcementMessage = await prisma.message.create({
      data: {
        channelId: announcementsChannel.id,
        userId: systemUser.id,
        content: `🚀 **CRYB Platform Launch Announcement** 🚀

Welcome to the future of online communities! We're thrilled to announce the official launch of CRYB, the next-generation Discord-like platform with integrated Web3 features.

**🎯 What's New:**
• **Token-Gated Servers** - Access exclusive communities with your NFTs
• **Wallet Integration** - Connect MetaMask, WalletConnect, and more
• **Enhanced Analytics** - Real-time server and user insights
• **Better Performance** - Optimized infrastructure for speed
• **Community Focus** - Built by developers, for developers

**🔧 Current Features:**
✅ Real-time messaging and voice chat
✅ Server and channel management
✅ User presence and activity tracking
✅ Web3 wallet connections
✅ NFT-based access control
✅ Advanced moderation tools
✅ Analytics dashboard

**📅 Roadmap:**
• Mobile app (Coming Soon)
• Advanced Web3 features
• Cryptocurrency payments
• More blockchain integrations
• Community marketplace

Thank you for being part of our journey! We can't wait to see what amazing communities you'll build on CRYB. 💜

*Questions or feedback? Drop us a message in <#${feedbackChannel.id}>!*`,
        timestamp: new Date(),
        type: 0,
        isPinned: true,
      }
    });
    messages.push(announcementMessage);
    
    console.log(`✅ Created ${messages.length} welcome messages`);
    
    // 7. Create Sample Communities
    console.log('🏘️ Creating sample communities...');
    
    const communities = [];
    
    const cryptoCommunity = await prisma.community.create({
      data: {
        name: 'cryptocurrency',
        displayName: 'Cryptocurrency',
        description: 'Discussion about cryptocurrencies, DeFi, and blockchain technology.',
        isPublic: true,
        memberCount: 0,
      }
    });
    communities.push(cryptoCommunity);
    
    const devCommunity = await prisma.community.create({
      data: {
        name: 'developers',
        displayName: 'Developers',
        description: 'A community for developers to share knowledge, ask questions, and collaborate.',
        isPublic: true,
        memberCount: 0,
      }
    });
    communities.push(devCommunity);
    
    const gamingCommunity = await prisma.community.create({
      data: {
        name: 'gaming',
        displayName: 'Gaming',
        description: 'Gaming discussions, reviews, and community events.',
        isPublic: true,
        memberCount: 0,
      }
    });
    communities.push(gamingCommunity);
    
    console.log(`✅ Created ${communities.length} sample communities`);
    
    // 8. Create Permanent Invite to Welcome Server
    console.log('🔗 Creating permanent invite...');
    
    const permanentInvite = await prisma.invite.create({
      data: {
        code: 'welcome',
        serverId: welcomeServer.id,
        inviterId: systemUser.id,
        maxUses: null,
        maxAge: null,
        temporary: false,
      }
    });
    
    console.log(`✅ Created permanent invite: ${permanentInvite.code}`);
    
    // 9. Set up system user presence
    console.log('🟢 Setting up system user presence...');
    
    await prisma.userPresence.create({
      data: {
        userId: systemUser.id,
        status: 'ONLINE',
        clientStatus: {
          web: 'online'
        }
      }
    });
    
    console.log('✅ System user presence configured');
    
    const totalTime = Date.now() - startTime;
    
    console.log('\n🎉 Essential seed data creation completed!');
    console.log(`⏱️  Total time: ${totalTime}ms`);
    
    console.log('\n📊 Created Essential Data:');
    console.log(`• System User: ${systemUser.username}#${systemUser.discriminator} (${systemUser.id})`);
    console.log(`• Welcome Server: "${welcomeServer.name}" (${welcomeServer.id})`);
    console.log(`• Roles: ${roles.length} default roles`);
    console.log(`• Channels: ${channels.length} organized channels`);
    console.log(`• Messages: ${messages.length} welcome messages`);
    console.log(`• Communities: ${communities.length} sample communities`);
    console.log(`• Invite Code: "${permanentInvite.code}" (permanent)`);
    
    console.log('\n🔗 Access Information:');
    console.log(`• Server Invite: https://cryb.ai/invite/${permanentInvite.code}`);
    console.log(`• System User ID: ${systemUser.id}`);
    console.log(`• Welcome Server ID: ${welcomeServer.id}`);
    
    return {
      systemUser,
      welcomeServer,
      roles,
      channels,
      messages,
      communities,
      permanentInvite
    };
    
  } catch (error) {
    console.error('❌ Failed to create essential seed data:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  createEssentialSeedData()
    .then(result => process.exit(result ? 0 : 1))
    .catch(() => process.exit(1));
}

module.exports = { createEssentialSeedData };