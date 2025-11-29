const fs = require("fs");
const path = require("path");

/**
 * Updates frontend with deployed contract addresses
 * Generates TypeScript/JavaScript config files for the React app
 */

async function main() {
  const network = process.argv[2] || "sepolia";

  console.log("============================================");
  console.log("  UPDATING FRONTEND CONTRACT ADDRESSES");
  console.log("============================================\n");

  // Load deployment data
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const deploymentFile = path.join(deploymentsDir, `${network}-latest.json`);

  if (!fs.existsSync(deploymentFile)) {
    console.error("❌ Deployment file not found:", deploymentFile);
    console.error("Please deploy contracts first using:");
    console.error(`   npm run deploy:${network}`);
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));

  console.log("📄 Loaded deployment data:");
  console.log("   Network:", deployment.network);
  console.log("   Chain ID:", deployment.chainId);
  console.log("   Timestamp:", deployment.timestamp);
  console.log("");

  // Generate TypeScript config
  const tsConfig = generateTypeScriptConfig(deployment);

  // Generate JavaScript config (for backwards compatibility)
  const jsConfig = generateJavaScriptConfig(deployment);

  // Find frontend directory
  const frontendDir = path.join(__dirname, "..", "..", "..", "apps", "react-app", "src", "config");
  const altFrontendDir = path.join(__dirname, "..", "..", "apps", "react-app", "src", "config");

  let outputDir;
  if (fs.existsSync(path.join(__dirname, "..", "..", "..", "apps", "react-app"))) {
    outputDir = frontendDir;
  } else if (fs.existsSync(path.join(__dirname, "..", "..", "apps", "react-app"))) {
    outputDir = altFrontendDir;
  } else {
    outputDir = path.join(__dirname, "..", "frontend-config");
    console.log("⚠️  Frontend directory not found, creating config in:", outputDir);
  }

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write TypeScript config
  const tsOutputPath = path.join(outputDir, "contracts.ts");
  fs.writeFileSync(tsOutputPath, tsConfig);
  console.log("✅ TypeScript config written to:", tsOutputPath);

  // Write JavaScript config
  const jsOutputPath = path.join(outputDir, "contracts.js");
  fs.writeFileSync(jsOutputPath, jsConfig);
  console.log("✅ JavaScript config written to:", jsOutputPath);

  // Copy ABIs
  console.log("\n📦 Copying contract ABIs...");
  copyABIs(deployment, outputDir);

  // Generate deployment summary
  console.log("\n📊 Contract Addresses:");
  console.log("========================");
  for (const [name, data] of Object.entries(deployment.contracts)) {
    console.log(`${name.padEnd(20)} ${data.address}`);
  }
  console.log("========================\n");

  console.log("✅ Frontend updated successfully!");
  console.log("\n💡 Next steps:");
  console.log("   1. Import contracts in your frontend:");
  console.log("      import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from '@/config/contracts'");
  console.log("   2. Use with ethers.js or viem");
  console.log("   3. Connect wallet to", network, "network");
  console.log("");
}

function generateTypeScriptConfig(deployment) {
  const contracts = deployment.contracts;

  return `/**
 * Auto-generated Contract Configuration
 * Network: ${deployment.network}
 * Chain ID: ${deployment.chainId}
 * Generated: ${new Date().toISOString()}
 *
 * DO NOT EDIT MANUALLY - Update via: npm run update-frontend
 */

export const NETWORK_CONFIG = {
  network: '${deployment.network}',
  chainId: ${deployment.chainId},
  deployer: '${deployment.deployer}',
  deployedAt: '${deployment.timestamp}',
} as const;

export const CONTRACT_ADDRESSES = {
  CRYBToken: '${contracts.CRYBToken?.address || ""}',
  Treasury: '${contracts.Treasury?.address || ""}',
  CRYBStaking: '${contracts.CRYBStaking?.address || ""}',
  CRYBGovernance: '${contracts.CRYBGovernance?.address || ""}',
  CommunityNFT: '${contracts.CommunityNFT?.address || ""}',
  NFTMarketplace: '${contracts.NFTMarketplace?.address || ""}',
  TokenGating: '${contracts.TokenGating?.address || ""}',
  TippingContract: '${contracts.TippingContract?.address || ""}',
  Subscription: '${contracts.Subscription?.address || ""}',
} as const;

export const CONTRACT_CONFIG = {
  CRYBToken: {
    name: 'CRYB Token',
    symbol: 'CRYB',
    decimals: 18,
    totalSupply: '${contracts.CRYBToken?.config?.totalSupply || "1000000000"}',
  },
  Treasury: {
    votingPeriod: ${contracts.Treasury?.config?.votingPeriod || 604800},
  },
  CRYBStaking: {
    rewardPerBlock: '${contracts.CRYBStaking?.config?.rewardPerBlock || "10000000000000000000"}',
    startBlock: ${contracts.CRYBStaking?.config?.startBlock || 0},
  },
  CRYBGovernance: {
    votingDelay: ${contracts.CRYBGovernance?.config?.votingDelay || 1},
    votingPeriod: ${contracts.CRYBGovernance?.config?.votingPeriod || 50400},
    proposalThreshold: '${contracts.CRYBGovernance?.config?.proposalThreshold || "1000000000000000000000000"}',
    quorumPercentage: ${contracts.CRYBGovernance?.config?.quorumPercentage || 4},
  },
  CommunityNFT: {
    maxSupply: ${contracts.CommunityNFT?.config?.maxSupply || 10000},
    maxMintPerTx: ${contracts.CommunityNFT?.config?.maxMintPerTx || 20},
  },
} as const;

// Chain-specific configuration
export const CHAIN_CONFIG = {
  11155111: {
    name: 'Sepolia',
    rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY',
    blockExplorer: 'https://sepolia.etherscan.io',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  },
  1: {
    name: 'Ethereum',
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY',
    blockExplorer: 'https://etherscan.io',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  },
} as const;

export type ChainId = keyof typeof CHAIN_CONFIG;
export type ContractName = keyof typeof CONTRACT_ADDRESSES;
`;
}

function generateJavaScriptConfig(deployment) {
  const contracts = deployment.contracts;

  return `/**
 * Auto-generated Contract Configuration
 * Network: ${deployment.network}
 * Chain ID: ${deployment.chainId}
 * Generated: ${new Date().toISOString()}
 *
 * DO NOT EDIT MANUALLY - Update via: npm run update-frontend
 */

export const NETWORK_CONFIG = {
  network: '${deployment.network}',
  chainId: ${deployment.chainId},
  deployer: '${deployment.deployer}',
  deployedAt: '${deployment.timestamp}',
};

export const CONTRACT_ADDRESSES = {
  CRYBToken: '${contracts.CRYBToken?.address || ""}',
  Treasury: '${contracts.Treasury?.address || ""}',
  CRYBStaking: '${contracts.CRYBStaking?.address || ""}',
  CRYBGovernance: '${contracts.CRYBGovernance?.address || ""}',
  CommunityNFT: '${contracts.CommunityNFT?.address || ""}',
  NFTMarketplace: '${contracts.NFTMarketplace?.address || ""}',
  TokenGating: '${contracts.TokenGating?.address || ""}',
  TippingContract: '${contracts.TippingContract?.address || ""}',
  Subscription: '${contracts.Subscription?.address || ""}',
};

export const CONTRACT_CONFIG = {
  CRYBToken: {
    name: 'CRYB Token',
    symbol: 'CRYB',
    decimals: 18,
    totalSupply: '${contracts.CRYBToken?.config?.totalSupply || "1000000000"}',
  },
  Treasury: {
    votingPeriod: ${contracts.Treasury?.config?.votingPeriod || 604800},
  },
  CRYBStaking: {
    rewardPerBlock: '${contracts.CRYBStaking?.config?.rewardPerBlock || "10000000000000000000"}',
    startBlock: ${contracts.CRYBStaking?.config?.startBlock || 0},
  },
  CRYBGovernance: {
    votingDelay: ${contracts.CRYBGovernance?.config?.votingDelay || 1},
    votingPeriod: ${contracts.CRYBGovernance?.config?.votingPeriod || 50400},
    proposalThreshold: '${contracts.CRYBGovernance?.config?.proposalThreshold || "1000000000000000000000000"}',
    quorumPercentage: ${contracts.CRYBGovernance?.config?.quorumPercentage || 4},
  },
  CommunityNFT: {
    maxSupply: ${contracts.CommunityNFT?.config?.maxSupply || 10000},
    maxMintPerTx: ${contracts.CommunityNFT?.config?.maxMintPerTx || 20},
  },
};

// Chain-specific configuration
export const CHAIN_CONFIG = {
  11155111: {
    name: 'Sepolia',
    rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY',
    blockExplorer: 'https://sepolia.etherscan.io',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  },
  1: {
    name: 'Ethereum',
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY',
    blockExplorer: 'https://etherscan.io',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  },
};
`;
}

function copyABIs(deployment, outputDir) {
  const artifactsDir = path.join(__dirname, "..", "artifacts", "contracts");
  const abiOutputDir = path.join(outputDir, "abis");

  if (!fs.existsSync(abiOutputDir)) {
    fs.mkdirSync(abiOutputDir, { recursive: true });
  }

  const contractNames = [
    "CRYBToken",
    "Treasury",
    "CRYBStaking",
    "CRYBGovernance",
    "CommunityNFT",
    "NFTMarketplace",
    "TokenGating",
    "TippingContract",
    "Subscription",
  ];

  for (const contractName of contractNames) {
    const artifactPath = path.join(artifactsDir, `${contractName}.sol`, `${contractName}.json`);

    if (fs.existsSync(artifactPath)) {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
      const abi = artifact.abi;

      const abiOutputPath = path.join(abiOutputDir, `${contractName}.json`);
      fs.writeFileSync(abiOutputPath, JSON.stringify(abi, null, 2));

      console.log(`   ✅ ${contractName}.json`);
    } else {
      console.log(`   ⚠️  ${contractName}: ABI not found`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
