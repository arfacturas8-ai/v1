const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploy Script 7: Token Gating
 * Depends on: CRYBToken, CommunityNFT (for configuration)
 */

async function main() {
  console.log("\n========================================");
  console.log("  [7/9] DEPLOYING TOKEN GATING");
  console.log("========================================\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy TokenGating
  console.log("Deploying TokenGating...");
  const TokenGating = await ethers.getContractFactory("TokenGating");

  const tokenGating = await TokenGating.deploy();

  await tokenGating.waitForDeployment();
  const tokenGatingAddress = await tokenGating.getAddress();

  console.log("✅ TokenGating deployed to:", tokenGatingAddress);

  // Get deployment transaction
  const deployTx = tokenGating.deploymentTransaction();
  if (deployTx) {
    const receipt = await deployTx.wait();
    console.log("   Gas used:", receipt.gasUsed.toString());
    console.log("   Block:", receipt.blockNumber);
  }

  // Save deployment data
  const deploymentData = {
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contract: "TokenGating",
    address: tokenGatingAddress,
    constructorArgs: [],
    config: {
      owner: deployer.address,
    }
  };

  const outputDir = path.join(__dirname, "..", "deployments");
  const filename = `${network.name}-7-tokengating.json`;
  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deploymentData, null, 2));

  console.log("\n✅ Deployment complete!");
  console.log("   Data saved to:", filename);

  console.log("\n📋 Verification command:");
  console.log(`npx hardhat verify --network ${network.name} ${tokenGatingAddress}`);

  console.log("\n💡 Post-deployment steps:");
  console.log("   1. Create gating rules using createGatingRule()");
  console.log("   2. Configure ERC20/ERC721 requirements for content access");

  console.log("\n========================================\n");

  return { tokenGatingAddress, deploymentData };
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
