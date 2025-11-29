const axios = require('axios');
const http = require('http');

async function testContentTypeFix() {
  console.log('🧪 Testing Content-Type Fix for Post Creation...\n');

  try {
    // Create a new test user
    const timestamp = Date.now();
    const testUser = {
      username: `ctypetest${timestamp}`,
      displayName: `CType Test User ${timestamp}`,
      email: `ctypetest${timestamp}@example.com`,
      password: 'Password123!',
      confirmPassword: 'Password123!'
    };

    await axios.post('http://localhost:3002/api/v1/auth/register', testUser);
    console.log('✅ User registered successfully');

    const loginResponse = await axios.post('http://localhost:3002/api/v1/auth/login', {
      username: testUser.username,
      password: 'Password123!'
    });

    const token = loginResponse.data.data?.tokens?.accessToken;
    console.log('✅ Got auth token\n');

    // Create a test community
    const communityData = {
      name: `ctype${timestamp.toString().slice(-5)}`,
      displayName: `Content Type Test Community`,
      description: 'Testing content type handling',
      isPublic: true
    };

    const communityResponse = await axios.post('http://localhost:3002/api/v1/communities', communityData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const communityId = communityResponse.data.data.id;
    console.log('✅ Created test community with ID:', communityId, '\n');

    // Test different content type scenarios for post creation
    const postData = {
      communityId: communityId,
      title: 'Content Type Test Post',
      content: 'Testing different content types for post creation'
    };

    const testCases = [
      {
        name: 'Proper application/json content-type',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        shouldWork: true
      },
      {
        name: 'Missing Content-Type header (should auto-detect JSON)',
        headers: {
          'Authorization': `Bearer ${token}`
          // No Content-Type header
        },
        shouldWork: true
      },
      {
        name: 'Wrong Content-Type (application/x-www-form-urlencoded) but JSON body',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        shouldWork: true // Should now work with our fix
      },
      {
        name: 'text/plain Content-Type with JSON body',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'text/plain'
        },
        shouldWork: true // Should now work with our fix
      }
    ];

    for (const testCase of testCases) {
      console.log(`\nTest: ${testCase.name}`);
      try {
        const response = await axios.post('http://localhost:3002/api/v1/posts', postData, {
          headers: testCase.headers
        });
        
        if (testCase.shouldWork) {
          console.log('✅ SUCCESS - Post created with ID:', response.data.data.id);
        } else {
          console.log('❌ UNEXPECTED SUCCESS - This should have failed');
        }
      } catch (error) {
        if (testCase.shouldWork) {
          console.log('❌ FAILED (unexpected):');
          console.log('  Status:', error.response?.status);
          console.log('  Error:', error.response?.data?.error || error.message);
          if (error.response?.data?.details) {
            console.log('  Details:', JSON.stringify(error.response.data.details, null, 2));
          }
        } else {
          console.log('✅ FAILED (expected):', error.response?.data?.error || error.message);
        }
      }
    }

    // Test with raw HTTP requests to be more specific about headers
    console.log('\n' + '='.repeat(60));
    console.log('Testing with raw HTTP requests...\n');

    const rawTests = [
      {
        name: 'Raw HTTP request without Content-Type',
        data: JSON.stringify(postData),
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Length': Buffer.byteLength(JSON.stringify(postData))
        }
      },
      {
        name: 'Raw HTTP request with application/x-www-form-urlencoded but JSON data',
        data: JSON.stringify(postData),
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(JSON.stringify(postData))
        }
      }
    ];

    for (const rawTest of rawTests) {
      console.log(`\nRaw Test: ${rawTest.name}`);
      
      const promise = new Promise((resolve, reject) => {
        const options = {
          hostname: 'localhost',
          port: 3002,
          path: '/api/v1/posts',
          method: 'POST',
          headers: rawTest.headers
        };

        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            resolve({ statusCode: res.statusCode, data: data });
          });
        });

        req.on('error', (err) => {
          reject(err);
        });

        req.write(rawTest.data);
        req.end();
      });

      try {
        const result = await promise;
        console.log('✅ SUCCESS - Status:', result.statusCode);
        
        try {
          const parsedData = JSON.parse(result.data);
          if (parsedData.data?.id) {
            console.log('  Post ID:', parsedData.data.id);
          }
        } catch (parseErr) {
          console.log('  Response:', result.data.substring(0, 200));
        }
      } catch (error) {
        console.log('❌ FAILED:', error.message);
      }
    }

  } catch (error) {
    console.error('❌ Test setup failed:', JSON.stringify(error.response?.data || error.message, null, 2));
  }
}

testContentTypeFix();