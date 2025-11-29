// Test script to verify localStorage functionality
console.log('Testing CRYB-style community functionality...');

// Clear any existing data
localStorage.clear();

// Test 1: Create a community
console.log('Test 1: Creating test community...');
const testCommunity = {
  id: 'comm_1695686400000',
  name: 'javascript',
  displayName: 'JavaScript',
  description: 'A community for JavaScript developers to share knowledge, discuss best practices, and help each other.',
  category: 'technology',
  members: 1,
  posts: 0,
  online: 1,
  created: new Date().toISOString(),
  creator: 'testuser',
  isPrivate: false
};

const communities = [testCommunity];
localStorage.setItem('communities', JSON.stringify(communities));

// Test 2: Create a post in the community
console.log('Test 2: Creating test post...');
const testPost = {
  id: 'post_1695686401000',
  title: 'Welcome to the JavaScript Community!',
  content: 'This is the first post in our JavaScript community. Feel free to share your projects, ask questions, and help fellow developers!',
  community: 'javascript',
  author: 'testuser',
  score: 5,
  comments: 0,
  created: new Date().toISOString(),
  createdAt: new Date().toISOString()
};

const posts = [testPost];
localStorage.setItem('posts', JSON.stringify(posts));

// Test 3: Join community
console.log('Test 3: Joining community...');
const joinedCommunities = ['javascript'];
localStorage.setItem('joinedCommunities', JSON.stringify(joinedCommunities));

// Test 4: Vote on post
console.log('Test 4: Voting on post...');
const userVotes = {
  'post_1695686401000': 'upvote'
};
localStorage.setItem('userVotes', JSON.stringify(userVotes));

// Test 5: Create additional communities
console.log('Test 5: Creating additional communities...');
const additionalCommunities = [
  {
    id: 'comm_1695686402000',
    name: 'react',
    displayName: 'React',
    description: 'React community for sharing components, hooks, and best practices.',
    category: 'technology',
    members: 123,
    posts: 45,
    online: 12,
    created: new Date().toISOString(),
    creator: 'reactdev',
    isPrivate: false
  },
  {
    id: 'comm_1695686403000',
    name: 'webdev',
    displayName: 'Web Development',
    description: 'General web development community covering frontend, backend, and full-stack development.',
    category: 'technology',
    members: 456,
    posts: 78,
    online: 23,
    created: new Date().toISOString(),
    creator: 'webmaster',
    isPrivate: false
  },
  {
    id: 'comm_1695686404000',
    name: 'gaming',
    displayName: 'Gaming',
    description: 'Discuss your favorite games, share gameplay tips, and connect with fellow gamers.',
    category: 'gaming',
    members: 789,
    posts: 234,
    online: 56,
    created: new Date().toISOString(),
    creator: 'gamer123',
    isPrivate: false
  }
];

const allCommunities = [...communities, ...additionalCommunities];
localStorage.setItem('communities', JSON.stringify(allCommunities));

// Test 6: Create additional posts
console.log('Test 6: Creating additional posts...');
const additionalPosts = [
  {
    id: 'post_1695686405000',
    title: 'React Hooks Best Practices',
    content: 'Here are some best practices when using React hooks in your applications...',
    community: 'react',
    author: 'reactdev',
    score: 12,
    comments: 3,
    created: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'post_1695686406000',
    title: 'Modern CSS Grid Tutorial',
    content: 'Learn how to create responsive layouts using CSS Grid with this comprehensive tutorial.',
    community: 'webdev',
    author: 'webmaster',
    score: 8,
    comments: 5,
    created: new Date(Date.now() - 7200000).toISOString(),
    createdAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'post_1695686407000',
    title: 'Best Indie Games of 2024',
    content: 'Check out these amazing indie games that you should definitely play this year!',
    community: 'gaming',
    author: 'gamer123',
    score: 15,
    comments: 8,
    created: new Date(Date.now() - 10800000).toISOString(),
    createdAt: new Date(Date.now() - 10800000).toISOString()
  }
];

const allPosts = [...posts, ...additionalPosts];
localStorage.setItem('posts', JSON.stringify(allPosts));

// Test 7: Set user data
console.log('Test 7: Setting user data...');
const userData = {
  username: 'testuser',
  email: 'test@example.com',
  joinDate: new Date().toISOString()
};
localStorage.setItem('user', JSON.stringify(userData));

console.log('✅ All tests completed successfully!');
console.log('You can now visit the application to see:');
console.log('- 4 communities (javascript, react, webdev, gaming)');
console.log('- 4 posts across different communities');
console.log('- Voting functionality');
console.log('- Community joining functionality');
console.log('');
console.log('LocalStorage contents:');
console.log('Communities:', JSON.parse(localStorage.getItem('communities') || '[]').length);
console.log('Posts:', JSON.parse(localStorage.getItem('posts') || '[]').length);
console.log('Joined Communities:', JSON.parse(localStorage.getItem('joinedCommunities') || '[]').length);
console.log('User Votes:', Object.keys(JSON.parse(localStorage.getItem('userVotes') || '{}')).length);