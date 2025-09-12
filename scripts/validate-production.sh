#!/bin/bash

# ==============================================
# CRYB PLATFORM - PRODUCTION VALIDATION SCRIPT
# ==============================================
# Comprehensive validation script for production readiness
# Usage: ./scripts/validate-production.sh
# ==============================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.production-complete.yml"
ENV_FILE="$PROJECT_DIR/.env.production"

# Validation results
VALIDATION_RESULTS=()
FAILED_VALIDATIONS=0
TOTAL_VALIDATIONS=0
CRITICAL_ISSUES=0

# ==============================================
# UTILITY FUNCTIONS
# ==============================================

log() {
    echo -e "${1}"
}

log_info() {
    log "${BLUE}[INFO]${NC} ${1}"
}

log_success() {
    log "${GREEN}[PASS]${NC} ${1}"
}

log_warning() {
    log "${YELLOW}[WARN]${NC} ${1}"
}

log_error() {
    log "${RED}[FAIL]${NC} ${1}"
}

log_critical() {
    log "${RED}[CRITICAL]${NC} ${1}"
}

log_step() {
    log "${PURPLE}[CHECK]${NC} ${1}"
}

show_header() {
    log "${CYAN}"
    log "=============================================="
    log "  CRYB PLATFORM - PRODUCTION VALIDATION    "
    log "=============================================="
    log "${NC}"
    log_info "Starting production validation at $(date)"
    log ""
}

record_validation() {
    local category="$1"
    local test="$2"
    local status="$3"
    local message="$4"
    local is_critical="${5:-false}"
    
    VALIDATION_RESULTS+=("$category|$test|$status|$message|$is_critical")
    ((TOTAL_VALIDATIONS++))
    
    if [[ "$status" == "FAIL" ]]; then
        ((FAILED_VALIDATIONS++))
        if [[ "$is_critical" == "true" ]]; then
            ((CRITICAL_ISSUES++))
            log_critical "$category - $test: $message"
        else
            log_error "$category - $test: $message"
        fi
    elif [[ "$status" == "WARN" ]]; then
        log_warning "$category - $test: $message"
    else
        log_success "$category - $test: $message"
    fi
}

# ==============================================
# VALIDATION FUNCTIONS
# ==============================================

validate_prerequisites() {
    log_step "Validating prerequisites..."
    
    # Check Docker
    if command -v docker >/dev/null 2>&1; then
        if docker info >/dev/null 2>&1; then
            record_validation "Prerequisites" "Docker" "PASS" "Docker is installed and running" "true"
        else
            record_validation "Prerequisites" "Docker" "FAIL" "Docker is not running" "true"
        fi
    else
        record_validation "Prerequisites" "Docker" "FAIL" "Docker is not installed" "true"
    fi
    
    # Check Docker Compose
    if docker compose version >/dev/null 2>&1; then
        record_validation "Prerequisites" "Docker Compose" "PASS" "Docker Compose is available"
    else
        record_validation "Prerequisites" "Docker Compose" "FAIL" "Docker Compose is not available" "true"
    fi
    
    # Check required files
    if [[ -f "$COMPOSE_FILE" ]]; then
        record_validation "Prerequisites" "Compose File" "PASS" "Production compose file exists"
    else
        record_validation "Prerequisites" "Compose File" "FAIL" "Production compose file missing" "true"
    fi
    
    if [[ -f "$ENV_FILE" ]]; then
        record_validation "Prerequisites" "Environment File" "PASS" "Environment file exists"
    else
        record_validation "Prerequisites" "Environment File" "FAIL" "Environment file missing" "true"
    fi
}

validate_environment_config() {
    log_step "Validating environment configuration..."
    
    if [[ ! -f "$ENV_FILE" ]]; then
        record_validation "Environment" "File Exists" "FAIL" "Environment file not found" "true"
        return 1
    fi
    
    # Load environment variables
    set -a
    source "$ENV_FILE" 2>/dev/null || true
    set +a
    
    # Check critical passwords
    local has_default_passwords=false
    
    if [[ "${POSTGRES_PASSWORD:-}" == *"change"* ]] || [[ "${POSTGRES_PASSWORD:-}" == *"default"* ]] || [[ -z "${POSTGRES_PASSWORD:-}" ]]; then
        record_validation "Environment" "PostgreSQL Password" "FAIL" "Using default/weak PostgreSQL password" "true"
        has_default_passwords=true
    else
        record_validation "Environment" "PostgreSQL Password" "PASS" "PostgreSQL password configured"
    fi
    
    if [[ "${REDIS_PASSWORD:-}" == *"change"* ]] || [[ "${REDIS_PASSWORD:-}" == *"default"* ]] || [[ -z "${REDIS_PASSWORD:-}" ]]; then
        record_validation "Environment" "Redis Password" "FAIL" "Using default/weak Redis password" "true"
        has_default_passwords=true
    else
        record_validation "Environment" "Redis Password" "PASS" "Redis password configured"
    fi
    
    if [[ "${JWT_SECRET:-}" == *"change"* ]] || [[ "${JWT_SECRET:-}" == *"default"* ]] || [[ -z "${JWT_SECRET:-}" ]] || [[ ${#JWT_SECRET} -lt 32 ]]; then
        record_validation "Environment" "JWT Secret" "FAIL" "Weak or default JWT secret" "true"
        has_default_passwords=true
    else
        record_validation "Environment" "JWT Secret" "PASS" "JWT secret configured"
    fi
    
    if [[ "${MINIO_SECRET_KEY:-}" == *"change"* ]] || [[ "${MINIO_SECRET_KEY:-}" == *"default"* ]] || [[ -z "${MINIO_SECRET_KEY:-}" ]]; then
        record_validation "Environment" "MinIO Secret" "FAIL" "Using default/weak MinIO secret" "true"
        has_default_passwords=true
    else
        record_validation "Environment" "MinIO Secret" "PASS" "MinIO secret configured"
    fi
    
    # Check SSL configuration
    if [[ -d "$PROJECT_DIR/config/nginx/ssl" ]] && [[ -n "$(find "$PROJECT_DIR/config/nginx/ssl" -name "*.pem" 2>/dev/null)" ]]; then
        record_validation "Environment" "SSL Certificates" "PASS" "SSL certificates found"
    else
        record_validation "Environment" "SSL Certificates" "WARN" "No SSL certificates found - HTTP only deployment"
    fi
    
    # Check resource limits
    if [[ "${NODE_ENV:-}" == "production" ]]; then
        record_validation "Environment" "Production Mode" "PASS" "NODE_ENV set to production"
    else
        record_validation "Environment" "Production Mode" "WARN" "NODE_ENV not set to production"
    fi
}

validate_system_resources() {
    log_step "Validating system resources..."
    
    # Check memory
    local mem_gb=$(free -g | awk '/^Mem:/{print $2}')
    if [[ $mem_gb -ge 8 ]]; then
        record_validation "Resources" "Memory" "PASS" "Sufficient memory: ${mem_gb}GB"
    elif [[ $mem_gb -ge 4 ]]; then
        record_validation "Resources" "Memory" "WARN" "Minimum memory: ${mem_gb}GB (8GB+ recommended)"
    else
        record_validation "Resources" "Memory" "FAIL" "Insufficient memory: ${mem_gb}GB (4GB minimum)" "true"
    fi
    
    # Check disk space
    local disk_gb=$(df -BG "$PROJECT_DIR" | awk 'NR==2{print $4}' | sed 's/G//')
    if [[ $disk_gb -ge 20 ]]; then
        record_validation "Resources" "Disk Space" "PASS" "Sufficient disk space: ${disk_gb}GB"
    elif [[ $disk_gb -ge 10 ]]; then
        record_validation "Resources" "Disk Space" "WARN" "Minimum disk space: ${disk_gb}GB (20GB+ recommended)"
    else
        record_validation "Resources" "Disk Space" "FAIL" "Insufficient disk space: ${disk_gb}GB (10GB minimum)" "true"
    fi
    
    # Check CPU cores
    local cpu_cores=$(nproc)
    if [[ $cpu_cores -ge 4 ]]; then
        record_validation "Resources" "CPU Cores" "PASS" "Sufficient CPU cores: $cpu_cores"
    elif [[ $cpu_cores -ge 2 ]]; then
        record_validation "Resources" "CPU Cores" "WARN" "Minimum CPU cores: $cpu_cores (4+ recommended)"
    else
        record_validation "Resources" "CPU Cores" "FAIL" "Insufficient CPU cores: $cpu_cores (2 minimum)" "true"
    fi
}

validate_network_ports() {
    log_step "Validating network ports..."
    
    local ports=(80 443 3000 3001 5432 6379 9000 9001 9200 7880)
    
    for port in "${ports[@]}"; do
        if netstat -ln 2>/dev/null | grep -q ":$port "; then
            record_validation "Network" "Port $port" "WARN" "Port $port is already in use"
        else
            record_validation "Network" "Port $port" "PASS" "Port $port is available"
        fi
    done
}

validate_docker_configuration() {
    log_step "Validating Docker configuration..."
    
    # Check Docker version
    local docker_version=$(docker version --format '{{.Server.Version}}' 2>/dev/null || echo "unknown")
    if [[ "$docker_version" != "unknown" ]]; then
        record_validation "Docker" "Version" "PASS" "Docker version: $docker_version"
    else
        record_validation "Docker" "Version" "FAIL" "Could not determine Docker version" "true"
    fi
    
    # Check if Docker has enough resources
    local docker_mem=$(docker system info --format '{{.MemTotal}}' 2>/dev/null || echo "0")
    if [[ $docker_mem -gt 4000000000 ]]; then # 4GB in bytes
        record_validation "Docker" "Memory Limit" "PASS" "Docker has sufficient memory allocated"
    else
        record_validation "Docker" "Memory Limit" "WARN" "Docker may need more memory allocated"
    fi
    
    # Check Docker daemon configuration
    if docker info | grep -q "Storage Driver:"; then
        record_validation "Docker" "Storage Driver" "PASS" "Docker storage driver configured"
    else
        record_validation "Docker" "Storage Driver" "WARN" "Could not verify Docker storage driver"
    fi
}

validate_compose_configuration() {
    log_step "Validating Docker Compose configuration..."
    
    # Validate compose file syntax
    if docker compose -f "$COMPOSE_FILE" config >/dev/null 2>&1; then
        record_validation "Compose" "Syntax" "PASS" "Compose file syntax is valid"
    else
        record_validation "Compose" "Syntax" "FAIL" "Compose file has syntax errors" "true"
        return 1
    fi
    
    # Check for required services
    local required_services=("web" "api" "postgres" "redis" "nginx")
    for service in "${required_services[@]}"; do
        if docker compose -f "$COMPOSE_FILE" config --services | grep -q "^$service$"; then
            record_validation "Compose" "Service $service" "PASS" "Service $service is defined"
        else
            record_validation "Compose" "Service $service" "FAIL" "Required service $service is missing" "true"
        fi
    done
    
    # Check for health checks
    if docker compose -f "$COMPOSE_FILE" config | grep -q "healthcheck:"; then
        record_validation "Compose" "Health Checks" "PASS" "Health checks are configured"
    else
        record_validation "Compose" "Health Checks" "WARN" "No health checks found in compose file"
    fi
    
    # Check for resource limits
    if docker compose -f "$COMPOSE_FILE" config | grep -q "resources:"; then
        record_validation "Compose" "Resource Limits" "PASS" "Resource limits are configured"
    else
        record_validation "Compose" "Resource Limits" "WARN" "No resource limits configured"
    fi
}

validate_security_configuration() {
    log_step "Validating security configuration..."
    
    # Check if running as root
    if [[ $EUID -eq 0 ]]; then
        record_validation "Security" "Root User" "WARN" "Running as root - consider using non-root user"
    else
        record_validation "Security" "Root User" "PASS" "Not running as root"
    fi
    
    # Check firewall status
    if command -v ufw >/dev/null 2>&1; then
        if ufw status | grep -q "Status: active"; then
            record_validation "Security" "Firewall" "PASS" "UFW firewall is active"
        else
            record_validation "Security" "Firewall" "WARN" "UFW firewall is not active"
        fi
    elif command -v firewall-cmd >/dev/null 2>&1; then
        if firewall-cmd --state 2>/dev/null | grep -q "running"; then
            record_validation "Security" "Firewall" "PASS" "Firewalld is active"
        else
            record_validation "Security" "Firewall" "WARN" "Firewalld is not active"
        fi
    else
        record_validation "Security" "Firewall" "WARN" "No firewall configuration detected"
    fi
    
    # Check for secret files with proper permissions
    if [[ -f "$ENV_FILE" ]]; then
        local env_perms=$(stat -c "%a" "$ENV_FILE")
        if [[ "$env_perms" == "600" ]] || [[ "$env_perms" == "644" ]]; then
            record_validation "Security" "Env File Permissions" "PASS" "Environment file has proper permissions"
        else
            record_validation "Security" "Env File Permissions" "WARN" "Environment file permissions: $env_perms"
        fi
    fi
}

validate_backup_configuration() {
    log_step "Validating backup configuration..."
    
    # Check if backup scripts exist
    if [[ -f "$PROJECT_DIR/scripts/backup-system.sh" ]]; then
        record_validation "Backup" "Script Exists" "PASS" "Backup script found"
        
        if [[ -x "$PROJECT_DIR/scripts/backup-system.sh" ]]; then
            record_validation "Backup" "Script Executable" "PASS" "Backup script is executable"
        else
            record_validation "Backup" "Script Executable" "WARN" "Backup script is not executable"
        fi
    else
        record_validation "Backup" "Script Exists" "WARN" "No backup script found"
    fi
    
    # Check backup directory
    if [[ -d "$PROJECT_DIR/backups" ]] || [[ -d "/opt/cryb/backups" ]]; then
        record_validation "Backup" "Directory" "PASS" "Backup directory exists"
    else
        record_validation "Backup" "Directory" "WARN" "No backup directory found"
    fi
}

perform_dry_run() {
    log_step "Performing deployment dry run..."
    
    # Test if images can be built
    if docker compose -f "$COMPOSE_FILE" build --dry-run >/dev/null 2>&1; then
        record_validation "Dry Run" "Build Test" "PASS" "Docker images can be built"
    else
        record_validation "Dry Run" "Build Test" "FAIL" "Docker image build would fail" "true"
    fi
    
    # Test if services can be created (without starting)
    if docker compose -f "$COMPOSE_FILE" create --no-build >/dev/null 2>&1; then
        record_validation "Dry Run" "Service Creation" "PASS" "Services can be created"
        # Clean up
        docker compose -f "$COMPOSE_FILE" down --remove-orphans >/dev/null 2>&1 || true
    else
        record_validation "Dry Run" "Service Creation" "FAIL" "Service creation would fail" "true"
    fi
}

# ==============================================
# SUMMARY AND REPORTING
# ==============================================

generate_validation_report() {
    local report_file="$PROJECT_DIR/production-validation-report-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "CRYB PLATFORM - PRODUCTION VALIDATION REPORT"
        echo "============================================="
        echo "Generated: $(date)"
        echo "Total Validations: $TOTAL_VALIDATIONS"
        echo "Failed Validations: $FAILED_VALIDATIONS"
        echo "Critical Issues: $CRITICAL_ISSUES"
        echo ""
        echo "DETAILED RESULTS:"
        echo "----------------------------------------"
        
        for result in "${VALIDATION_RESULTS[@]}"; do
            IFS='|' read -r category test status message is_critical <<< "$result"
            if [[ "$is_critical" == "true" && "$status" == "FAIL" ]]; then
                printf "%-20s %-25s %-8s %s [CRITICAL]\n" "$category" "$test" "$status" "$message"
            else
                printf "%-20s %-25s %-8s %s\n" "$category" "$test" "$status" "$message"
            fi
        done
        
        echo ""
        echo "RECOMMENDATIONS:"
        echo "----------------------------------------"
        
        if [[ $CRITICAL_ISSUES -gt 0 ]]; then
            echo "• Fix all CRITICAL issues before deploying to production"
        fi
        
        if [[ $FAILED_VALIDATIONS -gt 0 ]]; then
            echo "• Address failed validations for optimal deployment"
        fi
        
        echo "• Review all WARNING messages and address if applicable"
        echo "• Ensure regular backups are configured"
        echo "• Monitor system resources after deployment"
        echo "• Set up proper logging and monitoring"
        
    } > "$report_file"
    
    log_info "Detailed report saved to: $report_file"
}

show_summary() {
    log ""
    log "${CYAN}=============================================="
    log "           VALIDATION SUMMARY              "
    log "=============================================="
    log "${NC}"
    
    local passed=$((TOTAL_VALIDATIONS - FAILED_VALIDATIONS))
    local success_rate=$(echo "scale=1; $passed * 100 / $TOTAL_VALIDATIONS" | bc -l)
    
    log_info "Total validations: $TOTAL_VALIDATIONS"
    log_success "Passed: $passed"
    log_error "Failed: $FAILED_VALIDATIONS"
    log_critical "Critical issues: $CRITICAL_ISSUES"
    log_info "Success rate: ${success_rate}%"
    log ""
    
    if [[ $CRITICAL_ISSUES -eq 0 && $FAILED_VALIDATIONS -eq 0 ]]; then
        log_success "🎉 All validations passed! Your platform is ready for production deployment."
        log_info "You can now run: ./deploy-production.sh"
        return 0
    elif [[ $CRITICAL_ISSUES -eq 0 ]]; then
        log_warning "⚠️  Some non-critical validations failed. Review and address if needed."
        log_info "You can proceed with deployment, but consider fixing warnings."
        return 1
    else
        log_error "❌ Critical issues found! DO NOT deploy to production until these are resolved."
        log_error "Fix all critical issues and run validation again."
        return 2
    fi
}

show_help() {
    cat << EOF
CRYB Platform Production Validation Script

Usage: $0 [OPTIONS]

OPTIONS:
    -h, --help          Show this help message
    -r, --report        Generate detailed validation report
    --skip-dry-run      Skip deployment dry run test
    --skip-security     Skip security validation checks
    --skip-network      Skip network port checks

EXAMPLES:
    $0                  # Run all validations
    $0 --report         # Generate detailed report
    $0 --skip-dry-run   # Skip time-consuming dry run

VALIDATION CATEGORIES:
    - Prerequisites     (Docker, files, etc.)
    - Environment       (Configuration, secrets)
    - System Resources  (Memory, disk, CPU)
    - Network           (Port availability)
    - Docker            (Configuration, resources)
    - Security          (Permissions, firewall)
    - Backup            (Backup scripts, directories)
    - Dry Run          (Test deployment feasibility)

EXIT CODES:
    0   All validations passed - ready for production
    1   Some non-critical validations failed
    2   Critical issues found - DO NOT deploy

EOF
}

# ==============================================
# MAIN EXECUTION
# ==============================================

main() {
    local generate_report=false
    local skip_dry_run=false
    local skip_security=false
    local skip_network=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -r|--report)
                generate_report=true
                shift
                ;;
            --skip-dry-run)
                skip_dry_run=true
                shift
                ;;
            --skip-security)
                skip_security=true
                shift
                ;;
            --skip-network)
                skip_network=true
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Check if required tools are available
    for tool in docker bc netstat free df; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            log_error "Required tool not found: $tool"
            exit 1
        fi
    done
    
    # Run validations
    show_header
    
    validate_prerequisites
    validate_environment_config
    validate_system_resources
    
    if [[ "$skip_network" != "true" ]]; then
        validate_network_ports
    fi
    
    validate_docker_configuration
    validate_compose_configuration
    
    if [[ "$skip_security" != "true" ]]; then
        validate_security_configuration
    fi
    
    validate_backup_configuration
    
    if [[ "$skip_dry_run" != "true" ]]; then
        perform_dry_run
    fi
    
    if [[ "$generate_report" == "true" ]]; then
        generate_validation_report
    fi
    
    show_summary
    
    # Exit with appropriate code
    local exit_code=$?
    exit $exit_code
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi