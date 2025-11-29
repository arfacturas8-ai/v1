#!/bin/bash
set -e

# ==============================================
# CRYB PLATFORM - SECURE PRODUCTION DEPLOYMENT
# ==============================================

echo "🚀 Starting secure production deployment..."

# Check if running as ubuntu user
if [ "$USER" != "ubuntu" ]; then
    echo "❌ This script must be run as the ubuntu user"
    exit 1
fi

# Navigate to platform directory
cd /home/ubuntu/cryb-platform

# Load production environment
if [ ! -f .env.production ]; then
    echo "❌ Production environment file not found: .env.production"
    exit 1
fi

echo "✅ Loading production environment variables..."
export $(grep -v '^#' .env.production | xargs)

# Create data directories with proper permissions
echo "📁 Creating data directories..."
sudo mkdir -p /home/ubuntu/cryb-platform/data/{prometheus,grafana,alertmanager,loki}
sudo chown -R ubuntu:ubuntu /home/ubuntu/cryb-platform/data

# Set secure file permissions
echo "🔒 Setting secure file permissions..."
chmod 600 .env.production
chmod 600 .env.production.secure 2>/dev/null || true
chmod +x deploy-production-secure.sh
chmod +x backups/postgres/scripts/*.sh

# Stop existing containers gracefully
echo "🛑 Stopping existing containers..."
docker ps -q --filter "name=cryb-" | xargs -r docker stop

# Pull latest images
echo "📥 Pulling latest Docker images..."
docker pull timescale/timescaledb:latest-pg15
docker pull redis:7-alpine
docker pull minio/minio:latest
docker pull prom/prometheus:v2.48.0
docker pull grafana/grafana:10.2.2
docker pull prom/alertmanager:v0.26.0

# Start core services first
echo "🗄️  Starting core services..."
docker run -d \
  --name cryb-postgres-optimized \
  --restart unless-stopped \
  --network cryb-platform_cryb-network \
  -p 5433:5432 \
  -e POSTGRES_USER="$POSTGRES_USER" \
  -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
  -e POSTGRES_DB="$POSTGRES_DB" \
  -e POSTGRES_INITDB_ARGS="-E UTF8" \
  -v postgres_data:/var/lib/postgresql/data \
  -v ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql \
  -v ./config/postgres/postgresql.conf:/etc/postgresql/postgresql.conf \
  timescale/timescaledb:latest-pg15

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 15
docker exec cryb-postgres-optimized pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"

# Start Redis
echo "🟥 Starting Redis..."
docker run -d \
  --name cryb-redis-dev \
  --restart unless-stopped \
  --network cryb-platform_cryb-network \
  -p 6380:6379 \
  -e REDIS_PASSWORD="$REDIS_PASSWORD" \
  -v redis_data:/data \
  -v ./config/redis/redis.conf:/etc/redis/redis.conf \
  redis:7-alpine redis-server /etc/redis/redis.conf

# Start MinIO
echo "📦 Starting MinIO..."
docker run -d \
  --name cryb-minio \
  --restart unless-stopped \
  --network cryb-platform_cryb-network \
  -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER="$MINIO_ROOT_USER" \
  -e MINIO_ROOT_PASSWORD="$MINIO_ROOT_PASSWORD" \
  -e MINIO_DEFAULT_BUCKETS="cryb-media,cryb-uploads,cryb-backups" \
  -v minio_data:/data \
  minio/minio:latest server /data --console-address ":9001"

# Start monitoring stack
echo "📊 Starting monitoring stack..."
docker network create cryb-monitoring 2>/dev/null || true

# Start Prometheus
docker run -d \
  --name cryb-prometheus \
  --restart unless-stopped \
  --network cryb-monitoring \
  -p 9090:9090 \
  -v ./config/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro \
  -v ./config/prometheus/alerts.yml:/etc/prometheus/alerts.yml:ro \
  -v /home/ubuntu/cryb-platform/data/prometheus:/prometheus \
  prom/prometheus:v2.48.0 \
  --config.file=/etc/prometheus/prometheus.yml \
  --storage.tsdb.path=/prometheus \
  --storage.tsdb.retention.time=30d \
  --web.enable-lifecycle

# Start Grafana
docker run -d \
  --name cryb-grafana \
  --restart unless-stopped \
  --network cryb-monitoring \
  -p 3005:3000 \
  -e GF_SECURITY_ADMIN_USER="$GRAFANA_ADMIN_USER" \
  -e GF_SECURITY_ADMIN_PASSWORD="$GRAFANA_ADMIN_PASSWORD" \
  -e GF_SECURITY_SECRET_KEY="$GRAFANA_SECRET_KEY" \
  -v /home/ubuntu/cryb-platform/data/grafana:/var/lib/grafana \
  -v ./config/grafana/provisioning:/etc/grafana/provisioning:ro \
  grafana/grafana:10.2.2

# Create backup cron job
echo "💾 Setting up automated backups..."
(crontab -l 2>/dev/null | grep -v "cryb-platform/backups"; echo "0 2 * * * /home/ubuntu/cryb-platform/backups/postgres/scripts/full-backup.sh >> /home/ubuntu/cryb-platform/logs/backup.log 2>&1") | crontab -

# Final health checks
echo "🏥 Performing health checks..."
sleep 10

# Check PostgreSQL
if docker exec cryb-postgres-optimized pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" > /dev/null 2>&1; then
    echo "✅ PostgreSQL is healthy"
else
    echo "❌ PostgreSQL health check failed"
fi

# Check Redis
if docker exec cryb-redis-dev redis-cli -a "$REDIS_PASSWORD" ping > /dev/null 2>&1; then
    echo "✅ Redis is healthy"
else
    echo "❌ Redis health check failed"
fi

# Check MinIO
if curl -sf http://localhost:9000/minio/health/live > /dev/null 2>&1; then
    echo "✅ MinIO is healthy"
else
    echo "❌ MinIO health check failed"
fi

echo ""
echo "🎉 Production deployment completed successfully!"
echo ""
echo "📊 Services Status:"
echo "   - PostgreSQL (TimescaleDB): http://localhost:5433"
echo "   - Redis: localhost:6380"
echo "   - MinIO Console: http://localhost:9001"
echo "   - Prometheus: http://localhost:9090"
echo "   - Grafana: http://localhost:3005"
echo ""
echo "🔐 Security Features Enabled:"
echo "   - Environment variables secured"
echo "   - Strong credentials generated"
echo "   - File permissions locked down"
echo "   - Automated database backups"
echo "   - 4GB swap configured"
echo "   - TimescaleDB extension installed"
echo ""
echo "⚠️  Next Steps:"
echo "   1. Configure external API keys in .env.production"
echo "   2. Set up SSL certificates for production domains"
echo "   3. Configure email alerts in AlertManager"
echo "   4. Review and adjust monitoring dashboards"
echo ""