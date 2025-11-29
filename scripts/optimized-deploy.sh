#!/bin/bash

# Optimized Production Deployment Script for Cryb Platform
# Handles zero-downtime deployments with comprehensive validation

set -euo pipefail

# Configuration
PLATFORM_ROOT="/home/ubuntu/cryb-platform"
BACKUP_DIR="$PLATFORM_ROOT/backups/deployments"
DEPLOY_LOG="$PLATFORM_ROOT/logs/deployment.log"
ROLLBACK_INFO="$PLATFORM_ROOT/.rollback-info"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Deployment settings
HEALTH_CHECK_TIMEOUT=60
PARALLEL_BUILD=true
SKIP_TESTS=false
FORCE_DEPLOY=false

log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$DEPLOY_LOG"
}

show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Options:
    --skip-tests        Skip test execution
    --force            Force deployment even if health checks fail
    --no-parallel      Disable parallel building
    --rollback         Rollback to previous deployment
    --status           Show deployment status
    --help             Show this help message

Examples:
    $0                     # Standard deployment
    $0 --skip-tests        # Deploy without running tests
    $0 --rollback          # Rollback to previous version
EOF
}

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --force)
                FORCE_DEPLOY=true
                shift
                ;;
            --no-parallel)
                PARALLEL_BUILD=false
                shift
                ;;
            --rollback)
                rollback_deployment
                exit $?
                ;;
            --status)
                show_deployment_status
                exit 0
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                log "${RED}Unknown option: $1${NC}"
                show_usage
                exit 1
                ;;
        esac
    done
}

create_deployment_backup() {
    local backup_timestamp=$(date '+%Y%m%d_%H%M%S')
    local backup_path="$BACKUP_DIR/backup_$backup_timestamp"
    
    log "${BLUE}Creating deployment backup...${NC}"
    
    mkdir -p "$backup_path"
    
    # Backup critical files and current PM2 configuration
    cp ecosystem.config.js "$backup_path/" 2>/dev/null || true
    cp -r apps/ "$backup_path/" 2>/dev/null || true
    
    # Save current PM2 process information
    pm2 dump "$backup_path/pm2-processes.json" 2>/dev/null || true
    pm2 prettylist > "$backup_path/pm2-status.txt" 2>/dev/null || true
    
    # Save deployment info for rollback
    cat > "$ROLLBACK_INFO" << EOF
BACKUP_PATH=$backup_path
BACKUP_TIMESTAMP=$backup_timestamp
DEPLOYMENT_TIMESTAMP=$(date -Iseconds)
GIT_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
GIT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
EOF
    
    log "${GREEN}✓ Backup created: $backup_path${NC}"
}

validate_environment() {
    log "${BLUE}Validating deployment environment...${NC}"
    
    # Check required commands
    local required_commands=("node" "npm" "pnpm" "pm2" "nginx" "git")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            log "${RED}✗ Required command not found: $cmd${NC}"
            exit 1
        fi
    done
    
    # Check disk space (at least 2GB free)
    local available_space
    available_space=$(df "$PLATFORM_ROOT" | tail -1 | awk '{print $4}')
    if [[ "$available_space" -lt 2097152 ]]; then # 2GB in KB
        log "${RED}✗ Insufficient disk space. At least 2GB required.${NC}"
        exit 1
    fi
    
    # Check memory (at least 1GB free)
    local available_memory
    available_memory=$(free -m | grep '^Mem:' | awk '{print $7}')
    if [[ "$available_memory" -lt 1024 ]]; then # 1GB in MB
        log "${YELLOW}⚠ Low available memory: ${available_memory}MB. Deployment may be slower.${NC}"
    fi
    
    log "${GREEN}✓ Environment validation passed${NC}"
}

install_dependencies() {
    log "${BLUE}Installing dependencies...${NC}"
    
    # Install root dependencies
    if [[ -f "pnpm-lock.yaml" ]]; then
        pnpm install --frozen-lockfile --production=false
    elif [[ -f "package-lock.json" ]]; then
        npm ci
    else
        npm install
    fi
    
    # Install app-specific dependencies in parallel
    if [[ "$PARALLEL_BUILD" == true ]]; then
        log "${BLUE}Installing app dependencies in parallel...${NC}"
        
        (
            cd apps/api && \
            if [[ -f "pnpm-lock.yaml" ]]; then
                pnpm install --frozen-lockfile --production=false
            else
                npm ci
            fi
        ) &
        
        (
            cd apps/web && \
            if [[ -f "pnpm-lock.yaml" ]]; then
                pnpm install --frozen-lockfile --production=false
            else
                npm ci
            fi
        ) &
        
        (
            cd apps/react-app && \
            if [[ -f "pnpm-lock.yaml" ]]; then
                pnpm install --frozen-lockfile --production=false
            else
                npm ci
            fi
        ) &
        
        # Wait for all installations to complete
        wait
    else
        # Sequential installation
        for app in api web react-app; do
            if [[ -d "apps/$app" ]]; then
                log "${BLUE}Installing dependencies for $app...${NC}"
                cd "apps/$app"
                if [[ -f "pnpm-lock.yaml" ]]; then
                    pnpm install --frozen-lockfile --production=false
                else
                    npm ci
                fi
                cd - > /dev/null
            fi
        done
    fi
    
    log "${GREEN}✓ Dependencies installed${NC}"
}

run_tests() {
    if [[ "$SKIP_TESTS" == true ]]; then
        log "${YELLOW}⚠ Skipping tests as requested${NC}"
        return 0
    fi
    
    log "${BLUE}Running tests...${NC}"
    
    # Run tests for each app
    local test_results=()
    
    for app in api web; do
        if [[ -d "apps/$app" ]] && [[ -f "apps/$app/package.json" ]]; then
            log "${BLUE}Running tests for $app...${NC}"
            
            cd "apps/$app"
            
            # Check if test script exists
            if npm run test --silent 2>/dev/null; then
                log "${GREEN}✓ Tests passed for $app${NC}"
                test_results+=("$app:passed")
            else
                log "${RED}✗ Tests failed for $app${NC}"
                test_results+=("$app:failed")
            fi
            
            cd - > /dev/null
        fi
    done
    
    # Check if any tests failed
    for result in "${test_results[@]}"; do
        if [[ "$result" =~ :failed$ ]]; then
            log "${RED}✗ Some tests failed. Use --skip-tests to deploy anyway.${NC}"
            exit 1
        fi
    done
    
    log "${GREEN}✓ All tests passed${NC}"
}

build_applications() {
    log "${BLUE}Building applications...${NC}"
    
    if [[ "$PARALLEL_BUILD" == true ]]; then
        log "${BLUE}Building applications in parallel...${NC}"
        
        # Build API (if needed)
        (
            if [[ -d "apps/api" ]] && [[ -f "apps/api/package.json" ]]; then
                cd apps/api
                if npm run build --if-present --silent; then
                    echo "API build completed"
                else
                    echo "API build failed" >&2
                    exit 1
                fi
            fi
        ) &
        
        # Build Web
        (
            if [[ -d "apps/web" ]] && [[ -f "apps/web/package.json" ]]; then
                cd apps/web
                if npm run build --silent; then
                    echo "Web build completed"
                else
                    echo "Web build failed" >&2
                    exit 1
                fi
            fi
        ) &
        
        # Build React App
        (
            if [[ -d "apps/react-app" ]] && [[ -f "apps/react-app/package.json" ]]; then
                cd apps/react-app
                if npm run build --if-present --silent; then
                    echo "React app build completed"
                else
                    echo "React app build failed" >&2
                    exit 1
                fi
            fi
        ) &
        
        # Wait for all builds to complete
        if ! wait; then
            log "${RED}✗ One or more builds failed${NC}"
            exit 1
        fi
    else
        # Sequential builds
        for app in api web react-app; do
            if [[ -d "apps/$app" ]] && [[ -f "apps/$app/package.json" ]]; then
                log "${BLUE}Building $app...${NC}"
                cd "apps/$app"
                npm run build --if-present
                cd - > /dev/null
            fi
        done
    fi
    
    log "${GREEN}✓ Applications built successfully${NC}"
}

deploy_with_zero_downtime() {
    log "${BLUE}Starting zero-downtime deployment...${NC}"
    
    # Use the production configuration
    local config_file="ecosystem.production.config.js"
    if [[ ! -f "$config_file" ]]; then
        config_file="ecosystem.config.js"
    fi
    
    # Reload PM2 processes with zero downtime
    log "${BLUE}Reloading PM2 processes...${NC}"
    
    if pm2 reload "$config_file" --env production; then
        log "${GREEN}✓ PM2 processes reloaded successfully${NC}"
    else
        log "${RED}✗ PM2 reload failed${NC}"
        exit 1
    fi
    
    # Wait for processes to stabilize
    log "${BLUE}Waiting for processes to stabilize...${NC}"
    sleep 10
    
    # Reload nginx configuration
    log "${BLUE}Reloading nginx configuration...${NC}"
    
    if nginx -t && systemctl reload nginx; then
        log "${GREEN}✓ Nginx reloaded successfully${NC}"
    else
        log "${RED}✗ Nginx reload failed${NC}"
        exit 1
    fi
}

validate_deployment() {
    log "${BLUE}Validating deployment...${NC}"
    
    local validation_start=$(date +%s)
    local health_checks_passed=0
    local total_checks=0
    
    # Check PM2 processes
    local pm2_status
    pm2_status=$(pm2 jlist 2>/dev/null || echo "[]")
    
    if [[ "$pm2_status" != "[]" ]]; then
        local online_processes=0
        local total_processes=0
        
        while IFS= read -r line; do
            if [[ "$line" =~ \"name\":\"([^\"]+)\" ]]; then
                ((total_processes++))
                if [[ "$line" =~ \"status\":\"online\" ]]; then
                    ((online_processes++))
                fi
            fi
        done <<< "$pm2_status"
        
        if [[ "$online_processes" -eq "$total_processes" ]] && [[ "$total_processes" -gt 0 ]]; then
            log "${GREEN}✓ All PM2 processes are online ($online_processes/$total_processes)${NC}"
            ((health_checks_passed++))
        else
            log "${RED}✗ Some PM2 processes are not online ($online_processes/$total_processes)${NC}"
        fi
        ((total_checks++))
    fi
    
    # Health check endpoints
    local endpoints=(
        "http://localhost:3002/health:API"
        "http://localhost:3000:Web Frontend"
        "http://localhost:3001:React App"
    )
    
    for endpoint_info in "${endpoints[@]}"; do
        IFS=':' read -r endpoint name <<< "$endpoint_info"
        ((total_checks++))
        
        if timeout 10 curl -f -s "$endpoint" > /dev/null; then
            log "${GREEN}✓ $name is responding${NC}"
            ((health_checks_passed++))
        else
            log "${RED}✗ $name is not responding${NC}"
            if [[ "$FORCE_DEPLOY" != true ]]; then
                log "${RED}Health check failed. Use --force to ignore health checks.${NC}"
                exit 1
            fi
        fi
    done
    
    # Check external endpoints through nginx
    local external_checks=(
        "https://api.cryb.ai/health:External API"
        "https://platform.cryb.ai:External Platform"
    )
    
    for endpoint_info in "${external_checks[@]}"; do
        IFS=':' read -r endpoint name <<< "$endpoint_info"
        ((total_checks++))
        
        if timeout 15 curl -f -s "$endpoint" > /dev/null; then
            log "${GREEN}✓ $name is accessible${NC}"
            ((health_checks_passed++))
        else
            log "${YELLOW}⚠ $name may not be accessible externally${NC}"
        fi
    done
    
    local validation_end=$(date +%s)
    local validation_time=$((validation_end - validation_start))
    
    if [[ "$health_checks_passed" -ge $((total_checks - 2)) ]]; then
        log "${GREEN}✓ Deployment validation passed ($health_checks_passed/$total_checks checks) in ${validation_time}s${NC}"
        return 0
    else
        log "${RED}✗ Deployment validation failed ($health_checks_passed/$total_checks checks)${NC}"
        if [[ "$FORCE_DEPLOY" != true ]]; then
            exit 1
        fi
        return 1
    fi
}

rollback_deployment() {
    log "${YELLOW}Initiating rollback...${NC}"
    
    if [[ ! -f "$ROLLBACK_INFO" ]]; then
        log "${RED}✗ No rollback information available${NC}"
        exit 1
    fi
    
    # Source rollback info
    source "$ROLLBACK_INFO"
    
    if [[ ! -d "$BACKUP_PATH" ]]; then
        log "${RED}✗ Backup directory not found: $BACKUP_PATH${NC}"
        exit 1
    fi
    
    log "${BLUE}Rolling back to backup: $BACKUP_TIMESTAMP${NC}"
    
    # Stop current processes
    pm2 stop all || true
    
    # Restore files
    cp "$BACKUP_PATH/ecosystem.config.js" . 2>/dev/null || true
    cp -r "$BACKUP_PATH/apps/"* apps/ 2>/dev/null || true
    
    # Restore PM2 processes
    if [[ -f "$BACKUP_PATH/pm2-processes.json" ]]; then
        pm2 resurrect "$BACKUP_PATH/pm2-processes.json"
    else
        pm2 start ecosystem.config.js --env production
    fi
    
    # Validate rollback
    sleep 10
    if validate_deployment; then
        log "${GREEN}✓ Rollback completed successfully${NC}"
    else
        log "${RED}✗ Rollback validation failed${NC}"
        exit 1
    fi
}

show_deployment_status() {
    echo "=== Cryb Platform Deployment Status ==="
    echo
    
    # PM2 Status
    echo "PM2 Processes:"
    pm2 status --no-colors 2>/dev/null || echo "PM2 not available"
    echo
    
    # Last deployment info
    if [[ -f "$ROLLBACK_INFO" ]]; then
        echo "Last Deployment:"
        cat "$ROLLBACK_INFO"
        echo
    fi
    
    # Recent deployment logs
    echo "Recent Deployment Logs:"
    tail -20 "$DEPLOY_LOG" 2>/dev/null || echo "No deployment logs found"
}

cleanup_old_backups() {
    log "${BLUE}Cleaning up old deployment backups...${NC}"
    
    # Keep only the last 5 backups
    find "$BACKUP_DIR" -type d -name "backup_*" | sort -r | tail -n +6 | xargs rm -rf 2>/dev/null || true
    
    log "${GREEN}✓ Old backups cleaned up${NC}"
}

main() {
    local start_time=$(date +%s)
    
    log "${PURPLE}=== Starting Optimized Deployment ===${NC}"
    log "${BLUE}Platform: Cryb${NC}"
    log "${BLUE}Environment: Production${NC}"
    log "${BLUE}Timestamp: $(date -Iseconds)${NC}"
    
    # Change to platform root
    cd "$PLATFORM_ROOT"
    
    # Create necessary directories
    mkdir -p "$BACKUP_DIR" "$(dirname "$DEPLOY_LOG")"
    
    # Run deployment steps
    validate_environment
    create_deployment_backup
    install_dependencies
    run_tests
    build_applications
    deploy_with_zero_downtime
    validate_deployment
    cleanup_old_backups
    
    local end_time=$(date +%s)
    local total_time=$((end_time - start_time))
    
    log "${PURPLE}=== Deployment Completed Successfully ===${NC}"
    log "${GREEN}✓ Total deployment time: ${total_time}s${NC}"
    log "${GREEN}✓ All services are healthy and running${NC}"
    
    # Show final status
    echo
    echo "=== Final Status ==="
    pm2 status --no-colors
}

# Parse command line arguments
parse_arguments "$@"

# Run main deployment
main "$@"