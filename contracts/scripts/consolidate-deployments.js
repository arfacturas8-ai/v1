const fs = require("fs");
const path = require("path");

/**
 * Consolidates individual deployment files into a single master file
 */

async function main() {
  const network = process.argv[2] || "sepolia";
  const deploymentsDir = path.join(__dirname, "..", "deployments");

  console.log(`Consolidating ${network} deployments...`);

  const contracts = [
    { file: `${network}-1-token.json`, name: "CRYBToken" },
    { file: `${network}-2-treasury.json`, name: "Treasury" },
    { file: `${network}-3-staking.json`, name: "CRYBStaking" },
    { file: `${network}-4-governance.json`, name: "CRYBGovernance" },
    { file: `${network}-5-nft.json`, name: "CommunityNFT" },
    { file: `${network}-6-marketplace.json`, name: "NFTMarketplace" },
    { file: `${network}-7-tokengating.json`, name: "TokenGating" },
    { file: `${network}-8-tipping.json`, name: "TippingContract" },
    { file: `${network}-9-subscription.json`, name: "Subscription" },
  ];

  const consolidated = {
    network: network,
    timestamp: new Date().toISOString(),
    contracts: {},
  };

  for (const contract of contracts) {
    const filepath = path.join(deploymentsDir, contract.file);

    if (fs.existsSync(filepath)) {
      const data = JSON.parse(fs.readFileSync(filepath, "utf8"));
      consolidated.contracts[contract.name] = {
        address: data.address,
        args: data.constructorArgs,
        config: data.config || {},
      };

      // Copy chainId and deployer from first contract
      if (!consolidated.chainId) {
        consolidated.chainId = data.chainId;
        consolidated.deployer = data.deployer;
      }
    } else {
      console.warn(`⚠️  Warning: ${contract.file} not found`);
    }
  }

  // Save consolidated file
  const timestamp = Date.now();
  const consolidatedFile = path.join(deploymentsDir, `${network}-${timestamp}.json`);
  fs.writeFileSync(consolidatedFile, JSON.stringify(consolidated, null, 2));

  // Also save as latest
  const latestFile = path.join(deploymentsDir, `${network}-latest.json`);
  fs.writeFileSync(latestFile, JSON.stringify(consolidated, null, 2));

  console.log("✅ Consolidated deployment saved:");
  console.log(`   ${consolidatedFile}`);
  console.log(`   ${latestFile}`);

  // Display summary
  console.log("\n📊 Deployment Summary:");
  console.log("========================");
  for (const [name, data] of Object.entries(consolidated.contracts)) {
    console.log(`${name.padEnd(20)} ${data.address}`);
  }
  console.log("========================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
