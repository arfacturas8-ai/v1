# CRYB Platform PM2 Configuration Guide

## Overview

This guide provides comprehensive PM2 configuration for the CRYB platform to ensure 24/7 operation with automatic restarts, monitoring, and persistence through reboots.

## Features

- **24/7 Operation**: Services automatically restart on failure
- **Cluster Mode**: API service runs in cluster mode using all CPU cores
- **Environment Management**: Support for development, staging, and production environments
- **Health Monitoring**: Automated health checks with alerting
- **Log Management**: Automatic log rotation and cleanup
- **System Integration**: Systemd service for boot persistence
- **Resource Monitoring**: CPU, memory, and disk usage monitoring
- **Auto-Recovery**: Automatic service recovery on failures

## Quick Start

### 1. One-Command Setup

```bash
# Complete setup with all features
./scripts/install-pm2-setup.sh

# Setup without systemd (if you don't have sudo access)
./scripts/install-pm2-setup.sh --skip-systemd

# Setup without PM2 startup configuration
./scripts/install-pm2-setup.sh --skip-startup
```

### 2. Manual Setup

```bash
# Install PM2 if not already installed
npm install -g pm2

# Start services
./scripts/pm2-startup.sh setup

# Or start services only
./scripts/pm2-startup.sh start
```

## Configuration Files

### Ecosystem Configuration (`ecosystem.config.js`)

Main PM2 configuration file that defines:
- **cryb-api**: Backend API server (cluster mode, all CPU cores)
- **cryb-web**: Frontend Next.js application (2 instances)
- **cryb-workers**: Background job workers (2 instances)
- **cryb-health-monitor**: Health monitoring service

### Environment Variables

The configuration loads environment variables from:
- `.env.production` for production
- `.env.staging` for staging  
- `.env.development` for development

### Systemd Service (`systemd/cryb-platform.service`)

Ensures PM2 and all services start automatically on boot and restart on failure.

## Service Management

### Using Convenient Aliases

After installation, these aliases are available:

```bash
cryb-start      # Start all services
cryb-stop       # Stop all services
cryb-restart    # Restart all services
cryb-status     # Show service status
cryb-logs       # Show service logs
cryb-monitor    # Run health check
cryb-health     # Generate health report
cryb-service    # Manage individual services
```

### Using Management Scripts

#### Main Service Control (`pm2-startup.sh`)

```bash
# Start all services
./scripts/pm2-startup.sh start

# Stop all services
./scripts/pm2-startup.sh stop

# Restart all services
./scripts/pm2-startup.sh restart

# Show service status
./scripts/pm2-startup.sh status

# Show logs
./scripts/pm2-startup.sh logs

# Complete setup
./scripts/pm2-startup.sh setup

# Run health check
./scripts/pm2-startup.sh health

# Update services (git pull + restart)
./scripts/pm2-startup.sh update
```

#### Individual Service Management (`pm2-service-manager.sh`)

```bash
# Start specific service
./scripts/pm2-service-manager.sh start cryb-api production

# Restart specific service
./scripts/pm2-service-manager.sh restart cryb-web

# Stop specific service
./scripts/pm2-service-manager.sh stop cryb-workers

# Scale service instances
./scripts/pm2-service-manager.sh scale cryb-api 4

# Show service status
./scripts/pm2-service-manager.sh status cryb-api

# Show service logs
./scripts/pm2-service-manager.sh logs cryb-web 100

# Monitor service metrics
./scripts/pm2-service-manager.sh monitor

# Change service environment
./scripts/pm2-service-manager.sh env cryb-api staging

# Reset service (delete and start fresh)
./scripts/pm2-service-manager.sh reset cryb-workers

# Backup PM2 configuration
./scripts/pm2-service-manager.sh backup

# Check service health
./scripts/pm2-service-manager.sh health
```

## Monitoring and Alerting

### Health Monitoring (`pm2-monitor.sh`)

```bash
# Run single monitoring cycle
./scripts/pm2-monitor.sh monitor

# Run continuous monitoring
./scripts/pm2-monitor.sh daemon

# Generate health report
./scripts/pm2-monitor.sh report

# Test notification system
./scripts/pm2-monitor.sh test-alerts

# Tail monitoring logs
./scripts/pm2-monitor.sh tail-logs
```

### Monitoring Features

- **Health Checks**: HTTP endpoint monitoring for API and Web services
- **Resource Monitoring**: CPU, memory, disk usage tracking
- **Service Recovery**: Automatic restart of failed services  
- **Alert System**: Notifications via Slack, Discord, or email
- **Performance Metrics**: Response time and restart count tracking
- **System Monitoring**: Load average, memory, and disk space monitoring

### Setting up Alerts

Configure notification webhooks by setting environment variables:

```bash
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/YOUR/DISCORD/WEBHOOK"
export ALERT_EMAIL="admin@yourdomain.com"
```

## Log Management

### Log Locations

```
logs/
├── api-error.log           # API error logs
├── api-out.log            # API output logs  
├── api-combined.log       # API combined logs
├── web-error.log          # Web error logs
├── web-out.log            # Web output logs
├── web-combined.log       # Web combined logs
├── workers-error.log      # Workers error logs
├── workers-out.log        # Workers output logs
├── workers-combined.log   # Workers combined logs
└── monitoring/            # Monitoring logs
    ├── health-checks.log
    ├── alerts.log
    └── metrics.log
```

### Log Rotation

Automatic log rotation is configured with:
- **Maximum Size**: 100MB per log file
- **Retention**: 30 rotated files
- **Compression**: Gzip compression enabled
- **Schedule**: Daily rotation at midnight

## Environments

### Production Environment

```bash
# Start in production mode (default)
pm2 start ecosystem.config.js --env production
```

### Staging Environment  

```bash
# Start in staging mode
pm2 start ecosystem.config.js --env staging
```

### Development Environment

```bash
# Start in development mode
pm2 start ecosystem.config.js --env development
```

## Service Configuration Details

### API Service (cryb-api)
- **Mode**: Cluster (uses all CPU cores)
- **Memory Limit**: 2GB per instance
- **Auto-restart**: Enabled
- **Health Check**: HTTP endpoint monitoring
- **Cron Restart**: Daily at 2 AM

### Web Service (cryb-web)
- **Instances**: 2 (for load balancing)
- **Mode**: Cluster
- **Memory Limit**: 1.5GB per instance
- **Auto-restart**: Enabled
- **Health Check**: HTTP endpoint monitoring
- **Cron Restart**: Daily at 3 AM

### Workers Service (cryb-workers)
- **Instances**: 2
- **Mode**: Fork (for background jobs)
- **Memory Limit**: 1GB per instance
- **Auto-restart**: Enabled
- **Cron Restart**: Daily at 4 AM

### Health Monitor Service (cryb-health-monitor)
- **Instances**: 1
- **Mode**: Fork
- **Restart**: Every 30 minutes
- **Purpose**: System health monitoring and alerting

## Troubleshooting

### Common Issues

#### Services not starting
```bash
# Check PM2 status
pm2 status

# Check logs for errors
pm2 logs

# Restart specific service
./scripts/pm2-service-manager.sh restart <service-name>
```

#### High memory usage
```bash
# Check memory usage
pm2 monit

# Restart service with memory issues
pm2 restart <service-name>

# Scale down if needed
./scripts/pm2-service-manager.sh scale <service-name> 1
```

#### Health check failures
```bash
# Run manual health check
./scripts/pm2-monitor.sh monitor

# Check service logs
./scripts/pm2-service-manager.sh logs <service-name>

# Restart failing service
./scripts/pm2-service-manager.sh restart <service-name>
```

### Log Analysis

```bash
# View recent errors across all services
grep -i error logs/*.log | tail -20

# Monitor live logs
pm2 logs --lines 50

# Check specific service logs
./scripts/pm2-service-manager.sh logs cryb-api 100
```

### Performance Tuning

#### CPU Optimization
```bash
# Check current instances
pm2 status

# Scale API service to specific number
./scripts/pm2-service-manager.sh scale cryb-api 4

# Scale to max CPU cores
./scripts/pm2-service-manager.sh scale cryb-api max
```

#### Memory Optimization
```bash
# Monitor memory usage
pm2 monit

# Adjust memory limits in ecosystem.config.js
# Restart services after changes
pm2 reload ecosystem.config.js --env production
```

## Security Considerations

1. **Environment Variables**: Ensure sensitive data is properly configured in `.env.production`
2. **Log Security**: Logs may contain sensitive information - secure log directory permissions
3. **Process Isolation**: Services run as specified user with limited privileges
4. **Auto-restart Limits**: Prevents infinite restart loops on persistent failures
5. **Resource Limits**: Memory and CPU limits prevent resource exhaustion

## Maintenance

### Regular Tasks

```bash
# Weekly: Update and restart services
./scripts/pm2-startup.sh update

# Monthly: Clean old logs manually
find logs/ -name "*.log" -mtime +30 -delete

# As needed: Backup PM2 configuration
./scripts/pm2-service-manager.sh backup
```

### Monitoring Checklist

- [ ] Check service status weekly
- [ ] Review error logs regularly  
- [ ] Monitor system resources
- [ ] Test health check endpoints
- [ ] Verify backup systems
- [ ] Update environment variables as needed

## Integration with External Systems

### CI/CD Integration

```bash
# In your deployment script
./scripts/pm2-startup.sh update

# Or for zero-downtime deploys
pm2 reload ecosystem.config.js --env production
```

### Monitoring Integration

The health monitoring system can integrate with:
- **Slack**: Team notifications
- **Discord**: Community alerts
- **Email**: Administrative alerts
- **External Monitoring**: Uptime monitors, APM tools

### Backup Integration

```bash
# Include in your backup script
./scripts/pm2-service-manager.sh backup
cp -r logs/ /backup/location/
```

## Support and Documentation

### PM2 Commands Reference

- `pm2 start` - Start services
- `pm2 stop` - Stop services
- `pm2 restart` - Restart services
- `pm2 reload` - Zero-downtime restart
- `pm2 delete` - Delete services
- `pm2 status` - Show status
- `pm2 logs` - Show logs
- `pm2 monit` - Monitor resources
- `pm2 save` - Save configuration
- `pm2 resurrect` - Restore saved configuration

### Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Node.js Process Management](https://nodejs.org/api/process.html)
- [Systemd Service Management](https://systemd.io/)

For CRYB-specific issues, check the main project documentation and logs in the `logs/` directory.