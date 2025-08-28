# CRYB Platform - Project Memory & Context

## 🎯 PROJECT DEADLINE: SEPTEMBER 20TH, 2024
**Goal:** App Store submission ready

## 👤 PROJECT OWNER PREFERENCES
- Don't claim project is 90% complete when it's not
- Always check actual implementation vs documentation
- Track all work on Clickify with 3 concurrent clocks
- Work as 21-agent team across 3 windows simultaneously

## 🚨 CURRENT PROJECT STATUS (August 28, 2024)
**REALITY CHECK:**
- Backend: ~15% done (basic structure only, no real implementation)
- Frontend: ~2% done (empty template, 6 files total)
- Infrastructure: Docker running but not connected
- Database: Schema exists but NOT deployed
- Mobile: Package.json only, no code

**What Actually Exists:**
- ✅ Basic auth routes (login/register)
- ✅ 5-6 API route files (mostly empty)
- ✅ Web3 package completed
- ✅ Docker containers running
- ✅ 1 homepage template

**Critical Issues:**
- ❌ Database NOT initialized
- ❌ No frontend components
- ❌ No Socket.io implementation
- ❌ ElasticSearch/RabbitMQ crashed
- ❌ No mobile app code

## ⏰ CLICKIFY TIME TRACKING
**API Key:** ODc5M2U0ODktMmM0Yy00ZTI5LWI2MDktNDg3MzUxZmQ1Zjll
**Project:** CRYB-Platform-Launch

### 3 Concurrent Clocks:
1. **Backend-Development** (Window 1)
2. **Frontend-Development** (Window 2)
3. **Infrastructure-Web3** (Window 3)

## 🔑 CREDENTIALS & SERVICES

### Database (AWS RDS)
- Host: ls-5c069fe376b304c5cf07654fbb327aa9ce9115ef.cona660s8zf0.us-east-1.rds.amazonaws.com
- User: dbmasteruser
- Pass: OwCVEGP3w4($gij=VmBD6R54Nj3^#8rB
- Database: cryb-ai

### Redis Cloud
- Host: redis-17733.c80.us-east-1-2.ec2.redns.redis-cloud.com:17733
- Password: A46lkspvj2djpo5m0401eec9hbygeg4nafpbnkksvk4ufet4aps

### Critical APIs
- SendGrid: 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
- OpenAI: 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
- Moralis: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- WalletConnect: 05642c89c15608e01e024be8765b7580

## 👥 21-AGENT TEAM STRUCTURE

### WINDOW 1: Backend Team (7 agents)
1. **Senior Backend Architect** - API design, coordination
2. **Real-time Systems Engineer** - Socket.io, WebSockets
3. **Database Administrator** - PostgreSQL, Prisma
4. **Auth & Security Engineer** - JWT, OAuth, Web3 auth
5. **Message Queue Engineer** - BullMQ, RabbitMQ
6. **Search & Analytics Engineer** - Elasticsearch, metrics
7. **AI/ML Integration Engineer** - OpenAI, moderation

### WINDOW 2: Frontend Team (7 agents)
8. **Frontend Architect** - Next.js, team lead
9. **UI/UX Components Engineer** - Design system
10. **State Management Engineer** - Zustand, TanStack Query
11. **Mobile App Developer** - React Native
12. **Discord Features Frontend** - Servers, channels UI
13. **Reddit Features Frontend** - Posts, comments UI
14. **Chat & Real-time UI Developer** - Messaging interface

### WINDOW 3: Infrastructure & Web3 (7 agents)
15. **DevOps Lead** - AWS, Docker, K8s
16. **Web3 Architect** - Smart contracts, blockchain
17. **NFT & Crypto Engineer** - Token gating, payments
18. **Media & CDN Engineer** - MinIO, Cloudinary
19. **WebRTC & Voice Engineer** - LiveKit, voice/video
20. **Monitoring Engineer** - Prometheus, Grafana
21. **QA & Testing Engineer** - E2E, App Store compliance

## 📝 DEVELOPMENT COMMANDS

### Initialize Project
```bash
# Fix database first (CRITICAL)
cd packages/database
export DATABASE_URL="postgresql://dbmasteruser:OwCVEGP3w4($gij=VmBD6R54Nj3^#8rB@ls-5c069fe376b304c5cf07654fbb327aa9ce9115ef.cona660s8zf0.us-east-1.rds.amazonaws.com:5432/cryb-ai"
npx prisma db push
npx prisma generate

# Start services
cd apps/api && pnpm dev     # Backend
cd apps/web && pnpm dev      # Frontend
cd apps/mobile && pnpm ios   # Mobile
```

### Docker Services
```bash
# Start all services
docker-compose -f docker-compose.complete.yml up -d

# Check status
docker ps --format "table {{.Names}}\t{{.Status}}"

# Fix crashed services
docker restart cryb-elasticsearch cryb-rabbitmq
```

## 🚫 DON'T DO
- Don't create documentation unless asked
- Don't claim features are complete without testing
- Don't write placeholder code - everything must work
- Don't ignore crashed services
- Don't forget Clickify time tracking

## ✅ ALWAYS DO
- Check actual implementation before claiming completion
- Test every feature before marking done
- Track time on Clickify
- Coordinate between teams/windows
- Write production-ready code
- Fix critical issues immediately

## 📊 SPRINT TIMELINE
- **Week 1 (Aug 28 - Sep 3):** Foundation - Fix database, core API, basic UI
- **Week 2 (Sep 4 - Sep 10):** Core Features - Chat, channels, Web3
- **Week 3 (Sep 11 - Sep 17):** Polish & Mobile - Complete mobile app
- **Week 4 (Sep 18 - Sep 20):** Launch - Testing, App Store submission

## 🔥 CRITICAL PATH ITEMS
1. Initialize database (NOT DONE)
2. Implement Socket.io events
3. Build chat UI components
4. Complete mobile app
5. App Store compliance testing

## 📱 APP STORE REQUIREMENTS
- Privacy policy page
- Terms of service
- Account deletion capability
- Parental controls (if needed)
- Content moderation
- Report functionality
- iOS 16+ support
- iPad compatibility

---
Last Updated: August 28, 2024
Status: Project just starting, mostly empty