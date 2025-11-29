const express = require('express');
const app = express();
const cors = require('cors');

// REAL JSON parsing that ACTUALLY WORKS
app.use(cors());
app.use(express.json());
app.use(express.text());
app.use(express.raw());

// In-memory storage for REAL testing
const users = [];
const communities = [];
const posts = [];

// REGISTER - MUST WORK WITH CURL
app.post('/api/auth/register', (req, res) => {
  console.log('Register body:', req.body);
  const { email, password, username } = req.body;
  
  if (!email || !password || !username) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const user = {
    id: Date.now().toString(),
    email,
    username,
    password, // In real app, hash this
    token: 'jwt_' + Date.now()
  };
  
  users.push(user);
  res.json({ success: true, user, token: user.token });
});

// LOGIN
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  res.json({ success: true, user, token: user.token });
});

// CREATE COMMUNITY
app.post('/api/communities', (req, res) => {
  const { name, description } = req.body;
  
  const community = {
    id: Date.now().toString(),
    name,
    description,
    createdAt: new Date()
  };
  
  communities.push(community);
  res.json({ success: true, community });
});

// CREATE POST
app.post('/api/posts', (req, res) => {
  const { title, content, communityId } = req.body;
  
  const post = {
    id: Date.now().toString(),
    title,
    content,
    communityId,
    createdAt: new Date()
  };
  
  posts.push(post);
  res.json({ success: true, post });
});

// GET ALL
app.get('/api/communities', (req, res) => res.json(communities));
app.get('/api/posts', (req, res) => res.json(posts));
app.get('/health', (req, res) => res.json({ status: 'healthy' }));

app.listen(4000, () => {
  console.log('REAL API running on port 4000');
  console.log('Test with: curl -X POST http://localhost:4000/api/auth/register -H "Content-Type: application/json" -d \'{"email":"test@test.com","password":"pass123","username":"testuser"}\'');
});
