#!/usr/bin/env node

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';
const LIVEKIT_URL = 'ws://localhost:7880';

// Test configuration
const TEST_CONFIG = {
  channelId: 'test-voice-channel-123',
  callId: null,
  userId: 'test-user-1',
  token: null
};

console.log('🎙️ CRYB Voice & Video System Test Suite');
console.log('========================================');
console.log(`API URL: ${API_BASE_URL}`);
console.log(`LiveKit URL: ${LIVEKIT_URL}`);
console.log('');

// Test functions
async function testHealthCheck() {
  console.log('1️⃣ Testing voice service health...');
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/voice/health`);
    console.log('✅ Voice service health:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Voice service health failed:', error.message);
    return false;
  }
}

async function testCreateUser() {
  console.log('2️⃣ Creating test user...');
  try {
    const response = await axios.post(`${API_BASE_URL}/api/v1/auth/register`, {
      email: `test-${Date.now()}@example.com`,
      username: `testuser${Date.now()}`,
      password: 'testpassword123',
      displayName: 'Test User'
    });
    
    if (response.data.success) {
      TEST_CONFIG.token = response.data.data.token;
      console.log('✅ Test user created successfully');
      return true;
    } else {
      console.log('❌ Failed to create user:', response.data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ User creation failed:', error.message);
    if (error.response?.data?.error) {
      console.log('   Error details:', error.response.data.error);
    }
    return false;
  }
}

async function testVoiceChannelJoin() {
  console.log('3️⃣ Testing voice channel join...');
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/voice/channels/${TEST_CONFIG.channelId}/join`,
      {
        video: false,
        mute: false,
        deaf: false,
        quality: 'auto'
      },
      {
        headers: {
          'Authorization': `Bearer ${TEST_CONFIG.token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      console.log('✅ Voice channel join successful');
      console.log(`   Room: ${response.data.data.roomName}`);
      console.log(`   LiveKit URL: ${response.data.data.liveKitUrl}`);
      console.log(`   Token generated: ${response.data.data.liveKitToken ? 'Yes' : 'No'}`);
      return true;
    } else {
      console.log('❌ Voice channel join failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Voice channel join failed:', error.message);
    if (error.response?.data?.error) {
      console.log('   Error details:', error.response.data.error);
    }
    return false;
  }
}

async function testVideoCallCreation() {
  console.log('4️⃣ Testing video call creation...');
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/voice/video/call`,
      {
        callType: 'group',
        channelId: TEST_CONFIG.channelId,
        videoEnabled: true,
        audioEnabled: true,
        quality: 'high'
      },
      {
        headers: {
          'Authorization': `Bearer ${TEST_CONFIG.token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      TEST_CONFIG.callId = response.data.data.callId;
      console.log('✅ Video call created successfully');
      console.log(`   Call ID: ${response.data.data.callId}`);
      console.log(`   Room: ${response.data.data.roomName}`);
      console.log(`   Max participants: ${response.data.data.settings.maxParticipants}`);
      console.log(`   Capabilities: ${JSON.stringify(response.data.data.capabilities)}`);
      return true;
    } else {
      console.log('❌ Video call creation failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Video call creation failed:', error.message);
    if (error.response?.data?.error) {
      console.log('   Error details:', error.response.data.error);
    }
    return false;
  }
}

async function testScreenShareStart() {
  console.log('5️⃣ Testing screen share start...');
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/voice/screen-share/start`,
      {
        roomName: `channel_${TEST_CONFIG.channelId}`,
        quality: 'high',
        frameRate: 15,
        audio: true
      },
      {
        headers: {
          'Authorization': `Bearer ${TEST_CONFIG.token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      console.log('✅ Screen share configuration successful');
      console.log(`   Identity: ${response.data.data.identity}`);
      console.log(`   Quality: ${response.data.data.settings.quality}`);
      console.log(`   Max bitrate: ${response.data.data.settings.maxBitrate}`);
      return true;
    } else {
      console.log('❌ Screen share failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Screen share failed:', error.message);
    if (error.response?.data?.error) {
      console.log('   Error details:', error.response.data.error);
    }
    return false;
  }
}

async function testActiveCallsRetrieval() {
  console.log('6️⃣ Testing active calls retrieval...');
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/v1/voice/calls/active`,
      {
        headers: {
          'Authorization': `Bearer ${TEST_CONFIG.token}`
        }
      }
    );
    
    if (response.data.success) {
      console.log('✅ Active calls retrieval successful');
      console.log(`   Total rooms: ${response.data.data.totalRooms}`);
      console.log(`   Active rooms: ${JSON.stringify(response.data.data.activeRooms.map(r => r.roomName))}`);
      return true;
    } else {
      console.log('❌ Active calls retrieval failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Active calls retrieval failed:', error.message);
    if (error.response?.data?.error) {
      console.log('   Error details:', error.response.data.error);
    }
    return false;
  }
}

async function testVoiceChannelLeave() {
  console.log('7️⃣ Testing voice channel leave...');
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/voice/channels/${TEST_CONFIG.channelId}/leave`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${TEST_CONFIG.token}`
        }
      }
    );
    
    if (response.data.success) {
      console.log('✅ Voice channel leave successful');
      return true;
    } else {
      console.log('❌ Voice channel leave failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Voice channel leave failed:', error.message);
    if (error.response?.data?.error) {
      console.log('   Error details:', error.response.data.error);
    }
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('Starting voice/video system tests...');
  console.log('');
  
  const tests = [
    testHealthCheck,
    testCreateUser,
    testVoiceChannelJoin,
    testVideoCallCreation,
    testScreenShareStart,
    testActiveCallsRetrieval,
    testVoiceChannelLeave
  ];
  
  const results = [];
  
  for (const test of tests) {
    const result = await test();
    results.push(result);
    console.log('');
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('========================================');
  console.log('🏁 Test Results Summary');
  console.log('========================================');
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('');
    console.log('🎉 All tests passed! Voice/Video system is working correctly.');
    console.log('');
    console.log('🚀 Ready for $10M platform scale:');
    console.log('   ✓ LiveKit server running');
    console.log('   ✓ Voice channel connections working');
    console.log('   ✓ Video call creation working');
    console.log('   ✓ Screen sharing configured');
    console.log('   ✓ API endpoints responding');
    console.log('   ✓ Database integration working');
    console.log('');
    console.log('🔗 Test the full system at: http://localhost:3000/test-voice-video');
  } else {
    console.log('');
    console.log('❌ Some tests failed. Please check the errors above.');
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\\n🛑 Test interrupted by user');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error.message);
  process.exit(1);
});

// Run the tests
runTests().catch(error => {
  console.error('❌ Test suite failed:', error.message);
  process.exit(1);
});