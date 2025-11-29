const fs = require("fs");
const path = require("path");

/**
 * Generate frontend integration files:
 * - Contract ABIs
 * - TypeScript types
 * - Contract addresses
 */

async function main() {
  console.log("📦 Generating Frontend Integration Files...\n");

  const contractsDir = path.join(__dirname, "..", "artifacts", "contracts");
  const outputDir = path.join(__dirname, "..", "frontend-integration");
  const abisDir = path.join(outputDir, "abis");

  // Create output directories
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  if (!fs.existsSync(abisDir)) {
    fs.mkdirSync(abisDir, { recursive: true });
  }

  // Contract names to extract
  const contracts = [
    "CRYBToken",
    "CRYBStaking",
    "CRYBGovernance",
    "NFTMarketplace",
    "CommunityNFT",
    "TokenGating",
    "TippingContract",
    "Subscription",
    "Treasury"
  ];

  const abis = {};

  console.log("📝 Extracting ABIs...");

  for (const contractName of contracts) {
    const artifactPath = path.join(contractsDir, `${contractName}.sol`, `${contractName}.json`);

    if (fs.existsSync(artifactPath)) {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
      abis[contractName] = artifact.abi;

      // Save individual ABI file
      const abiPath = path.join(abisDir, `${contractName}.json`);
      fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));
      console.log(`   ✅ ${contractName}.json`);
    } else {
      console.warn(`   ⚠️  ${contractName} artifact not found`);
    }
  }

  // Create index file for ABIs
  const abiIndexContent = `// Auto-generated ABI exports
// Generated: ${new Date().toISOString()}

${contracts.map(name => `import ${name}ABI from './${name}.json';`).join('\n')}

export const ABIS = {
${contracts.map(name => `  ${name}: ${name}ABI,`).join('\n')}
};

export {
${contracts.map(name => `  ${name}ABI,`).join('\n')}
};
`;

  const abiIndexPath = path.join(abisDir, "index.js");
  fs.writeFileSync(abiIndexPath, abiIndexContent);
  console.log(`   ✅ index.js\n`);

  // Copy deployment config if it exists
  const latestDeployment = path.join(__dirname, "..", "deployments", "hardhat-latest.json");
  if (fs.existsSync(latestDeployment)) {
    const deploymentData = JSON.parse(fs.readFileSync(latestDeployment, "utf8"));

    // Create addresses file
    const addressesContent = `// Auto-generated contract addresses
// Generated: ${new Date().toISOString()}
// Network: ${deploymentData.network}

export const DEPLOYED_CONTRACTS = ${JSON.stringify(deploymentData.contracts, null, 2)};

export const CONTRACT_ADDRESSES = {
${Object.keys(deploymentData.contracts).map(name =>
  `  ${name}: '${deploymentData.contracts[name].address}',`
).join('\n')}
};
`;

    const addressesPath = path.join(outputDir, "addresses.js");
    fs.writeFileSync(addressesPath, addressesContent);
    console.log("📍 Contract addresses exported");
  }

  // Copy config file
  const configFile = path.join(__dirname, "..", "deployments", "hardhat-config.js");
  if (fs.existsSync(configFile)) {
    const configDest = path.join(outputDir, "config.js");
    fs.copyFileSync(configFile, configDest);
    console.log("⚙️  Config file copied");
  }

  // Create README
  const readmeContent = `# Frontend Integration Files

Generated: ${new Date().toISOString()}

## Files

- \`abis/\` - Contract ABIs for ethers.js/web3.js
- \`addresses.js\` - Deployed contract addresses
- \`config.js\` - Network and contract configuration

## Usage

### With ethers.js v6

\`\`\`javascript
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
\`\`\`

### With React

\`\`\`javascript
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
\`\`\`

## Contracts Deployed

${contracts.map((name, i) => `${i + 1}. ${name}`).join('\n')}

## Next Steps

1. Copy these files to your React app: \`/src/contracts/\`
2. Install ethers: \`npm install ethers\`
3. Import and use contracts in your components
4. Connect to MetaMask or other Web3 wallet

## Testing

For local testing with Hardhat:
- Network: hardhat
- Chain ID: 31337
- RPC: http://127.0.0.1:8545

## Production Deployment

After deploying to testnet/mainnet:
1. Run: \`npx hardhat run scripts/deploy-v6.js --network sepolia\`
2. Re-run this script: \`npx hardhat run scripts/generate-frontend-files.js\`
3. Copy updated files to your app
4. Update frontend to use correct chain ID
`;

  const readmePath = path.join(outputDir, "README.md");
  fs.writeFileSync(readmePath, readmeContent);
  console.log("📖 README.md created\n");

  console.log("═══════════════════════════════════════════");
  console.log("✅ Frontend Integration Files Generated!");
  console.log("═══════════════════════════════════════════");
  console.log("Output directory:", outputDir);
  console.log("\nFiles created:");
  console.log("  - abis/ (9 contract ABIs)");
  console.log("  - addresses.js");
  console.log("  - config.js");
  console.log("  - README.md");
  console.log("\nTo use in your React app:");
  console.log(`  cp -r ${outputDir}/* /path/to/your/app/src/contracts/`);
  console.log("═══════════════════════════════════════════\n");
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main };
