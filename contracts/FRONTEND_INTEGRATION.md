# Frontend Integration Guide

## Overview

This guide explains how to integrate the deployed CRYB Platform smart contracts with the React frontend application.

---

## Quick Integration

### Step 1: Copy Contract Data

After deploying to Sepolia, copy the deployment file to the frontend:

```bash
# From the contracts directory
cp deployments/sepolia-latest.json ../apps/react-app/src/contracts/addresses.json
cp deployments/sepolia-config.js ../apps/react-app/src/contracts/config.js
```

### Step 2: Update Frontend Environment

```bash
cd ../apps/react-app

# Add these to your .env file
cat >> .env << 'EOF'
VITE_NETWORK=sepolia
VITE_CHAIN_ID=11155111
VITE_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Contract Addresses (from deployment)
VITE_CRYB_TOKEN_ADDRESS=0x...
VITE_STAKING_ADDRESS=0x...
VITE_GOVERNANCE_ADDRESS=0x...
VITE_NFT_MARKETPLACE_ADDRESS=0x...
VITE_COMMUNITY_NFT_ADDRESS=0x...
VITE_TOKEN_GATING_ADDRESS=0x...
VITE_TIPPING_ADDRESS=0x...
VITE_SUBSCRIPTION_ADDRESS=0x...
VITE_TREASURY_ADDRESS=0x...
EOF
```

---

## Contract ABIs and Addresses

### Generated Files

After running `npm run generate-frontend-files`, you'll have:

1. **Contract ABIs**: `artifacts/contracts/*/ContractName.json`
2. **TypeScript Types**: `typechain/` (if using TypeScript)
3. **Deployment Config**: `deployments/sepolia-config.js`

### Using Contract ABIs in Frontend

#### Option 1: Direct Import (Recommended)

```javascript
// Import ABI from artifacts
import CRYBTokenABI from '@/contracts/artifacts/contracts/CRYBToken.sol/CRYBToken.json';
import StakingABI from '@/contracts/artifacts/contracts/CRYBStaking.sol/CRYBStaking.json';

// Import addresses
import { CONTRACT_ADDRESSES } from '@/contracts/config';

// Create contract instance with ethers.js
import { ethers } from 'ethers';

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

const tokenContract = new ethers.Contract(
  CONTRACT_ADDRESSES.CRYB_TOKEN,
  CRYBTokenABI.abi,
  signer
);

// Use the contract
const balance = await tokenContract.balanceOf(userAddress);
```

#### Option 2: Create Contract Hooks (React)

```javascript
// hooks/useContracts.js
import { useMemo } from 'react';
import { useProvider, useSigner } from 'wagmi'; // or your web3 library
import { ethers } from 'ethers';

import CRYBTokenABI from '@/contracts/artifacts/contracts/CRYBToken.sol/CRYBToken.json';
import StakingABI from '@/contracts/artifacts/contracts/CRYBStaking.sol/CRYBStaking.json';
import { CONTRACT_ADDRESSES } from '@/contracts/config';

export function useTokenContract() {
  const provider = useProvider();
  const { data: signer } = useSigner();

  return useMemo(() => {
    if (!signer) return null;
    return new ethers.Contract(
      CONTRACT_ADDRESSES.CRYB_TOKEN,
      CRYBTokenABI.abi,
      signer
    );
  }, [signer]);
}

export function useStakingContract() {
  const { data: signer } = useSigner();

  return useMemo(() => {
    if (!signer) return null;
    return new ethers.Contract(
      CONTRACT_ADDRESSES.STAKING,
      StakingABI.abi,
      signer
    );
  }, [signer]);
}

// Usage in component
function StakingComponent() {
  const stakingContract = useStakingContract();

  const handleStake = async (amount) => {
    const tx = await stakingContract.deposit(0, ethers.parseEther(amount));
    await tx.wait();
  };

  return <button onClick={() => handleStake('100')}>Stake 100 CRYB</button>;
}
```

---

## Contract Integration Examples

### 1. CRYB Token (ERC-20)

```javascript
import CRYBTokenABI from '@/contracts/artifacts/contracts/CRYBToken.sol/CRYBToken.json';

// Check balance
async function getBalance(address) {
  const balance = await tokenContract.balanceOf(address);
  return ethers.formatEther(balance);
}

// Transfer tokens
async function transfer(toAddress, amount) {
  const tx = await tokenContract.transfer(
    toAddress,
    ethers.parseEther(amount)
  );
  await tx.wait();
  return tx.hash;
}

// Approve spending
async function approve(spenderAddress, amount) {
  const tx = await tokenContract.approve(
    spenderAddress,
    ethers.parseEther(amount)
  );
  await tx.wait();
  return tx.hash;
}

// Get token info
async function getTokenInfo() {
  const [name, symbol, decimals, totalSupply] = await Promise.all([
    tokenContract.name(),
    tokenContract.symbol(),
    tokenContract.decimals(),
    tokenContract.totalSupply(),
  ]);

  return {
    name,
    symbol,
    decimals,
    totalSupply: ethers.formatEther(totalSupply),
  };
}
```

### 2. Staking Contract

```javascript
import StakingABI from '@/contracts/artifacts/contracts/CRYBStaking.sol/CRYBStaking.json';

// Stake tokens
async function stake(poolId, amount) {
  // First approve the staking contract
  const tokenContract = getTokenContract();
  const approveTx = await tokenContract.approve(
    CONTRACT_ADDRESSES.STAKING,
    ethers.parseEther(amount)
  );
  await approveTx.wait();

  // Then stake
  const tx = await stakingContract.deposit(poolId, ethers.parseEther(amount));
  await tx.wait();
  return tx.hash;
}

// Withdraw staked tokens
async function withdraw(poolId, amount) {
  const tx = await stakingContract.withdraw(poolId, ethers.parseEther(amount));
  await tx.wait();
  return tx.hash;
}

// Get user staking info
async function getUserInfo(poolId, userAddress) {
  const [amount, rewardDebt] = await stakingContract.userInfo(poolId, userAddress);

  return {
    stakedAmount: ethers.formatEther(amount),
    rewardDebt: ethers.formatEther(rewardDebt),
  };
}

// Get pending rewards
async function getPendingRewards(poolId, userAddress) {
  const pending = await stakingContract.pendingReward(poolId, userAddress);
  return ethers.formatEther(pending);
}

// Harvest rewards
async function harvest(poolId) {
  const tx = await stakingContract.deposit(poolId, 0); // Deposit 0 to harvest
  await tx.wait();
  return tx.hash;
}
```

### 3. Governance Contract

```javascript
import GovernanceABI from '@/contracts/artifacts/contracts/CRYBGovernance.sol/CRYBGovernance.json';

// Create proposal
async function createProposal(title, description) {
  const tx = await governanceContract.createProposal(title, description);
  const receipt = await tx.wait();

  // Get proposal ID from event
  const event = receipt.logs.find(
    (log) => log.fragment.name === 'ProposalCreated'
  );
  const proposalId = event.args.proposalId;

  return proposalId;
}

// Vote on proposal
async function vote(proposalId, support) {
  // support: 0 = Against, 1 = For, 2 = Abstain
  const tx = await governanceContract.castVote(proposalId, support);
  await tx.wait();
  return tx.hash;
}

// Get proposal details
async function getProposal(proposalId) {
  const proposal = await governanceContract.getProposal(proposalId);

  return {
    id: proposal.id,
    proposer: proposal.proposer,
    title: proposal.title,
    description: proposal.description,
    forVotes: ethers.formatEther(proposal.forVotes),
    againstVotes: ethers.formatEther(proposal.againstVotes),
    abstainVotes: ethers.formatEther(proposal.abstainVotes),
    state: proposal.state, // 0=Pending, 1=Active, 2=Canceled, 3=Defeated, 4=Succeeded, 5=Queued, 6=Executed
    startBlock: proposal.startBlock.toString(),
    endBlock: proposal.endBlock.toString(),
  };
}

// Get all active proposals
async function getActiveProposals() {
  const proposalCount = await governanceContract.proposalCount();
  const proposals = [];

  for (let i = 0; i < proposalCount; i++) {
    const proposal = await getProposal(i);
    if (proposal.state === 1) {
      // Active
      proposals.push(proposal);
    }
  }

  return proposals;
}
```

### 4. NFT Marketplace

```javascript
import MarketplaceABI from '@/contracts/artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json';

// List NFT for sale
async function listNFT(nftAddress, tokenId, price) {
  // First approve the marketplace to transfer the NFT
  const nftContract = new ethers.Contract(nftAddress, ERC721_ABI, signer);
  const approveTx = await nftContract.approve(
    CONTRACT_ADDRESSES.NFT_MARKETPLACE,
    tokenId
  );
  await approveTx.wait();

  // Then list it
  const tx = await marketplaceContract.listItem(
    nftAddress,
    tokenId,
    ethers.parseEther(price)
  );
  const receipt = await tx.wait();

  // Get listing ID from event
  const event = receipt.logs.find((log) => log.fragment.name === 'ItemListed');
  const listingId = event.args.listingId;

  return listingId;
}

// Buy NFT
async function buyNFT(listingId, price) {
  const tx = await marketplaceContract.buyItem(listingId, {
    value: ethers.parseEther(price),
  });
  await tx.wait();
  return tx.hash;
}

// Cancel listing
async function cancelListing(listingId) {
  const tx = await marketplaceContract.cancelListing(listingId);
  await tx.wait();
  return tx.hash;
}

// Get listing details
async function getListing(listingId) {
  const listing = await marketplaceContract.getListing(listingId);

  return {
    seller: listing.seller,
    nftContract: listing.nftContract,
    tokenId: listing.tokenId.toString(),
    price: ethers.formatEther(listing.price),
    isActive: listing.isActive,
  };
}

// Get all active listings
async function getActiveListings() {
  const listingCount = await marketplaceContract.listingIdCounter();
  const listings = [];

  for (let i = 0; i < listingCount; i++) {
    const listing = await getListing(i);
    if (listing.isActive) {
      listings.push({ ...listing, id: i });
    }
  }

  return listings;
}
```

### 5. Tipping Contract

```javascript
import TippingABI from '@/contracts/artifacts/contracts/TippingContract.sol/TippingContract.json';

// Tip in ETH
async function tipETH(recipientAddress, amount, message) {
  const tx = await tippingContract.tipETH(recipientAddress, message, {
    value: ethers.parseEther(amount),
  });
  await tx.wait();
  return tx.hash;
}

// Tip in CRYB tokens
async function tipToken(recipientAddress, amount, message) {
  // First approve
  const tokenContract = getTokenContract();
  const approveTx = await tokenContract.approve(
    CONTRACT_ADDRESSES.TIPPING,
    ethers.parseEther(amount)
  );
  await approveTx.wait();

  // Then tip
  const tx = await tippingContract.tipToken(
    CONTRACT_ADDRESSES.CRYB_TOKEN,
    recipientAddress,
    ethers.parseEther(amount),
    message
  );
  await tx.wait();
  return tx.hash;
}

// Get total tips received
async function getTipsReceived(address) {
  const totalETH = await tippingContract.totalTipsReceived(
    address,
    ethers.ZeroAddress
  );
  const totalCRYB = await tippingContract.totalTipsReceived(
    address,
    CONTRACT_ADDRESSES.CRYB_TOKEN
  );

  return {
    eth: ethers.formatEther(totalETH),
    cryb: ethers.formatEther(totalCRYB),
  };
}
```

### 6. Subscription Contract

```javascript
import SubscriptionABI from '@/contracts/artifacts/contracts/Subscription.sol/Subscription.json';

// Create subscription tier
async function createTier(price, duration, name, description) {
  const tx = await subscriptionContract.createTier(
    ethers.parseEther(price),
    duration, // in seconds
    name,
    description
  );
  const receipt = await tx.wait();

  const event = receipt.logs.find((log) => log.fragment.name === 'TierCreated');
  const tierId = event.args.tierId;

  return tierId;
}

// Subscribe to tier
async function subscribe(creatorAddress, tierId) {
  // Get tier details first
  const tier = await subscriptionContract.getTier(creatorAddress, tierId);

  const tx = await subscriptionContract.subscribe(creatorAddress, tierId, {
    value: tier.price,
  });
  await tx.wait();
  return tx.hash;
}

// Check if user is subscribed
async function isSubscribed(userAddress, creatorAddress, tierId) {
  const sub = await subscriptionContract.getSubscription(
    userAddress,
    creatorAddress,
    tierId
  );

  const now = Math.floor(Date.now() / 1000);
  return sub.expiresAt > now;
}
```

---

## Event Listening

### Listen to Contract Events

```javascript
// Listen for token transfers
tokenContract.on('Transfer', (from, to, amount, event) => {
  console.log('Transfer:', {
    from,
    to,
    amount: ethers.formatEther(amount),
    txHash: event.log.transactionHash,
  });
});

// Listen for new proposals
governanceContract.on('ProposalCreated', (proposalId, proposer, title, event) => {
  console.log('New Proposal:', {
    id: proposalId.toString(),
    proposer,
    title,
  });
});

// Listen for NFT listings
marketplaceContract.on('ItemListed', (listingId, seller, nftContract, tokenId, price) => {
  console.log('NFT Listed:', {
    listingId: listingId.toString(),
    seller,
    price: ethers.formatEther(price),
  });
});

// Stop listening
tokenContract.removeAllListeners('Transfer');
```

### Query Historical Events

```javascript
// Get past transfer events
const filter = tokenContract.filters.Transfer(null, userAddress);
const events = await tokenContract.queryFilter(filter, -10000); // Last 10000 blocks

const transfers = events.map((event) => ({
  from: event.args.from,
  to: event.args.to,
  amount: ethers.formatEther(event.args.value),
  blockNumber: event.blockNumber,
  txHash: event.transactionHash,
}));
```

---

## Error Handling

### Handle Common Errors

```javascript
async function safeContractCall(contractFunction, ...args) {
  try {
    const tx = await contractFunction(...args);
    const receipt = await tx.wait();
    return { success: true, receipt };
  } catch (error) {
    // User rejected transaction
    if (error.code === 4001) {
      return { success: false, error: 'Transaction rejected by user' };
    }

    // Insufficient funds
    if (error.code === 'INSUFFICIENT_FUNDS') {
      return { success: false, error: 'Insufficient funds for transaction' };
    }

    // Contract revert
    if (error.code === 'CALL_EXCEPTION') {
      return { success: false, error: error.reason || 'Contract call failed' };
    }

    // Network error
    if (error.code === 'NETWORK_ERROR') {
      return { success: false, error: 'Network error, please try again' };
    }

    return { success: false, error: error.message };
  }
}

// Usage
const result = await safeContractCall(
  tokenContract.transfer,
  recipientAddress,
  ethers.parseEther('100')
);

if (result.success) {
  console.log('Transfer successful:', result.receipt.hash);
} else {
  console.error('Transfer failed:', result.error);
}
```

---

## Testing Integration

### Local Testing with Hardhat Network

```bash
# Start local Hardhat node
npx hardhat node

# In another terminal, deploy to local network
npx hardhat run scripts/deploy-all-contracts.js --network localhost

# Update frontend to use localhost
# .env
VITE_RPC_URL=http://127.0.0.1:8545
VITE_CHAIN_ID=31337
```

### Connect MetaMask to Local Network

1. Open MetaMask
2. Add Network:
   - Network Name: Hardhat Local
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Currency Symbol: ETH

3. Import test account from Hardhat node output

---

## Utility Functions

### Format and Parse Values

```javascript
// Format wei to ether
const formatted = ethers.formatEther(weiAmount);

// Parse ether to wei
const wei = ethers.parseEther('1.5');

// Format with custom decimals
const formattedUSDC = ethers.formatUnits(usdcAmount, 6); // USDC has 6 decimals

// Truncate address for display
function truncateAddress(address) {
  return `${address.substring(0, 6)}...${address.substring(38)}`;
}

// Format number with commas
function formatNumber(num) {
  return new Intl.NumberFormat().format(num);
}
```

---

## Complete Example: Staking Dashboard

```javascript
import { useState, useEffect } from 'react';
import { useAccount, useProvider, useSigner } from 'wagmi';
import { ethers } from 'ethers';

import StakingABI from '@/contracts/artifacts/contracts/CRYBStaking.sol/CRYBStaking.json';
import TokenABI from '@/contracts/artifacts/contracts/CRYBToken.sol/CRYBToken.json';
import { CONTRACT_ADDRESSES } from '@/contracts/config';

function StakingDashboard() {
  const { address } = useAccount();
  const provider = useProvider();
  const { data: signer } = useSigner();

  const [balance, setBalance] = useState('0');
  const [stakedAmount, setStakedAmount] = useState('0');
  const [pendingRewards, setPendingRewards] = useState('0');
  const [stakeAmount, setStakeAmount] = useState('');

  const tokenContract = useMemo(() => {
    if (!signer) return null;
    return new ethers.Contract(CONTRACT_ADDRESSES.CRYB_TOKEN, TokenABI.abi, signer);
  }, [signer]);

  const stakingContract = useMemo(() => {
    if (!signer) return null;
    return new ethers.Contract(CONTRACT_ADDRESSES.STAKING, StakingABI.abi, signer);
  }, [signer]);

  // Load user data
  useEffect(() => {
    if (!address || !tokenContract || !stakingContract) return;

    async function loadData() {
      const [bal, userInfo, pending] = await Promise.all([
        tokenContract.balanceOf(address),
        stakingContract.userInfo(0, address),
        stakingContract.pendingReward(0, address),
      ]);

      setBalance(ethers.formatEther(bal));
      setStakedAmount(ethers.formatEther(userInfo[0]));
      setPendingRewards(ethers.formatEther(pending));
    }

    loadData();

    // Refresh every 10 seconds
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [address, tokenContract, stakingContract]);

  async function handleStake() {
    if (!stakeAmount || !tokenContract || !stakingContract) return;

    try {
      // Approve
      const approveTx = await tokenContract.approve(
        CONTRACT_ADDRESSES.STAKING,
        ethers.parseEther(stakeAmount)
      );
      await approveTx.wait();

      // Stake
      const stakeTx = await stakingContract.deposit(0, ethers.parseEther(stakeAmount));
      await stakeTx.wait();

      alert('Staked successfully!');
      setStakeAmount('');
    } catch (error) {
      console.error('Stake failed:', error);
      alert('Stake failed: ' + error.message);
    }
  }

  async function handleHarvest() {
    try {
      const tx = await stakingContract.deposit(0, 0);
      await tx.wait();
      alert('Rewards harvested!');
    } catch (error) {
      console.error('Harvest failed:', error);
      alert('Harvest failed: ' + error.message);
    }
  }

  return (
    <div className="staking-dashboard">
      <h2>CRYB Staking</h2>

      <div className="stats">
        <div>Balance: {balance} CRYB</div>
        <div>Staked: {stakedAmount} CRYB</div>
        <div>Pending Rewards: {pendingRewards} CRYB</div>
      </div>

      <div className="actions">
        <input
          type="number"
          value={stakeAmount}
          onChange={(e) => setStakeAmount(e.target.value)}
          placeholder="Amount to stake"
        />
        <button onClick={handleStake}>Stake</button>
        <button onClick={handleHarvest}>Harvest Rewards</button>
      </div>
    </div>
  );
}

export default StakingDashboard;
```

---

## Resources

- **Ethers.js Docs**: https://docs.ethers.org/v6/
- **Wagmi Docs**: https://wagmi.sh/
- **RainbowKit**: https://www.rainbowkit.com/
- **Web3Modal**: https://web3modal.com/

---

**Last Updated**: November 3, 2025
