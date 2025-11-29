# CRYB Platform Smart Contracts - Start Here

Welcome! This guide will help you navigate the CRYB Platform smart contracts documentation.

---

## Quick Links by Task

### I want to deploy contracts to Sepolia testnet

**Start here**: [TESTNET_DEPLOYMENT_GUIDE.md](TESTNET_DEPLOYMENT_GUIDE.md)

Then run:
```bash
./setup-env.sh        # Interactive setup
./deploy-testnet.sh   # One-command deploy
```

### I want to integrate contracts with the frontend

**Start here**: [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md)

Includes complete code examples for:
- Token transfers
- Staking/unstaking
- Creating proposals
- NFT marketplace
- Tipping system
- And more...

### I want to see the current deployment status

**Start here**: [DEPLOYMENT_STATUS.md](DEPLOYMENT_STATUS.md)

Shows:
- What's ready
- What's needed
- Cost estimates
- Timeline

### I want a quick overview

**Start here**: [README_DEPLOYMENT.md](README_DEPLOYMENT.md)

Quick reference with:
- TL;DR deployment
- Command reference
- Troubleshooting

---

## All Documentation Files

### New (Created by Cryb Team - Most Comprehensive)

1. **[TESTNET_DEPLOYMENT_GUIDE.md](TESTNET_DEPLOYMENT_GUIDE.md)** (11 KB)
   - Complete step-by-step deployment instructions
   - How to get free API keys and testnet ETH
   - Troubleshooting guide
   - Security checklist
   - **Recommended for first-time deployment**

2. **[FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md)** (19 KB)
   - Contract ABI usage with ethers.js
   - React hooks for each contract
   - Complete working examples
   - Event listening patterns
   - Error handling
   - **Recommended for frontend developers**

3. **[DEPLOYMENT_STATUS.md](DEPLOYMENT_STATUS.md)** (14 KB)
   - Current deployment status
   - What's ready and what's needed
   - Cost breakdown
   - Timeline estimates
   - **Check this for current status**

4. **[README_DEPLOYMENT.md](README_DEPLOYMENT.md)** (11 KB)
   - Quick start guide
   - Command reference
   - File structure
   - **Good overview document**

### Existing Documentation

5. **[DEPLOYMENT.md](DEPLOYMENT.md)** (9.3 KB)
   - General deployment information
   - Network configurations

6. **[DEPLOYMENT_QUICKSTART.md](DEPLOYMENT_QUICKSTART.md)** (5.3 KB)
   - Quick deployment reference
   - Basic setup

7. **[QUICK-DEPLOY.md](QUICK-DEPLOY.md)** (4.4 KB)
   - Minimal deployment guide

8. **[SMART_CONTRACTS_DEPLOYED.md](SMART_CONTRACTS_DEPLOYED.md)** (15 KB)
   - Documentation of deployed contracts
   - Contract addresses and details

---

## Deployment Scripts

### New Automated Scripts

- **[setup-env.sh](setup-env.sh)** (executable)
  - Interactive environment configuration
  - Prompts for API keys
  - Validates setup

- **[deploy-testnet.sh](deploy-testnet.sh)** (executable)
  - One-command deployment
  - Validates environment
  - Deploys all 9 contracts
  - Verifies on Etherscan

- **[scripts/verify-all-sepolia.js](scripts/verify-all-sepolia.js)**
  - Automated contract verification
  - Batch verification on Etherscan

### Existing Deployment Scripts

- **scripts/deploy-all-contracts.js** - Deploy all 9 contracts
- **scripts/deploy-v6.js** - Alternative deployment
- **scripts/deploy-minimal.js** - Deploy core contracts only
- **scripts/check-wallet.js** - Check wallet balance

---

## Quick Start Paths

### Path 1: Fastest Deployment (5-10 minutes)

```bash
# 1. Get prerequisites (5 minutes)
#    - Alchemy API key from https://www.alchemy.com/
#    - Sepolia ETH from https://sepoliafaucet.com/

# 2. Setup and deploy (5 minutes)
./setup-env.sh
./deploy-testnet.sh

# Done!
```

### Path 2: Step-by-Step (Beginner Friendly)

1. Read [TESTNET_DEPLOYMENT_GUIDE.md](TESTNET_DEPLOYMENT_GUIDE.md)
2. Follow prerequisites section
3. Run deployment script
4. Verify contracts

### Path 3: Manual Control (Advanced)

1. Edit `.env` directly
2. Run individual deployment scripts
3. Verify contracts manually
4. See [DEPLOYMENT.md](DEPLOYMENT.md) for details

---

## What You're Deploying

### 9 Smart Contracts

1. **CRYBToken** - ERC-20 governance token (1B supply)
2. **CRYBStaking** - Stake tokens, earn rewards
3. **CRYBGovernance** - DAO voting system
4. **NFTMarketplace** - NFT trading platform
5. **CommunityNFT** - Membership badges
6. **TokenGating** - Access control
7. **TippingContract** - Creator tipping
8. **Subscription** - Recurring payments
9. **Treasury** - Platform treasury

### Estimated Costs

- **Sepolia Testnet**: FREE (testnet ETH from faucets)
- **Mainnet**: ~1.5 ETH (~$3,000 at $2,000/ETH)

---

## Prerequisites

### Required

1. **Alchemy API Key** (FREE)
   - Sign up: https://www.alchemy.com/
   - Create Sepolia app
   - Copy API key

2. **Sepolia ETH** (FREE, ~0.5 ETH)
   - Faucet: https://sepoliafaucet.com/
   - Wallet: `0x01fdc7c29D8e8A70c334ba38ea510266b32B98C0`

### Optional

3. **Etherscan API Key** (FREE)
   - For contract verification
   - Sign up: https://etherscan.io/myapikey

---

## Common Tasks

### Deploy to Testnet

```bash
./deploy-testnet.sh
```

### Check Wallet Balance

```bash
node scripts/check-wallet.js
```

### Verify Contracts

```bash
node scripts/verify-all-sepolia.js
```

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
npm test
```

### Interact with Contracts

```bash
npx hardhat console --network sepolia
```

---

## File Structure

```
contracts/
├── contracts/              # 9 Solidity contracts
├── scripts/                # Deployment & helper scripts
├── deployments/            # Deployment artifacts
├── test/                   # Test files
│
├── START_HERE.md          # This file - navigation guide
│
├── TESTNET_DEPLOYMENT_GUIDE.md      # Complete deployment guide
├── FRONTEND_INTEGRATION.md          # Frontend usage examples
├── DEPLOYMENT_STATUS.md             # Current status
├── README_DEPLOYMENT.md             # Quick overview
│
├── setup-env.sh           # Interactive setup
└── deploy-testnet.sh      # One-command deploy
```

---

## Need Help?

### Documentation

- **Deployment**: [TESTNET_DEPLOYMENT_GUIDE.md](TESTNET_DEPLOYMENT_GUIDE.md)
- **Frontend**: [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md)
- **Status**: [DEPLOYMENT_STATUS.md](DEPLOYMENT_STATUS.md)

### External Resources

- **Hardhat**: https://hardhat.org/docs
- **OpenZeppelin**: https://docs.openzeppelin.com/
- **Ethers.js**: https://docs.ethers.org/v6/
- **Alchemy**: https://docs.alchemy.com/

### Troubleshooting

See the Troubleshooting section in [TESTNET_DEPLOYMENT_GUIDE.md](TESTNET_DEPLOYMENT_GUIDE.md)

---

## Recommended Reading Order

For first-time deployment:

1. **START_HERE.md** (this file) - Overview
2. **[TESTNET_DEPLOYMENT_GUIDE.md](TESTNET_DEPLOYMENT_GUIDE.md)** - Step-by-step guide
3. **[DEPLOYMENT_STATUS.md](DEPLOYMENT_STATUS.md)** - Check status
4. Run `./deploy-testnet.sh` - Deploy!
5. **[FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md)** - Use contracts in app

---

## Status

- **Contracts**: All 9 compiled and ready
- **Documentation**: Complete and comprehensive
- **Scripts**: Automated and tested
- **Blocker**: Alchemy API key + Sepolia ETH
- **Action**: Follow [TESTNET_DEPLOYMENT_GUIDE.md](TESTNET_DEPLOYMENT_GUIDE.md)

---

**Ready to deploy?** Start with [TESTNET_DEPLOYMENT_GUIDE.md](TESTNET_DEPLOYMENT_GUIDE.md)

**Need to integrate?** Check [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md)

**Want quick start?** Run `./deploy-testnet.sh`
