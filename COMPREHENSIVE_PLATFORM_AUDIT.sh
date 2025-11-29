#!/bin/bash

echo "🔍 COMPREHENSIVE CRYB PLATFORM AUDIT"
echo "===================================="
echo "$(date)"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

check_item() {
    local category="$1"
    local name="$2" 
    local command="$3"
    local expected="$4"
    
    ((TOTAL_CHECKS++))
    echo -n "[$category] $name... "
    
    if eval "$command" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ WORKING${NC}"
        ((PASSED_CHECKS++))
    else
        echo -e "${RED}❌ FAILED${NC}"
        ((FAILED_CHECKS++))
    fi
}

echo -e "${BLUE}=== 1. INFRASTRUCTURE AUDIT ===${NC}"
echo ""

check_item "INFRA" "PM2 Process Manager" "pm2 list | grep -q 'online'"
check_item "INFRA" "PostgreSQL Database" "nc -zv localhost 5432"
check_item "INFRA" "API Server (Port 4000)" "nc -zv localhost 4000"
check_item "INFRA" "Web Server (Port 3000)" "nc -zv localhost 3000"
check_item "INFRA" "Socket.IO (Port 4001)" "nc -zv localhost 4001"
check_item "INFRA" "Nginx Reverse Proxy" "ss -tlnp | grep -q ':80'"
check_item "INFRA" "Expo Mobile Server" "nc -zv localhost 8082"

echo ""
echo -e "${BLUE}=== 2. API BACKEND AUDIT ===${NC}"
echo ""

check_item "API" "Health Endpoint" "curl -s http://localhost:4000/health | grep -q 'healthy'"
check_item "API" "Database Connection" "curl -s http://localhost:4000/health | grep -q 'PostgreSQL'"
check_item "API" "Auth Registration" "curl -s -X POST http://localhost:4000/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"audit@test.com\",\"password\":\"test\",\"username\":\"audit\"}' | grep -q 'success'"
check_item "API" "Auth Login" "curl -s -X POST http://localhost:4000/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"audit@test.com\",\"password\":\"test\"}' | grep -q 'success'"
check_item "API" "Communities GET" "curl -s http://localhost:4000/api/communities | grep -q '\\['"
check_item "API" "Communities POST" "curl -s -X POST http://localhost:4000/api/communities -H 'Content-Type: application/json' -d '{\"name\":\"Audit Test\",\"description\":\"Testing\"}' | grep -q 'success'"
check_item "API" "Posts GET" "curl -s http://localhost:4000/api/posts | grep -q '\\['"
check_item "API" "Comments GET" "curl -s http://localhost:4000/api/comments | grep -q '\\['"

echo ""
echo -e "${BLUE}=== 3. PUBLIC DOMAINS AUDIT ===${NC}"
echo ""

check_item "PUBLIC" "api.cryb.ai Health" "curl -s http://api.cryb.ai/health | grep -q 'healthy'"
check_item "PUBLIC" "api.cryb.ai Communities" "curl -s http://api.cryb.ai/api/communities | grep -q '\\['"
check_item "PUBLIC" "platform.cryb.ai Homepage" "curl -s http://platform.cryb.ai | grep -q 'CRYB'"
check_item "PUBLIC" "platform.cryb.ai Login" "curl -s http://platform.cryb.ai/login | grep -q 'login'"
check_item "PUBLIC" "Socket.IO Public" "curl -s 'http://api.cryb.ai/socket.io/?EIO=4&transport=polling' | grep -q '0'"

echo ""
echo -e "${BLUE}=== 4. WEB FRONTEND AUDIT ===${NC}"
echo ""

check_item "WEB" "Next.js Development" "curl -s http://localhost:3000 | grep -q 'CRYB'"
check_item "WEB" "Page Routing" "curl -s http://localhost:3000/login | grep -q 'login'"
check_item "WEB" "Static Assets" "curl -s -I http://localhost:3000/_next/static/ | grep -q '200'"
check_item "WEB" "API Integration" "curl -s http://localhost:3000 | grep -q 'api'"
check_item "WEB" "React Hydration" "curl -s http://localhost:3000 | grep -q '_next'"

# Check actual web pages exist
echo ""
echo "Web Pages Inventory:"
WEB_PAGES=$(find /home/ubuntu/cryb-platform/apps/web/app -name "page.tsx" | wc -l)
echo "- Total Pages: $WEB_PAGES"
if [ -d "/home/ubuntu/cryb-platform/apps/web/app/login" ]; then echo "- Login: ✅"; fi
if [ -d "/home/ubuntu/cryb-platform/apps/web/app/dashboard" ]; then echo "- Dashboard: ✅"; fi
if [ -d "/home/ubuntu/cryb-platform/apps/web/app/communities" ]; then echo "- Communities: ✅"; fi

echo ""
echo -e "${BLUE}=== 5. MOBILE APP AUDIT ===${NC}"
echo ""

check_item "MOBILE" "React Native Structure" "test -d /home/ubuntu/cryb-platform/apps/mobile/src"
check_item "MOBILE" "Android Build Ready" "test -d /home/ubuntu/cryb-platform/apps/mobile/android"
check_item "MOBILE" "iOS Build Ready" "test -d /home/ubuntu/cryb-platform/apps/mobile/ios"
check_item "MOBILE" "App Config" "test -f /home/ubuntu/cryb-platform/apps/mobile/app.json"
check_item "MOBILE" "Package Config" "test -f /home/ubuntu/cryb-platform/apps/mobile/package.json"
check_item "MOBILE" "Expo Server Running" "nc -zv localhost 8082"

# Count mobile components
echo ""
echo "Mobile Components Inventory:"
if [ -d "/home/ubuntu/cryb-platform/apps/mobile/src/components" ]; then
    MOBILE_COMPONENTS=$(find /home/ubuntu/cryb-platform/apps/mobile/src/components -name "*.tsx" | wc -l)
    echo "- React Components: $MOBILE_COMPONENTS"
    if [ -d "/home/ubuntu/cryb-platform/apps/mobile/src/components/discord" ]; then echo "- Discord Components: ✅"; fi
    if [ -d "/home/ubuntu/cryb-platform/apps/mobile/src/components/reddit" ]; then echo "- Reddit Components: ✅"; fi
fi

echo ""
echo -e "${BLUE}=== 6. DATABASE AUDIT ===${NC}"
echo ""

check_item "DB" "PostgreSQL Service" "nc -zv localhost 5432"
check_item "DB" "Database Connection" "curl -s http://localhost:4000/health | grep -q 'PostgreSQL'"
check_item "DB" "Data Persistence" "curl -s http://localhost:4000/health | grep -q 'users.*communities.*posts'"

# Check actual data
echo ""
echo "Database Data Inventory:"
USERS_COUNT=$(curl -s http://localhost:4000/health | grep -o '"users":[0-9]*' | cut -d':' -f2)
COMMUNITIES_COUNT=$(curl -s http://localhost:4000/health | grep -o '"communities":[0-9]*' | cut -d':' -f2)
POSTS_COUNT=$(curl -s http://localhost:4000/health | grep -o '"posts":[0-9]*' | cut -d':' -f2)
COMMENTS_COUNT=$(curl -s http://localhost:4000/health | grep -o '"comments":[0-9]*' | cut -d':' -f2)

echo "- Users: $USERS_COUNT"
echo "- Communities: $COMMUNITIES_COUNT" 
echo "- Posts: $POSTS_COUNT"
echo "- Comments: $COMMENTS_COUNT"

echo ""
echo -e "${BLUE}=== 7. REAL-TIME FEATURES AUDIT ===${NC}"
echo ""

check_item "REALTIME" "Socket.IO Server" "pm2 list | grep -q 'cryb-socket.*online'"
check_item "REALTIME" "Socket.IO Port" "nc -zv localhost 4001"
check_item "REALTIME" "WebSocket Endpoint" "curl -s 'http://localhost:4001/socket.io/?EIO=4&transport=polling' | grep -q '0'"
check_item "REALTIME" "Nginx WebSocket Proxy" "curl -s 'http://api.cryb.ai/socket.io/?EIO=4&transport=polling' | grep -q '0'"

echo ""
echo -e "${BLUE}=== 8. FILE ASSETS AUDIT ===${NC}"
echo ""

check_item "ASSETS" "Web Components Folder" "test -d /home/ubuntu/cryb-platform/apps/web/components"
check_item "ASSETS" "Discord Components" "test -d /home/ubuntu/cryb-platform/apps/web/components/discord"
check_item "ASSETS" "Reddit Components" "test -d /home/ubuntu/cryb-platform/apps/web/components/reddit"
check_item "ASSETS" "Mobile Assets" "test -d /home/ubuntu/cryb-platform/apps/mobile/assets"
check_item "ASSETS" "App Store Metadata" "test -f /home/ubuntu/cryb-platform/apps/mobile/assets/app-store/metadata/store-listing.json"

# Count actual files
echo ""
echo "Assets Inventory:"
WEB_COMPONENTS=$(find /home/ubuntu/cryb-platform/apps/web/components -name "*.tsx" 2>/dev/null | wc -l)
MOBILE_ASSETS=$(find /home/ubuntu/cryb-platform/apps/mobile/assets -type f 2>/dev/null | wc -l)
echo "- Web Components: $WEB_COMPONENTS files"
echo "- Mobile Assets: $MOBILE_ASSETS files"

echo ""
echo -e "${BLUE}=== 9. PRODUCTION SCRIPTS AUDIT ===${NC}"
echo ""

check_item "SCRIPTS" "Start Production Script" "test -x /home/ubuntu/cryb-platform/start-production.sh"
check_item "SCRIPTS" "Test Suite Script" "test -x /home/ubuntu/cryb-platform/test-production-real.sh"
check_item "SCRIPTS" "Public Domains Test" "test -x /home/ubuntu/cryb-platform/test-public-domains.sh"
check_item "SCRIPTS" "Mobile Build Script" "test -x /home/ubuntu/cryb-platform/apps/mobile/build-apk-simple.sh"

echo ""
echo -e "${BLUE}=== 10. PERFORMANCE AUDIT ===${NC}"
echo ""

# API Performance
echo -n "[PERF] API Response Time... "
API_TIME=$(curl -o /dev/null -s -w '%{time_total}' http://localhost:4000/health)
if (( $(echo "$API_TIME < 0.1" | bc -l 2>/dev/null || echo 0) )); then
    echo -e "${GREEN}✅ EXCELLENT (${API_TIME}s)${NC}"
    ((PASSED_CHECKS++))
elif (( $(echo "$API_TIME < 0.5" | bc -l 2>/dev/null || echo 0) )); then
    echo -e "${YELLOW}⚠️  GOOD (${API_TIME}s)${NC}"
    ((PASSED_CHECKS++))
else
    echo -e "${RED}❌ SLOW (${API_TIME}s)${NC}"
    ((FAILED_CHECKS++))
fi
((TOTAL_CHECKS++))

# Platform Performance  
echo -n "[PERF] Platform Response Time... "
PLATFORM_TIME=$(curl -o /dev/null -s -w '%{time_total}' http://localhost:3000)
if (( $(echo "$PLATFORM_TIME < 1.0" | bc -l 2>/dev/null || echo 0) )); then
    echo -e "${GREEN}✅ FAST (${PLATFORM_TIME}s)${NC}"
    ((PASSED_CHECKS++))
elif (( $(echo "$PLATFORM_TIME < 3.0" | bc -l 2>/dev/null || echo 0) )); then
    echo -e "${YELLOW}⚠️  ACCEPTABLE (${PLATFORM_TIME}s)${NC}"
    ((PASSED_CHECKS++))
else
    echo -e "${RED}❌ SLOW (${PLATFORM_TIME}s)${NC}"
    ((FAILED_CHECKS++))
fi
((TOTAL_CHECKS++))

echo ""
echo "======================================"
echo -e "${BLUE}COMPREHENSIVE AUDIT RESULTS${NC}"
echo "======================================"

echo -e "Total Checks: $TOTAL_CHECKS"
echo -e "Passed: ${GREEN}$PASSED_CHECKS${NC}"
echo -e "Failed: ${RED}$FAILED_CHECKS${NC}"

if [ $TOTAL_CHECKS -gt 0 ]; then
    PERCENTAGE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    echo -e "Success Rate: ${BLUE}$PERCENTAGE%${NC}"
    
    echo ""
    echo "PLATFORM STATUS SUMMARY:"
    echo "========================"
    
    if [ $PERCENTAGE -ge 90 ]; then
        echo -e "${GREEN}🚀 EXCELLENT - Production Ready!${NC}"
        echo "The platform is fully operational with minimal issues."
    elif [ $PERCENTAGE -ge 80 ]; then
        echo -e "${YELLOW}✅ GOOD - Nearly Production Ready${NC}"
        echo "The platform is mostly working with minor issues to address."
    elif [ $PERCENTAGE -ge 60 ]; then
        echo -e "${YELLOW}⚠️  FAIR - Needs Work${NC}"
        echo "Core features work but significant improvements needed."
    else
        echo -e "${RED}❌ POOR - Major Issues${NC}"
        echo "Platform has serious issues that must be fixed."
    fi
    
    echo ""
    echo "QUICK ACCESS:"
    echo "- API: http://localhost:4000/health"
    echo "- Platform: http://localhost:3000"  
    echo "- Public API: http://api.cryb.ai"
    echo "- Public Platform: http://platform.cryb.ai"
fi

echo ""
echo "Audit completed at $(date)"