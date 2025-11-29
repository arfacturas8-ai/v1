#!/bin/bash
# CRYB Platform Production SSL Setup Script
# This script sets up Let's Encrypt SSL certificates for production deployment

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="cryb.ai"
SUBDOMAINS="www.cryb.ai,platform.cryb.ai,api.cryb.ai,cdn.cryb.ai,livekit.cryb.ai"
EMAIL="admin@cryb.ai"
NGINX_CONFIG_DIR="/etc/nginx/sites-enabled"
CRYB_CONFIG_DIR="/home/ubuntu/cryb-platform/config/nginx"

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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
    error "This script should not be run as root. Please run as ubuntu user with sudo."
    exit 1
fi

log "Starting CRYB Platform SSL Setup for Production..."

# Install certbot if not already installed
if ! command -v certbot &> /dev/null; then
    log "Installing certbot..."
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
    success "Certbot installed successfully"
else
    log "Certbot is already installed"
fi

# Stop nginx temporarily to avoid port conflicts
log "Stopping Nginx temporarily..."
sudo systemctl stop nginx

# Create webroot directory for challenges
sudo mkdir -p /var/www/html/.well-known/acme-challenge
sudo chown -R www-data:www-data /var/www/html

# Request SSL certificates using standalone mode
log "Requesting SSL certificates for $DOMAIN and subdomains..."
log "This may take a few minutes..."

if sudo certbot certonly \
    --standalone \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --expand \
    -d "$DOMAIN" \
    -d "$SUBDOMAINS"; then
    success "SSL certificates obtained successfully!"
else
    error "Failed to obtain SSL certificates"
    log "Starting Nginx back up..."
    sudo systemctl start nginx
    exit 1
fi

# Set proper permissions for certificates
sudo chmod 644 /etc/letsencrypt/live/$DOMAIN/fullchain.pem
sudo chmod 600 /etc/letsencrypt/live/$DOMAIN/privkey.pem

# Deploy the production SSL nginx configuration
log "Deploying production SSL Nginx configuration..."
sudo cp "$CRYB_CONFIG_DIR/production-ssl.conf" "$NGINX_CONFIG_DIR/cryb-ssl"

# Remove the old HTTP-only configuration
if [ -f "$NGINX_CONFIG_DIR/cryb-http-simple" ]; then
    sudo mv "$NGINX_CONFIG_DIR/cryb-http-simple" "$NGINX_CONFIG_DIR/cryb-http-simple.disabled"
    log "Disabled old HTTP-only configuration"
fi

# Test Nginx configuration
log "Testing Nginx configuration..."
if sudo nginx -t; then
    success "Nginx configuration is valid"
else
    error "Nginx configuration test failed"
    sudo mv "$NGINX_CONFIG_DIR/cryb-http-simple.disabled" "$NGINX_CONFIG_DIR/cryb-http-simple" 2>/dev/null || true
    exit 1
fi

# Start Nginx
log "Starting Nginx with SSL configuration..."
sudo systemctl start nginx
sudo systemctl reload nginx

# Verify Nginx is running
if sudo systemctl is-active --quiet nginx; then
    success "Nginx is running with SSL configuration"
else
    error "Failed to start Nginx"
    exit 1
fi

# Set up automatic certificate renewal
log "Setting up automatic SSL certificate renewal..."
if ! sudo crontab -l 2>/dev/null | grep -q "certbot renew"; then
    (sudo crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --reload-nginx") | sudo crontab -
    success "SSL certificate auto-renewal configured"
else
    log "SSL certificate auto-renewal already configured"
fi

# Test certificate renewal
log "Testing SSL certificate renewal..."
if sudo certbot renew --dry-run; then
    success "SSL certificate renewal test passed"
else
    warning "SSL certificate renewal test failed - please check configuration"
fi

# Display certificate information
log "SSL Certificate Information:"
echo "=================================================="
sudo certbot certificates
echo "=================================================="

# Security recommendations
echo
log "SSL Setup Complete! Security Recommendations:"
echo "1. Ensure your DNS records point to this server:"
echo "   - A record: cryb.ai -> $(curl -s ifconfig.me)"
echo "   - A record: www.cryb.ai -> $(curl -s ifconfig.me)"
echo "   - A record: platform.cryb.ai -> $(curl -s ifconfig.me)"
echo "   - A record: api.cryb.ai -> $(curl -s ifconfig.me)"
echo "   - A record: cdn.cryb.ai -> $(curl -s ifconfig.me)"
echo "   - A record: livekit.cryb.ai -> $(curl -s ifconfig.me)"
echo
echo "2. Test your SSL configuration:"
echo "   - https://www.ssllabs.com/ssltest/analyze.html?d=cryb.ai"
echo
echo "3. Monitor certificate expiration (auto-renewal is configured)"

# Test endpoints
log "Testing HTTPS endpoints..."
sleep 5

test_endpoint() {
    local url=$1
    local expected_status=${2:-200}
    
    if curl -sI -k --max-time 10 "$url" | head -1 | grep -q "$expected_status"; then
        success "✓ $url responding"
    else
        warning "✗ $url not responding properly"
    fi
}

echo
log "Endpoint Tests:"
test_endpoint "https://platform.cryb.ai" "200\|301\|302"
test_endpoint "https://api.cryb.ai/health" "200"
test_endpoint "https://cryb.ai" "301"

echo
success "🚀 CRYB Platform SSL Setup Complete!"
echo
echo "Your platform is now secure with HTTPS:"
echo "- Main site: https://platform.cryb.ai"
echo "- API: https://api.cryb.ai"
echo "- Redirects: https://cryb.ai -> https://platform.cryb.ai"
echo
echo "Next steps:"
echo "1. Update your DNS records to point to this server"
echo "2. Update environment variables to use HTTPS URLs"
echo "3. Test all functionality with HTTPS enabled"
echo "4. Set up monitoring and backups"

log "Script completed successfully!"