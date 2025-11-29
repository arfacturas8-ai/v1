# Quick Deployment Guide - CRYB Contracts to Sepolia

## What You Need

### 1. Wallet Private Key
Create a new wallet for testing:
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Or use an existing wallet's private key (without 0x prefix).

**Get Sepolia ETH:**
- Visit: https://sepoliafaucet.com/
- Or: https://www.alchemy.com/faucets/ethereum-sepolia
- Need: ~0.5 ETH for deployment

### 2. Alchemy API Key
1. Sign up: https://www.alchemy.com/
2. Create new app → Select "Sepolia" network
3. Copy API key

### 3. Etherscan API Key (Optional for verification)
1. Sign up: https://etherscan.io/
2. Go to: https://etherscan.io/myapikey
3. Create new API key

## Step-by-Step Deployment

### Step 1: Create .env file
```bash
cd /home/ubuntu/cryb-platform/contracts

# Create .env file
cat > .env << 'EOF'
# Deployment Configuration
PRIVATE_KEY=your_private_key_here_without_0x
ALCHEMY_API_KEY=your_alchemy_api_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# Network URLs (auto-configured)
SEPOLIA_RPC_URL=https://eth-sepolia.alchemyapi.io/v2/${ALCHEMY_API_KEY}

# Verification
VERIFY_CONTRACTS=true
EOF

# Edit the file with your actual keys
nano .env
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Compile Contracts
```bash
npx hardhat compile
```

### Step 4: Deploy to Sepolia
```bash
# Deploy minimal set (Token + Staking + Governance)
npx hardhat run scripts/deploy-minimal.js --network sepolia
```

### Step 5: Verify Contracts (Optional)
After deployment, you'll see verification commands. Run them:
```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

## Expected Output

```
🚀 Starting minimal CRYB deployment...
📊 Network: sepolia
👛 Deployer: 0x...
💰 Balance: 0.5 ETH

📝 1/3 Deploying CRYB Token...
✅ CRYB Token: 0xABCD...1234
   Total Supply: 1000000000 CRYB

📝 2/3 Deploying Staking Contract...
✅ Staking Contract: 0xEF12...5678
   Reward per block: 10 CRYB

📝 3/3 Deploying Governance Contract...
✅ Governance Contract: 0x9876...DCBA
   Voting period: 50400 blocks (~1 week)
   Proposal threshold: 1000000 CRYB

⚙️  Configuring contracts...
   ✅ Reward tokens transferred
   ✅ Default pool created

🎉 Deployment Complete!
==========================================
CRYB Token: 0x...
Staking: 0x...
Governance: 0x...
==========================================
```

## After Deployment

### 1. Contract Addresses
Saved to: `deployments/sepolia-<timestamp>.json`

### 2. Frontend Config
Saved to: `deployments/sepolia-config.js`

Copy this to your frontend:
```bash
cp deployments/sepolia-config.js /home/ubuntu/cryb-platform/apps/react-app/src/config/contracts.js
```

### 3. Update Environment
Add to `/home/ubuntu/cryb-platform/apps/react-app/.env.production`:
```bash
VITE_CRYB_TOKEN_ADDRESS=0x...
VITE_STAKING_CONTRACT_ADDRESS=0x...
VITE_GOVERNANCE_CONTRACT_ADDRESS=0x...
VITE_CHAIN_ID=11155111
```

## Troubleshooting

### Error: Insufficient funds
- Get more Sepolia ETH from faucets
- Need ~0.5 ETH for full deployment

### Error: Invalid API key
- Check Alchemy API key is correct
- Ensure you selected Sepolia network when creating app

### Error: Contract size too large
- Already optimized in hardhat.config.js
- If still too large, we can split contracts

### Verification fails
- Wait a few minutes after deployment
- Check Etherscan API key is valid
- Ensure constructor args match exactly

## Quick Test

After deployment, test staking:
```bash
# Using Hardhat console
npx hardhat console --network sepolia

# In console:
const token = await ethers.getContractAt("CRYBToken", "0x<TOKEN_ADDRESS>");
const staking = await ethers.getContractAt("CRYBStaking", "0x<STAKING_ADDRESS>");

// Check balance
await token.balanceOf((await ethers.getSigners())[0].address);

// Approve staking
await token.approve(staking.address, ethers.utils.parseEther("1000"));

// Stake tokens
await staking.deposit(0, ethers.utils.parseEther("1000"));
```

## Next Steps

1. ✅ Deploy contracts
2. ✅ Verify on Etherscan
3. Update frontend with addresses
4. Test staking UI
5. Test governance UI
6. Deploy to mainnet (when ready)

## Support

- Sepolia Faucet: https://sepoliafaucet.com/
- Alchemy Dashboard: https://dashboard.alchemy.com/
- Sepolia Explorer: https://sepolia.etherscan.io/
- Gas Tracker: https://sepolia.etherscan.io/gastracker
