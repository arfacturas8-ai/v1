# 🚀 CRYB Platform - Production Deployment Guide

Complete production infrastructure setup for immediate deployment with single-command launch.

## 📋 Quick Start

Deploy the entire CRYB platform to production in just one command:

```bash
# 1. Validate your system is ready
./scripts/validate-production.sh

# 2. Deploy to production
./deploy-production.sh

# 3. Verify deployment health
./scripts/health-check-all.sh
```

## 🏗️ Architecture Overview

The production deployment includes:

- **Frontend**: Next.js React application (Port 3000)
- **Backend**: Fastify API server (Port 3001)  
- **Database**: PostgreSQL with TimescaleDB (Port 5432)
- **Cache**: Redis (Port 6379)
- **Search**: Elasticsearch (Port 9200)
- **Storage**: MinIO object storage (Port 9000/9001)
- **Voice/Video**: LiveKit server (Port 7880)
- **Proxy**: Nginx reverse proxy (Port 80/443)
- **Monitoring**: Prometheus + Grafana (Optional)

## 📂 Production Files Structure

```
/home/ubuntu/cryb-platform/
├── docker-compose.production-complete.yml  # Complete production stack
├── .env.production                        # Production environment config
├── deploy-production.sh                   # Single-command deployment
├── config/
│   └── nginx/
│       └── production.conf                # Production Nginx config
├── scripts/
│   ├── validate-production.sh             # Pre-deployment validation
│   └── health-check-all.sh               # Comprehensive health checks
└── PRODUCTION-DEPLOYMENT.md              # This guide
```

## 🔧 Prerequisites

### System Requirements

- **OS**: Linux (Ubuntu 20.04+ recommended)
- **Memory**: 4GB minimum, 8GB+ recommended  
- **Storage**: 20GB+ free space
- **CPU**: 2+ cores, 4+ recommended
- **Network**: Open ports 80, 443, 3000, 3001

### Software Requirements

- Docker 24.0+
- Docker Compose 2.0+
- curl, bc, netstat (usually pre-installed)

### Install Docker (if needed)

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group  
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker compose version
```

## ⚙️ Configuration

### 1. Environment Setup

Copy and configure the production environment:

```bash
# Copy the production environment template
cp .env.production .env.production.local

# Edit configuration (REQUIRED)
nano .env.production.local
```

**🔒 CRITICAL: Change these default values:**

```bash
# Security - CHANGE THESE!
JWT_SECRET=your-super-secure-jwt-secret-key-change-this-in-production-2024
NEXTAUTH_SECRET=your-super-secure-nextauth-secret-change-this-in-production-2024
POSTGRES_PASSWORD=cryb_secure_database_password_2024_change_this
REDIS_PASSWORD=cryb_secure_redis_password_2024_change_this
MINIO_SECRET_KEY=cryb_secure_minio_password_2024_change_this

# Domain configuration (for production)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXTAUTH_URL=https://yourdomain.com
```

### 2. SSL Certificates (Production)

For HTTPS deployment, place your SSL certificates in:

```bash
mkdir -p config/nginx/ssl/
# Copy your certificates:
# config/nginx/ssl/fullchain.pem
# config/nginx/ssl/privkey.pem  
# config/nginx/ssl/chain.pem
```

## 🚀 Deployment Process

### Method 1: Automated Deployment (Recommended)

```bash
# Validate system readiness
./scripts/validate-production.sh

# Deploy with monitoring stack
./deploy-production.sh --monitoring --cleanup

# Check deployment status
./scripts/health-check-all.sh --verbose
```

### Method 2: Manual Step-by-Step

```bash
# 1. Validate configuration
docker compose -f docker-compose.production-complete.yml config

# 2. Pull latest images  
docker compose -f docker-compose.production-complete.yml pull

# 3. Build and start services
docker compose -f docker-compose.production-complete.yml up -d

# 4. Monitor startup
docker compose -f docker-compose.production-complete.yml logs -f

# 5. Verify health
./scripts/health-check-all.sh
```

## 🔍 Validation & Health Checks

### Pre-Deployment Validation

```bash
# Full system validation
./scripts/validate-production.sh

# Quick validation with report
./scripts/validate-production.sh --report

# Skip time-consuming checks
./scripts/validate-production.sh --skip-dry-run
```

### Post-Deployment Health Checks

```bash
# Comprehensive health check
./scripts/health-check-all.sh

# Detailed output
./scripts/health-check-all.sh --verbose

# Skip monitoring checks
./scripts/health-check-all.sh --skip-monitoring
```

## 📊 Service Access URLs

After deployment, access your services at:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Main web application |
| **API** | http://localhost:3001 | Backend API |  
| **API Health** | http://localhost:3001/health | API health endpoint |
| **API Docs** | http://localhost:3001/documentation | Swagger documentation |
| **MinIO Console** | http://localhost:9001 | Object storage admin |
| **Grafana** | http://localhost:3002 | Monitoring dashboard |
| **Prometheus** | http://localhost:9090 | Metrics collection |

## 🛠️ Management Commands

### Service Management

```bash
# View logs
docker compose -f docker-compose.production-complete.yml logs -f

# Restart specific service
docker compose -f docker-compose.production-complete.yml restart api

# Stop all services  
docker compose -f docker-compose.production-complete.yml down

# Update services
docker compose -f docker-compose.production-complete.yml pull
docker compose -f docker-compose.production-complete.yml up -d
```

### Container Access

```bash
# API container shell
docker compose -f docker-compose.production-complete.yml exec api sh

# Web container shell  
docker compose -f docker-compose.production-complete.yml exec web sh

# Database access
docker compose -f docker-compose.production-complete.yml exec postgres psql -U cryb_user -d cryb

# Redis CLI
docker compose -f docker-compose.production-complete.yml exec redis redis-cli
```

### Resource Monitoring

```bash
# Container resource usage
docker stats

# Disk usage by service
docker system df
docker volume ls

# Network inspection
docker network ls
docker compose -f docker-compose.production-complete.yml ps
```

## 📈 Scaling & Performance

### Horizontal Scaling

The Nginx configuration supports multiple backend instances:

```bash
# Scale API instances
docker compose -f docker-compose.production-complete.yml up -d --scale api=3

# Scale web instances  
docker compose -f docker-compose.production-complete.yml up -d --scale web=2
```

### Resource Optimization

Edit resource limits in the compose file:

```yaml
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 2G
    reservations:
      cpus: '1.0'  
      memory: 1G
```

## 🔐 Security Considerations

### Essential Security Steps

1. **Change all default passwords** in `.env.production`
2. **Enable firewall**:
   ```bash
   sudo ufw enable
   sudo ufw allow 80
   sudo ufw allow 443  
   sudo ufw allow 22
   ```
3. **Configure SSL certificates** for HTTPS
4. **Regular security updates**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   docker image prune -f
   ```

### Security Monitoring

- Monitor logs: `docker compose logs -f nginx api`
- Check failed logins: `docker compose exec api grep "failed" logs/*.log`
- Review access patterns: `docker compose exec nginx tail -f /var/log/nginx/access.log`

## 🔧 Troubleshooting

### Common Issues

**Services won't start:**
```bash
# Check system resources
free -h && df -h

# Verify configuration
./scripts/validate-production.sh

# Check logs
docker compose -f docker-compose.production-complete.yml logs
```

**Database connection issues:**
```bash
# Test database health
docker compose -f docker-compose.production-complete.yml exec postgres pg_isready

# Check database logs
docker compose -f docker-compose.production-complete.yml logs postgres
```

**API not responding:**
```bash
# Check API health directly  
curl http://localhost:3001/health

# Check API logs
docker compose -f docker-compose.production-complete.yml logs api
```

**Frontend build issues:**
```bash
# Rebuild web service
docker compose -f docker-compose.production-complete.yml build --no-cache web
docker compose -f docker-compose.production-complete.yml up -d web
```

### Recovery Commands

```bash
# Complete reset (DANGER: removes data)
docker compose -f docker-compose.production-complete.yml down -v
docker system prune -af

# Backup before reset
docker compose -f docker-compose.production-complete.yml exec postgres pg_dump -U cryb_user cryb > backup.sql
```

## 📊 Monitoring & Alerts

### Built-in Monitoring

Access Grafana dashboard at `http://localhost:3002`:
- Username: `admin`  
- Password: Check `GRAFANA_ADMIN_PASSWORD` in your `.env.production`

### Key Metrics to Monitor

- **System Resources**: CPU, Memory, Disk usage
- **Application Health**: API response times, error rates
- **Database Performance**: Connection count, query performance
- **Network**: Request rates, bandwidth usage

### Log Management

```bash
# Centralized logging
docker compose -f docker-compose.production-complete.yml logs -f

# Service-specific logs
docker compose logs api web postgres redis

# Log rotation (configure in production)
docker run --log-driver json-file --log-opt max-size=10m --log-opt max-file=3
```

## 🔄 Backup & Recovery

### Automated Backups

The deployment includes automated backup services:

```bash
# Manual database backup
docker compose -f docker-compose.production-complete.yml exec postgres pg_dump -U cryb_user cryb > backup-$(date +%Y%m%d).sql

# Restore database
docker compose -f docker-compose.production-complete.yml exec -T postgres psql -U cryb_user -d cryb < backup-$(date +%Y%m%d).sql
```

### Data Persistence

All data is stored in Docker volumes:
- `postgres_data`: Database files
- `redis_data`: Cache data  
- `minio_data`: Object storage
- `elasticsearch_data`: Search indices

## 🚀 Production Deployment Checklist

- [ ] System meets minimum requirements
- [ ] Docker and Docker Compose installed  
- [ ] All default passwords changed
- [ ] SSL certificates configured (if using HTTPS)
- [ ] Firewall configured
- [ ] Environment file created and secured
- [ ] Validation script passes: `./scripts/validate-production.sh`
- [ ] Deployment successful: `./deploy-production.sh`  
- [ ] Health checks pass: `./scripts/health-check-all.sh`
- [ ] All services accessible
- [ ] Monitoring configured
- [ ] Backup strategy implemented

## 📞 Support & Maintenance

### Regular Maintenance

```bash
# Weekly health check
./scripts/health-check-all.sh --verbose > health-$(date +%Y%m%d).log

# Monthly updates
docker compose -f docker-compose.production-complete.yml pull
docker compose -f docker-compose.production-complete.yml up -d
docker image prune -f

# Quarterly validation
./scripts/validate-production.sh --report
```

### Getting Help

1. **Check logs first**: `docker compose logs [service-name]`
2. **Run health checks**: `./scripts/health-check-all.sh`
3. **Validate configuration**: `./scripts/validate-production.sh`
4. **System resources**: `docker stats` and `free -h`

---

## 🎉 Success!

Your CRYB platform is now running in production! 

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001  
- **Admin**: http://localhost:9001 (MinIO)
- **Monitoring**: http://localhost:3002 (Grafana)

**Next Steps:**
1. Set up domain names and SSL certificates
2. Configure monitoring and alerting
3. Implement backup strategy
4. Set up CI/CD pipeline
5. Configure logging aggregation

For production domains, update your DNS to point to your server and configure SSL certificates in the Nginx configuration.

Happy deploying! 🚀