#!/bin/bash

# ===================================================
# CRYB PLATFORM - PRODUCTION RESTART SCRIPT
# ===================================================
# Gracefully restarts all production services
# ===================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "🔄 Restarting CRYB Platform Production Services..."
echo "=================================================="

# Parse restart type
RESTART_TYPE="${1:-all}"

case "$RESTART_TYPE" in
    "api")
        print_status "Restarting API services only..."
        if command -v pm2 &> /dev/null; then
            pm2 restart cryb-api-production || pm2 restart cryb-api-dev || print_error "Failed to restart API"
        fi
        ;;
    "web") 
        print_status "Restarting Web services only..."
        if command -v pm2 &> /dev/null; then
            pm2 restart cryb-web-production || pm2 restart cryb-web-dev || print_error "Failed to restart Web"
        fi
        ;;
    "all"|*)
        print_status "Performing full restart..."
        
        # Stop services gracefully
        print_status "Stopping services..."
        ./stop-production.sh
        
        print_status "Waiting for graceful shutdown..."
        sleep 5
        
        # Start services
        print_status "Starting services..."
        ./start-production.sh
        ;;
esac

# Quick health check
print_status "Performing post-restart health check..."
sleep 10

HEALTH_ISSUES=()

# Check API
if curl -f -s "http://localhost:4000/health" >/dev/null 2>&1; then
    print_success "API is healthy"
else
    HEALTH_ISSUES+=("API health check failed")
fi

# Check Web (try both ports)
WEB_HEALTHY=false
for port in 3001 3000; do
    if curl -f -s "http://localhost:$port" >/dev/null 2>&1; then
        print_success "Web is healthy on port $port"
        WEB_HEALTHY=true
        break
    fi
done

if [[ "$WEB_HEALTHY" == false ]]; then
    HEALTH_ISSUES+=("Web health check failed")
fi

# Show PM2 status
if command -v pm2 &> /dev/null; then
    print_status "Current PM2 Status:"
    pm2 list
fi

echo "=================================================="
if [[ ${#HEALTH_ISSUES[@]} -eq 0 ]]; then
    print_success "🔄 CRYB Platform restarted successfully!"
    print_status "All services are healthy and running."
else
    print_warning "⚠️ Restart completed but some issues detected:"
    for issue in "${HEALTH_ISSUES[@]}"; do
        print_warning "  - $issue"
    done
    print_status "Check logs with: pm2 logs"
fi
echo "=================================================="