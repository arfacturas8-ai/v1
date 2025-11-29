#!/usr/bin/env node

const axios = require('axios');

const API_URL = 'http://localhost:3001';

async function testDiscordFeatures() {
  console.log('🎮 Testing Discord Features for CRYB Platform\n');
  
  // First, create a test user and login
  const timestamp = Date.now();
  const testUser = {
    username: `discord${timestamp}`,
    displayName: 'Discord Test User',
    email: `discord${timestamp}@example.com`,
    password: 'Password123!',
    confirmPassword: 'Password123!'
  };
  
  try {
    // Register user
    console.log('1️⃣ Creating test user...');
    const regResponse = await axios.post(`${API_URL}/api/v1/auth/register`, testUser);
    const { accessToken } = regResponse.data.data.tokens;
    const userId = regResponse.data.data.user.id;
    console.log('✅ User created:', testUser.username);
    
    const config = {
      headers: { Authorization: `Bearer ${accessToken}` }
    };
    
    // Test Discord Server Creation
    console.log('\n2️⃣ Testing Discord Servers...');
    const serverData = {
      name: `Test Server ${timestamp}`,
      description: 'A test Discord-style server',
      isPublic: true
    };
    
    const serverResponse = await axios.post(`${API_URL}/api/v1/servers`, serverData, config);
    const server = serverResponse.data.data;
    console.log('✅ Server created:', server.name);
    console.log('   - Server ID:', server.id);
    console.log('   - Owner:', server.ownerId === userId ? 'Current user' : 'Error');
    
    // Get server list
    const serversListResponse = await axios.get(`${API_URL}/api/v1/servers`, config);
    console.log('✅ User servers:', serversListResponse.data.data.length, 'server(s)');
    
    // Test Channel Creation
    console.log('\n3️⃣ Testing Channels...');
    const textChannelData = {
      serverId: server.id,
      name: 'general-chat',
      type: 'TEXT',
      description: 'General discussion'
    };
    
    const textChannelResponse = await axios.post(`${API_URL}/api/v1/channels`, textChannelData, config);
    const textChannel = textChannelResponse.data.data;
    console.log('✅ Text channel created:', textChannel.name);
    
    // Create voice channel
    const voiceChannelData = {
      serverId: server.id,
      name: 'Voice Chat',
      type: 'VOICE',
      description: 'Voice communication',
      bitrate: 64000,
      userLimit: 10
    };
    
    const voiceChannelResponse = await axios.post(`${API_URL}/api/v1/channels`, voiceChannelData, config);
    const voiceChannel = voiceChannelResponse.data.data;
    console.log('✅ Voice channel created:', voiceChannel.name);
    console.log('   - Type:', voiceChannel.type);
    console.log('   - User limit:', voiceChannel.userLimit);
    
    // Get channels list
    const channelsResponse = await axios.get(`${API_URL}/api/v1/servers/${server.id}/channels`, config);
    console.log('✅ Server channels:', channelsResponse.data.data.length, 'channel(s)');
    
    // Test Messages in Channel
    console.log('\n4️⃣ Testing Messages...');
    const messageData = {
      content: 'Hello from Discord-style server!'
    };
    
    const messageResponse = await axios.post(
      `${API_URL}/api/v1/channels/${textChannel.id}/messages`, 
      messageData, 
      config
    );
    const message = messageResponse.data.data;
    console.log('✅ Message sent:', message.content);
    console.log('   - Message ID:', message.id);
    console.log('   - Timestamp:', new Date(message.timestamp).toLocaleString());
    
    // Get messages
    const messagesResponse = await axios.get(
      `${API_URL}/api/v1/channels/${textChannel.id}/messages`,
      config
    );
    console.log('✅ Channel messages:', messagesResponse.data.data.messages.length, 'message(s)');
    
    // Test Server Members
    console.log('\n5️⃣ Testing Server Members...');
    const membersResponse = await axios.get(`${API_URL}/api/v1/servers/${server.id}/members`, config);
    console.log('✅ Server members:', membersResponse.data.data.length, 'member(s)');
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 Discord Features Test Complete!');
    console.log('='.repeat(50));
    console.log('\nSummary:');
    console.log('✅ Servers creation and management');
    console.log('✅ Text and voice channels');
    console.log('✅ Messaging in channels');
    console.log('✅ Member management');
    console.log('✅ Basic Discord-style architecture working!');
    
  } catch (error) {
    console.error('❌ Error testing Discord features:', error.response?.data || error.message);
  }
}

testDiscordFeatures().catch(console.error);
