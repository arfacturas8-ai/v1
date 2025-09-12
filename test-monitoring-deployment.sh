#!/bin/bash

# ==============================================
# CRYB PLATFORM - MONITORING DEPLOYMENT TEST
# ==============================================
# Quick test to verify monitoring stack deployment
# ==============================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}=== CRYB MONITORING STACK DEPLOYMENT TEST ===${NC}\n"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

test_result() {
    local test_name="$1"
    local result="$2"
    
    ((TOTAL_TESTS++))
    
    if [ "$result" = "0" ]; then
        echo -e "${GREEN}✓${NC} $test_name"
        ((PASSED_TESTS++))
    else
        echo -e "${RED}✗${NC} $test_name"
        ((FAILED_TESTS++))
    fi
}

# Test 1: Check Docker is available
echo -e "${BLUE}Testing Docker availability...${NC}"
docker info > /dev/null 2>&1
test_result "Docker is running" $?

# Test 2: Check Docker Compose is available  
docker compose version > /dev/null 2>&1
test_result "Docker Compose plugin available" $?

# Test 3: Check configuration files exist
echo -e "\n${BLUE}Testing configuration files...${NC}"

config_files=(
    "config/prometheus/prometheus.yml"
    "config/prometheus/alerts.yml"
    "config/grafana/provisioning/datasources/datasources.yml"
    "config/loki/loki-config.yaml"
    "config/promtail/promtail-config.yaml"
    "config/alertmanager/alertmanager.yml"
    "config/blackbox/blackbox.yml"
    "docker-compose.monitoring.yml"
)

for config_file in "${config_files[@]}"; do
    [ -f "$config_file" ]
    test_result "Configuration file exists: $config_file" $?
done

# Test 4: Check if we can start core services (dry run)
echo -e "\n${BLUE}Testing Docker Compose file validity...${NC}"
docker compose -f docker-compose.yml config > /dev/null 2>&1
test_result "Main docker-compose.yml is valid" $?

docker compose -f docker-compose.monitoring.yml config > /dev/null 2>&1
test_result "Monitoring docker-compose.yml is valid" $?

# Test 5: Check if required ports are available
echo -e "\n${BLUE}Testing port availability...${NC}"

required_ports=(9090 3002 3100 9093 16686)

for port in "${required_ports[@]}"; do
    if ! ss -tuln | grep -q ":$port "; then
        test_result "Port $port is available" 0
    else
        test_result "Port $port is available" 1
    fi
done

# Test 6: Check disk space
echo -e "\n${BLUE}Testing system resources...${NC}"

# Check available disk space (require at least 5GB)
available_space=$(df . | awk 'NR==2 {print $4}')
required_space=5242880 # 5GB in KB

if [ "$available_space" -gt "$required_space" ]; then
    test_result "Sufficient disk space ($(echo "scale=1; $available_space/1048576" | bc 2>/dev/null || echo "unknown")GB available)" 0
else
    test_result "Sufficient disk space" 1
fi

# Test 7: Check memory
total_memory=$(free -m | awk 'NR==2{print $2}')
if [ "$total_memory" -gt 4096 ]; then
    test_result "Sufficient memory (${total_memory}MB total)" 0
else
    test_result "Sufficient memory (${total_memory}MB total, recommended: 4GB+)" 1
fi

# Test 8: Test network connectivity to container registry
echo -e "\n${BLUE}Testing network connectivity...${NC}"

docker_registries=("docker.io" "gcr.io" "quay.io")
for registry in "${docker_registries[@]}"; do
    if ping -c 1 -W 5 "$registry" > /dev/null 2>&1; then
        test_result "Can reach $registry" 0
    else
        test_result "Can reach $registry" 1
    fi
done

# Test 9: Check if we can pull required images (sample)
echo -e "\n${BLUE}Testing Docker image availability...${NC}"

sample_images=(
    "prom/prometheus:v2.45.0"
    "grafana/grafana:10.0.0"
    "grafana/loki:2.8.0"
)

for image in "${sample_images[@]}"; do
    if docker image inspect "$image" > /dev/null 2>&1 || docker pull "$image" > /dev/null 2>&1; then
        test_result "Can access image: $image" 0
    else
        test_result "Can access image: $image" 1
    fi
done

# Test 10: Quick smoke test - start single service
echo -e "\n${BLUE}Testing service startup (Prometheus only)...${NC}"

# Try to start Prometheus briefly
if docker run --rm -d --name test-prometheus -p 9091:9090 prom/prometheus:v2.45.0 > /dev/null 2>&1; then
    sleep 5
    # Check if it responds
    if curl -s http://localhost:9091/-/healthy > /dev/null 2>&1; then
        test_result "Prometheus can start and respond" 0
    else
        test_result "Prometheus can start and respond" 1
    fi
    # Cleanup
    docker stop test-prometheus > /dev/null 2>&1 || true
else
    test_result "Prometheus can start and respond" 1
fi

# Summary
echo -e "\n${CYAN}=== TEST RESULTS SUMMARY ===${NC}"
echo -e "${GREEN}Passed:${NC} $PASSED_TESTS/$TOTAL_TESTS"
echo -e "${RED}Failed:${NC} $FAILED_TESTS/$TOTAL_TESTS"

success_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
echo -e "${BLUE}Success Rate:${NC} $success_rate%"

if [ "$FAILED_TESTS" -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo -e "${GREEN}✅ Your system is ready for monitoring stack deployment${NC}"
    echo -e "\n${BLUE}Next steps:${NC}"
    echo -e "1. Run: ${YELLOW}./start-monitoring-stack.sh${NC}"
    echo -e "2. Wait for all services to start"
    echo -e "3. Access Grafana at http://localhost:3002"
    exit 0
elif [ "$success_rate" -ge 80 ]; then
    echo -e "\n${YELLOW}⚠️  MOST TESTS PASSED${NC}"
    echo -e "${YELLOW}Some minor issues detected, but deployment should work${NC}"
    echo -e "\n${BLUE}You can proceed with:${NC} ${YELLOW}./start-monitoring-stack.sh${NC}"
    exit 1
else
    echo -e "\n${RED}❌ MULTIPLE TESTS FAILED${NC}"
    echo -e "${RED}Please resolve the issues before deploying the monitoring stack${NC}"
    echo -e "\n${BLUE}Common solutions:${NC}"
    echo -e "• Ensure Docker is running: ${YELLOW}sudo systemctl start docker${NC}"
    echo -e "• Free up disk space if needed"
    echo -e "• Check network connectivity"
    echo -e "• Stop services using required ports"
    exit 2
fi