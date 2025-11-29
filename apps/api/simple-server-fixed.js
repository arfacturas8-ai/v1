const fastify = require('fastify');

// Create Fastify server
const server = fastify({
  logger: true,
  trustProxy: true,
  bodyLimit: 50 * 1024 * 1024
});

// Register JSON parser (this is the key fix for JSON parsing issues)
server.addContentTypeParser('application/json', { parseAs: 'string' }, function (req, body, done) {
  try {
    // Handle empty body
    if (!body || body.trim() === '') {
      return done(null, {});
    }
    
    // Parse JSON with proper error handling
    const json = JSON.parse(body);
    done(null, json);
  } catch (err) {
    console.error('JSON parsing error:', err);
    console.error('Raw body:', body);
    err.statusCode = 400;
    err.message = 'Body is not valid JSON';
    done(err, undefined);
  }
});

// CORS
server.register(require('@fastify/cors'), {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
});

// Health check endpoint
server.get('/health', async (request, reply) => {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      api: 'healthy'
    }
  };
});

// Simple registration endpoint for testing
server.post('/api/v1/auth/register', async (request, reply) => {
  try {
    console.log('Registration request received');
    console.log('Headers:', request.headers);
    console.log('Raw body:', request.body);
    
    const { username, displayName, email, password } = request.body || {};
    
    // Basic validation
    if (!username || !displayName) {
      return reply.code(400).send({
        success: false,
        error: 'Username and display name are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }
    
    // Mock successful registration
    return reply.code(201).send({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: 'test-user-' + Date.now(),
          username,
          displayName,
          email: email || null,
          isVerified: false
        },
        tokens: {
          accessToken: 'test-access-token-' + Date.now(),
          refreshToken: 'test-refresh-token-' + Date.now(),
          expiresAt: new Date(Date.now() + 3600000).toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return reply.code(500).send({
      success: false,
      error: 'Registration failed due to internal error',
      code: 'REGISTRATION_ERROR'
    });
  }
});

// Simple login endpoint for testing
server.post('/api/v1/auth/login', async (request, reply) => {
  try {
    console.log('Login request received');
    console.log('Headers:', request.headers);
    console.log('Body:', request.body);
    
    const { username, email, password } = request.body || {};
    
    if ((!username && !email) || !password) {
      return reply.code(400).send({
        success: false,
        error: 'Username/email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }
    
    // Mock successful login
    return reply.send({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: 'test-user-123',
          username: username || 'test-user',
          displayName: 'Test User',
          email: email || null,
          isVerified: true
        },
        tokens: {
          accessToken: 'test-access-token-' + Date.now(),
          refreshToken: 'test-refresh-token-' + Date.now(),
          expiresAt: new Date(Date.now() + 3600000).toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return reply.code(500).send({
      success: false,
      error: 'Login failed due to internal error',
      code: 'LOGIN_ERROR'
    });
  }
});

// Start server
async function start() {
  try {
    const PORT = process.env.PORT || 3001;
    const HOST = process.env.HOST || '0.0.0.0';
    
    await server.listen({ port: PORT, host: HOST });
    
    console.log(`🚀 Fixed API Server started successfully!`);
    console.log(`📡 Server listening at http://${HOST}:${PORT}`);
    console.log(`🔍 Health check: http://${HOST}:${PORT}/health`);
    console.log('');
    console.log('Test endpoints:');
    console.log('- POST http://localhost:3001/api/v1/auth/register');
    console.log('- POST http://localhost:3001/api/v1/auth/login');
    console.log('- GET  http://localhost:3001/health');
    
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

start();