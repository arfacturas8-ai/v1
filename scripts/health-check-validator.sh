#!/bin/bash

# ==============================================
# CRYB PLATFORM - COMPREHENSIVE HEALTH VALIDATOR
# ==============================================
# Production-ready health checking system
# Features:
# - Multi-layer health validation
# - Dependency checking
# - Performance monitoring
# - Automated remediation
# - Detailed reporting
# ==============================================

set -euo pipefail

# Configuration
HEALTH_LOG="/var/log/health-check-validator.log"
REPORT_DIR="/var/log/health-reports"
TIMEOUT=30
CRITICAL_THRESHOLD=90
WARNING_THRESHOLD=70

# Service endpoints
declare -A SERVICES=(
    ["api-primary"]="http://localhost:3001/health"
    ["api-secondary"]="http://localhost:3002/health"
    ["web-primary"]="http://localhost:3000/api/health"
    ["web-secondary"]="http://localhost:3001/api/health"
    ["postgres"]="http://localhost:5432"
    ["pgbouncer"]="http://localhost:6432"
    ["redis"]="http://localhost:6379"
    ["elasticsearch"]="http://localhost:9200/_cluster/health"
    ["minio"]="http://localhost:9000/minio/health/live"
    ["prometheus"]="http://localhost:9090/-/healthy"
    ["grafana"]="http://localhost:3002/api/health"
    ["nginx"]="http://localhost/health"
    ["livekit"]="http://localhost:7880/health"
)

# Notification webhooks
WEBHOOK_URL=${HEALTH_WEBHOOK_URL:-}
SLACK_WEBHOOK=${SLACK_WEBHOOK:-}
PAGER_DUTY_KEY=${PAGER_DUTY_INTEGRATION_KEY:-}

# ==============================================
# LOGGING FUNCTIONS
# ==============================================
setup_logging() {
    mkdir -p "$(dirname "$HEALTH_LOG")"
    mkdir -p "$REPORT_DIR"
    
    # Rotate log if it gets too large
    if [[ -f "$HEALTH_LOG" ]] && [[ $(stat -f%z "$HEALTH_LOG" 2>/dev/null || stat -c%s "$HEALTH_LOG") -gt 10485760 ]]; then
        mv "$HEALTH_LOG" "${HEALTH_LOG}.old"
    fi
}

log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1" | tee -a "$HEALTH_LOG"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$HEALTH_LOG" >&2
}

log_warning() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1" | tee -a "$HEALTH_LOG"
}

log_critical() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] CRITICAL: $1" | tee -a "$HEALTH_LOG" >&2
}

log_success() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $1" | tee -a "$HEALTH_LOG"
}

# ==============================================
# NOTIFICATION FUNCTIONS
# ==============================================
send_alert() {
    local severity="$1"
    local service="$2"
    local message="$3"
    local details="${4:-}"
    
    local emoji=""
    local color=""
    case "$severity" in
        "CRITICAL") emoji="🔴"; color="danger" ;;
        "WARNING") emoji="🟡"; color="warning" ;;
        "INFO") emoji="ℹ️"; color="good" ;;
        "SUCCESS") emoji="✅"; color="good" ;;
        *) emoji="⚪"; color="warning" ;;
    esac
    
    local payload="{
        \"service\": \"$service\",
        \"severity\": \"$severity\",
        \"message\": \"$message\",
        \"details\": \"$details\",
        \"timestamp\": \"$(date -Iseconds)\",
        \"environment\": \"production\"
    }"
    
    # Slack notification
    if [[ -n "$SLACK_WEBHOOK" ]]; then
        curl -X POST "$SLACK_WEBHOOK" \
            -H 'Content-type: application/json' \
            --data "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"title\": \"$emoji Health Check Alert\",
                    \"fields\": [
                        {\"title\": \"Service\", \"value\": \"$service\", \"short\": true},
                        {\"title\": \"Severity\", \"value\": \"$severity\", \"short\": true},
                        {\"title\": \"Message\", \"value\": \"$message\", \"short\": false}
                    ],
                    \"footer\": \"CRYB Platform Health Monitor\",
                    \"ts\": $(date +%s)
                }]
            }" \
            2>/dev/null || log_warning "Failed to send Slack notification"
    fi
    
    # PagerDuty notification for critical issues
    if [[ -n "$PAGER_DUTY_KEY" ]] && [[ "$severity" == "CRITICAL" ]]; then
        curl -X POST "https://events.pagerduty.com/v2/enqueue" \
            -H 'Content-Type: application/json' \
            --data "{
                \"routing_key\": \"$PAGER_DUTY_KEY\",
                \"event_action\": \"trigger\",
                \"dedup_key\": \"health-check-$service\",
                \"payload\": {
                    \"summary\": \"$service - $message\",
                    \"source\": \"cryb-health-monitor\",
                    \"severity\": \"critical\",
                    \"component\": \"$service\",
                    \"group\": \"infrastructure\",
                    \"class\": \"health-check\"
                }
            }" \
            2>/dev/null || log_warning "Failed to send PagerDuty notification"
    fi
    
    # Generic webhook
    if [[ -n "$WEBHOOK_URL" ]]; then
        curl -X POST "$WEBHOOK_URL" \
            -H 'Content-type: application/json' \
            --data "$payload" \
            2>/dev/null || log_warning "Failed to send webhook notification"
    fi
}

# ==============================================
# HEALTH CHECK FUNCTIONS
# ==============================================
check_http_endpoint() {
    local name="$1"
    local url="$2"
    local expected_code="${3:-200}"
    
    local response
    local http_code
    local response_time
    
    # Perform HTTP check with timing
    local start_time=$(date +%s%3N)
    
    if response=$(curl -s -w "%{http_code}" --max-time "$TIMEOUT" "$url" 2>/dev/null); then
        http_code="${response: -3}"
        response_body="${response%???}"
        local end_time=$(date +%s%3N)
        response_time=$((end_time - start_time))
        
        if [[ "$http_code" == "$expected_code" ]]; then
            log_success "$name endpoint healthy (${response_time}ms)"
            return 0
        else
            log_error "$name endpoint returned HTTP $http_code (expected $expected_code)"
            send_alert "CRITICAL" "$name" "HTTP health check failed" "HTTP Code: $http_code, Response: ${response_body:0:200}"
            return 1
        fi
    else
        log_error "$name endpoint unreachable"
        send_alert "CRITICAL" "$name" "Endpoint unreachable" "URL: $url"
        return 1
    fi
}

check_database_connection() {
    local service="$1"
    local host="$2"
    local port="$3"
    local user="$4"
    local database="$5"
    
    log_info "Checking $service database connection..."
    
    if docker exec cryb-postgres-production pg_isready -h "$host" -p "$port" -U "$user" -d "$database" >/dev/null 2>&1; then
        # Check connection count
        local connection_count
        connection_count=$(docker exec cryb-postgres-production psql -h "$host" -p "$port" -U "$user" -d "$database" -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null | xargs)
        
        if [[ "$connection_count" -gt 180 ]]; then
            log_warning "$service has high connection count: $connection_count"
            send_alert "WARNING" "$service" "High connection count" "Active connections: $connection_count/200"
        fi
        
        log_success "$service database connection healthy ($connection_count active connections)"
        return 0
    else
        log_error "$service database connection failed"
        send_alert "CRITICAL" "$service" "Database connection failed" "Host: $host:$port"
        return 1
    fi
}

check_redis_connection() {
    log_info "Checking Redis connection and performance..."
    
    local redis_response
    local memory_usage
    local connected_clients
    
    if redis_response=$(docker exec cryb-redis-production redis-cli ping 2>/dev/null); then
        if [[ "$redis_response" == "PONG" ]]; then
            # Get Redis info
            local redis_info
            redis_info=$(docker exec cryb-redis-production redis-cli info memory 2>/dev/null)
            memory_usage=$(echo "$redis_info" | grep "used_memory_human" | cut -d: -f2 | tr -d '\r')
            
            redis_info=$(docker exec cryb-redis-production redis-cli info clients 2>/dev/null)
            connected_clients=$(echo "$redis_info" | grep "connected_clients" | cut -d: -f2 | tr -d '\r')
            
            log_success "Redis connection healthy (Memory: $memory_usage, Clients: $connected_clients)"
            
            # Check for high memory usage
            local memory_pct
            memory_pct=$(docker exec cryb-redis-production redis-cli info memory | grep "used_memory_pct" | cut -d: -f2 | tr -d '\r' | cut -d. -f1)
            
            if [[ "${memory_pct:-0}" -gt 85 ]]; then
                log_warning "Redis memory usage high: ${memory_pct}%"
                send_alert "WARNING" "Redis" "High memory usage" "Memory usage: ${memory_pct}%"
            fi
            
            return 0
        fi
    fi
    
    log_error "Redis connection failed"
    send_alert "CRITICAL" "Redis" "Connection failed" "Redis ping failed"
    return 1
}

check_elasticsearch_cluster() {
    log_info "Checking Elasticsearch cluster health..."
    
    local cluster_health
    if cluster_health=$(curl -s --max-time "$TIMEOUT" "http://localhost:9200/_cluster/health" 2>/dev/null); then
        local status
        local active_shards
        local unassigned_shards
        
        status=$(echo "$cluster_health" | jq -r '.status' 2>/dev/null || echo "unknown")
        active_shards=$(echo "$cluster_health" | jq -r '.active_shards' 2>/dev/null || echo "0")
        unassigned_shards=$(echo "$cluster_health" | jq -r '.unassigned_shards' 2>/dev/null || echo "0")
        
        case "$status" in
            "green")
                log_success "Elasticsearch cluster healthy (Status: $status, Active shards: $active_shards)"
                return 0
                ;;
            "yellow")
                log_warning "Elasticsearch cluster degraded (Status: $status, Unassigned shards: $unassigned_shards)"
                send_alert "WARNING" "Elasticsearch" "Cluster degraded" "Status: $status, Unassigned shards: $unassigned_shards"
                return 0
                ;;
            "red"|*)
                log_error "Elasticsearch cluster unhealthy (Status: $status)"
                send_alert "CRITICAL" "Elasticsearch" "Cluster unhealthy" "Status: $status"
                return 1
                ;;
        esac
    else
        log_error "Elasticsearch cluster unreachable"
        send_alert "CRITICAL" "Elasticsearch" "Cluster unreachable"
        return 1
    fi
}

check_system_resources() {
    log_info "Checking system resources..."
    
    # Check CPU usage
    local cpu_usage
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
    
    if (( $(echo "$cpu_usage > $CRITICAL_THRESHOLD" | bc -l) )); then
        log_critical "CPU usage critical: ${cpu_usage}%"
        send_alert "CRITICAL" "System" "High CPU usage" "CPU usage: ${cpu_usage}%"
    elif (( $(echo "$cpu_usage > $WARNING_THRESHOLD" | bc -l) )); then
        log_warning "CPU usage high: ${cpu_usage}%"
        send_alert "WARNING" "System" "High CPU usage" "CPU usage: ${cpu_usage}%"
    else
        log_success "CPU usage normal: ${cpu_usage}%"
    fi
    
    # Check memory usage
    local memory_info
    memory_info=$(free | grep Mem)
    local total_mem=$(echo "$memory_info" | awk '{print $2}')
    local used_mem=$(echo "$memory_info" | awk '{print $3}')
    local memory_pct=$(( (used_mem * 100) / total_mem ))
    
    if [[ $memory_pct -gt $CRITICAL_THRESHOLD ]]; then
        log_critical "Memory usage critical: ${memory_pct}%"
        send_alert "CRITICAL" "System" "High memory usage" "Memory usage: ${memory_pct}%"
    elif [[ $memory_pct -gt $WARNING_THRESHOLD ]]; then
        log_warning "Memory usage high: ${memory_pct}%"
        send_alert "WARNING" "System" "High memory usage" "Memory usage: ${memory_pct}%"
    else
        log_success "Memory usage normal: ${memory_pct}%"
    fi
    
    # Check disk usage
    local disk_usage
    disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [[ $disk_usage -gt $CRITICAL_THRESHOLD ]]; then
        log_critical "Disk usage critical: ${disk_usage}%"
        send_alert "CRITICAL" "System" "High disk usage" "Disk usage: ${disk_usage}%"
    elif [[ $disk_usage -gt $WARNING_THRESHOLD ]]; then
        log_warning "Disk usage high: ${disk_usage}%"
        send_alert "WARNING" "System" "High disk usage" "Disk usage: ${disk_usage}%"
    else
        log_success "Disk usage normal: ${disk_usage}%"
    fi
}

check_docker_containers() {
    log_info "Checking Docker container health..."
    
    local containers
    containers=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep -v "NAMES")
    
    local unhealthy_containers=()
    local stopped_containers=()
    
    while IFS=$'\t' read -r container_name status; do
        if [[ "$status" =~ "Up" ]]; then
            if [[ "$status" =~ "unhealthy" ]]; then
                unhealthy_containers+=("$container_name")
                log_error "Container $container_name is unhealthy"
            else
                log_success "Container $container_name is healthy"
            fi
        else
            stopped_containers+=("$container_name")
            log_error "Container $container_name is not running: $status"
        fi
    done <<< "$containers"
    
    if [[ ${#unhealthy_containers[@]} -gt 0 ]]; then
        send_alert "CRITICAL" "Docker" "Unhealthy containers detected" "Containers: ${unhealthy_containers[*]}"
        return 1
    fi
    
    if [[ ${#stopped_containers[@]} -gt 0 ]]; then
        send_alert "CRITICAL" "Docker" "Stopped containers detected" "Containers: ${stopped_containers[*]}"
        return 1
    fi
    
    return 0
}

check_network_connectivity() {
    log_info "Checking network connectivity..."
    
    local test_urls=(
        "https://www.google.com"
        "https://registry.npmjs.org"
        "https://registry-1.docker.io"
    )
    
    local failed_urls=()
    
    for url in "${test_urls[@]}"; do
        if ! curl -s --max-time 10 --head "$url" >/dev/null 2>&1; then
            failed_urls+=("$url")
            log_error "Network connectivity failed to $url"
        else
            log_success "Network connectivity to $url successful"
        fi
    done
    
    if [[ ${#failed_urls[@]} -gt 0 ]]; then
        send_alert "WARNING" "Network" "Network connectivity issues" "Failed URLs: ${failed_urls[*]}"
        return 1
    fi
    
    return 0
}

# ==============================================
# REMEDIATION FUNCTIONS
# ==============================================
attempt_service_recovery() {
    local service="$1"
    
    log_info "Attempting recovery for $service..."
    
    case "$service" in
        "api-primary"|"api-secondary")
            docker restart "cryb-api-${service#*-}" 2>/dev/null || return 1
            ;;
        "web-primary"|"web-secondary")
            docker restart "cryb-web-${service#*-}" 2>/dev/null || return 1
            ;;
        "postgres")
            docker restart cryb-postgres-production 2>/dev/null || return 1
            ;;
        "redis")
            docker restart cryb-redis-production 2>/dev/null || return 1
            ;;
        "elasticsearch")
            docker restart cryb-elasticsearch-production 2>/dev/null || return 1
            ;;
        "nginx")
            docker restart cryb-nginx-production 2>/dev/null || return 1
            ;;
        *)
            log_warning "No recovery procedure defined for $service"
            return 1
            ;;
    esac
    
    # Wait for service to start
    sleep 10
    
    log_info "Recovery attempt completed for $service"
    return 0
}

# ==============================================
# REPORTING FUNCTIONS
# ==============================================
generate_health_report() {
    local report_file="$REPORT_DIR/health-report-$(date +%Y%m%d_%H%M%S).json"
    
    log_info "Generating comprehensive health report..."
    
    local start_time=$(date -Iseconds)
    local healthy_services=0
    local total_services=${#SERVICES[@]}
    local failed_services=()
    
    # Test all services
    for service in "${!SERVICES[@]}"; do
        local url="${SERVICES[$service]}"
        if check_http_endpoint "$service" "$url" >/dev/null 2>&1; then
            ((healthy_services++))
        else
            failed_services+=("$service")
        fi
    done
    
    # System metrics
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
    local memory_usage=$(free | grep Mem | awk '{printf "%.1f", ($3/$2) * 100.0}')
    local disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    # Container status
    local running_containers=$(docker ps --format "{{.Names}}" | wc -l)
    local total_containers=$(docker ps -a --format "{{.Names}}" | wc -l)
    
    # Generate JSON report
    cat > "$report_file" << EOF
{
    "timestamp": "$start_time",
    "environment": "production",
    "summary": {
        "healthy_services": $healthy_services,
        "total_services": $total_services,
        "health_percentage": $(( (healthy_services * 100) / total_services )),
        "status": "$([ ${#failed_services[@]} -eq 0 ] && echo "HEALTHY" || echo "DEGRADED")"
    },
    "services": {
EOF

    local first=true
    for service in "${!SERVICES[@]}"; do
        [[ "$first" == "false" ]] && echo "," >> "$report_file"
        first=false
        
        local url="${SERVICES[$service]}"
        local status="healthy"
        local response_time="0"
        
        if ! check_http_endpoint "$service" "$url" >/dev/null 2>&1; then
            status="unhealthy"
        fi
        
        cat >> "$report_file" << EOF
        "$service": {
            "url": "$url",
            "status": "$status",
            "response_time_ms": $response_time
        }
EOF
    done
    
    cat >> "$report_file" << EOF
    },
    "system_metrics": {
        "cpu_usage_percent": $cpu_usage,
        "memory_usage_percent": $memory_usage,
        "disk_usage_percent": $disk_usage,
        "running_containers": $running_containers,
        "total_containers": $total_containers
    },
    "failed_services": [$(printf '"%s",' "${failed_services[@]}" | sed 's/,$//')],
    "recommendations": [
EOF

    # Add recommendations based on findings
    local recommendations=()
    
    if [[ ${#failed_services[@]} -gt 0 ]]; then
        recommendations+=("\"Investigate failed services: ${failed_services[*]}\"")
    fi
    
    if (( $(echo "$cpu_usage > $WARNING_THRESHOLD" | bc -l) )); then
        recommendations+=("\"High CPU usage detected - consider scaling\"")
    fi
    
    if (( $(echo "$memory_usage > $WARNING_THRESHOLD" | bc -l) )); then
        recommendations+=("\"High memory usage detected - monitor memory leaks\"")
    fi
    
    if [[ $disk_usage -gt $WARNING_THRESHOLD ]]; then
        recommendations+=("\"High disk usage detected - clean up logs and temporary files\"")
    fi
    
    printf '%s\n' "${recommendations[@]}" | sed 's/$/,/' | sed '$ s/,$//' >> "$report_file"
    
    cat >> "$report_file" << EOF
    ]
}
EOF

    log_success "Health report generated: $report_file"
    echo "$report_file"
}

# ==============================================
# MAIN HEALTH CHECK PROCESS
# ==============================================
run_comprehensive_check() {
    local start_time=$(date +%s)
    local failed_checks=0
    
    log_info "=========================================="
    log_info "Starting comprehensive health check"
    log_info "$(date)"
    log_info "=========================================="
    
    # System resource checks
    check_system_resources || ((failed_checks++))
    
    # Docker container checks
    check_docker_containers || ((failed_checks++))
    
    # Network connectivity
    check_network_connectivity || ((failed_checks++))
    
    # Database checks
    check_database_connection "PostgreSQL" "localhost" "5432" "cryb_user" "cryb" || ((failed_checks++))
    check_redis_connection || ((failed_checks++))
    check_elasticsearch_cluster || ((failed_checks++))
    
    # Application service checks
    local service_failures=0
    for service in "${!SERVICES[@]}"; do
        local url="${SERVICES[$service]}"
        if ! check_http_endpoint "$service" "$url"; then
            ((service_failures++))
            
            # Attempt automatic recovery for critical services
            if [[ "$service" =~ ^(api|web|postgres|redis) ]]; then
                log_info "Attempting automatic recovery for critical service: $service"
                if attempt_service_recovery "$service"; then
                    # Re-check after recovery
                    sleep 30
                    if check_http_endpoint "$service" "$url"; then
                        log_success "Service $service recovered successfully"
                        send_alert "INFO" "$service" "Service recovered after automatic remediation"
                    else
                        log_error "Service $service recovery failed"
                        ((failed_checks++))
                    fi
                else
                    log_error "Failed to recover service $service"
                    ((failed_checks++))
                fi
            else
                ((failed_checks++))
            fi
        fi
    done
    
    # Generate comprehensive report
    local report_file
    report_file=$(generate_health_report)
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_info "=========================================="
    if [[ $failed_checks -eq 0 ]]; then
        log_success "Health check completed successfully (${duration}s)"
        send_alert "SUCCESS" "Health Check" "All systems healthy" "Duration: ${duration}s, Report: $(basename "$report_file")"
    elif [[ $failed_checks -le 2 ]]; then
        log_warning "Health check completed with minor issues ($failed_checks failures in ${duration}s)"
        send_alert "WARNING" "Health Check" "Minor issues detected" "Failures: $failed_checks, Duration: ${duration}s"
    else
        log_error "Health check completed with major issues ($failed_checks failures in ${duration}s)"
        send_alert "CRITICAL" "Health Check" "Major issues detected" "Failures: $failed_checks, Duration: ${duration}s"
    fi
    log_info "=========================================="
    
    return $failed_checks
}

# ==============================================
# COMMAND LINE INTERFACE
# ==============================================
show_help() {
    cat << EOF
CRYB Platform Health Check Validator

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    check               Run comprehensive health check
    report              Generate health report only
    monitor             Continuous monitoring mode
    service SERVICE     Check specific service
    recover SERVICE     Attempt service recovery
    status              Show current system status
    help                Show this help message

Examples:
    $0 check                    # Run full health check
    $0 service api-primary      # Check specific service
    $0 monitor                  # Start continuous monitoring
    $0 recover redis           # Attempt Redis recovery

Environment Variables:
    HEALTH_WEBHOOK_URL         Webhook URL for notifications
    SLACK_WEBHOOK             Slack webhook URL
    PAGER_DUTY_INTEGRATION_KEY PagerDuty integration key

EOF
}

continuous_monitoring() {
    log_info "Starting continuous health monitoring..."
    
    while true; do
        run_comprehensive_check
        
        # Wait 5 minutes between checks
        log_info "Waiting 5 minutes before next check..."
        sleep 300
    done
}

check_specific_service() {
    local service="$1"
    
    if [[ -z "${SERVICES[$service]:-}" ]]; then
        log_error "Unknown service: $service"
        echo "Available services: ${!SERVICES[*]}"
        return 1
    fi
    
    local url="${SERVICES[$service]}"
    check_http_endpoint "$service" "$url"
}

# ==============================================
# SCRIPT EXECUTION
# ==============================================
main() {
    local command="${1:-check}"
    
    setup_logging
    
    case "$command" in
        "check")
            run_comprehensive_check
            ;;
        "report")
            generate_health_report
            ;;
        "monitor")
            continuous_monitoring
            ;;
        "service")
            if [[ $# -lt 2 ]]; then
                log_error "Service name required"
                show_help
                exit 1
            fi
            check_specific_service "$2"
            ;;
        "recover")
            if [[ $# -lt 2 ]]; then
                log_error "Service name required"
                show_help
                exit 1
            fi
            attempt_service_recovery "$2"
            ;;
        "status")
            log_info "Current system status:"
            check_system_resources
            check_docker_containers
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            log_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Install required tools if not present
command -v jq >/dev/null || {
    log_warning "Installing jq for JSON processing..."
    apt-get update && apt-get install -y jq 2>/dev/null || {
        log_error "Failed to install jq - some features may not work"
    }
}

# Execute main function
main "$@"