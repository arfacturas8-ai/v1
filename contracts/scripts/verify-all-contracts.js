const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const util = require("util");

const execPromise = util.promisify(exec);

/**
 * Automated verification script for all deployed contracts
 * Works with individual or consolidated deployment files
 */

async function main() {
  const network = process.argv[2] || "sepolia";

  console.log("============================================");
  console.log(`  CONTRACT VERIFICATION - ${network.toUpperCase()}`);
  console.log("============================================\n");

  // Check for Etherscan API key
  if (!process.env.ETHERSCAN_API_KEY || process.env.ETHERSCAN_API_KEY === "YOUR_ETHERSCAN_API_KEY_HERE") {
    console.error("❌ ETHERSCAN_API_KEY not configured in .env");
    console.error("Get your API key from: https://etherscan.io/myapikey");
    console.log("\n💡 You can still manually verify contracts using the commands shown.");
    console.log("");
  }

  // Try to load consolidated deployment first
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  let deploymentData;

  const consolidatedPath = path.join(deploymentsDir, `${network}-latest.json`);
  if (fs.existsSync(consolidatedPath)) {
    console.log("📄 Loading consolidated deployment data...");
    deploymentData = JSON.parse(fs.readFileSync(consolidatedPath, "utf8"));
  } else {
    console.error("❌ Deployment file not found:", consolidatedPath);
    console.error("Please deploy contracts first using:");
    console.error(`   npm run deploy:${network}`);
    process.exit(1);
  }

  console.log("📍 Network:", deploymentData.network);
  console.log("⛓️  Chain ID:", deploymentData.chainId);
  console.log("👛 Deployer:", deploymentData.deployer);
  console.log("📅 Timestamp:", deploymentData.timestamp);
  console.log("");

  const contracts = deploymentData.contracts;
  const results = [];

  // Verification mapping with proper argument formatting
  const verificationConfigs = [
    {
      name: "CRYBToken",
      getArgs: (data) => data.args,
    },
    {
      name: "Treasury",
      getArgs: (data) => data.args,
    },
    {
      name: "CRYBStaking",
      getArgs: (data) => data.args,
    },
    {
      name: "CRYBGovernance",
      getArgs: (data) => data.args,
    },
    {
      name: "CommunityNFT",
      getArgs: (data) => {
        // Need to quote string arguments
        if (data.args && data.args.length === 4) {
          return [
            `"${data.args[0]}"`, // name
            `"${data.args[1]}"`, // symbol
            `"${data.args[2]}"`, // baseURI
            data.args[3],        // platformWallet
          ];
        }
        return data.args;
      },
    },
    {
      name: "NFTMarketplace",
      getArgs: (data) => data.args,
    },
    {
      name: "TokenGating",
      getArgs: (data) => data.args || [],
    },
    {
      name: "TippingContract",
      getArgs: (data) => data.args,
    },
    {
      name: "Subscription",
      getArgs: (data) => data.args,
    },
  ];

  // Verify each contract
  for (const config of verificationConfigs) {
    const contractData = contracts[config.name];

    if (!contractData) {
      console.log(`⚠️  ${config.name}: Not found in deployment data`);
      results.push({ name: config.name, success: false, message: "Not deployed" });
      continue;
    }

    console.log(`\n🔍 Verifying ${config.name}...`);
    console.log(`   Address: ${contractData.address}`);

    const args = config.getArgs(contractData);
    const argsString = Array.isArray(args) ? args.join(" ") : "";

    const command = `npx hardhat verify --network ${network} ${contractData.address} ${argsString}`;

    console.log(`   Command: ${command.substring(0, 100)}...`);

    try {
      const { stdout, stderr } = await execPromise(command, {
        timeout: 60000, // 60 second timeout per contract
      });

      if (
        stdout.includes("Successfully verified") ||
        stdout.includes("Already Verified") ||
        stderr.includes("Already Verified")
      ) {
        console.log(`   ✅ Verified successfully`);
        results.push({ name: config.name, success: true, message: "Verified" });
      } else {
        console.log(`   ⚠️  Verification uncertain`);
        console.log(`   Output: ${stdout.substring(0, 200)}`);
        results.push({ name: config.name, success: false, message: "Uncertain" });
      }
    } catch (error) {
      const errorMsg = error.message || error.toString();

      if (
        errorMsg.includes("Already Verified") ||
        error.stdout?.includes("Already Verified") ||
        error.stderr?.includes("Already Verified")
      ) {
        console.log(`   ✅ Already verified`);
        results.push({ name: config.name, success: true, message: "Already verified" });
      } else if (errorMsg.includes("does not have bytecode")) {
        console.log(`   ❌ Contract not found on chain - may need to redeploy`);
        results.push({ name: config.name, success: false, message: "Not found on chain" });
      } else {
        console.log(`   ❌ Verification failed`);
        console.log(`   Error: ${errorMsg.substring(0, 200)}`);
        results.push({ name: config.name, success: false, message: errorMsg.substring(0, 100) });
      }
    }

    // Wait 3 seconds between verifications to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  // Summary
  console.log("\n");
  console.log("============================================");
  console.log("  VERIFICATION SUMMARY");
  console.log("============================================\n");

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`✅ Successful: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  console.log("");

  if (failed > 0) {
    console.log("Failed contracts:");
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`   - ${r.name}: ${r.message}`);
      });
    console.log("");
    console.log("💡 Tip: Check Etherscan API key and try again");
    console.log("   Or manually verify using individual deployment files");
  }

  console.log("============================================");
  console.log("");

  // Display Etherscan links
  const explorerBase =
    network === "sepolia"
      ? "https://sepolia.etherscan.io"
      : network === "mainnet"
      ? "https://etherscan.io"
      : `https://${network}.etherscan.io`;

  console.log("🔗 View on Etherscan:");
  for (const [name, data] of Object.entries(contracts)) {
    console.log(`   ${name.padEnd(20)} ${explorerBase}/address/${data.address}`);
  }

  console.log("");
  console.log("============================================\n");

  // Exit with error code if any verifications failed
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
