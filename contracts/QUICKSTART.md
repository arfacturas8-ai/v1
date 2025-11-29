# CRYB Platform - Quick Start Guide

Get your contracts deployed to Sepolia testnet in 5 minutes!

---

## Prerequisites

Before starting, you need:

1. **Alchemy API Key** - Get from [alchemy.com](https://www.alchemy.com/)
2. **MetaMask Wallet** - With private key exported
3. **Sepolia ETH** - At least 0.5 ETH (get from faucets)
4. **Etherscan API Key** - Optional, for verification

---

## 5-Minute Deployment

### Step 1: Setup Environment (1 minute)

```bash
cd /home/ubuntu/cryb-platform/contracts

# Copy environment template
cp .env.example .env

# Edit .env and add your keys
nano .env
```

Add these 3 required values to `.env`:
```env
PRIVATE_KEY=your_wallet_private_key_here
ALCHEMY_API_KEY=your_alchemy_api_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

Save and exit (Ctrl+X, Y, Enter)

### Step 2: Check Prerequisites (1 minute)

```bash
npm run check
```

This will verify:
- ✅ API keys are set
- ✅ Network connection works
- ✅ Wallet has sufficient ETH
- ✅ All contracts compiled

If any checks fail, follow the displayed instructions.

### Step 3: Deploy All Contracts (2 minutes)

```bash
npm run deploy:sepolia
```

This will automatically:
1. Deploy all 9 contracts in correct order
2. Save deployment data
3. Generate deployment report

Wait for completion. Total gas: ~0.3-0.8 ETH depending on gas prices.

### Step 4: Verify Contracts (1 minute)

```bash
npm run verify:sepolia
```

This will verify all contracts on Etherscan automatically.

### Step 5: Update Frontend (30 seconds)

```bash
npm run update-frontend
```

This generates contract addresses and ABIs for your frontend.

---

## Done!

Your contracts are now live on Sepolia testnet!

### View Your Contracts

Check `deployments/sepolia-latest.json` for all contract addresses.

Or visit Etherscan:
```bash
cat deployments/sepolia-latest.json | grep address
```

### Next Steps

1. **Configure Contracts**
   - Fund staking contract with rewards
   - Set NFT mint prices
   - Configure platform fees

2. **Test Frontend Integration**
   - Import contract addresses from `config/contracts.ts`
   - Connect wallet to Sepolia network
   - Test all contract interactions

3. **Monitor Deployment**
   - Check transactions on Etherscan
   - Verify all contracts are verified
   - Test key functionality

---

## Troubleshooting

### "Insufficient funds"
Get more Sepolia ETH from faucets:
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia

### "Prerequisites check failed"
Run `npm run check` and follow the specific error messages.

### "Verification failed"
- Wait 1-2 minutes after deployment
- Check Etherscan API key is valid
- Try again: `npm run verify:sepolia`

### Need Help?
See full documentation: `DEPLOYMENT_GUIDE.md`

---

## Quick Reference

```bash
# Check prerequisites
npm run check

# Deploy to Sepolia
npm run deploy:sepolia

# Verify contracts
npm run verify:sepolia

# Update frontend
npm run update-frontend

# Check wallet balance
npm run check-wallet

# Compile contracts
npm run compile

# Run tests
npm test
```

---

## What Gets Deployed?

1. **CRYBToken** - ERC20 token (1B supply)
2. **Treasury** - Protocol treasury with governance
3. **CRYBStaking** - Token staking with rewards
4. **CRYBGovernance** - DAO governance system
5. **CommunityNFT** - ERC721 NFT collection
6. **NFTMarketplace** - NFT trading platform
7. **TokenGating** - Access control system
8. **TippingContract** - Creator tipping system
9. **Subscription** - Creator subscription system

---

**Ready to deploy?** Start with `npm run check`!
