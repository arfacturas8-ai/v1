#!/usr/bin/env node

const axios = require('axios');
const { io } = require('socket.io-client');

const API_URL = 'http://localhost:3001/api/v1';
const SOCKET_URL = 'http://localhost:3001';
const WEB_URL = 'http://localhost:3003';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.yellow}ℹ️  ${msg}${colors.reset}`)
};

async function testAPIs() {
  console.log('\n=== TESTING API CONNECTIONS ===\n');
  
  let token = '';
  let userId = '';
  
  // 1. Health Check
  try {
    const health = await axios.get(`${API_URL.replace('/api/v1', '')}/health`);
    log.success(`Health check passed: ${health.data.status}`);
  } catch (error) {
    log.error(`Health check failed: ${error.message}`);
  }

  // 2. Public endpoints
  try {
    const posts = await axios.get(`${API_URL}/posts`);
    log.success(`Posts endpoint: ${posts.data.data.total} posts found`);
  } catch (error) {
    log.error(`Posts endpoint failed: ${error.message}`);
  }

  try {
    const communities = await axios.get(`${API_URL}/communities`);
    log.success(`Communities endpoint: ${communities.data.data.total} communities found`);
  } catch (error) {
    log.error(`Communities endpoint failed: ${error.message}`);
  }

  // 3. Authentication
  try {
    const login = await axios.post(`${API_URL}/auth/login`, {
      username: 'testuser1734624001',
      password: 'Test123456!'
    });
    
    if (login.data.success) {
      token = login.data.data.tokens.accessToken;
      userId = login.data.data.user.id;
      log.success(`Login successful: ${login.data.data.user.username}`);
    } else {
      log.error(`Login failed: ${login.data.error}`);
    }
  } catch (error) {
    log.error(`Login error: ${error.message}`);
  }

  // 4. Protected routes
  if (token) {
    try {
      const profile = await axios.get(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      log.success(`Protected route (profile): ${profile.data.data.username}`);
    } catch (error) {
      log.error(`Protected route failed: ${error.message}`);
    }

    // 5. Create content
    try {
      const community = await axios.post(`${API_URL}/communities`, {
        name: `test${Date.now()}`,
        displayName: 'Test Community',
        description: 'Testing connections'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (community.data.success) {
        log.success(`Community created: ${community.data.data.name}`);
        
        // Create post in community
        const post = await axios.post(`${API_URL}/posts`, {
          communityId: community.data.data.id,
          title: 'Test Post',
          content: 'Testing all connections'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (post.data.success) {
          log.success(`Post created: ${post.data.data.title}`);
        }
      }
    } catch (error) {
      log.error(`Content creation failed: ${error.message}`);
    }
  }

  return { token, userId };
}

async function testSocket(token) {
  console.log('\n=== TESTING SOCKET.IO CONNECTION ===\n');
  
  return new Promise((resolve) => {
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    const timeout = setTimeout(() => {
      log.error('Socket connection timeout');
      socket.disconnect();
      resolve(false);
    }, 5000);

    socket.on('connect', () => {
      clearTimeout(timeout);
      log.success(`Socket connected: ${socket.id}`);
      
      // Test emit
      socket.emit('heartbeat');
      
      setTimeout(() => {
        socket.disconnect();
        resolve(true);
      }, 1000);
    });

    socket.on('error', (error) => {
      log.error(`Socket error: ${error}`);
      clearTimeout(timeout);
      socket.disconnect();
      resolve(false);
    });

    socket.on('heartbeat_ack', () => {
      log.success('Heartbeat acknowledged');
    });
  });
}

async function testWeb() {
  console.log('\n=== TESTING WEB FRONTEND ===\n');
  
  try {
    const response = await axios.get(WEB_URL);
    if (response.status === 200) {
      log.success('Web frontend is accessible');
    }
  } catch (error) {
    log.error(`Web frontend error: ${error.message}`);
  }

  // Test specific pages
  const pages = ['/test-api', '/test-socket', '/login', '/communities'];
  for (const page of pages) {
    try {
      const response = await axios.get(`${WEB_URL}${page}`);
      if (response.status === 200) {
        log.success(`Page ${page} is accessible`);
      }
    } catch (error) {
      log.info(`Page ${page}: ${error.response?.status || error.message}`);
    }
  }
}

async function main() {
  console.log('\n' + '='.repeat(50));
  console.log('   CRYB PLATFORM - CONNECTION TEST SUITE');
  console.log('='.repeat(50));

  const { token } = await testAPIs();
  await testSocket(token);
  await testWeb();

  console.log('\n' + '='.repeat(50));
  console.log('   TEST COMPLETE');
  console.log('='.repeat(50) + '\n');

  process.exit(0);
}

main().catch(console.error);