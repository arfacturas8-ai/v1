const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploy Script 6: NFT Marketplace
 * Depends on: CommunityNFT (optional - works with any ERC721)
 */

async function main() {
  console.log("\n========================================");
  console.log("  [6/9] DEPLOYING NFT MARKETPLACE");
  console.log("========================================\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy NFTMarketplace
  console.log("Deploying NFTMarketplace...");
  const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");

  const platformWallet = deployer.address;
  const marketplace = await NFTMarketplace.deploy(platformWallet);

  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();

  console.log("✅ NFTMarketplace deployed to:", marketplaceAddress);

  // Get deployment transaction
  const deployTx = marketplace.deploymentTransaction();
  if (deployTx) {
    const receipt = await deployTx.wait();
    console.log("   Gas used:", receipt.gasUsed.toString());
    console.log("   Block:", receipt.blockNumber);
  }

  // Get marketplace info
  const platformFee = await marketplace.platformFeePercent();
  console.log("   Platform Fee:", platformFee.toString(), "basis points (2.5%)");

  // Save deployment data
  const deploymentData = {
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contract: "NFTMarketplace",
    address: marketplaceAddress,
    constructorArgs: [platformWallet],
    config: {
      platformWallet,
      platformFee: platformFee.toString(),
    }
  };

  const outputDir = path.join(__dirname, "..", "deployments");
  const filename = `${network.name}-6-marketplace.json`;
  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deploymentData, null, 2));

  console.log("\n✅ Deployment complete!");
  console.log("   Data saved to:", filename);

  console.log("\n📋 Verification command:");
  console.log(`npx hardhat verify --network ${network.name} ${marketplaceAddress} ${platformWallet}`);

  console.log("\n💡 Post-deployment steps:");
  console.log("   1. Users must approve marketplace to transfer their NFTs");
  console.log("   2. Platform can adjust fees using setPlatformFeePercent()");

  console.log("\n========================================\n");

  return { marketplaceAddress, deploymentData };
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
