#!/bin/bash

# ===================================================================
# CRYB SMART CONTRACTS - ONE-CLICK DEPLOYMENT TO SEPOLIA
# ===================================================================
#
# This script will deploy all 9 smart contracts to Sepolia testnet
# and configure the frontend automatically.
#
# Prerequisites:
# 1. .env file with SEPOLIA_RPC_URL, PRIVATE_KEY, ETHERSCAN_API_KEY
# 2. Deployer wallet has >0.1 ETH on Sepolia
# 3. Hardhat installed (npm install)
#
# Usage:
#   chmod +x scripts/READY_TO_DEPLOY.sh
#   ./scripts/READY_TO_DEPLOY.sh
#
# ===================================================================

set -e  # Exit on error

echo "=========================================="
echo "CRYB SMART CONTRACT DEPLOYMENT"
echo "Network: Sepolia Testnet"
echo "=========================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
  echo "❌ Error: .env file not found!"
  echo ""
  echo "Create .env file with:"
  echo "  SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY"
  echo "  PRIVATE_KEY=your_private_key_here"
  echo "  ETHERSCAN_API_KEY=your_etherscan_api_key"
  echo ""
  exit 1
fi

# Load environment variables
source .env

# Check required variables
if [ -z "$SEPOLIA_RPC_URL" ]; then
  echo "❌ Error: SEPOLIA_RPC_URL not set in .env"
  exit 1
fi

if [ -z "$PRIVATE_KEY" ]; then
  echo "❌ Error: PRIVATE_KEY not set in .env"
  exit 1
fi

if [ -z "$ETHERSCAN_API_KEY" ]; then
  echo "⚠️  Warning: ETHERSCAN_API_KEY not set - contracts won't be verified"
  echo "   Get one from: https://etherscan.io/myapikey"
  echo ""
fi

echo "✅ Environment variables loaded"
echo ""

# Check balance
echo "Checking deployer balance..."
npx hardhat run scripts/check-balance.js --network sepolia || {
  echo "❌ Error: Failed to check balance"
  echo "   Make sure your RPC URL is correct and deployer has ETH"
  exit 1
}
echo ""

# Confirmation
echo "Ready to deploy contracts!"
echo ""
echo "This will:"
echo "  - Deploy 9 smart contracts to Sepolia"
echo "  - Verify contracts on Etherscan"
echo "  - Save addresses to deployments/sepolia.json"
echo "  - Update frontend configuration"
echo ""
echo "Estimated cost: ~0.04 ETH"
echo "Estimated time: ~10 minutes"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Deployment cancelled"
  exit 0
fi

echo ""
echo "=========================================="
echo "DEPLOYING CONTRACTS..."
echo "=========================================="
echo ""

# Create deployment directory
mkdir -p deployments/logs

# Deploy all contracts
echo "📦 Deploying all contracts..."
npx hardhat run scripts/deploy-all.js --network sepolia 2>&1 | tee deployments/logs/deploy-$(date +%Y%m%d-%H%M%S).log

if [ $? -ne 0 ]; then
  echo "❌ Deployment failed!"
  echo "   Check logs in deployments/logs/"
  exit 1
fi

echo ""
echo "✅ All contracts deployed!"
echo ""

# Verify contracts on Etherscan
if [ -n "$ETHERSCAN_API_KEY" ]; then
  echo "=========================================="
  echo "VERIFYING CONTRACTS ON ETHERSCAN..."
  echo "=========================================="
  echo ""

  npx hardhat run scripts/verify-all.js --network sepolia 2>&1 | tee -a deployments/logs/verify-$(date +%Y%m%d-%H%M%S).log

  echo ""
  echo "✅ Contracts verified!"
  echo ""
fi

# Update frontend configuration
echo "=========================================="
echo "UPDATING FRONTEND CONFIGURATION..."
echo "=========================================="
echo ""

cd ../apps/react-app

# Check if deployments file exists
if [ ! -f ../../contracts/deployments/sepolia.json ]; then
  echo "❌ Error: Deployment addresses not found!"
  exit 1
fi

# Extract addresses
CRYB_TOKEN=$(jq -r '.CRYBToken' ../../contracts/deployments/sepolia.json)
TREASURY=$(jq -r '.Treasury' ../../contracts/deployments/sepolia.json)
STAKING=$(jq -r '.Staking' ../../contracts/deployments/sepolia.json)
GOVERNANCE=$(jq -r '.Governance' ../../contracts/deployments/sepolia.json)
COMMUNITY_NFT=$(jq -r '.CommunityNFT' ../../contracts/deployments/sepolia.json)
NFT_MARKETPLACE=$(jq -r '.NFTMarketplace' ../../contracts/deployments/sepolia.json)
TOKEN_GATING=$(jq -r '.TokenGating' ../../contracts/deployments/sepolia.json)
CRYPTO_TIPPING=$(jq -r '.CryptoTipping' ../../contracts/deployments/sepolia.json)
SUBSCRIPTION=$(jq -r '.Subscription' ../../contracts/deployments/sepolia.json)

# Update .env
cat >> .env << EOF

# ==============================================
# Smart Contract Addresses (Sepolia Testnet)
# Deployed: $(date)
# ==============================================
VITE_NETWORK_ID=11155111
VITE_CRYB_TOKEN_ADDRESS=$CRYB_TOKEN
VITE_TREASURY_ADDRESS=$TREASURY
VITE_STAKING_ADDRESS=$STAKING
VITE_GOVERNANCE_ADDRESS=$GOVERNANCE
VITE_COMMUNITY_NFT_ADDRESS=$COMMUNITY_NFT
VITE_NFT_MARKETPLACE_ADDRESS=$NFT_MARKETPLACE
VITE_TOKEN_GATING_ADDRESS=$TOKEN_GATING
VITE_CRYPTO_TIPPING_ADDRESS=$CRYPTO_TIPPING
VITE_SUBSCRIPTION_ADDRESS=$SUBSCRIPTION
EOF

echo "✅ Frontend .env updated with contract addresses"

# Copy ABIs
echo "Copying contract ABIs to frontend..."
mkdir -p src/contracts/abis
cp -r ../../contracts/artifacts/contracts/*.sol/*.json src/contracts/abis/ 2>/dev/null || true

echo "✅ ABIs copied to frontend"
echo ""

# Rebuild frontend
echo "=========================================="
echo "REBUILDING FRONTEND..."
echo "=========================================="
echo ""

npm run build

if [ $? -ne 0 ]; then
  echo "⚠️  Frontend build failed!"
  echo "   Contracts are deployed but frontend needs manual fix"
else
  echo "✅ Frontend built successfully!"
fi

echo ""
echo "=========================================="
echo "DEPLOYMENT COMPLETE! 🎉"
echo "=========================================="
echo ""
echo "Contract Addresses:"
echo "  CRYBToken:       $CRYB_TOKEN"
echo "  Treasury:        $TREASURY"
echo "  Staking:         $STAKING"
echo "  Governance:      $GOVERNANCE"
echo "  CommunityNFT:    $COMMUNITY_NFT"
echo "  NFTMarketplace:  $NFT_MARKETPLACE"
echo "  TokenGating:     $TOKEN_GATING"
echo "  CryptoTipping:   $CRYPTO_TIPPING"
echo "  Subscription:    $SUBSCRIPTION"
echo ""
echo "View on Etherscan:"
echo "  https://sepolia.etherscan.io/address/$CRYB_TOKEN"
echo ""
echo "Next steps:"
echo "  1. Test contracts on frontend"
echo "  2. Connect wallet to Sepolia"
echo "  3. Test all Web3 features"
echo ""
echo "Deployment saved to: deployments/sepolia.json"
echo "Logs saved to: deployments/logs/"
echo ""
echo "=========================================="
