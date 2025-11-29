#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}   CRYB Platform - Testnet Deployment   ${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
  echo -e "${RED}❌ Missing .env file${NC}"
  echo ""
  echo -e "${YELLOW}Please create .env file with:${NC}"
  echo "   PRIVATE_KEY=your_private_key"
  echo "   ALCHEMY_API_KEY=your_alchemy_key"
  echo "   SEPOLIA_RPC_URL=https://eth-sepolia.alchemyapi.io/v2/\${ALCHEMY_API_KEY}"
  echo "   ETHERSCAN_API_KEY=your_etherscan_key (optional)"
  echo ""
  echo -e "${YELLOW}See TESTNET_DEPLOYMENT_GUIDE.md for detailed instructions${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Environment file found${NC}"

# Load environment variables
source .env

# Check for required variables
if [ -z "$PRIVATE_KEY" ]; then
  echo -e "${RED}❌ PRIVATE_KEY not set in .env${NC}"
  exit 1
fi

if [ -z "$ALCHEMY_API_KEY" ] || [ "$ALCHEMY_API_KEY" == "YOUR_ALCHEMY_API_KEY_HERE" ]; then
  echo -e "${RED}❌ ALCHEMY_API_KEY not configured in .env${NC}"
  echo -e "${YELLOW}Get your API key from: https://www.alchemy.com/${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Environment configured${NC}"
echo ""

# Check wallet balance
echo -e "${BLUE}📊 Checking wallet balance...${NC}"
node scripts/check-wallet.js

echo ""
read -p "Do you want to continue with deployment? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Deployment cancelled${NC}"
  exit 0
fi

# Compile contracts
echo ""
echo -e "${BLUE}📦 Compiling contracts...${NC}"
npm run compile

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Compilation failed${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Contracts compiled successfully${NC}"
echo ""

# Deploy contracts
echo -e "${BLUE}🚀 Deploying to Sepolia testnet...${NC}"
echo -e "${YELLOW}This will take several minutes. Please be patient...${NC}"
echo ""

npx hardhat run scripts/deploy-all-contracts.js --network sepolia

if [ $? -ne 0 ]; then
  echo ""
  echo -e "${RED}❌ Deployment failed${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE!${NC}"
echo ""

# Check if deployment file exists
if [ -f deployments/sepolia-latest.json ]; then
  echo -e "${BLUE}📄 Deployment info saved to: ${GREEN}deployments/sepolia-latest.json${NC}"
  echo ""

  # Extract and display contract addresses
  echo -e "${BLUE}📋 Deployed Contract Addresses:${NC}"
  echo -e "${BLUE}================================${NC}"

  if command -v jq &> /dev/null; then
    # Use jq if available for pretty printing
    jq -r '.contracts | to_entries[] | "\(.key): \(.value.address)"' deployments/sepolia-latest.json
  else
    # Fallback to grep
    grep -A 1 '"address"' deployments/sepolia-latest.json
  fi

  echo ""
fi

# Ask about verification
echo ""
read -p "Do you want to verify contracts on Etherscan? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  if [ -z "$ETHERSCAN_API_KEY" ] || [ "$ETHERSCAN_API_KEY" == "YOUR_ETHERSCAN_API_KEY_HERE" ]; then
    echo -e "${YELLOW}⚠️  ETHERSCAN_API_KEY not configured${NC}"
    echo -e "${YELLOW}Get your API key from: https://etherscan.io/myapikey${NC}"
    echo -e "${YELLOW}Then run verification manually${NC}"
  else
    echo -e "${BLUE}✅ Verifying contracts on Etherscan...${NC}"
    echo -e "${YELLOW}This may take a few minutes...${NC}"
    echo ""
    # Run verification script if it exists
    if [ -f scripts/verify-all-sepolia.js ]; then
      node scripts/verify-all-sepolia.js
    else
      echo -e "${YELLOW}Verification script not found. Use commands from deployment output.${NC}"
    fi
  fi
fi

# Generate frontend files
echo ""
echo -e "${BLUE}📝 Generating frontend integration files...${NC}"
npm run generate-frontend-files 2>/dev/null || echo -e "${YELLOW}⚠️  Frontend file generation script not found${NC}"

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}   ✅ DEPLOYMENT PROCESS COMPLETE!   ${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${BLUE}📝 Next Steps:${NC}"
echo "1. View deployment info: ${GREEN}cat deployments/sepolia-latest.json${NC}"
echo "2. Test contracts on Sepolia Etherscan"
echo "3. Update frontend with contract addresses"
echo "4. Run integration tests"
echo ""
echo -e "${YELLOW}For detailed instructions, see: ${GREEN}TESTNET_DEPLOYMENT_GUIDE.md${NC}"
echo ""
