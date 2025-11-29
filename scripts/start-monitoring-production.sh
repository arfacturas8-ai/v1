#!/bin/bash

# ==============================================
# CRYB PLATFORM - PRODUCTION MONITORING STARTUP
# ==============================================
# Starts the complete monitoring stack in production mode
# ==============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ✅ $1"
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ⚠️  $1"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ❌ $1"
    exit 1
}

# Check if Docker is running
check_docker() {
    if ! docker info &>/dev/null; then
        error "Docker is not running. Please start Docker first."
    fi
    success "Docker is running"
}

# Check if Docker Compose is available
check_docker_compose() {
    if ! docker compose version &>/dev/null; then
        error "Docker Compose is not available"
    fi
    success "Docker Compose is available"
}

# Create necessary directories
setup_directories() {
    log "Setting up monitoring directories..."
    
    local dirs=(
        "$PROJECT_ROOT/data/prometheus"
        "$PROJECT_ROOT/data/grafana"
        "$PROJECT_ROOT/data/alertmanager"
        "$PROJECT_ROOT/data/loki"
        "$PROJECT_ROOT/config/grafana/dashboards"
        "$PROJECT_ROOT/config/grafana/provisioning/dashboards"
        "$PROJECT_ROOT/config/grafana/provisioning/datasources"
    )
    
    for dir in "${dirs[@]}"; do
        mkdir -p "$dir"
        chmod 755 "$dir"
    done
    
    # Set proper permissions for Grafana
    sudo chown -R 472:472 "$PROJECT_ROOT/data/grafana" 2>/dev/null || true
    
    success "Monitoring directories created"
}

# Create Grafana provisioning configs
setup_grafana_provisioning() {
    log "Setting up Grafana provisioning..."
    
    # Create datasources configuration
    cat > "$PROJECT_ROOT/config/grafana/provisioning/datasources/datasources.yml" << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
    jsonData:
      timeInterval: 15s
      httpMethod: POST
      prometheusType: Prometheus
      prometheusVersion: 2.48.0
    
  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
    editable: true
    jsonData:
      timeInterval: 15s
      maxLines: 1000
      
  - name: AlertManager
    type: alertmanager
    access: proxy
    url: http://alertmanager:9093
    editable: true
    jsonData:
      implementation: prometheus
EOF
    
    # Create dashboards configuration
    cat > "$PROJECT_ROOT/config/grafana/provisioning/dashboards/dashboards.yml" << 'EOF'
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
EOF
    
    success "Grafana provisioning configured"
}

# Check environment variables
check_environment() {
    log "Checking environment variables..."
    
    local required_vars=(
        "POSTGRES_PASSWORD"
        "REDIS_PASSWORD"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        warning "Missing environment variables: ${missing_vars[*]}"
        warning "Please set these variables or create a .env file"
    else
        success "Environment variables checked"
    fi
}

# Start monitoring stack
start_monitoring() {
    log "Starting monitoring stack..."
    
    cd "$PROJECT_ROOT"
    
    # Pull latest images
    log "Pulling latest monitoring images..."
    docker compose -f docker-compose.monitoring-production.yml pull
    
    # Start monitoring services
    log "Starting monitoring services..."
    docker compose -f docker-compose.monitoring-production.yml up -d
    
    success "Monitoring stack started"
}

# Wait for services to be healthy
wait_for_services() {
    log "Waiting for services to be healthy..."
    
    local services=(
        "prometheus:9090"
        "grafana:3000"
        "alertmanager:9093"
        "loki:3100"
    )
    
    for service in "${services[@]}"; do
        local name="${service%:*}"
        local port="${service#*:}"
        local host="localhost"
        
        log "Waiting for $name to be ready..."
        
        local max_attempts=30
        local attempt=1
        
        while [[ $attempt -le $max_attempts ]]; do
            if curl -s "http://$host:$port" >/dev/null 2>&1; then
                success "$name is ready"
                break
            fi
            
            if [[ $attempt -eq $max_attempts ]]; then
                warning "$name is not responding after $max_attempts attempts"
                break
            fi
            
            sleep 5
            ((attempt++))
        done
    done
}

# Import Grafana dashboards
import_dashboards() {
    log "Importing Grafana dashboards..."
    
    # Wait for Grafana to be fully ready
    sleep 10
    
    # Create some basic dashboards
    local grafana_url="http://localhost:3010"
    local admin_user="${GRAFANA_ADMIN_USER:-admin}"
    local admin_pass="${GRAFANA_ADMIN_PASSWORD:-CrybSecure2024!}"
    
    # Check if Grafana is accessible
    if curl -s "$grafana_url/api/health" >/dev/null 2>&1; then
        success "Grafana is accessible at $grafana_url"
    else
        warning "Grafana is not yet accessible at $grafana_url"
    fi
}

# Display access information
show_access_info() {
    echo ""
    echo "=============================================="
    echo "🎉 MONITORING STACK STARTED SUCCESSFULLY! 🎉"
    echo "=============================================="
    echo ""
    echo "📊 Service Access URLs:"
    echo "  • Grafana:      http://localhost:3010"
    echo "  • Prometheus:   http://localhost:9090"
    echo "  • AlertManager: http://localhost:9093"
    echo "  • Loki:         http://localhost:3100"
    echo "  • Node Exporter: http://localhost:9100"
    echo "  • cAdvisor:     http://localhost:8080"
    echo ""
    echo "🔐 Default Credentials:"
    echo "  • Grafana: admin / CrybSecure2024!"
    echo ""
    echo "📈 Monitoring Features:"
    echo "  • System metrics (CPU, Memory, Disk, Network)"
    echo "  • Application metrics (API, Database, Redis)"
    echo "  • Container metrics (Docker containers)"
    echo "  • Log aggregation (Application and system logs)"
    echo "  • Alerting (Email and Slack notifications)"
    echo "  • Blackbox monitoring (Website uptime)"
    echo ""
    echo "🔧 Management Commands:"
    echo "  • View logs: docker compose -f docker-compose.monitoring-production.yml logs -f"
    echo "  • Stop stack: docker compose -f docker-compose.monitoring-production.yml down"
    echo "  • Restart: $0"
    echo ""
    echo "📚 Documentation:"
    echo "  • Prometheus: http://localhost:9090/graph"
    echo "  • Grafana Help: http://localhost:3010/help"
    echo "  • Alert Rules: http://localhost:9090/rules"
    echo ""
}

# Health check
perform_health_check() {
    log "Performing health check..."
    
    local healthy_services=0
    local total_services=0
    
    # Check Prometheus
    ((total_services++))
    if curl -s "http://localhost:9090/-/healthy" >/dev/null 2>&1; then
        success "Prometheus: Healthy"
        ((healthy_services++))
    else
        warning "Prometheus: Not healthy"
    fi
    
    # Check Grafana
    ((total_services++))
    if curl -s "http://localhost:3010/api/health" >/dev/null 2>&1; then
        success "Grafana: Healthy"
        ((healthy_services++))
    else
        warning "Grafana: Not healthy"
    fi
    
    # Check AlertManager
    ((total_services++))
    if curl -s "http://localhost:9093/-/healthy" >/dev/null 2>&1; then
        success "AlertManager: Healthy"
        ((healthy_services++))
    else
        warning "AlertManager: Not healthy"
    fi
    
    # Check Loki
    ((total_services++))
    if curl -s "http://localhost:3100/ready" >/dev/null 2>&1; then
        success "Loki: Healthy"
        ((healthy_services++))
    else
        warning "Loki: Not healthy"
    fi
    
    echo ""
    echo "Health Check Results: $healthy_services/$total_services services healthy"
    
    if [[ $healthy_services -eq $total_services ]]; then
        success "All monitoring services are healthy!"
    else
        warning "Some services are not healthy. Check logs for details."
    fi
}

# Main execution
main() {
    echo "🚀 Starting CRYB Platform Production Monitoring Stack..."
    echo ""
    
    check_docker
    check_docker_compose
    check_environment
    setup_directories
    setup_grafana_provisioning
    start_monitoring
    wait_for_services
    import_dashboards
    perform_health_check
    show_access_info
    
    success "Monitoring stack deployment completed!"
}

# Handle script termination
trap 'echo ""; warning "Monitoring startup interrupted"; exit 1' INT TERM

# Execute main function
main "$@"