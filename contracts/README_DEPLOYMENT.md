# CRYB Platform Smart Contracts - Deployment Guide

## Quick Links

- 📘 **[Testnet Deployment Guide](TESTNET_DEPLOYMENT_GUIDE.md)** - Complete step-by-step instructions
- 🔗 **[Frontend Integration](FRONTEND_INTEGRATION.md)** - How to use contracts in React app
- 📊 **[Deployment Status](DEPLOYMENT_STATUS.md)** - Current status and what's ready

---

## TL;DR - Deploy in 5 Minutes

```bash
# 1. Setup (interactive - will ask for API keys)
./setup-env.sh

# 2. Get free Sepolia ETH
# Visit: https://sepoliafaucet.com/
# Wallet: 0x01fdc7c29D8e8A70c334ba38ea510266b32B98C0

# 3. Deploy everything
./deploy-testnet.sh

# Done! Contracts deployed and verified.
```

---

## What You're Deploying

### 9 Smart Contracts

1. **CRYBToken** - ERC-20 governance token (1B supply)
2. **CRYBStaking** - Stake tokens, earn rewards
3. **CRYBGovernance** - Create proposals, vote on decisions
4. **NFTMarketplace** - Buy/sell NFTs (2.5% fee)
5. **CommunityNFT** - Membership badge system
6. **TokenGating** - NFT-based access control
7. **TippingContract** - Tip creators in ETH/tokens
8. **Subscription** - Recurring crypto payments
9. **Treasury** - Platform treasury management

### Current Status

✅ All contracts compiled (0 errors)
✅ Deployment scripts ready
✅ Documentation complete
❌ Need Alchemy API key
❌ Need Sepolia ETH

---

## Prerequisites (5-10 minutes)

### 1. Alchemy API Key (FREE)

Get yours at: https://www.alchemy.com/

1. Sign up
2. Create App → Choose "Ethereum Sepolia"
3. Copy API key

### 2. Sepolia ETH (FREE)

Get free testnet ETH from any faucet:

- https://sepoliafaucet.com/ (Recommended)
- https://www.infura.io/faucet/sepolia
- https://faucet.quicknode.com/ethereum/sepolia

**Wallet**: `0x01fdc7c29D8e8A70c334ba38ea510266b32B98C0`
**Amount**: ~0.5 ETH (for gas)

### 3. Etherscan API Key (Optional)

For contract verification: https://etherscan.io/myapikey

---

## Deployment Methods

### Method 1: Automated (Recommended)

One script does everything:

```bash
./deploy-testnet.sh
```

This will:
- ✅ Check your environment
- ✅ Compile contracts
- ✅ Deploy all 9 contracts
- ✅ Configure relationships
- ✅ Verify on Etherscan
- ✅ Generate frontend files

### Method 2: Step-by-Step

More control over each step:

```bash
# 1. Setup environment
./setup-env.sh

# 2. Compile
npm run compile

# 3. Check wallet
node scripts/check-wallet.js

# 4. Deploy
npx hardhat run scripts/deploy-all-contracts.js --network sepolia

# 5. Verify
node scripts/verify-all-sepolia.js

# 6. Generate frontend files
npm run generate-frontend-files
```

### Method 3: Manual Configuration

Edit `.env` directly:

```bash
nano .env

# Replace these values:
ALCHEMY_API_KEY=your_actual_key_here
ETHERSCAN_API_KEY=your_key_here
```

Then run deployment:

```bash
npx hardhat run scripts/deploy-all-contracts.js --network sepolia
```

---

## What Gets Created

### During Deployment

```
deployments/
├── sepolia-latest.json           # All contract addresses
├── sepolia-config.js             # Frontend configuration
└── sepolia-<timestamp>.json      # Backup with timestamp
```

### Contract Addresses

After deployment, find all addresses in `deployments/sepolia-latest.json`:

```json
{
  "network": "sepolia",
  "chainId": 11155111,
  "deployer": "0x01fdc7c29D8e8A70c334ba38ea510266b32B98C0",
  "contracts": {
    "CRYBToken": { "address": "0x..." },
    "CRYBStaking": { "address": "0x..." },
    ...
  }
}
```

---

## Verification

### Automatic Verification

The deploy script will show verification commands:

```bash
npx hardhat verify --network sepolia CONTRACT_ADDRESS [ARGS]
```

### Bulk Verification

Verify all contracts at once:

```bash
node scripts/verify-all-sepolia.js
```

### Manual Verification

For individual contracts:

```bash
npx hardhat verify --network sepolia 0xYourContractAddress "constructor" "arguments"
```

---

## Frontend Integration

### Copy Files to Frontend

```bash
# Copy deployment data
cp deployments/sepolia-latest.json ../apps/react-app/src/contracts/addresses.json

# Copy configuration
cp deployments/sepolia-config.js ../apps/react-app/src/contracts/config.js
```

### Update Frontend .env

```bash
cd ../apps/react-app

cat >> .env << 'EOF'
VITE_NETWORK=sepolia
VITE_CHAIN_ID=11155111
VITE_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
EOF
```

### Use in React

```javascript
import { ethers } from 'ethers';
import CRYBTokenABI from '@/contracts/artifacts/contracts/CRYBToken.sol/CRYBToken.json';
import { CONTRACT_ADDRESSES } from '@/contracts/config';

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

const token = new ethers.Contract(
  CONTRACT_ADDRESSES.CRYB_TOKEN,
  CRYBTokenABI.abi,
  signer
);

const balance = await token.balanceOf(userAddress);
```

See **[FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md)** for complete examples.

---

## Costs

### Testnet (Sepolia)

**Total Cost**: FREE (testnet ETH has no value)

Estimated gas needed: ~0.5 ETH from faucets

### Mainnet (Future)

Estimated at 25 gwei:

```
Total Gas:     ~59M gas
Cost:          ~1.5 ETH
USD (ETH=$2000): ~$3,000
```

Actual cost depends on gas prices at deployment time.

---

## Troubleshooting

### Error: Insufficient funds

**Solution**: Get more Sepolia ETH from faucets

### Error: Invalid API key

**Solution**:
- Check your Alchemy API key
- Make sure you selected "Sepolia" network
- Remove any extra spaces in .env

### Error: Network connection failed

**Solution**:
- Check Sepolia network status: https://sepolia.etherscan.io/
- Try different RPC endpoint
- Wait and retry

### Deployment hangs

**Solution**:
- Check gas prices (may be high)
- Increase timeout in hardhat.config.js
- Try again during off-peak hours

### Verification failed

**Solution**:
- Wait 1-2 minutes after deployment
- Check Etherscan API key
- Retry with: `node scripts/verify-all-sepolia.js`

More solutions in **[TESTNET_DEPLOYMENT_GUIDE.md](TESTNET_DEPLOYMENT_GUIDE.md)**

---

## Testing

### Local Testing

```bash
# Start local Hardhat network
npx hardhat node

# In another terminal
npx hardhat run scripts/deploy-all-contracts.js --network localhost
```

### Interact with Contracts

```bash
npx hardhat console --network sepolia

# In console:
const token = await ethers.getContractAt("CRYBToken", "YOUR_TOKEN_ADDRESS")
await token.totalSupply()
await token.balanceOf("YOUR_ADDRESS")
```

### Run Tests

```bash
npm test
```

---

## Security

### Testnet Considerations

✅ Using separate test wallet
✅ Private keys not committed to Git
✅ Testnet only (no real funds at risk)

### Before Mainnet

Required before deploying to mainnet:

- [ ] Professional security audit
- [ ] Multi-sig wallet for ownership
- [ ] Timelock for governance
- [ ] Emergency pause mechanisms tested
- [ ] Comprehensive testing (100% coverage)
- [ ] Bug bounty program
- [ ] Rate limiting implemented
- [ ] Third-party code review

---

## Network Information

### Sepolia Testnet

- **Chain ID**: 11155111
- **RPC**: https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
- **Explorer**: https://sepolia.etherscan.io/
- **Block Time**: ~12 seconds
- **Faucets**: See prerequisites section

### After Deployment

View your contracts at:
```
https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS
```

---

## Scripts Reference

### Deployment Scripts

```bash
# Deploy all contracts
npx hardhat run scripts/deploy-all-contracts.js --network sepolia

# Deploy minimal (Token, Staking, Governance only)
npx hardhat run scripts/deploy-minimal.js --network sepolia

# Alternative deployment
npx hardhat run scripts/deploy-v6.js --network sepolia
```

### Helper Scripts

```bash
# Setup environment
./setup-env.sh

# Full deployment
./deploy-testnet.sh

# Check wallet
node scripts/check-wallet.js

# Verify contracts
node scripts/verify-all-sepolia.js

# Generate frontend files
npm run generate-frontend-files
```

### Hardhat Commands

```bash
# Compile contracts
npm run compile

# Run tests
npm test

# Check contract sizes
npx hardhat size-contracts

# Generate gas report
REPORT_GAS=true npm test

# Clean and recompile
npx hardhat clean && npm run compile
```

---

## File Structure

```
contracts/
├── contracts/                  # Solidity contracts (9 files)
│   ├── CRYBToken.sol
│   ├── CRYBStaking.sol
│   ├── CRYBGovernance.sol
│   ├── NFTMarketplace.sol
│   ├── CommunityNFT.sol
│   ├── TokenGating.sol
│   ├── TippingContract.sol
│   ├── Subscription.sol
│   └── Treasury.sol
│
├── scripts/                    # Deployment scripts
│   ├── deploy-all-contracts.js
│   ├── deploy-minimal.js
│   ├── verify-all-sepolia.js
│   └── check-wallet.js
│
├── deployments/                # Deployment artifacts
│   └── sepolia-latest.json
│
├── setup-env.sh               # Setup script
├── deploy-testnet.sh          # Deployment script
│
├── TESTNET_DEPLOYMENT_GUIDE.md    # Comprehensive guide
├── FRONTEND_INTEGRATION.md        # Integration examples
├── DEPLOYMENT_STATUS.md           # Current status
└── README_DEPLOYMENT.md           # This file
```

---

## Support & Resources

### Documentation

- **[Testnet Deployment Guide](TESTNET_DEPLOYMENT_GUIDE.md)** - Complete instructions
- **[Frontend Integration](FRONTEND_INTEGRATION.md)** - Usage examples
- **[Deployment Status](DEPLOYMENT_STATUS.md)** - Current status

### External Resources

- **Hardhat**: https://hardhat.org/docs
- **OpenZeppelin**: https://docs.openzeppelin.com/
- **Ethers.js**: https://docs.ethers.org/v6/
- **Alchemy**: https://docs.alchemy.com/
- **Sepolia Faucets**: Multiple available (see prerequisites)

---

## Quick Command Reference

```bash
# Full deployment (one command)
./deploy-testnet.sh

# Setup only
./setup-env.sh

# Check balance
node scripts/check-wallet.js

# Deploy manually
npx hardhat run scripts/deploy-all-contracts.js --network sepolia

# Verify contracts
node scripts/verify-all-sepolia.js

# Console
npx hardhat console --network sepolia

# View deployment
cat deployments/sepolia-latest.json | jq
```

---

## Next Steps

1. ✅ **Get Prerequisites** (5-10 min)
   - Alchemy API key
   - Sepolia ETH

2. ✅ **Deploy** (20-30 min)
   - Run `./deploy-testnet.sh`

3. ✅ **Integrate** (30-60 min)
   - Copy files to frontend
   - Update environment
   - Test integration

4. ✅ **Test** (1-2 hours)
   - Test all contract functions
   - Verify events work
   - End-to-end testing

5. ✅ **Prepare for Mainnet** (weeks)
   - Security audit
   - Additional testing
   - Multi-sig setup
   - Final review

---

**Status**: Ready for deployment (pending API keys)

**Time to Deploy**: 5-30 minutes once prerequisites are ready

**Cost**: FREE (Sepolia testnet)

---

For detailed instructions, see **[TESTNET_DEPLOYMENT_GUIDE.md](TESTNET_DEPLOYMENT_GUIDE.md)**

For frontend integration, see **[FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md)**

For current status, see **[DEPLOYMENT_STATUS.md](DEPLOYMENT_STATUS.md)**
