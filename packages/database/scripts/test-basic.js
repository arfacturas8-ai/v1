const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testBasicConnection() {
  console.log('🔍 Testing CRYB Platform Database Connection...\n');
  
  try {
    // Test basic connection
    const result = await prisma.$queryRaw`SELECT 1 as test, current_database(), current_user`;
    console.log('✓ Database connection successful:', result[0]);
    
    // Test database health
    try {
      const health = await prisma.$queryRaw`SELECT get_database_health() as health`;
      const healthData = health[0]?.health;
      console.log('✓ Database health check passed');
      console.log('  Status:', healthData.status);
      console.log('  Active connections:', healthData.active_connections);
      console.log('  Database size:', healthData.database_size_mb, 'MB');
      console.log('  Tables:', healthData.table_count);
      console.log('  Indexes:', healthData.index_count);
    } catch (error) {
      console.log('⚠️ Health check function not available');
    }
    
    // Count models to verify all tables are accessible
    const models = [
      'user', 'server', 'channel', 'message', 'community', 'post', 'comment',
      'session', 'serverMember', 'role', 'vote', 'notification', 'friendship',
      'nFTCollection', 'nFT', 'tokenGatingRule', 'cryptoPayment', 'stakingPool',
      'governanceProposal', 'reaction', 'invite', 'ban', 'userPresence',
      'voiceState', 'messageAttachment', 'serverEmoji', 'auditLog'
    ];
    
    console.log('\n📊 Testing Model Access:');
    let successCount = 0;
    let totalCount = 0;
    
    for (const modelName of models) {
      totalCount++;
      try {
        const count = await prisma[modelName].count();
        console.log(`✓ ${modelName}: ${count} records`);
        successCount++;
      } catch (error) {
        console.log(`❌ ${modelName}: ${error.message}`);
      }
    }
    
    // Test TimescaleDB hypertables if they exist
    console.log('\n⏰ Testing TimescaleDB Hypertables:');
    try {
      const hypertables = await prisma.$queryRaw`
        SELECT hypertable_name, hypertable_schema 
        FROM timescaledb_information.hypertables 
        WHERE hypertable_schema = 'public'
      `;
      
      if (hypertables.length > 0) {
        console.log(`✓ Found ${hypertables.length} hypertables:`);
        hypertables.forEach(ht => {
          console.log(`  - ${ht.hypertable_name}`);
        });
      } else {
        console.log('⚠️ No hypertables found (analytics tables not converted)');
      }
    } catch (error) {
      console.log('⚠️ TimescaleDB not fully configured');
    }
    
    // Test basic CRUD operations
    console.log('\n🧪 Testing Basic CRUD Operations:');
    
    // Create test user
    const testUser = await prisma.user.create({
      data: {
        username: 'testuser',
        discriminator: '0001',
        displayName: 'Test User',
        email: 'test@example.com'
      }
    });
    console.log('✓ User created:', testUser.username);
    
    // Create test server
    const testServer = await prisma.server.create({
      data: {
        name: 'Test Server',
        ownerId: testUser.id
      }
    });
    console.log('✓ Server created:', testServer.name);
    
    // Create test channel
    const testChannel = await prisma.channel.create({
      data: {
        name: 'general',
        serverId: testServer.id
      }
    });
    console.log('✓ Channel created:', testChannel.name);
    
    // Create test message
    const testMessage = await prisma.message.create({
      data: {
        content: 'Hello, CRYB Platform!',
        channelId: testChannel.id,
        userId: testUser.id
      }
    });
    console.log('✓ Message created:', testMessage.content);
    
    // Test complex query with relations
    const complexQuery = await prisma.user.findUnique({
      where: { id: testUser.id },
      include: {
        ownedServers: {
          include: {
            channels: {
              include: {
                messages: true
              }
            }
          }
        }
      }
    });
    
    console.log('✓ Complex relational query successful');
    console.log(`  User owns ${complexQuery.ownedServers.length} server(s)`);
    console.log(`  Total messages: ${complexQuery.ownedServers.reduce((sum, server) => 
      sum + server.channels.reduce((channelSum, channel) => channelSum + channel.messages.length, 0), 0)}`);
    
    // Cleanup test data
    await prisma.message.delete({ where: { id: testMessage.id } });
    await prisma.channel.delete({ where: { id: testChannel.id } });
    await prisma.server.delete({ where: { id: testServer.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    console.log('✓ Test data cleaned up');
    
    // Final statistics
    console.log('\n📈 Database Test Summary:');
    console.log(`✓ Models accessible: ${successCount}/${totalCount}`);
    console.log(`✓ Success rate: ${((successCount/totalCount) * 100).toFixed(1)}%`);
    
    if (successCount === totalCount) {
      console.log('\n🎉 All database tests passed! Database is fully operational.');
      return true;
    } else {
      console.log('\n⚠️ Some models are not accessible. Check the errors above.');
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ Database test failed:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Run the test
testBasicConnection()
  .then(success => {
    console.log('\n' + '='.repeat(60));
    if (success) {
      console.log('🚀 DATABASE READY FOR PRODUCTION! 🚀');
    } else {
      console.log('❌ DATABASE NEEDS ATTENTION');
    }
    console.log('='.repeat(60));
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });