const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploy Script 8: Tipping Contract
 * Depends on: CRYBToken
 */

async function main() {
  console.log("\n========================================");
  console.log("  [8/9] DEPLOYING TIPPING CONTRACT");
  console.log("========================================\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH\n");

  // Load token address
  const tokenDeployment = path.join(__dirname, "..", "deployments", `${network.name}-1-token.json`);
  if (!fs.existsSync(tokenDeployment)) {
    console.error("❌ Token deployment not found. Deploy token first:");
    console.error("   npx hardhat run scripts/deploy-1-token.js --network", network.name);
    process.exit(1);
  }

  const tokenData = JSON.parse(fs.readFileSync(tokenDeployment, "utf8"));
  const tokenAddress = tokenData.address;
  console.log("Using CRYBToken:", tokenAddress, "\n");

  // Deploy TippingContract
  console.log("Deploying TippingContract...");
  const TippingContract = await ethers.getContractFactory("TippingContract");

  const platformWallet = deployer.address;
  const tipping = await TippingContract.deploy(platformWallet, tokenAddress);

  await tipping.waitForDeployment();
  const tippingAddress = await tipping.getAddress();

  console.log("✅ TippingContract deployed to:", tippingAddress);

  // Get deployment transaction
  const deployTx = tipping.deploymentTransaction();
  if (deployTx) {
    const receipt = await deployTx.wait();
    console.log("   Gas used:", receipt.gasUsed.toString());
    console.log("   Block:", receipt.blockNumber);
  }

  // Get tipping info
  const platformFee = await tipping.platformFeePercent();
  console.log("   Platform Fee:", platformFee.toString(), "basis points");

  // Save deployment data
  const deploymentData = {
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contract: "TippingContract",
    address: tippingAddress,
    constructorArgs: [platformWallet, tokenAddress],
    config: {
      platformWallet,
      tokenAddress,
      platformFee: platformFee.toString(),
    }
  };

  const outputDir = path.join(__dirname, "..", "deployments");
  const filename = `${network.name}-8-tipping.json`;
  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deploymentData, null, 2));

  console.log("\n✅ Deployment complete!");
  console.log("   Data saved to:", filename);

  console.log("\n📋 Verification command:");
  console.log(`npx hardhat verify --network ${network.name} ${tippingAddress} ${platformWallet} ${tokenAddress}`);

  console.log("\n💡 Post-deployment steps:");
  console.log("   1. Users can tip in ETH or CRYB tokens");
  console.log("   2. Platform fee is deducted from each tip");

  console.log("\n========================================\n");

  return { tippingAddress, deploymentData };
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
