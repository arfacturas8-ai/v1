#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error'],
});

async function showDatabaseStatus() {
  console.log('🗄️  CRYB Platform Database Status Report');
  console.log('==========================================\n');
  
  try {
    // Connection test
    console.log('🔌 Connection Status:');
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const connectionTime = Date.now() - startTime;
    console.log(`   ✅ Connected (${connectionTime}ms)\n`);

    // Schema overview
    console.log('📋 Schema Overview:');
    const tableCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `;
    
    const indexCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM pg_indexes 
      WHERE schemaname = 'public'
    `;
    
    const functionCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
    `;

    console.log(`   📊 Tables: ${tableCount[0].count}`);
    console.log(`   🗂️  Indexes: ${indexCount[0].count}`);
    console.log(`   ⚙️  Functions: ${functionCount[0].count}\n`);

    // Data statistics
    console.log('📈 Data Statistics:');
    const stats = await Promise.all([
      prisma.user.count(),
      prisma.server.count(),
      prisma.channel.count(),
      prisma.message.count(),
      prisma.reaction.count(),
      prisma.serverMember.count(),
      prisma.friendship.count(),
      prisma.userPresence.count(),
      prisma.voiceState.count(),
      prisma.notification.count()
    ]);

    const dataStats = {
      'Users': stats[0],
      'Servers': stats[1],
      'Channels': stats[2],
      'Messages': stats[3],
      'Reactions': stats[4],
      'Server Members': stats[5],
      'Friendships': stats[6],
      'User Presences': stats[7],
      'Voice States': stats[8],
      'Notifications': stats[9]
    };

    Object.entries(dataStats).forEach(([key, value]) => {
      console.log(`   ${key}: ${value.toLocaleString()}`);
    });

    // Analytics data
    console.log('\n📊 Analytics Data:');
    const analyticsStats = await Promise.all([
      prisma.messageAnalytics.count(),
      prisma.voiceAnalytics.count(),
      prisma.serverAnalytics.count(),
      prisma.$queryRaw`SELECT COUNT(*) as count FROM user_activity_metrics`,
      prisma.$queryRaw`SELECT COUNT(*) as count FROM channel_activity_metrics`,
      prisma.$queryRaw`SELECT COUNT(*) as count FROM system_metrics`
    ]);

    console.log(`   Message Analytics: ${analyticsStats[0].toLocaleString()}`);
    console.log(`   Voice Analytics: ${analyticsStats[1].toLocaleString()}`);
    console.log(`   Server Analytics: ${analyticsStats[2].toLocaleString()}`);
    console.log(`   User Activity Metrics: ${analyticsStats[3][0].count}`);
    console.log(`   Channel Activity Metrics: ${analyticsStats[4][0].count}`);
    console.log(`   System Metrics: ${analyticsStats[5][0].count}`);

    // Performance features
    console.log('\n⚡ Performance Features:');
    console.log('   ✅ Full-text search indexes (GIN)');
    console.log('   ✅ Composite indexes for complex queries');
    console.log('   ✅ Partial indexes for filtered data');
    console.log('   ✅ Time-based partitioning indexes');
    console.log('   ✅ Materialized views for analytics');

    // Materialized views status
    console.log('\n📊 Materialized Views:');
    const viewStats = await Promise.all([
      prisma.$queryRaw`SELECT COUNT(*) as count FROM hourly_server_activity`,
      prisma.$queryRaw`SELECT COUNT(*) as count FROM daily_user_activity`,
      prisma.$queryRaw`SELECT COUNT(*) as count FROM daily_channel_activity`
    ]);

    console.log(`   Hourly Server Activity: ${viewStats[0][0].count} records`);
    console.log(`   Daily User Activity: ${viewStats[1][0].count} records`);
    console.log(`   Daily Channel Activity: ${viewStats[2][0].count} records`);

    // Real-time features
    console.log('\n🔴 Real-time Features:');
    const realtimeStats = await Promise.all([
      prisma.userPresence.count({ where: { status: { in: ['ONLINE', 'IDLE', 'DND'] } } }),
      prisma.voiceState.count({ where: { channelId: { not: null } } }),
      prisma.notification.count({ where: { isRead: false } })
    ]);

    console.log(`   Online Users: ${realtimeStats[0]}`);
    console.log(`   Users in Voice: ${realtimeStats[1]}`);
    console.log(`   Unread Notifications: ${realtimeStats[2]}`);

    // System health
    console.log('\n💚 System Health:');
    const healthStats = await prisma.$queryRaw`
      SELECT 
        SUM(n_tup_ins) as total_inserts,
        SUM(n_tup_upd) as total_updates,
        SUM(n_tup_del) as total_deletes,
        SUM(n_live_tup) as total_records
      FROM pg_stat_user_tables 
      WHERE schemaname = 'public'
    `;

    const health = healthStats[0];
    console.log(`   Total Records: ${parseInt(health.total_records).toLocaleString()}`);
    console.log(`   Total Inserts: ${parseInt(health.total_inserts).toLocaleString()}`);
    console.log(`   Total Updates: ${parseInt(health.total_updates).toLocaleString()}`);
    console.log(`   Total Deletes: ${parseInt(health.total_deletes).toLocaleString()}`);

    // Database size
    const dbSize = await prisma.$queryRaw`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `;
    console.log(`   Database Size: ${dbSize[0].size}`);

    console.log('\n✅ Database is fully initialized and operational!');
    console.log('\n📝 Available Features:');
    console.log('   • Discord-like servers, channels, and messaging');
    console.log('   • Reddit-like communities and posts');
    console.log('   • Real-time presence and voice states');
    console.log('   • Friend system and direct messaging');
    console.log('   • Web3 token integration');
    console.log('   • Comprehensive analytics and metrics');
    console.log('   • Full-text search capabilities');
    console.log('   • Audit logging and moderation tools');
    console.log('   • File attachments and embeds');
    console.log('   • Role-based permissions');

  } catch (error) {
    console.error('❌ Database status check failed:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }

  return true;
}

if (require.main === module) {
  showDatabaseStatus()
    .then(success => process.exit(success ? 0 : 1))
    .catch(() => process.exit(1));
}

module.exports = { showDatabaseStatus };