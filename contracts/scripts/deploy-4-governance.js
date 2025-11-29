const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploy Script 4: Governance
 * Depends on: CRYBToken, CRYBStaking
 */

async function main() {
  console.log("\n========================================");
  console.log("  [4/9] DEPLOYING GOVERNANCE");
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

  // Deploy Governance
  console.log("Deploying CRYBGovernance...");
  const CRYBGovernance = await ethers.getContractFactory("CRYBGovernance");

  const votingDelay = 1; // 1 block
  const votingPeriod = 50400; // ~1 week (assuming 12s blocks)
  const proposalThreshold = ethers.parseEther("1000000"); // 1M CRYB
  const quorumPercentage = 4; // 4%

  const governance = await CRYBGovernance.deploy(
    tokenAddress,
    deployer.address,
    votingDelay,
    votingPeriod,
    proposalThreshold,
    quorumPercentage
  );

  await governance.waitForDeployment();
  const governanceAddress = await governance.getAddress();

  console.log("✅ CRYBGovernance deployed to:", governanceAddress);

  // Get deployment transaction
  const deployTx = governance.deploymentTransaction();
  if (deployTx) {
    const receipt = await deployTx.wait();
    console.log("   Gas used:", receipt.gasUsed.toString());
    console.log("   Block:", receipt.blockNumber);
  }

  console.log("   Voting Delay:", votingDelay, "blocks");
  console.log("   Voting Period:", votingPeriod, "blocks");
  console.log("   Proposal Threshold:", ethers.formatEther(proposalThreshold), "CRYB");
  console.log("   Quorum:", quorumPercentage, "%");

  // Save deployment data
  const deploymentData = {
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contract: "CRYBGovernance",
    address: governanceAddress,
    constructorArgs: [
      tokenAddress,
      deployer.address,
      votingDelay,
      votingPeriod,
      proposalThreshold.toString(),
      quorumPercentage
    ],
    config: {
      tokenAddress,
      timelock: deployer.address,
      votingDelay,
      votingPeriod,
      proposalThreshold: proposalThreshold.toString(),
      quorumPercentage,
    }
  };

  const outputDir = path.join(__dirname, "..", "deployments");
  const filename = `${network.name}-4-governance.json`;
  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deploymentData, null, 2));

  console.log("\n✅ Deployment complete!");
  console.log("   Data saved to:", filename);

  console.log("\n📋 Verification command:");
  console.log(`npx hardhat verify --network ${network.name} ${governanceAddress} ${tokenAddress} ${deployer.address} ${votingDelay} ${votingPeriod} ${proposalThreshold.toString()} ${quorumPercentage}`);

  console.log("\n========================================\n");

  return { governanceAddress, deploymentData };
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
