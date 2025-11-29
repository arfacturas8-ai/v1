#!/bin/bash

# CRYB Platform Monitoring Startup Script
# Quick access to monitoring tools

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}CRYB Platform Monitoring Tools${NC}"
echo -e "${BLUE}========================================${NC}"
echo

echo -e "${GREEN}Available monitoring tools:${NC}"
echo -e "  1. Interactive Dashboard    - Real-time system monitoring"
echo -e "  2. Health Check             - Comprehensive health report"
echo -e "  3. View Metrics             - Analyze collected metrics"
echo -e "  4. Monitoring Status        - Check monitoring system health"
echo -e "  5. Collect Metrics          - Manual metrics collection"
echo

read -p "Select option (1-5): " choice

case $choice in
    1)
        echo -e "${YELLOW}Starting interactive dashboard...${NC}"
        echo -e "${YELLOW}Press 'q' to quit, 'h' for help${NC}"
        sleep 2
        "$SCRIPT_DIR/monitoring-dashboard.sh"
        ;;
    2)
        echo -e "${YELLOW}Running comprehensive health check...${NC}"
        "$SCRIPT_DIR/health-check-enhanced.sh"
        ;;
    3)
        echo -e "${YELLOW}Available metrics views:${NC}"
        echo -e "  summary  - Complete overview"
        echo -e "  system   - System metrics"
        echo -e "  services - Service status"
        echo -e "  alerts   - Recent alerts"
        echo
        read -p "Select view (default: summary): " view
        view=${view:-summary}
        "$SCRIPT_DIR/view-metrics.sh" "$view"
        ;;
    4)
        echo -e "${YELLOW}Checking monitoring system status...${NC}"
        "$SCRIPT_DIR/monitoring-status.sh"
        ;;
    5)
        echo -e "${YELLOW}Collecting fresh metrics...${NC}"
        "$SCRIPT_DIR/collect-metrics.sh"
        echo -e "${GREEN}Metrics collection completed!${NC}"
        ;;
    *)
        echo -e "${YELLOW}Invalid option. Exiting...${NC}"
        exit 1
        ;;
esac