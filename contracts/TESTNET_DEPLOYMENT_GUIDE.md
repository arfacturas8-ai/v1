# CRYB Platform - Smart Contracts Testnet Deployment Guide

## Overview

This guide will help you deploy all 9 CRYB Platform smart contracts to the Sepolia testnet. The deployment is fully automated but requires some initial setup.

---

## Prerequisites

### 1. Get Sepolia ETH (FREE)

Sepolia testnet ETH is required to pay for gas fees during deployment. Visit these faucets:

- **Alchemy Sepolia Faucet**: https://sepoliafaucet.com/
- **Infura Sepolia Faucet**: https://www.infura.io/faucet/sepolia
- **QuickNode Faucet**: https://faucet.quicknode.com/ethereum/sepolia
- **Sepolia PoW Faucet**: https://sepolia-faucet.pk910.de/

**Wallet Address**: `0x01fdc7c29D8e8A70c334ba38ea510266b32B98C0`

**Amount needed**: ~0.5 ETH (free testnet ETH, for deployment gas fees)

### 2. Get Alchemy API Key (FREE)

1. Sign up at https://www.alchemy.com/
2. Click "Create New App"
3. Select:
   - Chain: Ethereum
   - Network: Sepolia
4. Copy your API key from the dashboard

### 3. Get Etherscan API Key (FREE - Optional but recommended)

1. Sign up at https://etherscan.io/
2. Go to "API Keys" section in your account
3. Click "Add" to create a new API key
4. Copy the API key

---

## Quick Start - Deployment in 5 Minutes

### Step 1: Configure Environment

```bash
cd /home/ubuntu/cryb-platform/contracts

# Edit the .env file
nano .env

# Replace these values:
# - Replace YOUR_ALCHEMY_API_KEY_HERE with your actual Alchemy API key
# - Replace YOUR_ETHERSCAN_API_KEY_HERE with your Etherscan API key (or leave for later)
```

Your `.env` should look like this:

```env
PRIVATE_KEY=9a722d3b9c4c8df11e8e7b8404c1e4c871375a6b19065a5f916552336f4c437a
ALCHEMY_API_KEY=your_actual_alchemy_key_here
ETHERSCAN_API_KEY=your_actual_etherscan_key_here
SEPOLIA_RPC_URL=https://eth-sepolia.alchemyapi.io/v2/${ALCHEMY_API_KEY}
```

### Step 2: Verify Setup

```bash
# Check that contracts compile
npm run compile

# Check wallet balance
node scripts/check-wallet.js
```

### Step 3: Deploy All Contracts

```bash
# Run the automated deployment script
npx hardhat run scripts/deploy-all-contracts.js --network sepolia
```

### Step 4: Verify on Etherscan (Optional)

The deployment script will output verification commands at the end. Run them to verify your contracts on Etherscan.

---

## Detailed Deployment Process

### Understanding the Deployment

The deployment script (`scripts/deploy-all-contracts.js`) will deploy these 9 contracts in order:

1. **CRYBToken** (ERC-20) - Platform governance token
2. **CRYBStaking** - Stake CRYB tokens to earn rewards
3. **CRYBGovernance** - DAO voting and proposal system
4. **NFTMarketplace** - Buy/sell NFTs with 2.5% platform fee
5. **CommunityNFT** - Community membership badge NFTs
6. **TokenGating** - NFT-based access control system
7. **TippingContract** - Tip creators in ETH or CRYB tokens
8. **Subscription** - Recurring crypto subscription payments
9. **Treasury** - Platform treasury with multi-sig governance

### Deployment Steps Breakdown

#### Phase 1: Contract Deployment

```bash
npx hardhat run scripts/deploy-all-contracts.js --network sepolia
```

This script will:

1. Check deployer balance (warns if < 0.1 ETH)
2. Deploy all 9 contracts sequentially
3. Configure inter-contract relationships:
   - Transfer 10M CRYB to staking contract for rewards
   - Create default staking pool
   - Transfer 50M CRYB to treasury
4. Save deployment data to `deployments/sepolia-latest.json`
5. Generate frontend config at `deployments/sepolia-config.js`
6. Display verification commands

#### Phase 2: Contract Verification

After deployment completes, verify each contract on Etherscan. The deployment script outputs the exact commands. Example:

```bash
npx hardhat verify --network sepolia <TOKEN_ADDRESS> <CONSTRUCTOR_ARGS>
```

You can also use the verification script:

```bash
node scripts/verify-all-sepolia.js
```

#### Phase 3: Frontend Integration

```bash
# Generate ABI files and TypeScript types
npm run generate-frontend-files

# Copy addresses to frontend
cp deployments/sepolia-latest.json ../apps/react-app/src/contracts/addresses.json

# Update frontend environment
cd ../apps/react-app
cat >> .env << 'EOF'
VITE_NETWORK=sepolia
VITE_CHAIN_ID=11155111
VITE_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
EOF
```

---

## Estimated Gas Costs

Based on current Sepolia gas prices (25 gwei):

| Contract | Est. Gas | Est. Cost (25 gwei) | Purpose |
|----------|----------|---------------------|---------|
| CRYBToken | ~2.8M gas | ~0.07 ETH | ERC-20 governance token |
| CRYBStaking | ~4.6M gas | ~0.115 ETH | Staking rewards system |
| CRYBGovernance | ~4.9M gas | ~0.1225 ETH | DAO governance |
| NFTMarketplace | ~10.3M gas | ~0.2575 ETH | NFT marketplace |
| CommunityNFT | ~4.9M gas | ~0.1225 ETH | Membership NFTs |
| TokenGating | ~4.6M gas | ~0.115 ETH | Access control |
| TippingContract | ~9.0M gas | ~0.225 ETH | Creator tipping |
| Subscription | ~8.8M gas | ~0.22 ETH | Recurring payments |
| Treasury | ~9.0M gas | ~0.225 ETH | Treasury management |
| **Total** | **~59M gas** | **~1.47 ETH** | **Full deployment** |

Note: Gas costs on Sepolia testnet are FREE (testnet ETH has no value).

---

## After Deployment

### Deployment Files Generated

1. **deployments/sepolia-latest.json** - Complete deployment info with all addresses
2. **deployments/sepolia-config.js** - Frontend-ready configuration
3. **deployments/sepolia-<timestamp>.json** - Timestamped backup

### Contract Addresses

After deployment, you'll find all contract addresses in `deployments/sepolia-latest.json`:

```json
{
  "network": "sepolia",
  "chainId": 11155111,
  "deployer": "0x01fdc7c29D8e8A70c334ba38ea510266b32B98C0",
  "contracts": {
    "CRYBToken": {
      "address": "0x..."
    },
    "CRYBStaking": {
      "address": "0x..."
    }
    // ... all 9 contracts
  }
}
```

### Testing Your Deployment

```bash
# Check token supply
npx hardhat console --network sepolia
> const token = await ethers.getContractAt("CRYBToken", "YOUR_TOKEN_ADDRESS")
> await token.totalSupply()

# Check staking rewards
> const staking = await ethers.getContractAt("CRYBStaking", "YOUR_STAKING_ADDRESS")
> await staking.rewardPerBlock()

# View on Sepolia Etherscan
# https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS
```

---

## Troubleshooting

### Error: Insufficient funds for intrinsic transaction cost

**Solution**: Get more Sepolia ETH from the faucets listed above.

### Error: Invalid API key

**Solution**:
- Double-check your Alchemy API key in `.env`
- Ensure you selected "Sepolia" network when creating the app
- Make sure there are no extra spaces or quotes in the `.env` file

### Error: Contract verification failed

**Solution**:
- Wait 1-2 minutes after deployment before verifying
- Ensure your Etherscan API key is correct
- Retry the verification command

### Error: Nonce too high

**Solution**:
- Reset your Hardhat cache: `rm -rf cache artifacts`
- Try the deployment again

### Deployment hangs or times out

**Solution**:
- Check Sepolia network status: https://sepolia.etherscan.io/
- Try a different RPC endpoint
- Increase timeout in `hardhat.config.js`

---

## Security Checklist

Before deploying to mainnet:

- [ ] Never commit private keys to Git (.env is in .gitignore)
- [ ] Use a separate wallet for testnet vs mainnet
- [ ] Verify all contract addresses after deployment
- [ ] Test all contract functions on testnet first
- [ ] Get a professional security audit (recommended: OpenZeppelin, CertiK, Trail of Bits)
- [ ] Set up multi-sig for contract ownership
- [ ] Test upgrade mechanisms (if using proxy patterns)
- [ ] Verify all constructor parameters are correct
- [ ] Test emergency pause/shutdown functions
- [ ] Set up monitoring for contract events

---

## Alternative Deployment Methods

### Method 1: Deploy Minimal Subset

If you only need core contracts for testing:

```bash
npx hardhat run scripts/deploy-minimal.js --network sepolia
```

This deploys only:
- CRYBToken
- CRYBStaking
- CRYBGovernance

### Method 2: Manual Deployment

Deploy contracts individually for more control:

```bash
npx hardhat run scripts/deploy.js --network sepolia
# Then follow prompts to select which contracts to deploy
```

### Method 3: Using deploy-v6.js

Alternative deployment script with different configuration:

```bash
npx hardhat run scripts/deploy-v6.js --network sepolia
```

---

## Network Information

### Sepolia Testnet Details

- **Chain ID**: 11155111
- **RPC URL**: https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
- **Block Explorer**: https://sepolia.etherscan.io/
- **Faucets**: Multiple (see Prerequisites section)
- **Average Block Time**: ~12 seconds

### Supported Networks (in hardhat.config.js)

- Ethereum Mainnet
- Sepolia Testnet
- Goerli Testnet (deprecated)
- Polygon Mainnet & Mumbai
- Arbitrum Mainnet & Goerli
- Optimism Mainnet & Goerli
- BSC Mainnet & Testnet

---

## Next Steps After Deployment

1. **Verify Contracts**: Run verification commands from deployment output
2. **Test Functionality**: Use Hardhat console to interact with contracts
3. **Update Frontend**: Copy deployment addresses to React app
4. **Create Test Data**: Mint NFTs, create proposals, etc.
5. **Monitor Events**: Set up event listeners for contract interactions
6. **Document APIs**: Generate API documentation for frontend team
7. **Security Audit**: Before mainnet, get professional audit
8. **Mainnet Deployment**: Follow same process but with real ETH

---

## Support & Resources

- **Hardhat Docs**: https://hardhat.org/docs
- **OpenZeppelin Contracts**: https://docs.openzeppelin.com/contracts
- **Alchemy Guides**: https://docs.alchemy.com/
- **Etherscan API**: https://docs.etherscan.io/

---

## Quick Reference Commands

```bash
# Compile contracts
npm run compile

# Run tests
npm test

# Check wallet balance
node scripts/check-wallet.js

# Deploy to Sepolia
npx hardhat run scripts/deploy-all-contracts.js --network sepolia

# Verify contract
npx hardhat verify --network sepolia CONTRACT_ADDRESS [CONSTRUCTOR_ARGS]

# Interact with contracts
npx hardhat console --network sepolia

# Generate frontend files
npm run generate-frontend-files

# View deployment info
cat deployments/sepolia-latest.json | jq
```

---

**Last Updated**: November 3, 2025
**Status**: Ready for deployment (pending API keys and testnet ETH)
