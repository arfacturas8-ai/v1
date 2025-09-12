# CRITICAL BUGS AND IMMEDIATE FIXES
**CRYB Platform - High Priority Issues**  
*Generated: 2025-09-03*

---

## 🚨 CRITICAL ISSUES REQUIRING IMMEDIATE ATTENTION

### 1. **Service Connection Failures** ⚠️ **BLOCKING PRODUCTION**

**Issue:** Multiple services showing connection refused errors
- AI Moderation endpoint: `connect ECONNREFUSED 127.0.0.1:3001`
- Health endpoints returning 404s
- Load testing shows 75% failure rate

**Root Cause:** Service discovery and port configuration issues

**Immediate Fix:**
```bash
# Check running services and ports
netstat -tulnp | grep :300
ps aux | grep node

# Restart API services with proper configuration
cd /home/ubuntu/cryb-platform/apps/api
PORT=3001 npm run dev

# Verify health endpoint
curl http://localhost:3001/health
```

**File Locations:**
- `/apps/api/src/app.ts` - Main application configuration
- `/apps/api/src/routes/` - API route definitions
- `/apps/web/next.config.mjs` - Web app API proxy configuration

---

### 2. **TypeScript Compilation Errors** 🔧 **PARTIALLY FIXED**

**Issue:** Tests failing due to type mismatches and missing dependencies

**Fixed:**
- ✅ Auth service email/walletAddress null vs undefined: `/apps/api/src/services/auth.ts:143-144`
- ✅ Redis exists() method returns number: `/apps/api/src/services/auth.ts:342,380`
- ✅ Test assertion in crash-safe handlers: `/apps/api/__tests__/unit/crash-safe-handlers.test.ts:181,683`

**Still Need Fixing:**
```typescript
// /apps/api/src/socket/crash-safe-handlers.ts
// Line 53: Property 'on' does not exist on type 'SafeSocket'
socket.on('message:send', async (data) => { ... })

// Line 144: Type 'any[]' is not assignable to MessageAttachment type
attachments: this.sanitizeAttachments(data.attachments) || [],

// Line 185: Argument of type 'unknown' not assignable to 'undefined'
this.fastify.log.error('Failed to broadcast message:', broadcastError);
```

**Immediate Fix Required:**
```bash
cd /home/ubuntu/cryb-platform/apps/api
# Fix socket type definitions
# Fix error logging type casting
# Update attachment type handling
```

---

### 3. **Missing @cryb/web3 Dependency** 📦 **BLOCKING TESTS**

**Issue:** Integration tests fail with `Cannot find module '@cryb/web3'`

**Location:** `/apps/api/__tests__/integration/auth-system.test.ts:4`

**Immediate Fix:**
```bash
cd /home/ubuntu/cryb-platform
# Check if web3 package exists
ls packages/web3/ || ls apps/web3/

# If missing, create mock or install dependency
# Or temporarily comment out web3 imports in tests
```

---

### 4. **Database Connection Issues** 💾 **AFFECTING INTEGRATION**

**Issue:** Database model tests failing with missing dependencies

**Error:** `Cannot find module '@prisma/client'`

**Immediate Fix:**
```bash
cd /home/ubuntu/cryb-platform
# Ensure Prisma client is generated
npx prisma generate
# Or in API directory
cd apps/api && npx prisma generate
```

---

### 5. **Web Frontend API Integration** 🌐 **USER-FACING**

**Issue:** Web app showing 404 errors for API endpoints
- `/api/health` returning 404
- `/api/ai-moderation/health` returning 404
- IndexedDB errors in browser

**Root Cause:** API proxy configuration and service routing

**Immediate Fix:**
```bash
# Check Next.js configuration
cd /home/ubuntu/cryb-platform/apps/web
# Verify next.config.mjs proxy settings
# Ensure API server is running on correct port
# Check for CORS configuration
```

**File Locations:**
- `/apps/web/next.config.mjs` - Proxy configuration
- `/apps/web/lib/api.ts` - API client configuration

---

## 🔧 IMMEDIATE ACTION PLAN

### **PRIORITY 1: Service Stability (Fix within 2 hours)**

1. **Identify and fix port conflicts**
   ```bash
   # Kill conflicting processes
   sudo lsof -i :3001 -i :3002 -i :3003
   # Restart services with proper configuration
   ```

2. **Fix API routing and health endpoints**
   ```bash
   # Verify route registration
   # Check middleware configuration  
   # Test endpoint accessibility
   ```

### **PRIORITY 2: TypeScript Compilation (Fix within 4 hours)**

1. **Fix socket handler type issues**
   - Update SafeSocket interface
   - Fix attachment type handling
   - Correct error logging parameters

2. **Resolve dependency issues**
   - Install or mock @cryb/web3
   - Generate Prisma client
   - Update import paths

### **PRIORITY 3: Test Infrastructure (Fix within 8 hours)**

1. **Restore unit test execution**
   - Fix all TypeScript errors
   - Update test configurations
   - Verify test environment setup

2. **Fix integration tests**
   - Restore database connections
   - Fix service mocking
   - Update test timeouts

---

## 🚀 VERIFICATION STEPS

After implementing fixes, verify with these commands:

```bash
# 1. Test service health
curl http://localhost:3001/health
curl http://localhost:3002/health  
curl http://localhost:3003/health

# 2. Run unit tests
cd /home/ubuntu/cryb-platform/apps/api
npm run test:unit

# 3. Test authentication flow  
node test-auth-endpoints.js

# 4. Verify web frontend
cd /home/ubuntu/cryb-platform/apps/web
npm run build
npm run dev

# 5. Simple load test
npx artillery run /home/ubuntu/cryb-platform/simple-load-test.yml
```

---

## 📊 SUCCESS CRITERIA

### **Service Stability Restored**
- ✅ Health endpoints return 200 OK
- ✅ Load test failure rate < 5%
- ✅ All core services accessible

### **Tests Executing**
- ✅ TypeScript compilation successful
- ✅ Unit tests passing > 80%
- ✅ Integration tests completing

### **Web Integration Working**
- ✅ API endpoints accessible from web app
- ✅ Authentication flow functional
- ✅ No 404 errors on core routes

---

## 💡 RECOMMENDATIONS FOR PREVENTION

1. **Implement health monitoring** - Automated service health checks
2. **Add TypeScript strict mode** - Catch type issues at build time
3. **Create integration test suite** - End-to-end testing automation
4. **Set up CI/CD pipeline** - Automated testing before deployment
5. **Add service discovery** - Proper service registration and discovery

---

**Next Update:** Once critical issues are resolved  
**Estimated Fix Time:** 4-8 hours for critical issues  
**Production Ready:** After successful verification of all fixes

---

*This document prioritizes the most critical issues blocking production deployment. Focus on Priority 1 issues first before moving to lower priority items.*