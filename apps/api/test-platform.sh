#!/bin/bash

# CRYB Platform Quick Functionality Test
# Usage: ./test-platform.sh [--verbose] [--report]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_BASE="http://localhost:3002"
VERBOSE=false
GENERATE_REPORT=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --verbose|-v)
      VERBOSE=true
      shift
      ;;
    --report|-r)
      GENERATE_REPORT=true
      shift
      ;;
    --help|-h)
      echo "CRYB Platform Test Script"
      echo "Usage: $0 [--verbose] [--report]"
      echo "  --verbose, -v  Show detailed test output"
      echo "  --report, -r   Generate comprehensive test report"
      echo "  --help, -h     Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_verbose() {
    if [ "$VERBOSE" = true ]; then
        echo -e "${NC}  → $1"
    fi
}

# Test functions
test_server_connectivity() {
    log_info "Testing server connectivity..."
    
    if curl -s "$API_BASE/health" > /dev/null 2>&1; then
        log_success "Server is responding"
        return 0
    else
        log_error "Server is not responding at $API_BASE"
        return 1
    fi
}

test_health_status() {
    log_info "Checking health status..."
    
    local health_response=$(curl -s "$API_BASE/health" 2>/dev/null)
    local status=$(echo "$health_response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    
    if [ "$status" = "healthy" ] || [ "$status" = "degraded" ]; then
        log_success "Health status: $status"
        log_verbose "Health check response: $health_response"
        return 0
    else
        log_error "Health status: $status"
        return 1
    fi
}

test_api_documentation() {
    log_info "Testing API documentation..."
    
    if curl -s "$API_BASE/documentation" > /dev/null 2>&1; then
        log_success "API documentation accessible"
        return 0
    else
        log_error "API documentation not accessible"
        return 1
    fi
}

test_user_registration() {
    log_info "Testing user registration..."
    
    local timestamp=$(date +%s)
    local test_user="testuser_$timestamp"
    local test_email="test_$timestamp@example.com"
    
    local response=$(curl -s -X POST "$API_BASE/api/v1/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"username\": \"$test_user\",
            \"displayName\": \"Test User\",
            \"email\": \"$test_email\",
            \"password\": \"SecurePassword123!\",
            \"confirmPassword\": \"SecurePassword123!\"
        }" 2>/dev/null)
    
    if echo "$response" | grep -q '"success":true'; then
        log_success "User registration working"
        log_verbose "Registration response: $response"
        echo "$test_user:SecurePassword123!" > /tmp/cryb_test_user.txt
        return 0
    else
        log_error "User registration failed"
        log_verbose "Registration response: $response"
        return 1
    fi
}

test_user_login() {
    log_info "Testing user login..."
    
    if [ ! -f /tmp/cryb_test_user.txt ]; then
        log_error "No test user available for login test"
        return 1
    fi
    
    local credentials=$(cat /tmp/cryb_test_user.txt)
    local username=$(echo "$credentials" | cut -d':' -f1)
    local password=$(echo "$credentials" | cut -d':' -f2)
    
    local response=$(curl -s -X POST "$API_BASE/api/v1/auth/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"username\": \"$username\",
            \"password\": \"$password\"
        }" 2>/dev/null)
    
    if echo "$response" | grep -q '"success":true'; then
        log_success "User login working"
        
        # Extract token for further tests
        local token=$(echo "$response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
        if [ -n "$token" ]; then
            echo "$token" > /tmp/cryb_test_token.txt
            log_verbose "Token extracted and saved"
        fi
        
        log_verbose "Login response: $response"
        return 0
    else
        log_error "User login failed"
        log_verbose "Login response: $response"
        return 1
    fi
}

test_protected_endpoint() {
    log_info "Testing protected endpoint access..."
    
    if [ ! -f /tmp/cryb_test_token.txt ]; then
        log_error "No auth token available for protected endpoint test"
        return 1
    fi
    
    local token=$(cat /tmp/cryb_test_token.txt)
    
    local response=$(curl -s -X GET "$API_BASE/api/v1/users/me" \
        -H "Authorization: Bearer $token" 2>/dev/null)
    
    if echo "$response" | grep -q '"success":true'; then
        log_success "Protected endpoints working"
        log_verbose "User profile response: $response"
        return 0
    else
        log_error "Protected endpoint access failed"
        log_verbose "Response: $response"
        return 1
    fi
}

test_discord_features() {
    log_info "Testing Discord-like features..."
    
    if [ ! -f /tmp/cryb_test_token.txt ]; then
        log_error "No auth token available for Discord features test"
        return 1
    fi
    
    local token=$(cat /tmp/cryb_test_token.txt)
    local timestamp=$(date +%s)
    
    # Test server creation
    local server_response=$(curl -s -X POST "$API_BASE/api/v1/servers" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"TestServer_$timestamp\",
            \"description\": \"Test server for functionality testing\",
            \"isPublic\": true
        }" 2>/dev/null)
    
    if echo "$server_response" | grep -q '"success":true'; then
        log_success "Discord server creation working"
        log_verbose "Server creation response: $server_response"
        
        # Extract server ID for channel test
        local server_id=$(echo "$server_response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        
        if [ -n "$server_id" ]; then
            # Test channel creation
            local channel_response=$(curl -s -X POST "$API_BASE/api/v1/channels" \
                -H "Authorization: Bearer $token" \
                -H "Content-Type: application/json" \
                -d "{
                    \"serverId\": \"$server_id\",
                    \"name\": \"general\",
                    \"description\": \"General discussion\",
                    \"type\": \"TEXT\"
                }" 2>/dev/null)
            
            if echo "$channel_response" | grep -q '"success":true'; then
                log_success "Discord channel creation working"
                log_verbose "Channel creation response: $channel_response"
                return 0
            else
                log_error "Discord channel creation failed"
                log_verbose "Channel response: $channel_response"
                return 1
            fi
        else
            log_error "Could not extract server ID from response"
            return 1
        fi
    else
        log_error "Discord server creation failed"
        log_verbose "Server response: $server_response"
        return 1
    fi
}

# Cleanup function
cleanup() {
    rm -f /tmp/cryb_test_user.txt /tmp/cryb_test_token.txt
}

# Main test execution
main() {
    echo "🚀 CRYB Platform Quick Test"
    echo "=========================="
    echo "Target: $API_BASE"
    echo "Verbose: $VERBOSE"
    echo "Generate Report: $GENERATE_REPORT"
    echo ""
    
    local passed=0
    local failed=0
    
    # Run tests
    if test_server_connectivity; then ((passed++)); else ((failed++)); fi
    if test_health_status; then ((passed++)); else ((failed++)); fi
    if test_api_documentation; then ((passed++)); else ((failed++)); fi
    if test_user_registration; then ((passed++)); else ((failed++)); fi
    if test_user_login; then ((passed++)); else ((failed++)); fi
    if test_protected_endpoint; then ((passed++)); else ((failed++)); fi
    if test_discord_features; then ((passed++)); else ((failed++)); fi
    
    echo ""
    echo "📊 Test Results"
    echo "==============="
    echo "Passed: $passed"
    echo "Failed: $failed"
    echo "Total: $((passed + failed))"
    
    local pass_rate=$((passed * 100 / (passed + failed)))
    echo "Pass Rate: $pass_rate%"
    
    if [ $pass_rate -ge 80 ]; then
        log_success "Platform is working well ($pass_rate% pass rate)"
    elif [ $pass_rate -ge 60 ]; then
        log_warning "Platform has some issues ($pass_rate% pass rate)"
    else
        log_error "Platform has significant issues ($pass_rate% pass rate)"
    fi
    
    # Generate comprehensive report if requested
    if [ "$GENERATE_REPORT" = true ]; then
        log_info "Generating comprehensive test report..."
        if command -v node > /dev/null 2>&1; then
            node comprehensive-functionality-test.js > /dev/null 2>&1 || true
            if [ -f "comprehensive-test-report.json" ]; then
                log_success "Comprehensive report generated: comprehensive-test-report.json"
            fi
        else
            log_warning "Node.js not available, skipping comprehensive report"
        fi
    fi
    
    cleanup
    
    # Exit with appropriate code
    if [ $failed -eq 0 ]; then
        exit 0
    else
        exit 1
    fi
}

# Execute main function
main "$@"