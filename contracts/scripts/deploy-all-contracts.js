const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Complete deployment script for all CRYB Platform contracts
 * Deploys:
 * 1. CRYBToken
 * 2. CRYBStaking
 * 3. CRYBGovernance
 * 4. NFTMarketplace
 * 5. CommunityNFT
 * 6. TokenGating
 * 7. TippingContract
 * 8. Subscription
 * 9. Treasury
 */

async function main() {
  console.log("🚀 Starting CRYB Platform Full Deployment...");
  console.log("==========================================");
  console.log("📊 Network:", network.name);

  const [deployer] = await ethers.getSigners();
  console.log("👛 Deployer:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "ETH");

  if (balance < ethers.parseEther("0.1")) {
    console.warn("⚠️  Warning: Low balance. You may need more ETH for deployment.");
  }

  const deploymentData = {
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {},
    gasUsed: {}
  };

  let totalGasUsed = 0n;

  try {
    // ============================================
    // 1. Deploy CRYB Token
    // ============================================
    console.log("\n📝 [1/9] Deploying CRYB Token...");
    const CRYBToken = await ethers.getContractFactory("CRYBToken");

    const token = await CRYBToken.deploy(
      deployer.address, // team wallet
      deployer.address, // investor wallet
      deployer.address, // liquidity wallet
      deployer.address, // community wallet
      deployer.address  // reserve wallet
    );
    await token.waitForDeployment();
    const tokenReceipt = await token.deploymentTransaction().wait();
    totalGasUsed = totalGasUsed + tokenReceipt.gasUsed;

    deploymentData.contracts.CRYBToken = {
      address: token.address,
      args: [deployer.address, deployer.address, deployer.address, deployer.address, deployer.address]
    };
    deploymentData.gasUsed.CRYBToken = tokenReceipt.gasUsed.toString();

    console.log("✅ CRYB Token:", token.address);
    console.log("   Total Supply:", ethers.formatEther(await token.totalSupply()), "CRYB");
    console.log("   Gas Used:", tokenReceipt.gasUsed.toString());

    // ============================================
    // 2. Deploy Staking Contract
    // ============================================
    console.log("\n📝 [2/9] Deploying Staking Contract...");
    const CRYBStaking = await ethers.getContractFactory("CRYBStaking");

    const currentBlock = await ethers.provider.getBlockNumber();
    const rewardPerBlock = ethers.parseEther("10"); // 10 CRYB per block

    const staking = await CRYBStaking.deploy(
      token.address,
      rewardPerBlock,
      currentBlock + 10
    );
    await staking.deployed();
    const stakingReceipt = await staking.deployTransaction.wait();
    totalGasUsed = totalGasUsed.add(stakingReceipt.gasUsed);

    deploymentData.contracts.CRYBStaking = {
      address: staking.address,
      args: [token.address, rewardPerBlock.toString(), currentBlock + 10]
    };
    deploymentData.gasUsed.CRYBStaking = stakingReceipt.gasUsed.toString();

    console.log("✅ Staking Contract:", staking.address);
    console.log("   Reward per block:", ethers.formatEther(rewardPerBlock), "CRYB");
    console.log("   Gas Used:", stakingReceipt.gasUsed.toString());

    // ============================================
    // 3. Deploy Governance Contract
    // ============================================
    console.log("\n📝 [3/9] Deploying Governance Contract...");
    const CRYBGovernance = await ethers.getContractFactory("CRYBGovernance");

    const votingDelay = 1;
    const votingPeriod = 50400; // ~1 week
    const proposalThreshold = ethers.parseEther("1000000");
    const quorumPercentage = 4;

    const governance = await CRYBGovernance.deploy(
      token.address,
      deployer.address,
      votingDelay,
      votingPeriod,
      proposalThreshold,
      quorumPercentage
    );
    await governance.deployed();
    const governanceReceipt = await governance.deployTransaction.wait();
    totalGasUsed = totalGasUsed.add(governanceReceipt.gasUsed);

    deploymentData.contracts.CRYBGovernance = {
      address: governance.address,
      args: [token.address, deployer.address, votingDelay, votingPeriod, proposalThreshold.toString(), quorumPercentage]
    };
    deploymentData.gasUsed.CRYBGovernance = governanceReceipt.gasUsed.toString();

    console.log("✅ Governance Contract:", governance.address);
    console.log("   Voting period:", votingPeriod, "blocks");
    console.log("   Gas Used:", governanceReceipt.gasUsed.toString());

    // ============================================
    // 4. Deploy NFT Marketplace
    // ============================================
    console.log("\n📝 [4/9] Deploying NFT Marketplace...");
    const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");

    const marketplace = await NFTMarketplace.deploy(deployer.address);
    await marketplace.deployed();
    const marketplaceReceipt = await marketplace.deployTransaction.wait();
    totalGasUsed = totalGasUsed.add(marketplaceReceipt.gasUsed);

    deploymentData.contracts.NFTMarketplace = {
      address: marketplace.address,
      args: [deployer.address]
    };
    deploymentData.gasUsed.NFTMarketplace = marketplaceReceipt.gasUsed.toString();

    console.log("✅ NFT Marketplace:", marketplace.address);
    console.log("   Platform Fee:", await marketplace.platformFeePercent(), "basis points (2.5%)");
    console.log("   Gas Used:", marketplaceReceipt.gasUsed.toString());

    // ============================================
    // 5. Deploy Community NFT
    // ============================================
    console.log("\n📝 [5/9] Deploying Community NFT...");
    const CommunityNFT = await ethers.getContractFactory("CommunityNFT");

    const communityNFT = await CommunityNFT.deploy(
      "CRYB Community",
      "CRYBC",
      "ipfs://placeholder/",
      deployer.address
    );
    await communityNFT.deployed();
    const communityNFTReceipt = await communityNFT.deployTransaction.wait();
    totalGasUsed = totalGasUsed.add(communityNFTReceipt.gasUsed);

    deploymentData.contracts.CommunityNFT = {
      address: communityNFT.address,
      args: ["CRYB Community", "CRYBC", "ipfs://placeholder/", deployer.address]
    };
    deploymentData.gasUsed.CommunityNFT = communityNFTReceipt.gasUsed.toString();

    console.log("✅ Community NFT:", communityNFT.address);
    console.log("   Max Supply:", (await communityNFT.MAX_SUPPLY()).toString());
    console.log("   Gas Used:", communityNFTReceipt.gasUsed.toString());

    // ============================================
    // 6. Deploy Token Gating
    // ============================================
    console.log("\n📝 [6/9] Deploying Token Gating...");
    const TokenGating = await ethers.getContractFactory("TokenGating");

    const tokenGating = await TokenGating.deploy();
    await tokenGating.deployed();
    const tokenGatingReceipt = await tokenGating.deployTransaction.wait();
    totalGasUsed = totalGasUsed.add(tokenGatingReceipt.gasUsed);

    deploymentData.contracts.TokenGating = {
      address: tokenGating.address,
      args: []
    };
    deploymentData.gasUsed.TokenGating = tokenGatingReceipt.gasUsed.toString();

    console.log("✅ Token Gating:", tokenGating.address);
    console.log("   Gas Used:", tokenGatingReceipt.gasUsed.toString());

    // ============================================
    // 7. Deploy Tipping Contract
    // ============================================
    console.log("\n📝 [7/9] Deploying Tipping Contract...");
    const TippingContract = await ethers.getContractFactory("TippingContract");

    const tipping = await TippingContract.deploy(deployer.address, token.address);
    await tipping.deployed();
    const tippingReceipt = await tipping.deployTransaction.wait();
    totalGasUsed = totalGasUsed.add(tippingReceipt.gasUsed);

    deploymentData.contracts.TippingContract = {
      address: tipping.address,
      args: [deployer.address, token.address]
    };
    deploymentData.gasUsed.TippingContract = tippingReceipt.gasUsed.toString();

    console.log("✅ Tipping Contract:", tipping.address);
    console.log("   Platform Fee:", await tipping.platformFeePercent(), "basis points");
    console.log("   Gas Used:", tippingReceipt.gasUsed.toString());

    // ============================================
    // 8. Deploy Subscription Contract
    // ============================================
    console.log("\n📝 [8/9] Deploying Subscription Contract...");
    const Subscription = await ethers.getContractFactory("Subscription");

    const subscription = await Subscription.deploy(deployer.address);
    await subscription.deployed();
    const subscriptionReceipt = await subscription.deployTransaction.wait();
    totalGasUsed = totalGasUsed.add(subscriptionReceipt.gasUsed);

    deploymentData.contracts.Subscription = {
      address: subscription.address,
      args: [deployer.address]
    };
    deploymentData.gasUsed.Subscription = subscriptionReceipt.gasUsed.toString();

    console.log("✅ Subscription Contract:", subscription.address);
    console.log("   Platform Fee:", await subscription.platformFeePercent(), "basis points");
    console.log("   Gas Used:", subscriptionReceipt.gasUsed.toString());

    // ============================================
    // 9. Deploy Treasury
    // ============================================
    console.log("\n📝 [9/9] Deploying Treasury Contract...");
    const Treasury = await ethers.getContractFactory("Treasury");

    const treasury = await Treasury.deploy(token.address);
    await treasury.deployed();
    const treasuryReceipt = await treasury.deployTransaction.wait();
    totalGasUsed = totalGasUsed.add(treasuryReceipt.gasUsed);

    deploymentData.contracts.Treasury = {
      address: treasury.address,
      args: [token.address]
    };
    deploymentData.gasUsed.Treasury = treasuryReceipt.gasUsed.toString();

    console.log("✅ Treasury Contract:", treasury.address);
    console.log("   Voting Period:", (await treasury.votingPeriod()).toString(), "seconds");
    console.log("   Gas Used:", treasuryReceipt.gasUsed.toString());

    // ============================================
    // Post-deployment configuration
    // ============================================
    console.log("\n⚙️  Configuring contracts...");

    // Transfer tokens to staking contract
    const rewardAmount = ethers.parseEther("10000000"); // 10M CRYB
    console.log("   Transferring", ethers.formatEther(rewardAmount), "CRYB to staking...");
    const transferTx = await token.transfer(staking.address, rewardAmount);
    await transferTx.wait();
    console.log("   ✅ Reward tokens transferred");

    // Create default staking pool
    console.log("   Creating default staking pool...");
    const poolTx = await staking.add(100, token.address, 0, true);
    await poolTx.wait();
    console.log("   ✅ Default pool created");

    // Transfer some tokens to treasury
    const treasuryAmount = ethers.parseEther("50000000"); // 50M CRYB
    console.log("   Transferring", ethers.formatEther(treasuryAmount), "CRYB to treasury...");
    const treasuryTransferTx = await token.transfer(treasury.address, treasuryAmount);
    await treasuryTransferTx.wait();
    console.log("   ✅ Treasury funded");

    // ============================================
    // Save deployment data
    // ============================================
    const outputDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    deploymentData.totalGasUsed = totalGasUsed.toString();

    const filename = `${network.name}-${Date.now()}.json`;
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(deploymentData, null, 2));

    // Also save as "latest"
    const latestPath = path.join(outputDir, `${network.name}-latest.json`);
    fs.writeFileSync(latestPath, JSON.stringify(deploymentData, null, 2));

    console.log("\n📄 Deployment data saved to:", filepath);

    // ============================================
    // Generate frontend config
    // ============================================
    const frontendConfig = `// Auto-generated contract addresses for ${network.name}
// Generated: ${new Date().toISOString()}
// DO NOT EDIT MANUALLY

export const NETWORK_CONFIG = {
  NETWORK: '${network.name}',
  CHAIN_ID: ${network.config.chainId},
  DEPLOYER: '${deployer.address}',
};

export const CONTRACT_ADDRESSES = {
  CRYB_TOKEN: '${token.address}',
  STAKING: '${staking.address}',
  GOVERNANCE: '${governance.address}',
  NFT_MARKETPLACE: '${marketplace.address}',
  COMMUNITY_NFT: '${communityNFT.address}',
  TOKEN_GATING: '${tokenGating.address}',
  TIPPING: '${tipping.address}',
  SUBSCRIPTION: '${subscription.address}',
  TREASURY: '${treasury.address}',
};

export const CONTRACT_CONFIG = {
  STAKING: {
    REWARD_PER_BLOCK: '${ethers.formatEther(rewardPerBlock)}',
    START_BLOCK: ${currentBlock + 10},
  },
  GOVERNANCE: {
    VOTING_DELAY: ${votingDelay},
    VOTING_PERIOD: ${votingPeriod},
    PROPOSAL_THRESHOLD: '${ethers.formatEther(proposalThreshold)}',
    QUORUM_PERCENTAGE: ${quorumPercentage},
  },
  NFT: {
    MAX_SUPPLY: ${await communityNFT.MAX_SUPPLY()},
    MAX_MINT_PER_TX: ${await communityNFT.MAX_MINT_PER_TX()},
  },
};
`;

    const configPath = path.join(outputDir, `${network.name}-config.js`);
    fs.writeFileSync(configPath, frontendConfig);
    console.log("📝 Frontend config saved to:", configPath);

    // ============================================
    // Display summary
    // ============================================
    console.log("\n");
    console.log("═══════════════════════════════════════════");
    console.log("🎉 DEPLOYMENT COMPLETE!");
    console.log("═══════════════════════════════════════════");
    console.log("Network:", network.name);
    console.log("Chain ID:", network.config.chainId);
    console.log("Deployer:", deployer.address);
    console.log("───────────────────────────────────────────");
    console.log("CONTRACTS DEPLOYED:");
    console.log("───────────────────────────────────────────");
    console.log("1. CRYB Token:        ", token.address);
    console.log("2. Staking:           ", staking.address);
    console.log("3. Governance:        ", governance.address);
    console.log("4. NFT Marketplace:   ", marketplace.address);
    console.log("5. Community NFT:     ", communityNFT.address);
    console.log("6. Token Gating:      ", tokenGating.address);
    console.log("7. Tipping:           ", tipping.address);
    console.log("8. Subscription:      ", subscription.address);
    console.log("9. Treasury:          ", treasury.address);
    console.log("───────────────────────────────────────────");
    console.log("Total Gas Used:", totalGasUsed.toString());
    console.log("═══════════════════════════════════════════");

    // ============================================
    // Verification commands
    // ============================================
    if (network.name !== "hardhat" && network.name !== "localhost") {
      console.log("\n📋 To verify contracts on Etherscan:");
      console.log("───────────────────────────────────────────");
      console.log(`npx hardhat verify --network ${network.name} ${token.address} ${deployer.address} ${deployer.address} ${deployer.address} ${deployer.address} ${deployer.address}`);
      console.log(`npx hardhat verify --network ${network.name} ${staking.address} ${token.address} ${rewardPerBlock.toString()} ${currentBlock + 10}`);
      console.log(`npx hardhat verify --network ${network.name} ${governance.address} ${token.address} ${deployer.address} ${votingDelay} ${votingPeriod} ${proposalThreshold.toString()} ${quorumPercentage}`);
      console.log(`npx hardhat verify --network ${network.name} ${marketplace.address} ${deployer.address}`);
      console.log(`npx hardhat verify --network ${network.name} ${communityNFT.address} "CRYB Community" "CRYBC" "ipfs://placeholder/" ${deployer.address}`);
      console.log(`npx hardhat verify --network ${network.name} ${tokenGating.address}`);
      console.log(`npx hardhat verify --network ${network.name} ${tipping.address} ${deployer.address} ${token.address}`);
      console.log(`npx hardhat verify --network ${network.name} ${subscription.address} ${deployer.address}`);
      console.log(`npx hardhat verify --network ${network.name} ${treasury.address} ${token.address}`);
    }

    return deploymentData;

  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    throw error;
  }
}

// Execute deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main };
