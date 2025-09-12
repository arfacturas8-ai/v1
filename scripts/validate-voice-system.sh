#!/bin/bash

# Voice & Video System Validation Script
# Tests key components and configuration

echo "🚀 Cryb Voice & Video System Validation"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
WARNINGS=0

# Function to print test results
print_result() {
    local test_name="$1"
    local result="$2"
    local message="$3"
    
    if [ "$result" = "PASS" ]; then
        echo -e "[${GREEN}✓${NC}] $test_name"
        [ ! -z "$message" ] && echo -e "    $message"
        ((PASSED++))
    elif [ "$result" = "FAIL" ]; then
        echo -e "[${RED}✗${NC}] $test_name"
        [ ! -z "$message" ] && echo -e "    ${RED}$message${NC}"
        ((FAILED++))
    elif [ "$result" = "WARN" ]; then
        echo -e "[${YELLOW}⚠${NC}] $test_name"
        [ ! -z "$message" ] && echo -e "    ${YELLOW}$message${NC}"
        ((WARNINGS++))
    fi
}

# Test 1: Check environment variables
echo -e "\n${BLUE}1. Environment Configuration${NC}"
echo "-----------------------------"

if [ -z "$LIVEKIT_URL" ]; then
    print_result "LiveKit URL" "FAIL" "LIVEKIT_URL environment variable not set"
else
    print_result "LiveKit URL" "PASS" "$LIVEKIT_URL"
fi

if [ -z "$LIVEKIT_API_KEY" ]; then
    print_result "LiveKit API Key" "FAIL" "LIVEKIT_API_KEY environment variable not set"
else
    print_result "LiveKit API Key" "PASS" "Set (${LIVEKIT_API_KEY:0:8}...)"
fi

if [ -z "$LIVEKIT_API_SECRET" ]; then
    print_result "LiveKit API Secret" "FAIL" "LIVEKIT_API_SECRET environment variable not set"
else
    print_result "LiveKit API Secret" "PASS" "Set (${LIVEKIT_API_SECRET:0:8}...)"
fi

if [ -z "$DATABASE_URL" ]; then
    print_result "Database URL" "FAIL" "DATABASE_URL environment variable not set"
else
    print_result "Database URL" "PASS" "Set"
fi

# Test 2: Check required files
echo -e "\n${BLUE}2. Required Files${NC}"
echo "------------------"

files=(
    "config/livekit/livekit.yaml"
    "apps/api/src/services/livekit.ts"
    "apps/api/src/routes/voice.ts"
    "apps/web/lib/voice/voice-connection-manager.ts"
    "apps/web/lib/voice/crash-safe-livekit.ts"
    "apps/web/lib/voice/audio-processor.ts"
    "apps/web/lib/voice/bandwidth-adapter.ts"
    "apps/web/components/voice/voice-panel.tsx"
    "apps/web/components/voice/video-call-panel.tsx"
    "apps/web/components/voice/voice-settings-modal.tsx"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        print_result "File: $file" "PASS"
    else
        print_result "File: $file" "FAIL" "File missing"
    fi
done

# Test 3: Check LiveKit configuration
echo -e "\n${BLUE}3. LiveKit Configuration${NC}"
echo "-------------------------"

livekit_config="config/livekit/livekit.yaml"
if [ -f "$livekit_config" ]; then
    # Check for required configuration sections
    if grep -q "^port:" "$livekit_config"; then
        print_result "LiveKit Port Config" "PASS"
    else
        print_result "LiveKit Port Config" "FAIL" "Port configuration missing"
    fi
    
    if grep -q "^rtc:" "$livekit_config"; then
        print_result "LiveKit RTC Config" "PASS"
    else
        print_result "LiveKit RTC Config" "FAIL" "RTC configuration missing"
    fi
    
    if grep -q "^redis:" "$livekit_config"; then
        print_result "LiveKit Redis Config" "PASS"
    else
        print_result "LiveKit Redis Config" "WARN" "Redis configuration missing (optional)"
    fi
    
    if grep -q "^keys:" "$livekit_config"; then
        print_result "LiveKit API Keys" "PASS"
    else
        print_result "LiveKit API Keys" "FAIL" "API keys configuration missing"
    fi
    
    if grep -q "echo_cancellation" "$livekit_config"; then
        print_result "Audio Processing Config" "PASS"
    else
        print_result "Audio Processing Config" "WARN" "Audio processing configuration missing"
    fi
else
    print_result "LiveKit Config File" "FAIL" "config/livekit/livekit.yaml not found"
fi

# Test 4: Check TypeScript compilation
echo -e "\n${BLUE}4. TypeScript Compilation${NC}"
echo "--------------------------"

# Check if we can compile the voice-related TypeScript files
if command -v npx &> /dev/null; then
    cd apps/web
    if npx tsc --noEmit lib/voice/voice-connection-manager.ts 2>/dev/null; then
        print_result "Voice Connection Manager TS" "PASS"
    else
        print_result "Voice Connection Manager TS" "FAIL" "TypeScript compilation errors"
    fi
    
    if npx tsc --noEmit lib/voice/audio-processor.ts 2>/dev/null; then
        print_result "Audio Processor TS" "PASS"
    else
        print_result "Audio Processor TS" "FAIL" "TypeScript compilation errors"
    fi
    
    if npx tsc --noEmit components/voice/voice-panel.tsx 2>/dev/null; then
        print_result "Voice Panel Component" "PASS"
    else
        print_result "Voice Panel Component" "FAIL" "TypeScript compilation errors"
    fi
    cd ../..
else
    print_result "TypeScript Compiler" "WARN" "npx not available, skipping TS checks"
fi

# Test 5: Check Docker configuration
echo -e "\n${BLUE}5. Docker Configuration${NC}"
echo "------------------------"

if [ -f "docker-compose.yml" ]; then
    if grep -q "livekit" "docker-compose.yml"; then
        print_result "LiveKit Docker Service" "PASS"
    else
        print_result "LiveKit Docker Service" "FAIL" "LiveKit service not found in docker-compose.yml"
    fi
    
    if grep -q "redis" "docker-compose.yml"; then
        print_result "Redis Docker Service" "PASS"
    else
        print_result "Redis Docker Service" "WARN" "Redis service not found (optional)"
    fi
else
    print_result "Docker Compose File" "WARN" "docker-compose.yml not found"
fi

# Test 6: Check for security configurations
echo -e "\n${BLUE}6. Security Configuration${NC}"
echo "---------------------------"

# Check if API keys are not using default values
if [ "$LIVEKIT_API_KEY" = "APIHmK7VRxK9Xb5M3PqN8Yz2Fw4Jt6Lp" ]; then
    print_result "LiveKit API Key Security" "WARN" "Using default API key (change for production)"
else
    print_result "LiveKit API Key Security" "PASS" "Using custom API key"
fi

if [ "$LIVEKIT_API_SECRET" = "LkT9Qx3Vm8Sz5Rn2Bp7Wj4Ht6Fg3Cd1" ]; then
    print_result "LiveKit API Secret Security" "WARN" "Using default API secret (change for production)"
else
    print_result "LiveKit API Secret Security" "PASS" "Using custom API secret"
fi

# Check for HTTPS/WSS configuration
if [[ "$LIVEKIT_URL" == wss://* ]]; then
    print_result "Secure WebSocket Config" "PASS" "Using WSS (secure)"
elif [[ "$LIVEKIT_URL" == ws://* ]]; then
    print_result "Secure WebSocket Config" "WARN" "Using WS (not secure, use WSS for production)"
else
    print_result "Secure WebSocket Config" "FAIL" "Invalid WebSocket URL format"
fi

# Test 7: Performance and optimization checks
echo -e "\n${BLUE}7. Performance Configuration${NC}"
echo "-----------------------------"

# Check for audio processing optimizations
if grep -q "opus" "$livekit_config" 2>/dev/null; then
    print_result "Opus Audio Codec" "PASS" "Opus codec configured"
else
    print_result "Opus Audio Codec" "WARN" "Opus codec configuration not found"
fi

# Check for video codec settings
if grep -q "video" "$livekit_config" 2>/dev/null; then
    print_result "Video Configuration" "PASS" "Video settings configured"
else
    print_result "Video Configuration" "WARN" "Video configuration not found"
fi

# Check for bandwidth adaptation
if [ -f "apps/web/lib/voice/bandwidth-adapter.ts" ]; then
    print_result "Bandwidth Adaptation" "PASS" "Bandwidth adapter implemented"
else
    print_result "Bandwidth Adaptation" "FAIL" "Bandwidth adapter missing"
fi

# Test 8: Monitoring and logging
echo -e "\n${BLUE}8. Monitoring & Logging${NC}"
echo "------------------------"

# Check for metrics configuration
if grep -q "metrics" "$livekit_config" 2>/dev/null; then
    print_result "Metrics Collection" "PASS" "Metrics configuration found"
else
    print_result "Metrics Collection" "WARN" "Metrics configuration not found"
fi

# Check for webhook configuration
if grep -q "webhook" "$livekit_config" 2>/dev/null; then
    print_result "Webhook Configuration" "PASS" "Webhook configuration found"
else
    print_result "Webhook Configuration" "FAIL" "Webhook configuration missing"
fi

# Final summary
echo -e "\n${BLUE}📊 Test Summary${NC}"
echo "================"
echo -e "✅ Passed: ${GREEN}$PASSED${NC}"
echo -e "❌ Failed: ${RED}$FAILED${NC}"  
echo -e "⚠️  Warnings: ${YELLOW}$WARNINGS${NC}"

TOTAL=$((PASSED + FAILED + WARNINGS))
if [ $TOTAL -gt 0 ]; then
    SUCCESS_RATE=$(( (PASSED * 100) / TOTAL ))
    echo -e "📈 Success Rate: ${SUCCESS_RATE}%"
else
    echo -e "❌ No tests could be run"
    exit 1
fi

echo ""

# Overall assessment
if [ $FAILED -eq 0 ] && [ $WARNINGS -le 3 ]; then
    echo -e "${GREEN}🎉 Voice & Video System is production-ready!${NC}"
    exit 0
elif [ $FAILED -le 2 ] && [ $SUCCESS_RATE -ge 70 ]; then
    echo -e "${YELLOW}⚠️  Voice & Video System is mostly functional but needs some fixes${NC}"
    echo "   Recommended: Address the failed tests before production deployment"
    exit 0
else
    echo -e "${RED}🚨 Voice & Video System needs significant fixes before production${NC}"
    echo "   Required: Address critical failures before deployment"
    exit 1
fi