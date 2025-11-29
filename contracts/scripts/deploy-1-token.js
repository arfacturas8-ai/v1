const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploy Script 1: CRYB Token
 * Base ERC20 token - no dependencies
 */

async function main() {
  console.log("\n========================================");
  console.log("  [1/9] DEPLOYING CRYB TOKEN");
  console.log("========================================\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy CRYBToken
  console.log("Deploying CRYBToken...");
  const CRYBToken = await ethers.getContractFactory("CRYBToken");

  const token = await CRYBToken.deploy(
    deployer.address, // team wallet
    deployer.address, // investor wallet
    deployer.address, // liquidity wallet
    deployer.address, // community wallet
    deployer.address  // reserve wallet
  );

  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();

  console.log("✅ CRYBToken deployed to:", tokenAddress);

  // Get deployment transaction
  const deployTx = token.deploymentTransaction();
  if (deployTx) {
    const receipt = await deployTx.wait();
    console.log("   Gas used:", receipt.gasUsed.toString());
    console.log("   Block:", receipt.blockNumber);
  }

  // Get token info
  const totalSupply = await token.totalSupply();
  console.log("   Total Supply:", ethers.formatEther(totalSupply), "CRYB");

  // Save deployment data
  const deploymentData = {
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contract: "CRYBToken",
    address: tokenAddress,
    constructorArgs: [
      deployer.address,
      deployer.address,
      deployer.address,
      deployer.address,
      deployer.address
    ],
    totalSupply: totalSupply.toString(),
  };

  const outputDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filename = `${network.name}-1-token.json`;
  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deploymentData, null, 2));

  console.log("\n✅ Deployment complete!");
  console.log("   Data saved to:", filename);

  console.log("\n📋 Verification command:");
  console.log(`npx hardhat verify --network ${network.name} ${tokenAddress} ${deployer.address} ${deployer.address} ${deployer.address} ${deployer.address} ${deployer.address}`);

  console.log("\n========================================\n");

  return { tokenAddress, deploymentData };
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
