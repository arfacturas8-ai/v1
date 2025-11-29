# CRYB Platform Quick Reference

**Quick access guide for common tasks and commands**

---

## Health & Diagnostics

```bash
# Full health check
./health-check.sh

# JSON output
./health-check.sh --json

# View health report
cat health-check-report.json | jq
```

## Service Management

```bash
# Check all services
pm2 list

# Restart specific service
pm2 restart cryb-api
pm2 restart cryb-frontend
pm2 restart cryb-workers

# Restart all services
pm2 restart all

# View logs
pm2 logs cryb-api --lines 50
pm2 logs --lines 100
```

## Pre-Restart Checks

```bash
# Verify before restart (recommended)
./verify-services.sh

# Auto-fix issues
./verify-services.sh --fix

# Strict mode (fail on warnings)
./verify-services.sh --strict
```

## Startup Validation

```bash
# Quick startup check
./startup-checks.sh

# Wait for services to be ready
./startup-checks.sh --wait --timeout=180
```

## Frontend Management

```bash
# Rebuild frontend
./rebuild-frontend.sh

# Force rebuild
./rebuild-frontend.sh --force

# Rebuild without backup
./rebuild-frontend.sh --skip-backup
```

## Common Issues

### Frontend shows blank page
```bash
./rebuild-frontend.sh
pm2 restart cryb-frontend
```

### Service won't start
```bash
./verify-services.sh --fix
pm2 restart <service-name>
pm2 logs <service-name> --lines 50
```

### Database connection failed
```bash
docker ps | grep postgres
docker start cryb-postgres-dev
pg_isready -h localhost -p 5432
```

### Redis connection failed
```bash
docker ps | grep redis
docker start cryb-redis-dev
redis-cli -h localhost -p 6380 ping
```

## Port Reference

- **3002** - API (HTTP + WebSocket)
- **3008** - Frontend
- **5432** - PostgreSQL (internal)
- **6380** - Redis
- **9000** - MinIO S3
- **9200** - Elasticsearch

## File Locations

- **Scripts:** `/home/ubuntu/cryb-platform/*.sh`
- **PM2 Logs:** `/home/ubuntu/.pm2/logs/`
- **Health Reports:** `/home/ubuntu/cryb-platform/health-check-report.json`
- **Build Backups:** `/home/ubuntu/cryb-platform/backups/frontend-builds/`
- **Docs:** `/home/ubuntu/cryb-platform/TROUBLESHOOTING.md`

## Emergency Procedures

### Complete restart
```bash
pm2 stop all
./startup-checks.sh --wait
pm2 start ecosystem.config.js
./health-check.sh
```

### Restore frontend from backup
```bash
cd /home/ubuntu/cryb-platform/apps/react-app
ls -lah ../../backups/frontend-builds/
tar -xzf ../../backups/frontend-builds/dist_backup_YYYYMMDD_HHMMSS.tar.gz
pm2 restart cryb-frontend
```

## Monitoring URLs

- **Prometheus:** http://localhost:9090
- **Grafana:** http://localhost:3005
- **Uptime Kuma:** http://localhost:3004
- **Jaeger:** http://localhost:16686

## Documentation

- Full troubleshooting: `TROUBLESHOOTING.md`
- Platform architecture: `COMPLETE-PLATFORM-ARCHITECTURE.md`
- Deployment guide: `PRODUCTION_DEPLOYMENT_GUIDE.md`
