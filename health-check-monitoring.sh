#!/bin/bash

# ==============================================
# CRYB PLATFORM - MONITORING HEALTH CHECK
# ==============================================
# Comprehensive health check for all monitoring services
# Can be used for continuous monitoring or troubleshooting
# ==============================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
LOG_DIR="${SCRIPT_DIR}/logs/monitoring"
HEALTH_LOG="${LOG_DIR}/health-checks.log"

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# Create log directory
mkdir -p "${LOG_DIR}"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
    echo "[INFO] $(date): $1" >> "${HEALTH_LOG}"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
    echo "[SUCCESS] $(date): $1" >> "${HEALTH_LOG}"
    ((PASSED_CHECKS++))
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
    echo "[WARNING] $(date): $1" >> "${HEALTH_LOG}"
    ((WARNING_CHECKS++))
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
    echo "[ERROR] $(date): $1" >> "${HEALTH_LOG}"
    ((FAILED_CHECKS++))
}

# Health check functions
check_http_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    local timeout="${4:-10}"
    
    ((TOTAL_CHECKS++))
    
    local response
    if response=$(curl -s -w "%{http_code}" -m "${timeout}" "${url}" 2>/dev/null); then
        local status_code="${response: -3}"
        if [ "${status_code}" = "${expected_status}" ]; then
            log_success "${name} endpoint is healthy (${status_code})"
            return 0
        else
            log_warning "${name} returned status ${status_code}, expected ${expected_status}"
            return 1
        fi
    else
        log_error "${name} endpoint is unreachable"
        return 1
    fi
}

check_port() {
    local name="$1"
    local port="$2"
    local timeout="${3:-5}"
    
    ((TOTAL_CHECKS++))
    
    if timeout "${timeout}" bash -c "echo >/dev/tcp/localhost/${port}" 2>/dev/null; then
        log_success "${name} is listening on port ${port}"
        return 0
    else
        log_error "${name} is not responding on port ${port}"
        return 1
    fi
}

check_docker_service() {
    local service_name="$1"
    local container_name="$2"
    
    ((TOTAL_CHECKS++))
    
    local container_status
    if container_status=$(docker inspect --format='{{.State.Status}}' "${container_name}" 2>/dev/null); then
        if [ "${container_status}" = "running" ]; then
            # Check if container is healthy
            local health_status
            if health_status=$(docker inspect --format='{{.State.Health.Status}}' "${container_name}" 2>/dev/null); then
                case "${health_status}" in
                    "healthy")
                        log_success "${service_name} container is running and healthy"
                        return 0
                        ;;
                    "unhealthy")
                        log_error "${service_name} container is running but unhealthy"
                        return 1
                        ;;
                    "starting")
                        log_warning "${service_name} container is starting (health check in progress)"
                        return 1
                        ;;
                    *)
                        log_warning "${service_name} container is running (no health check configured)"
                        return 0
                        ;;
                esac
            else
                log_success "${service_name} container is running (no health check configured)"
                return 0
            fi
        else
            log_error "${service_name} container is ${container_status}"
            return 1
        fi
    else
        log_error "${service_name} container not found"
        return 1
    fi
}

check_prometheus_targets() {
    ((TOTAL_CHECKS++))
    
    local targets_response
    if targets_response=$(curl -s "http://localhost:9090/api/v1/targets" 2>/dev/null); then
        local up_targets
        up_targets=$(echo "${targets_response}" | grep -o '"health":"up"' | wc -l || echo "0")
        local down_targets
        down_targets=$(echo "${targets_response}" | grep -o '"health":"down"' | wc -l || echo "0")
        
        if [ "${up_targets}" -gt 0 ]; then
            if [ "${down_targets}" -eq 0 ]; then
                log_success "All ${up_targets} Prometheus targets are healthy"
                return 0
            else
                log_warning "${up_targets} targets up, ${down_targets} targets down"
                return 1
            fi
        else
            log_error "No Prometheus targets are responding"
            return 1
        fi
    else
        log_error "Cannot query Prometheus targets"
        return 1
    fi
}

check_grafana_datasources() {
    ((TOTAL_CHECKS++))
    
    # Check if datasources are configured (this would require authentication in real scenario)
    local datasources_response
    if datasources_response=$(curl -s -u "admin:admin123" "http://localhost:3002/api/datasources" 2>/dev/null); then
        local datasource_count
        datasource_count=$(echo "${datasources_response}" | grep -c '"name"' || echo "0")
        
        if [ "${datasource_count}" -gt 0 ]; then
            log_success "Grafana has ${datasource_count} datasources configured"
            return 0
        else
            log_warning "Grafana has no datasources configured"
            return 1
        fi
    else
        log_warning "Cannot query Grafana datasources (may need authentication)"
        return 1
    fi
}

check_loki_ingestion() {
    ((TOTAL_CHECKS++))
    
    # Send a test log entry to Loki
    local test_log='{"streams": [{"stream": {"job": "health-check", "instance": "localhost"}, "values": [["'$(date +%s%N)'", "Health check test log"]]}]}'
    
    if curl -s -X POST -H "Content-Type: application/json" -d "${test_log}" "http://localhost:3100/loki/api/v1/push" > /dev/null 2>&1; then
        log_success "Loki can ingest logs"
        return 0
    else
        log_error "Loki log ingestion failed"
        return 1
    fi
}

check_metrics_collection() {
    ((TOTAL_CHECKS++))
    
    # Check if basic metrics are being collected
    local metrics_endpoints=(
        "http://localhost:9100/metrics" # node-exporter
        "http://localhost:9187/metrics" # postgres-exporter
        "http://localhost:9121/metrics" # redis-exporter
    )
    
    local working_exporters=0
    for endpoint in "${metrics_endpoints[@]}"; do
        if curl -s -m 5 "${endpoint}" | grep -q "^# HELP"; then
            ((working_exporters++))
        fi
    done
    
    if [ "${working_exporters}" -eq "${#metrics_endpoints[@]}" ]; then
        log_success "All ${#metrics_endpoints[@]} metrics exporters are working"
        return 0
    elif [ "${working_exporters}" -gt 0 ]; then
        log_warning "${working_exporters}/${#metrics_endpoints[@]} metrics exporters are working"
        return 1
    else
        log_error "No metrics exporters are working"
        return 1
    fi
}

check_alertmanager_config() {
    ((TOTAL_CHECKS++))
    
    local config_response
    if config_response=$(curl -s "http://localhost:9093/api/v1/status" 2>/dev/null); then
        if echo "${config_response}" | grep -q '"status":"success"'; then
            log_success "Alertmanager configuration is valid"
            return 0
        else
            log_error "Alertmanager configuration is invalid"
            return 1
        fi
    else
        log_error "Cannot query Alertmanager status"
        return 1
    fi
}

check_disk_space() {
    ((TOTAL_CHECKS++))
    
    # Check disk space in monitoring data directories
    local data_dirs=(
        "/opt/cryb/prometheus"
        "/opt/cryb/grafana"
        "/opt/cryb/loki"
    )
    
    local space_warnings=0
    for dir in "${data_dirs[@]}"; do
        if [ -d "${dir}" ]; then
            local available_gb
            available_gb=$(df -BG "${dir}" | awk 'NR==2 {print $4}' | sed 's/G//')
            if [ "${available_gb}" -lt 5 ]; then
                log_warning "Low disk space in ${dir}: ${available_gb}GB remaining"
                ((space_warnings++))
            fi
        fi
    done
    
    if [ "${space_warnings}" -eq 0 ]; then
        log_success "Sufficient disk space available"
        return 0
    else
        log_warning "${space_warnings} directories have low disk space"
        return 1
    fi
}

check_memory_usage() {
    ((TOTAL_CHECKS++))
    
    # Check system memory usage
    local memory_usage
    memory_usage=$(free | awk 'NR==2{printf "%.1f", $3*100/$2}')
    local memory_usage_int=${memory_usage%.*}
    
    if [ "${memory_usage_int}" -lt 80 ]; then
        log_success "Memory usage is healthy (${memory_usage}%)"
        return 0
    elif [ "${memory_usage_int}" -lt 90 ]; then
        log_warning "Memory usage is high (${memory_usage}%)"
        return 1
    else
        log_error "Memory usage is critical (${memory_usage}%)"
        return 1
    fi
}

# Main health check function
main() {
    echo -e "${CYAN}=== CRYB MONITORING STACK HEALTH CHECK ===${NC}"
    echo -e "${BLUE}Timestamp: $(date)${NC}"
    echo -e "${BLUE}Log file: ${HEALTH_LOG}${NC}\n"
    
    # Clear previous log entry
    echo "=== Health Check Started at $(date) ===" >> "${HEALTH_LOG}"
    
    # Core Infrastructure Checks
    echo -e "${PURPLE}🏗️  CORE INFRASTRUCTURE${NC}"
    check_docker_service "Prometheus" "cryb-prometheus"
    check_docker_service "Grafana" "cryb-grafana"
    check_docker_service "Loki" "cryb-loki"
    check_docker_service "Alertmanager" "cryb-alertmanager"
    
    # Service Endpoint Checks
    echo -e "\n${PURPLE}🌐 SERVICE ENDPOINTS${NC}"
    check_http_endpoint "Prometheus" "http://localhost:9090/-/healthy"
    check_http_endpoint "Grafana" "http://localhost:3002/api/health"
    check_http_endpoint "Loki" "http://localhost:3100/ready"
    check_http_endpoint "Alertmanager" "http://localhost:9093/-/healthy"
    check_http_endpoint "Jaeger UI" "http://localhost:16686/" 200 5
    
    # Port Connectivity Checks
    echo -e "\n${PURPLE}🔌 PORT CONNECTIVITY${NC}"
    check_port "Prometheus" 9090
    check_port "Grafana" 3002
    check_port "Loki" 3100
    check_port "Alertmanager" 9093
    check_port "Jaeger" 16686
    
    # Exporter Checks
    echo -e "\n${PURPLE}📊 METRICS EXPORTERS${NC}"
    check_docker_service "Node Exporter" "cryb-node-exporter"
    check_docker_service "cAdvisor" "cryb-cadvisor"
    check_docker_service "Postgres Exporter" "cryb-postgres-exporter"
    check_docker_service "Redis Exporter" "cryb-redis-exporter"
    
    # Functional Checks
    echo -e "\n${PURPLE}⚙️  FUNCTIONAL TESTS${NC}"
    check_prometheus_targets
    check_grafana_datasources
    check_loki_ingestion
    check_metrics_collection
    check_alertmanager_config
    
    # Resource Checks
    echo -e "\n${PURPLE}💾 RESOURCE UTILIZATION${NC}"
    check_disk_space
    check_memory_usage
    
    # Container Resource Usage
    echo -e "\n${PURPLE}📈 CONTAINER STATISTICS${NC}"
    
    local containers=("cryb-prometheus" "cryb-grafana" "cryb-loki" "cryb-alertmanager")
    for container in "${containers[@]}"; do
        if docker ps --format "table {{.Names}}" | grep -q "${container}"; then
            local stats
            stats=$(docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" "${container}" 2>/dev/null | tail -1)
            log_info "${container}: ${stats}"
        fi
    done
    
    # Summary
    echo -e "\n${CYAN}=== HEALTH CHECK SUMMARY ===${NC}"
    echo -e "${GREEN}✓ Passed:${NC}   ${PASSED_CHECKS}/${TOTAL_CHECKS}"
    echo -e "${YELLOW}⚠ Warnings:${NC} ${WARNING_CHECKS}/${TOTAL_CHECKS}"
    echo -e "${RED}✗ Failed:${NC}   ${FAILED_CHECKS}/${TOTAL_CHECKS}"
    
    # Determine overall health status
    local health_percentage=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    
    if [ "${FAILED_CHECKS}" -eq 0 ] && [ "${WARNING_CHECKS}" -eq 0 ]; then
        echo -e "\n${GREEN}🎉 SYSTEM STATUS: HEALTHY (100%)${NC}"
        echo "HEALTHY" > "${LOG_DIR}/health-status"
        exit 0
    elif [ "${FAILED_CHECKS}" -eq 0 ]; then
        echo -e "\n${YELLOW}⚠️  SYSTEM STATUS: DEGRADED (${health_percentage}%)${NC}"
        echo -e "${YELLOW}Some non-critical issues detected${NC}"
        echo "DEGRADED" > "${LOG_DIR}/health-status"
        exit 1
    else
        echo -e "\n${RED}🚨 SYSTEM STATUS: UNHEALTHY (${health_percentage}%)${NC}"
        echo -e "${RED}Critical issues require attention${NC}"
        echo "UNHEALTHY" > "${LOG_DIR}/health-status"
        exit 2
    fi
}

# Command line options
case "${1:-check}" in
    "check")
        main
        ;;
    "status")
        if [ -f "${LOG_DIR}/health-status" ]; then
            status=$(cat "${LOG_DIR}/health-status")
            echo "Current health status: ${status}"
            exit 0
        else
            echo "No health status available. Run health check first."
            exit 1
        fi
        ;;
    "watch")
        while true; do
            clear
            main
            echo -e "\n${BLUE}Refreshing in 30 seconds... (Ctrl+C to exit)${NC}"
            sleep 30
        done
        ;;
    "help")
        echo "Usage: $0 [check|status|watch|help]"
        echo "  check  - Run complete health check (default)"
        echo "  status - Show last health check status"
        echo "  watch  - Run health checks continuously"
        echo "  help   - Show this help message"
        ;;
    *)
        echo "Unknown option: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac