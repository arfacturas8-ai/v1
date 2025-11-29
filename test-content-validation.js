const axios = require('axios');

async function testContentValidation() {
  console.log('🧪 Testing Content Validation Edge Cases...\n');

  try {
    // Create a new test user
    const timestamp = Date.now();
    const testUser = {
      username: `contenttest${timestamp}`,
      displayName: `Content Test User ${timestamp}`,
      email: `contenttest${timestamp}@example.com`,
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
      name: `content${timestamp.toString().slice(-5)}`,
      displayName: `Content Test Community`,
      description: 'Testing content validation',
      isPublic: true
    };

    const communityResponse = await axios.post('http://localhost:3002/api/v1/communities', communityData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const communityId = communityResponse.data.data.id;
    console.log('✅ Created test community with ID:', communityId, '\n');

    // Test various content validation scenarios
    const contentTests = [
      {
        name: 'Only whitespace in title',
        data: {
          communityId: communityId,
          title: '   \n\t   ',
          content: 'Valid content'
        }
      },
      {
        name: 'Only whitespace in content',
        data: {
          communityId: communityId,
          title: 'Valid Title',
          content: '   \n\t   '
        }
      },
      {
        name: 'HTML in content',
        data: {
          communityId: communityId,
          title: 'HTML Test',
          content: '<script>alert("test")</script><p>Some content</p>'
        }
      },
      {
        name: 'Markdown content',
        data: {
          communityId: communityId,
          title: 'Markdown Test',
          content: '# Header\n\n**Bold text** and *italic text*\n\n[Link](https://example.com)'
        }
      },
      {
        name: 'Very short valid content',
        data: {
          communityId: communityId,
          title: 'Short',
          content: 'x'
        }
      },
      {
        name: 'Unicode content',
        data: {
          communityId: communityId,
          title: 'Unicode Test 🚀',
          content: 'Testing with emojis 🎉 and unicode characters: café, naïve, résumé'
        }
      },
      {
        name: 'JSON-like content',
        data: {
          communityId: communityId,
          title: 'JSON Content',
          content: '{"key": "value", "number": 123, "array": [1, 2, 3]}'
        }
      },
      {
        name: 'Special characters',
        data: {
          communityId: communityId,
          title: 'Special !@#$%^&*()',
          content: 'Content with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?'
        }
      }
    ];

    for (const test of contentTests) {
      console.log(`Test: ${test.name}`);
      try {
        const response = await axios.post('http://localhost:3002/api/v1/posts', test.data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Success - Post created with ID:', response.data.data.id);
      } catch (error) {
        console.log('❌ Failed:');
        console.log('  Status:', error.response?.status);
        if (error.response?.data?.details?.errors) {
          console.log('  Validation Errors:', JSON.stringify(error.response.data.details.errors, null, 4));
        } else {
          console.log('  Error:', error.response?.data?.error || error.message);
        }
      }
      console.log('');
    }

    // Test what happens when we try different content types
    console.log('Testing request Content-Type variations...\n');

    const validPostData = {
      communityId: communityId,
      title: 'Content Type Test',
      content: 'Testing different content types'
    };

    // Test with missing Content-Type header
    console.log('Test: Missing Content-Type header');
    try {
      const response = await axios.post('http://localhost:3002/api/v1/posts', validPostData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          // Explicitly remove content-type to test default behavior
        },
        transformRequest: [(data) => JSON.stringify(data)]
      });
      console.log('✅ Success with missing Content-Type');
    } catch (error) {
      console.log('❌ Failed with missing Content-Type:');
      console.log('  Status:', error.response?.status);
      console.log('  Error:', error.response?.data?.error || error.message);
    }

    console.log('');

    // Test with wrong Content-Type
    console.log('Test: Wrong Content-Type header');
    try {
      const response = await axios.post('http://localhost:3002/api/v1/posts', validPostData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/plain'
        }
      });
      console.log('✅ Success with wrong Content-Type');
    } catch (error) {
      console.log('❌ Failed with wrong Content-Type:');
      console.log('  Status:', error.response?.status);
      console.log('  Error:', error.response?.data?.error || error.message);
    }

  } catch (error) {
    console.error('❌ Test setup failed:', JSON.stringify(error.response?.data || error.message, null, 2));
  }
}

testContentValidation();