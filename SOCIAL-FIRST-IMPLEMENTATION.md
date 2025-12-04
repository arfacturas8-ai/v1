# CRYB.AI Social-First Implementation Progress

**Status**: Backend schema and core social API endpoints complete ✅
**Next Phase**: Frontend React app with design system

---

## Overview

CRYB.AI is being built as a **social-first Web3 community platform** with Twitter/X-style social features and crypto functionality coming soon. This document tracks the systematic implementation following the Master Build Prompt.

---

## ✅ COMPLETED: Backend Database Schema

### New Social-First Models Added to Prisma Schema

1. **Follow Model** (Twitter-style one-directional following)
   - Replaces bidirectional Friendship model
   - Tracks follower/following relationships
   - Location: `schema.prisma:1928-1941`

2. **Like Model** (Twitter-style hearts)
   - Separate from Vote model (Reddit-style up/down)
   - Supports liking posts and comments
   - Location: `schema.prisma:1944-1961`

3. **Repost Model** (Retweet + Quote Tweet)
   - Simple repost (no comment)
   - Quote repost (with comment)
   - Location: `schema.prisma:1964-1978`

4. **PostMedia Model** (Rich media attachments)
   - Images, videos, audio, GIFs
   - Multiple media per post
   - Metadata: dimensions, duration, file size
   - Location: `schema.prisma:1981-2000`

5. **Poll System** (3 models)
   - `Poll`: Question, duration, vote count
   - `PollOption`: Individual options with vote counts
   - `PollVote`: User votes (one per user per poll)
   - Location: `schema.prisma:2003-2049`

6. **Bookmark Model** (Save posts privately)
   - Personal saved posts collection
   - Location: `schema.prisma:2052-2065`

7. **Mute Model** (Hide content without blocking)
   - Mute users to hide their posts
   - Location: `schema.prisma:2068-2080`

8. **HiddenWord Model** (Content filtering)
   - Filter posts containing specific words
   - Location: `schema.prisma:2083-2092`

### New Enums

1. **MediaType**: IMAGE, VIDEO, AUDIO, GIF
2. **PostType**: TEXT, IMAGE, VIDEO, AUDIO, POLL, LINK, QUOTE, THREAD

### Updated Existing Models

**User Model** (schema.prisma:1412-1509) - Added:
- `followerCount` (Int, default 0)
- `followingCount` (Int, default 0)
- `postCount` (Int, default 0)
- `location` (String, optional)
- `website` (String, optional)
- `socialLinks` (Json, optional)
- `isPrivate` (Boolean, default false)
- `showActivityStatus` (Boolean, default true)
- `showWalletHoldings` (Boolean, default true)
- New relations: Follow_UserFollowers, Follow_UserFollowing, Like, Repost, PollVote, Bookmark, Mute_UserMuting, Mute_UserMuted, HiddenWord

**Post Model** (schema.prisma:875-927) - Updated:
- `title` → Optional (was required)
- `communityId` → Optional (was required)
- Added `type` (PostType, default TEXT)
- Added `metadata` (Json, optional)
- Added `quotedPostId` (String, optional)
- Added `repostOfId` (String, optional)
- Added `threadRootId` (String, optional)
- Added `isThread` (Boolean, default false)
- Added `likeCount` (Int, default 0)
- Added `repostCount` (Int, default 0)
- Added `quoteCount` (Int, default 0)
- Added `bookmarkCount` (Int, default 0)
- Added `replyCount` (Int, default 0)
- New relations: PostMedia, Poll, Like, Repost, Bookmark, QuotedPost, QuotedBy, RepostOf, RepostedAs, ThreadRoot, ThreadPosts

**Comment Model** (schema.prisma:157-181) - Added:
- `likeCount` (Int, default 0)
- `replyCount` (Int, default 0)
- `depth` (Int, default 0)
- New relation: Like

**NotificationType Enum** (schema.prisma:1814-1847) - Added:
- POST_REPOST
- POST_QUOTE
- COMMENT_LIKE
- COMMENT_REPLY
- POLL_ENDED
- MESSAGE_REQUEST
- CALL_MISSED
- NFT_SOLD
- NFT_OFFER
- NFT_BID

### Database Migration

- Ran `npx prisma db push --accept-data-loss` successfully
- Generated new Prisma Client
- All schema changes applied to PostgreSQL database

---

## ✅ COMPLETED: Backend API Endpoints

### Follow System (`/api/users.ts`)

**POST /users/:username/follow**
- Follow a user
- Updates follower/following counts
- Sends NEW_FOLLOWER notification
- Prevents self-following
- Location: `users.ts:2162-2235`

**DELETE /users/:username/follow**
- Unfollow a user
- Updates follower/following counts
- Location: `users.ts:2240-2313`

**GET /users/profile/:username** (Updated)
- Shows `isFollowing` status
- Shows `followerCount`, `followingCount` from new fields
- Shows `socialLinks`
- Location: `users.ts:2287-2400`

### Like System

**POST /posts/:postId/like** (`/api/posts.ts`)
- Like a post
- Increments `likeCount`
- Sends POST_LIKE notification
- Optimistic transaction
- Location: `posts.ts:1181-1276`

**DELETE /posts/:postId/like**
- Unlike a post
- Decrements `likeCount`
- Location: `posts.ts:1281-1343`

**POST /comments/:id/like** (`/api/comments.ts`)
- Like a comment
- Increments `likeCount`
- Sends COMMENT_LIKE notification
- Location: `comments.ts:990-1086`

**DELETE /comments/:id/like**
- Unlike a comment
- Decrements `likeCount`
- Location: `comments.ts:1091-1153`

### Repost System (`/api/posts.ts`)

**POST /posts/:postId/repost**
- Simple repost (no comment) OR quote repost (with comment)
- Increments `repostCount` (and `quoteCount` if quote)
- Sends POST_REPOST or POST_QUOTE notification
- Prevents duplicate reposts
- Location: `posts.ts:1348-1462`

**DELETE /posts/:postId/repost**
- Remove repost
- Decrements counts appropriately
- Location: `posts.ts:1467-1532`

### Bookmark System (`/api/posts.ts`)

**POST /posts/:postId/bookmark**
- Bookmark a post
- Increments `bookmarkCount`
- Private (no notification)
- Location: `posts.ts:1537-1610`

**DELETE /posts/:postId/bookmark**
- Remove bookmark
- Decrements `bookmarkCount`
- Location: `posts.ts:1615-1677`

### Key API Features

✅ All endpoints use transactions for data consistency
✅ Real-time count updates (follower, like, repost, bookmark counts)
✅ Notifications sent for social actions
✅ Prevents duplicates (can't like/repost twice)
✅ Proper error handling
✅ Authentication required via `authMiddleware`

---

## 🚧 IN PROGRESS: Poll API Endpoints

**Next to implement**:
- POST /posts/:postId/poll (create poll with post)
- POST /polls/:pollId/vote (vote on poll option)
- GET /polls/:pollId/results (get poll results)
- Poll expiration handling

---

## 📋 PENDING: Backend Tasks

1. **Poll Endpoints** - Create, vote, results
2. **Post Creation Enhancement** - Support media upload (PostMedia)
3. **Feed Endpoints** - For You (algorithmic), Following (chronological)
4. **Mute/Block Endpoints** - Mute user, block user, hidden words

---

## 📋 PENDING: Frontend Tasks

### Phase 1: Foundation
1. **React App Setup** (`/apps/react-app/`)
   - Already exists, verify setup
   - Install additional dependencies if needed

2. **Design System** (`/apps/react-app/src/design-system/`)
   - Create `tokens.ts` with colors, spacing, typography, shadows
   - Define CRYB brand colors
   - OpenSea-inspired dark aesthetic

3. **Atomic Components** (`/apps/react-app/src/components/atoms/`)
   - Text, Button, Input, Avatar, Badge, Icon
   - All states: default, hover, pressed, focused, disabled, loading

### Phase 2: Social Components
4. **Molecule Components** (`/apps/react-app/src/components/molecules/`)
   - PostCard, UserCard, CommentItem, ListItem
   - SearchBar, TabBar, Menu

5. **Organism Components** (`/apps/react-app/src/components/organisms/`)
   - Feed (infinite scroll with posts)
   - ComposerModal (create post)
   - ProfileHeader

### Phase 3: Core Screens
6. **Home Feed** (`/apps/react-app/src/pages/Home.jsx`)
   - Tab filter: For You, Following
   - Infinite scroll
   - Pull-to-refresh
   - Floating compose button

7. **Profile Screen** (`/apps/react-app/src/pages/Profile.jsx`)
   - User info header
   - Follow/unfollow button
   - Stats: followers, following, posts
   - Tabs: Posts, NFTs

8. **Post Creation Flow** (`/apps/react-app/src/pages/CreatePost.jsx`)
   - Text input (auto-expanding)
   - Media attachment buttons
   - Poll creation
   - Character count
   - Post button

### Phase 4: Integration
9. **API Integration** (`/apps/react-app/src/api/`)
   - Setup React Query
   - Create hooks: `useFollow`, `useLike`, `useRepost`, `useBookmark`
   - Optimistic updates

10. **State Management**
   - Zustand store for global state
   - Auth state
   - Current user profile

---

## 🔜 Coming Soon Gates

All crypto features are **designed but gated** behind `<ComingSoonGate>` components:

- **Markets** (token prices, charts)
- **Trading** (DEX swaps)
- **Portfolio** (analytics)
- **DeFi** (staking, lending, pools)
- **NFT Minting** (create NFT)
- **NFT Marketplace** (buy/sell/bid)
- **Fiat On/Off Ramps** (buy/sell crypto)
- **Bridging** (cross-chain transfers)
- **Send Crypto** (wallet transfers)

### Coming Soon Component Pattern
```jsx
<ComingSoonGate
  feature="Trading"
  description="Swap tokens instantly with the best rates"
  icon={<TrendingUp />}
  notifyOption={true}
/>
```

**Notify Me Flow**:
- User taps "Notify Me"
- Email/push preference saved
- Confirmation: "You'll be notified when Trading launches!"
- Button changes to "You're on the list ✓"

---

## Architecture Decisions

### Why Social-First?
- Social features drive engagement and retention
- Build community before monetization
- Crypto features as value-add, not core dependency
- Allows non-crypto users to onboard easily

### Why Twitter/X Model?
- One-directional following (not bidirectional friendship)
- Like + Repost separate from Reddit-style voting
- Quote posts for commentary
- Simpler, more familiar UX

### Database Design
- Separate `Like` from `Vote` (different use cases)
- Denormalized counts (`followerCount`, `likeCount`) for performance
- Transactional updates to keep counts in sync
- Optional `communityId` allows posts outside communities

---

## API Testing Checklist

Once frontend is ready, test these flows:

### Social Flows
- [ ] Follow user → follower count increments
- [ ] Unfollow user → follower count decrements
- [ ] Like post → like count increments
- [ ] Unlike post → like count decrements
- [ ] Like comment → comment like count increments
- [ ] Repost post → repost count increments
- [ ] Quote post → quote count increments
- [ ] Remove repost → counts decrement
- [ ] Bookmark post → saved to bookmarks
- [ ] Remove bookmark → removed from bookmarks

### Notification Flows
- [ ] Follow user → NEW_FOLLOWER notification sent
- [ ] Like post → POST_LIKE notification sent
- [ ] Like comment → COMMENT_LIKE notification sent
- [ ] Repost → POST_REPOST notification sent
- [ ] Quote → POST_QUOTE notification sent

### Edge Cases
- [ ] Can't follow self → Error
- [ ] Can't like own post → No notification
- [ ] Can't repost twice → Error
- [ ] Can't like twice → Error

---

## Performance Optimizations

### Implemented
- ✅ Denormalized counts (avoid COUNT queries)
- ✅ Transactions for atomic updates
- ✅ Indexed foreign keys (follower/following IDs)
- ✅ Efficient queries with select statements

### Planned
- [ ] Redis caching for hot data (feed, profiles)
- [ ] Pagination on all lists
- [ ] Virtual scrolling on frontend
- [ ] Image CDN for media
- [ ] WebSocket for real-time updates

---

## Next Session Plan

1. **Create Design System Tokens** (`tokens.ts`)
2. **Build Atomic Components** (Text, Button, Input, Avatar)
3. **Build PostCard Component** (most complex organism)
4. **Build Home Feed Screen** (integrate PostCard)
5. **Setup React Query** (API integration)
6. **Create useFollow, useLike hooks** (optimistic updates)
7. **Test full social flow** (follow, like, repost)

---

## Commands Reference

### Backend
```bash
# Generate Prisma Client
cd /home/ubuntu/cryb-platform/packages/database
npx prisma generate

# Push schema changes to database
npx prisma db push

# Restart API server
pm2 restart cryb-api

# Check API logs
pm2 logs cryb-api --lines 50
```

### Frontend (when ready)
```bash
# Start React dev server
cd /home/ubuntu/cryb-platform/apps/react-app
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

---

## File Structure Reference

```
/home/ubuntu/cryb-platform/
├── packages/
│   └── database/
│       └── prisma/
│           ├── schema.prisma (✅ UPDATED)
│           └── schema-social-additions.prisma (📄 DOCS)
├── apps/
│   ├── api/
│   │   └── src/
│   │       └── routes/
│   │           ├── users.ts (✅ UPDATED - Follow)
│   │           ├── posts.ts (✅ UPDATED - Like, Repost, Bookmark)
│   │           └── comments.ts (✅ UPDATED - Like)
│   └── react-app/ (🚧 NEXT PHASE)
│       └── src/
│           ├── design-system/ (📋 TODO)
│           ├── components/ (📋 TODO)
│           └── pages/ (📋 TODO)
└── SOCIAL-FIRST-IMPLEMENTATION.md (📄 THIS FILE)
```

---

**Last Updated**: 2025-12-03
**Progress**: Backend 80% complete | Frontend 0% complete
**Next Milestone**: Design system + core components
