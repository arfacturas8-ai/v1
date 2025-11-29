const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploy Script 5: Community NFT
 * No dependencies
 */

async function main() {
  console.log("\n========================================");
  console.log("  [5/9] DEPLOYING COMMUNITY NFT");
  console.log("========================================\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy CommunityNFT
  console.log("Deploying CommunityNFT...");
  const CommunityNFT = await ethers.getContractFactory("CommunityNFT");

  const name = "CRYB Community";
  const symbol = "CRYBC";
  const baseURI = "ipfs://QmYourBaseURI/"; // Update with actual IPFS URI
  const platformWallet = deployer.address;

  const nft = await CommunityNFT.deploy(
    name,
    symbol,
    baseURI,
    platformWallet
  );

  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();

  console.log("✅ CommunityNFT deployed to:", nftAddress);

  // Get deployment transaction
  const deployTx = nft.deploymentTransaction();
  if (deployTx) {
    const receipt = await deployTx.wait();
    console.log("   Gas used:", receipt.gasUsed.toString());
    console.log("   Block:", receipt.blockNumber);
  }

  // Get NFT info
  const maxSupply = await nft.MAX_SUPPLY();
  const maxMintPerTx = await nft.MAX_MINT_PER_TX();
  console.log("   Max Supply:", maxSupply.toString());
  console.log("   Max Mint Per TX:", maxMintPerTx.toString());

  // Save deployment data
  const deploymentData = {
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contract: "CommunityNFT",
    address: nftAddress,
    constructorArgs: [name, symbol, baseURI, platformWallet],
    config: {
      name,
      symbol,
      baseURI,
      platformWallet,
      maxSupply: maxSupply.toString(),
      maxMintPerTx: maxMintPerTx.toString(),
    }
  };

  const outputDir = path.join(__dirname, "..", "deployments");
  const filename = `${network.name}-5-nft.json`;
  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deploymentData, null, 2));

  console.log("\n✅ Deployment complete!");
  console.log("   Data saved to:", filename);

  console.log("\n📋 Verification command:");
  console.log(`npx hardhat verify --network ${network.name} ${nftAddress} "${name}" "${symbol}" "${baseURI}" ${platformWallet}`);

  console.log("\n💡 Post-deployment steps:");
  console.log("   1. Upload metadata to IPFS");
  console.log("   2. Update base URI if needed using setBaseURI()");
  console.log("   3. Set mint price using setMintPrice()");

  console.log("\n========================================\n");

  return { nftAddress, deploymentData };
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
