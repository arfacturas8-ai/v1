#!/bin/bash
# CRYB Platform Rollback Script
# Provides safe rollback procedures for production deployment

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PLATFORM_DIR="/home/ubuntu/cryb-platform"
BACKUP_DIR="$PLATFORM_DIR/backups"
ROLLBACK_DIR="$PLATFORM_DIR/rollback"

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

usage() {
    echo "CRYB Platform Rollback Script"
    echo
    echo "Usage: $0 [OPTION]"
    echo
    echo "Options:"
    echo "  --database-only     Rollback database only"
    echo "  --application-only  Rollback application only"
    echo "  --full              Full system rollback"
    echo "  --list-backups      List available backups"
    echo "  --help              Show this help message"
    echo
    echo "Examples:"
    echo "  $0 --list-backups"
    echo "  $0 --database-only"
    echo "  $0 --full"
    exit 0
}

# List available backups
list_backups() {
    echo "=================================="
    echo "Available Database Backups:"
    echo "=================================="
    if [ -d "$BACKUP_DIR/database" ]; then
        ls -la "$BACKUP_DIR/database"/*.gz 2>/dev/null | tail -10 || echo "No database backups found"
    else
        echo "No database backup directory found"
    fi
    
    echo
    echo "=================================="
    echo "Available File Backups:"
    echo "=================================="
    if [ -d "$BACKUP_DIR/files" ]; then
        ls -la "$BACKUP_DIR/files"/*.tar.gz 2>/dev/null | tail -10 || echo "No file backups found"
    else
        echo "No file backup directory found"
    fi
    
    echo
    echo "=================================="
    echo "Git Commits (last 10):"
    echo "=================================="
    cd "$PLATFORM_DIR"
    git log --oneline -n 10 2>/dev/null || echo "No git history available"
}

# Create rollback point before making changes
create_rollback_point() {
    local rollback_name="rollback_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$ROLLBACK_DIR/$rollback_name"
    
    log "Creating rollback point: $rollback_name"
    
    # Backup current PM2 configuration
    if command -v pm2 &> /dev/null; then
        pm2 save --force > "$ROLLBACK_DIR/$rollback_name/pm2_dump.json" 2>/dev/null || true
    fi
    
    # Backup current environment
    cp "$PLATFORM_DIR/.env.production" "$ROLLBACK_DIR/$rollback_name/" 2>/dev/null || true
    cp "$PLATFORM_DIR/ecosystem.config.js" "$ROLLBACK_DIR/$rollback_name/" 2>/dev/null || true
    
    # Backup current git state
    cd "$PLATFORM_DIR"
    git rev-parse HEAD > "$ROLLBACK_DIR/$rollback_name/git_commit.txt" 2>/dev/null || echo "unknown" > "$ROLLBACK_DIR/$rollback_name/git_commit.txt"
    
    # Record current service states
    systemctl is-active nginx > "$ROLLBACK_DIR/$rollback_name/nginx_status.txt" 2>/dev/null || echo "unknown" > "$ROLLBACK_DIR/$rollback_name/nginx_status.txt"
    pm2 list > "$ROLLBACK_DIR/$rollback_name/pm2_status.txt" 2>/dev/null || echo "unknown" > "$ROLLBACK_DIR/$rollback_name/pm2_status.txt"
    docker ps > "$ROLLBACK_DIR/$rollback_name/docker_status.txt" 2>/dev/null || echo "unknown" > "$ROLLBACK_DIR/$rollback_name/docker_status.txt"
    
    success "Rollback point created: $rollback_name"
    echo "$rollback_name"
}

# Database rollback function
rollback_database() {
    log "Starting database rollback..."
    
    # List available database backups
    echo "Available database backups:"
    ls -la "$BACKUP_DIR/database"/*.gz 2>/dev/null | tail -5 || {
        error "No database backups found"
        return 1
    }
    
    echo
    read -p "Enter the backup filename to restore (without path): " backup_file
    
    if [ ! -f "$BACKUP_DIR/database/$backup_file" ]; then
        error "Backup file not found: $backup_file"
        return 1
    fi
    
    # Confirm rollback
    warning "This will overwrite the current database!"
    read -p "Are you sure you want to proceed? (y/N): " confirm
    if [ "$confirm" != "y" ]; then
        log "Database rollback cancelled"
        return 0
    fi
    
    # Create current backup before rollback
    log "Creating backup of current database before rollback..."
    "$BACKUP_DIR/scripts/backup-database.sh" || warning "Failed to create pre-rollback backup"
    
    # Stop application services
    log "Stopping application services..."
    pm2 stop all || true
    
    # Restore database
    log "Restoring database from: $backup_file"
    if "$BACKUP_DIR/scripts/restore-database.sh" "$backup_file"; then
        success "Database rollback completed successfully"
        
        # Restart services
        log "Restarting application services..."
        pm2 start ecosystem.config.js --env production
        
        # Wait for services to be ready
        sleep 10
        
        # Verify services
        if pm2 list | grep -q online; then
            success "Services restarted successfully"
        else
            error "Services failed to restart - check PM2 logs"
        fi
    else
        error "Database rollback failed"
        return 1
    fi
}

# Application rollback function
rollback_application() {
    log "Starting application rollback..."
    
    cd "$PLATFORM_DIR"
    
    # Show recent commits
    echo "Recent git commits:"
    git log --oneline -n 10 2>/dev/null || {
        error "No git history available"
        return 1
    }
    
    echo
    read -p "Enter the commit hash to rollback to: " commit_hash
    
    if ! git rev-parse --verify "$commit_hash" &>/dev/null; then
        error "Invalid commit hash: $commit_hash"
        return 1
    fi
    
    # Confirm rollback
    warning "This will reset the application code to commit $commit_hash"
    read -p "Are you sure you want to proceed? (y/N): " confirm
    if [ "$confirm" != "y" ]; then
        log "Application rollback cancelled"
        return 0
    fi
    
    # Stop services
    log "Stopping application services..."
    pm2 stop all || true
    
    # Reset to specified commit
    log "Rolling back to commit: $commit_hash"
    git reset --hard "$commit_hash"
    
    # Rebuild applications
    log "Rebuilding applications..."
    
    # Build API
    if [ -d "apps/api" ]; then
        cd "apps/api"
        npm install --production=false
        npm run build || warning "API build failed"
        cd "$PLATFORM_DIR"
    fi
    
    # Build Web
    if [ -d "apps/web" ]; then
        cd "apps/web"
        npm install --production=false
        npm run build || warning "Web build failed"
        cd "$PLATFORM_DIR"
    fi
    
    # Restart services
    log "Restarting application services..."
    pm2 start ecosystem.config.js --env production
    
    # Wait for services
    sleep 15
    
    # Verify services
    if pm2 list | grep -q online; then
        success "Application rollback completed successfully"
    else
        error "Services failed to restart after rollback"
        return 1
    fi
}

# Full system rollback
rollback_full() {
    log "Starting full system rollback..."
    
    warning "This will rollback both database and application!"
    read -p "Are you sure you want to proceed? (y/N): " confirm
    if [ "$confirm" != "y" ]; then
        log "Full rollback cancelled"
        return 0
    fi
    
    # Create rollback point
    rollback_point=$(create_rollback_point)
    
    # Rollback application first
    if rollback_application; then
        log "Application rollback completed"
    else
        error "Application rollback failed - aborting full rollback"
        return 1
    fi
    
    # Then rollback database
    if rollback_database; then
        log "Database rollback completed"
    else
        error "Database rollback failed"
        return 1
    fi
    
    success "Full system rollback completed successfully"
}

# Emergency recovery function
emergency_recovery() {
    log "🚨 Starting emergency recovery..."
    
    # Stop all services
    log "Stopping all services..."
    pm2 stop all || true
    pm2 delete all || true
    sudo systemctl stop nginx || true
    
    # Start only essential Docker services
    log "Starting essential Docker services..."
    cd "$PLATFORM_DIR"
    docker-compose -f docker-compose.production.yml up -d postgres redis
    
    # Wait for database
    sleep 30
    
    # Check if we have any recent backup
    latest_backup=$(ls -t "$BACKUP_DIR/database"/*.gz 2>/dev/null | head -1 || echo "")
    
    if [ -n "$latest_backup" ]; then
        log "Found recent backup: $(basename "$latest_backup")"
        read -p "Restore from this backup? (y/N): " restore_confirm
        
        if [ "$restore_confirm" = "y" ]; then
            "$BACKUP_DIR/scripts/restore-database.sh" "$(basename "$latest_backup")"
        fi
    else
        warning "No database backups found - manual recovery may be required"
    fi
    
    # Try to start basic services
    log "Attempting to start basic services..."
    pm2 start ecosystem.config.js --env production || warning "PM2 start failed"
    sudo systemctl start nginx || warning "Nginx start failed"
    
    log "Emergency recovery completed - check service status manually"
}

# Health check after rollback
post_rollback_check() {
    log "Running post-rollback health checks..."
    
    # Check database connectivity
    if docker exec cryb-postgres-optimized pg_isready -U postgres >/dev/null 2>&1; then
        success "✓ Database is responding"
    else
        error "✗ Database is not responding"
    fi
    
    # Check application services
    if pm2 list | grep -q online; then
        success "✓ Application services are running"
    else
        error "✗ Application services are not running"
    fi
    
    # Check web accessibility
    if curl -s http://localhost:3003 >/dev/null; then
        success "✓ Web frontend is accessible"
    else
        error "✗ Web frontend is not accessible"
    fi
    
    # Check API accessibility
    if curl -s http://localhost:3001/health >/dev/null; then
        success "✓ API is accessible"
    else
        error "✗ API is not accessible"
    fi
    
    log "Health check completed"
}

# Main script logic
main() {
    case "${1:-}" in
        --database-only)
            create_rollback_point
            rollback_database
            post_rollback_check
            ;;
        --application-only)
            create_rollback_point
            rollback_application
            post_rollback_check
            ;;
        --full)
            rollback_full
            post_rollback_check
            ;;
        --list-backups)
            list_backups
            ;;
        --emergency)
            emergency_recovery
            ;;
        --help|*)
            usage
            ;;
    esac
}

# Script entry point
if [ $# -eq 0 ]; then
    usage
fi

log "🔄 CRYB Platform Rollback Script"
main "$@"