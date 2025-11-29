# CRYB Platform - Production Launch Checklist

**Quick Reference Guide for Production Deployment**
**Last Updated:** 2025-11-04
**Status:** Ready for Launch

---

## Pre-Launch (1 Week Before)

### Code Quality & Testing
- [ ] **Run security audit and fix vulnerabilities**
  ```bash
  cd /home/ubuntu/cryb-platform/apps/react-app
  npm audit fix
  npm update @walletconnect/ethereum-provider @reown/appkit
  ```

- [ ] **Run full test suite**
  ```bash
  npm run test:ci
  npm run test:smoke
  ```

- [ ] **Generate test coverage report**
  ```bash
  npm run test:coverage
  # Verify coverage > 80%
  ```

- [ ] **Run accessibility audit**
  ```bash
  npm run test:accessibility
  npm run audit:accessibility
  ```

- [ ] **Run performance audit**
  ```bash
  npm run audit:performance
  # Target: Lighthouse scores > 90
  ```

### Build Verification
- [ ] **Create production build**
  ```bash
  npm run build
  # Expected time: ~96 seconds
  # Expected size: ~945 KB gzipped
  ```

- [ ] **Verify build output**
  - Check dist/ directory created
  - Verify no critical build errors
  - Review warnings (LiveKit imports are non-critical)

- [ ] **Test production build locally**
  ```bash
  npm run start
  # Opens on http://localhost:4173
  # Test critical user flows
  ```

---

## Infrastructure Setup (3 Days Before)

### Server Provisioning
- [ ] **Provision production server(s)**
  - Minimum: 4 cores, 8GB RAM, 100GB SSD
  - Recommended: 8 cores, 16GB RAM, 500GB SSD
  - OS: Ubuntu 22.04 LTS

- [ ] **Install system dependencies**
  ```bash
  sudo apt update && sudo apt upgrade -y
  sudo apt install -y curl wget git unzip

  # Install Node.js 20 LTS
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs

  # Install pnpm
  npm install -g pnpm@9.15.0

  # Install PM2
  npm install -g pm2@latest

  # Install Nginx
  sudo apt install -y nginx
  ```

### Database Setup
- [ ] **Install PostgreSQL 14+**
  ```bash
  sudo apt install -y postgresql-14 postgresql-client-14
  ```

- [ ] **Create database and user**
  ```bash
  sudo -u postgres psql
  CREATE USER cryb WITH ENCRYPTED PASSWORD 'your_secure_password';
  CREATE DATABASE cryb OWNER cryb;
  GRANT ALL PRIVILEGES ON DATABASE cryb TO cryb;
  \q
  ```

- [ ] **Install TimescaleDB extension**
  ```bash
  sudo apt install -y timescaledb-2-postgresql-14
  sudo -u postgres psql -d cryb -c "CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;"
  ```

### Redis Setup
- [ ] **Install and configure Redis**
  ```bash
  sudo apt install -y redis-server
  sudo systemctl enable redis
  sudo systemctl start redis
  ```

### SSL Certificates
- [ ] **Install Certbot**
  ```bash
  sudo apt install -y certbot python3-certbot-nginx
  ```

- [ ] **Obtain SSL certificates**
  ```bash
  sudo certbot --nginx -d platform.cryb.ai -d api.cryb.ai
  # Follow prompts to complete setup
  ```

---

## Configuration (1 Day Before)

### Environment Variables
- [ ] **Update .env.production with production secrets**
  ```bash
  cd /home/ubuntu/cryb-platform/apps/react-app
  nano .env.production
  ```

- [ ] **Critical secrets to replace:**
  - `LIVEKIT_API_KEY` - Your LiveKit production API key
  - `LIVEKIT_API_SECRET` - Your LiveKit production secret
  - `TURN_SECRET` - Your TURN server secret
  - `REDIS_PASSWORD` - Your Redis password
  - `JWT_SECRET` - Generate: `openssl rand -base64 32`
  - `S3_ACCESS_KEY` - AWS S3 access key
  - `S3_SECRET_KEY` - AWS S3 secret key
  - `VITE_SENTRY_DSN` - Your Sentry DSN
  - `VITE_GA_MEASUREMENT_ID` - Your Google Analytics ID

- [ ] **Verify URLs point to production:**
  - `VITE_API_URL=https://api.cryb.ai/api/v1`
  - `VITE_WS_URL=wss://api.cryb.ai`
  - `VITE_PUBLIC_URL=https://platform.cryb.ai`

- [ ] **Database connection string:**
  ```bash
  DATABASE_URL=postgresql://cryb:your_secure_password@localhost:5432/cryb
  ```

### Application Deployment
- [ ] **Clone repository**
  ```bash
  cd /home/ubuntu
  git clone https://github.com/your-org/cryb-platform.git
  cd cryb-platform
  ```

- [ ] **Install dependencies**
  ```bash
  pnpm install
  ```

- [ ] **Run database migrations**
  ```bash
  cd apps/api
  pnpm db:migrate
  # Optional: Seed initial data
  # pnpm db:seed
  ```

- [ ] **Build applications**
  ```bash
  cd /home/ubuntu/cryb-platform
  pnpm build
  ```

### Nginx Configuration
- [ ] **Create Nginx config**
  ```bash
  sudo nano /etc/nginx/sites-available/cryb-platform
  # Use configuration from docs/DEPLOYMENT_GUIDE.md
  ```

- [ ] **Enable site**
  ```bash
  sudo ln -s /etc/nginx/sites-available/cryb-platform /etc/nginx/sites-enabled/
  sudo nginx -t
  sudo systemctl reload nginx
  ```

### PM2 Configuration
- [ ] **Set up PM2 ecosystem**
  ```bash
  cd /home/ubuntu/cryb-platform
  # ecosystem.config.js should already exist
  pm2 start ecosystem.config.js
  pm2 save
  pm2 startup
  # Follow the generated command
  ```

---

## Launch Day

### Pre-Deployment Checks
- [ ] **Verify all services are running**
  ```bash
  sudo systemctl status nginx
  sudo systemctl status postgresql
  sudo systemctl status redis
  ```

- [ ] **Test database connection**
  ```bash
  psql -U cryb -d cryb -c "SELECT 1;"
  ```

- [ ] **Test Redis connection**
  ```bash
  redis-cli ping
  # Should return: PONG
  ```

### Deployment
- [ ] **Start PM2 processes**
  ```bash
  cd /home/ubuntu/cryb-platform
  pm2 start ecosystem.config.js
  pm2 save
  ```

- [ ] **Verify all processes running**
  ```bash
  pm2 status
  # All processes should show "online"
  ```

- [ ] **Check application logs**
  ```bash
  pm2 logs
  # Look for any errors
  ```

### Health Checks
- [ ] **Test API health endpoint**
  ```bash
  curl https://api.cryb.ai/health
  # Should return 200 OK with health status
  ```

- [ ] **Test frontend**
  ```bash
  curl -I https://platform.cryb.ai/
  # Should return 200 OK
  ```

- [ ] **Test WebSocket connection**
  ```bash
  # Use browser console or wscat
  wscat -c wss://api.cryb.ai
  ```

### Smoke Testing (Critical User Flows)
- [ ] **User registration**
  - Navigate to registration page
  - Create new account
  - Verify email verification flow

- [ ] **Authentication**
  - Login with credentials
  - Test JWT token refresh
  - Test OAuth providers (Google, GitHub, Discord)

- [ ] **Real-time messaging**
  - Send a message in chat
  - Verify real-time delivery
  - Test Socket.io connection

- [ ] **Voice channel**
  - Join a voice channel
  - Verify LiveKit connection
  - Test audio transmission

- [ ] **Web3 wallet connection**
  - Connect MetaMask/WalletConnect
  - Verify wallet address displayed
  - Test transaction signing

- [ ] **File upload**
  - Upload an image
  - Verify S3 storage
  - Test file download

- [ ] **Search functionality**
  - Search for posts/users
  - Verify results returned
  - Test filters

### Monitoring Setup
- [ ] **Verify Prometheus is collecting metrics**
  ```bash
  curl http://localhost:9090/metrics
  ```

- [ ] **Access Grafana dashboard**
  ```bash
  # Navigate to configured Grafana URL
  # Login and verify dashboards
  ```

- [ ] **Test Sentry error reporting**
  - Trigger a test error
  - Verify it appears in Sentry dashboard

- [ ] **Verify Google Analytics tracking**
  - Visit site
  - Check Google Analytics real-time view

### Alert Configuration
- [ ] **Test alert notifications**
  - Verify alert rules are active
  - Test notification channels (email/Slack)
  - Simulate high CPU alert

---

## Post-Launch (First 24 Hours)

### Immediate Monitoring
- [ ] **Monitor error logs continuously**
  ```bash
  pm2 logs --err
  tail -f /var/log/nginx/error.log
  ```

- [ ] **Watch system resources**
  ```bash
  pm2 monit
  htop
  ```

- [ ] **Check database performance**
  ```bash
  sudo -u postgres psql -d cryb -c "
    SELECT pid, now() - pg_stat_activity.query_start AS duration, query
    FROM pg_stat_activity
    WHERE (now() - pg_stat_activity.query_start) > interval '5 seconds';
  "
  ```

- [ ] **Monitor Redis memory**
  ```bash
  redis-cli info memory
  ```

### Performance Metrics
- [ ] **Track API response times**
  - 95th percentile < 200ms
  - 99th percentile < 500ms

- [ ] **Monitor error rate**
  - Target: < 0.1% error rate

- [ ] **Track concurrent users**
  - Monitor Socket.io connections
  - Track active sessions

- [ ] **Database connection pool**
  ```bash
  sudo -u postgres psql -d cryb -c "
    SELECT count(*) FROM pg_stat_activity;
  "
  ```

### User Feedback
- [ ] **Set up user feedback channel**
  - In-app feedback form
  - Support email
  - Discord/Slack community

- [ ] **Monitor social media mentions**

- [ ] **Track signup/retention metrics**

---

## Week 1 Post-Launch

### Optimization
- [ ] **Review Lighthouse audit results**
  ```bash
  npm run audit:performance
  ```

- [ ] **Identify slow database queries**
  ```bash
  sudo -u postgres psql -d cryb -c "
    SELECT query, mean_exec_time, calls
    FROM pg_stat_statements
    ORDER BY mean_exec_time DESC
    LIMIT 10;
  "
  ```

- [ ] **Optimize bundle size if needed**
  ```bash
  npm install --save-dev rollup-plugin-visualizer
  npm run build
  # Review bundle composition
  ```

- [ ] **Review error reports**
  - Check Sentry for most common errors
  - Prioritize fixes

### Documentation Updates
- [ ] **Document any issues encountered**

- [ ] **Update troubleshooting guide**

- [ ] **Create API changelog**

- [ ] **Update deployment guide with lessons learned**

### Backup Verification
- [ ] **Verify automated backups running**
  ```bash
  ls -lh /var/backups/cryb/database/
  ```

- [ ] **Test backup restoration**
  ```bash
  # Restore to test database
  psql -U cryb -d cryb_test < backup.sql
  ```

- [ ] **Document backup/restore procedures**

### Security Review
- [ ] **Review security logs**
  ```bash
  sudo grep "Failed password" /var/log/auth.log
  ```

- [ ] **Check firewall rules**
  ```bash
  sudo ufw status
  ```

- [ ] **Review SSL certificate expiry**
  ```bash
  sudo certbot certificates
  ```

- [ ] **Run security scan**
  ```bash
  npm run audit:security
  ```

---

## Rollback Plan

### If Critical Issues Arise

1. **Immediate Actions:**
   ```bash
   # Stop all PM2 processes
   pm2 stop all

   # Restore previous version
   cd /home/ubuntu/cryb-platform
   git checkout <previous-stable-tag>
   pnpm install
   pnpm build

   # Restart processes
   pm2 restart all
   ```

2. **Database Rollback (if needed):**
   ```bash
   # Restore from backup
   sudo -u postgres psql -d cryb < /var/backups/cryb/database/latest.sql
   ```

3. **Nginx Rollback:**
   ```bash
   # Restore previous config
   sudo cp /etc/nginx/sites-available/cryb-platform.backup /etc/nginx/sites-available/cryb-platform
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. **Communication:**
   - Update status page
   - Notify users via email/social media
   - Post in community channels

---

## Success Criteria

### Technical Metrics
- ✅ Uptime > 99.9%
- ✅ API response time p95 < 200ms
- ✅ Error rate < 0.1%
- ✅ Lighthouse performance score > 90
- ✅ Zero critical security vulnerabilities
- ✅ Database queries < 1000ms
- ✅ Successful automated backups daily

### User Metrics
- ✅ User registration flow < 2 minutes
- ✅ Login success rate > 99%
- ✅ Voice channel connection success > 95%
- ✅ Page load time < 3 seconds
- ✅ Positive user feedback
- ✅ Low support ticket volume

### Business Metrics
- ✅ Target user acquisition
- ✅ User retention rate
- ✅ Feature adoption rate
- ✅ Revenue targets (if applicable)

---

## Quick Reference Commands

### Health Checks
```bash
# API
curl https://api.cryb.ai/health

# Frontend
curl -I https://platform.cryb.ai/

# Database
psql -U cryb -d cryb -c "SELECT 1;"

# Redis
redis-cli ping

# PM2 Status
pm2 status
pm2 monit
pm2 logs
```

### Monitoring
```bash
# System resources
htop
df -h
free -h

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Application logs
pm2 logs
pm2 logs cryb-api --lines 100

# Database activity
sudo -u postgres psql -d cryb -c "SELECT * FROM pg_stat_activity;"
```

### Maintenance
```bash
# Restart services
pm2 restart all
sudo systemctl restart nginx
sudo systemctl restart postgresql
sudo systemctl restart redis

# Update application
cd /home/ubuntu/cryb-platform
git pull origin main
pnpm install
pnpm build
pm2 reload all

# Clear Redis cache
redis-cli FLUSHDB

# Database vacuum
sudo -u postgres psql -d cryb -c "VACUUM ANALYZE;"
```

---

## Support Contacts

**Technical Issues:**
- DevOps Lead: [contact info]
- Backend Lead: [contact info]
- Frontend Lead: [contact info]

**Infrastructure:**
- Cloud Provider: AWS Support
- Database: PostgreSQL Community
- CDN Provider: [provider support]

**Third-Party Services:**
- LiveKit Support: support@livekit.io
- Sentry Support: support@sentry.io
- WalletConnect: support@walletconnect.com

---

## Documentation References

**Core Documentation:**
- Main README: `/README.md`
- Deployment Guide: `/docs/DEPLOYMENT_GUIDE.md`
- Architecture: `/COMPLETE-PLATFORM-ARCHITECTURE.md`
- API Docs: `/docs/API_DOCUMENTATION.md`

**Operational:**
- Monitoring Setup: `/MONITORING_SETUP_GUIDE.md`
- Admin Guide: `/docs/ADMIN_GUIDE.md`
- User Guide: `/docs/USER_GUIDE.md`

**Specialized:**
- Web3 Integration: `/WEB3-CRYPTO-CAPABILITIES.md`
- Smart Contracts: `/contracts/DEPLOYMENT.md`
- Accessibility: `/ACCESSIBILITY_COMPLETE_REPORT.md`

---

**Last Updated:** 2025-11-04
**Next Review:** Post-Launch + 1 Week
**Checklist Version:** 1.0

---

## Notes

- This checklist assumes AWS deployment. Adjust for other cloud providers.
- All commands assume Ubuntu 22.04 LTS operating system.
- Timing estimates are approximate and may vary.
- Always test on staging environment before production.
- Keep this checklist updated with lessons learned.

✅ **Ready to Launch!**
