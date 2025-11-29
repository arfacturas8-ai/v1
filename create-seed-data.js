#!/usr/bin/env node

const API_URL = 'http://localhost:3002/api/v1';
let token = '';

async function registerUser(username, email, password) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      email,
      password,
      displayName: username.charAt(0).toUpperCase() + username.slice(1)
    })
  });
  return res.json();
}

async function login(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (data.success) {
    token = data.data.tokens.accessToken;
  }
  return data;
}

async function createCommunity(name, displayName, description) {
  const res = await fetch(`${API_URL}/communities`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name,
      displayName,
      description,
      type: 'public'
    })
  });
  return res.json();
}

async function createPost(communityId, title, content) {
  const res = await fetch(`${API_URL}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      communityId,
      title,
      content,
      type: 'text'
    })
  });
  return res.json();
}

async function createServer(name, description) {
  const res = await fetch(`${API_URL}/servers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name,
      description,
      icon: null
    })
  });
  return res.json();
}

async function seedData() {
  console.log('🌱 Starting seed data creation...\n');
  
  // Create users
  console.log('Creating users...');
  const users = [
    { username: 'alice', email: 'alice@example.com', password: 'Password123!' },
    { username: 'bob', email: 'bob@example.com', password: 'Password123!' },
    { username: 'charlie', email: 'charlie@example.com', password: 'Password123!' }
  ];
  
  for (const user of users) {
    try {
      const result = await registerUser(user.username, user.email, user.password);
      if (result.success) {
        console.log(`✅ Created user: ${user.username}`);
      } else {
        console.log(`⚠️  User ${user.username} may already exist`);
      }
    } catch (e) {
      console.log(`⚠️  User ${user.username} may already exist`);
    }
  }
  
  // Login as alice
  console.log('\nLogging in as alice...');
  const loginResult = await login('alice@example.com', 'Password123!');
  if (loginResult.success) {
    console.log('✅ Logged in successfully');
  }
  
  // Create communities
  console.log('\nCreating communities...');
  const communities = [
    { name: 'technology', displayName: 'Technology', description: 'Discuss the latest in tech' },
    { name: 'gaming', displayName: 'Gaming', description: 'Gaming discussions and news' },
    { name: 'music', displayName: 'Music', description: 'Share and discuss music' }
  ];
  
  const communityIds = [];
  for (const community of communities) {
    try {
      const result = await createCommunity(community.name, community.displayName, community.description);
      if (result.success) {
        console.log(`✅ Created community: r/${community.name}`);
        communityIds.push(result.data.id);
      } else {
        console.log(`⚠️  Community ${community.name} may already exist`);
      }
    } catch (e) {
      console.log(`⚠️  Community ${community.name} error: ${e.message}`);
    }
  }
  
  // Create posts
  if (communityIds.length > 0) {
    console.log('\nCreating sample posts...');
    const posts = [
      { title: 'Welcome to the Technology community!', content: 'This is our first post. Feel free to share tech news and discussions!' },
      { title: 'Latest AI developments', content: 'What do you think about the recent advances in AI?' },
      { title: 'Best programming languages to learn in 2025', content: 'Share your recommendations!' }
    ];
    
    for (const post of posts) {
      try {
        const result = await createPost(communityIds[0], post.title, post.content);
        if (result.success) {
          console.log(`✅ Created post: ${post.title.substring(0, 30)}...`);
        }
      } catch (e) {
        console.log(`⚠️  Post creation error: ${e.message}`);
      }
    }
  }
  
  // Create Discord-style servers
  console.log('\nCreating Discord-style servers...');
  const servers = [
    { name: 'Cryb Official', description: 'The official Cryb platform server' },
    { name: 'Dev Community', description: 'A place for developers to hang out' }
  ];
  
  for (const server of servers) {
    try {
      const result = await createServer(server.name, server.description);
      if (result.success) {
        console.log(`✅ Created server: ${server.name}`);
      }
    } catch (e) {
      console.log(`⚠️  Server creation error: ${e.message}`);
    }
  }
  
  console.log('\n✨ Seed data creation complete!');
}

seedData().catch(console.error);