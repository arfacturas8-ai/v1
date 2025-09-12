#!/bin/bash

# ===================================================
# CRYB PLATFORM - PM2 STARTUP SCRIPT
# ===================================================
# Comprehensive PM2 startup script for 24/7 operation
# Handles environment setup, service management, and monitoring
# ===================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_ROOT/logs"
MONITORING_LOG_DIR="$LOG_DIR/monitoring"
ECOSYSTEM_CONFIG="$PROJECT_ROOT/ecosystem.config.js"
ENV_FILE="$PROJECT_ROOT/.env.production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS:${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to setup log directories
setup_log_directories() {
    log "Setting up log directories..."
    
    # Create main logs directory
    mkdir -p "$LOG_DIR"
    
    # Create monitoring logs directory
    mkdir -p "$MONITORING_LOG_DIR"
    
    # Set proper permissions
    chmod 755 "$LOG_DIR"
    chmod 755 "$MONITORING_LOG_DIR"
    
    success "Log directories created successfully"
}

# Function to check system requirements
check_requirements() {
    log "Checking system requirements..."
    
    # Check if PM2 is installed
    if ! command_exists pm2; then
        error "PM2 is not installed. Please install PM2 first:"
        echo "npm install -g pm2"
        exit 1
    fi
    
    # Check if Node.js is installed
    if ! command_exists node; then
        error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    # Check if npm is installed
    if ! command_exists npm; then
        error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    # Check if ecosystem config exists
    if [[ ! -f "$ECOSYSTEM_CONFIG" ]]; then
        error "Ecosystem config not found at: $ECOSYSTEM_CONFIG"
        exit 1
    fi
    
    # Check if environment file exists
    if [[ ! -f "$ENV_FILE" ]]; then
        warning "Production environment file not found at: $ENV_FILE"
        warning "Using default environment variables"
    fi
    
    success "System requirements check completed"
}

# Function to install dependencies
install_dependencies() {
    log "Installing dependencies..."
    
    cd "$PROJECT_ROOT"
    
    # Install root dependencies
    if [[ -f "package.json" ]]; then
        log "Installing root dependencies..."
        npm install --production
    fi
    
    # Install API dependencies
    if [[ -f "apps/api/package.json" ]]; then
        log "Installing API dependencies..."
        cd "$PROJECT_ROOT/apps/api"
        npm install --production
        npm run build 2>/dev/null || warning "API build failed or no build script"
    fi
    
    # Install Web dependencies
    if [[ -f "apps/web/package.json" ]]; then
        log "Installing Web dependencies..."
        cd "$PROJECT_ROOT/apps/web"
        npm install --production
        npm run build 2>/dev/null || warning "Web build failed or no build script"
    fi
    
    # Install Workers dependencies
    if [[ -f "services/workers/package.json" ]]; then
        log "Installing Workers dependencies..."
        cd "$PROJECT_ROOT/services/workers"
        npm install --production
        npm run build 2>/dev/null || warning "Workers build failed or no build script"
    fi
    
    cd "$PROJECT_ROOT"
    success "Dependencies installed successfully"
}

# Function to setup PM2 startup
setup_pm2_startup() {
    log "Setting up PM2 startup..."
    
    # Generate PM2 startup script
    pm2 startup
    
    # Save current PM2 processes
    pm2 save
    
    success "PM2 startup configured"
}

# Function to start services
start_services() {
    log "Starting CRYB platform services..."
    
    # Stop any existing PM2 processes
    pm2 delete all 2>/dev/null || true
    
    # Start services with ecosystem config
    pm2 start "$ECOSYSTEM_CONFIG" --env production
    
    # Save PM2 configuration
    pm2 save
    
    success "Services started successfully"
}

# Function to show service status
show_status() {
    log "Current service status:"
    pm2 status
    pm2 logs --lines 20
}

# Function to setup log rotation
setup_log_rotation() {
    log "Setting up log rotation..."
    
    # Install PM2 log rotate module
    pm2 install pm2-logrotate
    
    # Configure log rotation
    pm2 set pm2-logrotate:max_size 100M
    pm2 set pm2-logrotate:retain 30
    pm2 set pm2-logrotate:compress true
    pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
    pm2 set pm2-logrotate:rotateModule true
    pm2 set pm2-logrotate:workerInterval 30
    pm2 set pm2-logrotate:rotateInterval '0 0 * * *'  # Daily rotation
    
    success "Log rotation configured"
}

# Function to setup monitoring
setup_monitoring() {
    log "Setting up PM2 monitoring..."
    
    # Install PM2 monitoring modules
    pm2 install pm2-server-monit || warning "Failed to install pm2-server-monit"
    
    # Setup Keymetrics monitoring (optional)
    if [[ -n "${KEYMETRICS_SECRET:-}" ]]; then
        pm2 interact "$KEYMETRICS_SECRET" "$KEYMETRICS_PUBLIC"
    fi
    
    success "Monitoring setup completed"
}

# Function to create health check script
create_health_check() {
    log "Creating health check script..."
    
    cat > "$SCRIPT_DIR/pm2-health-check.sh" << 'EOF'
#!/bin/bash

# PM2 Health Check Script
# Monitors PM2 processes and restarts if needed

ECOSYSTEM_CONFIG="/home/ubuntu/cryb-platform/ecosystem.config.js"
LOG_FILE="/home/ubuntu/cryb-platform/logs/monitoring/health-checks.log"

# Function to log with timestamp
log_with_timestamp() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Check if PM2 daemon is running
if ! pgrep -f "PM2" > /dev/null; then
    log_with_timestamp "PM2 daemon not running. Starting..."
    pm2 resurrect
fi

# Check each service
SERVICES=("cryb-api" "cryb-web" "cryb-workers")

for service in "${SERVICES[@]}"; do
    if ! pm2 describe "$service" > /dev/null 2>&1; then
        log_with_timestamp "Service $service not running. Restarting..."
        pm2 start "$ECOSYSTEM_CONFIG" --only "$service" --env production
    else
        # Check if service is errored
        if pm2 describe "$service" | grep -q "errored"; then
            log_with_timestamp "Service $service in error state. Restarting..."
            pm2 restart "$service"
        fi
    fi
done

# Save PM2 configuration
pm2 save

log_with_timestamp "Health check completed"
EOF

    chmod +x "$SCRIPT_DIR/pm2-health-check.sh"
    
    success "Health check script created"
}

# Function to setup cron jobs
setup_cron_jobs() {
    log "Setting up cron jobs..."
    
    # Add cron job for health checks (every 5 minutes)
    (crontab -l 2>/dev/null; echo "*/5 * * * * $SCRIPT_DIR/pm2-health-check.sh") | crontab -
    
    # Add cron job for log cleanup (daily at 1 AM)
    (crontab -l 2>/dev/null; echo "0 1 * * * find $LOG_DIR -name '*.log' -mtime +7 -delete") | crontab -
    
    success "Cron jobs configured"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start       Start all services"
    echo "  stop        Stop all services"
    echo "  restart     Restart all services"
    echo "  status      Show service status"
    echo "  logs        Show service logs"
    echo "  setup       Complete setup (install dependencies, configure PM2)"
    echo "  health      Run health check"
    echo "  update      Update services"
    echo ""
}

# Main execution logic
main() {
    case "${1:-}" in
        "start")
            check_requirements
            setup_log_directories
            start_services
            show_status
            ;;
        "stop")
            log "Stopping all services..."
            pm2 stop all
            success "All services stopped"
            ;;
        "restart")
            log "Restarting all services..."
            pm2 restart all
            show_status
            ;;
        "status")
            show_status
            ;;
        "logs")
            pm2 logs
            ;;
        "setup")
            log "Starting complete CRYB platform setup..."
            check_requirements
            setup_log_directories
            install_dependencies
            setup_pm2_startup
            setup_log_rotation
            setup_monitoring
            create_health_check
            setup_cron_jobs
            start_services
            show_status
            success "CRYB platform setup completed successfully!"
            ;;
        "health")
            "$SCRIPT_DIR/pm2-health-check.sh"
            ;;
        "update")
            log "Updating services..."
            cd "$PROJECT_ROOT"
            git pull
            install_dependencies
            pm2 reload "$ECOSYSTEM_CONFIG" --env production
            show_status
            ;;
        *)
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"