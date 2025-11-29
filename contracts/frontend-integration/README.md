# Frontend Integration Files

Generated: 2025-11-03T19:06:17.263Z

## Files

- `abis/` - Contract ABIs for ethers.js/web3.js
- `addresses.js` - Deployed contract addresses
- `config.js` - Network and contract configuration

## Usage

### With ethers.js v6

```javascript
import { ethers } from 'ethers';
import { CRYBTokenABI } from './abis';
import { CONTRACT_ADDRESSES } from './addresses';

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

const token = new ethers.Contract(
  CONTRACT_ADDRESSES.CRYBToken,
  CRYBTokenABI,
  signer
);

const balance = await token.balanceOf(signer.address);
console.log('Balance:', ethers.formatEther(balance));
```

### With React

```javascript
import { useState, useEffect } from 'react';
import { CONTRACT_ADDRESSES, CONTRACT_CONFIG } from './config';

function App() {
  const [contracts, setContracts] = useState(null);

  useEffect(() => {
    // Initialize contracts
    // ...
  }, []);

  return <div>CRYB Platform</div>;
}
```

## Contracts Deployed

1. CRYBToken
2. CRYBStaking
3. CRYBGovernance
4. NFTMarketplace
5. CommunityNFT
6. TokenGating
7. TippingContract
8. Subscription
9. Treasury

## Next Steps

1. Copy these files to your React app: `/src/contracts/`
2. Install ethers: `npm install ethers`
3. Import and use contracts in your components
4. Connect to MetaMask or other Web3 wallet

## Testing

For local testing with Hardhat:
- Network: hardhat
- Chain ID: 31337
- RPC: http://127.0.0.1:8545

## Production Deployment

After deploying to testnet/mainnet:
1. Run: `npx hardhat run scripts/deploy-v6.js --network sepolia`
2. Re-run this script: `npx hardhat run scripts/generate-frontend-files.js`
3. Copy updated files to your app
4. Update frontend to use correct chain ID
