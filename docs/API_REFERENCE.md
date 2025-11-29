# CRYB Platform API Reference

## Overview

The CRYB Platform API provides a comprehensive REST API for building Discord-like chat applications combined with Reddit-style community features. The API supports real-time messaging, user authentication, content management, voice/video communication, and social features.

**Base URL:** `https://api.cryb.ai` (Production) / `http://localhost:3000` (Development)  
**Version:** v1  
**Authentication:** JWT Bearer Token  
**Content-Type:** `application/json`

## Authentication

All API endpoints except registration and login require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

### Authentication Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes (most endpoints) | Bearer JWT token |
| `Content-Type` | Yes | Must be `application/json` for JSON requests |
| `User-Agent` | Recommended | Client identification |

### Rate Limiting

- **Auth endpoints:** 5 requests per 15 minutes per IP/identifier
- **General endpoints:** Enhanced rate limiting with Redis-based tracking
- **File uploads:** Special limits based on file size and type

## Error Responses

All errors follow a consistent format:

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

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 429 | Rate Limited |
| 500 | Internal Server Error |

---

## Authentication Endpoints

### Register User
Creates a new user account with email/password or Web3 wallet.

```http
POST /api/v1/auth/register
```

**Request Body:**
```json
{
  "username": "myusername",
  "displayName": "My Display Name",
  "email": "user@example.com",
  "password": "securePassword123",
  "confirmPassword": "securePassword123",
  "walletAddress": "0x...", // Optional for Web3 auth
  "signature": "...", // Required if walletAddress provided
  "message": "..." // Required if walletAddress provided
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "username": "myusername",
      "displayName": "My Display Name",
      "email": "user@example.com",
      "walletAddress": "0x...",
      "isVerified": false
    },
    "tokens": {
      "accessToken": "jwt_token_here",
      "refreshToken": "refresh_token_here",
      "expiresAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### Login User
Authenticate existing user with email/password or Web3 wallet.

```http
POST /api/v1/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
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
      "accessToken": "jwt_token_here",
      "refreshToken": "refresh_token_here",
      "expiresAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### Refresh Token
Get a new access token using refresh token.

```http
POST /api/v1/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

### Logout
Invalidate current session tokens.

```http
POST /api/v1/auth/logout
```

**Headers:** `Authorization: Bearer <token>`

---

## User Management

### Get Current User
Get authenticated user's profile information.

```http
GET /api/v1/users/me
```

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "username": "myusername",
    "displayName": "My Display Name",
    "email": "user@example.com",
    "avatar": "https://cdn.cryb.ai/avatars/user_123.jpg",
    "banner": "https://cdn.cryb.ai/banners/user_123.jpg",
    "bio": "My bio",
    "pronouns": "they/them",
    "isVerified": true,
    "isBot": false,
    "premiumType": "PLUS",
    "locale": "en-US",
    "friendCount": 42,
    "presence": {
      "status": "ONLINE",
      "clientStatus": "desktop",
      "activities": []
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Update Current User
Update authenticated user's profile.

```http
PATCH /api/v1/users/me
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "displayName": "New Display Name",
  "bio": "Updated bio",
  "pronouns": "she/her",
  "avatar": "https://cdn.cryb.ai/avatars/new_avatar.jpg"
}
```

### Get User by ID
Get public profile of any user.

```http
GET /api/v1/users/{userId}
```

**Parameters:**
- `userId` (path): User ID

### Update User Presence
Update user's online status and activities.

```http
POST /api/v1/users/me/presence
```

**Request Body:**
```json
{
  "status": "ONLINE",
  "clientStatus": "desktop",
  "activities": [
    {
      "type": "GAME",
      "name": "Playing Minecraft",
      "details": "Building a castle",
      "state": "In creative mode"
    }
  ]
}
```

---

## Server Management

### Get User's Servers
Get all servers the authenticated user is a member of.

```http
GET /api/v1/servers
```

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "server_123",
      "name": "My Gaming Server",
      "description": "A place for gamers",
      "icon": "https://cdn.cryb.ai/icons/server_123.jpg",
      "banner": "https://cdn.cryb.ai/banners/server_123.jpg",
      "isPublic": true,
      "category": "GAMING",
      "memberCount": 1250,
      "channelCount": 12,
      "owner": {
        "id": "user_456",
        "username": "serverowner",
        "displayName": "Server Owner"
      }
    }
  ]
}
```

### Create Server
Create a new Discord-style server.

```http
POST /api/v1/servers
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "My New Server",
  "description": "A great community server",
  "icon": "https://cdn.cryb.ai/icons/new_server.jpg",
  "isPublic": true,
  "category": "GAMING",
  "maxMembers": 1000,
  "verificationLevel": 0,
  "nsfw": false
}
```

### Get Server Details
Get detailed information about a server.

```http
GET /api/v1/servers/{serverId}
```

**Parameters:**
- `serverId` (path): Server ID

### Update Server
Update server settings (owner/admin only).

```http
PATCH /api/v1/servers/{serverId}
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Updated Server Name",
  "description": "Updated description",
  "verificationLevel": "MEDIUM"
}
```

### Delete Server
Delete a server (owner only).

```http
DELETE /api/v1/servers/{serverId}
```

### Get Server Members
Get list of server members.

```http
GET /api/v1/servers/{serverId}/members
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 50, max: 100)

### Join Server
Join a server via invite code.

```http
POST /api/v1/servers/{serverId}/join
```

**Request Body:**
```json
{
  "inviteCode": "abc123xyz"
}
```

### Leave Server
Leave a server.

```http
DELETE /api/v1/servers/{serverId}/members/me
```

### Create Server Invite
Create an invite link for the server.

```http
POST /api/v1/servers/{serverId}/invites
```

**Request Body:**
```json
{
  "maxUses": 10,
  "maxAge": 86400,
  "temporary": false,
  "channelId": "channel_123"
}
```

---

## Channel Management

### Get Server Channels
Get all channels in a server.

```http
GET /api/v1/servers/{serverId}/channels
```

### Create Channel
Create a new channel in a server.

```http
POST /api/v1/channels
```

**Request Body:**
```json
{
  "name": "general-chat",
  "type": "TEXT",
  "serverId": "server_123",
  "topic": "General discussion",
  "isPrivate": false,
  "parentId": "category_456",
  "position": 1
}
```

**Channel Types:**
- `TEXT` - Text channel
- `VOICE` - Voice channel
- `CATEGORY` - Channel category
- `STAGE` - Stage channel
- `ANNOUNCEMENT` - Announcement channel

### Get Channel Details
Get detailed information about a channel.

```http
GET /api/v1/channels/{channelId}
```

### Update Channel
Update channel settings.

```http
PATCH /api/v1/channels/{channelId}
```

**Request Body:**
```json
{
  "name": "updated-channel-name",
  "topic": "Updated topic",
  "position": 2
}
```

### Delete Channel
Delete a channel.

```http
DELETE /api/v1/channels/{channelId}
```

---

## Messaging

### Get Messages
Get messages from a channel with pagination.

```http
GET /api/v1/messages?channelId={channelId}
```

**Query Parameters:**
- `channelId` (string, required): Channel ID
- `page` (number): Page number (default: 1)
- `limit` (number): Messages per page (default: 50, max: 100)
- `before` (string): Get messages before this message ID
- `after` (string): Get messages after this message ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "msg_123",
        "content": "Hello world!",
        "channelId": "channel_123",
        "userId": "user_456",
        "user": {
          "id": "user_456",
          "username": "sender",
          "displayName": "Message Sender",
          "avatar": "https://cdn.cryb.ai/avatars/user_456.jpg"
        },
        "attachments": [],
        "embeds": [],
        "reactions": [],
        "editedAt": null,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 1250,
      "page": 1,
      "pageSize": 50,
      "hasMore": true
    }
  }
}
```

### Send Message
Send a new message to a channel.

```http
POST /api/v1/messages
```

**Request Body:**
```json
{
  "channelId": "channel_123",
  "content": "Hello everyone! 👋",
  "replyTo": "msg_456", // Optional: Reply to another message
  "attachments": [
    {
      "id": "attachment_789",
      "filename": "image.jpg",
      "size": 102400,
      "contentType": "image/jpeg",
      "url": "https://cdn.cryb.ai/attachments/attachment_789.jpg"
    }
  ]
}
```

### Edit Message
Edit an existing message.

```http
PATCH /api/v1/messages/{messageId}
```

**Request Body:**
```json
{
  "content": "Updated message content"
}
```

### Delete Message
Delete a message.

```http
DELETE /api/v1/messages/{messageId}
```

### Add Reaction
Add an emoji reaction to a message.

```http
POST /api/v1/messages/{messageId}/reactions
```

**Request Body:**
```json
{
  "emoji": "👍"
}
```

### Remove Reaction
Remove an emoji reaction from a message.

```http
DELETE /api/v1/messages/{messageId}/reactions/{emoji}
```

---

## Communities (Reddit-style)

### Get Communities
Get list of public communities.

```http
GET /api/v1/communities
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Communities per page (default: 20, max: 100)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "community_123",
        "name": "technology",
        "displayName": "Technology",
        "description": "Discussion about technology",
        "icon": "https://cdn.cryb.ai/communities/tech.jpg",
        "banner": "https://cdn.cryb.ai/communities/tech_banner.jpg",
        "isPublic": true,
        "memberCount": 15420,
        "postCount": 1250,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 156,
    "page": 1,
    "pageSize": 20,
    "hasMore": true
  }
}
```

### Get Community Details
Get detailed information about a community.

```http
GET /api/v1/communities/{communityName}
```

**Parameters:**
- `communityName` (path): Community name (e.g., "technology")

### Create Community
Create a new community.

```http
POST /api/v1/communities
```

**Request Body:**
```json
{
  "name": "mycommunity",
  "displayName": "My Community",
  "description": "A place for discussing my interests",
  "isPublic": true,
  "category": "TECHNOLOGY",
  "rules": [
    "Be respectful",
    "No spam",
    "Stay on topic"
  ]
}
```

### Join Community
Join a community.

```http
POST /api/v1/communities/{communityName}/join
```

### Leave Community
Leave a community.

```http
DELETE /api/v1/communities/{communityName}/members/me
```

---

## Posts (Reddit-style)

### Get Posts
Get posts with filtering and sorting options.

```http
GET /api/v1/posts
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Posts per page (default: 25, max: 100)
- `sort` (string): Sort order (`hot`, `new`, `top`, `controversial`)
- `timeFrame` (string): Time filter (`hour`, `day`, `week`, `month`, `year`, `all`)
- `community` (string): Filter by community name

**Response (200):**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "post_123",
        "title": "Amazing Technology Discovery",
        "content": "Check out this new breakthrough...",
        "type": "TEXT",
        "url": null,
        "imageUrl": "https://cdn.cryb.ai/posts/post_123.jpg",
        "score": 1520,
        "commentCount": 89,
        "viewCount": 15420,
        "isNsfw": false,
        "isStickied": false,
        "user": {
          "id": "user_123",
          "username": "techuser",
          "displayName": "Tech User"
        },
        "community": {
          "id": "community_123",
          "name": "technology",
          "displayName": "Technology"
        },
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 5420,
      "page": 1,
      "pageSize": 25,
      "hasMore": true
    }
  }
}
```

### Create Post
Create a new post.

```http
POST /api/v1/posts
```

**Request Body:**
```json
{
  "title": "My Awesome Post",
  "content": "This is the content of my post...",
  "type": "TEXT",
  "communityId": "community_123",
  "url": "https://example.com", // For LINK posts
  "imageUrl": "https://cdn.cryb.ai/uploads/image.jpg", // For IMAGE posts
  "isNsfw": false
}
```

**Post Types:**
- `TEXT` - Text post
- `LINK` - Link post
- `IMAGE` - Image post
- `VIDEO` - Video post

### Get Post Details
Get detailed information about a specific post.

```http
GET /api/v1/posts/{postId}
```

### Update Post
Update a post (author only).

```http
PATCH /api/v1/posts/{postId}
```

### Delete Post
Delete a post (author or moderator only).

```http
DELETE /api/v1/posts/{postId}
```

### Vote on Post
Upvote or downvote a post.

```http
POST /api/v1/posts/{postId}/vote
```

**Request Body:**
```json
{
  "direction": "UP" // or "DOWN" or "NONE" to remove vote
}
```

---

## Comments

### Get Comments
Get comments for a post.

```http
GET /api/v1/comments?postId={postId}
```

**Query Parameters:**
- `postId` (string, required): Post ID
- `sort` (string): Sort order (`best`, `new`, `old`, `controversial`)
- `limit` (number): Comments per page (default: 50, max: 100)

### Create Comment
Create a new comment on a post.

```http
POST /api/v1/comments
```

**Request Body:**
```json
{
  "postId": "post_123",
  "content": "Great post! Thanks for sharing.",
  "parentId": "comment_456" // Optional: Reply to another comment
}
```

### Update Comment
Update a comment (author only).

```http
PATCH /api/v1/comments/{commentId}
```

### Delete Comment
Delete a comment (author or moderator only).

```http
DELETE /api/v1/comments/{commentId}
```

### Vote on Comment
Upvote or downvote a comment.

```http
POST /api/v1/comments/{commentId}/vote
```

---

## Voice & Video

### Join Voice Channel
Join a voice channel and get WebRTC connection details.

```http
POST /api/v1/voice/channels/{channelId}/join
```

**Request Body:**
```json
{
  "mute": false,
  "deaf": false,
  "video": false,
  "screenShare": false,
  "quality": "auto", // auto, low, medium, high
  "bandwidth": 1000 // kbps, optional
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "livekit_token_here",
    "serverUrl": "wss://voice.cryb.ai",
    "roomName": "channel_123",
    "participantId": "user_123",
    "permissions": {
      "canSpeak": true,
      "canVideo": true,
      "canScreenShare": true
    }
  }
}
```

### Leave Voice Channel
Leave a voice channel.

```http
POST /api/v1/voice/channels/{channelId}/leave
```

### Get Voice Status
Get current voice connection status.

```http
GET /api/v1/voice/status
```

### Update Voice State
Update voice settings (mute, deaf, etc.).

```http
PATCH /api/v1/voice/state
```

**Request Body:**
```json
{
  "mute": true,
  "deaf": false,
  "video": false,
  "screenShare": false
}
```

---

## File Uploads

### Upload File
Upload a file (image, video, document).

```http
POST /api/v1/uploads
```

**Request Body:** `multipart/form-data`
- `file` (file): The file to upload
- `type` (string): Upload type (`avatar`, `banner`, `attachment`, `emoji`)
- `channelId` (string): Channel ID (for attachments)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "upload_123",
    "filename": "image.jpg",
    "originalName": "my-image.jpg",
    "size": 102400,
    "contentType": "image/jpeg",
    "url": "https://cdn.cryb.ai/uploads/upload_123.jpg",
    "thumbnailUrl": "https://cdn.cryb.ai/uploads/upload_123_thumb.jpg",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Get Upload Details
Get information about an uploaded file.

```http
GET /api/v1/uploads/{uploadId}
```

### Delete Upload
Delete an uploaded file.

```http
DELETE /api/v1/uploads/{uploadId}
```

---

## Search

### Search Content
Search across posts, comments, users, and communities.

```http
GET /api/v1/search
```

**Query Parameters:**
- `q` (string, required): Search query
- `type` (string): Content type (`all`, `posts`, `comments`, `users`, `communities`)
- `sort` (string): Sort order (`relevance`, `new`, `top`)
- `time` (string): Time filter (`all`, `day`, `week`, `month`, `year`)
- `page` (number): Page number
- `limit` (number): Results per page

**Response (200):**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "type": "post",
        "id": "post_123",
        "title": "Search Result Title",
        "snippet": "...highlighted search terms...",
        "score": 0.95,
        "url": "/posts/post_123"
      }
    ],
    "total": 156,
    "page": 1,
    "pageSize": 20
  }
}
```

---

## Notifications

### Get Notifications
Get user's notifications.

```http
GET /api/v1/notifications
```

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Notifications per page
- `unreadOnly` (boolean): Show only unread notifications

### Mark Notification as Read
Mark a notification as read.

```http
PATCH /api/v1/notifications/{notificationId}/read
```

### Mark All Notifications as Read
Mark all notifications as read.

```http
POST /api/v1/notifications/mark-all-read
```

---

## Moderation

### Report Content
Report a post, comment, or user.

```http
POST /api/v1/moderation/reports
```

**Request Body:**
```json
{
  "type": "POST", // POST, COMMENT, USER, MESSAGE
  "targetId": "post_123",
  "reason": "SPAM", // SPAM, HARASSMENT, HATE_SPEECH, etc.
  "description": "Additional details about the report"
}
```

### Get Moderation Actions
Get moderation history (moderators only).

```http
GET /api/v1/moderation/actions
```

---

## Analytics

### Get User Analytics
Get analytics for the current user.

```http
GET /api/v1/analytics/user
```

### Get Community Analytics
Get analytics for a community (moderators only).

```http
GET /api/v1/analytics/communities/{communityId}
```

### Get Server Analytics
Get analytics for a server (administrators only).

```http
GET /api/v1/analytics/servers/{serverId}
```

---

## Web3 & NFT Features

### Connect Wallet
Connect a Web3 wallet to the user account.

```http
POST /api/v1/web3/connect-wallet
```

**Request Body:**
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b8D6977E", 
  "signature": "0x...",
  "message": "Sign in to CRYB with wallet..."
}
```

### Get NFT Profile Pictures
Get available NFT profile pictures for the user.

```http
GET /api/v1/nft/profile-pictures
```

### Set NFT Profile Picture
Set an NFT as profile picture.

```http
POST /api/v1/nft/profile-pictures/{tokenId}/set
```

### Get Token Gates
Get token-gated communities/servers.

```http
GET /api/v1/token-gating/requirements
```

---

## WebSocket Events

The CRYB Platform supports real-time communication via WebSocket connections. Connect to `/socket.io` with your JWT token.

### Authentication
```javascript
const socket = io('wss://api.cryb.ai', {
  auth: {
    token: 'your_jwt_token'
  }
});
```

### Message Events
- `message:new` - New message in a channel
- `message:edit` - Message edited
- `message:delete` - Message deleted
- `message:reaction:add` - Reaction added to message
- `message:reaction:remove` - Reaction removed from message

### User Events
- `user:presence:update` - User presence/status changed
- `user:typing:start` - User started typing
- `user:typing:stop` - User stopped typing

### Voice Events
- `voice:user:join` - User joined voice channel
- `voice:user:leave` - User left voice channel
- `voice:state:update` - User voice state changed

### Server Events
- `server:member:join` - New member joined server
- `server:member:leave` - Member left server
- `server:channel:create` - New channel created
- `server:channel:update` - Channel updated
- `server:channel:delete` - Channel deleted

---

## SDK Examples

### JavaScript/TypeScript
```javascript
import { CrybClient } from '@cryb/client';

const client = new CrybClient({
  baseUrl: 'https://api.cryb.ai',
  token: 'your_jwt_token'
});

// Get current user
const user = await client.users.me();

// Send a message
const message = await client.messages.create({
  channelId: 'channel_123',
  content: 'Hello world!'
});

// Join voice channel
const voiceConnection = await client.voice.join('channel_456');
```

### Python
```python
import requests

class CrybClient:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def get_user(self):
        response = requests.get(f'{self.base_url}/api/v1/users/me', 
                               headers=self.headers)
        return response.json()
    
    def send_message(self, channel_id, content):
        data = {'channelId': channel_id, 'content': content}
        response = requests.post(f'{self.base_url}/api/v1/messages',
                                json=data, headers=self.headers)
        return response.json()

# Usage
client = CrybClient('https://api.cryb.ai', 'your_jwt_token')
user = client.get_user()
message = client.send_message('channel_123', 'Hello from Python!')
```

---

## Rate Limits

The API implements comprehensive rate limiting to ensure fair usage:

### Global Limits
- **Default:** 1000 requests per hour per authenticated user
- **Burst:** Up to 100 requests per minute

### Endpoint-Specific Limits
- **Authentication:** 5 attempts per 15 minutes per IP
- **Message sending:** 30 messages per minute per channel
- **File uploads:** 10 uploads per minute, max 50MB per upload
- **Voice operations:** 10 voice state changes per minute

### Rate Limit Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642694400
X-RateLimit-Retry-After: 60
```

---

## Pagination

Most list endpoints support pagination using these parameters:

### Query Parameters
- `page` (number): Page number (1-based, default: 1)
- `limit` (number): Items per page (default varies, max usually 100)

### Response Format
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "total": 1000,
      "page": 1,
      "pageSize": 25,
      "hasMore": true,
      "totalPages": 40
    }
  }
}
```

---

## Changelog

### v1.0.0 (Latest)
- Initial API release
- Complete Discord-style server and channel management
- Reddit-style community and post system
- Real-time messaging with WebSocket support
- Voice and video calling via LiveKit
- File upload and media management
- Web3 wallet integration
- NFT profile pictures
- Token gating features
- Comprehensive moderation tools
- Analytics and reporting
- AI-powered content moderation

---

## Support

For API support and questions:
- Documentation: [https://docs.cryb.ai](https://docs.cryb.ai)
- Support Email: api-support@cryb.ai
- Discord Server: [https://discord.gg/cryb](https://discord.gg/cryb)
- GitHub Issues: [https://github.com/cryb-ai/platform](https://github.com/cryb-ai/platform)