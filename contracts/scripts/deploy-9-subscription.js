const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploy Script 9: Subscription
 * Depends on: CRYBToken, Treasury (optional)
 */

async function main() {
  console.log("\n========================================");
  console.log("  [9/9] DEPLOYING SUBSCRIPTION");
  console.log("========================================\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy Subscription
  console.log("Deploying Subscription...");
  const Subscription = await ethers.getContractFactory("Subscription");

  const platformWallet = deployer.address;
  const subscription = await Subscription.deploy(platformWallet);

  await subscription.waitForDeployment();
  const subscriptionAddress = await subscription.getAddress();

  console.log("✅ Subscription deployed to:", subscriptionAddress);

  // Get deployment transaction
  const deployTx = subscription.deploymentTransaction();
  if (deployTx) {
    const receipt = await deployTx.wait();
    console.log("   Gas used:", receipt.gasUsed.toString());
    console.log("   Block:", receipt.blockNumber);
  }

  // Get subscription info
  const platformFee = await subscription.platformFeePercent();
  console.log("   Platform Fee:", platformFee.toString(), "basis points");

  // Save deployment data
  const deploymentData = {
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contract: "Subscription",
    address: subscriptionAddress,
    constructorArgs: [platformWallet],
    config: {
      platformWallet,
      platformFee: platformFee.toString(),
    }
  };

  const outputDir = path.join(__dirname, "..", "deployments");
  const filename = `${network.name}-9-subscription.json`;
  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deploymentData, null, 2));

  console.log("\n✅ Deployment complete!");
  console.log("   Data saved to:", filename);

  console.log("\n📋 Verification command:");
  console.log(`npx hardhat verify --network ${network.name} ${subscriptionAddress} ${platformWallet}`);

  console.log("\n💡 Post-deployment steps:");
  console.log("   1. Creators can create subscription tiers");
  console.log("   2. Users can subscribe to creators using ETH or ERC20 tokens");

  console.log("\n========================================\n");

  return { subscriptionAddress, deploymentData };
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
