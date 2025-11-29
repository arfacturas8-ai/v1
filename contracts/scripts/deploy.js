const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Deployment configuration
const DEPLOYMENT_CONFIG = {
  // Token allocation wallets
  teamWallet: process.env.TEAM_WALLET || "0x1234567890123456789012345678901234567890",
  investorWallet: process.env.INVESTOR_WALLET || "0x2345678901234567890123456789012345678901",
  liquidityWallet: process.env.LIQUIDITY_WALLET || "0x3456789012345678901234567890123456789012",
  communityWallet: process.env.COMMUNITY_WALLET || "0x4567890123456789012345678901234567890123",
  reserveWallet: process.env.RESERVE_WALLET || "0x5678901234567890123456789012345678901234",
  
  // NFT configuration
  nftName: process.env.NFT_NAME || "CRYB Genesis Collection",
  nftSymbol: process.env.NFT_SYMBOL || "CRYB",
  placeholderURI: process.env.NFT_PLACEHOLDER_URI || "https://api.cryb.app/metadata/placeholder.json",
  royaltyRecipient: process.env.ROYALTY_RECIPIENT || process.env.TEAM_WALLET || "0x6789012345678901234567890123456789012345",
};

async function main() {
  console.log("🚀 Starting CRYB Platform contract deployment...");
  
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log(`📊 Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`💰 Balance: ${ethers.formatEther(await deployer.provider.getBalance(deployer.address))} ETH`);
  
  // Validate configuration
  validateConfiguration();
  
  const deploymentResults = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    gasUsed: "0",
    contracts: {}
  };
  
  try {
    // Deploy CRYB Token
    console.log("\n📄 Deploying CRYB Token...");
    const crybToken = await deployCRYBToken();
    deploymentResults.contracts.crybToken = crybToken;
    
    // Deploy CRYB NFT Collection
    console.log("\n🖼️ Deploying CRYB NFT Collection...");
    const crybNFT = await deployCRYBNFT();
    deploymentResults.contracts.crybNFT = crybNFT;
    
    // Save deployment results
    await saveDeploymentResults(deploymentResults);
    
    // Print summary
    printDeploymentSummary(deploymentResults);
    
    // Verify contracts if on public network
    if (network.chainId !== 31337n && network.chainId !== 1337n) {
      console.log("\n🔍 Contract verification will be done separately...");
      console.log("Run: npm run verify:<network>");
    }
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

async function deployCRYBToken() {
  const CRYBToken = await ethers.getContractFactory("CRYBToken");
  
  console.log("   ⏳ Deploying with configuration:");
  console.log(`   - Team Wallet: ${DEPLOYMENT_CONFIG.teamWallet}`);
  console.log(`   - Investor Wallet: ${DEPLOYMENT_CONFIG.investorWallet}`);
  console.log(`   - Liquidity Wallet: ${DEPLOYMENT_CONFIG.liquidityWallet}`);
  console.log(`   - Community Wallet: ${DEPLOYMENT_CONFIG.communityWallet}`);
  console.log(`   - Reserve Wallet: ${DEPLOYMENT_CONFIG.reserveWallet}`);
  
  const deployTx = await CRYBToken.deploy(
    DEPLOYMENT_CONFIG.teamWallet,
    DEPLOYMENT_CONFIG.investorWallet,
    DEPLOYMENT_CONFIG.liquidityWallet,
    DEPLOYMENT_CONFIG.communityWallet,
    DEPLOYMENT_CONFIG.reserveWallet
  );
  
  await deployTx.waitForDeployment();
  const address = await deployTx.getAddress();
  const receipt = await deployTx.deploymentTransaction().wait();
  
  console.log(`   ✅ CRYB Token deployed at: ${address}`);
  console.log(`   ⛽ Gas used: ${receipt.gasUsed.toString()}`);
  
  // Verify basic functionality
  const name = await deployTx.name();
  const symbol = await deployTx.symbol();
  const totalSupply = await deployTx.totalSupply();
  
  console.log(`   📊 Name: ${name}`);
  console.log(`   📊 Symbol: ${symbol}`);
  console.log(`   📊 Total Supply: ${ethers.formatEther(totalSupply)} CRYB`);
  
  return {
    name: "CRYBToken",
    address: address,
    constructorArgs: [
      DEPLOYMENT_CONFIG.teamWallet,
      DEPLOYMENT_CONFIG.investorWallet,
      DEPLOYMENT_CONFIG.liquidityWallet,
      DEPLOYMENT_CONFIG.communityWallet,
      DEPLOYMENT_CONFIG.reserveWallet
    ],
    gasUsed: receipt.gasUsed.toString(),
    blockNumber: receipt.blockNumber,
    transactionHash: receipt.hash
  };
}

async function deployCRYBNFT() {
  const CRYBNFTCollection = await ethers.getContractFactory("CRYBNFTCollection");
  
  console.log("   ⏳ Deploying with configuration:");
  console.log(`   - Name: ${DEPLOYMENT_CONFIG.nftName}`);
  console.log(`   - Symbol: ${DEPLOYMENT_CONFIG.nftSymbol}`);
  console.log(`   - Placeholder URI: ${DEPLOYMENT_CONFIG.placeholderURI}`);
  console.log(`   - Team Wallet: ${DEPLOYMENT_CONFIG.teamWallet}`);
  console.log(`   - Royalty Recipient: ${DEPLOYMENT_CONFIG.royaltyRecipient}`);
  
  const deployTx = await CRYBNFTCollection.deploy(
    DEPLOYMENT_CONFIG.nftName,
    DEPLOYMENT_CONFIG.nftSymbol,
    DEPLOYMENT_CONFIG.placeholderURI,
    DEPLOYMENT_CONFIG.teamWallet,
    DEPLOYMENT_CONFIG.royaltyRecipient
  );
  
  await deployTx.waitForDeployment();
  const address = await deployTx.getAddress();
  const receipt = await deployTx.deploymentTransaction().wait();
  
  console.log(`   ✅ CRYB NFT Collection deployed at: ${address}`);
  console.log(`   ⛽ Gas used: ${receipt.gasUsed.toString()}`);
  
  // Verify basic functionality
  const name = await deployTx.name();
  const symbol = await deployTx.symbol();
  const maxSupply = await deployTx.MAX_SUPPLY();
  
  console.log(`   📊 Name: ${name}`);
  console.log(`   📊 Symbol: ${symbol}`);
  console.log(`   📊 Max Supply: ${maxSupply.toString()}`);
  
  return {
    name: "CRYBNFTCollection",
    address: address,
    constructorArgs: [
      DEPLOYMENT_CONFIG.nftName,
      DEPLOYMENT_CONFIG.nftSymbol,
      DEPLOYMENT_CONFIG.placeholderURI,
      DEPLOYMENT_CONFIG.teamWallet,
      DEPLOYMENT_CONFIG.royaltyRecipient
    ],
    gasUsed: receipt.gasUsed.toString(),
    blockNumber: receipt.blockNumber,
    transactionHash: receipt.hash
  };
}

function validateConfiguration() {
  console.log("🔍 Validating deployment configuration...");
  
  const requiredFields = [
    'teamWallet', 'investorWallet', 'liquidityWallet', 
    'communityWallet', 'reserveWallet', 'royaltyRecipient'
  ];
  
  for (const field of requiredFields) {
    if (!DEPLOYMENT_CONFIG[field] || !ethers.isAddress(DEPLOYMENT_CONFIG[field])) {
      throw new Error(`Invalid or missing ${field}: ${DEPLOYMENT_CONFIG[field]}`);
    }
  }
  
  console.log("   ✅ Configuration validated");
}

async function saveDeploymentResults(results) {
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const filename = `deployment-${results.chainId}-${Date.now()}.json`;
  const filepath = path.join(deploymentsDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
  console.log(`📁 Deployment results saved to: ${filepath}`);
  
  // Also save as latest
  const latestPath = path.join(deploymentsDir, `latest-${results.chainId}.json`);
  fs.writeFileSync(latestPath, JSON.stringify(results, null, 2));
}

function printDeploymentSummary(results) {
  console.log("\n🎉 Deployment Summary");
  console.log("=" * 50);
  console.log(`Network: ${results.network} (${results.chainId})`);
  console.log(`Deployer: ${results.deployer}`);
  console.log(`Timestamp: ${results.timestamp}`);
  console.log("\n📄 Deployed Contracts:");
  
  for (const [key, contract] of Object.entries(results.contracts)) {
    console.log(`   ${contract.name}: ${contract.address}`);
    console.log(`     - Gas Used: ${contract.gasUsed}`);
    console.log(`     - Block: ${contract.blockNumber}`);
    console.log(`     - TX: ${contract.transactionHash}`);
  }
  
  console.log("\n🔗 Next Steps:");
  console.log("1. Verify contracts on block explorer");
  console.log("2. Set up token gating rules");
  console.log("3. Configure NFT minting phases");
  console.log("4. Update frontend contract addresses");
  console.log("5. Configure API contract addresses");
}

// Error handling
process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
  process.exit(1);
});

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main, DEPLOYMENT_CONFIG };