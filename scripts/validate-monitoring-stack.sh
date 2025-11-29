#!/bin/bash

# ==============================================
# CRYB Platform - Monitoring Stack Validation
# ==============================================
# Comprehensive end-to-end testing of the monitoring infrastructure
# ==============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROMETHEUS_URL="http://localhost:9090"
GRAFANA_URL="http://localhost:3005"
LOKI_URL="http://localhost:3100"
ALERTMANAGER_URL="http://localhost:9093"
API_URL="http://localhost:3001"

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((TESTS_PASSED++))
}

error() {
    echo -e "${RED}❌ $1${NC}"
    ((TESTS_FAILED++))
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Test function wrapper
run_test() {
    local test_name="$1"
    local test_function="$2"
    
    log "Running test: $test_name"
    if $test_function; then
        success "$test_name"
    else
        error "$test_name"
    fi
    echo ""
}

# ==============================================
# PROMETHEUS TESTS
# ==============================================

test_prometheus_health() {
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$PROMETHEUS_URL/-/healthy")
    if [ "$response" = "200" ]; then
        return 0
    else
        echo "Prometheus health check failed with status: $response"
        return 1
    fi
}

test_prometheus_config() {
    local response=$(curl -s "$PROMETHEUS_URL/api/v1/status/config")
    if echo "$response" | jq -e '.status == "success"' > /dev/null 2>&1; then
        return 0
    else
        echo "Prometheus config validation failed"
        return 1
    fi
}

test_prometheus_targets() {
    local response=$(curl -s "$PROMETHEUS_URL/api/v1/targets")
    local healthy_targets=$(echo "$response" | jq -r '.data.activeTargets[] | select(.health == "up") | .labels.job' | wc -l)
    
    if [ "$healthy_targets" -gt 0 ]; then
        log "Found $healthy_targets healthy targets"
        return 0
    else
        echo "No healthy Prometheus targets found"
        return 1
    fi
}

test_prometheus_metrics() {
    # Test for specific CRYB metrics
    local metrics=(
        "cryb_daily_active_users"
        "http_requests_total"
        "socketio_connected_clients"
        "cryb_voice_calls_total"
    )
    
    for metric in "${metrics[@]}"; do
        local response=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=$metric")
        if echo "$response" | jq -e '.data.result | length > 0' > /dev/null 2>&1; then
            log "✓ Metric $metric is being collected"
        else
            warning "Metric $metric not found or has no data"
        fi
    done
    
    return 0
}

test_prometheus_rules() {
    local response=$(curl -s "$PROMETHEUS_URL/api/v1/rules")
    local rule_groups=$(echo "$response" | jq -r '.data.groups | length')
    
    if [ "$rule_groups" -gt 0 ]; then
        log "Found $rule_groups alerting rule groups"
        return 0
    else
        echo "No alerting rules found"
        return 1
    fi
}

# ==============================================
# GRAFANA TESTS
# ==============================================

test_grafana_health() {
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$GRAFANA_URL/api/health")
    if [ "$response" = "200" ]; then
        return 0
    else
        echo "Grafana health check failed with status: $response"
        return 1
    fi
}

test_grafana_datasources() {
    # Test with default admin credentials (should be changed in production)
    local response=$(curl -s -u admin:admin123 "$GRAFANA_URL/api/datasources")
    local datasources=$(echo "$response" | jq -r '. | length')
    
    if [ "$datasources" -gt 0 ]; then
        log "Found $datasources configured data sources"
        return 0
    else
        echo "No Grafana data sources found"
        return 1
    fi
}

test_grafana_dashboards() {
    local response=$(curl -s -u admin:admin123 "$GRAFANA_URL/api/search?type=dash-db")
    local dashboards=$(echo "$response" | jq -r '. | length')
    
    if [ "$dashboards" -gt 0 ]; then
        log "Found $dashboards dashboards"
        
        # Check for specific CRYB dashboards
        local cryb_dashboards=$(echo "$response" | jq -r '.[] | select(.title | contains("CRYB")) | .title')
        if [ -n "$cryb_dashboards" ]; then
            log "CRYB-specific dashboards found:"
            echo "$cryb_dashboards" | while read dashboard; do
                log "  - $dashboard"
            done
        fi
        
        return 0
    else
        echo "No Grafana dashboards found"
        return 1
    fi
}

# ==============================================
# LOKI TESTS
# ==============================================

test_loki_health() {
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$LOKI_URL/ready")
    if [ "$response" = "200" ]; then
        return 0
    else
        echo "Loki health check failed with status: $response"
        return 1
    fi
}

test_loki_ingestion() {
    # Test log ingestion by checking for recent logs
    local query='rate({job=~".*"}[5m])'
    local response=$(curl -s -G "$LOKI_URL/loki/api/v1/query" --data-urlencode "query=$query")
    
    if echo "$response" | jq -e '.data.result | length > 0' > /dev/null 2>&1; then
        local log_rate=$(echo "$response" | jq -r '.data.result[0].value[1]')
        log "Log ingestion rate: $log_rate logs/sec"
        return 0
    else
        echo "No log ingestion detected"
        return 1
    fi
}

test_loki_labels() {
    local response=$(curl -s "$LOKI_URL/loki/api/v1/labels")
    local labels=$(echo "$response" | jq -r '.data | length')
    
    if [ "$labels" -gt 0 ]; then
        log "Found $labels log labels"
        return 0
    else
        echo "No log labels found"
        return 1
    fi
}

# ==============================================
# ALERTMANAGER TESTS
# ==============================================

test_alertmanager_health() {
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$ALERTMANAGER_URL/-/healthy")
    if [ "$response" = "200" ]; then
        return 0
    else
        echo "Alertmanager health check failed with status: $response"
        return 1
    fi
}

test_alertmanager_config() {
    local response=$(curl -s "$ALERTMANAGER_URL/api/v1/status")
    if echo "$response" | jq -e '.status == "success"' > /dev/null 2>&1; then
        local version=$(echo "$response" | jq -r '.data.versionInfo.version')
        log "Alertmanager version: $version"
        return 0
    else
        echo "Alertmanager config validation failed"
        return 1
    fi
}

test_alertmanager_receivers() {
    local response=$(curl -s "$ALERTMANAGER_URL/api/v1/receivers")
    local receivers=$(echo "$response" | jq -r '.data | length')
    
    if [ "$receivers" -gt 0 ]; then
        log "Found $receivers alert receivers"
        return 0
    else
        echo "No alert receivers configured"
        return 1
    fi
}

# ==============================================
# API INTEGRATION TESTS
# ==============================================

test_api_health() {
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")
    if [ "$response" = "200" ]; then
        return 0
    else
        echo "API health check failed with status: $response"
        return 1
    fi
}

test_api_metrics_endpoint() {
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/metrics")
    if [ "$response" = "200" ]; then
        return 0
    else
        echo "API metrics endpoint failed with status: $response"
        return 1
    fi
}

test_api_monitoring_health() {
    local response=$(curl -s "$API_URL/health/monitoring")
    if echo "$response" | jq -e '.overall == "healthy"' > /dev/null 2>&1; then
        local services=$(echo "$response" | jq -r '.services | keys | length')
        log "Monitoring integration healthy with $services services"
        return 0
    else
        echo "API monitoring integration unhealthy"
        return 1
    fi
}

# ==============================================
# INTEGRATION TESTS
# ==============================================

test_prometheus_alertmanager_integration() {
    # Check if Prometheus can reach Alertmanager
    local response=$(curl -s "$PROMETHEUS_URL/api/v1/alertmanagers")
    local active_alertmanagers=$(echo "$response" | jq -r '.data.activeAlertmanagers | length')
    
    if [ "$active_alertmanagers" -gt 0 ]; then
        log "Prometheus connected to $active_alertmanagers Alertmanager(s)"
        return 0
    else
        echo "Prometheus not connected to any Alertmanagers"
        return 1
    fi
}

test_grafana_prometheus_integration() {
    # Test Grafana can query Prometheus
    local datasource_test=$(curl -s -u admin:admin123 "$GRAFANA_URL/api/datasources/proxy/1/api/v1/query?query=up")
    if echo "$datasource_test" | jq -e '.data.result | length > 0' > /dev/null 2>&1; then
        return 0
    else
        echo "Grafana cannot query Prometheus"
        return 1
    fi
}

test_complete_pipeline() {
    # Test the complete monitoring pipeline by generating a test metric
    log "Testing complete monitoring pipeline..."
    
    # Make API request to generate metrics
    curl -s "$API_URL/health" > /dev/null
    
    # Wait for metrics to be scraped
    sleep 15
    
    # Check if metrics appear in Prometheus
    local response=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=http_requests_total")
    if echo "$response" | jq -e '.data.result | length > 0' > /dev/null 2>&1; then
        log "Complete pipeline working: API -> Prometheus"
        return 0
    else
        echo "Complete pipeline test failed"
        return 1
    fi
}

# ==============================================
# MAIN EXECUTION
# ==============================================

main() {
    echo "=========================================="
    echo "🔍 CRYB Platform Monitoring Stack Validation"
    echo "=========================================="
    echo ""
    
    log "Starting comprehensive monitoring stack validation..."
    echo ""
    
    # Check prerequisites
    command -v curl >/dev/null 2>&1 || { error "curl is required but not installed"; exit 1; }
    command -v jq >/dev/null 2>&1 || { error "jq is required but not installed"; exit 1; }
    
    # Prometheus Tests
    echo "🔥 Testing Prometheus..."
    run_test "Prometheus Health Check" test_prometheus_health
    run_test "Prometheus Configuration" test_prometheus_config
    run_test "Prometheus Targets" test_prometheus_targets
    run_test "Prometheus Metrics Collection" test_prometheus_metrics
    run_test "Prometheus Alerting Rules" test_prometheus_rules
    
    # Grafana Tests
    echo "📊 Testing Grafana..."
    run_test "Grafana Health Check" test_grafana_health
    run_test "Grafana Data Sources" test_grafana_datasources
    run_test "Grafana Dashboards" test_grafana_dashboards
    
    # Loki Tests
    echo "📝 Testing Loki..."
    run_test "Loki Health Check" test_loki_health
    run_test "Loki Log Ingestion" test_loki_ingestion
    run_test "Loki Labels" test_loki_labels
    
    # Alertmanager Tests
    echo "🚨 Testing Alertmanager..."
    run_test "Alertmanager Health Check" test_alertmanager_health
    run_test "Alertmanager Configuration" test_alertmanager_config
    run_test "Alertmanager Receivers" test_alertmanager_receivers
    
    # API Integration Tests
    echo "🔗 Testing API Integration..."
    run_test "API Health Check" test_api_health
    run_test "API Metrics Endpoint" test_api_metrics_endpoint
    run_test "API Monitoring Integration" test_api_monitoring_health
    
    # Integration Tests
    echo "🔄 Testing Service Integration..."
    run_test "Prometheus-Alertmanager Integration" test_prometheus_alertmanager_integration
    run_test "Grafana-Prometheus Integration" test_grafana_prometheus_integration
    run_test "Complete Monitoring Pipeline" test_complete_pipeline
    
    # Results Summary
    echo "=========================================="
    echo "📋 VALIDATION RESULTS"
    echo "=========================================="
    echo ""
    success "Tests Passed: $TESTS_PASSED"
    if [ $TESTS_FAILED -gt 0 ]; then
        error "Tests Failed: $TESTS_FAILED"
        echo ""
        warning "Some monitoring components need attention!"
        echo ""
        echo "Next steps:"
        echo "1. Check failed services are running"
        echo "2. Verify network connectivity"
        echo "3. Check service logs for errors"
        echo "4. Ensure all configuration files are correct"
        exit 1
    else
        echo ""
        success "🎉 All monitoring stack components are healthy!"
        echo ""
        echo "Your monitoring infrastructure is ready for production:"
        echo "• Prometheus: $PROMETHEUS_URL"
        echo "• Grafana: $GRAFANA_URL (admin:admin123)"
        echo "• Loki: $LOKI_URL"
        echo "• Alertmanager: $ALERTMANAGER_URL"
        echo ""
        echo "Don't forget to:"
        echo "1. Change default passwords"
        echo "2. Configure notification channels"
        echo "3. Set up external monitoring"
        echo "4. Create runbooks for alerts"
        exit 0
    fi
}

# Run main function
main "$@"