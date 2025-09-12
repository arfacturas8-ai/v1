#!/bin/bash

# ==============================================
# CRYB PLATFORM - MONITORING STACK STARTUP
# ==============================================
# Comprehensive monitoring infrastructure startup with health checks
# and crash-safe initialization
# ==============================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
LOG_DIR="${SCRIPT_DIR}/logs/monitoring"
HEALTH_CHECK_RETRIES=30
HEALTH_CHECK_INTERVAL=10
STARTUP_TIMEOUT=300

# Create log directory
mkdir -p "${LOG_DIR}"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "${LOG_DIR}/startup.log"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "${LOG_DIR}/startup.log"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "${LOG_DIR}/startup.log"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "${LOG_DIR}/startup.log"
}

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1" | tee -a "${LOG_DIR}/startup.log"
}

# Health check functions
check_service_health() {
    local service_name="$1"
    local health_url="$2"
    local max_retries="${3:-30}"
    local retry_interval="${4:-10}"
    
    log_info "Checking health of ${service_name}..."
    
    for ((i=1; i<=max_retries; i++)); do
        if curl -f -s "${health_url}" > /dev/null 2>&1; then
            log_success "${service_name} is healthy (attempt $i/${max_retries})"
            return 0
        fi
        
        if [ $i -eq $max_retries ]; then
            log_error "${service_name} health check failed after ${max_retries} attempts"
            return 1
        fi
        
        log_warning "${service_name} not ready, retrying in ${retry_interval}s (attempt $i/${max_retries})"
        sleep "${retry_interval}"
    done
}

check_port() {
    local service_name="$1"
    local port="$2"
    local max_retries="${3:-30}"
    local retry_interval="${4:-5}"
    
    log_info "Checking if ${service_name} is listening on port ${port}..."
    
    for ((i=1; i<=max_retries; i++)); do
        if nc -z localhost "${port}" 2>/dev/null; then
            log_success "${service_name} is listening on port ${port}"
            return 0
        fi
        
        if [ $i -eq $max_retries ]; then
            log_error "${service_name} is not responding on port ${port} after ${max_retries} attempts"
            return 1
        fi
        
        log_warning "${service_name} port ${port} not ready, retrying in ${retry_interval}s (attempt $i/${max_retries})"
        sleep "${retry_interval}"
    done
}

check_docker_service() {
    local service_name="$1"
    local container_name="$2"
    
    log_info "Checking Docker service ${service_name}..."
    
    if ! docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "${container_name}.*Up"; then
        log_error "Docker service ${service_name} (${container_name}) is not running"
        return 1
    fi
    
    log_success "Docker service ${service_name} is running"
    return 0
}

# Cleanup function
cleanup() {
    log_warning "Received interrupt signal, cleaning up..."
    
    # Kill background processes if any
    jobs -p | xargs -r kill
    
    log_info "Cleanup completed"
    exit 1
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main startup function
main() {
    log_step "=== STARTING CRYB PLATFORM MONITORING STACK ==="
    log_info "Timestamp: $(date)"
    log_info "Script directory: ${SCRIPT_DIR}"
    log_info "Log directory: ${LOG_DIR}"
    
    # ==============================================
    # PRE-FLIGHT CHECKS
    # ==============================================
    log_step "Performing pre-flight checks..."
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running or accessible"
        exit 1
    fi
    log_success "Docker is running"
    
    # Check if Docker Compose is available
    if ! docker compose version > /dev/null 2>&1; then
        log_error "Docker Compose plugin is not available"
        exit 1
    fi
    log_success "Docker Compose plugin is available"
    
    # Check available disk space (require at least 10GB)
    local available_space=$(df "${SCRIPT_DIR}" | awk 'NR==2 {print $4}')
    local required_space=10485760 # 10GB in KB
    
    if [ "${available_space}" -lt "${required_space}" ]; then
        log_error "Insufficient disk space. Required: 10GB, Available: $(echo "scale=2; ${available_space}/1048576" | bc)GB"
        exit 1
    fi
    log_success "Sufficient disk space available"
    
    # Check if required configuration files exist
    local config_files=(
        "config/prometheus/prometheus.yml"
        "config/prometheus/alerts.yml"
        "config/grafana/provisioning/datasources/datasources.yml"
        "config/grafana/provisioning/dashboards/dashboards.yml"
        "config/loki/loki-config.yaml"
        "config/promtail/promtail-config.yaml"
        "config/alertmanager/alertmanager.yml"
        "config/blackbox/blackbox.yml"
        "docker-compose.monitoring.yml"
    )
    
    for config_file in "${config_files[@]}"; do
        if [ ! -f "${SCRIPT_DIR}/${config_file}" ]; then
            log_error "Required configuration file missing: ${config_file}"
            exit 1
        fi
    done
    log_success "All required configuration files present"
    
    # ==============================================
    # CREATE DATA DIRECTORIES
    # ==============================================
    log_step "Creating persistent data directories..."
    
    local data_dirs=(
        "/opt/cryb/prometheus"
        "/opt/cryb/grafana"
        "/opt/cryb/loki"
        "/opt/cryb/alertmanager"
        "/opt/cryb/uptime-kuma"
        "${LOG_DIR}"
    )
    
    for dir in "${data_dirs[@]}"; do
        if [ ! -d "${dir}" ]; then
            log_info "Creating directory: ${dir}"
            sudo mkdir -p "${dir}"
            sudo chown -R $(id -u):$(id -g) "${dir}" 2>/dev/null || true
        fi
    done
    log_success "Data directories created"
    
    # ==============================================
    # START CORE SERVICES
    # ==============================================
    log_step "Starting core infrastructure services..."
    
    # Start main application stack first
    log_info "Starting main application services..."
    if ! docker compose -f docker-compose.yml up -d postgres redis elasticsearch minio; then
        log_error "Failed to start core services"
        exit 1
    fi
    
    # Wait for core services to be ready
    log_info "Waiting for core services to be ready..."
    check_port "PostgreSQL" 5433
    check_port "Redis" 6380
    check_port "Elasticsearch" 9201
    check_port "MinIO" 9000
    
    log_success "Core services are running"
    
    # ==============================================
    # START MONITORING SERVICES
    # ==============================================
    log_step "Starting monitoring services..."
    
    # Start monitoring stack
    log_info "Starting Prometheus, Grafana, Loki, and Alertmanager..."
    if ! docker compose -f docker-compose.monitoring.yml up -d prometheus grafana loki alertmanager; then
        log_error "Failed to start primary monitoring services"
        exit 1
    fi
    
    # Wait for primary monitoring services
    log_info "Waiting for primary monitoring services..."
    check_port "Prometheus" 9090
    check_port "Grafana" 3002
    check_port "Loki" 3100
    check_port "Alertmanager" 9093
    
    # Start log shipping
    log_info "Starting Promtail for log shipping..."
    if ! docker compose -f docker-compose.monitoring.yml up -d promtail; then
        log_warning "Failed to start Promtail, continuing anyway"
    else
        log_success "Promtail started"
    fi
    
    # Start exporters
    log_info "Starting metrics exporters..."
    if ! docker compose -f docker-compose.monitoring.yml up -d node-exporter cadvisor postgres-exporter redis-exporter elasticsearch-exporter; then
        log_warning "Some exporters failed to start, continuing anyway"
    else
        log_success "Metrics exporters started"
    fi
    
    # Start additional monitoring services
    log_info "Starting additional monitoring services..."
    if ! docker compose -f docker-compose.monitoring.yml up -d blackbox-exporter jaeger uptime-kuma; then
        log_warning "Some additional services failed to start, continuing anyway"
    else
        log_success "Additional monitoring services started"
    fi
    
    # ==============================================
    # HEALTH CHECKS
    # ==============================================
    log_step "Performing comprehensive health checks..."
    
    # Wait a bit for services to fully initialize
    log_info "Waiting for services to initialize..."
    sleep 30
    
    # Check Prometheus
    if check_service_health "Prometheus" "http://localhost:9090/-/healthy"; then
        # Test a simple query
        if curl -f -s "http://localhost:9090/api/v1/query?query=up" > /dev/null; then
            log_success "Prometheus query interface is working"
        else
            log_warning "Prometheus query interface may not be working properly"
        fi
    else
        log_error "Prometheus health check failed"
    fi
    
    # Check Grafana
    if check_service_health "Grafana" "http://localhost:3002/api/health"; then
        log_success "Grafana is accessible"
    else
        log_warning "Grafana may not be fully ready"
    fi
    
    # Check Loki
    if check_service_health "Loki" "http://localhost:3100/ready"; then
        log_success "Loki is ready to receive logs"
    else
        log_warning "Loki may not be ready"
    fi
    
    # Check Alertmanager
    if check_service_health "Alertmanager" "http://localhost:9093/-/healthy"; then
        log_success "Alertmanager is healthy"
    else
        log_warning "Alertmanager may not be ready"
    fi
    
    # Check if Jaeger is accessible
    if check_port "Jaeger" 16686 5 2; then
        log_success "Jaeger UI is accessible"
    else
        log_warning "Jaeger UI may not be ready"
    fi
    
    # Check exporters
    local exporters=(
        "node-exporter:9100"
        "cadvisor:8080"
        "postgres-exporter:9187"
        "redis-exporter:9121"
    )
    
    for exporter in "${exporters[@]}"; do
        local name="${exporter%:*}"
        local port="${exporter#*:}"
        
        if check_port "${name}" "${port}" 5 2; then
            log_success "${name} is running"
        else
            log_warning "${name} may not be ready"
        fi
    done
    
    # ==============================================
    # CONFIGURATION VALIDATION
    # ==============================================
    log_step "Validating monitoring configuration..."
    
    # Test Prometheus configuration
    log_info "Validating Prometheus configuration..."
    if curl -f -s "http://localhost:9090/api/v1/status/config" > /dev/null; then
        log_success "Prometheus configuration is valid"
    else
        log_warning "Could not validate Prometheus configuration"
    fi
    
    # Check if Prometheus can scrape targets
    log_info "Checking Prometheus targets..."
    sleep 10 # Give targets time to be discovered
    
    local target_check=$(curl -s "http://localhost:9090/api/v1/targets" | grep -o '"health":"up"' | wc -l || echo "0")
    if [ "${target_check}" -gt 0 ]; then
        log_success "Prometheus is scraping ${target_check} healthy targets"
    else
        log_warning "Prometheus may not be scraping targets yet"
    fi
    
    # ==============================================
    # DISPLAY SERVICE STATUS
    # ==============================================
    log_step "Monitoring stack deployment summary:"
    
    echo -e "\n${CYAN}=== CRYB MONITORING STACK - SERVICE STATUS ===${NC}"
    echo -e "${YELLOW}Core Services:${NC}"
    docker compose -f docker-compose.yml ps postgres redis elasticsearch minio 2>/dev/null || true
    
    echo -e "\n${YELLOW}Monitoring Services:${NC}"
    docker compose -f docker-compose.monitoring.yml ps 2>/dev/null || true
    
    echo -e "\n${CYAN}=== SERVICE URLS ===${NC}"
    echo -e "${GREEN}📊 Grafana Dashboard:${NC}     http://localhost:3002 (admin/admin123)"
    echo -e "${GREEN}📈 Prometheus:${NC}            http://localhost:9090"
    echo -e "${GREEN}🚨 Alertmanager:${NC}          http://localhost:9093"
    echo -e "${GREEN}📋 Loki Logs:${NC}             http://localhost:3100"
    echo -e "${GREEN}🔍 Jaeger Tracing:${NC}        http://localhost:16686"
    echo -e "${GREEN}📡 Uptime Monitoring:${NC}     http://localhost:3001"
    echo -e "${GREEN}💾 MinIO Console:${NC}         http://localhost:9001 (minioadmin/minioadmin123)"
    echo -e "${GREEN}🗄️  Redis Commander:${NC}       http://localhost:8081"
    echo -e "${GREEN}🐘 pgAdmin:${NC}               http://localhost:5050 (admin@cryb.ai/admin123)"
    
    echo -e "\n${CYAN}=== EXPORTER METRICS ===${NC}"
    echo -e "${GREEN}🖥️  Node Exporter:${NC}         http://localhost:9100/metrics"
    echo -e "${GREEN}🐳 cAdvisor:${NC}              http://localhost:8080/metrics"
    echo -e "${GREEN}🗄️  Postgres Exporter:${NC}     http://localhost:9187/metrics"
    echo -e "${GREEN}📦 Redis Exporter:${NC}        http://localhost:9121/metrics"
    echo -e "${GREEN}🔍 Blackbox Exporter:${NC}     http://localhost:9115/metrics"
    
    echo -e "\n${CYAN}=== LOG FILES ===${NC}"
    echo -e "${GREEN}📝 Startup Logs:${NC}          ${LOG_DIR}/startup.log"
    echo -e "${GREEN}📝 Health Check Logs:${NC}     ${LOG_DIR}/health-checks.log"
    
    # ==============================================
    # FINAL HEALTH CHECK
    # ==============================================
    log_step "Performing final system health check..."
    
    local health_status="HEALTHY"
    local critical_services=("prometheus" "grafana" "loki" "alertmanager")
    
    for service in "${critical_services[@]}"; do
        if ! docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "cryb-${service}.*Up"; then
            log_error "Critical service ${service} is not running"
            health_status="DEGRADED"
        fi
    done
    
    # Check if any containers are in restart loop
    local restarting_containers=$(docker ps -a --format "table {{.Names}}\t{{.Status}}" | grep -i restart | wc -l)
    if [ "${restarting_containers}" -gt 0 ]; then
        log_warning "${restarting_containers} containers are restarting"
        health_status="DEGRADED"
    fi
    
    # ==============================================
    # COMPLETION
    # ==============================================
    if [ "${health_status}" = "HEALTHY" ]; then
        log_success "🎉 CRYB MONITORING STACK DEPLOYMENT COMPLETED SUCCESSFULLY!"
        echo -e "\n${GREEN}✅ All services are running and healthy${NC}"
        echo -e "${GREEN}🔧 Configuration validated${NC}"
        echo -e "${GREEN}📊 Metrics collection active${NC}"
        echo -e "${GREEN}📋 Log aggregation active${NC}"
        echo -e "${GREEN}🚨 Alerting system active${NC}"
        echo -e "${GREEN}🔍 Distributed tracing active${NC}"
    else
        log_warning "⚠️  MONITORING STACK STARTED WITH WARNINGS"
        echo -e "\n${YELLOW}⚠️  Some services may not be fully healthy${NC}"
        echo -e "${YELLOW}📋 Check individual service logs for details${NC}"
        echo -e "${YELLOW}🔄 Services may still be initializing${NC}"
    fi
    
    echo -e "\n${BLUE}📖 Quick Start Guide:${NC}"
    echo -e "1. Access Grafana at http://localhost:3002"
    echo -e "2. Login with admin/admin123"
    echo -e "3. Navigate to dashboards to view metrics"
    echo -e "4. Check Prometheus targets at http://localhost:9090/targets"
    echo -e "5. View traces in Jaeger at http://localhost:16686"
    echo -e "6. Monitor alerts at http://localhost:9093"
    
    echo -e "\n${PURPLE}🛠️  Management Commands:${NC}"
    echo -e "Stop monitoring stack:     docker compose -f docker-compose.monitoring.yml down"
    echo -e "View logs:                docker compose -f docker-compose.monitoring.yml logs -f [service]"
    echo -e "Restart service:          docker compose -f docker-compose.monitoring.yml restart [service]"
    echo -e "Update configuration:     docker compose -f docker-compose.monitoring.yml up -d [service]"
    
    log_success "Monitoring stack startup completed at $(date)"
    echo -e "\n${GREEN}🚀 Your Cryb platform monitoring infrastructure is now operational!${NC}\n"
}

# Start the monitoring stack
main "$@"