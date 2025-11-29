# CRYB Platform API - Quick Start Guide

Welcome to the CRYB Platform API! This guide will help you get started with integrating Discord-style chat and Reddit-style communities into your application.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication Flow](#authentication-flow)
3. [Common Use Cases](#common-use-cases)
4. [Code Examples](#code-examples)
5. [Real-time Features](#real-time-features)
6. [Error Handling](#error-handling)
7. [Next Steps](#next-steps)

---

## Getting Started

### Base URL

**Development:** `http://localhost:3000`  
**Production:** `https://api.cryb.ai`

### Prerequisites

- Basic understanding of REST APIs
- API client (curl, Postman, or your preferred HTTP library)
- For real-time features: WebSocket client support

### Quick Setup Checklist

 Get your API base URL  
 Create a user account  
 Obtain authentication token  
 Make your first API call  
 Set up real-time connection (optional)

---

## Authentication Flow

### Step 1: Register a New User

```bash
curl -X POST "http://localhost:3000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "myusername",
    "displayName": "My Display Name",
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "confirmPassword": "SecurePassword123!"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "username": "myusername",
      "displayName": "My Display Name",
      "email": "user@example.com"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "refresh_token_here",
      "expiresAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### Step 2: Login (if already registered)

```bash
curl -X POST "http://localhost:3000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

### Step 3: Use Authentication Token

Include the token in all subsequent requests:

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  "http://localhost:3000/api/v1/users/me"
```

### Step 4: Refresh Token (when expired)

```bash
curl -X POST "http://localhost:3000/api/v1/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your_refresh_token"
  }'
```

---

## Common Use Cases

### 1. Discord-Style Chat Application

#### Create a Server
```bash
curl -X POST "http://localhost:3000/api/v1/servers" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Gaming Server",
    "description": "A place for gamers to connect",
    "isPublic": true,
    "category": "GAMING"
  }'
```

#### Create Text Channels
```bash
curl -X POST "http://localhost:3000/api/v1/channels" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "general",
    "type": "TEXT",
    "serverId": "server_123",
    "topic": "General discussion"
  }'
```

#### Send Messages
```bash
curl -X POST "http://localhost:3000/api/v1/messages" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "channelId": "channel_123",
    "content": "Hello everyone! 👋"
  }'
```

### 2. Reddit-Style Community Features

#### Create a Community
```bash
curl -X POST "http://localhost:3000/api/v1/communities" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "technology",
    "displayName": "Technology",
    "description": "Discussion about technology trends",
    "isPublic": true,
    "category": "TECHNOLOGY"
  }'
```

#### Create a Post
```bash
curl -X POST "http://localhost:3000/api/v1/posts" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Amazing New Tech Breakthrough",
    "content": "This new technology will change everything...",
    "type": "TEXT",
    "communityId": "community_123"
  }'
```

#### Add Comments
```bash
curl -X POST "http://localhost:3000/api/v1/comments" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "postId": "post_123",
    "content": "Great post! Thanks for sharing."
  }'
```

### 3. Voice & Video Integration

#### Join Voice Channel
```bash
curl -X POST "http://localhost:3000/api/v1/voice/channels/channel_123/join" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mute": false,
    "deaf": false,
    "video": false
  }'
```

**Response includes LiveKit connection details:**
```json
{
  "success": true,
  "data": {
    "token": "livekit_token_here",
    "serverUrl": "wss://voice.cryb.ai",
    "roomName": "channel_123"
  }
}
```

---

## Code Examples

### JavaScript/TypeScript

```javascript
class CrybClient {
  constructor(baseUrl, token) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async request(method, endpoint, data = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, options);
    return response.json();
  }

  // Authentication
  async register(userData) {
    return this.request('POST', '/api/v1/auth/register', userData);
  }

  async login(credentials) {
    return this.request('POST', '/api/v1/auth/login', credentials);
  }

  // User management
  async getCurrentUser() {
    return this.request('GET', '/api/v1/users/me');
  }

  // Messaging
  async sendMessage(channelId, content) {
    return this.request('POST', '/api/v1/messages', {
      channelId,
      content
    });
  }

  async getMessages(channelId, page = 1, limit = 50) {
    return this.request('GET', `/api/v1/messages?channelId=${channelId}&page=${page}&limit=${limit}`);
  }

  // Communities
  async createPost(postData) {
    return this.request('POST', '/api/v1/posts', postData);
  }

  async getPosts(options = {}) {
    const params = new URLSearchParams({
      page: options.page || 1,
      limit: options.limit || 25,
      sort: options.sort || 'hot',
      ...options
    });
    return this.request('GET', `/api/v1/posts?${params}`);
  }
}

// Usage example
const client = new CrybClient('http://localhost:3000', 'your_token_here');

// Send a message
const message = await client.sendMessage('channel_123', 'Hello world!');
console.log('Message sent:', message);

// Get posts
const posts = await client.getPosts({ sort: 'new', limit: 10 });
console.log('Latest posts:', posts);
```

### Python

```python
import requests
import json

class CrybClient:
    def __init__(self, base_url, token=None):
        self.base_url = base_url
        self.token = token
        self.session = requests.Session()
        if token:
            self.session.headers.update({
                'Authorization': f'Bearer {token}'
            })

    def request(self, method, endpoint, data=None):
        url = f"{self.base_url}{endpoint}"
        if data:
            response = self.session.request(method, url, json=data)
        else:
            response = self.session.request(method, url)
        return response.json()

    # Authentication
    def register(self, user_data):
        return self.request('POST', '/api/v1/auth/register', user_data)

    def login(self, email, password):
        return self.request('POST', '/api/v1/auth/login', {
            'email': email,
            'password': password
        })

    # User management
    def get_current_user(self):
        return self.request('GET', '/api/v1/users/me')

    # Messaging
    def send_message(self, channel_id, content):
        return self.request('POST', '/api/v1/messages', {
            'channelId': channel_id,
            'content': content
        })

    def get_messages(self, channel_id, page=1, limit=50):
        return self.request('GET', f'/api/v1/messages?channelId={channel_id}&page={page}&limit={limit}')

    # Communities
    def create_post(self, title, content, community_id, post_type='TEXT'):
        return self.request('POST', '/api/v1/posts', {
            'title': title,
            'content': content,
            'communityId': community_id,
            'type': post_type
        })

    def get_posts(self, **kwargs):
        params = {
            'page': kwargs.get('page', 1),
            'limit': kwargs.get('limit', 25),
            'sort': kwargs.get('sort', 'hot'),
            **kwargs
        }
        query_string = '&'.join([f"{k}={v}" for k, v in params.items()])
        return self.request('GET', f'/api/v1/posts?{query_string}')

# Usage example
client = CrybClient('http://localhost:3000')

# Register a new user
user_data = {
    'username': 'pythonuser',
    'displayName': 'Python User',
    'email': 'python@example.com',
    'password': 'SecurePass123!',
    'confirmPassword': 'SecurePass123!'
}

result = client.register(user_data)
if result['success']:
    token = result['data']['tokens']['accessToken']
    client.token = token
    client.session.headers.update({'Authorization': f'Bearer {token}'})
    
    # Send a message
    message = client.send_message('channel_123', 'Hello from Python!')
    print('Message sent:', message)
```

---

## Real-time Features

### WebSocket Connection

```javascript
import io from 'socket.io-client';

// Connect to the real-time server
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your_jwt_token'
  }
});

// Listen for connection
socket.on('connect', () => {
  console.log('Connected to CRYB real-time server');
});

// Listen for new messages
socket.on('message:new', (message) => {
  console.log('New message:', message);
  // Update your UI with the new message
});

// Listen for user typing
socket.on('user:typing:start', (data) => {
  console.log(`${data.username} is typing in ${data.channelId}`);
});

socket.on('user:typing:stop', (data) => {
  console.log(`${data.username} stopped typing`);
});

// Listen for voice events
socket.on('voice:user:join', (data) => {
  console.log(`${data.username} joined voice channel`);
});

// Send typing indicator
function startTyping(channelId) {
  socket.emit('typing:start', { channelId });
}

function stopTyping(channelId) {
  socket.emit('typing:stop', { channelId });
}

// Join a channel for real-time updates
socket.emit('channel:join', { channelId: 'channel_123' });
```

### Voice Integration with LiveKit

```javascript
import { Room, RoomEvent } from 'livekit-client';

async function joinVoiceChannel(channelId) {
  // Get voice token from API
  const response = await fetch(`/api/v1/voice/channels/${channelId}/join`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${your_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      mute: false,
      deaf: false,
      video: false
    })
  });

  const { data } = await response.json();

  // Connect to LiveKit room
  const room = new Room();
  
  room.on(RoomEvent.ParticipantConnected, (participant) => {
    console.log('Participant connected:', participant.identity);
  });

  room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
    if (track.kind === 'audio') {
      const audioElement = track.attach();
      document.body.appendChild(audioElement);
    }
  });

  await room.connect(data.serverUrl, data.token);
  
  // Enable microphone
  await room.localParticipant.enableCameraAndMicrophone();
}
```

---

## Error Handling

### Standard Error Format

All API errors follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "specific error details"
  }
}
```

### Common Error Codes

| Code | Description | Action |
|------|-------------|--------|
| `UNAUTHORIZED` | Invalid or expired token | Refresh token or re-login |
| `FORBIDDEN` | Insufficient permissions | Check user permissions |
| `NOT_FOUND` | Resource doesn't exist | Verify resource ID |
| `RATE_LIMITED` | Too many requests | Wait before retrying |
| `VALIDATION_ERROR` | Invalid input data | Check request parameters |

### Error Handling Example

```javascript
async function handleApiRequest(requestFunction) {
  try {
    const response = await requestFunction();
    
    if (!response.success) {
      switch (response.code) {
        case 'UNAUTHORIZED':
          // Refresh token or redirect to login
          await refreshToken();
          break;
        case 'RATE_LIMITED':
          // Wait and retry
          await new Promise(resolve => setTimeout(resolve, 60000));
          return handleApiRequest(requestFunction);
        case 'VALIDATION_ERROR':
          // Show validation errors to user
          showValidationErrors(response.details);
          break;
        default:
          // Show generic error message
          showErrorMessage(response.error);
      }
      return null;
    }
    
    return response.data;
  } catch (error) {
    console.error('Network error:', error);
    showErrorMessage('Network error. Please try again.');
    return null;
  }
}

// Usage
const user = await handleApiRequest(() => 
  fetch('/api/v1/users/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json())
);
```

---

## Next Steps

### 1. Explore Advanced Features

- **File Uploads**: Add image and file sharing to your chat
- **Moderation**: Implement content filtering and reporting
- **Analytics**: Track user engagement and usage metrics
- **Web3 Integration**: Add wallet connectivity and NFT features

### 2. Production Considerations

- **Rate Limiting**: Implement client-side rate limiting
- **Error Retry**: Add exponential backoff for failed requests
- **Offline Support**: Cache data for offline functionality
- **Security**: Validate all user inputs and sanitize content

### 3. Additional Resources

- **Full API Reference**: `/docs/API_REFERENCE.md`
- **Postman Collection**: `/docs/CRYB_API.postman_collection.json`
- **Swagger Documentation**: `http://localhost:3000/documentation`
- **Real-time Events**: See WebSocket event documentation
- **SDK Libraries**: Official SDKs for popular languages

### 4. Example Applications

#### Simple Chat App
```javascript
// Minimal chat application example
class SimpleChatApp {
  constructor(token) {
    this.client = new CrybClient('http://localhost:3000', token);
    this.setupSocket();
  }

  setupSocket() {
    this.socket = io('http://localhost:3000', {
      auth: { token: this.token }
    });

    this.socket.on('message:new', (message) => {
      this.displayMessage(message);
    });
  }

  async sendMessage(channelId, content) {
    const message = await this.client.sendMessage(channelId, content);
    if (message.success) {
      this.displayMessage(message.data);
    }
  }

  displayMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.innerHTML = `
      <strong>${message.user.displayName}:</strong>
      ${message.content}
      <small>${new Date(message.createdAt).toLocaleTimeString()}</small>
    `;
    document.getElementById('messages').appendChild(messageElement);
  }
}
```

#### Community Forum
```javascript
// Reddit-style community forum
class CommunityForum {
  constructor(token) {
    this.client = new CrybClient('http://localhost:3000', token);
  }

  async loadCommunityPosts(communityName, sort = 'hot') {
    const posts = await this.client.getPosts({
      community: communityName,
      sort: sort,
      limit: 25
    });

    if (posts.success) {
      this.displayPosts(posts.data.posts);
    }
  }

  async createPost(title, content, communityId) {
    const post = await this.client.createPost({
      title,
      content,
      communityId,
      type: 'TEXT'
    });

    if (post.success) {
      this.displayPost(post.data);
    }
  }

  async voteOnPost(postId, direction) {
    return this.client.request('POST', `/api/v1/posts/${postId}/vote`, {
      direction
    });
  }
}
```

### 5. Best Practices

- **Token Management**: Store tokens securely and handle expiration
- **Real-time Updates**: Use WebSocket events for live updates
- **User Experience**: Implement optimistic updates for better UX
- **Performance**: Paginate large data sets and implement lazy loading
- **Accessibility**: Follow web accessibility guidelines in your UI

---

## Support

- **Documentation**: [https://docs.cryb.ai](https://docs.cryb.ai)
- **API Support**: api-support@cryb.ai
- **Community Discord**: [https://discord.gg/cryb](https://discord.gg/cryb)
- **GitHub Issues**: [https://github.com/cryb-ai/platform](https://github.com/cryb-ai/platform)

Happy building with CRYB Platform! 