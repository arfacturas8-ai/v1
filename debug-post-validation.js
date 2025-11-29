const axios = require('axios');

async function testPostCreation() {
  console.log('🧪 Testing Post Creation Validation...\n');

  // First, let's get a valid token by registering/logging in
  console.log('1. Creating test user and getting auth token...');
  
  try {
    // Generate unique test data
    const timestamp = Date.now();
    const testUser = {
      username: `testuser${timestamp}`,
      displayName: `Test User ${timestamp}`,
      email: `test${timestamp}@example.com`,
      password: 'Password123!',
      confirmPassword: 'Password123!'
    };

    const registerResponse = await axios.post('http://localhost:3002/api/v1/auth/register', testUser);
    console.log('✅ User registered successfully');

    const loginResponse = await axios.post('http://localhost:3002/api/v1/auth/login', {
      username: testUser.username,
      password: 'Password123!'
    });

    const token = loginResponse.data.data?.tokens?.accessToken || loginResponse.data.data?.token || loginResponse.data.token;
    console.log('✅ Login successful, got token:', token.substring(0, 20) + '...\n');

    // Now create a test community
    console.log('2. Creating test community...');
    const communityData = {
      name: `test${timestamp.toString().slice(-6)}`, // Keep it short for validation
      displayName: `Test Community ${timestamp}`,
      description: 'A test community for post validation testing',
      isPublic: true
    };

    const communityResponse = await axios.post('http://localhost:3002/api/v1/communities', communityData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const communityId = communityResponse.data.data.id;
    console.log('✅ Community created successfully with ID:', communityId);
    console.log('Community name:', communityResponse.data.data.name, '\n');

    // Test different post creation scenarios
    console.log('3. Testing post creation scenarios...\n');

    // Test 1: Valid post data
    console.log('Test 1: Valid post with all required fields');
    const validPostData = {
      communityId: communityId,
      title: 'Test Post Title',
      content: 'This is test content for the post'
    };

    try {
      const validPostResponse = await axios.post('http://localhost:3002/api/v1/posts', validPostData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Valid post created successfully');
      console.log('Post ID:', validPostResponse.data.data.id);
    } catch (error) {
      console.log('❌ Valid post creation failed:');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Post with missing communityId
    console.log('Test 2: Post with missing communityId');
    const missingCommunityData = {
      title: 'Test Post Title',
      content: 'This is test content for the post'
    };

    try {
      const missingCommunityResponse = await axios.post('http://localhost:3002/api/v1/posts', missingCommunityData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('❌ Should have failed but succeeded');
    } catch (error) {
      console.log('✅ Correctly failed with missing communityId:');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Post with missing title
    console.log('Test 3: Post with missing title');
    const missingTitleData = {
      communityId: communityId,
      content: 'This is test content for the post'
    };

    try {
      const missingTitleResponse = await axios.post('http://localhost:3002/api/v1/posts', missingTitleData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('❌ Should have failed but succeeded');
    } catch (error) {
      console.log('✅ Correctly failed with missing title:');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 4: Post with missing content
    console.log('Test 4: Post with missing content');
    const missingContentData = {
      communityId: communityId,
      title: 'Test Post Title'
    };

    try {
      const missingContentResponse = await axios.post('http://localhost:3002/api/v1/posts', missingContentData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('❌ Should have failed but succeeded');
    } catch (error) {
      console.log('✅ Correctly failed with missing content:');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 5: Post with optional fields
    console.log('Test 5: Post with optional URL and thumbnail');
    const postWithOptionalData = {
      communityId: communityId,
      title: 'Post with URL and Thumbnail',
      content: 'This post has optional fields',
      url: 'https://example.com',
      thumbnail: 'https://example.com/image.jpg'
    };

    try {
      const optionalFieldsResponse = await axios.post('http://localhost:3002/api/v1/posts', postWithOptionalData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Post with optional fields created successfully');
      console.log('Post ID:', optionalFieldsResponse.data.data.id);
    } catch (error) {
      console.log('❌ Post with optional fields failed:');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 6: Invalid data types
    console.log('Test 6: Invalid data types');
    const invalidTypeData = {
      communityId: 123, // Should be string
      title: ['array', 'instead', 'of', 'string'], // Should be string
      content: null // Should be string
    };

    try {
      const invalidTypeResponse = await axios.post('http://localhost:3002/api/v1/posts', invalidTypeData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('❌ Should have failed but succeeded');
    } catch (error) {
      console.log('✅ Correctly failed with invalid data types:');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data);
    }

  } catch (error) {
    console.error('❌ Test setup failed:', JSON.stringify(error.response?.data || error.message, null, 2));
  }
}

testPostCreation();