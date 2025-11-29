#!/bin/bash

# ==============================================
# CRYB PLATFORM - SMOKE TESTS
# ==============================================
# Quick smoke tests to verify deployment health
# ==============================================

set -euo pipefail

ENVIRONMENT="${1:-production}"
BASE_URL="${2:-http://localhost}"

case "$ENVIRONMENT" in
    "staging")
        API_URL="https://api-staging.cryb.ai"
        WEB_URL="https://staging.cryb.ai"
        ;;
    "production")
        API_URL="https://api.cryb.ai"
        WEB_URL="https://cryb.ai"
        ;;
    "local")
        API_URL="http://localhost:3006"
        WEB_URL="http://localhost:3001"
        ;;
    *)
        API_URL="$BASE_URL:3006"
        WEB_URL="$BASE_URL:3001"
        ;;
esac

echo "🧪 Running CRYB Platform Smoke Tests"
echo "Environment: $ENVIRONMENT"
echo "API URL: $API_URL"
echo "Web URL: $WEB_URL"
echo ""

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_code="${3:-200}"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -n "Testing $test_name... "
    
    if [[ "$test_command" =~ ^curl ]]; then
        # HTTP test
        response_code=$(eval "$test_command" -w "%{http_code}" -o /dev/null -s)
        if [[ "$response_code" == "$expected_code" ]]; then
            echo "✅ PASS ($response_code)"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo "❌ FAIL (expected $expected_code, got $response_code)"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    else
        # Command test
        if eval "$test_command" >/dev/null 2>&1; then
            echo "✅ PASS"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo "❌ FAIL"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    fi
}

# API Health Tests
echo "🔌 API Health Tests"
echo "─────────────────────"
run_test "API Health Check" "curl -f $API_URL/health"
run_test "API Metrics" "curl -f $API_URL/metrics"
run_test "API Version" "curl -f $API_URL/api/version"

echo ""

# Web Application Tests
echo "🌐 Web Application Tests"
echo "──────────────────────────"
run_test "Web App Root" "curl -f $WEB_URL"
run_test "Web App Health" "curl -f $WEB_URL/api/health"

echo ""

# Database Tests (if accessible)
echo "🗄️ Database Tests"
echo "─────────────────"
if command -v docker &> /dev/null; then
    run_test "PostgreSQL Connection" "docker exec cryb-postgres-production pg_isready -U cryb_user -q"
    run_test "Redis Connection" "docker exec cryb-redis-production redis-cli ping"
else
    echo "⏭️ Skipping database tests (Docker not available)"
fi

echo ""

# Monitoring Tests
echo "📊 Monitoring Tests"
echo "──────────────────"
run_test "Prometheus" "curl -f http://localhost:9090/-/healthy"
run_test "Grafana" "curl -f http://localhost:3011/api/health"

echo ""

# Results
echo "📋 Test Results"
echo "───────────────"
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $FAILED_TESTS"
echo ""

if [[ $FAILED_TESTS -eq 0 ]]; then
    echo "✅ All smoke tests passed!"
    exit 0
else
    echo "❌ $FAILED_TESTS tests failed!"
    exit 1
fi