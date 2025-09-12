const fastify = require('fastify')({ logger: true });

// Add basic CORS
fastify.register(require('@fastify/cors'), {
  origin: true,
  credentials: true
});

// Basic health check
fastify.get('/health', async (request, reply) => {
  return { status: 'healthy', timestamp: new Date().toISOString() };
});

// Test registration endpoint (simple version)
fastify.post('/auth/register', async (request, reply) => {
  const { username, displayName, email, password } = request.body || {};
  
  if (!username || !displayName) {
    return reply.code(400).send({
      error: 'Username and display name are required'
    });
  }
  
  return reply.code(201).send({
    success: true,
    message: 'Registration endpoint working',
    data: {
      username,
      displayName,
      email
    }
  });
});

// Test login endpoint (simple version)
fastify.post('/auth/login', async (request, reply) => {
  const { username, email, password } = request.body || {};
  
  if ((!username && !email) || !password) {
    return reply.code(400).send({
      error: 'Username/email and password are required'
    });
  }
  
  return reply.code(200).send({
    success: true,
    message: 'Login endpoint working',
    data: {
      user: { username: username || 'test', email: email || 'test@example.com' },
      token: 'test-token'
    }
  });
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('🚀 Test server started on port 3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();