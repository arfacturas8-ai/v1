# Cryb Platform Production Deployment Guide

This guide covers the optimized production deployment setup for the Cryb Platform, including stability improvements, monitoring, auto-recovery, and zero-downtime deployments.

##  Quick Start

### 1. Run the Production Setup
```bash
./scripts/setup-production-infrastructure.sh
```

### 2. Deploy the Platform
```bash
./scripts/optimized-deploy.sh
```

### 3. Check Status
```bash
./scripts/platform-status.sh
```

## 📋 Production Optimizations Applied

###  PM2 Process Management
- **Auto-scaling**: Uses `instances: 'max'` for optimal CPU utilization
- **Enhanced memory management**: 2GB memory limit with intelligent restart policies
- **Improved error handling**: 15 max restarts with 30s minimum uptime
- **Advanced logging**: Structured logs with timestamps and rotation
- **Health monitoring**: Built-in process monitoring and recovery

**Configuration**: `ecosystem.production.config.js`

###  Nginx Optimization
- **Intelligent caching**: API responses cached for 5 minutes, static assets for 7 days
- **Load balancing**: Upstream configuration with health checks
- **Rate limiting**: API (10 req/s), Web (30 req/s) with burst handling
- **Compression**: Optimized gzip with multiple content types
- **SSL optimization**: Session caching and modern security headers
- **Performance tuning**: Optimized buffer sizes and timeouts

**Configuration**: `config/nginx/production-optimized.conf`

### 🏥 Health Check System
- **Comprehensive monitoring**: PM2 processes, services, system resources
- **Intelligent alerting**: Critical and warning issue detection
- **Automated reporting**: JSON reports with historical data
- **SSL certificate monitoring**: Expiration warnings and validation
- **Performance metrics**: CPU, memory, disk usage tracking

**Script**: `scripts/comprehensive-health-check.sh`

###  Enhanced Logging
- **Structured logging**: JSON format with correlation IDs
- **Log rotation**: Automatic cleanup with configurable retention
- **Centralized collection**: All application and system logs
- **Real-time monitoring**: Log analysis and alerting
- **Performance tracking**: Request/response metrics

**Setup**: `scripts/setup-enhanced-logging.sh`

### 🔄 Auto-Recovery System
- **Intelligent restart policies**: Exponential backoff with maximum attempts
- **Service dependency management**: Coordinated recovery sequences
- **Failure detection**: Multi-layered health monitoring
- **Zero-downtime recovery**: Graceful process replacement
- **Circuit breaker patterns**: Prevent cascade failures

**Service**: `scripts/auto-recovery-system.sh` (systemd service: `cryb-recovery`)

###  Zero-Downtime Deployment
- **Rolling updates**: Gradual process replacement
- **Health validation**: Pre and post-deployment checks
- **Automatic rollback**: Failed deployment recovery
- **Build optimization**: Parallel building and testing
- **Backup management**: Automatic backup creation and cleanup

**Script**: `scripts/optimized-deploy.sh`

## 🛠 Available Scripts

### Core Operations
```bash
# Deploy with tests
./scripts/optimized-deploy.sh

# Deploy without tests (faster)
./scripts/optimized-deploy.sh --skip-tests

# Force deployment (ignore health checks)
./scripts/optimized-deploy.sh --force

# Rollback to previous version
./scripts/optimized-deploy.sh --rollback

# Check deployment status
./scripts/optimized-deploy.sh --status
```

### Monitoring & Health
```bash
# Comprehensive health check
./scripts/comprehensive-health-check.sh

# Platform status overview
./scripts/platform-status.sh

# Log analysis report
./scripts/log-analysis.sh

# Auto-recovery status
systemctl status cryb-recovery
```

### Maintenance
```bash
# Quick restart all services
./scripts/quick-restart.sh

# Setup enhanced logging
./scripts/setup-enhanced-logging.sh

# Monitor auto-recovery
./scripts/auto-recovery-system.sh --status
```

## 📁 File Structure

```
/home/ubuntu/cryb-platform/
├── ecosystem.production.config.js    # Optimized PM2 configuration
├── scripts/
│   ├── setup-production-infrastructure.sh
│   ├── optimized-deploy.sh
│   ├── comprehensive-health-check.sh
│   ├── auto-recovery-system.sh
│   ├── setup-enhanced-logging.sh
│   ├── platform-status.sh
│   └── quick-restart.sh
├── config/
│   └── nginx/
│       └── production-optimized.conf
├── systemd/
│   └── cryb-recovery.service
├── logs/
│   ├── health-checks/
│   ├── monitoring/
│   ├── application/
│   └── archive/
└── data/
    └── monitoring/
```

##  Monitoring Dashboard

### Health Check Metrics
- **System Health**: Overall platform status (healthy/degraded/critical)
- **Process Status**: PM2 process health and restart counts
- **Resource Usage**: CPU, memory, disk utilization
- **Service Availability**: API, web, database, cache services
- **SSL Certificates**: Expiration monitoring and validation

### Performance Metrics
- **Response Times**: API endpoint performance
- **Error Rates**: Application and system error tracking
- **Cache Hit Rates**: Nginx caching effectiveness
- **Database Performance**: Connection pool and query metrics
- **Memory Usage**: Application memory consumption patterns

### Alerts and Notifications
- **Critical Alerts**: Service failures, high resource usage
- **Warning Alerts**: Performance degradation, upcoming issues
- **Recovery Actions**: Automated recovery attempts and results
- **Deployment Status**: Build and deployment notifications

## 🚨 Troubleshooting

### Common Issues

#### PM2 Process Crashes
```bash
# Check process status
pm2 status

# View recent logs
pm2 logs --lines 50

# Manual restart
pm2 restart cryb-api

# Full reload with new configuration
pm2 reload ecosystem.production.config.js --env production
```

#### High Memory Usage
```bash
# Check memory usage
./scripts/platform-status.sh

# Restart processes to clear memory
./scripts/quick-restart.sh

# Check for memory leaks in logs
grep -i "memory\|heap" logs/*.log
```

#### Database Connection Issues
```bash
# Check database connectivity
pg_isready -h localhost -p 5433 -U cryb_user

# Check connection pool status
pm2 logs cryb-api | grep -i "database\|connection"

# Restart database if needed
sudo systemctl restart postgresql
```

#### SSL Certificate Issues
```bash
# Check certificate status
./scripts/comprehensive-health-check.sh | grep -i ssl

# Manual certificate renewal
sudo certbot renew --nginx

# Test nginx configuration
sudo nginx -t && sudo systemctl reload nginx
```

### Performance Optimization

#### High CPU Usage
1. Check PM2 instance scaling: `pm2 status`
2. Review application logs for inefficient operations
3. Monitor database query performance
4. Consider horizontal scaling

#### Slow Response Times
1. Check nginx cache hit rates: `tail -f /var/log/nginx/api-cryb-ai-access.log`
2. Monitor database connection pool utilization
3. Review API endpoint performance metrics
4. Optimize database queries and indexes

#### Memory Leaks
1. Monitor memory usage trends: `./scripts/platform-status.sh`
2. Review application logs for memory-related errors
3. Restart processes with memory issues: `pm2 restart <process>`
4. Investigate code for potential memory leaks

##  Scaling Guidelines

### Vertical Scaling
- **CPU**: Increase instance count in PM2 configuration
- **Memory**: Adjust `max_memory_restart` limits
- **Storage**: Monitor disk usage and add capacity as needed

### Horizontal Scaling
- **Load Balancer**: Add nginx upstream servers
- **Database**: Implement read replicas for query distribution
- **Cache**: Distribute Redis across multiple instances
- **CDN**: Leverage CloudFront for static asset distribution

##  Security Best Practices

### Applied Security Measures
- **Process isolation**: Non-root execution with limited privileges
- **Log security**: Secure log file permissions and rotation
- **Network security**: Rate limiting and connection restrictions
- **SSL/TLS**: Modern encryption and security headers
- **Resource limits**: System-level resource constraints

### Additional Security Recommendations
- **Regular updates**: Keep system packages and dependencies updated
- **Access control**: Implement proper user access management
- **Monitoring**: Set up intrusion detection and log analysis
- **Backup security**: Encrypt backups and secure access
- **Network segmentation**: Use firewalls and VPC security groups

##  Performance Targets

### Response Time Goals
- **API Endpoints**: < 200ms average response time
- **Web Pages**: < 1s initial page load
- **Health Checks**: < 5s timeout threshold

### Availability Goals
- **Uptime**: 99.9% availability target
- **Recovery Time**: < 30s for automatic recovery
- **Deployment**: Zero-downtime deployments

### Resource Utilization
- **CPU**: < 70% average utilization
- **Memory**: < 80% usage with 2GB limits
- **Disk**: < 80% usage with automatic cleanup

---

## 🆘 Support

For issues or questions regarding the production deployment:

1. **Check Health Status**: `./scripts/comprehensive-health-check.sh`
2. **Review Logs**: `./scripts/log-analysis.sh`
3. **Check Auto-Recovery**: `systemctl status cryb-recovery`
4. **View Recent Deployments**: `./scripts/optimized-deploy.sh --status`

The platform now includes comprehensive monitoring, auto-recovery, and deployment automation to ensure maximum stability and performance in production environments.