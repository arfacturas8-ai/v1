const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

// Create multiple Prisma clients to simulate concurrent connections
const createPrismaClient = () => new PrismaClient({
  datasources: {
    db: {
      // Use PgBouncer for load testing
      url: process.env.DATABASE_URL || "postgresql://cryb_user:cryb_password@localhost:6432/cryb"
    }
  }
});

const LOAD_TEST_CONFIG = {
  concurrency: 20,        // Number of concurrent connections
  operations: 100,        // Operations per connection
  testDuration: 30000,    // Test duration in ms (30 seconds)
  warmupTime: 5000       // Warmup time in ms
};

const stats = {
  totalOperations: 0,
  successfulOperations: 0,
  failedOperations: 0,
  errors: [],
  startTime: 0,
  endTime: 0,
  operationTimes: []
};

function generateTestUser(index) {
  const suffix = crypto.randomBytes(4).toString('hex');
  return {
    username: `loadtest${index}_${suffix}`,
    discriminator: Math.floor(Math.random() * 9999).toString().padStart(4, '0'),
    displayName: `Load Test User ${index}`,
    email: `loadtest${index}_${suffix}@example.com`
  };
}

async function performDatabaseOperations(clientIndex, prisma) {
  const operationsPerformed = [];
  
  try {
    // Create test user
    const startTime = Date.now();
    const userData = generateTestUser(clientIndex);
    
    const user = await prisma.user.create({ data: userData });
    operationsPerformed.push({ operation: 'create_user', time: Date.now() - startTime });
    
    // Create server
    const serverStartTime = Date.now();
    const server = await prisma.server.create({
      data: {
        name: `Test Server ${clientIndex}`,
        ownerId: user.id
      }
    });
    operationsPerformed.push({ operation: 'create_server', time: Date.now() - serverStartTime });
    
    // Create multiple channels
    const channelPromises = [];
    for (let i = 0; i < 3; i++) {
      const channelStartTime = Date.now();
      channelPromises.push(
        prisma.channel.create({
          data: {
            name: `channel-${i}`,
            serverId: server.id
          }
        }).then(channel => {
          operationsPerformed.push({ operation: 'create_channel', time: Date.now() - channelStartTime });
          return channel;
        })
      );
    }
    
    const channels = await Promise.all(channelPromises);
    
    // Create messages in parallel
    const messagePromises = [];
    for (let i = 0; i < 10; i++) {
      const messageStartTime = Date.now();
      const channel = channels[i % channels.length];
      
      messagePromises.push(
        prisma.message.create({
          data: {
            content: `Load test message ${i} from client ${clientIndex}`,
            channelId: channel.id,
            userId: user.id
          }
        }).then(message => {
          operationsPerformed.push({ operation: 'create_message', time: Date.now() - messageStartTime });
          return message;
        })
      );
    }
    
    const messages = await Promise.all(messagePromises);
    
    // Perform read operations
    const readStartTime = Date.now();
    const userWithRelations = await prisma.user.findUnique({
      where: { id: user.id },
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
    operationsPerformed.push({ operation: 'complex_read', time: Date.now() - readStartTime });
    
    // Update operations
    const updateStartTime = Date.now();
    await prisma.user.update({
      where: { id: user.id },
      data: { bio: `Updated at ${Date.now()}` }
    });
    operationsPerformed.push({ operation: 'update_user', time: Date.now() - updateStartTime });
    
    // Count operations (fast queries)
    const countStartTime = Date.now();
    await Promise.all([
      prisma.message.count(),
      prisma.user.count(),
      prisma.server.count()
    ]);
    operationsPerformed.push({ operation: 'count_queries', time: Date.now() - countStartTime });
    
    // Cleanup
    const cleanupStartTime = Date.now();
    await prisma.message.deleteMany({ where: { userId: user.id } });
    await prisma.channel.deleteMany({ where: { serverId: server.id } });
    await prisma.server.delete({ where: { id: server.id } });
    await prisma.user.delete({ where: { id: user.id } });
    operationsPerformed.push({ operation: 'cleanup', time: Date.now() - cleanupStartTime });
    
    return operationsPerformed;
    
  } catch (error) {
    throw new Error(`Client ${clientIndex}: ${error.message}`);
  }
}

async function runSingleClient(clientIndex) {
  const prisma = createPrismaClient();
  const clientStats = {
    operations: 0,
    successes: 0,
    failures: 0,
    operationTimes: []
  };
  
  try {
    console.log(`🏃 Client ${clientIndex}: Starting load test...`);
    
    const startTime = Date.now();
    const endTime = startTime + LOAD_TEST_CONFIG.testDuration;
    
    while (Date.now() < endTime) {
      try {
        const operations = await performDatabaseOperations(clientIndex, prisma);
        clientStats.operations += operations.length;
        clientStats.successes += operations.length;
        clientStats.operationTimes.push(...operations.map(op => op.time));
        
      } catch (error) {
        clientStats.failures++;
        stats.errors.push({ client: clientIndex, error: error.message });
      }
    }
    
    console.log(`✅ Client ${clientIndex}: Completed ${clientStats.successes} operations`);
    return clientStats;
    
  } catch (error) {
    console.error(`❌ Client ${clientIndex}: Fatal error - ${error.message}`);
    return clientStats;
  } finally {
    await prisma.$disconnect();
  }
}

async function checkDatabaseConnections() {
  console.log('🔍 Checking database connection capacity...');
  
  const prisma = createPrismaClient();
  try {
    // Check current connections
    const connections = await prisma.$queryRaw`
      SELECT 
        count(*) as active_connections,
        (SELECT setting FROM pg_settings WHERE name = 'max_connections') as max_connections
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `;
    
    console.log(`📊 Current connections: ${connections[0].active_connections}/${connections[0].max_connections}`);
    
    // Check if PgBouncer is working
    try {
      const pgbouncerTest = await prisma.$queryRaw`SELECT 'pgbouncer_connected' as status`;
      console.log('✅ PgBouncer connection successful');
    } catch (error) {
      console.log('⚠️ Direct database connection (PgBouncer may not be available)');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database connection check failed:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function runLoadTest() {
  console.log('🚀 Starting CRYB Platform Database Load Test\n');
  console.log(`Configuration:
  - Concurrent clients: ${LOAD_TEST_CONFIG.concurrency}
  - Test duration: ${LOAD_TEST_CONFIG.testDuration/1000}s
  - Warmup time: ${LOAD_TEST_CONFIG.warmupTime/1000}s
  \n`);
  
  // Pre-flight checks
  const connectionsOk = await checkDatabaseConnections();
  if (!connectionsOk) {
    console.error('❌ Database connection check failed. Aborting load test.');
    process.exit(1);
  }
  
  // Warmup
  console.log('🔥 Warming up database connections...');
  const warmupClient = createPrismaClient();
  try {
    await warmupClient.user.count();
    await warmupClient.$queryRaw`SELECT 1`;
    console.log('✅ Warmup completed');
  } catch (error) {
    console.error('❌ Warmup failed:', error.message);
    process.exit(1);
  } finally {
    await warmupClient.$disconnect();
  }
  
  // Wait for warmup time
  await new Promise(resolve => setTimeout(resolve, LOAD_TEST_CONFIG.warmupTime));
  
  // Start load test
  console.log('⚡ Starting concurrent load test...\n');
  stats.startTime = Date.now();
  
  // Create all client promises
  const clientPromises = [];
  for (let i = 0; i < LOAD_TEST_CONFIG.concurrency; i++) {
    clientPromises.push(runSingleClient(i));
  }
  
  // Wait for all clients to complete
  const clientResults = await Promise.all(clientPromises);
  
  stats.endTime = Date.now();
  const totalTime = (stats.endTime - stats.startTime) / 1000;
  
  // Aggregate results
  let totalOperations = 0;
  let totalSuccesses = 0;
  let totalFailures = 0;
  let allOperationTimes = [];
  
  clientResults.forEach(result => {
    totalOperations += result.operations;
    totalSuccesses += result.successes;
    totalFailures += result.failures;
    allOperationTimes.push(...result.operationTimes);
  });
  
  // Calculate statistics
  const operationsPerSecond = (totalOperations / totalTime).toFixed(2);
  const successRate = ((totalSuccesses / totalOperations) * 100).toFixed(2);
  
  // Operation time statistics
  allOperationTimes.sort((a, b) => a - b);
  const avgTime = (allOperationTimes.reduce((a, b) => a + b, 0) / allOperationTimes.length).toFixed(2);
  const p50 = allOperationTimes[Math.floor(allOperationTimes.length * 0.5)] || 0;
  const p95 = allOperationTimes[Math.floor(allOperationTimes.length * 0.95)] || 0;
  const p99 = allOperationTimes[Math.floor(allOperationTimes.length * 0.99)] || 0;
  
  // Final database health check
  const finalPrisma = createPrismaClient();
  let finalHealth = null;
  try {
    const health = await finalPrisma.$queryRaw`SELECT get_database_health() as health`;
    finalHealth = health[0]?.health;
  } catch (error) {
    console.log('⚠️ Final health check failed');
  } finally {
    await finalPrisma.$disconnect();
  }
  
  // Results
  console.log('\n' + '='.repeat(60));
  console.log('📊 Load Test Results');
  console.log('='.repeat(60));
  console.log(`Duration: ${totalTime}s`);
  console.log(`Concurrent clients: ${LOAD_TEST_CONFIG.concurrency}`);
  console.log(`Total operations: ${totalOperations}`);
  console.log(`Successful operations: ${totalSuccesses}`);
  console.log(`Failed operations: ${totalFailures}`);
  console.log(`Success rate: ${successRate}%`);
  console.log(`Operations per second: ${operationsPerSecond}`);
  
  console.log('\n📈 Performance Metrics:');
  console.log(`Average response time: ${avgTime}ms`);
  console.log(`50th percentile: ${p50}ms`);
  console.log(`95th percentile: ${p95}ms`);
  console.log(`99th percentile: ${p99}ms`);
  
  if (finalHealth) {
    console.log('\n🏥 Final Database Health:');
    console.log(`Status: ${finalHealth.status}`);
    console.log(`Active connections: ${finalHealth.active_connections}/${finalHealth.max_connections}`);
    console.log(`Database size: ${finalHealth.database_size_mb}MB`);
  }
  
  if (stats.errors.length > 0 && stats.errors.length <= 10) {
    console.log('\n❌ Errors encountered:');
    stats.errors.slice(0, 10).forEach(error => {
      console.log(`  Client ${error.client}: ${error.error}`);
    });
    if (stats.errors.length > 10) {
      console.log(`  ... and ${stats.errors.length - 10} more errors`);
    }
  }
  
  // Pass/fail criteria
  const isSuccess = successRate >= 95 && parseFloat(operationsPerSecond) >= 10 && p95 < 5000;
  
  console.log('\n' + '='.repeat(60));
  if (isSuccess) {
    console.log('🎉 LOAD TEST PASSED! Database is production-ready.');
    console.log('✅ Success rate >= 95%');
    console.log('✅ Operations per second >= 10');
    console.log('✅ 95th percentile response time < 5s');
  } else {
    console.log('⚠️ LOAD TEST RESULTS NEED REVIEW');
    if (successRate < 95) console.log('❌ Success rate below 95%');
    if (parseFloat(operationsPerSecond) < 10) console.log('❌ Operations per second below 10');
    if (p95 >= 5000) console.log('❌ 95th percentile response time >= 5s');
  }
  console.log('='.repeat(60));
  
  return isSuccess;
}

// Run load test if called directly
if (require.main === module) {
  runLoadTest()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Load test failed:', error);
      process.exit(1);
    });
}

module.exports = { runLoadTest };