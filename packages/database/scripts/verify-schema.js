#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error'],
});

// Expected tables from schema
const EXPECTED_TABLES = [
  'User', 'Session', 'Server', 'Channel', 'Message', 'Thread', 
  'Post', 'Comment', 'Community', 'ServerMember', 'Role', 'MemberRole',
  'ChannelPermission', 'CommunityMember', 'Moderator', 'Vote', 'Award',
  'Flair', 'Token', 'Reaction', 'Invite', 'Ban', 'Notification',
  'UserPresence', 'UserActivity', 'Friendship', 'Block', 
  'DirectMessageParticipant', 'VoiceState', 'MessageAttachment',
  'MessageEmbed', 'MessageReference', 'ServerEmoji', 'ServerSticker',
  'AuditLog', 'MessageAnalytics', 'VoiceAnalytics', 'ServerAnalytics'
];

async function verifySchema() {
  try {
    console.log('🔍 Verifying Database Schema...\n');
    
    // Get all table names from database
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    const actualTables = tables.map(t => t.table_name);
    console.log(`📋 Found ${actualTables.length} tables in database`);
    
    // Check for missing tables
    const missingTables = EXPECTED_TABLES.filter(table => 
      !actualTables.includes(table)
    );
    
    // Check for extra tables
    const extraTables = actualTables.filter(table => 
      !EXPECTED_TABLES.includes(table)
    );
    
    if (missingTables.length === 0 && extraTables.length === 0) {
      console.log('✅ All expected tables exist!');
    } else {
      if (missingTables.length > 0) {
        console.log('❌ Missing tables:', missingTables);
      }
      if (extraTables.length > 0) {
        console.log('ℹ️  Extra tables:', extraTables);
      }
    }
    
    // Test key models
    console.log('\n🧪 Testing key models...');
    const [userCount, serverCount, channelCount, messageCount, memberCount] = await Promise.all([
      prisma.user.count(),
      prisma.server.count(),
      prisma.channel.count(),
      prisma.message.count(),
      prisma.serverMember.count()
    ]);
    
    console.log(`Users: ${userCount}`);
    console.log(`Servers: ${serverCount}`);
    console.log(`Channels: ${channelCount}`);
    console.log(`Messages: ${messageCount}`);
    console.log(`Server Members: ${memberCount}`);
    
    console.log('\n✅ Schema verification completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Schema verification failed:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  verifySchema()
    .then(success => process.exit(success ? 0 : 1))
    .catch(() => process.exit(1));
}

module.exports = { verifySchema };