# CRYB Platform - Smart Contract Deployment Guide

## Overview
This guide covers the deployment and setup of the CRYB Platform's comprehensive Web3 infrastructure, including smart contracts, DeFi protocols, NFT marketplace, DAO governance, and Layer 2 solutions.

## Prerequisites

### Required Tools
- Node.js v18 or higher
- npm or yarn
- Git
- Hardhat CLI (`npm install -g hardhat`)

### Required Accounts
- Deployer wallet with sufficient gas funds
- Treasury wallet for protocol governance
- Emergency admin wallet for emergency functions
- Team/investor/community wallets for token distribution

### API Keys Required
- Infura or Alchemy project ID for RPC access
- Etherscan API keys for contract verification
- CoinMarketCap API key for gas reporting (optional)
- IPFS project credentials for NFT metadata

## Setup

### 1. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your actual values
nano .env
```

**Critical Environment Variables:**
- `DEPLOYER_PRIVATE_KEY`: Private key for contract deployment
- `ETHEREUM_RPC_URL`: Main network RPC endpoint
- `ETHERSCAN_API_KEY`: For contract verification
- `TEAM_WALLET`, `TREASURY_WALLET`: Distribution addresses

### 2. Install Dependencies
```bash
npm install
```

### 3. Compile Contracts
```bash
npx hardhat compile
```

### 4. Run Tests
```bash
# Run all tests
npx hardhat test

# Run with gas reporting
REPORT_GAS=true npx hardhat test

# Run integration tests
npx hardhat test test/integration.test.js
```

## Deployment

### Local Development
```bash
# Start local node
npx hardhat node

# Deploy to local network
npx hardhat run scripts/deploy-all.js --network localhost
```

### Testnet Deployment
```bash
# Deploy to Goerli
npx hardhat run scripts/deploy-all.js --network goerli

# Deploy to Mumbai (Polygon testnet)
npx hardhat run scripts/deploy-all.js --network mumbai

# Deploy to Arbitrum Goerli
npx hardhat run scripts/deploy-all.js --network arbitrumGoerli
```

### Mainnet Deployment
```bash
# Deploy to Ethereum mainnet
npx hardhat run scripts/deploy-all.js --network ethereum

# Deploy to Polygon
npx hardhat run scripts/deploy-all.js --network polygon

# Deploy to Arbitrum
npx hardhat run scripts/deploy-all.js --network arbitrum

# Deploy to Optimism
npx hardhat run scripts/deploy-all.js --network optimism
```

## Contract Architecture

### Core Contracts

#### 1. CRYB Token (`CRYB.sol`)
- **Purpose**: ERC-20 governance token with staking and vesting
- **Features**: Token gating, anti-whale protection, reward mechanisms
- **Key Functions**: `stake()`, `unstake()`, `createVestingSchedule()`

#### 2. CRYB Governance (`CRYBGovernance.sol`)
- **Purpose**: DAO governance with proposal and voting system
- **Features**: Treasury management, timelock integration
- **Key Functions**: `proposeWithDetails()`, `castVoteWithReasonAndReward()`

#### 3. Multi-Signature Wallet (`CRYBMultiSig.sol`)
- **Purpose**: Secure treasury management with multiple confirmations
- **Features**: Timelock, emergency functions, category-based delays
- **Key Functions**: `submitTransaction()`, `confirmTransaction()`

### DeFi Protocols

#### 4. Staking System (`CRYBStaking.sol`)
- **Purpose**: Advanced staking with multiple pools and rewards
- **Features**: Boost multipliers, auto-compounding, penalty mechanisms
- **Key Functions**: `createPool()`, `deposit()`, `claimRewards()`

#### 5. Yield Farming (`CRYBYieldFarm.sol`)
- **Purpose**: Liquidity mining with dynamic APY
- **Features**: Multiple pools, TVL-based rewards, auto-compound
- **Key Functions**: `addPool()`, `deposit()`, `claimRewards()`

#### 6. Automated Market Maker (`CRYBAMM.sol`)
- **Purpose**: DEX functionality with multiple curve types
- **Features**: Constant product, stable swap, flash loans
- **Key Functions**: `addLiquidity()`, `swap()`, `flashLoan()`

### NFT & Marketplace

#### 7. NFT Collection (`CRYBNFTCollection.sol`)
- **Purpose**: Genesis NFT collection with utility features
- **Features**: Metadata standards, royalty support, batch operations
- **Key Functions**: `mint()`, `batchMint()`, `setTokenURI()`

#### 8. NFT Marketplace (`CRYBMarketplace.sol`)
- **Purpose**: Decentralized NFT trading platform
- **Features**: Multiple auction types, bundle listings, royalties
- **Key Functions**: `listItem()`, `createAuction()`, `buyNow()`

### Utility & Infrastructure

#### 9. Rewards System (`CRYBRewards.sol`)
- **Purpose**: Content creator and community incentives
- **Features**: Quality scoring, referral programs, tier systems
- **Key Functions**: `submitContent()`, `setReferrer()`

#### 10. Cross-Chain Bridge (`CRYBBridge.sol`)
- **Purpose**: Multi-chain asset transfers
- **Features**: Validator consensus, fraud proofs, fee management
- **Key Functions**: `initiateTransfer()`, `confirmTransfer()`

#### 11. Layer 2 Solutions (`CRYBLayer2.sol`)
- **Purpose**: Scalability and state management
- **Features**: State channels, rollup integration, batch processing
- **Key Functions**: `openStateChannel()`, `submitBatch()`

## Post-Deployment Configuration

### 1. Governance Setup
```javascript
// Grant governance roles to timelock
await timelock.grantRole(PROPOSER_ROLE, governance.address);
await timelock.grantRole(EXECUTOR_ROLE, governance.address);
await timelock.renounceRole(TIMELOCK_ADMIN_ROLE, deployer);
```

### 2. Staking Pool Configuration
```javascript
// Create main CRYB staking pool
await staking.createPool(
  cribToken.address,      // LP token
  cribToken.address,      // reward token
  1000,                   // allocation points
  0,                      // lock period
  parseEther("1000"),     // min stake
  parseEther("1000000"),  // max stake
  500,                    // early withdrawal fee
  false                   // auto compound
);
```

### 3. NFT Collection Setup
```javascript
// Set marketplace as approved operator
await nftCollection.setApprovalForAll(marketplace.address, true);

// Configure royalty settings
await nftCollection.setDefaultRoyalty(treasuryWallet, 500); // 5%
```

### 4. Bridge Validator Setup
```javascript
// Add initial validators
await bridge.addValidator(validator1Address, parseEther("10000"));
await bridge.addValidator(validator2Address, parseEther("10000"));
await bridge.addValidator(validator3Address, parseEther("10000"));
```

## Verification

### Contract Verification
Contracts are automatically verified during deployment if `VERIFY_CONTRACTS=true` in environment.

Manual verification:
```bash
npx hardhat verify --network ethereum 0x... "Constructor Args"
```

### Security Audits
Before mainnet deployment:
1. Run static analysis tools (Slither, Mythril)
2. Conduct internal security review
3. Engage professional audit firm
4. Implement bug bounty program

## Monitoring & Maintenance

### Gas Optimization
- Monitor gas usage with `npx hardhat test --gas-reporter`
- Optimize high-frequency functions
- Consider proxy patterns for upgradability

### Performance Metrics
- Track TVL across staking pools
- Monitor governance participation rates
- Analyze NFT marketplace volume
- Bridge transaction success rates

### Emergency Procedures
1. **Pause Contracts**: Use emergency admin to pause operations
2. **Governance Override**: Multi-sig can execute emergency proposals
3. **Bridge Halt**: Validators can collectively halt bridge operations
4. **Incident Response**: Document and communicate issues transparently

## Integration Examples

### Frontend Integration
```javascript
// Connect to CRYB token contract
const crybToken = new ethers.Contract(
  CRYB_TOKEN_ADDRESS,
  CRYB_TOKEN_ABI,
  signer
);

// Stake tokens
await crybToken.stake(ethers.utils.parseEther("1000"));

// Create governance proposal
await governance.proposeWithDetails(
  targets,
  values,
  calldatas,
  description,
  category,
  priority
);
```

### API Integration
```javascript
// Check staking rewards
const rewards = await staking.pendingRewards(poolId, userAddress);

// Get NFT marketplace listings
const listings = await marketplace.getActiveListings(0, 100);

// Bridge transaction status
const status = await bridge.getTransactionStatus(txHash);
```

## Troubleshooting

### Common Issues
1. **Gas Estimation Failures**: Check network congestion and gas limits
2. **Contract Size Limits**: Enable via-ir compilation for large contracts
3. **Verification Failures**: Ensure constructor arguments match exactly
4. **Bridge Delays**: Allow time for validator consensus

### Support Resources
- GitHub Issues: Report bugs and feature requests
- Discord: Community support and discussions
- Documentation: Comprehensive API reference
- Audit Reports: Security analysis and recommendations

## Contributing

### Development Workflow
1. Fork repository and create feature branch
2. Write tests for new functionality
3. Ensure all tests pass and gas usage is optimized
4. Submit pull request with detailed description
5. Address code review feedback

### Coding Standards
- Follow Solidity style guide
- Include comprehensive natspec documentation
- Write unit and integration tests
- Optimize for gas efficiency
- Consider security implications

## License
MIT License - see LICENSE file for details.

---

** Security Notice**: These contracts handle valuable assets. Always conduct thorough testing and security audits before mainnet deployment. Never deploy with test private keys or on production networks without proper security measures.