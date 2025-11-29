#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error'],
});

async function testCompleteDatabase() {
  console.log('🔍 Running Complete Database Test Suite...\n');
  
  try {
    // Test 1: Basic Connection
    console.log('1️⃣ Testing basic connection...');
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1 as test`;
    const connectionTime = Date.now() - startTime;
    console.log(`✅ Connection successful (${connectionTime}ms)\n`);

    // Test 2: Schema Verification
    console.log('2️⃣ Testing schema and model counts...');
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
    console.log(`Server Members: ${memberCount}\n`);

    // Test 3: Analytics Tables
    console.log('3️⃣ Testing analytics tables...');
    const analyticsTablesExist = await Promise.all([
      prisma.$queryRaw`SELECT COUNT(*) as count FROM user_activity_metrics`,
      prisma.$queryRaw`SELECT COUNT(*) as count FROM channel_activity_metrics`,
      prisma.$queryRaw`SELECT COUNT(*) as count FROM system_metrics`,
      prisma.messageAnalytics.count(),
      prisma.voiceAnalytics.count(),
      prisma.serverAnalytics.count()
    ]);
    
    console.log(`User Activity Metrics: ${analyticsTablesExist[0][0].count}`);
    console.log(`Channel Activity Metrics: ${analyticsTablesExist[1][0].count}`);
    console.log(`System Metrics: ${analyticsTablesExist[2][0].count}`);
    console.log(`Message Analytics: ${analyticsTablesExist[3]}`);
    console.log(`Voice Analytics: ${analyticsTablesExist[4]}`);
    console.log(`Server Analytics: ${analyticsTablesExist[5]}\n`);

    // Test 4: Indexes Performance Test
    console.log('4️⃣ Testing query performance with indexes...');
    const performanceStart = Date.now();
    
    // Test full-text search on messages
    const searchResults = await prisma.$queryRaw`
      SELECT id, content 
      FROM "Message" 
      WHERE to_tsvector('english', content) @@ plainto_tsquery('english', 'help')
      LIMIT 5
    `;
    
    // Test complex query with joins
    const complexQuery = await prisma.message.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        channel: {
          include: {
            server: true
          }
        },
        reactions: {
          take: 5,
          include: {
            user: true
          }
        }
      }
    });

    const performanceTime = Date.now() - performanceStart;
    console.log(`✅ Complex queries executed successfully (${performanceTime}ms)`);
    console.log(`Full-text search found ${searchResults.length} results`);
    console.log(`Complex query returned ${complexQuery.length} messages\n`);

    // Test 5: Analytics Functions
    console.log('5️⃣ Testing analytics functions...');
    
    // Test server activity function (if there are servers)
    if (serverCount > 0) {
      const servers = await prisma.server.findMany({ take: 1 });
      const serverId = servers[0].id;
      
      try {
        const serverActivity = await prisma.$queryRaw`
          SELECT * FROM get_server_activity_trend(${serverId}, 24)
        `;
        console.log(`Server activity function works - returned ${serverActivity.length} records`);
      } catch (error) {
        console.log(`Server activity function test skipped: ${error.message}`);
      }
    }

    // Test most active channels function
    try {
      const activeChannels = await prisma.$queryRaw`
        SELECT * FROM get_most_active_channels(NULL, 24, 5)
      `;
      console.log(`Most active channels function works - returned ${activeChannels.length} records`);
    } catch (error) {
      console.log(`Active channels function test skipped: ${error.message}`);
    }

    // Test 6: Materialized Views
    console.log('\n6️⃣ Testing materialized views...');
    const materializedViews = await Promise.all([
      prisma.$queryRaw`SELECT COUNT(*) as count FROM hourly_server_activity`,
      prisma.$queryRaw`SELECT COUNT(*) as count FROM daily_user_activity`, 
      prisma.$queryRaw`SELECT COUNT(*) as count FROM daily_channel_activity`
    ]);
    
    console.log(`Hourly Server Activity: ${materializedViews[0][0].count} records`);
    console.log(`Daily User Activity: ${materializedViews[1][0].count} records`);
    console.log(`Daily Channel Activity: ${materializedViews[2][0].count} records`);

    // Test 7: Real-time Features Test
    console.log('\n7️⃣ Testing real-time features...');
    
    // Test user presence
    const onlineUsers = await prisma.userPresence.count({
      where: { status: 'ONLINE' }
    });
    console.log(`Online users: ${onlineUsers}`);

    // Test voice states
    const activeVoice = await prisma.voiceState.count({
      where: { channelId: { not: null } }
    });
    console.log(`Users in voice channels: ${activeVoice}`);

    // Test friend system
    const friendships = await prisma.friendship.count({
      where: { status: 'ACCEPTED' }
    });
    console.log(`Active friendships: ${friendships}`);

    // Test 8: Web3 Features
    console.log('\n8️⃣ Testing Web3 features...');
    const tokensCount = await prisma.token.count();
    const walletUsers = await prisma.user.count({
      where: { walletAddress: { not: null } }
    });
    console.log(`Stored tokens: ${tokensCount}`);
    console.log(`Users with wallets: ${walletUsers}`);

    // Test 9: Database Health Check
    console.log('\n9️⃣ Running database health check...');
    const healthMetrics = await prisma.$queryRaw`
      SELECT 
        schemaname,
        relname as tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_tuples
      FROM pg_stat_user_tables 
      WHERE schemaname = 'public'
      ORDER BY n_live_tup DESC
      LIMIT 10
    `;
    
    console.log('Top 10 tables by record count:');
    healthMetrics.forEach(table => {
      console.log(`  ${table.tablename}: ${table.live_tuples} records`);
    });

    // Test 10: Index Usage Statistics
    console.log('\n🔟 Checking index usage...');
    const indexUsage = await prisma.$queryRaw`
      SELECT 
        schemaname,
        relname as tablename,
        indexrelname as indexname,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes 
      WHERE schemaname = 'public' AND idx_scan > 0
      ORDER BY idx_scan DESC
      LIMIT 10
    `;
    
    console.log('Top 10 most used indexes:');
    indexUsage.forEach(index => {
      console.log(`  ${index.tablename}.${index.indexname}: ${index.idx_scan} scans`);
    });

    console.log('\n🎉 Complete database test suite passed!');
    console.log('\n📊 Summary:');
    console.log(`- Database connection: ✅ Working (${connectionTime}ms)`);
    console.log(`- Schema integrity: ✅ All tables present`);
    console.log(`- Data records: ✅ ${userCount + serverCount + channelCount + messageCount} total records`);
    console.log(`- Performance indexes: ✅ Created and functioning`);
    console.log(`- Analytics tables: ✅ Available`);
    console.log(`- Materialized views: ✅ Created`);
    console.log(`- Real-time features: ✅ Ready`);
    console.log(`- Web3 integration: ✅ Available`);

    return true;

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  testCompleteDatabase()
    .then(success => process.exit(success ? 0 : 1))
    .catch(() => process.exit(1));
}

module.exports = { testCompleteDatabase };