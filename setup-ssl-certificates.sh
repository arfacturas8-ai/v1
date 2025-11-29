#!/bin/bash

# ===================================================
# CRYB PLATFORM - SSL CERTIFICATE SETUP
# ===================================================
# Creates self-signed SSL certificates for production
# Can be replaced with real certificates later
# ===================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "🔒 Setting up SSL certificates for CRYB Platform..."
echo "=================================================="

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    print_error "This script must be run as root (use sudo)"
    exit 1
fi

# Create SSL directories
print_status "Creating SSL directories..."
mkdir -p /etc/ssl/certs
mkdir -p /etc/ssl/private
mkdir -p /etc/ssl/csr

# Set proper permissions
chmod 755 /etc/ssl/certs
chmod 700 /etc/ssl/private
chmod 755 /etc/ssl/csr

# Generate CA private key
print_status "Generating Certificate Authority (CA) private key..."
openssl genrsa -out /etc/ssl/private/cryb-ca.key 4096

# Generate CA certificate
print_status "Generating CA certificate..."
openssl req -new -x509 -days 3650 -key /etc/ssl/private/cryb-ca.key -out /etc/ssl/certs/cryb-ca.crt -subj "/C=US/ST=California/L=San Francisco/O=CRYB Platform/OU=Development/CN=CRYB-CA"

# Generate server private key
print_status "Generating server private key..."
openssl genrsa -out /etc/ssl/private/cryb.key 4096

# Generate certificate signing request
print_status "Generating certificate signing request..."
openssl req -new -key /etc/ssl/private/cryb.key -out /etc/ssl/csr/cryb.csr -subj "/C=US/ST=California/L=San Francisco/O=CRYB Platform/OU=Production/CN=platform.cryb.ai"

# Create certificate extensions file
print_status "Creating certificate extensions..."
cat > /etc/ssl/csr/cryb.ext << EOF
[v3_req]
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = platform.cryb.ai
DNS.2 = api.cryb.ai
DNS.3 = cdn.cryb.ai
DNS.4 = livekit.cryb.ai
DNS.5 = localhost
DNS.6 = *.cryb.ai
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

# Generate server certificate signed by CA
print_status "Generating server certificate..."
openssl x509 -req -in /etc/ssl/csr/cryb.csr -CA /etc/ssl/certs/cryb-ca.crt -CAkey /etc/ssl/private/cryb-ca.key -CAcreateserial -out /etc/ssl/certs/cryb.crt -days 365 -extensions v3_req -extfile /etc/ssl/csr/cryb.ext

# Create certificate bundle
print_status "Creating certificate bundle..."
cat /etc/ssl/certs/cryb.crt /etc/ssl/certs/cryb-ca.crt > /etc/ssl/certs/cryb-bundle.crt

# Set proper permissions
print_status "Setting certificate permissions..."
chmod 644 /etc/ssl/certs/cryb.crt
chmod 644 /etc/ssl/certs/cryb-ca.crt  
chmod 644 /etc/ssl/certs/cryb-bundle.crt
chmod 600 /etc/ssl/private/cryb.key
chmod 600 /etc/ssl/private/cryb-ca.key

# Verify certificate
print_status "Verifying certificate..."
if openssl x509 -in /etc/ssl/certs/cryb.crt -text -noout | grep -q "platform.cryb.ai"; then
    print_success "Certificate verification passed"
else
    print_error "Certificate verification failed"
    exit 1
fi

# Create dhparam for stronger security
print_status "Generating Diffie-Hellman parameters (this may take a while)..."
openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048

# Create certificate info file
print_status "Creating certificate information file..."
cat > /etc/ssl/certs/cryb-cert-info.txt << EOF
CRYB Platform SSL Certificates
============================

Certificate Authority:
- Key: /etc/ssl/private/cryb-ca.key
- Certificate: /etc/ssl/certs/cryb-ca.crt

Server Certificate:
- Key: /etc/ssl/private/cryb.key
- Certificate: /etc/ssl/certs/cryb.crt
- Bundle: /etc/ssl/certs/cryb-bundle.crt

DH Parameters: /etc/ssl/certs/dhparam.pem

Domains covered:
- platform.cryb.ai
- api.cryb.ai
- cdn.cryb.ai
- livekit.cryb.ai
- *.cryb.ai
- localhost

Valid for: 1 year
Generated: $(date)

To trust this certificate on client machines:
1. Copy /etc/ssl/certs/cryb-ca.crt to client
2. Install as trusted root certificate

For browsers, you may need to:
1. Visit https://platform.cryb.ai
2. Accept the security warning
3. Add permanent exception
EOF

# Display certificate information
print_status "Certificate Details:"
echo "=================================================="
openssl x509 -in /etc/ssl/certs/cryb.crt -text -noout | grep -A 5 "Subject:"
openssl x509 -in /etc/ssl/certs/cryb.crt -text -noout | grep -A 10 "Subject Alternative Name:"

echo ""
echo "=================================================="
print_success "🔒 SSL certificates created successfully!"
print_status ""
print_status "Certificate files created:"
print_status "  📄 CA Certificate: /etc/ssl/certs/cryb-ca.crt"
print_status "  📄 Server Certificate: /etc/ssl/certs/cryb.crt"
print_status "  🔐 Server Private Key: /etc/ssl/private/cryb.key"
print_status "  📦 Certificate Bundle: /etc/ssl/certs/cryb-bundle.crt"
print_status "  🔧 DH Parameters: /etc/ssl/certs/dhparam.pem"
print_status ""
print_warning "⚠️  These are self-signed certificates!"
print_status "For production, replace with certificates from a trusted CA like:"
print_status "  • Let's Encrypt (free)"
print_status "  • DigiCert, GlobalSign, etc. (paid)"
print_status ""
print_status "Next steps:"
print_status "1. Configure nginx to use these certificates"
print_status "2. Update /etc/hosts to point domains to localhost"
print_status "3. Test HTTPS connections"
print_status ""
print_status "View certificate info: cat /etc/ssl/certs/cryb-cert-info.txt"
echo "=================================================="