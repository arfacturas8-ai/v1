#!/usr/bin/env node

const axios = require('axios');

const API_BASE = 'http://localhost:3002/api/v1';

async function testAuthenticationFlows() {
  console.log('🧪 Testing CRYB Platform Authentication Endpoints\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing health endpoint...');
    try {
      const health = await axios.get(`${API_BASE}/../health`);
      console.log(`✅ Health check: ${health.data.status}`);
      console.log(`   Database: ${health.data.checks.database}`);
      console.log(`   Redis: ${health.data.checks.redis}\n`);
    } catch (error) {
      console.log('❌ Health check failed:', error.message);
    }

    // Test 2: Register User
    console.log('2️⃣ Testing user registration...');
    const testUser = {
      username: `testuser${Date.now()}`,
      displayName: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'TestPassword123!',
      confirmPassword: 'TestPassword123!'
    };

    let accessToken = '';
    let refreshToken = '';

    try {
      const registerResponse = await axios.post(`${API_BASE}/auth/register`, testUser, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (registerResponse.data.success) {
        console.log('✅ Registration successful');
        console.log(`   User ID: ${registerResponse.data.data.user.id}`);
        console.log(`   Username: ${registerResponse.data.data.user.username}`);
        accessToken = registerResponse.data.data.tokens.accessToken;
        refreshToken = registerResponse.data.data.tokens.refreshToken;
        console.log(`   Access token: ${accessToken.substring(0, 20)}...`);
      } else {
        console.log('❌ Registration failed:', registerResponse.data.error);
      }
    } catch (error) {
      console.log('❌ Registration failed:', error.response?.data?.error || error.message);
    }

    // Test 3: Login with same credentials
    if (accessToken) {
      console.log('\n3️⃣ Testing user login...');
      try {
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
          username: testUser.username,
          password: testUser.password
        });

        if (loginResponse.data.success) {
          console.log('✅ Login successful');
          console.log(`   User: ${loginResponse.data.data.user.username}`);
          console.log(`   New token: ${loginResponse.data.data.tokens.accessToken.substring(0, 20)}...`);
        } else {
          console.log('❌ Login failed:', loginResponse.data.error);
        }
      } catch (error) {
        console.log('❌ Login failed:', error.response?.data?.error || error.message);
      }
    }

    // Test 4: Test protected endpoint
    if (accessToken) {
      console.log('\n4️⃣ Testing protected endpoint (/auth/me)...');
      try {
        const meResponse = await axios.get(`${API_BASE}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (meResponse.data.success) {
          console.log('✅ Protected endpoint access successful');
          console.log(`   User: ${meResponse.data.data.user.username}`);
          console.log(`   Email: ${meResponse.data.data.user.email}`);
        } else {
          console.log('❌ Protected endpoint failed:', meResponse.data.error);
        }
      } catch (error) {
        console.log('❌ Protected endpoint failed:', error.response?.data?.error || error.message);
      }
    }

    // Test 5: Token refresh
    if (refreshToken) {
      console.log('\n5️⃣ Testing token refresh...');
      try {
        const refreshResponse = await axios.post(`${API_BASE}/auth/refresh`, {
          refreshToken: refreshToken
        });

        if (refreshResponse.data.success) {
          console.log('✅ Token refresh successful');
          console.log(`   New access token: ${refreshResponse.data.data.tokens.accessToken.substring(0, 20)}...`);
          accessToken = refreshResponse.data.data.tokens.accessToken;
        } else {
          console.log('❌ Token refresh failed:', refreshResponse.data.error);
        }
      } catch (error) {
        console.log('❌ Token refresh failed:', error.response?.data?.error || error.message);
      }
    }

    // Test 6: Logout
    if (accessToken) {
      console.log('\n6️⃣ Testing logout...');
      try {
        const logoutResponse = await axios.post(`${API_BASE}/auth/logout`, {}, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (logoutResponse.data.success) {
          console.log('✅ Logout successful');
        } else {
          console.log('❌ Logout failed:', logoutResponse.data.error);
        }
      } catch (error) {
        console.log('❌ Logout failed:', error.response?.data?.error || error.message);
      }

      // Test 7: Verify token is invalidated
      console.log('\n7️⃣ Testing invalidated token...');
      try {
        const invalidTokenResponse = await axios.get(`${API_BASE}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (invalidTokenResponse.data.success) {
          console.log('❌ Token should be invalidated but still works');
        } else {
          console.log('✅ Token correctly invalidated');
        }
      } catch (error) {
        if (error.response?.status === 401) {
          console.log('✅ Token correctly invalidated (401 Unauthorized)');
        } else {
          console.log('❓ Unexpected error:', error.response?.data?.error || error.message);
        }
      }
    }

    // Test 8: Error handling - Invalid registration data
    console.log('\n8️⃣ Testing error handling...');
    try {
      const errorResponse = await axios.post(`${API_BASE}/auth/register`, {
        username: 'a', // Too short
        displayName: '',
        password: '123' // Too weak
      });

      console.log('❌ Should have failed validation but didn\'t');
    } catch (error) {
      if (error.response?.status === 400 || error.response?.status === 422) {
        console.log('✅ Validation errors correctly handled');
        console.log(`   Error: ${error.response.data.error}`);
      } else {
        console.log('❓ Unexpected error:', error.response?.data?.error || error.message);
      }
    }

    console.log('\n🎉 Authentication flow testing completed!');

  } catch (error) {
    console.error('💥 Test suite failed:', error.message);
    process.exit(1);
  }
}

// Allow running this directly
if (require.main === module) {
  testAuthenticationFlows().catch(console.error);
}

module.exports = testAuthenticationFlows;