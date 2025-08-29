# 🚀 CRYB PLATFORM - TEAM MEMORY & EXECUTION PROTOCOL
**DEADLINE: SEPTEMBER 20TH, 2024 - APP STORE SUBMISSION**
**CURRENT DATE: AUGUST 28, 2024**
**DAYS REMAINING: 23**

## ⏰ AUTOMATIC TIMER PROTOCOL
**EVERY SESSION MUST START WITH:**
```bash
# Start Clockify timer immediately
python3 start_timer.py --project "CRYB-Platform" --task "[Window#]-Development"
```

## 🔴 CRITICAL RULES - NO ASSUMPTIONS
1. **READ PROGRESS FIRST** - Check what's been done before starting
2. **START TIMER IMMEDIATELY** - No work without tracking
3. **COMMIT EVERY FEATURE** - Small, frequent commits
4. **CREATE TASKS AS YOU GO** - Document what needs to be done
5. **NO ASSUMPTIONS** - Check actual implementation, don't trust docs
6. **TIME IS MONEY** - Move fast, no overthinking

---

## 📋 WINDOW 1: BACKEND TEAM MEMORY
**Clickify Task:** "Backend-Development"
**Working Directory:** `/home/ubuntu/cryb-platform/apps/api`

### START CHECKLIST:
```bash
# 1. Start timer
python3 start_timer.py --project "CRYB-Platform" --task "Backend-Development"

# 2. Check progress
git log --oneline -10
docker ps | grep cryb
psql -h $DB_HOST -U dbmasteruser -d "cryb-ai" -c "\dt" 

# 3. Check what's NOT done
grep -r "TODO" . --include="*.ts"
grep -r "not implemented" . --include="*.ts"
```

### CURRENT STATUS:
- ❌ Database NOT initialized (Prisma not pushed)
- ❌ Only 6 route files exist (mostly empty)
- ❌ No Socket.io handlers implemented
- ❌ No queue workers running
- ❌ No search implementation

### IMMEDIATE TASKS:
```bash
# Task 1: Initialize database NOW
cd packages/database
export DATABASE_URL="postgresql://dbmasteruser:OwCVEGP3w4($gij=VmBD6R54Nj3^#8rB@ls-5c069fe376b304c5cf07654fbb327aa9ce9115ef.cona660s8zf0.us-east-1.rds.amazonaws.com:5432/cryb-ai"
npx prisma db push
git commit -m "Initialize database schema"

# Task 2: Implement auth completely
cd apps/api/src/routes
# Complete auth.ts with all endpoints
git commit -m "Complete authentication endpoints"

# Task 3: Socket.io events
cd apps/api/src/socket
# Implement ALL events in enhanced.ts
git commit -m "Implement Socket.io real-time events"
```

### COMMIT PATTERN:
```bash
git add -A && git commit -m "feat(backend): [specific feature completed]"
```

### PROGRESS TRACKING:
```typescript
// Add to every file you work on
// TODO: [Agent#] - [Task description] - [Date]
// DONE: [Agent#] - [Task completed] - [Date]
```

---

## 🎨 WINDOW 2: FRONTEND TEAM MEMORY
**Clickify Task:** "Frontend-Development"
**Working Directory:** `/home/ubuntu/cryb-platform/apps/web`

### START CHECKLIST:
```bash
# 1. Start timer
python3 start_timer.py --project "CRYB-Platform" --task "Frontend-Development"

# 2. Check progress
ls -la app/
ls -la components/
find . -name "*.tsx" | wc -l

# 3. Start dev server
pnpm dev
```

### CURRENT STATUS:
- ❌ Only 6 files exist (1 homepage, 1 button component)
- ❌ No auth pages
- ❌ No chat UI
- ❌ No server/channel UI
- ❌ No state management setup

### IMMEDIATE TASKS:
```bash
# Task 1: Create auth pages
mkdir -p app/(auth)/login app/(auth)/register
# Create login/page.tsx and register/page.tsx
git commit -m "Add authentication pages"

# Task 2: Build component library
mkdir -p components/ui components/chat components/server
# Create ALL UI components
git commit -m "Build core component library"

# Task 3: Setup state management
mkdir -p lib/stores lib/hooks
# Setup Zustand stores
git commit -m "Implement state management"
```

### MOBILE TEAM TASKS:
```bash
cd apps/mobile
# Task 1: Setup navigation
# Task 2: Create screens
# Task 3: Connect to API
git commit -m "feat(mobile): [specific feature]"
```

### COMMIT PATTERN:
```bash
git add -A && git commit -m "feat(frontend): [component/feature name]"
```

---

## ⚙️ WINDOW 3: INFRASTRUCTURE & WEB3 TEAM MEMORY
**Clickify Task:** "Infrastructure-Web3"
**Working Directory:** `/home/ubuntu/cryb-platform`

### START CHECKLIST:
```bash
# 1. Start timer
python3 start_timer.py --project "CRYB-Platform" --task "Infrastructure-Web3"

# 2. Check Docker status
docker ps --format "table {{.Names}}\t{{.Status}}"
docker logs cryb-elasticsearch --tail 50
docker logs cryb-rabbitmq --tail 50

# 3. Fix broken services
docker restart cryb-elasticsearch cryb-rabbitmq
```

### CURRENT STATUS:
- ❌ Elasticsearch keeps crashing (memory issue)
- ❌ RabbitMQ not connecting
- ❌ No production deployment setup
- ❌ Smart contracts not deployed
- ❌ LiveKit not configured

### IMMEDIATE TASKS:
```bash
# Task 1: Fix Docker services
docker-compose -f docker-compose.complete.yml down elasticsearch rabbitmq
# Edit docker-compose.complete.yml - reduce memory
docker-compose -f docker-compose.complete.yml up -d
git commit -m "Fix Docker service configurations"

# Task 2: Deploy smart contracts
cd packages/web3/contracts
# Deploy contracts to testnet
git commit -m "Deploy smart contracts to Goerli"

# Task 3: Setup production deployment
# Create kubernetes configs
# Setup GitHub Actions
git commit -m "Add production deployment pipeline"
```

### COMMIT PATTERN:
```bash
git add -A && git commit -m "feat(infra): [specific configuration]"
```

---

## 📊 DAILY SYNC PROTOCOL (ALL WINDOWS)

### MORNING (9 AM):
```bash
# All windows run simultaneously:
git pull origin main
git log --oneline --since="yesterday"
docker ps | grep cryb
```

### EVERY 2 HOURS:
```bash
# Check timer is running
cat current_timer.txt

# Commit current work
git add -A && git commit -m "wip: [current task]"

# Push to branch
git push origin feature/[current-feature]
```

### END OF DAY:
```bash
# Stop timer
python3 stop_timer.py

# Final commit
git add -A && git commit -m "feat: [completed features today]"

# Create tomorrow's tasks
echo "Tomorrow: [specific tasks]" >> TASKS.md
```

---

## 🚨 CRITICAL PATH TO APP STORE

### WEEK 1 (Aug 28 - Sep 3):
**MUST COMPLETE:**
- ✅ Database initialized and working
- ✅ Basic auth (login/register/logout)
- ✅ Basic chat UI
- ✅ Docker services stable

### WEEK 2 (Sep 4 - Sep 10):
**MUST COMPLETE:**
- ✅ Real-time messaging working
- ✅ Server/channel UI complete
- ✅ Mobile app basic screens
- ✅ Web3 wallet connection

### WEEK 3 (Sep 11 - Sep 17):
**MUST COMPLETE:**
- ✅ Voice/video calls working
- ✅ All features integrated
- ✅ Mobile app fully functional
- ✅ Production deployment ready

### WEEK 4 (Sep 18 - Sep 20):
**MUST COMPLETE:**
- ✅ App Store assets ready
- ✅ Privacy policy & terms
- ✅ Final testing complete
- ✅ SUBMIT TO APP STORE

---

## 🔥 NO TIME FOR:
- Documentation (unless required for App Store)
- Perfect code (working > perfect)
- Long discussions (make decisions fast)
- Refactoring (ship first, refactor later)
- Complex features (MVP only)

## ✅ FOCUS ON:
- Core features that WORK
- App Store requirements
- User can register, login, chat
- Basic Discord + Reddit features
- Mobile app that doesn't crash

---

## 📱 APP STORE REQUIREMENTS CHECKLIST:
```
[ ] App works on iOS 15+
[ ] App works on latest iPhones
[ ] Screenshots for all device sizes
[ ] App icon (1024x1024)
[ ] Privacy policy URL
[ ] Terms of service URL
[ ] Support URL
[ ] Marketing URL
[ ] Age rating questionnaire
[ ] Export compliance
[ ] Demo account for review
```

---

## 🔑 CREDENTIALS FOR QUICK ACCESS:
```bash
# Database
export DB_HOST="ls-5c069fe376b304c5cf07654fbb327aa9ce9115ef.cona660s8zf0.us-east-1.rds.amazonaws.com"
export DB_USER="dbmasteruser"
export DB_PASS='OwCVEGP3w4($gij=VmBD6R54Nj3^#8rB'
export DB_NAME="cryb-ai"

# Redis
export REDIS_HOST="redis-17733.c80.us-east-1-2.ec2.redns.redis-cloud.com"
export REDIS_PORT="17733"
export REDIS_PASS="A46lkspvj2djpo5m0401eec9hbygeg4nafpbnkksvk4ufet4aps"

# Quick connect
alias dbconnect='psql -h $DB_HOST -U $DB_USER -d $DB_NAME'
alias redisconnect='redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASS'
```

---

## ⚡ EMERGENCY FIXES:
```bash
# If Docker crashes
docker-compose -f docker-compose.complete.yml restart

# If database disconnects
cd packages/database && npx prisma generate

# If frontend won't build
cd apps/web && rm -rf .next node_modules && pnpm install && pnpm dev

# If mobile won't build
cd apps/mobile && npx react-native doctor
```

---

**REMEMBER:**
1. START TIMER FIRST
2. CHECK ACTUAL CODE (not docs)
3. COMMIT EVERY HOUR
4. NO ASSUMPTIONS
5. SHIP BY SEPTEMBER 20TH

**TIME IS RUNNING OUT - MOVE FAST!**