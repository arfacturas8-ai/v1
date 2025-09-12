#!/bin/bash

# ==============================================
# CRYB PLATFORM - SSL CERTIFICATE SETUP
# ==============================================
# Automated SSL certificate management with Let's Encrypt
# Features:
# - Initial certificate generation
# - Automatic renewal
# - Multiple domain support
# - Nginx integration
# - Security validation
# ==============================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAINS=(
    "cryb.ai"
    "www.cryb.ai"
    "api.cryb.ai"
    "livekit.cryb.ai"
    "monitoring.cryb.ai"
    "storage.cryb.ai"
)
EMAIL="admin@cryb.ai"
CERTBOT_CONTAINER="certbot"
NGINX_CONTAINER="cryb-nginx-production"
SSL_DIR="/home/ubuntu/cryb-platform/config/nginx/ssl"
WEBROOT_DIR="/home/ubuntu/cryb-platform/config/nginx/webroot"

# Logging
LOG_FILE="/var/log/ssl-setup.log"
exec 1> >(tee -a "$LOG_FILE")
exec 2> >(tee -a "$LOG_FILE" >&2)

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Check if running as root
check_permissions() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root for security reasons"
        exit 1
    fi
}

# Create necessary directories
setup_directories() {
    log "Setting up SSL directories..."
    
    sudo mkdir -p "$SSL_DIR"/{cryb.ai,letsencrypt}
    sudo mkdir -p "$WEBROOT_DIR"
    sudo mkdir -p /var/log/letsencrypt
    
    # Set proper permissions
    sudo chown -R $USER:$USER "$SSL_DIR"
    sudo chown -R $USER:$USER "$WEBROOT_DIR"
    
    success "Directories created successfully"
}

# Install Certbot
install_certbot() {
    log "Installing Certbot..."
    
    if ! command -v certbot &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y certbot python3-certbot-nginx
        success "Certbot installed successfully"
    else
        log "Certbot already installed"
    fi
}

# Create initial Nginx configuration for ACME challenge
create_initial_nginx_config() {
    log "Creating initial Nginx configuration..."
    
    cat > "$SSL_DIR/../sites-enabled/initial.conf" << EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name ${DOMAINS[*]};
    
    # ACME challenge
    location ^~ /.well-known/acme-challenge/ {
        root $WEBROOT_DIR;
        try_files \$uri =404;
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "OK";
        add_header Content-Type text/plain;
    }
    
    # Temporary redirect
    location / {
        return 200 "SSL certificates are being set up. Please wait...";
        add_header Content-Type text/plain;
    }
}
EOF
    
    success "Initial Nginx configuration created"
}

# Obtain SSL certificates
obtain_certificates() {
    log "Obtaining SSL certificates..."
    
    # Build domain string for certbot
    DOMAIN_STRING=""
    for domain in "${DOMAINS[@]}"; do
        DOMAIN_STRING="$DOMAIN_STRING -d $domain"
    done
    
    # Use webroot method for certificate generation
    sudo certbot certonly \
        --webroot \
        --webroot-path="$WEBROOT_DIR" \
        --email "$EMAIL" \
        --agree-tos \
        --non-interactive \
        --no-eff-email \
        $DOMAIN_STRING \
        --cert-name cryb.ai
    
    if [ $? -eq 0 ]; then
        success "SSL certificates obtained successfully"
        
        # Copy certificates to our SSL directory
        sudo cp /etc/letsencrypt/live/cryb.ai/fullchain.pem "$SSL_DIR/cryb.ai/"
        sudo cp /etc/letsencrypt/live/cryb.ai/privkey.pem "$SSL_DIR/cryb.ai/"
        sudo cp /etc/letsencrypt/live/cryb.ai/chain.pem "$SSL_DIR/cryb.ai/"
        
        # Set proper permissions
        sudo chown -R $USER:$USER "$SSL_DIR/cryb.ai"
        sudo chmod 600 "$SSL_DIR/cryb.ai/privkey.pem"
        sudo chmod 644 "$SSL_DIR/cryb.ai/fullchain.pem" "$SSL_DIR/cryb.ai/chain.pem"
        
    else
        error "Failed to obtain SSL certificates"
        exit 1
    fi
}

# Test SSL configuration
test_ssl_config() {
    log "Testing SSL configuration..."
    
    # Test Nginx configuration
    if sudo nginx -t 2>/dev/null; then
        success "Nginx configuration is valid"
    else
        error "Nginx configuration is invalid"
        return 1
    fi
    
    # Test certificate validity
    if openssl x509 -in "$SSL_DIR/cryb.ai/fullchain.pem" -noout -text | grep -q "Not After"; then
        EXPIRY_DATE=$(openssl x509 -in "$SSL_DIR/cryb.ai/fullchain.pem" -noout -enddate | cut -d= -f2)
        success "Certificate is valid until: $EXPIRY_DATE"
    else
        error "Certificate validation failed"
        return 1
    fi
}

# Create certificate renewal script
create_renewal_script() {
    log "Creating certificate renewal script..."
    
    cat > /tmp/ssl-renew.sh << 'EOF'
#!/bin/bash

# SSL Certificate Renewal Script
# Runs automatically via cron

set -euo pipefail

LOG_FILE="/var/log/ssl-renewal.log"
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
DISCORD_WEBHOOK_URL="${DISCORD_WEBHOOK_URL:-}"

# Logging
exec 1> >(tee -a "$LOG_FILE")
exec 2> >(tee -a "$LOG_FILE" >&2)

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

send_notification() {
    local message="$1"
    local status="$2"  # success or error
    
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🔒 SSL Renewal $status: $message\"}" \
            "$SLACK_WEBHOOK_URL" || true
    fi
    
    if [[ -n "$DISCORD_WEBHOOK_URL" ]]; then
        curl -H "Content-Type: application/json" \
            -X POST \
            -d "{\"content\":\"🔒 SSL Renewal $status: $message\"}" \
            "$DISCORD_WEBHOOK_URL" || true
    fi
}

# Check if certificates need renewal (30 days before expiry)
if certbot renew --dry-run --quiet; then
    log "Certificates are up to date, no renewal needed"
    exit 0
fi

log "Starting certificate renewal process..."

# Attempt renewal
if certbot renew --quiet --no-self-upgrade; then
    log "Certificate renewal successful"
    
    # Copy new certificates
    SSL_DIR="/home/ubuntu/cryb-platform/config/nginx/ssl"
    sudo cp /etc/letsencrypt/live/cryb.ai/fullchain.pem "$SSL_DIR/cryb.ai/"
    sudo cp /etc/letsencrypt/live/cryb.ai/privkey.pem "$SSL_DIR/cryb.ai/"
    sudo cp /etc/letsencrypt/live/cryb.ai/chain.pem "$SSL_DIR/cryb.ai/"
    
    # Set permissions
    sudo chown -R $USER:$USER "$SSL_DIR/cryb.ai"
    sudo chmod 600 "$SSL_DIR/cryb.ai/privkey.pem"
    sudo chmod 644 "$SSL_DIR/cryb.ai/fullchain.pem" "$SSL_DIR/cryb.ai/chain.pem"
    
    # Test nginx configuration
    if sudo nginx -t; then
        # Reload nginx
        if sudo systemctl reload nginx; then
            log "Nginx reloaded successfully"
            send_notification "SSL certificates renewed and nginx reloaded successfully" "SUCCESS"
        else
            log "Failed to reload nginx"
            send_notification "SSL certificates renewed but nginx reload failed" "ERROR"
            exit 1
        fi
    else
        log "Nginx configuration test failed"
        send_notification "SSL certificates renewed but nginx configuration is invalid" "ERROR"
        exit 1
    fi
else
    log "Certificate renewal failed"
    send_notification "SSL certificate renewal failed" "ERROR"
    exit 1
fi

# Cleanup old logs (keep last 30 days)
find /var/log -name "ssl-renewal.log*" -mtime +30 -delete 2>/dev/null || true

log "Certificate renewal completed successfully"
EOF
    
    sudo mv /tmp/ssl-renew.sh /usr/local/bin/ssl-renew.sh
    sudo chmod +x /usr/local/bin/ssl-renew.sh
    sudo chown root:root /usr/local/bin/ssl-renew.sh
    
    success "Renewal script created"
}

# Setup automated renewal with cron
setup_auto_renewal() {
    log "Setting up automatic renewal..."
    
    # Create cron job for renewal (runs twice daily)
    CRON_JOB="0 2,14 * * * /usr/local/bin/ssl-renew.sh"
    
    # Add cron job if it doesn't exist
    if ! crontab -l 2>/dev/null | grep -q "ssl-renew.sh"; then
        (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
        success "Cron job for automatic renewal created"
    else
        log "Cron job already exists"
    fi
    
    # Create systemd timer as backup
    cat > /tmp/ssl-renewal.service << EOF
[Unit]
Description=SSL Certificate Renewal
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/ssl-renew.sh
User=root
Group=root

[Install]
WantedBy=multi-user.target
EOF
    
    cat > /tmp/ssl-renewal.timer << EOF
[Unit]
Description=SSL Certificate Renewal Timer
Requires=ssl-renewal.service

[Timer]
OnCalendar=*-*-* 02:00:00
OnCalendar=*-*-* 14:00:00
RandomizedDelaySec=1800
Persistent=true

[Install]
WantedBy=timers.target
EOF
    
    sudo mv /tmp/ssl-renewal.service /etc/systemd/system/
    sudo mv /tmp/ssl-renewal.timer /etc/systemd/system/
    
    sudo systemctl daemon-reload
    sudo systemctl enable ssl-renewal.timer
    sudo systemctl start ssl-renewal.timer
    
    success "Systemd timer for automatic renewal created"
}

# Create monitoring script
create_monitoring_script() {
    log "Creating SSL monitoring script..."
    
    cat > /tmp/ssl-monitor.sh << 'EOF'
#!/bin/bash

# SSL Certificate Monitoring Script
# Checks certificate expiry and sends alerts

set -euo pipefail

DOMAINS=(
    "cryb.ai"
    "www.cryb.ai"
    "api.cryb.ai"
    "livekit.cryb.ai"
    "monitoring.cryb.ai"
    "storage.cryb.ai"
)

WARNING_DAYS=30
CRITICAL_DAYS=7
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
DISCORD_WEBHOOK_URL="${DISCORD_WEBHOOK_URL:-}"

send_alert() {
    local domain="$1"
    local days="$2"
    local level="$3"  # WARNING or CRITICAL
    
    local message="🚨 SSL Certificate $level: $domain expires in $days days"
    
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$SLACK_WEBHOOK_URL" || true
    fi
    
    if [[ -n "$DISCORD_WEBHOOK_URL" ]]; then
        curl -H "Content-Type: application/json" \
            -X POST \
            -d "{\"content\":\"$message\"}" \
            "$DISCORD_WEBHOOK_URL" || true
    fi
    
    echo "$message"
}

check_certificate() {
    local domain="$1"
    
    # Get certificate expiry date
    local expiry_date
    expiry_date=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | \
                  openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
    
    if [[ -z "$expiry_date" ]]; then
        echo "Failed to get certificate info for $domain"
        return 1
    fi
    
    # Calculate days until expiry
    local expiry_epoch
    expiry_epoch=$(date -d "$expiry_date" +%s)
    local current_epoch
    current_epoch=$(date +%s)
    local days_until_expiry
    days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))
    
    echo "Certificate for $domain expires in $days_until_expiry days"
    
    # Send alerts based on thresholds
    if [[ $days_until_expiry -le $CRITICAL_DAYS ]]; then
        send_alert "$domain" "$days_until_expiry" "CRITICAL"
    elif [[ $days_until_expiry -le $WARNING_DAYS ]]; then
        send_alert "$domain" "$days_until_expiry" "WARNING"
    fi
}

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Starting SSL certificate monitoring..."

for domain in "${DOMAINS[@]}"; do
    check_certificate "$domain"
done

echo "[$(date +'%Y-%m-%d %H:%M:%S')] SSL certificate monitoring completed"
EOF
    
    sudo mv /tmp/ssl-monitor.sh /usr/local/bin/ssl-monitor.sh
    sudo chmod +x /usr/local/bin/ssl-monitor.sh
    sudo chown root:root /usr/local/bin/ssl-monitor.sh
    
    # Add monitoring cron job (runs daily)
    MONITOR_CRON="0 8 * * * /usr/local/bin/ssl-monitor.sh >> /var/log/ssl-monitor.log 2>&1"
    
    if ! crontab -l 2>/dev/null | grep -q "ssl-monitor.sh"; then
        (crontab -l 2>/dev/null; echo "$MONITOR_CRON") | crontab -
        success "SSL monitoring cron job created"
    fi
}

# Validate configuration
validate_setup() {
    log "Validating SSL setup..."
    
    local errors=0
    
    # Check certificate files
    for cert_file in fullchain.pem privkey.pem chain.pem; do
        if [[ ! -f "$SSL_DIR/cryb.ai/$cert_file" ]]; then
            error "Certificate file missing: $cert_file"
            ((errors++))
        fi
    done
    
    # Check permissions
    if [[ ! -r "$SSL_DIR/cryb.ai/fullchain.pem" ]]; then
        error "Certificate files are not readable"
        ((errors++))
    fi
    
    # Check cron jobs
    if ! crontab -l 2>/dev/null | grep -q "ssl-renew.sh"; then
        error "Renewal cron job not found"
        ((errors++))
    fi
    
    if ! crontab -l 2>/dev/null | grep -q "ssl-monitor.sh"; then
        error "Monitoring cron job not found"
        ((errors++))
    fi
    
    # Check systemd timer
    if ! systemctl is-enabled ssl-renewal.timer >/dev/null 2>&1; then
        error "SSL renewal systemd timer not enabled"
        ((errors++))
    fi
    
    if [[ $errors -eq 0 ]]; then
        success "SSL setup validation passed"
        return 0
    else
        error "SSL setup validation failed with $errors errors"
        return 1
    fi
}

# Generate DH parameters for enhanced security
generate_dhparams() {
    log "Generating DH parameters for enhanced security..."
    
    if [[ ! -f "$SSL_DIR/dhparams.pem" ]]; then
        openssl dhparam -out "$SSL_DIR/dhparams.pem" 2048
        success "DH parameters generated"
    else
        log "DH parameters already exist"
    fi
}

# Main execution
main() {
    log "Starting SSL certificate setup for CRYB Platform"
    
    check_permissions
    setup_directories
    install_certbot
    create_initial_nginx_config
    obtain_certificates
    generate_dhparams
    test_ssl_config
    create_renewal_script
    setup_auto_renewal
    create_monitoring_script
    
    if validate_setup; then
        success "SSL setup completed successfully!"
        log "SSL certificates are now configured and will auto-renew"
        log "Monitoring is active and will alert on expiry"
        log "Next steps:"
        log "1. Update your DNS records to point to this server"
        log "2. Update docker-compose to use the full nginx configuration"
        log "3. Test your domains: ${DOMAINS[*]}"
    else
        error "SSL setup validation failed. Please check the errors above."
        exit 1
    fi
}

# Run main function
main "$@"