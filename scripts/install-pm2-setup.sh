#!/bin/bash

# ===================================================
# CRYB PLATFORM - PM2 SETUP INSTALLER
# ===================================================
# One-command setup for PM2 configuration and 24/7 operation
# Installs PM2, configures services, sets up monitoring
# ===================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SYSTEMD_DIR="/etc/systemd/system"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log() { echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
error() { echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" >&2; }
success() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS:${NC} $1"; }
warning() { echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"; }

# Function to check if running as root for systemd operations
check_sudo_access() {
    if ! sudo -n true 2>/dev/null; then
        warning "Some operations require sudo access"
        echo "You may be prompted for your password"
    fi
}

# Function to install PM2 if not present
install_pm2() {
    log "Checking PM2 installation..."
    
    if ! command -v pm2 >/dev/null 2>&1; then
        log "Installing PM2..."
        npm install -g pm2
        success "PM2 installed successfully"
    else
        local pm2_version=$(pm2 --version)
        log "PM2 is already installed (version: $pm2_version)"
    fi
}

# Function to install required system packages
install_system_packages() {
    log "Installing required system packages..."
    
    local packages=("jq" "bc" "curl")
    local to_install=()
    
    for package in "${packages[@]}"; do
        if ! command -v "$package" >/dev/null 2>&1; then
            to_install+=("$package")
        fi
    done
    
    if [[ ${#to_install[@]} -gt 0 ]]; then
        log "Installing packages: ${to_install[*]}"
        sudo apt-get update
        sudo apt-get install -y "${to_install[@]}"
        success "System packages installed"
    else
        log "All required system packages are already installed"
    fi
}

# Function to setup systemd service
setup_systemd_service() {
    log "Setting up systemd service..."
    
    check_sudo_access
    
    # Copy service file to systemd directory
    sudo cp "$PROJECT_ROOT/systemd/cryb-platform.service" "$SYSTEMD_DIR/"
    
    # Reload systemd and enable service
    sudo systemctl daemon-reload
    sudo systemctl enable cryb-platform.service
    
    success "Systemd service configured"
}

# Function to setup PM2 startup
setup_pm2_startup() {
    log "Configuring PM2 startup..."
    
    # Generate and install PM2 startup script
    pm2 startup | grep -E "^sudo" | bash || true
    
    # Start services
    pm2 start "$PROJECT_ROOT/ecosystem.config.js" --env production
    
    # Save PM2 configuration
    pm2 save
    
    success "PM2 startup configured"
}

# Function to setup log rotation
setup_log_rotation() {
    log "Setting up log rotation..."
    
    # Install PM2 log rotate module
    pm2 install pm2-logrotate
    
    # Configure log rotation settings
    pm2 set pm2-logrotate:max_size 100M
    pm2 set pm2-logrotate:retain 30
    pm2 set pm2-logrotate:compress true
    pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
    pm2 set pm2-logrotate:rotateModule true
    pm2 set pm2-logrotate:workerInterval 30
    pm2 set pm2-logrotate:rotateInterval '0 0 * * *'
    
    success "Log rotation configured"
}

# Function to setup monitoring cron jobs
setup_monitoring_cron() {
    log "Setting up monitoring cron jobs..."
    
    # Create monitoring cron job (every 5 minutes)
    local cron_job="*/5 * * * * $PROJECT_ROOT/scripts/pm2-monitor.sh monitor >> $PROJECT_ROOT/logs/monitoring/cron-monitor.log 2>&1"
    
    # Add to crontab if not already present
    if ! crontab -l 2>/dev/null | grep -q "pm2-monitor.sh"; then
        (crontab -l 2>/dev/null; echo "$cron_job") | crontab -
        success "Monitoring cron job added"
    else
        log "Monitoring cron job already exists"
    fi
    
    # Create log cleanup cron job (daily at 2 AM)
    local cleanup_job="0 2 * * * find $PROJECT_ROOT/logs -name '*.log' -mtime +7 -delete"
    
    if ! crontab -l 2>/dev/null | grep -q "find.*logs.*-delete"; then
        (crontab -l 2>/dev/null; echo "$cleanup_job") | crontab -
        success "Log cleanup cron job added"
    else
        log "Log cleanup cron job already exists"
    fi
}

# Function to create aliases for easy management
create_aliases() {
    log "Creating command aliases..."
    
    local alias_file="$HOME/.bash_aliases"
    
    # Create aliases if they don't exist
    if ! grep -q "cryb-pm2" "$alias_file" 2>/dev/null; then
        cat >> "$alias_file" << 'EOF'

# CRYB Platform PM2 Management Aliases
alias cryb-pm2='cd /home/ubuntu/cryb-platform && pm2'
alias cryb-start='/home/ubuntu/cryb-platform/scripts/pm2-startup.sh start'
alias cryb-stop='/home/ubuntu/cryb-platform/scripts/pm2-startup.sh stop'
alias cryb-restart='/home/ubuntu/cryb-platform/scripts/pm2-startup.sh restart'
alias cryb-status='/home/ubuntu/cryb-platform/scripts/pm2-startup.sh status'
alias cryb-logs='/home/ubuntu/cryb-platform/scripts/pm2-startup.sh logs'
alias cryb-monitor='/home/ubuntu/cryb-platform/scripts/pm2-monitor.sh monitor'
alias cryb-health='/home/ubuntu/cryb-platform/scripts/pm2-monitor.sh report'
alias cryb-service='/home/ubuntu/cryb-platform/scripts/pm2-service-manager.sh'

EOF
        
        success "Aliases created in $alias_file"
        log "Run 'source ~/.bash_aliases' or restart your shell to use the aliases"
    else
        log "Aliases already exist"
    fi
}

# Function to perform initial health check
perform_health_check() {
    log "Performing initial health check..."
    
    sleep 10  # Wait for services to start
    
    # Run health check
    "$PROJECT_ROOT/scripts/pm2-monitor.sh" monitor
    
    # Show status
    pm2 status
    
    success "Initial health check completed"
}

# Function to display post-installation information
show_post_install_info() {
    echo ""
    success "CRYB Platform PM2 setup completed successfully!"
    echo ""
    echo "Available Commands:"
    echo "  cryb-start     - Start all services"
    echo "  cryb-stop      - Stop all services"  
    echo "  cryb-restart   - Restart all services"
    echo "  cryb-status    - Show service status"
    echo "  cryb-logs      - Show service logs"
    echo "  cryb-monitor   - Run health check"
    echo "  cryb-health    - Generate health report"
    echo "  cryb-service   - Manage individual services"
    echo ""
    echo "Services Status:"
    pm2 status
    echo ""
    echo "Log Locations:"
    echo "  Application Logs: $PROJECT_ROOT/logs/"
    echo "  Monitoring Logs:  $PROJECT_ROOT/logs/monitoring/"
    echo "  PM2 Logs:         ~/.pm2/logs/"
    echo ""
    echo "Configuration Files:"
    echo "  PM2 Ecosystem:    $PROJECT_ROOT/ecosystem.config.js"
    echo "  Environment:      $PROJECT_ROOT/.env.production"
    echo "  Systemd Service:  /etc/systemd/system/cryb-platform.service"
    echo ""
    echo "Next Steps:"
    echo "1. Review and update environment variables in .env.production"
    echo "2. Configure monitoring webhooks for alerts"
    echo "3. Set up external monitoring (optional)"
    echo "4. Test service auto-restart with: sudo systemctl restart cryb-platform"
    echo ""
    warning "Remember to:"
    warning "- Change default passwords in .env.production"
    warning "- Configure SSL certificates for production"
    warning "- Set up proper firewall rules"
    warning "- Configure backup and monitoring systems"
    echo ""
}

# Function to validate installation
validate_installation() {
    log "Validating installation..."
    
    local errors=()
    
    # Check PM2 installation
    if ! command -v pm2 >/dev/null 2>&1; then
        errors+=("PM2 not installed")
    fi
    
    # Check ecosystem config
    if [[ ! -f "$PROJECT_ROOT/ecosystem.config.js" ]]; then
        errors+=("Ecosystem config missing")
    fi
    
    # Check scripts
    local scripts=("pm2-startup.sh" "pm2-service-manager.sh" "pm2-monitor.sh")
    for script in "${scripts[@]}"; do
        if [[ ! -x "$PROJECT_ROOT/scripts/$script" ]]; then
            errors+=("Script $script not executable")
        fi
    done
    
    # Check systemd service
    if [[ ! -f "$SYSTEMD_DIR/cryb-platform.service" ]]; then
        errors+=("Systemd service not installed")
    fi
    
    if [[ ${#errors[@]} -gt 0 ]]; then
        error "Installation validation failed:"
        for err in "${errors[@]}"; do
            error "  - $err"
        done
        return 1
    fi
    
    success "Installation validation passed"
    return 0
}

# Main installation function
main() {
    local skip_systemd=false
    local skip_startup=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-systemd)
                skip_systemd=true
                shift
                ;;
            --skip-startup)
                skip_startup=true
                shift
                ;;
            --help|-h)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --skip-systemd    Skip systemd service setup"
                echo "  --skip-startup    Skip PM2 startup configuration"
                echo "  --help, -h        Show this help message"
                echo ""
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    log "Starting CRYB Platform PM2 setup installation..."
    
    # Run installation steps
    install_system_packages
    install_pm2
    
    if [[ "$skip_systemd" == false ]]; then
        setup_systemd_service
    fi
    
    if [[ "$skip_startup" == false ]]; then
        setup_pm2_startup
    fi
    
    setup_log_rotation
    setup_monitoring_cron
    create_aliases
    
    # Validate installation
    if validate_installation; then
        perform_health_check
        show_post_install_info
    else
        error "Installation completed with errors. Please review the output above."
        exit 1
    fi
}

# Check if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi