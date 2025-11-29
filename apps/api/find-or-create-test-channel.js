const { prisma } = require('@cryb/database');

async function findOrCreateTestChannel() {
  console.log('🔍 Looking for test channels...');
  
  try {
    // First, let's see what channels exist
    const existingChannels = await prisma.channel.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        type: true,
        serverId: true
      }
    });

    console.log('📋 Existing channels:', existingChannels);

    if (existingChannels.length > 0) {
      console.log('✅ Using existing channel:', existingChannels[0]);
      return existingChannels[0];
    }

    // If no channels exist, let's check if we have a server first
    const servers = await prisma.server.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        ownerId: true
      }
    });

    console.log('📋 Existing servers:', servers);

    let serverId;
    if (servers.length > 0) {
      serverId = servers[0].id;
      console.log('✅ Using existing server:', servers[0]);
    } else {
      // Create a test server
      console.log('🏗️  Creating test server...');
      const testServer = await prisma.server.create({
        data: {
          name: 'Test Server',
          ownerId: 'cmfli232m00007r75206dsan1', // Our test user
          description: 'Test server for Socket.IO testing'
        }
      });
      serverId = testServer.id;
      console.log('✅ Created test server:', testServer);
    }

    // Create a test channel
    console.log('🏗️  Creating test channel...');
    const testChannel = await prisma.channel.create({
      data: {
        id: 'test-channel-123',
        name: 'test-general',
        type: 'TEXT',
        serverId: serverId,
        topic: 'Test channel for Socket.IO testing'
      }
    });

    console.log('✅ Created test channel:', testChannel);
    return testChannel;

  } catch (error) {
    console.error('❌ Error:', error);
    
    // If channel already exists (unique constraint error)
    if (error.code === 'P2002') {
      console.log('✅ Test channel already exists, fetching it...');
      const channel = await prisma.channel.findUnique({
        where: { id: 'test-channel-123' },
        select: {
          id: true,
          name: true,
          type: true,
          serverId: true
        }
      });
      return channel;
    }
    
    throw error;
  }
}

findOrCreateTestChannel().then(channel => {
  console.log('\n🎯 Use this channel ID for testing:', channel.id);
  console.log('📝 Channel details:', channel);
  process.exit(0);
}).catch(console.error);