#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}   CRYB Platform - Environment Setup    ${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Check if .env already exists
if [ -f .env ]; then
  echo -e "${YELLOW}⚠️  .env file already exists${NC}"
  read -p "Do you want to overwrite it? (y/n) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}Keeping existing .env file${NC}"
    exit 0
  fi
  mv .env .env.backup
  echo -e "${GREEN}✅ Backed up existing .env to .env.backup${NC}"
fi

echo -e "${BLUE}📝 Setting up .env file...${NC}"
echo ""

# Get user inputs
echo -e "${YELLOW}Please provide the following information:${NC}"
echo ""

echo -e "${BLUE}1. Alchemy API Key${NC}"
echo "   Get yours from: https://www.alchemy.com/"
read -p "   Enter Alchemy API Key: " ALCHEMY_KEY
echo ""

echo -e "${BLUE}2. Etherscan API Key (optional, press Enter to skip)${NC}"
echo "   Get yours from: https://etherscan.io/myapikey"
read -p "   Enter Etherscan API Key: " ETHERSCAN_KEY
echo ""

# Use existing private key or generate new one
echo -e "${BLUE}3. Wallet Private Key${NC}"
echo -e "${YELLOW}   Current wallet: 0x01fdc7c29D8e8A70c334ba38ea510266b32B98C0${NC}"
read -p "   Use existing test wallet? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  PRIVATE_KEY="9a722d3b9c4c8df11e8e7b8404c1e4c871375a6b19065a5f916552336f4c437a"
  WALLET_ADDRESS="0x01fdc7c29D8e8A70c334ba38ea510266b32B98C0"
else
  read -p "   Enter your private key (without 0x prefix): " PRIVATE_KEY
  WALLET_ADDRESS="(run 'node scripts/check-wallet.js' to see address)"
fi

# Create .env file
cat > .env << EOF
# CRYB Smart Contract Deployment Configuration
# Generated: $(date)

# Wallet Configuration
PRIVATE_KEY=$PRIVATE_KEY

# API Keys
ALCHEMY_API_KEY=${ALCHEMY_KEY:-YOUR_ALCHEMY_API_KEY_HERE}
ETHERSCAN_API_KEY=${ETHERSCAN_KEY:-YOUR_ETHERSCAN_API_KEY_HERE}

# Network Configuration
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/\${ALCHEMY_API_KEY}
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/\${ALCHEMY_API_KEY}

# Verification Settings
VERIFY_CONTRACTS=true
REPORT_GAS=false

# ============================================
# Wallet Address: $WALLET_ADDRESS
#
# Next Steps:
# 1. Get Sepolia ETH from: https://sepoliafaucet.com/
# 2. Run: npm run compile
# 3. Run: ./deploy-testnet.sh
# ============================================
EOF

echo ""
echo -e "${GREEN}✅ .env file created successfully!${NC}"
echo ""

# Display wallet info
echo -e "${BLUE}📍 Your Configuration:${NC}"
echo "   Wallet: $WALLET_ADDRESS"
echo "   Alchemy: ${ALCHEMY_KEY:0:10}...${ALCHEMY_KEY: -4}"
if [ -n "$ETHERSCAN_KEY" ]; then
  echo "   Etherscan: ${ETHERSCAN_KEY:0:10}...${ETHERSCAN_KEY: -4}"
else
  echo "   Etherscan: Not configured (optional)"
fi
echo ""

# Check wallet balance
echo -e "${BLUE}📊 Checking wallet balance...${NC}"
node scripts/check-wallet.js

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}   ✅ SETUP COMPLETE!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${BLUE}📝 Next Steps:${NC}"
echo "1. Get Sepolia ETH from: ${GREEN}https://sepoliafaucet.com/${NC}"
echo "2. Run: ${GREEN}npm run compile${NC}"
echo "3. Run: ${GREEN}./deploy-testnet.sh${NC}"
echo ""
echo -e "${YELLOW}For detailed instructions, see: TESTNET_DEPLOYMENT_GUIDE.md${NC}"
echo ""
