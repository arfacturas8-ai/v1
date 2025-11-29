#!/usr/bin/env node

// Using native fetch in Node.js 18+

async function createUserAndGetToken() {
  const API_BASE = 'http://localhost:3002';
  
  try {
    // Create test user
    console.log('🔧 Creating test user...');
    const registerResponse = await fetch(`${API_BASE}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: `sockettest_${Date.now()}`,
        email: `sockettest_${Date.now()}@example.com`,
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
        displayName: 'Socket Test User'
      })
    });

    if (!registerResponse.ok) {
      const errorText = await registerResponse.text();
      throw new Error(`Registration failed: ${registerResponse.status} - ${errorText}`);
    }

    const userData = await registerResponse.json();
    console.log(`✅ User created: ${userData.user.username}`);
    
    // Login to get token
    console.log('🔐 Logging in to get token...');
    const loginResponse = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: userData.user.email,
        password: 'TestPassword123!'
      })
    });

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      throw new Error(`Login failed: ${loginResponse.status} - ${errorText}`);
    }

    const loginData = await loginResponse.json();
    console.log(`✅ Login successful`);
    console.log(`🎫 Token: ${loginData.accessToken}`);
    
    return {
      user: loginData.user,
      token: loginData.accessToken
    };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createUserAndGetToken().then(({ user, token }) => {
  console.log('\n📋 Test Data:');
  console.log(`User ID: ${user.id}`);
  console.log(`Username: ${user.username}`);
  console.log(`Token: ${token}`);
  console.log('\n🧪 Use this token for Socket.IO testing');
}).catch(console.error);