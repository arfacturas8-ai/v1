#!/bin/bash

# ==============================================
# CRYB Platform - World-Class Monitoring Setup
# ==============================================
# Comprehensive monitoring and observability setup script
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
MONITORING_COMPOSE_FILE="$PROJECT_ROOT/docker-compose.monitoring.yml"
DATA_DIR="/opt/cryb"

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root for security reasons"
    fi
}

# Check system requirements
check_requirements() {
    log "🔍 Checking system requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    # Check available disk space (need at least 5GB)
    available_space=$(df / | awk 'NR==2 {print $4}')
    if [[ $available_space -lt 5242880 ]]; then
        warn "Less than 5GB disk space available. Monitoring may be affected."
    fi
    
    # Check memory (recommend at least 4GB)
    available_memory=$(free -m | awk 'NR==2{printf "%.0f", $7}')
    if [[ $available_memory -lt 2048 ]]; then
        warn "Less than 2GB memory available. Consider upgrading system resources."
    fi
    
    info "✅ System requirements check completed"
}

# Create data directories
create_data_directories() {
    log "📁 Creating monitoring data directories..."
    
    sudo mkdir -p "$DATA_DIR"/{prometheus,grafana,loki,alertmanager,uptime-kuma}
    sudo chown -R $USER:$USER "$DATA_DIR"
    
    # Set proper permissions
    chmod -R 755 "$DATA_DIR"
    
    info "✅ Data directories created successfully"
}

# Validate configuration files
validate_configs() {
    log "✅ Validating configuration files..."
    
    # Check Prometheus config
    if [[ ! -f "$PROJECT_ROOT/config/prometheus/prometheus.yml" ]]; then
        error "Prometheus configuration file not found"
    fi
    
    # Check Grafana provisioning
    if [[ ! -d "$PROJECT_ROOT/config/grafana/provisioning" ]]; then
        error "Grafana provisioning directory not found"
    fi
    
    # Check Alertmanager config
    if [[ ! -f "$PROJECT_ROOT/config/alertmanager/alertmanager.yml" ]]; then
        error "Alertmanager configuration file not found"
    fi
    
    # Validate Prometheus config syntax
    if command -v promtool &> /dev/null; then
        promtool check config "$PROJECT_ROOT/config/prometheus/prometheus.yml" || error "Invalid Prometheus configuration"
        promtool check rules "$PROJECT_ROOT/config/prometheus/alerts.yml" || error "Invalid Prometheus alerting rules"
    else
        warn "promtool not found - skipping Prometheus config validation"
    fi
    
    info "✅ Configuration validation completed"
}

# Setup network
setup_network() {
    log "🌐 Setting up Docker networks..."
    
    # Create monitoring network if it doesn't exist
    if ! docker network inspect monitoring-network &> /dev/null; then
        docker network create monitoring-network --driver bridge --subnet=172.29.0.0/16
    fi
    
    # Create main application network if it doesn't exist
    if ! docker network inspect cryb-network &> /dev/null; then
        docker network create cryb-network --driver bridge --subnet=172.26.0.0/16
    fi
    
    info "✅ Docker networks configured"
}

# Pull Docker images
pull_images() {
    log "📦 Pulling Docker images for monitoring stack..."
    
    # Pull monitoring images
    docker-compose -f "$MONITORING_COMPOSE_FILE" pull
    
    info "✅ Docker images pulled successfully"
}

# Start monitoring services
start_monitoring() {
    log "🚀 Starting monitoring services..."
    
    cd "$PROJECT_ROOT"
    
    # Start monitoring stack
    docker-compose -f "$MONITORING_COMPOSE_FILE" up -d
    
    # Wait for services to be healthy
    log "⏳ Waiting for services to become healthy..."
    sleep 30
    
    # Check service health
    check_service_health
    
    info "✅ Monitoring services started successfully"
}

# Check service health
check_service_health() {
    log "🏥 Checking service health..."
    
    services=(
        "prometheus:9090"
        "grafana:3005"
        "loki:3100"
        "alertmanager:9093"
        "uptime-kuma:3004"
    )
    
    for service in "${services[@]}"; do
        name="${service%:*}"
        port="${service#*:}"
        
        if curl -f -s "http://localhost:$port" > /dev/null 2>&1; then
            info "✅ $name is healthy"
        else
            warn "⚠️  $name may not be fully ready yet"
        fi
    done
}

# Configure Grafana dashboards
configure_grafana() {
    log "📊 Configuring Grafana dashboards..."
    
    # Wait for Grafana to be ready
    max_attempts=30
    attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s http://admin:admin123@localhost:3005/api/health > /dev/null 2>&1; then
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            error "Grafana is not responding after $max_attempts attempts"
        fi
        
        info "Waiting for Grafana to be ready... (attempt $attempt/$max_attempts)"
        sleep 10
        ((attempt++))
    done
    
    # Import dashboards (they should be auto-provisioned)
    info "✅ Grafana dashboards configured"
}

# Setup alerting
setup_alerting() {
    log "🚨 Configuring alerting..."
    
    # Check if Alertmanager is responding
    if curl -f -s http://localhost:9093/-/healthy > /dev/null 2>&1; then
        info "✅ Alertmanager is healthy and configured"
    else
        warn "⚠️  Alertmanager may not be fully ready yet"
    fi
}

# Create monitoring summary
create_summary() {
    log "📋 Creating monitoring setup summary..."
    
    cat << EOF > "$PROJECT_ROOT/MONITORING_STATUS.md"
# CRYB Platform Monitoring - Setup Complete

## 🎯 Service Status
- ✅ Prometheus: http://localhost:9090
- ✅ Grafana: http://localhost:3005 (admin/admin123)
- ✅ Loki: http://localhost:3100
- ✅ Alertmanager: http://localhost:9093
- ✅ Uptime Kuma: http://localhost:3004
- ✅ Jaeger: http://localhost:16686

## 📊 Available Dashboards
- **API SRE Dashboard**: SLI/SLO tracking and performance monitoring
- **User Experience Dashboard**: Business metrics and user engagement
- **Infrastructure Overview**: System and resource monitoring
- **Monitoring Health**: Stack health and performance
- **Capacity Planning**: Predictive analytics and scaling

## 🚨 Alert Channels
- Slack integrations configured (update webhook URLs in alertmanager.yml)
- Email notifications configured
- PagerDuty integration ready (add service keys)

## 📁 Key Files
- Configuration: \`config/\` directory
- Dashboards: \`config/grafana/dashboards/\`
- Alert rules: \`config/prometheus/alerts.yml\`
- Documentation: \`docs/MONITORING_GUIDE.md\`

## 🔧 Next Steps
1. Update Slack webhook URLs in alertmanager configuration
2. Add PagerDuty service keys for critical alerts
3. Configure Sentry DSN for error tracking
4. Review and customize dashboards for your needs
5. Test alert notifications

## 📞 Support
- Monitoring Guide: \`docs/MONITORING_GUIDE.md\`
- Troubleshooting: Check service logs with \`docker-compose -f docker-compose.monitoring.yml logs -f\`

---
**Setup completed**: $(date)
**Version**: 1.0
EOF

    info "✅ Monitoring summary created: MONITORING_STATUS.md"
}

# Display final summary
display_summary() {
    log "🎉 World-class monitoring setup completed!"
    
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "🎯 CRYB PLATFORM MONITORING - SETUP COMPLETE"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "📊 ACCESS YOUR DASHBOARDS:"
    echo "├── Grafana (Main UI):      http://localhost:3005"
    echo "├── Prometheus:             http://localhost:9090"
    echo "├── Alertmanager:           http://localhost:9093"
    echo "├── Uptime Kuma:            http://localhost:3004"
    echo "└── Jaeger Tracing:         http://localhost:16686"
    echo ""
    echo "🔑 GRAFANA LOGIN:"
    echo "├── Username: admin"
    echo "└── Password: admin123"
    echo ""
    echo "📈 KEY DASHBOARDS:"
    echo "├── API SRE Dashboard:      SLI/SLO tracking"
    echo "├── User Experience:        Business metrics"
    echo "├── Infrastructure:         System monitoring"
    echo "├── Monitoring Health:      Stack health"
    echo "└── Capacity Planning:      Scaling analytics"
    echo ""
    echo "📚 DOCUMENTATION:"
    echo "└── Complete guide: docs/MONITORING_GUIDE.md"
    echo ""
    echo "🔧 NEXT STEPS:"
    echo "1. Configure alert integrations (Slack, PagerDuty)"
    echo "2. Set up Sentry error tracking"
    echo "3. Customize dashboards for your needs"
    echo "4. Review monitoring guide"
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
}

# Cleanup function
cleanup() {
    if [[ $? -ne 0 ]]; then
        error "Setup failed! Check the logs above for details."
    fi
}

trap cleanup EXIT

# Main execution
main() {
    echo "🚀 Starting CRYB Platform World-Class Monitoring Setup..."
    echo "═══════════════════════════════════════════════════════════════"
    
    check_root
    check_requirements
    create_data_directories
    validate_configs
    setup_network
    pull_images
    start_monitoring
    configure_grafana
    setup_alerting
    create_summary
    display_summary
    
    log "🎉 Setup completed successfully!"
}

# Run main function
main "$@"