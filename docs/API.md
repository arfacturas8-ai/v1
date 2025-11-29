# CRYB Platform API Documentation

## Base URL
- Production: `https://api.cryb.ai/v1`
- Local: `http://localhost:3006/api/v1`

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### Register User
`POST /auth/register`

Request:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "username": "username",
  "displayName": "Display Name",
  "confirmPassword": "SecurePassword123!"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "username": "...", "email": "..." },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "...",
      "expiresAt": "2025-09-19T12:00:00Z"
    }
  }
}
```

#### Login
`POST /auth/login`

Request:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

#### Refresh Token
`POST /auth/refresh`

Request:
```json
{
  "refreshToken": "..."
}
```

#### Logout
`POST /auth/logout`

### Users

#### Get Current User
`GET /users/me`

Requires authentication.

Response:
```json
{
  "id": "...",
  "username": "...",
  "email": "...",
  "displayName": "...",
  "avatarUrl": "...",
  "bio": "...",
  "createdAt": "..."
}
```

#### Update Profile
`PUT /users/me`

Request:
```json
{
  "displayName": "New Name",
  "bio": "Updated bio",
  "avatarUrl": "https://..."
}
```

#### Get User by ID
`GET /users/:id`

### Communities

#### List Communities
`GET /communities`

Query Parameters:
- `page` (default: 1)
- `limit` (default: 20)
- `sort` (options: popular, new, active)
- `search` - Search term

#### Create Community
`POST /communities`

Request:
```json
{
  "name": "community-name",
  "displayName": "Community Name",
  "description": "Community description",
  "isPrivate": false,
  "rules": ["Rule 1", "Rule 2"]
}
```

#### Get Community
`GET /communities/:id`

#### Join Community
`POST /communities/:id/join`

#### Leave Community
`POST /communities/:id/leave`

### Posts

#### List Posts
`GET /posts`

Query Parameters:
- `communityId` - Filter by community
- `userId` - Filter by user
- `sort` (options: hot, new, top)
- `page` (default: 1)
- `limit` (default: 20)

#### Create Post
`POST /posts`

Request:
```json
{
  "communityId": "...",
  "title": "Post Title",
  "content": "Post content",
  "type": "text", // text, link, image, video
  "url": "https://...", // for link/media posts
  "tags": ["tag1", "tag2"]
}
```

#### Get Post
`GET /posts/:id`

#### Update Post
`PUT /posts/:id`

#### Delete Post
`DELETE /posts/:id`

#### Vote on Post
`POST /posts/:id/vote`

Request:
```json
{
  "vote": 1 // 1 for upvote, -1 for downvote, 0 to remove vote
}
```

### Comments

#### Get Comments
`GET /posts/:postId/comments`

Query Parameters:
- `sort` (options: best, new, old, controversial)
- `page` (default: 1)
- `limit` (default: 20)

#### Create Comment
`POST /comments`

Request:
```json
{
  "postId": "...",
  "parentId": "...", // optional, for replies
  "content": "Comment text"
}
```

#### Update Comment
`PUT /comments/:id`

#### Delete Comment
`DELETE /comments/:id`

#### Vote on Comment
`POST /comments/:id/vote`

### Messages

#### Get Conversations
`GET /messages/conversations`

#### Get Messages
`GET /messages/:conversationId`

Query Parameters:
- `before` - Message ID to paginate before
- `limit` (default: 50)

#### Send Message
`POST /messages`

Request:
```json
{
  "conversationId": "...",
  "content": "Message text",
  "attachments": [] // optional file URLs
}
```

#### Edit Message
`PUT /messages/:id`

#### Delete Message
`DELETE /messages/:id`

### Channels

#### List Channels
`GET /servers/:serverId/channels`

#### Create Channel
`POST /servers/:serverId/channels`

Request:
```json
{
  "name": "channel-name",
  "type": "text", // text, voice, video
  "topic": "Channel topic",
  "isPrivate": false
}
```

#### Get Channel
`GET /channels/:id`

#### Update Channel
`PUT /channels/:id`

#### Delete Channel
`DELETE /channels/:id`

### Voice/Video

#### Join Voice Channel
`POST /voice/channels/:id/join`

Response includes LiveKit connection token.

#### Leave Voice Channel
`POST /voice/channels/:id/leave`

#### Start Video Call
`POST /video/call`

Request:
```json
{
  "participants": ["userId1", "userId2"],
  "type": "direct" // direct, group
}
```

### File Upload

#### Upload File
`POST /uploads`

Multipart form data with file.

Response:
```json
{
  "url": "https://...",
  "type": "image",
  "size": 1024000,
  "mimeType": "image/jpeg"
}
```

### Search

#### Global Search
`GET /search`

Query Parameters:
- `q` - Search query
- `type` (options: all, posts, comments, users, communities)
- `page` (default: 1)
- `limit` (default: 20)

### Notifications

#### Get Notifications
`GET /notifications`

Query Parameters:
- `unread` (boolean)
- `page` (default: 1)
- `limit` (default: 20)

#### Mark as Read
`PUT /notifications/:id/read`

#### Mark All as Read
`PUT /notifications/read-all`

### Admin

#### Get Dashboard Stats
`GET /admin/stats`

Requires admin role.

#### Get Users (Admin)
`GET /admin/users`

Query Parameters:
- `search` - Search term
- `role` - Filter by role
- `status` - Filter by status
- `page` (default: 1)
- `limit` (default: 50)

#### Ban User
`POST /admin/users/:id/ban`

Request:
```json
{
  "reason": "Violation reason",
  "duration": 86400 // seconds, optional for permanent
}
```

#### Unban User
`POST /admin/users/:id/unban`

## Rate Limiting

- Authentication endpoints: 5 requests per minute
- General endpoints: 100 requests per minute
- File uploads: 10 per minute

## Error Responses

Standard error format:
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "statusCode": 400
}
```

Common error codes:
- `UNAUTHORIZED` - Missing or invalid token
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid request data
- `RATE_LIMITED` - Too many requests
- `SERVER_ERROR` - Internal server error

## WebSocket Events

Connect to `wss://platform.cryb.ai/socket.io` with authentication.

### Events

#### Client to Server
- `join-room` - Join a chat room
- `leave-room` - Leave a chat room
- `send-message` - Send a message
- `typing` - User is typing
- `stop-typing` - User stopped typing

#### Server to Client
- `new-message` - New message received
- `message-updated` - Message was edited
- `message-deleted` - Message was deleted
- `user-typing` - Another user is typing
- `user-online` - User came online
- `user-offline` - User went offline

## Status Codes

- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests
- `500` - Internal Server Error