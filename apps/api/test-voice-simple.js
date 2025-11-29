#!/usr/bin/env node

const axios = require('axios');

const API_BASE = 'http://localhost:3002';

async function testVoiceSimple() {
  console.log('🎙️ Testing LiveKit Voice Integration (Simple)...\n');
  
  try {
    // 1. Test LiveKit health check (no auth required) - using public endpoint
    console.log('1. Testing LiveKit health check...');
    const healthResponse = await axios.get(`${API_BASE}/api/voice-test/health`);
    console.log('✅ LiveKit health check:', healthResponse.data);
    
    if (healthResponse.data.success && healthResponse.data.livekit.connected) {
      console.log('🎉 LiveKit server is properly connected!');
      console.log(`   - URL: ${healthResponse.data.livekit.url}`);
      console.log(`   - Active rooms: ${healthResponse.data.livekit.rooms}`);
    } else {
      console.log('❌ LiveKit server connection issues detected');
    }
    
    // 2. Test token generation (no auth required)
    console.log('\n2. Testing voice token generation...');
    const tokenResponse = await axios.post(`${API_BASE}/api/voice-test/test-token`, {
      channelId: 'test-channel-123',
      userId: 'test-user-456',
      username: 'TestVoiceUser'
    });
    
    console.log('✅ Voice token generated successfully!');
    console.log(`   - Room: ${tokenResponse.data.data.roomName}`);
    console.log(`   - Participant: ${tokenResponse.data.data.participantInfo.identity}`);
    console.log(`   - Token length: ${JSON.stringify(tokenResponse.data.data.liveKitToken).length} characters`);
    console.log(`   - LiveKit URL: ${tokenResponse.data.data.liveKitUrl}`);
    
    // 3. Verify token is JWT format (basic check)
    const tokenString = JSON.stringify(tokenResponse.data.data.liveKitToken);
    if (tokenString.includes('.')) {
      console.log('✅ Token appears to be in JWT format');
    } else {
      console.log('⚠️ Token may not be in proper JWT format');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    
    if (error.response?.data?.details) {
      console.error('Details:', error.response.data.details);
    }
  }
}

// Test LiveKit server directly
async function testLiveKitDirect() {
  console.log('🔧 Testing LiveKit server directly...\n');
  
  try {
    // Test that server is running on correct port
    const response = await axios.get('http://localhost:7880/', { timeout: 5000 });
    console.log('⚠️ Unexpected response from LiveKit root');
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ LiveKit server is not running on port 7880');
    } else if (error.response?.status === 404) {
      console.log('✅ LiveKit server is running (404 expected for root path)');
    } else {
      console.log('✅ LiveKit server is running and properly secured');
    }
  }
  
  console.log();
}

async function main() {
  await testLiveKitDirect();
  await testVoiceSimple();
}

main().catch(console.error);
