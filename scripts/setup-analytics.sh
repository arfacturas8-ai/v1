#!/bin/bash

# ==============================================
# CRYB PLATFORM ANALYTICS SETUP SCRIPT
# ==============================================
# Initializes TimescaleDB views and analytics infrastructure
# ==============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DATABASE_URL="${DATABASE_URL:-postgresql://cryb_user:cryb_password@localhost:5432/cryb_platform}"

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

check_dependencies() {
    log_info "Checking dependencies..."
    
    # Check if PostgreSQL client is available
    if ! command -v psql &> /dev/null; then
        log_error "PostgreSQL client (psql) is not installed"
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info &> /dev/null; then
        log_error "Docker is not running"
        exit 1
    fi
    
    # Check if Docker Compose is available
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    log_success "All dependencies are available"
}

setup_timescaledb() {
    log_info "Setting up TimescaleDB extensions and views..."
    
    # Execute the TimescaleDB analytics views script
    if psql "$DATABASE_URL" -f "$SCRIPT_DIR/timescale-analytics-views.sql"; then
        log_success "TimescaleDB analytics views created successfully"
    else
        log_error "Failed to create TimescaleDB analytics views"
        exit 1
    fi
}

setup_grafana_dashboards() {
    log_info "Setting up Grafana dashboards..."
    
    # Wait for Grafana to be ready
    log_info "Waiting for Grafana to be ready..."
    until curl -sf http://localhost:3000/api/health > /dev/null 2>&1; do
        sleep 2
    done
    
    # Import dashboards
    GRAFANA_URL="http://admin:admin@localhost:3000"
    DASHBOARD_DIR="$PROJECT_ROOT/config/grafana/dashboards"
    
    for dashboard_file in "$DASHBOARD_DIR"/*.json; do
        if [ -f "$dashboard_file" ]; then
            dashboard_name=$(basename "$dashboard_file" .json)
            log_info "Importing dashboard: $dashboard_name"
            
            if curl -X POST \
                -H "Content-Type: application/json" \
                -d @"$dashboard_file" \
                "$GRAFANA_URL/api/dashboards/db" > /dev/null 2>&1; then
                log_success "Dashboard imported: $dashboard_name"
            else
                log_warning "Failed to import dashboard: $dashboard_name"
            fi
        fi
    done
}

setup_prometheus_alerts() {
    log_info "Setting up Prometheus alert rules..."
    
    # Check if Prometheus is running
    if ! curl -sf http://localhost:9090/-/healthy > /dev/null 2>&1; then
        log_warning "Prometheus is not running, skipping alert setup"
        return 0
    fi
    
    # Reload Prometheus configuration
    if curl -X POST http://localhost:9090/-/reload > /dev/null 2>&1; then
        log_success "Prometheus configuration reloaded"
    else
        log_warning "Failed to reload Prometheus configuration"
    fi
}

create_analytics_cron_jobs() {
    log_info "Setting up analytics cron jobs..."
    
    # Create cron job for refreshing materialized views
    (crontab -l 2>/dev/null; echo "*/30 * * * * psql '$DATABASE_URL' -c 'REFRESH MATERIALIZED VIEW user_activity_summary; REFRESH MATERIALIZED VIEW content_summary;'") | crontab -
    
    # Create cron job for cleaning old logs
    (crontab -l 2>/dev/null; echo "0 2 * * * find /var/log/cryb -name '*.log' -mtime +30 -delete") | crontab -
    
    log_success "Analytics cron jobs created"
}

create_analytics_api_user() {
    log_info "Creating analytics API user..."
    
    # Create a dedicated user for analytics API access
    psql "$DATABASE_URL" -c "
        DO \$\$
        BEGIN
            IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'analytics_user') THEN
                CREATE ROLE analytics_user LOGIN PASSWORD 'analytics_secure_password';
                GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_user;
                GRANT SELECT ON ALL MATERIALIZED VIEWS IN SCHEMA public TO analytics_user;
                GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO analytics_user;
                ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO analytics_user;
            END IF;
        END
        \$\$;
    " > /dev/null 2>&1
    
    log_success "Analytics API user created"
}

verify_setup() {
    log_info "Verifying analytics setup..."
    
    # Check if TimescaleDB views exist
    view_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public' AND table_name LIKE '%analytics%' OR table_name LIKE '%metrics%';" | xargs)
    
    if [ "$view_count" -gt 0 ]; then
        log_success "TimescaleDB analytics views: $view_count found"
    else
        log_warning "No TimescaleDB analytics views found"
    fi
    
    # Check if Grafana dashboards are accessible
    if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
        log_success "Grafana is accessible"
    else
        log_warning "Grafana is not accessible"
    fi
    
    # Check if Prometheus is accessible
    if curl -sf http://localhost:9090/-/healthy > /dev/null 2>&1; then
        log_success "Prometheus is accessible"
    else
        log_warning "Prometheus is not accessible"
    fi
    
    # Check if Loki is accessible
    if curl -sf http://localhost:3100/ready > /dev/null 2>&1; then
        log_success "Loki is accessible"
    else
        log_warning "Loki is not accessible"
    fi
}

print_summary() {
    echo
    echo "========================================="
    echo "    CRYB Analytics Setup Complete"
    echo "========================================="
    echo
    echo "🚀 Services Available:"
    echo "   • Grafana:    http://localhost:3000"
    echo "   • Prometheus: http://localhost:9090"
    echo "   • Loki:       http://localhost:3100"
    echo
    echo "📊 Dashboards Created:"
    echo "   • Platform Overview"
    echo "   • Business Analytics"
    echo "   • Real-time Monitoring"
    echo "   • Operations Dashboard"
    echo
    echo "🔔 Alert Rules:"
    echo "   • Infrastructure alerts"
    echo "   • Application performance alerts"
    echo "   • Business metric alerts"
    echo "   • Security alerts"
    echo
    echo "📈 Analytics Features:"
    echo "   • TimescaleDB time-series views"
    echo "   • Real-time metrics collection"
    echo "   • Log aggregation and analysis"
    echo "   • Admin analytics API endpoints"
    echo
    echo "🔧 Maintenance:"
    echo "   • Automated materialized view refresh"
    echo "   • Log rotation and cleanup"
    echo "   • Health monitoring"
    echo
    echo "Default Credentials:"
    echo "   • Grafana: admin/admin"
    echo
    echo "For troubleshooting, check:"
    echo "   • Docker logs: docker-compose logs -f"
    echo "   • Analytics logs: /var/log/cryb/"
    echo
}

# Main execution
main() {
    echo "========================================="
    echo "   CRYB Platform Analytics Setup"
    echo "========================================="
    echo
    
    check_dependencies
    
    log_info "Starting analytics infrastructure setup..."
    
    # Setup components
    setup_timescaledb
    create_analytics_api_user
    setup_grafana_dashboards
    setup_prometheus_alerts
    create_analytics_cron_jobs
    
    # Verify everything is working
    verify_setup
    
    # Print summary
    print_summary
    
    log_success "Analytics setup completed successfully!"
}

# Run main function
main "$@"