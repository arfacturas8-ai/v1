#!/bin/bash

# ===================================================
# CRYB PLATFORM - PM2 SERVICE MANAGER
# ===================================================
# Advanced service management for individual services
# Provides granular control over each service component
# ===================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ECOSYSTEM_CONFIG="$PROJECT_ROOT/ecosystem.config.js"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Available services
SERVICES=("cryb-api" "cryb-web" "cryb-workers" "cryb-health-monitor")

# Logging functions
log() { echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
error() { echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" >&2; }
success() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS:${NC} $1"; }
warning() { echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"; }

# Function to validate service name
validate_service() {
    local service="$1"
    
    for valid_service in "${SERVICES[@]}"; do
        if [[ "$service" == "$valid_service" ]]; then
            return 0
        fi
    done
    
    error "Invalid service: $service"
    echo "Available services: ${SERVICES[*]}"
    return 1
}

# Function to start a specific service
start_service() {
    local service="$1"
    local environment="${2:-production}"
    
    validate_service "$service"
    
    log "Starting service: $service (environment: $environment)"
    
    if pm2 describe "$service" >/dev/null 2>&1; then
        warning "Service $service is already running. Use restart instead."
        return 1
    fi
    
    pm2 start "$ECOSYSTEM_CONFIG" --only "$service" --env "$environment"
    pm2 save
    
    success "Service $service started successfully"
}

# Function to stop a specific service
stop_service() {
    local service="$1"
    
    validate_service "$service"
    
    log "Stopping service: $service"
    
    if ! pm2 describe "$service" >/dev/null 2>&1; then
        warning "Service $service is not running"
        return 0
    fi
    
    pm2 stop "$service"
    success "Service $service stopped successfully"
}

# Function to restart a specific service
restart_service() {
    local service="$1"
    local environment="${2:-production}"
    
    validate_service "$service"
    
    log "Restarting service: $service (environment: $environment)"
    
    if pm2 describe "$service" >/dev/null 2>&1; then
        pm2 restart "$service"
    else
        pm2 start "$ECOSYSTEM_CONFIG" --only "$service" --env "$environment"
    fi
    
    pm2 save
    success "Service $service restarted successfully"
}

# Function to reload a specific service (zero-downtime)
reload_service() {
    local service="$1"
    
    validate_service "$service"
    
    log "Reloading service: $service (zero-downtime)"
    
    if ! pm2 describe "$service" >/dev/null 2>&1; then
        error "Service $service is not running. Use start instead."
        return 1
    fi
    
    pm2 reload "$service"
    success "Service $service reloaded successfully"
}

# Function to delete a specific service
delete_service() {
    local service="$1"
    
    validate_service "$service"
    
    log "Deleting service: $service"
    
    if ! pm2 describe "$service" >/dev/null 2>&1; then
        warning "Service $service is not running"
        return 0
    fi
    
    pm2 delete "$service"
    pm2 save
    success "Service $service deleted successfully"
}

# Function to show service status
show_service_status() {
    local service="${1:-}"
    
    if [[ -n "$service" ]]; then
        validate_service "$service"
        log "Status for service: $service"
        pm2 describe "$service"
    else
        log "Status for all services:"
        pm2 status
    fi
}

# Function to show service logs
show_service_logs() {
    local service="${1:-}"
    local lines="${2:-50}"
    
    if [[ -n "$service" ]]; then
        validate_service "$service"
        log "Logs for service: $service (last $lines lines)"
        pm2 logs "$service" --lines "$lines"
    else
        log "Logs for all services (last $lines lines)"
        pm2 logs --lines "$lines"
    fi
}

# Function to monitor service metrics
monitor_service() {
    local service="${1:-}"
    
    if [[ -n "$service" ]]; then
        validate_service "$service"
        log "Monitoring service: $service"
        pm2 monit "$service"
    else
        log "Monitoring all services"
        pm2 monit
    fi
}

# Function to scale service instances
scale_service() {
    local service="$1"
    local instances="$2"
    
    validate_service "$service"
    
    if ! [[ "$instances" =~ ^[0-9]+$|^max$ ]]; then
        error "Invalid instance count: $instances (use number or 'max')"
        return 1
    fi
    
    log "Scaling service $service to $instances instances"
    
    pm2 scale "$service" "$instances"
    pm2 save
    
    success "Service $service scaled to $instances instances"
}

# Function to update service environment
update_service_env() {
    local service="$1"
    local environment="$2"
    
    validate_service "$service"
    
    if [[ ! "$environment" =~ ^(development|staging|production)$ ]]; then
        error "Invalid environment: $environment (use development, staging, or production)"
        return 1
    fi
    
    log "Updating service $service to environment: $environment"
    
    pm2 restart "$service" --update-env --env "$environment"
    pm2 save
    
    success "Service $service updated to $environment environment"
}

# Function to reset service (stop, delete, start)
reset_service() {
    local service="$1"
    local environment="${2:-production}"
    
    validate_service "$service"
    
    log "Resetting service: $service"
    
    # Stop and delete if running
    if pm2 describe "$service" >/dev/null 2>&1; then
        pm2 delete "$service"
    fi
    
    # Start fresh
    pm2 start "$ECOSYSTEM_CONFIG" --only "$service" --env "$environment"
    pm2 save
    
    success "Service $service reset successfully"
}

# Function to backup service configuration
backup_service_config() {
    local backup_dir="$PROJECT_ROOT/backups/pm2"
    local timestamp=$(date +'%Y%m%d_%H%M%S')
    
    mkdir -p "$backup_dir"
    
    log "Backing up PM2 configuration..."
    
    # Backup PM2 dump
    pm2 dump "$backup_dir/pm2_dump_$timestamp.json"
    
    # Backup ecosystem config
    cp "$ECOSYSTEM_CONFIG" "$backup_dir/ecosystem_config_$timestamp.js"
    
    success "Configuration backed up to $backup_dir"
}

# Function to show service health
check_service_health() {
    local service="${1:-}"
    
    if [[ -n "$service" ]]; then
        validate_service "$service"
        services=("$service")
    else
        services=("${SERVICES[@]}")
    fi
    
    log "Checking service health..."
    
    for svc in "${services[@]}"; do
        if pm2 describe "$svc" >/dev/null 2>&1; then
            local status=$(pm2 jlist | jq -r ".[] | select(.name == \"$svc\") | .pm2_env.status")
            local restarts=$(pm2 jlist | jq -r ".[] | select(.name == \"$svc\") | .pm2_env.restart_time")
            local memory=$(pm2 jlist | jq -r ".[] | select(.name == \"$svc\") | .monit.memory")
            local cpu=$(pm2 jlist | jq -r ".[] | select(.name == \"$svc\") | .monit.cpu")
            
            echo "Service: $svc"
            echo "  Status: $status"
            echo "  Restarts: $restarts"
            echo "  Memory: $(($memory / 1024 / 1024))MB"
            echo "  CPU: $cpu%"
            echo ""
        else
            echo "Service: $svc - NOT RUNNING"
            echo ""
        fi
    done
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [COMMAND] [SERVICE] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  start <service> [env]     Start a specific service"
    echo "  stop <service>            Stop a specific service"
    echo "  restart <service> [env]   Restart a specific service"
    echo "  reload <service>          Reload service (zero-downtime)"
    echo "  delete <service>          Delete a specific service"
    echo "  status [service]          Show service status"
    echo "  logs [service] [lines]    Show service logs"
    echo "  monitor [service]         Monitor service metrics"
    echo "  scale <service> <count>   Scale service instances"
    echo "  env <service> <env>       Update service environment"
    echo "  reset <service> [env]     Reset service (delete and start fresh)"
    echo "  backup                    Backup PM2 configuration"
    echo "  health [service]          Check service health"
    echo ""
    echo "Available services: ${SERVICES[*]}"
    echo "Available environments: development, staging, production"
    echo ""
    echo "Examples:"
    echo "  $0 start cryb-api production"
    echo "  $0 restart cryb-web"
    echo "  $0 scale cryb-api 4"
    echo "  $0 logs cryb-workers 100"
    echo ""
}

# Main execution logic
main() {
    local command="${1:-}"
    local service="${2:-}"
    local option="${3:-}"
    
    case "$command" in
        "start")
            if [[ -z "$service" ]]; then
                error "Service name required"
                show_usage
                exit 1
            fi
            start_service "$service" "$option"
            ;;
        "stop")
            if [[ -z "$service" ]]; then
                error "Service name required"
                show_usage
                exit 1
            fi
            stop_service "$service"
            ;;
        "restart")
            if [[ -z "$service" ]]; then
                error "Service name required"
                show_usage
                exit 1
            fi
            restart_service "$service" "$option"
            ;;
        "reload")
            if [[ -z "$service" ]]; then
                error "Service name required"
                show_usage
                exit 1
            fi
            reload_service "$service"
            ;;
        "delete")
            if [[ -z "$service" ]]; then
                error "Service name required"
                show_usage
                exit 1
            fi
            delete_service "$service"
            ;;
        "status")
            show_service_status "$service"
            ;;
        "logs")
            show_service_logs "$service" "$option"
            ;;
        "monitor")
            monitor_service "$service"
            ;;
        "scale")
            if [[ -z "$service" ]] || [[ -z "$option" ]]; then
                error "Service name and instance count required"
                show_usage
                exit 1
            fi
            scale_service "$service" "$option"
            ;;
        "env")
            if [[ -z "$service" ]] || [[ -z "$option" ]]; then
                error "Service name and environment required"
                show_usage
                exit 1
            fi
            update_service_env "$service" "$option"
            ;;
        "reset")
            if [[ -z "$service" ]]; then
                error "Service name required"
                show_usage
                exit 1
            fi
            reset_service "$service" "$option"
            ;;
        "backup")
            backup_service_config
            ;;
        "health")
            check_service_health "$service"
            ;;
        *)
            show_usage
            exit 1
            ;;
    esac
}

# Check if jq is installed for health checks
if ! command -v jq >/dev/null 2>&1; then
    warning "jq is not installed. Health checks will be limited."
fi

# Run main function with all arguments
main "$@"