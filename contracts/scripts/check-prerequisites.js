const { ethers } = require("hardhat");
const chalk = require("chalk");

/**
 * Prerequisites Check Script
 * Verifies all requirements before Sepolia deployment
 */

async function main() {
  console.log("==============================================");
  console.log("  CRYB PLATFORM - DEPLOYMENT PREREQUISITES");
  console.log("==============================================\n");

  let allChecksPassed = true;
  const checks = [];

  // ============================================
  // 1. Environment Variables Check
  // ============================================
  console.log("1. Checking Environment Variables...");

  const requiredEnvVars = [
    { name: "ALCHEMY_API_KEY", required: true },
    { name: "PRIVATE_KEY", required: true },
    { name: "ETHERSCAN_API_KEY", required: false },
  ];

  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar.name];
    const exists = value && value !== "" && value !== `YOUR_${envVar.name}_HERE`;

    if (exists) {
      console.log(`   ✅ ${envVar.name}: Set`);
      checks.push({ check: envVar.name, status: "pass", message: "Set" });
    } else if (envVar.required) {
      console.log(`   ❌ ${envVar.name}: NOT SET (REQUIRED)`);
      checks.push({ check: envVar.name, status: "fail", message: "Not set" });
      allChecksPassed = false;
    } else {
      console.log(`   ⚠️  ${envVar.name}: NOT SET (Optional)`);
      checks.push({ check: envVar.name, status: "warn", message: "Optional - needed for verification" });
    }
  }

  // ============================================
  // 2. Network Connection Check
  // ============================================
  console.log("\n2. Checking Network Connection...");

  try {
    const provider = new ethers.JsonRpcProvider(
      process.env.SEPOLIA_RPC_URL ||
      `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
    );

    const network = await provider.getNetwork();
    console.log(`   ✅ Connected to Sepolia (Chain ID: ${network.chainId})`);
    checks.push({ check: "Network Connection", status: "pass", message: `Chain ID: ${network.chainId}` });

    // Check current block
    const blockNumber = await provider.getBlockNumber();
    console.log(`   ✅ Current Block: ${blockNumber}`);

    // Check gas price
    const feeData = await provider.getFeeData();
    const gasPriceGwei = ethers.formatUnits(feeData.gasPrice || 0n, "gwei");
    console.log(`   ✅ Current Gas Price: ${gasPriceGwei} Gwei`);
    checks.push({ check: "Gas Price", status: "pass", message: `${gasPriceGwei} Gwei` });

  } catch (error) {
    console.log(`   ❌ Network connection failed: ${error.message}`);
    checks.push({ check: "Network Connection", status: "fail", message: error.message });
    allChecksPassed = false;
  }

  // ============================================
  // 3. Wallet Check
  // ============================================
  console.log("\n3. Checking Deployer Wallet...");

  if (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== "YOUR_PRIVATE_KEY_HERE") {
    try {
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
      console.log(`   ✅ Wallet Address: ${wallet.address}`);
      checks.push({ check: "Wallet Address", status: "pass", message: wallet.address });

      // Check balance
      try {
        const provider = new ethers.JsonRpcProvider(
          process.env.SEPOLIA_RPC_URL ||
          `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
        );

        const balance = await provider.getBalance(wallet.address);
        const balanceEth = ethers.formatEther(balance);
        console.log(`   ✅ Balance: ${balanceEth} ETH`);

        // Check if balance is sufficient
        const minimumRequired = 0.5; // Estimate 0.5 ETH for all deployments
        if (parseFloat(balanceEth) >= minimumRequired) {
          console.log(`   ✅ Balance sufficient for deployment (≥ ${minimumRequired} ETH)`);
          checks.push({ check: "Wallet Balance", status: "pass", message: `${balanceEth} ETH` });
        } else if (parseFloat(balanceEth) > 0) {
          console.log(`   ⚠️  Balance low: ${balanceEth} ETH (Recommended: ≥ ${minimumRequired} ETH)`);
          checks.push({ check: "Wallet Balance", status: "warn", message: `Only ${balanceEth} ETH` });
        } else {
          console.log(`   ❌ No ETH balance - deployment will fail`);
          checks.push({ check: "Wallet Balance", status: "fail", message: "0 ETH" });
          allChecksPassed = false;
        }

      } catch (error) {
        console.log(`   ⚠️  Could not check balance: ${error.message}`);
        checks.push({ check: "Wallet Balance", status: "warn", message: "Could not check" });
      }

    } catch (error) {
      console.log(`   ❌ Invalid private key format`);
      checks.push({ check: "Wallet", status: "fail", message: "Invalid private key" });
      allChecksPassed = false;
    }
  } else {
    console.log(`   ❌ Private key not configured`);
    checks.push({ check: "Wallet", status: "fail", message: "Not configured" });
    allChecksPassed = false;
  }

  // ============================================
  // 4. Contracts Compilation Check
  // ============================================
  console.log("\n4. Checking Contracts Compilation...");

  const fs = require("fs");
  const path = require("path");

  const requiredContracts = [
    "CRYBToken",
    "Treasury",
    "CRYBStaking",
    "CRYBGovernance",
    "CommunityNFT",
    "NFTMarketplace",
    "TokenGating",
    "TippingContract",
    "Subscription"
  ];

  let compiledCount = 0;
  for (const contract of requiredContracts) {
    const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", `${contract}.sol`, `${contract}.json`);

    // Check alternative paths
    const altPaths = [
      path.join(__dirname, "..", "artifacts", "contracts", `${contract}.sol`, `${contract}.json`),
      path.join(__dirname, "..", "artifacts", "contracts", `CRYB${contract}.sol`, `CRYB${contract}.json`),
      path.join(__dirname, "..", "artifacts", "contracts", `${contract}Contract.sol`, `${contract}Contract.json`),
    ];

    let found = false;
    for (const checkPath of altPaths) {
      if (fs.existsSync(checkPath)) {
        console.log(`   ✅ ${contract}: Compiled`);
        compiledCount++;
        found = true;
        break;
      }
    }

    if (!found) {
      console.log(`   ❌ ${contract}: Not compiled`);
    }
  }

  if (compiledCount === requiredContracts.length) {
    console.log(`   ✅ All ${requiredContracts.length} contracts compiled`);
    checks.push({ check: "Contracts Compilation", status: "pass", message: `${compiledCount}/${requiredContracts.length}` });
  } else {
    console.log(`   ⚠️  Only ${compiledCount}/${requiredContracts.length} contracts compiled`);
    console.log(`   💡 Run: npx hardhat compile`);
    checks.push({ check: "Contracts Compilation", status: "warn", message: `${compiledCount}/${requiredContracts.length}` });
  }

  // ============================================
  // 5. Gas Estimation
  // ============================================
  console.log("\n5. Estimating Deployment Costs...");

  // Rough estimates based on contract complexity
  const contractGasEstimates = {
    "CRYBToken": 1500000,
    "Treasury": 2500000,
    "CRYBStaking": 3000000,
    "CRYBGovernance": 3500000,
    "CommunityNFT": 3000000,
    "NFTMarketplace": 4000000,
    "TokenGating": 2000000,
    "TippingContract": 2500000,
    "Subscription": 3000000,
  };

  const totalGasEstimate = Object.values(contractGasEstimates).reduce((a, b) => a + b, 0);

  try {
    const provider = new ethers.JsonRpcProvider(
      process.env.SEPOLIA_RPC_URL ||
      `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
    );

    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice || 0n;
    const gasPriceGwei = ethers.formatUnits(gasPrice, "gwei");

    const estimatedCost = (totalGasEstimate * Number(gasPrice)) / 1e18;
    const estimatedCostWithBuffer = estimatedCost * 1.5; // 50% buffer

    console.log(`   📊 Total Gas Estimate: ${totalGasEstimate.toLocaleString()} gas`);
    console.log(`   ⛽ Current Gas Price: ${gasPriceGwei} Gwei`);
    console.log(`   💰 Estimated Cost: ${estimatedCost.toFixed(4)} ETH`);
    console.log(`   💰 With 50% buffer: ${estimatedCostWithBuffer.toFixed(4)} ETH`);

    checks.push({
      check: "Gas Estimation",
      status: "pass",
      message: `~${estimatedCostWithBuffer.toFixed(4)} ETH`
    });

  } catch (error) {
    console.log(`   ⚠️  Could not estimate gas costs: ${error.message}`);
    console.log(`   💡 Estimated: 0.3-0.8 ETH depending on gas prices`);
  }

  // ============================================
  // Summary
  // ============================================
  console.log("\n==============================================");
  console.log("  PREREQUISITES SUMMARY");
  console.log("==============================================\n");

  const passed = checks.filter(c => c.status === "pass").length;
  const failed = checks.filter(c => c.status === "fail").length;
  const warnings = checks.filter(c => c.status === "warn").length;

  console.log(`✅ Passed:   ${passed}`);
  console.log(`❌ Failed:   ${failed}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log("");

  if (allChecksPassed) {
    console.log("🎉 ALL CHECKS PASSED!");
    console.log("✅ Ready to deploy to Sepolia testnet");
    console.log("\n📝 Next steps:");
    console.log("   1. Run: npm run deploy:sepolia");
    console.log("   2. Wait for deployment to complete");
    console.log("   3. Run: npm run verify:sepolia");
    console.log("");
  } else {
    console.log("❌ PREREQUISITES NOT MET");
    console.log("\n📝 Required actions:");
    console.log("");

    if (!process.env.ALCHEMY_API_KEY || process.env.ALCHEMY_API_KEY === "YOUR_ALCHEMY_API_KEY_HERE") {
      console.log("   1. Get Alchemy API key:");
      console.log("      - Visit: https://www.alchemy.com/");
      console.log("      - Create account and app");
      console.log("      - Copy API key to .env file");
      console.log("");
    }

    if (!process.env.PRIVATE_KEY || process.env.PRIVATE_KEY === "YOUR_PRIVATE_KEY_HERE") {
      console.log("   2. Configure wallet private key:");
      console.log("      - Export from MetaMask: Account Details > Export Private Key");
      console.log("      - Add to .env file (DO NOT COMMIT)");
      console.log("");
    }

    const failedBalance = checks.find(c => c.check === "Wallet Balance" && c.status === "fail");
    if (failedBalance) {
      console.log("   3. Get Sepolia testnet ETH:");
      console.log("      - Faucet 1: https://sepoliafaucet.com/");
      console.log("      - Faucet 2: https://www.alchemy.com/faucets/ethereum-sepolia");
      console.log("      - Faucet 3: https://sepolia-faucet.pk910.de/");
      console.log("      - Recommended: 0.5+ ETH for deployment");
      console.log("");
    }

    if (!process.env.ETHERSCAN_API_KEY || process.env.ETHERSCAN_API_KEY === "YOUR_ETHERSCAN_API_KEY_HERE") {
      console.log("   4. Get Etherscan API key (for verification):");
      console.log("      - Visit: https://etherscan.io/myapikey");
      console.log("      - Create account and API key");
      console.log("      - Add to .env file");
      console.log("");
    }
  }

  console.log("==============================================\n");

  return allChecksPassed ? 0 : 1;
}

// Execute
if (require.main === module) {
  main()
    .then((exitCode) => process.exit(exitCode))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main };
