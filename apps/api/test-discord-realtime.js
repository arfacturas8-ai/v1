#!/usr/bin/env node

const { io } = require('socket.io-client');

async function testDiscordRealtime() {
  console.log('🧪 Testing Discord Realtime Features\n');

  // Create two mock users
  const user1Socket = io('http://localhost:3002', {
    auth: { token: 'mock-token-user1' },
    forceNew: true,
    timeout: 20000
  });

  const user2Socket = io('http://localhost:3002', {
    auth: { token: 'mock-token-user2' },
    forceNew: true,
    timeout: 20000
  });

  // Test connection
  console.log('📡 Testing connections...');
  
  await Promise.all([
    new Promise((resolve, reject) => {
      user1Socket.on('connect', () => {
        console.log('✅ User 1 connected');
        resolve();
      });
      user1Socket.on('connect_error', (err) => {
        console.log('❌ User 1 connection error:', err.message);
        resolve(); // Don't fail, just continue
      });
      setTimeout(() => {
        console.log('⏰ User 1 connection timeout');
        resolve();
      }, 5000);
    }),
    
    new Promise((resolve, reject) => {
      user2Socket.on('connect', () => {
        console.log('✅ User 2 connected');
        resolve();
      });
      user2Socket.on('connect_error', (err) => {
        console.log('❌ User 2 connection error:', err.message);
        resolve(); // Don't fail, just continue
      });
      setTimeout(() => {
        console.log('⏰ User 2 connection timeout');
        resolve();
      }, 5000);
    })
  ]);

  // Test server joining
  console.log('\n🏰 Testing server joining...');
  
  if (user1Socket.connected) {
    user1Socket.emit('server:join', { serverId: 'mock-server-1' });
    console.log('📤 User 1 joining server mock-server-1');
  }
  
  if (user2Socket.connected) {
    user2Socket.emit('server:join', { serverId: 'mock-server-1' });
    console.log('📤 User 2 joining server mock-server-1');
  }

  // Test channel joining
  console.log('\n📺 Testing channel joining...');
  
  setTimeout(() => {
    if (user1Socket.connected) {
      user1Socket.emit('channel:join', { channelId: 'mock-channel-1' });
      console.log('📤 User 1 joining channel mock-channel-1');
    }
    
    if (user2Socket.connected) {
      user2Socket.emit('channel:join', { channelId: 'mock-channel-1' });
      console.log('📤 User 2 joining channel mock-channel-1');
    }
  }, 1000);

  // Test messaging
  console.log('\n💬 Testing messaging...');
  
  // Listen for messages
  user1Socket.on('message:create', (message) => {
    console.log('📨 User 1 received message:', {
      id: message.id,
      content: message.content,
      author: message.user?.username || 'unknown'
    });
  });

  user2Socket.on('message:create', (message) => {
    console.log('📨 User 2 received message:', {
      id: message.id,
      content: message.content,
      author: message.user?.username || 'unknown'
    });
  });

  // Send test messages
  setTimeout(() => {
    if (user1Socket.connected) {
      user1Socket.emit('message:create', {
        channelId: 'mock-channel-1',
        content: 'Hello from User 1! 👋',
        nonce: 'msg-1-' + Date.now()
      });
      console.log('📤 User 1 sending message...');
    }
    
    setTimeout(() => {
      if (user2Socket.connected) {
        user2Socket.emit('message:create', {
          channelId: 'mock-channel-1',
          content: 'Hey User 1! This is User 2 🎉',
          nonce: 'msg-2-' + Date.now()
        });
        console.log('📤 User 2 sending message...');
      }
    }, 1000);
  }, 2000);

  // Test typing indicators
  console.log('\n⌨️  Testing typing indicators...');
  
  user1Socket.on('channel:typing_start', (data) => {
    console.log('⌨️  User 1 sees typing:', data);
  });

  user2Socket.on('channel:typing_start', (data) => {
    console.log('⌨️  User 2 sees typing:', data);
  });

  setTimeout(() => {
    if (user1Socket.connected) {
      user1Socket.emit('channel:typing', { channelId: 'mock-channel-1' });
      console.log('📤 User 1 typing...');
    }
  }, 4000);

  // Test presence
  console.log('\n👤 Testing presence...');
  
  user1Socket.on('presence:update', (data) => {
    console.log('👤 User 1 presence update:', data);
  });

  user2Socket.on('presence:update', (data) => {
    console.log('👤 User 2 presence update:', data);
  });

  setTimeout(() => {
    if (user2Socket.connected) {
      user2Socket.emit('presence:update', {
        status: 'idle',
        activity: { type: 'playing', name: 'Testing CRYB Platform' }
      });
      console.log('📤 User 2 updating presence...');
    }
  }, 6000);

  // Clean up after 10 seconds
  setTimeout(() => {
    console.log('\n🧹 Cleaning up...');
    user1Socket.disconnect();
    user2Socket.disconnect();
    console.log('✅ Test completed');
    process.exit(0);
  }, 10000);

  // Error handling
  user1Socket.on('error', (err) => {
    console.log('❌ User 1 error:', err);
  });

  user2Socket.on('error', (err) => {
    console.log('❌ User 2 error:', err);
  });

  user1Socket.on('auth_error', (err) => {
    console.log('🔑 User 1 auth error:', err);
  });

  user2Socket.on('auth_error', (err) => {
    console.log('🔑 User 2 auth error:', err);
  });
}

testDiscordRealtime().catch(console.error);