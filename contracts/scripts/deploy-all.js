const { ethers, upgrades, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Deployment configuration
const DEPLOYMENT_CONFIG = {
  // Token configuration
  TOTAL_SUPPLY: ethers.utils.parseEther("1000000000"), // 1B CRYB
  INITIAL_MINT: ethers.utils.parseEther("100000000"), // 100M CRYB
  
  // Staking configuration
  STAKING_REWARD_RATE: 500, // 5% APY
  MIN_STAKE_AMOUNT: ethers.utils.parseEther("1000"), // 1000 CRYB
  
  // Marketplace configuration
  PLATFORM_FEE: 250, // 2.5%
  
  // Governance configuration
  VOTING_DELAY: 1, // 1 day
  VOTING_PERIOD: 7, // 7 days
  PROPOSAL_THRESHOLD: ethers.utils.parseEther("1000000"), // 1M CRYB
  QUORUM_PERCENTAGE: 400, // 4%
  
  // Bridge configuration
  VALIDATOR_BOND: ethers.utils.parseEther("10000"), // 10k CRYB
  BASE_FEE: ethers.utils.parseEther("10"), // 10 CRYB
  
  // Multi-sig configuration
  MULTISIG_THRESHOLD: 3,
  DEFAULT_TIMELOCK: 24 * 60 * 60, // 24 hours
};

// Wallet addresses for different roles
const getWalletAddresses = async () => {
  const signers = await ethers.getSigners();
  
  return {
    deployer: signers[0].address,
    treasury: signers[1]?.address || signers[0].address,
    teamWallet: signers[2]?.address || signers[0].address,
    investorWallet: signers[3]?.address || signers[0].address,
    liquidityWallet: signers[4]?.address || signers[0].address,
    communityWallet: signers[5]?.address || signers[0].address,
    reserveWallet: signers[6]?.address || signers[0].address,
    emergencyAdmin: signers[7]?.address || signers[0].address,
    feeRecipient: signers[8]?.address || signers[0].address,
    moderatorPool: signers[9]?.address || signers[0].address,
  };
};

// Deploy function
async function deploy() {
  console.log("🚀 Starting CRYB Platform deployment...");
  console.log("📊 Network:", network.name);
  console.log("⛽ Gas price:", (await ethers.provider.getGasPrice()).toString());
  
  const deployment = {
    network: network.name,
    chainId: network.config.chainId,
    timestamp: new Date().toISOString(),
    contracts: {},
    transactions: [],
  };
  
  const wallets = await getWalletAddresses();
  console.log("👛 Wallet addresses:", wallets);
  
  try {
    // 1. Deploy CRYB Token
    console.log("\n📝 Deploying CRYB Token...");
    const CRYBToken = await ethers.getContractFactory("CRYBToken");
    const cribToken = await CRYBToken.deploy(
      wallets.teamWallet,
      wallets.investorWallet,
      wallets.liquidityWallet,
      wallets.communityWallet,
      wallets.reserveWallet
    );
    await cribToken.deployed();
    
    deployment.contracts.CRYBToken = {
      address: cribToken.address,
      constructorArgs: [
        wallets.teamWallet,
        wallets.investorWallet,
        wallets.liquidityWallet,
        wallets.communityWallet,
        wallets.reserveWallet,
      ],
    };
    
    console.log("✅ CRYB Token deployed to:", cribToken.address);
    
    // 2. Deploy TimelockController for Governance
    console.log("\n📝 Deploying Timelock Controller...");
    const TimelockController = await ethers.getContractFactory("TimelockController");
    const timelock = await TimelockController.deploy(
      DEPLOYMENT_CONFIG.DEFAULT_TIMELOCK,
      [wallets.deployer], // proposers
      [wallets.deployer], // executors
      wallets.deployer // admin
    );
    await timelock.deployed();
    
    deployment.contracts.TimelockController = {
      address: timelock.address,
      constructorArgs: [
        DEPLOYMENT_CONFIG.DEFAULT_TIMELOCK,
        [wallets.deployer],
        [wallets.deployer],
        wallets.deployer,
      ],
    };
    
    console.log("✅ Timelock Controller deployed to:", timelock.address);
    
    // 3. Deploy Governance
    console.log("\n📝 Deploying CRYB Governance...");
    const CRYBGovernance = await ethers.getContractFactory("CRYBGovernance");
    const governance = await CRYBGovernance.deploy(
      cribToken.address,
      timelock.address,
      wallets.treasury,
      DEPLOYMENT_CONFIG.VOTING_DELAY,
      DEPLOYMENT_CONFIG.VOTING_PERIOD,
      DEPLOYMENT_CONFIG.PROPOSAL_THRESHOLD,
      DEPLOYMENT_CONFIG.QUORUM_PERCENTAGE
    );
    await governance.deployed();
    
    deployment.contracts.CRYBGovernance = {
      address: governance.address,
      constructorArgs: [
        cribToken.address,
        timelock.address,
        wallets.treasury,
        DEPLOYMENT_CONFIG.VOTING_DELAY,
        DEPLOYMENT_CONFIG.VOTING_PERIOD,
        DEPLOYMENT_CONFIG.PROPOSAL_THRESHOLD,
        DEPLOYMENT_CONFIG.QUORUM_PERCENTAGE,
      ],
    };
    
    console.log("✅ CRYB Governance deployed to:", governance.address);
    
    // 4. Deploy Multi-Signature Wallet
    console.log("\n📝 Deploying Multi-Signature Wallet...");
    const CRYBMultiSig = await ethers.getContractFactory("CRYBMultiSig");
    const multiSig = await CRYBMultiSig.deploy(
      [wallets.deployer, wallets.treasury, wallets.emergencyAdmin],
      DEPLOYMENT_CONFIG.MULTISIG_THRESHOLD,
      wallets.emergencyAdmin
    );
    await multiSig.deployed();
    
    deployment.contracts.CRYBMultiSig = {
      address: multiSig.address,
      constructorArgs: [
        [wallets.deployer, wallets.treasury, wallets.emergencyAdmin],
        DEPLOYMENT_CONFIG.MULTISIG_THRESHOLD,
        wallets.emergencyAdmin,
      ],
    };
    
    console.log("✅ Multi-Signature Wallet deployed to:", multiSig.address);
    
    // 5. Deploy Staking Contract
    console.log("\n📝 Deploying CRYB Staking...");
    const CRYBStaking = await ethers.getContractFactory("CRYBStaking");
    const staking = await CRYBStaking.deploy(wallets.emergencyAdmin);
    await staking.deployed();
    
    deployment.contracts.CRYBStaking = {
      address: staking.address,
      constructorArgs: [wallets.emergencyAdmin],
    };
    
    console.log("✅ CRYB Staking deployed to:", staking.address);
    
    // 6. Deploy NFT Collection
    console.log("\n📝 Deploying CRYB NFT Collection...");
    const CRYBNFTCollection = await ethers.getContractFactory("CRYBNFTCollection");
    const nftCollection = await CRYBNFTCollection.deploy(
      "CRYB Genesis Collection",
      "CRYB",
      "https://api.cryb.ai/metadata/placeholder.json",
      wallets.teamWallet,
      wallets.treasury
    );
    await nftCollection.deployed();
    
    deployment.contracts.CRYBNFTCollection = {
      address: nftCollection.address,
      constructorArgs: [
        "CRYB Genesis Collection",
        "CRYB",
        "https://api.cryb.ai/metadata/placeholder.json",
        wallets.teamWallet,
        wallets.treasury,
      ],
    };
    
    console.log("✅ CRYB NFT Collection deployed to:", nftCollection.address);
    
    // 7. Deploy Marketplace
    console.log("\n📝 Deploying CRYB Marketplace...");
    const CRYBMarketplace = await ethers.getContractFactory("CRYBMarketplace");
    const marketplace = await CRYBMarketplace.deploy(
      wallets.feeRecipient,
      cribToken.address
    );
    await marketplace.deployed();
    
    deployment.contracts.CRYBMarketplace = {
      address: marketplace.address,
      constructorArgs: [wallets.feeRecipient, cribToken.address],
    };
    
    console.log("✅ CRYB Marketplace deployed to:", marketplace.address);
    
    // 8. Deploy Yield Farm
    console.log("\n📝 Deploying CRYB Yield Farm...");
    const currentBlock = await ethers.provider.getBlockNumber();
    const CRYBYieldFarm = await ethers.getContractFactory("CRYBYieldFarm");
    const yieldFarm = await CRYBYieldFarm.deploy(
      cribToken.address,
      wallets.treasury,
      currentBlock + 100, // start block
      currentBlock + 100000 // end block
    );
    await yieldFarm.deployed();
    
    deployment.contracts.CRYBYieldFarm = {
      address: yieldFarm.address,
      constructorArgs: [
        cribToken.address,
        wallets.treasury,
        currentBlock + 100,
        currentBlock + 100000,
      ],
    };
    
    console.log("✅ CRYB Yield Farm deployed to:", yieldFarm.address);
    
    // 9. Deploy AMM
    console.log("\n📝 Deploying CRYB AMM...");
    const CRYBAMM = await ethers.getContractFactory("CRYBAMM");
    // For demo, create CRYB/WETH pair
    const WETH_ADDRESS = getWETHAddress(network.config.chainId);
    const amm = await CRYBAMM.deploy(
      cribToken.address,
      WETH_ADDRESS,
      "CRYB-ETH LP",
      "CRYB-ETH",
      0, // CONSTANT_PRODUCT
      0 // no amplification
    );
    await amm.deployed();
    
    deployment.contracts.CRYBAMM = {
      address: amm.address,
      constructorArgs: [
        cribToken.address,
        WETH_ADDRESS,
        "CRYB-ETH LP",
        "CRYB-ETH",
        0,
        0,
      ],
    };
    
    console.log("✅ CRYB AMM deployed to:", amm.address);
    
    // 10. Deploy Rewards System
    console.log("\n📝 Deploying CRYB Rewards...");
    const CRYBRewards = await ethers.getContractFactory("CRYBRewards");
    const rewards = await CRYBRewards.deploy(
      cribToken.address,
      wallets.treasury,
      wallets.moderatorPool
    );
    await rewards.deployed();
    
    deployment.contracts.CRYBRewards = {
      address: rewards.address,
      constructorArgs: [cribToken.address, wallets.treasury, wallets.moderatorPool],
    };
    
    console.log("✅ CRYB Rewards deployed to:", rewards.address);
    
    // 11. Deploy Bridge (if not on mainnet)
    if (network.config.chainId !== 1) {
      console.log("\n📝 Deploying CRYB Bridge...");
      const CRYBBridge = await ethers.getContractFactory("CRYBBridge");
      const bridge = await CRYBBridge.deploy(
        cribToken.address,
        wallets.feeRecipient,
        wallets.emergencyAdmin
      );
      await bridge.deployed();
      
      deployment.contracts.CRYBBridge = {
        address: bridge.address,
        constructorArgs: [cribToken.address, wallets.feeRecipient, wallets.emergencyAdmin],
      };
      
      console.log("✅ CRYB Bridge deployed to:", bridge.address);
    }
    
    // 12. Deploy Layer 2 (if on supported networks)
    if ([137, 42161, 10].includes(network.config.chainId)) {
      console.log("\n📝 Deploying CRYB Layer 2...");
      const CRYBLayer2 = await ethers.getContractFactory("CRYBLayer2");
      const layer2 = await CRYBLayer2.deploy(
        cribToken.address,
        ethers.constants.AddressZero, // mainnet bridge
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("genesis")) // genesis state root
      );
      await layer2.deployed();
      
      deployment.contracts.CRYBLayer2 = {
        address: layer2.address,
        constructorArgs: [
          cribToken.address,
          ethers.constants.AddressZero,
          ethers.utils.keccak256(ethers.utils.toUtf8Bytes("genesis")),
        ],
      };
      
      console.log("✅ CRYB Layer 2 deployed to:", layer2.address);
    }
    
    // Post-deployment configuration
    console.log("\n⚙️ Configuring contracts...");
    
    // Set up governance roles
    const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
    const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
    const TIMELOCK_ADMIN_ROLE = await timelock.TIMELOCK_ADMIN_ROLE();
    
    await timelock.grantRole(PROPOSER_ROLE, governance.address);
    await timelock.grantRole(EXECUTOR_ROLE, governance.address);
    await timelock.renounceRole(TIMELOCK_ADMIN_ROLE, wallets.deployer);
    
    // Set up staking pool
    await staking.createPool(
      cribToken.address, // LP token
      cribToken.address, // reward token
      1000, // allocation points
      0, // lock period
      DEPLOYMENT_CONFIG.MIN_STAKE_AMOUNT,
      ethers.utils.parseEther("1000000"), // max stake
      500, // early withdrawal fee (5%)
      false // auto compound
    );
    
    // Set up yield farm pool
    await yieldFarm.addPool(
      cribToken.address, // LP token
      cribToken.address, // reward token
      1000, // allocation points
      0, // lock period
      DEPLOYMENT_CONFIG.MIN_STAKE_AMOUNT,
      ethers.utils.parseEther("1000000"), // max stake
      500, // early withdrawal fee
      true // auto compound
    );
    
    console.log("✅ Configuration completed");
    
    // Save deployment information
    const deploymentDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }
    
    const filename = `${network.name}-${Date.now()}.json`;
    const filepath = path.join(deploymentDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(deployment, null, 2));
    
    // Also save as latest
    const latestPath = path.join(deploymentDir, `${network.name}-latest.json`);
    fs.writeFileSync(latestPath, JSON.stringify(deployment, null, 2));
    
    console.log("\n📄 Deployment saved to:", filepath);
    
    // Print summary
    console.log("\n🎉 CRYB Platform deployment completed!");
    console.log("📋 Contract Summary:");
    Object.entries(deployment.contracts).forEach(([name, contract]) => {
      console.log(`   ${name}: ${contract.address}`);
    });
    
    console.log(`\n💾 Total contracts deployed: ${Object.keys(deployment.contracts).length}`);
    console.log("🔗 Network:", network.name);
    console.log("🆔 Chain ID:", network.config.chainId);
    
    return deployment;
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

// Helper function to get WETH address for different networks
function getWETHAddress(chainId) {
  const wethAddresses = {
    1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // Ethereum
    5: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6", // Goerli
    137: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", // Polygon
    80001: "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889", // Mumbai
    42161: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", // Arbitrum
    10: "0x4200000000000000000000000000000000000006", // Optimism
    56: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8", // BSC
    97: "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd", // BSC Testnet
  };
  
  return wethAddresses[chainId] || "0x0000000000000000000000000000000000000000";
}

// Run deployment
async function main() {
  return await deploy();
}

// Export for use in other scripts
module.exports = { deploy, DEPLOYMENT_CONFIG };

// Run if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}