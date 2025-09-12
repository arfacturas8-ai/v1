#!/bin/bash

# ==============================================
# CRYB PLATFORM - SSL AUTOMATION SYSTEM
# ==============================================
# Automated SSL certificate management with Let's Encrypt
# Features:
# - Automatic certificate generation
# - Renewal automation
# - Security hardening
# - Multi-domain support
# - Webhook notifications
# ==============================================

set -euo pipefail

# Configuration
CERT_DIR="/etc/nginx/ssl"
CERTBOT_DIR="/etc/letsencrypt"
WEBROOT_DIR="/var/www/certbot"
LOG_FILE="/var/log/ssl-automation.log"

# Domain Configuration
DOMAINS=(
    "cryb.ai"
    "www.cryb.ai"
    "api.cryb.ai"
    "livekit.cryb.ai"
    "monitoring.cryb.ai"
    "storage.cryb.ai"
)

# Email for Let's Encrypt
LETSENCRYPT_EMAIL=${LETSENCRYPT_EMAIL:-devops@cryb.ai}

# Notification Configuration
WEBHOOK_URL=${SSL_WEBHOOK_URL:-}
SLACK_WEBHOOK=${SLACK_WEBHOOK:-}

# ==============================================
# LOGGING FUNCTIONS
# ==============================================
log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$LOG_FILE" >&2
}

log_warning() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1" | tee -a "$LOG_FILE"
}

# ==============================================
# NOTIFICATION FUNCTIONS
# ==============================================
send_notification() {
    local status="$1"
    local message="$2"
    
    if [[ -n "$SLACK_WEBHOOK" ]]; then
        curl -X POST "$SLACK_WEBHOOK" \
            -H 'Content-type: application/json' \
            --data "{\"text\":\"🔒 SSL Certificate ${status}: ${message}\"}" \
            2>/dev/null || log_warning "Failed to send Slack notification"
    fi
    
    if [[ -n "$WEBHOOK_URL" ]]; then
        curl -X POST "$WEBHOOK_URL" \
            -H 'Content-type: application/json' \
            --data "{\"status\":\"${status}\",\"message\":\"${message}\",\"timestamp\":\"$(date -Iseconds)\",\"type\":\"ssl\"}" \
            2>/dev/null || log_warning "Failed to send webhook notification"
    fi
}

# ==============================================
# SYSTEM SETUP FUNCTIONS
# ==============================================
install_certbot() {
    log_info "Installing Certbot..."
    
    if command -v certbot &> /dev/null; then
        log_info "Certbot already installed"
        return 0
    fi
    
    # Install Certbot based on OS
    if command -v apt-get &> /dev/null; then
        apt-get update
        apt-get install -y certbot python3-certbot-nginx
    elif command -v yum &> /dev/null; then
        yum install -y certbot python3-certbot-nginx
    elif command -v apk &> /dev/null; then
        apk add --no-cache certbot certbot-nginx
    else
        log_error "Unsupported package manager"
        return 1
    fi
    
    log_info "Certbot installed successfully"
}

setup_directories() {
    log_info "Setting up SSL directories..."
    
    mkdir -p "$CERT_DIR"
    mkdir -p "$WEBROOT_DIR"
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Create ACME challenge directory
    mkdir -p "$WEBROOT_DIR/.well-known/acme-challenge"
    
    # Set proper permissions
    chmod 755 "$WEBROOT_DIR"
    chmod 755 "$CERT_DIR"
    
    log_info "SSL directories setup completed"
}

# ==============================================
# CERTIFICATE FUNCTIONS
# ==============================================
generate_certificate() {
    local domain="$1"
    local additional_domains="${2:-}"
    
    log_info "Generating certificate for $domain"
    
    # Build domain list
    local domain_args="-d $domain"
    if [[ -n "$additional_domains" ]]; then
        IFS=',' read -ra ADDR <<< "$additional_domains"
        for i in "${ADDR[@]}"; do
            domain_args="$domain_args -d ${i// /}"
        done
    fi
    
    # Generate certificate
    if certbot certonly \
        --webroot \
        --webroot-path="$WEBROOT_DIR" \
        --email "$LETSENCRYPT_EMAIL" \
        --agree-tos \
        --no-eff-email \
        --non-interactive \
        --expand \
        $domain_args; then
        
        log_info "Certificate generated successfully for $domain"
        
        # Copy certificates to nginx directory
        copy_certificates "$domain"
        
        return 0
    else
        log_error "Failed to generate certificate for $domain"
        return 1
    fi
}

copy_certificates() {
    local domain="$1"
    local cert_path="$CERTBOT_DIR/live/$domain"
    local dest_path="$CERT_DIR/$domain"
    
    if [[ -d "$cert_path" ]]; then
        mkdir -p "$dest_path"
        
        # Copy certificate files
        cp "$cert_path/fullchain.pem" "$dest_path/"
        cp "$cert_path/privkey.pem" "$dest_path/"
        cp "$cert_path/chain.pem" "$dest_path/"
        cp "$cert_path/cert.pem" "$dest_path/"
        
        # Set proper permissions
        chmod 644 "$dest_path/fullchain.pem"
        chmod 644 "$dest_path/chain.pem"
        chmod 644 "$dest_path/cert.pem"
        chmod 600 "$dest_path/privkey.pem"
        
        log_info "Certificates copied to $dest_path"
    else
        log_error "Certificate path not found: $cert_path"
        return 1
    fi
}

renew_certificates() {
    log_info "Starting certificate renewal process..."
    
    local renewed=false
    
    if certbot renew --quiet --webroot --webroot-path="$WEBROOT_DIR"; then
        log_info "Certificate renewal check completed"
        
        # Check if any certificates were renewed
        if certbot certificates 2>/dev/null | grep -q "VALID"; then
            # Copy renewed certificates
            for domain in "${DOMAINS[@]}"; do
                if [[ -d "$CERTBOT_DIR/live/$domain" ]]; then
                    copy_certificates "$domain"
                    renewed=true
                fi
            done
            
            if [[ "$renewed" == true ]]; then
                reload_nginx
                send_notification "RENEWED" "SSL certificates renewed successfully"
            fi
        fi
    else
        log_error "Certificate renewal failed"
        send_notification "FAILED" "SSL certificate renewal failed"
        return 1
    fi
}

# ==============================================
# NGINX FUNCTIONS
# ==============================================
test_nginx_config() {
    log_info "Testing Nginx configuration..."
    
    if docker exec cryb-nginx-production nginx -t; then
        log_info "Nginx configuration test passed"
        return 0
    else
        log_error "Nginx configuration test failed"
        return 1
    fi
}

reload_nginx() {
    log_info "Reloading Nginx configuration..."
    
    if test_nginx_config; then
        if docker exec cryb-nginx-production nginx -s reload; then
            log_info "Nginx reloaded successfully"
            return 0
        else
            log_error "Failed to reload Nginx"
            return 1
        fi
    else
        log_error "Nginx configuration test failed, not reloading"
        return 1
    fi
}

# ==============================================
# SECURITY FUNCTIONS
# ==============================================
generate_dhparam() {
    local dhparam_file="$CERT_DIR/dhparam.pem"
    
    if [[ ! -f "$dhparam_file" ]]; then
        log_info "Generating Diffie-Hellman parameters (this may take a while)..."
        
        openssl dhparam -out "$dhparam_file" 2048
        chmod 644 "$dhparam_file"
        
        log_info "Diffie-Hellman parameters generated"
    else
        log_info "Diffie-Hellman parameters already exist"
    fi
}

setup_security_headers() {
    local security_config="$CERT_DIR/security-headers.conf"
    
    cat > "$security_config" << 'EOF'
# Security Headers Configuration
# Include this file in your SSL server blocks

# HSTS (HTTP Strict Transport Security)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

# Content Security Policy
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: https: blob:; connect-src 'self' wss: ws: https:; media-src 'self' blob: https:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; upgrade-insecure-requests;" always;

# X-Frame-Options
add_header X-Frame-Options DENY always;

# X-Content-Type-Options
add_header X-Content-Type-Options nosniff always;

# X-XSS-Protection
add_header X-XSS-Protection "1; mode=block" always;

# Referrer Policy
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# Permissions Policy
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), ambient-light-sensor=(), autoplay=(), bluetooth=(), display-capture=(), document-domain=(), encrypted-media=(), fullscreen=(), midi=(), navigation-override=(), screen-wake-lock=(), sync-xhr=(), web-share=()" always;

# Feature Policy (deprecated but kept for compatibility)
add_header Feature-Policy "camera 'none'; microphone 'none'; geolocation 'none'; payment 'none'" always;
EOF

    chmod 644 "$security_config"
    log_info "Security headers configuration created"
}

# ==============================================
# CERTIFICATE MONITORING
# ==============================================
check_certificate_expiry() {
    local domain="$1"
    local cert_file="$CERT_DIR/$domain/cert.pem"
    
    if [[ -f "$cert_file" ]]; then
        local expiry_date=$(openssl x509 -enddate -noout -in "$cert_file" | cut -d= -f2)
        local expiry_epoch=$(date -d "$expiry_date" +%s)
        local current_epoch=$(date +%s)
        local days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))
        
        echo "$days_until_expiry"
    else
        echo "-1"
    fi
}

monitor_certificates() {
    log_info "Monitoring certificate expiry..."
    
    local warning_days=30
    local critical_days=7
    
    for domain in "${DOMAINS[@]}"; do
        local days_until_expiry=$(check_certificate_expiry "$domain")
        
        if [[ "$days_until_expiry" -eq -1 ]]; then
            log_warning "Certificate not found for $domain"
            continue
        fi
        
        log_info "Certificate for $domain expires in $days_until_expiry days"
        
        if [[ "$days_until_expiry" -le "$critical_days" ]]; then
            send_notification "CRITICAL" "Certificate for $domain expires in $days_until_expiry days!"
        elif [[ "$days_until_expiry" -le "$warning_days" ]]; then
            send_notification "WARNING" "Certificate for $domain expires in $days_until_expiry days"
        fi
    done
}

# ==============================================
# BACKUP AND RESTORE
# ==============================================
backup_certificates() {
    local backup_file="/backups/ssl_certificates_$(date +%Y%m%d_%H%M%S).tar.gz"
    
    log_info "Backing up SSL certificates..."
    
    mkdir -p "$(dirname "$backup_file")"
    
    if tar -czf "$backup_file" -C / \
        "etc/nginx/ssl" \
        "etc/letsencrypt" 2>/dev/null; then
        
        chmod 600 "$backup_file"
        log_info "SSL certificates backed up to $backup_file"
        echo "$backup_file"
    else
        log_error "Failed to backup SSL certificates"
        return 1
    fi
}

# ==============================================
# AUTOMATION SETUP
# ==============================================
setup_cron_jobs() {
    log_info "Setting up SSL automation cron jobs..."
    
    # Create cron job for certificate renewal
    local cron_file="/etc/cron.d/ssl-automation"
    
    cat > "$cron_file" << EOF
# SSL Certificate Automation
# Renew certificates daily at 2:30 AM
30 2 * * * root /home/ubuntu/cryb-platform/scripts/ssl-automation.sh renew >> $LOG_FILE 2>&1

# Monitor certificates daily at 9:00 AM
0 9 * * * root /home/ubuntu/cryb-platform/scripts/ssl-automation.sh monitor >> $LOG_FILE 2>&1

# Backup certificates weekly on Sunday at 3:00 AM
0 3 * * 0 root /home/ubuntu/cryb-platform/scripts/ssl-automation.sh backup >> $LOG_FILE 2>&1
EOF

    chmod 644 "$cron_file"
    
    # Restart cron service
    if command -v systemctl &> /dev/null; then
        systemctl restart cron || systemctl restart crond
    else
        service cron restart || service crond restart
    fi
    
    log_info "SSL automation cron jobs configured"
}

# ==============================================
# MAIN FUNCTIONS
# ==============================================
init_ssl() {
    log_info "Initializing SSL automation system..."
    
    install_certbot
    setup_directories
    generate_dhparam
    setup_security_headers
    setup_cron_jobs
    
    log_info "SSL automation system initialized"
}

generate_all_certificates() {
    log_info "Generating certificates for all domains..."
    
    local failed_domains=()
    
    # Generate certificate for primary domain with all subdomains
    local primary_domain="${DOMAINS[0]}"
    local additional_domains=""
    
    for i in "${!DOMAINS[@]}"; do
        if [[ $i -gt 0 ]]; then
            if [[ -z "$additional_domains" ]]; then
                additional_domains="${DOMAINS[i]}"
            else
                additional_domains="$additional_domains,${DOMAINS[i]}"
            fi
        fi
    done
    
    if generate_certificate "$primary_domain" "$additional_domains"; then
        log_info "All certificates generated successfully"
        reload_nginx
        send_notification "SUCCESS" "SSL certificates generated for all domains"
    else
        failed_domains+=("$primary_domain")
        log_error "Failed to generate certificates for $primary_domain"
        send_notification "FAILED" "SSL certificate generation failed for $primary_domain"
    fi
    
    if [[ ${#failed_domains[@]} -gt 0 ]]; then
        log_error "Failed domains: ${failed_domains[*]}"
        return 1
    fi
}

# ==============================================
# COMMAND LINE INTERFACE
# ==============================================
show_help() {
    cat << EOF
CRYB Platform SSL Automation System

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    init                Initialize SSL automation system
    generate            Generate certificates for all domains
    renew              Renew existing certificates
    monitor            Check certificate expiry status
    backup             Backup SSL certificates
    test               Test Nginx configuration
    reload             Reload Nginx configuration
    status             Show certificate status
    help               Show this help message

Examples:
    $0 init                    # Initialize the system
    $0 generate               # Generate all certificates
    $0 renew                  # Renew certificates
    $0 monitor                # Check certificate expiry

Environment Variables:
    LETSENCRYPT_EMAIL         Email for Let's Encrypt (required)
    SSL_WEBHOOK_URL          Webhook URL for notifications
    SLACK_WEBHOOK            Slack webhook URL for notifications

EOF
}

show_status() {
    log_info "SSL Certificate Status:"
    echo "======================================"
    
    for domain in "${DOMAINS[@]}"; do
        local days_until_expiry=$(check_certificate_expiry "$domain")
        local cert_file="$CERT_DIR/$domain/cert.pem"
        
        if [[ -f "$cert_file" ]]; then
            local issuer=$(openssl x509 -issuer -noout -in "$cert_file" | cut -d= -f2- | cut -d= -f2-)
            local expiry_date=$(openssl x509 -enddate -noout -in "$cert_file" | cut -d= -f2)
            
            printf "%-25s | %3d days | %s\n" "$domain" "$days_until_expiry" "$expiry_date"
        else
            printf "%-25s | %s\n" "$domain" "NOT FOUND"
        fi
    done
    
    echo "======================================"
}

# ==============================================
# SCRIPT EXECUTION
# ==============================================
main() {
    local command="${1:-help}"
    
    case "$command" in
        "init")
            init_ssl
            ;;
        "generate")
            generate_all_certificates
            ;;
        "renew")
            renew_certificates
            ;;
        "monitor")
            monitor_certificates
            ;;
        "backup")
            backup_certificates
            ;;
        "test")
            test_nginx_config
            ;;
        "reload")
            reload_nginx
            ;;
        "status")
            show_status
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            log_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Trap signals for cleanup
trap 'log_error "SSL automation interrupted"; exit 130' INT TERM

# Check if running as root for some operations
if [[ "$1" =~ ^(init|generate|renew)$ ]] && [[ $EUID -ne 0 ]]; then
    log_error "This operation requires root privileges"
    exit 1
fi

# Execute main function
main "$@"