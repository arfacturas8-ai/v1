const axios = require('axios');

// Store authenticated users and created content for reuse
const authenticatedUsers = [];
const createdPosts = [];
const createdCommunities = [];

module.exports = {
  authenticateUser,
  getRandomPost,
  getRandomCommunity,
  createTestUser,
  cleanup
};

async function authenticateUser(context, events, done) {
  try {
    // Reuse existing authenticated user if available
    if (authenticatedUsers.length > 0 && Math.random() > 0.3) {
      const user = authenticatedUsers[Math.floor(Math.random() * authenticatedUsers.length)];
      context.vars.authToken = user.token;
      context.vars.userId = user.id;
      return done();
    }

    // Create new user
    const userSuffix = Date.now() + Math.random().toString(36).substr(2, 9);
    const userData = {
      username: `loadtest_${userSuffix}`,
      email: `loadtest_${userSuffix}@example.com`,
      password: 'LoadTest123!'
    };

    const registerResponse = await axios.post(`${context.target}/api/auth/register`, userData);
    
    if (registerResponse.status === 201) {
      const user = {
        id: registerResponse.data.user.id,
        token: registerResponse.data.token,
        username: userData.username,
        email: userData.email
      };

      authenticatedUsers.push(user);
      context.vars.authToken = user.token;
      context.vars.userId = user.id;
      
      // Limit stored users to prevent memory issues
      if (authenticatedUsers.length > 100) {
        authenticatedUsers.splice(0, 50);
      }
    } else {
      // Try to login with existing user
      const loginResponse = await axios.post(`${context.target}/api/auth/login`, {
        email: userData.email,
        password: userData.password
      });
      
      if (loginResponse.status === 200) {
        context.vars.authToken = loginResponse.data.token;
        context.vars.userId = loginResponse.data.user.id;
      }
    }
  } catch (error) {
    // Handle errors gracefully in load testing
    console.warn('Authentication error (expected in load testing):', error.message);
  }
  
  done();
}

async function getRandomPost(context, events, done) {
  try {
    if (createdPosts.length === 0) {
      // Fetch some posts from API
      const response = await axios.get(`${context.target}/api/posts?limit=20`);
      if (response.data.posts && response.data.posts.length > 0) {
        createdPosts.push(...response.data.posts.map(p => p.id));
      }
    }

    if (createdPosts.length > 0) {
      const randomPost = createdPosts[Math.floor(Math.random() * createdPosts.length)];
      context.vars.postId = randomPost;
      context.vars.voteType = Math.random() > 0.5 ? 'upvote' : 'downvote';
    }
  } catch (error) {
    console.warn('Error getting random post:', error.message);
  }
  
  done();
}

async function getRandomCommunity(context, events, done) {
  try {
    if (createdCommunities.length === 0) {
      // Fetch some communities from API
      const response = await axios.get(`${context.target}/api/communities?limit=20`);
      if (response.data.communities && response.data.communities.length > 0) {
        createdCommunities.push(...response.data.communities.map(c => c.id));
      }
    }

    if (createdCommunities.length > 0) {
      const randomCommunity = createdCommunities[Math.floor(Math.random() * createdCommunities.length)];
      context.vars.communityId = randomCommunity;
    }
  } catch (error) {
    console.warn('Error getting random community:', error.message);
  }
  
  done();
}

async function createTestUser(context, events, done) {
  try {
    const userSuffix = Date.now() + Math.random().toString(36).substr(2, 9);
    const userData = {
      username: `perftest_${userSuffix}`,
      email: `perftest_${userSuffix}@example.com`,
      password: 'PerfTest123!'
    };

    const response = await axios.post(`${context.target}/api/auth/register`, userData);
    
    if (response.status === 201) {
      context.vars.newUserId = response.data.user.id;
      context.vars.newUserToken = response.data.token;
    }
  } catch (error) {
    console.warn('Error creating test user:', error.message);
  }
  
  done();
}

async function cleanup(context, events, done) {
  // Cleanup function can be implemented to remove test data
  // For now, we'll just log the cleanup attempt
  console.log('Cleanup completed for load test session');
  done();
}

// Helper function to generate realistic test data
function generateRealisticContent() {
  const titles = [
    'Amazing discovery in quantum computing',
    'New social media trends emerging',
    'Climate change solutions that work',
    'Tech industry insights for 2024',
    'Best practices for remote work',
    'Gaming community discussions',
    'Cryptocurrency market analysis',
    'AI and machine learning updates',
    'Web development tutorials',
    'Health and wellness tips'
  ];

  const contents = [
    'This is a detailed discussion about recent developments...',
    'I wanted to share my thoughts on this important topic...',
    'Has anyone else noticed the changes in...',
    'Looking for feedback on this approach...',
    'Sharing some insights from my recent experience...',
    'This trend has been gaining momentum lately...',
    'What are your thoughts on the future of...',
    'Breaking down the complex aspects of...',
    'A comprehensive guide to understanding...',
    'Recent research suggests that...'
  ];

  return {
    title: titles[Math.floor(Math.random() * titles.length)],
    content: contents[Math.floor(Math.random() * contents.length)]
  };
}

// Export helper for use in other test files
module.exports.generateRealisticContent = generateRealisticContent;