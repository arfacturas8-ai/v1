# CRYB Platform Troubleshooting Guide

**Last Updated:** November 16, 2025
**Platform Version:** 0.40.3
**Maintainer:** CRYB DevOps Team

---

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Common Issues](#common-issues)
3. [Service-Specific Issues](#service-specific-issues)
4. [Build Issues](#build-issues)
5. [Database Issues](#database-issues)
6. [Performance Issues](#performance-issues)
7. [Automation Scripts](#automation-scripts)
8. [Emergency Procedures](#emergency-procedures)

---

## Quick Diagnostics

### Run Health Check

```bash
./health-check.sh
```

This comprehensive script checks:
- PM2 processes status
- Database connectivity
- Redis connections
- Disk space
- Build files
- Docker containers
- API endpoints
- System resources

### Verify Services Before Restart

```bash
./verify-services.sh
```

Run this before restarting services to ensure everything is ready.

### Startup Pre-flight Checks

```bash
./startup-checks.sh --wait
```

Run this before starting the platform to ensure all dependencies are ready.

---

## Common Issues

### Issue 1: Frontend Shows Infinite Loading / Blank Page

**Symptom:** Frontend loads indefinitely or shows a blank white page.

**Root Cause:** Frontend build files (`dist/` directory) are missing or incomplete.

**Solution:**

```bash
# 1. Verify the issue
ls -la apps/react-app/dist/index.html

# 2. If missing, rebuild the frontend
./rebuild-frontend.sh

# 3. Restart the frontend service
pm2 restart cryb-frontend

# 4. Verify the fix
curl -I http://localhost:3008
```

**Prevention:**
- Always run `./verify-services.sh` before restarting PM2
- Add pre-restart hook in ecosystem.config.js
- Use `./startup-checks.sh` before platform start

**Related Files:**
- `/home/ubuntu/cryb-platform/apps/react-app/dist/` - Build directory
- `/home/ubuntu/cryb-platform/apps/react-app/serve-production.js` - Server script
- `/home/ubuntu/cryb-platform/rebuild-frontend.sh` - Rebuild automation

---

### Issue 2: PM2 Process Crashes on Restart

**Symptom:** Services show "errored" or "stopped" status after PM2 restart.

**Diagnosis:**

```bash
pm2 list
pm2 logs <service-name> --lines 50
pm2 describe <service-name>
```

**Common Causes:**

1. **Missing environment files**
   ```bash
   # Check for .env.production files
   ls -la apps/api/.env.production
   ls -la apps/react-app/.env.production
   ```

2. **Missing dependencies**
   ```bash
   # Reinstall dependencies
   cd apps/api && npm install
   cd apps/react-app && npm install
   ```

3. **Port already in use**
   ```bash
   # Check what's using the port
   sudo lsof -i :3002
   sudo lsof -i :3008
   ```

**Solution:**

```bash
# 1. Stop all processes
pm2 stop all

# 2. Run verification
./verify-services.sh --fix

# 3. Start services one by one
pm2 start ecosystem.config.js --only cryb-api
pm2 start ecosystem.config.js --only cryb-frontend
pm2 start ecosystem.config.js --only cryb-workers

# 4. Check logs
pm2 logs --lines 50
```

---

### Issue 3: Database Connection Failed

**Symptom:** API logs show "Database connection failed" or Prisma errors.

**Diagnosis:**

```bash
# Check PostgreSQL is running
docker ps | grep postgres
pg_isready -h localhost -p 5432

# Check via API health endpoint
curl http://localhost:3002/health | jq .checks.database
```

**Solutions:**

1. **Container not running:**
   ```bash
   docker start cryb-postgres-dev
   docker logs cryb-postgres-dev --tail 50
   ```

2. **Wrong port or credentials:**
   ```bash
   # Check environment variables
   grep DATABASE_URL apps/api/.env.production

   # Should be: postgresql://cryb_user:cryb_password@localhost:5432/cryb_platform?schema=public
   ```

3. **Database not initialized:**
   ```bash
   cd apps/api
   npx prisma migrate deploy
   npx prisma generate
   ```

---

### Issue 4: Redis Connection Refused

**Symptom:** API logs show "Redis connection refused" or ECONNREFUSED errors.

**Diagnosis:**

```bash
# Check Redis is running (note: port 6380, not 6379)
docker ps | grep redis
redis-cli -h localhost -p 6380 ping
```

**Solution:**

```bash
# 1. Start Redis container
docker start cryb-redis-dev

# 2. Verify it's accessible
redis-cli -h localhost -p 6380 ping
# Should return: PONG

# 3. Check configuration
grep REDIS_PORT apps/api/.env.production
# Should be: REDIS_PORT=6380
```

**Common Mistake:** Using port 6379 instead of 6380 (dev environment uses 6380).

---

### Issue 5: High Memory Usage / OOM Errors

**Symptom:** System becomes slow, processes crash with "out of memory" errors.

**Diagnosis:**

```bash
# Check memory usage
free -h
pm2 monit

# Check swap usage
swapon --show

# Check which process is using memory
pm2 list
docker stats --no-stream
```

**Solution:**

```bash
# 1. Identify memory hogs
pm2 list | grep -E "memory|restart"

# 2. Restart high-memory processes
pm2 restart <process-name>

# 3. Clear logs if they're large
pm2 flush

# 4. Check Docker containers
docker stats --no-stream
```

**Prevention:**
- Enable PM2 log rotation: `pm2 install pm2-logrotate`
- Set memory limits in ecosystem.config.js
- Monitor with `./health-check.sh`

---

### Issue 6: Socket.IO Not Connecting

**Symptom:** Real-time features don't work, WebSocket errors in browser console.

**Diagnosis:**

```bash
# Check Socket.IO endpoint
curl http://localhost:3002/socket.io/
# Should return: {"code":0,"message":"Transport unknown"}

# Check API logs for Socket.IO connections
pm2 logs cryb-api --lines 50 | grep -i socket
```

**Common Causes:**

1. **CORS issues** - Check ALLOWED_ORIGINS in .env.production
2. **Reverse proxy misconfiguration** - Check nginx WebSocket headers
3. **API not running** - Verify `pm2 list`

**Solution:**

```bash
# 1. Verify CORS settings
grep ALLOWED_ORIGINS apps/api/.env.production

# 2. Test Socket.IO directly
node -e "
const io = require('socket.io-client');
const socket = io('http://localhost:3002');
socket.on('connect', () => console.log('Connected!'));
socket.on('error', (err) => console.error('Error:', err));
"

# 3. Check nginx configuration (if using reverse proxy)
sudo nginx -t
```

---

## Service-Specific Issues

### API Service (cryb-api)

**Location:** `/home/ubuntu/cryb-platform/apps/api`
**Port:** 3002
**Type:** Node.js TypeScript (tsx runtime)

Common issues:

1. **TypeScript compilation errors**
   - Not needed (using tsx for runtime compilation)
   - No `dist/` directory required

2. **Missing Prisma client**
   ```bash
   cd apps/api
   npx prisma generate
   ```

3. **JWT authentication errors**
   - Check JWT_SECRET in .env.production
   - Ensure it's at least 64 characters

**Logs:**
```bash
pm2 logs cryb-api --lines 100
pm2 logs cryb-api --err --lines 50
```

---

### Frontend Service (cryb-frontend)

**Location:** `/home/ubuntu/cryb-platform/apps/react-app`
**Port:** 3008
**Type:** React SPA (Vite build)

Common issues:

1. **Missing dist/ directory** - See [Issue 1](#issue-1-frontend-shows-infinite-loading--blank-page)

2. **serve-production.js errors**
   ```bash
   # Verify serve script exists
   ls -la apps/react-app/serve-production.js

   # Check if it's executable
   node apps/react-app/serve-production.js
   ```

3. **Static files not served**
   - Check dist/assets/ directory exists
   - Verify file permissions

**Rebuild:**
```bash
./rebuild-frontend.sh
```

---

### Workers Service (cryb-workers)

**Location:** `/home/ubuntu/cryb-platform/apps/api/src/start-workers.ts`
**Type:** BullMQ job processor

Common issues:

1. **Redis connection errors** - See [Issue 4](#issue-4-redis-connection-refused)

2. **Jobs not processing**
   ```bash
   pm2 logs cryb-workers --lines 50
   redis-cli -h localhost -p 6380 KEYS "bull:*"
   ```

---

## Build Issues

### Frontend Build Fails

**Error:** `npm run build` fails with errors.

**Common Causes:**

1. **Missing dependencies**
   ```bash
   cd apps/react-app
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **TypeScript errors**
   ```bash
   # Check for errors
   npm run type-check

   # Fix them or adjust tsconfig.json
   ```

3. **Out of memory during build**
   ```bash
   # Increase Node.js memory
   export NODE_OPTIONS="--max-old-space-size=4096"
   npm run build
   ```

4. **Vite configuration issues**
   ```bash
   # Verify vite.config.js exists
   ls -la apps/react-app/vite.config.js
   ```

**Safe Rebuild:**
```bash
./rebuild-frontend.sh --force
```

---

### API Build Issues

**Note:** API uses TypeScript runtime (tsx), so no build step is required.

If you need to check TypeScript errors:
```bash
cd apps/api
npx tsc --noEmit
```

---

## Database Issues

### Migration Failures

```bash
cd apps/api

# Reset database (WARNING: destroys data)
npx prisma migrate reset

# Or apply pending migrations
npx prisma migrate deploy

# Regenerate Prisma client
npx prisma generate
```

### Connection Pool Exhausted

```bash
# Check active connections
docker exec cryb-postgres-dev psql -U cryb_user -d cryb_platform -c "SELECT count(*) FROM pg_stat_activity;"

# Restart API to reset pool
pm2 restart cryb-api
```

### Slow Queries

```bash
# Enable query logging in Prisma
# Add to .env.production:
# DATABASE_URL="...?schema=public&connection_limit=20&pool_timeout=20"

# Check logs
pm2 logs cryb-api | grep -i "slow query"
```

---

## Performance Issues

### Monitoring

```bash
# System resources
./health-check.sh

# PM2 monitoring
pm2 monit

# Docker stats
docker stats --no-stream

# Disk I/O
iostat -x 1 5
```

### Common Optimizations

1. **Enable PM2 log rotation**
   ```bash
   pm2 install pm2-logrotate
   pm2 set pm2-logrotate:max_size 10M
   pm2 set pm2-logrotate:retain 7
   ```

2. **Clear old logs**
   ```bash
   pm2 flush
   docker system prune -f
   ```

3. **Optimize Docker**
   ```bash
   docker system df
   docker image prune -a -f
   docker volume prune -f
   ```

4. **Check for memory leaks**
   ```bash
   # Monitor over time
   watch -n 5 'pm2 list | grep -E "cryb-api|memory"'
   ```

---

## Automation Scripts

### Overview

Four automation scripts are provided for platform maintenance:

#### 1. health-check.sh

**Purpose:** Comprehensive system health validation
**Usage:**
```bash
./health-check.sh [--json] [--verbose]
```

**Output:** JSON report at `health-check-report.json`

**When to use:**
- Daily monitoring
- After deployments
- Before major changes
- Debugging issues

---

#### 2. rebuild-frontend.sh

**Purpose:** Safely rebuild frontend with backups
**Usage:**
```bash
./rebuild-frontend.sh [--skip-backup] [--force]
```

**Features:**
- Automatic backups (keeps last 5)
- Build verification
- Rollback on failure
- Interactive restart

**When to use:**
- After code changes
- When frontend is broken
- Before deployment
- Scheduled rebuilds

---

#### 3. verify-services.sh

**Purpose:** Pre-restart validation
**Usage:**
```bash
./verify-services.sh [--strict] [--fix]
```

**Checks:**
- Environment files
- Build files
- Dependencies
- Docker containers
- Configurations

**When to use:**
- Before `pm2 restart all`
- Before deployment
- After system changes
- Automated CI/CD

---

#### 4. startup-checks.sh

**Purpose:** Pre-startup validation
**Usage:**
```bash
./startup-checks.sh [--wait] [--timeout=120]
```

**Checks:**
- System resources
- Docker services
- Database readiness
- Build files
- Dependencies

**When to use:**
- Before platform start
- After server reboot
- Automated startup
- Container orchestration

---

## Emergency Procedures

### Complete Platform Restart

```bash
# 1. Verify services
./verify-services.sh

# 2. Stop all PM2 processes
pm2 stop all

# 3. Restart Docker containers (if needed)
docker restart cryb-postgres-dev cryb-redis-dev cryb-minio elasticsearch

# 4. Wait for services
./startup-checks.sh --wait --timeout=180

# 5. Start PM2 processes
pm2 start ecosystem.config.js

# 6. Verify health
./health-check.sh
```

---

### Complete System Recovery

If the platform is completely broken:

```bash
# 1. Backup current state
cd /home/ubuntu/cryb-platform
tar -czf ~/cryb-backup-$(date +%Y%m%d_%H%M%S).tar.gz .

# 2. Stop everything
pm2 stop all
pm2 delete all

# 3. Check Docker
docker ps -a
docker start cryb-postgres-dev cryb-redis-dev cryb-minio elasticsearch

# 4. Rebuild frontend
./rebuild-frontend.sh --force

# 5. Reinstall dependencies
cd apps/api && npm install
cd ../react-app && npm install

# 6. Regenerate Prisma
cd apps/api
npx prisma generate

# 7. Start services
cd /home/ubuntu/cryb-platform
pm2 start ecosystem.config.js

# 8. Monitor
pm2 logs --lines 50
```

---

### Rollback Frontend Build

```bash
# 1. List backups
ls -lah backups/frontend-builds/

# 2. Restore specific backup
cd apps/react-app
rm -rf dist
tar -xzf ../../backups/frontend-builds/dist_backup_YYYYMMDD_HHMMSS.tar.gz

# 3. Restart frontend
pm2 restart cryb-frontend
```

---

### Database Recovery

```bash
# 1. Backup first
docker exec cryb-postgres-dev pg_dump -U cryb_user cryb_platform > backup.sql

# 2. List available backups
ls -lah /home/ubuntu/cryb-platform/backups/database/

# 3. Restore from backup
docker exec -i cryb-postgres-dev psql -U cryb_user cryb_platform < backup.sql

# 4. Restart API
pm2 restart cryb-api
```

---

## Monitoring & Alerts

### Built-in Monitoring

CRYB includes several monitoring exporters:

- **Prometheus:** http://localhost:9090
- **Grafana:** http://localhost:3005
- **Uptime Kuma:** http://localhost:3004
- **Jaeger (Tracing):** http://localhost:16686

### Key Metrics to Watch

1. **PM2 Restarts** - High restart count indicates instability
2. **Memory Usage** - >90% means imminent issues
3. **Disk Space** - >80% requires action
4. **API Response Time** - >1000ms indicates problems
5. **Socket.IO Connections** - Sudden drops mean issues

### Setting Up Alerts

Add to ecosystem.config.js:
```javascript
max_memory_restart: '1G',
max_restarts: 10,
min_uptime: '10s'
```

---

## Preventive Measures

### 1. Automated Health Checks

Add to crontab:
```bash
# Run health check every hour
0 * * * * /home/ubuntu/cryb-platform/health-check.sh --json > /dev/null

# Run startup checks at boot
@reboot sleep 30 && /home/ubuntu/cryb-platform/startup-checks.sh --wait
```

### 2. PM2 Startup Script

```bash
# Save current PM2 processes
pm2 save

# Configure startup script
pm2 startup systemd -u ubuntu
# Run the command it outputs
```

### 3. Automated Backups

```bash
# Add to crontab
0 2 * * * /home/ubuntu/cryb-platform/scripts/backup-database.sh
0 3 * * 0 /home/ubuntu/cryb-platform/rebuild-frontend.sh --skip-backup
```

### 4. Log Rotation

```bash
# Install PM2 log rotation
pm2 install pm2-logrotate

# Configure
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

### 5. Pre-restart Hook

Update ecosystem.config.js:
```javascript
{
  name: 'cryb-frontend',
  script: 'serve-production.js',
  // Add this:
  pre_start: './verify-services.sh --fix'
}
```

---

## Getting Help

### Debug Information to Collect

When reporting issues, include:

```bash
# 1. Health check report
./health-check.sh --json

# 2. PM2 status
pm2 list
pm2 describe <service-name>

# 3. Recent logs
pm2 logs --lines 100 --nostream

# 4. Docker status
docker ps -a
docker stats --no-stream

# 5. System info
uname -a
free -h
df -h

# 6. Environment
node -v
npm -v
pm2 -v
docker -v
```

### Log Locations

- **PM2 Logs:** `/home/ubuntu/.pm2/logs/`
- **Docker Logs:** `docker logs <container-name>`
- **Health Reports:** `/home/ubuntu/cryb-platform/health-check-report.json`
- **Build Backups:** `/home/ubuntu/cryb-platform/backups/frontend-builds/`

---

## Appendix

### Environment Variables Reference

**API (.env.production):**
```bash
NODE_ENV=production
PORT=3002
DATABASE_URL=postgresql://cryb_user:cryb_password@localhost:5432/cryb_platform?schema=public
REDIS_HOST=localhost
REDIS_PORT=6380
REDIS_PASSWORD=
JWT_SECRET=<64+ characters>
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
```

**Frontend (.env.production):**
```bash
VITE_API_URL=http://localhost:3002
VITE_WS_URL=ws://localhost:3002
```

### Port Reference

| Service | Port | Protocol | Purpose |
|---------|------|----------|---------|
| API | 3002 | HTTP/WS | Main API & Socket.IO |
| Frontend | 3008 | HTTP | React SPA |
| PostgreSQL | 5432 | TCP | Database (internal) |
| PostgreSQL | 5433 | TCP | Database (external) |
| Redis | 6380 | TCP | Cache & Pub/Sub |
| MinIO | 9000 | HTTP | S3-compatible storage |
| MinIO Console | 9001 | HTTP | MinIO admin UI |
| Elasticsearch | 9200 | HTTP | Search engine |
| Prometheus | 9090 | HTTP | Metrics |
| Grafana | 3005 | HTTP | Dashboards |
| Uptime Kuma | 3004 | HTTP | Monitoring |

---

**Document Version:** 1.0
**Created:** November 16, 2025
**Related Scripts:** health-check.sh, rebuild-frontend.sh, verify-services.sh, startup-checks.sh
