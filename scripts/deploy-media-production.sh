#!/bin/bash

# Production Media Infrastructure Deployment Script
# This script deploys the complete CRYB media infrastructure with scaling capabilities

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.media-production.yml"
ENV_FILE=".env.production"
DATA_DIR="/opt/cryb/data"
BACKUP_DIR="/opt/cryb/backups"
LOG_DIR="/opt/cryb/logs"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if running as root or with sudo
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root or with sudo"
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check available disk space (minimum 100GB)
    available_space=$(df / | awk 'NR==2 {print $4}')
    required_space=$((100 * 1024 * 1024)) # 100GB in KB
    
    if [[ $available_space -lt $required_space ]]; then
        log_warning "Available disk space is less than 100GB. Consider adding more storage."
    fi
    
    # Check memory (minimum 16GB)
    total_memory=$(free -m | awk 'NR==2{print $2}')
    required_memory=16384 # 16GB in MB
    
    if [[ $total_memory -lt $required_memory ]]; then
        log_warning "Available memory is less than 16GB. Performance may be impacted."
    fi
    
    log_success "Prerequisites check completed"
}

# Setup directories
setup_directories() {
    log_info "Setting up data directories..."
    
    # Create main directories
    mkdir -p "$DATA_DIR"/{postgres-primary,postgres-replica}
    mkdir -p "$DATA_DIR"/{redis-master,redis-replica-1}
    mkdir -p "$DATA_DIR"/{minio-1-data1,minio-1-data2}
    mkdir -p "$DATA_DIR"/{minio-2-data1,minio-2-data2}
    mkdir -p "$DATA_DIR"/{minio-3-data1,minio-3-data2}
    mkdir -p "$DATA_DIR"/{minio-4-data1,minio-4-data2}
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$LOG_DIR"
    
    # Set proper permissions
    chown -R 999:999 "$DATA_DIR"/postgres-*
    chown -R 999:999 "$DATA_DIR"/redis-*
    chown -R 1001:1001 "$DATA_DIR"/minio-*
    
    log_success "Data directories created and configured"
}

# Generate environment variables
generate_env_file() {
    log_info "Generating environment file..."
    
    if [[ ! -f "$ENV_FILE" ]]; then
        cat > "$ENV_FILE" << EOF
# Production Environment Variables for CRYB Media Platform

# Security Keys
MEDIA_ENCRYPTION_KEY=$(openssl rand -hex 32)
GRAFANA_ADMIN_PASSWORD=$(openssl rand -base64 32)
VIRUSTOTAL_API_KEY=your_virustotal_api_key_here

# CDN Configuration
CLOUDFLARE_API_TOKEN=your_cloudflare_token_here
CLOUDFLARE_ZONE_ID=your_cloudflare_zone_id_here
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
AWS_REGION=us-east-1

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name_here
CLOUDINARY_API_KEY=your_cloudinary_api_key_here
CLOUDINARY_API_SECRET=your_cloudinary_api_secret_here

# Performance Tuning
MAX_WORKERS=4
WORKER_MEMORY_LIMIT=2G
TRANSCODING_QUALITY=high
IMAGE_OPTIMIZATION_LEVEL=aggressive

# Monitoring
ENABLE_METRICS=true
ENABLE_TRACING=true
LOG_LEVEL=info

# Backup Configuration
BACKUP_RETENTION_DAYS=30
ENABLE_AUTO_BACKUP=true
EOF
        log_success "Environment file created at $ENV_FILE"
        log_warning "Please edit $ENV_FILE and configure your API keys before deployment"
    else
        log_info "Environment file already exists"
    fi
}

# Setup monitoring
setup_monitoring() {
    log_info "Setting up monitoring configuration..."
    
    # Create Prometheus configuration
    mkdir -p config/prometheus
    cat > config/prometheus/prometheus-prod.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alerts.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'media-storage'
    static_configs:
      - targets: ['media-storage:3001']
    metrics_path: '/metrics'
    scrape_interval: 10s

  - job_name: 'video-transcoding'
    static_configs:
      - targets: ['video-transcoding:3002']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'image-optimizer'
    static_configs:
      - targets: ['image-optimizer:3003']
    metrics_path: '/metrics'
    scrape_interval: 10s

  - job_name: 'upload-service'
    static_configs:
      - targets: ['upload-service:3004']
    metrics_path: '/metrics'
    scrape_interval: 15s

  - job_name: 'cdn-manager'
    static_configs:
      - targets: ['cdn-manager:3006']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'media-analytics'
    static_configs:
      - targets: ['media-analytics:3007']
    metrics_path: '/metrics'
    scrape_interval: 15s

  - job_name: 'responsive-delivery'
    static_configs:
      - targets: ['responsive-delivery:3008']
    metrics_path: '/metrics'
    scrape_interval: 10s

  - job_name: 'haproxy'
    static_configs:
      - targets: ['haproxy:8404']
    metrics_path: '/stats/prometheus'

  - job_name: 'minio'
    static_configs:
      - targets: ['minio-1:9000', 'minio-2:9000', 'minio-3:9000', 'minio-4:9000']
    metrics_path: '/minio/v2/metrics/cluster'

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-primary:5432', 'postgres-replica:5432']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-master:6379', 'redis-replica-1:6379']
EOF

    # Create Vector configuration for log aggregation
    mkdir -p config/vector
    cat > config/vector/vector.toml << 'EOF'
[sources.docker_logs]
type = "docker_logs"

[transforms.parse_logs]
type = "remap"
inputs = ["docker_logs"]
source = '''
  .timestamp = now()
  .service = .label."com.docker.compose.service"
  .container = .label."com.docker.compose.container-number"
'''

[sinks.elasticsearch]
type = "elasticsearch"
inputs = ["parse_logs"]
endpoint = "http://elasticsearch:9200"
index = "cryb-logs-%Y.%m.%d"

[sinks.console]
type = "console"
inputs = ["parse_logs"]
encoding.codec = "json"
EOF

    log_success "Monitoring configuration created"
}

# Deploy services
deploy_services() {
    log_info "Deploying CRYB Media Platform..."
    
    # Pull latest images
    log_info "Pulling Docker images..."
    docker-compose -f "$COMPOSE_FILE" pull
    
    # Build custom images
    log_info "Building custom service images..."
    docker-compose -f "$COMPOSE_FILE" build
    
    # Start infrastructure services first
    log_info "Starting infrastructure services..."
    docker-compose -f "$COMPOSE_FILE" up -d \
        postgres-primary postgres-replica pgbouncer \
        redis-master redis-replica-1 redis-sentinel \
        minio-1 minio-2 minio-3 minio-4 \
        elasticsearch prometheus grafana jaeger vector \
        rabbitmq clamav
    
    # Wait for infrastructure to be ready
    log_info "Waiting for infrastructure services to be ready..."
    sleep 60
    
    # Start media services
    log_info "Starting media processing services..."
    docker-compose -f "$COMPOSE_FILE" up -d \
        security-scanner \
        media-storage \
        video-transcoding \
        image-optimizer \
        upload-service \
        cdn-manager \
        media-analytics \
        responsive-delivery \
        media-workers
    
    # Start load balancer
    log_info "Starting load balancer..."
    docker-compose -f "$COMPOSE_FILE" up -d haproxy
    
    log_success "All services deployed successfully"
}

# Verify deployment
verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check service health
    services=(
        "postgres-primary" "postgres-replica" "pgbouncer"
        "redis-master" "redis-replica-1" "redis-sentinel"
        "minio-1" "minio-2" "minio-3" "minio-4"
        "elasticsearch" "prometheus" "grafana" "jaeger"
        "rabbitmq" "clamav" "haproxy"
        "media-storage" "video-transcoding" "image-optimizer"
        "upload-service" "security-scanner" "cdn-manager"
        "media-analytics" "responsive-delivery" "media-workers"
    )
    
    failed_services=()
    
    for service in "${services[@]}"; do
        if docker-compose -f "$COMPOSE_FILE" ps "$service" | grep -q "Up"; then
            log_success "$service is running"
        else
            log_error "$service is not running"
            failed_services+=("$service")
        fi
    done
    
    if [[ ${#failed_services[@]} -eq 0 ]]; then
        log_success "All services are running successfully"
        
        # Display access information
        echo ""
        log_info "Access URLs:"
        echo "  • Media Platform: http://localhost"
        echo "  • HAProxy Stats: http://localhost:8404/stats"
        echo "  • Grafana: http://localhost:3000 (admin/admin123)"
        echo "  • Prometheus: http://localhost:9090"
        echo "  • Jaeger: http://localhost:16686"
        echo "  • MinIO Console: http://localhost:9001"
        echo "  • RabbitMQ Management: http://localhost:15672"
        echo ""
        
    else
        log_error "The following services failed to start: ${failed_services[*]}"
        log_info "Check logs with: docker-compose -f $COMPOSE_FILE logs <service_name>"
        exit 1
    fi
}

# Setup automatic scaling
setup_autoscaling() {
    log_info "Setting up automatic scaling..."
    
    # Create scaling script
    cat > /usr/local/bin/cryb-autoscaler << 'EOF'
#!/bin/bash

# CRYB Media Platform Auto-scaler
# Monitors resource usage and scales services automatically

COMPOSE_FILE="/opt/cryb/docker-compose.media-production.yml"
LOG_FILE="/opt/cryb/logs/autoscaler.log"

log_with_timestamp() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') $1" >> "$LOG_FILE"
}

# Check CPU usage and scale accordingly
check_and_scale() {
    local service=$1
    local max_replicas=${2:-10}
    local cpu_threshold=${3:-80}
    
    # Get current CPU usage for the service
    cpu_usage=$(docker stats --no-stream --format "table {{.CPUPerc}}" $(docker-compose -f "$COMPOSE_FILE" ps -q "$service") | tail -n +2 | sed 's/%//' | awk '{sum+=$1} END {print sum/NR}')
    
    if (( $(echo "$cpu_usage > $cpu_threshold" | bc -l) )); then
        current_replicas=$(docker-compose -f "$COMPOSE_FILE" ps "$service" | grep -c "$service")
        
        if [[ $current_replicas -lt $max_replicas ]]; then
            new_replicas=$((current_replicas + 1))
            docker-compose -f "$COMPOSE_FILE" scale "$service=$new_replicas"
            log_with_timestamp "Scaled $service from $current_replicas to $new_replicas replicas (CPU: $cpu_usage%)"
        fi
    elif (( $(echo "$cpu_usage < 30" | bc -l) )); then
        current_replicas=$(docker-compose -f "$COMPOSE_FILE" ps "$service" | grep -c "$service")
        
        if [[ $current_replicas -gt 1 ]]; then
            new_replicas=$((current_replicas - 1))
            docker-compose -f "$COMPOSE_FILE" scale "$service=$new_replicas"
            log_with_timestamp "Scaled $service from $current_replicas to $new_replicas replicas (CPU: $cpu_usage%)"
        fi
    fi
}

# Monitor and scale services
while true; do
    check_and_scale "media-storage" 6 75
    check_and_scale "image-optimizer" 8 80
    check_and_scale "upload-service" 5 70
    check_and_scale "responsive-delivery" 6 75
    check_and_scale "media-workers" 8 85
    
    sleep 300  # Check every 5 minutes
done
EOF

    chmod +x /usr/local/bin/cryb-autoscaler
    
    # Create systemd service for autoscaler
    cat > /etc/systemd/system/cryb-autoscaler.service << EOF
[Unit]
Description=CRYB Media Platform Auto-scaler
After=docker.service
Requires=docker.service

[Service]
Type=simple
ExecStart=/usr/local/bin/cryb-autoscaler
Restart=always
RestartSec=10
User=root

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable cryb-autoscaler
    systemctl start cryb-autoscaler
    
    log_success "Auto-scaling configured and started"
}

# Main execution
main() {
    echo "=================================================="
    echo "CRYB Media Platform Production Deployment"
    echo "=================================================="
    echo ""
    
    check_prerequisites
    setup_directories
    generate_env_file
    setup_monitoring
    deploy_services
    verify_deployment
    setup_autoscaling
    
    echo ""
    log_success "CRYB Media Platform deployed successfully!"
    echo ""
    log_info "Next steps:"
    echo "  1. Configure API keys in $ENV_FILE"
    echo "  2. Set up SSL certificates"
    echo "  3. Configure DNS for your domain"
    echo "  4. Review monitoring dashboards"
    echo "  5. Test the media processing pipeline"
    echo ""
    log_warning "Remember to backup your data regularly!"
}

# Execute main function
main "$@"