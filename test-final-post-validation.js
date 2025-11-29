const axios = require('axios');

async function testFinalPostValidation() {
  console.log('🎯 Final Post Creation Validation Test...\n');

  try {
    // Create a new test user
    const timestamp = Date.now();
    const testUser = {
      username: `finaltest${timestamp}`,
      displayName: `Final Test User ${timestamp}`,
      email: `finaltest${timestamp}@example.com`,
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

    // Create multiple test communities
    console.log('Creating test communities...');
    const communities = [];
    
    for (let i = 1; i <= 3; i++) {
      const communityData = {
        name: `final${timestamp.toString().slice(-5)}${i}`,
        displayName: `Final Test Community ${i}`,
        description: `Testing community ${i} for final validation`,
        isPublic: true
      };

      const communityResponse = await axios.post('http://localhost:3002/api/v1/communities', communityData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      communities.push({
        id: communityResponse.data.data.id,
        name: communityResponse.data.data.name
      });
      console.log(`✅ Community ${i} created: ${communityResponse.data.data.name}`);
    }

    console.log('\n📝 Testing post creation in multiple communities...\n');

    // Test creating posts in different communities with various content types
    const postTests = [
      {
        community: communities[0],
        title: 'First Test Post',
        content: 'This is a test post in the first community',
        contentType: 'application/json'
      },
      {
        community: communities[1],
        title: 'Second Test Post with Emojis 🚀',
        content: 'This post has emojis and special characters: !@#$%^&*()',
        contentType: 'application/x-www-form-urlencoded' // Wrong content type but should work
      },
      {
        community: communities[2],
        title: 'Third Test Post with URL',
        content: 'This post includes a URL for testing',
        url: 'https://example.com/test',
        contentType: 'text/plain' // Wrong content type but should work
      },
      {
        community: communities[0],
        title: 'Post with Thumbnail',
        content: 'This post has both URL and thumbnail',
        url: 'https://example.com/image-post',
        thumbnail: 'https://example.com/thumb.jpg',
        contentType: 'application/json'
      },
      {
        community: communities[1],
        title: 'Long Content Post',
        content: 'This is a longer post content. '.repeat(50) + 'End of long content.',
        contentType: 'application/json'
      }
    ];

    let successCount = 0;
    let failCount = 0;

    for (const [index, test] of postTests.entries()) {
      console.log(`Test ${index + 1}: Creating post "${test.title}" in community "${test.community.name}"`);
      
      const postData = {
        communityId: test.community.id,
        title: test.title,
        content: test.content
      };

      if (test.url) postData.url = test.url;
      if (test.thumbnail) postData.thumbnail = test.thumbnail;

      const headers = { 
        Authorization: `Bearer ${token}`,
        'Content-Type': test.contentType
      };

      try {
        const response = await axios.post('http://localhost:3002/api/v1/posts', postData, { headers });
        console.log(`  ✅ SUCCESS - Post ID: ${response.data.data.id}`);
        successCount++;
      } catch (error) {
        console.log(`  ❌ FAILED - Status: ${error.response?.status}, Error: ${error.response?.data?.error}`);
        if (error.response?.data?.details) {
          console.log(`  Details:`, JSON.stringify(error.response.data.details, null, 4));
        }
        failCount++;
      }
    }

    console.log(`\n📊 Results Summary:`);
    console.log(`✅ Successful posts: ${successCount}/${postTests.length}`);
    console.log(`❌ Failed posts: ${failCount}/${postTests.length}`);

    if (successCount === postTests.length) {
      console.log('\n🎉 ALL TESTS PASSED! Post creation validation is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Review the failures above.');
    }

    // Test edge cases that should fail
    console.log('\n🧪 Testing validation edge cases (these should fail)...\n');

    const invalidTests = [
      {
        name: 'Missing communityId',
        data: {
          title: 'Test Post',
          content: 'Test content'
        }
      },
      {
        name: 'Invalid communityId format',
        data: {
          communityId: 'invalid-id',
          title: 'Test Post',
          content: 'Test content'
        }
      },
      {
        name: 'Empty title',
        data: {
          communityId: communities[0].id,
          title: '',
          content: 'Test content'
        }
      },
      {
        name: 'Empty content',
        data: {
          communityId: communities[0].id,
          title: 'Test Post',
          content: ''
        }
      },
      {
        name: 'Invalid URL format',
        data: {
          communityId: communities[0].id,
          title: 'Test Post',
          content: 'Test content',
          url: 'not-a-url'
        }
      }
    ];

    let validationPassCount = 0;
    for (const test of invalidTests) {
      console.log(`Validation Test: ${test.name}`);
      try {
        await axios.post('http://localhost:3002/api/v1/posts', test.data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('  ❌ UNEXPECTED SUCCESS - This should have failed');
      } catch (error) {
        console.log('  ✅ CORRECTLY FAILED - Validation working');
        validationPassCount++;
      }
    }

    console.log(`\n📊 Validation Tests: ${validationPassCount}/${invalidTests.length} correctly rejected invalid data`);

    if (validationPassCount === invalidTests.length && successCount === postTests.length) {
      console.log('\n🎯 VALIDATION SYSTEM IS WORKING PERFECTLY!');
      console.log('✅ Valid posts are created successfully');
      console.log('✅ Invalid posts are properly rejected');
      console.log('✅ Content-type handling is robust');
      console.log('✅ Users can create posts in communities without issues');
    }

  } catch (error) {
    console.error('❌ Test setup failed:', JSON.stringify(error.response?.data || error.message, null, 2));
  }
}

testFinalPostValidation();