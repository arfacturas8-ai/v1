#!/bin/bash

# CRYB Platform PostgreSQL Production Deployment Script
# This script sets up PostgreSQL database for production deployment

set -e

echo "🚀 CRYB Platform PostgreSQL Production Deployment"
echo "================================================="

# Check if running as root or with sudo access
if [[ $EUID -eq 0 ]]; then
   echo "⚠️  This script should not be run as root"
   exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
DB_NAME="${DB_NAME:-cryb_platform}"
DB_USER="${DB_USER:-cryb_user}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
API_PORT="${API_PORT:-4000}"

# Check if PostgreSQL is installed
echo -e "${BLUE}1. Checking PostgreSQL installation...${NC}"
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL is not installed${NC}"
    echo "Installing PostgreSQL..."
    
    # Update package list
    sudo apt update
    
    # Install PostgreSQL
    sudo apt install -y postgresql postgresql-contrib
    
    # Start and enable PostgreSQL
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    
    echo -e "${GREEN}✅ PostgreSQL installed successfully${NC}"
else
    echo -e "${GREEN}✅ PostgreSQL is already installed${NC}"
fi

# Check if database exists, create if not
echo -e "${BLUE}2. Setting up database...${NC}"

# Generate secure password if not provided
if [ -z "$DB_PASSWORD" ]; then
    DB_PASSWORD=$(openssl rand -base64 32)
    echo -e "${YELLOW}🔐 Generated database password: $DB_PASSWORD${NC}"
    echo -e "${YELLOW}⚠️  Please save this password securely!${NC}"
fi

# Create database and user
sudo -u postgres bash -c "
    # Create database if it doesn't exist
    if ! psql -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
        createdb $DB_NAME
        echo 'Database $DB_NAME created'
    else
        echo 'Database $DB_NAME already exists'
    fi
    
    # Create user if it doesn't exist and set password
    psql -c \"
        DO \\\$\\\$
        BEGIN
            IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = '$DB_USER') THEN
                CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
            END IF;
        END
        \\\$\\\$;
    \"
    
    # Grant privileges
    psql -c 'GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;'
    psql -c 'ALTER DATABASE $DB_NAME OWNER TO $DB_USER;'
"

echo -e "${GREEN}✅ Database setup completed${NC}"

# Run database schema initialization
echo -e "${BLUE}3. Initializing database schema...${NC}"
if [ -f "init-database.sql" ]; then
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f init-database.sql
    echo -e "${GREEN}✅ Database schema initialized${NC}"
else
    echo -e "${RED}❌ init-database.sql not found${NC}"
    echo "Please ensure init-database.sql is in the current directory"
    exit 1
fi

# Install Node.js dependencies
echo -e "${BLUE}4. Installing Node.js dependencies...${NC}"
if [ -f "package.json" ]; then
    # Try pnpm first, fallback to npm
    if command -v pnpm &> /dev/null; then
        cd /home/ubuntu/cryb-platform && pnpm add pg --filter @cryb/api
    else
        npm install pg
    fi
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️  package.json not found, skipping dependency installation${NC}"
fi

# Create environment file
echo -e "${BLUE}5. Creating environment configuration...${NC}"
cat > .env.production << EOF
# CRYB Platform Production Configuration
NODE_ENV=production
PORT=$API_PORT

# Database Configuration
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

# Connection Pool Settings
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=10000

# Security
JWT_SECRET=$(openssl rand -base64 64)
API_SECRET=$(openssl rand -base64 32)
EOF

echo -e "${GREEN}✅ Environment configuration created${NC}"

# Create systemd service file for production
echo -e "${BLUE}6. Creating systemd service...${NC}"
sudo tee /etc/systemd/system/cryb-api.service > /dev/null << EOF
[Unit]
Description=CRYB Platform API
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=ubuntu
Group=ubuntu
WorkingDirectory=$(pwd)
Environment=NODE_ENV=production
EnvironmentFile=$(pwd)/.env.production
ExecStart=/usr/bin/node complete-working-api.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# Security settings
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ReadWritePaths=$(pwd)

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable service
sudo systemctl daemon-reload
sudo systemctl enable cryb-api.service

echo -e "${GREEN}✅ Systemd service created and enabled${NC}"

# Test database connection
echo -e "${BLUE}7. Testing database connection...${NC}"
if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" > /dev/null; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    exit 1
fi

# Create startup script
echo -e "${BLUE}8. Creating management scripts...${NC}"
cat > start-api.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting CRYB API..."
sudo systemctl start cryb-api.service
sudo systemctl status cryb-api.service
EOF

cat > stop-api.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping CRYB API..."
sudo systemctl stop cryb-api.service
EOF

cat > restart-api.sh << 'EOF'
#!/bin/bash
echo "🔄 Restarting CRYB API..."
sudo systemctl restart cryb-api.service
sudo systemctl status cryb-api.service
EOF

cat > status-api.sh << 'EOF'
#!/bin/bash
echo "📊 CRYB API Status:"
sudo systemctl status cryb-api.service
echo ""
echo "📈 Recent logs:"
sudo journalctl -u cryb-api.service -n 20 --no-pager
EOF

chmod +x start-api.sh stop-api.sh restart-api.sh status-api.sh

echo -e "${GREEN}✅ Management scripts created${NC}"

# Display deployment summary
echo ""
echo -e "${GREEN}🎉 CRYB Platform PostgreSQL Deployment Complete!${NC}"
echo -e "${BLUE}=================================================${NC}"
echo ""
echo -e "${YELLOW}Configuration Summary:${NC}"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Host: $DB_HOST:$DB_PORT"
echo "  API Port: $API_PORT"
echo ""
echo -e "${YELLOW}Management Commands:${NC}"
echo "  Start API:   ./start-api.sh"
echo "  Stop API:    ./stop-api.sh"
echo "  Restart API: ./restart-api.sh"
echo "  Status:      ./status-api.sh"
echo "  Logs:        sudo journalctl -u cryb-api.service -f"
echo ""
echo -e "${YELLOW}Important Files:${NC}"
echo "  Config:      .env.production"
echo "  Service:     /etc/systemd/system/cryb-api.service"
echo "  Schema:      init-database.sql"
echo ""
echo -e "${RED}⚠️  IMPORTANT: Save the database password securely!${NC}"
echo -e "${BLUE}Password: $DB_PASSWORD${NC}"
echo ""
echo -e "${GREEN}To start the API: ./start-api.sh${NC}"