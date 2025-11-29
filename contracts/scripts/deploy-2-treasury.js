const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploy Script 2: Treasury
 * Depends on: CRYBToken
 */

async function main() {
  console.log("\n========================================");
  console.log("  [2/9] DEPLOYING TREASURY");
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

  // Deploy Treasury
  console.log("Deploying Treasury...");
  const Treasury = await ethers.getContractFactory("Treasury");

  const treasury = await Treasury.deploy(tokenAddress);
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();

  console.log("✅ Treasury deployed to:", treasuryAddress);

  // Get deployment transaction
  const deployTx = treasury.deploymentTransaction();
  if (deployTx) {
    const receipt = await deployTx.wait();
    console.log("   Gas used:", receipt.gasUsed.toString());
    console.log("   Block:", receipt.blockNumber);
  }

  // Get treasury info
  const votingPeriod = await treasury.votingPeriod();
  console.log("   Voting Period:", votingPeriod.toString(), "seconds");

  // Save deployment data
  const deploymentData = {
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contract: "Treasury",
    address: treasuryAddress,
    constructorArgs: [tokenAddress],
    config: {
      tokenAddress,
      votingPeriod: votingPeriod.toString(),
    }
  };

  const outputDir = path.join(__dirname, "..", "deployments");
  const filename = `${network.name}-2-treasury.json`;
  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deploymentData, null, 2));

  console.log("\n✅ Deployment complete!");
  console.log("   Data saved to:", filename);

  console.log("\n📋 Verification command:");
  console.log(`npx hardhat verify --network ${network.name} ${treasuryAddress} ${tokenAddress}`);

  console.log("\n========================================\n");

  return { treasuryAddress, deploymentData };
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
