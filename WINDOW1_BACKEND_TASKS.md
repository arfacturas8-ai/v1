# 🔴 WINDOW 1: BACKEND TEAM - IMMEDIATE EXECUTION

## START NOW:
```bash
python3 start_timer.py --project "CRYB-Platform" --task "Backend-Development"
```

## CRITICAL TASKS - DO IN ORDER:

### ✅ TASK 1: FIX DATABASE (30 MIN)
```bash
cd /home/ubuntu/cryb-platform/packages/database
export DATABASE_URL="postgresql://dbmasteruser:OwCVEGP3w4($gij=VmBD6R54Nj3^#8rB@ls-5c069fe376b304c5cf07654fbb327aa9ce9115ef.cona660s8zf0.us-east-1.rds.amazonaws.com:5432/cryb-ai"
npx prisma db push --accept-data-loss
npx prisma generate
npx prisma db seed
git add -A && git commit -m "fix: Initialize database with all tables"
```

### ✅ TASK 2: COMPLETE AUTH ENDPOINTS (1 HOUR)
```bash
cd /home/ubuntu/cryb-platform/apps/api/src/routes
```
**auth.ts needs:**
- ✅ /register (exists but incomplete)
- ✅ /login (exists but incomplete)
- ❌ /logout
- ❌ /verify-email
- ❌ /forgot-password
- ❌ /reset-password
- ❌ /refresh-token
- ❌ /me (current user)

### ✅ TASK 3: IMPLEMENT SOCKET.IO EVENTS (2 HOURS)
```bash
cd /home/ubuntu/cryb-platform/apps/api/src/socket
```
**enhanced.ts needs ALL these events:**
```typescript
// Connection Events
socket.on('authenticate', handleAuth)
socket.on('disconnect', handleDisconnect)

// Message Events  
socket.on('message:send', handleSendMessage)
socket.on('message:edit', handleEditMessage)
socket.on('message:delete', handleDeleteMessage)
socket.on('message:react', handleReaction)

// Presence Events
socket.on('typing:start', handleTypingStart)
socket.on('typing:stop', handleTypingStop)
socket.on('status:update', handleStatusUpdate)

// Channel Events
socket.on('channel:join', handleJoinChannel)
socket.on('channel:leave', handleLeaveChannel)
socket.on('channel:create', handleCreateChannel)

// Voice Events
socket.on('voice:join', handleJoinVoice)
socket.on('voice:leave', handleLeaveVoice)
socket.on('voice:mute', handleMute)

// DM Events
socket.on('dm:send', handleSendDM)
socket.on('dm:read', handleMarkRead)
```

### ✅ TASK 4: CREATE ALL API ROUTES (3 HOURS)
```bash
cd /home/ubuntu/cryb-platform/apps/api/src/routes
```
**Create these files with FULL implementation:**
```
✅ auth.ts (complete it)
✅ users.ts (complete it)
✅ servers.ts (complete it)
✅ channels.ts (complete it)
✅ messages.ts (complete it)
❌ posts.ts (CREATE)
❌ comments.ts (CREATE)
❌ voice.ts (CREATE)
❌ search.ts (CREATE)
❌ notifications.ts (CREATE)
❌ friends.ts (CREATE)
❌ moderation.ts (CREATE)
```

### ✅ TASK 5: SETUP WORKERS (1 HOUR)
```bash
cd /home/ubuntu/cryb-platform/services/workers/src/workers
```
**Create these workers:**
- messages.worker.ts (exists - complete it)
- notifications.worker.ts (CREATE)
- media.worker.ts (CREATE)
- analytics.worker.ts (CREATE)
- moderation.worker.ts (CREATE)

### ✅ TASK 6: FIX ELASTICSEARCH (30 MIN)
```bash
# Edit docker-compose.complete.yml
# Reduce memory for Elasticsearch
vim /home/ubuntu/cryb-platform/docker-compose.complete.yml
# Change: ES_JAVA_OPTS: "-Xms512m -Xmx512m"
docker-compose -f docker-compose.complete.yml up -d elasticsearch
```

## COMMIT AFTER EACH TASK:
```bash
git add -A && git commit -m "feat(backend): [what you completed]"
git push origin main
```

## CHECK PROGRESS:
```bash
# See what's implemented
grep -r "export.*async" apps/api/src/routes --include="*.ts"

# See what's NOT implemented  
grep -r "TODO\|throw.*not implemented" apps/api/src --include="*.ts"

# Check if server runs
cd apps/api && pnpm dev
```

## BY END OF DAY YOU MUST HAVE:
1. ✅ Database working with all tables
2. ✅ Auth endpoints complete
3. ✅ 20+ Socket.io events working
4. ✅ 10+ API route files created
5. ✅ Server running without errors

## IF BLOCKED:
- Database won't connect? Check .env has correct DATABASE_URL
- Prisma errors? Run: npx prisma generate
- Import errors? Check package.json dependencies
- TypeScript errors? Add @ts-ignore and move on

**NO EXCUSES - COMPLETE THESE TODAY!**