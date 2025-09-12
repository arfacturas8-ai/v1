#!/usr/bin/env node

/**
 * Generate a real JWT token for Socket.io testing
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3002';

async function generateToken() {
  try {
    console.log('🔐 Generating real JWT token for Socket.io authentication test...');
    
    // Create a test user
    const registerResponse = await axios.post(`${API_BASE}/api/v1/auth/register`, {
      username: `sockettest_${Date.now()}`,
      email: `sockettest_${Date.now()}@test.local`,
      password: 'TestPassword123!',
      confirmPassword: 'TestPassword123!',
      displayName: 'Socket Test User'
    });
    
    console.log('✅ Test user created successfully');
    
    // Login to get a real JWT token
    const loginResponse = await axios.post(`${API_BASE}/api/v1/auth/login`, {
      identifier: registerResponse.data.user.email,
      password: 'TestPassword123!'
    });
    
    const token = loginResponse.data.accessToken;
    const user = loginResponse.data.user;
    
    console.log('✅ JWT token generated successfully');
    console.log(`👤 User: ${user.username} (${user.id})`);
    console.log(`🎫 Token: ${token.substring(0, 20)}...`);
    
    return {
      token,
      user,
      fullToken: token
    };
    
  } catch (error) {
    console.error('❌ Failed to generate token:', error.response?.data || error.message);
    throw error;
  }
}

// Export for use in other scripts
if (require.main === module) {
  generateToken()
    .then(result => {
      console.log('\n🎯 Use this token for Socket.io authentication testing:');
      console.log(result.fullToken);
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Token generation failed:', error.message);
      process.exit(1);
    });
}

module.exports = { generateToken };