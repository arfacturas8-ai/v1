# CRYB Platform Deployment Guide

This comprehensive guide covers production deployment of the CRYB Platform, including system requirements, setup procedures, configuration, and best practices for a scalable, secure deployment.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Production Deployment Steps](#production-deployment-steps)
3. [Environment Variables Configuration](#environment-variables-configuration)
4. [Database Setup](#database-setup)
5. [SSL/HTTPS Configuration](#sslhttps-configuration)
6. [PM2 Setup](#pm2-setup)
7. [Docker Deployment](#docker-deployment)
8. [Scaling Considerations](#scaling-considerations)
9. [Backup Strategies](#backup-strategies)
10. [Monitoring Setup](#monitoring-setup)

## System Requirements

### Minimum Production Requirements

**Server Specifications:**
- **CPU**: 4 cores (8 recommended)
- **RAM**: 8GB (16GB recommended)
- **Storage**: 100GB SSD (500GB recommended)
- **Network**: 100Mbps+ bandwidth

**Operating System:**
- Ubuntu 20.04 LTS or 22.04 LTS
- CentOS 8 or Rocky Linux 8
- Amazon Linux 2
- Debian 11+

### Software Dependencies

**Core Requirements:**
- Node.js 20+ (LTS recommended)
- PostgreSQL 14+ with TimescaleDB extension
- Redis 7+
- Nginx 1.20+
- PM2 (process manager)

**Optional Components:**
- Docker & Docker Compose
- Elasticsearch 8+ (for search functionality)
- MinIO (for object storage)
- LiveKit (for voice/video calls)

### Cloud Provider Recommendations

**AWS:**
- EC2 t3.large or c5.xlarge instances
- RDS PostgreSQL with Multi-AZ
- ElastiCache Redis cluster
- CloudFront CDN
- S3 for file storage

**DigitalOcean:**
- Droplets with 4GB+ RAM
- Managed PostgreSQL database
- Managed Redis cluster
- Spaces for object storage

**Google Cloud:**
- Compute Engine e2-standard-4
- Cloud SQL for PostgreSQL
- Memorystore for Redis
- Cloud Storage

## Production Deployment Steps

### 1. Server Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git unzip software-properties-common

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm package manager
npm install -g pnpm@9.15.0

# Install PM2 process manager
npm install -g pm2@latest

# Install Nginx
sudo apt install -y nginx

# Start and enable services
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2. PostgreSQL Setup

```bash
# Install PostgreSQL 14
sudo apt install -y postgresql-14 postgresql-client-14 postgresql-contrib-14

# Install TimescaleDB extension
echo "deb https://packagecloud.io/timescale/timescaledb/ubuntu/ $(lsb_release -c -s) main" | sudo tee /etc/apt/sources.list.d/timescaledb.list
wget --quiet -O - https://packagecloud.io/timescale/timescaledb/gpgkey | sudo apt-key add -
sudo apt update
sudo apt install -y timescaledb-2-postgresql-14

# Configure PostgreSQL
sudo -u postgres psql -c "CREATE USER cryb WITH ENCRYPTED PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "CREATE DATABASE cryb OWNER cryb;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE cryb TO cryb;"

# Enable TimescaleDB extension
sudo -u postgres psql -d cryb -c "CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;"
```

### 3. Redis Setup

```bash
# Install Redis
sudo apt install -y redis-server

# Configure Redis for production
sudo tee /etc/redis/redis.conf << EOF
bind 127.0.0.1
port 6379
timeout 300
keepalive 60
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
EOF

# Restart Redis
sudo systemctl restart redis
sudo systemctl enable redis
```

### 4. Application Deployment

```bash
# Create application user
sudo useradd -m -s /bin/bash cryb
sudo usermod -aG sudo cryb

# Switch to application user
sudo su - cryb

# Clone repository
git clone https://github.com/your-org/cryb-platform.git
cd cryb-platform

# Install dependencies
pnpm install

# Build applications
pnpm build

# Create production environment file
cp .env.example .env.production
```

### 5. Environment Configuration

Edit `/home/cryb/cryb-platform/.env.production`:

```env
# Environment
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://cryb:your_secure_password@localhost:5432/cryb

# Redis
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your_jwt_secret_256_bits_minimum
JWT_REFRESH_SECRET=your_refresh_secret_256_bits_minimum
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# API Configuration
API_BASE_URL=https://api.yourdomain.com
WEB_BASE_URL=https://platform.yourdomain.com
ADMIN_BASE_URL=https://admin.yourdomain.com

# File Upload Configuration
UPLOAD_DIR=/var/uploads/cryb
MAX_FILE_SIZE=104857600
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,webp,mp4,mov,avi,webm,pdf,doc,docx

# MinIO Configuration (if using)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=your_minio_access_key
MINIO_SECRET_KEY=your_minio_secret_key
MINIO_BUCKET=cryb-uploads
MINIO_USE_SSL=false

# LiveKit Configuration (for voice/video)
LIVEKIT_URL=wss://yourdomain-livekit.com
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret

# Email Configuration
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your_smtp_password
EMAIL_FROM=CRYB Platform <noreply@yourdomain.com>

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Security
CORS_ORIGIN=https://platform.yourdomain.com,https://admin.yourdomain.com
HELMET_ENABLED=true
CSRF_ENABLED=true

# Monitoring
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=9090
HEALTH_CHECK_ENABLED=true

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE=/var/log/cryb/app.log
```

### 6. Database Migration

```bash
# Run database migrations
cd /home/cryb/cryb-platform
pnpm db:migrate

# Seed initial data (optional)
pnpm db:seed
```

## Environment Variables Configuration

### Core Application Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Application environment | development | Yes |
| `PORT` | Application port | 3001 | Yes |
| `DATABASE_URL` | PostgreSQL connection string | - | Yes |
| `REDIS_URL` | Redis connection string | - | Yes |
| `JWT_SECRET` | JWT signing secret | - | Yes |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | - | Yes |

### Security Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `CORS_ORIGIN` | Allowed CORS origins | * | Yes |
| `HELMET_ENABLED` | Enable security headers | true | No |
| `CSRF_ENABLED` | Enable CSRF protection | true | No |
| `RATE_LIMIT_WINDOW` | Rate limit window (minutes) | 15 | No |
| `RATE_LIMIT_MAX` | Max requests per window | 100 | No |

### File Upload Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `UPLOAD_DIR` | File upload directory | ./uploads | No |
| `MAX_FILE_SIZE` | Max file size in bytes | 104857600 | No |
| `ALLOWED_FILE_TYPES` | Allowed file extensions | jpg,png,gif | No |

### External Service Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MINIO_ENDPOINT` | MinIO server endpoint | localhost | No |
| `LIVEKIT_URL` | LiveKit server URL | - | No |
| `SMTP_HOST` | Email server host | - | No |
| `ELASTICSEARCH_URL` | Elasticsearch server URL | - | No |

## Database Setup

### PostgreSQL Configuration

#### 1. Performance Tuning

Edit `/etc/postgresql/14/main/postgresql.conf`:

```conf
# Memory Configuration
shared_buffers = 2GB                    # 25% of total RAM
effective_cache_size = 6GB              # 75% of total RAM
work_mem = 64MB                         # For complex queries
maintenance_work_mem = 512MB            # For maintenance operations

# Checkpoint Configuration
checkpoint_completion_target = 0.9
wal_buffers = 16MB
checkpoint_timeout = 10min
max_wal_size = 2GB

# Connection Settings
max_connections = 200
listen_addresses = 'localhost'

# Logging
log_min_duration_statement = 1000       # Log slow queries
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_statement = 'none'
log_duration = off

# TimescaleDB Settings
shared_preload_libraries = 'timescaledb'
```

#### 2. Security Configuration

Edit `/etc/postgresql/14/main/pg_hba.conf`:

```conf
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                peer
local   all             all                                     peer
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
```

#### 3. Database Optimization Scripts

Create optimization script at `/home/cryb/scripts/optimize-db.sql`:

```sql
-- Create indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_community_id ON posts(community_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_channel_id ON messages(channel_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Create TimescaleDB hypertables for time-series data
SELECT create_hypertable('analytics_events', 'created_at', if_not_exists => TRUE);
SELECT create_hypertable('user_sessions', 'created_at', if_not_exists => TRUE);

-- Set up data retention policies
SELECT add_retention_policy('analytics_events', INTERVAL '1 year');
SELECT add_retention_policy('user_sessions', INTERVAL '90 days');

-- Update table statistics
ANALYZE;
```

### Backup Configuration

Create backup script at `/home/cryb/scripts/backup-db.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/var/backups/cryb"
DATABASE="cryb"
USERNAME="cryb"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/cryb_backup_$TIMESTAMP.sql.gz"

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform backup
pg_dump -U $USERNAME -h localhost $DATABASE | gzip > $BACKUP_FILE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "cryb_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
```

Make script executable and set up cron job:

```bash
chmod +x /home/cryb/scripts/backup-db.sh

# Add to crontab (daily backup at 2 AM)
crontab -e
0 2 * * * /home/cryb/scripts/backup-db.sh
```

## SSL/HTTPS Configuration

### 1. Install Certbot for Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Obtain SSL Certificates

```bash
# Replace with your actual domains
sudo certbot --nginx -d platform.yourdomain.com -d api.yourdomain.com -d admin.yourdomain.com
```

### 3. Nginx Configuration

Create `/etc/nginx/sites-available/cryb-platform`:

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=web:10m rate=30r/s;

# Upstream servers
upstream cryb_api {
    server 127.0.0.1:3001;
    server 127.0.0.1:3002 backup;
}

upstream cryb_web {
    server 127.0.0.1:3000;
}

upstream cryb_admin {
    server 127.0.0.1:3003;
}

# API Server
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Rate Limiting
    limit_req zone=api burst=20 nodelay;

    # Proxy Configuration
    location / {
        proxy_pass http://cryb_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # WebSocket Support
    location /socket.io/ {
        proxy_pass http://cryb_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # File Upload
    client_max_body_size 100M;
    proxy_request_buffering off;
}

# Web Application
server {
    listen 443 ssl http2;
    server_name platform.yourdomain.com;

    # SSL Configuration (same as API)
    ssl_certificate /etc/letsencrypt/live/platform.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/platform.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Rate Limiting
    limit_req zone=web burst=50 nodelay;

    # Static Asset Caching
    location /_next/static/ {
        proxy_pass http://cryb_web;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        proxy_pass http://cryb_web;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Admin Panel
server {
    listen 443 ssl http2;
    server_name admin.yourdomain.com;

    # SSL Configuration (same as others)
    ssl_certificate /etc/letsencrypt/live/admin.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;

    # Admin IP Restriction (optional)
    # allow 203.0.113.0/24;
    # deny all;

    location / {
        proxy_pass http://cryb_admin;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name platform.yourdomain.com api.yourdomain.com admin.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

Enable the configuration:

```bash
sudo ln -s /etc/nginx/sites-available/cryb-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. SSL Certificate Auto-Renewal

```bash
# Test certificate renewal
sudo certbot renew --dry-run

# Set up automatic renewal (already configured by default)
sudo systemctl status certbot.timer
```

## PM2 Setup

### 1. PM2 Ecosystem Configuration

Create `/home/cryb/cryb-platform/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'cryb-api',
      script: './apps/api/dist/index.js',
      cwd: '/home/cryb/cryb-platform',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_file: '.env.production',
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_file: './logs/api-combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
      kill_timeout: 5000,
      listen_timeout: 3000,
      restart_delay: 1000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'cryb-web',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/home/cryb/cryb-platform/apps/web',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_file: '../.env.production',
      error_file: './logs/web-error.log',
      out_file: './logs/web-out.log',
      log_file: './logs/web-combined.log',
      time: true,
      max_memory_restart: '512M'
    },
    {
      name: 'cryb-admin',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/home/cryb/cryb-platform/apps/admin',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3003
      },
      env_file: '../.env.production',
      error_file: './logs/admin-error.log',
      out_file: './logs/admin-out.log',
      log_file: './logs/admin-combined.log',
      time: true,
      max_memory_restart: '256M'
    },
    {
      name: 'cryb-worker',
      script: './services/workers/dist/index.js',
      cwd: '/home/cryb/cryb-platform',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      env_file: '.env.production',
      error_file: './logs/worker-error.log',
      out_file: './logs/worker-out.log',
      log_file: './logs/worker-combined.log',
      time: true,
      max_memory_restart: '512M'
    }
  ]
};
```

### 2. PM2 Service Management

```bash
# Create logs directory
mkdir -p /home/cryb/cryb-platform/logs

# Start all applications
cd /home/cryb/cryb-platform
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set up PM2 startup script
pm2 startup
# Follow the generated command instructions

# Monitor applications
pm2 monit
```

### 3. PM2 Monitoring and Management

```bash
# View status of all processes
pm2 status

# View logs
pm2 logs
pm2 logs cryb-api
pm2 logs cryb-web --lines 100

# Restart applications
pm2 restart all
pm2 restart cryb-api

# Reload applications (zero-downtime)
pm2 reload all

# Stop applications
pm2 stop all
pm2 delete all

# Memory and CPU monitoring
pm2 monit
```

### 4. PM2 Log Rotation

Install and configure PM2 log rotation:

```bash
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:dateFormat 'YYYY-MM-DD_HH-mm-ss'
pm2 set pm2-logrotate:workerInterval 30
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'
```

## Docker Deployment

### 1. Docker Compose Production Setup

Create `/home/cryb/cryb-platform/docker-compose.production.yml`:

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: timescale/timescaledb:latest-pg14
    restart: unless-stopped
    environment:
      POSTGRES_DB: cryb
      POSTGRES_USER: cryb
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    ports:
      - "5432:5432"
    networks:
      - cryb_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U cryb -d cryb"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - cryb_network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 5

  # MinIO Object Storage
  minio:
    image: minio/minio:latest
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"
    networks:
      - cryb_network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

  # Elasticsearch (Optional)
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    restart: unless-stopped
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms1g -Xmx1g"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"
    networks:
      - cryb_network
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:9200/_health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5

  # CRYB API
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://cryb:${POSTGRES_PASSWORD}@postgres:5432/cryb
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
    env_file:
      - .env.production
    volumes:
      - upload_data:/app/uploads
    ports:
      - "3001:3001"
    networks:
      - cryb_network
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # CRYB Web
  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    restart: unless-stopped
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: https://api.yourdomain.com
    env_file:
      - .env.production
    ports:
      - "3000:3000"
    networks:
      - cryb_network
    depends_on:
      - api
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # CRYB Admin
  admin:
    build:
      context: .
      dockerfile: apps/admin/Dockerfile
    restart: unless-stopped
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: https://api.yourdomain.com
    env_file:
      - .env.production
    ports:
      - "3003:3003"
    networks:
      - cryb_network
    depends_on:
      - api
    deploy:
      resources:
        limits:
          memory: 256M
        reservations:
          memory: 128M

  # Background Workers
  worker:
    build:
      context: .
      dockerfile: services/workers/Dockerfile
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://cryb:${POSTGRES_PASSWORD}@postgres:5432/cryb
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
    env_file:
      - .env.production
    networks:
      - cryb_network
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    restart: unless-stopped
    volumes:
      - ./config/nginx/production.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    ports:
      - "80:80"
      - "443:443"
    networks:
      - cryb_network
    depends_on:
      - api
      - web
      - admin

volumes:
  postgres_data:
  redis_data:
  minio_data:
  elasticsearch_data:
  upload_data:

networks:
  cryb_network:
    driver: bridge
```

### 2. Docker Environment Configuration

Create `.env.docker`:

```env
# Database
POSTGRES_PASSWORD=your_secure_postgres_password
REDIS_PASSWORD=your_secure_redis_password

# MinIO
MINIO_ACCESS_KEY=your_minio_access_key
MINIO_SECRET_KEY=your_minio_secret_key

# Application
JWT_SECRET=your_jwt_secret_256_bits_minimum
JWT_REFRESH_SECRET=your_refresh_secret_256_bits_minimum

# External Services
SMTP_HOST=smtp.yourdomain.com
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your_smtp_password

LIVEKIT_URL=wss://yourdomain-livekit.com
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
```

### 3. Docker Deployment Commands

```bash
# Build and start all services
docker-compose -f docker-compose.production.yml --env-file .env.docker up -d

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Scale API service
docker-compose -f docker-compose.production.yml up -d --scale api=3

# Update services
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d

# Backup volumes
docker run --rm -v cryb-platform_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz -C /data .

# Health check
docker-compose -f docker-compose.production.yml ps
```

## Scaling Considerations

### Horizontal Scaling

**Load Balancing:**
- Use Nginx or HAProxy for load balancing
- Implement sticky sessions for WebSocket connections
- Use Redis for session storage across instances

**Database Scaling:**
- PostgreSQL read replicas for read-heavy workloads
- Connection pooling with PgBouncer
- Database sharding for extreme scale

**Caching Strategy:**
- Redis cluster for distributed caching
- CDN for static assets (CloudFront, Cloudflare)
- Application-level caching with cache invalidation

### Vertical Scaling

**Resource Allocation:**
- Monitor CPU, memory, and disk usage
- Increase server specifications as needed
- Optimize database queries and indexes

**Performance Optimization:**
- Enable gzip compression
- Optimize images and assets
- Use efficient data structures
- Implement lazy loading

### Microservices Architecture

**Service Separation:**
- Authentication service
- Media processing service
- Notification service
- Analytics service

**Communication:**
- REST APIs for synchronous communication
- Message queues (RabbitMQ, Kafka) for asynchronous
- Event-driven architecture

## Backup Strategies

### Database Backups

**Automated Backups:**
```bash
#!/bin/bash
# /home/cryb/scripts/database-backup.sh

BACKUP_DIR="/var/backups/cryb/database"
DB_NAME="cryb"
DB_USER="cryb"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Full database backup
pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > "$BACKUP_DIR/full_backup_$TIMESTAMP.sql.gz"

# Schema-only backup
pg_dump -U $DB_USER -h localhost --schema-only $DB_NAME | gzip > "$BACKUP_DIR/schema_backup_$TIMESTAMP.sql.gz"

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

# Upload to cloud storage (optional)
# aws s3 sync $BACKUP_DIR s3://your-backup-bucket/database/
```

### File System Backups

**Media Files Backup:**
```bash
#!/bin/bash
# /home/cryb/scripts/media-backup.sh

MEDIA_DIR="/var/uploads/cryb"
BACKUP_DIR="/var/backups/cryb/media"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create incremental backup
rsync -av --link-dest="$BACKUP_DIR/latest" "$MEDIA_DIR/" "$BACKUP_DIR/backup_$TIMESTAMP/"

# Update latest symlink
rm -f "$BACKUP_DIR/latest"
ln -s "backup_$TIMESTAMP" "$BACKUP_DIR/latest"

# Remove backups older than 7 days
find $BACKUP_DIR -maxdepth 1 -name "backup_*" -mtime +7 -exec rm -rf {} \;
```

### Application Backups

**Code and Configuration:**
```bash
#!/bin/bash
# /home/cryb/scripts/app-backup.sh

APP_DIR="/home/cryb/cryb-platform"
BACKUP_DIR="/var/backups/cryb/application"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create application backup
tar -czf "$BACKUP_DIR/app_backup_$TIMESTAMP.tar.gz" \
  --exclude="node_modules" \
  --exclude=".git" \
  --exclude="logs" \
  --exclude="uploads" \
  -C /home/cryb cryb-platform

# Remove backups older than 14 days
find $BACKUP_DIR -name "app_backup_*.tar.gz" -mtime +14 -delete
```

### Backup Monitoring

Create backup monitoring script:
```bash
#!/bin/bash
# /home/cryb/scripts/backup-monitor.sh

BACKUP_LOG="/var/log/cryb/backup.log"
ALERT_EMAIL="admin@yourdomain.com"

# Check if backups completed successfully
if ! grep -q "$(date +%Y-%m-%d)" "$BACKUP_LOG"; then
    echo "ERROR: Daily backup not found for $(date +%Y-%m-%d)" | \
    mail -s "CRYB Backup Failed" "$ALERT_EMAIL"
fi

# Check backup file sizes
DB_BACKUP=$(find /var/backups/cryb/database -name "full_backup_$(date +%Y%m%d)*.sql.gz" -size +1M)
if [ -z "$DB_BACKUP" ]; then
    echo "ERROR: Database backup file too small or missing" | \
    mail -s "CRYB Database Backup Issue" "$ALERT_EMAIL"
fi
```

## Monitoring Setup

### System Monitoring with Prometheus and Grafana

**Docker Compose Monitoring Stack:**
```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    restart: unless-stopped
    volumes:
      - ./config/prometheus:/etc/prometheus
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    ports:
      - "9090:9090"
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:latest
    restart: unless-stopped
    environment:
      GF_SECURITY_ADMIN_USER: admin
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
      GF_USERS_ALLOW_SIGN_UP: false
    volumes:
      - grafana_data:/var/lib/grafana
      - ./config/grafana/provisioning:/etc/grafana/provisioning
    ports:
      - "3030:3000"
    networks:
      - monitoring

  node-exporter:
    image: prom/node-exporter:latest
    restart: unless-stopped
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    ports:
      - "9100:9100"
    networks:
      - monitoring

  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:latest
    restart: unless-stopped
    environment:
      DATA_SOURCE_NAME: postgresql://cryb:${POSTGRES_PASSWORD}@postgres:5432/cryb?sslmode=disable
    ports:
      - "9187:9187"
    networks:
      - monitoring
      - cryb_network

  redis-exporter:
    image: oliver006/redis_exporter:latest
    restart: unless-stopped
    environment:
      REDIS_ADDR: redis:6379
      REDIS_PASSWORD: ${REDIS_PASSWORD}
    ports:
      - "9121:9121"
    networks:
      - monitoring
      - cryb_network

volumes:
  prometheus_data:
  grafana_data:

networks:
  monitoring:
    driver: bridge
  cryb_network:
    external: true
```

### Application Performance Monitoring

**Health Check Endpoint:**
```javascript
// Add to your API application
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: 'unknown',
    redis: 'unknown'
  };

  try {
    // Check database connection
    await db.raw('SELECT 1');
    health.database = 'connected';
  } catch (error) {
    health.database = 'error';
    health.status = 'error';
  }

  try {
    // Check Redis connection
    await redis.ping();
    health.redis = 'connected';
  } catch (error) {
    health.redis = 'error';
    health.status = 'error';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

### Log Aggregation with ELK Stack

**Logstash Configuration:**
```yaml
# config/logstash/logstash.conf
input {
  beats {
    port => 5044
  }
}

filter {
  if [fileset][module] == "nginx" {
    if [fileset][name] == "access" {
      grok {
        match => { "message" => "%{NGINXACCESS}" }
      }
    }
  }
  
  if [fields][app] == "cryb" {
    json {
      source => "message"
    }
    
    date {
      match => [ "timestamp", "ISO8601" ]
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "cryb-logs-%{+YYYY.MM.dd}"
  }
}
```

### Alerting Configuration

**Prometheus Alert Rules:**
```yaml
# config/prometheus/alerts.yml
groups:
  - name: cryb_alerts
    rules:
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage detected"
          description: "CPU usage is above 80% for more than 5 minutes"

      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 90
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High memory usage detected"
          description: "Memory usage is above 90% for more than 5 minutes"

      - alert: DatabaseDown
        expr: pg_up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "PostgreSQL is down"
          description: "PostgreSQL database is not responding"

      - alert: RedisDown
        expr: redis_up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Redis is down"
          description: "Redis cache is not responding"

      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is above 10% for more than 5 minutes"
```

### Performance Monitoring Script

Create `/home/cryb/scripts/performance-monitor.sh`:

```bash
#!/bin/bash

LOG_FILE="/var/log/cryb/performance.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# System metrics
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.2f", $3/$2 * 100.0)}')
DISK_USAGE=$(df -h / | awk 'NR==2{print $5}' | cut -d'%' -f1)

# Application metrics
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code},%{time_total}" http://localhost:3001/health)
WEB_RESPONSE=$(curl -s -o /dev/null -w "%{http_code},%{time_total}" http://localhost:3000/api/health)

# Database metrics
DB_CONNECTIONS=$(sudo -u postgres psql -d cryb -t -c "SELECT count(*) FROM pg_stat_activity;")
DB_SIZE=$(sudo -u postgres psql -d cryb -t -c "SELECT pg_size_pretty(pg_database_size('cryb'));")

# Log metrics
echo "$TIMESTAMP,CPU:$CPU_USAGE%,Memory:$MEMORY_USAGE%,Disk:$DISK_USAGE%,API:$API_RESPONSE,Web:$WEB_RESPONSE,DB_Conn:$DB_CONNECTIONS,DB_Size:$DB_SIZE" >> $LOG_FILE

# Alert on high resource usage
if (( $(echo "$CPU_USAGE > 80" | bc -l) )); then
    echo "HIGH CPU USAGE: $CPU_USAGE%" | mail -s "CRYB Performance Alert" admin@yourdomain.com
fi

if (( $(echo "$MEMORY_USAGE > 90" | bc -l) )); then
    echo "HIGH MEMORY USAGE: $MEMORY_USAGE%" | mail -s "CRYB Performance Alert" admin@yourdomain.com
fi
```

Add to crontab for regular monitoring:
```bash
# Monitor every 5 minutes
*/5 * * * * /home/cryb/scripts/performance-monitor.sh
```

---

This deployment guide provides a comprehensive foundation for deploying CRYB Platform in production. Customize the configurations based on your specific requirements, infrastructure, and scale needs.

**Next Steps:**
1. Review and customize all configuration files
2. Set up monitoring and alerting
3. Implement backup strategies
4. Configure SSL certificates
5. Test the deployment thoroughly
6. Set up CI/CD pipelines for automated deployments

**Support:**
- Documentation: Review the Admin Guide and User Guide
- Community: Join the CRYB community for support
- Issues: Report bugs on the GitHub repository

**Last Updated**: September 2025  
**Version**: 1.0  
**Platform Version**: 0.0.1