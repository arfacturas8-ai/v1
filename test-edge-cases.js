const axios = require('axios');

async function testPostEdgeCases() {
  console.log('🧪 Testing Post Creation Edge Cases...\n');

  try {
    // Create a new test user for edge cases
    const timestamp = Date.now();
    const testUser = {
      username: `edgetest${timestamp}`,
      displayName: `Edge Test User ${timestamp}`,
      email: `edgetest${timestamp}@example.com`,
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

    // Create a test community first
    const communityData = {
      name: `edge${timestamp.toString().slice(-6)}`,
      displayName: `Edge Test Community ${timestamp}`,
      description: 'Testing edge cases',
      isPublic: true
    };

    const communityResponse = await axios.post('http://localhost:3002/api/v1/communities', communityData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const communityId = communityResponse.data.data.id;
    console.log('✅ Created test community with ID:', communityId, '\n');

    // Test edge cases that might cause validation errors
    const testCases = [
      {
        name: 'Empty string communityId',
        data: {
          communityId: '',
          title: 'Test Post',
          content: 'Test content'
        }
      },
      {
        name: 'Invalid CUID format',
        data: {
          communityId: 'invalid-id-format',
          title: 'Test Post',
          content: 'Test content'
        }
      },
      {
        name: 'Null communityId',
        data: {
          communityId: null,
          title: 'Test Post',
          content: 'Test content'
        }
      },
      {
        name: 'Very long title',
        data: {
          communityId: communityId,
          title: 'A'.repeat(301), // Over 300 character limit
          content: 'Test content'
        }
      },
      {
        name: 'Empty title',
        data: {
          communityId: communityId,
          title: '',
          content: 'Test content'
        }
      },
      {
        name: 'Very long content',
        data: {
          communityId: communityId,
          title: 'Test Post',
          content: 'A'.repeat(40001) // Over 40000 character limit
        }
      },
      {
        name: 'Empty content',
        data: {
          communityId: communityId,
          title: 'Test Post',
          content: ''
        }
      },
      {
        name: 'Invalid URL format',
        data: {
          communityId: communityId,
          title: 'Test Post',
          content: 'Test content',
          url: 'not-a-valid-url'
        }
      },
      {
        name: 'Invalid thumbnail URL format',
        data: {
          communityId: communityId,
          title: 'Test Post',
          content: 'Test content',
          thumbnail: 'invalid-thumbnail-url'
        }
      },
      {
        name: 'Extra unexpected fields',
        data: {
          communityId: communityId,
          title: 'Test Post',
          content: 'Test content',
          extraField: 'should be ignored',
          anotherExtra: 123
        }
      },
      {
        name: 'Valid minimal post',
        data: {
          communityId: communityId,
          title: 'Valid Post',
          content: 'Valid content'
        }
      }
    ];

    for (const testCase of testCases) {
      console.log(`Test: ${testCase.name}`);
      try {
        const response = await axios.post('http://localhost:3002/api/v1/posts', testCase.data, {
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

    // Test posting to a non-existent community
    console.log('Test: Non-existent community');
    try {
      const response = await axios.post('http://localhost:3002/api/v1/posts', {
        communityId: 'cmfn6invalid000000000000',
        title: 'Test Post',
        content: 'Test content'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Unexpected success');
    } catch (error) {
      console.log('❌ Failed (expected):');
      console.log('  Status:', error.response?.status);
      console.log('  Error:', error.response?.data?.error || error.message);
    }

  } catch (error) {
    console.error('❌ Test setup failed:', JSON.stringify(error.response?.data || error.message, null, 2));
  }
}

testPostEdgeCases();