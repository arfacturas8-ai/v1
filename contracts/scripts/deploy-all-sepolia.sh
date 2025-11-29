#!/bin/bash

##############################################
# CRYB Platform - Complete Sepolia Deployment
# Deploys all 9 contracts in dependency order
##############################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "=============================================="
echo "  CRYB PLATFORM - SEPOLIA DEPLOYMENT"
echo "=============================================="
echo ""

# Check if we're in the right directory
if [ ! -f "hardhat.config.js" ]; then
    echo -e "${RED}❌ Error: hardhat.config.js not found${NC}"
    echo "   Please run this script from the contracts directory"
    exit 1
fi

# Check prerequisites first
echo -e "${BLUE}[0/9] Checking prerequisites...${NC}"
echo ""

if [ -z "$ALCHEMY_API_KEY" ] && [ -z "$SEPOLIA_RPC_URL" ]; then
    echo -e "${RED}❌ Error: ALCHEMY_API_KEY or SEPOLIA_RPC_URL not set${NC}"
    echo "   Please set one of these environment variables in .env file"
    echo ""
    echo "   Option 1: Set ALCHEMY_API_KEY"
    echo "   Option 2: Set SEPOLIA_RPC_URL (full RPC URL)"
    echo ""
    exit 1
fi

if [ -z "$PRIVATE_KEY" ]; then
    echo -e "${RED}❌ Error: PRIVATE_KEY not set${NC}"
    echo "   Please set PRIVATE_KEY in .env file"
    echo ""
    exit 1
fi

# Run prerequisites check
node scripts/check-prerequisites.js
PREREQ_EXIT=$?

if [ $PREREQ_EXIT -ne 0 ]; then
    echo ""
    echo -e "${RED}❌ Prerequisites check failed${NC}"
    echo "   Please fix the issues above before deploying"
    echo ""
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""
read -p "Press ENTER to start deployment (or Ctrl+C to cancel)..."
echo ""

# Deploy contracts in order
echo "=============================================="
echo "  STARTING DEPLOYMENT SEQUENCE"
echo "=============================================="
echo ""

# Track deployment time
START_TIME=$(date +%s)

# 1. Deploy CRYB Token
echo -e "${BLUE}[1/9] Deploying CRYB Token...${NC}"
npx hardhat run scripts/deploy-1-token.js --network sepolia
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Token deployment failed${NC}"
    exit 1
fi
echo ""

# 2. Deploy Treasury
echo -e "${BLUE}[2/9] Deploying Treasury...${NC}"
npx hardhat run scripts/deploy-2-treasury.js --network sepolia
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Treasury deployment failed${NC}"
    exit 1
fi
echo ""

# 3. Deploy Staking
echo -e "${BLUE}[3/9] Deploying Staking...${NC}"
npx hardhat run scripts/deploy-3-staking.js --network sepolia
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Staking deployment failed${NC}"
    exit 1
fi
echo ""

# 4. Deploy Governance
echo -e "${BLUE}[4/9] Deploying Governance...${NC}"
npx hardhat run scripts/deploy-4-governance.js --network sepolia
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Governance deployment failed${NC}"
    exit 1
fi
echo ""

# 5. Deploy Community NFT
echo -e "${BLUE}[5/9] Deploying Community NFT...${NC}"
npx hardhat run scripts/deploy-5-nft.js --network sepolia
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ NFT deployment failed${NC}"
    exit 1
fi
echo ""

# 6. Deploy NFT Marketplace
echo -e "${BLUE}[6/9] Deploying NFT Marketplace...${NC}"
npx hardhat run scripts/deploy-6-marketplace.js --network sepolia
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Marketplace deployment failed${NC}"
    exit 1
fi
echo ""

# 7. Deploy Token Gating
echo -e "${BLUE}[7/9] Deploying Token Gating...${NC}"
npx hardhat run scripts/deploy-7-tokengating.js --network sepolia
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Token Gating deployment failed${NC}"
    exit 1
fi
echo ""

# 8. Deploy Tipping
echo -e "${BLUE}[8/9] Deploying Tipping Contract...${NC}"
npx hardhat run scripts/deploy-8-tipping.js --network sepolia
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Tipping deployment failed${NC}"
    exit 1
fi
echo ""

# 9. Deploy Subscription
echo -e "${BLUE}[9/9] Deploying Subscription...${NC}"
npx hardhat run scripts/deploy-9-subscription.js --network sepolia
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Subscription deployment failed${NC}"
    exit 1
fi
echo ""

# Calculate deployment time
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

# Generate consolidated deployment report
echo ""
echo "=============================================="
echo "  DEPLOYMENT COMPLETE!"
echo "=============================================="
echo ""
echo -e "${GREEN}✅ All 9 contracts deployed successfully${NC}"
echo ""
echo "⏱️  Total time: ${MINUTES}m ${SECONDS}s"
echo ""

# Consolidate deployment data
node scripts/consolidate-deployments.js sepolia

echo ""
echo "📋 Deployment files saved in ./deployments/"
echo ""
echo "=============================================="
echo "  NEXT STEPS"
echo "=============================================="
echo ""
echo "1. Verify contracts on Etherscan:"
echo "   ${YELLOW}npm run verify:sepolia${NC}"
echo ""
echo "2. Update frontend with contract addresses:"
echo "   ${YELLOW}npm run update-frontend${NC}"
echo ""
echo "3. Configure contracts (if needed):"
echo "   - Fund staking contract with rewards"
echo "   - Set up initial governance proposals"
echo "   - Configure NFT metadata"
echo ""
echo "=============================================="
echo ""
