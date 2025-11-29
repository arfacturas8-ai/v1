#!/usr/bin/env node

const fastify = require('fastify')({ logger: false });

// In-memory storage for testing
const users = [];
const channels = [];
const messages = [];
const comments = [];
const uploads = [];

// Enable CORS
fastify.register(require('@fastify/cors'));

// Auth middleware simulation
function authMiddleware(request, reply, done) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ success: false, error: 'Unauthorized' });
  }
  
  const token = authHeader.split(' ')[1];
  const user = users.find(u => u.token === token);
  if (!user) {
    return reply.status(401).send({ success: false, error: 'Invalid token' });
  }
  
  request.userId = user.id;
  done();
}

// Health endpoint
fastify.get('/health', async (req, reply) => {
  return { status: 'healthy' };
});

// Auth endpoints
fastify.post('/api/auth/register', async (req, reply) => {
  const { email, password, username } = req.body || {};
  
  if (!email || !password || !username) {
    return reply.status(400).send({ error: 'Missing fields' });
  }
  
  const user = {
    id: Date.now().toString(),
    email,
    username,
    password,
    token: 'jwt_' + Date.now()
  };
  
  users.push(user);
  return { success: true, user, token: user.token };
});

// FIXED ROUTES - Based on our fixes

// GET /api/v1/channels - List channels for a server
fastify.get('/api/v1/channels', { preHandler: authMiddleware }, async (req, reply) => {
  const { serverId } = req.query;
  
  if (!serverId) {
    return reply.status(400).send({
      success: false,
      error: "serverId query parameter is required"
    });
  }

  // Simulate checking server membership
  // For demo, we'll create some mock channels if none exist
  if (channels.length === 0) {
    channels.push(
      { id: 'ch1', name: 'general', type: 'TEXT', serverId, position: 1 },
      { id: 'ch2', name: 'random', type: 'TEXT', serverId, position: 2 },
      { id: 'ch3', name: 'voice-1', type: 'VOICE', serverId, position: 3 }
    );
  }

  const serverChannels = channels.filter(ch => ch.serverId === serverId);
  
  return {
    success: true,
    data: serverChannels
  };
});

// GET /api/v1/messages - List messages in a channel
fastify.get('/api/v1/messages', { preHandler: authMiddleware }, async (req, reply) => {
  const { channelId, page = 1, limit = 50 } = req.query;
  
  if (!channelId) {
    return reply.status(400).send({
      success: false,
      error: "channelId query parameter is required"
    });
  }

  // Simulate some messages if none exist
  if (messages.length === 0) {
    messages.push(
      { 
        id: 'msg1', 
        content: 'Hello world!', 
        channelId, 
        userId: req.userId,
        createdAt: new Date().toISOString(),
        user: { id: req.userId, username: 'testuser' }
      },
      { 
        id: 'msg2', 
        content: 'This is a test message', 
        channelId, 
        userId: req.userId,
        createdAt: new Date().toISOString(),
        user: { id: req.userId, username: 'testuser' }
      }
    );
  }

  const channelMessages = messages.filter(msg => msg.channelId === channelId);
  
  return {
    success: true,
    data: {
      messages: channelMessages,
      pagination: {
        total: channelMessages.length,
        page: parseInt(page),
        pageSize: parseInt(limit),
        hasMore: false
      }
    }
  };
});

// GET /api/v1/comments - List comments
fastify.get('/api/v1/comments', async (req, reply) => {
  const { postId, limit = 50 } = req.query;

  // Simulate some comments if none exist
  if (comments.length === 0) {
    comments.push(
      { 
        id: 'comment1', 
        content: 'Great post!', 
        postId: postId || 'post1',
        userId: 'user1',
        createdAt: new Date().toISOString(),
        user: { id: 'user1', username: 'commenter' }
      },
      { 
        id: 'comment2', 
        content: 'I agree with this', 
        postId: postId || 'post1',
        userId: 'user2',
        createdAt: new Date().toISOString(),
        user: { id: 'user2', username: 'commenter2' }
      }
    );
  }

  let filteredComments = comments;
  if (postId) {
    filteredComments = comments.filter(comment => comment.postId === postId);
  }
  
  return {
    success: true,
    data: filteredComments.slice(0, parseInt(limit))
  };
});

// GET /api/v1/uploads - List uploaded files
fastify.get('/api/v1/uploads', { preHandler: authMiddleware }, async (req, reply) => {
  const { bucket = 'cryb-uploads', limit = 50 } = req.query;
  
  // Simulate some uploads if none exist
  if (uploads.length === 0) {
    uploads.push(
      { 
        id: 'upload1', 
        filename: 'test-image.jpg', 
        bucket,
        userId: req.userId,
        uploadedAt: new Date().toISOString(),
        size: 1024000,
        contentType: 'image/jpeg'
      },
      { 
        id: 'upload2', 
        filename: 'document.pdf', 
        bucket,
        userId: req.userId,
        uploadedAt: new Date().toISOString(),
        size: 2048000,
        contentType: 'application/pdf'
      }
    );
  }

  const userUploads = uploads.filter(upload => upload.userId === req.userId);
  
  return {
    success: true,
    data: {
      files: userUploads.slice(0, parseInt(limit)),
      bucket,
      count: userUploads.length
    }
  };
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3002, host: '0.0.0.0' });
    console.log('🚀 Simple Test Server running on http://localhost:3002');
    console.log('✅ Test endpoints:');
    console.log('   - GET  /health');
    console.log('   - POST /api/auth/register');
    console.log('   - GET  /api/v1/channels?serverId=test');
    console.log('   - GET  /api/v1/messages?channelId=test');
    console.log('   - GET  /api/v1/comments');
    console.log('   - GET  /api/v1/uploads');
    console.log('');
    console.log('🧪 Test with: curl -H "Authorization: Bearer TOKEN" http://localhost:3002/api/v1/channels?serverId=test');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();