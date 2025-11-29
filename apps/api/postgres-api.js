const fastify = require('fastify')({ 
  logger: true,
  bodyLimit: 10485760
});

const { Pool } = require('pg');

// PostgreSQL connection with connection pooling
const pool = new Pool({
  user: 'cryb_user',
  host: 'localhost',
  database: 'cryb_platform',
  password: 'cryb_secure_pass_2024',
  port: 5432,
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000, // Close connections after 30 seconds of inactivity
  connectionTimeoutMillis: 10000, // 10 second timeout for new connections
});

// Test database connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error connecting to PostgreSQL:', err);
    process.exit(1);
  } else {
    console.log('✅ PostgreSQL connected successfully!');
    release();
  }
});

// Enable CORS for all origins
fastify.register(require('@fastify/cors'), {
  origin: true,
  credentials: true
});

// Fix JSON parsing with custom parser
fastify.addContentTypeParser('application/json', { parseAs: 'string' }, function (req, body, done) {
  try {
    const json = JSON.parse(body);
    done(null, json);
  } catch (err) {
    err.statusCode = 400;
    done(err, undefined);
  }
});

// Utility function to generate unique IDs
const generateId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// AUTH ENDPOINTS
fastify.post('/api/auth/register', async (req, reply) => {
  const { email, password, username } = req.body || {};
  
  if (!email || !password || !username) {
    return reply.status(400).send({ error: 'Missing required fields' });
  }
  
  const client = await pool.connect();
  try {
    // Check if user exists
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return reply.status(400).send({ error: 'User already exists' });
    }
    
    const userId = generateId('user');
    const token = generateId('jwt');
    
    // Insert new user
    const result = await client.query(
      'INSERT INTO users (id, email, username, password, token) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, username',
      [userId, email, username, password, token] // In production, hash the password
    );
    
    const user = result.rows[0];
    return { 
      success: true, 
      user: { id: user.id, email: user.email, username: user.username }, 
      token: token 
    };
  } catch (error) {
    console.error('Registration error:', error);
    return reply.status(500).send({ error: 'Registration failed' });
  } finally {
    client.release();
  }
});

fastify.post('/api/auth/login', async (req, reply) => {
  const { email, password } = req.body || {};
  
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT id, email, username, token FROM users WHERE email = $1 AND password = $2',
      [email, password]
    );
    
    if (result.rows.length === 0) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    return { 
      success: true, 
      user: { id: user.id, email: user.email, username: user.username }, 
      token: user.token 
    };
  } catch (error) {
    console.error('Login error:', error);
    return reply.status(500).send({ error: 'Login failed' });
  } finally {
    client.release();
  }
});

// COMMUNITY ENDPOINTS
fastify.post('/api/communities', async (req, reply) => {
  const { name, description } = req.body || {};
  
  if (!name) {
    return reply.status(400).send({ error: 'Name is required' });
  }
  
  const client = await pool.connect();
  try {
    const communityId = generateId('comm');
    
    const result = await client.query(
      'INSERT INTO communities (id, name, description, member_count) VALUES ($1, $2, $3, $4) RETURNING *',
      [communityId, name, description || '', 1]
    );
    
    const community = result.rows[0];
    return { 
      success: true, 
      community: {
        id: community.id,
        name: community.name,
        description: community.description,
        memberCount: community.member_count,
        createdAt: community.created_at
      }
    };
  } catch (error) {
    console.error('Community creation error:', error);
    if (error.constraint === 'communities_name_key') {
      return reply.status(400).send({ error: 'Community name already exists' });
    }
    return reply.status(500).send({ error: 'Community creation failed' });
  } finally {
    client.release();
  }
});

fastify.get('/api/communities', async () => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM communities ORDER BY created_at DESC');
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      memberCount: row.member_count,
      createdAt: row.created_at
    }));
  } catch (error) {
    console.error('Communities fetch error:', error);
    return [];
  } finally {
    client.release();
  }
});

fastify.get('/api/communities/:id', async (req, reply) => {
  const client = await pool.connect();
  try {
    const communityResult = await client.query('SELECT * FROM communities WHERE id = $1', [req.params.id]);
    if (communityResult.rows.length === 0) {
      return reply.status(404).send({ error: 'Community not found' });
    }
    
    const community = communityResult.rows[0];
    
    // Get posts for this community
    const postsResult = await client.query(
      'SELECT * FROM posts WHERE community_id = $1 ORDER BY created_at DESC',
      [req.params.id]
    );
    
    const posts = postsResult.rows.map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      communityId: row.community_id,
      upvotes: row.upvotes,
      downvotes: row.downvotes,
      commentCount: row.comment_count,
      createdAt: row.created_at
    }));
    
    return {
      id: community.id,
      name: community.name,
      description: community.description,
      memberCount: community.member_count,
      createdAt: community.created_at,
      posts: posts
    };
  } catch (error) {
    console.error('Community fetch error:', error);
    return reply.status(500).send({ error: 'Community fetch failed' });
  } finally {
    client.release();
  }
});

// POST ENDPOINTS
fastify.post('/api/posts', async (req, reply) => {
  const { title, content, communityId } = req.body || {};
  
  if (!title || !communityId) {
    return reply.status(400).send({ error: 'Title and communityId are required' });
  }
  
  const client = await pool.connect();
  try {
    // Verify community exists
    const communityCheck = await client.query('SELECT id FROM communities WHERE id = $1', [communityId]);
    if (communityCheck.rows.length === 0) {
      return reply.status(400).send({ error: 'Community not found' });
    }
    
    const postId = generateId('post');
    
    const result = await client.query(
      'INSERT INTO posts (id, title, content, community_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [postId, title, content || '', communityId]
    );
    
    const post = result.rows[0];
    return { 
      success: true, 
      post: {
        id: post.id,
        title: post.title,
        content: post.content,
        communityId: post.community_id,
        upvotes: post.upvotes,
        downvotes: post.downvotes,
        commentCount: post.comment_count,
        createdAt: post.created_at
      }
    };
  } catch (error) {
    console.error('Post creation error:', error);
    return reply.status(500).send({ error: 'Post creation failed' });
  } finally {
    client.release();
  }
});

fastify.get('/api/posts', async (req) => {
  const { communityId } = req.query;
  const client = await pool.connect();
  
  try {
    let query = 'SELECT * FROM posts ORDER BY created_at DESC';
    let params = [];
    
    if (communityId) {
      query = 'SELECT * FROM posts WHERE community_id = $1 ORDER BY created_at DESC';
      params = [communityId];
    }
    
    const result = await client.query(query, params);
    return result.rows.map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      communityId: row.community_id,
      upvotes: row.upvotes,
      downvotes: row.downvotes,
      commentCount: row.comment_count,
      createdAt: row.created_at
    }));
  } catch (error) {
    console.error('Posts fetch error:', error);
    return [];
  } finally {
    client.release();
  }
});

fastify.get('/api/posts/:id', async (req, reply) => {
  const client = await pool.connect();
  try {
    const postResult = await client.query('SELECT * FROM posts WHERE id = $1', [req.params.id]);
    if (postResult.rows.length === 0) {
      return reply.status(404).send({ error: 'Post not found' });
    }
    
    const post = postResult.rows[0];
    
    // Get comments for this post
    const commentsResult = await client.query(
      'SELECT * FROM comments WHERE post_id = $1 ORDER BY created_at DESC',
      [req.params.id]
    );
    
    const comments = commentsResult.rows.map(row => ({
      id: row.id,
      content: row.content,
      postId: row.post_id,
      upvotes: row.upvotes,
      downvotes: row.downvotes,
      createdAt: row.created_at
    }));
    
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      communityId: post.community_id,
      upvotes: post.upvotes,
      downvotes: post.downvotes,
      commentCount: post.comment_count,
      createdAt: post.created_at,
      comments: comments
    };
  } catch (error) {
    console.error('Post fetch error:', error);
    return reply.status(500).send({ error: 'Post fetch failed' });
  } finally {
    client.release();
  }
});

// VOTING
fastify.post('/api/posts/:id/vote', async (req, reply) => {
  const { vote } = req.body || {}; // 'up' or 'down'
  const client = await pool.connect();
  
  try {
    let query;
    if (vote === 'up') {
      query = 'UPDATE posts SET upvotes = upvotes + 1 WHERE id = $1 RETURNING *';
    } else if (vote === 'down') {
      query = 'UPDATE posts SET downvotes = downvotes + 1 WHERE id = $1 RETURNING *';
    } else {
      return reply.status(400).send({ error: 'Invalid vote type' });
    }
    
    const result = await client.query(query, [req.params.id]);
    
    if (result.rows.length === 0) {
      return reply.status(404).send({ error: 'Post not found' });
    }
    
    const post = result.rows[0];
    return { 
      success: true, 
      post: {
        id: post.id,
        title: post.title,
        content: post.content,
        communityId: post.community_id,
        upvotes: post.upvotes,
        downvotes: post.downvotes,
        commentCount: post.comment_count,
        createdAt: post.created_at
      }
    };
  } catch (error) {
    console.error('Vote error:', error);
    return reply.status(500).send({ error: 'Vote failed' });
  } finally {
    client.release();
  }
});

// COMMENT ENDPOINTS
fastify.post('/api/comments', async (req, reply) => {
  const { content, postId } = req.body || {};
  
  if (!content || !postId) {
    return reply.status(400).send({ error: 'Content and postId are required' });
  }
  
  const client = await pool.connect();
  try {
    // Start transaction
    await client.query('BEGIN');
    
    // Verify post exists
    const postCheck = await client.query('SELECT id FROM posts WHERE id = $1', [postId]);
    if (postCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return reply.status(400).send({ error: 'Post not found' });
    }
    
    const commentId = generateId('comment');
    
    // Insert comment
    const commentResult = await client.query(
      'INSERT INTO comments (id, content, post_id) VALUES ($1, $2, $3) RETURNING *',
      [commentId, content, postId]
    );
    
    // Update post comment count
    await client.query(
      'UPDATE posts SET comment_count = comment_count + 1 WHERE id = $1',
      [postId]
    );
    
    await client.query('COMMIT');
    
    const comment = commentResult.rows[0];
    return { 
      success: true, 
      comment: {
        id: comment.id,
        content: comment.content,
        postId: comment.post_id,
        upvotes: comment.upvotes,
        downvotes: comment.downvotes,
        createdAt: comment.created_at
      }
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Comment creation error:', error);
    return reply.status(500).send({ error: 'Comment creation failed' });
  } finally {
    client.release();
  }
});

fastify.get('/api/comments', async (req) => {
  const { postId } = req.query;
  const client = await pool.connect();
  
  try {
    let query = 'SELECT * FROM comments ORDER BY created_at DESC';
    let params = [];
    
    if (postId) {
      query = 'SELECT * FROM comments WHERE post_id = $1 ORDER BY created_at DESC';
      params = [postId];
    }
    
    const result = await client.query(query, params);
    return result.rows.map(row => ({
      id: row.id,
      content: row.content,
      postId: row.post_id,
      upvotes: row.upvotes,
      downvotes: row.downvotes,
      createdAt: row.created_at
    }));
  } catch (error) {
    console.error('Comments fetch error:', error);
    return [];
  } finally {
    client.release();
  }
});

// HEALTH CHECK
fastify.get('/health', async () => {
  const client = await pool.connect();
  try {
    const usersCount = await client.query('SELECT COUNT(*) FROM users');
    const communitiesCount = await client.query('SELECT COUNT(*) FROM communities');
    const postsCount = await client.query('SELECT COUNT(*) FROM posts');
    const commentsCount = await client.query('SELECT COUNT(*) FROM comments');
    
    return { 
      status: 'healthy',
      database: 'PostgreSQL',
      stats: {
        users: parseInt(usersCount.rows[0].count),
        communities: parseInt(communitiesCount.rows[0].count),
        posts: parseInt(postsCount.rows[0].count),
        comments: parseInt(commentsCount.rows[0].count)
      }
    };
  } catch (error) {
    console.error('Health check error:', error);
    return { 
      status: 'unhealthy',
      database: 'PostgreSQL',
      error: error.message 
    };
  } finally {
    client.release();
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

// START SERVER
const start = async () => {
  try {
    await fastify.listen({ port: 4000, host: '0.0.0.0' });
    console.log('🚀 CRYB PostgreSQL API running on http://localhost:4000');
    console.log('💾 Using PostgreSQL database with connection pooling');
    console.log('📊 Endpoints:');
    console.log('  POST /api/auth/register');
    console.log('  POST /api/auth/login');
    console.log('  GET  /api/communities');
    console.log('  POST /api/communities');
    console.log('  GET  /api/posts');
    console.log('  POST /api/posts');
    console.log('  POST /api/posts/:id/vote');
    console.log('  GET  /api/comments');
    console.log('  POST /api/comments');
    console.log('  GET  /health');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();