#!/bin/bash

# CRYB Media Services Scaling Script
# Provides manual scaling controls for production services

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.media-production.yml"
COMPOSE_PROJECT="cryb-media"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Show usage
show_usage() {
    echo "Usage: $0 [COMMAND] [SERVICE] [REPLICAS]"
    echo ""
    echo "Commands:"
    echo "  status                    Show current service status and replica counts"
    echo "  scale SERVICE REPLICAS    Scale specific service to N replicas"
    echo "  scale-up SERVICE          Scale service up by 1 replica"
    echo "  scale-down SERVICE        Scale service down by 1 replica"
    echo "  scale-preset PRESET       Apply predefined scaling preset"
    echo "  auto-scale                Start automatic scaling based on metrics"
    echo ""
    echo "Available Services:"
    echo "  media-storage             Core media storage service"
    echo "  video-transcoding         Video processing service"
    echo "  image-optimizer           Image optimization service"
    echo "  upload-service            File upload handling service"
    echo "  security-scanner          Security scanning service"
    echo "  cdn-manager               CDN management service"
    echo "  media-analytics           Analytics and metrics service"
    echo "  responsive-delivery       Responsive media delivery service"
    echo "  media-workers             Background processing workers"
    echo ""
    echo "Available Presets:"
    echo "  light                     Minimal resource usage (development)"
    echo "  medium                    Moderate load (staging)"
    echo "  heavy                     High load (production)"
    echo "  max                       Maximum performance"
    echo ""
    echo "Examples:"
    echo "  $0 status"
    echo "  $0 scale media-storage 5"
    echo "  $0 scale-up image-optimizer"
    echo "  $0 scale-preset heavy"
}

# Get current service status
get_service_status() {
    log_info "Current service status:"
    echo ""
    
    services=(
        "media-storage"
        "video-transcoding"
        "image-optimizer"
        "upload-service"
        "security-scanner"
        "cdn-manager"
        "media-analytics"
        "responsive-delivery"
        "media-workers"
    )
    
    printf "%-20s %-10s %-15s %-10s\n" "SERVICE" "REPLICAS" "STATUS" "CPU/MEM"
    printf "%-20s %-10s %-15s %-10s\n" "-------" "--------" "------" "-------"
    
    for service in "${services[@]}"; do
        if docker-compose -f "$COMPOSE_FILE" ps -q "$service" &>/dev/null; then
            replicas=$(docker-compose -f "$COMPOSE_FILE" ps "$service" 2>/dev/null | grep -c "$service" || echo "0")
            status=$(docker-compose -f "$COMPOSE_FILE" ps "$service" 2>/dev/null | tail -n +3 | head -1 | awk '{print $4}' || echo "Down")
            
            # Get resource usage
            if [[ $replicas -gt 0 ]]; then
                cpu_mem=$(docker stats --no-stream --format "{{.CPUPerc}}/{{.MemUsage}}" $(docker-compose -f "$COMPOSE_FILE" ps -q "$service" | head -1) 2>/dev/null || echo "N/A")
            else
                cpu_mem="N/A"
            fi
            
            printf "%-20s %-10s %-15s %-10s\n" "$service" "$replicas" "$status" "$cpu_mem"
        else
            printf "%-20s %-10s %-15s %-10s\n" "$service" "0" "Not deployed" "N/A"
        fi
    done
    echo ""
}

# Scale a specific service
scale_service() {
    local service=$1
    local replicas=$2
    
    if [[ ! "$replicas" =~ ^[0-9]+$ ]] || [[ $replicas -lt 0 ]] || [[ $replicas -gt 20 ]]; then
        log_error "Invalid replica count. Must be between 0 and 20."
        exit 1
    fi
    
    log_info "Scaling $service to $replicas replicas..."
    
    if docker-compose -f "$COMPOSE_FILE" scale "$service=$replicas"; then
        log_success "Successfully scaled $service to $replicas replicas"
        
        # Wait a moment and show status
        sleep 5
        log_info "New status for $service:"
        docker-compose -f "$COMPOSE_FILE" ps "$service"
    else
        log_error "Failed to scale $service"
        exit 1
    fi
}

# Scale up a service by 1
scale_up_service() {
    local service=$1
    local current_replicas
    
    current_replicas=$(docker-compose -f "$COMPOSE_FILE" ps "$service" 2>/dev/null | grep -c "$service" || echo "0")
    local new_replicas=$((current_replicas + 1))
    
    if [[ $new_replicas -gt 20 ]]; then
        log_error "Cannot scale beyond 20 replicas"
        exit 1
    fi
    
    scale_service "$service" "$new_replicas"
}

# Scale down a service by 1
scale_down_service() {
    local service=$1
    local current_replicas
    
    current_replicas=$(docker-compose -f "$COMPOSE_FILE" ps "$service" 2>/dev/null | grep -c "$service" || echo "0")
    local new_replicas=$((current_replicas - 1))
    
    if [[ $new_replicas -lt 0 ]]; then
        log_error "Cannot scale below 0 replicas"
        exit 1
    fi
    
    scale_service "$service" "$new_replicas"
}

# Apply scaling preset
apply_preset() {
    local preset=$1
    
    log_info "Applying $preset scaling preset..."
    
    case $preset in
        "light")
            # Minimal resources for development
            scale_service "media-storage" 1
            scale_service "video-transcoding" 1
            scale_service "image-optimizer" 2
            scale_service "upload-service" 1
            scale_service "security-scanner" 1
            scale_service "cdn-manager" 1
            scale_service "media-analytics" 1
            scale_service "responsive-delivery" 1
            scale_service "media-workers" 2
            ;;
        "medium")
            # Moderate load for staging
            scale_service "media-storage" 2
            scale_service "video-transcoding" 1
            scale_service "image-optimizer" 3
            scale_service "upload-service" 2
            scale_service "security-scanner" 1
            scale_service "cdn-manager" 1
            scale_service "media-analytics" 1
            scale_service "responsive-delivery" 2
            scale_service "media-workers" 3
            ;;
        "heavy")
            # High load for production
            scale_service "media-storage" 3
            scale_service "video-transcoding" 2
            scale_service "image-optimizer" 4
            scale_service "upload-service" 3
            scale_service "security-scanner" 2
            scale_service "cdn-manager" 2
            scale_service "media-analytics" 2
            scale_service "responsive-delivery" 3
            scale_service "media-workers" 4
            ;;
        "max")
            # Maximum performance
            scale_service "media-storage" 5
            scale_service "video-transcoding" 3
            scale_service "image-optimizer" 6
            scale_service "upload-service" 4
            scale_service "security-scanner" 3
            scale_service "cdn-manager" 2
            scale_service "media-analytics" 3
            scale_service "responsive-delivery" 4
            scale_service "media-workers" 6
            ;;
        *)
            log_error "Unknown preset: $preset"
            log_info "Available presets: light, medium, heavy, max"
            exit 1
            ;;
    esac
    
    log_success "Applied $preset preset successfully"
}

# Auto-scaling based on metrics
auto_scale() {
    log_info "Starting intelligent auto-scaling..."
    
    # Check if monitoring is available
    if ! curl -s http://localhost:9090/api/v1/query &>/dev/null; then
        log_error "Prometheus is not accessible. Auto-scaling requires monitoring."
        exit 1
    fi
    
    log_info "Monitoring metrics and adjusting scales..."
    
    while true; do
        # Get CPU metrics for each service
        services=(
            "media-storage:75"
            "image-optimizer:80"
            "upload-service:70"
            "responsive-delivery:75"
            "media-workers:85"
        )
        
        for service_config in "${services[@]}"; do
            IFS=':' read -r service threshold <<< "$service_config"
            
            # Query Prometheus for CPU usage
            cpu_query="avg(rate(container_cpu_usage_seconds_total{name=~\".*${service}.*\"}[5m])) * 100"
            cpu_usage=$(curl -s "http://localhost:9090/api/v1/query?query=${cpu_query}" | \
                       jq -r '.data.result[0].value[1] // "0"' 2>/dev/null || echo "0")
            
            cpu_usage_int=$(echo "$cpu_usage" | cut -d'.' -f1)
            
            current_replicas=$(docker-compose -f "$COMPOSE_FILE" ps "$service" 2>/dev/null | grep -c "$service" || echo "1")
            
            if [[ $cpu_usage_int -gt $threshold ]] && [[ $current_replicas -lt 10 ]]; then
                new_replicas=$((current_replicas + 1))
                log_info "High CPU ($cpu_usage_int%) detected for $service. Scaling up to $new_replicas"
                scale_service "$service" "$new_replicas"
            elif [[ $cpu_usage_int -lt 30 ]] && [[ $current_replicas -gt 1 ]]; then
                new_replicas=$((current_replicas - 1))
                log_info "Low CPU ($cpu_usage_int%) detected for $service. Scaling down to $new_replicas"
                scale_service "$service" "$new_replicas"
            fi
        done
        
        log_info "Auto-scaling check completed. Next check in 5 minutes..."
        sleep 300  # Wait 5 minutes
    done
}

# Validate service name
validate_service() {
    local service=$1
    local valid_services=(
        "media-storage"
        "video-transcoding"
        "image-optimizer"
        "upload-service"
        "security-scanner"
        "cdn-manager"
        "media-analytics"
        "responsive-delivery"
        "media-workers"
    )
    
    for valid_service in "${valid_services[@]}"; do
        if [[ "$service" == "$valid_service" ]]; then
            return 0
        fi
    done
    
    log_error "Invalid service: $service"
    log_info "Valid services: ${valid_services[*]}"
    exit 1
}

# Main execution
main() {
    if [[ $# -eq 0 ]]; then
        show_usage
        exit 1
    fi
    
    local command=$1
    
    case $command in
        "status")
            get_service_status
            ;;
        "scale")
            if [[ $# -ne 3 ]]; then
                log_error "Scale command requires service name and replica count"
                show_usage
                exit 1
            fi
            validate_service "$2"
            scale_service "$2" "$3"
            ;;
        "scale-up")
            if [[ $# -ne 2 ]]; then
                log_error "Scale-up command requires service name"
                show_usage
                exit 1
            fi
            validate_service "$2"
            scale_up_service "$2"
            ;;
        "scale-down")
            if [[ $# -ne 2 ]]; then
                log_error "Scale-down command requires service name"
                show_usage
                exit 1
            fi
            validate_service "$2"
            scale_down_service "$2"
            ;;
        "scale-preset")
            if [[ $# -ne 2 ]]; then
                log_error "Scale-preset command requires preset name"
                show_usage
                exit 1
            fi
            apply_preset "$2"
            ;;
        "auto-scale")
            auto_scale
            ;;
        *)
            log_error "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
}

# Check if Docker Compose file exists
if [[ ! -f "$COMPOSE_FILE" ]]; then
    log_error "Docker Compose file not found: $COMPOSE_FILE"
    log_info "Please run this script from the project root directory"
    exit 1
fi

# Execute main function
main "$@"