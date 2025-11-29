const fastify = require('fastify')({ 
  logger: true,
  bodyLimit: 10485760
});

const { Pool } = require('pg');
const Minio = require('minio');
const path = require('path');
const crypto = require('crypto');
const { AccessToken, RoomServiceClient } = require('livekit-server-sdk');

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

// MinIO client configuration
const minioClient = new Minio.Client({
  endPoint: 'localhost',
  port: 9000,
  useSSL: false,
  accessKey: 'minioadmin',
  secretKey: 'minioadmin123'
});

// MinIO bucket names - using existing buckets to avoid permission issues
const BUCKETS = {
  AVATARS: 'cryb-media',
  IMAGES: 'cryb-media', 
  FILES: 'cryb-uploads'
};

// LiveKit configuration
const LIVEKIT_CONFIG = {
  wsUrl: 'ws://localhost:7880',
  httpUrl: 'http://localhost:7880',
  apiKey: 'APIHmK7VRxK9Xb5M3PqN8Yz2Fw4Jt6Lp',
  apiSecret: 'LkT9Qx3Vm8Sz5Rn2Bp7Wj4Ht6Fg3Cd1'
};

// Initialize LiveKit Room Service Client
const roomService = new RoomServiceClient(LIVEKIT_CONFIG.httpUrl, LIVEKIT_CONFIG.apiKey, LIVEKIT_CONFIG.apiSecret);

// Initialize MinIO connection
const initializeMinIO = async () => {
  try {
    // Test connection by listing buckets
    const buckets = await minioClient.listBuckets();
    console.log('✅ MinIO connected successfully!');
    console.log(`📦 Available buckets: ${buckets.map(b => b.name).join(', ')}`);
    
    // Verify our required buckets exist
    const requiredBuckets = [...new Set(Object.values(BUCKETS))]; // Remove duplicates
    for (const bucketName of requiredBuckets) {
      const exists = await minioClient.bucketExists(bucketName);
      if (exists) {
        console.log(`✅ MinIO bucket '${bucketName}' is available!`);
      } else {
        console.log(`⚠️ MinIO bucket '${bucketName}' not found, will try to create it on first upload`);
      }
    }
  } catch (error) {
    console.error('❌ Error connecting to MinIO:', error.message);
    console.log('⚠️ MinIO not available, file uploads will fail');
  }
};

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

// Register multipart plugin for file uploads
fastify.register(require('@fastify/multipart'), {
  limits: {
    fieldNameSize: 100,
    fieldSize: 100,
    fields: 10,
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1,
    headerPairs: 2000
  }
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

// Utility functions for file handling
const generateFileName = (originalName) => {
  const ext = path.extname(originalName);
  const randomName = crypto.randomBytes(16).toString('hex');
  return `${Date.now()}_${randomName}${ext}`;
};

const getFileUrl = (bucketName, fileName, fileType = 'file') => {
  // Add folder structure based on file type
  let prefix = '';
  if (fileType === 'avatar') {
    prefix = 'avatars/';
  } else if (fileType === 'image') {
    prefix = 'images/';
  }
  return `http://localhost:9000/${bucketName}/${prefix}${fileName}`;
};

const isValidImageType = (mimetype) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(mimetype);
};

const isValidFileType = (mimetype) => {
  const validTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  return validTypes.includes(mimetype);
};

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
      'INSERT INTO users (id, email, username, password, token) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, username, avatar_url',
      [userId, email, username, password, token] // In production, hash the password
    );
    
    const user = result.rows[0];
    return { 
      success: true, 
      user: { 
        id: user.id, 
        email: user.email, 
        username: user.username, 
        avatarUrl: user.avatar_url 
      }, 
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
      'SELECT id, email, username, token, avatar_url FROM users WHERE email = $1 AND password = $2',
      [email, password]
    );
    
    if (result.rows.length === 0) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    return { 
      success: true, 
      user: { 
        id: user.id, 
        email: user.email, 
        username: user.username, 
        avatarUrl: user.avatar_url 
      }, 
      token: user.token 
    };
  } catch (error) {
    console.error('Login error:', error);
    return reply.status(500).send({ error: 'Login failed' });
  } finally {
    client.release();
  }
});

// FILE UPLOAD ENDPOINTS
fastify.post('/api/upload/avatar', async (req, reply) => {
  try {
    const data = await req.file();
    
    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }
    
    if (!isValidImageType(data.mimetype)) {
      return reply.status(400).send({ error: 'Invalid file type. Only images are allowed.' });
    }
    
    const fileName = generateFileName(data.filename);
    const objectName = `avatars/${fileName}`;
    const buffer = await data.toBuffer();
    
    // Upload to MinIO
    await minioClient.putObject(BUCKETS.AVATARS, objectName, buffer, buffer.length, {
      'Content-Type': data.mimetype
    });
    
    const fileUrl = getFileUrl(BUCKETS.AVATARS, fileName, 'avatar');
    
    return {
      success: true,
      url: fileUrl,
      fileName: fileName,
      bucketName: BUCKETS.AVATARS
    };
  } catch (error) {
    console.error('Avatar upload error:', error);
    return reply.status(500).send({ error: 'File upload failed' });
  }
});

fastify.post('/api/upload/image', async (req, reply) => {
  try {
    const data = await req.file();
    
    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }
    
    if (!isValidImageType(data.mimetype)) {
      return reply.status(400).send({ error: 'Invalid file type. Only images are allowed.' });
    }
    
    const fileName = generateFileName(data.filename);
    const objectName = `images/${fileName}`;
    const buffer = await data.toBuffer();
    
    // Upload to MinIO
    await minioClient.putObject(BUCKETS.IMAGES, objectName, buffer, buffer.length, {
      'Content-Type': data.mimetype
    });
    
    const fileUrl = getFileUrl(BUCKETS.IMAGES, fileName, 'image');
    
    return {
      success: true,
      url: fileUrl,
      fileName: fileName,
      bucketName: BUCKETS.IMAGES
    };
  } catch (error) {
    console.error('Image upload error:', error);
    return reply.status(500).send({ error: 'File upload failed' });
  }
});

fastify.post('/api/upload/file', async (req, reply) => {
  try {
    const data = await req.file();
    
    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }
    
    if (!isValidFileType(data.mimetype)) {
      return reply.status(400).send({ error: 'Invalid file type. Check supported file types.' });
    }
    
    const fileName = generateFileName(data.filename);
    const buffer = await data.toBuffer();
    
    // Upload to MinIO
    await minioClient.putObject(BUCKETS.FILES, fileName, buffer, buffer.length, {
      'Content-Type': data.mimetype
    });
    
    const fileUrl = getFileUrl(BUCKETS.FILES, fileName);
    
    return {
      success: true,
      url: fileUrl,
      fileName: fileName,
      originalName: data.filename,
      fileSize: buffer.length,
      mimeType: data.mimetype,
      bucketName: BUCKETS.FILES
    };
  } catch (error) {
    console.error('File upload error:', error);
    return reply.status(500).send({ error: 'File upload failed' });
  }
});

// SIGNED URL ENDPOINT
fastify.post('/api/upload/signed-url', async (req, reply) => {
  const { bucketName, objectName, expiry } = req.body || {};
  
  if (!bucketName || !objectName) {
    return reply.status(400).send({ error: 'bucketName and objectName are required' });
  }
  
  try {
    // Generate signed URL for secure access (default 1 hour expiry)
    const expirySeconds = expiry || 3600;
    const signedUrl = await minioClient.presignedGetObject(bucketName, objectName, expirySeconds);
    
    return {
      success: true,
      signedUrl: signedUrl,
      expires: new Date(Date.now() + (expirySeconds * 1000)).toISOString(),
      bucketName: bucketName,
      objectName: objectName
    };
  } catch (error) {
    console.error('Signed URL generation error:', error);
    return reply.status(500).send({ error: 'Failed to generate signed URL' });
  }
});

// BUCKET STATUS ENDPOINT
fastify.get('/api/upload/bucket-status', async (req, reply) => {
  try {
    const buckets = await minioClient.listBuckets();
    const bucketStatus = {};
    
    for (const bucket of buckets) {
      const exists = await minioClient.bucketExists(bucket.name);
      bucketStatus[bucket.name] = {
        exists: exists,
        name: bucket.name,
        creationDate: bucket.creationDate
      };
    }
    
    return {
      success: true,
      minioEndpoint: 'localhost:9000',
      buckets: bucketStatus,
      configuredBuckets: BUCKETS
    };
  } catch (error) {
    console.error('Bucket status error:', error);
    return reply.status(500).send({ error: 'Failed to get bucket status' });
  }
});

// BUCKET POLICY CONFIGURATION ENDPOINT
fastify.post('/api/upload/configure-bucket-policy', async (req, reply) => {
  const { bucketName, isPublic } = req.body || {};
  
  if (!bucketName) {
    return reply.status(400).send({ error: 'bucketName is required' });
  }
  
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      return reply.status(404).send({ error: 'Bucket not found' });
    }
    
    if (isPublic) {
      // Set bucket policy for public read access
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucketName}/*`]
          }
        ]
      };
      
      await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
      
      return {
        success: true,
        message: `Bucket '${bucketName}' configured for public read access`,
        policy: 'public-read'
      };
    } else {
      // Remove public policy (set to private)
      await minioClient.setBucketPolicy(bucketName, '');
      
      return {
        success: true,
        message: `Bucket '${bucketName}' configured for private access`,
        policy: 'private'
      };
    }
  } catch (error) {
    console.error('Bucket policy configuration error:', error);
    return reply.status(500).send({ error: 'Failed to configure bucket policy' });
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
      imageUrl: row.image_url,
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
  const { title, content, communityId, imageUrl } = req.body || {};
  
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
      'INSERT INTO posts (id, title, content, community_id, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [postId, title, content || '', communityId, imageUrl || null]
    );
    
    const post = result.rows[0];
    return { 
      success: true, 
      post: {
        id: post.id,
        title: post.title,
        content: post.content,
        communityId: post.community_id,
        imageUrl: post.image_url,
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
      imageUrl: row.image_url,
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
      imageUrl: post.image_url,
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
        imageUrl: post.image_url,
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

// LIVEKIT VOICE/VIDEO ENDPOINTS

// Generate access token for LiveKit
fastify.post('/api/voice/token', async (req, reply) => {
  const { roomName, participantName, userId } = req.body || {};
  
  if (!roomName || !participantName) {
    return reply.status(400).send({ error: 'roomName and participantName are required' });
  }
  
  try {
    const participantIdentity = userId ? `${userId}_${participantName}` : participantName;
    
    const token = new AccessToken(LIVEKIT_CONFIG.apiKey, LIVEKIT_CONFIG.apiSecret, {
      identity: participantIdentity,
      name: participantName,
      ttl: '1h', // Token valid for 1 hour
    });

    // Grant permissions for voice rooms
    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const jwt = await token.toJwt();
    
    return {
      success: true,
      token: jwt,
      wsUrl: LIVEKIT_CONFIG.wsUrl,
      participantIdentity,
      roomName
    };
  } catch (error) {
    console.error('Token generation error:', error);
    return reply.status(500).send({ error: 'Failed to generate access token' });
  }
});

// Create voice room
fastify.post('/api/voice/room/create', async (req, reply) => {
  const { name, description, communityId, maxParticipants } = req.body || {};
  
  if (!name) {
    return reply.status(400).send({ error: 'Room name is required' });
  }
  
  const client = await pool.connect();
  try {
    const roomId = generateId('voice_room');
    const roomName = `voice_${roomId}`; // LiveKit room name
    
    // Create room in LiveKit
    const room = await roomService.createRoom({
      name: roomName,
      maxParticipants: maxParticipants || 10,
      emptyTimeout: 300, // 5 minutes
      departureTimeout: 20, // 20 seconds
      enableRecording: false,
    });
    
    console.log('LiveKit room created:', room);
    
    // Store in database
    const result = await client.query(
      'INSERT INTO voice_rooms (id, name, description, community_id, max_participants, room_type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [roomId, name, description || '', communityId || null, maxParticipants || 10, 'voice']
    );
    
    const voiceRoom = result.rows[0];
    return {
      success: true,
      room: {
        id: voiceRoom.id,
        name: voiceRoom.name,
        description: voiceRoom.description,
        communityId: voiceRoom.community_id,
        maxParticipants: voiceRoom.max_participants,
        isActive: voiceRoom.is_active,
        roomType: voiceRoom.room_type,
        createdAt: voiceRoom.created_at,
        liveKitRoomName: roomName
      }
    };
  } catch (error) {
    console.error('Voice room creation error:', error);
    return reply.status(500).send({ error: 'Failed to create voice room' });
  } finally {
    client.release();
  }
});

// Join voice room
fastify.post('/api/voice/room/join', async (req, reply) => {
  const { roomId, participantName, userId } = req.body || {};
  
  if (!roomId || !participantName) {
    return reply.status(400).send({ error: 'roomId and participantName are required' });
  }
  
  const client = await pool.connect();
  try {
    // Get room info from database
    const roomResult = await client.query('SELECT * FROM voice_rooms WHERE id = $1', [roomId]);
    if (roomResult.rows.length === 0) {
      return reply.status(404).send({ error: 'Voice room not found' });
    }
    
    const room = roomResult.rows[0];
    if (!room.is_active) {
      return reply.status(400).send({ error: 'Voice room is not active' });
    }
    
    const liveKitRoomName = `voice_${roomId}`;
    const participantIdentity = userId ? `${userId}_${participantName}` : `${Date.now()}_${participantName}`;
    
    // Generate access token for this specific room
    const token = new AccessToken(LIVEKIT_CONFIG.apiKey, LIVEKIT_CONFIG.apiSecret, {
      identity: participantIdentity,
      name: participantName,
      ttl: '2h',
    });

    token.addGrant({
      roomJoin: true,
      room: liveKitRoomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const jwt = await token.toJwt();
    
    // Record participant in database
    const participantId = generateId('participant');
    await client.query(
      'INSERT INTO voice_participants (id, room_id, user_id, participant_identity) VALUES ($1, $2, $3, $4)',
      [participantId, roomId, userId || null, participantIdentity]
    );
    
    return {
      success: true,
      token: jwt,
      wsUrl: LIVEKIT_CONFIG.wsUrl,
      roomName: liveKitRoomName,
      participantIdentity,
      room: {
        id: room.id,
        name: room.name,
        description: room.description,
        maxParticipants: room.max_participants,
        roomType: room.room_type
      }
    };
  } catch (error) {
    console.error('Voice room join error:', error);
    return reply.status(500).send({ error: 'Failed to join voice room' });
  } finally {
    client.release();
  }
});

// Start video call
fastify.post('/api/video/call/start', async (req, reply) => {
  const { participantName, userId, callType, maxParticipants } = req.body || {};
  
  if (!participantName) {
    return reply.status(400).send({ error: 'participantName is required' });
  }
  
  const client = await pool.connect();
  try {
    const callId = generateId('video_call');
    const roomName = `video_call_${callId}`;
    
    // Create room in LiveKit with video capabilities
    const room = await roomService.createRoom({
      name: roomName,
      maxParticipants: maxParticipants || 4,
      emptyTimeout: 300,
      departureTimeout: 20,
      enableRecording: false,
    });
    
    console.log('LiveKit video call room created:', room);
    
    // Store in database
    const result = await client.query(
      'INSERT INTO video_calls (id, room_name, call_type, initiator_user_id, max_participants) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [callId, roomName, callType || 'video', userId || null, maxParticipants || 4]
    );
    
    const videoCall = result.rows[0];
    
    // Generate token for the initiator
    const participantIdentity = userId ? `${userId}_${participantName}` : `${Date.now()}_${participantName}`;
    
    const token = new AccessToken(LIVEKIT_CONFIG.apiKey, LIVEKIT_CONFIG.apiSecret, {
      identity: participantIdentity,
      name: participantName,
      ttl: '2h',
    });

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const jwt = await token.toJwt();
    
    // Record initiator as participant
    const participantId = generateId('call_participant');
    await client.query(
      'INSERT INTO call_participants (id, call_id, user_id, participant_identity) VALUES ($1, $2, $3, $4)',
      [participantId, callId, userId || null, participantIdentity]
    );
    
    return {
      success: true,
      call: {
        id: videoCall.id,
        roomName: videoCall.room_name,
        callType: videoCall.call_type,
        maxParticipants: videoCall.max_participants,
        isActive: videoCall.is_active,
        createdAt: videoCall.created_at
      },
      token: jwt,
      wsUrl: LIVEKIT_CONFIG.wsUrl,
      participantIdentity
    };
  } catch (error) {
    console.error('Video call start error:', error);
    return reply.status(500).send({ error: 'Failed to start video call' });
  } finally {
    client.release();
  }
});

// Join video call
fastify.post('/api/video/call/join', async (req, reply) => {
  const { callId, participantName, userId } = req.body || {};
  
  if (!callId || !participantName) {
    return reply.status(400).send({ error: 'callId and participantName are required' });
  }
  
  const client = await pool.connect();
  try {
    // Get call info from database
    const callResult = await client.query('SELECT * FROM video_calls WHERE id = $1', [callId]);
    if (callResult.rows.length === 0) {
      return reply.status(404).send({ error: 'Video call not found' });
    }
    
    const call = callResult.rows[0];
    if (!call.is_active) {
      return reply.status(400).send({ error: 'Video call is not active' });
    }
    
    const participantIdentity = userId ? `${userId}_${participantName}` : `${Date.now()}_${participantName}`;
    
    // Generate access token
    const token = new AccessToken(LIVEKIT_CONFIG.apiKey, LIVEKIT_CONFIG.apiSecret, {
      identity: participantIdentity,
      name: participantName,
      ttl: '2h',
    });

    token.addGrant({
      roomJoin: true,
      room: call.room_name,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const jwt = await token.toJwt();
    
    // Record participant in database
    const participantId = generateId('call_participant');
    await client.query(
      'INSERT INTO call_participants (id, call_id, user_id, participant_identity) VALUES ($1, $2, $3, $4)',
      [participantId, callId, userId || null, participantIdentity]
    );
    
    return {
      success: true,
      call: {
        id: call.id,
        roomName: call.room_name,
        callType: call.call_type,
        maxParticipants: call.max_participants,
        isActive: call.is_active
      },
      token: jwt,
      wsUrl: LIVEKIT_CONFIG.wsUrl,
      participantIdentity
    };
  } catch (error) {
    console.error('Video call join error:', error);
    return reply.status(500).send({ error: 'Failed to join video call' });
  } finally {
    client.release();
  }
});

// List voice rooms
fastify.get('/api/voice/rooms', async (req) => {
  const { communityId } = req.query;
  const client = await pool.connect();
  
  try {
    let query = 'SELECT * FROM voice_rooms WHERE is_active = true ORDER BY created_at DESC';
    let params = [];
    
    if (communityId) {
      query = 'SELECT * FROM voice_rooms WHERE community_id = $1 AND is_active = true ORDER BY created_at DESC';
      params = [communityId];
    }
    
    const result = await client.query(query, params);
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      communityId: row.community_id,
      maxParticipants: row.max_participants,
      isActive: row.is_active,
      roomType: row.room_type,
      createdAt: row.created_at
    }));
  } catch (error) {
    console.error('Voice rooms fetch error:', error);
    return [];
  } finally {
    client.release();
  }
});

// List active video calls
fastify.get('/api/video/calls', async () => {
  const client = await pool.connect();
  
  try {
    const result = await client.query('SELECT * FROM video_calls WHERE is_active = true ORDER BY created_at DESC');
    return result.rows.map(row => ({
      id: row.id,
      roomName: row.room_name,
      callType: row.call_type,
      maxParticipants: row.max_participants,
      isActive: row.is_active,
      createdAt: row.created_at
    }));
  } catch (error) {
    console.error('Video calls fetch error:', error);
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
    console.log('🚀 CRYB PostgreSQL API with MinIO running on http://localhost:4000');
    console.log('💾 Using PostgreSQL database with connection pooling');
    console.log('📦 Using MinIO object storage on http://localhost:9000');
    console.log('📊 Endpoints:');
    console.log('  POST /api/auth/register');
    console.log('  POST /api/auth/login');
    console.log('  POST /api/upload/avatar');
    console.log('  POST /api/upload/image');
    console.log('  POST /api/upload/file');
    console.log('  POST /api/upload/signed-url');
    console.log('  GET  /api/upload/bucket-status');
    console.log('  POST /api/upload/configure-bucket-policy');
    console.log('  GET  /api/communities');
    console.log('  POST /api/communities');
    console.log('  GET  /api/posts');
    console.log('  POST /api/posts');
    console.log('  POST /api/posts/:id/vote');
    console.log('  GET  /api/comments');
    console.log('  POST /api/comments');
    console.log('🎙️ Voice/Video Endpoints:');
    console.log('  POST /api/voice/token');
    console.log('  POST /api/voice/room/create');
    console.log('  POST /api/voice/room/join');
    console.log('  GET  /api/voice/rooms');
    console.log('  POST /api/video/call/start');
    console.log('  POST /api/video/call/join');
    console.log('  GET  /api/video/calls');
    console.log('  GET  /health');
    
    // Initialize MinIO connection after server starts
    initializeMinIO();
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();