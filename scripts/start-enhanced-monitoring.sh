#!/bin/bash

# ==============================================
# CRYB PLATFORM - ENHANCED MONITORING SETUP
# ==============================================
# Comprehensive monitoring deployment script
# Includes: Prometheus, Grafana, Sentry, Alerting
# ==============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MONITORING_DATA_DIR="/opt/cryb"

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

check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    log_success "Docker and Docker Compose are available"
}

create_monitoring_directories() {
    log_info "Creating monitoring data directories..."
    
    sudo mkdir -p "$MONITORING_DATA_DIR"/{prometheus,grafana,loki,alertmanager,uptime-kuma}
    sudo chown -R 65534:65534 "$MONITORING_DATA_DIR/prometheus"  # nobody:nogroup
    sudo chown -R 472:472 "$MONITORING_DATA_DIR/grafana"         # grafana:grafana
    sudo chown -R 10001:10001 "$MONITORING_DATA_DIR/loki"        # loki:loki
    sudo chown -R 65534:65534 "$MONITORING_DATA_DIR/alertmanager" # nobody:nogroup
    sudo chown -R 1000:1000 "$MONITORING_DATA_DIR/uptime-kuma"   # node:node
    
    log_success "Monitoring directories created and permissions set"
}

validate_configuration() {
    log_info "Validating monitoring configuration..."
    
    # Check if Prometheus config exists
    if [[ ! -f "$PROJECT_ROOT/config/prometheus/prometheus.yml" ]]; then
        log_error "Prometheus configuration not found at $PROJECT_ROOT/config/prometheus/prometheus.yml"
        exit 1
    fi
    
    # Check if Grafana config exists
    if [[ ! -d "$PROJECT_ROOT/config/grafana" ]]; then
        log_error "Grafana configuration directory not found at $PROJECT_ROOT/config/grafana"
        exit 1
    fi
    
    # Check if Alertmanager config exists
    if [[ ! -f "$PROJECT_ROOT/config/alertmanager/alertmanager.yml" ]]; then
        log_error "Alertmanager configuration not found at $PROJECT_ROOT/config/alertmanager/alertmanager.yml"
        exit 1
    fi
    
    log_success "Configuration files validated"
}

setup_environment() {
    log_info "Setting up monitoring environment..."
    
    # Create .env file for monitoring if it doesn't exist
    if [[ ! -f "$PROJECT_ROOT/.env.monitoring" ]]; then
        cat > "$PROJECT_ROOT/.env.monitoring" << EOF
# CRYB Platform - Enhanced Monitoring Environment
COMPOSE_PROJECT_NAME=cryb-monitoring
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=cryb_monitoring_admin_2024
PROMETHEUS_RETENTION=30d
LOKI_RETENTION=720h
ALERT_EMAIL=alerts@cryb.ai
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
EOF
        log_success "Created .env.monitoring file"
    else
        log_info "Using existing .env.monitoring file"
    fi
}

deploy_monitoring_stack() {
    log_info "Deploying monitoring stack..."
    
    cd "$PROJECT_ROOT"
    
    # Stop any existing monitoring services
    log_info "Stopping existing monitoring services..."
    docker-compose -f docker-compose.monitoring.yml down 2>/dev/null || true
    
    # Pull latest images
    log_info "Pulling latest monitoring images..."
    docker-compose -f docker-compose.monitoring.yml pull
    
    # Start monitoring services
    log_info "Starting monitoring services..."
    docker-compose -f docker-compose.monitoring.yml up -d
    
    log_success "Monitoring stack deployed"
}

wait_for_services() {
    log_info "Waiting for services to be ready..."
    
    # Wait for Prometheus
    log_info "Waiting for Prometheus..."
    timeout=60
    while ! curl -sf http://localhost:9090/-/ready > /dev/null 2>&1; do
        sleep 2
        timeout=$((timeout-2))
        if [[ $timeout -le 0 ]]; then
            log_error "Prometheus failed to start within 60 seconds"
            exit 1
        fi
    done
    log_success "Prometheus is ready"
    
    # Wait for Grafana
    log_info "Waiting for Grafana..."
    timeout=60
    while ! curl -sf http://localhost:3005/api/health > /dev/null 2>&1; do
        sleep 2
        timeout=$((timeout-2))
        if [[ $timeout -le 0 ]]; then
            log_error "Grafana failed to start within 60 seconds"
            exit 1
        fi
    done
    log_success "Grafana is ready"
    
    # Wait for Alertmanager
    log_info "Waiting for Alertmanager..."
    timeout=30
    while ! curl -sf http://localhost:9093/-/healthy > /dev/null 2>&1; do
        sleep 2
        timeout=$((timeout-2))
        if [[ $timeout -le 0 ]]; then
            log_error "Alertmanager failed to start within 30 seconds"
            exit 1
        fi
    done
    log_success "Alertmanager is ready"
}

configure_grafana_dashboards() {
    log_info "Configuring Grafana dashboards..."
    
    # The dashboards are already provisioned via docker-compose volumes
    # But we can verify they're loaded correctly
    sleep 10  # Give Grafana time to load dashboards
    
    # Check if dashboards are loaded
    dashboard_count=$(curl -s -H "Content-Type: application/json" \
        http://admin:cryb_monitoring_admin_2024@localhost:3005/api/search?query=cryb \
        | jq length 2>/dev/null || echo "0")
    
    if [[ "$dashboard_count" -gt 0 ]]; then
        log_success "Grafana dashboards loaded successfully ($dashboard_count dashboards)"
    else
        log_warning "Grafana dashboards may not be loaded yet - check manually"
    fi
}

test_alerting() {
    log_info "Testing alerting configuration..."
    
    # Test Alertmanager is receiving rules from Prometheus
    alert_rules=$(curl -s http://localhost:9090/api/v1/rules | jq '.data.groups | length' 2>/dev/null || echo "0")
    
    if [[ "$alert_rules" -gt 0 ]]; then
        log_success "Alert rules loaded successfully ($alert_rules rule groups)"
    else
        log_warning "No alert rules found - check Prometheus configuration"
    fi
    
    # Test Alertmanager configuration
    if curl -sf http://localhost:9093/-/healthy > /dev/null 2>&1; then
        log_success "Alertmanager is healthy"
    else
        log_warning "Alertmanager health check failed"
    fi
}

display_access_info() {
    echo ""
    echo "======================================================================"
    echo "               CRYB PLATFORM - ENHANCED MONITORING"
    echo "======================================================================"
    echo ""
    echo "🎯 Services are now running and accessible at:"
    echo ""
    echo "📊 Grafana Dashboard:     http://localhost:3005"
    echo "   Username: admin"
    echo "   Password: cryb_monitoring_admin_2024"
    echo ""
    echo "🔍 Prometheus Metrics:    http://localhost:9090"
    echo "🚨 Alertmanager:         http://localhost:9093"
    echo "📝 Loki Logs:           http://localhost:3100"
    echo "🔧 Uptime Kuma:         http://localhost:3004"
    echo ""
    echo "📈 API Metrics Endpoint: http://localhost:3002/metrics"
    echo "❤️  Health Check:        http://localhost:3002/health/monitoring"
    echo ""
    echo "======================================================================"
    echo "                        DASHBOARD LINKS"
    echo "======================================================================"
    echo ""
    echo "🎯 Main Dashboard:       http://localhost:3005/d/cryb-comprehensive-monitoring"
    echo "📊 API Performance:     http://localhost:3005/d/cryb-api-performance"
    echo "👥 Business KPIs:       http://localhost:3005/d/cryb-business-kpis"
    echo "🏗️  Infrastructure:      http://localhost:3005/d/cryb-infrastructure-overview"
    echo "🔒 Security:            http://localhost:3005/d/cryb-security-monitoring"
    echo ""
    echo "======================================================================"
    echo ""
}

# Main execution
main() {
    echo ""
    echo "🚀 Starting CRYB Enhanced Monitoring Setup..."
    echo ""
    
    check_docker
    create_monitoring_directories
    validate_configuration
    setup_environment
    deploy_monitoring_stack
    wait_for_services
    configure_grafana_dashboards
    test_alerting
    display_access_info
    
    log_success "Enhanced monitoring setup completed successfully! 🎉"
    echo ""
    echo "💡 Tip: Check the logs with:"
    echo "   docker-compose -f docker-compose.monitoring.yml logs -f"
    echo ""
}

# Run main function
main "$@"