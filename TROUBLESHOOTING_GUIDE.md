# CRYB Platform - Troubleshooting Guide

**Quick Reference for Common Issues and Solutions**
**Last Updated:** 2025-11-04
**Version:** 1.0

---

## Table of Contents

1. [Build & Deployment Issues](#build--deployment-issues)
2. [Runtime Errors](#runtime-errors)
3. [Database Issues](#database-issues)
4. [Authentication Problems](#authentication-problems)
5. [Real-time Communication](#real-time-communication)
6. [Voice/Video (LiveKit)](#voicevideo-livekit)
7. [Web3/Wallet Connection](#web3wallet-connection)
8. [Performance Issues](#performance-issues)
9. [Monitoring & Logging](#monitoring--logging)
10. [Network & Connectivity](#network--connectivity)

---

## Build & Deployment Issues

### Build Fails with Module Resolution Error

**Symptom:**
```
Error: Cannot find module 'xyz'
```

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json pnpm-lock.yaml
pnpm install

# Clear Vite cache
rm -rf node_modules/.vite

# Rebuild
pnpm build
```

### LiveKit Import Warnings During Build

**Symptom:**
```
"AudioTrack" is not exported by "livekit-client"
```

**Impact:** Non-critical - build completes successfully

**Solution (Optional):**
```bash
# Update livekit-client to latest
npm update livekit-client

# Or remove unused type imports from webrtc.js
# These are TypeScript types, not runtime imports
```

### Build Hangs or Takes Extremely Long

**Symptom:** Build process exceeds 5 minutes

**Solution:**
```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Check system resources
htop
df -h

# If disk is full, clear space
npm cache clean --force
rm -rf dist/ node_modules/.vite
```

### PM2 Process Won't Start

**Symptom:**
```
pm2 start ecosystem.config.js
Error: Process failed to start
```

**Solution:**
```bash
# Check PM2 logs
pm2 logs --err

# Verify Node.js version
node -v  # Should be 20+

# Check ecosystem.config.js syntax
node -c ecosystem.config.js

# Verify environment file exists
ls -la .env.production

# Start with verbose logging
pm2 start ecosystem.config.js --log-date-format="YYYY-MM-DD HH:mm:ss"
```

### Nginx 502 Bad Gateway

**Symptom:** Nginx returns 502 error

**Solution:**
```bash
# Check if backend is running
pm2 status
curl http://localhost:3001/health

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Verify upstream configuration
sudo nginx -t

# Check if port is in use
sudo netstat -tulpn | grep 3001

# Restart services
pm2 restart all
sudo systemctl restart nginx
```

---

## Runtime Errors

### Application Crashes on Startup

**Symptom:** App starts but immediately crashes

**Solution:**
```bash
# Check PM2 logs for error details
pm2 logs cryb-api --lines 100

# Common causes:
# 1. Missing environment variables
cat .env.production
# Verify all required variables are set

# 2. Database connection failure
psql -U cryb -d cryb -c "SELECT 1;"

# 3. Redis connection failure
redis-cli ping

# 4. Port already in use
sudo lsof -i :3001
# Kill process if needed
```

### "Cannot read property of undefined" Errors

**Symptom:** JavaScript runtime errors in browser console

**Solution:**
```javascript
// Check if data exists before accessing
const user = data?.user ?? null;
const username = user?.username ?? 'Anonymous';

// Use optional chaining and nullish coalescing
// Update components to handle loading states properly
```

### React 19 Compatibility Issues

**Symptom:** Component render errors

**Solution:**
```bash
# Verify React version
npm list react react-dom

# Check for deprecated lifecycle methods
# Update to React 19 patterns:
# - useEffect for side effects
# - No more componentWillMount
# - Use concurrent features properly

# Clear React DevTools cache
# In browser: React DevTools > Settings > Clear cache
```

---

## Database Issues

### "too many clients" Error

**Symptom:**
```
Error: sorry, too many clients already
```

**Solution:**
```bash
# Check current connections
sudo -u postgres psql -d cryb -c "
  SELECT count(*) FROM pg_stat_activity;
"

# Kill idle connections
sudo -u postgres psql -d cryb -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE state = 'idle'
  AND state_change < NOW() - INTERVAL '5 minutes';
"

# Increase max_connections in postgresql.conf
sudo nano /etc/postgresql/14/main/postgresql.conf
# max_connections = 200

# Or implement connection pooling with PgBouncer
```

### Slow Database Queries

**Symptom:** API responses taking > 1 second

**Solution:**
```bash
# Find slow queries
sudo -u postgres psql -d cryb -c "
  SELECT query, mean_exec_time, calls
  FROM pg_stat_statements
  ORDER BY mean_exec_time DESC
  LIMIT 10;
"

# Check for missing indexes
sudo -u postgres psql -d cryb -c "
  SELECT schemaname, tablename, attname, n_distinct, correlation
  FROM pg_stats
  WHERE schemaname = 'public'
  ORDER BY n_distinct DESC;
"

# Add indexes as needed
sudo -u postgres psql -d cryb -c "
  CREATE INDEX CONCURRENTLY idx_posts_created_at ON posts(created_at DESC);
"

# Run ANALYZE
sudo -u postgres psql -d cryb -c "ANALYZE;"
```

### Database Migration Failures

**Symptom:** Migration command fails

**Solution:**
```bash
# Check current migration status
cd apps/api
npx prisma migrate status

# If migration is stuck, reset
npx prisma migrate resolve --rolled-back <migration_name>

# Rerun migration
npx prisma migrate deploy

# If all else fails, regenerate Prisma client
npx prisma generate
```

### Database Disk Full

**Symptom:**
```
ERROR: could not extend file: No space left on device
```

**Solution:**
```bash
# Check disk usage
df -h

# Find large tables
sudo -u postgres psql -d cryb -c "
  SELECT schemaname, tablename,
         pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
  LIMIT 10;
"

# Vacuum database
sudo -u postgres psql -d cryb -c "VACUUM FULL ANALYZE;"

# Clear old logs if using TimescaleDB retention
sudo -u postgres psql -d cryb -c "
  SELECT remove_retention_policy('analytics_events');
  SELECT add_retention_policy('analytics_events', INTERVAL '90 days');
"
```

---

## Authentication Problems

### JWT Token Invalid or Expired

**Symptom:**
```json
{"error": "Token expired" }
```

**Solution:**
```javascript
// Frontend: Implement token refresh
const refreshToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  const response = await fetch('/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  const data = await response.json();
  localStorage.setItem('accessToken', data.accessToken);
};

// Backend: Verify JWT_SECRET is set correctly
// Check .env.production
echo $JWT_SECRET
```

### OAuth Login Fails

**Symptom:** OAuth redirect returns error

**Solution:**
```bash
# Verify OAuth credentials in .env
cat .env.production | grep GOOGLE_CLIENT_ID

# Check redirect URLs match in OAuth provider console
# Google: https://console.cloud.google.com/
# GitHub: https://github.com/settings/developers
# Discord: https://discord.com/developers/applications

# Verify callback URL format:
# https://platform.cryb.ai/auth/callback/google
# https://platform.cryb.ai/auth/callback/github
# https://platform.cryb.ai/auth/callback/discord

# Check CORS settings
# Ensure OAuth providers are in allowed origins
```

### MFA/2FA Not Working

**Symptom:** TOTP codes rejected

**Solution:**
```bash
# Check server time synchronization
timedatectl status
# If time is off:
sudo timedatectl set-ntp true

# Verify 2FA secret generation
# Secret should be base32 encoded
# Use same time-based algorithm (TOTP) as authenticator app

# Clear and re-register authenticator
# Provide user with new QR code
```

### Session Persistence Issues

**Symptom:** User logged out unexpectedly

**Solution:**
```bash
# Check Redis connection
redis-cli ping

# Verify session storage
redis-cli
> KEYS session:*
> TTL session:user_id

# Check session expiry settings
cat .env.production | grep JWT_EXPIRES_IN

# Increase session duration if needed
# JWT_EXPIRES_IN=24h
# JWT_REFRESH_EXPIRES_IN=7d
```

---

## Real-time Communication

### Socket.io Connection Fails

**Symptom:**
```
WebSocket connection failed
```

**Solution:**
```bash
# Check if Socket.io server is running
netstat -tulpn | grep 3001

# Verify WebSocket URL
# Should be: wss://api.cryb.ai (production)
# Not: ws:// (insecure)

# Check Nginx WebSocket proxy config
sudo nano /etc/nginx/sites-available/cryb-platform
# Ensure these headers are set:
# proxy_set_header Upgrade $http_upgrade;
# proxy_set_header Connection "upgrade";

# Test WebSocket connection
wscat -c wss://api.cryb.ai
```

### Messages Not Delivering in Real-time

**Symptom:** Chat messages delayed or not appearing

**Solution:**
```bash
# Check Socket.io connections
# In PM2 logs, look for:
pm2 logs cryb-api | grep "client connected"

# Verify Redis pub/sub working
redis-cli
> SUBSCRIBE test_channel
# In another terminal:
redis-cli
> PUBLISH test_channel "hello"
# Should receive message in first terminal

# Check for errors in browser console
# Network tab should show Socket.io polling/websocket

# Verify CORS settings allow Socket.io
# Origin must match frontend URL
```

### Socket.io Memory Leak

**Symptom:** Memory usage grows continuously

**Solution:**
```javascript
// Ensure proper cleanup on disconnect
socket.on('disconnect', () => {
  // Remove all listeners
  socket.removeAllListeners();

  // Clean up room memberships
  // Clear user session data
});

// Limit maximum listeners
socket.setMaxListeners(20);

// Monitor with PM2
pm2 monit
// If memory keeps growing, restart:
pm2 restart cryb-api
```

---

## Voice/Video (LiveKit)

### Cannot Connect to Voice Channel

**Symptom:** "Failed to connect to voice channel"

**Solution:**
```bash
# Check LiveKit server status
curl http://localhost:7880/health
# Should return 200 OK

# Verify LiveKit configuration
cat .env.production | grep LIVEKIT

# Check TURN server for NAT traversal
# TURN_SECRET should be set
# Test TURN server: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/

# Check firewall rules
sudo ufw status
# Ensure ports open:
# 7880 (LiveKit WebSocket)
# 3478 (TURN TCP/UDP)
# 49152-65535 (RTP/RTCP range)
```

### No Audio/Video in Voice Channel

**Symptom:** Connected but can't hear/see others

**Solution:**
```javascript
// Frontend: Check browser permissions
navigator.mediaDevices.getUserMedia({ audio: true, video: true })
  .then(stream => console.log('Permissions granted'))
  .catch(err => console.error('Permissions denied:', err));

// Check if tracks are publishing
room.localParticipant.audioTracks.forEach(track => {
  console.log('Audio track:', track.isEnabled);
});

// Verify participant subscriptions
room.remoteParticipants.forEach(participant => {
  participant.audioTracks.forEach(track => {
    console.log('Remote audio:', track.isSubscribed);
  });
});
```

### Voice Quality Issues

**Symptom:** Choppy audio, echo, or static

**Solution:**
```bash
# Check bandwidth
# Run speed test: https://fast.com/

# Review LiveKit audio settings in .env.production
# DEFAULT_AUDIO_BITRATE=128000 (128 kbps)
# Lower for poor connections: 64000 (64 kbps)

# Enable echo cancellation in frontend
# audioConstraints: {
#   echoCancellation: true,
#   noiseSuppression: true,
#   autoGainControl: true
# }

# Check server CPU usage
htop
# If high, scale LiveKit horizontally
```

### Recording Fails

**Symptom:** Voice channel recording doesn't start

**Solution:**
```bash
# Verify S3 bucket configuration
cat .env.production | grep S3_BUCKET

# Test S3 access
aws s3 ls s3://cryb-recordings
# Should list bucket contents

# Check LiveKit egress configuration
# Ensure recording is enabled:
# ENABLE_RECORDING=true

# Check PM2 logs for S3 upload errors
pm2 logs | grep "S3 upload"
```

---

## Web3/Wallet Connection

### Wallet Connection Fails

**Symptom:** "Could not connect wallet"

**Solution:**
```javascript
// Check if MetaMask is installed
if (typeof window.ethereum === 'undefined') {
  console.error('MetaMask not installed');
  // Show install prompt
}

// Check network
const chainId = await window.ethereum.request({ method: 'eth_chainId' });
console.log('Chain ID:', chainId);
// 0x1 = Ethereum Mainnet
// 0x89 = Polygon Mainnet
// 0xaa36a7 = Sepolia Testnet

// Verify WalletConnect Project ID
cat .env.production | grep WALLETCONNECT_PROJECT_ID
// Get from: https://cloud.walletconnect.com/
```

### Wrong Network Selected

**Symptom:** "Please switch to [network]"

**Solution:**
```javascript
// Request network switch
const switchNetwork = async (chainId) => {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    });
  } catch (switchError) {
    // Network not added, add it
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x89', // Polygon
          chainName: 'Polygon Mainnet',
          nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18
          },
          rpcUrls: ['https://polygon-rpc.com/'],
          blockExplorerUrls: ['https://polygonscan.com/']
        }]
      });
    }
  }
};
```

### Smart Contract Interaction Fails

**Symptom:** Transaction reverts or fails

**Solution:**
```bash
# Verify contract addresses in .env.production
cat .env.production | grep VITE_CRYB_TOKEN

# Check contract is deployed
# Use block explorer:
# Ethereum: https://etherscan.io/
# Polygon: https://polygonscan.com/
# Sepolia: https://sepolia.etherscan.io/

# Verify ABI matches deployed contract
# Check contracts/ directory for latest ABI

# Check user has sufficient gas
# ETH for Ethereum
# MATIC for Polygon

# Test transaction with lower gas limit
# Increase slippage tolerance if swap
```

### Token Balance Not Updating

**Symptom:** Balance shows 0 or old value

**Solution:**
```javascript
// Refresh balance manually
const updateBalance = async (address, tokenAddress) => {
  const contract = new ethers.Contract(
    tokenAddress,
    ERC20_ABI,
    provider
  );
  const balance = await contract.balanceOf(address);
  console.log('Balance:', ethers.formatEther(balance));
};

// Listen for Transfer events
contract.on('Transfer', (from, to, amount) => {
  if (to === userAddress) {
    updateBalance(userAddress, tokenAddress);
  }
});

// Check if using correct RPC endpoint
// Infura/Alchemy may have rate limits
```

---

## Performance Issues

### Slow Page Load Times

**Symptom:** Pages take > 3 seconds to load

**Solution:**
```bash
# Run Lighthouse audit
npm run audit:performance

# Check bundle size
ls -lh dist/assets/
# Look for chunks > 500 KB

# Analyze bundle composition
npm install --save-dev rollup-plugin-visualizer
# Add to vite.config.js and rebuild

# Enable compression in Nginx
sudo nano /etc/nginx/nginx.conf
# gzip on;
# gzip_types text/plain text/css application/json application/javascript;

# Verify CDN is serving static assets
# Check Network tab in browser DevTools
```

### High Memory Usage

**Symptom:** PM2 shows high memory usage

**Solution:**
```bash
# Check memory usage
pm2 monit

# Restart processes with memory limit
pm2 delete all
pm2 start ecosystem.config.js

# In ecosystem.config.js:
# max_memory_restart: '1G'

# Check for memory leaks
# Use Chrome DevTools Memory Profiler
# Look for detached DOM nodes

# Clear Redis cache if full
redis-cli
> INFO memory
> FLUSHDB  # Use with caution
```

### API Rate Limiting

**Symptom:**
```json
{"error": "Too many requests"}
```

**Solution:**
```bash
# Check rate limit configuration
cat .env.production | grep RATE_LIMIT

# Increase rate limits if needed
# RATE_LIMIT_API_CALLS=200

# Implement request batching in frontend
# Use debounce/throttle for search

# Add caching headers
# Cache-Control: public, max-age=3600

# Use Redis cache for frequent queries
```

### Database Connection Pool Exhausted

**Symptom:** "Connection pool exhausted"

**Solution:**
```javascript
// Increase Prisma connection pool
// In database/prisma/schema.prisma:
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Add connection pool settings
  // ?connection_limit=20&pool_timeout=30
}

// Ensure connections are properly released
// Always use try/finally
try {
  const result = await prisma.user.findMany();
} finally {
  // Connection automatically released by Prisma
}
```

---

## Monitoring & Logging

### Prometheus Not Collecting Metrics

**Symptom:** Grafana shows no data

**Solution:**
```bash
# Check Prometheus is running
sudo systemctl status prometheus
curl http://localhost:9090/metrics

# Verify targets in Prometheus
# Navigate to: http://localhost:9090/targets
# All targets should show "UP"

# Check Prometheus config
sudo nano /etc/prometheus/prometheus.yml
# Verify scrape_configs include all services

# Restart Prometheus
sudo systemctl restart prometheus
```

### Logs Not Appearing in Grafana

**Symptom:** Log queries return empty

**Solution:**
```bash
# Check if application is logging
pm2 logs cryb-api --lines 10

# Verify log format is JSON
# In application code, ensure structured logging:
logger.info({ userId, action: 'login' }, 'User logged in');

# Check Loki is running (if using)
sudo systemctl status loki

# Test log query
curl -G -s http://localhost:3100/loki/api/v1/query \
  --data-urlencode 'query={job="cryb-api"}' \
  | jq
```

### Sentry Not Receiving Errors

**Symptom:** No errors in Sentry dashboard

**Solution:**
```bash
# Verify Sentry DSN is set
cat .env.production | grep VITE_SENTRY_DSN

# Test Sentry integration
# Trigger a test error in browser:
Sentry.captureMessage('Test error from CRYB');

# Check if source maps are uploaded
sentry-cli releases list

# Verify Sentry is initialized
# In main.js or app.js:
import * as Sentry from "@sentry/react";
Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN });
```

---

## Network & Connectivity

### CORS Errors

**Symptom:**
```
Access to fetch at 'https://api.cryb.ai' from origin 'https://platform.cryb.ai' has been blocked by CORS policy
```

**Solution:**
```bash
# Check CORS configuration in .env.production
cat .env.production | grep CORS_ORIGIN
# Should include: https://platform.cryb.ai

# In backend (Fastify), verify CORS plugin:
fastify.register(cors, {
  origin: process.env.CORS_ORIGIN.split(','),
  credentials: true
});

# Check Nginx headers
sudo nano /etc/nginx/sites-available/cryb-platform
# add_header Access-Control-Allow-Origin "https://platform.cryb.ai";
# add_header Access-Control-Allow-Credentials "true";
```

### SSL Certificate Errors

**Symptom:** "Your connection is not private"

**Solution:**
```bash
# Check certificate status
sudo certbot certificates

# Verify certificate is valid
openssl s_client -connect platform.cryb.ai:443 -servername platform.cryb.ai

# Renew certificate if expired
sudo certbot renew

# Check Nginx SSL configuration
sudo nginx -t

# Verify SSL files exist
ls -l /etc/letsencrypt/live/platform.cryb.ai/
```

### DNS Issues

**Symptom:** Domain not resolving

**Solution:**
```bash
# Check DNS records
dig platform.cryb.ai
dig api.cryb.ai

# Verify A records point to correct IP
nslookup platform.cryb.ai

# Check DNS propagation
# Use: https://www.whatsmydns.net/

# Clear DNS cache locally
# Windows: ipconfig /flushdns
# Mac: sudo dscacheutil -flushcache
# Linux: sudo systemd-resolve --flush-caches
```

### Firewall Blocking Requests

**Symptom:** Connection timeout

**Solution:**
```bash
# Check firewall status
sudo ufw status

# Allow required ports
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow 7880/tcp # LiveKit
sudo ufw allow 3478/udp # TURN

# Check if IP is blocked
sudo ufw status numbered
# Remove rule if needed:
sudo ufw delete [rule number]

# Check if fail2ban blocked IP
sudo fail2ban-client status
sudo fail2ban-client set sshd unbanip <ip_address>
```

---

## Emergency Procedures

### Complete System Crash

**Immediate Actions:**
1. Check system is responsive: `ping server_ip`
2. SSH into server: `ssh ubuntu@server_ip`
3. Check disk space: `df -h`
4. Check memory: `free -h`
5. Check processes: `htop`
6. Restart crashed services:
   ```bash
   pm2 restart all
   sudo systemctl restart nginx
   sudo systemctl restart postgresql
   sudo systemctl restart redis
   ```

### Data Loss Prevention

**If Data Corruption Suspected:**
```bash
# STOP all write operations immediately
pm2 stop all

# Create emergency backup
sudo -u postgres pg_dump cryb | gzip > /tmp/emergency_backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Check database integrity
sudo -u postgres psql -d cryb -c "
  SELECT pg_database.datname,
         pg_size_pretty(pg_database_size(pg_database.datname)) AS size
  FROM pg_database
  ORDER BY pg_database_size(pg_database.datname) DESC;
"

# Verify latest backup
ls -lh /var/backups/cryb/database/ | tail -5
```

### Security Breach Response

**If Breach Suspected:**
```bash
# 1. Isolate system
sudo ufw deny from any to any

# 2. Check for unauthorized access
sudo last -a | head -20
sudo grep "Failed password" /var/log/auth.log

# 3. Review security logs
pm2 logs | grep -i "unauthorized\|forbidden\|invalid"

# 4. Change all secrets immediately
# Generate new JWT secrets
openssl rand -base64 32

# 5. Notify users
# Send email about potential breach
# Force password reset

# 6. Review and restore from backup if necessary
```

---

## Getting Help

### Before Contacting Support

1. **Gather Information:**
   - Error messages (exact text)
   - Steps to reproduce
   - Browser/client version
   - Server logs
   - Screenshots

2. **Check Documentation:**
   - README.md
   - DEPLOYMENT_GUIDE.md
   - API_DOCUMENTATION.md

3. **Check Logs:**
   ```bash
   pm2 logs --lines 100
   sudo tail -f /var/log/nginx/error.log
   sudo -u postgres tail -f /var/log/postgresql/postgresql-14-main.log
   ```

4. **Run Diagnostics:**
   ```bash
   # Health checks
   curl https://api.cryb.ai/health
   pm2 status
   sudo systemctl status nginx postgresql redis

   # Resource usage
   htop
   df -h
   free -h
   ```

### Support Channels

**Community:**
- Discord: [server invite]
- GitHub Issues: [repository/issues]
- Stack Overflow: Tag with `cryb-platform`

**Enterprise Support:**
- Email: support@cryb.ai
- Phone: [support phone]
- SLA: 24/7 for critical issues

**Emergency Contacts:**
- On-call engineer: [contact info]
- DevOps lead: [contact info]

---

## Common Error Codes

| Code | Meaning | Common Cause | Solution |
|------|---------|--------------|----------|
| 400 | Bad Request | Invalid input | Check request format |
| 401 | Unauthorized | Invalid/expired token | Refresh token or login |
| 403 | Forbidden | Insufficient permissions | Check user roles |
| 404 | Not Found | Resource doesn't exist | Verify ID/URL |
| 429 | Too Many Requests | Rate limit exceeded | Reduce request rate |
| 500 | Internal Server Error | Server-side issue | Check server logs |
| 502 | Bad Gateway | Backend down | Check PM2 status |
| 503 | Service Unavailable | Maintenance mode | Wait or check status |
| 504 | Gateway Timeout | Request too slow | Optimize query |

---

## Useful Commands Cheat Sheet

```bash
# Service Management
pm2 status
pm2 restart all
pm2 logs --lines 100
sudo systemctl restart nginx

# Database
sudo -u postgres psql -d cryb
\dt  # List tables
\d+ table_name  # Describe table
SELECT * FROM pg_stat_activity;  # Active connections

# Redis
redis-cli
PING
KEYS *
FLUSHDB

# System Resources
htop
df -h
free -h
iostat

# Network
netstat -tulpn
ss -tulpn
curl -I https://platform.cryb.ai

# Logs
tail -f /var/log/nginx/error.log
journalctl -u nginx -f
pm2 logs --err

# Security
sudo fail2ban-client status
sudo ufw status
sudo grep "Failed password" /var/log/auth.log
```

---

**Last Updated:** 2025-11-04
**Maintainer:** DevOps Team
**Version:** 1.0

**Keep this guide updated with new issues and solutions as they are discovered.**
