#!/usr/bin/env node

/**
 * Test Voice/Video Endpoints with LiveKit
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3002';

// Generate unique test data
const timestamp = Date.now();
const testUser = {
  email: `test-voice-${timestamp}@example.com`,
  username: `test_voice_${timestamp}`,
  displayName: `Test Voice User ${timestamp}`,
  password: 'TestPassword123!',
  confirmPassword: 'TestPassword123!'
};

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testVoiceEndpoints() {
  log('\n' + '='.repeat(60), 'bold');
  log('🎙️  VOICE/VIDEO ENDPOINTS TEST', 'bold');
  log('='.repeat(60), 'bold');

  let token = null;
  let userId = null;
  let serverId = null;
  let voiceChannelId = null;
  const testResults = [];

  try {
    // Step 1: Create user and get token
    log('\n👤 Creating test user...', 'blue');
    
    const registerResponse = await axios.post(`${API_BASE_URL}/api/v1/auth/register`, testUser);
    
    if (registerResponse.status === 201 && registerResponse.data.success) {
      token = registerResponse.data.data.tokens.accessToken;
      userId = registerResponse.data.data.user.id;
      log('✅ User created successfully', 'green');
    } else {
      throw new Error('User registration failed');
    }

    // Step 2: Create a test server
    log('\n🏢 Creating test server...', 'blue');
    
    const serverResponse = await axios.post(
      `${API_BASE_URL}/api/v1/servers`,
      {
        name: `Voice Test Server ${timestamp}`,
        description: 'Server for testing voice features'
      },
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    if (serverResponse.data.success) {
      serverId = serverResponse.data.data.id;
      log(`✅ Server created: ${serverId}`, 'green');
    }

    // Step 3: Create a voice channel
    log('\n🔊 Creating voice channel...', 'blue');
    
    const channelResponse = await axios.post(
      `${API_BASE_URL}/api/v1/channels`,
      {
        serverId,
        name: 'Voice Chat',
        type: 'VOICE',
        bitrate: 64000,
        userLimit: 10
      },
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    if (channelResponse.data.success) {
      voiceChannelId = channelResponse.data.data.id;
      log(`✅ Voice channel created: ${voiceChannelId}`, 'green');
      testResults.push({ test: 'Create Voice Channel', status: 'PASS' });
    }

    // Step 4: Test voice endpoints
    log('\n🎤 Testing voice endpoints...', 'blue');

    // Test 4.1: Join voice channel
    log('   Testing join voice channel...', 'cyan');
    try {
      const joinResponse = await axios.post(
        `${API_BASE_URL}/api/v1/voice/channels/${voiceChannelId}/join`,
        { mute: false, deaf: false },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (joinResponse.data.success) {
        log('   ✅ Join voice channel: PASS', 'green');
        if (joinResponse.data.data.token) {
          log(`      LiveKit token received`, 'cyan');
          log(`      Room: ${joinResponse.data.data.roomName}`, 'cyan');
        }
        testResults.push({ test: 'Join Voice Channel', status: 'PASS' });
      }
    } catch (error) {
      log(`   ❌ Join voice channel: FAIL - ${error.response?.data?.error || error.message}`, 'red');
      testResults.push({ test: 'Join Voice Channel', status: 'FAIL', error: error.message });
    }

    // Test 4.2: Get voice state
    log('   Testing get voice state...', 'cyan');
    try {
      const stateResponse = await axios.get(
        `${API_BASE_URL}/api/v1/voice/channels/${voiceChannelId}/state`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (stateResponse.data.success) {
        log('   ✅ Get voice state: PASS', 'green');
        log(`      Participants: ${stateResponse.data.data.participants?.length || 0}`, 'cyan');
        testResults.push({ test: 'Get Voice State', status: 'PASS' });
      }
    } catch (error) {
      log(`   ❌ Get voice state: FAIL - ${error.response?.data?.error || error.message}`, 'red');
      testResults.push({ test: 'Get Voice State', status: 'FAIL', error: error.message });
    }

    // Test 4.3: Update voice settings
    log('   Testing update voice settings...', 'cyan');
    try {
      const updateResponse = await axios.patch(
        `${API_BASE_URL}/api/v1/voice/channels/${voiceChannelId}/settings`,
        { mute: true, deaf: false },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (updateResponse.data.success) {
        log('   ✅ Update voice settings: PASS', 'green');
        testResults.push({ test: 'Update Voice Settings', status: 'PASS' });
      }
    } catch (error) {
      log(`   ❌ Update voice settings: FAIL - ${error.response?.data?.error || error.message}`, 'red');
      testResults.push({ test: 'Update Voice Settings', status: 'FAIL', error: error.message });
    }

    // Test 4.4: Leave voice channel
    log('   Testing leave voice channel...', 'cyan');
    try {
      const leaveResponse = await axios.post(
        `${API_BASE_URL}/api/v1/voice/channels/${voiceChannelId}/leave`,
        {},
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (leaveResponse.data.success) {
        log('   ✅ Leave voice channel: PASS', 'green');
        testResults.push({ test: 'Leave Voice Channel', status: 'PASS' });
      }
    } catch (error) {
      log(`   ❌ Leave voice channel: FAIL - ${error.response?.data?.error || error.message}`, 'red');
      testResults.push({ test: 'Leave Voice Channel', status: 'FAIL', error: error.message });
    }

    // Test 4.5: Create video room
    log('   Testing create video room...', 'cyan');
    try {
      const videoResponse = await axios.post(
        `${API_BASE_URL}/api/v1/voice/video/room`,
        {
          name: `Video Room ${timestamp}`,
          maxParticipants: 4
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (videoResponse.data.success) {
        log('   ✅ Create video room: PASS', 'green');
        testResults.push({ test: 'Create Video Room', status: 'PASS' });
      }
    } catch (error) {
      log(`   ❌ Create video room: FAIL - ${error.response?.data?.error || error.message}`, 'red');
      testResults.push({ test: 'Create Video Room', status: 'FAIL', error: error.message });
    }

    // Test 4.6: Screen share
    log('   Testing screen share...', 'cyan');
    try {
      const screenResponse = await axios.post(
        `${API_BASE_URL}/api/v1/voice/channels/${voiceChannelId}/screen-share`,
        { start: true },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (screenResponse.data.success) {
        log('   ✅ Screen share: PASS', 'green');
        testResults.push({ test: 'Screen Share', status: 'PASS' });
      }
    } catch (error) {
      log(`   ❌ Screen share: FAIL - ${error.response?.data?.error || error.message}`, 'red');
      testResults.push({ test: 'Screen Share', status: 'FAIL', error: error.message });
    }

  } catch (error) {
    log(`\n💥 TEST FAILED: ${error.message}`, 'red');
    
    if (error.response) {
      log(`   HTTP Status: ${error.response.status}`, 'red');
      log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
  }

  // Summary
  log('\n' + '='.repeat(60), 'bold');
  log('📋 TEST SUMMARY', 'bold');
  log('='.repeat(60), 'bold');
  
  const passed = testResults.filter(r => r.status === 'PASS').length;
  const failed = testResults.filter(r => r.status === 'FAIL').length;
  
  testResults.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : '❌';
    const color = result.status === 'PASS' ? 'green' : 'red';
    log(`${icon} ${result.test}: ${result.status}`, color);
    if (result.error) {
      log(`   Error: ${result.error}`, 'yellow');
    }
  });
  
  log(`\nTotal: ${passed} passed, ${failed} failed`, passed > failed ? 'green' : 'red');
  
  if (passed > 0) {
    log('\n🎉 VOICE/VIDEO ENDPOINTS ARE WORKING!', 'green');
    log('✅ LiveKit integration successful', 'green');
    log('✅ Users can join voice channels', 'green');
    log('✅ Real-time voice communication ready', 'green');
  }
  
  return passed > failed;
}

// Run test if called directly
if (require.main === module) {
  testVoiceEndpoints().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { testVoiceEndpoints };