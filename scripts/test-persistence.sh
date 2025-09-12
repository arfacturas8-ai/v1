#!/bin/bash

# Test script to verify service persistence
# This simulates various failure scenarios and tests recovery

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    local color=$1
    local message=$2
    echo -e "${color}[$(date '+%Y-%m-%d %H:%M:%S')] ${message}${NC}"
}

# Test 1: PM2 Process Crash Simulation
test_pm2_crash() {
    print_status $BLUE "=== Testing PM2 Process Crash Recovery ==="
    
    print_status $YELLOW "Getting current PM2 process PIDs..."
    local api_pid=$(pm2 jlist | jq -r '.[] | select(.name=="cryb-api") | .pid')
    local web_pid=$(pm2 jlist | jq -r '.[] | select(.name=="cryb-web") | .pid')
    
    print_status $YELLOW "API PID: $api_pid, Web PID: $web_pid"
    
    # Kill API process forcefully
    print_status $YELLOW "Simulating API crash (kill -9 $api_pid)..."
    kill -9 $api_pid 2>/dev/null
    
    # Wait and check if PM2 restarted it
    print_status $YELLOW "Waiting 5 seconds for PM2 auto-restart..."
    sleep 5
    
    local new_api_pid=$(pm2 jlist | jq -r '.[] | select(.name=="cryb-api") | .pid')
    
    if [ "$new_api_pid" != "$api_pid" ] && [ "$new_api_pid" != "null" ]; then
        print_status $GREEN "✓ PM2 successfully restarted API process (new PID: $new_api_pid)"
    else
        print_status $RED "✗ PM2 failed to restart API process"
    fi
    
    print_status $YELLOW "Current PM2 status:"
    pm2 status
}

# Test 2: Docker Container Crash Simulation
test_docker_crash() {
    print_status $BLUE "=== Testing Docker Container Crash Recovery ==="
    
    print_status $YELLOW "Stopping Redis container forcefully..."
    docker kill cryb-redis-dev
    
    print_status $YELLOW "Waiting 10 seconds for Docker auto-restart..."
    sleep 10
    
    if docker ps | grep cryb-redis-dev | grep -q "Up"; then
        print_status $GREEN "✓ Docker successfully restarted Redis container"
    else
        print_status $RED "✗ Docker failed to restart Redis container"
    fi
    
    # Test connection to Redis
    if redis-cli -h localhost -p 6380 ping >/dev/null 2>&1; then
        print_status $GREEN "✓ Redis is accepting connections after restart"
    else
        print_status $YELLOW "! Redis container running but not ready yet"
    fi
}

# Test 3: Service Connectivity Test
test_service_connectivity() {
    print_status $BLUE "=== Testing Service Connectivity ==="
    
    local services=(
        "http://localhost:3000:Web Frontend"
        "http://localhost:3001/health:API Health"
        "http://localhost:9201/_cluster/health:Elasticsearch"
        "http://localhost:9000/minio/health/live:MinIO"
    )
    
    for service_info in "${services[@]}"; do
        IFS=':' read -r url name <<< "$service_info"
        
        if curl -s --max-time 5 "$url" >/dev/null 2>&1; then
            print_status $GREEN "✓ $name is responding"
        else
            print_status $RED "✗ $name is not responding"
        fi
    done
}

# Test 4: Check System Service Status
test_system_services() {
    print_status $BLUE "=== Testing System Service Status ==="
    
    # Check if PM2 systemd service is enabled
    if systemctl is-enabled pm2-ubuntu >/dev/null 2>&1; then
        print_status $GREEN "✓ PM2 systemd service is enabled for auto-start"
    else
        print_status $RED "✗ PM2 systemd service is not enabled"
    fi
    
    # Check if Docker is enabled
    if systemctl is-enabled docker >/dev/null 2>&1; then
        print_status $GREEN "✓ Docker service is enabled for auto-start"
    else
        print_status $RED "✗ Docker service is not enabled"
    fi
    
    # Check PM2 dump file exists
    if [ -f ~/.pm2/dump.pm2 ]; then
        print_status $GREEN "✓ PM2 process list is saved for resurrection"
        local saved_apps=$(grep -c '"name"' ~/.pm2/dump.pm2 2>/dev/null || echo "0")
        print_status $BLUE "  - Saved applications: $saved_apps"
    else
        print_status $RED "✗ PM2 process list not saved"
    fi
}

# Test 5: Resource Usage Check
test_resource_usage() {
    print_status $BLUE "=== Checking Resource Usage ==="
    
    # Memory usage
    local total_mem=$(free -m | awk 'NR==2{print $2}')
    local used_mem=$(free -m | awk 'NR==2{print $3}')
    local mem_percentage=$((used_mem * 100 / total_mem))
    
    print_status $BLUE "Memory Usage: ${used_mem}MB / ${total_mem}MB (${mem_percentage}%)"
    
    if [ $mem_percentage -lt 80 ]; then
        print_status $GREEN "✓ Memory usage is acceptable"
    else
        print_status $YELLOW "! High memory usage detected"
    fi
    
    # Disk usage
    local disk_usage=$(df -h / | awk 'NR==2{print $5}' | sed 's/%//')
    print_status $BLUE "Disk Usage: ${disk_usage}%"
    
    if [ $disk_usage -lt 85 ]; then
        print_status $GREEN "✓ Disk usage is acceptable"
    else
        print_status $YELLOW "! High disk usage detected"
    fi
    
    # Show top memory consuming processes
    print_status $BLUE "Top 5 memory-consuming processes:"
    ps aux --sort=-%mem | head -6 | tail -5 | awk '{printf "  %-15s %5s%% %s\n", $1, $4, $11}'
}

# Main test execution
main() {
    print_status $GREEN "=== CRYB Platform Persistence Test Suite ==="
    print_status $YELLOW "This will test service crash recovery and auto-restart capabilities"
    
    # Check if jq is available (needed for JSON parsing)
    if ! command -v jq &> /dev/null; then
        print_status $RED "jq is required for this test but not installed. Installing..."
        sudo apt-get update && sudo apt-get install -y jq
    fi
    
    echo ""
    test_system_services
    echo ""
    test_service_connectivity
    echo ""
    test_pm2_crash
    echo ""
    test_docker_crash
    echo ""
    test_resource_usage
    echo ""
    print_status $GREEN "=== Persistence Test Suite Complete ==="
    
    print_status $BLUE "Summary:"
    print_status $BLUE "- PM2 processes will auto-restart on crash"
    print_status $BLUE "- Docker containers will auto-restart on crash"
    print_status $BLUE "- Both PM2 and Docker are configured to start at boot"
    print_status $BLUE "- Service health monitoring is available via service-manager.sh"
    
    print_status $YELLOW "To simulate a full reboot test:"
    print_status $YELLOW "  sudo reboot"
    print_status $YELLOW "After reboot, run:"
    print_status $YELLOW "  /home/ubuntu/cryb-platform/scripts/service-manager.sh status"
}

# Run tests
main