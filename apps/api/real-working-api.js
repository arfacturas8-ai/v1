const fastify = require('fastify')({ logger: false });

// REAL in-memory storage
const users = [];
const communities = [];
const posts = [];

// Enable CORS
fastify.register(require('@fastify/cors'));

// REGISTER - WORKS WITH CURL
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

// LOGIN
fastify.post('/api/auth/login', async (req, reply) => {
  const { email, password } = req.body || {};
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return reply.status(401).send({ error: 'Invalid credentials' });
  }
  
  return { success: true, user, token: user.token };
});

// CREATE COMMUNITY
fastify.post('/api/communities', async (req, reply) => {
  const { name, description } = req.body || {};
  
  const community = {
    id: Date.now().toString(),
    name,
    description,
    createdAt: new Date(),
    posts: []
  };
  
  communities.push(community);
  return { success: true, community };
});

// CREATE POST
fastify.post('/api/communities/:id/posts', async (req, reply) => {
  const { title, content } = req.body || {};
  const communityId = req.params.id;
  
  const post = {
    id: Date.now().toString(),
    title,
    content,
    communityId,
    createdAt: new Date(),
    comments: []
  };
  
  posts.push(post);
  return { success: true, post };
});

// GET ALL
fastify.get('/api/communities', async () => communities);
fastify.get('/api/posts', async () => posts);
fastify.get('/health', async () => ({ status: 'healthy' }));

// START
fastify.listen({ port: 4000, host: '0.0.0.0' }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log('✅ REAL API on port 4000');
  console.log('✅ Test: curl -X POST http://localhost:4000/api/auth/register -H "Content-Type: application/json" -d \'{"email":"test@test.com","password":"pass","username":"test"}\'');
});
