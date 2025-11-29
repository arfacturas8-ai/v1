const fetch = require('node-fetch');

async function testAuth() {
  const API_URL = 'http://localhost:3001/api/v1';
  
  console.log('Testing authentication...\n');
  
  // Test login with email
  try {
    console.log('1. Testing login with email...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'demo@cryb.ai',
        password: 'Demo123!@#'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', JSON.stringify(loginData, null, 2));
    
    if (loginData.success) {
      console.log('✅ Login successful!');
      console.log('User:', loginData.data.user);
      console.log('Token:', loginData.data.tokens.accessToken.substring(0, 50) + '...');
    } else {
      console.log('❌ Login failed:', loginData.error || loginData.message);
    }
  } catch (error) {
    console.error('Login error:', error.message);
  }
  
  console.log('\n2. Testing login with username...');
  try {
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'DemoUser',
        password: 'Demo123!@#'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', JSON.stringify(loginData, null, 2));
    
    if (loginData.success) {
      console.log('✅ Login successful!');
      console.log('User:', loginData.data.user);
    } else {
      console.log('❌ Login failed:', loginData.error || loginData.message);
    }
  } catch (error) {
    console.error('Login error:', error.message);
  }
}

testAuth();