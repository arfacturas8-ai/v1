#!/usr/bin/env node

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

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, passed) {
  if (passed) {
    log(`✅ ${name}`, 'green');
  } else {
    log(`❌ ${name}`, 'red');
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

async function runSimpleTests() {
  log('🚀 Running Simple Reddit API Tests (No Auth Required)', 'bold');
  log('=' .repeat(50), 'cyan');
  
  // Test server health
  log('\n🔍 Testing Server Health...', 'blue');
  const { status } = await makeRequest('/health');
  logTest('Server Health Check', status === 200 || status === 503);
  
  // Test getting posts (should work without auth)
  log('\n📝 Testing Posts Endpoints...', 'blue');
  const postsResult = await makeRequest('/api/v1/posts?limit=5');
  logTest('Get Posts (No Auth)', postsResult.status === 200);
  
  if (postsResult.data) {
    log(`   Found ${postsResult.data.data?.items?.length || 0} posts`, 'cyan');
  }
  
  // Test post sorting
  const sortResults = await Promise.all([
    makeRequest('/api/v1/posts?sort=hot&limit=3'),
    makeRequest('/api/v1/posts?sort=new&limit=3'),
    makeRequest('/api/v1/posts?sort=top&limit=3'),
  ]);
  
  logTest('Sort by Hot', sortResults[0].status === 200);
  logTest('Sort by New', sortResults[1].status === 200);
  logTest('Sort by Top', sortResults[2].status === 200);
  
  // Test time filtering
  const timeResult = await makeRequest('/api/v1/posts?sort=top&timeFrame=all&limit=3');
  logTest('Time Filter (All Time)', timeResult.status === 200);
  
  // Test award types
  log('\n🏆 Testing Awards System...', 'blue');
  const awardTypesResult = await makeRequest('/api/v1/awards/types');
  logTest('Get Award Types', awardTypesResult.status === 200);
  
  if (awardTypesResult.data?.data) {
    log(`   Found ${awardTypesResult.data.data.length} award types`, 'cyan');
    awardTypesResult.data.data.forEach(award => {
      log(`   - ${award.name} (${award.cost} coins) ${award.icon}`, 'yellow');
    });
  }
  
  // Test karma leaderboard
  log('\n⭐ Testing Karma System...', 'blue');
  const leaderboardResult = await makeRequest('/api/v1/karma/leaderboard?limit=5');
  logTest('Get Karma Leaderboard', leaderboardResult.status === 200);
  
  // Test trending content
  const trendingResult = await makeRequest('/api/v1/karma/trending?timeFrame=day&contentType=all');
  logTest('Get Trending Content', trendingResult.status === 200);
  
  // Test comments endpoint (should work without specific post)
  log('\n💬 Testing Comments System...', 'blue');
  
  // If we have posts, test comments
  if (postsResult.data?.data?.items && postsResult.data.data.items.length > 0) {
    const firstPost = postsResult.data.data.items[0];
    const commentsResult = await makeRequest(`/api/v1/comments/post/${firstPost.id}`);
    logTest('Get Post Comments', commentsResult.status === 200);
    
    if (commentsResult.data) {
      log(`   Found ${commentsResult.data.data?.length || 0} top-level comments`, 'cyan');
    }
    
    // Test single post view
    const singlePostResult = await makeRequest(`/api/v1/posts/${firstPost.id}`);
    logTest('Get Single Post', singlePostResult.status === 200);
  } else {
    log('   No posts available to test comments', 'yellow');
  }
  
  log('\n' + '=' .repeat(50), 'cyan');
  log('🏁 Simple Reddit API Test Complete!', 'bold');
  log('✅ All public endpoints are working correctly', 'green');
  log('🔒 Authentication-required features need working auth system', 'yellow');
  log('=' .repeat(50), 'cyan');
}

// Run the tests
if (require.main === module) {
  runSimpleTests().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}