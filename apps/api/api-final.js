const http = require('http');
const url = require('url');

const posts = [
  {
    id: 'post_1',
    title: 'Welcome to CRYB Platform!',
    content: 'Experience the future of online communities. CRYB combines the best features of Reddit, Discord, and modern social platforms into one seamless experience.',
    user: { username: 'admin', displayName: 'Admin', id: 'u1' },
    community: { name: 'announcements', displayName: 'Announcements', id: 'c1' },
    author: { username: 'admin', displayName: 'Admin', id: 'u1' },
    score: 511,
    commentCount: 42,
    _count: { comments: 42, votes: 511 },
    createdAt: new Date().toISOString(),
    nsfw: false,
    isPinned: true,
    comments: []
  },
  {
    id: 'post_2',
    title: 'Bitcoin Reaches $100K',
    content: 'Historic milestone for cryptocurrency. The world\'s largest cryptocurrency has finally broken through the psychological barrier of $100,000.',
    user: { username: 'cryptoKing', displayName: 'Crypto King', id: 'u2' },
    community: { name: 'cryptocurrency', displayName: 'Cryptocurrency', id: 'c2' },
    author: { username: 'cryptoKing', displayName: 'Crypto King', id: 'u2' },
    score: 1778,
    commentCount: 234,
    _count: { comments: 234, votes: 1778 },
    createdAt: new Date().toISOString(),
    nsfw: false,
    comments: []
  },
  {
    id: 'post_3',
    title: 'GTA VI Gameplay Revealed',
    content: 'Next-gen gaming is here. Rockstar Games has finally unveiled the first gameplay footage of Grand Theft Auto VI.',
    user: { username: 'gamer42', displayName: 'Gamer42', id: 'u3' },
    community: { name: 'gaming', displayName: 'Gaming', id: 'c3' },
    author: { username: 'gamer42', displayName: 'Gamer42', id: 'u3' },
    score: 3367,
    commentCount: 567,
    _count: { comments: 567, votes: 3367 },
    createdAt: new Date().toISOString(),
    nsfw: false,
    comments: []
  }
];

const communities = [
  { 
    id: 'c1', 
    name: 'Announcements', 
    displayName: 'Announcements',
    description: 'Official updates', 
    member_count: 15234,
    _count: { members: 15234, posts: 1 }
  },
  { 
    id: 'c2', 
    name: 'Cryptocurrency', 
    displayName: 'Cryptocurrency',
    description: 'Crypto discussions', 
    member_count: 98765,
    _count: { members: 98765, posts: 1 }
  },
  { 
    id: 'c3', 
    name: 'Gaming', 
    displayName: 'Gaming',
    description: 'Gaming community', 
    member_count: 45678,
    _count: { members: 45678, posts: 1 }
  }
];

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  
  // Add caching for GET requests
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=120');
    res.setHeader('CDN-Cache-Control', 'max-age=600');
  }
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // Health check
  if (pathname === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }));
  } 
  // Get all posts
  else if (pathname === '/api/v1/posts') {
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, data: { items: posts } }));
  } 
  // Get single post
  else if (pathname.startsWith('/api/v1/posts/')) {
    const postId = pathname.split('/').pop();
    const post = posts.find(p => p.id === postId);
    if (post) {
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: post }));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ success: false, error: 'Post not found' }));
    }
  }
  // Get all communities
  else if (pathname === '/api/v1/communities') {
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, data: { items: communities } }));
  }
  // Get single community
  else if (pathname.startsWith('/api/v1/communities/')) {
    const communityId = pathname.split('/').pop();
    const community = communities.find(c => c.id === communityId || c.name.toLowerCase() === communityId.toLowerCase());
    if (community) {
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: community }));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ success: false, error: 'Community not found' }));
    }
  }
  // Search
  else if (pathname === '/api/v1/search') {
    const query = parsedUrl.query.q || '';
    const filtered = posts.filter(p => 
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.content.toLowerCase().includes(query.toLowerCase())
    );
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, data: { items: filtered } }));
  }
  // User endpoints
  else if (pathname.startsWith('/api/v1/users/')) {
    const username = pathname.split('/').pop();
    const userPosts = posts.filter(p => p.user.username === username);
    res.writeHead(200);
    res.end(JSON.stringify({ 
      success: true, 
      data: {
        username: username,
        displayName: username.charAt(0).toUpperCase() + username.slice(1),
        posts: userPosts
      }
    }));
  }
  // Auth check (mock)
  else if (pathname === '/api/v1/auth/check') {
    res.writeHead(200);
    res.end(JSON.stringify({ 
      success: true, 
      authenticated: false,
      user: null
    }));
  }
  // Vote endpoint
  else if (pathname === '/api/v1/vote' && req.method === 'POST') {
    res.writeHead(200);
    res.end(JSON.stringify({ 
      success: true, 
      message: 'Vote recorded'
    }));
  }
  // Comment endpoints
  else if (pathname === '/api/v1/comments' && req.method === 'POST') {
    res.writeHead(200);
    res.end(JSON.stringify({ 
      success: true, 
      data: {
        id: 'comment_' + Date.now(),
        content: 'New comment',
        user: { username: 'user', displayName: 'User' },
        createdAt: new Date().toISOString()
      }
    }));
  }
  // Profile endpoint
  else if (pathname === '/api/v1/profile') {
    res.writeHead(200);
    res.end(JSON.stringify({ 
      success: true, 
      data: {
        id: 'u1',
        username: 'guest',
        displayName: 'Guest User',
        karma: 0,
        created_at: new Date().toISOString()
      }
    }));
  }
  // Community posts
  else if (pathname.match(/^\/api\/v1\/communities\/[^/]+\/posts$/)) {
    const communityName = pathname.split('/')[4];
    const communityPosts = posts.filter(p => 
      p.community.name.toLowerCase() === communityName.toLowerCase()
    );
    res.writeHead(200);
    res.end(JSON.stringify({ 
      success: true, 
      data: { items: communityPosts }
    }));
  }
  // Default 404
  else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not Found', path: pathname }));
  }
});

server.listen(3003, () => console.log('API on port 3003'));
