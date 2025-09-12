#!/bin/bash

# Install systemd service files as backup to PM2
# These can be used if PM2 fails or as an alternative process manager

echo "Installing CRYB systemd service files..."

# Copy service files to systemd directory
sudo cp /home/ubuntu/cryb-platform/systemd/cryb-api.service /etc/systemd/system/
sudo cp /home/ubuntu/cryb-platform/systemd/cryb-web.service /etc/systemd/system/

# Reload systemd and enable services (but don't start them since PM2 is running)
sudo systemctl daemon-reload

echo "Systemd backup services installed successfully!"
echo "To use instead of PM2:"
echo "  sudo systemctl stop pm2-ubuntu"
echo "  sudo systemctl disable pm2-ubuntu" 
echo "  sudo systemctl enable cryb-api cryb-web"
echo "  sudo systemctl start cryb-api cryb-web"
echo ""
echo "To switch back to PM2:"
echo "  sudo systemctl stop cryb-api cryb-web"
echo "  sudo systemctl disable cryb-api cryb-web"
echo "  sudo systemctl enable pm2-ubuntu"
echo "  sudo systemctl start pm2-ubuntu"