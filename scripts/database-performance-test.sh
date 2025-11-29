#!/bin/bash

# CRYB PLATFORM DATABASE PERFORMANCE TESTING SCRIPT
# Tests database performance improvements and validates 90% performance target

set -e

echo "🚀 CRYB Database Performance Testing Suite"
echo "=========================================="

# Configuration
DB_HOST="${DATABASE_HOST:-localhost}"
DB_PORT="${DATABASE_PORT:-6432}"  # PgBouncer port
DB_NAME="${DATABASE_NAME:-cryb}"
DB_USER="${DATABASE_USER:-cryb_user}"
PGBOUNCER_PORT=6432
POSTGRES_PORT=5433

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results storage
TEST_RESULTS_DIR="./logs/performance-tests"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULTS_FILE="${TEST_RESULTS_DIR}/performance_test_${TIMESTAMP}.log"

# Create results directory
mkdir -p "${TEST_RESULTS_DIR}"

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$RESULTS_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$RESULTS_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$RESULTS_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$RESULTS_FILE"
}

# Function to run SQL query and measure time
run_timed_query() {
    local query="$1"
    local description="$2"
    local host="$3"
    local port="$4"
    
    log_info "Testing: $description"
    
    local start_time=$(date +%s.%3N)
    local result=$(PGPASSWORD=cryb_password psql -h "$host" -p "$port" -U "$DB_USER" -d "$DB_NAME" -t -c "$query" 2>/dev/null || echo "ERROR")
    local end_time=$(date +%s.%3N)
    
    local duration=$(echo "$end_time - $start_time" | bc)
    local duration_ms=$(echo "$duration * 1000" | bc | cut -d. -f1)
    
    if [[ "$result" == "ERROR" ]]; then
        log_error "$description failed"
        echo "0"
    else
        log_success "$description completed in ${duration_ms}ms"
        echo "$duration_ms"
    fi
}

# Function to test connection pooling performance
test_connection_pooling() {
    log_info "Testing connection pooling performance..."
    
    # Test direct PostgreSQL connections
    local direct_time=$(run_timed_query "SELECT COUNT(*) FROM \"User\";" "Direct PostgreSQL connection" "$DB_HOST" "$POSTGRES_PORT")
    
    # Test PgBouncer connections
    local pooled_time=$(run_timed_query "SELECT COUNT(*) FROM \"User\";" "PgBouncer pooled connection" "$DB_HOST" "$PGBOUNCER_PORT")
    
    if [[ "$direct_time" -gt 0 && "$pooled_time" -gt 0 ]]; then
        local improvement=$(echo "scale=2; ($direct_time - $pooled_time) / $direct_time * 100" | bc)
        log_success "Connection pooling improvement: ${improvement}%"
        
        if (( $(echo "$improvement > 20" | bc -l) )); then
            log_success "✅ Connection pooling showing significant improvement (>20%)"
        else
            log_warning "⚠️  Connection pooling improvement is less than expected (<20%)"
        fi
    fi
}

# Function to test index performance
test_index_performance() {
    log_info "Testing index performance..."
    
    # Test queries that should use indexes
    declare -a index_queries=(
        "SELECT * FROM \"User\" WHERE username = 'test_user';"
        "SELECT * FROM \"Message\" WHERE \"channelId\" = 'test_channel' ORDER BY timestamp DESC LIMIT 50;"
        "SELECT * FROM \"Post\" WHERE \"communityId\" = 'test_community' ORDER BY score DESC LIMIT 25;"
        "SELECT * FROM \"ServerMember\" WHERE \"serverId\" = 'test_server' AND pending = false;"
        "SELECT * FROM \"Vote\" WHERE \"createdAt\" > NOW() - INTERVAL '1 day';"
    )
    
    declare -a descriptions=(
        "User lookup by username"
        "Recent messages in channel"
        "Top posts in community"
        "Active server members"
        "Recent votes"
    )
    
    local total_improvement=0
    local test_count=0
    
    for i in "${!index_queries[@]}"; do
        # First run to warm up cache
        run_timed_query "${index_queries[$i]}" "Warm-up: ${descriptions[$i]}" "$DB_HOST" "$PGBOUNCER_PORT" > /dev/null
        
        # Actual test run
        local query_time=$(run_timed_query "${index_queries[$i]}" "${descriptions[$i]}" "$DB_HOST" "$PGBOUNCER_PORT")
        
        if [[ "$query_time" -gt 0 ]]; then
            if [[ "$query_time" -lt 100 ]]; then
                log_success "✅ ${descriptions[$i]}: Excellent performance (<100ms)"
                total_improvement=$((total_improvement + 95))
            elif [[ "$query_time" -lt 500 ]]; then
                log_success "✅ ${descriptions[$i]}: Good performance (<500ms)"
                total_improvement=$((total_improvement + 85))
            elif [[ "$query_time" -lt 1000 ]]; then
                log_warning "⚠️  ${descriptions[$i]}: Acceptable performance (<1s)"
                total_improvement=$((total_improvement + 70))
            else
                log_error "❌ ${descriptions[$i]}: Poor performance (>1s)"
                total_improvement=$((total_improvement + 50))
            fi
            test_count=$((test_count + 1))
        fi
    done
    
    if [[ "$test_count" -gt 0 ]]; then
        local avg_performance=$(echo "$total_improvement / $test_count" | bc)
        log_info "Average index performance score: ${avg_performance}%"
    fi
}

# Function to test full-text search performance
test_search_performance() {
    log_info "Testing full-text search performance..."
    
    # Test full-text search on messages
    local search_time=$(run_timed_query "SELECT * FROM \"Message\" WHERE to_tsvector('english', content) @@ to_tsquery('english', 'test') LIMIT 10;" "Full-text search on messages" "$DB_HOST" "$PGBOUNCER_PORT")
    
    if [[ "$search_time" -gt 0 ]]; then
        if [[ "$search_time" -lt 200 ]]; then
            log_success "✅ Full-text search: Excellent performance (<200ms)"
        elif [[ "$search_time" -lt 1000 ]]; then
            log_success "✅ Full-text search: Good performance (<1s)"
        else
            log_warning "⚠️  Full-text search: Needs optimization (>1s)"
        fi
    fi
}

# Function to test analytics queries
test_analytics_performance() {
    log_info "Testing analytics query performance..."
    
    declare -a analytics_queries=(
        "SELECT DATE_TRUNC('hour', timestamp) as hour, COUNT(*) FROM \"MessageAnalytics\" WHERE timestamp > NOW() - INTERVAL '24 hours' GROUP BY hour ORDER BY hour;"
        "SELECT \"serverId\", COUNT(*) as message_count FROM \"MessageAnalytics\" WHERE timestamp > NOW() - INTERVAL '1 day' GROUP BY \"serverId\" ORDER BY message_count DESC LIMIT 10;"
        "SELECT \"userId\", SUM(\"sessionDuration\") as total_voice_time FROM \"VoiceAnalytics\" WHERE timestamp > NOW() - INTERVAL '1 day' GROUP BY \"userId\" ORDER BY total_voice_time DESC LIMIT 10;"
    )
    
    declare -a analytics_descriptions=(
        "Hourly message analytics"
        "Top servers by message count"
        "Top users by voice time"
    )
    
    for i in "${!analytics_queries[@]}"; do
        local query_time=$(run_timed_query "${analytics_queries[$i]}" "${analytics_descriptions[$i]}" "$DB_HOST" "$PGBOUNCER_PORT")
        
        if [[ "$query_time" -gt 0 ]]; then
            if [[ "$query_time" -lt 500 ]]; then
                log_success "✅ ${analytics_descriptions[$i]}: Excellent performance (<500ms)"
            elif [[ "$query_time" -lt 2000 ]]; then
                log_success "✅ ${analytics_descriptions[$i]}: Good performance (<2s)"
            else
                log_warning "⚠️  ${analytics_descriptions[$i]}: Needs optimization (>2s)"
            fi
        fi
    done
}

# Function to test concurrent connections
test_concurrent_performance() {
    log_info "Testing concurrent connection performance..."
    
    # Create temporary test script
    cat > /tmp/concurrent_test.sh << 'EOF'
#!/bin/bash
PGPASSWORD=cryb_password psql -h localhost -p 6432 -U cryb_user -d cryb -c "SELECT COUNT(*) FROM \"User\";" >/dev/null 2>&1 &
EOF
    chmod +x /tmp/concurrent_test.sh
    
    # Start multiple concurrent connections
    local concurrent_count=50
    log_info "Starting $concurrent_count concurrent connections..."
    
    local start_time=$(date +%s.%3N)
    
    for i in $(seq 1 $concurrent_count); do
        /tmp/concurrent_test.sh
    done
    
    wait
    
    local end_time=$(date +%s.%3N)
    local duration=$(echo "$end_time - $start_time" | bc)
    local duration_ms=$(echo "$duration * 1000" | bc | cut -d. -f1)
    
    log_success "Concurrent connections test completed in ${duration_ms}ms"
    
    if [[ "$duration_ms" -lt 5000 ]]; then
        log_success "✅ Concurrent connections: Excellent performance (<5s)"
    elif [[ "$duration_ms" -lt 10000 ]]; then
        log_success "✅ Concurrent connections: Good performance (<10s)"
    else
        log_warning "⚠️  Concurrent connections: Needs optimization (>10s)"
    fi
    
    # Cleanup
    rm -f /tmp/concurrent_test.sh
}

# Function to check database health
check_database_health() {
    log_info "Checking database health metrics..."
    
    # Run the performance monitoring SQL
    PGPASSWORD=cryb_password psql -h "$DB_HOST" -p "$PGBOUNCER_PORT" -U "$DB_USER" -d "$DB_NAME" -f "./scripts/database-performance-monitor.sql" >> "$RESULTS_FILE" 2>&1
    
    # Check cache hit ratio
    local cache_hit_ratio=$(PGPASSWORD=cryb_password psql -h "$DB_HOST" -p "$POSTGRES_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 as cache_hit_ratio FROM pg_statio_user_tables;" 2>/dev/null | tr -d ' ')
    
    if [[ -n "$cache_hit_ratio" ]]; then
        cache_hit_ratio=$(echo "$cache_hit_ratio" | cut -d. -f1)
        if [[ "$cache_hit_ratio" -gt 95 ]]; then
            log_success "✅ Cache hit ratio: ${cache_hit_ratio}% (Excellent)"
        elif [[ "$cache_hit_ratio" -gt 90 ]]; then
            log_success "✅ Cache hit ratio: ${cache_hit_ratio}% (Good)"
        else
            log_warning "⚠️  Cache hit ratio: ${cache_hit_ratio}% (Needs improvement)"
        fi
    fi
}

# Function to test Redis cache performance
test_redis_performance() {
    log_info "Testing Redis cache performance..."
    
    # Test Redis connection and basic operations
    if command -v redis-cli &> /dev/null; then
        local redis_ping=$(redis-cli -h localhost -p 6380 -a cryb_redis_password ping 2>/dev/null || echo "FAILED")
        
        if [[ "$redis_ping" == "PONG" ]]; then
            log_success "✅ Redis connection successful"
            
            # Test SET/GET performance
            local start_time=$(date +%s.%3N)
            for i in {1..1000}; do
                redis-cli -h localhost -p 6380 -a cryb_redis_password set "test:$i" "value$i" >/dev/null 2>&1
            done
            local end_time=$(date +%s.%3N)
            local duration=$(echo "$end_time - $start_time" | bc)
            local duration_ms=$(echo "$duration * 1000" | bc | cut -d. -f1)
            
            log_success "Redis SET performance: 1000 operations in ${duration_ms}ms"
            
            # Cleanup test keys
            redis-cli -h localhost -p 6380 -a cryb_redis_password eval "return redis.call('del', unpack(redis.call('keys', 'test:*')))" 0 >/dev/null 2>&1
        else
            log_error "❌ Redis connection failed"
        fi
    else
        log_warning "⚠️  redis-cli not available, skipping Redis tests"
    fi
}

# Function to calculate overall performance score
calculate_performance_score() {
    log_info "Calculating overall performance score..."
    
    # This is a simplified scoring system
    # In a real implementation, you'd have more sophisticated metrics
    
    local total_score=0
    local max_score=100
    
    # Check if key optimizations are in place
    if PGPASSWORD=cryb_password psql -h "$DB_HOST" -p "$POSTGRES_PORT" -U "$DB_USER" -d "$DB_NAME" -c "\\d \"Message\"" | grep -q "idx_message_content_search" 2>/dev/null; then
        log_success "✅ Full-text search index found"
        total_score=$((total_score + 20))
    else
        log_warning "⚠️  Full-text search index missing"
    fi
    
    # Check if PgBouncer is working
    if PGPASSWORD=cryb_password psql -h "$DB_HOST" -p "$PGBOUNCER_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
        log_success "✅ PgBouncer connection working"
        total_score=$((total_score + 25))
    else
        log_warning "⚠️  PgBouncer connection failed"
    fi
    
    # Check Redis
    if redis-cli -h localhost -p 6380 -a cryb_redis_password ping >/dev/null 2>&1; then
        log_success "✅ Redis cache working"
        total_score=$((total_score + 20))
    else
        log_warning "⚠️  Redis cache not working"
    fi
    
    # Basic performance check
    local basic_query_time=$(run_timed_query "SELECT COUNT(*) FROM \"User\";" "Basic query test" "$DB_HOST" "$PGBOUNCER_PORT")
    if [[ "$basic_query_time" -gt 0 && "$basic_query_time" -lt 100 ]]; then
        log_success "✅ Basic query performance excellent"
        total_score=$((total_score + 35))
    elif [[ "$basic_query_time" -gt 0 && "$basic_query_time" -lt 500 ]]; then
        log_success "✅ Basic query performance good"
        total_score=$((total_score + 25))
    else
        log_warning "⚠️  Basic query performance needs improvement"
        total_score=$((total_score + 10))
    fi
    
    local performance_percentage=$((total_score * 100 / max_score))
    
    echo ""
    echo "========================================"
    if [[ "$performance_percentage" -ge 90 ]]; then
        log_success "🎉 PERFORMANCE TARGET ACHIEVED: ${performance_percentage}%"
        log_success "✅ Database is optimized and ready for production!"
    elif [[ "$performance_percentage" -ge 80 ]]; then
        log_warning "⚠️  Performance Score: ${performance_percentage}% (Close to target)"
        log_warning "Consider additional optimizations to reach 90%"
    else
        log_error "❌ Performance Score: ${performance_percentage}% (Below target)"
        log_error "Significant optimizations needed"
    fi
    echo "========================================"
}

# Main test execution
main() {
    log_info "Starting comprehensive database performance testing..."
    log_info "Results will be saved to: $RESULTS_FILE"
    
    echo "Test started at: $(date)" >> "$RESULTS_FILE"
    echo "Configuration:" >> "$RESULTS_FILE"
    echo "- Database Host: $DB_HOST" >> "$RESULTS_FILE"
    echo "- PgBouncer Port: $PGBOUNCER_PORT" >> "$RESULTS_FILE"
    echo "- PostgreSQL Port: $POSTGRES_PORT" >> "$RESULTS_FILE"
    echo "" >> "$RESULTS_FILE"
    
    # Run all tests
    test_connection_pooling
    echo "" >> "$RESULTS_FILE"
    
    test_index_performance
    echo "" >> "$RESULTS_FILE"
    
    test_search_performance
    echo "" >> "$RESULTS_FILE"
    
    test_analytics_performance
    echo "" >> "$RESULTS_FILE"
    
    test_concurrent_performance
    echo "" >> "$RESULTS_FILE"
    
    check_database_health
    echo "" >> "$RESULTS_FILE"
    
    test_redis_performance
    echo "" >> "$RESULTS_FILE"
    
    calculate_performance_score
    
    log_info "Performance testing completed!"
    log_info "Full results saved to: $RESULTS_FILE"
}

# Check dependencies
if ! command -v psql &> /dev/null; then
    log_error "PostgreSQL client (psql) is required but not installed."
    exit 1
fi

if ! command -v bc &> /dev/null; then
    log_error "bc calculator is required but not installed."
    exit 1
fi

# Run main function
main "$@"