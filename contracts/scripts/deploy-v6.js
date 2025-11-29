const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Complete deployment script for all CRYB Platform contracts (Ethers v6)
 */

async function main() {
  console.log("🚀 Starting CRYB Platform Full Deployment...");
  console.log("==========================================");
  console.log("📊 Network:", hre.network.name);

  const [deployer] = await hre.ethers.getSigners();
  console.log("👛 Deployer:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", hre.ethers.formatEther(balance), "ETH\n");

  const deploymentData = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {},
    gasUsed: {}
  };

  let totalGasUsed = 0n;

  try {
    // 1. Deploy CRYB Token
    console.log("📝 [1/9] Deploying CRYB Token...");
    const CRYBToken = await hre.ethers.getContractFactory("CRYBToken");
    const token = await CRYBToken.deploy(
      deployer.address,
      deployer.address,
      deployer.address,
      deployer.address,
      deployer.address
    );
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();

    deploymentData.contracts.CRYBToken = {
      address: tokenAddress,
      args: [deployer.address, deployer.address, deployer.address, deployer.address, deployer.address]
    };

    console.log("✅ CRYB Token:", tokenAddress);
    console.log("   Total Supply:", hre.ethers.formatEther(await token.totalSupply()), "CRYB\n");

    // 2. Deploy Staking Contract
    console.log("📝 [2/9] Deploying Staking Contract...");
    const CRYBStaking = await hre.ethers.getContractFactory("CRYBStaking");
    const currentBlock = await hre.ethers.provider.getBlockNumber();
    const rewardPerBlock = hre.ethers.parseEther("10");

    const staking = await CRYBStaking.deploy(
      tokenAddress,
      rewardPerBlock,
      currentBlock + 10
    );
    await staking.waitForDeployment();
    const stakingAddress = await staking.getAddress();

    deploymentData.contracts.CRYBStaking = {
      address: stakingAddress,
      args: [tokenAddress, rewardPerBlock.toString(), currentBlock + 10]
    };

    console.log("✅ Staking Contract:", stakingAddress);
    console.log("   Reward per block:", hre.ethers.formatEther(rewardPerBlock), "CRYB\n");

    // 3. Deploy Governance Contract
    console.log("📝 [3/9] Deploying Governance Contract...");
    const CRYBGovernance = await hre.ethers.getContractFactory("CRYBGovernance");
    const votingDelay = 1;
    const votingPeriod = 50400;
    const proposalThreshold = hre.ethers.parseEther("1000000");
    const quorumPercentage = 4;

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

    deploymentData.contracts.CRYBGovernance = {
      address: governanceAddress,
      args: [tokenAddress, deployer.address, votingDelay, votingPeriod, proposalThreshold.toString(), quorumPercentage]
    };

    console.log("✅ Governance Contract:", governanceAddress);
    console.log("   Voting period:", votingPeriod, "blocks\n");

    // 4. Deploy NFT Marketplace
    console.log("📝 [4/9] Deploying NFT Marketplace...");
    const NFTMarketplace = await hre.ethers.getContractFactory("NFTMarketplace");
    const marketplace = await NFTMarketplace.deploy(deployer.address);
    await marketplace.waitForDeployment();
    const marketplaceAddress = await marketplace.getAddress();

    deploymentData.contracts.NFTMarketplace = {
      address: marketplaceAddress,
      args: [deployer.address]
    };

    console.log("✅ NFT Marketplace:", marketplaceAddress);
    console.log("   Platform Fee:", await marketplace.platformFeePercent(), "basis points\n");

    // 5. Deploy Community NFT
    console.log("📝 [5/9] Deploying Community NFT...");
    const CommunityNFT = await hre.ethers.getContractFactory("CommunityNFT");
    const communityNFT = await CommunityNFT.deploy(
      "CRYB Community",
      "CRYBC",
      "ipfs://placeholder/",
      deployer.address
    );
    await communityNFT.waitForDeployment();
    const communityNFTAddress = await communityNFT.getAddress();

    deploymentData.contracts.CommunityNFT = {
      address: communityNFTAddress,
      args: ["CRYB Community", "CRYBC", "ipfs://placeholder/", deployer.address]
    };

    console.log("✅ Community NFT:", communityNFTAddress);
    console.log("   Max Supply:", (await communityNFT.MAX_SUPPLY()).toString(), "\n");

    // 6. Deploy Token Gating
    console.log("📝 [6/9] Deploying Token Gating...");
    const TokenGating = await hre.ethers.getContractFactory("TokenGating");
    const tokenGating = await TokenGating.deploy();
    await tokenGating.waitForDeployment();
    const tokenGatingAddress = await tokenGating.getAddress();

    deploymentData.contracts.TokenGating = {
      address: tokenGatingAddress,
      args: []
    };

    console.log("✅ Token Gating:", tokenGatingAddress, "\n");

    // 7. Deploy Tipping Contract
    console.log("📝 [7/9] Deploying Tipping Contract...");
    const TippingContract = await hre.ethers.getContractFactory("TippingContract");
    const tipping = await TippingContract.deploy(deployer.address, tokenAddress);
    await tipping.waitForDeployment();
    const tippingAddress = await tipping.getAddress();

    deploymentData.contracts.TippingContract = {
      address: tippingAddress,
      args: [deployer.address, tokenAddress]
    };

    console.log("✅ Tipping Contract:", tippingAddress);
    console.log("   Platform Fee:", await tipping.platformFeePercent(), "basis points\n");

    // 8. Deploy Subscription Contract
    console.log("📝 [8/9] Deploying Subscription Contract...");
    const Subscription = await hre.ethers.getContractFactory("Subscription");
    const subscription = await Subscription.deploy(deployer.address);
    await subscription.waitForDeployment();
    const subscriptionAddress = await subscription.getAddress();

    deploymentData.contracts.Subscription = {
      address: subscriptionAddress,
      args: [deployer.address]
    };

    console.log("✅ Subscription Contract:", subscriptionAddress);
    console.log("   Platform Fee:", await subscription.platformFeePercent(), "basis points\n");

    // 9. Deploy Treasury
    console.log("📝 [9/9] Deploying Treasury Contract...");
    const Treasury = await hre.ethers.getContractFactory("Treasury");
    const treasury = await Treasury.deploy(tokenAddress);
    await treasury.waitForDeployment();
    const treasuryAddress = await treasury.getAddress();

    deploymentData.contracts.Treasury = {
      address: treasuryAddress,
      args: [tokenAddress]
    };

    console.log("✅ Treasury Contract:", treasuryAddress);
    console.log("   Voting Period:", (await treasury.votingPeriod()).toString(), "seconds\n");

    // Post-deployment configuration
    console.log("⚙️  Configuring contracts...");

    const rewardAmount = hre.ethers.parseEther("10000000");
    console.log("   Transferring", hre.ethers.formatEther(rewardAmount), "CRYB to staking...");
    await token.transfer(stakingAddress, rewardAmount);
    console.log("   ✅ Reward tokens transferred");

    console.log("   Creating default staking pool...");
    await staking.add(100, tokenAddress, 0, true);
    console.log("   ✅ Default pool created");

    const treasuryAmount = hre.ethers.parseEther("50000000");
    console.log("   Transferring", hre.ethers.formatEther(treasuryAmount), "CRYB to treasury...");
    await token.transfer(treasuryAddress, treasuryAmount);
    console.log("   ✅ Treasury funded\n");

    // Save deployment data
    const outputDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = `${hre.network.name}-${Date.now()}.json`;
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(deploymentData, null, 2));

    const latestPath = path.join(outputDir, `${hre.network.name}-latest.json`);
    fs.writeFileSync(latestPath, JSON.stringify(deploymentData, null, 2));

    // Generate frontend config
    const frontendConfig = `// Auto-generated contract addresses for ${hre.network.name}
// Generated: ${new Date().toISOString()}

export const NETWORK_CONFIG = {
  NETWORK: '${hre.network.name}',
  CHAIN_ID: ${hre.network.config.chainId},
  DEPLOYER: '${deployer.address}',
};

export const CONTRACT_ADDRESSES = {
  CRYB_TOKEN: '${tokenAddress}',
  STAKING: '${stakingAddress}',
  GOVERNANCE: '${governanceAddress}',
  NFT_MARKETPLACE: '${marketplaceAddress}',
  COMMUNITY_NFT: '${communityNFTAddress}',
  TOKEN_GATING: '${tokenGatingAddress}',
  TIPPING: '${tippingAddress}',
  SUBSCRIPTION: '${subscriptionAddress}',
  TREASURY: '${treasuryAddress}',
};

export const CONTRACT_CONFIG = {
  STAKING: {
    REWARD_PER_BLOCK: '${hre.ethers.formatEther(rewardPerBlock)}',
    START_BLOCK: ${currentBlock + 10},
  },
  GOVERNANCE: {
    VOTING_DELAY: ${votingDelay},
    VOTING_PERIOD: ${votingPeriod},
    PROPOSAL_THRESHOLD: '${hre.ethers.formatEther(proposalThreshold)}',
    QUORUM_PERCENTAGE: ${quorumPercentage},
  },
  NFT: {
    MAX_SUPPLY: ${await communityNFT.MAX_SUPPLY()},
    MAX_MINT_PER_TX: ${await communityNFT.MAX_MINT_PER_TX()},
  },
};
`;

    const configPath = path.join(outputDir, `${hre.network.name}-config.js`);
    fs.writeFileSync(configPath, frontendConfig);

    // Display summary
    console.log("═══════════════════════════════════════════");
    console.log("🎉 DEPLOYMENT COMPLETE!");
    console.log("═══════════════════════════════════════════");
    console.log("Network:", hre.network.name);
    console.log("Chain ID:", hre.network.config.chainId);
    console.log("───────────────────────────────────────────");
    console.log("CONTRACTS DEPLOYED:");
    console.log("───────────────────────────────────────────");
    console.log("1. CRYB Token:      ", tokenAddress);
    console.log("2. Staking:         ", stakingAddress);
    console.log("3. Governance:      ", governanceAddress);
    console.log("4. NFT Marketplace: ", marketplaceAddress);
    console.log("5. Community NFT:   ", communityNFTAddress);
    console.log("6. Token Gating:    ", tokenGatingAddress);
    console.log("7. Tipping:         ", tippingAddress);
    console.log("8. Subscription:    ", subscriptionAddress);
    console.log("9. Treasury:        ", treasuryAddress);
    console.log("═══════════════════════════════════════════");
    console.log("\n📄 Files saved:");
    console.log("   -", filepath);
    console.log("   -", configPath);

    return deploymentData;

  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    throw error;
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
