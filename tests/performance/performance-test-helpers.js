const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// Test data generators
function generateUserData(requestParams, context, ee, next) {
  const timestamp = Date.now();
  const randomId = crypto.randomBytes(4).toString('hex');
  
  context.vars.uniqueUsername = `perftest_${randomId}_${timestamp}`;
  context.vars.uniqueEmail = `perftest_${randomId}_${timestamp}@loadtest.com`;
  context.vars.strongPassword = 'LoadTest123!@#';
  context.vars.displayName = `Performance Test User ${randomId}`;
  
  return next();
}

function generatePostData(requestParams, context, ee, next) {
  const titles = [
    'Performance Testing Discussion',
    'Load Test Results Analysis',
    'Scalability Benchmarks',
    'Platform Stress Test',
    'API Performance Metrics',
    'Database Load Testing',
    'Real-time Features Performance',
    'Mobile App Responsiveness',
    'Search Functionality Speed',
    'File Upload Performance'
  ];
  
  const contentTemplates = [
    'This is a comprehensive performance test post designed to evaluate system behavior under load. Generated at timestamp: {}',
    'Load testing reveals important insights about platform scalability and user experience. Test iteration: {}',
    'Performance metrics indicate system behavior under various load conditions. Benchmark ID: {}',
    'Stress testing helps identify bottlenecks and optimization opportunities. Test session: {}',
    'Platform performance analysis shows response times and throughput characteristics. Run: {}'
  ];
  
  const postTypes = ['text', 'link'];
  const communities = ['1', '2', '3', '4', '5']; // Assuming these exist
  const tags = [
    ['performance', 'testing'],
    ['load', 'benchmark'],
    ['scalability', 'metrics'],
    ['stress', 'analysis'],
    ['optimization', 'speed']
  ];
  
  const randomTitle = titles[Math.floor(Math.random() * titles.length)];
  const randomContent = contentTemplates[Math.floor(Math.random() * contentTemplates.length)];
  const randomType = postTypes[Math.floor(Math.random() * postTypes.length)];
  const randomCommunity = communities[Math.floor(Math.random() * communities.length)];
  const randomTags = tags[Math.floor(Math.random() * tags.length)];
  const timestamp = Date.now();
  
  context.vars.postTitle = `${randomTitle} - ${timestamp}`;
  context.vars.postContent = randomContent.replace('{}', timestamp);
  context.vars.postType = randomType;
  context.vars.randomCommunityId = randomCommunity;
  context.vars.postTags = randomTags;
  
  // For link posts, add URL
  if (randomType === 'link') {
    context.vars.postUrl = `https://example.com/article-${timestamp}`;
  }
  
  return next();
}

function generateCommentData(requestParams, context, ee, next) {
  const commentTemplates = [
    'Excellent analysis of platform performance. The metrics show {}',
    'Load testing results are very insightful. Timestamp: {}',
    'Performance benchmarks indicate {} behavior under stress',
    'This stress test reveals important optimization opportunities: {}',
    'System scalability metrics demonstrate {} characteristics'
  ];
  
  const insights = [
    'consistent response times',
    'good throughput',
    'stable performance',
    'efficient resource usage',
    'excellent scalability',
    'robust error handling',
    'fast query execution',
    'optimal caching',
    'smooth user experience',
    'reliable system behavior'
  ];
  
  const randomTemplate = commentTemplates[Math.floor(Math.random() * commentTemplates.length)];
  const randomInsight = insights[Math.floor(Math.random() * insights.length)];
  const timestamp = Date.now();
  
  context.vars.commentContent = randomTemplate.replace('{}', randomInsight);
  
  // Randomly assign parent comment for threading (30% chance)
  if (Math.random() < 0.3 && context.vars.availableCommentIds && context.vars.availableCommentIds.length > 0) {
    const randomParent = context.vars.availableCommentIds[
      Math.floor(Math.random() * context.vars.availableCommentIds.length)
    ];
    context.vars.parentCommentId = randomParent;
  } else {
    context.vars.parentCommentId = null;
  }
  
  return next();
}

function generateSearchTerms(requestParams, context, ee, next) {
  const searchTerms = [
    'performance',
    'testing',
    'load',
    'benchmark',
    'scalability',
    'optimization',
    'metrics',
    'analysis',
    'stress',
    'throughput',
    'response time',
    'user experience',
    'database',
    'api',
    'real-time',
    'mobile',
    'web',
    'platform'
  ];
  
  const userSearchTerms = [
    'perftest',
    'loadtest',
    'admin',
    'moderator',
    'user',
    'test'
  ];
  
  const communitySearchTerms = [
    'general',
    'technology',
    'gaming',
    'music',
    'art',
    'science',
    'performance',
    'testing'
  ];
  
  context.vars.randomSearchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  context.vars.userSearchTerm = userSearchTerms[Math.floor(Math.random() * userSearchTerms.length)];
  context.vars.communitySearchTerm = communitySearchTerms[Math.floor(Math.random() * communitySearchTerms.length)];
  
  // Complex search query
  const term1 = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  const term2 = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  context.vars.complexSearchQuery = `${term1} AND ${term2}`;
  
  // Search parameters
  context.vars.searchAuthor = `perftest_${Math.floor(Math.random() * 1000)}`;
  context.vars.searchCommunity = `community_${Math.floor(Math.random() * 10) + 1}`;
  
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  context.vars.searchDateFrom = weekAgo.toISOString().split('T')[0];
  context.vars.searchDateTo = now.toISOString().split('T')[0];
  
  return next();
}

function generateImageFile(requestParams, context, ee, next) {
  // Generate a small test image buffer (1x1 pixel PNG)
  const imageBuffer = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
    0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
    0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
    0x42, 0x60, 0x82
  ]);
  
  context.vars.imageFile = {
    value: imageBuffer,
    options: {
      filename: `test-image-${Date.now()}.png`,
      contentType: 'image/png'
    }
  };
  
  return next();
}

function generateVideoFile(requestParams, context, ee, next) {
  // Generate a small test video buffer (minimal valid MP4 header)
  const videoBuffer = Buffer.alloc(1024); // Small 1KB buffer
  videoBuffer.write('ftypmp4', 4); // MP4 file type
  
  context.vars.videoFile = {
    value: videoBuffer,
    options: {
      filename: `test-video-${Date.now()}.mp4`,
      contentType: 'video/mp4'
    }
  };
  
  return next();
}

function generateMultipleFiles(requestParams, context, ee, next) {
  const fileCount = Math.floor(Math.random() * 3) + 1; // 1-3 files
  const files = [];
  
  for (let i = 0; i < fileCount; i++) {
    const fileBuffer = Buffer.from(`Test file content ${i} - ${Date.now()}`);
    files.push({
      value: fileBuffer,
      options: {
        filename: `test-file-${i}-${Date.now()}.txt`,
        contentType: 'text/plain'
      }
    });
  }
  
  context.vars.fileArray = files;
  return next();
}

// Authentication helper
function authenticateTestUser(requestParams, context, ee, next) {
  // Use a pre-existing test user for authenticated requests
  const testUsers = [
    {
      email: 'loadtest1@example.com',
      password: 'LoadTest123!',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // Mock token
    },
    {
      email: 'loadtest2@example.com', 
      password: 'LoadTest123!',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // Mock token
    }
  ];
  
  const randomUser = testUsers[Math.floor(Math.random() * testUsers.length)];
  context.vars.authToken = randomUser.token;
  context.vars.testUserEmail = randomUser.email;
  
  return next();
}

// Random data generators
function setRandomValues(requestParams, context, ee, next) {
  // Vote types
  const voteTypes = ['upvote', 'downvote'];
  context.vars.randomVoteType = voteTypes[Math.floor(Math.random() * voteTypes.length)];
  
  // Sort options
  const sortOptions = ['hot', 'new', 'top', 'controversial'];
  context.vars.randomSort = sortOptions[Math.floor(Math.random() * sortOptions.length)];
  
  // Random pagination offset
  context.vars.randomOffset = Math.floor(Math.random() * 100);
  
  // Random server and channel IDs
  context.vars.randomServerId = Math.floor(Math.random() * 5) + 1;
  context.vars.randomChannelId = Math.floor(Math.random() * 10) + 1;
  context.vars.voiceChannelId = Math.floor(Math.random() * 3) + 1;
  
  // Random emojis for reactions
  const emojis = ['👍', '👎', '❤️', '😂', '😮', '😢', '😡'];
  context.vars.randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
  
  // Random categories
  const categories = ['technology', 'gaming', 'music', 'art', 'science', 'sports'];
  context.vars.randomCategory = categories[Math.floor(Math.random() * categories.length)];
  
  return next();
}

// Error handling and logging
function logError(requestParams, context, ee, next) {
  if (context.vars.$response && context.vars.$response.statusCode >= 400) {
    console.log(`Error ${context.vars.$response.statusCode}: ${requestParams.url}`);
    console.log('Response:', context.vars.$response.body);
  }
  return next();
}

function logSuccessfulRequest(requestParams, context, ee, next) {
  if (context.vars.$response && context.vars.$response.statusCode < 400) {
    const responseTime = context.vars.$response.timings.total;
    if (responseTime > 2000) { // Log slow requests
      console.log(`Slow request (${responseTime}ms): ${requestParams.url}`);
    }
  }
  return next();
}

// Capture common response data for chaining requests
function captureResponseData(requestParams, context, ee, next) {
  if (context.vars.$response) {
    try {
      const responseBody = JSON.parse(context.vars.$response.body);
      
      // Capture post IDs for voting/commenting
      if (responseBody.post && responseBody.post.id) {
        if (!context.vars.availablePostIds) {
          context.vars.availablePostIds = [];
        }
        context.vars.availablePostIds.push(responseBody.post.id);
        context.vars.lastPostId = responseBody.post.id;
      }
      
      // Capture comment IDs for threading
      if (responseBody.comment && responseBody.comment.id) {
        if (!context.vars.availableCommentIds) {
          context.vars.availableCommentIds = [];
        }
        context.vars.availableCommentIds.push(responseBody.comment.id);
        context.vars.lastCommentId = responseBody.comment.id;
      }
      
      // Capture message IDs for reactions
      if (responseBody.message && responseBody.message.id) {
        context.vars.lastMessageId = responseBody.message.id;
      }
      
      // Capture community IDs
      if (responseBody.community && responseBody.community.id) {
        context.vars.lastCommunityId = responseBody.community.id;
      }
      
    } catch (e) {
      // Ignore JSON parsing errors
    }
  }
  return next();
}

// WebSocket message handlers
function handleWebSocketMessage(message, context, ee, next) {
  try {
    const data = JSON.parse(message);
    
    // Handle different message types
    switch (data.event) {
      case 'new-message':
        if (data.message && data.message.id) {
          context.vars.lastMessageId = data.message.id;
        }
        break;
      
      case 'user-joined':
        context.vars.activeUsers = (context.vars.activeUsers || 0) + 1;
        break;
      
      case 'user-left':
        context.vars.activeUsers = Math.max((context.vars.activeUsers || 1) - 1, 0);
        break;
      
      case 'voice-state-update':
        context.vars.voiceConnected = data.connected;
        break;
    }
  } catch (e) {
    // Ignore parsing errors
  }
  
  return next();
}

// Performance monitoring helpers
function trackCustomMetrics(requestParams, context, ee, next) {
  const startTime = Date.now();
  
  // Track request start time for custom metrics
  context.vars._requestStartTime = startTime;
  
  return next();
}

function recordCustomMetrics(requestParams, context, ee, next) {
  if (context.vars._requestStartTime && context.vars.$response) {
    const responseTime = Date.now() - context.vars._requestStartTime;
    const endpoint = requestParams.url.replace(/\/\d+/g, '/:id'); // Normalize IDs
    
    // Emit custom metrics
    ee.emit('counter', `response_time.${endpoint}`, responseTime);
    ee.emit('counter', `status_code.${context.vars.$response.statusCode}`, 1);
    
    if (context.vars.$response.statusCode >= 400) {
      ee.emit('counter', 'errors.total', 1);
      ee.emit('counter', `errors.${endpoint}`, 1);
    }
  }
  
  return next();
}

module.exports = {
  generateUserData,
  generatePostData,
  generateCommentData,
  generateSearchTerms,
  generateImageFile,
  generateVideoFile,
  generateMultipleFiles,
  authenticateTestUser,
  setRandomValues,
  logError,
  logSuccessfulRequest,
  captureResponseData,
  handleWebSocketMessage,
  trackCustomMetrics,
  recordCustomMetrics
};