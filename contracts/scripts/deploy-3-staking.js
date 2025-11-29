const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploy Script 3: Staking
 * Depends on: CRYBToken
 */

async function main() {
  console.log("\n========================================");
  console.log("  [3/9] DEPLOYING STAKING");
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

  // Deploy Staking
  console.log("Deploying CRYBStaking...");
  const CRYBStaking = await ethers.getContractFactory("CRYBStaking");

  const currentBlock = await ethers.provider.getBlockNumber();
  const rewardPerBlock = ethers.parseEther("10"); // 10 CRYB per block
  const startBlock = currentBlock + 10;

  const staking = await CRYBStaking.deploy(
    tokenAddress,
    rewardPerBlock,
    startBlock
  );

  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();

  console.log("✅ CRYBStaking deployed to:", stakingAddress);

  // Get deployment transaction
  const deployTx = staking.deploymentTransaction();
  if (deployTx) {
    const receipt = await deployTx.wait();
    console.log("   Gas used:", receipt.gasUsed.toString());
    console.log("   Block:", receipt.blockNumber);
  }

  console.log("   Reward per block:", ethers.formatEther(rewardPerBlock), "CRYB");
  console.log("   Start block:", startBlock);

  // Save deployment data
  const deploymentData = {
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contract: "CRYBStaking",
    address: stakingAddress,
    constructorArgs: [tokenAddress, rewardPerBlock.toString(), startBlock],
    config: {
      tokenAddress,
      rewardPerBlock: rewardPerBlock.toString(),
      startBlock,
    }
  };

  const outputDir = path.join(__dirname, "..", "deployments");
  const filename = `${network.name}-3-staking.json`;
  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deploymentData, null, 2));

  console.log("\n✅ Deployment complete!");
  console.log("   Data saved to:", filename);

  console.log("\n📋 Verification command:");
  console.log(`npx hardhat verify --network ${network.name} ${stakingAddress} ${tokenAddress} ${rewardPerBlock.toString()} ${startBlock}`);

  console.log("\n💡 Post-deployment steps:");
  console.log("   1. Transfer reward tokens to staking contract");
  console.log("   2. Create staking pools using add() function");

  console.log("\n========================================\n");

  return { stakingAddress, deploymentData };
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
