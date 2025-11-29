const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Sample data
const posts = [
  {
    id: 'post_1',
    title: 'Welcome to CRYB Platform!',
    content: 'Experience the future of online communities with our next-generation platform.',
    user: { id: 'u1', username: 'admin', avatar_url: 'https://ui-avatars.com/api/?name=Admin' },
    community: { id: 'c1', name: 'Announcements' },
    upvotes: 523,
    downvotes: 12,
    created_at: new Date().toISOString()
  },
  {
    id: 'post_2', 
    title: 'Bitcoin Reaches New All-Time High',
    content: 'Cryptocurrency market celebrates as BTC breaks through $100,000 barrier.',
    user: { id: 'u2', username: 'cryptoKing', avatar_url: 'https://ui-avatars.com/api/?name=CK' },
    community: { id: 'c2', name: 'Cryptocurrency' },
    upvotes: 1823,
    downvotes: 45,
    created_at: new Date().toISOString()
  },
  {
    id: 'post_3',
    title: 'GTA VI Gameplay Revealed',
    content: 'Rockstar finally shows off the next generation of open-world gaming.',
    user: { id: 'u3', username: 'gamer42', avatar_url: 'https://ui-avatars.com/api/?name=G42' },
    community: { id: 'c3', name: 'Gaming' },
    upvotes: 3456,
    downvotes: 89,
    created_at: new Date().toISOString()
  }
];

const communities = [
  { id: 'c1', name: 'Announcements', description: 'Official platform updates', member_count: 15234 },
  { id: 'c2', name: 'Cryptocurrency', description: 'Bitcoin, Ethereum and more', member_count: 98765 },
  { id: 'c3', name: 'Gaming', description: 'PC, Console and Mobile gaming', member_count: 45678 },
  { id: 'c4', name: 'Technology', description: 'Latest in tech', member_count: 67890 },
  { id: 'c5', name: 'Programming', description: 'Code and development', member_count: 34567 }
];

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'cryb-api',
    version: '2.0.0'
  });
});

// API endpoints
app.get('/api/v1/posts', (req, res) => {
  res.json({ success: true, posts });
});

app.get('/api/v1/posts/:id', (req, res) => {
  const post = posts.find(p => p.id === req.params.id);
  res.json({ success: true, post: post || null });
});

app.get('/api/v1/communities', (req, res) => {
  res.json({ success: true, communities });
});

app.get('/api/v1/search', (req, res) => {
  const { q } = req.query;
  const results = posts.filter(p => 
    p.title.toLowerCase().includes(q?.toLowerCase() || '') ||
    p.content.toLowerCase().includes(q?.toLowerCase() || '')
  );
  res.json({ success: true, results });
});

app.post('/api/v1/posts', (req, res) => {
  const newPost = {
    id: `post_${Date.now()}`,
    ...req.body,
    upvotes: 0,
    downvotes: 0,
    created_at: new Date().toISOString()
  };
  posts.push(newPost);
  res.json({ success: true, post: newPost });
});

app.post('/api/v1/vote', (req, res) => {
  res.json({ success: true, message: 'Vote recorded' });
});

// Catch all for undefined routes
app.all('*', (req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});