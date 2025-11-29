const { io } = require('socket.io-client');
const fs = require('fs');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testMultiUserSocket() {
  console.log('🔍 Testing Socket.IO with multiple users for real-time interaction...');
  
  try {
    // Load the token for real user
    const tokenData = JSON.parse(fs.readFileSync('/home/ubuntu/cryb-platform/apps/api/real-user-token.json', 'utf8'));
    const token = tokenData.token;
    
    console.log('🔑 Using token for user:', tokenData.payload.username);
    
    // Create two socket connections simulating two users
    const socket1 = io('http://localhost:3002', {
      transports: ['polling', 'websocket'],
      timeout: 10000,
      forceNew: true,
      auth: { token: token }
    });

    const socket2 = io('http://localhost:3002', {
      transports: ['polling', 'websocket'],
      timeout: 10000,
      forceNew: true,
      auth: { token: token }
    });

    let socket1Connected = false;
    let socket2Connected = false;
    
    const testChannelId = 'cmfluxccx000a7me2teu4vrkq'; // 'general' text channel

    socket1.on('connect', () => {
      console.log('✅ Socket 1 connected:', socket1.id);
      socket1Connected = true;
      
      // Listen for events from other users
      socket1.on('message:create', (message) => {
        console.log('👤1 📨 Message received on Socket 1:', {
          id: message.id,
          content: message.content,
          from: message.user?.username
        });
      });
      
      socket1.on('channel:typing_start', (data) => {
        console.log('👤1 ⌨️  User started typing (Socket 1 received):', data);
      });
      
      socket1.on('channel:typing_stop', (data) => {
        console.log('👤1 ⌨️  User stopped typing (Socket 1 received):', data);
      });
      
      socket1.on('presence:update', (data) => {
        console.log('👤1 👤 Presence update (Socket 1 received):', data);
      });
    });

    socket2.on('connect', () => {
      console.log('✅ Socket 2 connected:', socket2.id);
      socket2Connected = true;
      
      // Listen for events from other users
      socket2.on('message:create', (message) => {
        console.log('👤2 📨 Message received on Socket 2:', {
          id: message.id,
          content: message.content,
          from: message.user?.username
        });
      });
      
      socket2.on('channel:typing_start', (data) => {
        console.log('👤2 ⌨️  User started typing (Socket 2 received):', data);
      });
      
      socket2.on('channel:typing_stop', (data) => {
        console.log('👤2 ⌨️  User stopped typing (Socket 2 received):', data);
      });
      
      socket2.on('presence:update', (data) => {
        console.log('👤2 👤 Presence update (Socket 2 received):', data);
      });
    });

    // Wait for both connections
    await new Promise((resolve) => {
      const check = () => {
        if (socket1Connected && socket2Connected) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });

    console.log('\n🏠 Both sockets connected! Testing real-time interactions...');

    // Join both sockets to the same channel
    console.log('\n📨 Step 1: Joining both users to the channel...');
    
    socket1.emit('channel:join', { channelId: testChannelId });
    await sleep(1000);
    socket2.emit('channel:join', { channelId: testChannelId });
    await sleep(2000);

    // Socket 1 sends a message
    console.log('\n📨 Step 2: Socket 1 sends a message...');
    socket1.emit('message:create', {
      content: 'Hello from Socket 1! ' + new Date().toISOString(),
      channelId: testChannelId,
      nonce: 'socket1-' + Date.now()
    });
    await sleep(2000);

    // Socket 2 starts typing
    console.log('\n⌨️  Step 3: Socket 2 starts typing...');
    socket2.emit('channel:typing', { channelId: testChannelId });
    await sleep(2000);

    // Socket 2 sends a message
    console.log('\n📨 Step 4: Socket 2 sends a message...');
    socket2.emit('message:create', {
      content: 'Hello back from Socket 2! ' + new Date().toISOString(),
      channelId: testChannelId,
      nonce: 'socket2-' + Date.now()
    });
    await sleep(2000);

    // Socket 2 stops typing
    console.log('\n⌨️  Step 5: Socket 2 stops typing...');
    socket2.emit('channel:typing_stop', { channelId: testChannelId });
    await sleep(2000);

    // Socket 1 updates presence
    console.log('\n👤 Step 6: Socket 1 updates presence...');
    socket1.emit('presence:update', {
      status: 'online',
      activity: {
        type: 'playing',
        name: 'Multi-User Test',
        details: 'Testing real-time interactions'
      }
    });
    await sleep(2000);

    console.log('\n✅ Multi-user real-time test completed successfully!');
    console.log('🔌 Disconnecting both sockets...');
    
    socket1.disconnect();
    socket2.disconnect();
    
    setTimeout(() => {
      process.exit(0);
    }, 1000);

  } catch (error) {
    console.error('💥 Multi-user test failed:', error);
    process.exit(1);
  }
}

testMultiUserSocket();