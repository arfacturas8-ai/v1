#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('\x1b[1m🚀 Starting Comprehensive Reddit Feature Validation\x1b[0m');
console.log('\x1b[36m============================================================\x1b[0m');

// Test configuration
const API_BASE = 'http://localhost:3002';
const testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

function logTest(name, status, details = '') {
  testResults.total++;
  if (status === 'PASS') {
    testResults.passed++;
    console.log(`\x1b[32m✅ ${name}\x1b[0m`);
  } else {
    testResults.failed++;
    console.log(`\x1b[31m❌ ${name}\x1b[0m`);
    if (details) console.log(`\x1b[33m   ${details}\x1b[0m`);
  }
}

async function makeRequest(method, endpoint, data = null, token = null, expectStatus = 200) {
  const fetch = (await import('node-fetch')).default;
  
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const options = {
    method,
    headers,
    body: data ? JSON.stringify(data) : null
  };
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const result = await response.json();
    
    if (response.status !== expectStatus) {
      throw new Error(`Expected status ${expectStatus}, got ${response.status}: ${result.error || result.message || 'Unknown error'}`);
    }
    
    return { response, data: result };
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

async function runTests() {
  let userToken = null;
  let testUser = null;
  let testCommunity = null;
  let testPost = null;
  let testComment = null;
  
  try {
    // ============================================
    // 1. SERVER HEALTH CHECK
    // ============================================
    console.log('\x1b[34m\n🔍 Testing Server Health...\x1b[0m');
    
    try {
      const { data } = await makeRequest('GET', '/health');
      if (data.status === 'healthy' || data.status === 'degraded') {
        logTest('Server Health Check', 'PASS');
      } else {
        logTest('Server Health Check', 'FAIL', `Server status: ${data.status}`);
      }
    } catch (error) {
      logTest('Server Health Check', 'FAIL', error.message);
      return; // Exit if server is not responding
    }

    // ============================================
    // 2. USER REGISTRATION & AUTHENTICATION
    // ============================================
    console.log('\x1b[34m\n👤 Testing User Authentication...\x1b[0m');
    
    const timestamp = Date.now();
    const testUserData = {
      username: `testuser_${timestamp}`,
      email: `testuser_${timestamp}@test.com`,
      password: 'TestPassword123!',
      displayName: `Test User ${timestamp}`
    };
    
    try {
      const { data } = await makeRequest('POST', '/api/v1/auth/register', testUserData, null, 201);
      if (data.success && data.data.user) {
        testUser = data.data.user;
        userToken = data.data.accessToken;
        logTest('User Registration', 'PASS');
      } else {
        logTest('User Registration', 'FAIL', 'Invalid response structure');
      }
    } catch (error) {
      logTest('User Registration', 'FAIL', error.message);
      return;
    }

    // ============================================
    // 3. COMMUNITY OPERATIONS
    // ============================================
    console.log('\x1b[34m\n🏘️  Testing Community Operations...\x1b[0m');
    
    const communityData = {
      name: `testcommunity_${timestamp}`,
      displayName: `Test Community ${timestamp}`,
      description: 'A test community for Reddit features',
      isPublic: true,
      isNsfw: false
    };
    
    try {
      const { data } = await makeRequest('POST', '/api/v1/communities', communityData, userToken, 200);
      if (data.success && data.data.id) {
        testCommunity = data.data;
        logTest('Community Creation', 'PASS');
      } else {
        logTest('Community Creation', 'FAIL', 'Invalid response structure');
      }
    } catch (error) {
      logTest('Community Creation', 'FAIL', error.message);
    }

    if (!testCommunity) {
      console.log('\x1b[33m⚠️  Skipping community-dependent tests\x1b[0m');
      return;
    }

    // Test community listing
    try {
      const { data } = await makeRequest('GET', '/api/v1/communities');
      if (data.success && Array.isArray(data.data.items)) {
        logTest('Community Listing', 'PASS');
      } else {
        logTest('Community Listing', 'FAIL', 'Invalid response structure');
      }
    } catch (error) {
      logTest('Community Listing', 'FAIL', error.message);
    }

    // Test community details
    try {
      const { data } = await makeRequest('GET', `/api/v1/communities/${testCommunity.name}`);
      if (data.success && data.data.id === testCommunity.id) {
        logTest('Community Details', 'PASS');
      } else {
        logTest('Community Details', 'FAIL', 'Community not found or invalid data');
      }
    } catch (error) {
      logTest('Community Details', 'FAIL', error.message);
    }

    // ============================================
    // 4. POST OPERATIONS
    // ============================================
    console.log('\x1b[34m\n📝 Testing Post Operations...\x1b[0m');
    
    const postData = {
      communityId: testCommunity.id,
      title: `Test Post ${timestamp}`,
      content: 'This is a comprehensive test post for the Reddit-style functionality. It includes **markdown** formatting and links.',
      url: 'https://example.com/test-article'
    };
    
    try {
      const { data } = await makeRequest('POST', '/api/v1/posts', postData, userToken, 200);
      if (data.success && data.data.id) {
        testPost = data.data;
        logTest('Post Creation', 'PASS');
      } else {
        logTest('Post Creation', 'FAIL', 'Invalid response structure');
      }
    } catch (error) {
      logTest('Post Creation', 'FAIL', error.message);
    }

    if (!testPost) {
      console.log('\x1b[33m⚠️  Skipping post-dependent tests\x1b[0m');
      return;
    }

    // Test post listing
    try {
      const { data } = await makeRequest('GET', '/api/v1/posts');
      if (data.success && Array.isArray(data.data.items) && data.data.items.length > 0) {
        logTest('Post Listing', 'PASS');
      } else {
        logTest('Post Listing', 'FAIL', 'No posts found or invalid structure');
      }
    } catch (error) {
      logTest('Post Listing', 'FAIL', error.message);
    }

    // Test single post retrieval
    try {
      const { data } = await makeRequest('GET', `/api/v1/posts/${testPost.id}`);
      if (data.success && data.data.id === testPost.id) {
        logTest('Single Post Retrieval', 'PASS');
      } else {
        logTest('Single Post Retrieval', 'FAIL', 'Post not found or invalid data');
      }
    } catch (error) {
      logTest('Single Post Retrieval', 'FAIL', error.message);
    }

    // ============================================
    // 5. VOTING SYSTEM
    // ============================================
    console.log('\x1b[34m\n🗳️  Testing Voting System...\x1b[0m');
    
    // Upvote post
    try {
      const { data } = await makeRequest('POST', `/api/v1/posts/${testPost.id}/vote`, { value: 1 }, userToken, 200);
      if (data.success && data.data.score === 1) {
        logTest('Post Upvote', 'PASS');
      } else {
        logTest('Post Upvote', 'FAIL', `Expected score 1, got ${data.data?.score}`);
      }
    } catch (error) {
      logTest('Post Upvote', 'FAIL', error.message);
    }

    // Check vote status
    try {
      const { data } = await makeRequest('GET', `/api/v1/posts/${testPost.id}/vote-status`);
      if (data.success && data.data.userVote === 1) {
        logTest('Vote Status Check', 'PASS');
      } else {
        logTest('Vote Status Check', 'FAIL', `Expected userVote 1, got ${data.data?.userVote}`);
      }
    } catch (error) {
      logTest('Vote Status Check', 'FAIL', error.message);
    }

    // Downvote post
    try {
      const { data } = await makeRequest('POST', `/api/v1/posts/${testPost.id}/vote`, { value: -1 }, userToken, 200);
      if (data.success && data.data.score === -1) {
        logTest('Post Downvote', 'PASS');
      } else {
        logTest('Post Downvote', 'FAIL', `Expected score -1, got ${data.data?.score}`);
      }
    } catch (error) {
      logTest('Post Downvote', 'FAIL', error.message);
    }

    // Remove vote
    try {
      const { data } = await makeRequest('POST', `/api/v1/posts/${testPost.id}/vote`, { value: 0 }, userToken, 200);
      if (data.success && data.data.score === 0) {
        logTest('Vote Removal', 'PASS');
      } else {
        logTest('Vote Removal', 'FAIL', `Expected score 0, got ${data.data?.score}`);
      }
    } catch (error) {
      logTest('Vote Removal', 'FAIL', error.message);
    }

    // ============================================
    // 6. COMMENT SYSTEM
    // ============================================
    console.log('\x1b[34m\n💬 Testing Comment System...\x1b[0m');
    
    const commentData = {
      postId: testPost.id,
      content: 'This is a test comment with **markdown** formatting and comprehensive content for testing purposes.'
    };
    
    try {
      const { data } = await makeRequest('POST', '/api/v1/comments', commentData, userToken, 200);
      if (data.success && data.data.id) {
        testComment = data.data;
        logTest('Comment Creation', 'PASS');
      } else {
        logTest('Comment Creation', 'FAIL', 'Invalid response structure');
      }
    } catch (error) {
      logTest('Comment Creation', 'FAIL', error.message);
    }

    if (testComment) {
      // Test comment listing for post
      try {
        const { data } = await makeRequest('GET', `/api/v1/comments/post/${testPost.id}`);
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          logTest('Comment Listing', 'PASS');
        } else {
          logTest('Comment Listing', 'FAIL', 'No comments found or invalid structure');
        }
      } catch (error) {
        logTest('Comment Listing', 'FAIL', error.message);
      }

      // Test comment voting
      try {
        const { data } = await makeRequest('POST', `/api/v1/comments/${testComment.id}/vote`, { value: 1 }, userToken, 200);
        if (data.success && data.data.score === 1) {
          logTest('Comment Upvote', 'PASS');
        } else {
          logTest('Comment Upvote', 'FAIL', `Expected score 1, got ${data.data?.score}`);
        }
      } catch (error) {
        logTest('Comment Upvote', 'FAIL', error.message);
      }

      // Test nested comment (reply)
      const replyData = {
        postId: testPost.id,
        parentId: testComment.id,
        content: 'This is a nested reply comment for testing the comment tree structure.'
      };

      try {
        const { data } = await makeRequest('POST', '/api/v1/comments', replyData, userToken, 200);
        if (data.success && data.data.parentId === testComment.id) {
          logTest('Nested Comment Creation', 'PASS');
        } else {
          logTest('Nested Comment Creation', 'FAIL', 'Reply not properly nested');
        }
      } catch (error) {
        logTest('Nested Comment Creation', 'FAIL', error.message);
      }
    }

    // ============================================
    // 7. AWARD SYSTEM
    // ============================================
    console.log('\x1b[34m\n🏆 Testing Award System...\x1b[0m');
    
    // Test award types
    try {
      const { data } = await makeRequest('GET', '/api/v1/awards/types');
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        logTest('Award Types Listing', 'PASS');
      } else {
        logTest('Award Types Listing', 'FAIL', 'No award types found');
      }
    } catch (error) {
      logTest('Award Types Listing', 'FAIL', error.message);
    }

    // Create second user for awarding (can't award yourself)
    const secondUser = {
      username: `awarder_${timestamp}`,
      email: `awarder_${timestamp}@test.com`,
      password: 'TestPassword123!',
      displayName: `Awarder ${timestamp}`
    };

    let awarderToken = null;
    try {
      const { data } = await makeRequest('POST', '/api/v1/auth/register', secondUser, null, 201);
      if (data.success && data.data.accessToken) {
        awarderToken = data.data.accessToken;
        logTest('Second User Registration', 'PASS');
      } else {
        logTest('Second User Registration', 'FAIL', 'Invalid response');
      }
    } catch (error) {
      logTest('Second User Registration', 'FAIL', error.message);
    }

    if (awarderToken && testPost) {
      try {
        const awardData = {
          awardType: 'silver',
          message: 'Great post!',
          anonymous: false
        };
        const { data } = await makeRequest('POST', `/api/v1/awards/post/${testPost.id}`, awardData, awarderToken, 200);
        if (data.success) {
          logTest('Post Award', 'PASS');
        } else {
          logTest('Post Award', 'FAIL', 'Award creation failed');
        }
      } catch (error) {
        logTest('Post Award', 'FAIL', error.message);
      }

      // Test award listing for post
      try {
        const { data } = await makeRequest('GET', `/api/v1/awards/post/${testPost.id}`);
        if (data.success && data.data.total > 0) {
          logTest('Post Award Listing', 'PASS');
        } else {
          logTest('Post Award Listing', 'FAIL', 'No awards found');
        }
      } catch (error) {
        logTest('Post Award Listing', 'FAIL', error.message);
      }
    }

    // ============================================
    // 8. KARMA SYSTEM
    // ============================================
    console.log('\x1b[34m\n🎯 Testing Karma System...\x1b[0m');
    
    try {
      const { data } = await makeRequest('GET', `/api/v1/karma/user/${testUser.id}`);
      if (data.success && typeof data.data.karma === 'object') {
        logTest('User Karma Retrieval', 'PASS');
      } else {
        logTest('User Karma Retrieval', 'FAIL', 'Invalid karma data structure');
      }
    } catch (error) {
      logTest('User Karma Retrieval', 'FAIL', error.message);
    }

    try {
      const { data } = await makeRequest('GET', '/api/v1/karma/leaderboard');
      if (data.success && Array.isArray(data.data.leaders)) {
        logTest('Karma Leaderboard', 'PASS');
      } else {
        logTest('Karma Leaderboard', 'FAIL', 'Invalid leaderboard structure');
      }
    } catch (error) {
      logTest('Karma Leaderboard', 'FAIL', error.message);
    }

    try {
      const { data } = await makeRequest('GET', '/api/v1/karma/trending');
      if (data.success && Array.isArray(data.data.trending)) {
        logTest('Trending Content', 'PASS');
      } else {
        logTest('Trending Content', 'FAIL', 'Invalid trending data structure');
      }
    } catch (error) {
      logTest('Trending Content', 'FAIL', error.message);
    }

    // ============================================
    // 9. ADVANCED POST FEATURES
    // ============================================
    console.log('\x1b[34m\n📋 Testing Advanced Post Features...\x1b[0m');
    
    if (testPost) {
      // Test post saving
      try {
        const { data } = await makeRequest('POST', `/api/v1/posts/${testPost.id}/save`, { saved: true }, userToken, 200);
        if (data.success && data.data.saved === true) {
          logTest('Post Save', 'PASS');
        } else {
          logTest('Post Save', 'FAIL', 'Save operation failed');
        }
      } catch (error) {
        logTest('Post Save', 'FAIL', error.message);
      }

      // Test saved posts listing
      try {
        const { data } = await makeRequest('GET', '/api/v1/posts/saved', null, userToken, 200);
        if (data.success && Array.isArray(data.data.items)) {
          logTest('Saved Posts Listing', 'PASS');
        } else {
          logTest('Saved Posts Listing', 'FAIL', 'Invalid saved posts structure');
        }
      } catch (error) {
        logTest('Saved Posts Listing', 'FAIL', error.message);
      }

      // Test post editing
      try {
        const editData = {
          title: `${testPost.title} - EDITED`,
          content: `${testPost.content}\n\nThis post has been edited for testing purposes.`
        };
        const { data } = await makeRequest('PATCH', `/api/v1/posts/${testPost.id}`, editData, userToken, 200);
        if (data.success && data.data.editedAt) {
          logTest('Post Editing', 'PASS');
        } else {
          logTest('Post Editing', 'FAIL', 'Edit operation failed');
        }
      } catch (error) {
        logTest('Post Editing', 'FAIL', error.message);
      }

      // Test post reporting
      if (awarderToken) {
        try {
          const reportData = {
            reason: 'spam',
            details: 'This is a test report for system validation'
          };
          const { data } = await makeRequest('POST', `/api/v1/posts/${testPost.id}/report`, reportData, awarderToken, 200);
          if (data.success) {
            logTest('Post Reporting', 'PASS');
          } else {
            logTest('Post Reporting', 'FAIL', 'Report submission failed');
          }
        } catch (error) {
          logTest('Post Reporting', 'FAIL', error.message);
        }
      }
    }

    // ============================================
    // 10. SORTING AND FILTERING
    // ============================================
    console.log('\x1b[34m\n🔄 Testing Sorting and Filtering...\x1b[0m');
    
    const sortOptions = ['hot', 'new', 'top', 'controversial'];
    for (const sort of sortOptions) {
      try {
        const { data } = await makeRequest('GET', `/api/v1/posts?sort=${sort}&limit=5`);
        if (data.success && Array.isArray(data.data.items)) {
          logTest(`Post Sorting (${sort})`, 'PASS');
        } else {
          logTest(`Post Sorting (${sort})`, 'FAIL', 'Invalid sorting response');
        }
      } catch (error) {
        logTest(`Post Sorting (${sort})`, 'FAIL', error.message);
      }
    }

    // Test community-specific posts
    if (testCommunity) {
      try {
        const { data } = await makeRequest('GET', `/api/v1/posts?community=${testCommunity.name}`);
        if (data.success && Array.isArray(data.data.items)) {
          logTest('Community Post Filtering', 'PASS');
        } else {
          logTest('Community Post Filtering', 'FAIL', 'Invalid community filtering');
        }
      } catch (error) {
        logTest('Community Post Filtering', 'FAIL', error.message);
      }
    }

    // ============================================
    // 11. CLEANUP TESTS
    // ============================================
    console.log('\x1b[34m\n🧹 Testing Cleanup Operations...\x1b[0m');
    
    if (testComment) {
      try {
        const { data } = await makeRequest('DELETE', `/api/v1/comments/${testComment.id}`, null, userToken, 200);
        if (data.success) {
          logTest('Comment Deletion', 'PASS');
        } else {
          logTest('Comment Deletion', 'FAIL', 'Delete operation failed');
        }
      } catch (error) {
        logTest('Comment Deletion', 'FAIL', error.message);
      }
    }

    if (testPost) {
      try {
        const { data } = await makeRequest('DELETE', `/api/v1/posts/${testPost.id}`, null, userToken, 200);
        if (data.success) {
          logTest('Post Deletion', 'PASS');
        } else {
          logTest('Post Deletion', 'FAIL', 'Delete operation failed');
        }
      } catch (error) {
        logTest('Post Deletion', 'FAIL', error.message);
      }
    }

  } catch (error) {
    console.error('\x1b[31mUnexpected error during testing:\x1b[0m', error.message);
    testResults.failed++;
    testResults.total++;
  }

  // ============================================
  // FINAL RESULTS
  // ============================================
  console.log('\x1b[36m\n============================================================\x1b[0m');
  console.log('\x1b[1m🏁 Comprehensive Test Results Summary\x1b[0m');
  console.log('\x1b[36m============================================================\x1b[0m');
  console.log(`\x1b[34mTotal Tests: ${testResults.total}\x1b[0m`);
  console.log(`\x1b[32m✅ Passed: ${testResults.passed}\x1b[0m`);
  console.log(`\x1b[31m❌ Failed: ${testResults.failed}\x1b[0m`);
  
  const successRate = testResults.total > 0 ? Math.round((testResults.passed / testResults.total) * 100) : 0;
  console.log(`\x1b[33mSuccess Rate: ${successRate}%\x1b[0m`);
  
  if (testResults.failed > 0) {
    console.log(`\x1b[33m\n⚠️ ${testResults.failed} test(s) failed. Reddit features need attention.\x1b[0m`);
  } else {
    console.log(`\x1b[32m\n🎉 All tests passed! Reddit features are fully functional.\x1b[0m`);
  }
  
  console.log('\x1b[36m============================================================\x1b[0m');
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(error => {
  console.error('\x1b[31mTest execution failed:\x1b[0m', error);
  process.exit(1);
});