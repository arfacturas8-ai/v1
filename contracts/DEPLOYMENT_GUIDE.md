# CRYB Platform - Sepolia Testnet Deployment Guide

Complete guide for deploying all 9 smart contracts to Sepolia testnet.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setup Instructions](#setup-instructions)
3. [Deployment Process](#deployment-process)
4. [Verification](#verification)
5. [Post-Deployment Configuration](#post-deployment-configuration)
6. [Frontend Integration](#frontend-integration)
7. [Troubleshooting](#troubleshooting)
8. [Gas Cost Estimates](#gas-cost-estimates)
9. [Contract Addresses](#contract-addresses)

---

## Prerequisites

### Required Accounts & API Keys

1. **Alchemy Account** (for RPC access)
   - Visit: https://www.alchemy.com/
   - Create free account
   - Create new app (Ethereum → Sepolia)
   - Copy API key

2. **Ethereum Wallet** (MetaMask recommended)
   - Install MetaMask: https://metamask.io/
   - Create new wallet or use existing
   - Export private key: Account Details → Export Private Key
   - **⚠️ NEVER share or commit your private key!**

3. **Sepolia Testnet ETH** (0.5+ ETH recommended)
   - Faucet 1: https://sepoliafaucet.com/
   - Faucet 2: https://www.alchemy.com/faucets/ethereum-sepolia
   - Faucet 3: https://sepolia-faucet.pk910.de/
   - May require social account verification

4. **Etherscan API Key** (optional, for verification)
   - Visit: https://etherscan.io/myapikey
   - Create free account
   - Generate API key

### Required Software

- Node.js v16+ and npm
- Git

---

## Setup Instructions

### 1. Environment Configuration

Create a `.env` file in the `contracts` directory:

```bash
cd /home/ubuntu/cryb-platform/contracts
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
# Required for Deployment
ALCHEMY_API_KEY=your_alchemy_api_key_here
PRIVATE_KEY=your_wallet_private_key_here

# Optional - Alternative RPC
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY

# Required for Verification
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# Optional - Gas Reporting
COINMARKETCAP_API_KEY=your_cmc_api_key_here
REPORT_GAS=false
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Compile Contracts

```bash
npm run compile
```

Expected output: ✅ All 9 contracts compiled successfully

---

## Deployment Process

### Option 1: One-Command Deployment (Recommended)

Deploy all 9 contracts in correct dependency order:

```bash
npm run deploy:sepolia
```

This script will:
1. ✅ Check prerequisites (API keys, balance, etc.)
2. 🚀 Deploy all 9 contracts in order
3. 📄 Save deployment data
4. 📊 Generate deployment report

### Option 2: Manual Step-by-Step Deployment

Deploy contracts individually in dependency order:

```bash
# 1. CRYBToken (no dependencies)
npx hardhat run scripts/deploy-1-token.js --network sepolia

# 2. Treasury (depends on Token)
npx hardhat run scripts/deploy-2-treasury.js --network sepolia

# 3. Staking (depends on Token)
npx hardhat run scripts/deploy-3-staking.js --network sepolia

# 4. Governance (depends on Token + Staking)
npx hardhat run scripts/deploy-4-governance.js --network sepolia

# 5. Community NFT (no dependencies)
npx hardhat run scripts/deploy-5-nft.js --network sepolia

# 6. NFT Marketplace (works with any ERC721)
npx hardhat run scripts/deploy-6-marketplace.js --network sepolia

# 7. Token Gating (configurable after deployment)
npx hardhat run scripts/deploy-7-tokengating.js --network sepolia

# 8. Tipping (depends on Token)
npx hardhat run scripts/deploy-8-tipping.js --network sepolia

# 9. Subscription (depends on Token)
npx hardhat run scripts/deploy-9-subscription.js --network sepolia
```

### Deployment Output

Each deployment creates a JSON file in `deployments/` directory:
- `sepolia-1-token.json`
- `sepolia-2-treasury.json`
- ... etc.
- `sepolia-latest.json` (consolidated)

---

## Verification

### Automatic Verification (All Contracts)

```bash
npm run verify:sepolia
```

This will verify all deployed contracts on Etherscan automatically.

### Manual Verification (Individual Contracts)

If automatic verification fails, use individual commands:

```bash
# CRYBToken
npx hardhat verify --network sepolia <TOKEN_ADDRESS> <DEPLOYER> <DEPLOYER> <DEPLOYER> <DEPLOYER> <DEPLOYER>

# Treasury
npx hardhat verify --network sepolia <TREASURY_ADDRESS> <TOKEN_ADDRESS>

# Staking
npx hardhat verify --network sepolia <STAKING_ADDRESS> <TOKEN_ADDRESS> <REWARD_PER_BLOCK> <START_BLOCK>

# Governance
npx hardhat verify --network sepolia <GOVERNANCE_ADDRESS> <TOKEN_ADDRESS> <TIMELOCK> <VOTING_DELAY> <VOTING_PERIOD> <PROPOSAL_THRESHOLD> <QUORUM>

# CommunityNFT
npx hardhat verify --network sepolia <NFT_ADDRESS> "CRYB Community" "CRYBC" "ipfs://QmYourBaseURI/" <PLATFORM_WALLET>

# NFTMarketplace
npx hardhat verify --network sepolia <MARKETPLACE_ADDRESS> <PLATFORM_WALLET>

# TokenGating
npx hardhat verify --network sepolia <TOKENGATING_ADDRESS>

# TippingContract
npx hardhat verify --network sepolia <TIPPING_ADDRESS> <PLATFORM_WALLET> <TOKEN_ADDRESS>

# Subscription
npx hardhat verify --network sepolia <SUBSCRIPTION_ADDRESS> <PLATFORM_WALLET>
```

Replace `<ADDRESSES>` with actual deployed addresses from `deployments/sepolia-latest.json`.

---

## Post-Deployment Configuration

### 1. Fund Staking Contract

Transfer CRYB tokens to staking contract for rewards:

```javascript
// Using Hardhat console
npx hardhat console --network sepolia

const token = await ethers.getContractAt("CRYBToken", "<TOKEN_ADDRESS>");
const rewardAmount = ethers.parseEther("10000000"); // 10M CRYB
await token.transfer("<STAKING_ADDRESS>", rewardAmount);
```

### 2. Create Staking Pool

```javascript
const staking = await ethers.getContractAt("CRYBStaking", "<STAKING_ADDRESS>");
await staking.add(
  100,                    // allocation points
  "<TOKEN_ADDRESS>",      // staking token
  0,                      // deposit fee (0%)
  true                    // with update
);
```

### 3. Fund Treasury

```javascript
const token = await ethers.getContractAt("CRYBToken", "<TOKEN_ADDRESS>");
const treasuryAmount = ethers.parseEther("50000000"); // 50M CRYB
await token.transfer("<TREASURY_ADDRESS>", treasuryAmount);
```

### 4. Configure NFT Metadata

```javascript
const nft = await ethers.getContractAt("CommunityNFT", "<NFT_ADDRESS>");

// Set mint price
await nft.setMintPrice(ethers.parseEther("0.01"));

// Update base URI if needed
await nft.setBaseURI("ipfs://QmYourActualBaseURI/");

// Pause/unpause minting
await nft.pause();   // Pause
await nft.unpause(); // Unpause
```

### 5. Configure Platform Fees

```javascript
// NFT Marketplace
const marketplace = await ethers.getContractAt("NFTMarketplace", "<MARKETPLACE_ADDRESS>");
await marketplace.setPlatformFeePercent(250); // 2.5%

// Tipping
const tipping = await ethers.getContractAt("TippingContract", "<TIPPING_ADDRESS>");
await tipping.setPlatformFeePercent(100); // 1%

// Subscription
const subscription = await ethers.getContractAt("Subscription", "<SUBSCRIPTION_ADDRESS>");
await subscription.setPlatformFeePercent(500); // 5%
```

---

## Frontend Integration

### Update Frontend with Contract Addresses

```bash
npm run update-frontend
```

This generates:
- `apps/react-app/src/config/contracts.ts` - TypeScript config
- `apps/react-app/src/config/contracts.js` - JavaScript config
- `apps/react-app/src/config/abis/*.json` - Contract ABIs

### Usage in Frontend

```typescript
import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from '@/config/contracts';
import CRYBTokenABI from '@/config/abis/CRYBToken.json';
import { ethers } from 'ethers';

// Create contract instance
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

const token = new ethers.Contract(
  CONTRACT_ADDRESSES.CRYBToken,
  CRYBTokenABI,
  signer
);

// Interact with contract
const balance = await token.balanceOf(address);
```

---

## Troubleshooting

### Issue: "Insufficient funds for gas"

**Solution:**
- Get more Sepolia ETH from faucets
- Check wallet balance: `npm run check-wallet`

### Issue: "Nonce too high"

**Solution:**
- Reset MetaMask account: Settings → Advanced → Reset Account
- Or wait a few minutes and retry

### Issue: "Contract deployment failed"

**Solution:**
- Check gas price is not too low
- Ensure contract compiles: `npm run compile`
- Check deployer has enough ETH

### Issue: "Verification failed"

**Solution:**
- Wait 1-2 minutes after deployment
- Check Etherscan API key is correct
- Verify constructor arguments match deployment
- Try manual verification with exact arguments

### Issue: "Already Verified"

**Solution:**
- This is not an error! Contract is already verified
- View on Etherscan to confirm

### Issue: "Rate Limited"

**Solution:**
- Wait 1-2 minutes between verification attempts
- Etherscan free tier: 5 requests/second

---

## Gas Cost Estimates

Based on Sepolia testnet (may vary with network conditions):

| Contract           | Estimated Gas | Cost @ 20 Gwei | Cost @ 50 Gwei |
|--------------------|---------------|----------------|----------------|
| CRYBToken          | 1,500,000     | 0.030 ETH      | 0.075 ETH      |
| Treasury           | 2,500,000     | 0.050 ETH      | 0.125 ETH      |
| CRYBStaking        | 3,000,000     | 0.060 ETH      | 0.150 ETH      |
| CRYBGovernance     | 3,500,000     | 0.070 ETH      | 0.175 ETH      |
| CommunityNFT       | 3,000,000     | 0.060 ETH      | 0.150 ETH      |
| NFTMarketplace     | 4,000,000     | 0.080 ETH      | 0.200 ETH      |
| TokenGating        | 2,000,000     | 0.040 ETH      | 0.100 ETH      |
| TippingContract    | 2,500,000     | 0.050 ETH      | 0.125 ETH      |
| Subscription       | 3,000,000     | 0.060 ETH      | 0.150 ETH      |
| **TOTAL**          | **25,000,000** | **0.500 ETH** | **1.250 ETH** |

**Recommendation:** Have 0.5-1.0 ETH available for deployment + buffer for gas spikes.

---

## Contract Addresses

After deployment, find your contract addresses in:

```bash
cat deployments/sepolia-latest.json
```

Or check deployment summary output.

### Mainnet Deployment

⚠️ **WARNING:** Deploying to mainnet requires real ETH and is irreversible!

Before mainnet deployment:
1. ✅ Test all contracts thoroughly on Sepolia
2. ✅ Complete security audit
3. ✅ Review all constructor parameters
4. ✅ Have 2-5 ETH ready for gas costs
5. ✅ Use hardware wallet for deployment
6. ✅ Enable multi-sig for contract ownership

---

## Additional Resources

- Hardhat Documentation: https://hardhat.org/docs
- Ethers.js Documentation: https://docs.ethers.org/
- Sepolia Faucets: https://faucetlink.to/sepolia
- Etherscan Sepolia: https://sepolia.etherscan.io/
- OpenZeppelin Contracts: https://docs.openzeppelin.com/contracts/

---

## Support

For issues or questions:
1. Check this documentation first
2. Review error messages in console
3. Check Etherscan transaction history
4. Verify all prerequisites are met

---

## Quick Reference Commands

```bash
# Prerequisites check
npm run check

# Deploy all contracts
npm run deploy:sepolia

# Verify all contracts
npm run verify:sepolia

# Update frontend
npm run update-frontend

# Compile contracts
npm run compile

# Run tests
npm test

# Check wallet balance
npm run check-wallet
```

---

**Last Updated:** November 4, 2025

**Status:** Ready for Deployment (pending user credentials)
