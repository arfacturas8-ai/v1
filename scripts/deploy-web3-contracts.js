/**
 * CRYB Platform - Advanced Web3 Contract Deployment Script
 * 
 * Comprehensive deployment script with:
 * - Multi-chain support
 * - Contract verification
 * - Gas optimization
 * - Configuration management
 * - Error handling and recovery
 */

const hre = require("hardhat");
const { ethers, upgrades } = require("hardhat");
const fs = require('fs');
const path = require('path');

// Configuration
const DEPLOYMENT_CONFIG = {
  // Chain configurations
  chains: {
    1: { name: 'ethereum', explorer: 'https://etherscan.io', gasMultiplier: 1.1 },
    5: { name: 'goerli', explorer: 'https://goerli.etherscan.io', gasMultiplier: 1.0 },
    137: { name: 'polygon', explorer: 'https://polygonscan.com', gasMultiplier: 1.05 },
    80001: { name: 'mumbai', explorer: 'https://mumbai.polygonscan.com', gasMultiplier: 1.0 },
    42161: { name: 'arbitrum', explorer: 'https://arbiscan.io', gasMultiplier: 1.0 },
    421613: { name: 'arbitrum-goerli', explorer: 'https://goerli.arbiscan.io', gasMultiplier: 1.0 },
    10: { name: 'optimism', explorer: 'https://optimistic.etherscan.io', gasMultiplier: 1.0 },
    420: { name: 'optimism-goerli', explorer: 'https://goerli-optimism.etherscan.io', gasMultiplier: 1.0 },
    56: { name: 'bsc', explorer: 'https://bscscan.com', gasMultiplier: 1.0 },
    97: { name: 'bsc-testnet', explorer: 'https://testnet.bscscan.com', gasMultiplier: 1.0 },
    43114: { name: 'avalanche', explorer: 'https://snowtrace.io', gasMultiplier: 1.0 },
    43113: { name: 'fuji', explorer: 'https://testnet.snowtrace.io', gasMultiplier: 1.0 },
  },

  // Contract deployment parameters
  contracts: {
    CRYB: {
      initialSupply: ethers.utils.parseEther("1000000000"), // 1B tokens
      name: "CRYB Token",
      symbol: "CRYB",
      stakingRewardRate: 500, // 5% APY
      governanceDelay: 86400 * 2, // 2 days
    },
    CRYBNFTCollection: {
      name: "CRYB Profile NFTs",
      symbol: "CRYBPFP",
      baseURI: "https://api.cryb.ai/nft/metadata/",
      maxSupply: 10000,
      whitelistPrice: ethers.utils.parseEther("0.05"),
      publicPrice: ethers.utils.parseEther("0.08"),
      maxMintPerAddress: 5,
    }
  },

  // Verification settings
  verification: {
    enabled: true,
    delay: 30000, // 30 seconds delay before verification
    retries: 3,
  },

  // Gas optimization settings
  gas: {
    maxFeePerGas: ethers.utils.parseUnits('50', 'gwei'),
    maxPriorityFeePerGas: ethers.utils.parseUnits('2', 'gwei'),
  }
};

class ContractDeployer {
  constructor() {
    this.deployments = {};
    this.chainId = null;
    this.chainConfig = null;
    this.deployer = null;
    this.deploymentDir = path.join(__dirname, '..', 'deployments');
  }

  async initialize() {
    // Get network info
    this.chainId = (await ethers.provider.getNetwork()).chainId;
    this.chainConfig = DEPLOYMENT_CONFIG.chains[this.chainId];
    
    if (!this.chainConfig) {
      throw new Error(`Unsupported chain ID: ${this.chainId}`);
    }

    // Get deployer
    const [deployer] = await ethers.getSigners();
    this.deployer = deployer;

    console.log(`🚀 Starting deployment on ${this.chainConfig.name} (${this.chainId})`);
    console.log(`📝 Deployer: ${deployer.address}`);
    console.log(`💰 Balance: ${ethers.utils.formatEther(await deployer.getBalance())} ETH`);
    
    // Ensure deployment directory exists
    if (!fs.existsSync(this.deploymentDir)) {
      fs.mkdirSync(this.deploymentDir, { recursive: true });
    }
  }

  async estimateGasCosts() {
    console.log("\n📊 Estimating deployment gas costs...");
    
    try {
      // Get current gas price
      const feeData = await ethers.provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.utils.parseUnits('20', 'gwei');
      
      // Estimate gas for each contract
      const CRYBFactory = await ethers.getContractFactory("CRYB");
      const NFTFactory = await ethers.getContractFactory("CRYBNFTCollection");
      
      const cryb = DEPLOYMENT_CONFIG.contracts.CRYB;
      const nft = DEPLOYMENT_CONFIG.contracts.CRYBNFTCollection;
      
      const crybGasEstimate = await CRYBFactory.signer.estimateGas(
        CRYBFactory.getDeployTransaction(
          cryb.initialSupply,
          cryb.name,
          cryb.symbol,
          cryb.stakingRewardRate,
          cryb.governanceDelay
        )
      );
      
      const nftGasEstimate = await NFTFactory.signer.estimateGas(
        NFTFactory.getDeployTransaction(
          nft.name,
          nft.symbol,
          nft.baseURI,
          nft.maxSupply,
          nft.whitelistPrice,
          nft.publicPrice,
          nft.maxMintPerAddress
        )
      );
      
      const totalGas = crybGasEstimate.add(nftGasEstimate);
      const totalCost = totalGas.mul(gasPrice);
      
      console.log(`   CRYB Token: ${crybGasEstimate.toString()} gas`);
      console.log(`   NFT Collection: ${nftGasEstimate.toString()} gas`);
      console.log(`   Total Gas: ${totalGas.toString()}`);
      console.log(`   Estimated Cost: ${ethers.utils.formatEther(totalCost)} ETH`);
      
      return { totalGas, totalCost, gasPrice };
    } catch (error) {
      console.warn("⚠️  Gas estimation failed:", error.message);
      return null;
    }
  }

  async deployContract(contractName, constructorArgs = []) {
    console.log(`\n🔧 Deploying ${contractName}...`);
    
    try {
      const Factory = await ethers.getContractFactory(contractName);
      
      // Prepare deployment transaction with gas optimization
      const deploymentTx = Factory.getDeployTransaction(...constructorArgs);
      const gasEstimate = await this.deployer.estimateGas(deploymentTx);
      const gasLimit = gasEstimate.mul(120).div(100); // 20% buffer
      
      const deployOptions = {
        gasLimit,
      };

      // Add EIP-1559 gas pricing if supported
      const feeData = await ethers.provider.getFeeData();
      if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
        deployOptions.maxFeePerGas = DEPLOYMENT_CONFIG.gas.maxFeePerGas;
        deployOptions.maxPriorityFeePerGas = DEPLOYMENT_CONFIG.gas.maxPriorityFeePerGas;
      } else {
        deployOptions.gasPrice = feeData.gasPrice.mul(
          Math.floor(this.chainConfig.gasMultiplier * 100)
        ).div(100);
      }

      // Deploy contract
      const contract = await Factory.deploy(...constructorArgs, deployOptions);
      
      console.log(`   Transaction: ${contract.deployTransaction.hash}`);
      console.log(`   Waiting for confirmation...`);
      
      await contract.deployed();
      
      console.log(`   ✅ ${contractName} deployed to: ${contract.address}`);
      console.log(`   Gas used: ${contract.deployTransaction.gasLimit?.toString() || 'N/A'}`);
      
      // Store deployment info
      this.deployments[contractName] = {
        address: contract.address,
        transactionHash: contract.deployTransaction.hash,
        constructorArgs,
        timestamp: new Date().toISOString(),
        chainId: this.chainId,
        gasUsed: contract.deployTransaction.gasLimit?.toString(),
      };
      
      return contract;
    } catch (error) {
      console.error(`❌ Failed to deploy ${contractName}:`, error.message);
      throw error;
    }
  }

  async verifContract(contractName, address, constructorArgs) {
    if (!DEPLOYMENT_CONFIG.verification.enabled) {
      console.log(`   ⏭️  Verification skipped for ${contractName}`);
      return;
    }

    console.log(`\n🔍 Verifying ${contractName} at ${address}...`);
    
    // Wait before verification
    console.log(`   Waiting ${DEPLOYMENT_CONFIG.verification.delay / 1000}s before verification...`);
    await new Promise(resolve => setTimeout(resolve, DEPLOYMENT_CONFIG.verification.delay));
    
    let attempts = 0;
    while (attempts < DEPLOYMENT_CONFIG.verification.retries) {
      try {
        await hre.run("verify:verify", {
          address,
          constructorArguments: constructorArgs,
        });
        
        console.log(`   ✅ ${contractName} verified successfully`);
        console.log(`   🔗 Explorer: ${this.chainConfig.explorer}/address/${address}#code`);
        
        // Update deployment info with verification status
        if (this.deployments[contractName]) {
          this.deployments[contractName].verified = true;
          this.deployments[contractName].explorerUrl = `${this.chainConfig.explorer}/address/${address}#code`;
        }
        
        return;
      } catch (error) {
        attempts++;
        console.warn(`   ⚠️  Verification attempt ${attempts} failed:`, error.message);
        
        if (attempts < DEPLOYMENT_CONFIG.verification.retries) {
          console.log(`   Retrying in 10 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
      }
    }
    
    console.error(`   ❌ Failed to verify ${contractName} after ${attempts} attempts`);
  }

  async deployAll() {
    console.log("\n🚀 Starting comprehensive contract deployment...");
    
    try {
      // Deploy CRYB Token
      const cryb = DEPLOYMENT_CONFIG.contracts.CRYB;
      const crybContract = await this.deployContract("CRYB", [
        cryb.initialSupply,
        cryb.name,
        cryb.symbol,
        cryb.stakingRewardRate,
        cryb.governanceDelay
      ]);

      // Deploy NFT Collection
      const nft = DEPLOYMENT_CONFIG.contracts.CRYBNFTCollection;
      const nftContract = await this.deployContract("CRYBNFTCollection", [
        nft.name,
        nft.symbol,
        nft.baseURI,
        nft.maxSupply,
        nft.whitelistPrice,
        nft.publicPrice,
        nft.maxMintPerAddress
      ]);

      // Set up contract relationships
      console.log("\n🔗 Setting up contract relationships...");
      
      // Set NFT contract in CRYB token for staking integration
      try {
        const tx = await crybContract.setNFTContract(nftContract.address);
        await tx.wait();
        console.log("   ✅ NFT contract linked to CRYB token");
      } catch (error) {
        console.warn("   ⚠️  Failed to link NFT contract:", error.message);
      }

      // Set CRYB token in NFT contract for staking integration
      try {
        const tx = await nftContract.setCRYBToken(crybContract.address);
        await tx.wait();
        console.log("   ✅ CRYB token linked to NFT contract");
      } catch (error) {
        console.warn("   ⚠️  Failed to link CRYB token:", error.message);
      }

      return {
        crybToken: crybContract,
        nftCollection: nftContract,
      };
    } catch (error) {
      console.error("\n❌ Deployment failed:", error.message);
      throw error;
    }
  }

  async verifyAll() {
    console.log("\n🔍 Starting contract verification...");
    
    for (const [contractName, deployment] of Object.entries(this.deployments)) {
      await this.verifContract(
        contractName,
        deployment.address,
        deployment.constructorArgs
      );
    }
  }

  async saveDeployments() {
    const deploymentFile = path.join(
      this.deploymentDir,
      `${this.chainConfig.name}_${Date.now()}.json`
    );
    
    const deploymentData = {
      chainId: this.chainId,
      chainName: this.chainConfig.name,
      deployer: this.deployer.address,
      timestamp: new Date().toISOString(),
      deployments: this.deployments,
      config: DEPLOYMENT_CONFIG,
    };
    
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentData, null, 2));
    console.log(`\n💾 Deployment data saved to: ${deploymentFile}`);
    
    // Also save latest deployment for easy access
    const latestFile = path.join(this.deploymentDir, `${this.chainConfig.name}_latest.json`);
    fs.writeFileSync(latestFile, JSON.stringify(deploymentData, null, 2));
  }

  async printSummary() {
    console.log("\n📋 DEPLOYMENT SUMMARY");
    console.log("=" .repeat(50));
    console.log(`Chain: ${this.chainConfig.name} (${this.chainId})`);
    console.log(`Deployer: ${this.deployer.address}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log("");
    
    for (const [contractName, deployment] of Object.entries(this.deployments)) {
      console.log(`${contractName}:`);
      console.log(`  Address: ${deployment.address}`);
      console.log(`  Transaction: ${deployment.transactionHash}`);
      console.log(`  Verified: ${deployment.verified ? '✅' : '❌'}`);
      if (deployment.explorerUrl) {
        console.log(`  Explorer: ${deployment.explorerUrl}`);
      }
      console.log("");
    }
    
    console.log("🎉 Deployment completed successfully!");
  }
}

// Main deployment function
async function main() {
  const deployer = new ContractDeployer();
  
  try {
    // Initialize deployment environment
    await deployer.initialize();
    
    // Estimate gas costs
    await deployer.estimateGasCosts();
    
    // Deploy all contracts
    const contracts = await deployer.deployAll();
    
    // Verify contracts
    await deployer.verifyAll();
    
    // Save deployment data
    await deployer.saveDeployments();
    
    // Print summary
    await deployer.printSummary();
    
  } catch (error) {
    console.error("\n💥 Deployment script failed:", error);
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { ContractDeployer, DEPLOYMENT_CONFIG };