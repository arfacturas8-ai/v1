const fs = require('fs');

async function testAuthFixed() {
  console.log('🧪 Testing Authentication with Correct Paths...\n');
  
  const API_BASE = 'http://localhost:3002';
  
  // Test 1: User Registration
  console.log('1. Testing /api/v1/auth/register:');
  try {
    const registrationData = {
      username: 'testuser' + Date.now(),
      displayName: 'Test User',
      email: 'test' + Date.now() + '@example.com',
      password: 'TestPassword123!',
      confirmPassword: 'TestPassword123!'
    };
    
    console.log('   Registering user:', registrationData.username);
    
    const response = await fetch(`${API_BASE}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(registrationData)
    });
    
    console.log('   Status:', response.status);
    const responseText = await response.text();
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('   ✅ Registration successful');
      console.log('   User ID:', data.data.user.id);
      console.log('   Token preview:', data.data.tokens.accessToken.substring(0, 50) + '...');
      
      // Save the valid token for further testing
      const validTokenData = {
        token: data.data.tokens.accessToken,
        user: data.data.user,
        createdAt: new Date().toISOString()
      };
      
      fs.writeFileSync('./valid-registered-token.json', JSON.stringify(validTokenData, null, 2));
      console.log('   💾 Valid token saved');
      
      // Test 2: Use the new token with /auth/me
      console.log('\\n2. Testing /api/v1/auth/me with new token:');
      const meResponse = await fetch(`${API_BASE}/api/v1/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${data.data.tokens.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('   Status:', meResponse.status);
      if (meResponse.ok) {
        const meData = await meResponse.json();
        console.log('   ✅ /auth/me successful');
        console.log('   User:', meData.data.user.username);
      } else {
        const errorText = await meResponse.text();
        console.log('   ❌ /auth/me failed:', errorText);
      }
      
      // Test 3: Test community creation (authenticated endpoint)
      console.log('\\n3. Testing community creation with valid token:');
      const communityData = {
        name: 'testcommunity' + Date.now(),
        displayName: 'Test Community',
        description: 'A test community for JWT verification',
        isPublic: true
      };
      
      const communityResponse = await fetch(`${API_BASE}/api/v1/communities`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${data.data.tokens.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(communityData)
      });
      
      console.log('   Status:', communityResponse.status);
      if (communityResponse.ok) {
        const communityResult = await communityResponse.json();
        console.log('   ✅ Community creation successful');
        console.log('   Community ID:', communityResult.data.community.id);
      } else {
        const errorText = await communityResponse.text();
        console.log('   ❌ Community creation failed:', errorText.substring(0, 200));
      }
      
      // Test 4: Test post creation (authenticated endpoint)
      console.log('\\n4. Testing post creation with valid token:');
      const postData = {
        title: 'Test Post ' + Date.now(),
        content: 'This is a test post to verify JWT authentication is working.',
        type: 'text'
      };
      
      const postResponse = await fetch(`${API_BASE}/api/v1/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${data.data.tokens.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });
      
      console.log('   Status:', postResponse.status);
      if (postResponse.ok) {
        const postResult = await postResponse.json();
        console.log('   ✅ Post creation successful');
        console.log('   Post ID:', postResult.data.post.id);
      } else {
        const errorText = await postResponse.text();
        console.log('   ❌ Post creation failed:', errorText.substring(0, 200));
      }
      
    } else {
      console.log('   ❌ Registration failed');
      console.log('   Error:', responseText.substring(0, 500));
    }
    
  } catch (error) {
    console.log('   ❌ Registration error:', error.message);
  }
  
  console.log('\\n5. Testing with existing working token:');
  try {
    const tokenData = JSON.parse(fs.readFileSync('./working-token.json', 'utf8'));
    const token = tokenData.token;
    
    console.log('   Using working token for /auth/me...');
    const response = await fetch(`${API_BASE}/api/v1/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   Status:', response.status);
    const responseText = await response.text();
    
    if (response.ok) {
      console.log('   ✅ Working token accepted');
    } else {
      console.log('   ❌ Working token rejected:', responseText.substring(0, 200));
    }
    
  } catch (error) {
    console.log('   ❌ Working token test failed:', error.message);
  }
  
  console.log('\\n📊 Test Summary:');
  console.log('   - Registration endpoint: /api/v1/auth/register');
  console.log('   - Profile endpoint: /api/v1/auth/me');
  console.log('   - Community creation: /api/v1/communities');
  console.log('   - Post creation: /api/v1/posts');
}

testAuthFixed().catch(console.error);