#!/bin/bash

# ==============================================
# CRYB PLATFORM - COMPREHENSIVE HEALTH CHECKS
# ==============================================
# Health check script for all production services
# Usage: ./scripts/health-check-all.sh
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
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.production-complete.yml"
TIMEOUT=30

# Health check results
HEALTH_RESULTS=()
FAILED_CHECKS=0
TOTAL_CHECKS=0

# ==============================================
# UTILITY FUNCTIONS
# ==============================================

log() {
    echo -e "${1}"
}

log_info() {
    log "${BLUE}[INFO]${NC} ${1}"
}

log_success() {
    log "${GREEN}[PASS]${NC} ${1}"
}

log_warning() {
    log "${YELLOW}[WARN]${NC} ${1}"
}

log_error() {
    log "${RED}[FAIL]${NC} ${1}"
}

log_step() {
    log "${PURPLE}[TEST]${NC} ${1}"
}

show_header() {
    log "${CYAN}"
    log "=============================================="
    log "   CRYB PLATFORM - HEALTH CHECK SUITE      "
    log "=============================================="
    log "${NC}"
    log_info "Starting health checks at $(date)"
    log ""
}

record_result() {
    local service="$1"
    local test="$2"
    local status="$3"
    local message="$4"
    
    HEALTH_RESULTS+=("$service|$test|$status|$message")
    ((TOTAL_CHECKS++))
    
    if [[ "$status" == "FAIL" ]]; then
        ((FAILED_CHECKS++))
        log_error "$service - $test: $message"
    elif [[ "$status" == "WARN" ]]; then
        log_warning "$service - $test: $message"
    else
        log_success "$service - $test: $message"
    fi
}

# ==============================================
# SERVICE-SPECIFIC HEALTH CHECKS
# ==============================================

check_docker_service() {
    log_step "Checking Docker service..."
    
    if ! docker info >/dev/null 2>&1; then
        record_result "Docker" "Service" "FAIL" "Docker daemon not running"
        return 1
    fi
    
    record_result "Docker" "Service" "PASS" "Docker daemon running"
    
    # Check Docker Compose
    if ! docker compose version >/dev/null 2>&1; then
        record_result "Docker" "Compose" "FAIL" "Docker Compose not available"
        return 1
    fi
    
    record_result "Docker" "Compose" "PASS" "Docker Compose available"
}

check_container_status() {
    log_step "Checking container status..."
    
    local services=("web" "api" "postgres" "redis" "elasticsearch" "minio" "livekit" "nginx")
    
    for service in "${services[@]}"; do
        if docker compose -f "$COMPOSE_FILE" ps "$service" | grep -q "Up"; then
            record_result "$service" "Container" "PASS" "Container is running"
        else
            record_result "$service" "Container" "FAIL" "Container is not running"
        fi
    done
}

check_database_health() {
    log_step "Checking database health..."
    
    # Check PostgreSQL connection
    if timeout $TIMEOUT docker compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U "${POSTGRES_USER:-cryb_user}" >/dev/null 2>&1; then
        record_result "PostgreSQL" "Connection" "PASS" "Database accepting connections"
    else
        record_result "PostgreSQL" "Connection" "FAIL" "Database not accepting connections"
        return 1
    fi
    
    # Check database exists
    if timeout $TIMEOUT docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U "${POSTGRES_USER:-cryb_user}" -d "${POSTGRES_DB:-cryb}" -c "SELECT 1;" >/dev/null 2>&1; then
        record_result "PostgreSQL" "Database" "PASS" "Database '${POSTGRES_DB:-cryb}' accessible"
    else
        record_result "PostgreSQL" "Database" "FAIL" "Database '${POSTGRES_DB:-cryb}' not accessible"
    fi
    
    # Check TimescaleDB extension
    if timeout $TIMEOUT docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U "${POSTGRES_USER:-cryb_user}" -d "${POSTGRES_DB:-cryb}" -c "SELECT 1 FROM pg_extension WHERE extname = 'timescaledb';" | grep -q "1"; then
        record_result "PostgreSQL" "TimescaleDB" "PASS" "TimescaleDB extension loaded"
    else
        record_result "PostgreSQL" "TimescaleDB" "WARN" "TimescaleDB extension not found"
    fi
}

check_redis_health() {
    log_step "Checking Redis health..."
    
    # Check Redis connection
    if timeout $TIMEOUT docker compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping >/dev/null 2>&1; then
        record_result "Redis" "Connection" "PASS" "Redis responding to ping"
    else
        record_result "Redis" "Connection" "FAIL" "Redis not responding to ping"
        return 1
    fi
    
    # Check Redis memory usage
    local memory_info=$(timeout $TIMEOUT docker compose -f "$COMPOSE_FILE" exec -T redis redis-cli info memory | grep "used_memory_human:" | cut -d: -f2 | tr -d '\r')
    if [[ -n "$memory_info" ]]; then
        record_result "Redis" "Memory" "PASS" "Memory usage: $memory_info"
    else
        record_result "Redis" "Memory" "WARN" "Could not retrieve memory info"
    fi
    
    # Test basic operations
    if timeout $TIMEOUT docker compose -f "$COMPOSE_FILE" exec -T redis redis-cli set health_check_test "OK" >/dev/null 2>&1 && \
       timeout $TIMEOUT docker compose -f "$COMPOSE_FILE" exec -T redis redis-cli get health_check_test | grep -q "OK"; then
        docker compose -f "$COMPOSE_FILE" exec -T redis redis-cli del health_check_test >/dev/null 2>&1 || true
        record_result "Redis" "Operations" "PASS" "Basic operations working"
    else
        record_result "Redis" "Operations" "FAIL" "Basic operations failing"
    fi
}

check_elasticsearch_health() {
    log_step "Checking Elasticsearch health..."
    
    # Get Elasticsearch port
    local es_port
    if ! es_port=$(docker compose -f "$COMPOSE_FILE" port elasticsearch 9200 2>/dev/null | cut -d: -f2); then
        record_result "Elasticsearch" "Port" "FAIL" "Could not determine Elasticsearch port"
        return 1
    fi
    
    # Check Elasticsearch health endpoint
    if timeout $TIMEOUT curl -s "http://localhost:$es_port/_cluster/health" >/dev/null 2>&1; then
        local health_status=$(timeout $TIMEOUT curl -s "http://localhost:$es_port/_cluster/health" | python3 -c "import sys, json; print(json.load(sys.stdin)['status'])" 2>/dev/null || echo "unknown")
        
        if [[ "$health_status" == "green" ]]; then
            record_result "Elasticsearch" "Cluster" "PASS" "Cluster health: green"
        elif [[ "$health_status" == "yellow" ]]; then
            record_result "Elasticsearch" "Cluster" "WARN" "Cluster health: yellow"
        elif [[ "$health_status" == "red" ]]; then
            record_result "Elasticsearch" "Cluster" "FAIL" "Cluster health: red"
        else
            record_result "Elasticsearch" "Cluster" "WARN" "Cluster health: unknown"
        fi
    else
        record_result "Elasticsearch" "Health" "FAIL" "Health endpoint not responding"
    fi
    
    # Check if indices exist
    if timeout $TIMEOUT curl -s "http://localhost:$es_port/_cat/indices" >/dev/null 2>&1; then
        local index_count=$(timeout $TIMEOUT curl -s "http://localhost:$es_port/_cat/indices" | wc -l)
        record_result "Elasticsearch" "Indices" "PASS" "Indices accessible (count: $index_count)"
    else
        record_result "Elasticsearch" "Indices" "WARN" "Could not retrieve indices information"
    fi
}

check_minio_health() {
    log_step "Checking MinIO health..."
    
    # Get MinIO port
    local minio_port
    if ! minio_port=$(docker compose -f "$COMPOSE_FILE" port minio 9000 2>/dev/null | cut -d: -f2); then
        record_result "MinIO" "Port" "FAIL" "Could not determine MinIO port"
        return 1
    fi
    
    # Check MinIO health endpoint
    if timeout $TIMEOUT curl -s "http://localhost:$minio_port/minio/health/live" >/dev/null 2>&1; then
        record_result "MinIO" "Health" "PASS" "Health endpoint responding"
    else
        record_result "MinIO" "Health" "FAIL" "Health endpoint not responding"
    fi
    
    # Check MinIO admin interface
    local minio_console_port
    if minio_console_port=$(docker compose -f "$COMPOSE_FILE" port minio 9001 2>/dev/null | cut -d: -f2); then
        if timeout $TIMEOUT curl -s "http://localhost:$minio_console_port" >/dev/null 2>&1; then
            record_result "MinIO" "Console" "PASS" "Admin console accessible"
        else
            record_result "MinIO" "Console" "WARN" "Admin console not accessible"
        fi
    fi
}

check_livekit_health() {
    log_step "Checking LiveKit health..."
    
    # Get LiveKit port
    local livekit_port
    if ! livekit_port=$(docker compose -f "$COMPOSE_FILE" port livekit 7880 2>/dev/null | cut -d: -f2); then
        record_result "LiveKit" "Port" "FAIL" "Could not determine LiveKit port"
        return 1
    fi
    
    # Check if LiveKit is listening (WebSocket connection test)
    if timeout $TIMEOUT nc -z localhost "$livekit_port" >/dev/null 2>&1; then
        record_result "LiveKit" "Service" "PASS" "Service listening on port $livekit_port"
    else
        record_result "LiveKit" "Service" "FAIL" "Service not listening on port $livekit_port"
    fi
}

check_api_health() {
    log_step "Checking API health..."
    
    # Get API port
    local api_port
    if ! api_port=$(docker compose -f "$COMPOSE_FILE" port api 3001 2>/dev/null | cut -d: -f2); then
        record_result "API" "Port" "FAIL" "Could not determine API port"
        return 1
    fi
    
    # Check API health endpoint
    if timeout $TIMEOUT curl -s "http://localhost:$api_port/health" >/dev/null 2>&1; then
        local health_response=$(timeout $TIMEOUT curl -s "http://localhost:$api_port/health" 2>/dev/null || echo "{}")
        
        if echo "$health_response" | grep -q "healthy\|ok"; then
            record_result "API" "Health" "PASS" "Health endpoint responding correctly"
        else
            record_result "API" "Health" "WARN" "Health endpoint responding but status unclear"
        fi
    else
        record_result "API" "Health" "FAIL" "Health endpoint not responding"
    fi
    
    # Check API documentation (Swagger)
    if timeout $TIMEOUT curl -s "http://localhost:$api_port/documentation" >/dev/null 2>&1; then
        record_result "API" "Documentation" "PASS" "API documentation accessible"
    else
        record_result "API" "Documentation" "WARN" "API documentation not accessible"
    fi
}

check_web_health() {
    log_step "Checking Web frontend health..."
    
    # Get Web port
    local web_port
    if ! web_port=$(docker compose -f "$COMPOSE_FILE" port web 3000 2>/dev/null | cut -d: -f2); then
        record_result "Web" "Port" "FAIL" "Could not determine Web port"
        return 1
    fi
    
    # Check Web frontend
    if timeout $TIMEOUT curl -s "http://localhost:$web_port" >/dev/null 2>&1; then
        record_result "Web" "Frontend" "PASS" "Frontend responding"
    else
        record_result "Web" "Frontend" "FAIL" "Frontend not responding"
    fi
    
    # Check Next.js health (if available)
    if timeout $TIMEOUT curl -s "http://localhost:$web_port/api/health" >/dev/null 2>&1; then
        record_result "Web" "Next.js Health" "PASS" "Next.js health endpoint responding"
    else
        record_result "Web" "Next.js Health" "WARN" "Next.js health endpoint not available"
    fi
}

check_nginx_health() {
    log_step "Checking Nginx health..."
    
    # Check Nginx HTTP
    if timeout $TIMEOUT curl -s "http://localhost:80" >/dev/null 2>&1; then
        record_result "Nginx" "HTTP" "PASS" "HTTP port responding"
    else
        record_result "Nginx" "HTTP" "FAIL" "HTTP port not responding"
    fi
    
    # Check if Nginx is properly routing to backend services
    if timeout $TIMEOUT curl -s "http://localhost:80/api/health" >/dev/null 2>&1; then
        record_result "Nginx" "API Routing" "PASS" "API routing working"
    else
        record_result "Nginx" "API Routing" "FAIL" "API routing not working"
    fi
}

check_monitoring_health() {
    log_step "Checking monitoring services..."
    
    # Check if monitoring services are running (optional)
    if docker compose -f "$COMPOSE_FILE" ps prometheus >/dev/null 2>&1; then
        local prometheus_port
        if prometheus_port=$(docker compose -f "$COMPOSE_FILE" port prometheus 9090 2>/dev/null | cut -d: -f2); then
            if timeout $TIMEOUT curl -s "http://localhost:$prometheus_port" >/dev/null 2>&1; then
                record_result "Prometheus" "Service" "PASS" "Prometheus accessible"
            else
                record_result "Prometheus" "Service" "FAIL" "Prometheus not accessible"
            fi
        fi
    else
        record_result "Prometheus" "Service" "WARN" "Monitoring stack not deployed"
    fi
    
    if docker compose -f "$COMPOSE_FILE" ps grafana >/dev/null 2>&1; then
        local grafana_port
        if grafana_port=$(docker compose -f "$COMPOSE_FILE" port grafana 3000 2>/dev/null | cut -d: -f2); then
            if timeout $TIMEOUT curl -s "http://localhost:$grafana_port" >/dev/null 2>&1; then
                record_result "Grafana" "Service" "PASS" "Grafana accessible"
            else
                record_result "Grafana" "Service" "FAIL" "Grafana not accessible"
            fi
        fi
    else
        record_result "Grafana" "Service" "WARN" "Monitoring stack not deployed"
    fi
}

check_resource_usage() {
    log_step "Checking resource usage..."
    
    # Check memory usage
    local mem_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    if (( $(echo "$mem_usage > 90" | bc -l) )); then
        record_result "System" "Memory" "FAIL" "High memory usage: ${mem_usage}%"
    elif (( $(echo "$mem_usage > 75" | bc -l) )); then
        record_result "System" "Memory" "WARN" "Moderate memory usage: ${mem_usage}%"
    else
        record_result "System" "Memory" "PASS" "Memory usage: ${mem_usage}%"
    fi
    
    # Check disk usage
    local disk_usage=$(df / | awk 'NR==2{printf "%.1f", $5}' | sed 's/%//')
    if (( $(echo "$disk_usage > 90" | bc -l) )); then
        record_result "System" "Disk" "FAIL" "High disk usage: ${disk_usage}%"
    elif (( $(echo "$disk_usage > 75" | bc -l) )); then
        record_result "System" "Disk" "WARN" "Moderate disk usage: ${disk_usage}%"
    else
        record_result "System" "Disk" "PASS" "Disk usage: ${disk_usage}%"
    fi
}

# ==============================================
# SUMMARY AND REPORTING
# ==============================================

show_summary() {
    log ""
    log "${CYAN}=============================================="
    log "              HEALTH CHECK SUMMARY           "
    log "=============================================="
    log "${NC}"
    
    local passed=$((TOTAL_CHECKS - FAILED_CHECKS))
    local success_rate=$(echo "scale=1; $passed * 100 / $TOTAL_CHECKS" | bc -l)
    
    log_info "Total checks: $TOTAL_CHECKS"
    log_success "Passed: $passed"
    log_error "Failed: $FAILED_CHECKS"
    log_info "Success rate: ${success_rate}%"
    log ""
    
    if [[ $FAILED_CHECKS -eq 0 ]]; then
        log_success "🎉 All health checks passed! Your CRYB platform is healthy."
        return 0
    elif [[ $FAILED_CHECKS -lt 3 ]]; then
        log_warning "⚠️  Some health checks failed, but core services are operational."
        return 1
    else
        log_error "❌ Multiple critical health checks failed. Please investigate."
        return 2
    fi
}

show_detailed_results() {
    if [[ "${SHOW_DETAILED:-false}" == "true" ]]; then
        log ""
        log "${CYAN}Detailed Results:${NC}"
        log "----------------------------------------"
        
        for result in "${HEALTH_RESULTS[@]}"; do
            IFS='|' read -r service test status message <<< "$result"
            printf "%-15s %-20s %-6s %s\n" "$service" "$test" "$status" "$message"
        done
    fi
}

show_help() {
    cat << EOF
CRYB Platform Health Check Suite

Usage: $0 [OPTIONS]

OPTIONS:
    -h, --help          Show this help message
    -v, --verbose       Show detailed results
    -t, --timeout SECS  Set timeout for each check (default: 30)
    --skip-monitoring   Skip monitoring service checks
    --skip-resources    Skip resource usage checks

EXAMPLES:
    $0                  # Run all health checks
    $0 --verbose        # Run with detailed output
    $0 --timeout 60     # Use 60-second timeout

EXIT CODES:
    0   All checks passed
    1   Some non-critical checks failed
    2   Multiple critical checks failed

EOF
}

# ==============================================
# MAIN EXECUTION
# ==============================================

main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -v|--verbose)
                export SHOW_DETAILED=true
                shift
                ;;
            -t|--timeout)
                TIMEOUT="$2"
                shift 2
                ;;
            --skip-monitoring)
                export SKIP_MONITORING=true
                shift
                ;;
            --skip-resources)
                export SKIP_RESOURCES=true
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Check if required tools are available
    for tool in docker curl nc bc; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            log_error "Required tool not found: $tool"
            exit 1
        fi
    done
    
    # Run health checks
    show_header
    
    check_docker_service
    check_container_status
    check_database_health
    check_redis_health
    check_elasticsearch_health
    check_minio_health
    check_livekit_health
    check_api_health
    check_web_health
    check_nginx_health
    
    if [[ "${SKIP_MONITORING:-false}" != "true" ]]; then
        check_monitoring_health
    fi
    
    if [[ "${SKIP_RESOURCES:-false}" != "true" ]]; then
        check_resource_usage
    fi
    
    show_detailed_results
    show_summary
    
    # Exit with appropriate code
    exit $?
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi