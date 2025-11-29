#!/bin/bash

# CRYB Media Platform Health Monitoring Script
# Comprehensive health checks and monitoring for all media services

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
COMPOSE_FILE="docker-compose.media-production.yml"
LOG_FILE="/opt/cryb/logs/health-monitor.log"
ALERT_THRESHOLD_CPU=80
ALERT_THRESHOLD_MEMORY=85
ALERT_THRESHOLD_DISK=90

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] $1" >> "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [WARNING] $1" >> "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] $1" >> "$LOG_FILE"
}

log_critical() {
    echo -e "${RED}[CRITICAL]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [CRITICAL] $1" >> "$LOG_FILE"
}

# Show usage
show_usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  status              Show overall platform health status"
    echo "  detailed            Show detailed health information"
    echo "  services            Check individual service health"
    echo "  infrastructure      Check infrastructure components"
    echo "  performance         Show performance metrics"
    echo "  alerts              Check for active alerts"
    echo "  watch               Continuous monitoring (updates every 30s)"
    echo "  test-endpoints      Test all service endpoints"
    echo "  generate-report     Generate comprehensive health report"
    echo ""
    echo "Examples:"
    echo "  $0 status"
    echo "  $0 watch"
    echo "  $0 generate-report > health-report.txt"
}

# Check if a service is healthy
check_service_health() {
    local service=$1
    local port=$2
    local endpoint=${3:-"/health"}
    
    if ! docker-compose -f "$COMPOSE_FILE" ps "$service" | grep -q "Up"; then
        echo "DOWN"
        return 1
    fi
    
    local container_ip
    container_ip=$(docker inspect $(docker-compose -f "$COMPOSE_FILE" ps -q "$service" | head -1) --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>/dev/null || echo "")
    
    if [[ -z "$container_ip" ]]; then
        echo "NO_IP"
        return 1
    fi
    
    if curl -sf "http://$container_ip:$port$endpoint" >/dev/null 2>&1; then
        echo "HEALTHY"
        return 0
    else
        echo "UNHEALTHY"
        return 1
    fi
}

# Get service resource usage
get_service_resources() {
    local service=$1
    
    local containers
    containers=$(docker-compose -f "$COMPOSE_FILE" ps -q "$service" 2>/dev/null || echo "")
    
    if [[ -z "$containers" ]]; then
        echo "N/A N/A N/A"
        return
    fi
    
    local total_cpu=0
    local total_memory=0
    local container_count=0
    
    for container in $containers; do
        if docker ps --format "{{.ID}}" | grep -q "$container"; then
            local stats
            stats=$(docker stats --no-stream --format "{{.CPUPerc}} {{.MemUsage}}" "$container" 2>/dev/null || echo "0% 0B / 0B")
            
            local cpu_percent
            cpu_percent=$(echo "$stats" | awk '{print $1}' | sed 's/%//')
            
            local memory_usage
            memory_usage=$(echo "$stats" | awk '{print $2}' | sed 's/MiB//')
            
            total_cpu=$(echo "$total_cpu + $cpu_percent" | bc -l 2>/dev/null || echo "0")
            total_memory=$(echo "$total_memory + $memory_usage" | bc -l 2>/dev/null || echo "0")
            ((container_count++))
        fi
    done
    
    if [[ $container_count -gt 0 ]]; then
        local avg_cpu
        avg_cpu=$(echo "scale=1; $total_cpu / $container_count" | bc -l 2>/dev/null || echo "0")
        echo "$avg_cpu% ${total_memory}MB $container_count"
    else
        echo "0% 0MB 0"
    fi
}

# Overall platform status
show_platform_status() {
    echo "=================================================="
    echo "CRYB Media Platform Health Status"
    echo "=================================================="
    echo "Timestamp: $(date)"
    echo ""
    
    # Infrastructure Health
    log_info "Infrastructure Components:"
    printf "%-20s %-12s %-15s %-20s\n" "COMPONENT" "STATUS" "HEALTH" "RESOURCE USAGE"
    printf "%-20s %-12s %-15s %-20s\n" "---------" "------" "------" "--------------"
    
    infrastructure_services=(
        "postgres-primary:5432"
        "postgres-replica:5432"
        "redis-master:6379"
        "redis-replica-1:6379"
        "minio-1:9000"
        "elasticsearch:9200"
        "prometheus:9090"
        "rabbitmq:15672"
    )
    
    for service_config in "${infrastructure_services[@]}"; do
        IFS=':' read -r service port <<< "$service_config"
        
        local status
        if docker-compose -f "$COMPOSE_FILE" ps "$service" | grep -q "Up"; then
            status="Running"
        else
            status="Down"
        fi
        
        local health
        health=$(check_service_health "$service" "$port" "/health" 2>/dev/null || echo "UNKNOWN")
        
        local resources
        resources=$(get_service_resources "$service")
        
        if [[ "$status" == "Running" ]] && [[ "$health" == "HEALTHY" ]]; then
            printf "${GREEN}%-20s${NC} %-12s %-15s %-20s\n" "$service" "$status" "$health" "$resources"
        elif [[ "$status" == "Running" ]]; then
            printf "${YELLOW}%-20s${NC} %-12s %-15s %-20s\n" "$service" "$status" "$health" "$resources"
        else
            printf "${RED}%-20s${NC} %-12s %-15s %-20s\n" "$service" "$status" "$health" "$resources"
        fi
    done
    
    echo ""
    
    # Media Services Health
    log_info "Media Processing Services:"
    printf "%-20s %-12s %-15s %-20s\n" "SERVICE" "STATUS" "HEALTH" "RESOURCE USAGE"
    printf "%-20s %-12s %-15s %-20s\n" "-------" "------" "------" "--------------"
    
    media_services=(
        "media-storage:3001"
        "video-transcoding:3002"
        "image-optimizer:3003"
        "upload-service:3004"
        "security-scanner:3005"
        "cdn-manager:3006"
        "media-analytics:3007"
        "responsive-delivery:3008"
        "media-workers:3001"
    )
    
    for service_config in "${media_services[@]}"; do
        IFS=':' read -r service port <<< "$service_config"
        
        local status
        if docker-compose -f "$COMPOSE_FILE" ps "$service" | grep -q "Up"; then
            status="Running"
        else
            status="Down"
        fi
        
        local health
        health=$(check_service_health "$service" "$port" "/health" 2>/dev/null || echo "UNKNOWN")
        
        local resources
        resources=$(get_service_resources "$service")
        
        if [[ "$status" == "Running" ]] && [[ "$health" == "HEALTHY" ]]; then
            printf "${GREEN}%-20s${NC} %-12s %-15s %-20s\n" "$service" "$status" "$health" "$resources"
        elif [[ "$status" == "Running" ]]; then
            printf "${YELLOW}%-20s${NC} %-12s %-15s %-20s\n" "$service" "$status" "$health" "$resources"
        else
            printf "${RED}%-20s${NC} %-12s %-15s %-20s\n" "$service" "$status" "$health" "$resources"
        fi
    done
    
    echo ""
    
    # System Resources
    show_system_resources
    
    # Quick Summary
    echo ""
    local total_services=17
    local healthy_services
    healthy_services=$(docker-compose -f "$COMPOSE_FILE" ps | grep -c "Up" || echo "0")
    
    if [[ $healthy_services -eq $total_services ]]; then
        log_success "All $total_services services are running"
    else
        log_warning "$healthy_services/$total_services services are running"
    fi
}

# Show system resources
show_system_resources() {
    log_info "System Resources:"
    
    # CPU Usage
    local cpu_usage
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')
    
    # Memory Usage
    local memory_info
    memory_info=$(free -m | awk 'NR==2{printf "%.1f%% (%s/%sMB)", $3*100/$2, $3, $2}')
    
    # Disk Usage
    local disk_usage
    disk_usage=$(df -h / | awk 'NR==2{printf "%s (%s)", $5, $4}')
    
    # Load Average
    local load_avg
    load_avg=$(uptime | awk -F'load average:' '{print $2}')
    
    printf "%-15s %-20s\n" "CPU Usage:" "$cpu_usage%"
    printf "%-15s %-20s\n" "Memory Usage:" "$memory_info"
    printf "%-15s %-20s\n" "Disk Usage:" "$disk_usage"
    printf "%-15s %-20s\n" "Load Average:" "$load_avg"
}

# Test all service endpoints
test_endpoints() {
    log_info "Testing service endpoints..."
    echo ""
    
    endpoints=(
        "HAProxy Stats:http://localhost:8404/stats"
        "Grafana:http://localhost:3000"
        "Prometheus:http://localhost:9090"
        "Jaeger:http://localhost:16686"
        "MinIO Console:http://localhost:9001"
        "RabbitMQ:http://localhost:15672"
        "Elasticsearch:http://localhost:9200"
    )
    
    for endpoint_config in "${endpoints[@]}"; do
        IFS=':' read -r name url <<< "$endpoint_config"
        
        if curl -sf "$url" >/dev/null 2>&1; then
            log_success "$name is accessible at $url"
        else
            log_error "$name is NOT accessible at $url"
        fi
    done
}

# Performance metrics
show_performance_metrics() {
    log_info "Performance Metrics:"
    echo ""
    
    # Media processing queue sizes (if available)
    if curl -sf "http://localhost:15672/api/queues" >/dev/null 2>&1; then
        log_info "Queue Status:"
        # This would require RabbitMQ API credentials
        echo "  • Check RabbitMQ Management UI for detailed queue metrics"
    fi
    
    # MinIO statistics
    if command -v mc &> /dev/null; then
        log_info "Storage Metrics:"
        echo "  • Check MinIO Console for storage statistics"
    fi
    
    # Recent errors from logs
    log_info "Recent Error Summary:"
    if [[ -f "$LOG_FILE" ]]; then
        local error_count
        error_count=$(grep -c "ERROR\|CRITICAL" "$LOG_FILE" | tail -100 || echo "0")
        echo "  • Last 100 log entries: $error_count errors/critical issues"
    fi
}

# Continuous monitoring
watch_health() {
    log_info "Starting continuous health monitoring (press Ctrl+C to stop)..."
    
    while true; do
        clear
        show_platform_status
        echo ""
        echo "Last updated: $(date)"
        echo "Press Ctrl+C to stop monitoring"
        sleep 30
    done
}

# Generate comprehensive report
generate_report() {
    echo "CRYB Media Platform Health Report"
    echo "Generated: $(date)"
    echo "=============================================="
    echo ""
    
    show_platform_status
    echo ""
    echo "=============================================="
    echo "ENDPOINT TESTS"
    echo "=============================================="
    test_endpoints
    echo ""
    echo "=============================================="
    echo "PERFORMANCE METRICS"
    echo "=============================================="
    show_performance_metrics
    echo ""
    echo "=============================================="
    echo "DOCKER COMPOSE STATUS"
    echo "=============================================="
    docker-compose -f "$COMPOSE_FILE" ps
    echo ""
    echo "=============================================="
    echo "RECENT LOG ENTRIES"
    echo "=============================================="
    if [[ -f "$LOG_FILE" ]]; then
        tail -50 "$LOG_FILE"
    else
        echo "No log file found at $LOG_FILE"
    fi
}

# Check for alerts
check_alerts() {
    log_info "Checking for system alerts..."
    
    local alerts_found=false
    
    # Check for high resource usage
    for service_config in $(docker-compose -f "$COMPOSE_FILE" ps --services); do
        local resources
        resources=$(get_service_resources "$service_config")
        
        local cpu_usage
        cpu_usage=$(echo "$resources" | awk '{print $1}' | sed 's/%//')
        
        if (( $(echo "$cpu_usage > $ALERT_THRESHOLD_CPU" | bc -l) )); then
            log_warning "High CPU usage detected for $service_config: $cpu_usage%"
            alerts_found=true
        fi
    done
    
    # Check system disk usage
    local disk_usage
    disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [[ $disk_usage -gt $ALERT_THRESHOLD_DISK ]]; then
        log_critical "High disk usage detected: $disk_usage%"
        alerts_found=true
    fi
    
    if ! $alerts_found; then
        log_success "No alerts detected"
    fi
}

# Main execution
main() {
    # Ensure log directory exists
    mkdir -p "$(dirname "$LOG_FILE")"
    
    if [[ $# -eq 0 ]]; then
        show_platform_status
        exit 0
    fi
    
    local command=$1
    
    case $command in
        "status")
            show_platform_status
            ;;
        "detailed")
            show_platform_status
            echo ""
            test_endpoints
            echo ""
            show_performance_metrics
            ;;
        "services")
            show_platform_status | grep -A 20 "Media Processing Services:"
            ;;
        "infrastructure")
            show_platform_status | grep -A 15 "Infrastructure Components:"
            ;;
        "performance")
            show_performance_metrics
            ;;
        "alerts")
            check_alerts
            ;;
        "watch")
            watch_health
            ;;
        "test-endpoints")
            test_endpoints
            ;;
        "generate-report")
            generate_report
            ;;
        *)
            log_error "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
}

# Check if Docker Compose file exists
if [[ ! -f "$COMPOSE_FILE" ]]; then
    log_error "Docker Compose file not found: $COMPOSE_FILE"
    log_info "Please run this script from the project root directory"
    exit 1
fi

# Execute main function
main "$@"