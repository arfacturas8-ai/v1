# Web3 Smart Contract Deployment Guide

## 🎯 Quick Start

This guide will help you deploy all 9 CRYB smart contracts to Sepolia testnet in ~30 minutes.

---

## 📋 Prerequisites

Before deploying, you need:

### 1. Sepolia Testnet ETH
- **Amount needed**: 0.1 ETH (for deployment + gas)
- **Get from**:
  - https://sepoliafaucet.com
  - https://www.alchemy.com/faucets/ethereum-sepolia
  - https://sepolia-faucet.pk910.de

### 2. Alchemy API Key
- **Get from**: https://dashboard.alchemy.com
- Create account → Create new app → Select "Sepolia" network
- Copy API key

### 3. Deployer Wallet Private Key
- **IMPORTANT**: Use a testnet-only wallet
- **NEVER** use your mainnet wallet
- Create new wallet in MetaMask for testing

### 4. Etherscan API Key (for verification)
- **Get from**: https://etherscan.io/myapikey
- Create account → API Keys → Create new key

---

## 🚀 Deployment Steps

### Step 1: Setup Environment

```bash
cd /home/ubuntu/cryb-platform/contracts

# Create .env file
cat > .env << EOF
# Network RPC
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY

# Deployer wallet (TESTNET ONLY!)
PRIVATE_KEY=your_private_key_here

# Etherscan (for verification)
ETHERSCAN_API_KEY=your_etherscan_api_key
EOF

# Secure the file
chmod 600 .env
```

### Step 2: Verify Connection

```bash
# Test RPC connection
curl -X POST $SEPOLIA_RPC_URL \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Should return latest block number
```

### Step 3: Check Balance

```bash
# Check deployer has enough ETH
npx hardhat run scripts/check-balance.js --network sepolia

# Expected output:
# Deployer: 0x...
# Balance: 0.15 ETH ✅
# Ready to deploy!
```

### Step 4: Deploy All Contracts

```bash
# Run deployment script
npx hardhat run scripts/deploy-all.js --network sepolia

# This will deploy all 9 contracts in correct order:
# 1. CRYBToken
# 2. Treasury
# 3. Staking
# 4. Governance
# 5. CommunityNFT
# 6. NFTMarketplace
# 7. TokenGating
# 8. CryptoTipping
# 9. Subscription

# Expected time: 5-7 minutes
# Expected gas cost: ~0.04 ETH
```

### Step 5: Verify on Etherscan

```bash
# Verify all contracts
npx hardhat run scripts/verify-all.js --network sepolia

# Each contract will show:
# ✅ CRYBToken verified at https://sepolia.etherscan.io/address/0x...
# ✅ Treasury verified at https://sepolia.etherscan.io/address/0x...
# etc.
```

### Step 6: Update Frontend

```bash
cd /home/ubuntu/cryb-platform/apps/react-app

# Addresses will be automatically saved to:
cat contracts/deployments/sepolia.json

# Copy to frontend .env
cat >> .env << EOF

# Smart Contract Addresses (Sepolia)
VITE_NETWORK_ID=11155111
VITE_CRYB_TOKEN_ADDRESS=$(jq -r '.CRYBToken' ../../../contracts/deployments/sepolia.json)
VITE_TREASURY_ADDRESS=$(jq -r '.Treasury' ../../../contracts/deployments/sepolia.json)
VITE_STAKING_ADDRESS=$(jq -r '.Staking' ../../../contracts/deployments/sepolia.json)
VITE_GOVERNANCE_ADDRESS=$(jq -r '.Governance' ../../../contracts/deployments/sepolia.json)
VITE_COMMUNITY_NFT_ADDRESS=$(jq -r '.CommunityNFT' ../../../contracts/deployments/sepolia.json)
VITE_NFT_MARKETPLACE_ADDRESS=$(jq -r '.NFTMarketplace' ../../../contracts/deployments/sepolia.json)
VITE_TOKEN_GATING_ADDRESS=$(jq -r '.TokenGating' ../../../contracts/deployments/sepolia.json)
VITE_CRYPTO_TIPPING_ADDRESS=$(jq -r '.CryptoTipping' ../../../contracts/deployments/sepolia.json)
VITE_SUBSCRIPTION_ADDRESS=$(jq -r '.Subscription' ../../../contracts/deployments/sepolia.json)
EOF

# Copy ABIs
mkdir -p src/contracts/abis
cp -r ../../../contracts/artifacts/contracts/*.sol/*.json src/contracts/abis/

# Rebuild frontend
npm run build
```

### Step 7: Test Integration

```bash
# Test that frontend can read contracts
node scripts/test-contract-integration.js

# Expected output:
# ✅ CRYBToken: CRYB Token (CRYB)
# ✅ Treasury: Connected
# ✅ Staking: Connected
# ✅ All contracts accessible!
```

---

## 📊 Deployment Cost Estimate

| Contract | Estimated Gas | Est. Cost (10 gwei) |
|----------|--------------|---------------------|
| CRYBToken | 500,000 | 0.005 ETH |
| Treasury | 300,000 | 0.003 ETH |
| Staking | 400,000 | 0.004 ETH |
| Governance | 600,000 | 0.006 ETH |
| CommunityNFT | 400,000 | 0.004 ETH |
| NFTMarketplace | 500,000 | 0.005 ETH |
| TokenGating | 300,000 | 0.003 ETH |
| CryptoTipping | 200,000 | 0.002 ETH |
| Subscription | 400,000 | 0.004 ETH |
| **TOTAL** | **3,600,000** | **~0.036 ETH** |

**Recommended**: Have 0.1 ETH to cover gas fluctuations and testing.

---

## 🔍 Verification

After deployment, verify everything is working:

### Check on Etherscan

Visit each contract address on Sepolia Etherscan:
- Should show green checkmark (verified)
- Contract code should be readable
- ABI should be available

### Test Contract Functions

```bash
# Test CRYBToken
npx hardhat run scripts/test-token.js --network sepolia

# Test Staking
npx hardhat run scripts/test-staking.js --network sepolia

# Test all
npx hardhat test --network sepolia
```

---

## 🎯 Success Criteria

After deployment, you should have:

- [ ] All 9 contracts deployed to Sepolia
- [ ] All contracts verified on Etherscan (green checkmark)
- [ ] Contract addresses saved to `deployments/sepolia.json`
- [ ] Frontend `.env` updated with addresses
- [ ] ABIs copied to frontend
- [ ] Test transactions successful
- [ ] Frontend can read contract data

---

## 🐛 Troubleshooting

### Error: "Insufficient funds"
- Check deployer balance: `npx hardhat run scripts/check-balance.js --network sepolia`
- Get more testnet ETH from faucets listed above

### Error: "Invalid API key"
- Verify Alchemy API key is correct in `.env`
- Make sure you selected Sepolia network in Alchemy dashboard

### Error: "Contract already deployed"
- This is OK! Script will detect and use existing address
- Or delete `deployments/sepolia.json` to redeploy

### Error: "Verification failed"
- Wait 30 seconds and try again (Etherscan indexing delay)
- Check Etherscan API key is valid
- Verify contract was actually deployed

---

## 📞 Support

If you encounter issues:

1. Check the error message carefully
2. Verify all prerequisites are met
3. Check `deployments/logs/` for detailed logs
4. Review transaction on Sepolia Etherscan

---

## 🎉 Next Steps

After successful deployment:

1. Update frontend environment variables
2. Test Web3 features in frontend
3. Share contract addresses with team
4. Begin user acceptance testing
5. Prepare for mainnet deployment

---

**Generated**: November 2025
**Network**: Sepolia Testnet
**Status**: Ready for deployment when credentials are provided
