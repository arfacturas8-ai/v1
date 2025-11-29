const { run } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const network = await ethers.provider.getNetwork();
  console.log(`🔍 Verifying contracts on ${network.name} (Chain ID: ${network.chainId})`);
  
  // Load latest deployment
  const deploymentPath = path.join(__dirname, "../deployments", `latest-${network.chainId}.json`);
  
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ No deployment found for this network");
    console.log(`Expected file: ${deploymentPath}`);
    process.exit(1);
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  console.log(`📁 Loaded deployment from: ${deploymentPath}`);
  
  // Verify CRYB Token
  if (deployment.contracts.crybToken) {
    console.log("\n📄 Verifying CRYB Token...");
    await verifyContract(
      deployment.contracts.crybToken.address,
      deployment.contracts.crybToken.constructorArgs,
      "contracts/CRYB.sol:CRYBToken"
    );
  }
  
  // Verify CRYB NFT Collection
  if (deployment.contracts.crybNFT) {
    console.log("\n🖼️ Verifying CRYB NFT Collection...");
    await verifyContract(
      deployment.contracts.crybNFT.address,
      deployment.contracts.crybNFT.constructorArgs,
      "contracts/CRYBNFTCollection.sol:CRYBNFTCollection"
    );
  }
  
  console.log("\n✅ Verification complete!");
}

async function verifyContract(address, constructorArgs, contract) {
  console.log(`   📍 Address: ${address}`);
  console.log(`   🔧 Constructor Args:`, constructorArgs);
  
  try {
    await run("verify:verify", {
      address: address,
      constructorArguments: constructorArgs,
      contract: contract,
    });
    console.log(`   ✅ Successfully verified`);
  } catch (error) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log(`   ✅ Already verified`);
    } else {
      console.error(`   ❌ Verification failed:`, error.message);
      // Don't exit, continue with other contracts
    }
  }
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