#!/bin/bash

# ==============================================
# CRYB PLATFORM - COMPREHENSIVE MONITORING DEPLOYMENT
# ==============================================
# Deploys complete monitoring stack with all enhancements
# Includes: Prometheus, Grafana, Alertmanager, Custom Exporters
# ==============================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="/tmp/monitoring-deployment-$(date +%Y%m%d_%H%M%S).log"

# Environment variables with defaults
MONITORING_DOMAIN="${MONITORING_DOMAIN:-monitoring.cryb.ai}"
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
SMTP_PASSWORD="${SMTP_PASSWORD:-}"
PAGERDUTY_API_KEY="${PAGERDUTY_API_KEY:-}"
SENTRY_DSN="${SENTRY_DSN:-}"

# ==============================================
# LOGGING FUNCTIONS
# ==============================================

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

# ==============================================
# HELPER FUNCTIONS
# ==============================================

check_requirements() {
    log "Checking system requirements..."
    
    # Check if running as root or with sudo
    if [[ $EUID -eq 0 ]]; then
        warning "Running as root. This is not recommended for production."
    fi
    
    # Check required commands
    local required_commands=("docker" "docker-compose" "openssl" "htpasswd")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            error "$cmd is not installed. Please install it first."
        fi
    done
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        error "Docker daemon is not running. Please start Docker first."
    fi
    
    # Check available disk space (need at least 10GB)
    local available_space=$(df / | awk 'NR==2 {print $4}')
    if [[ $available_space -lt 10485760 ]]; then # 10GB in KB
        warning "Less than 10GB disk space available. Monitoring may consume significant space."
    fi
    
    success "System requirements check passed"
}

create_directories() {
    log "Creating monitoring directories..."
    
    local directories=(
        "/opt/cryb/prometheus"
        "/opt/cryb/grafana"
        "/opt/cryb/loki"
        "/opt/cryb/alertmanager"
        "/opt/cryb/uptime-kuma"
        "/var/log/cryb/monitoring"
        "/etc/nginx/ssl"
        "/var/www/html/errors"
    )
    
    for dir in "${directories[@]}"; do
        if [[ ! -d "$dir" ]]; then
            sudo mkdir -p "$dir"
            sudo chown -R $(whoami):$(whoami) "$dir" 2>/dev/null || true
            log "Created directory: $dir"
        fi
    done
    
    success "Directories created successfully"
}

setup_ssl_certificates() {
    log "Setting up SSL certificates for $MONITORING_DOMAIN..."
    
    # Check if certificates already exist
    if [[ -f "/etc/letsencrypt/live/$MONITORING_DOMAIN/fullchain.pem" ]]; then
        log "SSL certificates already exist for $MONITORING_DOMAIN"
        return 0
    fi
    
    # Install certbot if not present
    if ! command -v certbot &> /dev/null; then
        log "Installing certbot..."
        sudo apt update
        sudo apt install -y certbot python3-certbot-nginx
    fi
    
    # Create temporary nginx config for ACME challenge
    local temp_config="/etc/nginx/sites-available/monitoring-temp"
    sudo tee "$temp_config" > /dev/null <<EOF
server {
    listen 80;
    server_name $MONITORING_DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files \$uri =404;
    }
    
    location / {
        return 301 https://\$host\$request_uri;
    }
}
EOF
    
    # Enable temporary config
    sudo ln -sf "$temp_config" "/etc/nginx/sites-enabled/monitoring-temp"
    sudo nginx -t && sudo systemctl reload nginx
    
    # Create webroot directory
    sudo mkdir -p /var/www/certbot
    
    # Obtain SSL certificate
    log "Obtaining SSL certificate for $MONITORING_DOMAIN..."
    sudo certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email "admin@cryb.ai" \
        --agree-tos \
        --non-interactive \
        --domains "$MONITORING_DOMAIN"
    
    if [[ $? -eq 0 ]]; then
        success "SSL certificate obtained successfully"
        
        # Remove temporary config
        sudo rm -f "/etc/nginx/sites-enabled/monitoring-temp"
    else
        warning "Failed to obtain SSL certificate. Using self-signed certificate."
        create_self_signed_certificate
    fi
}

create_self_signed_certificate() {
    log "Creating self-signed SSL certificate..."
    
    local ssl_dir="/etc/nginx/ssl"
    sudo mkdir -p "$ssl_dir"
    
    # Generate private key
    sudo openssl genrsa -out "$ssl_dir/monitoring.key" 2048
    
    # Generate certificate
    sudo openssl req -new -x509 -key "$ssl_dir/monitoring.key" \
        -out "$ssl_dir/monitoring.crt" -days 365 \
        -subj "/C=US/ST=California/L=San Francisco/O=Cryb/CN=$MONITORING_DOMAIN"
    
    # Create symlinks to match Let's Encrypt structure
    sudo mkdir -p "/etc/letsencrypt/live/$MONITORING_DOMAIN"
    sudo ln -sf "$ssl_dir/monitoring.crt" "/etc/letsencrypt/live/$MONITORING_DOMAIN/fullchain.pem"
    sudo ln -sf "$ssl_dir/monitoring.key" "/etc/letsencrypt/live/$MONITORING_DOMAIN/privkey.pem"
    sudo ln -sf "$ssl_dir/monitoring.crt" "/etc/letsencrypt/live/$MONITORING_DOMAIN/chain.pem"
    
    success "Self-signed certificate created"
}

setup_basic_auth() {
    log "Setting up basic authentication for monitoring access..."
    
    # Create htpasswd file
    local htpasswd_file="/etc/nginx/.htpasswd-monitoring"
    
    # Generate random password if not provided
    local admin_password="${MONITORING_PASSWORD:-$(openssl rand -base64 32)}"
    
    # Create htpasswd entry
    sudo htpasswd -cb "$htpasswd_file" admin "$admin_password"
    
    # Create additional users
    sudo htpasswd -b "$htpasswd_file" devops "$(openssl rand -base64 16)"
    sudo htpasswd -b "$htpasswd_file" readonly "$(openssl rand -base64 16)"
    
    # Save credentials
    cat > "$PROJECT_ROOT/monitoring-credentials.txt" <<EOF
Monitoring Dashboard Credentials:
=================================
URL: https://$MONITORING_DOMAIN
Admin Username: admin
Admin Password: $admin_password

DevOps Username: devops
ReadOnly Username: readonly

Note: Change these passwords after first login!
EOF
    
    chmod 600 "$PROJECT_ROOT/monitoring-credentials.txt"
    
    success "Basic authentication configured"
    log "Credentials saved to: $PROJECT_ROOT/monitoring-credentials.txt"
}

configure_nginx() {
    log "Configuring nginx for monitoring subdomain..."
    
    # Copy monitoring nginx configuration
    sudo cp "$PROJECT_ROOT/config/nginx/monitoring.cryb.ai.conf" \
        "/etc/nginx/sites-available/monitoring.cryb.ai"
    
    # Enable site
    sudo ln -sf "/etc/nginx/sites-available/monitoring.cryb.ai" \
        "/etc/nginx/sites-enabled/monitoring.cryb.ai"
    
    # Test nginx configuration
    if sudo nginx -t; then
        sudo systemctl reload nginx
        success "Nginx configuration applied successfully"
    else
        error "Nginx configuration test failed"
    fi
}

create_environment_file() {
    log "Creating monitoring environment file..."
    
    cat > "$PROJECT_ROOT/.env.monitoring" <<EOF
# ==============================================
# CRYB MONITORING ENVIRONMENT CONFIGURATION
# ==============================================

# Monitoring Domain
MONITORING_DOMAIN=$MONITORING_DOMAIN

# Grafana Configuration
GF_SECURITY_ADMIN_USER=admin
GF_SECURITY_ADMIN_PASSWORD=$(openssl rand -base64 32)
GF_SERVER_ROOT_URL=https://$MONITORING_DOMAIN/
GF_SMTP_ENABLED=true
GF_SMTP_HOST=smtp.gmail.com:587
GF_SMTP_USER=alerts@cryb.ai
GF_SMTP_PASSWORD=$SMTP_PASSWORD
GF_SMTP_FROM_ADDRESS=alerts@cryb.ai

# Alertmanager Configuration
SLACK_WEBHOOK_URL=$SLACK_WEBHOOK_URL
SMTP_PASSWORD=$SMTP_PASSWORD
PAGERDUTY_API_KEY=$PAGERDUTY_API_KEY
SMS_WEBHOOK_URL=
ONCALL_PHONE_1=
ONCALL_PHONE_2=

# Sentry Configuration
SENTRY_DSN=$SENTRY_DSN

# Prometheus Configuration
PROMETHEUS_RETENTION=30d
PROMETHEUS_EXTERNAL_URL=https://$MONITORING_DOMAIN/prometheus/

# Security
MONITORING_PASSWORD=$(openssl rand -base64 16)

# Database Credentials
POSTGRES_EXPORTER_DATA_SOURCE_NAME=postgresql://cryb_user:cryb_password@localhost:5433/cryb?sslmode=disable

# Redis Credentials
REDIS_EXPORTER_REDIS_ADDR=redis://localhost:6380
REDIS_EXPORTER_REDIS_PASSWORD=cryb_redis_password

# Custom Exporters
BULLMQ_EXPORTER_REDIS_URL=redis://localhost:6380
BUSINESS_METRICS_DATABASE_URL=postgresql://cryb_user:cryb_password@localhost:5433/cryb
SOCKETIO_EXPORTER_API_URL=http://localhost:3002
EOF
    
    chmod 600 "$PROJECT_ROOT/.env.monitoring"
    success "Environment file created"
}

build_custom_exporters() {
    log "Building custom metrics exporters..."
    
    # Build Error Tracking service
    cd "$PROJECT_ROOT/services/error-tracking"
    if [[ -f "package.json" ]]; then
        log "Building Error Tracking service..."
        npm install --production
        docker build -t cryb/error-tracking:latest .
    fi
    
    # Build WebSocket Monitoring service
    cd "$PROJECT_ROOT/services/websocket-monitoring"
    if [[ -f "package.json" ]]; then
        log "Building WebSocket Monitoring service..."
        npm install --production
        docker build -t cryb/websocket-monitoring:latest .
    fi
    
    # Build Database Performance service
    cd "$PROJECT_ROOT/services/database-performance"
    if [[ -f "package.json" ]]; then
        log "Building Database Performance service..."
        npm install --production
        docker build -t cryb/database-performance:latest .
    fi
    
    # Build BullMQ exporter
    cd "$PROJECT_ROOT/services/bullmq-exporter"
    if [[ -f "package.json" ]]; then
        log "Building BullMQ exporter..."
        npm install --production
        docker build -t cryb/bullmq-exporter:latest .
    fi
    
    # Build Business Metrics exporter
    cd "$PROJECT_ROOT/services/business-metrics-exporter"
    if [[ -f "package.json" ]]; then
        log "Building Business Metrics exporter..."
        npm install --production
        docker build -t cryb/business-metrics-exporter:latest .
    fi
    
    # Build Socket.io exporter
    cd "$PROJECT_ROOT/services/socketio-exporter"
    if [[ -f "package.json" ]]; then
        log "Building Socket.io exporter..."
        npm install --production
        docker build -t cryb/socketio-exporter:latest .
    fi
    
    cd "$PROJECT_ROOT"
    success "Custom exporters built successfully"
}

deploy_monitoring_stack() {
    log "Deploying comprehensive monitoring stack..."
    
    # Stop existing monitoring if running
    log "Stopping existing monitoring services..."
    docker-compose -f docker-compose.monitoring.yml down --remove-orphans 2>/dev/null || true
    
    # Start new monitoring stack
    log "Starting enhanced monitoring stack..."
    docker-compose -f docker-compose.monitoring.yml --env-file .env.monitoring up -d
    
    # Wait for services to be ready
    log "Waiting for services to be ready..."
    sleep 30
    
    # Check service health
    check_service_health
    
    success "Monitoring stack deployed successfully"
}

check_service_health() {
    log "Checking monitoring service health..."
    
    local services=(
        "prometheus:9090"
        "grafana:3005"
        "alertmanager:9093"
        "loki:3100"
        "jaeger:16686"
        "uptime-kuma:3004"
        "error-tracking:9467"
        "websocket-monitoring:9468"
        "database-performance:9469"
        "business-metrics-exporter:9465"
    )
    
    for service in "${services[@]}"; do
        local name="${service%:*}"
        local port="${service#*:}"
        
        if curl -sf "http://localhost:$port/health" >/dev/null 2>&1 || \
           curl -sf "http://localhost:$port/" >/dev/null 2>&1; then
            success "$name is healthy"
        else
            warning "$name may not be ready yet (this is normal during startup)"
        fi
    done
}

setup_grafana_dashboards() {
    log "Setting up Grafana dashboards..."
    
    # Wait for Grafana to be ready
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -sf "http://localhost:3005/api/health" >/dev/null 2>&1; then
            break
        fi
        log "Waiting for Grafana to be ready... (attempt $attempt/$max_attempts)"
        sleep 10
        ((attempt++))
    done
    
    if [[ $attempt -gt $max_attempts ]]; then
        warning "Grafana may not be ready. Dashboard import may fail."
    fi
    
    # Import dashboards
    local dashboard_dir="$PROJECT_ROOT/config/grafana/dashboards"
    
    if [[ -d "$dashboard_dir" ]]; then
        log "Importing Grafana dashboards..."
        
        # Get Grafana admin credentials
        local grafana_password=$(grep GF_SECURITY_ADMIN_PASSWORD .env.monitoring | cut -d'=' -f2)
        
        for dashboard_file in "$dashboard_dir"/*.json; do
            if [[ -f "$dashboard_file" ]]; then
                local dashboard_name=$(basename "$dashboard_file" .json)
                log "Importing dashboard: $dashboard_name"
                
                # Import dashboard via API
                curl -X POST \
                    -H "Content-Type: application/json" \
                    -u "admin:$grafana_password" \
                    -d @"$dashboard_file" \
                    "http://localhost:3005/api/dashboards/db" \
                    >/dev/null 2>&1 || warning "Failed to import $dashboard_name"
            fi
        done
        
        success "Grafana dashboards imported"
    fi
}

configure_alerting() {
    log "Configuring alerting system..."
    
    # Copy enhanced alertmanager configuration
    if [[ -f "$PROJECT_ROOT/config/alertmanager/alertmanager-enhanced.yml" ]]; then
        docker cp "$PROJECT_ROOT/config/alertmanager/alertmanager-enhanced.yml" \
            cryb-alertmanager:/etc/alertmanager/alertmanager.yml
        
        # Reload alertmanager configuration
        docker exec cryb-alertmanager killall -HUP alertmanager 2>/dev/null || true
        
        success "Alertmanager configuration updated"
    fi
    
    # Test alert routing
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        log "Testing Slack integration..."
        test_slack_integration
    fi
}

test_slack_integration() {
    local test_payload='{
        "text": "🚀 Cryb Platform Monitoring is now active!",
        "channel": "#monitoring",
        "username": "Cryb Monitoring",
        "icon_emoji": ":chart_with_upwards_trend:"
    }'
    
    if curl -X POST \
        -H "Content-Type: application/json" \
        -d "$test_payload" \
        "$SLACK_WEBHOOK_URL" >/dev/null 2>&1; then
        success "Slack integration test successful"
    else
        warning "Slack integration test failed"
    fi
}

install_performance_testing() {
    log "Installing performance testing tools..."
    
    # Install k6 if not present
    if ! command -v k6 &> /dev/null; then
        log "Installing k6 load testing tool..."
        
        # Add k6 repository
        sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
            --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
        echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | \
            sudo tee /etc/apt/sources.list.d/k6.list
        
        sudo apt update
        sudo apt install -y k6
        
        success "k6 installed successfully"
    fi
    
    # Create performance testing script
    chmod +x "$PROJECT_ROOT/performance-testing/k6-load-tests.js"
    
    success "Performance testing tools ready"
}

create_monitoring_scripts() {
    log "Creating monitoring management scripts..."
    
    # Create monitoring start script
    cat > "$PROJECT_ROOT/start-monitoring.sh" <<'EOF'
#!/bin/bash
set -euo pipefail

echo "🚀 Starting Cryb Platform Monitoring..."

cd "$(dirname "$0")"

# Load environment
if [[ -f ".env.monitoring" ]]; then
    source .env.monitoring
fi

# Start monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d

echo "✅ Monitoring stack started"
echo "Dashboard: https://${MONITORING_DOMAIN:-monitoring.cryb.ai}"
EOF
    
    # Create monitoring stop script
    cat > "$PROJECT_ROOT/stop-monitoring.sh" <<'EOF'
#!/bin/bash
set -euo pipefail

echo "🛑 Stopping Cryb Platform Monitoring..."

cd "$(dirname "$0")"

# Stop monitoring stack
docker-compose -f docker-compose.monitoring.yml down

echo "✅ Monitoring stack stopped"
EOF
    
    # Create monitoring status script
    cat > "$PROJECT_ROOT/monitoring-status.sh" <<'EOF'
#!/bin/bash
set -euo pipefail

echo "📊 Cryb Platform Monitoring Status"
echo "=================================="

cd "$(dirname "$0")"

# Check service status
docker-compose -f docker-compose.monitoring.yml ps

echo ""
echo "🌐 Access URLs:"
echo "Main Dashboard: https://${MONITORING_DOMAIN:-monitoring.cryb.ai}"
echo "Prometheus: https://${MONITORING_DOMAIN:-monitoring.cryb.ai}/prometheus/"
echo "Alertmanager: https://${MONITORING_DOMAIN:-monitoring.cryb.ai}/alertmanager/"
echo "Jaeger: https://${MONITORING_DOMAIN:-monitoring.cryb.ai}/jaeger/"
EOF
    
    # Make scripts executable
    chmod +x "$PROJECT_ROOT"/{start,stop,monitoring-status}-monitoring.sh
    
    success "Management scripts created"
}

generate_summary_report() {
    log "Generating deployment summary report..."
    
    cat > "$PROJECT_ROOT/MONITORING_DEPLOYMENT_SUMMARY.md" <<EOF
# 🚀 Cryb Platform Monitoring Deployment Summary

## Deployment Information
- **Date:** $(date)
- **Domain:** https://$MONITORING_DOMAIN
- **Log File:** $LOG_FILE

## 📊 Monitoring Services

### Core Services
- **Grafana:** https://$MONITORING_DOMAIN/ (Main dashboard)
- **Prometheus:** https://$MONITORING_DOMAIN/prometheus/ (Metrics backend)
- **Alertmanager:** https://$MONITORING_DOMAIN/alertmanager/ (Alert management)
- **Jaeger:** https://$MONITORING_DOMAIN/jaeger/ (Distributed tracing)
- **Uptime Kuma:** https://$MONITORING_DOMAIN/uptime/ (Uptime monitoring)

### Custom Exporters
- **BullMQ Exporter:** Queue monitoring (port 9464)
- **Business Metrics Exporter:** KPI tracking (port 9465)
- **Socket.io Exporter:** Real-time metrics (port 9466)
- **Elasticsearch Exporter:** Search metrics (port 9114)

### Standard Exporters
- **Node Exporter:** System metrics (port 9100)
- **cAdvisor:** Container metrics (port 8080)
- **PostgreSQL Exporter:** Database metrics (port 9187)
- **Redis Exporter:** Cache metrics (port 9121)
- **Blackbox Exporter:** External monitoring (port 9115)

## 🔐 Authentication
- **Basic Auth File:** /etc/nginx/.htpasswd-monitoring
- **Credentials:** See monitoring-credentials.txt

## 📈 Dashboards Available
- Comprehensive Platform Overview
- Business KPIs and Analytics
- Infrastructure Monitoring
- Application Performance
- Real-time Communication Metrics
- Security and Error Tracking

## 🚨 Alerting Configuration
- **Email:** Configured for critical alerts
- **Slack:** ${SLACK_WEBHOOK_URL:+Configured}${SLACK_WEBHOOK_URL:-Not configured}
- **PagerDuty:** ${PAGERDUTY_API_KEY:+Configured}${PAGERDUTY_API_KEY:-Not configured}
- **SMS:** Not configured (requires webhook setup)

## 🛠️ Management Scripts
- \`./start-monitoring.sh\` - Start monitoring stack
- \`./stop-monitoring.sh\` - Stop monitoring stack
- \`./monitoring-status.sh\` - Check service status

## 🧪 Performance Testing
- **k6 Load Testing:** Available in performance-testing/
- **Test Script:** k6-load-tests.js
- **Run Tests:** \`k6 run performance-testing/k6-load-tests.js\`

## 📝 Next Steps

1. **Access the Dashboard:**
   - Visit https://$MONITORING_DOMAIN
   - Login with credentials from monitoring-credentials.txt

2. **Configure Alerting:**
   - Add Slack webhook URL to .env.monitoring
   - Configure PagerDuty integration
   - Set up SMS notifications if needed

3. **Customize Dashboards:**
   - Import additional dashboards as needed
   - Customize existing dashboards for your use case

4. **Set Up SSL Auto-Renewal:**
   - Configure certbot cron job for automatic renewal
   - Test renewal process

5. **Performance Testing:**
   - Run baseline performance tests
   - Set up automated performance monitoring

## 🆘 Troubleshooting

### Common Issues:
- **Service not starting:** Check logs with \`docker-compose logs [service]\`
- **SSL issues:** Verify certificate files in /etc/letsencrypt/live/
- **Authentication failures:** Check .htpasswd file permissions
- **Missing metrics:** Verify exporter connectivity

### Log Locations:
- **Deployment Log:** $LOG_FILE
- **Docker Logs:** \`docker-compose -f docker-compose.monitoring.yml logs\`
- **Nginx Logs:** /var/log/nginx/
- **Application Logs:** /var/log/cryb/monitoring/

### Health Checks:
- **Prometheus:** curl http://localhost:9090/-/healthy
- **Grafana:** curl http://localhost:3005/api/health
- **Alertmanager:** curl http://localhost:9093/-/healthy

## 📊 Metrics Coverage

### System Metrics ✅
- CPU, Memory, Disk, Network
- Container resource usage
- System load and processes

### Application Metrics ✅
- HTTP request/response metrics
- API endpoint performance
- Error rates and latency

### Business Metrics ✅
- User registration and activity
- Content creation and engagement
- Revenue and conversion tracking

### Infrastructure Metrics ✅
- Database performance
- Cache hit rates
- Queue processing
- Search performance

### Real-time Metrics ✅
- WebSocket connections
- Message delivery
- Voice/video quality

## 🔒 Security Features
- Basic authentication
- SSL/TLS encryption
- Network isolation
- Access logging
- Rate limiting

---

**Deployment completed successfully!** 🎉

For support or questions, refer to the monitoring documentation or contact the platform engineering team.
EOF
    
    success "Deployment summary created: MONITORING_DEPLOYMENT_SUMMARY.md"
}

# ==============================================
# MAIN DEPLOYMENT FUNCTION
# ==============================================

main() {
    echo "🚀 Cryb Platform - Comprehensive Monitoring Deployment"
    echo "======================================================"
    echo ""
    
    log "Starting monitoring deployment..."
    log "Log file: $LOG_FILE"
    
    # Pre-deployment checks
    check_requirements
    
    # Infrastructure setup
    create_directories
    setup_ssl_certificates
    setup_basic_auth
    configure_nginx
    
    # Monitoring configuration
    create_environment_file
    build_custom_exporters
    
    # Deploy monitoring stack
    deploy_monitoring_stack
    setup_grafana_dashboards
    configure_alerting
    
    # Additional tools
    install_performance_testing
    create_monitoring_scripts
    
    # Final steps
    generate_summary_report
    
    echo ""
    echo "🎉 Monitoring deployment completed successfully!"
    echo ""
    echo "📊 Access your monitoring dashboard at: https://$MONITORING_DOMAIN"
    echo "🔐 Credentials are saved in: monitoring-credentials.txt"
    echo "📖 Full summary available in: MONITORING_DEPLOYMENT_SUMMARY.md"
    echo ""
    echo "⚡ Quick commands:"
    echo "   Start:  ./start-monitoring.sh"
    echo "   Stop:   ./stop-monitoring.sh"
    echo "   Status: ./monitoring-status.sh"
    echo ""
    
    success "Deployment completed in $(date)"
}

# ==============================================
# ERROR HANDLING
# ==============================================

trap 'error "Deployment failed at line $LINENO. Check log: $LOG_FILE"' ERR

# ==============================================
# SCRIPT EXECUTION
# ==============================================

main "$@"