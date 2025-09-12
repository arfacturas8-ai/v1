require('dotenv').config();
const Fastify = require('fastify');
const cors = require('@fastify/cors');
const { prisma } = require('@cryb/database');
const fastify = Fastify({ logger: true });

// Register CORS
fastify.register(cors, {
  origin: true,
  credentials: true
});

// Register basic routes
fastify.register(async function (fastify) {
  // Health check
  fastify.get('/health', async (request, reply) => {
    try {
      // Test database connection
      await prisma.$queryRaw`SELECT 1`;
      return { 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        database: 'connected'
      };
    } catch (error) {
      return reply.code(503).send({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.message
      });
    }
  });

  // Registration endpoint
  fastify.post('/auth/register', async (request, reply) => {
    const { username, displayName, email, password } = request.body || {};
    
    if (!username || !displayName) {
      return reply.code(400).send({
        success: false,
        error: 'Username and display name are required'
      });
    }
    
    try {
      // Check if user exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: username },
            { email: email }
          ]
        }
      });
      
      if (existingUser) {
        return reply.code(409).send({
          success: false,
          error: 'User already exists with this username or email'
        });
      }
      
      // Create user (for now without password hashing for testing)
      const newUser = await prisma.user.create({
        data: {
          username,
          displayName,
          email,
          passwordHash: password, // In production, hash this!
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true,
          createdAt: true
        }
      });
      
      return reply.code(201).send({
        success: true,
        data: {
          user: newUser,
          message: 'User registered successfully'
        }
      });
      
    } catch (error) {
      console.error('Registration error:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error during registration'
      });
    }
  });

  // Login endpoint
  fastify.post('/auth/login', async (request, reply) => {
    const { username, email, password } = request.body || {};
    
    if ((!username && !email) || !password) {
      return reply.code(400).send({
        success: false,
        error: 'Username/email and password are required'
      });
    }
    
    try {
      // Find user
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { username: username },
            { email: email }
          ]
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true,
          passwordHash: true
        }
      });
      
      if (!user || user.passwordHash !== password) {
        return reply.code(401).send({
          success: false,
          error: 'Invalid credentials'
        });
      }
      
      return reply.code(200).send({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            email: user.email
          },
          token: 'simple-jwt-token-' + user.id
        }
      });
      
    } catch (error) {
      console.error('Login error:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error during login'
      });
    }
  });
});

// Start server
const start = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    await fastify.listen({ 
      port: parseInt(process.env.PORT || '3001'), 
      host: process.env.HOST || '0.0.0.0' 
    });
    
    console.log('🚀 CRYB API Server started successfully!');
    console.log(`📡 Server listening at http://localhost:${process.env.PORT || 3001}`);
    console.log('📚 Endpoints available:');
    console.log('  - GET  /health');
    console.log('  - POST /auth/register');
    console.log('  - POST /auth/login');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();