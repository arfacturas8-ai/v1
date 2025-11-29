const fs = require('fs');

async function testAuthEndpoint() {
  console.log('🧪 Testing Authentication Endpoint...\n');
  
  const API_BASE = 'http://localhost:3002';
  
  // Test 1: GET /auth/me with working token
  console.log('1. Testing /auth/me with working token:');
  try {
    const tokenData = JSON.parse(fs.readFileSync('./working-token.json', 'utf8'));
    const token = tokenData.token;
    
    console.log('   Using token:', token.substring(0, 50) + '...');
    
    const response = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   Status:', response.status);
    console.log('   Status Text:', response.statusText);
    
    const responseText = await response.text();
    console.log('   Response:', responseText);
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('   ✅ Success:', data);
    } else {
      console.log('   ❌ Failed with status:', response.status);
    }
    
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
  
  console.log('');
  
  // Test 2: Try creating a user with registration endpoint
  console.log('2. Testing user registration:');
  try {
    const registrationData = {
      username: 'testuser' + Date.now(),
      displayName: 'Test User',
      email: 'test' + Date.now() + '@example.com',
      password: 'TestPassword123!',
      confirmPassword: 'TestPassword123!'
    };
    
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(registrationData)
    });
    
    console.log('   Status:', response.status);
    const responseText = await response.text();
    console.log('   Response:', responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('   ✅ Registration successful');
      
      if (data.data && data.data.tokens) {
        // Save the new valid token
        const newTokenData = {
          token: data.data.tokens.accessToken,
          user: data.data.user,
          createdAt: new Date().toISOString()
        };
        
        fs.writeFileSync('./registered-user-token.json', JSON.stringify(newTokenData, null, 2));
        console.log('   💾 New token saved to registered-user-token.json');
        
        // Test the new token
        console.log('\\n   Testing new token with /auth/me:');
        const meResponse = await fetch(`${API_BASE}/auth/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${data.data.tokens.accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('   Me endpoint status:', meResponse.status);
        if (meResponse.ok) {
          const meData = await meResponse.json();
          console.log('   ✅ /auth/me successful with new token');
        } else {
          console.log('   ❌ /auth/me failed with new token');
        }
      }
    } else {
      console.log('   ❌ Registration failed');
    }
    
  } catch (error) {
    console.log('   ❌ Registration error:', error.message);
  }
  
  console.log('');
  
  // Test 3: Check if API is running
  console.log('3. Testing API health:');
  try {
    const response = await fetch(`${API_BASE}/health`, {
      method: 'GET'
    });
    
    console.log('   Health status:', response.status);
    if (response.ok) {
      const data = await response.text();
      console.log('   ✅ API is running:', data);
    }
  } catch (error) {
    console.log('   ❌ API health check failed:', error.message);
    console.log('   💡 Make sure the API server is running on port 3002');
  }
}

testAuthEndpoint().catch(console.error);