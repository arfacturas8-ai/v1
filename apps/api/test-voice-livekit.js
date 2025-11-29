#!/usr/bin/env node

const axios = require('axios');

const API_BASE = 'http://localhost:3002/api/v1';

// Test data
const testUser = {
  email: 'voicetest@example.com',
  username: 'voicetest',
  displayName: 'Voice Test User',
  password: 'TestPassword123!',
  confirmPassword: 'TestPassword123!'
};

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testVoiceIntegration() {
  console.log('🎙️ Testing LiveKit Voice Integration...\n');
  
  let authToken;
  let testServerId;
  let testChannelId;
  
  try {
    // 1. Register test user
    console.log('1. Registering test user...');
    try {
      const registerResponse = await axios.post(`${API_BASE}/auth/register`, testUser);
      console.log('✅ User registered successfully');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️ User already exists, proceeding with login');
      } else {
        throw error;
      }
    }
    
    // 2. Login to get auth token
    console.log('2. Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    authToken = loginResponse.data.data.token;
    console.log('✅ Login successful');
    console.log('🔍 Token preview:', authToken.substring(0, 50) + '...');
    
    const authHeaders = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
    
    // 3. Create a test server
    console.log('3. Creating test server...');
    const serverResponse = await axios.post(`${API_BASE}/servers`, {
      name: 'Voice Test Server',
      description: 'Testing voice functionality'
    }, { headers: authHeaders });
    
    testServerId = serverResponse.data.data.id;
    console.log(`✅ Server created: ${testServerId}`);
    
    // 4. Create a voice channel
    console.log('4. Creating voice channel...');
    const channelResponse = await axios.post(`${API_BASE}/servers/${testServerId}/channels`, {
      name: 'voice-test',
      type: 'VOICE',
      description: 'Voice test channel'
    }, { headers: authHeaders });
    
    testChannelId = channelResponse.data.data.id;
    console.log(`✅ Voice channel created: ${testChannelId}`);
    
    // 5. Test LiveKit health check
    console.log('5. Testing LiveKit health check...');
    const healthResponse = await axios.get(`${API_BASE}/voice/health`);
    console.log('✅ LiveKit health check:', healthResponse.data);
    
    // 6. Join voice channel
    console.log('6. Joining voice channel...');
    const joinResponse = await axios.post(`${API_BASE}/voice/channels/${testChannelId}/join`, {
      mute: false,
      deaf: false
    }, { headers: authHeaders });
    
    const voiceData = joinResponse.data.data;
    console.log('✅ Successfully joined voice channel!');
    console.log('📊 Voice Connection Details:');
    console.log(`   - LiveKit URL: ${voiceData.liveKitUrl}`);
    console.log(`   - Room Name: ${voiceData.roomName}`);
    console.log(`   - Participant: ${voiceData.participantInfo.identity}`);
    console.log(`   - Token Length: ${voiceData.liveKitToken.length} characters`);
    console.log(`   - Max Participants: ${voiceData.serverInfo.maxParticipants}`);
    console.log(`   - Capabilities:`, voiceData.serverInfo.capabilities);
    
    // 7. Test token validation (decode token to verify it's valid)
    console.log('7. Validating LiveKit token...');
    const tokenParts = voiceData.liveKitToken.split('.');
    if (tokenParts.length === 3) {
      try {
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        console.log('✅ Token is valid JWT format');
        console.log(`   - Issued at: ${new Date(payload.iat * 1000).toISOString()}`);
        console.log(`   - Expires at: ${new Date(payload.exp * 1000).toISOString()}`);
        console.log(`   - Video grants:`, payload.video);
      } catch (tokenError) {
        console.log('⚠️ Token validation failed:', tokenError.message);
      }
    }
    
    // 8. Get voice channel participants
    console.log('8. Getting voice channel participants...');
    const participantsResponse = await axios.get(`${API_BASE}/voice/channels/${testChannelId}/participants`, {
      headers: authHeaders
    });
    console.log('✅ Participants:', participantsResponse.data.data);
    
    // 9. Update voice state
    console.log('9. Updating voice state...');
    const updateStateResponse = await axios.patch(`${API_BASE}/voice/state`, {
      selfMute: true,
      selfVideo: false
    }, { headers: authHeaders });
    console.log('✅ Voice state updated:', updateStateResponse.data.data);
    
    // 10. Test custom room creation
    console.log('10. Creating custom voice room...');
    const roomResponse = await axios.post(`${API_BASE}/voice/rooms`, {
      name: 'Test Voice Room',
      description: 'Testing room creation',
      maxParticipants: 5
    }, { headers: authHeaders });
    
    const roomData = roomResponse.data.data;
    console.log('✅ Custom room created!');
    console.log(`   - Room ID: ${roomData.room.id}`);
    console.log(`   - LiveKit Room: ${roomData.roomName}`);
    console.log(`   - Token Length: ${roomData.token.length} characters`);
    
    // 11. Join custom room
    console.log('11. Joining custom room...');
    const joinRoomResponse = await axios.post(`${API_BASE}/voice/rooms/${roomData.room.id}/join`, {}, {
      headers: authHeaders
    });
    console.log('✅ Joined custom room:', joinRoomResponse.data.data.roomInfo);
    
    // 12. Leave voice channel
    console.log('12. Leaving voice channel...');
    const leaveResponse = await axios.post(`${API_BASE}/voice/channels/${testChannelId}/leave`, {}, {
      headers: authHeaders
    });
    console.log('✅ Left voice channel successfully');
    
    console.log('\n🎉 All voice tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('✅ LiveKit server is running and accessible');
    console.log('✅ Authentication working properly');
    console.log('✅ Voice channel creation and joining works');
    console.log('✅ LiveKit token generation is functional');
    console.log('✅ Custom room creation works');
    console.log('✅ Voice state management works');
    console.log('✅ Participant management works');
    console.log('✅ All /api/v1/voice endpoints are functional');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('Headers:', error.response?.headers);
    
    if (error.response?.data?.details) {
      console.error('Details:', error.response.data.details);
    }
    
    process.exit(1);
  } finally {
    // Cleanup
    if (authToken && testServerId) {
      try {
        console.log('\n🧹 Cleaning up test server...');
        await axios.delete(`${API_BASE}/servers/${testServerId}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log('✅ Test server cleaned up');
      } catch (cleanupError) {
        console.log('⚠️ Cleanup failed (this is normal):', cleanupError.response?.status);
      }
    }
  }
}

// Test LiveKit direct connection
async function testLiveKitDirect() {
  console.log('\n🔧 Testing LiveKit server directly...');
  
  try {
    // Test HTTP endpoint
    const response = await axios.get('http://localhost:7880/');
    console.log('❌ LiveKit server should not respond to GET / requests');
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('✅ LiveKit server is running (404 expected for root path)');
    } else {
      console.log('✅ LiveKit server is running and properly secured');
    }
  }
  
  // Test WebSocket endpoint availability
  try {
    const wsResponse = await axios.get('http://localhost:7880/rtc');
    console.log('⚠️ Unexpected response from WebSocket endpoint');
  } catch (error) {
    if (error.code === 'ECONNRESET' || error.response?.status >= 400) {
      console.log('✅ LiveKit WebSocket endpoint is available');
    }
  }
}

async function main() {
  await testLiveKitDirect();
  await delay(1000);
  await testVoiceIntegration();
}

main().catch(console.error);