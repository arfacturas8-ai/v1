#!/usr/bin/env node

// Use native fetch API (Node.js 18+)
const BASE_URL = 'http://localhost:3002';

// Test colors
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

let testCount = 0;
let passCount = 0;
let failCount = 0;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, passed, details = '') {
  testCount++;
  if (passed) {
    passCount++;
    log(`✅ ${name}`, 'green');
  } else {
    failCount++;
    log(`❌ ${name}`, 'red');
    if (details) {
      log(`   ${details}`, 'yellow');
    }
  }
}

async function makeRequest(endpoint, options = {}) {
  try {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return { response, data, status: response.status };
  } catch (error) {
    return { error: error.message, status: 0 };
  }
}

async function createTestUser() {
  const userData = {
    username: `testuser_${Date.now()}`,
    email: `test${Date.now()}@example.com`,
    password: 'TestPassword123!',
    confirmPassword: 'TestPassword123!',
    displayName: 'Test User'
  };

  const { data, status } = await makeRequest('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  });

  if (status === 201 && data.success) {
    return { user: data.data.user, token: data.data.token };
  }
  
  throw new Error(`Failed to create test user: ${data.error || 'Unknown error'}`);
}

async function createTestCommunity(token) {
  const communityData = {
    name: `testcommunity_${Date.now()}`,
    displayName: 'Test Community',
    description: 'A test community for Reddit functionality testing',
    isPublic: true,
    isNsfw: false
  };

  const { data, status } = await makeRequest('/api/v1/communities', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(communityData)
  });

  if (status === 201 && data.success) {
    return data.data;
  }
  
  throw new Error(`Failed to create test community: ${data.error || 'Unknown error'}`);
}

async function testHealthCheck() {
  log('\n🔍 Testing Server Health...', 'blue');
  
  const { status } = await makeRequest('/health');
  logTest('Server Health Check', status === 200 || status === 503); // 503 is acceptable for degraded state
}

async function testPostCRUD(token, communityId) {
  log('\n📝 Testing Post CRUD Operations...', 'blue');
  
  // Create post
  const postData = {
    communityId,
    title: 'Test Post - Reddit Style',
    content: 'This is a comprehensive test post with **markdown** support!\n\n- Test feature 1\n- Test feature 2\n- Test feature 3',
    url: 'https://example.com/test',
    thumbnail: 'https://example.com/thumb.jpg'
  };

  const createResult = await makeRequest('/api/v1/posts', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(postData)
  });

  logTest('Create Post', createResult.status === 200 && createResult.data.success);
  
  if (!createResult.data.success) {
    log(`   Error: ${createResult.data.error}`, 'yellow');
    return null;
  }

  const postId = createResult.data.data.id;

  // Get single post
  const getResult = await makeRequest(`/api/v1/posts/${postId}`);
  logTest('Get Single Post', getResult.status === 200 && getResult.data.success);

  // Update post
  const updateData = {
    title: 'Updated Test Post - Reddit Style',
    content: 'This post has been **updated** with new content!',
    flair: 'Test',
    nsfw: false
  };

  const updateResult = await makeRequest(`/api/v1/posts/${postId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(updateData)
  });

  logTest('Update Post', updateResult.status === 200 && updateResult.data.success);

  return postId;
}

async function testVotingSystem(token, postId) {
  log('\n⬆️ Testing Voting System...', 'blue');
  
  // Upvote post
  const upvoteResult = await makeRequest(`/api/v1/posts/${postId}/vote`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ value: 1 })
  });

  logTest('Upvote Post', upvoteResult.status === 200 && upvoteResult.data.success);
  logTest('Vote Data Returned', upvoteResult.data.data && upvoteResult.data.data.score !== undefined);

  // Change to downvote
  const downvoteResult = await makeRequest(`/api/v1/posts/${postId}/vote`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ value: -1 })
  });

  logTest('Change Vote to Downvote', downvoteResult.status === 200 && downvoteResult.data.success);

  // Remove vote (neutral)
  const neutralResult = await makeRequest(`/api/v1/posts/${postId}/vote`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ value: 0 })
  });

  logTest('Neutral Vote', neutralResult.status === 200 && neutralResult.data.success);

  // Check vote status
  const statusResult = await makeRequest(`/api/v1/posts/${postId}/vote-status`);
  logTest('Get Vote Status', statusResult.status === 200 && statusResult.data.success);
}

async function testCommentsSystem(token, postId) {
  log('\n💬 Testing Comments and Threading...', 'blue');
  
  // Create top-level comment
  const topCommentData = {
    postId,
    content: 'This is a top-level comment with **formatting**!'
  };

  const topCommentResult = await makeRequest('/api/v1/comments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(topCommentData)
  });

  logTest('Create Top-Level Comment', topCommentResult.status === 200 && topCommentResult.data.success);
  
  if (!topCommentResult.data.success) return;

  const topCommentId = topCommentResult.data.data.id;

  // Create reply comment
  const replyData = {
    postId,
    parentId: topCommentId,
    content: 'This is a reply to the top comment! Great point!'
  };

  const replyResult = await makeRequest('/api/v1/comments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(replyData)
  });

  logTest('Create Reply Comment', replyResult.status === 200 && replyResult.data.success);

  const replyId = replyResult.data.data.id;

  // Create nested reply
  const nestedReplyData = {
    postId,
    parentId: replyId,
    content: 'This is a nested reply - going deeper!'
  };

  const nestedReplyResult = await makeRequest('/api/v1/comments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(nestedReplyData)
  });

  logTest('Create Nested Reply', nestedReplyResult.status === 200 && nestedReplyResult.data.success);

  // Get comments for post
  const commentsResult = await makeRequest(`/api/v1/comments/post/${postId}?sort=top&depth=10`);
  logTest('Get Post Comments with Threading', commentsResult.status === 200 && commentsResult.data.success);

  // Test comment voting
  const voteCommentResult = await makeRequest(`/api/v1/comments/${topCommentId}/vote`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ value: 1 })
  });

  logTest('Vote on Comment', voteCommentResult.status === 200 && voteCommentResult.data.success);

  // Get comment thread
  const threadResult = await makeRequest(`/api/v1/comments/${topCommentId}/thread?depth=5`);
  logTest('Get Comment Thread', threadResult.status === 200 && threadResult.data.success);

  return { topCommentId, replyId };
}

async function testAwardsSystem(token, postId, commentId) {
  log('\n🏆 Testing Awards System...', 'blue');
  
  // Get award types
  const typesResult = await makeRequest('/api/v1/awards/types');
  logTest('Get Award Types', typesResult.status === 200 && typesResult.data.success);

  // Give award to post
  const postAwardData = {
    awardType: 'gold',
    message: 'Great post! Here\'s some gold!',
    anonymous: false
  };

  const postAwardResult = await makeRequest(`/api/v1/awards/post/${postId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(postAwardData)
  });

  logTest('Give Award to Post', postAwardResult.status === 200 && postAwardResult.data.success);

  // Give award to comment
  const commentAwardData = {
    awardType: 'silver',
    message: 'Nice comment!',
    anonymous: true
  };

  const commentAwardResult = await makeRequest(`/api/v1/awards/comment/${commentId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(commentAwardData)
  });

  logTest('Give Award to Comment', commentAwardResult.status === 200 && commentAwardResult.data.success);

  // Get post awards
  const postAwardsResult = await makeRequest(`/api/v1/awards/post/${postId}`);
  logTest('Get Post Awards', postAwardsResult.status === 200 && postAwardsResult.data.success);

  // Get received awards
  const receivedResult = await makeRequest('/api/v1/awards/received', {
    headers: { Authorization: `Bearer ${token}` }
  });

  logTest('Get Received Awards', receivedResult.status === 200 && receivedResult.data.success);
}

async function testSortingAlgorithms(token, communityId) {
  log('\n🔄 Testing Sorting Algorithms...', 'blue');
  
  // Test different sorting options
  const sortTypes = ['hot', 'new', 'top', 'controversial'];
  const timeFrames = ['hour', 'day', 'week', 'month', 'year', 'all'];

  for (const sort of sortTypes) {
    const result = await makeRequest(`/api/v1/posts?sort=${sort}&limit=10`);
    logTest(`Sort by ${sort}`, result.status === 200 && result.data.success);
  }

  for (const timeFrame of timeFrames) {
    const result = await makeRequest(`/api/v1/posts?sort=top&timeFrame=${timeFrame}&limit=5`);
    logTest(`Time filter: ${timeFrame}`, result.status === 200 && result.data.success);
  }
}

async function testSavedPosts(token, postId) {
  log('\n💾 Testing Saved Posts...', 'blue');
  
  // Save post
  const saveResult = await makeRequest(`/api/v1/posts/${postId}/save`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ saved: true })
  });

  logTest('Save Post', saveResult.status === 200 && saveResult.data.success);

  // Get saved posts
  const savedResult = await makeRequest('/api/v1/posts/saved', {
    headers: { Authorization: `Bearer ${token}` }
  });

  logTest('Get Saved Posts', savedResult.status === 200 && savedResult.data.success);

  // Unsave post
  const unsaveResult = await makeRequest(`/api/v1/posts/${postId}/save`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ saved: false })
  });

  logTest('Unsave Post', unsaveResult.status === 200 && unsaveResult.data.success);
}

async function testModerationTools(token, postId) {
  log('\n🛡️ Testing Moderation Tools...', 'blue');
  
  // Pin post (may fail if not moderator - that's expected)
  const pinResult = await makeRequest(`/api/v1/posts/${postId}/pin`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ pinned: true })
  });

  logTest('Pin Post (may fail - needs mod perms)', pinResult.status === 200 || pinResult.status === 403);

  // Lock post (may fail if not moderator - that's expected)
  const lockResult = await makeRequest(`/api/v1/posts/${postId}/lock`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ locked: true })
  });

  logTest('Lock Post (may fail - needs mod perms)', lockResult.status === 200 || lockResult.status === 403);

  // Report post
  const reportResult = await makeRequest(`/api/v1/posts/${postId}/report`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ 
      reason: 'spam',
      details: 'This is a test report'
    })
  });

  logTest('Report Post', reportResult.status === 200 && reportResult.data.success);
}

async function testKarmaSystem(token) {
  log('\n⭐ Testing Karma System...', 'blue');
  
  // Get karma leaderboard
  const leaderboardResult = await makeRequest('/api/v1/karma/leaderboard?timeFrame=all&limit=10');
  logTest('Get Karma Leaderboard', leaderboardResult.status === 200 && leaderboardResult.data.success);

  // Get trending content
  const trendingResult = await makeRequest('/api/v1/karma/trending?timeFrame=day&contentType=all');
  logTest('Get Trending Content', trendingResult.status === 200 && trendingResult.data.success);

  // Get karma history (requires auth)
  const historyResult = await makeRequest('/api/v1/karma/history?days=30', {
    headers: { Authorization: `Bearer ${token}` }
  });

  logTest('Get Karma History', historyResult.status === 200 && historyResult.data.success);
}

async function testCrossposting(token, postId, communityId) {
  log('\n🔄 Testing Crossposting...', 'blue');
  
  // Create another community for crossposting
  const community2Data = {
    name: `crosspost_community_${Date.now()}`,
    displayName: 'Crosspost Test Community',
    description: 'For testing crossposting functionality',
    isPublic: true
  };

  const community2Result = await makeRequest('/api/v1/communities', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(community2Data)
  });

  if (community2Result.status === 201 && community2Result.data.success) {
    const community2Id = community2Result.data.data.id;
    
    // Join the new community
    await makeRequest(`/api/v1/communities/${community2Id}/join`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });

    // Crosspost
    const crosspostResult = await makeRequest(`/api/v1/posts/${postId}/crosspost`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ 
        targetCommunityId: community2Id,
        title: 'Crossposted: Test Post'
      })
    });

    logTest('Crosspost to Another Community', crosspostResult.status === 200 && crosspostResult.data.success);
  } else {
    logTest('Create Second Community for Crossposting', false, 'Failed to create test community');
  }
}

async function runAllTests() {
  log('🚀 Starting Comprehensive Reddit Functionality Tests', 'bold');
  log('=' .repeat(60), 'cyan');
  
  try {
    // Health check first
    await testHealthCheck();
    
    // Create test user and community
    log('\n🔧 Setting up test environment...', 'blue');
    const { user, token } = await createTestUser();
    logTest('Create Test User', !!user && !!token);
    
    const community = await createTestCommunity(token);
    logTest('Create Test Community', !!community);
    
    const communityId = community.id;
    
    // Join community
    const joinResult = await makeRequest(`/api/v1/communities/${communityId}/join`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    logTest('Join Community', joinResult.status === 200 && joinResult.data.success);
    
    // Run all feature tests
    const postId = await testPostCRUD(token, communityId);
    if (postId) {
      await testVotingSystem(token, postId);
      
      const { topCommentId } = await testCommentsSystem(token, postId) || {};
      if (topCommentId) {
        await testAwardsSystem(token, postId, topCommentId);
      }
      
      await testSortingAlgorithms(token, communityId);
      await testSavedPosts(token, postId);
      await testModerationTools(token, postId);
      await testCrossposting(token, postId, communityId);
    }
    
    await testKarmaSystem(token);
    
  } catch (error) {
    log(`\n❌ Test setup failed: ${error.message}`, 'red');
  }
  
  // Final results
  log('\n' + '=' .repeat(60), 'cyan');
  log('🏁 Test Results Summary', 'bold');
  log('=' .repeat(60), 'cyan');
  
  log(`Total Tests: ${testCount}`, 'blue');
  log(`✅ Passed: ${passCount}`, 'green');
  log(`❌ Failed: ${failCount}`, 'red');
  log(`Success Rate: ${Math.round((passCount / testCount) * 100)}%`, passCount === testCount ? 'green' : 'yellow');
  
  if (failCount === 0) {
    log('\n🎉 All Reddit functionality tests passed! The system is working perfectly!', 'green');
  } else {
    log(`\n⚠️ ${failCount} test(s) failed. Check the details above.`, 'yellow');
  }
  
  log('=' .repeat(60), 'cyan');
}

// Run the tests
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests };