#!/usr/bin/env node

const axios = require('axios');
const { io } = require('socket.io-client');

// Configure axios to not throw on error status codes
axios.defaults.validateStatus = (status) => status < 600;

const API_BASE_URL = 'http://localhost:3002/api/v1';
const SOCKET_URL = 'http://localhost:3002';

async function testFocusedFeatures() {
  console.log('🚀 Testing Core Features...\n');

  // Step 1: Authentication Flow
  console.log('🔐 1. Testing Authentication...');
  const testUser = {
    email: `focused-test-${Date.now()}@example.com`,
    password: 'SecurePassword123!',
    confirmPassword: 'SecurePassword123!',
    username: `focusedtest${Date.now()}`,
    displayName: 'Focused Test User'
  };

  let token = null;

  try {
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, testUser);
    token = registerResponse.data?.data?.tokens?.accessToken;
    console.log(registerResponse.status === 201 ? '   ✅ Registration: PASS' : '   ❌ Registration: FAIL');
  } catch (error) {
    console.log('   ❌ Registration: FAIL');
  }

  if (!token) return;

  // Step 2: Discord-style Server Creation
  console.log('\n🎮 2. Testing Discord-style Features...');
  let serverId = null;
  let textChannelId = null;
  let voiceChannelId = null;

  try {
    const serverData = {
      name: 'Focused Test Server',
      description: 'A server for focused feature testing'
    };
    const serverResponse = await axios.post(`${API_BASE_URL}/servers`, serverData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (serverResponse.status === 200 && serverResponse.data.success) {
      serverId = serverResponse.data.data.id;
      // Find channels created automatically
      const channels = serverResponse.data.data.channels || [];
      textChannelId = channels.find(c => c.type === 'TEXT')?.id;
      voiceChannelId = channels.find(c => c.type === 'VOICE')?.id;
      console.log('   ✅ Server Creation: PASS');
      console.log(`   📋 Server ID: ${serverId}`);
      console.log(`   💬 Text Channel ID: ${textChannelId}`);
      console.log(`   🎤 Voice Channel ID: ${voiceChannelId}`);
    } else {
      console.log('   ❌ Server Creation: FAIL');
    }
  } catch (error) {
    console.log('   ❌ Server Creation: FAIL');
  }

  // Test channel message sending
  if (serverId && textChannelId) {
    try {
      const messageData = {
        content: 'Hello from focused test!',
        channelId: textChannelId
      };
      const messageResponse = await axios.post(`${API_BASE_URL}/channels/${textChannelId}/messages`, messageData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(messageResponse.status === 201 ? '   ✅ Channel Messaging: PASS' : '   ❌ Channel Messaging: FAIL');
    } catch (error) {
      console.log('   ❌ Channel Messaging: FAIL');
    }
  }

  // Step 3: Reddit-style Community Creation
  console.log('\n📰 3. Testing Reddit-style Features...');
  let communityId = null;
  let postId = null;

  try {
    const communityData = {
      name: `focused${Date.now()}`,
      displayName: 'Focused Test Community',
      description: 'A community for focused feature testing',
      isPublic: true
    };
    const communityResponse = await axios.post(`${API_BASE_URL}/communities`, communityData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (communityResponse.status === 201 && communityResponse.data.success) {
      communityId = communityResponse.data.data.id || communityResponse.data.community?.id;
      console.log('   ✅ Community Creation: PASS');
      console.log(`   🏘️ Community ID: ${communityId}`);
    } else {
      console.log(`   ❌ Community Creation: FAIL (${communityResponse.status})`);
      console.log(`   Error: ${JSON.stringify(communityResponse.data)}`);
    }
  } catch (error) {
    console.log('   ❌ Community Creation: FAIL');
    console.log(`   Error: ${error.message}`);
  }

  // Test post creation
  if (communityId) {
    try {
      const postData = {
        title: 'Focused Feature Test Post',
        content: 'This is a test post for the focused feature test.',
        communityId: communityId
      };
      const postResponse = await axios.post(`${API_BASE_URL}/posts`, postData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (postResponse.status === 201) {
        postId = postResponse.data?.data?.id || postResponse.data?.post?.id;
        console.log('   ✅ Post Creation: PASS');
      } else {
        console.log('   ❌ Post Creation: FAIL');
      }
    } catch (error) {
      console.log('   ❌ Post Creation: FAIL');
    }
  }

  // Step 4: Real-time Features (Socket.IO)
  console.log('\n⚡ 4. Testing Real-time Features...');
  
  return new Promise((resolve) => {
    let testsCompleted = 0;
    const totalTests = 2;
    
    function completeTest() {
      testsCompleted++;
      if (testsCompleted >= totalTests) {
        resolve();
      }
    }

    // Test socket connection
    try {
      const socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket']
      });

      const timeout = setTimeout(() => {
        console.log('   ❌ Socket Connection: TIMEOUT');
        socket.disconnect();
        completeTest();
      }, 5000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        console.log('   ✅ Socket Connection: PASS');
        socket.disconnect();
        completeTest();
      });

      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        console.log('   ❌ Socket Connection: FAIL');
        socket.disconnect();
        completeTest();
      });
    } catch (error) {
      console.log('   ❌ Socket Connection: FAIL');
      completeTest();
    }

    // Test Voice Features
    setTimeout(() => {
      if (voiceChannelId) {
        console.log('   ✅ Voice Channel Prerequisites: PASS');
      } else {
        console.log('   ❌ Voice Channel Prerequisites: FAIL');
      }
      completeTest();
    }, 1000);

    // Timeout fallback
    setTimeout(() => {
      while (testsCompleted < totalTests) {
        completeTest();
      }
      console.log('\n🎯 Feature testing completed!');
    }, 10000);
  });
}

testFocusedFeatures();