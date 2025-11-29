const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Minimal deployment script for core CRYB contracts
 * Deploys: CRYB Token, Staking, Governance
 */

async function main() {
  console.log("🚀 Starting minimal CRYB deployment...");
  console.log("📊 Network:", network.name);

  const [deployer] = await ethers.getSigners();
  console.log("👛 Deployer:", deployer.address);
  console.log("💰 Balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");

  const deploymentData = {
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {}
  };

  try {
    // 1. Deploy CRYB Token
    console.log("\n📝 1/3 Deploying CRYB Token...");
    const CRYBToken = await ethers.getContractFactory("CRYBToken");

    // Constructor args: (teamWallet, investorWallet, liquidityWallet, communityWallet, reserveWallet)
    const token = await CRYBToken.deploy(
      deployer.address, // team wallet (use deployer for testing)
      deployer.address, // investor wallet
      deployer.address, // liquidity wallet
      deployer.address, // community wallet
      deployer.address  // reserve wallet
    );
    await token.deployed();

    deploymentData.contracts.CRYBToken = {
      address: token.address,
      args: [deployer.address, deployer.address, deployer.address, deployer.address, deployer.address]
    };

    console.log("✅ CRYB Token:", token.address);
    console.log("   Total Supply:", ethers.utils.formatEther(await token.totalSupply()), "CRYB");

    // 2. Deploy Staking Contract
    console.log("\n📝 2/3 Deploying Staking Contract...");
    const CRYBStaking = await ethers.getContractFactory("CRYBStaking");

    // Constructor args: (rewardToken, rewardPerBlock, startBlock)
    const currentBlock = await ethers.provider.getBlockNumber();
    const rewardPerBlock = ethers.utils.parseEther("10"); // 10 CRYB per block

    const staking = await CRYBStaking.deploy(
      token.address,
      rewardPerBlock,
      currentBlock + 10 // start in 10 blocks
    );
    await staking.deployed();

    deploymentData.contracts.CRYBStaking = {
      address: staking.address,
      args: [token.address, rewardPerBlock.toString(), currentBlock + 10]
    };

    console.log("✅ Staking Contract:", staking.address);
    console.log("   Reward per block:", ethers.utils.formatEther(rewardPerBlock), "CRYB");

    // 3. Deploy Governance Contract
    console.log("\n📝 3/3 Deploying Governance Contract...");
    const CRYBGovernance = await ethers.getContractFactory("CRYBGovernance");

    // Constructor args: (token, timelock, votingDelay, votingPeriod, proposalThreshold, quorumPercentage)
    const votingDelay = 1; // 1 block
    const votingPeriod = 50400; // ~1 week (assuming 12s blocks)
    const proposalThreshold = ethers.utils.parseEther("1000000"); // 1M CRYB
    const quorumPercentage = 4; // 4%

    // For testnet, we'll use a simple timelock address (deployer)
    const governance = await CRYBGovernance.deploy(
      token.address,
      deployer.address, // timelock (use deployer for testing)
      votingDelay,
      votingPeriod,
      proposalThreshold,
      quorumPercentage
    );
    await governance.deployed();

    deploymentData.contracts.CRYBGovernance = {
      address: governance.address,
      args: [token.address, deployer.address, votingDelay, votingPeriod, proposalThreshold.toString(), quorumPercentage]
    };

    console.log("✅ Governance Contract:", governance.address);
    console.log("   Voting period:", votingPeriod, "blocks (~1 week)");
    console.log("   Proposal threshold:", ethers.utils.formatEther(proposalThreshold), "CRYB");

    // 4. Post-deployment configuration
    console.log("\n⚙️  Configuring contracts...");

    // Transfer tokens to staking contract for rewards
    const rewardAmount = ethers.utils.parseEther("10000000"); // 10M CRYB for rewards
    console.log("   Transferring", ethers.utils.formatEther(rewardAmount), "CRYB to staking contract...");
    const transferTx = await token.transfer(staking.address, rewardAmount);
    await transferTx.wait();
    console.log("   ✅ Reward tokens transferred");

    // Create default staking pool
    console.log("   Creating default staking pool...");
    const poolTx = await staking.add(
      100, // allocation points
      token.address, // LP token (CRYB)
      0, // deposit fee (0%)
      true // with update
    );
    await poolTx.wait();
    console.log("   ✅ Default pool created");

    // 5. Save deployment data
    const outputDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = `${network.name}-${Date.now()}.json`;
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(deploymentData, null, 2));

    console.log("\n📄 Deployment data saved to:", filepath);

    // 6. Display summary
    console.log("\n🎉 Deployment Complete!");
    console.log("==========================================");
    console.log("Network:", network.name);
    console.log("Chain ID:", network.config.chainId);
    console.log("Deployer:", deployer.address);
    console.log("------------------------------------------");
    console.log("CRYB Token:", token.address);
    console.log("Staking:", staking.address);
    console.log("Governance:", governance.address);
    console.log("==========================================");

    // 7. Generate frontend config
    const frontendConfig = `// Auto-generated contract addresses for ${network.name}
// Generated: ${new Date().toISOString()}

export const CONTRACTS = {
  NETWORK: '${network.name}',
  CHAIN_ID: ${network.config.chainId},

  CRYB_TOKEN: '${token.address}',
  STAKING: '${staking.address}',
  GOVERNANCE: '${governance.address}',
};

export const STAKING_CONFIG = {
  REWARD_PER_BLOCK: '${ethers.utils.formatEther(rewardPerBlock)}',
  START_BLOCK: ${currentBlock + 10},
};

export const GOVERNANCE_CONFIG = {
  VOTING_DELAY: ${votingDelay},
  VOTING_PERIOD: ${votingPeriod},
  PROPOSAL_THRESHOLD: '${ethers.utils.formatEther(proposalThreshold)}',
  QUORUM_PERCENTAGE: ${quorumPercentage},
};
`;

    const configPath = path.join(outputDir, `${network.name}-config.js`);
    fs.writeFileSync(configPath, frontendConfig);
    console.log("\n📝 Frontend config saved to:", configPath);

    // 8. Verification commands
    if (network.name !== "hardhat" && network.name !== "localhost") {
      console.log("\n📋 To verify on Etherscan:");
      console.log("------------------------------------------");
      console.log(`npx hardhat verify --network ${network.name} ${token.address} ${deployer.address} ${deployer.address} ${deployer.address} ${deployer.address} ${deployer.address}`);
      console.log(`npx hardhat verify --network ${network.name} ${staking.address} ${token.address} ${rewardPerBlock.toString()} ${currentBlock + 10}`);
      console.log(`npx hardhat verify --network ${network.name} ${governance.address} ${token.address} ${deployer.address} ${votingDelay} ${votingPeriod} ${proposalThreshold.toString()} ${quorumPercentage}`);
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
