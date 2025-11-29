/**
 * Simple test script to verify API authentication
 */

const API_BASE_URL = 'http://localhost:3002';

async function testAPIConnection() {
  console.log('Testing API connection...');
  
  try {
    // Test basic API health
    const healthResponse = await fetch(`${API_BASE_URL}/api/v1/health`);
    const healthData = await healthResponse.json();
    
    console.log('✅ API Health Check:', healthData);
    
    // Test login endpoint with invalid credentials (to check if endpoint is working)
    const loginResponse = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('📋 Login endpoint response (expected to fail):', loginData);
    
    // Test register endpoint structure
    const registerResponse = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser',
        email: 'test@example.com',
        password: 'testpassword'
      })
    });
    
    const registerData = await registerResponse.json();
    console.log('📋 Register endpoint response:', registerData);
    
    console.log('\n✅ API connection test completed successfully!');
    console.log('🎯 The mobile app should be able to connect to the API at', API_BASE_URL);
    
  } catch (error) {
    console.error('❌ API connection test failed:', error.message);
    console.log('💡 Make sure the API server is running on port 3001');
  }
}

testAPIConnection();