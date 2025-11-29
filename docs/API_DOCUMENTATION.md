# CRYB Platform API Documentation

## Overview

The CRYB Platform API provides a comprehensive REST API for building Discord-like chat applications combined with Reddit-style community features. The API supports real-time messaging, user authentication, content management, and social features.

**Base URL:** `https://api.cryb.ai`  
**Version:** v1  
**Authentication:** JWT Bearer Token  

## Table of Contents

1. [Authentication](#authentication)
2. [Users](#users)
3. [Communities](#communities)
4. [Posts](#posts)
5. [Comments](#comments)
6. [Messages](#messages)
7. [Channels](#channels)
8. [Servers](#servers)
9. [Files & Media](#files--media)
10. [Voice & Video](#voice--video)
11. [Search](#search)
12. [Notifications](#notifications)
13. [Moderation](#moderation)
14. [Analytics](#analytics)
15. [Web3 & NFT](#web3--nft)
16. [Rate Limits](#rate-limits)
17. [Error Handling](#error-handling)
18. [WebSocket Events](#websocket-events)

## Authentication

All API endpoints except registration and login require JWT authentication.

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "securePassword123",
  "displayName": "Display Name"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "username": "username",
      "displayName": "Display Name",
      "createdAt": "2024-01-01T00:00:00Z"
    },
    "tokens": {
      "accessToken": "jwt_token_here",
      "refreshToken": "refresh_token_here"
    }
  }
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh_token_here"
}
```

### Two-Factor Authentication
```http
POST /api/auth/2fa/enable
Authorization: Bearer jwt_token

{
  "password": "currentPassword"
}
```

```http
POST /api/auth/2fa/verify
Authorization: Bearer jwt_token

{
  "token": "123456"
}
```

## Users

### Get Current User
```http
GET /api/users/me
Authorization: Bearer jwt_token
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "username": "username",
    "displayName": "Display Name",
    "email": "user@example.com",
    "avatarUrl": "https://cdn.cryb.ai/avatars/user_123.jpg",
    "bio": "User bio text",
    "karma": 150,
    "followerCount": 25,
    "followingCount": 50,
    "badges": [
      {
        "id": "badge_1",
        "name": "Early Adopter",
        "icon": "🏆",
        "color": "#FFD700"
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Update User Profile
```http
PATCH /api/users/me
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "displayName": "New Display Name",
  "bio": "Updated bio text",
  "location": "City, Country"
}
```

### Get User by ID
```http
GET /api/users/:userId
Authorization: Bearer jwt_token
```

### Follow/Unfollow User
```http
POST /api/users/:userId/follow
Authorization: Bearer jwt_token
```

```http
DELETE /api/users/:userId/follow
Authorization: Bearer jwt_token
```

### Block/Unblock User
```http
POST /api/users/:userId/block
Authorization: Bearer jwt_token
```

```http
DELETE /api/users/:userId/block
Authorization: Bearer jwt_token
```

## Communities

### Get All Communities
```http
GET /api/communities
Authorization: Bearer jwt_token

Query Parameters:
- page: number (default: 1)
- limit: number (default: 20, max: 100)
- sort: string (hot, new, members, activity)
- category: string
- search: string
```

**Response:**
```json
{
  "success": true,
  "data": {
    "communities": [
      {
        "id": "community_123",
        "name": "technology",
        "displayName": "Technology",
        "description": "Discuss the latest in tech",
        "icon": "",
        "bannerUrl": "https://cdn.cryb.ai/banners/tech.jpg",
        "memberCount": 15420,
        "isJoined": true,
        "isOwner": false,
        "isModerator": false,
        "createdAt": "2024-01-01T00:00:00Z",
        "rules": [
          {
            "id": "rule_1",
            "title": "Be respectful",
            "description": "Treat all members with respect"
          }
        ]
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 100,
      "hasNext": true,
      "hasPrevious": false
    }
  }
}
```

### Create Community
```http
POST /api/communities
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "name": "mycommunity",
  "displayName": "My Community",
  "description": "A community for discussing my interests",
  "category": "technology",
  "isPrivate": false,
  "rules": [
    {
      "title": "Be respectful",
      "description": "Treat all members with respect"
    }
  ]
}
```

### Get Community Details
```http
GET /api/communities/:communityId
Authorization: Bearer jwt_token
```

### Join/Leave Community
```http
POST /api/communities/:communityId/join
Authorization: Bearer jwt_token
```

```http
DELETE /api/communities/:communityId/leave
Authorization: Bearer jwt_token
```

### Update Community Settings
```http
PATCH /api/communities/:communityId
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "description": "Updated description",
  "rules": [
    {
      "title": "New rule",
      "description": "New rule description"
    }
  ]
}
```

## Posts

### Get Posts
```http
GET /api/posts
Authorization: Bearer jwt_token

Query Parameters:
- communityId: string (optional)
- userId: string (optional)
- sort: string (hot, new, top, controversial)
- timeRange: string (hour, day, week, month, year, all)
- page: number (default: 1)
- limit: number (default: 20, max: 100)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "post_123",
        "title": "Exciting tech announcement",
        "content": "This is the post content...",
        "type": "text",
        "author": {
          "id": "user_456",
          "username": "techuser",
          "displayName": "Tech User",
          "avatarUrl": "https://cdn.cryb.ai/avatars/user_456.jpg"
        },
        "community": {
          "id": "community_123",
          "name": "technology",
          "displayName": "Technology"
        },
        "votes": 245,
        "userVote": 1,
        "commentCount": 32,
        "views": 1250,
        "images": [
          "https://cdn.cryb.ai/images/post_123_1.jpg"
        ],
        "isNsfw": false,
        "isSpoiler": false,
        "isPinned": false,
        "isLocked": false,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z",
        "tags": ["technology", "announcement"],
        "awards": [
          {
            "id": "award_1",
            "name": "Gold",
            "icon": "🥇",
            "count": 3
          }
        ]
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 200,
      "hasNext": true,
      "hasPrevious": false
    }
  }
}
```

### Create Post
```http
POST /api/posts
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "title": "My new post",
  "content": "This is the post content",
  "communityId": "community_123",
  "type": "text",
  "images": ["image_id_1", "image_id_2"],
  "tags": ["technology", "discussion"],
  "isNsfw": false,
  "isSpoiler": false,
  "scheduledAt": "2024-01-02T12:00:00Z"
}
```

### Get Single Post
```http
GET /api/posts/:postId
Authorization: Bearer jwt_token
```

### Update Post
```http
PATCH /api/posts/:postId
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "content": "Updated post content",
  "tags": ["updated", "technology"]
}
```

### Delete Post
```http
DELETE /api/posts/:postId
Authorization: Bearer jwt_token
```

### Vote on Post
```http
POST /api/posts/:postId/vote
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "voteType": 1  // 1 for upvote, -1 for downvote, 0 to remove vote
}
```

### Award Post
```http
POST /api/posts/:postId/award
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "awardId": "award_gold",
  "message": "Great post!"
}
```

## Comments

### Get Comments for Post
```http
GET /api/posts/:postId/comments
Authorization: Bearer jwt_token

Query Parameters:
- sort: string (best, top, new, controversial, old)
- limit: number (default: 50, max: 200)
- depth: number (default: 10, max: 20)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": "comment_123",
        "content": "Great post! Thanks for sharing.",
        "author": {
          "id": "user_789",
          "username": "commenter",
          "displayName": "Commenter",
          "avatarUrl": "https://cdn.cryb.ai/avatars/user_789.jpg"
        },
        "postId": "post_123",
        "parentId": null,
        "votes": 15,
        "userVote": 0,
        "depth": 0,
        "childCount": 3,
        "isEdited": false,
        "isDeleted": false,
        "createdAt": "2024-01-01T01:00:00Z",
        "updatedAt": "2024-01-01T01:00:00Z",
        "replies": [
          {
            "id": "comment_124",
            "content": "I agree!",
            "author": {
              "id": "user_456",
              "username": "replier",
              "displayName": "Replier",
              "avatarUrl": "https://cdn.cryb.ai/avatars/user_456.jpg"
            },
            "postId": "post_123",
            "parentId": "comment_123",
            "votes": 5,
            "userVote": 1,
            "depth": 1,
            "childCount": 0,
            "isEdited": false,
            "isDeleted": false,
            "createdAt": "2024-01-01T01:15:00Z",
            "updatedAt": "2024-01-01T01:15:00Z",
            "replies": []
          }
        ]
      }
    ]
  }
}
```

### Create Comment
```http
POST /api/posts/:postId/comments
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "content": "This is my comment",
  "parentId": "comment_123"  // Optional, for replies
}
```

### Update Comment
```http
PATCH /api/comments/:commentId
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "content": "Updated comment content"
}
```

### Vote on Comment
```http
POST /api/comments/:commentId/vote
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "voteType": 1  // 1 for upvote, -1 for downvote, 0 to remove vote
}
```

## Messages

### Get Direct Messages
```http
GET /api/messages/direct
Authorization: Bearer jwt_token

Query Parameters:
- withUserId: string (optional)
- page: number (default: 1)
- limit: number (default: 50, max: 100)
```

### Send Direct Message
```http
POST /api/messages/direct
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "recipientId": "user_456",
  "content": "Hello! How are you?",
  "attachments": ["file_id_1"]
}
```

### Get Channel Messages
```http
GET /api/channels/:channelId/messages
Authorization: Bearer jwt_token

Query Parameters:
- before: string (message ID)
- after: string (message ID)
- limit: number (default: 50, max: 100)
```

### Send Channel Message
```http
POST /api/channels/:channelId/messages
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "content": "Hello everyone!",
  "replyTo": "message_123",
  "attachments": ["file_id_1"],
  "mentions": ["user_456", "user_789"]
}
```

## Files & Media

### Upload File
```http
POST /api/files/upload
Authorization: Bearer jwt_token
Content-Type: multipart/form-data

Form Data:
- file: File (max 50MB)
- category: string (avatar, banner, attachment, etc.)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "file": {
      "id": "file_123",
      "filename": "image.jpg",
      "mimeType": "image/jpeg",
      "size": 1024000,
      "url": "https://cdn.cryb.ai/files/file_123.jpg",
      "thumbnailUrl": "https://cdn.cryb.ai/thumbnails/file_123.jpg",
      "variants": {
        "small": "https://cdn.cryb.ai/variants/file_123_small.jpg",
        "medium": "https://cdn.cryb.ai/variants/file_123_medium.jpg",
        "large": "https://cdn.cryb.ai/variants/file_123_large.jpg"
      }
    }
  }
}
```

### Get File
```http
GET /api/files/:fileId
Authorization: Bearer jwt_token
```

### Delete File
```http
DELETE /api/files/:fileId
Authorization: Bearer jwt_token
```

## Voice & Video

### Join Voice Channel
```http
POST /api/voice/channels/:channelId/join
Authorization: Bearer jwt_token
```

**Response:**
```json
{
  "success": true,
  "data": {
    "roomId": "voice_room_123",
    "token": "livekit_token_here",
    "wsUrl": "wss://voice.cryb.ai",
    "participants": [
      {
        "id": "user_456",
        "username": "speaker",
        "displayName": "Speaker",
        "isMuted": false,
        "isDeafened": false,
        "isSpeaking": true
      }
    ]
  }
}
```

### Leave Voice Channel
```http
POST /api/voice/channels/:channelId/leave
Authorization: Bearer jwt_token
```

### Start Video Call
```http
POST /api/voice/calls/start
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "participants": ["user_456", "user_789"],
  "type": "direct"  // "direct" or "group"
}
```

### Update Voice State
```http
PATCH /api/voice/state
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "isMuted": true,
  "isDeafened": false,
  "isVideoEnabled": true
}
```

## Search

### Search Content
```http
GET /api/search
Authorization: Bearer jwt_token

Query Parameters:
- q: string (search query)
- type: string (posts, comments, users, communities, all)
- sort: string (relevance, recent, popular)
- page: number (default: 1)
- limit: number (default: 20, max: 100)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": {
      "posts": [
        {
          "id": "post_123",
          "title": "Search result title",
          "content": "Highlighted search content...",
          "community": {
            "name": "technology",
            "displayName": "Technology"
          },
          "author": {
            "username": "author",
            "displayName": "Author"
          },
          "relevanceScore": 0.95
        }
      ],
      "users": [],
      "communities": []
    },
    "totalResults": 45,
    "searchTime": 0.123
  }
}
```

## Notifications

### Get Notifications
```http
GET /api/notifications
Authorization: Bearer jwt_token

Query Parameters:
- type: string (all, mentions, replies, likes, follows)
- read: boolean
- page: number (default: 1)
- limit: number (default: 20, max: 100)
```

### Mark Notification as Read
```http
PATCH /api/notifications/:notificationId/read
Authorization: Bearer jwt_token
```

### Mark All Notifications as Read
```http
PATCH /api/notifications/read-all
Authorization: Bearer jwt_token
```

### Update Notification Settings
```http
PATCH /api/notifications/settings
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "pushEnabled": true,
  "emailEnabled": false,
  "types": {
    "mentions": true,
    "replies": true,
    "likes": false,
    "follows": true
  }
}
```

## Rate Limits

The API implements rate limiting to ensure fair usage:

- **Authentication endpoints**: 10 requests per minute
- **Content creation**: 30 requests per minute
- **General API**: 100 requests per minute
- **Search**: 50 requests per minute

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    },
    "timestamp": "2024-01-01T00:00:00Z",
    "requestId": "req_123456"
  }
}
```

### Common Error Codes

- `UNAUTHORIZED` (401): Invalid or missing authentication
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `VALIDATION_ERROR` (400): Invalid input data
- `RATE_LIMITED` (429): Rate limit exceeded
- `INTERNAL_ERROR` (500): Server error

## WebSocket Events

Connect to `wss://api.cryb.ai/socket` with JWT token for real-time updates.

### Authentication
```javascript
socket.emit('authenticate', { token: 'jwt_token_here' });
```

### Message Events
```javascript
// Send message
socket.emit('message:send', {
  channelId: 'channel_123',
  content: 'Hello world!',
  replyTo: 'message_456'
});

// Receive message
socket.on('message:received', (data) => {
  console.log('New message:', data);
});

// Typing indicators
socket.emit('typing:start', { channelId: 'channel_123' });
socket.emit('typing:stop', { channelId: 'channel_123' });
```

### Presence Events
```javascript
// User online/offline
socket.on('user:online', (data) => {
  console.log('User came online:', data.userId);
});

socket.on('user:offline', (data) => {
  console.log('User went offline:', data.userId);
});
```

### Voice Events
```javascript
// Voice state changes
socket.on('voice:user-joined', (data) => {
  console.log('User joined voice:', data);
});

socket.on('voice:user-left', (data) => {
  console.log('User left voice:', data);
});
```

## SDKs and Libraries

### JavaScript/TypeScript
```bash
npm install @cryb/api-client
```

```javascript
import { CrybAPI } from '@cryb/api-client';

const api = new CrybAPI({
  baseURL: 'https://api.cryb.ai',
  token: 'your_jwt_token'
});

// Get user profile
const user = await api.users.me();

// Create a post
const post = await api.posts.create({
  title: 'My Post',
  content: 'Post content',
  communityId: 'community_123'
});
```

### React Hooks
```bash
npm install @cryb/react-hooks
```

```jsx
import { useUser, usePosts, useSocket } from '@cryb/react-hooks';

function App() {
  const { user, loading } = useUser();
  const { posts, createPost } = usePosts();
  const { socket, connected } = useSocket();

  return (
    <div>
      <h1>Welcome, {user?.displayName}</h1>
      {/* Your app content */}
    </div>
  );
}
```

---

For more detailed examples and advanced usage, visit our [developer portal](https://developers.cryb.ai).

**Support:** [support@cryb.ai](mailto:support@cryb.ai)  
**Documentation:** [docs.cryb.ai](https://docs.cryb.ai)  
**Status:** [status.cryb.ai](https://status.cryb.ai)