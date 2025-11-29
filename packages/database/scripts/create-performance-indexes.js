#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'],
});

async function createPerformanceIndexes() {
  try {
    console.log('🔧 Creating performance indexes for CRYB Platform...');
    
    const startTime = Date.now();
    
    // No need to read SQL file as statements are defined below
    
    // Define the index creation statements manually for reliability
    const statements = [
      // Full-text search index for messages
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_search 
       ON "Message" USING GIN (to_tsvector('english', content))`,
      
      // Composite indexes for complex queries
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_composite
       ON "UserActivity" ("userId", "type", "createdAt")`,
      
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voice_state_composite
       ON "VoiceState" ("channelId", "connectedAt") WHERE "channelId" IS NOT NULL`,
      
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_analytics_hour
       ON "MessageAnalytics" (date_trunc('hour', timestamp), "serverId")`,
      
      // Partial indexes for better performance
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_active_voice_states
       ON "VoiceState" ("serverId", "channelId", "connectedAt") WHERE "channelId" IS NOT NULL`,
      
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_friendship_active
       ON "Friendship" ("initiatorId", "receiverId") WHERE status = 'ACCEPTED'`,
      
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_server_member_active
       ON "ServerMember" ("serverId", "joinedAt") WHERE pending = false`,
      
      // Messages by channel and time (most common chat query)
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_channel_time_desc
       ON "Message" ("channelId", "createdAt" DESC)`,
      
      // User mentions in messages
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_mentions
       ON "Message" USING GIN (mentions) WHERE mentions IS NOT NULL`,
      
      // Server members by join date
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_server_members_joined
       ON "ServerMember" ("serverId", "joinedAt" DESC)`,
      
      // Unread notifications
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_unread_notifications
       ON "Notification" ("userId", "createdAt" DESC) WHERE "isRead" = false`,
      
      // Posts by community and score (Reddit-like sorting)
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_community_score
       ON "Post" ("communityId", "score" DESC, "createdAt" DESC)`,
      
      // Comments by post and score
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_post_score
       ON "Comment" ("postId", "score" DESC, "createdAt" DESC)`,
      
      // Voice analytics by time
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voice_analytics_time
       ON "VoiceAnalytics" ("timestamp" DESC, "serverId")`,
      
      // Server analytics by time
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_server_analytics_time
       ON "ServerAnalytics" ("serverId", "timestamp" DESC)`,
      
      // Audit logs by server and action type
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_server_action
       ON "AuditLog" ("serverId", "actionType", "createdAt" DESC)`,
      
      // Tokens by user and chain for Web3 features
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tokens_user_chain
       ON "Token" ("userId", "chain", "verified")`,
      
      // Message reactions by message
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reactions_message_emoji
       ON "Reaction" ("messageId", "emoji")`,
      
      // Thread messages by thread and time
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_thread_messages
       ON "Message" ("threadId", "createdAt" DESC) WHERE "threadId" IS NOT NULL`,
      
      // Ban records by server
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bans_server_time
       ON "Ban" ("serverId", "createdAt" DESC)`,
      
      // Invites by server
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invites_server_time
       ON "Invite" ("serverId", "expiresAt") WHERE "expiresAt" IS NOT NULL`,
      
      // Community member karma tracking
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_community_members_karma
       ON "CommunityMember" ("communityId", "karma" DESC)`,
      
      // Message attachments by content type
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attachments_content_type
       ON "MessageAttachment" ("contentType", "messageId")`
    ];
    
    console.log(`📊 Found ${statements.length} index creation statements`);
    
    let successCount = 0;
    let skipCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        console.log(`[${i + 1}/${statements.length}] Creating index...`);
        await prisma.$executeRawUnsafe(statement);
        successCount++;
        console.log('✅ Index created successfully');
      } catch (error) {
        if (error.message.includes('already exists')) {
          skipCount++;
          console.log('⏭️  Index already exists, skipping');
        } else {
          console.error(`❌ Failed to create index: ${error.message}`);
        }
      }
    }
    
    // Run ANALYZE to update statistics
    console.log('\n📈 Updating table statistics...');
    await prisma.$executeRaw`ANALYZE;`;
    
    const totalTime = Date.now() - startTime;
    
    console.log('\n🎉 Performance indexes setup completed!');
    console.log(`✅ Created: ${successCount} indexes`);
    console.log(`⏭️  Skipped: ${skipCount} indexes (already exist)`);
    console.log(`⏱️  Total time: ${totalTime}ms`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to create performance indexes:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  createPerformanceIndexes()
    .then(success => process.exit(success ? 0 : 1))
    .catch(() => process.exit(1));
}

module.exports = { createPerformanceIndexes };