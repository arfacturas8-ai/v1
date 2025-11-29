const fastify = require('fastify')({ logger: true });

// Test server for debugging
fastify.register(require('@fastify/cors'), {
  origin: true,
  credentials: true
});

// Health check
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Test registration endpoint
fastify.post('/auth/register', async (request, reply) => {
  console.log('Registration request body:', request.body);
  
  const { username, displayName, email, password } = request.body || {};
  
  // Validation
  if (!username || !displayName) {
    return reply.code(400).send({
      success: false,
      error: 'Username and displayName are required'
    });
  }
  
  // Simple validation for testing
  if (username.length < 3) {
    return reply.code(400).send({
      success: false,
      error: 'Username must be at least 3 characters'
    });
  }
  
  if (displayName.length < 1) {
    return reply.code(400).send({
      success: false,
      error: 'Display name is required'
    });
  }
  
  // Mock successful registration
  return reply.code(201).send({
    success: true,
    message: 'Registration successful',
    data: {
      user: {
        id: 'test-user-id',
        username,
        displayName,
        email,
        isVerified: false
      },
      tokens: {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      }
    }
  });
});

// Test search endpoint
fastify.get('/search', async (request, reply) => {
  console.log('Search request query:', request.query);
  
  const { q } = request.query || {};
  
  if (!q) {
    return reply.code(400).send({
      success: false,
      error: 'Search query parameter "q" is required'
    });
  }
  
  // Mock search results
  return reply.send({
    success: true,
    data: {
      users: {
        items: [
          {
            id: 'user1',
            username: 'testuser',
            displayName: 'Test User',
            avatar: null
          }
        ],
        total: 1,
        source: 'mock'
      }
    },
    query: q,
    searchMeta: {
      searchEngine: 'mock',
      searchTime: '5ms',
      totalSources: 1
    }
  });
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3002, host: '0.0.0.0' });
    console.log('🚀 Test API Server running on http://0.0.0.0:3002');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
