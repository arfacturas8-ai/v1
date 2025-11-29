const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const util = require("util");

const execPromise = util.promisify(exec);

/**
 * Automated verification script for all deployed contracts on Sepolia
 * Reads deployment data and verifies each contract on Etherscan
 */

async function main() {
  console.log("🔍 Starting Contract Verification on Sepolia");
  console.log("==========================================");

  // Check for Etherscan API key
  if (!process.env.ETHERSCAN_API_KEY || process.env.ETHERSCAN_API_KEY === "YOUR_ETHERSCAN_API_KEY_HERE") {
    console.error("❌ ETHERSCAN_API_KEY not configured in .env");
    console.error("Get your API key from: https://etherscan.io/myapikey");
    process.exit(1);
  }

  // Read deployment data
  const deploymentPath = path.join(__dirname, "..", "deployments", "sepolia-latest.json");

  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ Deployment file not found:", deploymentPath);
    console.error("Please deploy contracts first using: npx hardhat run scripts/deploy-all-contracts.js --network sepolia");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

  console.log("📄 Found deployment from:", deployment.timestamp);
  console.log("📍 Network:", deployment.network);
  console.log("👛 Deployer:", deployment.deployer);
  console.log("");

  const contracts = deployment.contracts;
  const results = [];

  // Verify each contract
  for (const [name, data] of Object.entries(contracts)) {
    console.log(`\n🔍 Verifying ${name}...`);
    console.log(`   Address: ${data.address}`);

    const args = data.args || [];
    const argsString = args.join(" ");

    const command = `npx hardhat verify --network sepolia ${data.address} ${argsString}`;

    try {
      const { stdout, stderr } = await execPromise(command);

      if (stdout.includes("Successfully verified") || stdout.includes("Already Verified")) {
        console.log(`   ✅ Verified successfully`);
        results.push({ name, success: true, message: "Verified" });
      } else if (stderr.includes("Already Verified")) {
        console.log(`   ✅ Already verified`);
        results.push({ name, success: true, message: "Already verified" });
      } else {
        console.log(`   ⚠️  Verification uncertain`);
        console.log(`   Output: ${stdout}`);
        results.push({ name, success: false, message: stdout || stderr });
      }
    } catch (error) {
      if (error.message.includes("Already Verified") || error.stdout?.includes("Already Verified")) {
        console.log(`   ✅ Already verified`);
        results.push({ name, success: true, message: "Already verified" });
      } else {
        console.log(`   ❌ Verification failed`);
        console.log(`   Error: ${error.message}`);
        results.push({ name, success: false, message: error.message });
      }
    }

    // Wait 2 seconds between verifications to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // Summary
  console.log("\n");
  console.log("==========================================");
  console.log("📊 VERIFICATION SUMMARY");
  console.log("==========================================");

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log("");

  if (failed > 0) {
    console.log("Failed contracts:");
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`   - ${r.name}: ${r.message.substring(0, 100)}...`);
      });
    console.log("");
    console.log("💡 Tip: You can manually verify failed contracts using the commands from the deployment output");
  }

  console.log("==========================================");
  console.log("");
  console.log("🔗 View on Etherscan:");

  for (const [name, data] of Object.entries(contracts)) {
    console.log(`   ${name}: https://sepolia.etherscan.io/address/${data.address}`);
  }

  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
