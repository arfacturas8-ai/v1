# CRYB Smart Contracts - Deployment Quickstart

## 🚀 Quick Deploy (Local)

```bash
cd /home/ubuntu/cryb-platform/contracts

# Compile contracts
npx hardhat compile

# Deploy to local Hardhat network
npx hardhat run scripts/deploy-v6.js --network hardhat

# Generate frontend files
node scripts/generate-frontend-files.js
```

## 🧪 Testnet Deployment (Sepolia)

### 1. Prerequisites

```bash
# Get Sepolia ETH from faucets:
# - https://sepoliafaucet.com/
# - https://www.alchemy.com/faucets/ethereum-sepolia

# Update .env file
nano .env
```

Add to `.env`:
```bash
ALCHEMY_API_KEY=your_alchemy_api_key_here
PRIVATE_KEY=your_wallet_private_key_here
ETHERSCAN_API_KEY=your_etherscan_key_here  # optional
```

### 2. Deploy

```bash
# Deploy all contracts to Sepolia
npx hardhat run scripts/deploy-v6.js --network sepolia

# Generate frontend files
node scripts/generate-frontend-files.js
```

### 3. Verify Contracts (Optional)

```bash
# Get verification commands from deployment output
# Example:
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

## 📦 Frontend Integration

### Copy Files to React App

```bash
# Copy contract ABIs and addresses
cp -r frontend-integration/* \
      /home/ubuntu/cryb-platform/apps/react-app/src/contracts/

# Update frontend .env
cd /home/ubuntu/cryb-platform/apps/react-app
```

Add to `apps/react-app/.env`:
```bash
# For local Hardhat
VITE_CHAIN_ID=31337
VITE_RPC_URL=http://127.0.0.1:8545

# For Sepolia testnet
# VITE_CHAIN_ID=11155111
# VITE_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
```

### Install Dependencies

```bash
cd /home/ubuntu/cryb-platform/apps/react-app
npm install ethers@^6.0.0
```

## 📋 Deployed Contracts

1. **CRYBToken** - Platform token (ERC-20)
2. **CRYBStaking** - Staking with rewards
3. **CRYBGovernance** - DAO governance
4. **NFTMarketplace** - NFT trading
5. **CommunityNFT** - Community NFTs
6. **TokenGating** - Access control
7. **TippingContract** - Crypto tips
8. **Subscription** - Subscriptions
9. **Treasury** - DAO treasury

## 🔧 Common Commands

```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Start local node
npx hardhat node

# Deploy to network
npx hardhat run scripts/deploy-v6.js --network <network>

# Check contract size
npx hardhat size-contracts

# Clean artifacts
npx hardhat clean

# Get account balance
npx hardhat run scripts/check-balance.js --network <network>
```

## 📁 Directory Structure

```
contracts/
├── contracts/              # Solidity contracts
├── scripts/               # Deployment scripts
│   ├── deploy-v6.js      # Main deployment script
│   └── generate-frontend-files.js
├── deployments/           # Deployment data
│   ├── hardhat-latest.json
│   └── hardhat-config.js
├── frontend-integration/  # Frontend files
│   ├── abis/             # Contract ABIs
│   ├── addresses.js      # Contract addresses
│   └── config.js         # Network config
├── artifacts/            # Compiled contracts
├── .env                  # Environment variables
└── hardhat.config.js     # Hardhat configuration
```

## 🌐 Network Configuration

### Hardhat (Local)
- **Chain ID:** 31337
- **RPC:** http://127.0.0.1:8545
- **Purpose:** Testing

### Sepolia (Testnet)
- **Chain ID:** 11155111
- **RPC:** https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
- **Explorer:** https://sepolia.etherscan.io
- **Purpose:** Pre-production testing

### Ethereum Mainnet (Production)
- **Chain ID:** 1
- **RPC:** https://eth-mainnet.alchemyapi.io/v2/YOUR_KEY
- **Explorer:** https://etherscan.io
- **Purpose:** Production deployment

## ⚠️ Important Notes

### Security
- **Never commit .env** to git
- **Use hardware wallet** for mainnet
- **Test thoroughly** on testnet first
- **Get security audit** before mainnet

### Gas Costs
- **Local:** Free
- **Testnet:** Free (test ETH)
- **Mainnet:** ~$1,000-2,000 (estimate)

### Testing Checklist
- [ ] All contracts compile
- [ ] Deployment successful
- [ ] Token transfers work
- [ ] Staking works
- [ ] Governance proposals work
- [ ] NFT minting works
- [ ] Marketplace works
- [ ] Treasury works

## 🆘 Troubleshooting

### "Insufficient funds"
```bash
# Check balance
npx hardhat run scripts/check-balance.js --network sepolia

# Get testnet ETH from faucets
```

### "Invalid API key"
```bash
# Verify .env file
cat .env | grep ALCHEMY_API_KEY

# Get new key from https://www.alchemy.com/
```

### "Contract not verified"
```bash
# Verify manually
npx hardhat verify --network sepolia \
  <CONTRACT_ADDRESS> \
  <CONSTRUCTOR_ARG1> \
  <CONSTRUCTOR_ARG2>
```

### "Frontend can't connect"
```bash
# Check MetaMask network
# - Should match VITE_CHAIN_ID in .env

# Check contract addresses
cat frontend-integration/config.js
```

## 📞 Support

- **Documentation:** See `SMART_CONTRACTS_DEPLOYED.md`
- **Deployment Guide:** See `DEPLOYMENT.md`
- **Hardhat Docs:** https://hardhat.org/docs
- **Ethers.js Docs:** https://docs.ethers.org/v6/

## ✅ Current Status

- ✅ 9 contracts deployed to local network
- ✅ Frontend integration files generated
- ⏳ Testnet deployment pending (need Sepolia ETH)
- ⏳ Mainnet deployment pending (need audit)

---

**Last Updated:** 2025-11-03
**Network:** Hardhat (Local)
**Status:** Ready for testnet deployment
