# Enhanced User Profile System - Complete Implementation Guide

## Overview

This is a complete, production-ready backend implementation of a comprehensive user profile system with **REAL database integration**. No mock data - everything connects to actual PostgreSQL database with proper data persistence, relationships, and real-time updates.

##  Features Implemented

###  Database Schema & Migration
- **Enhanced User Table**: Extended with 15+ new profile fields
- **UserProfile Table**: Theme, timezone, custom fields, badges
- **UserAchievement & Achievement Tables**: Complete achievement system
- **UserActivityTimeline Table**: Real activity tracking
- **UserFollow Table**: Follow/unfollow relationships with counts
- **UserBlocked Table**: Block/unblock functionality
- **UserPrivacySettings Table**: Granular privacy controls
- **UserStatistics Table**: Cached aggregated statistics
- **Database Functions**: Auto-update triggers, profile completeness calculation
- **Indexes**: Performance-optimized with full-text search support

###  API Endpoints (Production Ready)

#### Profile Management
- `GET /api/v1/users/:userId/profile` - Get comprehensive user profile
- `PUT /api/v1/users/:userId/profile` - Update profile with validation
- `POST /api/v1/users/:userId/avatar` - Upload profile images to MinIO
- `PUT /api/v1/users/:userId/privacy` - Update privacy settings

#### User Search & Discovery  
- `GET /api/v1/users/search` - Advanced search with filters
  - Full-text search across username, displayName, bio
  - Filter by location, occupation, verification status
  - Sort by relevance, followers, recent, alphabetical
  - Date range filters, follower count ranges
  - Interest-based filtering

#### Follow System
- `POST /api/v1/users/:userId/follow` - Follow user with real-time notifications
- `DELETE /api/v1/users/:userId/follow` - Unfollow user
- `GET /api/v1/users/:userId/followers` - Get paginated followers list
- `GET /api/v1/users/:userId/following` - Get paginated following list

#### Activity & Timeline
- `GET /api/v1/users/:userId/activity` - User activity timeline with privacy filtering
- Real activity logging for all user actions
- Privacy-aware activity visibility

#### Achievement System
- `GET /api/v1/users/:userId/achievements` - Get user achievements
- `PUT /api/v1/users/:userId/achievements` - Toggle achievement visibility
- Automatic achievement awarding based on user actions
- 10 pre-defined achievements with progression tracking

#### Block System
- `POST /api/v1/users/:userId/block` - Block user with reason
- `DELETE /api/v1/users/:userId/block` - Unblock user  
- `GET /api/v1/users/blocked` - Get blocked users list

###  Real-Time WebSocket Integration
- **Profile Updates**: Live profile changes broadcast to followers
- **Follow Events**: Real-time follow/unfollow notifications
- **Achievement Notifications**: Live achievement earning alerts
- **Online Status**: Real-time user online/offline status
- **Activity Broadcasting**: Live activity updates for followers
- **Typing Indicators**: Real-time typing status
- **Room Management**: Automatic join/leave follower rooms

###  Privacy & Security
- **Granular Privacy Controls**: 11 different visibility settings
- **Relationship-Based Access**: Public/Followers/Private visibility levels
- **Data Filtering**: Automatic privacy filtering in all endpoints
- **Profile Discovery Controls**: Allow/deny search indexing
- **Block System**: Complete blocking with relationship cleanup

###  Performance & Scalability
- **Database Indexes**: Optimized for fast queries
- **Full-Text Search**: PostgreSQL native search capabilities
- **Cached Statistics**: Pre-calculated user stats
- **Pagination**: All list endpoints support pagination
- **Real-Time Optimization**: Efficient WebSocket room management

## 🛠 Installation & Setup

### 1. Database Migration
```bash
# Navigate to API directory
cd /home/ubuntu/cryb-platform/apps/api

# Run the migration (development)
node run-profile-migration.js --force

# For production, review first:
node run-profile-migration.js
```

### 2. Integration with Existing App
```typescript
// In your main app.ts or index.ts
import { registerProfileSystem } from './src/routes/profile-integration';

// After setting up Fastify instance
await fastify.register(registerProfileSystem);
```

### 3. Environment Variables
Ensure your `.env` file includes:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/cryb
REDIS_URL=redis://localhost:6379
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=your_access_key
MINIO_SECRET_KEY=your_secret_key
```

##  Database Schema Overview

### Enhanced User Table (existing + new fields)
```sql
-- New fields added to existing User table
ALTER TABLE "User" ADD COLUMN "location" TEXT;
ALTER TABLE "User" ADD COLUMN "website" TEXT;
ALTER TABLE "User" ADD COLUMN "occupation" TEXT;
ALTER TABLE "User" ADD COLUMN "education" TEXT;
ALTER TABLE "User" ADD COLUMN "interests" JSONB DEFAULT '[]';
ALTER TABLE "User" ADD COLUMN "socialLinks" JSONB DEFAULT '[]';
ALTER TABLE "User" ADD COLUMN "followersCount" INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "followingCount" INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "achievementPoints" INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "profileCompleteness" INTEGER DEFAULT 0;
-- + more fields for comprehensive profile management
```

### New Tables Created
1. **UserProfile** - Extended profile data
2. **UserAchievement** - User-earned achievements  
3. **Achievement** - Achievement definitions
4. **UserActivityTimeline** - Activity tracking
5. **UserFollow** - Follow relationships
6. **UserBlocked** - Block relationships
7. **UserPrivacySettings** - Privacy controls
8. **UserStatistics** - Cached stats

##  API Usage Examples

### Get User Profile
```bash
curl -X GET "http://localhost:3000/api/v1/users/user123/profile" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Profile
```bash
curl -X PUT "http://localhost:3000/api/v1/users/user123/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "displayName": "John Doe",
    "bio": "Full-stack developer passionate about technology",
    "location": "San Francisco, CA",
    "website": "https://johndoe.dev",
    "occupation": "Senior Software Engineer",
    "interests": ["JavaScript", "React", "Node.js"],
    "socialLinks": [{
      "platform": "github",
      "url": "https://github.com/johndoe",
      "displayText": "johndoe"
    }]
  }'
```

### Search Users
```bash
curl -X GET "http://localhost:3000/api/v1/users/search?query=developer&filters.location=San Francisco&sort=followers&limit=20"
```

### Follow User
```bash
curl -X POST "http://localhost:3000/api/v1/users/user456/follow" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notificationsEnabled": true}'
```

### Upload Avatar
```bash
curl -X POST "http://localhost:3000/api/v1/users/user123/avatar" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "avatar=@profile-image.jpg"
```

## 🔄 Real-Time Events

### WebSocket Connection
```javascript
const socket = io('http://localhost:3000');

// Join profile room for updates
socket.emit('join-profile-room', { userId: 'user123' });

// Listen for profile updates
socket.on('profileUpdated', (data) => {
  console.log('Profile updated:', data);
});

// Listen for new followers
socket.on('newFollower', (data) => {
  console.log('New follower:', data.follower);
});

// Listen for achievements
socket.on('achievementEarned', (data) => {
  console.log('Achievement earned:', data);
});
```

## 🧪 Testing

### Basic Profile Operations
```bash
# Test profile retrieval
curl -X GET "http://localhost:3000/api/v1/users/search?query=test"

# Test follow system
curl -X POST "http://localhost:3000/api/v1/users/user456/follow" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test activity timeline  
curl -X GET "http://localhost:3000/api/v1/users/user123/activity"
```

### WebSocket Testing
Use tools like Postman WebSocket or write a simple HTML page:
```html
<!DOCTYPE html>
<html>
<head>
    <title>Profile System Test</title>
    <script src="https://cdn.socket.io/4.0.0/socket.io.min.js"></script>
</head>
<body>
    <script>
        const socket = io('http://localhost:3000');
        
        socket.on('connect', () => {
            console.log('Connected to server');
            socket.emit('join-profile-room', { userId: 'test-user' });
        });
        
        socket.on('profileUpdated', (data) => {
            console.log('Profile update received:', data);
        });
    </script>
</body>
</html>
```

##  Security Features

1. **Authentication Required**: All write operations require valid JWT
2. **Authorization Checks**: Users can only modify their own profiles
3. **Privacy Filtering**: Data filtered based on relationship and privacy settings
4. **Input Validation**: Comprehensive validation using Zod schemas
5. **File Upload Security**: File type and size validation for avatars
6. **Rate Limiting**: Built-in rate limiting for API endpoints
7. **SQL Injection Prevention**: Parameterized queries throughout

##  Performance Optimizations

1. **Database Indexes**: Strategic indexing on frequently queried fields
2. **Full-Text Search**: Native PostgreSQL search capabilities
3. **Pagination**: All list endpoints support efficient pagination
4. **Cached Counts**: Follower/following counts cached and updated via triggers
5. **Selective Field Loading**: Only load necessary data based on privacy settings
6. **Real-Time Optimization**: Efficient WebSocket room management

##  Production Deployment

1. **Database Migration**: Run migration on production database
2. **Environment Variables**: Set all required environment variables
3. **File Storage**: Ensure MinIO/S3 is configured for avatar uploads
4. **Redis**: Configure Redis for session management and caching
5. **WebSocket**: Ensure WebSocket support in your deployment
6. **Monitoring**: Set up monitoring for profile system endpoints

## 📋 Achievement System

### Pre-defined Achievements
1. **Welcome!** - Successfully created an account (10 pts)
2. **First Post** - Created your first post (25 pts)
3. **First Comment** - Made your first comment (15 pts)
4. **Profile Complete** - Completed your user profile (50 pts)
5. **First Follower** - Gained your first follower (30 pts)
6. **Active User** - Logged in for 7 days in a row (100 pts)
7. **Content Creator** - Created 10 posts (150 pts)
8. **Socialite** - Gained 50 followers (200 pts)
9. **Influencer** - Gained 500 followers (1000 pts)
10. **Verified User** - Account verified by administrators (500 pts)

### Achievement Categories
- **Onboarding**: Getting started achievements
- **Content**: Post and comment milestones
- **Social**: Follower and engagement milestones
- **Profile**: Profile completion and customization
- **Engagement**: Activity and participation milestones

## 🔄 Real-Time Updates

### Profile Updates
- Live profile changes broadcast to user's followers
- Avatar uploads trigger real-time notifications
- Profile completeness updates

### Social Features
- Follow/unfollow events with real-time notifications
- Online/offline status tracking
- Activity timeline updates

### Achievement System
- Real-time achievement earning notifications
- Rare achievement broadcasts to followers
- Progress tracking and updates

## 📚 Integration Points

### With Existing Systems
1. **Authentication**: Uses existing JWT middleware
2. **File Upload**: Integrates with existing MinIO service
3. **Database**: Extends existing Prisma schema
4. **WebSocket**: Uses existing Socket.IO setup
5. **Validation**: Uses existing validation middleware

### Frontend Integration
The system provides all necessary endpoints for a complete frontend implementation:
- User profile pages
- Profile editing forms
- User search and discovery
- Follow/unfollow functionality
- Activity timelines
- Achievement displays
- Privacy settings management

##  Next Steps

1. **Frontend Implementation**: Build React components for all features
2. **Mobile App Integration**: Use endpoints in mobile application
3. **Analytics Dashboard**: Track user engagement and growth
4. **Advanced Features**: Implement advanced search filters
5. **Content Moderation**: Add profile content moderation
6. **Performance Monitoring**: Set up monitoring and alerting

This implementation provides a complete, production-ready user profile system that can immediately be integrated with your frontend applications. All endpoints return real data from the PostgreSQL database with proper relationships, privacy filtering, and real-time updates via WebSocket.